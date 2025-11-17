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
        p.age, p.gender, p.current_job, p.career_summary, p.certifications,
        p.career_json, p.education_json, p.certificates_json, p.skills_json
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
    // 프로필 업데이트 (UPSERT: 없으면 생성, 있으면 업데이트)
    const { age, gender, career_json, education_json, certificates_json, skills_json, current_job, career_summary, certifications } = req.body;

    // UPSERT 쿼리: INSERT ... ON CONFLICT ... DO UPDATE
    await query(
      `INSERT INTO user_profiles (
        user_id, age, gender, current_job, career_summary, certifications,
        career_json, education_json, certificates_json, skills_json
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (user_id) 
       DO UPDATE SET 
         age = EXCLUDED.age,
         gender = EXCLUDED.gender,
         current_job = EXCLUDED.current_job,
         career_summary = EXCLUDED.career_summary,
         certifications = EXCLUDED.certifications,
         career_json = EXCLUDED.career_json,
         education_json = EXCLUDED.education_json,
         certificates_json = EXCLUDED.certificates_json,
         skills_json = EXCLUDED.skills_json,
         updated_at = CURRENT_TIMESTAMP`,
      [
        userId,
        age || null,
        gender || null,
        current_job || null,
        career_summary || null,
        certifications || null,
        JSON.stringify(career_json || []),
        JSON.stringify(education_json || []),
        JSON.stringify(certificates_json || []),
        JSON.stringify(skills_json || []),
      ]
    );

    return res.status(200).json({ message: '프로필이 저장되었습니다.' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

const profileHandler = withErrorHandler(withAuth(handler));

export default profileHandler;

