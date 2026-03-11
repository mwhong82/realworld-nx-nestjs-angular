# 바이브코딩 마이그레이션 매뉴얼

기존 프로젝트를 AI 주도 개발(바이브코딩) 환경으로 전환하는 단계별 가이드입니다.
실제 RealWorld Nx/NestJS/Angular 모노레포 프로젝트에서 사용된 프롬프트와 결과를 기반으로 작성되었습니다.

## 대상 독자

- AI 에이전트(Claude Code)를 활용한 개발 환경을 구축하려는 개발자
- 기존 레거시 프로젝트를 바이브코딩 환경으로 전환하려는 팀

## 사전 요구사항

- [Claude Code CLI](https://docs.anthropic.com/claude-code) 설치
- Git 저장소가 초기화된 프로젝트
- Node.js + npm 환경
- (선택) [oh-my-claudecode](https://github.com/nicobailon/oh-my-claudecode) — 멀티 에이전트 오케스트레이션

---

## 전체 흐름

```
Phase 0: 도구 설치 및 초기 설정
    ↓
Phase 1: 프로젝트 문서화 (CLAUDE.md, OpenSpec, 스킬)
    ↓
Phase 2: 테스트 인프라 구축 (UT, IT, E2E, Lint)
    ↓
Phase 3: 로컬 자동화 (Git Hooks, pre-commit, pre-push)
    ↓
Phase 4: 코드 리뷰 및 이슈 관리
    ↓
Phase 5: 크리티컬 이슈 수정
```

---

## Phase 0: 도구 설치 및 초기 설정

### 0-1. oh-my-claudecode 설치 (선택)

멀티 에이전트 오케스트레이션이 필요한 경우 OMC를 설치합니다.

```
/oh-my-claudecode:omc-setup
```

> **결과**: HUD 상태바, MCP 서버 설정, OMC CLI 글로벌 설치 완료

### 0-2. OpenSpec 설치 (선택)

스펙 기반 워크플로우를 사용하려면 OpenSpec을 설치합니다.

```
openspec 설치해줘
```

> **결과**: openspec 패키지 설치, `openspec/specs/`, `openspec/changes/` 디렉토리 구조 생성

### 0-3. YOLO 모드 설정 (선택)

반복적인 권한 승인 없이 빠르게 작업하려면:

```bash
claude --dangerously-skip-permissions
```

> **주의**: 모든 도구 실행을 자동 승인합니다. 신뢰할 수 있는 프로젝트에서만 사용하세요.

---

## Phase 1: 프로젝트 문서화

AI 에이전트가 프로젝트를 정확히 이해하려면 체계적인 문서화가 필수입니다.

### 1-1. 심층 인터뷰로 프로젝트 분석

```
이 프로젝트를 바이브코딩을 위한 프로젝트로 전환하려고 해.
문서화 및 테스트, CI/CD까지 진행할 거야.
이를 위한 심층 인터뷰를 진행해줘.
```

> **결과**: AI가 프로젝트를 분석하고 질문을 통해 맥락을 파악합니다.
>
> - 기술 스택, 아키텍처, 도메인 구조 파악
> - 3단계 전환 계획 수립 (문서화 → 테스트 → 자동화)
> - `open-questions.md`에 미결 사항 기록

### 1-2. CLAUDE.md 생성

프로젝트의 "AI 에이전트 가이드"를 작성합니다:

```
openspec을 사용해서 이 프로젝트를 문서화해줘.
문서들 다 한글로 작성해줘.
```

> **결과**: 다음 문서들이 생성됩니다:
> | 파일 | 내용 |
> |------|------|
> | `CLAUDE.md` | 프로젝트 개요, 기술 스택, 아키텍처, 명령어, 코딩 컨벤션, AI 지침 |
> | `openspec/specs/*.md` | 도메인별 API 스펙 (article-api, user-api, shared-foundation) |
> | `docs/api.md` | API 엔드포인트 문서 |
> | `docs/architecture.md` | 아키텍처 문서 |

### 1-3. 문서 정확성 검증

생성된 문서가 실제 코드와 일치하는지 검증합니다:

```
openspec으로 문서화가 잘 된 게 맞나?
```

> **결과**: AI가 문서와 실제 코드를 비교 분석하여 불일치 사항을 보고합니다.
>
> - 함수 시그니처 불일치 → 수정
> - 누락된 섹션 → 추가
> - 정확도: article-api 100%, user-api 87.5%, shared-foundation 99%

### 1-4. 디렉토리별 AGENTS.md 생성 (선택)

각 디렉토리에 AI 에이전트용 가이드를 배치합니다:

```
/oh-my-claudecode:deepinit
```

> **결과**: 각 주요 디렉토리에 `AGENTS.md` 파일 생성. AI가 해당 디렉토리 작업 전 참조.

---

## Phase 2: Claude Code 커스텀 스킬 생성

반복 작업을 자동화하는 프로젝트 전용 스킬을 만듭니다.

### 2-1. 심층 인터뷰 기반 스킬 생성

```
만들어진 문서들을 이용해서 이 프로젝트에서 필요한 클로드 스킬을 공식문서에 따라 만들어줘.
궁금한 게 있으면 AskUserQuestion 도구를 사용해서 심층 인터뷰를 진행해줘.
```

> AI가 다음과 같은 질문을 통해 요구사항을 파악합니다:
>
> - 어떤 작업을 자동화할 것인지?
> - 자동 감지 vs 수동 호출?
> - 마이그레이션 생성이 필요한지?
> - 테스트 자동 생성이 필요한지?

> **결과**: `.claude/skills/` 디렉토리에 SKILL.md 파일들 생성:
> | 스킬 | 용도 |
> |------|------|
> | `/add-endpoint` | 풀스택 API 엔드포인트 추가 |
> | `/add-component` | Angular 컴포넌트/페이지 추가 |
> | `/gen-test` | Jest 유닛 테스트 자동 생성 |
> | `/gen-migration` | TypeORM 마이그레이션 생성 |
> | `/debug` | 버그 진단 및 수정 |
> | `/nx-run` | Nx 명령어 실행 |
> | `/explore-codebase` | 코드베이스 탐색 및 설명 |

### 2-2. 스킬 문서화

```
만들어진 스킬들에 대해서 설명하는 문서 만들어줘
```

> **결과**: `docs/skills.md` — 모든 스킬의 사용법, 예시, 생성 파일 목록을 정리한 가이드 문서

---

## Phase 3: 테스트 인프라 구축

### 3-1. 심층 인터뷰 기반 테스트 생성

```
이 프로젝트에 테스트를 추가하고 싶어.
UT, IT, E2E, Lint까지 테스트를 구현해줘.
추가적으로 맥락을 요청하려면 심층 인터뷰를 진행해.
```

> AI가 확인하는 사항:
>
> - 테스트 범위 (핵심 도메인만? 전체?)
> - DB 연결 필요 여부 (MySQL 없이 mock 사용?)
> - Lint 규칙 (Nx 모듈 경계 규칙 등)
> - 통합 테스트 방식 (service-to-service?)

> **결과**: 321개 테스트 생성
> | 유형 | 파일 수 | 내용 |
> |------|--------|------|
> | 백엔드 서비스 UT | 6 | BaseService mock, 메서드별 happy/error path |
> | 백엔드 컨트롤러 UT | 2 | 서비스 mock, 엔드포인트별 성공/에러 |
> | 통합 테스트 (IT) | 2 | 서비스 간 상호작용 검증 |
> | 가드/전략 테스트 | 3 | JWT 가드, 전략, 역할 가드 |
> | 프론트엔드 서비스 UT | 5 | HttpTestingController 기반 |
> | 프론트엔드 컴포넌트 UT | 5 | TestBed 기반 |
> | 인터셉터 테스트 | 2 | Token, Error 인터셉터 |
> | E2E 스모크 테스트 | 1 | Cypress 기본 검증 |
> | Lint (Nx 경계) | - | eslintrc + nx.json 태그 설정 |

### 3-2. Lint 위반 수정

```
린트 위반 수정하고 추가 테스트도 진행해줘
```

> **결과**: 22개 린트 에러 수정
>
> - Nx 모듈 경계 위반 → nx.json에 `scope:app` 태그 추가
> - `let` → `const` 변환
> - 빈 생성자/require문 eslint-disable 처리

---

## Phase 4: 로컬 자동화 (Git Hooks)

### 4-1. 심층 인터뷰 기반 Git Hook 설계

```
Git Hook을 사용해서 테스트나 검증이 상시 동작하도록 설정하고 싶어.
어떻게 하는 게 좋을지 안을 제시해줘.
맥락을 보강하기 위해서 심층 인터뷰를 사용해.
```

> AI가 확인하는 사항:
>
> - Hook 시점 (pre-commit, pre-push, commit-msg)
> - pre-commit 검사 항목 (ESLint, Prettier, tsc, Nx affected:lint)
> - pre-push 테스트 범위 (affected:test, 전체)
> - 커밋 메시지 규칙 (Conventional Commits)
> - 도구 선택 (Husky + lint-staged)
> - TypeScript 타입 체크 위치 (pre-commit vs pre-push)

### 4-2. 설정 실행

```
진행시켜
```

> **결과**: 다음 파일들이 생성/수정됩니다:
> | 파일 | 내용 |
> |------|------|
> | `.husky/pre-commit` | lint-staged + tsc --noEmit (코드 변경 시만) |
> | `.husky/commit-msg` | commitlint (Conventional Commits) |
> | `.husky/pre-push` | nx affected:lint + affected:test (코드 변경 시만) |
> | `.lintstagedrc.json` | ESLint + Prettier 대상 파일 설정 |
> | `commitlint.config.js` | 커밋 메시지 규칙 |
> | `package.json` | prepare, validate, test:affected, lint:affected 스크립트 |

### 4-3. 바이패스 로직 추가

```
문서처럼 테스트와 직접 상관없는 파일이 변경될 경우 테스트 바이패스해
```

> **결과**: `.ts/.js/.tsx/.jsx` 파일이 없으면 tsc/lint/test를 건너뛰는 로직 추가
>
> ```bash
> # pre-commit 바이패스 예시
> STAGED_CODE=$(git diff --cached --name-only --diff-filter=ACMR | grep -E '\.(ts|js|tsx|jsx)$' || true)
> if [ -n "$STAGED_CODE" ]; then
>   # tsc 실행
> else
>   echo "📄 문서/설정 파일만 변경 — TypeScript 타입 체크 건너뜀"
> fi
> ```

> **주의사항**:
>
> - `npm install --legacy-peer-deps` 필요 (Angular 11 피어 의존성 충돌)
> - `nx affected:lint`가 기존 린트 에러로 실패할 수 있음 → pre-push로 이동 권장

---

## Phase 5: 코드 리뷰 및 이슈 관리

### 5-1. 프로젝트 전체 리뷰

```
이 프로젝트를 리뷰하고 개선할 점을 제안해줘
```

> **결과**: 7개 관점(아키텍처, 코드 품질, 보안, 테스트, DevOps, 성능, 유지보수)에서 분석.
> 우선순위별 개선점 목록 제시.

### 5-2. GitHub 이슈 등록 + 이슈 관리 스킬 생성

```
이슈들을 깃헙 이슈에 등록해줘.
앞서서 이슈 등록에 사용한 프롬프트로 깃헙 이슈 관리 스킬을 만들어줘.
```

> **결과**:
>
> - 라벨 6개 생성 (security, performance, architecture, testing, devops, tech-debt)
> - 이슈 7개 등록 (#2~#8, 심각도별 분류)
> - `/manage-issues` 스킬 생성 (이슈 생성/업데이트/닫기 워크플로우)

### 5-3. 인수 조건 검증 규칙

```
작업 완료 후, 이슈 업데이트 시에는 인수 조건을 확인하도록 스킬을 업데이트해
```

> **결과**: 이슈 닫기 전 인수 조건(Acceptance Criteria) 검증 필수화.
> 미충족 시 이슈를 닫지 않고 진행상황만 업데이트.

---

## Phase 6: 크리티컬 이슈 수정

### 6-1. OpenSpec 기반 병렬 작업

```
크리티컬 이슈들에 대해서 작업 계획을 세우고 병렬로 작업을 진행해.
작업 관련 문서들은 openspec을 사용해서 관리해.
```

> **결과**: 2개 작업을 병렬 에이전트로 동시 실행
>
> **Task 1: 환경변수 기반 설정 전환**
>
> - JWT 시크릿/DB 비밀번호 → `process.env` + fallback
> - `.env.example` 생성, `.gitignore`에 `.env` 추가
> - JWT 만료 `1y` → `1d`, CORS 오리진 제한
>
> **Task 2: 인가 취약점 수정**
>
> - Article update 작성자 검증 추가
> - RolesGuard 인증 우회 차단
> - SQL LIKE 와일드카드 인젝션 방지
>
> **문서**: `openspec/changes/critical-security-fixes.md`에 변경 이력 기록

---

## 체크리스트

### Phase 0: 도구 설치

- [ ] Claude Code CLI 설치
- [ ] oh-my-claudecode 설치 (선택)
- [ ] openspec 설치 (선택)

### Phase 1: 문서화

- [ ] 심층 인터뷰로 프로젝트 분석 완료
- [ ] `CLAUDE.md` 생성 (기술 스택, 아키텍처, 명령어, AI 지침)
- [ ] OpenSpec 스펙 문서 생성
- [ ] 문서 정확성 검증 완료

### Phase 2: 스킬 생성

- [ ] 프로젝트 전용 Claude 스킬 생성
- [ ] 스킬 문서화

### Phase 3: 테스트

- [ ] 유닛 테스트 (서비스, 컨트롤러)
- [ ] 통합 테스트
- [ ] E2E 테스트 (스모크)
- [ ] Lint 규칙 설정 및 위반 수정

### Phase 4: 로컬 자동화

- [ ] Husky + lint-staged + commitlint 설치
- [ ] pre-commit hook (lint + tsc)
- [ ] commit-msg hook (Conventional Commits)
- [ ] pre-push hook (affected:lint + affected:test)
- [ ] 비코드 파일 바이패스 로직

### Phase 5: 리뷰 및 이슈 관리

- [ ] 프로젝트 전체 리뷰
- [ ] GitHub 이슈 등록
- [ ] 이슈 관리 스킬 생성

### Phase 6: 크리티컬 수정

- [ ] 보안 취약점 수정
- [ ] 인수 조건 검증 완료

---

## 트러블슈팅

### npm install 피어 의존성 충돌

```bash
# 해결: --legacy-peer-deps 플래그 사용
npm install --save-dev husky lint-staged --legacy-peer-deps
```

### GitHub CLI PATH 문제 (Windows)

```bash
# gh 명령어를 찾지 못할 때
export PATH="$PATH:/c/Program Files/GitHub CLI"
```

### tsc --noEmit 도움말만 출력

```bash
# 프로젝트 설정 파일을 명시적으로 지정
npx tsc --noEmit -p apps/api/tsconfig.json
```

### nx affected:lint 기존 에러로 실패

기존 프로젝트에 린트 에러가 있으면 pre-commit에서 매번 실패합니다.
→ `nx affected:lint`는 pre-push로 이동하고, pre-commit에는 lint-staged(스테이징 파일만)를 사용하세요.

### Conventional Commits 형식 거부

```bash
# 올바른 형식
git commit -m "feat: 새 기능 추가"
git commit -m "fix: 버그 수정"
git commit -m "docs: 문서 업데이트"

# 잘못된 형식 (거부됨)
git commit -m "새 기능 추가"
git commit -m "Updated docs"
```

---

## 핵심 팁

1. **심층 인터뷰를 활용하세요** — "심층 인터뷰를 진행해줘"를 추가하면 AI가 맥락을 더 정확히 파악합니다.
2. **병렬 작업을 요청하세요** — "병렬로 작업을 진행해"라고 하면 독립적인 작업이 동시에 실행됩니다.
3. **OpenSpec으로 변경을 추적하세요** — 작업 문서를 `openspec/changes/`에 관리하면 이력이 남습니다.
4. **인수 조건을 명시하세요** — 이슈 생성 시 완료 기준을 정의하면 검증이 명확해집니다.
5. **바이패스 로직을 추가하세요** — 문서 변경 시 불필요한 테스트를 건너뛰면 개발 속도가 올라갑니다.
6. **스킬을 만들어 재사용하세요** — 반복 작업은 Claude 스킬로 만들면 프롬프트 한 줄로 실행됩니다.

---

_이 매뉴얼은 실제 프로젝트 전환 과정에서 사용된 프롬프트와 결과를 기반으로 작성되었습니다._
_마지막 업데이트: 2026-03-11_

🤖 Generated with [Claude Code](https://claude.com/claude-code)
