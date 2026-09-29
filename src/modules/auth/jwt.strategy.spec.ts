import { JwtStrategy } from './jwt.strategy';

const cfg = (secret?: string) => ({ get: () => secret }) as any;

describe('JwtStrategy', () => {
  it('không cho khởi tạo khi thiếu JWT_SECRET (không có khoá dự phòng)', () => {
    expect(() => new JwtStrategy(cfg(undefined), {} as any)).toThrow('JWT_SECRET');
  });

  it('khởi tạo được khi có JWT_SECRET', () => {
    expect(() => new JwtStrategy(cfg('mot-khoa-that-du-dai'), {} as any)).not.toThrow();
  });
});
