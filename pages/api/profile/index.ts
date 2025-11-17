/**
 * 사용자 프로필 API
 * GET /api/profile - 프로필 조회
 * PUT /api/profile - 프로필 업데이트
 */
import { NextApiResponse } from 'next';
import { query } from '@/lib/db';
import { withAuth, withErrorHandler, AuthenticatedRequest } from '@/lib/middleware';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  const userId = req.user!.userId;

  if (req.method === 'GET') {
    // 프로필 조회
    const result = await query(
      `SELECT 
        u.id, u.email, u.name,
        p.age, p.gender, p.career_json, p.education_json, 
        p.certificates_json, p.skills_json
      FROM users u
      LEFT JOIN user_profiles p ON u.id = p.user_id
      WHERE u.id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
    }

    return res.status(200).json({ profile: result.rows[0] });
  }

  if (req.method === 'PUT') {
    // 프로필 업데이트
    const { age, gender, career_json, education_json, certificates_json, skills_json } = req.body;

    await query(
      `UPDATE user_profiles 
       SET age = $1, gender = $2, career_json = $3, education_json = $4, 
           certificates_json = $5, skills_json = $6
       WHERE user_id = $7`,
      [
        age || null,
        gender || null,
        JSON.stringify(career_json || []),
        JSON.stringify(education_json || []),
        JSON.stringify(certificates_json || []),
        JSON.stringify(skills_json || []),
        userId,
      ]
    );

    return res.status(200).json({ message: '프로필이 업데이트되었습니다.' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

export default withErrorHandler(withAuth(handler));

