# Vercel 프로덕션 배포 스크립트
# 마이그레이션 후 실행하세요

Write-Host "🚀 Vercel 프로덕션 배포 시작..." -ForegroundColor Cyan
Write-Host ""

Write-Host "📝 체크리스트:" -ForegroundColor Yellow
Write-Host "  [ ] 프로덕션 DB에 마이그레이션 실행 완료?" -ForegroundColor White
Write-Host "  [ ] SQL 실행 결과 확인 완료?" -ForegroundColor White
Write-Host ""

$confirm = Read-Host "계속하시겠습니까? (Y/N)"

if ($confirm -eq "Y" -or $confirm -eq "y") {
    Write-Host ""
    Write-Host "🔄 Vercel 프로덕션에 배포 중..." -ForegroundColor Green
    
    vercel --prod --force
    
    Write-Host ""
    Write-Host "✅ 배포 완료!" -ForegroundColor Green
    Write-Host ""
    Write-Host "💡 다음 단계:" -ForegroundColor Yellow
    Write-Host "  1. 앱 URL 확인: vercel ls" -ForegroundColor White
    Write-Host "  2. 로그 확인: vercel logs --prod" -ForegroundColor White
    Write-Host "  3. API 테스트: .\test-production-api.ps1" -ForegroundColor White
} else {
    Write-Host "❌ 배포가 취소되었습니다." -ForegroundColor Red
}

