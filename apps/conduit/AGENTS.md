<!-- Parent: ../../CLAUDE.md -->
<!-- Generated: 2026-03-11 -->

# Conduit (Angular 프론트엔드)

## 목적
Angular 11 SPA — Medium.com 클론 UI. 지연 로딩(lazy loading) 기능 모듈과 Bootstrap 4 스타일링으로 구성.

## 주요 파일

| 파일 | 설명 |
|------|------|
| `src/main.ts` | Angular 앱 부트스트랩 |
| `src/app/app.module.ts` | 루트 모듈: BrowserModule + HttpClientModule + SharedCoreModule.forRoot() |
| `src/app/app-routing.module.ts` | 최상위 라우팅 (지연 로딩 기능 모듈) |
| `src/app/app.component.ts` | 루트 컴포넌트 (최소 셸) |
| `src/app/layout/layout.module.ts` | 레이아웃 셸: 네비게이션 바 + 푸터 + router-outlet |
| `src/app/layout/navbar/navbar.component.ts` | 인증 상태에 따른 네비게이션 바 |
| `src/app/layout/footer/footer.component.ts` | 푸터 컴포넌트 |
| `src/styles.scss` | 글로벌 스타일 (Bootstrap 임포트) |
| `src/environments/environment.ts` | 개발 설정 (API 기본 URL) |

## 라우팅 구조

```
/                     → LayoutModule (지연 로딩)
├── /                   → HomeModule (@realworld/article/feature) — 게시글 피드
├── /login              → LoginModule (@realworld/user/feature)
├── /register           → RegisterModule (@realworld/user/feature)
├── /settings           → SettingModule (@realworld/user/feature)
├── /editor             → EditorModule (@realworld/article/feature)
├── /article/:slug      → ViewArticleModule (@realworld/article/feature)
└── /profile/:username  → ProfileModule (@realworld/user/feature)
```

## AI 에이전트 안내

### 이 디렉토리에서 작업할 때
- 이 앱은 얇은 셸이다. 기능 컴포넌트는 `libs/article/feature/`와 `libs/user/feature/`에 있다.
- 여기서는 라우팅이나 레이아웃 컴포넌트(navbar, footer)만 수정.
- `SharedCoreModule.forRoot(environment)`가 모든 공유 서비스를 초기화 — 프로바이더 중복 선언 금지.
- `app.component.spec.ts`는 deprecated된 `async` 유틸리티 사용 중 (Angular 11에서는 `waitForAsync` 권장).

### 테스트
```bash
npx nx test conduit
npx nx serve conduit    # http://localhost:4200에서 수동 테스트
```

### 의존성
- `@realworld/shared/core` — 공유 모듈 초기화
- `@realworld/article/feature` — 게시글 페이지 (지연 로딩)
- `@realworld/user/feature` — 사용자 페이지 (지연 로딩)
- 전체 기능 사용 시 API 백엔드 실행 필요

## 스타일링
- `styles.scss`를 통한 Bootstrap 4.5
- Angular 네이티브 Bootstrap 컴포넌트용 ng-bootstrap
- 컴포넌트별 SCSS 파일
