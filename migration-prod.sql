-- user_profiles 테이블에 컬럼 추가
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS current_job VARCHAR(200),
ADD COLUMN IF NOT EXISTS career_summary TEXT,
ADD COLUMN IF NOT EXISTS certifications TEXT;

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_user_profiles_current_job 
ON user_profiles(current_job);

-- 확인
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
  AND column_name IN ('current_job', 'career_summary', 'certifications')
ORDER BY column_name;

