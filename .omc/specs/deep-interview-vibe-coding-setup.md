# Deep Interview Spec: 바이브 코딩 프로젝트 전환

## Metadata
- Interview ID: di-vibecoding-2026-03-11
- Rounds: 7
- Final Ambiguity Score: 14.0%
- Type: brownfield
- Generated: 2026-03-11
- Threshold: 20%
- Status: PASSED

## Clarity Breakdown
| Dimension | Score | Weight | Weighted |
|-----------|-------|--------|----------|
| Goal Clarity | 0.95 | 35% | 0.333 |
| Constraint Clarity | 0.80 | 25% | 0.200 |
| Success Criteria | 0.80 | 25% | 0.200 |
| Context Clarity | 0.85 | 15% | 0.128 |
| **Total Clarity** | | | **0.860** |
| **Ambiguity** | | | **14.0%** |

## Goal
Nx/NestJS/Angular RealWorld 모노레포를 AI-주도 개발(바이브 코딩) 환경으로 전환한다. AI(Claude Code)가 문서만 읽고도 프로젝트를 이해하고, 전체 개발 사이클(기능 추가, 버그 수정, 리팩토링, 테스트 작성)을 자연어 명령으로 수행할 수 있도록 문서화, 테스트, 로컬 자동화 파이프라인을 구축한다.

## Constraints
- 기존 기술 스택 유지 (Angular 11, NestJS 7, Nx 11.5, TypeORM, MySQL)
- 업그레이드 없음 — 현재 버전 그대로 작업
- 문서화를 최우선으로 진행, 테스트는 후속, CI/CD는 마지막
- CI/CD는 로컬 자동화만 우선 구축 (GitHub Actions 등 클라우드 CI는 후순위)
- OpenSpec 기반 spec-driven 워크플로우 활용

## Non-Goals
- 기술 스택 업그레이드 (Angular/NestJS/Nx 버전업)
- 클라우드 배포 파이프라인 구축 (이번 단계에서)
- 새로운 비즈니스 기능 추가
- 데이터베이스 마이그레이션 또는 스키마 변경

## Acceptance Criteria

### Phase 1: 문서화 (최우선)
- [ ] 프로젝트 루트에 CLAUDE.md 생성 — AI 작업 가이드 (기술 스택, 컨벤션, 금지사항, 워크플로우)
- [ ] 각 주요 디렉토리에 AGENTS.md 생성 (apps/api, apps/conduit, libs/article, libs/user, libs/shared)
- [ ] OpenSpec specs 작성 — 도메인별 명세 (User, Article, Comment, Tag, Favorite, Follow)
- [ ] README.md 정비 — 프로젝트 개요, 아키텍처, 설정 방법, 개발 가이드
- [ ] API 문서화 — Swagger/OpenAPI 또는 마크다운 기반 API 엔드포인트 명세
- [ ] 아키텍처 문서 — Nx 모노레포 구조, 도메인 경계, 데이터 플로우 다이어그램
- [ ] openspec/config.yaml에 프로젝트 context 추가 (기술 스택, 컨벤션)

### Phase 2: 테스트
- [ ] NestJS 백엔드 유닛 테스트 — 모든 서비스/컨트롤러/가드 (커버리지 80%+)
- [ ] Angular 프론트엔드 유닛 테스트 — 컴포넌트/서비스 (커버리지 80%+)
- [ ] E2E 테스트 — Cypress 기반 핵심 사용자 시나리오 (회원가입, 로그인, 글 CRUD, 댓글, 팔로우)
- [ ] 테스트 실행 자동화 — npm 스크립트로 전체 테스트 한 번에 실행 가능

### Phase 3: 로컬 자동화
- [ ] 로컬 pre-commit 훅 — lint + format 자동 실행
- [ ] 로컬 pre-push 훅 — 테스트 자동 실행
- [ ] npm 스크립트 정비 — build, test, lint, format, e2e 등 일관된 명령어 체계
- [ ] (후순위) GitHub Actions 워크플로우 — PR 시 테스트/린트/빌드 자동 실행

## Assumptions Exposed & Resolved
| Assumption | Challenge | Resolution |
|------------|-----------|------------|
| 바이브 코딩 = 빠른 프로토타이핑 | Goal 질문으로 명확화 | AI-주도 개발 환경 구축이 핵심 |
| 모든 것을 동시에 해야 한다 | Contrarian mode로 우선순위 도전 | 문서화 → 테스트 → CI/CD 순서로 단계별 진행 |
| 스택 업그레이드가 필요하다 | 제약조건 확인 | 현재 스택 유지, 업그레이드 제외 |
| CI/CD는 GitHub Actions 필수 | Simplifier mode로 복잡도 축소 | 로컬 자동화 우선, 클라우드 CI는 후순위 |
| 테스트는 백엔드만 | 테스트 범위 확인 | 프론트+백 전체 커버리지 80%+ 목표 |

## Technical Context (Brownfield)

### 현재 프로젝트 구조
```
realworldNxNestJs/
├── apps/
│   ├── api/              (NestJS 7 백엔드 — 메인 API 서버)
│   ├── conduit/          (Angular 11 프론트엔드 — Medium 클론)
│   └── conduit-e2e/      (Cypress E2E — 설정만 존재, 테스트 코드 없음)
├── libs/
│   ├── article/          (Article 도메인 — handlers, interfaces, feature, shared)
│   ├── user/             (User 도메인 — handlers, interfaces, feature, shared)
│   └── shared/           (24개 공유 라이브러리 — api, config, core, error-handler 등)
├── migrations/           (TypeORM MySQL 마이그레이션 6개)
├── jest.config.js        (34개 프로젝트 설정, 실제 테스트 거의 없음)
├── angular.json          (Nx/Angular CLI 설정)
├── nx.json               (Nx 워크스페이스 설정)
└── ormconfig.js          (MySQL TypeORM 설정 — localhost:3306)
```

### 기술 스택
- **Frontend:** Angular 11.2, ng-bootstrap, Bootstrap 4.5, RxJS 6.6
- **Backend:** NestJS 7.0, TypeORM 0.2.31, MySQL
- **Build:** Nx 11.5.2, Jest 26.2.2, Cypress 6.0
- **Auth:** JWT (Passport.js, @nestjs/jwt, bcrypt)
- **Code Quality:** ESLint, Prettier, TypeScript 4.0

### OpenSpec 통합
- openspec/ 디렉토리 초기화 완료 (config.yaml, specs/, changes/)
- .claude/commands/opsx/ — explore, propose, apply, archive 명령어 등록
- .claude/skills/openspec-* — 4개 스킬 등록

## Ontology (Key Entities)
| Entity | Fields | Relationships |
|--------|--------|---------------|
| User | id, username, email, password, bio, image | has many Articles, Comments, Follows |
| Article | id, slug, title, description, body, createdAt, updatedAt | belongs to User, has many Comments, Tags, Favorites |
| Comment | id, body, createdAt | belongs to User, Article |
| Tag | id, name | many-to-many with Article |
| Favorite | id | belongs to User, Article |
| Follow | id, followerId, followingId | self-referential User relationship |

## Execution Order
```
Phase 1: 문서화 (최우선)
  1.1 CLAUDE.md 생성 (프로젝트 루트)
  1.2 AGENTS.md 생성 (주요 디렉토리별)
  1.3 OpenSpec config.yaml 업데이트
  1.4 OpenSpec 도메인 스펙 작성
  1.5 README.md 정비
  1.6 API 문서화
  1.7 아키텍처 문서

Phase 2: 테스트
  2.1 NestJS 백엔드 유닛 테스트
  2.2 Angular 프론트엔드 유닛 테스트
  2.3 Cypress E2E 테스트
  2.4 테스트 실행 자동화

Phase 3: 로컬 자동화
  3.1 Husky + lint-staged (pre-commit)
  3.2 pre-push 테스트 훅
  3.3 npm 스크립트 정비
  3.4 (후순위) GitHub Actions
```

## Interview Transcript
<details>
<summary>Full Q&A (7 rounds)</summary>

### Round 1
**Q:** "바이브 코딩을 위한 프로젝트로 전환"이라고 하셨는데, 여기서 '바이브 코딩'이 의미하는 것이 정확히 무엇인가요?
**A:** AI-주도 개발 환경 구축
**Ambiguity:** 71.5% (Goal: 0.5, Constraints: 0.1, Criteria: 0.1, Context: 0.4)

### Round 2
**Q:** AI(Claude Code)가 이 프로젝트에서 주로 어떤 작업을 수행하게 될 것으로 예상하시나요?
**A:** 전체 개발 사이클
**Ambiguity:** 63.0% (Goal: 0.7, Constraints: 0.1, Criteria: 0.1, Context: 0.5)

### Round 3
**Q:** 기존 기술 스택(Angular 11, NestJS 7, Nx 11.5)을 유지하나요, 최신 버전으로 업그레이드도 범위에 포함하나요?
**A:** 현재 스택 유지
**Ambiguity:** 54.0% (Goal: 0.7, Constraints: 0.4, Criteria: 0.1, Context: 0.6)

### Round 4
**Q:** 이 전환이 완료되었을 때 '성공'이라고 판단할 수 있는 구체적인 기준이 뭔가요?
**A:** 둘 다 + 자동화 파이프라인 (문서로 이해 → 코드 수정 → 테스트 자동 실행 → CI/CD 배포)
**Ambiguity:** 40.5% (Goal: 0.8, Constraints: 0.4, Criteria: 0.5, Context: 0.6)

### Round 5 (Contrarian Mode)
**Q:** 문서화 + 테스트 + CI/CD 모두를 한번에 하려는 것은 범위가 너무 클 수 있습니다. 우선순위를 정한다면?
**A:** 문서화 우선
**Ambiguity:** 34.7% (Goal: 0.85, Constraints: 0.5, Criteria: 0.5, Context: 0.7)

### Round 6 (Simplifier Mode)
**Q:** 문서화 작업의 구체적 범위는? AI 가이드만 vs OpenSpec까지 vs 개발자 문서까지?
**A:** AI 가이드 + OpenSpec + 개발자 문서 (전체)
**Ambiguity:** 28.0% (Goal: 0.9, Constraints: 0.6, Criteria: 0.6, Context: 0.7)

### Round 7
**Q:** CI/CD 구축 시 어떤 플랫폼? 배포 대상은?
**A:** 로컬만 (CI/CD 나중에)
**Ambiguity:** 21.5% (Goal: 0.9, Constraints: 0.8, Criteria: 0.6, Context: 0.8)

### Round 8
**Q:** 테스트 커버리지 목표와 우선 영역은?
**A:** 프론트+백 전체, 커버리지 80%+
**Ambiguity:** 14.0% (Goal: 0.95, Constraints: 0.8, Criteria: 0.8, Context: 0.85)

</details>
