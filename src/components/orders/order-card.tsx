/**
 * Thẻ 1 đơn hàng trong danh sách: tên sản phẩm, ngày đặt, số lượng, tổng tiền và chip trạng thái.
 * Mặc định mở chi tiết của khách; màn nhân viên truyền `to` riêng.
 */
import React from "react";
import { Box, Text, Icon } from "zmp-ui";
import { useNavigate } from "react-router-dom";
import { Order } from "@/state/atoms";
import StatusChip, { ChipTone } from "@/components/ui/status-chip";
import Pressable from "@/components/ui/pressable";
import PaymentBadge from "@/components/orders/payment-badge";
import { useTranslation } from "@/i18n";

interface OrderCardProps {
  order: Order;
  to?: string;
}

// Hàm (không phải object hằng số) vì nhãn cần đổi theo ngôn ngữ đang chọn — 3 nơi dùng
// (order-card, staff-orders/detail, orders/detail) đều tự có sẵn `t` trong component, truyền vào đây
export const getOrderStatusLabel = (status: Order["status"], t: (key: string) => string): string => {
  const KEY_BY_STATUS: Record<Order["status"], string> = {
    INIT: "orders.statusInit",
    PROCESSING: "orders.statusProcessing",
    SHIPPING: "orders.statusShipping",
    DELIVERED: "orders.statusDelivered",
    COMPLETED: "orders.statusCompleted",
    CANCELLED: "orders.statusCancelled",
  };
  return t(KEY_BY_STATUS[status]);
};

export const ORDER_STATUS_TONE: Record<Order["status"], ChipTone> = {
  INIT: "neutral",
  PROCESSING: "warning",
  SHIPPING: "info",
  DELIVERED: "success",
  COMPLETED: "success",
  CANCELLED: "danger",
};

const formatDate = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
};

const formatMoney = (amount: number) => `${Number(amount).toLocaleString("vi-VN")}đ`;

const OrderCard: React.FC<OrderCardProps> = ({ order, to }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  return (
    <Pressable
      onClick={() => navigate(to ?? `/orders/${order.id}`)}
      className="fade-in-up bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-card flex items-center space-x-3"
    >
      <Box className="flex-1 min-w-0">
        <Text className="font-bold text-gray-800 dark:text-gray-100 truncate">{order.productName || `${t("orders.orderNumberPrefix")}${order.code}`}</Text>
        <Text size="xSmall" className="text-gray-400 dark:text-gray-500 mt-0.5">
          #{order.code} • {formatDate(order.orderTime)} • {t("orders.quantityAbbr")} {order.quantity}
        </Text>
      </Box>
      <Box className="flex flex-col items-end space-y-1">
        <Text className="font-bold text-tingo-red">{formatMoney(order.payAmount)}</Text>
        <StatusChip tone={ORDER_STATUS_TONE[order.status]}>{getOrderStatusLabel(order.status, t)}</StatusChip>
        <PaymentBadge order={order} />
      </Box>
      <Icon icon="zi-chevron-right" className="text-gray-300 dark:text-gray-600" />
    </Pressable>
  );
};

export default OrderCard;
