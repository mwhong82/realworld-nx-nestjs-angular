# 공유 Foundation 스펙

게시글 도메인과 사용자 도메인 양쪽에서 사용되는 공통 기본 클래스, 모듈, 유틸리티.

## 소스 파일

| 계층 | 경로 |
|------|------|
| 백엔드 기본 클래스 | `libs/shared/api/foundation/src/lib/` |
| 백엔드 코어 모듈 | `libs/shared/api/core/src/lib/` |
| 백엔드 설정 | `libs/shared/api/config/src/lib/` |
| 백엔드 에러 핸들러 | `libs/shared/api/error-handler/src/lib/` |
| 백엔드 유효성 검사 | `libs/shared/api/validations/src/lib/` |
| 백엔드 상수 | `libs/shared/api/constants/src/lib/` |
| 클라이언트-서버 공유 | `libs/shared/client-server/src/lib/` |
| 프론트엔드 기본 클래스 | `libs/shared/foundation/src/lib/` |
| 프론트엔드 코어 모듈 | `libs/shared/core/src/lib/` |
| 프론트엔드 설정 | `libs/shared/configuration/src/lib/` |
| 프론트엔드 인터셉터 | `libs/shared/interceptors/src/lib/` |
| 프론트엔드 스토리지 | `libs/shared/storage/src/lib/` |

## 백엔드 Foundation

### BaseEntity (`api/foundation/base.ts`)

추상 클래스 — 모든 TypeORM 엔티티가 이것을 상속:

```
필드:
  id          UUID (자동 생성, PrimaryGeneratedColumn)
  createdAt   Date (생성 시 자동 설정)
  updatedAt   Date (수정 시 자동 설정)
  deletedDate Date (nullable, 소프트 삭제용)
```

### BaseService<T> (`api/foundation/base.service.ts`)

추상 제네릭 서비스 — 모든 백엔드 서비스가 이것을 상속:

```
속성:
  repository: Repository<T>  (public — 주의: 컨트롤러에서 직접 접근)

메서드:
  findAll(options?)      → T[]           여러 엔티티 조회
  count(options?)        → number        엔티티 수 세기
  findOne(conditions?)   → T             단일 엔티티 조회
  insert(data)           → InsertResult  하나 또는 여러 개 삽입
  update(condition, data)→ UpdateResult  조건에 맞는 엔티티 수정
  softDelete(condition)  → UpdateResult  조건에 맞는 엔티티 소프트 삭제
```

모든 메서드는 `this.repository.*()` 로의 단순 위임. 비즈니스 로직 없음.

### 쿼리 매핑 (`api/foundation/map-queries-to-find-many-options.ts`)

HTTP 쿼리 파라미터를 TypeORM `FindManyOptions`로 변환하는 유틸리티. 페이지네이션(limit, offset)과 필터링 처리.

### SharedApiCoreModule (`api/core/`)

백엔드 루트 모듈 — 다음을 초기화:
- `TypeOrmModule.forRoot()` — ormconfig.js를 통한 데이터베이스 연결
- `SharedApiConfigModule.forRoot(environment)` — 설정 서비스
- `SharedApiErrorHandlerModule` — 전역 예외 필터 (AllExceptionsFilter)
- `SharedApiValidationsModule` — 요청 유효성 검사

### AllExceptionsFilter (`api/error-handler/`)

전역 NestJS 예외 필터. 처리되지 않은 모든 예외를 잡아 일관된 에러 응답 형식으로 변환.

### ErrorHandlerService (`error-handler/`) — 프론트엔드

Angular `ErrorHandler` 구현체. 클라이언트측에서 발생하는 처리되지 않은 예외를 잡아 로깅 및 사용자 알림 처리. `SharedErrorHandlerModule`을 통해 제공되며, 백엔드의 `AllExceptionsFilter`와는 별도의 프론트엔드 전용 에러 핸들링 시스템.

### ApiConfigService (`api/config/`)

주입 가능한 설정 서비스. `IApiConfig` 인터페이스를 통해 API 환경 변수에 타입 안전 접근 제공.

### Messages (`api/constants/`)

중앙 집중식 에러 및 성공 메시지 문자열. 컨트롤러 전체에서 일관된 메시지 제공에 사용.

## 클라이언트-서버 공유

프론트엔드와 백엔드 간 공유 인터페이스:

| 파일 | 목적 |
|------|------|
| `i-response.ts` | 응답 타입 계약: `IResponse`, `ActionSuccessResponse`, `DetailSuccessResponse`, `ListSuccessResponse` |
| `i-base.ts` | 기본 엔티티 인터페이스 (id, createdAt, updatedAt) |
| `http/http-methods.ts` | HTTP 메서드 enum |
| `http/http-headers.ts` | HTTP 헤더 상수 |
| `http/http-status-codes.ts` | HTTP 상태 코드 enum |
| `constants.ts` | 공유 상수 (API 프리픽스 등) |

## 프론트엔드 Foundation

### BaseService (`foundation/service/base.service.ts`)

HTTP 클라이언트 래퍼:
```
생성자: HttpClient + IConfigurationService
메서드: GET, POST, PUT, DELETE (설정에서 자동 URL 구성)
```

### BaseDataService<T> (`foundation/service/base-data.service.ts`)

BaseService 상속 — 제네릭 CRUD HTTP 작업:
```
메서드:
  getAll(endpoint)       → Observable<T[]>
  getById(endpoint, id)  → Observable<T>
  create(endpoint, data) → Observable<T>
  update(endpoint, data) → Observable<T>
  delete(endpoint, id)   → Observable<any>
```

### 페이지네이션 (`foundation/paging/`)

- `PaginatedDatasource` — Observable 기반 페이지네이션 데이터 소스
- `PagingTypes` — 페이지 요청/응답 인터페이스

### SharedCoreModule (`core/`)

프론트엔드 루트 모듈 — **AppModule에서 `.forRoot(environment)`로 한 번만 임포트해야 함**:
- `SharedConfigurationModule` 초기화 (API URL, 환경 설정)
- `SharedInterceptorsModule` 초기화 (HTTP 인터셉터 7개)
- 에러 핸들러, 로깅, 알림 서비스 초기화

## HTTP 인터셉터 (`interceptors/`)

모든 HTTP 요청에 순서대로 적용:

| 인터셉터 | 파일 | 목적 |
|----------|------|------|
| TokenInterceptor | `token.interceptor.ts` | localStorage에서 `Authorization: Token <jwt>` 헤더 추가 |
| LoggingInterceptor | `logging.interceptor.ts` | 요청 메서드, URL, 타이밍 기록 |
| CachingInterceptor | `caching.interceptor.ts` | GET 응답 캐싱 |
| LoadingInterceptor | `loading.interceptor.ts` | 전역 로딩 상태 설정/해제 |
| TimeoutInterceptor | `timeout.interceptor.ts` | 요청 타임아웃 |
| ErrorInterceptor | `error.interceptor.ts` | 에러 처리 |
| NotificationInterceptor | `notification.interceptor.ts` | 사용자에게 에러 알림 표시 |

## 프론트엔드 유틸리티 라이브러리

| 라이브러리 | 임포트 경로 | 주요 익스포트 |
|-----------|------------|-------------|
| Configuration | `@realworld/shared/configuration` | `ConfigurationService`, `IConfigurationService` — API URL, 환경 설정 |
| Storage | `@realworld/shared/storage` | `UserStorageUtil` (JWT), `ThemeStorageUtil` — localStorage 래퍼 |
| Logging | `@realworld/shared/logging` | 플러그인 작성자를 가진 `LoggingService` (console, logentries, loggly) |
| Loading | `@realworld/shared/loading` | `LoadingService` — 스피너용 전역 로딩 상태 |
| Notification | `@realworld/shared/notification` | `NotificationService` — UI 알림 푸시 |
| Spinner | `@realworld/shared/spinner` | `NbSpinnerComponent` — 로딩 스피너 UI |
| Toaster | `@realworld/shared/toaster` | `ToasterComponent` — 토스트 알림 UI |
| Directives | `@realworld/shared/directives` | `ControlErrorsDirective` (폼 에러), `FormSubmitDirective` |
| String Util | `@realworld/shared/string-util` | 문자열 조작 유틸리티 |
| Error Handler | `@realworld/shared/error-handler` | 클라이언트측 에러 핸들러 서비스 |
| Common | `@realworld/shared/common` | 공통 Angular 모듈 |
| Constants | `@realworld/shared/constants` | 전역 프론트엔드 상수 |

## 의존성 규칙

```
도메인 라이브러리 (article/*, user/*) → 임포트 가능 → 공유 라이브러리 (shared/*)
공유 라이브러리 → 임포트 불가 → 도메인 라이브러리
백엔드 공유 (shared/api/*) → 임포트 불가 → 프론트엔드 공유
프론트엔드 공유 → 임포트 불가 → 백엔드 공유 (shared/api/*)
client-server → 임포트 가능 → 백엔드와 프론트엔드 양쪽
```

## 알려진 이슈

- `BaseService.repository`가 `public` — 컨트롤러가 서비스 메서드를 우회하여 repository에 직접 접근 (예: `createQueryBuilder`)
- jest.config.js 20개 이상에서 deprecated된 `tsConfig` 키 사용 — `tsconfig`로 변경 필요
- angular.json에 `passWithNoTests: true`가 전역 설정 — 테스트 파일 0개여도 테스트 통과
- nx.json 태그 불일치: 대부분 `scope:shared` 사용하지만 `client-server`와 `constants`는 `domain:shared` 사용
