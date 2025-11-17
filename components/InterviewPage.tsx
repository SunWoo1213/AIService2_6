/**
 * 면접 진행 페이지 컴포넌트
 */
'use client';

import React, { useState, useRef, useEffect } from 'react';
import CountdownTimer from './CountdownTimer';
import AudioVisualizer from './AudioVisualizer';
import AudioPlayer from './AudioPlayer';

interface InterviewPageProps {
  sessionId: number;
  initialQuestionText: string;
  initialQuestionAudioUrl: string;
  onInterviewComplete: (sessionId: number) => void;
}

export default function InterviewPage({
  sessionId,
  initialQuestionText,
  initialQuestionAudioUrl,
  onInterviewComplete,
}: InterviewPageProps) {
  const [questionText, setQuestionText] = useState(initialQuestionText);
  const [questionAudioUrl, setQuestionAudioUrl] = useState(initialQuestionAudioUrl);
  const [turnNumber, setTurnNumber] = useState(1);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [questionAudioPlaying, setQuestionAudioPlaying] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const handleQuestionAudioEnded = () => {
    setQuestionAudioPlaying(false);
    startRecording();
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await submitAnswer(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('녹음 시작 실패:', error);
      alert('마이크 접근 권한이 필요합니다.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleCountdownComplete = () => {
    stopRecording();
  };

  const submitAnswer = async (audioBlob: Blob) => {
    setIsProcessing(true);

    try {
      const formData = new FormData();
      formData.append('sessionId', sessionId.toString());
      formData.append('turnNumber', turnNumber.toString());
      formData.append('audio', audioBlob, `answer_${turnNumber}.webm`);

      const token = localStorage.getItem('token');

      const response = await fetch('/api/interview/answer', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (data.isCompleted) {
        onInterviewComplete(sessionId);
      } else {
        setQuestionText(data.questionText);
        setQuestionAudioUrl(data.questionAudioUrl);
        setTurnNumber(data.turnNumber);
        setQuestionAudioPlaying(true);
      }
    } catch (error) {
      console.error('답변 제출 실패:', error);
      alert('답변 제출에 실패했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEndInterview = () => {
    if (confirm('면접을 종료하시겠습니까?')) {
      // 세션 취소 API 호출 등
      window.location.href = '/';
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-800 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold">AI 모의 면접</h1>
          <button
            onClick={handleEndInterview}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
          >
            면접 종료
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="max-w-4xl w-full space-y-8">
          {/* 진행 상태 */}
          <div className="text-center">
            <span className="text-gray-400">질문 {turnNumber} / 5</span>
          </div>

          {/* 질문 영역 */}
          <div className="p-8 bg-gray-900 rounded-2xl border-2 border-gray-800 min-h-[200px] flex items-center justify-center">
            <p className="text-2xl text-center leading-relaxed">{questionText}</p>
          </div>

          {/* 오디오 플레이어 (질문 음성) */}
          {!isProcessing && (
            <div>
              <AudioPlayer
                audioUrl={questionAudioUrl}
                onEnded={handleQuestionAudioEnded}
                autoPlay={questionAudioPlaying}
              />
            </div>
          )}

          {/* 녹음 상태 */}
          <div className="flex flex-col items-center gap-6">
            <CountdownTimer duration={60} isActive={isRecording} onComplete={handleCountdownComplete} />
            <AudioVisualizer isRecording={isRecording} />
          </div>

          {/* 처리 중 표시 */}
          {isProcessing && (
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500" />
              <p className="mt-4 text-gray-400">AI가 답변을 분석하고 다음 질문을 준비 중입니다...</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

