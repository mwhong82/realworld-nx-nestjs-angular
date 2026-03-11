<!-- Parent: ../../CLAUDE.md -->
<!-- Generated: 2026-03-11 -->

# API (NestJS 백엔드)

## 목적
NestJS 7 REST API 서버. 백엔드의 진입점으로, 모듈을 조립하여 포트 3000에서 HTTP 엔드포인트를 제공한다.

## 주요 파일

| 파일 | 설명 |
|------|------|
| `src/main.ts` | NestJS 앱 부트스트랩 (글로벌 프리픽스, CORS, 유효성 검사 파이프) |
| `src/app/app.module.ts` | 루트 모듈: SharedApiCoreModule + UserApiHandlersModule + ArticleApiHandlersModule 조립 |
| `src/app/app.controller.ts` | 루트 컨트롤러 (헬스 체크) |
| `src/environments/environment.ts` | 개발 환경 설정 |
| `src/environments/environment.prod.ts` | 프로덕션 환경 설정 |

## 모듈 계층 구조

```
AppModule
├── SharedApiCoreModule (@realworld/shared/api/core)
│   ├── TypeOrmModule.forRoot()    ← ormconfig.js 사용
│   ├── SharedApiConfigModule
│   ├── SharedApiErrorHandlerModule
│   └── SharedApiValidationsModule
├── UserApiHandlersModule (@realworld/user/api/handlers)
│   └── UserApiSharedModule (엔티티 + 서비스 + JWT)
└── ArticleApiHandlersModule (@realworld/article/api/handlers)
    └── ArticleApiSharedModule (엔티티 + 서비스)
```

## AI 에이전트 안내

### 이 디렉토리에서 작업할 때
- 이 앱은 얇은 셸(thin shell)이다 — 대부분의 로직은 `libs/`에 있다. `app.module.ts`에서 기능 모듈 추가/제거만 수정.
- 환경 설정은 Angular 스타일의 `environment.ts` / `environment.prod.ts` 패턴을 따른다.
- `app.controller.spec.ts`는 **깨진 상태** (존재하지 않는 `AppService` 임포트) — 수정 또는 삭제 필요.

### 테스트
```bash
npx nx test api
npx nx serve api          # 수동 테스트
```

### 의존성
- `@realworld/shared/api/core` — TypeORM, 설정, 에러 핸들링
- `@realworld/user/api/handlers` — 사용자/인증 엔드포인트
- `@realworld/article/api/handlers` — 게시글/댓글/태그 엔드포인트
- 데이터베이스: 루트의 `ormconfig.js`를 통한 MySQL
