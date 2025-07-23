import React, { useRef, useEffect, useState } from 'react';
import { Pose } from '@mediapipe/pose';
import { Camera as CameraUtils } from '@mediapipe/camera_utils';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import { POSE_CONNECTIONS } from '@mediapipe/pose';

interface CameraProps {
  onPoseResults: (results: any) => void;
  isAnalyzing: boolean;
  videoElement?: HTMLVideoElement | null;
  inputMode: 'webcam' | 'video';
}

export const Camera: React.FC<CameraProps> = ({ onPoseResults, isAnalyzing }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const poseRef = useRef<Pose | null>(null);
  const cameraRef = useRef<CameraUtils | null>(null);

  useEffect(() => {
    const initializeCamera = async () => {
      try {
        if (!videoRef.current || !canvasRef.current) return;

        // Initialize MediaPipe Pose
        const pose = new Pose({
          locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/${file}`;
          }
        });

        pose.setOptions({
          modelComplexity: 1,
          smoothLandmarks: true,
          enableSegmentation: false,
          smoothSegmentation: true,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5
        });

        pose.onResults((results) => {
          if (!canvasRef.current) return;
          
          const canvasCtx = canvasRef.current.getContext('2d');
          if (!canvasCtx) return;

          canvasCtx.save();
          canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          canvasCtx.drawImage(results.image, 0, 0, canvasRef.current.width, canvasRef.current.height);

          if (results.poseLandmarks) {
            drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS, {
              color: '#2E8B57',
              lineWidth: 3
            });
            drawLandmarks(canvasCtx, results.poseLandmarks, {
              color: '#32CD32',
              lineWidth: 2,
              radius: 3
            });
          }
          canvasCtx.restore();

          if (results.poseLandmarks) {
            onPoseResults(results);
          }
              // Draw pose connections with sports green color
        });

        poseRef.current = pose;

        // Initialize camera
        const camera = new CameraUtils(videoRef.current, {
          onFrame: async () => {
            if (poseRef.current && videoRef.current) {
              await poseRef.current.send({ image: videoRef.current });
            }
          },
          width: 640,
          height: 480
        });

        cameraRef.current = camera;
        await camera.start();
        setIsLoading(false);

      } catch (err) {
        console.error('Camera initialization error:', err);
        setError('Failed to access camera. Please ensure camera permissions are granted.');
        setIsLoading(false);
      }
    };

    // Function to draw joint angle overlays
    const drawJointAngles = (ctx: CanvasRenderingContext2D, landmarks: any[]) => {
      const joints = [
        { name: 'L_KNEE', index: 25, angle: calculateKneeAngle(landmarks, 'left') },
        { name: 'R_KNEE', index: 26, angle: calculateKneeAngle(landmarks, 'right') },
        { name: 'L_HIP', index: 23, angle: calculateHipAngle(landmarks, 'left') },
        { name: 'R_HIP', index: 24, angle: calculateHipAngle(landmarks, 'right') }
      ];

      joints.forEach(joint => {
        if (landmarks[joint.index] && joint.angle) {
          const x = landmarks[joint.index].x * ctx.canvas.width;
          const y = landmarks[joint.index].y * ctx.canvas.height;
          
          // Draw semi-transparent circle
          ctx.beginPath();
          ctx.arc(x, y, 25, 0, 2 * Math.PI);
          ctx.fillStyle = 'rgba(46, 139, 87, 0.7)';
          ctx.fill();
          ctx.strokeStyle = '#32CD32';
          ctx.lineWidth = 2;
          ctx.stroke();
          
          // Draw angle text
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.fillRect(x - 20, y - 8, 40, 16);
          ctx.fillStyle = '#1F2937';
          ctx.font = 'bold 12px Inter';
          ctx.textAlign = 'center';
          ctx.fillText(`${Math.round(joint.angle)}°`, x, y + 4);
        }
      });
    };

    const calculateKneeAngle = (landmarks: any[], side: 'left' | 'right') => {
      const hipIndex = side === 'left' ? 23 : 24;
      const kneeIndex = side === 'left' ? 25 : 26;
      const ankleIndex = side === 'left' ? 27 : 28;
      
      if (landmarks[hipIndex] && landmarks[kneeIndex] && landmarks[ankleIndex]) {
        return calculateAngle(landmarks[hipIndex], landmarks[kneeIndex], landmarks[ankleIndex]);
      }
      return null;
    };

    const calculateHipAngle = (landmarks: any[], side: 'left' | 'right') => {
      const shoulderIndex = side === 'left' ? 11 : 12;
      const hipIndex = side === 'left' ? 23 : 24;
      const kneeIndex = side === 'left' ? 25 : 26;
      
      if (landmarks[shoulderIndex] && landmarks[hipIndex] && landmarks[kneeIndex]) {
        return calculateAngle(landmarks[shoulderIndex], landmarks[hipIndex], landmarks[kneeIndex]);
      }
      return null;
    };

    const calculateAngle = (a: any, b: any, c: any) => {
      const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
      let angle = Math.abs(radians * 180.0 / Math.PI);
      if (angle > 180.0) {
        angle = 360 - angle;
      }
      return angle;
    };

    initializeCamera();

    return () => {
      if (cameraRef.current) {
        cameraRef.current.stop();
      }
      if (poseRef.current) {
        poseRef.current.close();
      }
    };
  }, []);

  // Handle pose results based on analysis state
  useEffect(() => {
    // This effect handles the analysis state change
  }, [isAnalyzing, onPoseResults]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-96 bg-gradient-to-br from-red-50 to-red-100 rounded-xl border-2 border-red-200">
        <div className="text-center">
          <div className="text-6xl mb-4">📷</div>
          <p className="text-red-600 mb-4 font-semibold">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="btn-sports-primary px-6 py-3"
          >
            🔄 Retry Camera
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-600 border-t-transparent mx-auto mb-4"></div>
            <p className="text-slate-700 font-semibold">
              🚀 Initializing AI Motion Tracking for {inputMode === 'webcam' ? 'Webcam' : 'Video'}...
            </p>
          </div>
        </div>
      )}
      {inputMode === 'webcam' && (
        <video
          ref={videoRef}
          className="hidden"
          playsInline
        />
      )}
      <canvas
        ref={canvasRef}
        width={640}
        height={480}
        className="w-full max-w-2xl rounded-xl shadow-2xl border-4 border-slate-200"
      />
    </div>
  );
};