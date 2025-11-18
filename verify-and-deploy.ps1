# 마이그레이션 검증 및 배포 스크립트

Write-Host "🔍 프로덕션 데이터베이스 상태 확인..." -ForegroundColor Cyan
Write-Host ""

node scripts/check-prod-db.js

Write-Host ""
$confirm = Read-Host "컬럼이 모두 추가되었나요? (Y/N)"

if ($confirm -eq "Y" -or $confirm -eq "y") {
    Write-Host ""
    Write-Host "✅ 좋습니다! Vercel을 재배포합니다..." -ForegroundColor Green
    Write-Host ""
    
    vercel --prod --force
    
    Write-Host ""
    Write-Host "✨ 배포 완료! 이제 에러가 사라져야 합니다." -ForegroundColor Green
    Write-Host ""
    Write-Host "💡 로그 확인:" -ForegroundColor Yellow
    Write-Host "   vercel logs --prod --follow" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "❌ 먼저 Neon Console에서 마이그레이션을 완료하세요:" -ForegroundColor Red
    Write-Host "   https://console.neon.tech" -ForegroundColor White
}

