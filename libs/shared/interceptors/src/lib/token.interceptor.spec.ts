import { HttpRequest, HttpHandler, HttpEvent, HttpHeaders } from '@angular/common/http';
import { of } from 'rxjs';
import { TokenInterceptor } from './token.interceptor';
import { UserStorageUtil } from '@realworld/shared/storage';

describe('TokenInterceptor', () => {
  let interceptor: TokenInterceptor;
  let mockUserStorageUtil: UserStorageUtil;
  let mockNext: jest.Mocked<HttpHandler>;

  function createMockStorage(token: string | null): UserStorageUtil {
    return { token } as unknown as UserStorageUtil;
  }

  beforeEach(() => {
    mockUserStorageUtil = createMockStorage(null);

    mockNext = {
      handle: jest.fn().mockReturnValue(of({} as HttpEvent<unknown>)),
    };

    interceptor = new TokenInterceptor(mockUserStorageUtil);
  });

  describe('intercept', () => {
    it('토큰이 있으면 Authorization 헤더를 추가해야 한다', () => {
      interceptor = new TokenInterceptor(createMockStorage('test-jwt-token'));

      const request = new HttpRequest('GET', '/api/test');
      interceptor.intercept(request, mockNext).subscribe();

      const calledRequest = mockNext.handle.mock.calls[0][0] as HttpRequest<unknown>;
      expect(calledRequest.headers.get('Authorization')).toBe('Bearer test-jwt-token');
    });

    it('토큰이 없으면 원본 요청을 그대로 전달해야 한다', () => {
      interceptor = new TokenInterceptor(createMockStorage(null));

      const request = new HttpRequest('GET', '/api/test');
      interceptor.intercept(request, mockNext).subscribe();

      const calledRequest = mockNext.handle.mock.calls[0][0] as HttpRequest<unknown>;
      expect(calledRequest.headers.get('Authorization')).toBeNull();
      expect(calledRequest).toBe(request);
    });

    it('토큰이 빈 문자열이면 원본 요청을 그대로 전달해야 한다', () => {
      interceptor = new TokenInterceptor(createMockStorage(''));

      const request = new HttpRequest('GET', '/api/test');
      interceptor.intercept(request, mockNext).subscribe();

      const calledRequest = mockNext.handle.mock.calls[0][0] as HttpRequest<unknown>;
      expect(calledRequest.headers.get('Authorization')).toBeNull();
    });

    it('Authorization 헤더 값이 "Bearer " 접두사를 포함해야 한다', () => {
      interceptor = new TokenInterceptor(createMockStorage('my-secret-token'));

      const request = new HttpRequest('GET', '/api/users');
      interceptor.intercept(request, mockNext).subscribe();

      const calledRequest = mockNext.handle.mock.calls[0][0] as HttpRequest<unknown>;
      const authHeader = calledRequest.headers.get('Authorization');
      expect(authHeader).toMatch(/^Bearer /);
      expect(authHeader).toBe('Bearer my-secret-token');
    });

    it('원본 요청은 불변이어야 한다 (새로운 요청 객체를 생성해야 한다)', () => {
      interceptor = new TokenInterceptor(createMockStorage('some-token'));

      const request = new HttpRequest('GET', '/api/test');
      interceptor.intercept(request, mockNext).subscribe();

      const calledRequest = mockNext.handle.mock.calls[0][0] as HttpRequest<unknown>;
      expect(calledRequest).not.toBe(request);
    });

    it('기존 헤더가 있어도 Authorization 헤더를 추가해야 한다', () => {
      interceptor = new TokenInterceptor(createMockStorage('token-123'));

      const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
      const request = new HttpRequest('POST', '/api/test', {}, { headers });
      interceptor.intercept(request, mockNext).subscribe();

      const calledRequest = mockNext.handle.mock.calls[0][0] as HttpRequest<unknown>;
      expect(calledRequest.headers.get('Authorization')).toBe('Bearer token-123');
      expect(calledRequest.headers.get('Content-Type')).toBe('application/json');
    });

    it('next.handle을 한 번만 호출해야 한다', () => {
      interceptor = new TokenInterceptor(createMockStorage('token'));

      const request = new HttpRequest('GET', '/api/test');
      interceptor.intercept(request, mockNext).subscribe();

      expect(mockNext.handle).toHaveBeenCalledTimes(1);
    });
  });
});
