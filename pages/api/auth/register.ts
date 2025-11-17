/**
 * 회원가입 API
 * POST /api/auth/register
 */
import { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';
import { hashPassword, generateToken } from '@/lib/auth';
import { withErrorHandler } from '@/lib/middleware';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password, name } = req.body;

  // 유효성 검사
  if (!email || !password) {
    return res.status(400).json({ error: '이메일과 비밀번호는 필수입니다.' });
  }

  // 이메일 중복 체크
  const existingUser = await query(
    'SELECT id FROM users WHERE email = $1',
    [email]
  );

  if (existingUser.rows.length > 0) {
    return res.status(400).json({ error: '이미 존재하는 이메일입니다.' });
  }

  // 비밀번호 해싱
  const passwordHash = await hashPassword(password);

  // 사용자 생성
  const result = await query(
    'INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, name',
    [email, passwordHash, name || null]
  );

  const user = result.rows[0];

  // 프로필 테이블 생성
  await query(
    'INSERT INTO user_profiles (user_id) VALUES ($1)',
    [user.id]
  );

  // JWT 토큰 생성
  const token = generateToken({ userId: user.id, email: user.email });

  return res.status(201).json({
    message: '회원가입 성공',
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
    token,
  });
}

const registerHandler = withErrorHandler(handler);

export default registerHandler;

