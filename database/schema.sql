-- AI Interview Service Database Schema
-- PostgreSQL 14+

-- Users 테이블
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User Profiles 테이블 (사용자 스펙 정보)
CREATE TABLE IF NOT EXISTS user_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    age INTEGER,
    gender VARCHAR(20),
    -- JSONB 형태로 경력, 학력, 자격증 저장
    career_json JSONB DEFAULT '[]'::jsonb,
    -- 예: [{"company": "삼성전자", "position": "소프트웨어 엔지니어", "period": "2020-2023"}]
    education_json JSONB DEFAULT '[]'::jsonb,
    -- 예: [{"school": "서울대학교", "major": "컴퓨터공학", "degree": "학사", "graduation_year": 2020}]
    certificates_json JSONB DEFAULT '[]'::jsonb,
    -- 예: [{"name": "정보처리기사", "issued_date": "2020-05"}]
    skills_json JSONB DEFAULT '[]'::jsonb,
    -- 예: ["Python", "React", "AWS"]
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Job Postings 테이블 (채용 공고)
CREATE TABLE IF NOT EXISTS job_postings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(500),
    company_name VARCHAR(200),
    -- 업로드된 원본 PDF S3 URL
    original_s3_url TEXT,
    -- PDF에서 추출한 텍스트
    extracted_text TEXT,
    -- AI가 분석한 결과 (JSON)
    analysis_json JSONB,
    -- 예: {"keywords": ["React", "TypeScript"], "must_have": [...], "nice_to_have": [...]}
    status VARCHAR(50) DEFAULT 'pending',
    -- pending, analyzed, failed
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cover Letters 테이블 (자기소개서)
CREATE TABLE IF NOT EXISTS cover_letters (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    job_posting_id INTEGER REFERENCES job_postings(id) ON DELETE CASCADE,
    content_text TEXT NOT NULL,
    version INTEGER DEFAULT 1,
    -- 여러 버전 관리 가능
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cover Letter Feedbacks 테이블 (자소서 피드백)
CREATE TABLE IF NOT EXISTS cover_letter_feedbacks (
    id SERIAL PRIMARY KEY,
    cover_letter_id INTEGER NOT NULL REFERENCES cover_letters(id) ON DELETE CASCADE,
    feedback_text TEXT NOT NULL,
    feedback_json JSONB,
    -- 구조화된 피드백 (강점, 개선점, 예상 면접 질문 등)
    -- 예: {"strengths": [...], "improvements": [...], "interview_questions": [...]}
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Interview Sessions 테이블 (모의 면접 세션)
CREATE TABLE IF NOT EXISTS interview_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    cover_letter_id INTEGER REFERENCES cover_letters(id) ON DELETE SET NULL,
    job_posting_id INTEGER REFERENCES job_postings(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'pending',
    -- pending, in_progress, completed, cancelled
    total_questions INTEGER DEFAULT 5,
    -- 총 질문 수
    final_feedback_json JSONB,
    -- 최종 종합 피드백
    -- 예: {"overall_feedback": "...", "per_turn_feedback": [...]}
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Interview Turns 테이블 (면접 질문/답변 턴)
CREATE TABLE IF NOT EXISTS interview_turns (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES interview_sessions(id) ON DELETE CASCADE,
    turn_number INTEGER NOT NULL,
    -- 1~5
    question_text TEXT NOT NULL,
    question_audio_s3_url TEXT,
    -- TTS로 생성된 질문 오디오 S3 URL
    user_answer_text TEXT,
    -- STT로 변환된 사용자 답변 텍스트
    user_answer_audio_s3_url TEXT,
    -- 사용자가 녹음한 답변 오디오 S3 URL
    feedback_text TEXT,
    -- 이 턴에 대한 개별 피드백
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(session_id, turn_number)
);

-- 인덱스 생성
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_job_postings_user_id ON job_postings(user_id);
CREATE INDEX idx_cover_letters_user_id ON cover_letters(user_id);
CREATE INDEX idx_cover_letters_job_posting_id ON cover_letters(job_posting_id);
CREATE INDEX idx_cover_letter_feedbacks_cover_letter_id ON cover_letter_feedbacks(cover_letter_id);
CREATE INDEX idx_interview_sessions_user_id ON interview_sessions(user_id);
CREATE INDEX idx_interview_sessions_status ON interview_sessions(status);
CREATE INDEX idx_interview_turns_session_id ON interview_turns(session_id);

-- 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 각 테이블에 트리거 적용
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_postings_updated_at BEFORE UPDATE ON job_postings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cover_letters_updated_at BEFORE UPDATE ON cover_letters
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_interview_sessions_updated_at BEFORE UPDATE ON interview_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

