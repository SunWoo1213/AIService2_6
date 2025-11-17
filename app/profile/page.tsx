/**
 * 프로필 설정 페이지 (인증 필요)
 */
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';

export default function ProfilePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // 프로필 데이터
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [career, setCareer] = useState<Array<{ company: string; position: string; period: string }>>([]);
  const [education, setEducation] = useState<Array<{ school: string; major: string; degree: string; graduation_year: number }>>([]);
  const [certificates, setCertificates] = useState<Array<{ name: string; issued_date: string }>>([]);
  const [skills, setSkills] = useState<string[]>([]);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const result = await apiClient.getProfile();
      const profile = result.profile;

      setAge(profile.age || '');
      setGender(profile.gender || '');
      setCareer(profile.career_json || []);
      setEducation(profile.education_json || []);
      setCertificates(profile.certificates_json || []);
      setSkills(profile.skills_json || []);
    } catch (err: any) {
      console.error('프로필 로드 실패:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      await apiClient.updateProfile({
        age: age ? parseInt(age) : null,
        gender: gender || null,
        career_json: career,
        education_json: education,
        certificates_json: certificates,
        skills_json: skills,
      });

      setSuccess('프로필이 저장되었습니다!');
    } catch (err: any) {
      setError(err.message || '저장에 실패했습니다.');
      console.error('프로필 저장 실패:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-primary-500 mb-4" />
          <p className="text-gray-400">프로필 로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-8 py-16">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">내 프로필</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
          >
            로그아웃
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-900/20 border border-red-500 rounded-lg">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-900/20 border border-green-500 rounded-lg">
            <p className="text-green-400">{success}</p>
          </div>
        )}

        <div className="space-y-8">
          {/* 기본 정보 */}
          <div className="p-6 bg-gray-900 rounded-lg border border-gray-800">
            <h2 className="text-2xl font-bold mb-4">기본 정보</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">나이</label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-primary-500"
                  placeholder="예: 28"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">성별</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-primary-500"
                >
                  <option value="">선택</option>
                  <option value="남성">남성</option>
                  <option value="여성">여성</option>
                  <option value="기타">기타</option>
                </select>
              </div>
            </div>
          </div>

          {/* 저장 버튼 */}
          <div className="flex gap-4">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 px-6 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg transition-colors font-semibold"
            >
              {isSaving ? '저장 중...' : '프로필 저장'}
            </button>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
            >
              홈으로
            </button>
          </div>
        </div>

        <div className="mt-8 p-4 bg-gray-900 rounded-lg border border-gray-800">
          <p className="text-sm text-gray-400">
            💡 <strong>팁:</strong> 자세한 프로필 정보를 입력할수록 AI가 더 정확한 피드백을 제공할 수 있습니다.
            경력, 학력, 자격증 등의 정보는 추후 업데이트 예정입니다.
          </p>
        </div>
      </div>
    </div>
  );
}

