import { OrderStatus, PaymentMethod, PaymentStatus } from '../../entities/order.entity';
import { canStartProcessing, staffMarkPaidProblem } from './order-payment';

const o = (over: any = {}) => ({
  status: OrderStatus.INIT,
  paymentMethod: PaymentMethod.COD,
  paymentStatus: PaymentStatus.UNPAID,
  ...over,
});

describe('canStartProcessing', () => {
  it('BANK_QR chưa trả thì không được xử lý', () => {
    expect(canStartProcessing(o({ paymentMethod: PaymentMethod.BANK_QR }))).toBe(false);
  });
  it('BANK_QR đã trả thì được xử lý', () => {
    expect(canStartProcessing(o({ paymentMethod: PaymentMethod.BANK_QR, paymentStatus: PaymentStatus.PAID }))).toBe(true);
  });
  it('COD luôn được xử lý dù chưa thu tiền', () => {
    expect(canStartProcessing(o())).toBe(true);
  });
});

describe('staffMarkPaidProblem', () => {
  it('COD chưa giao thì không được đánh dấu thu tiền', () => {
    expect(staffMarkPaidProblem(o({ status: OrderStatus.SHIPPING }))).toBe('Chỉ thu tiền COD khi đơn đã giao');
  });
  it.each([OrderStatus.DELIVERED, OrderStatus.COMPLETED])('COD ở %s thì được đánh dấu', (status) => {
    expect(staffMarkPaidProblem(o({ status }))).toBeNull();
  });
  it('BANK_QR được đánh dấu tay ở INIT (đường dự phòng khi callback không tới)', () => {
    expect(staffMarkPaidProblem(o({ paymentMethod: PaymentMethod.BANK_QR }))).toBeNull();
  });
  it('không đánh dấu lại đơn đã PAID', () => {
    expect(staffMarkPaidProblem(o({ paymentStatus: PaymentStatus.PAID }))).toBe('Đơn hàng đã được thanh toán');
  });
  it('không đánh dấu đơn đã huỷ', () => {
    expect(staffMarkPaidProblem(o({ status: OrderStatus.CANCELLED, paymentMethod: PaymentMethod.BANK_QR }))).toBe('Đơn hàng đã huỷ');
  });
});
