/**
 * Pages Router용 _app.tsx
 * 전역 인증 상태 관리 및 보호된 라우트 가드 적용
 */
import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import { AuthProvider } from '@/context/AuthContext';
import AuthGuard from '@/components/AuthGuard';
import '@/app/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();

  // 인증이 필요 없는 공개 라우트 목록
  const publicRoutes = [
    '/',           // 홈페이지
    '/login',      // 로그인
    '/register',   // 회원가입
  ];

  // 현재 경로가 공개 라우트인지 확인
  const isPublicRoute = publicRoutes.includes(router.pathname);

  return (
    <AuthProvider>
      {isPublicRoute ? (
        // 공개 라우트는 AuthGuard 없이 렌더링
        <Component {...pageProps} />
      ) : (
        // 보호된 라우트는 AuthGuard로 감싸기
        <AuthGuard>
          <Component {...pageProps} />
        </AuthGuard>
      )}
    </AuthProvider>
  );
}





