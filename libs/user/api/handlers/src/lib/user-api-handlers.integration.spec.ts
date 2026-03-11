/**
 * User API 핸들러 통합 테스트
 *
 * 컨트롤러 → 서비스 → Mock 레포지토리 체인을 실제 데이터베이스 없이 테스트합니다.
 * 진짜 서비스 인스턴스를 사용하되 TypeORM 레포지토리는 Mock으로 대체합니다.
 */

import { BadRequestException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Follow, FollowService, User, UserService } from '@realworld/user/api/shared';
import * as bcrypt from 'bcrypt';
import { UserApiHandlersController } from './user-api-handlers.controller';

// bcrypt 전체 모킹 — 실제 해시 연산 없이 빠르게 테스트
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
    id: 'user-uuid-001',
    email: 'test@example.com',
    username: 'testuser',
    password: '$2b$10$hashedpassword',
    bio: '테스트 바이오',
    image: 'https://example.com/avatar.png',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    deletedDate: null,
    ...overrides,
  } as User;
}

// ─────────────────────────────────────────────
// 테스트 스위트
// ─────────────────────────────────────────────

describe('UserAPI 통합 테스트 (Controller → Service → MockRepository)', () => {
  let module: TestingModule;
  let controller: UserApiHandlersController;
  let mockUserRepo: ReturnType<typeof createMockRepository>;
  let mockFollowRepo: ReturnType<typeof createMockRepository>;
  let mockJwtService: { sign: jest.Mock; decode: jest.Mock };

  beforeEach(async () => {
    mockUserRepo = createMockRepository();
    mockFollowRepo = createMockRepository();
    mockJwtService = {
      sign: jest.fn().mockReturnValue('mock.jwt.token'),
      decode: jest.fn(),
    };

    module = await Test.createTestingModule({
      controllers: [UserApiHandlersController],
      providers: [
        UserService,   // 진짜 서비스
        FollowService, // 진짜 서비스
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepo,
        },
        {
          provide: getRepositoryToken(Follow),
          useValue: mockFollowRepo,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    controller = module.get(UserApiHandlersController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ──────────────────────────────────────────
  // 1. 로그인 플로우
  // ──────────────────────────────────────────

  describe('로그인 플로우 (POST /users/login)', () => {
    it('올바른 자격증명으로 로그인하면 JWT 토큰을 포함한 사용자 정보를 반환해야 한다', async () => {
      // 준비: 레포지토리가 사용자를 반환하도록 설정
      const storedUser = makeUser();
      mockUserRepo.findOne.mockResolvedValue(storedUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      // 실행: 컨트롤러의 login 호출
      const result = await controller.login({
        email: 'test@example.com',
        password: 'plainPassword123',
      });

      // 검증: 전체 체인이 올바르게 동작했는지 확인
      // BaseService.findOne(conditions, options) 시그니처로 인해 두 번째 인수 undefined 포함
      expect(mockUserRepo.findOne).toHaveBeenCalledWith({ email: 'test@example.com' }, undefined);
      expect(bcrypt.compare).toHaveBeenCalledWith('plainPassword123', storedUser.password);
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: storedUser.id,
        email: storedUser.email,
        username: storedUser.username,
      });
      expect((result as any).data['token']).toBe('mock.jwt.token');
      expect((result as any).data['email']).toBe('test@example.com');
      // 비밀번호는 응답에 포함되면 안 됨
      expect((result as any).data['password']).toBeUndefined();
    });

    it('존재하지 않는 이메일로 로그인하면 NotFoundException을 발생시켜야 한다', async () => {
      // 준비: 레포지토리가 null을 반환 (사용자 없음)
      mockUserRepo.findOne.mockResolvedValue(null);

      // 실행 및 검증
      await expect(
        controller.login({ email: 'nobody@example.com', password: 'pass' })
      ).rejects.toThrow(NotFoundException);

      expect(bcrypt.compare).not.toHaveBeenCalled();
      expect(mockJwtService.sign).not.toHaveBeenCalled();
    });

    it('잘못된 비밀번호로 로그인하면 BadRequestException을 발생시켜야 한다', async () => {
      // 준비: 사용자는 있지만 bcrypt 비교 실패
      mockUserRepo.findOne.mockResolvedValue(makeUser());
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      // 실행 및 검증
      await expect(
        controller.login({ email: 'test@example.com', password: 'wrongPassword' })
      ).rejects.toThrow(BadRequestException);

      expect(mockJwtService.sign).not.toHaveBeenCalled();
    });
  });

  // ──────────────────────────────────────────
  // 2. 회원가입 플로우
  // ──────────────────────────────────────────

  describe('회원가입 플로우 (POST /users)', () => {
    it('새 사용자를 등록하면 비밀번호를 해시하고 JWT 토큰을 반환해야 한다', async () => {
      // 준비: 중복 사용자 없음, bcrypt 해시 반환
      mockUserRepo.findOne.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('$2b$10$hashedNewPassword');
      mockUserRepo.insert.mockResolvedValue({ identifiers: [{ id: 'new-user-uuid' }] });

      // 실행
      const result = await controller.register({
        email: 'newuser@example.com',
        username: 'newuser',
        password: 'SecurePass123',
      });

      // 검증
      expect(bcrypt.hash).toHaveBeenCalledWith('SecurePass123', 10);
      expect(mockUserRepo.insert).toHaveBeenCalled();
      expect(mockJwtService.sign).toHaveBeenCalled();
      expect((result as any).data['password']).toBeNull();
      expect((result as any).data['token']).toBe('mock.jwt.token');
    });

    it('이미 사용 중인 이메일로 등록하면 BadRequestException을 발생시켜야 한다', async () => {
      // 준비: 기존 사용자가 존재
      mockUserRepo.findOne.mockResolvedValue(makeUser());

      // 실행 및 검증
      await expect(
        controller.register({
          email: 'test@example.com',
          username: 'anotheruser',
          password: 'pass',
        })
      ).rejects.toThrow(BadRequestException);

      expect(mockUserRepo.insert).not.toHaveBeenCalled();
    });
  });

  // ──────────────────────────────────────────
  // 3. 현재 사용자 조회 플로우
  // ──────────────────────────────────────────

  describe('현재 사용자 조회 플로우 (GET /user)', () => {
    it('인증된 요청으로 현재 사용자 정보를 반환하되 비밀번호는 제외해야 한다', async () => {
      // 준비
      const storedUser = makeUser();
      mockUserRepo.findOne.mockResolvedValue(storedUser);
      const mockReq = { user: { sub: 'user-uuid-001' } };

      // 실행
      const result = await controller.getCurrentUser(mockReq);

      // 검증 (DetailSuccessResponse → detailData)
      expect(mockUserRepo.findOne).toHaveBeenCalledWith({ id: 'user-uuid-001' }, undefined);
      expect((result as any).detailData['email']).toBe('test@example.com');
      expect((result as any).detailData['password']).toBeUndefined();
    });
  });

  // ──────────────────────────────────────────
  // 4. 팔로우 플로우
  // ──────────────────────────────────────────

  describe('팔로우 플로우 (POST /profiles/:username/follow)', () => {
    it('사용자를 팔로우하면 팔로우 레코드가 저장되고 프로필을 반환해야 한다', async () => {
      // 준비
      const targetUser = makeUser({ id: 'target-uuid', username: 'targetuser' });
      mockUserRepo.findOne.mockResolvedValue(targetUser);
      mockFollowRepo.insert.mockResolvedValue({ identifiers: [] });
      mockFollowRepo.findOne.mockResolvedValue({ id: 'follow-uuid' }); // following=true
      const mockReq = { user: { sub: 'user-uuid-001' } };

      // 실행
      const result = await controller.followAUser(mockReq, 'targetuser');

      // 검증
      expect(mockUserRepo.findOne).toHaveBeenCalledWith({ username: 'targetuser' }, undefined);
      expect(mockFollowRepo.insert).toHaveBeenCalledWith({
        followedId: targetUser.id,
        followerId: 'user-uuid-001',
      });
      expect((result as any).data['following']).toBe(true);
      expect((result as any).data['username']).toBe('targetuser');
    });

    it('존재하지 않는 사용자를 팔로우하면 NotFoundException을 발생시켜야 한다', async () => {
      // 준비: 대상 사용자 없음
      mockUserRepo.findOne.mockResolvedValue(null);
      const mockReq = { user: { sub: 'user-uuid-001' } };

      // 실행 및 검증
      await expect(
        controller.followAUser(mockReq, 'ghostuser')
      ).rejects.toThrow(NotFoundException);

      expect(mockFollowRepo.insert).not.toHaveBeenCalled();
    });
  });

  // ──────────────────────────────────────────
  // 5. 언팔로우 플로우
  // ──────────────────────────────────────────

  describe('언팔로우 플로우 (DELETE /profiles/:username/follow)', () => {
    it('사용자를 언팔로우하면 팔로우 레코드를 소프트 삭제하고 프로필을 반환해야 한다', async () => {
      // 준비
      const targetUser = makeUser({ id: 'target-uuid', username: 'targetuser' });
      mockUserRepo.findOne.mockResolvedValue(targetUser);
      mockFollowRepo.softDelete.mockResolvedValue({ affected: 1 });
      mockFollowRepo.findOne.mockResolvedValue(null); // 언팔로우 후 following=false
      const mockReq = { user: { sub: 'user-uuid-001' } };

      // 실행
      const result = await controller.unfollowAUser(mockReq, 'targetuser');

      // 검증
      expect(mockFollowRepo.softDelete).toHaveBeenCalledWith({
        followedId: targetUser.id,
        followerId: 'user-uuid-001',
      });
      expect((result as any).data['following']).toBe(false);
    });
  });
});
