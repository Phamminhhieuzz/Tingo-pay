import { BadRequestException, ForbiddenException, Logger, NotFoundException } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { Order, OrderStatus, PaymentMethod, PaymentStatus } from '../../entities/order.entity';
import { Product, ProductStatus } from '../../entities/product.entity';
import { User, UserRole } from '../../entities/user.entity';

const PRODUCT_ID = '11111111-1111-4111-8111-111111111111';
const staff = { id: 's1', role: UserRole.STAFF };
const alice = { id: 'u-alice', role: UserRole.CUSTOMER };
const bob = { id: 'u-bob', role: UserRole.CUSTOMER };

const baseInput = {
  productId: PRODUCT_ID,
  quantity: 2,
  receiverName: 'An',
  receiverPhone: '0900000001',
  receiverAddress: 'Hà Nội',
};

const makeOrder = (over: Partial<Order> = {}): Order =>
  ({ id: 'o1', status: OrderStatus.INIT, customer: { id: alice.id }, ...over }) as Order;

const setup = (orderInDb?: Order, product?: Partial<Product> | null) => {
  const ordersRepo = {
    create: jest.fn((o) => o),
    save: jest.fn(async (o) => o),
    findOne: jest.fn().mockResolvedValue(orderInDb ?? null),
    findAndCount: jest.fn().mockResolvedValue([[], 0]),
  };
  const productsRepo = {
    findOne: jest.fn().mockResolvedValue(
      product === undefined
        ? { id: PRODUCT_ID, name: 'Loa Mini', price: '500000.00', status: ProductStatus.IN_STOCK }
        : product,
    ),
  };
  const paymentQr = { createQr: jest.fn().mockResolvedValue('QR-STRING') };
  const service = new OrdersService(ordersRepo as any, productsRepo as any, paymentQr as any);
  return { service, ordersRepo, productsRepo, paymentQr };
};

describe('OrdersService.create', () => {
  it('tính giá từ sản phẩm, bỏ qua giá/trạng thái/mã do client gửi', async () => {
    const { service, ordersRepo } = setup();
    const hostile = { ...baseInput, unitPrice: 1, totalAmount: 1, status: 'COMPLETED', code: 'HACK' };
    const order = await service.create(hostile as any, { id: alice.id } as User);
    const arg = ordersRepo.create.mock.calls[0][0];
    expect(arg.unitPrice).toBe(500000);
    expect(arg.totalAmount).toBe(1000000);
    expect(arg.payAmount).toBe(1000000);
    expect(arg.status).toBe(OrderStatus.INIT);
    expect(arg.code).toMatch(/^ORD-/);
    expect(arg.productName).toBe('Loa Mini');
    expect(order.code).not.toBe('HACK');
  });

  it.each([0, -1, 1.5, 100, NaN, 'abc'])('từ chối số lượng %p', async (q) => {
    const { service } = setup();
    await expect(service.create({ ...baseInput, quantity: q as any }, {} as User)).rejects.toThrow(BadRequestException);
  });

  it('từ chối productId không phải UUID mà không chạm DB', async () => {
    const { service, productsRepo } = setup();
    await expect(service.create({ ...baseInput, productId: 'khong-phai-uuid' }, {} as User)).rejects.toThrow(BadRequestException);
    expect(productsRepo.findOne).not.toHaveBeenCalled();
  });

  it('404 khi sản phẩm không tồn tại, 400 khi hết hàng', async () => {
    const missing = setup(undefined, null);
    await expect(missing.service.create(baseInput, {} as User)).rejects.toThrow(NotFoundException);
    const soldOut = setup(undefined, { id: PRODUCT_ID, name: 'X', price: 1, status: ProductStatus.OUT_OF_STOCK });
    await expect(soldOut.service.create(baseInput, {} as User)).rejects.toThrow(BadRequestException);
  });

  it('từ chối thông tin người nhận rỗng hoặc toàn khoảng trắng', async () => {
    const { service } = setup();
    await expect(service.create({ ...baseInput, receiverName: '   ' }, {} as User)).rejects.toThrow(BadRequestException);
  });
});

describe('OrdersService.create — thanh toán', () => {
  it('COD (mặc định): UNPAID, không tạo mã QR', async () => {
    const { service, ordersRepo, paymentQr } = setup();
    await service.create(baseInput as any, { id: alice.id } as User);
    const arg = ordersRepo.create.mock.calls[0][0];
    expect(arg.paymentMethod).toBe(PaymentMethod.COD);
    expect(arg.paymentStatus).toBe(PaymentStatus.UNPAID);
    expect(paymentQr.createQr).not.toHaveBeenCalled();
  });

  it('BANK_QR: tạo mã QR bằng mã đơn và số tiền server tính, mã đơn ≤ 13 ký tự', async () => {
    const { service, paymentQr } = setup();
    const order = await service.create({ ...baseInput, paymentMethod: 'BANK_QR' } as any, { id: alice.id } as User);
    expect(paymentQr.createQr).toHaveBeenCalledWith({ orderCode: order.code, amount: 1000000 });
    expect(order.paymentQr).toBe('QR-STRING');
    expect(order.code.length).toBeLessThanOrEqual(13);
  });

  it('BANK_QR: tạo mã lỗi thì không lưu đơn', async () => {
    const { service, ordersRepo, paymentQr } = setup();
    paymentQr.createQr.mockRejectedValue(new Error('VietQR down'));
    await expect(
      service.create({ ...baseInput, paymentMethod: 'BANK_QR' } as any, { id: alice.id } as User),
    ).rejects.toThrow('VietQR down');
    expect(ordersRepo.save).not.toHaveBeenCalled();
  });

  it('từ chối phương thức thanh toán lạ', async () => {
    const { service } = setup();
    await expect(
      service.create({ ...baseInput, paymentMethod: 'CASH' } as any, { id: alice.id } as User),
    ).rejects.toThrow(BadRequestException);
  });

  it('client không tự đặt được PAID/QR/mã giao dịch', async () => {
    const { service, ordersRepo } = setup();
    await service.create(
      { ...baseInput, paymentStatus: 'PAID', paymentRef: 'X', paymentQr: 'FAKE', paidAt: new Date() } as any,
      { id: alice.id } as User,
    );
    const arg = ordersRepo.create.mock.calls[0][0];
    expect(arg.paymentStatus).toBe(PaymentStatus.UNPAID);
    expect(arg.paymentRef).toBeUndefined();
    expect(arg.paymentQr).toBeUndefined();
    expect(arg.paidAt).toBeUndefined();
  });
});

describe('OrdersService.advance — chặn đơn chưa trả tiền', () => {
  const bankOrder = (paymentStatus: PaymentStatus) =>
    makeOrder({ paymentMethod: PaymentMethod.BANK_QR, paymentStatus });

  it('BANK_QR chưa PAID: không được sang PROCESSING', async () => {
    const { service, ordersRepo } = setup(bankOrder(PaymentStatus.UNPAID));
    await expect(service.advance('o1', OrderStatus.PROCESSING)).rejects.toThrow('Đơn chuyển khoản chưa được thanh toán');
    expect(ordersRepo.save).not.toHaveBeenCalled();
  });

  it('BANK_QR đã PAID: sang PROCESSING được', async () => {
    const { service } = setup(bankOrder(PaymentStatus.PAID));
    const order = await service.advance('o1', OrderStatus.PROCESSING);
    expect(order.status).toBe(OrderStatus.PROCESSING);
  });

  it('COD chưa thu tiền vẫn xử lý được', async () => {
    const { service } = setup(makeOrder({ paymentMethod: PaymentMethod.COD, paymentStatus: PaymentStatus.UNPAID }));
    const order = await service.advance('o1', OrderStatus.PROCESSING);
    expect(order.status).toBe(OrderStatus.PROCESSING);
  });
});

describe('OrdersService.markPaidByStaff', () => {
  it('COD ở DELIVERED: PAID, ghi người và thời điểm', async () => {
    const { service } = setup(makeOrder({ status: OrderStatus.DELIVERED, paymentMethod: PaymentMethod.COD, paymentStatus: PaymentStatus.UNPAID }));
    const order = await service.markPaidByStaff('o1', 's1');
    expect(order.paymentStatus).toBe(PaymentStatus.PAID);
    expect(order.paidBy).toBe('s1');
    expect(order.paidAt).toBeInstanceOf(Date);
  });

  it('COD chưa giao: từ chối', async () => {
    const { service, ordersRepo } = setup(makeOrder({ status: OrderStatus.SHIPPING, paymentMethod: PaymentMethod.COD, paymentStatus: PaymentStatus.UNPAID }));
    await expect(service.markPaidByStaff('o1', 's1')).rejects.toThrow('Chỉ thu tiền COD khi đơn đã giao');
    expect(ordersRepo.save).not.toHaveBeenCalled();
  });

  it('đã PAID: từ chối', async () => {
    const { service } = setup(makeOrder({ paymentMethod: PaymentMethod.BANK_QR, paymentStatus: PaymentStatus.PAID }));
    await expect(service.markPaidByStaff('o1', 's1')).rejects.toThrow(BadRequestException);
  });
});

describe('OrdersService.devMarkPaid', () => {
  const unpaidBank = () => makeOrder({ paymentMethod: PaymentMethod.BANK_QR, paymentStatus: PaymentStatus.UNPAID });

  it('chủ đơn giả lập đã nhận tiền: PAID với mã DEV-', async () => {
    const { service } = setup(unpaidBank());
    const order = await service.devMarkPaid('o1', alice);
    expect(order.paymentStatus).toBe(PaymentStatus.PAID);
    expect(order.paymentRef).toMatch(/^DEV-/);
  });

  it('người khác không giả lập được đơn của Alice', async () => {
    const { service } = setup(unpaidBank());
    await expect(service.devMarkPaid('o1', bob)).rejects.toThrow(ForbiddenException);
  });

  it('chỉ áp dụng cho đơn BANK_QR chưa trả', async () => {
    const { service } = setup(makeOrder({ paymentMethod: PaymentMethod.COD }));
    await expect(service.devMarkPaid('o1', alice)).rejects.toThrow(BadRequestException);
  });
});

describe('OrdersService.findOneFor', () => {
  it('khách khác bị 403, chủ đơn và STAFF được xem', async () => {
    const { service } = setup(makeOrder());
    await expect(service.findOneFor('o1', bob)).rejects.toThrow(ForbiddenException);
    await expect(service.findOneFor('o1', alice)).resolves.toBeDefined();
    await expect(service.findOneFor('o1', staff)).resolves.toBeDefined();
  });
});

describe('OrdersService.findAll', () => {
  it('STAFF thấy mọi đơn, người khác chỉ đơn của mình, có lọc status hợp lệ', async () => {
    const { service, ordersRepo } = setup();
    await service.findAll(staff, 1, 10, OrderStatus.SHIPPING);
    expect(ordersRepo.findAndCount.mock.calls[0][0].where).toEqual({ status: OrderStatus.SHIPPING });
    await service.findAll(alice);
    expect(ordersRepo.findAndCount.mock.calls[1][0].where).toEqual({ customer: { id: alice.id } });
  });

  it('từ chối status lạ', async () => {
    const { service } = setup();
    await expect(service.findAll(staff, 1, 10, 'HACKED')).rejects.toThrow(BadRequestException);
  });
});

describe('OrdersService.advance', () => {
  it('SHIPPING bắt buộc có đơn vị và mã vận đơn (không được rỗng)', async () => {
    const { service } = setup(makeOrder({ status: OrderStatus.PROCESSING }));
    await expect(service.advance('o1', OrderStatus.SHIPPING)).rejects.toThrow(BadRequestException);
    await expect(service.advance('o1', OrderStatus.SHIPPING, { trackingNumber: '  ', shippingProvider: 'GHN' })).rejects.toThrow(BadRequestException);
  });

  it('lưu thông tin vận chuyển khi hợp lệ', async () => {
    const { service } = setup(makeOrder({ status: OrderStatus.PROCESSING }));
    const o = await service.advance('o1', OrderStatus.SHIPPING, { trackingNumber: ' GHN123 ', shippingProvider: 'GHN' });
    expect(o.status).toBe(OrderStatus.SHIPPING);
    expect(o.trackingNumber).toBe('GHN123');
    expect(o.shippingProvider).toBe('GHN');
  });

  it('DELIVERED ghi deliveryTime', async () => {
    const { service } = setup(makeOrder({ status: OrderStatus.SHIPPING }));
    const o = await service.advance('o1', OrderStatus.DELIVERED);
    expect(o.deliveryTime).toBeDefined();
  });

  it('chặn nhảy cóc và STAFF đặt COMPLETED/CANCELLED', async () => {
    const { service } = setup(makeOrder({ status: OrderStatus.INIT }));
    await expect(service.advance('o1', OrderStatus.SHIPPING, { trackingNumber: 'a', shippingProvider: 'b' })).rejects.toThrow(BadRequestException);
    await expect(service.advance('o1', OrderStatus.COMPLETED)).rejects.toThrow(BadRequestException);
    await expect(service.advance('o1', OrderStatus.CANCELLED)).rejects.toThrow(BadRequestException);
  });
});

describe('OrdersService.confirmReceived', () => {
  it('chỉ chủ đơn, chỉ khi DELIVERED', async () => {
    const early = setup(makeOrder({ status: OrderStatus.SHIPPING }));
    await expect(early.service.confirmReceived('o1', alice)).rejects.toThrow(BadRequestException);
    const done = setup(makeOrder({ status: OrderStatus.DELIVERED }));
    await expect(done.service.confirmReceived('o1', bob)).rejects.toThrow(ForbiddenException);
    const ok = await done.service.confirmReceived('o1', alice);
    expect(ok.status).toBe(OrderStatus.COMPLETED);
  });
});

describe('OrdersService.cancel', () => {
  it('trả 400 (không phải Error thường) khi đã giao đi, 403 khi không phải chủ đơn', async () => {
    const shipping = setup(makeOrder({ status: OrderStatus.SHIPPING }));
    await expect(shipping.service.cancel('o1', alice)).rejects.toThrow(BadRequestException);
    const init = setup(makeOrder({ status: OrderStatus.INIT }));
    await expect(init.service.cancel('o1', bob)).rejects.toThrow(ForbiddenException);
    const ok = await init.service.cancel('o1', alice);
    expect(ok.status).toBe(OrderStatus.CANCELLED);
  });

  it('huỷ đơn chuyển khoản đã PAID: vẫn huỷ được nhưng ghi log cảnh báo cần hoàn tiền thủ công (spec §3)', async () => {
    const warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    const { service } = setup(makeOrder({ status: OrderStatus.INIT, paymentMethod: PaymentMethod.BANK_QR, paymentStatus: PaymentStatus.PAID }));
    const ok = await service.cancel('o1', alice);
    expect(ok.status).toBe(OrderStatus.CANCELLED);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('hoàn tiền'));
    warnSpy.mockRestore();
  });

  it('huỷ đơn COD hoặc chưa trả: không ghi log cảnh báo hoàn tiền', async () => {
    const warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    const { service } = setup(makeOrder({ status: OrderStatus.INIT, paymentMethod: PaymentMethod.COD, paymentStatus: PaymentStatus.UNPAID }));
    await service.cancel('o1', alice);
    expect(warnSpy).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});
