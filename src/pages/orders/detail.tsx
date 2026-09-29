/**
 * Trang Chi tiết đơn hàng — route `/orders/:id`.
 * Timeline theo dõi, thông tin vận chuyển (đơn vị + mã vận đơn có nút sao chép), thông tin đơn
 * và người nhận; khách xác nhận đã nhận hàng hoặc huỷ đơn tuỳ trạng thái.
 */
import React, { useEffect, useState } from "react";
import { Page, Box, Text, Button, Icon, Header, useSnackbar } from "zmp-ui";
import { useParams, useNavigate } from "react-router-dom";
import { useOrders } from "@/hooks/use-orders";
import { Order } from "@/state/atoms";
import OrderTimeline from "@/components/orders/order-timeline";
import { getOrderStatusLabel, ORDER_STATUS_TONE } from "@/components/orders/order-card";
import PaymentBadge from "@/components/orders/payment-badge";
import PaymentQrCard from "@/components/orders/payment-qr-card";
import StatusChip from "@/components/ui/status-chip";
import SectionCard from "@/components/ui/section-card";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "@/i18n";

const formatDateTime = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", year: "numeric" });
};

const formatMoney = (amount: number) => `${Number(amount).toLocaleString("vi-VN")}đ`;

const Row = ({ label, value, bold }: { label: string; value: string; bold?: boolean }) => (
  <Box className="flex justify-between py-1">
    <Text size="small" className="text-gray-400 dark:text-gray-500">{label}</Text>
    <Text size="small" className={`${bold ? "font-bold text-gray-800 dark:text-gray-100" : "font-medium text-gray-700 dark:text-gray-200"} text-right ml-4`}>{value}</Text>
  </Box>
);

const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { openSnackbar } = useSnackbar();
  const { fetchOrderById, cancelOrder, confirmReceived, devMarkPaid } = useOrders();
  const { t } = useTranslation();

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isActing, setIsActing] = useState(false);

  const loadOrder = async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      setOrder(await fetchOrderById(id));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("orders.detailErrorLoad"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Đơn chuyển khoản chưa trả: dò lại mỗi 5 giây để tự chuyển sang "Đã thanh toán"; lỗi mạng thì bỏ qua và thử lần sau
  const waitingPayment =
    order?.paymentMethod === "BANK_QR" && order.paymentStatus === "UNPAID" && order.status !== "CANCELLED";
  useEffect(() => {
    if (!waitingPayment || !id) return;
    const timer = setInterval(async () => {
      try {
        setOrder(await fetchOrderById(id));
      } catch {
        /* giữ nguyên màn hình, lần sau thử lại */
      }
    }, 5000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [waitingPayment, id]);

  const act = async (run: () => Promise<unknown>, okText: string, failText: string) => {
    setIsActing(true);
    try {
      await run();
      openSnackbar({ type: "success", text: okText, duration: 2000 });
      await loadOrder();
    } catch (err) {
      openSnackbar({ type: "error", text: err instanceof Error ? err.message : failText, duration: 3000 });
    } finally {
      setIsActing(false);
    }
  };

  const copyTracking = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      openSnackbar({ type: "success", text: t("orders.copyTrackingSuccess"), duration: 1500 });
    } catch {
      openSnackbar({ type: "warning", text: `${t("orders.trackingNumber")}: ${code}`, duration: 4000 });
    }
  };

  if (isLoading && !order) {
    return (
      <Page className="flex flex-col bg-tingo-bg">
        <Header title={t("orders.detailTitle")} showBackIcon />
        <Box className="px-4 pt-16 space-y-3">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-28 w-full" />
        </Box>
      </Page>
    );
  }

  if (error || !order) {
    return (
      <Page className="flex flex-col bg-tingo-bg">
        <Header title={t("orders.detailTitle")} showBackIcon />
        <Box className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <Icon icon="zi-warning-solid" className="text-red-500 mb-3" size={32} />
          <Text className="font-bold text-gray-700 dark:text-gray-200 mb-1">{t("orders.detailErrorLoad")}</Text>
          <Text size="small" className="text-gray-400 dark:text-gray-500 mb-4">{error || t("orders.notFoundSingular")}</Text>
          <Button variant="secondary" size="small" onClick={loadOrder} className="rounded-xl">{t("common.retry")}</Button>
        </Box>
      </Page>
    );
  }

  const canCancel = order.status === "INIT" || order.status === "PROCESSING";
  const canConfirm = order.status === "DELIVERED";
  const hasShipping = Boolean(order.trackingNumber || order.shippingProvider);

  return (
    <Page className="flex flex-col bg-tingo-bg pb-6">
      <Header title={`${t("orders.orderNumberPrefix")}${order.code}`} showBackIcon />

      <Box className="flex-1 px-4 pt-16 pb-4 space-y-3 fade-in-up">
        <SectionCard>
          <Box className="flex items-center justify-between mb-3">
            <Text className="font-bold text-gray-800 dark:text-gray-100">{t("orders.tracking")}</Text>
            <StatusChip tone={ORDER_STATUS_TONE[order.status]}>{getOrderStatusLabel(order.status, t)}</StatusChip>
          </Box>
          <OrderTimeline status={order.status} orderTime={order.orderTime} deliveryTime={order.deliveryTime} />
        </SectionCard>

        {waitingPayment && <PaymentQrCard order={order} />}
        {waitingPayment && import.meta.env.DEV && (
          <Button
            fullWidth
            size="small"
            variant="secondary"
            onClick={() => act(() => devMarkPaid(order.id), t("orders.devSimulatePayment"), t("orders.devSimulateFailed"))}
          >
            {t("orders.devButtonLabel")}
          </Button>
        )}

        {hasShipping && (
          <SectionCard title={t("staffOrders.shipping")}>
            <Row label={t("orders.shippingProvider")} value={order.shippingProvider || "—"} />
            <Box className="flex items-center justify-between py-1">
              <Text size="small" className="text-gray-400 dark:text-gray-500">{t("orders.trackingNumber")}</Text>
              <Box className="flex items-center space-x-2" onClick={() => order.trackingNumber && copyTracking(order.trackingNumber)}>
                <Text size="small" className="font-bold text-tingo-blue">{order.trackingNumber || "—"}</Text>
                {order.trackingNumber && <Icon icon="zi-copy" size={16} className="text-tingo-blue" />}
              </Box>
            </Box>
          </SectionCard>
        )}

        <SectionCard title={order.productName || t("orders.productFallback")}>
          <Row label={t("orders.orderDate")} value={formatDateTime(order.orderTime)} />
          <Row label={t("common.quantity")} value={String(order.quantity)} />
          <Row label={t("orders.unitPrice")} value={formatMoney(order.unitPrice)} />
          <Box className="border-t border-gray-100 dark:border-gray-700 mt-2 pt-2">
            <Row label={t("orders.totalPayment")} value={formatMoney(order.payAmount)} bold />
          </Box>
          <Box className="flex justify-between items-center py-1">
            <Text size="small" className="text-gray-400 dark:text-gray-500">{t("orders.payment")}</Text>
            <PaymentBadge order={order} />
          </Box>
        </SectionCard>

        <SectionCard title={t("orders.receiverInfo")}>
          <Box className="flex items-start space-x-2">
            <Icon icon="zi-location" size={18} className="text-tingo-red mt-0.5" />
            <Box>
              <Text size="small" className="font-bold text-gray-700 dark:text-gray-200">{order.receiverName} • {order.receiverPhone}</Text>
              <Text size="small" className="text-gray-500 dark:text-gray-400">{order.receiverAddress}</Text>
              {order.notes && <Text size="xSmall" className="text-gray-400 dark:text-gray-500 italic mt-1">{t("common.notes")}: {order.notes}</Text>}
            </Box>
          </Box>
        </SectionCard>

        <Button variant="tertiary" size="small" className="w-full text-tingo-blue" onClick={() => navigate("/orders", { replace: true })}>
          {t("orders.seeAllOrders")}
        </Button>
      </Box>

      {(canCancel || canConfirm) && (
        <Box className="px-4 space-y-2">
          {canConfirm && (
            <Button
              fullWidth
              size="large"
              loading={isActing}
              disabled={isActing}
              className="bg-tingo-red text-white font-bold rounded-2xl shadow-float"
              onClick={() => act(() => confirmReceived(order.id), t("orders.receivedSuccess"), t("orders.confirmFailed"))}
            >
              {t("orders.confirmReceived")}
            </Button>
          )}
          {canCancel && (
            <Button
              fullWidth
              size="large"
              variant="secondary"
              loading={isActing}
              disabled={isActing}
              className="rounded-2xl border-red-200 text-red-600"
              onClick={() => {
                // Đã trả tiền chuyển khoản: hoàn tiền xử lý tay, cần khách xác nhận trước khi huỷ
                if (
                  order.paymentMethod === "BANK_QR" &&
                  order.paymentStatus === "PAID" &&
                  !window.confirm(t("orders.cancelPaidWarning"))
                ) {
                  return;
                }
                act(() => cancelOrder(order.id), t("orders.cancelSuccess"), t("orders.cancelFailed"));
              }}
            >
              {t("orders.cancelOrder")}
            </Button>
          )}
        </Box>
      )}
    </Page>
  );
};

export default OrderDetailPage;
