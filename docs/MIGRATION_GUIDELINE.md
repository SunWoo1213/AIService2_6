# 데이터베이스 마이그레이션 가이드라인

## 📋 목차
1. [마이그레이션 준비](#마이그레이션-준비)
2. [로컬 환경 마이그레이션](#로컬-환경-마이그레이션)
3. [프로덕션 환경 마이그레이션](#프로덕션-환경-마이그레이션)
4. [검증 및 롤백](#검증-및-롤백)
5. [트러블슈팅](#트러블슈팅)

---

## 🎯 마이그레이션 준비

### 1. 현재 상황 파악

```bash
# 1) 환경 변수 확인
echo $DATABASE_URL
echo $POSTGRES_URL

# 2) 데이터베이스 연결 테스트
psql $DATABASE_URL -c "SELECT version();"

# 3) 현재 user_profiles 테이블 구조 확인
psql $DATABASE_URL -c "
  SELECT column_name, data_type 
  FROM information_schema.columns 
  WHERE table_name = 'user_profiles' 
  ORDER BY ordinal_position;
"
```

### 2. 백업 생성 (중요! ⚠️)

```bash
# 전체 데이터베이스 백업
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# 또는 user_profiles 테이블만 백업
pg_dump $DATABASE_URL -t user_profiles > user_profiles_backup_$(date +%Y%m%d_%H%M%S).sql
```

### 3. 마이그레이션 파일 확인

```bash
# 마이그레이션 SQL 파일 내용 확인
cat scripts/add-profile-fields.sql

# 스키마 파일 확인
cat database/schema.sql | grep -A 20 "user_profiles"
```

---

## 🖥️ 로컬 환경 마이그레이션

### 방법 1: 자동화 스크립트 사용 (권장)

```bash
# Node.js 스크립트로 마이그레이션 실행
node scripts/run-migration.js
```

**출력 예시:**
```
🔗 데이터베이스 연결 시도 중...
📍 HOST: localhost
✅ 데이터베이스 연결 성공

🔍 현재 user_profiles 테이블 구조 확인 중...
현재 컬럼 목록:
  - id (integer)
  - user_id (integer)
  - age (integer)
  - gender (character varying)
  ...

🚀 마이그레이션 실행 중...
✅ 마이그레이션 완료

✨ current_job (character varying)
✨ career_summary (text)
✨ certifications (text)
```

### 방법 2: SQL 파일 직접 실행

```bash
# psql로 마이그레이션 실행
psql $DATABASE_URL -f scripts/add-profile-fields.sql

# 또는 인터랙티브 모드
psql $DATABASE_URL
# 그 다음:
# \i scripts/add-profile-fields.sql
# \q
```

### 방법 3: Prisma 사용

```bash
# Prisma 스키마를 데이터베이스에 동기화
npx prisma db push

# 또는 마이그레이션 파일 생성 및 적용
npx prisma migrate dev --name add_profile_text_fields
```

### 로컬 검증

```bash
# 1) 컬럼이 추가되었는지 확인
psql $DATABASE_URL -c "
  SELECT column_name, data_type, is_nullable
  FROM information_schema.columns 
  WHERE table_name = 'user_profiles' 
    AND column_name IN ('current_job', 'career_summary', 'certifications');
"

# 예상 결과:
#    column_name   |     data_type      | is_nullable 
# -----------------+--------------------+-------------
#  current_job     | character varying  | YES
#  career_summary  | text               | YES
#  certifications  | text               | YES

# 2) 인덱스 확인
psql $DATABASE_URL -c "
  SELECT indexname FROM pg_indexes 
  WHERE tablename = 'user_profiles' 
    AND indexname = 'idx_user_profiles_current_job';
"

# 3) 로컬 서버 실행 및 테스트
npm run dev
# 브라우저에서 http://localhost:3000/profile 접속
```

---

## 🚀 프로덕션 환경 마이그레이션

### A. Vercel Postgres 사용 시

#### 1단계: Vercel CLI 설치 및 로그인

```bash
# Vercel CLI 설치 (아직 설치 안했다면)
npm i -g vercel

# 로그인
vercel login

# 프로젝트 연결
vercel link
```

#### 2단계: 프로덕션 데이터베이스 URL 확인

```bash
# 환경 변수 가져오기
vercel env pull .env.production

# 또는 Vercel 대시보드에서 확인:
# https://vercel.com/[your-team]/[your-project]/settings/environment-variables
```

#### 3단계: 프로덕션 데이터베이스에 연결

**옵션 1: Vercel Postgres Shell**
```bash
# Vercel Postgres 대시보드에서 직접 SQL 실행
# https://vercel.com/dashboard/stores

# 또는 CLI로:
vercel postgres:shell

# SQL 입력:
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS current_job VARCHAR(200),
ADD COLUMN IF NOT EXISTS career_summary TEXT,
ADD COLUMN IF NOT EXISTS certifications TEXT;

CREATE INDEX IF NOT EXISTS idx_user_profiles_current_job ON user_profiles(current_job);
```

**옵션 2: 로컬에서 프로덕션 DB에 연결**
```bash
# .env.production 파일의 POSTGRES_URL 사용
export POSTGRES_URL="postgres://username:password@host/database"

# 마이그레이션 실행
node scripts/run-migration.js

# 또는
psql $POSTGRES_URL -f scripts/add-profile-fields.sql
```

#### 4단계: 배포 (선택사항)

```bash
# 코드는 이미 마이그레이션된 스키마를 예상하므로
# 재배포할 필요는 없지만, 혹시 모르니 재배포
vercel --prod
```

### B. 다른 PostgreSQL 호스팅 사용 시

#### AWS RDS / Google Cloud SQL / Azure Database

```bash
# 1) 호스팅 제공업체의 대시보드에서 연결 정보 확인

# 2) SSL 연결 설정 (필요시)
export PGSSLMODE=require

# 3) 데이터베이스 URL 구성
export DATABASE_URL="postgresql://username:password@hostname:5432/dbname?sslmode=require"

# 4) 백업 (중요!)
pg_dump $DATABASE_URL > prod_backup_$(date +%Y%m%d_%H%M%S).sql

# 5) 마이그레이션 실행
node scripts/run-migration.js

# 6) 검증
psql $DATABASE_URL -c "
  SELECT column_name FROM information_schema.columns 
  WHERE table_name = 'user_profiles' 
    AND column_name IN ('current_job', 'career_summary', 'certifications');
"
```

#### Supabase 사용 시

```bash
# 1) Supabase 대시보드에서 Database > SQL Editor로 이동
#    https://app.supabase.com/project/[your-project]/sql

# 2) 새 쿼리 생성하고 다음 SQL 실행:
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS current_job VARCHAR(200),
ADD COLUMN IF NOT EXISTS career_summary TEXT,
ADD COLUMN IF NOT EXISTS certifications TEXT;

CREATE INDEX IF NOT EXISTS idx_user_profiles_current_job ON user_profiles(current_job);

# 3) Run 버튼 클릭

# 또는 CLI 사용:
npx supabase db push
```

### C. 다운타임 최소화 전략

```bash
# 1) 마이그레이션 실행 (새 컬럼 추가는 안전함)
#    - ADD COLUMN은 잠금 시간이 짧음
#    - IF NOT EXISTS를 사용하여 멱등성 보장

# 2) 애플리케이션 재시작 불필요
#    - 새 컬럼은 NULL을 허용하므로 기존 기능에 영향 없음

# 3) 점진적 롤아웃
#    - Vercel은 자동으로 점진적 배포를 수행
```

---

## ✅ 검증 및 롤백

### 마이그레이션 검증 체크리스트

```bash
# ✅ 1. 스키마 확인
psql $DATABASE_URL -c "
  SELECT 
    column_name, 
    data_type, 
    character_maximum_length,
    is_nullable
  FROM information_schema.columns 
  WHERE table_name = 'user_profiles' 
  ORDER BY ordinal_position;
"

# ✅ 2. 인덱스 확인
psql $DATABASE_URL -c "
  SELECT schemaname, tablename, indexname, indexdef
  FROM pg_indexes
  WHERE tablename = 'user_profiles';
"

# ✅ 3. 기존 데이터 무결성 확인
psql $DATABASE_URL -c "
  SELECT COUNT(*) as total_profiles,
         COUNT(current_job) as with_current_job,
         COUNT(career_summary) as with_career_summary
  FROM user_profiles;
"

# ✅ 4. 애플리케이션 테스트
curl -X GET https://your-app.vercel.app/api/profile \
  -H "Authorization: Bearer YOUR_TOKEN"

# ✅ 5. 프로필 업데이트 테스트
curl -X PUT https://your-app.vercel.app/api/profile \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "current_job": "Software Engineer",
    "career_summary": "5년차 백엔드 개발자",
    "certifications": "AWS Certified"
  }'

# ✅ 6. 로그 확인
vercel logs --prod
# 또는
tail -f /var/log/app.log
```

### 롤백 절차 (문제 발생 시)

#### 롤백 1: 컬럼 제거 (데이터 손실 주의!)

```sql
-- ⚠️ 경고: 이 작업은 데이터를 영구 삭제합니다!
-- 먼저 백업 확인:
-- ls -lh backup_*.sql

-- 롤백 SQL
ALTER TABLE user_profiles 
DROP COLUMN IF EXISTS current_job,
DROP COLUMN IF EXISTS career_summary,
DROP COLUMN IF EXISTS certifications;

-- 인덱스 제거
DROP INDEX IF EXISTS idx_user_profiles_current_job;
```

#### 롤백 2: 백업에서 복원

```bash
# 전체 데이터베이스 복원
psql $DATABASE_URL < backup_20241118_123456.sql

# 또는 특정 테이블만 복원
psql $DATABASE_URL < user_profiles_backup_20241118_123456.sql
```

#### 롤백 3: Prisma 마이그레이션 되돌리기

```bash
# 마이그레이션 히스토리 확인
npx prisma migrate status

# 특정 마이그레이션으로 롤백
npx prisma migrate resolve --rolled-back add_profile_text_fields
```

---

## 🔧 트러블슈팅

### 문제 1: "relation does not exist"

**증상:**
```
error: relation "user_profiles" does not exist
```

**해결:**
```bash
# 기본 스키마부터 생성
node scripts/migrate.js

# 그 다음 프로필 필드 추가
node scripts/run-migration.js
```

### 문제 2: "column already exists"

**증상:**
```
error: column "current_job" of relation "user_profiles" already exists
```

**해결:**
```bash
# 이미 마이그레이션이 적용됨
# 확인:
psql $DATABASE_URL -c "
  SELECT column_name FROM information_schema.columns 
  WHERE table_name = 'user_profiles' 
    AND column_name = 'current_job';
"

# 스키마가 일치하면 문제 없음
```

### 문제 3: 권한 에러

**증상:**
```
ERROR: permission denied for table user_profiles
```

**해결:**
```sql
-- 관리자 권한으로 실행
GRANT ALL PRIVILEGES ON TABLE user_profiles TO your_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_user;
```

### 문제 4: 연결 타임아웃

**증상:**
```
Error: connect ETIMEDOUT
```

**해결:**
```bash
# 1) 방화벽 확인
# AWS RDS: Security Groups 확인
# Vercel: IP 화이트리스트 확인

# 2) SSL 모드 확인
export PGSSLMODE=require
export DATABASE_URL="${DATABASE_URL}?sslmode=require"

# 3) 연결 풀 설정
export PGCONNECT_TIMEOUT=30
```

### 문제 5: 마이그레이션 후에도 에러 발생

**증상:**
```
2025-11-18 08:38:38.775 [error] 인증 에러: error: column p.current_job does not exist
```

**해결:**
```bash
# 1) 데이터베이스 연결 풀 재시작
# Vercel의 경우, 함수가 자동으로 재시작됨
# 수동으로 재배포:
vercel --prod --force

# 2) 올바른 데이터베이스에 연결되었는지 확인
psql $DATABASE_URL -c "SELECT current_database();"

# 3) 캐시 클리어
# Next.js 빌드 캐시 삭제
rm -rf .next
npm run build

# 4) 환경 변수 확인
vercel env ls
```

### 문제 6: Prisma 스키마 불일치

**증상:**
```
Warning: Your database schema is not in sync with your Prisma schema
```

**해결:**
```bash
# Prisma 클라이언트 재생성
npx prisma generate

# 데이터베이스와 동기화
npx prisma db pull  # DB -> Prisma 스키마
# 또는
npx prisma db push  # Prisma 스키마 -> DB
```

---

## 📊 마이그레이션 체크리스트

프로덕션 마이그레이션 전에 다음을 확인하세요:

- [ ] 로컬 환경에서 마이그레이션 테스트 완료
- [ ] 데이터베이스 백업 생성 완료
- [ ] 프로덕션 데이터베이스 연결 정보 확인
- [ ] 롤백 계획 수립
- [ ] 다운타임 공지 (필요시)
- [ ] 마이그레이션 SQL 검토
- [ ] 팀원에게 마이그레이션 일정 공유
- [ ] 모니터링 도구 준비 (로그, 메트릭)

마이그레이션 중:

- [ ] 마이그레이션 SQL 실행
- [ ] 스키마 변경 확인
- [ ] 인덱스 생성 확인
- [ ] 애플리케이션 로그 모니터링
- [ ] API 엔드포인트 테스트

마이그레이션 후:

- [ ] 모든 API 엔드포인트 정상 작동 확인
- [ ] 데이터 무결성 검증
- [ ] 성능 모니터링 (쿼리 속도)
- [ ] 에러 로그 확인
- [ ] 사용자 피드백 모니터링
- [ ] 백업 파일 안전한 곳에 보관

---

## 🔗 참고 자료

- [PostgreSQL ALTER TABLE 문서](https://www.postgresql.org/docs/current/sql-altertable.html)
- [Vercel Postgres 문서](https://vercel.com/docs/storage/vercel-postgres)
- [Prisma Migrations 문서](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [프로젝트 API 문서](../API.md)
- [배포 가이드](../DEPLOYMENT.md)

---

## 💡 추가 팁

### 1. 마이그레이션 자동화

```javascript
// package.json에 스크립트 추가
{
  "scripts": {
    "migrate": "node scripts/migrate.js",
    "migrate:profile": "node scripts/run-migration.js",
    "db:backup": "pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql",
    "db:verify": "psql $DATABASE_URL -f scripts/verify-schema.sql"
  }
}
```

### 2. CI/CD 파이프라인에 통합

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  migrate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run migrations
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
        run: |
          npm install
          node scripts/run-migration.js
  deploy:
    needs: migrate
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Vercel
        run: vercel --prod
```

### 3. 마이그레이션 버전 관리

```bash
# 마이그레이션 파일명에 타임스탬프 추가
scripts/
  ├── migrations/
  │   ├── 001_initial_schema.sql
  │   ├── 002_add_profile_fields.sql
  │   └── 003_add_interview_feedback.sql
  └── run-all-migrations.js
```

---

**작성일:** 2025-11-18  
**버전:** 1.0.0  
**작성자:** AI Assistant

