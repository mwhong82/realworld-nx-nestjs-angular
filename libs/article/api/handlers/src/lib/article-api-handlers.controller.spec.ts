import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ArticleApiHandlersController } from './article-api-handlers.controller';
import {
  ArticleService,
  CommentService,
  FavoriteService,
  TagService,
} from '@realworld/article/api/shared';
import { FollowService, UserService } from '@realworld/user/api/shared';
import {
  CREATED_MSG,
  DELETED_MSG,
  UPDATED_MSG,
} from '@realworld/shared/api/constants';
import {
  ActionSuccessResponse,
  DetailSuccessResponse,
  ListSuccessResponse,
} from '@realworld/shared/client-server';

// ──────────────────────────────────────────────
// 공통 mock 유틸
// ──────────────────────────────────────────────

const mockReq = (sub = 'author-uuid') => ({
  user: { sub, email: 'test@test.com', username: 'testuser' },
  headers: { authorization: 'Bearer test-token' },
});

// 테스트용 Article fixture
const mockArticle = {
  id: 'article-uuid',
  slug: 'test-article-1234567890',
  title: 'Test Article',
  description: '테스트 게시글 설명',
  body: '게시글 본문',
  authorId: 'author-uuid',
  tagList: ['nestjs', 'jest'],
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

// 테스트용 IArticle 응답 fixture (mapToResponseArticle 결과)
const mockArticleResponse = {
  ...mockArticle,
  favorited: false,
  favoritesCount: 0,
  author: {
    username: 'testuser',
    bio: '',
    image: '',
    following: false,
    createdAt: new Date('2024-01-01'),
  },
};

// 테스트용 Comment fixture
const mockComment = {
  id: 'comment-uuid',
  body: '테스트 댓글',
  authorId: 'author-uuid',
  articleSlug: 'test-article-1234567890',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

const mockCommentResponse = {
  ...mockComment,
  author: {
    username: 'testuser',
    bio: '',
    image: '',
    following: false,
    createdAt: new Date('2024-01-01'),
  },
};

// 테스트용 User fixture
const mockUser = {
  id: 'author-uuid',
  email: 'test@test.com',
  username: 'testuser',
  bio: '',
  image: '',
  password: 'hashed',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

// 테스트용 Tag fixture
const mockTag = { id: 'tag-uuid', name: 'nestjs', count: 5 };

describe('ArticleApiHandlersController', () => {
  let controller: ArticleApiHandlersController;
  let articleService: jest.Mocked<Partial<ArticleService>>;
  let commentService: jest.Mocked<Partial<CommentService>>;
  let favoriteService: jest.Mocked<Partial<FavoriteService>>;
  let tagService: jest.Mocked<Partial<TagService>>;
  let userService: jest.Mocked<Partial<UserService>>;
  let followService: jest.Mocked<Partial<FollowService>>;

  beforeEach(async () => {
    // QueryBuilder mock: findAll(favorited 경로)에서 사용
    const mockQueryBuilder = {
      innerJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    };

    articleService = {
      insert: jest.fn(),
      update: jest.fn(),
      findOne: jest.fn(),
      findAll: jest.fn(),
      count: jest.fn(),
      softDelete: jest.fn(),
      repository: {
        createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
      } as any,
    };

    commentService = {
      insert: jest.fn(),
      findOne: jest.fn(),
      findAll: jest.fn(),
      count: jest.fn(),
      softDelete: jest.fn(),
    };

    favoriteService = {
      insert: jest.fn(),
      findOne: jest.fn(),
      softDelete: jest.fn(),
      count: jest.fn(),
    };

    tagService = {
      insert: jest.fn(),
      findOne: jest.fn(),
      findAll: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    };

    userService = {
      findOne: jest.fn(),
      getProfile: jest.fn(),
      getJwtInfo: jest.fn(),
    };

    followService = {
      findAll: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ArticleApiHandlersController],
      providers: [
        { provide: ArticleService, useValue: articleService },
        { provide: UserService, useValue: userService },
        { provide: FavoriteService, useValue: favoriteService },
        { provide: FollowService, useValue: followService },
        { provide: TagService, useValue: tagService },
        { provide: CommentService, useValue: commentService },
      ],
    }).compile();

    controller = module.get<ArticleApiHandlersController>(ArticleApiHandlersController);

    // mapToResponseArticle 내부 의존 기본 설정
    (userService.findOne as jest.Mock).mockResolvedValue(mockUser);
    (userService.getProfile as jest.Mock).mockResolvedValue(mockArticleResponse.author);
    (favoriteService.findOne as jest.Mock).mockResolvedValue(null); // 기본: 좋아요 안 함
    (favoriteService.count as jest.Mock).mockResolvedValue(0);
  });

  // ──────────────────────────────────────────────
  // create
  // ──────────────────────────────────────────────
  describe('create', () => {
    it('새 게시글 생성 시 ActionSuccessResponse를 반환해야 한다', async () => {
      // arrange
      const req = mockReq();
      const newArticleData = {
        title: 'Test Article',
        description: '설명',
        body: '본문',
        tagList: ['nestjs'],
      };
      (articleService.insert as jest.Mock).mockResolvedValue(undefined);
      (tagService.findOne as jest.Mock).mockResolvedValue(null);
      (tagService.insert as jest.Mock).mockResolvedValue(undefined);

      // act
      const result = await controller.create(req, newArticleData);

      // assert
      expect(articleService.insert).toHaveBeenCalled();
      expect(result).toBeInstanceOf(ActionSuccessResponse);
      expect(result.message).toBe(CREATED_MSG);
      expect((result as any).data).toBeDefined();
    });

    it('tagList가 없어도 게시글을 생성할 수 있어야 한다', async () => {
      // arrange
      const req = mockReq();
      const newArticleData = { title: '태그 없는 글', description: '설명', body: '본문' };
      (articleService.insert as jest.Mock).mockResolvedValue(undefined);

      // act
      const result = await controller.create(req, newArticleData);

      // assert
      expect(tagService.findOne).not.toHaveBeenCalled();
      expect(result).toBeInstanceOf(ActionSuccessResponse);
      expect(result.message).toBe(CREATED_MSG);
    });
  });

  // ──────────────────────────────────────────────
  // update
  // ──────────────────────────────────────────────
  describe('update', () => {
    it('게시글 업데이트 시 ActionSuccessResponse를 반환해야 한다', async () => {
      // arrange
      const req = mockReq();
      const updateData = { title: '수정된 제목', description: '수정된 설명', body: '수정된 본문' };
      (articleService.update as jest.Mock).mockResolvedValue(undefined);
      (articleService.findOne as jest.Mock).mockResolvedValue(mockArticle);

      // act
      const result = await controller.update(req, 'test-article-1234567890', updateData);

      // assert
      expect(articleService.update).toHaveBeenCalledWith(
        { slug: 'test-article-1234567890' },
        { title: '수정된 제목', description: '수정된 설명', body: '수정된 본문' }
      );
      expect(articleService.findOne).toHaveBeenCalledWith({ slug: 'test-article-1234567890' });
      expect(result).toBeInstanceOf(ActionSuccessResponse);
      expect(result.message).toBe(UPDATED_MSG);
    });

    it('일부 필드만 업데이트할 수 있어야 한다', async () => {
      // arrange
      const req = mockReq();
      const updateData = { body: '본문만 수정' };
      (articleService.update as jest.Mock).mockResolvedValue(undefined);
      (articleService.findOne as jest.Mock).mockResolvedValue(mockArticle);

      // act
      const result = await controller.update(req, 'test-article-1234567890', updateData);

      // assert: title/description이 없으면 업데이트 객체에서 제외
      expect(articleService.update).toHaveBeenCalledWith(
        { slug: 'test-article-1234567890' },
        { body: '본문만 수정' }
      );
      expect(result).toBeInstanceOf(ActionSuccessResponse);
    });
  });

  // ──────────────────────────────────────────────
  // delete
  // ──────────────────────────────────────────────
  describe('delete', () => {
    it('작성자가 본인 게시글을 삭제하면 ActionSuccessResponse를 반환해야 한다', async () => {
      // arrange
      const req = mockReq('author-uuid');
      (articleService.findOne as jest.Mock).mockResolvedValue(mockArticle);
      (articleService.softDelete as jest.Mock).mockResolvedValue(undefined);

      // act
      const result = await controller.delete(req, 'test-article-1234567890');

      // assert
      expect(articleService.softDelete).toHaveBeenCalledWith({ slug: 'test-article-1234567890' });
      expect(result).toBeInstanceOf(ActionSuccessResponse);
      expect(result.message).toBe(DELETED_MSG);
      expect((result as any).data).toBeNull();
    });

    it('존재하지 않는 게시글 삭제 시 NotFoundException을 던져야 한다', async () => {
      // arrange
      const req = mockReq();
      (articleService.findOne as jest.Mock).mockResolvedValue(null);

      // act & assert
      await expect(controller.delete(req, 'nonexistent-slug')).rejects.toThrow(NotFoundException);
      expect(articleService.softDelete).not.toHaveBeenCalled();
    });

    it('작성자가 아닌 사용자가 삭제 시도하면 UnauthorizedException을 던져야 한다', async () => {
      // arrange
      const req = mockReq('other-user-uuid'); // 작성자와 다른 ID
      (articleService.findOne as jest.Mock).mockResolvedValue(mockArticle); // authorId: 'author-uuid'

      // act & assert
      await expect(controller.delete(req, 'test-article-1234567890')).rejects.toThrow(
        UnauthorizedException
      );
      expect(articleService.softDelete).not.toHaveBeenCalled();
    });
  });

  // ──────────────────────────────────────────────
  // findBySlug
  // ──────────────────────────────────────────────
  describe('findBySlug', () => {
    it('슬러그로 게시글 조회 시 DetailSuccessResponse를 반환해야 한다', async () => {
      // arrange
      const req = { headers: { authorization: 'Bearer test-token' } };
      (articleService.findOne as jest.Mock).mockResolvedValue(mockArticle);
      (userService.getJwtInfo as jest.Mock).mockReturnValue({ sub: 'reader-uuid', email: 'r@test.com', username: 'reader', iat: 0, exp: 9999 });

      // act
      const result = await controller.findBySlug(req, 'test-article-1234567890');

      // assert
      expect(articleService.findOne).toHaveBeenCalledWith({ slug: 'test-article-1234567890' });
      expect(result).toBeInstanceOf(DetailSuccessResponse);
      expect((result as any).detailData).toBeDefined();
    });

    it('존재하지 않는 슬러그 조회 시 NotFoundException을 던져야 한다', async () => {
      // arrange
      const req = { headers: {} };
      (articleService.findOne as jest.Mock).mockResolvedValue(null);

      // act & assert
      await expect(controller.findBySlug(req, 'no-such-slug')).rejects.toThrow(NotFoundException);
    });
  });

  // ──────────────────────────────────────────────
  // findAll
  // ──────────────────────────────────────────────
  describe('findAll', () => {
    it('쿼리 없이 모든 게시글 목록을 반환해야 한다', async () => {
      // arrange
      const req = { headers: {} };
      (userService.getJwtInfo as jest.Mock).mockReturnValue(null);
      (articleService.findAll as jest.Mock).mockResolvedValue([mockArticle]);
      (articleService.count as jest.Mock).mockResolvedValue(1);

      // act
      const result = await controller.findAll(req, {});

      // assert
      expect(articleService.findAll).toHaveBeenCalled();
      expect(result).toBeInstanceOf(ListSuccessResponse);
      expect((result as any).total).toBe(1);
      expect((result as any).listData).toHaveLength(1);
    });

    it('author 쿼리 파라미터로 필터링할 수 있어야 한다', async () => {
      // arrange
      const req = { headers: {} };
      (userService.getJwtInfo as jest.Mock).mockReturnValue(null);
      (userService.findOne as jest.Mock).mockResolvedValue(mockUser);
      (articleService.findAll as jest.Mock).mockResolvedValue([mockArticle]);
      (articleService.count as jest.Mock).mockResolvedValue(1);

      // act
      const result = await controller.findAll(req, { author: 'testuser' });

      // assert
      // author 조회를 위해 findOne이 호출되어야 함
      expect(userService.findOne).toHaveBeenCalledWith({ username: 'testuser' });
      expect(result).toBeInstanceOf(ListSuccessResponse);
    });

    it('favorited 쿼리 파라미터로 좋아요 게시글을 필터링할 수 있어야 한다', async () => {
      // arrange
      const req = { headers: {} };
      const favoritedUser = { ...mockUser, id: 'fav-user-uuid' };
      (userService.getJwtInfo as jest.Mock).mockReturnValue(null);
      (userService.findOne as jest.Mock).mockResolvedValue(favoritedUser);
      (articleService.findAll as jest.Mock).mockResolvedValue([]);
      (articleService.count as jest.Mock).mockResolvedValue(0);

      // act
      const result = await controller.findAll(req, { favorited: 'someuser' });

      // assert
      expect(userService.findOne).toHaveBeenCalledWith({ username: 'someuser' });
      expect(result).toBeInstanceOf(ListSuccessResponse);
    });
  });

  // ──────────────────────────────────────────────
  // findAllFeed
  // ──────────────────────────────────────────────
  describe('findAllFeed', () => {
    it('팔로우한 사용자의 게시글 피드를 반환해야 한다', async () => {
      // arrange
      const req = mockReq();
      const follows = [{ followedId: 'followed-uuid', followerId: 'author-uuid' }];
      (followService.findAll as jest.Mock).mockResolvedValue(follows);
      (articleService.findAll as jest.Mock).mockResolvedValue([mockArticle]);
      (articleService.count as jest.Mock).mockResolvedValue(1);

      // act
      const result = await controller.findAllFeed(req, {});

      // assert
      expect(followService.findAll).toHaveBeenCalled();
      expect(articleService.findAll).toHaveBeenCalled();
      expect(result).toBeInstanceOf(ListSuccessResponse);
      expect((result as any).total).toBe(1);
    });

    it('팔로우한 사용자가 없으면 빈 목록을 반환해야 한다', async () => {
      // arrange
      const req = mockReq();
      (followService.findAll as jest.Mock).mockResolvedValue([]);
      (articleService.findAll as jest.Mock).mockResolvedValue([]);
      (articleService.count as jest.Mock).mockResolvedValue(0);

      // act
      const result = await controller.findAllFeed(req, {});

      // assert
      expect(result).toBeInstanceOf(ListSuccessResponse);
      expect((result as any).total).toBe(0);
      expect((result as any).listData).toHaveLength(0);
    });
  });

  // ──────────────────────────────────────────────
  // favoriteAnArticle
  // ──────────────────────────────────────────────
  describe('favoriteAnArticle', () => {
    it('좋아요하지 않은 게시글에 좋아요 추가 시 insert를 호출해야 한다', async () => {
      // arrange
      const req = mockReq();
      (favoriteService.findOne as jest.Mock).mockResolvedValue(null); // 아직 좋아요 안 함
      (favoriteService.insert as jest.Mock).mockResolvedValue(undefined);
      (articleService.findOne as jest.Mock).mockResolvedValue(mockArticle);

      // act
      const result = await controller.favoriteAnArticle(req, 'test-article-1234567890');

      // assert
      expect(favoriteService.findOne).toHaveBeenCalledWith({
        userId: 'author-uuid',
        articleSlug: 'test-article-1234567890',
      });
      expect(favoriteService.insert).toHaveBeenCalledWith({
        userId: 'author-uuid',
        articleSlug: 'test-article-1234567890',
      });
      expect(result).toBeInstanceOf(ActionSuccessResponse);
    });

    it('이미 좋아요한 게시글에는 insert를 중복 호출하지 않아야 한다', async () => {
      // arrange
      const req = mockReq();
      const existingFavorite = { id: 'fav-uuid', userId: 'author-uuid', articleSlug: 'test-article-1234567890' };
      (favoriteService.findOne as jest.Mock).mockResolvedValue(existingFavorite); // 이미 좋아요
      (articleService.findOne as jest.Mock).mockResolvedValue(mockArticle);

      // act
      const result = await controller.favoriteAnArticle(req, 'test-article-1234567890');

      // assert
      expect(favoriteService.insert).not.toHaveBeenCalled();
      expect(result).toBeInstanceOf(ActionSuccessResponse);
    });
  });

  // ──────────────────────────────────────────────
  // unfavoriteAnArticle
  // ──────────────────────────────────────────────
  describe('unfavoriteAnArticle', () => {
    it('좋아요한 게시글의 좋아요 취소 시 softDelete를 호출해야 한다', async () => {
      // arrange
      const req = mockReq();
      const existingFavorite = { id: 'fav-uuid', userId: 'author-uuid', articleSlug: 'test-article-1234567890' };
      (favoriteService.findOne as jest.Mock).mockResolvedValue(existingFavorite);
      (favoriteService.softDelete as jest.Mock).mockResolvedValue(undefined);
      (articleService.findOne as jest.Mock).mockResolvedValue(mockArticle);

      // act
      const result = await controller.unfavoriteAnArticle(req, 'test-article-1234567890');

      // assert
      expect(favoriteService.softDelete).toHaveBeenCalledWith({
        userId: 'author-uuid',
        articleSlug: 'test-article-1234567890',
      });
      expect(result).toBeInstanceOf(ActionSuccessResponse);
    });

    it('좋아요하지 않은 게시글 좋아요 취소 시 softDelete를 호출하지 않아야 한다', async () => {
      // arrange
      const req = mockReq();
      (favoriteService.findOne as jest.Mock).mockResolvedValue(null); // 좋아요 안 한 상태
      (articleService.findOne as jest.Mock).mockResolvedValue(mockArticle);

      // act
      const result = await controller.unfavoriteAnArticle(req, 'test-article-1234567890');

      // assert
      expect(favoriteService.softDelete).not.toHaveBeenCalled();
      expect(result).toBeInstanceOf(ActionSuccessResponse);
    });
  });

  // ──────────────────────────────────────────────
  // findAllComments
  // ──────────────────────────────────────────────
  describe('findAllComments', () => {
    it('게시글 댓글 목록을 반환해야 한다', async () => {
      // arrange
      const req = { headers: { authorization: 'Bearer test-token' } };
      (userService.getJwtInfo as jest.Mock).mockReturnValue({ sub: 'reader-uuid', email: 'r@test.com', username: 'reader', iat: 0, exp: 9999 });
      (commentService.findAll as jest.Mock).mockResolvedValue([mockComment]);
      (commentService.count as jest.Mock).mockResolvedValue(1);

      // act
      const result = await controller.findAllComments(req, 'test-article-1234567890');

      // assert
      expect(commentService.findAll).toHaveBeenCalled();
      expect(commentService.count).toHaveBeenCalled();
      expect(result).toBeInstanceOf(ListSuccessResponse);
      expect((result as any).total).toBe(1);
      expect((result as any).listData).toHaveLength(1);
    });

    it('댓글이 없으면 빈 목록을 반환해야 한다', async () => {
      // arrange
      const req = { headers: {} };
      (userService.getJwtInfo as jest.Mock).mockReturnValue(null);
      (commentService.findAll as jest.Mock).mockResolvedValue([]);
      (commentService.count as jest.Mock).mockResolvedValue(0);

      // act
      const result = await controller.findAllComments(req, 'test-article-1234567890');

      // assert
      expect(result).toBeInstanceOf(ListSuccessResponse);
      expect((result as any).total).toBe(0);
      expect((result as any).listData).toHaveLength(0);
    });
  });

  // ──────────────────────────────────────────────
  // createAComment
  // ──────────────────────────────────────────────
  describe('createAComment', () => {
    it('댓글 생성 시 ActionSuccessResponse를 반환해야 한다', async () => {
      // arrange
      const req = mockReq();
      const newComment = { body: '새로운 댓글입니다' };
      (commentService.insert as jest.Mock).mockResolvedValue(undefined);

      // act
      const result = await controller.createAComment(req, 'test-article-1234567890', newComment);

      // assert
      expect(commentService.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          body: '새로운 댓글입니다',
          authorId: 'author-uuid',
          articleSlug: 'test-article-1234567890',
        })
      );
      expect(result).toBeInstanceOf(ActionSuccessResponse);
      expect((result as any).data).toBeDefined();
    });
  });

  // ──────────────────────────────────────────────
  // deleteAComment
  // ──────────────────────────────────────────────
  describe('deleteAComment', () => {
    it('작성자가 본인 댓글을 삭제하면 ActionSuccessResponse를 반환해야 한다', async () => {
      // arrange
      const req = mockReq('author-uuid');
      (commentService.findOne as jest.Mock).mockResolvedValue(mockComment);
      (commentService.softDelete as jest.Mock).mockResolvedValue(undefined);

      // act
      const result = await controller.deleteAComment(req, 'test-article-1234567890', 'comment-uuid');

      // assert
      expect(commentService.softDelete).toHaveBeenCalledWith({
        articleSlug: 'test-article-1234567890',
        id: 'comment-uuid',
      });
      expect(result).toBeInstanceOf(ActionSuccessResponse);
      expect(result.message).toBe(DELETED_MSG);
      expect((result as any).data).toBeNull();
    });

    it('존재하지 않는 댓글 삭제 시 NotFoundException을 던져야 한다', async () => {
      // arrange
      const req = mockReq();
      (commentService.findOne as jest.Mock).mockResolvedValue(null);

      // act & assert
      await expect(
        controller.deleteAComment(req, 'test-article-1234567890', 'no-such-id')
      ).rejects.toThrow(NotFoundException);
      expect(commentService.softDelete).not.toHaveBeenCalled();
    });

    it('작성자가 아닌 사용자가 댓글 삭제 시도하면 UnauthorizedException을 던져야 한다', async () => {
      // arrange
      const req = mockReq('other-user-uuid');
      (commentService.findOne as jest.Mock).mockResolvedValue(mockComment); // authorId: 'author-uuid'

      // act & assert
      await expect(
        controller.deleteAComment(req, 'test-article-1234567890', 'comment-uuid')
      ).rejects.toThrow(UnauthorizedException);
      expect(commentService.softDelete).not.toHaveBeenCalled();
    });
  });

  // ──────────────────────────────────────────────
  // findAllTags
  // ──────────────────────────────────────────────
  describe('findAllTags', () => {
    it('모든 태그 이름 목록을 반환해야 한다', async () => {
      // arrange
      const tags = [
        { id: 'tag-1', name: 'nestjs', count: 5 },
        { id: 'tag-2', name: 'jest', count: 3 },
      ];
      (tagService.findAll as jest.Mock).mockResolvedValue(tags);
      (tagService.count as jest.Mock).mockResolvedValue(2);

      // act
      const result = await controller.findAllTags({});

      // assert
      expect(tagService.findAll).toHaveBeenCalled();
      expect(tagService.count).toHaveBeenCalled();
      expect(result).toBeInstanceOf(ListSuccessResponse);
      expect((result as any).listData).toEqual(['nestjs', 'jest']);
      expect((result as any).total).toBe(2);
    });

    it('태그가 없으면 빈 목록을 반환해야 한다', async () => {
      // arrange
      (tagService.findAll as jest.Mock).mockResolvedValue([]);
      (tagService.count as jest.Mock).mockResolvedValue(0);

      // act
      const result = await controller.findAllTags({});

      // assert
      expect(result).toBeInstanceOf(ListSuccessResponse);
      expect((result as any).listData).toEqual([]);
      expect((result as any).total).toBe(0);
    });
  });
});
