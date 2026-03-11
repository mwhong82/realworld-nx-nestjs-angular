---
name: add-endpoint
description: NestJS API 엔드포인트를 풀스택으로 추가합니다. 새로운 API 기능, 엔드포인트, CRUD 작업을 만들 때 사용하세요. "엔드포인트 추가", "API 만들기", "새 기능 추가" 같은 요청에 자동으로 활성화됩니다.
argument-hint: [도메인/기능명] [설명]
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Agent
---

# 풀스택 API 엔드포인트 추가

$ARGUMENTS에 대한 풀스택 엔드포인트를 생성합니다.

## 사전 확인

1. 먼저 관련 기존 코드를 읽어서 프로젝트 패턴을 파악합니다:
   - `libs/shared/api/foundation/src/lib/base.ts` — BaseEntity 패턴
   - `libs/shared/api/foundation/src/lib/base.service.ts` — BaseService<T> 패턴
   - 대상 도메인의 기존 entity, service, controller를 읽어서 패턴을 따릅니다
   - `tsconfig.base.json` — @realworld/* 경로 별칭 확인

2. 대상 도메인을 결정합니다:
   - `article` 도메인: 게시글, 댓글, 좋아요, 태그 관련
   - `user` 도메인: 사용자, 인증, 프로필, 팔로우 관련
   - 새 도메인이 필요하면 사용자에게 확인합니다

## 생성 순서 (모든 파일을 한번에 생성)

### Step 1: TypeORM Entity
- **경로**: `libs/{domain}/api/shared/src/lib/{name}.entity.ts`
- BaseEntity를 상속 (@realworld/shared/api/foundation)
- TypeORM 데코레이터 사용 (@Entity, @Column 등)
- 적절한 컬럼 타입과 제약조건 설정
- index.ts 배럴 익스포트에 추가

### Step 2: Service
- **경로**: `libs/{domain}/api/shared/src/lib/{name}.service.ts`
- BaseService<T>를 상속
- @Injectable() 데코레이터
- constructor에서 @InjectRepository()로 Repository<T> 주입
- 비즈니스 로직이 필요하면 커스텀 메서드 추가
- index.ts 배럴 익스포트에 추가

### Step 3: DTO (Data Transfer Object)
- **경로**: `libs/{domain}/api-interfaces/src/lib/` 에 추가
- class-validator 데코레이터 사용 (@IsString, @IsNotEmpty 등)
- Create/Update DTO 분리
- index.ts 배럴 익스포트에 추가

### Step 4: Controller 엔드포인트
- **경로**: `libs/{domain}/api/handlers/src/lib/{domain}-api-handlers.controller.ts`
- 기존 컨트롤러에 엔드포인트 추가 (새 컨트롤러가 필요하면 생성)
- NestJS 데코레이터 사용 (@Get, @Post, @Put, @Delete)
- @SkipAuth() 여부 결정 (공개 엔드포인트인지)
- IResponse 타입 반환
- 서비스를 constructor에 주입

### Step 5: Module 등록
- 해당 도메인의 module.ts에 새 서비스/엔티티 등록
- TypeOrmModule.forFeature([NewEntity]) 추가
- providers에 새 서비스 추가

### Step 6: Frontend Service 메서드
- **경로**: `libs/{domain}/shared/src/lib/{name}.service.ts`
- BaseDataService<T>를 상속하거나 기존 서비스에 메서드 추가
- HTTP 메서드와 엔드포인트 매핑

### Step 7: TypeORM Migration
- **경로**: `migrations/{timestamp}-{Name}.ts`
- 새 테이블 생성 또는 기존 테이블 수정
- up/down 메서드 작성

### Step 8: Unit Test Scaffold
- **경로**: `libs/{domain}/api/shared/src/lib/{name}.service.spec.ts`
- NestJS Testing 모듈 설정
- Repository mock
- 각 public 메서드의 기본 테스트 케이스 scaffold

## 생성 후 확인

```bash
# 타입 체크
npx tsc --noEmit -p tsconfig.base.json

# 관련 테스트 실행
npx nx test {project-name}
```

## 컨벤션 준수사항
- 클래스/인터페이스: PascalCase
- 메서드/변수: camelCase
- 임포트: @realworld/* 스코프 사용 (라이브러리 간 상대 경로 금지)
- 응답 형식: `{ item/items, ...metadata }` 표준 응답 타입으로 래핑
- 모든 안내 메시지는 한국어로 출력
