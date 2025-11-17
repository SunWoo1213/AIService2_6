/**
 * 면접 결과 조회 API
 * GET /api/interview/result/[id]
 */
import { NextApiResponse } from 'next';
import { query } from '@/lib/db';
import { withAuth, withErrorHandler, AuthenticatedRequest } from '@/lib/middleware';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const userId = req.user!.userId;
  const id = req.query?.id as string;

  // 세션 조회
  const sessionResult = await query(
    `SELECT id, status, final_feedback_json, started_at, completed_at
     FROM interview_sessions 
     WHERE id = $1 AND user_id = $2`,
    [id, userId]
  );

  if (sessionResult.rows.length === 0) {
    return res.status(404).json({ error: '면접 세션을 찾을 수 없습니다.' });
  }

  const session = sessionResult.rows[0];

  if (session.status !== 'completed') {
    return res.status(400).json({ error: '아직 완료되지 않은 면접입니다.' });
  }

  // 모든 턴 조회
  const turnsResult = await query(
    `SELECT 
      turn_number, question_text, question_audio_s3_url,
      user_answer_text, user_answer_audio_s3_url
     FROM interview_turns 
     WHERE session_id = $1 
     ORDER BY turn_number`,
    [id]
  );

  return res.status(200).json({
    session: {
      id: session.id,
      status: session.status,
      startedAt: session.started_at,
      completedAt: session.completed_at,
      finalFeedback: session.final_feedback_json,
    },
    turns: turnsResult.rows,
  });
}

const getInterviewResultHandler = withErrorHandler(withAuth(handler));

export default getInterviewResultHandler;

