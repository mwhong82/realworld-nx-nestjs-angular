# RealWorld Nx/NestJS/Angular 모노레포 - AI 주도 개발 환경 전환 계획

**생성일:** 2026-03-11
**모드:** Ralplan Consensus (--direct)
**복잡도:** HIGH
**예상 범위:** 3개 Phase, ~80+ 파일 생성/수정

---

## 1. RALPLAN-DR Summary

### Guiding Principles (지도 원칙)

1. **Documentation-First (문서 우선):** 코드를 수정하기 전에 먼저 문서화하여 AI 에이전트가 코드베이스를 정확히 이해할 수 있는 context를 확보한다.
2. **Incremental Safety (점진적 안전성):** 기존 코드를 변경하지 않고 문서/테스트/자동화를 추가한다. 기존 스택(Angular 11, NestJS 7, Nx 11.5)을 그대로 유지한다.
3. **Domain-Driven Organization (도메인 중심 구조):** 기존 Nx 모노레포의 scope(domain/shared)와 type(feature/lib) 체계를 존중하며 문서와 테스트를 구성한다.
4. **Spec-Driven Workflow (스펙 중심 워크플로우):** OpenSpec config를 활용하여 도메인 스펙을 체계적으로 관리하고, 스펙에서 테스트로 이어지는 일관된 흐름을 유지한다.
5. **Local-First Automation (로컬 우선 자동화):** GitHub Actions 전에 로컬 git hooks와 npm scripts로 품질 게이트를 먼저 구축한다.

### Decision Drivers (핵심 결정 요인)

1. **AI Agent Context Quality:** CLAUDE.md, AGENTS.md가 정확해야 AI 에이전트(executor, verifier 등)가 올바른 작업을 수행할 수 있다.
2. **Test Coverage ROI:** 34개 Jest project가 설정되어 있으나 실제 테스트는 거의 없다 (spec 파일 3개, 모두 scaffold). Backend service/controller 테스트가 가장 높은 ROI를 제공한다.
3. **Developer Experience:** Pre-commit/pre-push hooks가 빌드 깨짐을 방지하고, 통합된 npm scripts가 일관된 개발 경험을 제공한다.

### Viable Options

#### Option A: Phase-Sequential (권장)
Phase 1 (문서화) 완료 후 Phase 2 (테스트), 그 다음 Phase 3 (자동화) 순차 실행.

| Pros | Cons |
|------|------|
| 각 Phase가 다음 Phase의 기반이 됨 | 전체 완료까지 시간이 더 걸림 |
| AI context가 확보된 상태에서 테스트 작성 가능 | Phase 간 의존성으로 병렬화 제한 |
| 리스크 격리 (문서 오류가 테스트에 영향 안줌) | |

#### Option B: Parallel-Streams (대안)
Phase 1과 Phase 2를 동시 진행. CLAUDE.md/AGENTS.md는 먼저 작성하되, OpenSpec 스펙과 테스트를 병렬로 진행.

| Pros | Cons |
|------|------|
| 전체 완료 시간 단축 | AI context 미완성 상태에서 테스트 작성 시 재작업 위험 |
| 독립적 작업자에게 분배 용이 | 도메인 스펙과 테스트 간 불일치 가능 |
| | 조율 비용 증가 |

**선택: Option A (Phase-Sequential)**
- 이유: 문서화가 최우선이라는 제약조건과 일치. AI context 품질이 후속 작업의 정확도를 결정. Option B의 재작업 리스크가 시간 절약을 상쇄.

---

## 2. ADR (Architecture Decision Record)

**Decision:** Phase-Sequential 접근법으로 문서화 -> 테스트 -> 로컬 자동화 순서 진행
**Drivers:** AI context 품질, 테스트 정확도, 기존 스택 유지 제약
**Alternatives Considered:** Parallel-Streams (위 참조)
**Why Chosen:** 문서 우선 제약조건 부합, 재작업 최소화, 각 Phase가 명확한 완료 기준 보유
**Consequences:** 전체 일정이 순차적으로 길어질 수 있으나, 각 Phase의 품질이 보장됨
**Follow-ups:** Phase 3 완료 후 GitHub Actions CI/CD 별도 계획 수립

---

## 3. Detailed Implementation Plan

### Phase 1: Documentation (문서화)

#### Task 1.1: CLAUDE.md 작성 [Size: M]
**경로:** `realworldNxNestJs/CLAUDE.md`
**의존성:** 없음 (첫 번째 작업)
**병렬 가능:** Task 1.2와 병렬 불가 (CLAUDE.md가 AGENTS.md의 기반)

**작업 내용:**
- 프로젝트 개요 (Nx monorepo, RealWorld spec 준수)
- 기술 스택 명세 (Angular 11.2, NestJS 7.0, Nx 11.5.2, TypeORM 0.2.31, MySQL, Jest 26, Cypress 6)
- 모노레포 구조 설명 (apps/ vs libs/, scope/type 태깅 체계)
- 핵심 도메인: User, Article (Comment, Tag, Favorite, Follow 포함)
- 빌드/실행 명령어 (`npm run serve:api-conduit`, `npm run migration:run` 등)
- 코딩 컨벤션 (ESLint, Prettier 설정 참조)
- DB 설정 (ormconfig.js, MySQL, TypeORM migrations)
- 인증 체계 (JWT/Passport, SkipAuth decorator)
- npmScope: `@realworld`
- 라이브러리 의존성 규칙 (nx.json tags 기반)

**Acceptance Criteria:**
- [ ] CLAUDE.md가 프로젝트 루트에 존재
- [ ] 기술 스택, 빌드 명령어, 도메인 구조가 정확히 기술됨
- [ ] AI 에이전트가 CLAUDE.md만으로 프로젝트 구조를 파악할 수 있는 수준

#### Task 1.2: AGENTS.md 작성 (5개 디렉토리) [Size: M]
**경로:**
- `realworldNxNestJs/apps/api/AGENTS.md`
- `realworldNxNestJs/apps/conduit/AGENTS.md`
- `realworldNxNestJs/libs/article/AGENTS.md`
- `realworldNxNestJs/libs/user/AGENTS.md`
- `realworldNxNestJs/libs/shared/AGENTS.md`

**의존성:** Task 1.1 (CLAUDE.md 스타일 참조)
**병렬 가능:** 5개 파일 서로 병렬 작성 가능

**작업 내용 (각 AGENTS.md):**
- 해당 디렉토리의 목적과 책임
- 하위 모듈/라이브러리 목록과 역할
- 주요 파일 경로 및 설명
- 의존성 관계 (imports, exports)
- 테스트 실행 방법
- 변경 시 주의사항

**apps/api/AGENTS.md 핵심:**
- NestJS 7 backend app, `AppModule` -> `SharedApiCoreModule` + `UserApiHandlersModule` + `ArticleApiHandlersModule`
- Entry: `main.ts`, Controller: `app.controller.ts`
- 환경설정: `environments/`

**apps/conduit/AGENTS.md 핵심:**
- Angular 11 SPA, `AppModule` -> `SharedCoreModule` + `AppRoutingModule`
- Layout 컴포넌트 구조
- 환경설정: `environments/`

**libs/article/AGENTS.md 핵심:**
- 4개 하위 라이브러리: `api/handlers` (Controller), `api/shared` (Entity, Service), `api-interfaces` (DTO), `feature` (Angular components), `shared` (Frontend services)
- Entity: Article, Comment, Favorite, Tag
- API endpoints: articles CRUD, comments CRD, tags R, favorites CD

**libs/user/AGENTS.md 핵심:**
- 4개 하위 라이브러리: `api/handlers` (Controller), `api/shared` (Entity, Service, JWT, Guards), `api-interfaces` (DTO), `feature` (Angular components), `shared` (Frontend services)
- Entity: User, Follow
- API endpoints: auth (login, register), user CRUD, profiles, follow/unfollow
- JWT strategy, roles guard, skip-auth decorator

**libs/shared/AGENTS.md 핵심:**
- 17개 하위 라이브러리 (api 6개 + client 11개)
- API 측: config, constants, core, error-handler, foundation (BaseEntity, BaseService), validations
- Client 측: client-server (HTTP types, response interfaces), configuration, interceptors (7개), storage, logging, etc.

**Acceptance Criteria:**
- [ ] 5개 AGENTS.md 파일이 지정된 경로에 존재
- [ ] 각 파일이 해당 디렉토리의 모듈 구조, 의존성, 핵심 파일을 정확히 기술
- [ ] AI 에이전트가 AGENTS.md를 읽고 해당 영역의 코드를 수정할 수 있는 충분한 context 제공

#### Task 1.3: OpenSpec 도메인 스펙 작성 [Size: L]
**경로:** `openspec/specs/` 디렉토리 하위
- `openspec/specs/user.md`
- `openspec/specs/article.md`
- `openspec/specs/comment.md`
- `openspec/specs/tag.md`
- `openspec/specs/favorite.md`
- `openspec/specs/follow.md`

**의존성:** Task 1.1 (도메인 이해 기반)
**병렬 가능:** 6개 스펙 서로 병렬 작성 가능

**각 스펙 포함 내용:**
- Entity 정의 (필드, 타입, 제약조건) - 실제 TypeORM entity 기반
- API endpoints (HTTP method, path, request/response 형식)
- 비즈니스 로직 규칙
- 관계 (다른 도메인과의 참조)
- 에러 케이스

**핵심 매핑 (실제 코드 기반):**
- User: `user.entity.ts` -> email(unique), username(unique), password, bio, image + BaseEntity
- Article: `article.entity.ts` -> slug(unique), title, description, body, authorId, tagList(json) + BaseEntity
- Comment: `comment.entity.ts` -> body, authorId, articleSlug + BaseEntity
- Tag: `tag.entity.ts` -> name, count + BaseEntity
- Favorite: `favorite.entity.ts` -> userId, articleSlug + BaseEntity
- Follow: `follow.entity.ts` -> followerId, followedId + BaseEntity

**Acceptance Criteria:**
- [ ] 6개 도메인 스펙 파일이 openspec/specs/에 존재
- [ ] 각 스펙의 Entity 정의가 실제 TypeORM entity와 일치
- [ ] API endpoint 정의가 실제 controller와 일치

#### Task 1.4: OpenSpec config.yaml 업데이트 [Size: S]
**경로:** `openspec/config.yaml`
**의존성:** Task 1.3 (스펙 파일 목록 확정 후)

**작업 내용:**
- context 섹션에 기술 스택 정보 추가
- 도메인 스펙 파일 참조 추가
- 프로젝트 컨벤션 (conventional commits, Nx tags 등) 추가

**Acceptance Criteria:**
- [ ] config.yaml에 context 섹션이 완성됨
- [ ] 기술 스택, 도메인 목록, 컨벤션이 기술됨

#### Task 1.5: README.md 개선 [Size: S]
**경로:** `realworldNxNestJs/readme.md`
**의존성:** Task 1.1 (CLAUDE.md와 정보 일관성)
**병렬 가능:** Task 1.3, 1.4와 병렬 가능

**작업 내용:**
- 기존 내용 유지하되 구조 개선
- Architecture 섹션 추가 (Nx 모노레포 다이어그램, 도메인 경계)
- Development Guide 섹션 (로컬 개발 환경 설정, 유용한 명령어)
- Testing 섹션 (테스트 실행 방법 - Phase 2 후 업데이트 예정)
- Contributing Guide 기초

**Acceptance Criteria:**
- [ ] README.md에 Architecture, Development Guide 섹션 존재
- [ ] 기존 Getting Started 정보가 보존됨

#### Task 1.6: API Documentation 작성 [Size: M]
**경로:** `realworldNxNestJs/docs/api.md` (신규 디렉토리)
**의존성:** Task 1.3 (OpenSpec 스펙 참조)
**병렬 가능:** Task 1.5와 병렬 가능

**작업 내용:**
- 전체 API endpoint 목록 (controller 코드 기반)
- User API: `POST /users/login`, `POST /users`, `PUT /users`, `GET /user`, `GET /profiles/:username`, `POST /profiles/:username/follow`, `DELETE /profiles/:username/follow`
- Article API: `POST /articles`, `PUT /articles/:slug`, `DELETE /articles/:slug`, `GET /articles/feed`, `GET /articles/:slug`, `GET /articles`
- Comment API: `GET /articles/:slug/comments`, `POST /articles/:slug/comments`, `DELETE /articles/:slug/comments/:id`
- Favorite API: `POST /articles/:slug/favorite`, `DELETE /articles/:slug/favorite`
- Tag API: `GET /tags`
- Request/Response 형식 (IResponse, ActionSuccessResponse, DetailSuccessResponse, ListSuccessResponse)
- 인증 요구사항 (SkipAuth가 없는 endpoint는 JWT 필요)

**Acceptance Criteria:**
- [ ] docs/api.md에 모든 API endpoint가 문서화됨
- [ ] 각 endpoint의 인증 요구사항이 명시됨
- [ ] Request/Response 형식이 실제 코드와 일치

#### Task 1.7: Architecture Documentation 작성 [Size: M]
**경로:** `realworldNxNestJs/docs/architecture.md`
**의존성:** Task 1.1, 1.2 (전체 구조 파악 후)
**병렬 가능:** Task 1.6과 병렬 가능

**작업 내용:**
- Nx 모노레포 구조 다이어그램
- 도메인 경계 (article, user, shared)
- 데이터 흐름 (Frontend -> API -> Service -> TypeORM -> MySQL)
- 라이브러리 의존성 그래프 (nx.json tags 기반 규칙)
- 인증 흐름 (JWT strategy -> guard -> controller)
- Shared 라이브러리 카탈로그 (17개 라이브러리 역할 요약)

**Acceptance Criteria:**
- [ ] docs/architecture.md에 모노레포 구조, 데이터 흐름, 의존성 규칙이 문서화됨
- [ ] 실제 nx.json 태그와 일치하는 의존성 규칙

---

### Phase 2: Testing (테스트)

#### Task 2.1: Backend Unit Test 인프라 설정 [Size: S]
**경로:**
- `realworldNxNestJs/libs/article/api/shared/src/lib/__tests__/` (신규)
- `realworldNxNestJs/libs/user/api/shared/src/lib/__tests__/` (신규)
- 필요 시 jest.config.js 수정

**의존성:** Phase 1 완료 (도메인 이해 확보)
**병렬 가능:** Task 2.2와 병렬 불가 (인프라 먼저)

**작업 내용:**
- NestJS Testing 모듈을 활용한 테스트 헬퍼/팩토리 작성
- TypeORM repository mock 패턴 확립
- 테스트용 fixture/factory (User, Article, Comment 등)
- 기존 `app.controller.spec.ts`의 깨진 참조 수정 (AppService 존재하지 않음)

**Acceptance Criteria:**
- [ ] `npx nx test api` 가 에러 없이 실행됨
- [ ] Mock repository 패턴이 재사용 가능한 형태로 존재
- [ ] 테스트 fixture factory가 도메인 entity별로 존재

#### Task 2.2: Backend Service Unit Tests [Size: L]
**경로:**
- `libs/user/api/shared/src/lib/user.service.spec.ts`
- `libs/user/api/shared/src/lib/follow.service.spec.ts`
- `libs/article/api/shared/src/lib/article.service.spec.ts`
- `libs/article/api/shared/src/lib/comment.service.spec.ts`
- `libs/article/api/shared/src/lib/favorite.service.spec.ts`
- `libs/article/api/shared/src/lib/tag.service.spec.ts`

**의존성:** Task 2.1
**병렬 가능:** 각 service 테스트는 서로 병렬 작성 가능

**작업 내용:**
- UserService: login, register, updateUserInfo, findOne, getProfile, getJwtInfo
- FollowService: insert, softDelete, findAll
- ArticleService: insert, update, findOne, findAll, count, softDelete
- CommentService: insert, findAll, findOne, count, softDelete
- FavoriteService: insert, findOne, count, softDelete
- TagService: insert, findOne, findAll, update, count

**Acceptance Criteria:**
- [ ] 6개 service spec 파일이 존재
- [ ] 각 service의 public 메서드에 대해 최소 happy path + error path 테스트
- [ ] `npx nx test user-api-shared` 및 `npx nx test article-api-shared` 통과

#### Task 2.3: Backend Controller Unit Tests [Size: L]
**경로:**
- `libs/user/api/handlers/src/lib/user-api-handlers.controller.spec.ts`
- `libs/article/api/handlers/src/lib/article-api-handlers.controller.spec.ts`

**의존성:** Task 2.2 (service mock 패턴 확립 후)
**병렬 가능:** 두 controller 테스트 병렬 가능

**작업 내용:**
- UserApiHandlersController: login, register, update, getCurrentUser, getProfile, followAUser, unfollowAUser
- ArticleApiHandlersController: create, update, delete, findBySlug, findAll, findAllFeed, favoriteAnArticle, unfavoriteAnArticle, findAllComments, createAComment, deleteAComment, findAllTags
- 인증/인가 시나리오 (JWT user가 있는/없는 경우)
- NotFoundException, UnauthorizedException 케이스

**Acceptance Criteria:**
- [ ] 2개 controller spec 파일이 존재
- [ ] 각 API endpoint에 대해 성공 + 에러 케이스 테스트
- [ ] `npx nx test user-api-handlers` 및 `npx nx test article-api-handlers` 통과

#### Task 2.4: Frontend Unit Tests [Size: L]
**경로:** 각 Angular component의 동일 디렉토리에 `.spec.ts` 파일
**의존성:** Task 2.1 (테스트 인프라)
**병렬 가능:** Task 2.2, 2.3과 병렬 가능 (frontend/backend 독립)

**우선순위 높은 컴포넌트:**
- `libs/user/feature/src/lib/login/login.component.spec.ts`
- `libs/user/feature/src/lib/register/register.component.spec.ts`
- `libs/user/feature/src/lib/profile/profile.component.spec.ts`
- `libs/user/feature/src/lib/setting/setting.component.spec.ts`
- `libs/article/feature/src/lib/editor/editor.component.spec.ts`
- `libs/article/feature/src/lib/home/home.component.spec.ts`
- `libs/article/feature/src/lib/view-article/view-article.component.spec.ts`
- `libs/article/feature/src/lib/components/list-articles/list-articles.component.spec.ts`

**우선순위 높은 서비스:**
- `libs/user/shared/src/lib/user.service.spec.ts`
- `libs/user/shared/src/lib/profile.service.spec.ts`
- `libs/article/shared/src/lib/article.service.spec.ts`
- `libs/article/shared/src/lib/comment.service.spec.ts`
- `libs/article/shared/src/lib/tag.service.spec.ts`

**작업 내용:**
- Angular TestBed 설정 (HttpClientTestingModule, RouterTestingModule)
- Component 테스트: 렌더링, 사용자 상호작용, 서비스 호출 검증
- Service 테스트: HTTP 요청 mock, 응답 처리 검증
- Shared interceptor 테스트 (token, error, loading 등)

**Acceptance Criteria:**
- [ ] 주요 컴포넌트/서비스에 spec 파일 존재
- [ ] `npx nx test user-feature` 및 `npx nx test article-feature` 통과
- [ ] `npx nx test user-shared` 및 `npx nx test article-shared` 통과

#### Task 2.5: Cypress E2E Tests [Size: L]
**경로:** `apps/conduit-e2e/src/`
**의존성:** Task 2.1 (테스트 인프라), Backend/Frontend 동작 확인
**병렬 가능:** Task 2.2~2.4와 부분 병렬 가능 (E2E는 독립적 시나리오)

**작업 내용:**
- Cypress 설정 정비 (기존 `cypress.json` 검증)
- Custom commands 확장 (`commands.ts`: login, register, createArticle 등)
- 테스트 시나리오:
  - `auth.spec.ts`: 회원가입, 로그인, 로그아웃, 설정 변경
  - `article.spec.ts`: 글 작성, 수정, 삭제, 목록 조회, 페이지네이션
  - `comment.spec.ts`: 댓글 작성, 삭제
  - `profile.spec.ts`: 프로필 조회, 팔로우/언팔로우
  - `feed.spec.ts`: 피드 조회, 태그 필터링, 즐겨찾기

**Acceptance Criteria:**
- [ ] 5개 이상의 E2E spec 파일이 존재
- [ ] `npx nx e2e conduit-e2e` 실행 가능 (MySQL + API 서버 필요 안내 포함)
- [ ] 핵심 사용자 여정 (가입 -> 로그인 -> 글 작성 -> 댓글 -> 팔로우) 커버

#### Task 2.6: 테스트 npm scripts 통합 [Size: S]
**경로:** `realworldNxNestJs/package.json`
**의존성:** Task 2.2~2.5 (테스트 존재 후)

**추가할 scripts:**
```json
"test:api": "nx test api",
"test:conduit": "nx test conduit",
"test:libs": "nx run-many --target=test --all",
"test:all": "nx run-many --target=test --all --parallel",
"test:coverage": "nx run-many --target=test --all --coverage",
"e2e": "nx e2e conduit-e2e"
```

**Acceptance Criteria:**
- [ ] `npm run test:all` 이 전체 유닛 테스트 실행
- [ ] `npm run test:coverage` 가 coverage 리포트 생성

---

### Phase 3: Local Automation (로컬 자동화)

#### Task 3.1: Husky + lint-staged 설정 [Size: S]
**경로:**
- `realworldNxNestJs/package.json` (devDependencies 추가)
- `realworldNxNestJs/.husky/pre-commit`
- `realworldNxNestJs/.husky/pre-push`
- `realworldNxNestJs/.lintstagedrc.json` 또는 package.json 내 설정

**의존성:** Phase 2 완료 (테스트가 존재해야 pre-push에서 실행 가능)

**작업 내용:**
- `husky`, `lint-staged` devDependency 추가
- Pre-commit hook: `lint-staged` (ESLint + Prettier)
- Pre-push hook: `nx affected:test`, `nx affected:lint`
- lint-staged 설정: `*.ts` -> eslint --fix, prettier --write

**Acceptance Criteria:**
- [ ] `git commit` 시 staged 파일에 lint + format 자동 적용
- [ ] `git push` 시 affected 테스트 실행
- [ ] hook 실패 시 commit/push 차단

#### Task 3.2: npm scripts 정리 및 통합 [Size: S]
**경로:** `realworldNxNestJs/package.json`
**의존성:** Task 3.1
**병렬 가능:** Task 3.1과 순차

**작업 내용:**
- 기존 scripts 정리 (중복 제거, 일관된 네이밍)
- 추가 scripts:
  ```json
  "prepare": "husky install",
  "lint:all": "nx run-many --target=lint --all",
  "lint:fix": "nx run-many --target=lint --all -- --fix",
  "format:all": "nx format:write",
  "validate": "npm run lint:all && npm run test:all",
  "dev": "npm run serve:api-conduit"
  ```

**Acceptance Criteria:**
- [ ] `npm run validate` 가 lint + test 전체 실행
- [ ] `npm run dev` 가 개발 서버 시작
- [ ] 모든 npm scripts가 에러 없이 실행 가능

---

## 4. Task Dependency Graph

```
Phase 1 (문서화):
  1.1 CLAUDE.md ─────┬──> 1.2 AGENTS.md (5개) ──> 1.4 config.yaml
                     │
                     ├──> 1.3 OpenSpec 스펙 (6개) ──> 1.4 config.yaml
                     │                            ──> 1.6 API Docs
                     │
                     ├──> 1.5 README.md
                     └──> 1.7 Architecture Docs

Phase 2 (테스트):
  2.1 테스트 인프라 ──┬──> 2.2 Backend Service Tests ──> 2.3 Backend Controller Tests
                     │
                     ├──> 2.4 Frontend Unit Tests
                     │
                     └──> 2.5 Cypress E2E Tests

                     2.2~2.5 완료 ──> 2.6 npm scripts 통합

Phase 3 (자동화):
  3.1 Husky + lint-staged ──> 3.2 npm scripts 정리
```

**병렬 가능 그룹:**
- Phase 1: [1.2의 5개 파일], [1.3의 6개 스펙], [1.5 + 1.6 + 1.7]
- Phase 2: [2.2 + 2.4], [2.3(2.2 완료 후) + 2.5]
- Phase 3: 순차 실행

---

## 5. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| 기존 Jest 설정이 깨져 있을 수 있음 (AppService 참조 오류 등) | HIGH | M | Task 2.1에서 기존 spec 파일 수정 포함 |
| TypeORM entity의 abstract class 패턴으로 테스트 mock이 복잡할 수 있음 | MEDIUM | M | BaseEntity/BaseService 패턴 분석 후 mock factory 설계 |
| Angular 11 + jest-preset-angular 8.x 호환성 이슈 | MEDIUM | M | 기존 tsconfig.spec.json, test-setup.ts 활용 |
| Cypress E2E가 실제 MySQL DB 필요 | HIGH | L | docker-compose 또는 테스트 안내 문서에 사전조건 명시 |
| OpenSpec 스펙과 실제 코드 불일치 | LOW | H | 코드 기반으로 스펙 작성 (reverse engineering), verifier로 검증 |

---

## 6. Testable Acceptance Criteria (Phase별)

### Phase 1 완료 검증
```bash
# 파일 존재 확인
test -f realworldNxNestJs/CLAUDE.md
test -f realworldNxNestJs/apps/api/AGENTS.md
test -f realworldNxNestJs/apps/conduit/AGENTS.md
test -f realworldNxNestJs/libs/article/AGENTS.md
test -f realworldNxNestJs/libs/user/AGENTS.md
test -f realworldNxNestJs/libs/shared/AGENTS.md
test -f openspec/specs/user.md
test -f openspec/specs/article.md
test -f openspec/specs/comment.md
test -f openspec/specs/tag.md
test -f openspec/specs/favorite.md
test -f openspec/specs/follow.md
test -f realworldNxNestJs/docs/api.md
test -f realworldNxNestJs/docs/architecture.md

# config.yaml에 context 존재 확인
grep -q "context:" openspec/config.yaml
```

### Phase 2 완료 검증
```bash
# 테스트 실행
cd realworldNxNestJs
npx nx run-many --target=test --all --parallel

# Coverage 리포트 (80%+ 목표)
npx nx run-many --target=test --all --coverage

# E2E (사전조건: MySQL + API 서버)
npx nx e2e conduit-e2e
```

### Phase 3 완료 검증
```bash
# Husky hooks 존재
test -f realworldNxNestJs/.husky/pre-commit
test -f realworldNxNestJs/.husky/pre-push

# npm scripts 실행
cd realworldNxNestJs
npm run validate
npm run dev  # 서버 시작 확인 후 Ctrl+C
```

---

## 7. Execution Recommendations

1. **Phase 1은 executor (sonnet) 다중 병렬로 실행 가능:** CLAUDE.md 작성 후, AGENTS.md 5개 + OpenSpec 6개를 병렬 executor로 분배
2. **Phase 2는 backend/frontend 2개 스트림으로 분리:** Backend (Task 2.1->2.2->2.3)와 Frontend (Task 2.4) 병렬 진행
3. **Phase 3은 단일 executor로 순차 실행:** 작업량이 적고 의존성이 강함
4. **각 Phase 완료 시 verifier를 통한 검증 필수**
5. **Phase 2의 80% coverage 목표는 점진적:** 초기에는 핵심 service/controller에 집중, 이후 shared 라이브러리로 확장
