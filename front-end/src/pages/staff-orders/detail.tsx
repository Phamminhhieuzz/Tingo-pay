/**
 * Chi tiết đơn cho nhân viên Tingo — route `/staff/orders/:id`.
 * Hiện thông tin người nhận và nút chuyển sang bước kế tiếp; bước "Đang giao" mở form nhập
 * đơn vị vận chuyển và mã vận đơn (backend từ chối nếu thiếu).
 */
import React, { useEffect, useState } from "react";
import { Page, Box, Text, Button, Input, Icon, Header, useSnackbar } from "zmp-ui";
import { useParams } from "react-router-dom";
import { useAtomValue } from "jotai";
import { useOrders } from "@/hooks/use-orders";
import { Order, userRoleAtom } from "@/state/atoms";
import OrderTimeline from "@/components/orders/order-timeline";
import { getOrderStatusLabel, ORDER_STATUS_TONE } from "@/components/orders/order-card";
import PaymentBadge from "@/components/orders/payment-badge";
import StatusChip from "@/components/ui/status-chip";
import SectionCard from "@/components/ui/section-card";
import EmptyState from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "@/i18n";

const StaffOrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { openSnackbar } = useSnackbar();
  const role = useAtomValue(userRoleAtom);
  const { fetchOrderById, advanceOrder, markPaymentReceived } = useOrders();
  const { t } = useTranslation();

  const NEXT_ACTION: Partial<Record<Order["status"], { to: Order["status"]; label: string }>> = {
    INIT: { to: "PROCESSING", label: t("staffOrders.nextInit") },
    PROCESSING: { to: "SHIPPING", label: t("staffOrders.nextProcessing") },
    SHIPPING: { to: "DELIVERED", label: t("staffOrders.nextShipping") },
  };

  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isActing, setIsActing] = useState(false);
  const [provider, setProvider] = useState("");
  const [tracking, setTracking] = useState("");

  const load = async () => {
    if (!id) return;
    setError(null);
    try {
      setOrder(await fetchOrderById(id));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("staffOrders.errorLoad"));
    }
  };

  useEffect(() => {
    if (role === "STAFF") load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, role]);

  if (role !== "STAFF") {
    return (
      <Page className="bg-tingo-bg">
        <Header title={t("staffOrders.detailTitle")} showBackIcon />
        <Box className="pt-16">
          <EmptyState icon="🔒" title={t("staffOrders.noAccess")} />
        </Box>
      </Page>
    );
  }

  if (error) {
    return (
      <Page className="bg-tingo-bg">
        <Header title={t("staffOrders.detailTitle")} showBackIcon />
        <Box className="pt-16 px-4 text-center">
          <Icon icon="zi-warning-solid" className="text-red-500 mb-2" size={32} />
          <Text className="text-red-600 mb-3">{error}</Text>
          <Button size="small" variant="secondary" onClick={load}>{t("common.retry")}</Button>
        </Box>
      </Page>
    );
  }

  if (!order) {
    return (
      <Page className="bg-tingo-bg">
        <Header title={t("staffOrders.detailTitle")} showBackIcon />
        <Box className="px-4 pt-16 space-y-3">
          <Skeleton className="h-60 w-full" />
          <Skeleton className="h-28 w-full" />
        </Box>
      </Page>
    );
  }

  const action = NEXT_ACTION[order.status];
  const needsShipping = action?.to === "SHIPPING";
  // Đơn chuyển khoản phải có tiền về mới được bắt đầu xử lý (backend cũng chặn, đây là gợi ý cho nhân viên)
  const waitingPayment = order.paymentMethod === "BANK_QR" && order.paymentStatus === "UNPAID" && order.status !== "CANCELLED";
  const blockedByPayment = waitingPayment && order.status === "INIT";
  // COD chỉ thu tiền sau khi giao; đơn chuyển khoản có thể xác nhận tay khi callback không tới
  const canMarkPaid =
    order.paymentStatus === "UNPAID" &&
    order.status !== "CANCELLED" &&
    (order.paymentMethod === "BANK_QR" || order.status === "DELIVERED" || order.status === "COMPLETED");

  const handleMarkPaid = async () => {
    setIsActing(true);
    try {
      await markPaymentReceived(order.id);
      openSnackbar({ type: "success", text: t("staffOrders.paidRecorded"), duration: 2000 });
      await load();
    } catch (err) {
      openSnackbar({ type: "error", text: err instanceof Error ? err.message : t("staffOrders.paidRecordFailed"), duration: 3500 });
    } finally {
      setIsActing(false);
    }
  };

  const handleAdvance = async () => {
    if (!action) return;
    setIsActing(true);
    try {
      await advanceOrder(
        order.id,
        action.to,
        needsShipping ? { shippingProvider: provider, trackingNumber: tracking } : undefined,
      );
      openSnackbar({ type: "success", text: t("staffOrders.updated"), duration: 2000 });
      setProvider("");
      setTracking("");
      await load();
    } catch (err) {
      openSnackbar({ type: "error", text: err instanceof Error ? err.message : t("staffOrders.updateFailed"), duration: 3500 });
    } finally {
      setIsActing(false);
    }
  };

  return (
    <Page className="flex flex-col bg-tingo-bg pb-6">
      <Header title={`${t("staffOrders.genericOrderName")} #${order.code}`} showBackIcon />
      <Box className="flex-1 px-4 pt-16 pb-4 space-y-3 fade-in-up">
        <SectionCard>
          <Box className="flex items-center justify-between mb-3">
            <Text className="font-bold text-gray-800 dark:text-gray-100">{order.productName || t("staffOrders.genericOrderName")} × {order.quantity}</Text>
            <StatusChip tone={ORDER_STATUS_TONE[order.status]}>{getOrderStatusLabel(order.status, t)}</StatusChip>
          </Box>
          <OrderTimeline status={order.status} orderTime={order.orderTime} deliveryTime={order.deliveryTime} />
        </SectionCard>

        {order.status === "CANCELLED" && order.paymentMethod === "BANK_QR" && order.paymentStatus === "PAID" && (
          <Box className="bg-amber-50 border border-amber-200 rounded-2xl p-3 flex items-center space-x-2">
            <Text className="text-xl">⚠️</Text>
            <Text size="small" className="text-amber-700 font-medium">{t("staffOrders.cancelledButPaid")}</Text>
          </Box>
        )}

        <SectionCard title={t("staffOrders.receiver")}>
          <Text size="small" className="font-bold text-gray-700 dark:text-gray-200">{order.receiverName} • {order.receiverPhone}</Text>
          <Text size="small" className="text-gray-500 dark:text-gray-400">{order.receiverAddress}</Text>
          {order.notes && <Text size="xSmall" className="text-gray-400 dark:text-gray-500 italic mt-1">{t("common.notes")}: {order.notes}</Text>}
        </SectionCard>

        <SectionCard title={t("staffOrders.payment")}>
          <Box className="flex items-center justify-between">
            <Text size="small" className="text-gray-600 dark:text-gray-300">
              {order.paymentMethod === "BANK_QR" ? t("product.bankQr") : t("product.cod")} • {Number(order.payAmount).toLocaleString("vi-VN")}đ
            </Text>
            <PaymentBadge order={order} />
          </Box>
          {blockedByPayment && (
            <Text size="xSmall" className="text-amber-600 mt-2">{t("staffOrders.waitingPayment")}</Text>
          )}
          {canMarkPaid && (
            <Button size="small" variant="secondary" className="mt-3" loading={isActing} disabled={isActing} onClick={handleMarkPaid}>
              {order.paymentMethod === "COD" ? t("staffOrders.markPaidCod") : t("staffOrders.markPaidBank")}
            </Button>
          )}
        </SectionCard>

        {(order.trackingNumber || order.shippingProvider) && (
          <SectionCard title={t("staffOrders.shipping")}>
            <Text size="small" className="text-gray-600 dark:text-gray-300">
              {order.shippingProvider} • <b>{order.trackingNumber}</b>
            </Text>
          </SectionCard>
        )}

        {needsShipping && (
          <SectionCard title={t("staffOrders.shipping")}>
            <Box className="space-y-3">
              <Input label={t("staffOrders.shippingProvider")} value={provider} onChange={(e) => setProvider(e.target.value)} />
              <Input label={t("staffOrders.trackingNumber")} value={tracking} onChange={(e) => setTracking(e.target.value)} />
            </Box>
          </SectionCard>
        )}
      </Box>

      {action && (
        <Box className="px-4">
          <Button
            fullWidth
            size="large"
            loading={isActing}
            disabled={isActing || blockedByPayment || (needsShipping && (!provider.trim() || !tracking.trim()))}
            className="bg-tingo-red text-white font-bold rounded-2xl shadow-float"
            onClick={handleAdvance}
          >
            {action.label}
          </Button>
        </Box>
      )}
    </Page>
  );
};

export default StaffOrderDetailPage;
