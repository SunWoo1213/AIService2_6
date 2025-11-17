/**
 * API 미들웨어 (인증, 에러 핸들링)
 */
import { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken, extractTokenFromHeader, JWTPayload } from './auth';

export interface AuthenticatedRequest extends NextApiRequest {
  user?: JWTPayload;
}

/**
 * 인증 미들웨어
 */
export function withAuth(
  handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void>
) {
  return async (req: AuthenticatedRequest, res: NextApiResponse) => {
    try {
      const token = extractTokenFromHeader(req.headers.authorization);

      if (!token) {
        return res.status(401).json({ error: '인증이 필요합니다.' });
      }

      const payload = verifyToken(token);
      req.user = payload;

      await handler(req, res);
    } catch (error: any) {
      console.error('인증 에러:', error);
      return res.status(401).json({ error: '유효하지 않은 토큰입니다.' });
    }
  };
}

/**
 * 에러 핸들러 래퍼
 */
export function withErrorHandler(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      await handler(req, res);
    } catch (error: any) {
      console.error('API 에러:', error);
      
      const statusCode = error.statusCode || 500;
      const message = error.message || '서버 오류가 발생했습니다.';
      
      return res.status(statusCode).json({ error: message });
    }
  };
}

/**
 * 파일 업로드 설정 (formidable)
 */
export const parseFormData = async (req: NextApiRequest): Promise<any> => {
  const formidable = (await import('formidable')).default;
  const form = formidable({
    maxFileSize: 10 * 1024 * 1024, // 10MB
    keepExtensions: true,
  });

  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      resolve({ fields, files });
    });
  });
};

