/**
 * Trang Đơn hàng của khách — route `/orders`.
 * Lọc nhanh theo nhóm trạng thái ngay trên máy (không gọi lại API), có khung xương khi tải,
 * trạng thái lỗi có nút thử lại và trạng thái rỗng dẫn người dùng đi mua sắm.
 */
import React, { useEffect, useMemo, useState } from "react";
import { Box, Page, Text, Header, Button, Icon } from "zmp-ui";
import { useAtomValue } from "jotai";
import { useNavigate } from "react-router-dom";
import { ordersAtom, isLoadingOrdersAtom, ordersErrorAtom, userRoleAtom, Order } from "@/state/atoms";
import { useOrders } from "@/hooks/use-orders";
import OrderCard from "@/components/orders/order-card";
import BottomNav from "@/components/bottom-nav";
import { SkeletonList } from "@/components/ui/skeleton";
import EmptyState from "@/components/ui/empty-state";
import { useTranslation } from "@/i18n";

const OrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const role = useAtomValue(userRoleAtom) || "GUEST";
  const orders = useAtomValue(ordersAtom);
  const loading = useAtomValue(isLoadingOrdersAtom);
  const error = useAtomValue(ordersErrorAtom);
  const { fetchOrders } = useOrders();
  const [filterKey, setFilterKey] = useState("all");

  const FILTERS: { key: string; label: string; match: (s: Order["status"]) => boolean }[] = [
    { key: "all", label: t("orders.filterAll"), match: () => true },
    { key: "open", label: t("orders.filterOpen"), match: (s) => s === "INIT" || s === "PROCESSING" },
    { key: "shipping", label: t("orders.filterShipping"), match: (s) => s === "SHIPPING" || s === "DELIVERED" },
    { key: "done", label: t("orders.filterDone"), match: (s) => s === "COMPLETED" },
    { key: "cancelled", label: t("orders.filterCancelled"), match: (s) => s === "CANCELLED" },
  ];

  // Chỉ tải một lần khi vào trang; không đưa fetchOrders vào deps vì hàm được tạo lại mỗi render
  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visible = useMemo(() => {
    const filter = FILTERS.find((f) => f.key === filterKey) || FILTERS[0];
    return orders.filter((o) => filter.match(o.status));
  }, [orders, filterKey]);

  return (
    <Page className="flex flex-col bg-tingo-bg pb-24">
      <Header title={t("orders.title")} showBackIcon={false} />

      <Box className="flex-1 px-4 pt-16 pb-4">
        <Box className="flex space-x-2 overflow-x-auto no-scrollbar pb-3">
          {FILTERS.map((f) => (
            <Box
              key={f.key}
              onClick={() => setFilterKey(f.key)}
              className={`shrink-0 px-3.5 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                filterKey === f.key ? "bg-tingo-red text-white shadow-float" : "bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 shadow-card"
              }`}
            >
              {f.label}
            </Box>
          ))}
        </Box>

        <Box className="space-y-3">
          {loading ? (
            <SkeletonList count={4} itemClassName="h-[76px]" />
          ) : error ? (
            <Box className="p-6 bg-red-50 rounded-3xl border border-red-100 flex flex-col items-center text-center">
              <Icon icon="zi-warning-solid" className="text-red-500 mb-3" size={32} />
              <Text className="font-bold text-red-800 mb-1">{t("orders.errorLoad")}</Text>
              <Text size="xSmall" className="text-red-400 mb-4">{error}</Text>
              <Button variant="secondary" size="small" className="rounded-xl border-red-200 text-red-600" onClick={() => fetchOrders()}>
                {t("common.retry")}
              </Button>
            </Box>
          ) : visible.length === 0 ? (
            <EmptyState
              icon="🛒"
              title={orders.length === 0 ? t("orders.noOrders") : t("orders.emptyFiltered")}
              description={orders.length === 0 ? t("orders.emptyDesc") : undefined}
              actionLabel={orders.length === 0 ? t("orders.goShopping") : undefined}
              onAction={orders.length === 0 ? () => navigate("/cart") : undefined}
            />
          ) : (
            visible.map((order) => <OrderCard key={order.id} order={order} />)
          )}
        </Box>
      </Box>

      <BottomNav role={role} />
    </Page>
  );
};

export default OrdersPage;
