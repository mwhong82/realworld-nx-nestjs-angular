import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { Article } from './article.entity';
import { ArticleService } from './article.service';

// 테스트용 게시글 픽스처
const mockArticle: Partial<Article> = {
  id: 'article-uuid-001',
  slug: 'test-article-slug',
  title: '테스트 게시글',
  description: '테스트 설명',
  body: '테스트 본문 내용',
  authorId: 'user-uuid-001',
  tagList: ['nestjs', 'typescript'],
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-02'),
};

const mockArticle2: Partial<Article> = {
  id: 'article-uuid-002',
  slug: 'second-article-slug',
  title: '두 번째 게시글',
  description: '두 번째 설명',
  body: '두 번째 본문',
  authorId: 'user-uuid-002',
  tagList: ['angular'],
  createdAt: new Date('2024-01-03'),
  updatedAt: new Date('2024-01-04'),
};

describe('ArticleService', () => {
  let service: ArticleService;
  let repository: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ArticleService,
        {
          provide: getRepositoryToken(Article),
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

    service = module.get<ArticleService>(ArticleService);
    repository = module.get(getRepositoryToken(Article));
  });

  it('ArticleService 인스턴스가 정의되어 있어야 한다', () => {
    expect(service).toBeDefined();
  });

  // ──────────────────────────────────────────────
  // findAll (BaseService 위임)
  // ──────────────────────────────────────────────
  describe('findAll()', () => {
    it('전체 게시글 목록을 반환해야 한다', async () => {
      repository.find.mockResolvedValue([mockArticle, mockArticle2]);

      const result = await service.findAll();

      expect(repository.find).toHaveBeenCalledWith(undefined);
      expect(result).toHaveLength(2);
      expect(result[0].slug).toBe('test-article-slug');
      expect(result[1].slug).toBe('second-article-slug');
    });

    it('게시글이 없으면 빈 배열을 반환해야 한다', async () => {
      repository.find.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });

    it('authorId 조건으로 필터링된 게시글 목록을 반환해야 한다', async () => {
      const options = { where: { authorId: 'user-uuid-001' } };
      repository.find.mockResolvedValue([mockArticle]);

      const result = await service.findAll(options);

      expect(repository.find).toHaveBeenCalledWith(options);
      expect(result).toHaveLength(1);
      expect(result[0].authorId).toBe('user-uuid-001');
    });
  });

  // ──────────────────────────────────────────────
  // findOne (BaseService 위임)
  // ──────────────────────────────────────────────
  describe('findOne()', () => {
    it('slug 조건으로 게시글을 찾아 반환해야 한다', async () => {
      repository.findOne.mockResolvedValue(mockArticle);

      const result = await service.findOne({ slug: 'test-article-slug' });

      expect(repository.findOne).toHaveBeenCalledWith(
        { slug: 'test-article-slug' },
        undefined
      );
      expect(result).toEqual(mockArticle);
    });

    it('존재하지 않는 slug면 undefined를 반환해야 한다', async () => {
      repository.findOne.mockResolvedValue(undefined);

      const result = await service.findOne({ slug: 'ghost-slug' });

      expect(result).toBeUndefined();
    });

    it('id 조건으로 게시글을 찾아 반환해야 한다', async () => {
      repository.findOne.mockResolvedValue(mockArticle);

      const result = await service.findOne({ id: 'article-uuid-001' });

      expect(repository.findOne).toHaveBeenCalledWith(
        { id: 'article-uuid-001' },
        undefined
      );
      expect(result.title).toBe('테스트 게시글');
    });
  });

  // ──────────────────────────────────────────────
  // insert (BaseService 위임)
  // ──────────────────────────────────────────────
  describe('insert()', () => {
    it('새 게시글을 삽입하고 InsertResult를 반환해야 한다', async () => {
      const insertResult = {
        identifiers: [{ id: 'new-article-uuid' }],
        generatedMaps: [],
        raw: [],
      };
      repository.insert.mockResolvedValue(insertResult);

      const newArticle = {
        slug: 'new-article',
        title: '새 게시글',
        description: '새 설명',
        body: '새 본문',
        authorId: 'user-uuid-001',
        tagList: ['new'],
      };

      const result = await service.insert(newArticle);

      expect(repository.insert).toHaveBeenCalledWith(newArticle);
      expect(result.identifiers[0].id).toBe('new-article-uuid');
    });
  });

  // ──────────────────────────────────────────────
  // update (BaseService 위임)
  // ──────────────────────────────────────────────
  describe('update()', () => {
    it('slug 조건으로 게시글을 업데이트하고 UpdateResult를 반환해야 한다', async () => {
      const updateResult = { affected: 1, generatedMaps: [], raw: [] };
      repository.update.mockResolvedValue(updateResult);

      const result = await service.update(
        { slug: 'test-article-slug' },
        { title: '수정된 제목' }
      );

      expect(repository.update).toHaveBeenCalledWith(
        { slug: 'test-article-slug' },
        { title: '수정된 제목' }
      );
      expect(result.affected).toBe(1);
    });

    it('존재하지 않는 게시글 업데이트 시 affected가 0이어야 한다', async () => {
      const updateResult = { affected: 0, generatedMaps: [], raw: [] };
      repository.update.mockResolvedValue(updateResult);

      const result = await service.update(
        { slug: 'non-existent-slug' },
        { title: '수정 시도' }
      );

      expect(result.affected).toBe(0);
    });
  });

  // ──────────────────────────────────────────────
  // softDelete (BaseService 위임)
  // ──────────────────────────────────────────────
  describe('softDelete()', () => {
    it('slug 조건으로 게시글을 소프트 삭제해야 한다', async () => {
      const updateResult = { affected: 1, generatedMaps: [], raw: [] };
      repository.softDelete.mockResolvedValue(updateResult);

      const result = await service.softDelete({ slug: 'test-article-slug' });

      expect(repository.softDelete).toHaveBeenCalledWith({ slug: 'test-article-slug' });
      expect(result.affected).toBe(1);
    });
  });

  // ──────────────────────────────────────────────
  // count (BaseService 위임)
  // ──────────────────────────────────────────────
  describe('count()', () => {
    it('특정 태그를 가진 게시글 수를 반환해야 한다', async () => {
      repository.count.mockResolvedValue(3);

      const result = await service.count({ where: { authorId: 'user-uuid-001' } });

      expect(repository.count).toHaveBeenCalledWith({ where: { authorId: 'user-uuid-001' } });
      expect(result).toBe(3);
    });

    it('옵션 없이 호출하면 전체 게시글 수를 반환해야 한다', async () => {
      repository.count.mockResolvedValue(10);

      const result = await service.count();

      expect(repository.count).toHaveBeenCalledWith({});
      expect(result).toBe(10);
    });
  });
});
