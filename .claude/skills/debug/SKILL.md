---
name: debug
description: 버그를 추적하고 수정합니다. 에러 발생, 동작 이상, 빌드 실패 등 문제 해결이 필요할 때 사용하세요. "에러", "버그", "안돼", "왜 안되지", "실패", "디버깅" 같은 요청에 자동으로 활성화됩니다.
argument-hint: [에러 메시지 또는 증상 설명]
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Agent
---

# 디버그 모드

$ARGUMENTS 문제를 진단하고 수정합니다.

## 진단 프로세스

### 1단계: 에러 정보 수집
- 에러 메시지/스택 트레이스 분석
- 관련 파일과 라인 번호 식별
- 에러 발생 컨텍스트 파악 (빌드 타임? 런타임? 테스트?)

### 2단계: 에러 유형별 진단

#### 빌드 에러 (TypeScript/Nx)
```bash
# 타입 체크
npx tsc --noEmit -p tsconfig.base.json

# Nx 빌드
npx nx build {project} --verbose
```
- tsconfig.base.json의 path alias 확인
- 순환 의존성 확인: `npx nx dep-graph`
- 누락된 import/export 확인

#### 런타임 에러 (NestJS)
- AllExceptionsFilter 로그 확인
- 의존성 주입 문제: Module에 provider/import 등록 확인
- TypeORM: 엔티티 등록, 커넥션 설정 확인
- JWT: 토큰 유효성, 가드 설정 확인

#### 런타임 에러 (Angular)
- ErrorHandlerService 로그 확인
- HTTP 인터셉터 체인 추적 (token → logging → caching → loading → timeout → error → notification)
- Observable 구독 누수 확인
- 라우팅 가드 (AuthGuardService, NotAuthGuardService) 확인

#### 테스트 에러 (Jest)
```bash
# 단일 테스트 실행
npx nx test {project} --testFile={filename}

# 상세 출력
npx nx test {project} --verbose
```
- Mock 설정 확인 (특히 bcrypt, JwtService, Repository)
- TestBed 모듈 설정에서 누락된 provider 확인
- jest.config.js의 deprecated `tsConfig` → `tsconfig` 이슈 참고

#### 데이터베이스 에러
- ormconfig.js 설정 확인 (localhost:3306, realworld_db)
- 마이그레이션 상태 확인
- TypeORM 엔티티와 실제 테이블 스키마 비교

### 3단계: 근본 원인 분석
- 코드 흐름 추적 (호출 체인)
- 최근 변경 사항 확인 (git diff)
- 관련 OpenSpec 스펙과 비교

### 4단계: 수정 적용
- 최소한의 변경으로 수정
- 수정 후 관련 테스트 실행
- 사이드 이펙트 확인

## 알려진 이슈 (참고)
- `app.controller.spec.ts`가 존재하지 않는 AppService 참조 — 깨진 테스트
- `conduit-e2e/app.spec.ts`가 정의되지 않은 cy.login 호출 — 깨진 E2E
- jest.config의 deprecated `tsConfig` 키
- nx.json 태그 불일치: `scope:shared` vs `domain:shared`

## 출력
- 진단 결과를 한국어로 설명
- 근본 원인과 수정 방법 제안
- 수정 적용 후 검증 결과 보고
