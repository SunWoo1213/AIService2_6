# 프로덕션 데이터베이스 마이그레이션 스크립트
# PowerShell 버전

Write-Host "🔧 프로덕션 데이터베이스 마이그레이션 시작..." -ForegroundColor Cyan
Write-Host ""

# 1. 환경 변수 로드
Write-Host "📥 Vercel 환경 변수 가져오는 중..." -ForegroundColor Yellow
$envPull = vercel env pull .env.prod.local --environment production 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 환경 변수 가져오기 실패" -ForegroundColor Red
    Write-Host $envPull
    exit 1
}

Write-Host "✅ 환경 변수 로드 완료" -ForegroundColor Green
Write-Host ""

# 2. .env.prod.local에서 DATABASE_URL 읽기
if (Test-Path .env.prod.local) {
    $envContent = Get-Content .env.prod.local
    $dbUrl = ($envContent | Select-String -Pattern '^(storage_POSTGRES_URL|POSTGRES_URL|DATABASE_URL)=(.*)$' | Select-Object -First 1).Line
    
    if ($dbUrl) {
        $dbUrl = $dbUrl -replace '^[^=]+=', ''
        $dbUrl = $dbUrl -replace '"', ''
        
        Write-Host "✅ 데이터베이스 URL 확인됨" -ForegroundColor Green
        Write-Host ""
        
        # 3. 마이그레이션 SQL 준비
        $migrationSql = @"
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
"@

        # SQL 파일로 저장
        $migrationSql | Out-File -FilePath "migration-prod.sql" -Encoding UTF8
        
        Write-Host "📝 마이그레이션 SQL:" -ForegroundColor Cyan
        Write-Host $migrationSql -ForegroundColor Gray
        Write-Host ""
        
        # 4. psql 설치 확인
        $psqlExists = Get-Command psql -ErrorAction SilentlyContinue
        
        if ($psqlExists) {
            Write-Host "🚀 psql로 마이그레이션 실행 중..." -ForegroundColor Green
            Write-Host ""
            
            $env:PGPASSWORD = ""
            psql $dbUrl -f migration-prod.sql
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host ""
                Write-Host "✅ 마이그레이션 성공!" -ForegroundColor Green
            } else {
                Write-Host ""
                Write-Host "❌ 마이그레이션 실패" -ForegroundColor Red
            }
        } else {
            Write-Host "⚠️  psql이 설치되어 있지 않습니다." -ForegroundColor Yellow
            Write-Host ""
            Write-Host "📋 다음 방법 중 하나를 선택하세요:" -ForegroundColor Cyan
            Write-Host ""
            Write-Host "방법 1: PostgreSQL 설치" -ForegroundColor White
            Write-Host "  https://www.postgresql.org/download/windows/" -ForegroundColor Gray
            Write-Host ""
            Write-Host "방법 2: Node.js 스크립트 사용" -ForegroundColor White
            Write-Host "  `$env:DATABASE_URL='$dbUrl'; node scripts/run-migration.js" -ForegroundColor Gray
            Write-Host ""
            Write-Host "방법 3: Neon Console 사용" -ForegroundColor White
            Write-Host "  1. https://console.neon.tech 접속" -ForegroundColor Gray
            Write-Host "  2. 프로젝트 선택" -ForegroundColor Gray
            Write-Host "  3. SQL Editor에서 migration-prod.sql 내용 실행" -ForegroundColor Gray
            Write-Host ""
            Write-Host "SQL 파일이 저장되었습니다: migration-prod.sql" -ForegroundColor Yellow
        }
        
    } else {
        Write-Host "❌ 데이터베이스 URL을 찾을 수 없습니다." -ForegroundColor Red
    }
} else {
    Write-Host "❌ .env.prod.local 파일이 없습니다." -ForegroundColor Red
}

Write-Host ""
Write-Host "💡 도움말:" -ForegroundColor Yellow
Write-Host "  - Neon Console: https://console.neon.tech" -ForegroundColor White
Write-Host "  - Vercel Storage: https://vercel.com/dashboard/stores" -ForegroundColor White

