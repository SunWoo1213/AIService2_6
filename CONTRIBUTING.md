# 기여 가이드 🤝

이 프로젝트에 기여해주셔서 감사합니다!

## 개발 환경 설정

1. 저장소 포크 및 클론
2. 의존성 설치: `npm install`
3. 환경 변수 설정: `.env.local` 파일 생성
4. 데이터베이스 마이그레이션: `npm run db:migrate`
5. 개발 서버 실행: `npm run dev`

## 커밋 메시지 규칙

```
feat: 새로운 기능 추가
fix: 버그 수정
docs: 문서 수정
style: 코드 포맷팅, 세미콜론 누락 등
refactor: 코드 리팩토링
test: 테스트 코드 추가
chore: 빌드 업무, 패키지 매니저 설정 등
```

예시:
```
feat: 면접 녹음 일시정지 기능 추가
fix: S3 업로드 실패 시 에러 처리 개선
```

## Pull Request 절차

1. Feature 브랜치 생성: `git checkout -b feature/your-feature`
2. 변경사항 커밋: `git commit -m "feat: ..."`
3. 브랜치 푸시: `git push origin feature/your-feature`
4. Pull Request 생성

## 코드 스타일

- TypeScript 사용
- ESLint 규칙 준수
- Prettier 포맷팅 (선택사항)
- 의미있는 변수명 사용

## 이슈 리포팅

버그나 기능 제안은 GitHub Issues를 통해 등록해주세요.

**버그 리포트 템플릿:**
- 발생 환경 (OS, 브라우저 등)
- 재현 방법
- 예상 동작 vs 실제 동작
- 스크린샷 (가능한 경우)

