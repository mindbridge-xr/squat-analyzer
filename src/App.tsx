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
    if (isAnalyzing) {
      setPoseResults(results);
    }
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

  const handleVideoSelect = useCallback((video: HTMLVideoElement) => {
    setSelectedVideo(video);
    setInputMode('video');
  }, []);

  const handleVideoRemove = useCallback(() => {
    setSelectedVideo(null);
    setInputMode('webcam');
    setIsAnalyzing(false);
  }, []);

  const handleModeSwitch = (mode: 'webcam' | 'video') => {
    setInputMode(mode);
    setIsAnalyzing(false);
    if (mode === 'webcam') {
      setSelectedVideo(null);
    }
  };

  const resetCounter = () => {
    setSquatCount(0);
    setCurrentPhase('standing');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-5xl sports-heading mb-4">
            Squat Form Analyzer
          </h1>
          <p className="text-xl text-slate-600 mb-8 font-medium">
            🏋️ Real-time squat form analysis using AI pose detection
          </p>
          
          {/* Input Mode Selection */}
          <div className="flex items-center justify-center space-x-4 mb-6">
            <button
              onClick={() => handleModeSwitch('webcam')}
              className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-bold transition-all duration-300 ${
                inputMode === 'webcam' 
                  ? 'btn-sports-primary' 
                  : 'btn-sports-secondary'
              }`}
            >
              <CameraIcon className="w-5 h-5" />
              <span>Webcam</span>
            </button>
            
            <button
              onClick={() => handleModeSwitch('video')}
              className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-bold transition-all duration-300 ${
                inputMode === 'video' 
                  ? 'btn-sports-primary' 
                  : 'btn-sports-secondary'
              }`}
            >
              <Video className="w-5 h-5" />
              <span>Upload Video</span>
            </button>
          </div>
          
          <div className="flex items-center justify-center space-x-4">
            <button
              onClick={() => setIsAnalyzing(!isAnalyzing)}
             disabled={inputMode === 'video' && !selectedVideo}
              className={`flex items-center space-x-3 px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 ${
               isAnalyzing 
                  ? 'btn-sports-danger' 
                 : (inputMode === 'video' && !selectedVideo) 
                   ? 'btn-sports-secondary opacity-50 cursor-not-allowed'
                   : 'btn-sports-primary'
              }`}
            >
              {isAnalyzing ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
             <span>
               {isAnalyzing 
                 ? 'Stop Analysis' 
                 : inputMode === 'video' && !selectedVideo
                   ? 'Select Video First'
                   : 'Start Analysis'
               }
             </span>
            </button>
            
            <button
              onClick={resetCounter}
              className="flex items-center space-x-3 px-6 py-4 btn-sports-secondary rounded-xl font-bold text-lg"
            >
              <RotateCcw className="w-6 h-6" />
              <span>Reset Count</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Camera Feed */}
          <div className="lg:col-span-2">
            {inputMode === 'video' && !selectedVideo ? (
              <div className="sports-card p-6">
                <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center">
                  🎥 Video Analysis Mode
                </h2>
                <VideoUpload 
                  onVideoSelect={handleVideoSelect}
                  onVideoRemove={handleVideoRemove}
                  isAnalyzing={isAnalyzing}
                />
              </div>
            ) : (
              <div className="sports-card p-6">
                <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center">
                  {inputMode === 'webcam' ? '📹 Live Motion Tracking' : '🎥 Video Motion Tracking'}
                </h2>
                <Camera 
                  onPoseResults={handlePoseResults}
                  isAnalyzing={isAnalyzing}
                  videoElement={selectedVideo}
                  inputMode={inputMode}
                />
                {inputMode === 'video' && selectedVideo && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm font-medium text-blue-800 mb-2">
                      💡 Video Analysis Tips:
                    </p>
                    <ul className="text-xs text-blue-700 space-y-1">
                      <li>• Use the video controls to play, pause, and seek</li>
                      <li>• Analysis works in real-time as the video plays</li>
                      <li>• Best results with clear, full-body footage</li>
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Metrics Panel */}
          <div className="space-y-6">
            <MetricsDisplay 
              metrics={metrics}
              squatCount={squatCount}
              currentPhase={currentPhase}
            />
            
            {isAnalyzing && (
              <div className="sports-card p-6">
                <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
                  💡 Workout Tips
                </h3>
                <ul className="text-sm text-slate-700 space-y-3 font-medium">
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                    {inputMode === 'webcam' ? 'Stand facing the camera' : 'Ensure person faces the camera in video'}
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                    Keep your full body in frame
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                    {inputMode === 'webcam' ? 'Perform controlled movements' : 'Video should show controlled movements'}
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                    Focus on proper form
                  </li>
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
          onSquatComplete={handleSquatComplete}
          onPhaseChange={handlePhaseChange}
        />
      </div>
    </div>
  );
}

export default App;