/**
 * Article API 핸들러 통합 테스트
 *
 * 컨트롤러 → 서비스 → Mock 레포지토리 체인을 실제 데이터베이스 없이 테스트합니다.
 * ArticleService, TagService, FavoriteService, CommentService, UserService, FollowService
 * 모두 진짜 서비스 인스턴스를 사용하되 TypeORM 레포지토리만 Mock으로 대체합니다.
 */

import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  Article,
  ArticleService,
  Comment,
  CommentService,
  Favorite,
  FavoriteService,
  TagService,
} from '@realworld/article/api/shared';
import { Tag } from '@realworld/article/api/shared';
import { Follow, FollowService, UserService } from '@realworld/user/api/shared';
import { User } from '@realworld/user/api/shared';
import * as bcrypt from 'bcrypt';
import { ArticleApiHandlersController } from './article-api-handlers.controller';

// bcrypt 모킹 (UserService 내부 사용)
jest.mock('bcrypt');

// ─────────────────────────────────────────────
// 공용 헬퍼 팩토리
// ─────────────────────────────────────────────

function createMockRepository() {
  return {
    find: jest.fn(),
    findOne: jest.fn(),
    count: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(),
  };
}

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 'author-uuid-001',
    email: 'author@example.com',
    username: 'authoruser',
    password: '$2b$10$hashedpassword',
    bio: '작성자 바이오',
    image: 'https://example.com/author.png',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    deletedDate: null,
    ...overrides,
  } as User;
}

function makeArticle(overrides: Partial<Article> = {}): Article {
  return {
    id: 'article-uuid-001',
    slug: 'test-article-1700000000000',
    title: '테스트 게시글',
    description: '게시글 설명',
    body: '게시글 본문 내용입니다.',
    authorId: 'author-uuid-001',
    tagList: ['nestjs', 'testing'],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    deletedDate: null,
    ...overrides,
  } as Article;
}

function makeComment(overrides: Partial<Comment> = {}): Comment {
  return {
    id: 'comment-uuid-001',
    articleSlug: 'test-article-1700000000000',
    authorId: 'author-uuid-001',
    body: '테스트 댓글 내용입니다.',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    deletedDate: null,
    ...overrides,
  } as Comment;
}

// ─────────────────────────────────────────────
// 테스트 스위트
// ─────────────────────────────────────────────

describe('ArticleAPI 통합 테스트 (Controller → Service → MockRepository)', () => {
  let module: TestingModule;
  let controller: ArticleApiHandlersController;
  let mockArticleRepo: ReturnType<typeof createMockRepository>;
  let mockUserRepo: ReturnType<typeof createMockRepository>;
  let mockFavoriteRepo: ReturnType<typeof createMockRepository>;
  let mockFollowRepo: ReturnType<typeof createMockRepository>;
  let mockTagRepo: ReturnType<typeof createMockRepository>;
  let mockCommentRepo: ReturnType<typeof createMockRepository>;
  let mockJwtService: { sign: jest.Mock; decode: jest.Mock };

  beforeEach(async () => {
    mockArticleRepo = createMockRepository();
    mockUserRepo = createMockRepository();
    mockFavoriteRepo = createMockRepository();
    mockFollowRepo = createMockRepository();
    mockTagRepo = createMockRepository();
    mockCommentRepo = createMockRepository();
    mockJwtService = {
      sign: jest.fn().mockReturnValue('mock.jwt.token'),
      decode: jest.fn().mockReturnValue(null),
    };

    module = await Test.createTestingModule({
      controllers: [ArticleApiHandlersController],
      providers: [
        ArticleService,  // 진짜 서비스
        UserService,     // 진짜 서비스
        FavoriteService, // 진짜 서비스
        FollowService,   // 진짜 서비스
        TagService,      // 진짜 서비스
        CommentService,  // 진짜 서비스
        {
          provide: getRepositoryToken(Article),
          useValue: mockArticleRepo,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepo,
        },
        {
          provide: getRepositoryToken(Favorite),
          useValue: mockFavoriteRepo,
        },
        {
          provide: getRepositoryToken(Follow),
          useValue: mockFollowRepo,
        },
        {
          provide: getRepositoryToken(Tag),
          useValue: mockTagRepo,
        },
        {
          provide: getRepositoryToken(Comment),
          useValue: mockCommentRepo,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    controller = module.get(ArticleApiHandlersController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ──────────────────────────────────────────
  // 1. 게시글 생성 플로우
  // ──────────────────────────────────────────

  describe('게시글 생성 플로우 (POST /articles)', () => {
    it('새 게시글을 생성하면 slug를 자동 생성하고 태그를 업데이트해야 한다', async () => {
      // 준비
      const author = makeUser();
      mockArticleRepo.insert.mockResolvedValue({ identifiers: [{ id: 'article-uuid-001' }] });
      mockUserRepo.findOne.mockResolvedValue(author);
      mockFavoriteRepo.findOne.mockResolvedValue(null);  // 좋아요 없음
      mockFavoriteRepo.count.mockResolvedValue(0);
      mockFollowRepo.findOne.mockResolvedValue(null);   // 팔로우 없음
      // 태그 처리: 새 태그 → insert
      mockTagRepo.findOne.mockResolvedValue(null);
      mockTagRepo.insert.mockResolvedValue({ identifiers: [] });

      const mockReq = { user: { sub: 'author-uuid-001' } };
      const newArticleData = {
        title: '테스트 게시글',
        description: '게시글 설명',
        body: '본문 내용',
        tagList: ['nestjs', 'testing'],
      };

      // 실행
      const result = await controller.create(mockReq, newArticleData);

      // 검증: 게시글 insert 호출 확인
      expect(mockArticleRepo.insert).toHaveBeenCalled();
      const insertedArticle = mockArticleRepo.insert.mock.calls[0][0];
      // slug가 title 기반으로 자동 생성되었는지 확인
      expect(insertedArticle.slug).toMatch(/테스트-게시글-\d+/);
      expect(insertedArticle.authorId).toBe('author-uuid-001');
      // 태그 처리 확인
      expect(mockTagRepo.findOne).toHaveBeenCalledWith({ name: 'nestjs' }, undefined);
      expect(mockTagRepo.findOne).toHaveBeenCalledWith({ name: 'testing' }, undefined);
      expect(mockTagRepo.insert).toHaveBeenCalledTimes(2);
      expect((result as any).data['title']).toBe('테스트 게시글');
    });

    it('이미 존재하는 태그가 있으면 count를 증가시켜야 한다', async () => {
      // 준비
      const author = makeUser();
      const existingTag = { id: 'tag-uuid', name: 'nestjs', count: 5 };
      mockArticleRepo.insert.mockResolvedValue({ identifiers: [] });
      mockUserRepo.findOne.mockResolvedValue(author);
      mockFavoriteRepo.findOne.mockResolvedValue(null);
      mockFavoriteRepo.count.mockResolvedValue(0);
      mockFollowRepo.findOne.mockResolvedValue(null);
      mockTagRepo.findOne.mockResolvedValue(existingTag); // 기존 태그 존재
      mockTagRepo.update.mockResolvedValue({ affected: 1 });

      const mockReq = { user: { sub: 'author-uuid-001' } };

      // 실행
      await controller.create(mockReq, {
        title: '게시글',
        description: '설명',
        body: '본문',
        tagList: ['nestjs'],
      });

      // 검증: 기존 태그는 insert 대신 update(count+1) 호출
      expect(mockTagRepo.insert).not.toHaveBeenCalled();
      expect(mockTagRepo.update).toHaveBeenCalledWith(
        { id: 'tag-uuid' },
        { count: 6 }
      );
    });
  });

  // ──────────────────────────────────────────
  // 2. 게시글 삭제 플로우
  // ──────────────────────────────────────────

  describe('게시글 삭제 플로우 (DELETE /articles/:slug)', () => {
    it('자신의 게시글을 삭제하면 softDelete가 호출되어야 한다', async () => {
      // 준비
      const article = makeArticle({ authorId: 'author-uuid-001' });
      mockArticleRepo.findOne.mockResolvedValue(article);
      mockArticleRepo.softDelete.mockResolvedValue({ affected: 1 });
      const mockReq = { user: { sub: 'author-uuid-001' } };

      // 실행
      const result = await controller.delete(mockReq, 'test-article-1700000000000');

      // 검증
      expect(mockArticleRepo.findOne).toHaveBeenCalledWith({ slug: 'test-article-1700000000000' }, undefined);
      expect(mockArticleRepo.softDelete).toHaveBeenCalledWith({ slug: 'test-article-1700000000000' });
      expect((result as any).data).toBeNull();
    });

    it('다른 사람의 게시글을 삭제하려 하면 UnauthorizedException을 발생시켜야 한다', async () => {
      // 준비: 게시글 작성자가 다른 사람
      const article = makeArticle({ authorId: 'other-user-uuid' });
      mockArticleRepo.findOne.mockResolvedValue(article);
      const mockReq = { user: { sub: 'author-uuid-001' } };

      // 실행 및 검증
      await expect(
        controller.delete(mockReq, 'test-article-1700000000000')
      ).rejects.toThrow(UnauthorizedException);

      expect(mockArticleRepo.softDelete).not.toHaveBeenCalled();
    });

    it('존재하지 않는 게시글을 삭제하려 하면 NotFoundException을 발생시켜야 한다', async () => {
      // 준비
      mockArticleRepo.findOne.mockResolvedValue(null);
      const mockReq = { user: { sub: 'author-uuid-001' } };

      // 실행 및 검증
      await expect(
        controller.delete(mockReq, 'non-existent-slug')
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ──────────────────────────────────────────
  // 3. 게시글 단건 조회 플로우
  // ──────────────────────────────────────────

  describe('게시글 단건 조회 플로우 (GET /articles/:slug)', () => {
    it('slug로 게시글을 조회하면 작성자 프로필과 좋아요 정보를 포함해야 한다', async () => {
      // 준비
      const article = makeArticle();
      const author = makeUser();
      mockArticleRepo.findOne.mockResolvedValue(article);
      mockUserRepo.findOne.mockResolvedValue(author);
      mockFavoriteRepo.findOne.mockResolvedValue(null);   // 좋아요 안 함
      mockFavoriteRepo.count.mockResolvedValue(3);        // 총 좋아요 3개
      mockFollowRepo.findOne.mockResolvedValue(null);     // 팔로우 안 함
      mockJwtService.decode.mockReturnValue(null);
      const mockReq = { headers: {} };

      // 실행
      const result = await controller.findBySlug(mockReq, 'test-article-1700000000000');

      // 검증 (findBySlug → DetailSuccessResponse → detailData)
      expect(mockArticleRepo.findOne).toHaveBeenCalledWith({ slug: 'test-article-1700000000000' }, undefined);
      expect(mockUserRepo.findOne).toHaveBeenCalledWith({ id: article.authorId }, undefined);
      expect((result as any).detailData['title']).toBe('테스트 게시글');
      expect((result as any).detailData['favorited']).toBe(false);
      expect((result as any).detailData['favoritesCount']).toBe(3);
      expect((result as any).detailData['author']['username']).toBe('authoruser');
    });

    it('존재하지 않는 slug로 조회하면 NotFoundException을 발생시켜야 한다', async () => {
      // 준비
      mockArticleRepo.findOne.mockResolvedValue(null);
      const mockReq = { headers: {} };

      // 실행 및 검증
      await expect(
        controller.findBySlug(mockReq, 'non-existent-slug')
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ──────────────────────────────────────────
  // 4. 좋아요 플로우
  // ──────────────────────────────────────────

  describe('좋아요 플로우 (POST /articles/:slug/favorite)', () => {
    it('게시글에 좋아요를 추가하면 favorite 레코드가 저장되고 favorited=true를 반환해야 한다', async () => {
      // 준비: 아직 좋아요 안 한 상태 → insert 호출
      const article = makeArticle();
      const author = makeUser();
      mockFavoriteRepo.findOne
        .mockResolvedValueOnce(null)          // 첫 조회: 아직 안 좋아요
        .mockResolvedValueOnce({ id: 'fav-uuid' }); // mapToResponseArticle 내부 조회: 좋아요 됨
      mockFavoriteRepo.insert.mockResolvedValue({ identifiers: [] });
      mockFavoriteRepo.count.mockResolvedValue(1);
      mockArticleRepo.findOne.mockResolvedValue(article);
      mockUserRepo.findOne.mockResolvedValue(author);
      mockFollowRepo.findOne.mockResolvedValue(null);
      const mockReq = { user: { sub: 'author-uuid-001' } };

      // 실행
      const result = await controller.favoriteAnArticle(mockReq, 'test-article-1700000000000');

      // 검증
      expect(mockFavoriteRepo.insert).toHaveBeenCalledWith({
        userId: 'author-uuid-001',
        articleSlug: 'test-article-1700000000000',
      });
      expect((result as any).data['favorited']).toBe(true);
      expect((result as any).data['favoritesCount']).toBe(1);
    });

    it('이미 좋아요한 게시글에 다시 좋아요를 누르면 중복 insert를 하지 않아야 한다', async () => {
      // 준비: 이미 좋아요한 상태
      const article = makeArticle();
      const author = makeUser();
      const existingFav = { id: 'fav-uuid', userId: 'author-uuid-001', articleSlug: 'test-article-1700000000000' };
      mockFavoriteRepo.findOne.mockResolvedValue(existingFav);
      mockFavoriteRepo.count.mockResolvedValue(1);
      mockArticleRepo.findOne.mockResolvedValue(article);
      mockUserRepo.findOne.mockResolvedValue(author);
      mockFollowRepo.findOne.mockResolvedValue(null);
      const mockReq = { user: { sub: 'author-uuid-001' } };

      // 실행
      await controller.favoriteAnArticle(mockReq, 'test-article-1700000000000');

      // 검증: 중복 insert 없음
      expect(mockFavoriteRepo.insert).not.toHaveBeenCalled();
    });
  });

  // ──────────────────────────────────────────
  // 5. 댓글 생성 플로우
  // ──────────────────────────────────────────

  describe('댓글 생성 플로우 (POST /articles/:slug/comments)', () => {
    it('게시글에 댓글을 작성하면 댓글 레코드가 저장되고 작성자 정보가 포함되어야 한다', async () => {
      // 준비
      const author = makeUser();
      mockCommentRepo.insert.mockResolvedValue({ identifiers: [{ id: 'comment-uuid-001' }] });
      mockUserRepo.findOne.mockResolvedValue(author);
      mockFollowRepo.findOne.mockResolvedValue(null);
      const mockReq = { user: { sub: 'author-uuid-001' } };

      // 실행
      const result = await controller.createAComment(
        mockReq,
        'test-article-1700000000000',
        { body: '테스트 댓글 내용입니다.' }
      );

      // 검증
      expect(mockCommentRepo.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          body: '테스트 댓글 내용입니다.',
          authorId: 'author-uuid-001',
          articleSlug: 'test-article-1700000000000',
        })
      );
      expect((result as any).data['body']).toBe('테스트 댓글 내용입니다.');
      expect((result as any).data['author']['username']).toBe('authoruser');
    });
  });

  // ──────────────────────────────────────────
  // 6. 댓글 삭제 플로우
  // ──────────────────────────────────────────

  describe('댓글 삭제 플로우 (DELETE /articles/:slug/comments/:id)', () => {
    it('자신의 댓글을 삭제하면 softDelete가 호출되어야 한다', async () => {
      // 준비
      const comment = makeComment({ authorId: 'author-uuid-001' });
      mockCommentRepo.findOne.mockResolvedValue(comment);
      mockCommentRepo.softDelete.mockResolvedValue({ affected: 1 });
      const mockReq = { user: { sub: 'author-uuid-001' } };

      // 실행
      const result = await controller.deleteAComment(
        mockReq,
        'test-article-1700000000000',
        'comment-uuid-001'
      );

      // 검증
      expect(mockCommentRepo.softDelete).toHaveBeenCalledWith({
        articleSlug: 'test-article-1700000000000',
        id: 'comment-uuid-001',
      });
      expect((result as any).data).toBeNull();
    });

    it('다른 사람의 댓글을 삭제하려 하면 UnauthorizedException을 발생시켜야 한다', async () => {
      // 준비: 댓글 작성자가 다른 사람
      const comment = makeComment({ authorId: 'other-user-uuid' });
      mockCommentRepo.findOne.mockResolvedValue(comment);
      const mockReq = { user: { sub: 'author-uuid-001' } };

      // 실행 및 검증
      await expect(
        controller.deleteAComment(mockReq, 'test-article-1700000000000', 'comment-uuid-001')
      ).rejects.toThrow(UnauthorizedException);

      expect(mockCommentRepo.softDelete).not.toHaveBeenCalled();
    });
  });

  // ──────────────────────────────────────────
  // 7. 태그 목록 조회 플로우
  // ──────────────────────────────────────────

  describe('태그 목록 조회 플로우 (GET /tags)', () => {
    it('태그 목록을 조회하면 태그 이름 배열을 반환해야 한다', async () => {
      // 준비
      const tags = [
        { id: 'tag-1', name: 'nestjs', count: 10 },
        { id: 'tag-2', name: 'angular', count: 7 },
        { id: 'tag-3', name: 'typeorm', count: 4 },
      ];
      mockTagRepo.find.mockResolvedValue(tags);
      mockTagRepo.count.mockResolvedValue(3);

      // 실행
      const result = await controller.findAllTags({});

      // 검증 (findAllTags → ListSuccessResponse → listData)
      expect((result as any).listData).toEqual(['nestjs', 'angular', 'typeorm']);
      expect((result as any).total).toBe(3);
    });
  });
});
