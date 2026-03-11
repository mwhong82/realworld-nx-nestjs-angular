import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { ROLES_KEY } from './roles';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  function createMockContext(user: object | null = null, handler: object = {}): ExecutionContext {
    return {
      getHandler: () => handler,
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as unknown as ExecutionContext;
  }

  describe('canActivate', () => {
    it('핸들러에 요구 역할이 없으면 true를 반환해야 한다', () => {
      jest.spyOn(reflector, 'get').mockReturnValue(undefined);

      const context = createMockContext();
      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('요구 역할이 있지만 요청에 user가 없으면 true를 반환해야 한다', () => {
      jest.spyOn(reflector, 'get').mockReturnValue(['admin']);

      const context = createMockContext(null);
      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('user의 역할이 요구 역할 목록에 포함되면 true를 반환해야 한다', () => {
      jest.spyOn(reflector, 'get').mockReturnValue(['admin', 'moderator']);

      const context = createMockContext({ role: 'admin' });
      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('user의 역할이 요구 역할 목록에 없으면 false를 반환해야 한다', () => {
      jest.spyOn(reflector, 'get').mockReturnValue(['admin']);

      const context = createMockContext({ role: 'user' });
      const result = guard.canActivate(context);

      expect(result).toBe(false);
    });

    it('ROLES_KEY를 사용하여 핸들러에서 역할을 조회해야 한다', () => {
      const getSpy = jest.spyOn(reflector, 'get').mockReturnValue(undefined);
      const handler = {};
      const context = createMockContext(null, handler);

      guard.canActivate(context);

      expect(getSpy).toHaveBeenCalledWith(ROLES_KEY, handler);
    });

    it('여러 역할 중 하나라도 일치하면 true를 반환해야 한다', () => {
      jest.spyOn(reflector, 'get').mockReturnValue(['admin', 'editor', 'moderator']);

      const context = createMockContext({ role: 'editor' });
      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('요구 역할 목록이 비어 있으면 false를 반환해야 한다', () => {
      jest.spyOn(reflector, 'get').mockReturnValue([]);

      const context = createMockContext({ role: 'admin' });
      const result = guard.canActivate(context);

      expect(result).toBe(false);
    });
  });
});
