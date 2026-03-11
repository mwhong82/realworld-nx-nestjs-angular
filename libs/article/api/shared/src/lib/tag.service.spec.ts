import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { Tag } from './tag.entity';
import { TagService } from './tag.service';

// 테스트용 태그 픽스처
const mockTag: Partial<Tag> = {
  id: 'tag-uuid-001',
  name: 'nestjs',
  count: 10,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-02'),
};

const mockTag2: Partial<Tag> = {
  id: 'tag-uuid-002',
  name: 'typescript',
  count: 25,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-02'),
};

const mockTag3: Partial<Tag> = {
  id: 'tag-uuid-003',
  name: 'angular',
  count: 8,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-02'),
};

describe('TagService', () => {
  let service: TagService;
  let repository: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TagService,
        {
          provide: getRepositoryToken(Tag),
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

    service = module.get<TagService>(TagService);
    repository = module.get(getRepositoryToken(Tag));
  });

  it('TagService 인스턴스가 정의되어 있어야 한다', () => {
    expect(service).toBeDefined();
  });

  // ──────────────────────────────────────────────
  // findAll (BaseService 위임)
  // ──────────────────────────────────────────────
  describe('findAll()', () => {
    it('전체 태그 목록을 반환해야 한다', async () => {
      repository.find.mockResolvedValue([mockTag, mockTag2, mockTag3]);

      const result = await service.findAll();

      expect(repository.find).toHaveBeenCalledWith(undefined);
      expect(result).toHaveLength(3);
      expect(result[0].name).toBe('nestjs');
      expect(result[1].name).toBe('typescript');
      expect(result[2].name).toBe('angular');
    });

    it('태그가 없으면 빈 배열을 반환해야 한다', async () => {
      repository.find.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });

    it('정렬 옵션을 전달하면 해당 순서로 조회해야 한다', async () => {
      const options = { order: { count: 'DESC' as const } };
      repository.find.mockResolvedValue([mockTag2, mockTag, mockTag3]);

      const result = await service.findAll(options);

      expect(repository.find).toHaveBeenCalledWith(options);
      expect(result[0].count).toBe(25);
    });
  });

  // ──────────────────────────────────────────────
  // findOne (BaseService 위임)
  // ──────────────────────────────────────────────
  describe('findOne()', () => {
    it('name 조건으로 태그를 찾아 반환해야 한다', async () => {
      repository.findOne.mockResolvedValue(mockTag);

      const result = await service.findOne({ name: 'nestjs' });

      expect(repository.findOne).toHaveBeenCalledWith(
        { name: 'nestjs' },
        undefined
      );
      expect(result).toEqual(mockTag);
      expect(result.count).toBe(10);
    });

    it('존재하지 않는 태그명이면 undefined를 반환해야 한다', async () => {
      repository.findOne.mockResolvedValue(undefined);

      const result = await service.findOne({ name: 'non-existent-tag' });

      expect(result).toBeUndefined();
    });

    it('id 조건으로 태그를 찾아 반환해야 한다', async () => {
      repository.findOne.mockResolvedValue(mockTag2);

      const result = await service.findOne({ id: 'tag-uuid-002' });

      expect(repository.findOne).toHaveBeenCalledWith(
        { id: 'tag-uuid-002' },
        undefined
      );
      expect(result.name).toBe('typescript');
    });
  });

  // ──────────────────────────────────────────────
  // insert (BaseService 위임)
  // ──────────────────────────────────────────────
  describe('insert()', () => {
    it('새 태그를 삽입하고 InsertResult를 반환해야 한다', async () => {
      const insertResult = {
        identifiers: [{ id: 'new-tag-uuid' }],
        generatedMaps: [],
        raw: [],
      };
      repository.insert.mockResolvedValue(insertResult);

      const newTag = { name: 'rxjs', count: 1 };

      const result = await service.insert(newTag);

      expect(repository.insert).toHaveBeenCalledWith(newTag);
      expect(result.identifiers[0].id).toBe('new-tag-uuid');
    });
  });

  // ──────────────────────────────────────────────
  // update (BaseService 위임)
  // ──────────────────────────────────────────────
  describe('update()', () => {
    it('태그 count를 업데이트하고 UpdateResult를 반환해야 한다', async () => {
      const updateResult = { affected: 1, generatedMaps: [], raw: [] };
      repository.update.mockResolvedValue(updateResult);

      const result = await service.update(
        { name: 'nestjs' },
        { count: 11 }
      );

      expect(repository.update).toHaveBeenCalledWith(
        { name: 'nestjs' },
        { count: 11 }
      );
      expect(result.affected).toBe(1);
    });

    it('존재하지 않는 태그 업데이트 시 affected가 0이어야 한다', async () => {
      const updateResult = { affected: 0, generatedMaps: [], raw: [] };
      repository.update.mockResolvedValue(updateResult);

      const result = await service.update(
        { name: 'ghost-tag' },
        { count: 99 }
      );

      expect(result.affected).toBe(0);
    });
  });

  // ──────────────────────────────────────────────
  // softDelete (BaseService 위임)
  // ──────────────────────────────────────────────
  describe('softDelete()', () => {
    it('name 조건으로 태그를 소프트 삭제해야 한다', async () => {
      const updateResult = { affected: 1, generatedMaps: [], raw: [] };
      repository.softDelete.mockResolvedValue(updateResult);

      const result = await service.softDelete({ name: 'nestjs' });

      expect(repository.softDelete).toHaveBeenCalledWith({ name: 'nestjs' });
      expect(result.affected).toBe(1);
    });
  });

  // ──────────────────────────────────────────────
  // count (BaseService 위임)
  // ──────────────────────────────────────────────
  describe('count()', () => {
    it('태그 총 개수를 반환해야 한다', async () => {
      repository.count.mockResolvedValue(3);

      const result = await service.count();

      expect(repository.count).toHaveBeenCalledWith({});
      expect(result).toBe(3);
    });

    it('조건 없이 호출하면 전체 태그 수를 반환해야 한다', async () => {
      repository.count.mockResolvedValue(100);

      const result = await service.count({});

      expect(result).toBe(100);
    });
  });
});
