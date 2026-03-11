import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { Favorite } from './favorite.entity';
import { FavoriteService } from './favorite.service';

// 테스트용 좋아요 픽스처
const mockFavorite: Partial<Favorite> = {
  id: 'favorite-uuid-001',
  userId: 'user-uuid-001',
  articleSlug: 'test-article-slug',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-02'),
};

const mockFavorite2: Partial<Favorite> = {
  id: 'favorite-uuid-002',
  userId: 'user-uuid-002',
  articleSlug: 'test-article-slug',
  createdAt: new Date('2024-01-03'),
  updatedAt: new Date('2024-01-04'),
};

describe('FavoriteService', () => {
  let service: FavoriteService;
  let repository: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FavoriteService,
        {
          provide: getRepositoryToken(Favorite),
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

    service = module.get<FavoriteService>(FavoriteService);
    repository = module.get(getRepositoryToken(Favorite));
  });

  it('FavoriteService 인스턴스가 정의되어 있어야 한다', () => {
    expect(service).toBeDefined();
  });

  // ──────────────────────────────────────────────
  // findAll (BaseService 위임)
  // ──────────────────────────────────────────────
  describe('findAll()', () => {
    it('특정 게시글의 좋아요 목록을 반환해야 한다', async () => {
      const options = { where: { articleSlug: 'test-article-slug' } };
      repository.find.mockResolvedValue([mockFavorite, mockFavorite2]);

      const result = await service.findAll(options);

      expect(repository.find).toHaveBeenCalledWith(options);
      expect(result).toHaveLength(2);
      expect(result[0].articleSlug).toBe('test-article-slug');
    });

    it('좋아요가 없으면 빈 배열을 반환해야 한다', async () => {
      repository.find.mockResolvedValue([]);

      const result = await service.findAll({ where: { articleSlug: 'no-likes-slug' } });

      expect(result).toEqual([]);
    });

    it('특정 사용자의 좋아요 목록을 반환해야 한다', async () => {
      const options = { where: { userId: 'user-uuid-001' } };
      repository.find.mockResolvedValue([mockFavorite]);

      const result = await service.findAll(options);

      expect(repository.find).toHaveBeenCalledWith(options);
      expect(result).toHaveLength(1);
      expect(result[0].userId).toBe('user-uuid-001');
    });
  });

  // ──────────────────────────────────────────────
  // findOne (BaseService 위임)
  // ──────────────────────────────────────────────
  describe('findOne()', () => {
    it('userId와 articleSlug 복합 조건으로 좋아요를 찾아야 한다', async () => {
      repository.findOne.mockResolvedValue(mockFavorite);

      const result = await service.findOne({
        userId: 'user-uuid-001',
        articleSlug: 'test-article-slug',
      });

      expect(repository.findOne).toHaveBeenCalledWith(
        { userId: 'user-uuid-001', articleSlug: 'test-article-slug' },
        undefined
      );
      expect(result).toEqual(mockFavorite);
    });

    it('좋아요가 없으면 undefined를 반환해야 한다', async () => {
      repository.findOne.mockResolvedValue(undefined);

      const result = await service.findOne({
        userId: 'user-uuid-999',
        articleSlug: 'test-article-slug',
      });

      expect(result).toBeUndefined();
    });
  });

  // ──────────────────────────────────────────────
  // insert (BaseService 위임)
  // ──────────────────────────────────────────────
  describe('insert()', () => {
    it('새 좋아요를 삽입하고 InsertResult를 반환해야 한다', async () => {
      const insertResult = {
        identifiers: [{ id: 'new-favorite-uuid' }],
        generatedMaps: [],
        raw: [],
      };
      repository.insert.mockResolvedValue(insertResult);

      const newFavorite = {
        userId: 'user-uuid-003',
        articleSlug: 'test-article-slug',
      };

      const result = await service.insert(newFavorite);

      expect(repository.insert).toHaveBeenCalledWith(newFavorite);
      expect(result.identifiers[0].id).toBe('new-favorite-uuid');
    });
  });

  // ──────────────────────────────────────────────
  // softDelete (BaseService 위임)
  // ──────────────────────────────────────────────
  describe('softDelete()', () => {
    it('userId와 articleSlug 조건으로 좋아요를 소프트 삭제해야 한다', async () => {
      const updateResult = { affected: 1, generatedMaps: [], raw: [] };
      repository.softDelete.mockResolvedValue(updateResult);

      const result = await service.softDelete({
        userId: 'user-uuid-001',
        articleSlug: 'test-article-slug',
      });

      expect(repository.softDelete).toHaveBeenCalledWith({
        userId: 'user-uuid-001',
        articleSlug: 'test-article-slug',
      });
      expect(result.affected).toBe(1);
    });

    it('존재하지 않는 좋아요 삭제 시 affected가 0이어야 한다', async () => {
      const updateResult = { affected: 0, generatedMaps: [], raw: [] };
      repository.softDelete.mockResolvedValue(updateResult);

      const result = await service.softDelete({
        userId: 'ghost-user',
        articleSlug: 'test-article-slug',
      });

      expect(result.affected).toBe(0);
    });
  });

  // ──────────────────────────────────────────────
  // count (BaseService 위임)
  // ──────────────────────────────────────────────
  describe('count()', () => {
    it('특정 게시글의 좋아요 수를 반환해야 한다', async () => {
      repository.count.mockResolvedValue(15);

      const result = await service.count({ where: { articleSlug: 'test-article-slug' } });

      expect(repository.count).toHaveBeenCalledWith({ where: { articleSlug: 'test-article-slug' } });
      expect(result).toBe(15);
    });

    it('좋아요가 없는 게시글의 count는 0이어야 한다', async () => {
      repository.count.mockResolvedValue(0);

      const result = await service.count({ where: { articleSlug: 'unpopular-slug' } });

      expect(result).toBe(0);
    });
  });
});
