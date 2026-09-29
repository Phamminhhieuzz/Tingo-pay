import { OrdersController } from './orders.controller';
import { OrderStatus } from '../../entities/order.entity';
import { UserRole } from '../../entities/user.entity';

const makeController = () => {
  const service = {
    findAll: jest.fn().mockResolvedValue({ data: [], total: 0 }),
    findOneFor: jest.fn(),
    create: jest.fn(),
    advance: jest.fn(),
    confirmReceived: jest.fn(),
    cancel: jest.fn(),
    markPaidByStaff: jest.fn(),
    devMarkPaid: jest.fn(),
  };
  return { controller: new OrdersController(service as any), service };
};

describe('OrdersController', () => {
  it('chuyển req.user làm actor cho danh sách và lọc status', async () => {
    const { controller, service } = makeController();
    const req = { user: { id: 'u1', role: UserRole.CUSTOMER } };
    await controller.findAll(req, 2, 5, 'SHIPPING');
    expect(service.findAll).toHaveBeenCalledWith(req.user, 2, 5, 'SHIPPING');
  });

  it('cập nhật trạng thái truyền cả thông tin vận chuyển', async () => {
    const { controller, service } = makeController();
    await controller.updateStatus('o1', {
      status: OrderStatus.SHIPPING,
      trackingNumber: 'GHN1',
      shippingProvider: 'GHN',
    });
    expect(service.advance).toHaveBeenCalledWith('o1', OrderStatus.SHIPPING, {
      trackingNumber: 'GHN1',
      shippingProvider: 'GHN',
    });
  });

  it('xác nhận nhận hàng và huỷ đều đi qua actor của người gọi', async () => {
    const { controller, service } = makeController();
    const req = { user: { id: 'u1', role: UserRole.CUSTOMER } };
    await controller.confirmReceived('o1', req);
    await controller.cancel('o1', req);
    expect(service.confirmReceived).toHaveBeenCalledWith('o1', req.user);
    expect(service.cancel).toHaveBeenCalledWith('o1', req.user);
  });

  it('nhân viên đánh dấu đã nhận tiền dùng id người gọi', async () => {
    const { controller, service } = makeController();
    const req = { user: { id: 's1', role: UserRole.STAFF } };
    await controller.markPaymentReceived('o1', req);
    expect(service.markPaidByStaff).toHaveBeenCalledWith('o1', 's1');
  });

  it('giả lập báo tiền vào đi qua actor của người gọi', async () => {
    const { controller, service } = makeController();
    const req = { user: { id: 'u1', role: UserRole.CUSTOMER } };
    await controller.devMarkPaid('o1', req);
    expect(service.devMarkPaid).toHaveBeenCalledWith('o1', req.user);
  });
});
