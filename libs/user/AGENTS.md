<!-- Parent: ../../CLAUDE.md -->
<!-- Generated: 2026-03-11 -->

# 사용자 도메인 (User Domain)

## 목적
인증, 사용자 프로필, 팔로우/언팔로우 — 백엔드 API와 프론트엔드 UI 모두 포함.

## 하위 디렉토리

| 디렉토리 | Nx 프로젝트 | 목적 |
|----------|-----------|------|
| `api/handlers/` | user-api-handlers | REST 컨트롤러 — 인증, 프로필, 팔로우 엔드포인트 |
| `api/shared/` | user-api-shared | TypeORM 엔티티 + 서비스 (User, Follow) + JWT 전략 + 가드 |
| `api-interfaces/` | user-api-interfaces | DTO 및 API 요청/응답 계약 |
| `feature/` | user-feature | Angular 컴포넌트 (로그인, 회원가입, 프로필, 설정) |
| `shared/` | user-shared | 프론트엔드 HTTP 서비스 + 라우트 가드 |

## 백엔드 아키텍처

### 엔티티 (api/shared/)

| 엔티티 | 파일 | 주요 필드 | 관계 |
|--------|------|----------|------|
| User | `user.entity.ts` | email (고유), username (고유), password, bio, image | 게시글, 댓글, 팔로우 다수 보유 |
| Follow | `follow.entity.ts` | followerId, followedId | User 자기 참조 관계 |

### 서비스 (api/shared/)

- **UserService**: 실질적 비즈니스 로직을 가진 유일한 서비스
  - `login(email, password)`: bcrypt 비교 + JWT 생성
  - `register(data)`: bcrypt 해싱 + 사용자 등록
  - `updateUserInfo(id, data)`: 비밀번호 변경 시 조건부 bcrypt 해싱
  - `findOne()`, `getProfile()`, `getJwtInfo()`: 관계 포함 쿼리
  - **의존성**: `Repository<User>`, `JwtService`, `FollowService`, `bcrypt` (네이티브 모듈)
- **FollowService**: 순수 `BaseService<Follow>` 위임 (커스텀 로직 없음)

### JWT 및 인증 (api/shared/)

| 파일 | 목적 |
|------|------|
| `jwt-strategy/jwt.strategy.ts` | Passport JWT 전략 — 토큰에서 사용자 추출 |
| `jwt-strategy/jwt-auth.guard.ts` | 전역 가드 (APP_GUARD) — 모든 요청에서 JWT 검증 |
| `roles.guard.ts` | 역할 기반 가드 (정의되어 있으나 현재 미사용) |
| `roles.ts` | Roles enum 및 @Roles() 데코레이터 |
| `skip-auth.ts` | `@SkipAuth()` 데코레이터 — 공개 엔드포인트에서 JWT 가드 우회 |

### 컨트롤러 (api/handlers/)

`UserApiHandlersController`:

| 메서드 | 엔드포인트 | 인증 | 설명 |
|--------|----------|------|------|
| POST | `/users/login` | @SkipAuth | 로그인 (이메일 + 비밀번호) |
| POST | `/users` | @SkipAuth | 회원가입 |
| GET | `/user` | 필수 | 현재 사용자 정보 조회 |
| PUT | `/users` | 필수 | 사용자 설정 수정 |
| GET | `/profiles/:username` | 선택 | 사용자 프로필 조회 |
| POST | `/profiles/:username/follow` | 필수 | 팔로우 |
| DELETE | `/profiles/:username/follow` | 필수 | 언팔로우 |

## 프론트엔드 아키텍처 (feature/)

| 컴포넌트 | 라우트 | 목적 |
|----------|-------|------|
| LoginComponent | `/login` | 이메일 + 비밀번호 로그인 폼 |
| RegisterComponent | `/register` | 회원가입 폼 |
| ProfileComponent | `/profile/:username` | 사용자 프로필 + 작성/좋아요 게시글 탭 + 팔로우 버튼 |
| SettingComponent | `/settings` | 사용자 설정 편집 (이미지, 사용자명, 자기소개, 이메일, 비밀번호) |
| AuthContainerComponent | (래퍼) | 인증 페이지 레이아웃 래퍼 |

### 프론트엔드 서비스 (shared/)
- `UserService` — `BaseDataService<User>` 상속, 로그인/회원가입/사용자 CRUD
- `ProfileService` — `BaseDataService<Profile>` 상속, 프로필 + 팔로우/언팔로우
- `AuthGuardService` — 라우트 가드, 미인증 사용자를 /login으로 리다이렉트
- `NotAuthGuardService` — 라우트 가드, 인증된 사용자를 로그인/회원가입 페이지에서 리다이렉트
- `AuthUiService` — UI 인증 상태 관리

## AI 에이전트 안내

### 이 디렉토리에서 작업할 때
- **UserService (백엔드)**가 가장 복잡한 서비스 — `bcrypt`는 네이티브 모듈이므로 `jest.mock('bcrypt')`로 목(mock) 처리
- JWT 시크릿은 환경 설정에 있음 (하드코딩 아님)
- `JwtAuthGuard`는 전역 (APP_GUARD) — 새 엔드포인트는 기본적으로 보호됨
- 공개 엔드포인트에는 `@SkipAuth()` 사용
- 프론트엔드 인증 흐름: 로그인 -> localStorage에 JWT 저장 -> TokenInterceptor가 헤더에 추가

### 테스트
```bash
npx nx test user-api-shared         # 백엔드 서비스 + 인증
npx nx test user-api-handlers       # 백엔드 컨트롤러
npx nx test user-feature            # 프론트엔드 컴포넌트
npx nx test user-shared             # 프론트엔드 서비스 + 가드
```

### 의존성
- 백엔드: `@realworld/shared/api/foundation` (BaseService, BaseEntity), `@nestjs/jwt`, `bcrypt`, `passport-jwt`
- 프론트엔드: `@realworld/shared/foundation` (BaseDataService), `@realworld/shared/storage` (JWT 저장소)
