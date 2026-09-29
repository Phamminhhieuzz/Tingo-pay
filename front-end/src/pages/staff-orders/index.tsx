/**
 * Trang nhân viên Tingo — route `/staff/orders`: hàng đợi đơn cần xử lý.
 * Backend trả tối đa 25 đơn mới nhất mỗi lần nên có ghi chú rõ; người không phải STAFF thấy "không có quyền".
 */
import React, { useEffect, useMemo, useState } from "react";
import { Box, Page, Text, Header, Button, Icon } from "zmp-ui";
import { useAtomValue } from "jotai";
import { ordersAtom, isLoadingOrdersAtom, ordersErrorAtom, userRoleAtom, Order } from "@/state/atoms";
import { useOrders } from "@/hooks/use-orders";
import OrderCard from "@/components/orders/order-card";
import BottomNav from "@/components/bottom-nav";
import { SkeletonList } from "@/components/ui/skeleton";
import EmptyState from "@/components/ui/empty-state";
import { useTranslation } from "@/i18n";

const StaffOrdersPage: React.FC = () => {
  const { t } = useTranslation();
  const role = useAtomValue(userRoleAtom) || "GUEST";
  const orders = useAtomValue(ordersAtom);
  const loading = useAtomValue(isLoadingOrdersAtom);
  const error = useAtomValue(ordersErrorAtom);
  const { fetchOrders } = useOrders();
  const [tabKey, setTabKey] = useState("todo");
  const isStaff = role === "STAFF";

  const TABS: { key: string; label: string; match: (s: Order["status"]) => boolean }[] = [
    { key: "todo", label: t("staffOrders.tabTodo"), match: (s) => s === "INIT" || s === "PROCESSING" },
    { key: "shipping", label: t("staffOrders.tabShipping"), match: (s) => s === "SHIPPING" },
    { key: "done", label: t("staffOrders.tabDone"), match: (s) => s === "DELIVERED" || s === "COMPLETED" },
    { key: "cancelled", label: t("staffOrders.tabCancelled"), match: (s) => s === "CANCELLED" },
  ];

  useEffect(() => {
    if (isStaff) fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStaff]);

  const visible = useMemo(() => {
    const tab = TABS.find((tb) => tb.key === tabKey) || TABS[0];
    return orders.filter((o) => tab.match(o.status));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders, tabKey]);

  if (!isStaff) {
    return (
      <Page className="flex flex-col bg-tingo-bg">
        <Header title={t("staffOrders.pageTitle")} showBackIcon />
        <Box className="pt-16">
          <EmptyState icon="🔒" title={t("staffOrders.noAccess")} description={t("staffOrders.noAccessDesc")} />
        </Box>
      </Page>
    );
  }

  return (
    <Page className="flex flex-col bg-tingo-bg pb-24">
      <Header title={t("staffOrders.pageTitle")} showBackIcon={false} />
      <Box className="flex-1 px-4 pt-16 pb-4">
        <Box className="flex space-x-2 overflow-x-auto no-scrollbar pb-3">
          {TABS.map((tab) => (
            <Box
              key={tab.key}
              onClick={() => setTabKey(tab.key)}
              className={`shrink-0 px-3.5 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                tabKey === tab.key ? "bg-tingo-red text-white shadow-float" : "bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 shadow-card"
              }`}
            >
              {tab.label}
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
            <EmptyState icon="📭" title={t("staffOrders.emptyInCategory")} />
          ) : (
            visible.map((o) => <OrderCard key={o.id} order={o} to={`/staff/orders/${o.id}`} />)
          )}
        </Box>

        {!loading && !error && orders.length >= 25 && (
          <Text size="xSmall" className="text-gray-400 dark:text-gray-500 text-center mt-4">{t("staffOrders.showingLatest25")}</Text>
        )}
      </Box>
      <BottomNav role={role} />
    </Page>
  );
};

export default StaffOrdersPage;
