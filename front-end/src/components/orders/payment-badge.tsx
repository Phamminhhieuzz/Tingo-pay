/**
 * Chip trạng thái thanh toán của đơn: chờ thanh toán / đã thanh toán / thu khi nhận hàng / đã thu tiền.
 */
import React from "react";
import { Order } from "@/state/atoms";
import StatusChip, { ChipTone } from "@/components/ui/status-chip";
import { useTranslation } from "@/i18n";

export const paymentBadgeOf = (
  order: Pick<Order, "paymentMethod" | "paymentStatus">,
  t: (key: string) => string,
): { label: string; tone: ChipTone } => {
  if (order.paymentStatus === "PAID") {
    return { label: order.paymentMethod === "COD" ? t("orders.paidCod") : t("orders.paid"), tone: "success" };
  }
  return order.paymentMethod === "BANK_QR"
    ? { label: t("orders.waitingPaymentBadge"), tone: "warning" }
    : { label: t("orders.codBadge"), tone: "info" };
};

const PaymentBadge: React.FC<{ order: Pick<Order, "paymentMethod" | "paymentStatus"> }> = ({ order }) => {
  const { t } = useTranslation();
  const { label, tone } = paymentBadgeOf(order, t);
  return <StatusChip tone={tone}>{label}</StatusChip>;
};

export default PaymentBadge;
