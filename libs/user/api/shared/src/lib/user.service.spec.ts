import { BadRequestException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  DUPLICATE_RESOURCE_MSG,
  INVALID_ACCOUNT_MSG,
  NOT_FOUND_MSG,
} from '@realworld/shared/api/constants';

import { FollowService } from './follow.service';
import { Follow } from './follow.entity';
import { User } from './user.entity';
import { UserService } from './user.service';

// bcrypt 전체 모킹 — 실제 해시 연산 없이 빠르게 테스트
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password_mock'),
  compare: jest.fn().mockResolvedValue(true),
}));

import * as bcrypt from 'bcrypt';

// 테스트용 사용자 픽스처
const mockUser: Partial<User> = {
  id: 'user-uuid-001',
  email: 'test@example.com',
  username: 'testuser',
  password: 'hashed_password_mock',
  bio: '테스트 바이오',
  image: 'https://example.com/avatar.png',
  createdAt: new Date('2024-01-01'),
};

describe('UserService', () => {
  let service: UserService;
  let userRepository: any;
  let followRepository: any;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        FollowService,
        {
          provide: getRepositoryToken(User),
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
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mock-jwt-token'),
            decode: jest.fn().mockReturnValue({
              sub: 'user-uuid-001',
              email: 'test@example.com',
              username: 'testuser',
              iat: 1700000000,
              exp: 1700086400,
            }),
          },
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    userRepository = module.get(getRepositoryToken(User));
    followRepository = module.get(getRepositoryToken(Follow));
    jwtService = module.get<JwtService>(JwtService);

    jest.clearAllMocks();
    // bcrypt 기본값 재설정 (clearAllMocks 이후 복구)
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password_mock');
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    (jwtService.sign as jest.Mock).mockReturnValue('mock-jwt-token');
  });

  // ──────────────────────────────────────────────
  // login
  // ──────────────────────────────────────────────
  describe('login()', () => {
    it('올바른 자격증명으로 로그인하면 JWT 토큰이 포함된 사용자 객체를 반환해야 한다', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.login({
        email: 'test@example.com',
        password: 'plaintext_password',
      });

      expect(userRepository.findOne).toHaveBeenCalledWith(
        { email: 'test@example.com' },
        undefined
      );
      expect(bcrypt.compare).toHaveBeenCalledWith(
        'plaintext_password',
        'hashed_password_mock'
      );
      expect(result.token).toBe('mock-jwt-token');
      expect(result.email).toBe('test@example.com');
      expect(result.username).toBe('testuser');
    });

    it('존재하지 않는 이메일로 로그인하면 NotFoundException을 던져야 한다', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(
        service.login({ email: 'nobody@example.com', password: 'any' })
      ).rejects.toThrow(new NotFoundException(NOT_FOUND_MSG));
    });

    it('비밀번호가 틀리면 BadRequestException을 던져야 한다', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login({ email: 'test@example.com', password: 'wrong_pass' })
      ).rejects.toThrow(new BadRequestException(INVALID_ACCOUNT_MSG));
    });
  });

  // ──────────────────────────────────────────────
  // register
  // ──────────────────────────────────────────────
  describe('register()', () => {
    const newUserData = {
      email: 'new@example.com',
      username: 'newuser',
      password: 'plaintext123',
      bio: '',
      image: '',
    };

    it('새 사용자를 등록하면 비밀번호가 null이고 JWT가 포함된 객체를 반환해야 한다', async () => {
      // 중복 사용자 없음
      userRepository.findOne.mockResolvedValue(null);
      userRepository.insert.mockResolvedValue({ identifiers: [{ id: 'new-uuid' }] });

      const result = await service.register(newUserData);

      expect(bcrypt.hash).toHaveBeenCalledWith('plaintext123', 10);
      expect(userRepository.insert).toHaveBeenCalled();
      expect(result.password).toBeNull();
      expect(result.token).toBe('mock-jwt-token');
    });

    it('이미 존재하는 이메일/사용자명으로 등록하면 BadRequestException을 던져야 한다', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);

      await expect(service.register(newUserData)).rejects.toThrow(
        new BadRequestException(DUPLICATE_RESOURCE_MSG)
      );

      expect(userRepository.insert).not.toHaveBeenCalled();
    });

    it('이메일과 사용자명을 소문자로 변환하여 중복 체크해야 한다', async () => {
      userRepository.findOne.mockResolvedValue(null);
      userRepository.insert.mockResolvedValue({ identifiers: [] });

      await service.register({
        ...newUserData,
        email: 'New@Example.COM',
        username: 'NewUser',
      });

      expect(userRepository.findOne).toHaveBeenCalledWith(
        null,
        expect.objectContaining({
          where: [
            { email: 'new@example.com' },
            { username: 'newuser' },
          ],
        })
      );
    });
  });

  // ──────────────────────────────────────────────
  // updateUserInfo
  // ──────────────────────────────────────────────
  describe('updateUserInfo()', () => {
    it('사용자 정보를 업데이트하면 새 정보와 JWT가 포함된 객체를 반환해야 한다', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);
      userRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.updateUserInfo('user-uuid-001', {
        bio: '업데이트된 바이오',
      });

      expect(userRepository.update).toHaveBeenCalledWith(
        { id: 'user-uuid-001' },
        { bio: '업데이트된 바이오' }
      );
      expect(result.bio).toBe('업데이트된 바이오');
      expect(result.password).toBeNull();
      expect(result.token).toBe('mock-jwt-token');
    });

    it('비밀번호가 전달되면 해시하여 저장해야 한다', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);
      userRepository.update.mockResolvedValue({ affected: 1 });

      await service.updateUserInfo('user-uuid-001', {
        password: 'new_plain_password',
      });

      expect(bcrypt.hash).toHaveBeenCalledWith('new_plain_password', 10);
      const updateCall = userRepository.update.mock.calls[0][1];
      expect(updateCall.password).toBe('hashed_password_mock');
    });

    it('비밀번호가 빈 값이면 업데이트 데이터에서 제거해야 한다', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);
      userRepository.update.mockResolvedValue({ affected: 1 });

      await service.updateUserInfo('user-uuid-001', {
        bio: '바이오만 수정',
        password: '',
      });

      const updateCall = userRepository.update.mock.calls[0][1];
      expect(updateCall.password).toBeUndefined();
    });

    it('존재하지 않는 userId이면 BadRequestException을 던져야 한다', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateUserInfo('non-existent-id', { bio: '바이오' })
      ).rejects.toThrow(new BadRequestException(INVALID_ACCOUNT_MSG));
    });
  });

  // ──────────────────────────────────────────────
  // findOne (BaseService 위임)
  // ──────────────────────────────────────────────
  describe('findOne()', () => {
    it('조건에 맞는 사용자를 찾아 반환해야 한다', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findOne({ id: 'user-uuid-001' });

      expect(userRepository.findOne).toHaveBeenCalledWith(
        { id: 'user-uuid-001' },
        undefined
      );
      expect(result).toEqual(mockUser);
    });

    it('사용자가 없으면 undefined를 반환해야 한다', async () => {
      userRepository.findOne.mockResolvedValue(undefined);

      const result = await service.findOne({ id: 'ghost-id' });

      expect(result).toBeUndefined();
    });
  });

  // ──────────────────────────────────────────────
  // getProfile
  // ──────────────────────────────────────────────
  describe('getProfile()', () => {
    it('팔로우 중인 경우 following이 true인 프로필을 반환해야 한다', async () => {
      followRepository.findOne.mockResolvedValue({
        id: 'follow-001',
        followerId: 'viewer-uuid',
        followedId: 'user-uuid-001',
      });

      const result = await service.getProfile('viewer-uuid', mockUser as User);

      expect(followRepository.findOne).toHaveBeenCalledWith(
        { followerId: 'viewer-uuid', followedId: 'user-uuid-001' },
        undefined
      );
      expect(result.following).toBe(true);
      expect(result.username).toBe('testuser');
      expect(result.bio).toBe('테스트 바이오');
      expect(result.image).toBe('https://example.com/avatar.png');
    });

    it('팔로우하지 않은 경우 following이 false인 프로필을 반환해야 한다', async () => {
      followRepository.findOne.mockResolvedValue(null);

      const result = await service.getProfile('viewer-uuid', mockUser as User);

      expect(result.following).toBe(false);
    });

    it('requestUserId가 없으면 following이 false인 프로필을 반환해야 한다', async () => {
      const result = await service.getProfile(null, mockUser as User);

      expect(followRepository.findOne).not.toHaveBeenCalled();
      expect(result.following).toBe(false);
    });
  });

  // ──────────────────────────────────────────────
  // getJwtInfo
  // ──────────────────────────────────────────────
  describe('getJwtInfo()', () => {
    it('유효한 Authorization 헤더에서 JWT 페이로드를 반환해야 한다', () => {
      const mockReq = {
        headers: { authorization: 'Bearer mock-jwt-token' },
      };

      const result = service.getJwtInfo(mockReq);

      expect(jwtService.decode).toHaveBeenCalledWith('mock-jwt-token');
      expect(result).toMatchObject({
        sub: 'user-uuid-001',
        email: 'test@example.com',
        username: 'testuser',
      });
    });

    it('Authorization 헤더가 없으면 null을 반환해야 한다', () => {
      const result = service.getJwtInfo({ headers: {} });

      expect(result).toBeNull();
    });

    it('req 객체가 없으면 null을 반환해야 한다', () => {
      const result = service.getJwtInfo(null);

      expect(result).toBeNull();
    });

    it('Bearer 형식이 올바르지 않으면 null을 반환해야 한다', () => {
      const mockReq = {
        headers: { authorization: 'InvalidTokenOnly' },
      };

      const result = service.getJwtInfo(mockReq);

      expect(result).toBeNull();
    });
  });
});
