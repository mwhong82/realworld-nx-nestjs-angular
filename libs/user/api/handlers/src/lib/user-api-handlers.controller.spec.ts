import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UserApiHandlersController } from './user-api-handlers.controller';
import { UserService, FollowService } from '@realworld/user/api/shared';
import { LOGGED_IN_MSG, REGISTERED_MSG, UPDATED_MSG } from '@realworld/shared/api/constants';
import { ActionSuccessResponse, DetailSuccessResponse } from '@realworld/shared/client-server';

// 테스트용 공통 mock 요청 객체
const mockRequest = (sub = 'test-uuid') => ({
  user: { sub, email: 'test@test.com', username: 'testuser' },
  headers: { authorization: 'Bearer test-token' }
});

// 테스트용 사용자 fixture
const mockUser = {
  id: 'test-uuid',
  email: 'test@test.com',
  username: 'testuser',
  bio: '테스트 사용자입니다',
  image: 'https://example.com/avatar.jpg',
  password: 'hashed-password',
  token: 'jwt-token',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

// 비밀번호 제외한 사용자 정보
const mockUserWithoutPassword = (() => {
  const { password, ...rest } = mockUser;
  return rest;
})();

// 테스트용 프로필 fixture
const mockProfile = {
  username: 'testuser',
  bio: '테스트 사용자입니다',
  image: 'https://example.com/avatar.jpg',
  following: false,
  createdAt: new Date('2024-01-01'),
};

describe('UserApiHandlersController', () => {
  let controller: UserApiHandlersController;
  let userService: jest.Mocked<Partial<UserService>>;
  let followService: jest.Mocked<Partial<FollowService>>;

  beforeEach(async () => {
    userService = {
      login: jest.fn(),
      register: jest.fn(),
      updateUserInfo: jest.fn(),
      findOne: jest.fn(),
      getProfile: jest.fn(),
      getJwtInfo: jest.fn(),
    };

    followService = {
      insert: jest.fn(),
      softDelete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserApiHandlersController],
      providers: [
        { provide: UserService, useValue: userService },
        { provide: FollowService, useValue: followService },
      ],
    }).compile();

    controller = module.get<UserApiHandlersController>(UserApiHandlersController);
  });

  // ──────────────────────────────────────────────
  // login
  // ──────────────────────────────────────────────
  describe('login', () => {
    it('올바른 자격증명으로 로그인 시 ActionSuccessResponse를 반환해야 한다', async () => {
      // arrange
      const loginData = { email: 'test@test.com', password: 'password123' };
      (userService.login as jest.Mock).mockResolvedValue(mockUser);

      // act
      const result = await controller.login(loginData);

      // assert
      expect(userService.login).toHaveBeenCalledWith(loginData);
      expect(result).toBeInstanceOf(ActionSuccessResponse);
      expect(result.message).toBe(LOGGED_IN_MSG);
      expect((result as any).data).toEqual(mockUser);
    });

    it('서비스에서 에러가 발생하면 예외를 전파해야 한다', async () => {
      // arrange
      const loginData = { email: 'wrong@test.com', password: 'wrong' };
      (userService.login as jest.Mock).mockRejectedValue(new NotFoundException('계정을 찾을 수 없습니다'));

      // act & assert
      await expect(controller.login(loginData)).rejects.toThrow(NotFoundException);
    });
  });

  // ──────────────────────────────────────────────
  // register
  // ──────────────────────────────────────────────
  describe('register', () => {
    it('새 사용자 등록 시 ActionSuccessResponse를 반환해야 한다', async () => {
      // arrange
      const newUserData = { email: 'new@test.com', username: 'newuser', password: 'password123' };
      const registeredUser = { ...mockUser, email: 'new@test.com', username: 'newuser' };
      (userService.register as jest.Mock).mockResolvedValue(registeredUser);

      // act
      const result = await controller.register(newUserData);

      // assert
      expect(userService.register).toHaveBeenCalledWith(newUserData);
      expect(result).toBeInstanceOf(ActionSuccessResponse);
      expect(result.message).toBe(REGISTERED_MSG);
      expect((result as any).data).toEqual(registeredUser);
    });

    it('이미 존재하는 이메일로 등록 시 서비스 예외를 전파해야 한다', async () => {
      // arrange
      const duplicateData = { email: 'test@test.com', username: 'other', password: 'pass' };
      (userService.register as jest.Mock).mockRejectedValue(new Error('중복된 리소스'));

      // act & assert
      await expect(controller.register(duplicateData)).rejects.toThrow('중복된 리소스');
    });
  });

  // ──────────────────────────────────────────────
  // update
  // ──────────────────────────────────────────────
  describe('update', () => {
    it('유저 정보 업데이트 시 ActionSuccessResponse를 반환해야 한다', async () => {
      // arrange
      const req = mockRequest();
      const updateData = { bio: '업데이트된 자기소개' };
      const updatedUser = { ...mockUser, bio: '업데이트된 자기소개' };
      (userService.updateUserInfo as jest.Mock).mockResolvedValue(updatedUser);

      // act
      const result = await controller.update(req, updateData);

      // assert
      expect(userService.updateUserInfo).toHaveBeenCalledWith('test-uuid', updateData);
      expect(result).toBeInstanceOf(ActionSuccessResponse);
      expect(result.message).toBe(UPDATED_MSG);
      expect((result as any).data).toEqual(updatedUser);
    });

    it('req.user가 없으면 서비스를 undefined sub으로 호출해야 한다', async () => {
      // arrange
      const reqWithoutUser = {};
      const updateData = { bio: '변경' };
      (userService.updateUserInfo as jest.Mock).mockResolvedValue(mockUser);

      // act
      await controller.update(reqWithoutUser, updateData);

      // assert
      expect(userService.updateUserInfo).toHaveBeenCalledWith(undefined, updateData);
    });
  });

  // ──────────────────────────────────────────────
  // getCurrentUser
  // ──────────────────────────────────────────────
  describe('getCurrentUser', () => {
    it('현재 로그인 사용자 정보를 비밀번호 제외하고 반환해야 한다', async () => {
      // arrange
      const req = mockRequest();
      (userService.findOne as jest.Mock).mockResolvedValue(mockUser);

      // act
      const result = await controller.getCurrentUser(req);

      // assert
      expect(userService.findOne).toHaveBeenCalledWith({ id: 'test-uuid' });
      expect(result).toBeInstanceOf(DetailSuccessResponse);
      expect((result as any).detailData).not.toHaveProperty('password');
      expect((result as any).detailData).toMatchObject(mockUserWithoutPassword);
    });

    it('사용자를 찾지 못하면 빈 detailData를 반환해야 한다', async () => {
      // arrange
      const req = mockRequest();
      (userService.findOne as jest.Mock).mockResolvedValue(null);

      // act
      const result = await controller.getCurrentUser(req);

      // assert
      expect(result).toBeInstanceOf(DetailSuccessResponse);
      // findOne이 null을 반환하면 구조분해 결과 user는 빈 객체
      expect((result as any).detailData).toEqual({});
    });
  });

  // ──────────────────────────────────────────────
  // getProfile
  // ──────────────────────────────────────────────
  describe('getProfile', () => {
    it('존재하는 사용자의 프로필을 반환해야 한다', async () => {
      // arrange
      const req = { headers: { authorization: 'Bearer test-token' } };
      (userService.findOne as jest.Mock).mockResolvedValue(mockUser);
      (userService.getJwtInfo as jest.Mock).mockReturnValue({ sub: 'requester-uuid', email: 'r@test.com', username: 'requester', iat: 0, exp: 9999 });
      (userService.getProfile as jest.Mock).mockResolvedValue(mockProfile);

      // act
      const result = await controller.getProfile(req, 'testuser');

      // assert
      expect(userService.findOne).toHaveBeenCalledWith({ username: 'testuser' });
      expect(userService.getProfile).toHaveBeenCalledWith('requester-uuid', mockUser);
      expect(result).toBeInstanceOf(DetailSuccessResponse);
      expect((result as any).detailData).toEqual(mockProfile);
    });

    it('존재하지 않는 사용자의 프로필 조회 시 NotFoundException을 던져야 한다', async () => {
      // arrange
      const req = { headers: {} };
      (userService.findOne as jest.Mock).mockResolvedValue(null);

      // act & assert
      await expect(controller.getProfile(req, 'nobody')).rejects.toThrow(NotFoundException);
    });
  });

  // ──────────────────────────────────────────────
  // followAUser
  // ──────────────────────────────────────────────
  describe('followAUser', () => {
    it('팔로우 성공 시 ActionSuccessResponse와 프로필을 반환해야 한다', async () => {
      // arrange
      const req = mockRequest();
      const targetUser = { ...mockUser, id: 'target-uuid', username: 'target' };
      const followedProfile = { ...mockProfile, username: 'target', following: true };
      (userService.findOne as jest.Mock).mockResolvedValue(targetUser);
      (followService.insert as jest.Mock).mockResolvedValue(undefined);
      (userService.getProfile as jest.Mock).mockResolvedValue(followedProfile);

      // act
      const result = await controller.followAUser(req, 'target');

      // assert
      expect(userService.findOne).toHaveBeenCalledWith({ username: 'target' });
      expect(followService.insert).toHaveBeenCalledWith({ followedId: 'target-uuid', followerId: 'test-uuid' });
      expect(userService.getProfile).toHaveBeenCalledWith('test-uuid', targetUser);
      expect(result).toBeInstanceOf(ActionSuccessResponse);
      expect((result as any).data).toEqual(followedProfile);
    });

    it('존재하지 않는 사용자를 팔로우하면 NotFoundException을 던져야 한다', async () => {
      // arrange
      const req = mockRequest();
      (userService.findOne as jest.Mock).mockResolvedValue(null);

      // act & assert
      await expect(controller.followAUser(req, 'ghost')).rejects.toThrow(NotFoundException);
      expect(followService.insert).not.toHaveBeenCalled();
    });
  });

  // ──────────────────────────────────────────────
  // unfollowAUser
  // ──────────────────────────────────────────────
  describe('unfollowAUser', () => {
    it('언팔로우 성공 시 ActionSuccessResponse와 프로필을 반환해야 한다', async () => {
      // arrange
      const req = mockRequest();
      const targetUser = { ...mockUser, id: 'target-uuid', username: 'target' };
      const unfollowedProfile = { ...mockProfile, username: 'target', following: false };
      (userService.findOne as jest.Mock).mockResolvedValue(targetUser);
      (followService.softDelete as jest.Mock).mockResolvedValue(undefined);
      (userService.getProfile as jest.Mock).mockResolvedValue(unfollowedProfile);

      // act
      const result = await controller.unfollowAUser(req, 'target');

      // assert
      expect(userService.findOne).toHaveBeenCalledWith({ username: 'target' });
      expect(followService.softDelete).toHaveBeenCalledWith({ followedId: 'target-uuid', followerId: 'test-uuid' });
      expect(userService.getProfile).toHaveBeenCalledWith('test-uuid', targetUser);
      expect(result).toBeInstanceOf(ActionSuccessResponse);
      expect((result as any).data).toEqual(unfollowedProfile);
    });

    it('존재하지 않는 사용자를 언팔로우하면 NotFoundException을 던져야 한다', async () => {
      // arrange
      const req = mockRequest();
      (userService.findOne as jest.Mock).mockResolvedValue(null);

      // act & assert
      await expect(controller.unfollowAUser(req, 'ghost')).rejects.toThrow(NotFoundException);
      expect(followService.softDelete).not.toHaveBeenCalled();
    });
  });
});
