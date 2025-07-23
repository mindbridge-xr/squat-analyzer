import React from 'react';

interface Landmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

interface SquatMetrics {
  kneeAngle: number;
  hipAngle: number;
  squatDepth: number;
  kneeAlignment: number;
  backStraightness: number;
}

interface SquatAnalyzerProps {
  landmarks: Landmark[] | null;
  onMetricsUpdate: (metrics: SquatMetrics) => void;
}

export const SquatAnalyzer: React.FC<SquatAnalyzerProps> = ({ landmarks, onMetricsUpdate }) => {
  const calculateAngle = (a: Landmark, b: Landmark, c: Landmark): number => {
    const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
    let angle = Math.abs(radians * 180.0 / Math.PI);
    if (angle > 180.0) {
      angle = 360 - angle;
    }
    return angle;
  };

  const calculateDistance = (a: Landmark, b: Landmark): number => {
    return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
  };

  const analyzeSquat = (landmarks: Landmark[]): SquatMetrics => {
    // MediaPipe pose landmark indices
    const LEFT_HIP = 23;
    const LEFT_KNEE = 25;
    const LEFT_ANKLE = 27;
    const RIGHT_HIP = 24;
    const RIGHT_KNEE = 26;
    const RIGHT_ANKLE = 28;
    const LEFT_SHOULDER = 11;
    const RIGHT_SHOULDER = 12;

    // Calculate knee angles (both legs)
    const leftKneeAngle = calculateAngle(
      landmarks[LEFT_HIP],
      landmarks[LEFT_KNEE],
      landmarks[LEFT_ANKLE]
    );
    const rightKneeAngle = calculateAngle(
      landmarks[RIGHT_HIP],
      landmarks[RIGHT_KNEE],
      landmarks[RIGHT_ANKLE]
    );
    const kneeAngle = (leftKneeAngle + rightKneeAngle) / 2;

    // Calculate hip angles
    const leftHipAngle = calculateAngle(
      landmarks[LEFT_SHOULDER],
      landmarks[LEFT_HIP],
      landmarks[LEFT_KNEE]
    );
    const rightHipAngle = calculateAngle(
      landmarks[RIGHT_SHOULDER],
      landmarks[RIGHT_HIP],
      landmarks[RIGHT_KNEE]
    );
    const hipAngle = (leftHipAngle + rightHipAngle) / 2;

    // Calculate squat depth (hip to knee vertical distance)
    const leftHipKneeDistance = Math.abs(landmarks[LEFT_HIP].y - landmarks[LEFT_KNEE].y);
    const rightHipKneeDistance = Math.abs(landmarks[RIGHT_HIP].y - landmarks[RIGHT_KNEE].y);
    const squatDepth = (leftHipKneeDistance + rightHipKneeDistance) / 2;

    // Calculate knee alignment (knees should track over toes)
    const leftKneeAlignment = Math.abs(landmarks[LEFT_KNEE].x - landmarks[LEFT_ANKLE].x);
    const rightKneeAlignment = Math.abs(landmarks[RIGHT_KNEE].x - landmarks[RIGHT_ANKLE].x);
    const kneeAlignment = (leftKneeAlignment + rightKneeAlignment) / 2;

    // Calculate back straightness (shoulder to hip alignment)
    const shoulderMidpoint = {
      x: (landmarks[LEFT_SHOULDER].x + landmarks[RIGHT_SHOULDER].x) / 2,
      y: (landmarks[LEFT_SHOULDER].y + landmarks[RIGHT_SHOULDER].y) / 2,
      z: (landmarks[LEFT_SHOULDER].z + landmarks[RIGHT_SHOULDER].z) / 2
    };
    const hipMidpoint = {
      x: (landmarks[LEFT_HIP].x + landmarks[RIGHT_HIP].x) / 2,
      y: (landmarks[LEFT_HIP].y + landmarks[RIGHT_HIP].y) / 2,
      z: (landmarks[LEFT_HIP].z + landmarks[RIGHT_HIP].z) / 2
    };
    const backStraightness = Math.abs(shoulderMidpoint.x - hipMidpoint.x);

    return {
      kneeAngle,
      hipAngle,
      squatDepth,
      kneeAlignment,
      backStraightness
    };
  };

  React.useEffect(() => {
    if (landmarks && landmarks.length > 0) {
      console.log('Analyzing landmarks:', landmarks.length);
      const metrics = analyzeSquat(landmarks);
      console.log('Calculated metrics:', metrics);
      onMetricsUpdate(metrics);
    }
  }, [landmarks, onMetricsUpdate]);

  return null; // This component only performs analysis, no rendering
};