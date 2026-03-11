# Claude Code 스킬 가이드

이 프로젝트에서 사용할 수 있는 Claude Code 커스텀 스킬 목록입니다.
스킬은 `.claude/skills/` 디렉토리에 정의되어 있으며, `/스킬명`으로 수동 호출하거나 자연어 대화에서 자동으로 활성화됩니다.

---

## 개발 생산성 스킬

### `/add-endpoint` — 풀스택 API 엔드포인트 추가

새로운 API 기능을 엔티티부터 프론트엔드까지 한번에 생성합니다.

**자동 감지 키워드:** "엔드포인트 추가", "API 만들기", "새 기능 추가"

**사용 예시:**
```
/add-endpoint article/report 게시글 신고 기능
```

**생성되는 파일:**
| 순서 | 파일 | 설명 |
|------|------|------|
| 1 | `libs/{domain}/api/shared/src/lib/{name}.entity.ts` | TypeORM 엔티티 (BaseEntity 상속) |
| 2 | `libs/{domain}/api/shared/src/lib/{name}.service.ts` | NestJS 서비스 (BaseService<T> 상속) |
| 3 | `libs/{domain}/api-interfaces/src/lib/` | DTO (class-validator 데코레이터) |
| 4 | `libs/{domain}/api/handlers/src/lib/` 컨트롤러에 추가 | NestJS 엔드포인트 |
| 5 | 해당 도메인 module.ts | 엔티티/서비스 등록 |
| 6 | `libs/{domain}/shared/src/lib/{name}.service.ts` | 프론트엔드 서비스 메서드 |
| 7 | `migrations/{timestamp}-{Name}.ts` | TypeORM 마이그레이션 |
| 8 | `libs/{domain}/api/shared/src/lib/{name}.service.spec.ts` | 유닛 테스트 scaffold |

**준수하는 패턴:**
- BaseEntity (UUID, createdAt, updatedAt, deletedDate)
- BaseService<T> (Repository<T> 기반 CRUD)
- @realworld/* 임포트 경로
- IResponse 표준 응답 형식

---

### `/add-component` — Angular 컴포넌트/페이지 추가

Angular 컴포넌트를 생성하고 라우팅, 서비스 연결까지 처리합니다.

**자동 감지 키워드:** "컴포넌트 만들어줘", "페이지 추가", "UI 구현"

**사용 예시:**
```
/add-component article/bookmark 북마크 페이지
```

**생성되는 파일:**
| 순서 | 파일 | 설명 |
|------|------|------|
| 1 | `libs/{domain}/feature/src/lib/{name}/{name}.component.ts` | 컴포넌트 클래스 |
| 2 | `libs/{domain}/feature/src/lib/{name}/{name}.component.html` | 템플릿 (Bootstrap 4) |
| 3 | `libs/{domain}/feature/src/lib/{name}/{name}.component.scss` | 스타일 |
| 4 | feature module에 등록 | declarations, imports |
| 5 | 라우팅 설정 | 지연 로딩, AuthGuard |
| 6 | `{name}.component.spec.ts` | 유닛 테스트 scaffold |

**준수하는 패턴:**
- Bootstrap 4.5 클래스 기반 스타일링
- Angular Reactive Forms
- RxJS Observable + @UntilDestroy() 구독 해제
- @realworld/* 임포트 경로

---

### `/gen-migration` — TypeORM 마이그레이션 생성

DB 스키마 변경을 위한 TypeORM 마이그레이션 파일을 생성합니다.

**실행 방식:** 수동 호출만 (`/gen-migration`으로만 실행, 자동 감지 비활성화)

**사용 예시:**
```
/gen-migration AddReportTable 게시글 신고 테이블 추가
```

**생성되는 파일:**
- `migrations/{timestamp}-{Name}.ts` — up/down 메서드 포함

**지원하는 작업:**
- 새 테이블 생성 (BaseEntity 컬럼 자동 포함)
- 기존 테이블에 컬럼 추가/수정
- 외래키 관계 설정
- 인덱스 추가

**실행 방법:**
```bash
npm run migration:run    # MySQL 서버 필요 (localhost:3306)
```

---

## 테스트 스킬

### `/gen-test` — Jest 유닛 테스트 자동 생성

대상 파일을 분석하여 프로젝트 패턴에 맞는 Jest 유닛 테스트를 생성합니다.

**자동 감지 키워드:** "테스트 만들어줘", "테스트 작성", "커버리지"

**사용 예시:**
```
/gen-test user.service.ts
/gen-test ArticleApiHandlersController
```

**지원하는 대상:**
| 대상 | 테스트 패턴 |
|------|-----------|
| NestJS Service | TestBed + Repository mock + 메서드별 happy/error path |
| NestJS Controller | 서비스 mock + 엔드포인트별 성공/에러 케이스 + 인증 시나리오 |
| Angular Component | TestBed + HttpClientTestingModule + RouterTestingModule |
| Angular Service | HttpTestingController로 HTTP 요청 검증 |
| Guard/Interceptor | 실행 컨텍스트 mock |

**자동 처리되는 특수 mock:**
- `bcrypt` — 네이티브 C++ 애드온이므로 jest.mock 처리
- `JwtService` — sign/verify mock
- `TypeORM Repository` — getRepositoryToken() 사용
- `ConfigurationService` — API URL mock

---

## 디버깅 스킬

### `/debug` — 버그 진단 및 수정

에러를 체계적으로 진단하고 근본 원인을 찾아 수정합니다.

**자동 감지 키워드:** "에러", "버그", "안돼", "왜 안되지", "실패", "디버깅"

**사용 예시:**
```
/debug Cannot find module '@realworld/user/api/shared'
/debug 로그인이 안됩니다
```

**진단 범위:**
| 에러 유형 | 진단 방법 |
|----------|----------|
| 빌드 에러 (TypeScript/Nx) | `tsc --noEmit`, path alias 확인, 순환 의존성 검사 |
| NestJS 런타임 에러 | DI 문제, TypeORM 설정, JWT 가드 확인 |
| Angular 런타임 에러 | HTTP 인터셉터 체인 추적, Observable 구독 누수, 라우팅 가드 |
| 테스트 에러 (Jest) | mock 설정, TestBed 구성, deprecated 설정 확인 |
| DB 에러 | ormconfig.js 설정, 마이그레이션 상태, 스키마 비교 |

**프로젝트 알려진 이슈 참조:**
- `app.controller.spec.ts`의 깨진 AppService 참조
- `conduit-e2e`의 정의되지 않은 cy.login
- jest.config의 deprecated `tsConfig` 키

---

## 실행 스킬

### `/nx-run` — Nx 명령어 실행

한국어 또는 영어 입력을 Nx 명령어로 변환하여 실행합니다.

**자동 감지 키워드:** "빌드해줘", "테스트 돌려", "린트", "실행", "서브"

**사용 예시:**
```
/nx-run test article-api-shared
/nx-run 전체 테스트
/nx-run 빌드 api
```

**명령어 매핑:**
| 입력 | 실행되는 Nx 명령어 |
|------|------------------|
| "빌드" / "build" | `npx nx build {project} --prod` |
| "테스트" / "test" | `npx nx test {project}` |
| "전체 테스트" | `npx nx run-many --target=test --all --parallel` |
| "린트" / "lint" | `npx nx lint {project}` |
| "실행" / "서브" | `npx nx serve {project}` |
| "영향받은" / "affected" | `npx nx affected:{target}` |
| "그래프" | `npx nx dep-graph` |

**주요 프로젝트명:**
- Apps: `api`, `conduit`, `conduit-e2e`
- Article: `article-api-handlers`, `article-api-shared`, `article-feature`, `article-shared`
- User: `user-api-handlers`, `user-api-shared`, `user-feature`, `user-shared`
- Shared: `shared-api-core`, `shared-api-foundation`, `shared-foundation`, `shared-core` 등

---

## 탐색 스킬

### `/explore-codebase` — 코드베이스 탐색 및 설명

코드 구조, 동작 방식, 파일 위치 등을 탐색하고 한국어로 설명합니다.

**자동 감지 키워드:** "어떻게 동작해", "코드 설명", "구조가 어떻게", "어디에 있어"

**사용 예시:**
```
/explore-codebase JWT 인증 흐름
/explore-codebase 게시글 작성 시 태그는 어떻게 처리되나요?
```

**탐색 가능한 질문 유형:**
- **아키텍처:** 모노레포 구조, 도메인 경계, 의존성 규칙
- **기능:** 특정 기능의 전체 코드 흐름 (엔티티 → 서비스 → 컨트롤러 → 프론트)
- **위치:** 특정 클래스/함수/파일이 어디에 있는지
- **패턴:** 프로젝트에서 사용하는 설계 패턴 설명

**참조 문서:**
- `CLAUDE.md` — 프로젝트 전체 가이드
- `openspec/specs/*.md` — 도메인별 API 스펙
- `docs/api.md` — API 엔드포인트 문서
- `docs/architecture.md` — 아키텍처 문서

---

## OpenSpec 워크플로우 스킬 (기존)

### `/openspec-explore` — 탐색 모드
아이디어 탐색, 문제 조사, 요구사항 명확화를 위한 사고 파트너 모드. 코드를 읽고 분석하지만 **구현하지 않습니다**.

### `/openspec-propose` — 변경 제안
새로운 변경을 제안합니다. 설계, 스펙, 작업 목록을 한번에 생성합니다.

### `/openspec-apply-change` — 변경 적용
OpenSpec 변경의 작업(task)을 구현합니다.

### `/openspec-archive-change` — 변경 아카이브
완료된 변경을 아카이브합니다.

**OpenSpec 워크플로우 순서:**
```
/openspec-explore → /openspec-propose → /openspec-apply-change → /openspec-archive-change
```

---

## 시작하기

### 사전 조건
- Claude Code가 `realworldNxNestJs/` 디렉토리에서 실행되어야 합니다:
  ```bash
  cd C:\dev\vibecoding\project1\realworldNxNestJs
  claude
  ```

### 스킬 호출 방법

1. **수동 호출:** `/스킬명 인자`를 입력
   ```
   /add-endpoint user/notification 알림 기능
   ```

2. **자동 감지:** 자연어로 요청하면 관련 스킬이 자동 활성화
   ```
   사용자: "게시글 북마크 API를 만들어줘"
   → add-endpoint 스킬 자동 활성화
   ```

3. **자동완성:** `/`를 입력하면 사용 가능한 스킬 목록이 표시됩니다
