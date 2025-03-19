# Flex AI: Real-Time Squat Form Analyzer

A computer vision project that analyzes squat form in real-time using MediaPipe and OpenCV. Provides scores, audio feedback, and progress tracking.

## Features
- Real-time squat analysis via webcam or video file
- Scoring based on knee position and squat depth
- Audio feedback for form correction
- Progress visualization over time

## Installation
1. Clone this repository: `git clone <repo-url>`
2. Install dependencies: `pip install -r requirements.txt`
3. Ensure a webcam is connected or provide a video file (see Usage).

## Usage
- For webcam: `python squat_analyzer.py --input webcam`
- For video: `python squat_analyzer.py --input video --video_path path/to/your/video.mp4`

**Note**: If using video mode, replace `squats_video2.mp4` with your own video file or update the `--video_path` argument.

## About Me
3rd-year B.Tech (CSE) student at Manipal University, Jaipur | Vice Chairman, IEEE GRSS | Passionate about Data Analytics, RL, and ML | Backend & Frontend Developer | Upcoming Intern at NUS, Singapore (May 2025)

## License
MIT License - see [LICENSE](LICENSE) for details.