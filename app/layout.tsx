import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/context/AuthContext'
import AuthProviderComponent from '@/components/AuthProvider'

export const metadata: Metadata = {
  title: 'AI 취업 준비 서비스',
  description: 'AI 기반 자기소개서 피드백 및 모의 면접 서비스',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko" className="dark">
      <body>
        <AuthProvider>
          <AuthProviderComponent>{children}</AuthProviderComponent>
        </AuthProvider>
      </body>
    </html>
  )
}

