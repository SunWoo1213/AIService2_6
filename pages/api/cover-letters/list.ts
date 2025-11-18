/**
 * 자기소개서 목록 조회 API
 * GET /api/cover-letters/list
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

  // 자기소개서 목록 조회 (최신순, 관련 채용공고 정보 포함)
  const result = await query(
    `SELECT 
      cl.id,
      cl.content_text,
      cl.created_at,
      cl.updated_at,
      jp.id as job_posting_id,
      jp.title as job_title,
      jp.company_name
    FROM cover_letters cl
    LEFT JOIN job_postings jp ON cl.job_posting_id = jp.id
    WHERE cl.user_id = $1
    ORDER BY cl.created_at DESC
    LIMIT 50`,
    [userId]
  );

  const coverLetters = result.rows.map(row => ({
    id: row.id,
    contentText: row.content_text,
    contentPreview: row.content_text.substring(0, 100) + (row.content_text.length > 100 ? '...' : ''),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    jobPosting: row.job_posting_id ? {
      id: row.job_posting_id,
      title: row.job_title,
      companyName: row.company_name,
    } : null,
  }));

  res.status(200).json({
    coverLetters,
    total: coverLetters.length,
  });
}

export default withErrorHandler(withAuth(handler));

