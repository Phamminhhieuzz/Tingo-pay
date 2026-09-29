/**
 * Hook quản lý các thao tác liên quan đến đơn hàng (mua loa thanh toán): lấy danh sách, chi tiết,
 * tạo mới, huỷ, khách xác nhận đã nhận hàng, và nhân viên Tingo đẩy đơn sang bước kế tiếp.
 * Danh sách đơn hàng được đồng bộ vào ordersAtom để các trang khác dùng chung.
 */
import { useSetAtom } from "jotai";
import { ordersAtom, isLoadingOrdersAtom, ordersErrorAtom, Order, PaymentMethod } from "@/state/atoms";
import { apiService } from "@/utils/api";

// Payload tạo đơn: giá do server tính từ sản phẩm nên client chỉ gửi mã sản phẩm và số lượng
export interface CreateOrderPayload {
  productId: string;
  quantity: number;
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  notes?: string;
  paymentMethod: PaymentMethod;
}

export interface ShippingInfo {
  trackingNumber?: string;
  shippingProvider?: string;
}

export const useOrders = () => {
  const setOrders = useSetAtom(ordersAtom);
  const setIsLoadingOrders = useSetAtom(isLoadingOrdersAtom);
  const setOrdersError = useSetAtom(ordersErrorAtom);

  // Lấy danh sách đơn (khách: đơn của mình, STAFF: mọi đơn); tối đa 25 đơn mới nhất mỗi lần
  const fetchOrders = async (status?: Order["status"]) => {
    setIsLoadingOrders(true);
    setOrdersError(null);
    try {
      const params: Record<string, string | number> = { limit: 25 };
      if (status) params.status = status;
      const data = await apiService.get<{ data: Order[]; total: number }>("/orders", params);
      setOrders(data.data);
    } catch (err) {
      console.error("Failed to fetch orders:", err);
      setOrdersError(err instanceof Error ? err.message : "Không thể tải danh sách đơn hàng");
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const fetchOrderById = async (id: string): Promise<Order> => apiService.get<Order>(`/orders/${id}`);

  const createOrder = async (payload: CreateOrderPayload): Promise<Order> =>
    apiService.post<Order>("/orders", payload);

  const cancelOrder = async (id: string): Promise<Order> =>
    apiService.delete<Order>(`/orders/${id}/cancel`);

  // Khách xác nhận đã nhận hàng (chỉ khi đơn ở trạng thái Đã giao)
  const confirmReceived = async (id: string): Promise<Order> =>
    apiService.put<Order>(`/orders/${id}/confirm-received`);

  // Nhân viên Tingo đẩy đơn sang bước kế tiếp; bước "Đang giao" kèm thông tin vận chuyển
  const advanceOrder = async (
    id: string,
    status: Order["status"],
    shipping?: ShippingInfo,
  ): Promise<Order> => apiService.put<Order>(`/orders/${id}/status`, { status, ...shipping });

  // Nhân viên xác nhận đã nhận tiền (COD sau khi giao, hoặc đơn chuyển khoản khi callback không tới)
  const markPaymentReceived = async (id: string): Promise<Order> =>
    apiService.put<Order>(`/orders/${id}/payment-received`);

  // Chỉ để dev: giả lập ngân hàng báo tiền vào (backend trả 404 nếu không bật ENABLE_DEBUG_PAYMENT)
  const devMarkPaid = async (id: string): Promise<Order> =>
    apiService.post<Order>(`/orders/${id}/dev-mark-paid`, {});

  return { fetchOrders, fetchOrderById, createOrder, cancelOrder, confirmReceived, advanceOrder, markPaymentReceived, devMarkPaid };
};
