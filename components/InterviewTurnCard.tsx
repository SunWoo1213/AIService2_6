/**
 * 면접 질문/답변 카드 컴포넌트 (Accordion)
 */
'use client';

import React, { useState } from 'react';
import AudioPlayer from './AudioPlayer';

interface InterviewTurnCardProps {
  turnNumber: number;
  questionText: string;
  userAnswerText: string;
  userAnswerAudioUrl: string;
  turnFeedbackText?: string;
}

export default function InterviewTurnCard({
  turnNumber,
  questionText,
  userAnswerText,
  userAnswerAudioUrl,
  turnFeedbackText,
}: InterviewTurnCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="border border-gray-800 rounded-lg overflow-hidden bg-gray-900">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-800 transition-colors"
      >
        <div className="flex items-center gap-4">
          <span className="text-2xl font-bold text-primary-500">Q{turnNumber}</span>
          <span className="text-left text-gray-300 line-clamp-1">{questionText}</span>
        </div>
        <div className="flex items-center gap-3">
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {isExpanded && (
        <div className="px-6 py-4 space-y-4 border-t border-gray-800">
          <div>
            <h4 className="text-sm font-semibold text-gray-400 uppercase mb-2">질문</h4>
            <p className="text-gray-300">{questionText}</p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-400 uppercase mb-2">내 답변 (텍스트)</h4>
            <p className="text-gray-300 whitespace-pre-wrap">{userAnswerText}</p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-400 uppercase mb-2">내 답변 (음성)</h4>
            <AudioPlayer audioUrl={userAnswerAudioUrl} />
          </div>

          {turnFeedbackText && (
            <div>
              <h4 className="text-sm font-semibold text-gray-400 uppercase mb-2">AI 피드백</h4>
              <div className="p-4 bg-primary-500/10 border border-primary-500/30 rounded-lg">
                <p className="text-gray-300 whitespace-pre-wrap">{turnFeedbackText}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

