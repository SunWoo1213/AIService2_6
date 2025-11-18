/**
 * 자기소개서 상세 조회 API
 * GET /api/cover-letters/[id]
 */
import { NextApiResponse } from 'next';
import { query } from '@/lib/db';
import { withAuth, withErrorHandler, AuthenticatedRequest } from '@/lib/middleware';

async function handler(req: AuthenticatedRequest, res: NextApiResponse): Promise<void> {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const userId = req.user!.userId;
  const id = req.query?.id as string;

  // 자소서 조회 (피드백 포함)
  const result = await query(
    `SELECT 
      cl.id, cl.content_text, cl.created_at,
      jp.id as job_posting_id, jp.title, jp.company_name,
      clf.feedback_json
     FROM cover_letters cl
     LEFT JOIN job_postings jp ON cl.job_posting_id = jp.id
     LEFT JOIN cover_letter_feedbacks clf ON cl.id = clf.cover_letter_id
     WHERE cl.id = $1 AND cl.user_id = $2`,
    [id, userId]
  );

  if (result.rows.length === 0) {
    res.status(404).json({ error: '자기소개서를 찾을 수 없습니다.' });
    return;
  }

  res.status(200).json({ coverLetter: result.rows[0] });
}

const getCoverLetterHandler = withErrorHandler(withAuth(handler));

export default getCoverLetterHandler;

