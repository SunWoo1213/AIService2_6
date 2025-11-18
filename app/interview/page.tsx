/**
 * 면접 시작 페이지
 */
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import InterviewPage from '@/components/InterviewPage';
import { apiClient } from '@/lib/api-client';

export default function InterviewStartPage() {
  const router = useRouter();
  const [isStarted, setIsStarted] = useState(false);
  const [sessionData, setSessionData] = useState<any>(null);
  const [coverLetterId, setCoverLetterId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleStart = async () => {
    if (!coverLetterId) {
      setError('자기소개서 ID를 입력해주세요.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const result = await apiClient.startInterview(parseInt(coverLetterId));
      setSessionData(result);
      setIsStarted(true);
    } catch (err: any) {
      setError(err.message || '면접 시작에 실패했습니다.');
      console.error('면접 시작 에러:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInterviewComplete = (sessionId: number) => {
    router.push(`/interview/result/${sessionId}`);
  };

  if (isStarted && sessionData) {
    return (
      <InterviewPage
        sessionId={sessionData.sessionId}
        initialQuestionText={sessionData.questionText}
        initialQuestionAudioUrl={sessionData.questionAudioUrl}
        onInterviewComplete={handleInterviewComplete}
      />
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-2xl mx-auto px-8 py-16">
        <div className="mb-8">
          <button
            onClick={() => router.push('/')}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ← 홈으로 돌아가기
          </button>
        </div>

        <div className="text-center mb-12">
          <div className="text-6xl mb-4">🎤</div>
          <h1 className="text-4xl font-bold mb-4">AI 모의 면접</h1>
          <p className="text-xl text-gray-400">
            실전처럼 AI 면접관과 음성으로 면접을 진행하세요
          </p>
        </div>

        <div className="p-8 bg-gray-900 rounded-lg border border-gray-800">
          <h2 className="text-2xl font-bold mb-6">면접 시작하기</h2>

          {error && (
            <div className="mb-6 p-4 bg-red-900/20 border border-red-500 rounded-lg">
              <p className="text-red-400">{error}</p>
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              자기소개서 ID
            </label>
            <input
              type="number"
              value={coverLetterId}
              onChange={(e) => setCoverLetterId(e.target.value)}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-primary-500 transition-colors"
              placeholder="예: 1"
              required
            />
            <p className="mt-2 text-sm text-gray-400">
              작성한 자기소개서의 ID를 입력하세요
            </p>
          </div>

          <button
            onClick={handleStart}
            disabled={isLoading || !coverLetterId}
            className="w-full px-6 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg transition-colors font-semibold"
          >
            {isLoading ? '면접 준비 중...' : '면접 시작'}
          </button>

          <div className="mt-8 p-4 bg-gray-800 rounded-lg">
            <h3 className="font-bold mb-2">📌 안내사항</h3>
            <ul className="text-sm text-gray-400 space-y-1">
              <li>• 총 5개의 질문이 진행됩니다.</li>
              <li>• 각 질문당 60초의 답변 시간이 주어집니다.</li>
              <li>• 마이크 권한을 허용해주세요.</li>
              <li>• 조용한 환경에서 진행하는 것을 권장합니다.</li>
            </ul>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              아직 자기소개서를 작성하지 않으셨나요?{' '}
              <button
                onClick={() => router.push('/cover-letters')}
                className="text-primary-500 hover:text-primary-400 font-semibold"
              >
                자소서 작성하기
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}






