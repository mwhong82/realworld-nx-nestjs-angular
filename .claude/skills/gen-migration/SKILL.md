---
name: gen-migration
description: TypeORM 마이그레이션을 생성합니다. DB 스키마 변경, 테이블 추가/수정, 컬럼 변경이 필요할 때 사용하세요. "마이그레이션", "DB 변경", "테이블 추가" 같은 요청에 자동으로 활성화됩니다.
argument-hint: [마이그레이션명] [설명]
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# TypeORM 마이그레이션 생성

$ARGUMENTS 에 대한 TypeORM 마이그레이션을 생성합니다.

## 사전 확인

1. 기존 마이그레이션을 확인합니다:
   - `migrations/` 디렉토리의 기존 마이그레이션 파일 확인
   - 네이밍 패턴과 타임스탬프 형식 파악

2. 관련 엔티티를 확인합니다:
   - 변경할 엔티티의 현재 상태 읽기
   - BaseEntity 필드 (id UUID, createdAt, updatedAt, deletedDate) 참고

3. `ormconfig.js` 설정 확인:
   - `synchronize: false` — 자동 동기화 비활성화 확인
   - `migrationsRun: false` — 수동 마이그레이션 실행 확인

## 마이그레이션 생성

### 파일 구조
- **경로**: `migrations/{timestamp}-{Name}.ts`
- 타임스탬프 형식: `Date.now()` 결과 (예: 1678901234567)

### 템플릿
```typescript
import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class {Name}{Timestamp} implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 새 테이블 생성 시
    await queryRunner.createTable(
      new Table({
        name: '{table_name}',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'uuid',
          },
          // ... 도메인 컬럼 추가
          {
            name: 'createdAt',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'deletedDate',
            type: 'datetime',
            isNullable: true,
          },
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('{table_name}');
  }
}
```

### 컬럼 추가/수정 시
```typescript
await queryRunner.addColumn('table_name', new TableColumn({...}));
await queryRunner.changeColumn('table_name', 'old_name', new TableColumn({...}));
```

## 실행 방법 안내

마이그레이션 생성 후 사용자에게 안내합니다:

```bash
# 마이그레이션 실행 (MySQL 서버 필요)
npm run migration:run

# 주의: MySQL 서버가 localhost:3306에서 실행 중이어야 합니다
# 데이터베이스: realworld_db
```

## 주의사항
- `synchronize: false` 이므로 반드시 마이그레이션으로 스키마 변경
- down() 메서드에 롤백 로직 필수
- 기존 데이터가 있을 수 있으므로 NOT NULL 컬럼 추가 시 default 값 설정
- 외래키 관계 설정 시 참조 테이블이 먼저 존재해야 함
- 안내 메시지는 한국어로 출력
