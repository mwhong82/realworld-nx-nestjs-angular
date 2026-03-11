# 사용자 API 스펙

인증, 사용자 프로필, 팔로우/언팔로우에 대한 API 경계(boundary) 스펙.

## 소스 파일

| 계층 | 경로 |
|------|------|
| 컨트롤러 | `libs/user/api/handlers/src/lib/user-api-handlers.controller.ts` |
| 모듈 | `libs/user/api/handlers/src/lib/user-api-handlers.module.ts` |
| 엔티티 | `libs/user/api/shared/src/lib/user.entity.ts`, `follow.entity.ts` |
| 서비스 | `libs/user/api/shared/src/lib/user.service.ts`, `follow.service.ts` |
| JWT 전략 | `libs/user/api/shared/src/lib/jwt-strategy/` |
| 가드 | `libs/user/api/shared/src/lib/roles.guard.ts`, `skip-auth.ts` |
| DTO | `libs/user/api-interfaces/src/lib/user-api-interfaces.ts` |
| 프론트엔드 서비스 | `libs/user/shared/src/lib/*.service.ts` |
| 프론트엔드 컴포넌트 | `libs/user/feature/src/lib/` |

## 엔티티

### User (사용자)
- **파일**: `user.entity.ts`
- **테이블**: users
- **상속**: BaseEntity (UUID, createdAt, updatedAt, deletedDate)
- **필드**:
  - `email` (문자열, 고유) — 로그인용 이메일
  - `username` (문자열, 고유) — 표시 이름
  - `password` (문자열) — bcrypt 해싱된 비밀번호
  - `bio` (문자열, nullable) — 사용자 자기소개
  - `image` (문자열, nullable) — 프로필 이미지 URL

### Follow (팔로우)
- **파일**: `follow.entity.ts`
- **상속**: BaseEntity
- **필드**:
  - `followerId` (문자열) — User 외래키 (팔로우하는 사용자)
  - `followedId` (문자열) — User 외래키 (팔로우 당하는 사용자)

## API 엔드포인트

### 인증

| 메서드 | 경로 | 인증 | 설명 |
|--------|------|------|------|
| `POST` | `/users/login` | @SkipAuth | 이메일 + 비밀번호로 로그인. JWT 토큰이 포함된 사용자 반환. |
| `POST` | `/users` | @SkipAuth | 신규 사용자 등록. bcrypt로 비밀번호 해싱. JWT 토큰 포함 반환. |

### 현재 사용자

| 메서드 | 경로 | 인증 | 설명 |
|--------|------|------|------|
| `GET` | `/user` | 필수 | JWT 페이로드에서 현재 인증된 사용자 정보 조회. |
| `PUT` | `/users` | 필수 | 사용자 설정 수정 (이메일, 사용자명, 자기소개, 이미지, 비밀번호). 비밀번호 변경 시 재해싱. |

### 프로필

| 메서드 | 경로 | 인증 | 설명 |
|--------|------|------|------|
| `GET` | `/profiles/:username` | 선택 | 사용자 프로필 조회. 인증 시 `following` 상태 포함. |
| `POST` | `/profiles/:username/follow` | 필수 | 사용자 팔로우. Follow 레코드 생성. |
| `DELETE` | `/profiles/:username/follow` | 필수 | 사용자 언팔로우. Follow 레코드 소프트 삭제. |

## 응답 형식

- 사용자: `{ user: { email, username, bio, image, token } }`
- 프로필: `{ profile: { username, bio, image, following } }`

## 인증 흐름

### 백엔드 (JWT)

```
HTTP 요청 → JwtAuthGuard (전역 APP_GUARD)
  ├── @SkipAuth() 있음? → 검증 건너뛰고 → 컨트롤러로
  └── @SkipAuth() 없음 → Authorization 헤더에서 JWT 추출
      ├── 유효한 토큰 → request.user에 사용자 첨부
      └── 유효하지 않음/없음 → 401 Unauthorized
```

| 파일 | 목적 |
|------|------|
| `jwt.strategy.ts` | Passport 전략 — JWT 검증, 페이로드 추출 |
| `jwt-auth.guard.ts` | 전역 가드 — 모든 요청 확인, @SkipAuth 존중 |
| `skip-auth.ts` | `@SkipAuth()` 데코레이터 — 공개 엔드포인트 표시 |
| `roles.guard.ts` | 역할 기반 가드 (정의되어 있으나 컨트롤러에서 미사용) |
| `roles.ts` | `@Roles()` 데코레이터 + Roles enum |

### 프론트엔드 (토큰 관리)

```
로그인/회원가입 → localStorage에 JWT 저장 (user-storage.util.ts)
  → TokenInterceptor가 모든 요청에 "Authorization: Token <jwt>" 추가
  → AuthGuardService가 라우트 보호를 위해 localStorage 확인
  → AuthUiService가 UI 인증 상태 관리
```

## 비즈니스 규칙

1. **비밀번호 해싱**: 모든 비밀번호는 저장 전 `bcrypt`로 해싱. 로그인 검증에 `bcrypt.compare()` 사용.
2. **JWT 생성**: 로그인/회원가입 시 `{ id, email, username }`을 포함한 JWT를 생성하여 응답에 반환.
3. **이메일 고유성**: 이메일은 전체 사용자에서 고유해야 함. 중복 이메일로 회원가입 시 실패.
4. **사용자명 고유성**: 사용자명은 고유해야 함. 중복 사용자명으로 회원가입 시 실패.
5. **자기 팔로우 방지**: 명시적 확인이 없음 — 사용자가 기술적으로 자기 자신을 팔로우 가능 (잠재적 버그).
6. **비밀번호 업데이트**: 수정 요청에 비밀번호 필드가 제공되면 재해싱. 비어있거나 null이면 비밀번호 미변경.
7. **소프트 삭제 팔로우**: 언팔로우 시 하드 삭제가 아닌 소프트 삭제 사용.

## UserService — 주요 메서드

실질적 비즈니스 로직을 가진 유일한 백엔드 서비스 (나머지는 순수 BaseService 위임):

| 메서드 | 로직 | 의존성 |
|--------|------|--------|
| `login(email, password)` | 이메일로 사용자 찾기 → bcrypt.compare → JWT 생성 | Repository, bcrypt, JwtService |
| `register(data)` | bcrypt.hash 비밀번호 → 사용자 등록 → JWT 생성 | Repository, bcrypt, JwtService |
| `updateUserInfo(id, data)` | 비밀번호 제공 시 조건부 bcrypt.hash → 업데이트 | Repository, bcrypt |
| `findOne(conditions)` | 옵션으로 사용자 조회 | Repository (BaseService 경유) |
| `getProfile(requestUserId, user)` | 사용자 조회 + 팔로우 상태 확인 | Repository, FollowService |
| `getJwtInfo(id)` | JWT 갱신용 사용자 데이터 조회 | Repository |

**테스트 참고**: `bcrypt`는 네이티브 C++ 애드온 — 유닛 테스트에서 `jest.mock('bcrypt')`로 목 처리 필수.

## 에러 케이스

| 시나리오 | HTTP 상태 | 응답 |
|----------|----------|------|
| 잘못된 이메일/비밀번호 | 401 | UnauthorizedException |
| 중복 이메일 | 409 | ConflictException |
| 중복 사용자명 | 409 | ConflictException |
| 사용자를 찾을 수 없음 | 404 | NotFoundException |
| JWT 토큰 없음 | 401 | UnauthorizedException |
| 유효하지 않은 JWT 토큰 | 401 | UnauthorizedException |

## 프론트엔드 컴포넌트

| 컴포넌트 | 라우트 | 목적 |
|----------|-------|------|
| LoginComponent | `/login` | 이메일 + 비밀번호 로그인 폼 |
| RegisterComponent | `/register` | 사용자명 + 이메일 + 비밀번호 회원가입 폼 |
| ProfileComponent | `/profile/:username` | 사용자 프로필 + 작성/좋아요 게시글 탭 + 팔로우 버튼 |
| SettingComponent | `/settings` | 사용자 설정 편집 (이미지 URL, 사용자명, 자기소개, 이메일, 새 비밀번호) |
| AuthContainerComponent | (래퍼) | 로그인/회원가입 페이지 레이아웃 래퍼 |

## 프론트엔드 서비스

- `UserService` — `BaseDataService<User>` 상속, 로그인/회원가입/현재사용자/설정수정
- `ProfileService` — `BaseDataService<Profile>` 상속, 프로필 조회/팔로우/언팔로우
- `AuthGuardService` — canActivate 라우트 가드 (미인증 시 /login으로 리다이렉트)
- `NotAuthGuardService` — canActivate 가드 (인증된 사용자를 /login에서 리다이렉트)
- `AuthUiService` — 인증 상태 관리, `isAuthenticated$` 옵저버블 제공
