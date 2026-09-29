import { OrderStatus } from '../../entities/order.entity';
import { canAdvance, canCancel, STAFF_TARGETS } from './order-status';

describe('order-status', () => {
  it('cho phép đi đúng bước kế tiếp', () => {
    expect(canAdvance(OrderStatus.INIT, OrderStatus.PROCESSING)).toBe(true);
    expect(canAdvance(OrderStatus.PROCESSING, OrderStatus.SHIPPING)).toBe(true);
    expect(canAdvance(OrderStatus.SHIPPING, OrderStatus.DELIVERED)).toBe(true);
    expect(canAdvance(OrderStatus.DELIVERED, OrderStatus.COMPLETED)).toBe(true);
  });

  it('chặn nhảy cóc, đi lùi và đứng yên', () => {
    expect(canAdvance(OrderStatus.INIT, OrderStatus.SHIPPING)).toBe(false);
    expect(canAdvance(OrderStatus.DELIVERED, OrderStatus.PROCESSING)).toBe(false);
    expect(canAdvance(OrderStatus.PROCESSING, OrderStatus.PROCESSING)).toBe(false);
  });

  it('không cho đi tiếp từ trạng thái kết thúc', () => {
    expect(canAdvance(OrderStatus.COMPLETED, OrderStatus.CANCELLED)).toBe(false);
    expect(canAdvance(OrderStatus.CANCELLED, OrderStatus.INIT)).toBe(false);
  });

  it('chỉ huỷ được khi INIT hoặc PROCESSING', () => {
    expect(canCancel(OrderStatus.INIT)).toBe(true);
    expect(canCancel(OrderStatus.PROCESSING)).toBe(true);
    expect(canCancel(OrderStatus.SHIPPING)).toBe(false);
    expect(canCancel(OrderStatus.DELIVERED)).toBe(false);
    expect(canCancel(OrderStatus.COMPLETED)).toBe(false);
    expect(canCancel(OrderStatus.CANCELLED)).toBe(false);
  });

  it('STAFF chỉ được đặt PROCESSING, SHIPPING, DELIVERED', () => {
    expect(STAFF_TARGETS).toEqual([
      OrderStatus.PROCESSING,
      OrderStatus.SHIPPING,
      OrderStatus.DELIVERED,
    ]);
  });
});
