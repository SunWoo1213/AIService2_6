/**
 * OpenAI API 통합 유틸리티 (GPT-4o, TTS, STT)
 */
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ==================== GPT-4o 관련 ====================

export interface JobPostingAnalysis {
  keywords: string[];
  must_have: string[];
  nice_to_have: string[];
  summary: string;
  position: string;
  company: string;
}

/**
 * 채용 공고 분석
 */
export async function analyzeJobPosting(
  extractedText: string
): Promise<JobPostingAnalysis> {
  const prompt = `너는 전문 HR 매니저이자 채용 전문가야. 
다음 채용공고 텍스트를 분석해서 JSON 형식으로 추출해줘:

채용공고 텍스트:
${extractedText}

다음 형식의 JSON으로 응답해줘:
{
  "company": "회사명",
  "position": "직무명",
  "keywords": ["핵심 기술 키워드 10개"],
  "must_have": ["필수 자격 요건"],
  "nice_to_have": ["우대 사항"],
  "summary": "공고 요약 (2-3문장)"
}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: '당신은 전문 HR 매니저입니다.' },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const content = response.choices[0].message.content;
    return JSON.parse(content || '{}');
  } catch (error) {
    console.error('공고 분석 에러:', error);
    throw new Error('채용 공고 분석에 실패했습니다.');
  }
}

export interface CoverLetterFeedback {
  strengths: string[];
  improvements: Array<{
    issue: string;
    suggestion: string;
    example: string;
  }>;
  interview_questions: string[];
  overall_score: number;
  overall_feedback: string;
}

/**
 * 자기소개서 피드백 생성
 */
export async function generateCoverLetterFeedback(
  userProfile: any,
  jobPosting: any,
  coverLetterText: string
): Promise<CoverLetterFeedback> {
  const prompt = `너는 ${jobPosting.position || '해당'} 분야 최고의 커리어 코치이자 채용 전문가야.

### 사용자 프로필:
- 나이: ${userProfile.age || '미상'}
- 성별: ${userProfile.gender || '미상'}
- 경력: ${JSON.stringify(userProfile.career_json || [], null, 2)}
- 학력: ${JSON.stringify(userProfile.education_json || [], null, 2)}
- 자격증: ${JSON.stringify(userProfile.certificates_json || [], null, 2)}

### 채용 공고 정보:
- 회사: ${jobPosting.company_name || '미상'}
- 직무: ${jobPosting.title || '미상'}
- 필수 요건: ${JSON.stringify(jobPosting.analysis_json?.must_have || [], null, 2)}
- 우대 사항: ${JSON.stringify(jobPosting.analysis_json?.nice_to_have || [], null, 2)}

### 자기소개서:
${coverLetterText}

위 정보를 바탕으로 다음 형식의 JSON으로 피드백을 제공해줘:
{
  "overall_score": 100점 만점 점수,
  "overall_feedback": "종합 피드백 (3-5문장)",
  "strengths": ["잘 쓴 부분 3-5개"],
  "improvements": [
    {
      "issue": "개선이 필요한 부분",
      "suggestion": "구체적인 개선 방안",
      "example": "수정 예시"
    }
  ],
  "interview_questions": ["예상 면접 질문 3-5개"]
}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: '당신은 전문 커리어 코치입니다.' },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.5,
    });

    const content = response.choices[0].message.content;
    return JSON.parse(content || '{}');
  } catch (error) {
    console.error('자소서 피드백 에러:', error);
    throw new Error('자기소개서 피드백 생성에 실패했습니다.');
  }
}

// ==================== 면접 관련 ====================

export interface InterviewContext {
  userProfile: any;
  jobPosting: any;
  coverLetter: string;
  conversationHistory: Array<{
    question: string;
    answer: string;
  }>;
}

/**
 * 면접 질문 생성
 */
export async function generateInterviewQuestion(
  context: InterviewContext,
  turnNumber: number,
  totalQuestions: number = 5
): Promise<string> {
  let systemPrompt = `너는 ${context.jobPosting.title || '해당'} 분야의 최고 전문가 면접관이야. 
사용자의 스펙과 자기소개서를 바탕으로 실제 면접처럼 질문을 생성해줘.`;

  let userPrompt = '';

  if (turnNumber === 1) {
    userPrompt = `### 사용자 프로필:
${JSON.stringify(context.userProfile, null, 2)}

### 채용 공고:
- 회사: ${context.jobPosting.company_name}
- 직무: ${context.jobPosting.title}
- 필수 요건: ${JSON.stringify(context.jobPosting.analysis_json?.must_have)}

### 자기소개서:
${context.coverLetter}

첫 번째 질문을 생성해줘. 1분 자기소개 또는 지원 동기를 물어봐.
질문만 출력해줘. (예: "간단히 1분 자기소개 부탁드립니다.")`;
  } else {
    const lastTurn = context.conversationHistory[context.conversationHistory.length - 1];
    
    userPrompt = `### 이전 대화:
${context.conversationHistory.map((turn, idx) => 
  `Q${idx + 1}: ${turn.question}\nA${idx + 1}: ${turn.answer}`
).join('\n\n')}

이전 답변을 바탕으로 ${turnNumber}번째 질문을 생성해줘. 
- 꼬리 질문이 자연스럽다면 꼬리 질문을 해줘.
- 그렇지 않다면 자기소개서나 공고 기반의 새로운 주제 질문을 해줘.
- 총 ${totalQuestions}개 질문 중 ${turnNumber}번째야.

질문만 출력해줘.`;
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 200,
    });

    return response.choices[0].message.content?.trim() || '';
  } catch (error) {
    console.error('면접 질문 생성 에러:', error);
    throw new Error('면접 질문 생성에 실패했습니다.');
  }
}

export interface FinalInterviewFeedback {
  overall_feedback: string;
  attitude_score: number;
  content_score: number;
  consistency_score: number;
  job_fit_score: number;
  per_turn_feedback: Array<{
    turn_number: number;
    question: string;
    answer: string;
    feedback: string;
    score: number;
  }>;
}

/**
 * 최종 면접 피드백 생성
 */
export async function generateFinalInterviewFeedback(
  context: InterviewContext,
  turns: Array<{ question_text: string; user_answer_text: string }>
): Promise<FinalInterviewFeedback> {
  const prompt = `너는 ${context.jobPosting.title} 분야의 최고 전문가 면접관이자 피드백 전문가야.

### 면접 대화 기록:
${turns.map((turn, idx) => 
  `[질문 ${idx + 1}] ${turn.question_text}\n[답변 ${idx + 1}] ${turn.user_answer_text}`
).join('\n\n')}

### 사용자 스펙:
${JSON.stringify(context.userProfile, null, 2)}

### 채용 공고:
${JSON.stringify(context.jobPosting.analysis_json, null, 2)}

위 면접 내용을 바탕으로 다음 형식의 JSON 피드백을 제공해줘:
{
  "overall_feedback": "종합 피드백 (5-7문장)",
  "attitude_score": 면접 태도 점수 (100점 만점),
  "content_score": 답변 내용 점수 (100점 만점),
  "consistency_score": 일관성 점수 (100점 만점),
  "job_fit_score": 직무 적합성 점수 (100점 만점),
  "per_turn_feedback": [
    {
      "turn_number": 1,
      "question": "질문",
      "answer": "답변",
      "feedback": "이 답변에 대한 구체적 피드백",
      "score": 100점 만점 점수
    }
  ]
}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: '당신은 전문 면접관이자 피드백 전문가입니다.' },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.5,
    });

    const content = response.choices[0].message.content;
    return JSON.parse(content || '{}');
  } catch (error) {
    console.error('최종 피드백 에러:', error);
    throw new Error('면접 피드백 생성에 실패했습니다.');
  }
}

// ==================== TTS (Text-to-Speech) ====================

/**
 * 텍스트를 음성으로 변환 (TTS)
 */
export async function textToSpeech(text: string): Promise<Buffer> {
  try {
    const mp3 = await openai.audio.speech.create({
      model: 'tts-1',
      voice: 'nova', // alloy, echo, fable, onyx, nova, shimmer
      input: text,
      speed: 1.0,
    });

    const buffer = Buffer.from(await mp3.arrayBuffer());
    return buffer;
  } catch (error) {
    console.error('TTS 에러:', error);
    throw new Error('음성 생성에 실패했습니다.');
  }
}

// ==================== STT (Speech-to-Text) ====================

/**
 * 음성을 텍스트로 변환 (STT)
 */
export async function speechToText(audioBuffer: Buffer, filename: string = 'audio.webm'): Promise<string> {
  try {
    // OpenAI Whisper API는 File 객체나 스트림을 요구
    const tempFilePath = path.join('/tmp', filename);
    fs.writeFileSync(tempFilePath, audioBuffer);

    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(tempFilePath),
      model: 'whisper-1',
      language: 'ko', // 한국어
    });

    // 임시 파일 삭제
    fs.unlinkSync(tempFilePath);

    return transcription.text;
  } catch (error) {
    console.error('STT 에러:', error);
    throw new Error('음성 인식에 실패했습니다.');
  }
}

export default {
  analyzeJobPosting,
  generateCoverLetterFeedback,
  generateInterviewQuestion,
  generateFinalInterviewFeedback,
  textToSpeech,
  speechToText,
};

