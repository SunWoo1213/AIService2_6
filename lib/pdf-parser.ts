/**
 * PDF 파싱 유틸리티
 */
import pdf from 'pdf-parse';

export interface ParsedPDF {
  text: string;
  numPages: number;
  info: any;
}

/**
 * PDF Buffer를 텍스트로 변환
 */
export async function parsePDF(buffer: Buffer): Promise<ParsedPDF> {
  try {
    const data = await pdf(buffer);
    
    return {
      text: data.text,
      numPages: data.numpages,
      info: data.info,
    };
  } catch (error) {
    console.error('PDF 파싱 에러:', error);
    throw new Error('PDF 파일을 읽을 수 없습니다.');
  }
}

/**
 * 텍스트 정제 (불필요한 공백, 줄바꿈 제거)
 */
export function cleanText(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/\n\s*\n/g, '\n')
    .trim();
}

