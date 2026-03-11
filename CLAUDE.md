# RealWorld Nx/NestJS/Angular 모노레포 - AI 에이전트 가이드

## 프로젝트 개요

RealWorld "Conduit" — Medium.com 클론 애플리케이션. Nx 모노레포로 구성된 NestJS 백엔드 + Angular 프론트엔드 풀스택 프로젝트.
[RealWorld 스펙](https://github.com/gothinkster/realworld)을 준수하며 CRUD, 인증, 소셜 기능을 구현.

## 기술 스택 (변경 금지)

| 계층         | 기술                         | 버전                           |
| ------------ | ---------------------------- | ------------------------------ |
| 프론트엔드   | Angular                      | 11.2                           |
| 백엔드       | NestJS                       | 7.0                            |
| 모노레포     | Nx                           | 11.5.2                         |
| ORM          | TypeORM                      | 0.2.31                         |
| 데이터베이스 | MySQL                        | 2.18.1 (드라이버)              |
| 인증         | JWT + Passport + bcrypt      | passport-jwt 4.0, bcrypt 5.0.1 |
| 테스팅       | Jest + Cypress               | Jest 26.2.2, Cypress 6.0       |
| 린팅         | ESLint + Prettier            |                                |
| 언어         | TypeScript                   | 4.0.3                          |
| UI           | Bootstrap 4.5 + ng-bootstrap |                                |

## 모노레포 구조

```
apps/
  api/              NestJS 백엔드 API (포트 3000)
  conduit/          Angular 프론트엔드 SPA (포트 4200)
  conduit-e2e/      Cypress E2E 테스트

libs/
  article/          게시글 도메인
    api/handlers/     REST 컨트롤러 (게시글, 댓글, 좋아요, 태그)
    api/shared/       TypeORM 엔티티 + 서비스 (Article, Comment, Favorite, Tag)
    api-interfaces/   DTO 및 API 계약
    feature/          Angular 컴포넌트 (홈, 에디터, 게시글 뷰, 목록)
    shared/           프론트엔드 서비스 + 인터페이스

  user/             사용자/인증 도메인
    api/handlers/     REST 컨트롤러 (인증, 프로필, 팔로우)
    api/shared/       TypeORM 엔티티 + 서비스 (User, Follow) + JWT/가드
    api-interfaces/   DTO 및 API 계약
    feature/          Angular 컴포넌트 (로그인, 회원가입, 프로필, 설정)
    shared/           프론트엔드 서비스 + 라우트 가드

  shared/           공통 모듈
    api/              백엔드: config, constants, core, error-handler, foundation, validations
    client-server/    공유 인터페이스 (HTTP 타입, 응답 계약)
    (프론트엔드)/     configuration, interceptors, directives, foundation, storage, logging 등
```

## 핵심 아키텍처 패턴

### 백엔드 (NestJS)

- **BaseEntity** (`libs/shared/api/foundation/src/lib/base.ts`): UUID 기본키, createdAt, updatedAt, deletedDate (소프트 삭제)
- **BaseService<T>** (`libs/shared/api/foundation/src/lib/base.service.ts`): `public repository: Repository<T>`를 통한 제네릭 CRUD — findAll, count, findOne, insert, update, softDelete
- 모든 도메인 서비스가 BaseService를 상속 (ArticleService, CommentService, FavoriteService, TagService, UserService, FollowService)
- **주의**: 컨트롤러가 `service.repository`에 직접 접근하여 복잡한 쿼리 수행 (예: ArticleApiHandlersController의 `createQueryBuilder`)
- **모듈 계층**: AppModule -> SharedApiCoreModule (TypeORM, config, error handler) + UserApiHandlersModule + ArticleApiHandlersModule

### 프론트엔드 (Angular)

- **BaseService** (`libs/shared/foundation/src/lib/service/base.service.ts`): HttpClient 래퍼 + IConfigurationService
- **BaseDataService<T>**가 BaseService를 상속: 제네릭 CRUD HTTP 작업
- 모든 프론트엔드 서비스가 BaseDataService를 상속
- **SharedCoreModule.forRoot(environment)**: 설정, 인터셉터, 에러 핸들링 초기화
- HTTP 인터셉터 7개: token, error, loading, caching, logging, notification, timeout

### 인증 체계

- `@nestjs/jwt` + `passport-jwt`를 통한 JWT 인증
- `JwtAuthGuard`가 전역 APP_GUARD로 적용
- `@SkipAuth()` 데코레이터로 공개 엔드포인트에서 인증 우회
- `RolesGuard`는 역할 기반 접근 제어용 (현재 컨트롤러에서 미사용)
- 프론트엔드: `TokenInterceptor`가 localStorage에서 JWT 주입, `AuthGuardService`/`NotAuthGuardService`로 라우트 보호

### 데이터베이스

- MySQL `localhost:3306`, 데이터베이스 `realworld_db`, 사용자 `root`
- 설정 파일: `ormconfig.js` (루트) — `synchronize: false`, `migrationsRun: false`
- 마이그레이션 6개: `migrations/` (User, Article, Comment, Tag, Favorite, Follow)
- 마이그레이션 실행: `npm run migration:run`
- 샘플 데이터: `realworld-dump-data-exported.sql`

## npm 스코프 및 임포트

- 스코프: `@realworld`
- 임포트 패턴: `@realworld/{도메인}/{계층}` (예: `@realworld/article/api/shared`, `@realworld/user/feature`)
- 경로 별칭: `tsconfig.base.json`에 정의

## Nx 태그 및 의존성 규칙

```
scope:domain  — article/*, user/* (도메인 전용 코드)
scope:shared  — shared/* (공통 유틸리티)
type:feature  — *-handlers, *-feature (사이드 이펙트가 있는 진입점)
type:lib      — *-shared, *-interfaces (순수 로직, 사이드 이펙트 없음)
```

**참고**: `shared-client-server`와 `shared-constants`는 `domain:shared` 태그 사용 (nx.json의 불일치).

## 필수 명령어

```bash
# 개발
npm run serve:api              # NestJS 백엔드 시작
npm run serve:conduit          # Angular 프론트엔드 시작 (포트 4200)
npm run serve:api-conduit      # 백엔드 + 프론트엔드 동시 시작

# 빌드
npm run build-prod:api         # API 프로덕션 빌드
npm run build-prod:conduit     # 프론트엔드 프로덕션 빌드

# 테스트
npm test                       # 테스트 실행
npm run e2e                    # Cypress E2E 테스트 실행

# 데이터베이스
npm run migration:run          # TypeORM 마이그레이션 실행

# 코드 품질
npm run lint                   # ESLint 실행
npx nx format:write            # Prettier 자동 포맷
npm run validate               # lint-staged + tsc 병렬 실행
npm run test:affected          # 변경된 프로젝트만 테스트 (master 기준)
npm run lint:affected          # 변경된 프로젝트만 린트 (master 기준)

# Nx 유틸리티
npx nx dep-graph               # 의존성 그래프 시각화
npx nx affected:test           # 변경된 프로젝트만 테스트
npx nx run-many --target=test --all --parallel  # 전체 테스트
```

## Git Hooks (Husky)

| Hook           | 실행 내용                                                             | 도구                      |
| -------------- | --------------------------------------------------------------------- | ------------------------- |
| **pre-commit** | ESLint + Prettier (스테이징 파일) → tsc --noEmit (api + conduit 병렬) | lint-staged, concurrently |
| **commit-msg** | Conventional Commits 형식 검증 (`feat:`, `fix:`, `docs:` 등)          | commitlint                |
| **pre-push**   | nx affected:lint + nx affected:test (병렬, master 기준)               | Nx, concurrently          |

- 설정 파일: `.lintstagedrc.json`, `commitlint.config.js`, `.husky/`
- Hook 우회: `git commit --no-verify` (긴급 시에만 사용)
- `npm install` 후 `husky`가 `prepare` 스크립트로 자동 설치됨

## 코딩 컨벤션

- **언어**: TypeScript strict 모드
- **네이밍**: 클래스/인터페이스는 PascalCase, 메서드/변수는 camelCase
- **모듈**: 각 기능/서비스마다 별도 NestJS/Angular 모듈
- **익스포트**: 각 라이브러리의 `index.ts`를 통한 배럴 익스포트
- **엔티티**: BaseEntity 상속, TypeORM 데코레이터 사용
- **서비스**: BaseService<T> 상속, TypeORM을 통해 Repository<T> 주입
- **컨트롤러**: NestJS 데코레이터 사용 (@Get, @Post 등), IResponse 타입 반환
- **프론트엔드 컴포넌트**: 지연 로딩 모듈, Bootstrap 4 스타일링
- **응답 형식**: `{ item/items, ...metadata }` 표준 응답 타입으로 래핑

## 알려진 이슈

- `app.controller.spec.ts`가 존재하지 않는 `AppService`를 참조 (깨진 테스트)
- `conduit-e2e/app.spec.ts`가 정의되지 않은 `cy.login` 명령 호출 (깨진 E2E)
- `passWithNoTests: true`가 angular.json에 전역 설정 (34개 프로젝트)
- jest.config 파일들이 deprecated된 `tsConfig` 키 사용 (`tsconfig`으로 변경 필요)
- nx.json 태그 불일치: `scope:shared` vs `domain:shared`

## AI 에이전트 지침

### 해야 할 것

- 디렉토리 수정 전 해당 AGENTS.md 먼저 읽기
- 기존 패턴 준수 (BaseService, BaseEntity, 모듈 구조)
- `@realworld/*` 임포트 경로 사용 (라이브러리 간 상대 경로 금지)
- 변경 후 `npx nx test <프로젝트명>`으로 테스트
- Nx 라이브러리 경계 준수 (scope/type 태그)
- 독립적인 작업은 병렬로 수행 (예: 여러 파일 읽기, 여러 테스트 실행, 여러 에이전트 탐색 등 의존성이 없는 작업은 동시에 실행)

### 하지 말아야 할 것

- 의존성 버전 업그레이드
- 마이그레이션 없이 데이터베이스 스키마 수정
- 앱 간 직접 임포트 (libs를 중간 계층으로 사용)
- 라이브러리 간 순환 의존성 생성
- 프로덕션 자격 증명이 포함된 `ormconfig.js` 커밋

## OpenSpec 연동

- 스펙 디렉토리: `openspec/specs/`
- 변경 디렉토리: `openspec/changes/`
- 워크플로우: `/opsx:explore` -> `/opsx:propose` -> `/opsx:apply` -> `/opsx:archive`
