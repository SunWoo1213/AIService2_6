/**
 * 현재 로그인한 사용자 정보 조회 API
 * GET /api/auth/me
 */
import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import { query } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // GET 메서드만 허용
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 1. Authorization 헤더에서 토큰 추출
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: '인증 토큰이 제공되지 않았습니다.' });
    }

    // "Bearer <token>" 형식에서 토큰만 추출
    const token = authHeader.substring(7);

    if (!token) {
      return res.status(401).json({ error: '인증 토큰이 제공되지 않았습니다.' });
    }

    // 2. JWT_SECRET 환경 변수 확인
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      console.error('JWT_SECRET 환경 변수가 설정되지 않았습니다.');
      return res.status(500).json({ error: '서버 설정 오류' });
    }

    // 3. 토큰 검증
    let decoded: any;
    try {
      decoded = jwt.verify(token, jwtSecret);
    } catch (err: any) {
      // 토큰 만료, 유효하지 않은 토큰 등
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: '토큰이 만료되었습니다.' });
      }
      return res.status(401).json({ error: '유효하지 않은 토큰입니다.' });
    }

    // 4. 토큰 페이로드에서 userId 추출
    const userId = decoded.userId;

    if (!userId) {
      return res.status(401).json({ error: '토큰에 사용자 정보가 없습니다.' });
    }

    // 5. 데이터베이스에서 사용자 조회
    const result = await query(
      'SELECT id, email, name, created_at FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
    }

    const user = result.rows[0];

    // 6. 사용자 데이터 반환
    return res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    console.error('사용자 정보 조회 에러:', error);
    return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
}

