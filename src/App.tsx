import React, { useState, useCallback } from 'react';
import { Camera } from './components/Camera';
import { SquatAnalyzer } from './components/SquatAnalyzer';
import { MetricsDisplay } from './components/MetricsDisplay';
import { SquatCounter } from './components/SquatCounter';
import { Play, Pause, RotateCcw } from 'lucide-react';

interface SquatMetrics {
  kneeAngle: number;
  hipAngle: number;
  squatDepth: number;
  kneeAlignment: number;
  backStraightness: number;
}

function App() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [poseResults, setPoseResults] = useState<any>(null);
  const [metrics, setMetrics] = useState<SquatMetrics | null>(null);
  const [squatCount, setSquatCount] = useState(0);
  const [currentPhase, setCurrentPhase] = useState<'standing' | 'descending' | 'bottom' | 'ascending'>('standing');

  const handlePoseResults = useCallback((results: any) => {
    setPoseResults(results);
  }, []);

  const handleMetricsUpdate = useCallback((newMetrics: SquatMetrics) => {
    setMetrics(newMetrics);
  }, []);

  const handleSquatComplete = useCallback((count: number) => {
    setSquatCount(count);
  }, []);

  const handlePhaseChange = useCallback((phase: 'standing' | 'descending' | 'bottom' | 'ascending') => {
    setCurrentPhase(phase);
  }, []);

  const resetCounter = () => {
    setSquatCount(0);
    setCurrentPhase('standing');
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Squat Form Analyzer
          </h1>
          <p className="text-gray-600 mb-6">
            Real-time squat form analysis using AI pose detection
          </p>
          
          <div className="flex items-center justify-center space-x-4">
            <button
              onClick={() => setIsAnalyzing(!isAnalyzing)}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                isAnalyzing 
                  ? 'bg-red-600 hover:bg-red-700 text-white' 
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {isAnalyzing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              <span>{isAnalyzing ? 'Stop Analysis' : 'Start Analysis'}</span>
            </button>
            
            <button
              onClick={resetCounter}
              className="flex items-center space-x-2 px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
            >
              <RotateCcw className="w-5 h-5" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Camera Feed */}
          <div className="lg:col-span-2">
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Camera Feed</h2>
              <Camera 
                onPoseResults={handlePoseResults}
                isAnalyzing={isAnalyzing}
              />
            </div>
          </div>

          {/* Metrics Panel */}
          <div className="space-y-6">
            <MetricsDisplay 
              metrics={metrics}
              squatCount={squatCount}
              currentPhase={currentPhase}
            />
            
            {isAnalyzing && (
              <div className="bg-white p-4 rounded-lg shadow-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Instructions</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Stand facing the camera</li>
                  <li>• Keep your full body in frame</li>
                  <li>• Perform squats with controlled movement</li>
                  <li>• Maintain proper form for accurate analysis</li>
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Hidden Components for Analysis */}
        <SquatAnalyzer 
          landmarks={poseResults?.poseLandmarks || null}
          onMetricsUpdate={handleMetricsUpdate}
        />
        <SquatCounter 
          metrics={metrics}
          currentPhase={currentPhase}
          onSquatComplete={handleSquatComplete}
          onPhaseChange={handlePhaseChange}
        />
      </div>
    </div>
  );
}

export default App;