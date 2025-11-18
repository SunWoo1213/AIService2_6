# 프로덕션 API 테스트 스크립트
# 사용법: .\test-production-api.ps1

Write-Host "🔍 프로덕션 API 테스트 시작..." -ForegroundColor Cyan
Write-Host ""

# Vercel 앱 URL (실제 URL로 변경하세요)
$VERCEL_URL = "https://your-app.vercel.app"

Write-Host "📍 테스트 URL: $VERCEL_URL" -ForegroundColor Yellow
Write-Host ""

# 헬스체크
Write-Host "1️⃣ 헬스체크..." -ForegroundColor Green
try {
    $response = Invoke-WebRequest -Uri "$VERCEL_URL/api/health" -Method GET -ErrorAction Stop
    Write-Host "✅ 서버 응답: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "❌ 헬스체크 실패: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# 프로필 API 테스트 (인증 필요)
Write-Host "2️⃣ 프로필 API 테스트..." -ForegroundColor Green
Write-Host "⚠️  이 테스트는 유효한 JWT 토큰이 필요합니다." -ForegroundColor Yellow
Write-Host ""

$TOKEN = Read-Host "JWT 토큰을 입력하세요 (없으면 Enter)"

if ($TOKEN) {
    try {
        $headers = @{
            "Authorization" = "Bearer $TOKEN"
            "Content-Type" = "application/json"
        }
        
        $response = Invoke-WebRequest -Uri "$VERCEL_URL/api/profile" -Method GET -Headers $headers -ErrorAction Stop
        Write-Host "✅ 프로필 조회 성공!" -ForegroundColor Green
        Write-Host "응답:" -ForegroundColor Cyan
        $response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
    } catch {
        Write-Host "❌ 프로필 조회 실패: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.Exception.Response) {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $responseBody = $reader.ReadToEnd()
            Write-Host "상세 에러: $responseBody" -ForegroundColor Red
        }
    }
} else {
    Write-Host "⏭️ 토큰이 없어 프로필 테스트를 건너뜁니다." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✨ 테스트 완료!" -ForegroundColor Green
Write-Host ""
Write-Host "💡 팁: 마이그레이션 후에도 에러가 발생하면" -ForegroundColor Yellow
Write-Host "   Vercel 함수를 재배포하세요: vercel --prod --force" -ForegroundColor Yellow

