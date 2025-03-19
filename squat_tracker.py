import cv2
import mediapipe as mp
import numpy as np
import time
import pyttsx3
import json
import os
import matplotlib.pyplot as plt
import argparse

os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'


class SquatAnalyzer:
    """A class to analyze squat form in real-time using MediaPipe and OpenCV."""

    def __init__(self, input_source='webcam', video_path='squats_video2.mp4'):
        """Initialize the analyzer with input source and configuration."""
        self.mp_pose = mp.solutions.pose
        self.pose = self.mp_pose.Pose(
            static_image_mode=False,
            min_detection_confidence=0.7,
            min_tracking_confidence=0.7
        )
        self.mp_drawing = mp.solutions.drawing_utils
        self.engine = pyttsx3.init()
        self.args = argparse.Namespace(input=input_source, video_path=video_path)

        # Load configuration
        self.config = self._load_config()
        self.knee_toe_threshold = self.config['knee_toe_threshold']
        self.penalty_factor = self.config['penalty_factor']
        self.depth_penalty = self.config['depth_penalty']
        self.feedback_cooldown = self.config['feedback_cooldown']

        # Set up input source
        self.cap = self._setup_input(input_source, video_path)
        if not self.cap.isOpened():
            raise ValueError("Could not open input source. Check your camera or video file.")

        self.score_history = []
        self.frame_count = 0
        self.good_frames = 0
        self.knee_toe_issues = 0
        self.depth_issues = 0
        self.last_feedback_frame = 0
        self.squat_phase = "invalid"
        self.last_deep = False

    def _load_config(self):
        """Load configuration from a JSON file, with fallback to defaults if invalid."""
        config_path = 'config.json'
        default_config = {
            'knee_toe_threshold': 100,
            'penalty_factor': 0.1,
            'depth_penalty': 20,
            'feedback_cooldown': 120
        }
        try:
            if os.path.exists(config_path):
                with open(config_path, 'r') as f:
                    return json.load(f)
        except json.JSONDecodeError:
            print("Invalid config.json, using default config.")
        with open(config_path, 'w') as f:
            json.dump(default_config, f, indent=4)
        return default_config

    def _setup_input(self, input_source, video_path):
        """Set up the video capture source based on input type."""
        if input_source == 'video':
            return cv2.VideoCapture(video_path)
        return cv2.VideoCapture(0)  # Default webcam

    def calculate_knee_toe_distance(self, knee, ankle):
        """Calculate Euclidean distance between knee and ankle."""
        return np.sqrt((knee[0] - ankle[0])**2 + (knee[1] - ankle[1])**2)

    def is_squat_depth(self, hip_y, knee_y):
        """Check if squat is deep by comparing hip to knee height."""
        return hip_y >= knee_y

    def is_valid_squat_pose(self, landmarks, landmarks_px, height, width):
        """Check if all required landmarks are detected, visible, and within frame."""
        required_landmarks = [
            self.mp_pose.PoseLandmark.LEFT_SHOULDER,
            self.mp_pose.PoseLandmark.RIGHT_SHOULDER,
            self.mp_pose.PoseLandmark.LEFT_HIP,
            self.mp_pose.PoseLandmark.RIGHT_HIP,
            self.mp_pose.PoseLandmark.LEFT_KNEE,
            self.mp_pose.PoseLandmark.RIGHT_KNEE,
            self.mp_pose.PoseLandmark.LEFT_ANKLE,
            self.mp_pose.PoseLandmark.RIGHT_ANKLE
        ]

        # Check visibility of landmarks
        for i in required_landmarks:
            lm = landmarks[i.value]
            if lm.visibility < 0.5:
                print(f"Low visibility for landmark {i}: {lm.visibility}")
                return False

        # Check if landmarks are within frame boundaries
        for i in required_landmarks:
            x, y = landmarks_px[i.value]
            if not (0 <= x <= width and 0 <= y <= height):
                print(f"Landmark {i} out of frame: x={x}, y={y}, width={width}, height={height}")
                return False

        # Spatial validation: hips below shoulders, knees below hips
        left_shoulder_y = landmarks_px[self.mp_pose.PoseLandmark.LEFT_SHOULDER.value][1]
        right_shoulder_y = landmarks_px[self.mp_pose.PoseLandmark.RIGHT_SHOULDER.value][1]
        left_hip_y = landmarks_px[self.mp_pose.PoseLandmark.LEFT_HIP.value][1]
        right_hip_y = landmarks_px[self.mp_pose.PoseLandmark.RIGHT_HIP.value][1]
        left_knee_y = landmarks_px[self.mp_pose.PoseLandmark.LEFT_KNEE.value][1]
        right_knee_y = landmarks_px[self.mp_pose.PoseLandmark.RIGHT_KNEE.value][1]

        avg_shoulder_y = (left_shoulder_y + right_shoulder_y) / 2
        avg_hip_y = (left_hip_y + right_hip_y) / 2
        avg_knee_y = (left_knee_y + right_knee_y) / 2

        if avg_hip_y <= avg_shoulder_y or avg_knee_y <= avg_hip_y:
            print("Invalid pose spatial alignment:", {"shoulder_y": avg_shoulder_y, "hip_y": avg_hip_y, "knee_y": avg_knee_y})
            return False

        return True

    def calculate_score(self, knee_toe_left_dist, knee_toe_right_dist, depth_valid):
        """Calculate score based on knee position and depth."""
        knee_toe_penalty = max(0, (max(knee_toe_left_dist, knee_toe_right_dist) - self.knee_toe_threshold) * self.penalty_factor)
        depth_penalty = self.depth_penalty if not depth_valid else 0
        total_penalty = knee_toe_penalty + depth_penalty
        return max(50, 100 - total_penalty)

    def give_feedback(self, score, knee_toe_left, knee_toe_right, depth_valid, phase):
        """Provide audio feedback at the top phase for valid squat poses."""
        if self.frame_count - self.last_feedback_frame < self.feedback_cooldown or phase != "top":
            return
        if score < 60:
            if max(knee_toe_left, knee_toe_right) > self.knee_toe_threshold:
                self.engine.say("Pull your knees back in line!")
            elif not depth_valid:
                self.engine.say("Go deeper next time!")
            else:
                self.engine.say("Improve your form!")
        else:
            self.engine.say("Good squat! Keep it up!")
        self.engine.runAndWait()
        self.last_feedback_frame = self.frame_count

    def save_progress(self, date):
        """Save progress to a JSON file."""
        progress_file = "progress.json"
        data = {}
        if os.path.exists(progress_file):
            with open(progress_file, 'r') as f:
                data = json.load(f)
        data[date] = {
            "score": np.mean(self.score_history) if self.score_history else 0,
            "good_frame_ratio": (self.good_frames / self.frame_count * 100) if self.frame_count > 0 else 0,
            "knee_toe_issues": self.knee_toe_issues,
            "depth_issues": self.depth_issues
        }
        with open(progress_file, 'w') as f:
            json.dump(data, f, indent=4)

    def plot_progress(self):
        """Plot progress over time."""
        progress_file = "progress.json"
        if not os.path.exists(progress_file):
            print("No progress data to plot.")
            return
        with open(progress_file, 'r') as f:
            data = json.load(f)
        dates = list(data.keys())
        scores = [data[date]["score"] for date in dates]
        plt.figure(figsize=(10, 5))
        plt.plot(dates, scores, marker='o', linestyle='-', color='b')
        plt.title("Squat Form Progress Over Time")
        plt.xlabel("Date")
        plt.ylabel("Average Score (%)")
        plt.grid(True)
        plt.xticks(rotation=45)
        plt.tight_layout()
        plt.show()

    def run(self):
        """Run the squat analysis loop."""
        while True:
            ret, frame = self.cap.read()
            if not ret:
                print("Video processing completed or video ended.")
                break

            height, width, _ = frame.shape
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = self.pose.process(rgb_frame)

            if results.pose_landmarks:
                self.mp_drawing.draw_landmarks(frame, results.pose_landmarks, self.mp_pose.POSE_CONNECTIONS)

                landmarks = results.pose_landmarks.landmark
                landmarks_px = [(int(lm.x * width), int(lm.y * height)) for lm in landmarks]

                if not self.is_valid_squat_pose(landmarks, landmarks_px, height, width):
                    frame[:] = (50, 50, 50)  # Dark gray background
                    cv2.putText(frame, "Full body not detected. Adjust camera or stand up.",
                                (10, height // 2), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
                    self.squat_phase = "invalid"
                    cv2.imshow('Flex AI - Squat Analysis', frame)
                    if cv2.waitKey(1) & 0xFF == ord('q'):
                        break
                    continue

                left_shoulder = landmarks_px[self.mp_pose.PoseLandmark.LEFT_SHOULDER.value]
                right_shoulder = landmarks_px[self.mp_pose.PoseLandmark.RIGHT_SHOULDER.value]
                left_hip = landmarks_px[self.mp_pose.PoseLandmark.LEFT_HIP.value]
                right_hip = landmarks_px[self.mp_pose.PoseLandmark.RIGHT_HIP.value]
                left_knee = landmarks_px[self.mp_pose.PoseLandmark.LEFT_KNEE.value]
                right_knee = landmarks_px[self.mp_pose.PoseLandmark.RIGHT_KNEE.value]
                left_ankle = landmarks_px[self.mp_pose.PoseLandmark.LEFT_ANKLE.value]
                right_ankle = landmarks_px[self.mp_pose.PoseLandmark.RIGHT_ANKLE.value]

                knee_toe_left_dist = self.calculate_knee_toe_distance(left_knee, left_ankle)
                knee_toe_right_dist = self.calculate_knee_toe_distance(right_knee, right_ankle)

                avg_hip_y = (left_hip[1] + right_hip[1]) / 2
                avg_knee_y = (left_knee[1] + right_knee[1]) / 2
                is_deep = self.is_squat_depth(avg_hip_y, avg_knee_y)

                if is_deep and not self.last_deep:
                    self.squat_phase = "descent"
                elif is_deep and self.last_deep:
                    self.squat_phase = "bottom"
                elif not is_deep and self.last_deep:
                    self.squat_phase = "ascent"
                elif not is_deep and not self.last_deep:
                    self.squat_phase = "top"
                self.last_deep = is_deep

                score = self.calculate_score(knee_toe_left_dist, knee_toe_right_dist, is_deep)
                self.score_history.append(score)
                self.frame_count += 1

                if knee_toe_left_dist > self.knee_toe_threshold or knee_toe_right_dist > self.knee_toe_threshold:
                    self.knee_toe_issues += 1
                if not is_deep:
                    self.depth_issues += 1

                smoothed_score = np.mean(self.score_history[-90:]) if len(self.score_history) >= 90 else np.mean(self.score_history) if self.score_history else score

                if knee_toe_left_dist <= self.knee_toe_threshold:
                    cv2.circle(frame, left_knee, 10, (0, 255, 0), 2)
                else:
                    cv2.circle(frame, left_knee, 10, (0, 0, 255), 2)

                if knee_toe_right_dist <= self.knee_toe_threshold:
                    cv2.circle(frame, right_knee, 10, (0, 255, 0), 2)
                else:
                    cv2.circle(frame, right_knee, 10, (0, 0, 255), 2)

                feedback_color = (0, 0, 255) if smoothed_score < 60 else (0, 255, 0)
                if smoothed_score < 60:
                    feedback = "Issue: "
                    if knee_toe_left_dist > self.knee_toe_threshold or knee_toe_right_dist > self.knee_toe_threshold:
                        feedback += "Knees too far forward"
                    elif not is_deep:
                        feedback += "Depth issue"
                    else:
                        feedback += "Unknown issue"
                else:
                    feedback = "Good form"

                is_good_frame = smoothed_score >= 60
                if is_good_frame:
                    self.good_frames += 1

                cv2.putText(frame, f"Score: {smoothed_score:.0f}%", (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
                cv2.putText(frame, f"Feedback: {feedback}", (10, 60), cv2.FONT_HERSHEY_SIMPLEX, 0.7, feedback_color, 2)
                cv2.putText(frame, f"Frame: {self.frame_count}", (10, 90), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
                cv2.putText(frame, f"Phase: {self.squat_phase}", (10, 120), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)

                if self.frame_count - self.last_feedback_frame >= self.feedback_cooldown and self.squat_phase == "top":
                    self.give_feedback(smoothed_score, knee_toe_left_dist, knee_toe_right_dist, is_deep, self.squat_phase)

            else:
                frame[:] = (50, 50, 50)  # Dark gray background
                cv2.putText(frame, "No pose detected. Adjust camera or stand up.",
                            (10, height // 2), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)

            cv2.imshow('Flex AI - Squat Analysis', frame)

            if cv2.waitKey(1) & 0xFF == ord('q'):
                break

        self.save_progress(time.strftime('%Y-%m-%d %H:%M:%S'))
        self.plot_progress()
        print(f"\nFinal Score: {np.mean(self.score_history):.0f}%")
        print(f"Good Frames: {self.good_frames}/{self.frame_count} ({(self.good_frames / self.frame_count * 100):.1f}%)")
        print(f"Knee-Toe Issues: {self.knee_toe_issues}")
        print(f"Depth Issues: {self.depth_issues}")
        print(f"Analysis completed on {time.strftime('%Y-%m-%d %H:%M:%S')}")

        self.cap.release()
        cv2.destroyAllWindows()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Flex AI Squat Analysis")
    parser.add_argument('--input', type=str, default='webcam', choices=['video', 'webcam'],
                        help="Input source: 'video' for file or 'webcam' for live feed")
    parser.add_argument('--video_path', type=str, default='squats_video2.mp4',
                        help="Path to video file if using video input")
    args = parser.parse_args()

    analyzer = SquatAnalyzer(args.input, args.video_path)
    try:
        analyzer.run()
    except Exception as e:
        print(f"An error occurred: {e}")