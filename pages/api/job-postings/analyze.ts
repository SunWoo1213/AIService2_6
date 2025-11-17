/**
 * 채용 공고 분석 API
 * POST /api/job-postings/analyze
 */
import { NextApiResponse } from 'next';
import { query } from '@/lib/db';
import { analyzeJobPosting } from '@/lib/openai';
import { withAuth, withErrorHandler, AuthenticatedRequest } from '@/lib/middleware';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const userId = req.user!.userId;
  const { jobPostingId } = req.body;

  if (!jobPostingId) {
    return res.status(400).json({ error: 'jobPostingId가 필요합니다.' });
  }

  // 공고 조회
  const postingResult = await query(
    'SELECT id, extracted_text FROM job_postings WHERE id = $1 AND user_id = $2',
    [jobPostingId, userId]
  );

  if (postingResult.rows.length === 0) {
    return res.status(404).json({ error: '공고를 찾을 수 없습니다.' });
  }

  const posting = postingResult.rows[0];

  // AI 분석
  const analysis = await analyzeJobPosting(posting.extracted_text);

  // DB 업데이트
  await query(
    `UPDATE job_postings 
     SET analysis_json = $1, status = 'analyzed', 
         title = $2, company_name = $3
     WHERE id = $4`,
    [
      JSON.stringify(analysis),
      analysis.position || null,
      analysis.company || null,
      jobPostingId,
    ]
  );

  return res.status(200).json({
    message: '공고 분석이 완료되었습니다.',
    analysis,
  });
}

const analyzeJobPostingHandler = withErrorHandler(withAuth(handler));

export default analyzeJobPostingHandler;

