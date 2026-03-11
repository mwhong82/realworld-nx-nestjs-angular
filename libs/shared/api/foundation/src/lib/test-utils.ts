/**
 * 테스트 유틸리티 모음
 * TypeORM 모의 레포지토리 팩토리 및 엔티티 목 팩토리 제공
 */

// ─── 모의 레포지토리 팩토리 ───────────────────────────────────────────────────

/**
 * TypeORM Repository<T>의 모의(mock) 객체를 생성합니다.
 * Jest 테스트에서 실제 데이터베이스 없이 서비스를 테스트할 때 사용합니다.
 */
export function createMockRepository<T = unknown>() {
  return {
    find: jest.fn(),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    save: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    softDelete: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orWhere: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      innerJoin: jest.fn().mockReturnThis(),
      innerJoinAndSelect: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getOne: jest.fn(),
      getMany: jest.fn(),
      getManyAndCount: jest.fn(),
      getRawOne: jest.fn(),
      getRawMany: jest.fn(),
    })),
  };
}

// ─── 모의 사용자 팩토리 ───────────────────────────────────────────────────────

/**
 * User 엔티티 목 객체의 기본값
 * BaseEntity: id, createdAt, updatedAt, deletedDate
 * User: email, username, password, bio, image
 */
export interface MockUser {
  id: string;
  email: string;
  username: string;
  password: string;
  bio: string;
  image: string;
  createdAt: Date;
  updatedAt: Date;
  deletedDate: Date | null;
}

/**
 * 테스트용 사용자 목 객체를 생성합니다.
 * @param overrides - 기본값을 덮어쓸 필드
 */
export function createMockUser(overrides: Partial<MockUser> = {}): MockUser {
  return {
    id: 'test-user-uuid-1234',
    email: 'test@example.com',
    username: 'testuser',
    password: '$2b$10$hashedpassword',
    bio: '테스트 사용자 소개',
    image: 'https://example.com/avatar.jpg',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    deletedDate: null,
    ...overrides,
  };
}

// ─── 모의 게시글 팩토리 ───────────────────────────────────────────────────────

/**
 * Article 엔티티 목 객체의 기본값
 * BaseEntity: id, createdAt, updatedAt, deletedDate
 * Article: slug, title, description, body, authorId, tagList
 */
export interface MockArticle {
  id: string;
  slug: string;
  title: string;
  description: string;
  body: string;
  authorId: string;
  tagList: string[];
  createdAt: Date;
  updatedAt: Date;
  deletedDate: Date | null;
}

/**
 * 테스트용 게시글 목 객체를 생성합니다.
 * @param overrides - 기본값을 덮어쓸 필드
 */
export function createMockArticle(overrides: Partial<MockArticle> = {}): MockArticle {
  return {
    id: 'test-article-uuid-5678',
    slug: 'test-article-slug',
    title: '테스트 게시글 제목',
    description: '테스트 게시글 설명',
    body: '테스트 게시글 본문 내용입니다.',
    authorId: 'test-user-uuid-1234',
    tagList: ['테스트', 'NestJS'],
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    deletedDate: null,
    ...overrides,
  };
}
