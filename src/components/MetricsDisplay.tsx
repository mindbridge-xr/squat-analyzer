import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface SquatMetrics {
  kneeAngle: number;
  hipAngle: number;
  squatDepth: number;
  kneeAlignment: number;
  backStraightness: number;
}

interface MetricsDisplayProps {
  metrics: SquatMetrics | null;
  squatCount: number;
  currentPhase: 'standing' | 'descending' | 'bottom' | 'ascending';
}

export const MetricsDisplay: React.FC<MetricsDisplayProps> = ({ 
  metrics, 
  squatCount, 
  currentPhase 
}) => {
  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (score >= 60) return <Minus className="w-4 h-4 text-yellow-600" />;
    return <TrendingDown className="w-4 h-4 text-red-600" />;
  };

  const calculateFormScore = (metrics: SquatMetrics): number => {
    // Ideal ranges for squat form
    const idealKneeAngle = 90; // degrees
    const maxKneeAlignment = 0.1; // normalized distance
    const maxBackStraightness = 0.1; // normalized distance

    let score = 100;

    // Knee angle score (closer to 90 degrees is better)
    const kneeAngleDeviation = Math.abs(metrics.kneeAngle - idealKneeAngle);
    score -= Math.min(kneeAngleDeviation * 0.5, 30);

    // Knee alignment score (less deviation is better)
    score -= Math.min(metrics.kneeAlignment * 200, 25);

    // Back straightness score (straighter is better)
    score -= Math.min(metrics.backStraightness * 200, 25);

    // Squat depth bonus (deeper squats get bonus points)
    if (metrics.squatDepth > 0.15) {
      score += 10;
    }

    return Math.max(0, Math.round(score));
  };

  const getPhaseColor = (phase: string): string => {
    switch (phase) {
      case 'descending': return 'text-blue-600';
      case 'bottom': return 'text-purple-600';
      case 'ascending': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getPhaseIcon = (phase: string): string => {
    switch (phase) {
      case 'descending': return '↓';
      case 'bottom': return '⏸';
      case 'ascending': return '↑';
      default: return '⏹';
    }
  };

  if (!metrics) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Form Analysis</h3>
        <p className="text-gray-500">Stand in front of the camera to begin analysis</p>
      </div>
    );
  }

  const formScore = calculateFormScore(metrics);

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">Form Analysis</h3>
        <div className="flex items-center space-x-2">
          {getScoreIcon(formScore)}
          <span className={`text-2xl font-bold ${getScoreColor(formScore)}`}>
            {formScore}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-50 p-3 rounded">
          <div className="text-sm text-gray-600">Squat Count</div>
          <div className="text-xl font-bold text-blue-600">{squatCount}</div>
        </div>
        <div className="bg-gray-50 p-3 rounded">
          <div className="text-sm text-gray-600">Phase</div>
          <div className={`text-lg font-semibold ${getPhaseColor(currentPhase)}`}>
            {getPhaseIcon(currentPhase)} {currentPhase}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Knee Angle</span>
          <span className="font-medium">{Math.round(metrics.kneeAngle)}°</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Hip Angle</span>
          <span className="font-medium">{Math.round(metrics.hipAngle)}°</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Squat Depth</span>
          <span className="font-medium">{(metrics.squatDepth * 100).toFixed(1)}%</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Knee Alignment</span>
          <span className={`font-medium ${metrics.kneeAlignment < 0.1 ? 'text-green-600' : 'text-red-600'}`}>
            {metrics.kneeAlignment < 0.1 ? 'Good' : 'Needs Work'}
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Back Position</span>
          <span className={`font-medium ${metrics.backStraightness < 0.1 ? 'text-green-600' : 'text-red-600'}`}>
            {metrics.backStraightness < 0.1 ? 'Straight' : 'Leaning'}
          </span>
        </div>
      </div>

      {formScore < 70 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
          <h4 className="text-sm font-medium text-yellow-800 mb-1">Form Tips:</h4>
          <ul className="text-xs text-yellow-700 space-y-1">
            {metrics.kneeAngle < 80 && <li>• Go deeper - aim for 90° knee angle</li>}
            {metrics.kneeAngle > 100 && <li>• Don't go too deep - maintain control</li>}
            {metrics.kneeAlignment > 0.1 && <li>• Keep knees aligned over toes</li>}
            {metrics.backStraightness > 0.1 && <li>• Keep your back straight and chest up</li>}
          </ul>
        </div>
      )}
    </div>
  );
};