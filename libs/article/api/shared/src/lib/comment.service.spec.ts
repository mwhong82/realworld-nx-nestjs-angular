import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { Comment } from './comment.entity';
import { CommentService } from './comment.service';

// 테스트용 댓글 픽스처
const mockComment: Partial<Comment> = {
  id: 'comment-uuid-001',
  articleSlug: 'test-article-slug',
  authorId: 'user-uuid-001',
  body: '테스트 댓글 내용입니다.',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-02'),
};

const mockComment2: Partial<Comment> = {
  id: 'comment-uuid-002',
  articleSlug: 'test-article-slug',
  authorId: 'user-uuid-002',
  body: '두 번째 댓글입니다.',
  createdAt: new Date('2024-01-03'),
  updatedAt: new Date('2024-01-04'),
};

describe('CommentService', () => {
  let service: CommentService;
  let repository: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentService,
        {
          provide: getRepositoryToken(Comment),
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

    service = module.get<CommentService>(CommentService);
    repository = module.get(getRepositoryToken(Comment));
  });

  it('CommentService 인스턴스가 정의되어 있어야 한다', () => {
    expect(service).toBeDefined();
  });

  // ──────────────────────────────────────────────
  // findAll (BaseService 위임)
  // ──────────────────────────────────────────────
  describe('findAll()', () => {
    it('특정 게시글의 댓글 목록을 반환해야 한다', async () => {
      const options = { where: { articleSlug: 'test-article-slug' } };
      repository.find.mockResolvedValue([mockComment, mockComment2]);

      const result = await service.findAll(options);

      expect(repository.find).toHaveBeenCalledWith(options);
      expect(result).toHaveLength(2);
      expect(result[0].articleSlug).toBe('test-article-slug');
      expect(result[1].authorId).toBe('user-uuid-002');
    });

    it('댓글이 없으면 빈 배열을 반환해야 한다', async () => {
      repository.find.mockResolvedValue([]);

      const result = await service.findAll({ where: { articleSlug: 'no-comments-slug' } });

      expect(result).toEqual([]);
    });

    it('옵션 없이 호출하면 전체 댓글을 반환해야 한다', async () => {
      repository.find.mockResolvedValue([mockComment, mockComment2]);

      const result = await service.findAll();

      expect(repository.find).toHaveBeenCalledWith(undefined);
      expect(result).toHaveLength(2);
    });
  });

  // ──────────────────────────────────────────────
  // findOne (BaseService 위임)
  // ──────────────────────────────────────────────
  describe('findOne()', () => {
    it('id 조건으로 댓글을 찾아 반환해야 한다', async () => {
      repository.findOne.mockResolvedValue(mockComment);

      const result = await service.findOne({ id: 'comment-uuid-001' });

      expect(repository.findOne).toHaveBeenCalledWith(
        { id: 'comment-uuid-001' },
        undefined
      );
      expect(result).toEqual(mockComment);
      expect(result.body).toBe('테스트 댓글 내용입니다.');
    });

    it('존재하지 않는 id면 undefined를 반환해야 한다', async () => {
      repository.findOne.mockResolvedValue(undefined);

      const result = await service.findOne({ id: 'ghost-comment-id' });

      expect(result).toBeUndefined();
    });

    it('authorId와 articleSlug 복합 조건으로 댓글을 찾아야 한다', async () => {
      repository.findOne.mockResolvedValue(mockComment);

      const result = await service.findOne({
        authorId: 'user-uuid-001',
        articleSlug: 'test-article-slug',
      });

      expect(repository.findOne).toHaveBeenCalledWith(
        { authorId: 'user-uuid-001', articleSlug: 'test-article-slug' },
        undefined
      );
      expect(result).toEqual(mockComment);
    });
  });

  // ──────────────────────────────────────────────
  // insert (BaseService 위임)
  // ──────────────────────────────────────────────
  describe('insert()', () => {
    it('새 댓글을 삽입하고 InsertResult를 반환해야 한다', async () => {
      const insertResult = {
        identifiers: [{ id: 'new-comment-uuid' }],
        generatedMaps: [],
        raw: [],
      };
      repository.insert.mockResolvedValue(insertResult);

      const newComment = {
        articleSlug: 'test-article-slug',
        authorId: 'user-uuid-003',
        body: '새로 작성한 댓글',
      };

      const result = await service.insert(newComment);

      expect(repository.insert).toHaveBeenCalledWith(newComment);
      expect(result.identifiers[0].id).toBe('new-comment-uuid');
    });
  });

  // ──────────────────────────────────────────────
  // softDelete (BaseService 위임)
  // ──────────────────────────────────────────────
  describe('softDelete()', () => {
    it('id 조건으로 댓글을 소프트 삭제해야 한다', async () => {
      const updateResult = { affected: 1, generatedMaps: [], raw: [] };
      repository.softDelete.mockResolvedValue(updateResult);

      const result = await service.softDelete({ id: 'comment-uuid-001' });

      expect(repository.softDelete).toHaveBeenCalledWith({ id: 'comment-uuid-001' });
      expect(result.affected).toBe(1);
    });

    it('존재하지 않는 댓글 삭제 시 affected가 0이어야 한다', async () => {
      const updateResult = { affected: 0, generatedMaps: [], raw: [] };
      repository.softDelete.mockResolvedValue(updateResult);

      const result = await service.softDelete({ id: 'ghost-comment-id' });

      expect(result.affected).toBe(0);
    });
  });

  // ──────────────────────────────────────────────
  // count (BaseService 위임)
  // ──────────────────────────────────────────────
  describe('count()', () => {
    it('특정 게시글의 댓글 수를 반환해야 한다', async () => {
      repository.count.mockResolvedValue(7);

      const result = await service.count({ where: { articleSlug: 'test-article-slug' } });

      expect(repository.count).toHaveBeenCalledWith({ where: { articleSlug: 'test-article-slug' } });
      expect(result).toBe(7);
    });

    it('옵션 없이 호출하면 전체 댓글 수를 반환해야 한다', async () => {
      repository.count.mockResolvedValue(42);

      const result = await service.count();

      expect(repository.count).toHaveBeenCalledWith({});
      expect(result).toBe(42);
    });
  });
});
