import { JwtStrategy } from './jwt.strategy';
import { ApiConfigService } from '@realworld/shared/api/config';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  beforeEach(() => {
    const mockConfigService = {
      configs: {
        jwtSecret: 'test-secret-key',
      },
    } as ApiConfigService;

    strategy = new JwtStrategy(mockConfigService);
  });

  describe('validate', () => {
    it('JWT 페이로드에서 sub, email, username을 추출하여 반환해야 한다', async () => {
      const payload = {
        sub: 1,
        email: 'test@example.com',
        username: 'testuser',
      };

      const result = await strategy.validate(payload);

      expect(result).toEqual({
        sub: 1,
        email: 'test@example.com',
        username: 'testuser',
      });
    });

    it('페이로드에 추가 필드가 있어도 sub, email, username만 반환해야 한다', async () => {
      const payload = {
        sub: 42,
        email: 'user@example.com',
        username: 'anotheruser',
        iat: 1234567890,
        exp: 9999999999,
        extraField: 'should-be-ignored',
      };

      const result = await strategy.validate(payload);

      expect(result).toEqual({
        sub: 42,
        email: 'user@example.com',
        username: 'anotheruser',
      });
      expect(result).not.toHaveProperty('iat');
      expect(result).not.toHaveProperty('exp');
      expect(result).not.toHaveProperty('extraField');
    });

    it('페이로드 필드가 undefined이면 undefined로 반환해야 한다', async () => {
      const payload = {
        sub: undefined,
        email: undefined,
        username: undefined,
      };

      const result = await strategy.validate(payload);

      expect(result).toEqual({
        sub: undefined,
        email: undefined,
        username: undefined,
      });
    });

    it('Promise를 반환해야 한다', () => {
      const payload = { sub: 1, email: 'a@b.com', username: 'user' };
      const result = strategy.validate(payload);
      expect(result).toBeInstanceOf(Promise);
    });
  });
});
