import { NotFoundException } from '@nestjs/common';
import { DebugPaymentGuard } from './debug-payment.guard';

const guardWith = (value?: string) => new DebugPaymentGuard({ get: () => value } as any);

describe('DebugPaymentGuard', () => {
  it('cho qua khi ENABLE_DEBUG_PAYMENT=true', () => {
    expect(guardWith('true').canActivate({} as any)).toBe(true);
  });

  it.each([undefined, '', 'false', '1', 'TRUE '])('chặn 404 khi ENABLE_DEBUG_PAYMENT=%p', (v) => {
    expect(() => guardWith(v).canActivate({} as any)).toThrow(NotFoundException);
  });
});
