import React, { useState, useEffect, useCallback } from 'react';

interface SquatMetrics {
  kneeAngle: number;
  hipAngle: number;
  squatDepth: number;
  kneeAlignment: number;
  backStraightness: number;
}

interface SquatCounterProps {
  metrics: SquatMetrics | null;
  onSquatComplete: (count: number) => void;
  onPhaseChange: (phase: 'standing' | 'descending' | 'bottom' | 'ascending') => void;
}

export const SquatCounter: React.FC<SquatCounterProps> = ({ 
  metrics, 
  onSquatComplete, 
  onPhaseChange 
}) => {
  const [squatCount, setSquatCount] = useState(0);
  const [currentPhase, setCurrentPhase] = useState<'standing' | 'descending' | 'bottom' | 'ascending'>('standing');
  const [previousKneeAngle, setPreviousKneeAngle] = useState<number | null>(null);
  const [bottomReached, setBottomReached] = useState(false);

  useEffect(() => {
    if (!metrics || !metrics.kneeAngle) return;

    const kneeAngle = metrics.kneeAngle;
    const squatDepth = metrics.squatDepth;

    // Define thresholds
    const STANDING_THRESHOLD = 160; // degrees
    const BOTTOM_THRESHOLD = 100; // degrees
    const DEPTH_THRESHOLD = 0.12; // normalized depth

    let newPhase = currentPhase;

    // Determine current phase based on knee angle and depth
    if (kneeAngle > STANDING_THRESHOLD) {
      // Standing position
      if (currentPhase === 'ascending' && bottomReached) {
        // Complete squat cycle
        setSquatCount(prev => {
          const newCount = prev + 1;
          onSquatComplete(newCount);
          return newCount;
        });
        setBottomReached(false);
      }
      newPhase = 'standing';
    } else if (kneeAngle < BOTTOM_THRESHOLD && squatDepth > DEPTH_THRESHOLD) {
      // Bottom position
      newPhase = 'bottom';
      setBottomReached(true);
    } else if (previousKneeAngle !== null) {
      // Determine if descending or ascending based on angle change
      if (kneeAngle < previousKneeAngle && currentPhase !== 'ascending') {
        // Descending
        newPhase = 'descending';
      } else if (kneeAngle > previousKneeAngle && bottomReached && currentPhase !== 'standing') {
        // Ascending
        newPhase = 'ascending';
      }
    }

    // Only call onPhaseChange if phase actually changed
    if (newPhase !== currentPhase) {
      setCurrentPhase(newPhase);
      onPhaseChange(newPhase);
    }

    setPreviousKneeAngle(kneeAngle);
  }, [metrics, currentPhase, previousKneeAngle, bottomReached, onPhaseChange, onSquatComplete]);

  return null; // This component only manages state, no rendering
};