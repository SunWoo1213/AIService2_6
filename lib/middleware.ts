/**
 * API 미들웨어 (인증, 에러 핸들링, CORS)
 */
import { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken, extractTokenFromHeader, JWTPayload } from './auth';

export interface AuthenticatedRequest extends NextApiRequest {
  user?: JWTPayload;
}

/**
 * CORS 미들웨어
 */
export function withCors(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void | any>
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    // CORS 헤더 설정
    const origin = req.headers.origin || '*';
    
    // Vercel 도메인 또는 로컬호스트만 허용
    const allowedOrigins = [
      'http://localhost:3000',
      'https://ai-service2-6.vercel.app',
      /https:\/\/ai-service2-6-.*\.vercel\.app$/, // Vercel preview 배포
    ];

    const isAllowed = allowedOrigins.some(allowed => {
      if (typeof allowed === 'string') {
        return origin === allowed;
      }
      return allowed.test(origin);
    });

    if (isAllowed || process.env.NODE_ENV === 'development') {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }

    // Preflight 요청 처리
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    await handler(req, res);
  };
}

/**
 * 인증 미들웨어 (CORS 포함)
 */
export function withAuth(
  handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void | any>
) {
  return withCors(async (req: AuthenticatedRequest, res: NextApiResponse) => {
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
  });
}

/**
 * 에러 핸들러 래퍼 (CORS 포함)
 */
export function withErrorHandler(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void | any>
) {
  return withCors(async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      await handler(req, res);
    } catch (error: any) {
      console.error('API 에러:', error);
      
      const statusCode = error.statusCode || 500;
      const message = error.message || '서버 오류가 발생했습니다.';
      
      return res.status(statusCode).json({ error: message });
    }
  });
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

