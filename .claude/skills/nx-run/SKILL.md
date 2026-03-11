---
name: nx-run
description: Nx 명령어를 실행합니다. 빌드, 테스트, 린트, 서브 등 Nx 워크스페이스 작업을 수행할 때 사용하세요. "빌드해줘", "테스트 돌려", "린트", "실행", "서브" 같은 요청에 자동으로 활성화됩니다.
argument-hint: [target] [project] [options]
allowed-tools: Bash, Read, Glob
---

# Nx 명령어 실행

$ARGUMENTS 을 Nx 명령어로 실행합니다.

## 프로젝트 매핑

### Apps
| 이름 | 프로젝트명 | 설명 |
|------|-----------|------|
| API | `api` | NestJS 백엔드 (포트 3000) |
| Conduit | `conduit` | Angular 프론트엔드 (포트 4200) |
| E2E | `conduit-e2e` | Cypress E2E 테스트 |

### Libs (주요)
| 도메인 | 프로젝트명 | 타입 |
|--------|-----------|------|
| Article | `article-api-handlers` | feature |
| Article | `article-api-shared` | lib |
| Article | `article-api-interfaces` | lib |
| Article | `article-feature` | feature |
| Article | `article-shared` | lib |
| User | `user-api-handlers` | feature |
| User | `user-api-shared` | lib |
| User | `user-api-interfaces` | lib |
| User | `user-feature` | feature |
| User | `user-shared` | lib |
| Shared | `shared-api-core`, `shared-api-foundation`, `shared-foundation`, `shared-core` 등 | lib |

## 주요 명령어

```bash
# 서브 (개발 서버)
npx nx serve api                    # 백엔드만
npx nx serve conduit --port 4200    # 프론트엔드만
npm run serve:api-conduit           # 동시 실행

# 빌드
npx nx build api --prod
npx nx build conduit --prod

# 테스트
npx nx test {project}               # 단일 프로젝트
npx nx run-many --target=test --all --parallel  # 전체
npx nx affected:test                # 변경된 것만

# 린트
npx nx lint {project}
npx nx run-many --target=lint --all

# 의존성 그래프
npx nx dep-graph
```

## 명령어 해석 규칙

사용자 입력을 Nx 명령어로 변환합니다:
- "빌드" / "build" → `npx nx build {project} --prod`
- "테스트" / "test" → `npx nx test {project}`
- "전체 테스트" → `npx nx run-many --target=test --all --parallel`
- "린트" / "lint" → `npx nx lint {project}`
- "실행" / "서브" / "serve" → `npx nx serve {project}`
- "영향받은" / "affected" → `npx nx affected:{target}`
- "그래프" / "dep-graph" → `npx nx dep-graph`

## 실행 결과
- 명령어 실행 결과를 한국어로 요약
- 에러 발생 시 원인 분석 및 해결 방법 안내
- 장시간 실행 명령은 백그라운드로 실행
