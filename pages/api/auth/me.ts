/**
 * 현재 로그인한 사용자 정보 조회 API
 * GET /api/auth/me
 */
import { NextApiResponse } from 'next';
import { query } from '@/lib/db';
import { withAuth, withErrorHandler, AuthenticatedRequest } from '@/lib/middleware';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // withAuth 미들웨어에서 이미 사용자 정보를 검증했으므로
  // req.user에서 사용자 ID를 가져올 수 있음
  const userId = req.user!.userId;

  // 사용자 정보 조회
  const result = await query(
    'SELECT id, email, name, created_at FROM users WHERE id = $1',
    [userId]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
  }

  const user = result.rows[0];

  return res.status(200).json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
  });
}

const meHandler = withErrorHandler(withAuth(handler));

export default meHandler;

