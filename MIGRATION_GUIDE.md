# 데이터베이스 마이그레이션 가이드

## 문제 상황
`user_profiles` 테이블에 `current_job`, `career_summary`, `certifications` 컬럼이 누락되어 다음 에러가 발생합니다:
```
error: column p.current_job does not exist
```

## 해결 방법

### 방법 1: 기존 테이블에 컬럼 추가 (권장 - 기존 데이터 유지)

프로덕션 데이터베이스에 직접 연결하여 다음 SQL을 실행하세요:

```bash
# PostgreSQL 클라이언트로 연결
psql $DATABASE_URL

# 또는 Vercel Postgres의 경우
vercel postgres:shell
```

그런 다음 SQL 실행:

```sql
-- user_profiles 테이블에 새로운 필드 추가
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS current_job VARCHAR(200),
ADD COLUMN IF NOT EXISTS career_summary TEXT,
ADD COLUMN IF NOT EXISTS certifications TEXT;

-- 인덱스 추가 (검색 최적화)
CREATE INDEX IF NOT EXISTS idx_user_profiles_current_job ON user_profiles(current_job);
```

또는 스크립트 파일 실행:

```bash
# 로컬에서 실행
psql $DATABASE_URL -f scripts/add-profile-fields.sql

# 또는 Node.js 스크립트 사용
node scripts/run-migration.js
```

### 방법 2: 전체 스키마 재실행 (새 데이터베이스용)

새로운 데이터베이스이거나 데이터를 모두 지워도 괜찮은 경우:

```bash
node scripts/migrate.js
```

### 방법 3: Prisma 마이그레이션 사용

Prisma를 사용하는 경우:

```bash
# Prisma 스키마를 데이터베이스에 적용
npx prisma db push

# 또는 마이그레이션 생성 및 적용
npx prisma migrate dev --name add_profile_text_fields
npx prisma migrate deploy  # 프로덕션용
```

## 검증

마이그레이션 후 다음 쿼리로 컬럼이 추가되었는지 확인:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
  AND column_name IN ('current_job', 'career_summary', 'certifications');
```

예상 결과:
```
   column_name   |     data_type      
-----------------+--------------------
 current_job     | character varying
 career_summary  | text
 certifications  | text
```

## Vercel 배포 시 주의사항

1. **환경 변수 확인**: Vercel 대시보드에서 `DATABASE_URL` 또는 `POSTGRES_URL`이 올바르게 설정되어 있는지 확인
2. **마이그레이션 실행**: 배포 전에 프로덕션 데이터베이스에 마이그레이션을 먼저 실행
3. **재배포**: 코드는 이미 마이그레이션된 스키마를 예상하므로, 데이터베이스 마이그레이션 후 애플리케이션을 재배포할 필요 없음

## 문제 해결

### "relation does not exist" 에러가 계속되는 경우

데이터베이스 풀 연결을 재시작해야 할 수 있습니다:

```bash
# Vercel에서 함수를 다시 배포하거나
vercel --prod

# 또는 데이터베이스 연결 풀 재시작
# (클라우드 제공업체 대시보드에서)
```

### 연결 문자열 확인

```bash
# DATABASE_URL 형식 확인
echo $DATABASE_URL
# 예: postgresql://user:password@host:5432/database?sslmode=require
```

