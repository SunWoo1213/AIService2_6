/**
 * 채용 공고 분석 결과 컴포넌트
 */
'use client';

import React from 'react';

interface JobPostingAnalysisProps {
  analysisJson: {
    keywords?: string[];
    must_have?: string[];
    nice_to_have?: string[];
    summary?: string;
    position?: string;
    company?: string;
  };
}

export default function JobPostingAnalysis({ analysisJson }: JobPostingAnalysisProps) {
  const { keywords = [], must_have = [], nice_to_have = [], summary, position, company } = analysisJson;

  return (
    <div className="space-y-6 p-6 bg-gray-900 rounded-lg border border-gray-800">
      <div>
        <h2 className="text-2xl font-bold mb-2">{position || '직무명'}</h2>
        <p className="text-gray-400">{company || '회사명'}</p>
      </div>

      {summary && (
        <div>
          <h3 className="text-sm font-semibold text-gray-400 uppercase mb-2">요약</h3>
          <p className="text-gray-300">{summary}</p>
        </div>
      )}

      <div>
        <h3 className="text-sm font-semibold text-gray-400 uppercase mb-3">핵심 키워드</h3>
        <div className="flex flex-wrap gap-2">
          {keywords.map((keyword, index) => (
            <span
              key={index}
              className="px-3 py-1 text-sm bg-primary-500/20 text-primary-400 border border-primary-500/30 rounded-full"
            >
              {keyword}
            </span>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-400 uppercase mb-3">필수 요건</h3>
        <ul className="space-y-2">
          {must_have.map((item, index) => (
            <li key={index} className="flex items-start gap-2">
              <span className="text-red-400 mt-1">●</span>
              <span className="text-gray-300">{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-400 uppercase mb-3">우대 사항</h3>
        <ul className="space-y-2">
          {nice_to_have.map((item, index) => (
            <li key={index} className="flex items-start gap-2">
              <span className="text-green-400 mt-1">○</span>
              <span className="text-gray-300">{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

