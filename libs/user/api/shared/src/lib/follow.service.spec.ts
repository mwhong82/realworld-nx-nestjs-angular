import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { Follow } from './follow.entity';
import { FollowService } from './follow.service';

// 테스트용 팔로우 픽스처
const mockFollow: Partial<Follow> = {
  id: 'follow-uuid-001',
  followerId: 'user-uuid-001',
  followedId: 'user-uuid-002',
  createdAt: new Date('2024-01-01'),
};

describe('FollowService', () => {
  let service: FollowService;
  let repository: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FollowService,
        {
          provide: getRepositoryToken(Follow),
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

    service = module.get<FollowService>(FollowService);
    repository = module.get(getRepositoryToken(Follow));
  });

  it('FollowService 인스턴스가 정의되어 있어야 한다', () => {
    expect(service).toBeDefined();
  });

  // ──────────────────────────────────────────────
  // findAll (BaseService 위임)
  // ──────────────────────────────────────────────
  describe('findAll()', () => {
    it('전체 팔로우 목록을 반환해야 한다', async () => {
      repository.find.mockResolvedValue([mockFollow]);

      const result = await service.findAll();

      expect(repository.find).toHaveBeenCalledWith(undefined);
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockFollow);
    });

    it('팔로우가 없으면 빈 배열을 반환해야 한다', async () => {
      repository.find.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });

    it('옵션을 전달하면 해당 조건으로 조회해야 한다', async () => {
      const options = { where: { followerId: 'user-uuid-001' } };
      repository.find.mockResolvedValue([mockFollow]);

      await service.findAll(options);

      expect(repository.find).toHaveBeenCalledWith(options);
    });
  });

  // ──────────────────────────────────────────────
  // findOne (BaseService 위임)
  // ──────────────────────────────────────────────
  describe('findOne()', () => {
    it('followerId와 followedId 조건에 맞는 팔로우를 반환해야 한다', async () => {
      repository.findOne.mockResolvedValue(mockFollow);

      const result = await service.findOne({
        followerId: 'user-uuid-001',
        followedId: 'user-uuid-002',
      });

      expect(repository.findOne).toHaveBeenCalledWith(
        { followerId: 'user-uuid-001', followedId: 'user-uuid-002' },
        undefined
      );
      expect(result).toEqual(mockFollow);
    });

    it('조건에 맞는 팔로우가 없으면 undefined를 반환해야 한다', async () => {
      repository.findOne.mockResolvedValue(undefined);

      const result = await service.findOne({
        followerId: 'unknown-user',
        followedId: 'user-uuid-002',
      });

      expect(result).toBeUndefined();
    });
  });

  // ──────────────────────────────────────────────
  // insert (BaseService 위임)
  // ──────────────────────────────────────────────
  describe('insert()', () => {
    it('새 팔로우 관계를 삽입해야 한다', async () => {
      const insertResult = { identifiers: [{ id: 'new-follow-uuid' }], generatedMaps: [], raw: [] };
      repository.insert.mockResolvedValue(insertResult);

      const result = await service.insert({
        followerId: 'user-uuid-001',
        followedId: 'user-uuid-003',
      });

      expect(repository.insert).toHaveBeenCalledWith({
        followerId: 'user-uuid-001',
        followedId: 'user-uuid-003',
      });
      expect(result).toEqual(insertResult);
    });
  });

  // ──────────────────────────────────────────────
  // softDelete (BaseService 위임)
  // ──────────────────────────────────────────────
  describe('softDelete()', () => {
    it('팔로우 관계를 소프트 삭제해야 한다', async () => {
      const updateResult = { affected: 1, generatedMaps: [], raw: [] };
      repository.softDelete.mockResolvedValue(updateResult);

      const result = await service.softDelete({
        followerId: 'user-uuid-001',
        followedId: 'user-uuid-002',
      });

      expect(repository.softDelete).toHaveBeenCalledWith({
        followerId: 'user-uuid-001',
        followedId: 'user-uuid-002',
      });
      expect(result.affected).toBe(1);
    });
  });

  // ──────────────────────────────────────────────
  // count (BaseService 위임)
  // ──────────────────────────────────────────────
  describe('count()', () => {
    it('특정 사용자가 팔로우하는 수를 반환해야 한다', async () => {
      repository.count.mockResolvedValue(5);

      const result = await service.count({ where: { followerId: 'user-uuid-001' } });

      expect(repository.count).toHaveBeenCalledWith({ where: { followerId: 'user-uuid-001' } });
      expect(result).toBe(5);
    });
  });
});
