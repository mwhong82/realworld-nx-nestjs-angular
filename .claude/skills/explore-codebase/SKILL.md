---
name: explore-codebase
description: 코드베이스를 탐색하고 설명합니다. 코드 이해, 아키텍처 파악, 특정 기능의 동작 방식 확인이 필요할 때 사용하세요. "어떻게 동작해", "코드 설명", "구조가 어떻게", "어디에 있어" 같은 요청에 자동으로 활성화됩니다.
argument-hint: [질문 또는 탐색 대상]
allowed-tools: Read, Glob, Grep, Bash, Agent
---

# 코드베이스 탐색

$ARGUMENTS 에 대해 코드베이스를 탐색하고 설명합니다.

## 참조 문서

탐색 전 다음 문서를 참고합니다:
- `CLAUDE.md` — 프로젝트 전체 가이드 (한국어)
- `openspec/specs/article-api.md` — 게시글 API 스펙
- `openspec/specs/user-api.md` — 사용자 API 스펙
- `openspec/specs/shared-foundation.md` — 공유 Foundation 스펙
- `docs/api.md` — API 엔드포인트 문서
- `docs/architecture.md` — 아키텍처 문서

## 탐색 방식

### 아키텍처 질문
- Nx 모노레포 구조 (apps vs libs)
- 도메인 경계 (article, user, shared)
- 의존성 규칙 (scope/type 태그)
- 데이터 흐름 (Frontend → API → Service → TypeORM → MySQL)

### 특정 기능 질문
- 해당 기능의 전체 코드 흐름 추적
- 관련 파일 목록 (entity → service → controller → frontend)
- 비즈니스 로직 설명

### 파일/코드 위치 질문
- Glob/Grep으로 빠르게 검색
- 관련 barrel export (index.ts) 확인
- tsconfig.base.json의 path alias 참조

## 출력 형식
- ASCII 다이어그램으로 구조 시각화
- 코드 흐름은 단계별로 설명
- 관련 파일 경로 명시
- 모든 설명은 한국어로 출력
