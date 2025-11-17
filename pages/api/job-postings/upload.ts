/**
 * 채용 공고 업로드 API (PDF)
 * POST /api/job-postings/upload
 */
import { NextApiResponse } from 'next';
import { query } from '@/lib/db';
import { uploadToS3 } from '@/lib/s3';
import { parsePDF, cleanText } from '@/lib/pdf-parser';
import { withAuth, withErrorHandler, AuthenticatedRequest, parseFormData } from '@/lib/middleware';
import fs from 'fs';

// Next.js body parser 비활성화 (파일 업로드용)
export const config = {
  api: {
    bodyParser: false,
  },
};

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const userId = req.user!.userId;

  // 멀티파트 폼 데이터 파싱
  const { fields, files } = await parseFormData(req);

  const pdfFile = Array.isArray(files.file) ? files.file[0] : files.file;

  if (!pdfFile) {
    return res.status(400).json({ error: 'PDF 파일이 필요합니다.' });
  }

  // PDF 파일 읽기
  const fileBuffer = fs.readFileSync(pdfFile.filepath);

  // PDF 텍스트 추출
  const parsed = await parsePDF(fileBuffer);
  const extractedText = cleanText(parsed.text);

  // S3에 원본 PDF 업로드
  const s3Url = await uploadToS3({
    folder: 'job-postings',
    fileName: pdfFile.originalFilename || 'posting.pdf',
    contentType: 'application/pdf',
    buffer: fileBuffer,
  });

  // DB에 저장
  const result = await query(
    `INSERT INTO job_postings 
     (user_id, original_s3_url, extracted_text, status) 
     VALUES ($1, $2, $3, 'pending') 
     RETURNING id`,
    [userId, s3Url, extractedText]
  );

  const jobPostingId = result.rows[0].id;

  return res.status(201).json({
    message: '공고가 업로드되었습니다. 분석을 진행해주세요.',
    jobPostingId,
    extractedText,
  });
}

export default withErrorHandler(withAuth(handler));

