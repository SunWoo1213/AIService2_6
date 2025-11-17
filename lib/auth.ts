/**
 * 인증 관련 유틸리티 (JWT, 비밀번호 해싱)
 */
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export interface JWTPayload {
  userId: number;
  email: string;
}

/**
 * 비밀번호 해싱
 */
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * 비밀번호 검증
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

/**
 * JWT 토큰 생성
 */
export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '7d',
  });
}

/**
 * JWT 토큰 검증
 */
export function verifyToken(token: string): JWTPayload {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    throw new Error('유효하지 않은 토큰입니다.');
  }
}

/**
 * Authorization 헤더에서 토큰 추출
 */
export function extractTokenFromHeader(authHeader?: string): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

