/**
 * 오디오 비주얼라이저 컴포넌트 (녹음 중 펄스 애니메이션)
 */
'use client';

import React from 'react';

interface AudioVisualizerProps {
  isRecording: boolean;
}

export default function AudioVisualizer({ isRecording }: AudioVisualizerProps) {
  return (
    <div className="flex items-center justify-center gap-2">
      {isRecording && (
        <>
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="w-2 bg-red-500 rounded-full animate-pulse"
              style={{
                height: `${Math.random() * 40 + 20}px`,
                animationDelay: `${i * 0.1}s`,
                animationDuration: '0.8s',
              }}
            />
          ))}
        </>
      )}
      <div className="flex items-center gap-2">
        <div
          className={`w-4 h-4 rounded-full ${
            isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-500'
          }`}
        />
        <span className={`text-sm font-medium ${isRecording ? 'text-red-500' : 'text-gray-400'}`}>
          {isRecording ? '녹음 중...' : '대기 중'}
        </span>
      </div>
    </div>
  );
}

