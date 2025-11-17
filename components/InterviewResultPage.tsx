/**
 * 면접 결과 페이지 컴포넌트
 */
'use client';

import React from 'react';
import InterviewTurnCard from './InterviewTurnCard';

interface InterviewResultPageProps {
  session: {
    id: number;
    startedAt: string;
    completedAt: string;
    finalFeedback: {
      overall_feedback: string;
      per_turn_feedback: Array<{
        turn_number: number;
        question: string;
        answer: string;
        feedback: string;
      }>;
    };
  };
  turns: Array<{
    turn_number: number;
    question_text: string;
    user_answer_text: string;
    user_answer_audio_s3_url: string;
  }>;
}

export default function InterviewResultPage({ session, turns }: InterviewResultPageProps) {
  const { finalFeedback } = session;

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto p-8">
        <h1 className="text-4xl font-bold mb-8">면접 결과</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Overall Feedback (Sticky) */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              <div className="p-6 bg-gray-900 rounded-lg border border-gray-800">
                <h2 className="text-xl font-bold mb-4">종합 평가</h2>

                {/* 종합 피드백 */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-400 uppercase mb-3">종합 피드백</h3>
                  <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                    {finalFeedback.overall_feedback}
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => (window.location.href = '/')}
                  className="flex-1 px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  홈으로
                </button>
                <button
                  onClick={() => window.print()}
                  className="flex-1 px-4 py-3 bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
                >
                  결과 출력
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - Per Turn Feedback (Scrollable) */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-2xl font-bold mb-4">질문별 상세 피드백</h2>

            {turns.map((turn) => {
              const turnFeedback = finalFeedback.per_turn_feedback.find(
                (f) => f.turn_number === turn.turn_number
              );

              return (
                <InterviewTurnCard
                  key={turn.turn_number}
                  turnNumber={turn.turn_number}
                  questionText={turn.question_text}
                  userAnswerText={turn.user_answer_text}
                  userAnswerAudioUrl={turn.user_answer_audio_s3_url}
                  turnFeedbackText={turnFeedback?.feedback}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

