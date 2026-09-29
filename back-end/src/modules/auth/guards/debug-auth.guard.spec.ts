import { NotFoundException } from '@nestjs/common';
import { DebugAuthGuard } from './debug-auth.guard';

const guardWith = (value?: string) =>
  new DebugAuthGuard({ get: () => value } as any);

describe('DebugAuthGuard', () => {
  it('cho qua khi ENABLE_DEBUG_AUTH=true (môi trường dev)', () => {
    expect(guardWith('true').canActivate({} as any)).toBe(true);
  });

  it.each([undefined, '', 'false', '1', 'TRUE '])(
    'chặn (404) khi ENABLE_DEBUG_AUTH=%p (mặc định trên production)',
    (v) => expect(() => guardWith(v).canActivate({} as any)).toThrow(NotFoundException),
  );
});
