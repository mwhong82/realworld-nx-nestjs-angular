---
name: gen-test
description: Jest 유닛 테스트를 자동 생성합니다. 테스트 작성, 테스트 추가, 커버리지 확보가 필요할 때 사용하세요. "테스트 만들어줘", "테스트 작성", "커버리지" 같은 요청에 자동으로 활성화됩니다.
argument-hint: [파일경로 또는 서비스/컴포넌트명]
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# Jest 유닛 테스트 자동 생성

$ARGUMENTS 에 대한 유닛 테스트를 생성합니다.

## 사전 분석

1. 대상 파일을 읽어서 다음을 파악합니다:
   - 클래스 타입 (Service, Controller, Component, Guard, Interceptor)
   - public 메서드 목록
   - 의존성 (주입되는 서비스, Repository 등)
   - 상속 구조 (BaseService, BaseDataService 등)

2. 기존 테스트 파일이 있는지 확인합니다:
   - `.spec.ts` 파일이 있으면 기존 테스트에 추가
   - 없으면 새로 생성

## 테스트 생성 규칙

### NestJS Service 테스트 패턴
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

describe('ServiceName', () => {
  let service: ServiceName;
  let repository: jest.Mocked<Repository<Entity>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServiceName,
        {
          provide: getRepositoryToken(Entity),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
            insert: jest.fn(),
            update: jest.fn(),
            softDelete: jest.fn(),
            count: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ServiceName>(ServiceName);
    repository = module.get(getRepositoryToken(Entity));
  });
});
```

### NestJS Controller 테스트 패턴
- 모든 주입 서비스를 mock
- 각 엔드포인트별 성공 + 에러 케이스
- @SkipAuth() 엔드포인트는 인증 없이 테스트
- 인증 필요 엔드포인트는 request.user mock 포함

### Angular Component 테스트 패턴
```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
```

### Angular Service 테스트 패턴
- HttpClientTestingModule 사용
- HttpTestingController로 HTTP 요청 검증

## 특수 mock 처리
- **bcrypt**: `jest.mock('bcrypt', () => ({ hash: jest.fn(), compare: jest.fn() }))`
- **JwtService**: `{ provide: JwtService, useValue: { sign: jest.fn(), verify: jest.fn() } }`
- **TypeORM Repository**: `getRepositoryToken(Entity)` 사용
- **ConfigurationService**: `{ provide: IConfigurationService, useValue: { apiUrl: 'http://test' } }`

## 생성 후 확인

```bash
# 테스트 실행
npx nx test {project-name}

# 커버리지 확인
npx nx test {project-name} --coverage
```

## 규칙
- 각 public 메서드마다 최소 happy path + error path 테스트
- describe/it 블록으로 구조화
- 테스트 설명은 영어 (코드 컨벤션)
- 안내 메시지는 한국어로 출력
- `passWithNoTests: true` 설정이 있으므로 테스트가 없어도 통과함에 주의 — 실제 테스트 케이스 작성 필수
