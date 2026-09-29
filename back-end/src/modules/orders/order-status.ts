import { OrderStatus } from '../../entities/order.entity';

// Luồng duy nhất được phép: mỗi trạng thái chỉ có 1 bước kế tiếp
const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  [OrderStatus.INIT]: OrderStatus.PROCESSING,
  [OrderStatus.PROCESSING]: OrderStatus.SHIPPING,
  [OrderStatus.SHIPPING]: OrderStatus.DELIVERED,
  [OrderStatus.DELIVERED]: OrderStatus.COMPLETED,
};

const CANCELLABLE: OrderStatus[] = [OrderStatus.INIT, OrderStatus.PROCESSING];

// COMPLETED do khách xác nhận, CANCELLED đi qua endpoint huỷ — nhân viên không được đặt trực tiếp
export const STAFF_TARGETS: OrderStatus[] = [
  OrderStatus.PROCESSING,
  OrderStatus.SHIPPING,
  OrderStatus.DELIVERED,
];

export const canAdvance = (from: OrderStatus, to: OrderStatus): boolean =>
  NEXT_STATUS[from] === to;

export const canCancel = (status: OrderStatus): boolean => CANCELLABLE.includes(status);
