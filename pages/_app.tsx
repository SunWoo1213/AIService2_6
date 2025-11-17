/**
 * Pages Router용 _app.tsx (선택사항)
 * 현재 프로젝트는 App Router를 사용하므로 이 파일은 사용되지 않습니다.
 * Pages Router로 마이그레이션하려는 경우를 위해 제공됩니다.
 */
import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
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

  // 공개 라우트라면 AuthGuard 없이 렌더링
  if (isPublicRoute) {
    return <Component {...pageProps} />;
  }

  // 보호된 라우트라면 AuthGuard로 감싸기
  return (
    <AuthGuard>
      <Component {...pageProps} />
    </AuthGuard>
  );
}





