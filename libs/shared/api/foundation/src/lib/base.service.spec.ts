import { Repository } from 'typeorm';
import { BaseService } from './base.service';

// 테스트용 엔티티
class TestEntity {
  id: number;
  name: string;
}

// BaseService는 abstract이므로 구체 서브클래스를 생성
class TestService extends BaseService<TestEntity> {
  constructor(repo: Repository<TestEntity>) {
    super();
    this.repository = repo;
  }
}

describe('BaseService', () => {
  let service: TestService;
  let mockRepository: jest.Mocked<Repository<TestEntity>>;

  beforeEach(() => {
    mockRepository = {
      find: jest.fn(),
      count: jest.fn(),
      findOne: jest.fn(),
      insert: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
    } as unknown as jest.Mocked<Repository<TestEntity>>;

    service = new TestService(mockRepository);
  });

  describe('findAll', () => {
    it('옵션 없이 repository.find를 호출해야 한다', async () => {
      const entities = [{ id: 1, name: 'test' }];
      mockRepository.find.mockResolvedValue(entities);

      const result = await service.findAll();

      expect(mockRepository.find).toHaveBeenCalledWith(undefined);
      expect(result).toEqual(entities);
    });

    it('옵션을 전달하면 repository.find에 옵션이 전달되어야 한다', async () => {
      const options = { where: { name: 'test' } };
      const entities = [{ id: 1, name: 'test' }];
      mockRepository.find.mockResolvedValue(entities);

      const result = await service.findAll(options);

      expect(mockRepository.find).toHaveBeenCalledWith(options);
      expect(result).toEqual(entities);
    });

    it('빈 배열을 반환할 수 있어야 한다', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('count', () => {
    it('옵션 없이 호출하면 빈 객체로 repository.count를 호출해야 한다', async () => {
      mockRepository.count.mockResolvedValue(5);

      const result = await service.count();

      expect(mockRepository.count).toHaveBeenCalledWith({});
      expect(result).toBe(5);
    });

    it('옵션을 전달하면 repository.count에 옵션이 전달되어야 한다', async () => {
      const options = { where: { name: 'test' } };
      mockRepository.count.mockResolvedValue(3);

      const result = await service.count(options);

      expect(mockRepository.count).toHaveBeenCalledWith(options);
      expect(result).toBe(3);
    });

    it('0을 반환할 수 있어야 한다', async () => {
      mockRepository.count.mockResolvedValue(0);

      const result = await service.count();

      expect(result).toBe(0);
    });
  });

  describe('findOne', () => {
    it('조건과 옵션을 repository.findOne에 전달해야 한다', async () => {
      const conditions = { id: 1 };
      const options = { select: ['id', 'name'] as any };
      const entity = { id: 1, name: 'test' };
      mockRepository.findOne.mockResolvedValue(entity);

      const result = await service.findOne(conditions, options);

      expect(mockRepository.findOne).toHaveBeenCalledWith(conditions, options);
      expect(result).toEqual(entity);
    });

    it('조건만 전달해도 동작해야 한다', async () => {
      const conditions = { id: 2 };
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.findOne(conditions);

      expect(mockRepository.findOne).toHaveBeenCalledWith(conditions, undefined);
      expect(result).toBeNull();
    });

    it('엔티티가 없으면 undefined를 반환해야 한다', async () => {
      mockRepository.findOne.mockResolvedValue(undefined);

      const result = await service.findOne({ id: 999 });

      expect(result).toBeUndefined();
    });
  });

  describe('insert', () => {
    it('단일 엔티티 데이터를 repository.insert에 전달해야 한다', async () => {
      const data = { name: 'new entity' };
      const insertResult = { identifiers: [{ id: 1 }], generatedMaps: [], raw: {} };
      mockRepository.insert.mockResolvedValue(insertResult as any);

      const result = await service.insert(data as any);

      expect(mockRepository.insert).toHaveBeenCalledWith(data);
      expect(result).toEqual(insertResult);
    });

    it('배열 형태의 데이터도 repository.insert에 전달해야 한다', async () => {
      const data = [{ name: 'entity1' }, { name: 'entity2' }];
      const insertResult = { identifiers: [{ id: 1 }, { id: 2 }], generatedMaps: [], raw: {} };
      mockRepository.insert.mockResolvedValue(insertResult as any);

      const result = await service.insert(data as any);

      expect(mockRepository.insert).toHaveBeenCalledWith(data);
      expect(result).toEqual(insertResult);
    });
  });

  describe('update', () => {
    it('조건과 데이터를 repository.update에 전달해야 한다', async () => {
      const condition = { id: 1 };
      const data = { name: 'updated name' };
      const updateResult = { affected: 1, generatedMaps: [], raw: {} };
      mockRepository.update.mockResolvedValue(updateResult as any);

      const result = await service.update(condition as any, data as any);

      expect(mockRepository.update).toHaveBeenCalledWith(condition, data);
      expect(result).toEqual(updateResult);
    });

    it('업데이트된 행이 없으면 affected가 0이어야 한다', async () => {
      const condition = { id: 9999 };
      const data = { name: 'no update' };
      const updateResult = { affected: 0, generatedMaps: [], raw: {} };
      mockRepository.update.mockResolvedValue(updateResult as any);

      const result = await service.update(condition as any, data as any);

      expect(result.affected).toBe(0);
    });
  });

  describe('softDelete', () => {
    it('조건을 repository.softDelete에 전달해야 한다', async () => {
      const condition = { id: 1 };
      const updateResult = { affected: 1, generatedMaps: [], raw: {} };
      mockRepository.softDelete.mockResolvedValue(updateResult as any);

      const result = await service.softDelete(condition as any);

      expect(mockRepository.softDelete).toHaveBeenCalledWith(condition);
      expect(result).toEqual(updateResult);
    });

    it('소프트 삭제 후 affected가 1이어야 한다', async () => {
      const condition = { id: 5 };
      const updateResult = { affected: 1, generatedMaps: [], raw: {} };
      mockRepository.softDelete.mockResolvedValue(updateResult as any);

      const result = await service.softDelete(condition as any);

      expect(result.affected).toBe(1);
    });

    it('존재하지 않는 엔티티 소프트 삭제 시 affected가 0이어야 한다', async () => {
      const condition = { id: 9999 };
      const updateResult = { affected: 0, generatedMaps: [], raw: {} };
      mockRepository.softDelete.mockResolvedValue(updateResult as any);

      const result = await service.softDelete(condition as any);

      expect(result.affected).toBe(0);
    });
  });
});
