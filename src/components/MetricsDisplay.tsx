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
    if (score >= 80) return 'metric-good';
    if (score >= 60) return 'metric-warning';
    return 'metric-danger';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <TrendingUp className="w-5 h-5 text-green-600" />;
    if (score >= 60) return <Minus className="w-5 h-5 text-yellow-500" />;
    return <TrendingDown className="w-5 h-5 text-red-600" />;
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
      case 'descending': return 'phase-descending';
      case 'bottom': return 'phase-bottom';
      case 'ascending': return 'phase-ascending';
      default: return 'phase-standing';
    }
  };

  const getPhaseIcon = (phase: string): string => {
    switch (phase) {
      case 'descending': return '⬇️';
      case 'bottom': return '⏸️';
      case 'ascending': return '⬆️';
      default: return '⏹️';
    }
  };

  if (!metrics) {
    return (
      <div className="sports-card p-6">
        <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
          📊 Form Analysis
        </h3>
        <div className="text-center py-8">
          <div className="text-6xl mb-4">🏃‍♂️</div>
          <p className="text-slate-500 font-medium">Stand in front of the camera to begin analysis</p>
        </div>
      </div>
    );
  }

  const formScore = calculateFormScore(metrics);

  return (
    <div className="sports-card p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-slate-800 flex items-center">
          📊 Form Analysis
        </h3>
        <div className="flex items-center space-x-3">
          {getScoreIcon(formScore)}
          <span className={`text-3xl font-black ${getScoreColor(formScore)}`}>
            {formScore}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
          <div className="text-sm font-semibold text-slate-600 mb-1">🏋️ Squat Count</div>
          <div className="text-2xl font-black text-blue-600">{squatCount}</div>
        </div>
        <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-4 rounded-xl border border-slate-200">
          <div className="text-sm font-semibold text-slate-600 mb-1">⚡ Phase</div>
          <div className={`text-lg font-bold ${getPhaseColor(currentPhase)} capitalize`}>
            {getPhaseIcon(currentPhase)} {currentPhase}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
          <span className="text-sm font-semibold text-slate-700">🦵 Knee Angle</span>
          <span className="font-bold text-lg text-slate-800">{Math.round(metrics.kneeAngle)}°</span>
        </div>
        
        <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
          <span className="text-sm font-semibold text-slate-700">🍑 Hip Angle</span>
          <span className="font-bold text-lg text-slate-800">{Math.round(metrics.hipAngle)}°</span>
        </div>
        
        <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
          <span className="text-sm font-semibold text-slate-700">📏 Squat Depth</span>
          <span className="font-bold text-lg text-slate-800">{(metrics.squatDepth * 100).toFixed(1)}%</span>
        </div>
        
        <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
          <span className="text-sm font-semibold text-slate-700">🎯 Knee Alignment</span>
          <span className={`font-bold text-lg ${metrics.kneeAlignment < 0.1 ? 'metric-good' : 'metric-danger'}`}>
            {metrics.kneeAlignment < 0.1 ? '✅ Good' : '⚠️ Needs Work'}
          </span>
        </div>
        
        <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
          <span className="text-sm font-semibold text-slate-700">🏃 Back Position</span>
          <span className={`font-bold text-lg ${metrics.backStraightness < 0.1 ? 'metric-good' : 'metric-danger'}`}>
            {metrics.backStraightness < 0.1 ? '✅ Straight' : '⚠️ Leaning'}
          </span>
        </div>
      </div>

      {formScore < 70 && (
        <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border-2 border-orange-200 rounded-xl p-4">
          <h4 className="text-lg font-bold text-orange-800 mb-3 flex items-center">
            💪 Form Tips:
          </h4>
          <ul className="text-sm font-medium text-orange-700 space-y-2">
            {metrics.kneeAngle < 80 && (
              <li className="flex items-center">
                <span className="text-orange-500 mr-2">🔽</span>
                Go deeper - aim for 90° knee angle
              </li>
            )}
            {metrics.kneeAngle > 100 && (
              <li className="flex items-center">
                <span className="text-orange-500 mr-2">🔼</span>
                Don't go too deep - maintain control
              </li>
            )}
            {metrics.kneeAlignment > 0.1 && (
              <li className="flex items-center">
                <span className="text-orange-500 mr-2">🎯</span>
                Keep knees aligned over toes
              </li>
            )}
            {metrics.backStraightness > 0.1 && (
              <li className="flex items-center">
                <span className="text-orange-500 mr-2">📐</span>
                Keep your back straight and chest up
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};