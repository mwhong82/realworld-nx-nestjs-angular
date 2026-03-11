# 아키텍처 문서

## 개요

Nx 모노레포로 구현된 RealWorld "Conduit" 애플리케이션 — NestJS 백엔드와 Angular 프론트엔드를 가진 Medium.com 클론.

## 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────┐
│                     브라우저 (클라이언트)                  │
└──────────────────────────┬──────────────────────────────┘
                           │ HTTP
┌──────────────────────────▼──────────────────────────────┐
│              Angular SPA (포트 4200)                      │
│  ┌─────────────────────────────────────────────────┐    │
│  │ HTTP 인터셉터 (7개):                              │    │
│  │ Token → Logging → Caching → Loading              │    │
│  │ → Timeout → Error → Notification                 │    │
│  └──────────────────────────┬──────────────────────┘    │
│                              │                           │
│  ┌──────────────┐  ┌────────▼────────┐                  │
│  │ 컴포넌트     │  │ 서비스          │                  │
│  │ (feature/)   │◄─┤ (shared/)       │                  │
│  │              │  │ BaseDataService  │                  │
│  └──────────────┘  └────────┬────────┘                  │
└──────────────────────────────┬──────────────────────────┘
                               │ REST API 호출
┌──────────────────────────────▼──────────────────────────┐
│              NestJS API (포트 3000)                       │
│  ┌─────────────────────────────────────────────────┐    │
│  │ JwtAuthGuard (전역 APP_GUARD)                     │    │
│  │ @SkipAuth()로 공개 엔드포인트 우회                  │    │
│  └──────────────────────────┬──────────────────────┘    │
│                              │                           │
│  ┌──────────────┐  ┌────────▼────────┐  ┌───────────┐  │
│  │ 컨트롤러     │  │ 서비스          │  │ 엔티티    │  │
│  │ (handlers/)  │──┤ (api/shared/)   │──┤ TypeORM   │  │
│  │              │  │ BaseService<T>  │  │ BaseEntity│  │
│  └──────────────┘  └────────┬────────┘  └───────────┘  │
└──────────────────────────────┬──────────────────────────┘
                               │ TypeORM
┌──────────────────────────────▼──────────────────────────┐
│                     MySQL 데이터베이스                     │
│  테이블: users, articles, comments, tags,                │
│          favorites, follows                               │
│  deletedDate 컬럼을 통한 소프트 삭제                      │
└─────────────────────────────────────────────────────────┘
```

## Nx 모노레포 구조

### Apps vs Libs

```
apps/    → 배포 가능한 아티팩트 (얇은 셸)
libs/    → 비즈니스 로직 (재사용 가능한 모든 것)
```

앱은 라이브러리를 조합하는 얇은 진입점. 모든 도메인 로직, 서비스, 컴포넌트, 엔티티는 libs에 존재.

### 라이브러리 분류 체계

```
libs/
├── {도메인}/                     scope:domain
│   ├── api/handlers/              type:feature  (NestJS 컨트롤러 + 모듈)
│   ├── api/shared/                type:lib      (엔티티 + 서비스)
│   ├── api-interfaces/            type:lib      (DTO)
│   ├── feature/                   type:feature  (Angular 컴포넌트 + 모듈)
│   └── shared/                    type:lib      (프론트엔드 서비스)
│
└── shared/                       scope:shared
    ├── api/*/                     type:lib      (백엔드 유틸리티)
    ├── client-server/             type:lib      (공유 인터페이스)
    └── */                         type:lib      (프론트엔드 유틸리티)
```

### 의존성 규칙

```
┌─────────────┐     ┌─────────────┐
│   article/  │     │    user/    │
│   도메인     │     │   도메인     │
└──────┬──────┘     └──────┬──────┘
       │                    │
       │    ┌───────────┐   │
       └───►│  shared/  │◄──┘
            │           │
            └───────────┘

규칙:
  도메인 → 공유       ✅ 허용
  공유 → 도메인       ❌ 금지
  도메인 → 도메인     ⚠️ 존재함 (게시글 컨트롤러가 사용자 서비스 임포트)
  api/* → 프론트엔드/* ❌ 금지
```

**도메인 간 의존성**: `ArticleApiHandlersController`가 사용자 도메인에서 `UserService`와 `FollowService`를 임포트. 이것은 아키텍처적 결합 지점.

### Nx 태그

| 프로젝트 | 태그 |
|---------|------|
| `article-api-handlers` | `scope:domain`, `type:feature` |
| `article-api-shared` | `scope:domain`, `type:lib` |
| `user-api-handlers` | `scope:domain`, `type:feature` |
| `user-api-shared` | `scope:domain`, `type:lib` |
| `shared-api-*` | `scope:shared`, `type:lib` |
| `shared-client-server` | `domain:shared`, `type:lib` |
| `shared-constants` | `domain:shared`, `type:lib` |

**참고**: `shared-client-server`와 `shared-constants`는 `scope:shared` 대신 `domain:shared`를 사용 — nx.json의 불일치.

## 백엔드 아키텍처

### 모듈 계층 구조

```
AppModule
├── SharedApiCoreModule
│   ├── TypeOrmModule.forRoot()         ← ormconfig.js
│   ├── SharedApiConfigModule           ← 환경 설정
│   ├── SharedApiErrorHandlerModule     ← AllExceptionsFilter
│   └── SharedApiValidationsModule      ← 유효성 검사 파이프
│
├── UserApiHandlersModule
│   └── UserApiSharedModule
│       ├── TypeOrmModule.forFeature([User, Follow])
│       ├── JwtModule.register({...})
│       ├── PassportModule.register({...})
│       ├── UserService
│       └── FollowService
│
└── ArticleApiHandlersModule
    └── ArticleApiSharedModule
        ├── TypeOrmModule.forFeature([Article, Comment, Favorite, Tag])
        ├── ArticleService
        ├── CommentService
        ├── FavoriteService
        └── TagService
```

### 상속 체인

```
TypeORM 엔티티:
  BaseEntity (UUID, 타임스탬프, 소프트 삭제)
    ├── User
    ├── Follow
    ├── Article
    ├── Comment
    ├── Favorite
    └── Tag

NestJS 서비스:
  BaseService<T> (Repository<T>를 통한 CRUD)
    ├── UserService    ← 커스텀 로직 있음 (bcrypt, JWT)
    ├── FollowService  ← 순수 위임
    ├── ArticleService ← 순수 위임
    ├── CommentService ← 순수 위임
    ├── FavoriteService← 순수 위임
    └── TagService     ← 순수 위임
```

### 인증 흐름

```
HTTP 요청
  │
  ▼
JwtAuthGuard (전역)
  │
  ├── @SkipAuth() 있음? → 건너뛰기 → 컨트롤러
  │
  └── 없음 → "Authorization: Token <jwt>"에서 JWT 추출
       │
       ├── 유효 → JwtStrategy.validate() → 요청에 사용자 첨부
       │
       └── 유효하지 않음 → 401 Unauthorized
```

## 프론트엔드 아키텍처

### 모듈 로딩

```
AppModule (즉시 로딩)
├── BrowserModule
├── HttpClientModule
├── SharedCoreModule.forRoot(environment)   ← 일회성 초기화
└── AppRoutingModule
    └── LayoutModule (지연 로딩)
        ├── HomeModule (지연 로딩)               ← @realworld/article/feature
        ├── LoginModule (지연 로딩)              ← @realworld/user/feature
        ├── RegisterModule (지연 로딩)           ← @realworld/user/feature
        ├── SettingModule (지연 로딩)            ← @realworld/user/feature
        ├── EditorModule (지연 로딩)             ← @realworld/article/feature
        ├── ViewArticleModule (지연 로딩)        ← @realworld/article/feature
        └── ProfileModule (지연 로딩)            ← @realworld/user/feature
```

### 서비스 상속

```
BaseService (HttpClient + ConfigurationService)
  └── BaseDataService<T> (getAll, getById, create, update, delete)
        ├── ArticleService
        ├── CommentService
        ├── TagService
        ├── UserService
        └── ProfileService
```

### HTTP 인터셉터 파이프라인

```
요청 → TokenInterceptor (JWT 추가)
  → LoggingInterceptor (요청 기록)
    → CachingInterceptor (캐시 확인)
      → LoadingInterceptor (스피너 표시)
        → TimeoutInterceptor (타임아웃 설정)
          → HttpClient → NestJS API
        ← ErrorInterceptor (에러 처리)
      ← NotificationInterceptor (에러 토스트 표시)
    ← LoadingInterceptor (스피너 숨김)
  ← LoggingInterceptor (응답 기록)
← 응답을 컴포넌트로
```

## 데이터베이스 스키마

```
┌──────────────┐     ┌──────────────┐
│    users     │     │   follows    │
│   (사용자)    │     │   (팔로우)    │
├──────────────┤     ├──────────────┤
│ id (UUID PK) │◄────┤ followerId   │
│ email        │◄────┤ followedId   │
│ username     │     │ deletedDate  │
│ password     │     └──────────────┘
│ bio          │
│ image        │     ┌──────────────┐
│ createdAt    │     │  favorites   │
│ updatedAt    │     │   (좋아요)    │
│ deletedDate  │◄────┤ userId       │
└──────┬───────┘  ┌──┤ articleSlug  │
       │          │  │ deletedDate  │
       │          │  └──────────────┘
       │          │
       │    ┌─────▼────────┐     ┌──────────────┐
       │    │   articles   │     │    tags       │
       │    │   (게시글)    │     │   (태그)      │
       │    ├──────────────┤     ├──────────────┤
       └───►│ authorId     │     │ name         │
            │ slug (고유)   │     │ count        │
            │ title        │     │ deletedDate  │
            │ description  │     └──────────────┘
            │ body         │
            │ tagList (JSON)│    ┌──────────────┐
            │ createdAt    │    │   comments   │
            │ updatedAt    │    │   (댓글)      │
            │ deletedDate  │◄───┤ articleSlug  │
            └──────────────┘    │ authorId ────┤──► users
                                │ body         │
                                │ deletedDate  │
                                └──────────────┘

모든 테이블: id (UUID), createdAt, updatedAt, deletedDate
문자열 FK로 관계 (TypeORM 릴레이션이 아닌)
deletedDate 컬럼을 통한 소프트 삭제
```

## 설정

### 환경 설정
- **백엔드**: `apps/api/src/environments/environment.ts` (개발), `environment.prod.ts` (프로덕션)
- **프론트엔드**: `apps/conduit/src/environments/environment.ts` (개발), `environment.prod.ts` (프로덕션)

### 데이터베이스 설정
- **파일**: `ormconfig.js` (프로젝트 루트)
- **타입**: MySQL, localhost:3306
- **마이그레이션**: `migrations/` 디렉토리, 수동 실행
- **동기화**: 비활성화 (`synchronize: false`)

### TypeScript 설정
- **기본**: `tsconfig.base.json` — 모든 `@realworld/*` 임포트의 경로 별칭
- **프로젝트별**: `tsconfig.json`, `tsconfig.app.json`, `tsconfig.spec.json`, `tsconfig.lib.json`

## 캐싱 및 빌드

Nx가 다음 작업을 캐시:
- `build`, `lint`, `test`, `e2e`

affected 명령의 기본 브랜치: `master`.

`npx nx dep-graph`로 전체 의존성 그래프를 시각화할 수 있음.
