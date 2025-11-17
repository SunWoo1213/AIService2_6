/**
 * 로그인 API
 * POST /api/auth/login
 */
import { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';
import { verifyPassword, generateToken } from '@/lib/auth';
import { withErrorHandler } from '@/lib/middleware';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: '이메일과 비밀번호를 입력해주세요.' });
  }

  // 사용자 조회
  const result = await query(
    'SELECT id, email, password_hash, name FROM users WHERE email = $1',
    [email]
  );

  if (result.rows.length === 0) {
    return res.status(401).json({ error: '이메일 또는 비밀번호가 잘못되었습니다.' });
  }

  const user = result.rows[0];

  // 비밀번호 검증
  const isValid = await verifyPassword(password, user.password_hash);

  if (!isValid) {
    return res.status(401).json({ error: '이메일 또는 비밀번호가 잘못되었습니다.' });
  }

  // JWT 토큰 생성
  const token = generateToken({ userId: user.id, email: user.email });

  return res.status(200).json({
    message: '로그인 성공',
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
    token,
  });
}

const loginHandler = withErrorHandler(handler);

export default loginHandler;

