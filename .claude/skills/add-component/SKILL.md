---
name: add-component
description: Angular 컴포넌트/페이지를 추가합니다. 새 화면, UI 컴포넌트, 페이지를 만들 때 사용하세요. "컴포넌트 만들어줘", "페이지 추가", "UI 구현" 같은 요청에 자동으로 활성화됩니다.
argument-hint: [도메인/컴포넌트명] [설명]
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# Angular 컴포넌트/페이지 추가

$ARGUMENTS 에 대한 Angular 컴포넌트를 생성합니다.

## 사전 확인

1. 기존 컴포넌트 패턴을 파악합니다:
   - `libs/{domain}/feature/src/lib/` 내 기존 컴포넌트 구조 확인
   - 라우팅 모듈 확인
   - 사용 중인 공통 모듈/서비스 확인

2. 대상 도메인을 결정합니다:
   - `article` 도메인: 게시글, 에디터, 피드, 태그 관련 UI
   - `user` 도메인: 로그인, 회원가입, 프로필, 설정 관련 UI
   - `shared` 도메인: 재사용 가능한 공통 컴포넌트

## 생성 파일

### Step 1: Component 파일
- **경로**: `libs/{domain}/feature/src/lib/{name}/`
- `{name}.component.ts` — 컴포넌트 클래스
- `{name}.component.html` — 템플릿 (Bootstrap 4 클래스 사용)
- `{name}.component.scss` — 스타일 (최소화, Bootstrap 활용)

### Step 2: Module 등록
- 해당 feature module에 컴포넌트 declarations 추가
- 필요한 공유 모듈 imports (FormsModule, ReactiveFormsModule 등)

### Step 3: Routing 설정
- 페이지 컴포넌트인 경우 라우트 추가
- 지연 로딩(lazy loading) 패턴 적용
- 인증 가드 필요 시 AuthGuardService canActivate 설정

### Step 4: Service 연결
- 기존 서비스 활용 또는 새 서비스 메서드 추가
- Observable 패턴 사용 (RxJS 6.6)
- @UntilDestroy() 데코레이터로 구독 자동 해제

### Step 5: Unit Test Scaffold
- `{name}.component.spec.ts` 생성
- TestBed, HttpClientTestingModule, RouterTestingModule 설정
- 기본 렌더링 테스트

## 컨벤션
- UI: Bootstrap 4.5 클래스 기반 스타일링
- 폼: Angular Reactive Forms 선호
- 상태: RxJS Observable 패턴
- 임포트: @realworld/* 스코프
- 구독 해제: @UntilDestroy() + @ngneat/until-destroy
- 안내 메시지는 한국어로 출력
