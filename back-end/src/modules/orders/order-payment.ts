import { Order, OrderStatus, PaymentMethod, PaymentStatus } from '../../entities/order.entity';

// Đơn chuyển khoản phải trả tiền xong nhân viên mới được bắt đầu xử lý; COD xử lý bình thường
export const canStartProcessing = (o: Pick<Order, 'paymentMethod' | 'paymentStatus'>): boolean =>
  o.paymentMethod !== PaymentMethod.BANK_QR || o.paymentStatus === PaymentStatus.PAID;

// Trả về lý do không được đánh dấu "đã nhận tiền", hoặc null nếu được phép
export const staffMarkPaidProblem = (
  o: Pick<Order, 'status' | 'paymentMethod' | 'paymentStatus'>,
): string | null => {
  if (o.paymentStatus === PaymentStatus.PAID) return 'Đơn hàng đã được thanh toán';
  if (o.status === OrderStatus.CANCELLED) return 'Đơn hàng đã huỷ';
  if (
    o.paymentMethod === PaymentMethod.COD &&
    o.status !== OrderStatus.DELIVERED &&
    o.status !== OrderStatus.COMPLETED
  ) {
    return 'Chỉ thu tiền COD khi đơn đã giao';
  }
  return null;
};
