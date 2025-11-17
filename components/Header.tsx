/**
 * 동적 헤더 컴포넌트
 * 인증 상태에 따라 다른 UI를 표시합니다
 */
'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function Header() {
  const { user, isLoading, logout } = useAuth();

  return (
    <header className="bg-gray-900 border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-8 py-4">
        <div className="flex items-center justify-between">
          {/* 로고/타이틀 */}
          <Link href="/" className="text-2xl font-bold text-white hover:text-primary-500 transition-colors">
            AI 취업 준비
          </Link>

          {/* 인증 상태에 따른 네비게이션 */}
          <nav className="flex items-center gap-6">
            {isLoading ? (
              // 로딩 중일 때 작은 스피너 표시
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-500" />
              </div>
            ) : user ? (
              // 로그인된 상태
              <>
                <span className="text-gray-300">
                  안녕하세요, <span className="text-white font-semibold">{user.name || user.email}</span>님
                </span>
                <Link
                  href="/profile"
                  className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                >
                  프로필
                </Link>
                <button
                  onClick={logout}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-white"
                >
                  로그아웃
                </button>
              </>
            ) : (
              // 로그인되지 않은 상태
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                >
                  로그인
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors text-white"
                >
                  회원가입
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}

