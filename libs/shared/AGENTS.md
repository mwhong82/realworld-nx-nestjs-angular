<!-- Parent: ../../CLAUDE.md -->
<!-- Generated: 2026-03-11 -->

# 공유 라이브러리 (Shared Libraries)

## 목적
게시글 도메인과 사용자 도메인 양쪽에서 사용되는 공통 모듈. 백엔드(api/)와 프론트엔드 라이브러리로 분리.

## 백엔드 라이브러리 (api/)

| 라이브러리 | Nx 프로젝트 | 임포트 경로 | 목적 |
|-----------|-----------|------------|------|
| `api/config/` | shared-api-config | `@realworld/shared/api/config` | API 설정 서비스 (IApiConfig) |
| `api/constants/` | shared-api-constants | `@realworld/shared/api/constants` | 에러/성공 메시지 상수 |
| `api/core/` | shared-api-core | `@realworld/shared/api/core` | 루트 API 모듈 (TypeORM, 설정, 에러 핸들러, 유효성 검사) |
| `api/error-handler/` | shared-api-error-handler | `@realworld/shared/api/error-handler` | 전역 AllExceptionsFilter |
| `api/foundation/` | shared-api-foundation | `@realworld/shared/api/foundation` | **BaseEntity + BaseService<T>** — 모든 도메인 엔티티/서비스가 상속 |
| `api/validations/` | shared-api-validations | `@realworld/shared/api/validations` | 요청 유효성 검사 파이프 |

### 핵심: Foundation 라이브러리

```typescript
// base.ts — 모든 엔티티가 이것을 상속
abstract class BaseEntity {
  @PrimaryGeneratedColumn("uuid") id?: string;
  @CreateDateColumn() createdAt?: Date;
  @UpdateDateColumn() updatedAt?: Date;
  @DeleteDateColumn() deletedDate?: Date;  // 소프트 삭제
}

// base.service.ts — 모든 서비스가 이것을 상속
abstract class BaseService<T> {
  public repository: Repository<T>  // 주의: public, 컨트롤러에서 직접 접근
  findAll(), count(), findOne(), insert(), update(), softDelete()
}
```

## 클라이언트-서버 공유

| 라이브러리 | 임포트 경로 | 목적 |
|-----------|------------|------|
| `client-server/` | `@realworld/shared/client-server` | HTTP 타입 (메서드, 헤더, 상태 코드) + IResponse 인터페이스 |

주요 인터페이스: `IResponse`, `ActionSuccessResponse`, `DetailSuccessResponse`, `ListSuccessResponse`

## 프론트엔드 라이브러리

| 라이브러리 | 임포트 경로 | 목적 |
|-----------|------------|------|
| `common/` | `@realworld/shared/common` | 공통 Angular 모듈 |
| `configuration/` | `@realworld/shared/configuration` | 앱 설정 서비스 (API URL, 환경) |
| `constants/` | `@realworld/shared/constants` | 전역 프론트엔드 상수 |
| `core/` | `@realworld/shared/core` | **SharedCoreModule** — 모든 것을 초기화하는 루트 모듈 |
| `directives/` | `@realworld/shared/directives` | 폼 디렉티브 (ControlErrorsDirective, FormSubmitDirective) |
| `error-handler/` | `@realworld/shared/error-handler` | 클라이언트측 에러 핸들러 서비스 |
| `foundation/` | `@realworld/shared/foundation` | **BaseService + BaseDataService<T>** — HTTP CRUD 기본 클래스 |
| `interceptors/` | `@realworld/shared/interceptors` | HTTP 인터셉터 7개 (token, error, loading, caching, logging, notification, timeout) |
| `loading/` | `@realworld/shared/loading` | 로딩 상태 관리 |
| `logging/` | `@realworld/shared/logging` | 플러그인 방식 작성자를 가진 로깅 서비스 (console, logentries, loggly) |
| `notification/` | `@realworld/shared/notification` | 알림 서비스 |
| `spinner/` | `@realworld/shared/spinner` | 스피너/로더 UI 컴포넌트 |
| `storage/` | `@realworld/shared/storage` | localStorage 유틸리티 (user-storage, theme-storage) |
| `string-util/` | `@realworld/shared/string-util` | 문자열 유틸리티 함수 |
| `toaster/` | `@realworld/shared/toaster` | 토스트 알림 UI 컴포넌트 |

### 핵심: Foundation 라이브러리 (프론트엔드)

```typescript
// base.service.ts — HTTP 클라이언트 래퍼
class BaseService {
  constructor(http: HttpClient, configurationService: IConfigurationService)
  // GET, POST, PUT, DELETE (설정으로부터 자동 URL 구성)
}

// base-data.service.ts — 모든 프론트엔드 서비스가 이것을 상속
class BaseDataService<T> extends BaseService {
  getAll(), getById(), create(), update(), delete()
}
```

### HTTP 인터셉터 (interceptors/)

SharedInterceptorsModule에서의 실행 순서:
1. `TokenInterceptor` — localStorage에서 JWT를 꺼내 헤더에 주입
2. `LoggingInterceptor` — 요청 메서드, URL, 타이밍 기록
3. `CachingInterceptor` — GET 응답 캐싱
4. `LoadingInterceptor` — 전역 로딩 상태 설정/해제
5. `TimeoutInterceptor` — 요청 타임아웃
6. `ErrorInterceptor` — 에러 처리
7. `NotificationInterceptor` — 사용자에게 에러 알림 표시

## AI 에이전트 안내

### 이 디렉토리에서 작업할 때
- **백엔드 foundation** (base.service.ts, base.ts)은 모든 도메인 서비스/엔티티에 영향 — 여기 변경은 전체에 파급
- **프론트엔드 foundation** (base.service.ts, base-data.service.ts)은 모든 프론트엔드 서비스에 영향
- **인터셉터**는 순서대로 실행 — 새 인터셉터 추가 시 순서에 주의
- **SharedCoreModule.forRoot()**는 한 번만 호출해야 함 (AppModule에서)
- 대부분 얇은 래퍼 — 새 유틸리티 만들기 전에 여기에 이미 존재하는지 확인

### Nx 태그 참고
대부분의 공유 라이브러리는 `scope:shared` 태그를 사용하지만, `client-server`와 `constants`는 `domain:shared`를 사용 (nx.json의 불일치).

### 테스트
```bash
npx nx test shared-api-foundation    # 백엔드 기본 클래스
npx nx test shared-interceptors      # HTTP 인터셉터
npx nx test shared-foundation        # 프론트엔드 기본 클래스
# 모든 공유 라이브러리 테스트:
npx nx run-many --target=test --projects=shared-*
```

### 의존성
- 백엔드: TypeORM, NestJS core
- 프론트엔드: Angular HttpClient, RxJS
- api/와 프론트엔드 공유 라이브러리 간 교차 의존성 없음

<!-- MANUAL: -->
