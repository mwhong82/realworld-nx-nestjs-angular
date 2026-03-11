import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard';
import { SKIP_AUTH_KEY } from '../skip-auth';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new JwtAuthGuard(reflector);
  });

  function createMockContext(handler: object = {}, classRef: object = {}): ExecutionContext {
    return {
      getHandler: () => handler,
      getClass: () => classRef,
      switchToHttp: () => ({
        getRequest: () => ({}),
        getResponse: () => ({}),
      }),
    } as unknown as ExecutionContext;
  }

  describe('canActivate', () => {
    it('@SkipAuth 데코레이터가 있으면 true를 반환해야 한다', () => {
      // Reflector.getAllAndOverride가 true를 반환하도록 모킹
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);

      const context = createMockContext();
      const result = guard.canActivate(context);

      expect(result).toBe(true);
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(SKIP_AUTH_KEY, [
        expect.anything(),
        expect.anything(),
      ]);
    });

    it('@SkipAuth 데코레이터가 없으면 부모 클래스(AuthGuard)의 canActivate를 호출해야 한다', () => {
      // Reflector.getAllAndOverride가 undefined(skipAuth 없음)를 반환하도록 모킹
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

      // 부모 클래스의 canActivate를 모킹
      const superCanActivate = jest.spyOn(
        Object.getPrototypeOf(JwtAuthGuard.prototype),
        'canActivate'
      ).mockReturnValue(true);

      const context = createMockContext();
      guard.canActivate(context);

      expect(superCanActivate).toHaveBeenCalledWith(context);

      superCanActivate.mockRestore();
    });

    it('@SkipAuth가 false이면 부모 클래스의 canActivate를 호출해야 한다', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

      const superCanActivate = jest.spyOn(
        Object.getPrototypeOf(JwtAuthGuard.prototype),
        'canActivate'
      ).mockReturnValue(false);

      const context = createMockContext();
      const result = guard.canActivate(context);

      // false || false = false
      expect(result).toBe(false);

      superCanActivate.mockRestore();
    });

    it('핸들러와 클래스 두 곳에서 skipAuth 값을 가져와야 한다', () => {
      const getAllAndOverrideSpy = jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue(true);

      const handler = {};
      const classRef = {};
      const context = createMockContext(handler, classRef);

      guard.canActivate(context);

      expect(getAllAndOverrideSpy).toHaveBeenCalledWith(SKIP_AUTH_KEY, [handler, classRef]);
    });
  });
});
