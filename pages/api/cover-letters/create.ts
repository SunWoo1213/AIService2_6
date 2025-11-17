/**
 * 자기소개서 생성 및 피드백 요청 API
 * POST /api/cover-letters/create
 */
import { NextApiResponse } from 'next';
import { query } from '@/lib/db';
import { generateCoverLetterFeedback } from '@/lib/openai';
import { withAuth, withErrorHandler, AuthenticatedRequest } from '@/lib/middleware';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const userId = req.user!.userId;
  const { jobPostingId, contentText } = req.body;

  if (!jobPostingId || !contentText) {
    return res.status(400).json({ error: 'jobPostingId와 contentText가 필요합니다.' });
  }

  // 자소서 저장
  const coverLetterResult = await query(
    `INSERT INTO cover_letters (user_id, job_posting_id, content_text) 
     VALUES ($1, $2, $3) 
     RETURNING id`,
    [userId, jobPostingId, contentText]
  );

  const coverLetterId = coverLetterResult.rows[0].id;

  // 사용자 프로필 조회
  const profileResult = await query(
    `SELECT age, gender, career_json, education_json, certificates_json, skills_json
     FROM user_profiles WHERE user_id = $1`,
    [userId]
  );

  const userProfile = profileResult.rows[0] || {};

  // 공고 정보 조회
  const postingResult = await query(
    `SELECT id, title, company_name, analysis_json 
     FROM job_postings WHERE id = $1`,
    [jobPostingId]
  );

  if (postingResult.rows.length === 0) {
    return res.status(404).json({ error: '공고를 찾을 수 없습니다.' });
  }

  const jobPosting = postingResult.rows[0];

  // AI 피드백 생성
  const feedback = await generateCoverLetterFeedback(
    userProfile,
    jobPosting,
    contentText
  );

  // 피드백 저장
  await query(
    `INSERT INTO cover_letter_feedbacks 
     (cover_letter_id, feedback_text, feedback_json) 
     VALUES ($1, $2, $3)`,
    [
      coverLetterId,
      feedback.overall_feedback,
      JSON.stringify(feedback),
    ]
  );

  return res.status(201).json({
    message: '자기소개서 피드백이 생성되었습니다.',
    coverLetterId,
    feedback,
  });
}

export default withErrorHandler(withAuth(handler));

