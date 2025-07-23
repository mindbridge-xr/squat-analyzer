import React, { useRef, useState } from 'react';
import { Upload, X, Play } from 'lucide-react';

interface VideoUploadProps {
  onVideoSelect: (video: HTMLVideoElement) => void;
  onVideoRemove: () => void;
  isAnalyzing: boolean;
}

export const VideoUpload: React.FC<VideoUploadProps> = ({ 
  onVideoSelect, 
  onVideoRemove, 
  isAnalyzing 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
      
      // Create video element and pass to parent
      if (videoRef.current) {
        videoRef.current.src = url;
        videoRef.current.onloadedmetadata = () => {
          if (videoRef.current) {
            onVideoSelect(videoRef.current);
          }
        };
      }
    }
  };

  const handleRemoveVideo = () => {
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
    }
    setSelectedFile(null);
    setVideoUrl(null);
    onVideoRemove();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        onChange={handleFileSelect}
        className="hidden"
      />
      
      {!selectedFile ? (
        <div 
          onClick={triggerFileSelect}
          className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center cursor-pointer hover:border-green-500 hover:bg-green-50 transition-all duration-300"
        >
          <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <p className="text-lg font-semibold text-slate-600 mb-2">
            Upload Video for Analysis
          </p>
          <p className="text-sm text-slate-500">
            Click to select MP4, MOV, AVI, or other video files
          </p>
        </div>
      ) : (
        <div className="sports-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Play className="w-6 h-6 text-green-600" />
              <div>
                <p className="font-semibold text-slate-800">{selectedFile.name}</p>
                <p className="text-sm text-slate-500">
                  {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB
                </p>
              </div>
            </div>
            <button
              onClick={handleRemoveVideo}
              disabled={isAnalyzing}
              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {videoUrl && (
            <video
              ref={videoRef}
              src={videoUrl}
              className="w-full rounded-lg shadow-lg"
              controls
              preload="metadata"
            />
          )}
        </div>
      )}
    </div>
  );
};