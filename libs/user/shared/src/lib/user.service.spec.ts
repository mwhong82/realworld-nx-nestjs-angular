import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { of } from 'rxjs';

import { UserService } from './user.service';
import { IConfigurationService } from '@realworld/shared/configuration';
import { UserStorageUtil } from '@realworld/shared/storage';
import { IUser, ILoginUser, INewUser } from '@realworld/user/api-interfaces';
import { ActionSuccessResponse, DetailSuccessResponse } from '@realworld/shared/client-server';

// ──────────────────────────────────────────────
// 테스트 픽스처
// ──────────────────────────────────────────────
const API_BASE = 'http://localhost:3000/api';

const mockUser: IUser = {
  id: 'user-uuid-001',
  username: 'testuser',
  email: 'test@example.com',
  token: 'mock-jwt-token',
  bio: '테스트 바이오',
  image: 'https://example.com/avatar.png',
} as IUser;

const mockConfigService: Partial<IConfigurationService> = {
  configs$: of({ rest: { url: API_BASE } } as any),
};

const mockUserStorageUtil: Partial<UserStorageUtil> = {
  userInfo: null,
  setUserData: jest.fn(),
  clearUserData: jest.fn(),
};

// ──────────────────────────────────────────────
// 테스트 스위트
// ──────────────────────────────────────────────
describe('UserService (프론트엔드)', () => {
  let service: UserService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        UserService,
        { provide: IConfigurationService, useValue: mockConfigService },
        { provide: UserStorageUtil, useValue: mockUserStorageUtil },
      ],
    });

    service = TestBed.inject(UserService);
    httpMock = TestBed.inject(HttpTestingController);

    jest.clearAllMocks();
  });

  afterEach(() => {
    httpMock.verify();
  });

  // ──────────────────────────────────────────────
  // 초기화 상태
  // ──────────────────────────────────────────────
  describe('초기화', () => {
    it('스토리지에 사용자 정보가 없으면 isAuth가 false여야 한다', () => {
      expect(service.isAuth).toBe(false);
      expect(service.userInfo).toBeNull();
    });
  });

  // ──────────────────────────────────────────────
  // login()
  // ──────────────────────────────────────────────
  describe('login()', () => {
    const loginBody: ILoginUser = {
      email: 'test@example.com',
      password: 'password123',
    } as ILoginUser;

    it('POST /users/login 을 호출하고 응답으로 인증 상태를 업데이트해야 한다', () => {
      const mockResponse: ActionSuccessResponse<IUser> = {
        success: true,
        statusCode: 200,
        message: '로그인 성공',
        data: mockUser,
      } as any;

      service.login(loginBody).subscribe(res => {
        expect(res.data).toEqual(mockUser);
      });

      const req = httpMock.expectOne(`${API_BASE}/users/login`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(loginBody);
      req.flush(mockResponse);

      // tap 핸들러가 스토리지와 상태를 업데이트해야 한다
      expect(mockUserStorageUtil.setUserData).toHaveBeenCalledWith(mockResponse);
      expect(service.isAuth).toBe(true);
      expect(service.userInfo).toEqual(mockUser);
    });

    it('요청 헤더에 Content-Type이 application/json으로 설정되어야 한다', () => {
      service.login(loginBody).subscribe();

      const req = httpMock.expectOne(`${API_BASE}/users/login`);
      expect(req.request.headers.get('Content-Type')).toBe('application/json');
      req.flush({ success: true, data: mockUser });
    });
  });

  // ──────────────────────────────────────────────
  // register()
  // ──────────────────────────────────────────────
  describe('register()', () => {
    const newUser: INewUser = {
      username: 'newuser',
      email: 'new@example.com',
      password: 'password123',
    } as INewUser;

    it('POST /users 를 호출하고 응답으로 인증 상태를 업데이트해야 한다', () => {
      const mockResponse: ActionSuccessResponse<IUser> = {
        success: true,
        statusCode: 200,
        message: '회원가입 성공',
        data: mockUser,
      } as any;

      service.register(newUser).subscribe(res => {
        expect(res.data).toEqual(mockUser);
      });

      const req = httpMock.expectOne(`${API_BASE}/users`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(newUser);
      req.flush(mockResponse);

      expect(mockUserStorageUtil.setUserData).toHaveBeenCalledWith(mockResponse);
      expect(service.isAuth).toBe(true);
    });
  });

  // ──────────────────────────────────────────────
  // update()
  // ──────────────────────────────────────────────
  describe('update()', () => {
    it('PUT /users 를 호출하고 사용자 정보를 업데이트해야 한다', () => {
      const updateBody = { id: 'user-uuid-001', bio: '새로운 바이오' };
      const updatedUser = { ...mockUser, bio: '새로운 바이오' };
      const mockResponse: ActionSuccessResponse<IUser> = {
        success: true,
        statusCode: 200,
        message: '업데이트 성공',
        data: updatedUser,
      } as any;

      service.update('user-uuid-001', updateBody).subscribe(res => {
        expect(res.data).toEqual(updatedUser);
      });

      const req = httpMock.expectOne(`${API_BASE}/users`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updateBody);
      req.flush(mockResponse);

      expect(mockUserStorageUtil.setUserData).toHaveBeenCalledWith(mockResponse);
      expect(service.userInfo?.bio).toBe('새로운 바이오');
    });
  });

  // ──────────────────────────────────────────────
  // getCurrentUser()
  // ──────────────────────────────────────────────
  describe('getCurrentUser()', () => {
    it('GET /user 를 호출하여 현재 사용자 정보를 반환해야 한다', () => {
      const mockResponse: DetailSuccessResponse<Partial<IUser>> = {
        success: true,
        statusCode: 200,
        detailData: mockUser,
      } as any;

      service.getCurrentUser().subscribe(res => {
        expect(res.detailData).toEqual(mockUser);
      });

      const req = httpMock.expectOne(`${API_BASE}/user`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  // ──────────────────────────────────────────────
  // logout()
  // ──────────────────────────────────────────────
  describe('logout()', () => {
    it('로그아웃하면 스토리지를 지우고 인증 상태를 초기화해야 한다', () => {
      // 먼저 로그인 상태 설정
      service.updateAuthState(mockUser);
      expect(service.isAuth).toBe(true);

      service.logout();

      expect(mockUserStorageUtil.clearUserData).toHaveBeenCalled();
      expect(service.isAuth).toBe(false);
      expect(service.userInfo).toBeNull();
    });
  });

  // ──────────────────────────────────────────────
  // updateAuthState()
  // ──────────────────────────────────────────────
  describe('updateAuthState()', () => {
    it('사용자 정보를 전달하면 isAuth가 true가 되어야 한다', () => {
      service.updateAuthState(mockUser);

      expect(service.isAuth).toBe(true);
      expect(service.userInfo).toEqual(mockUser);
    });

    it('null을 전달하면 isAuth가 false가 되어야 한다', () => {
      service.updateAuthState(null);

      expect(service.isAuth).toBe(false);
      expect(service.userInfo).toBeNull();
    });
  });
});
