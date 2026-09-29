/**
 * Trang Giao dịch — route `/transactions`.
 * Hiển thị danh sách lịch sử giao dịch nhận tiền của người dùng (qua loa thanh toán/VietQR),
 * xử lý các trạng thái loading, rỗng và lỗi (thông qua ErrorBoundary + nút thử lại).
 */
import React from "react";
import { Box, Page, Text, Header, Button, Icon } from "zmp-ui";
import { SkeletonList } from "@/components/ui/skeleton";
import EmptyState from "@/components/ui/empty-state";
import { useAtomValue } from "jotai";
import { transactionsAtom, isLoadingTransactionsAtom, transactionsErrorAtom, userRoleAtom } from "@/state/atoms";
import { useTransactions } from "@/hooks/use-transactions";
import TransactionItem from "@/components/transactions/transaction-item";
import BottomNav from "@/components/bottom-nav";
import { useTranslation } from "@/i18n";

const TransactionsPage: React.FC = () => {
  const role = useAtomValue(userRoleAtom) || "GUEST";
  const { t } = useTranslation();
  const transactions = useAtomValue(transactionsAtom);
  const loading = useAtomValue(isLoadingTransactionsAtom);
  const error = useAtomValue(transactionsErrorAtom);
  const { fetchTransactions } = useTransactions();

  return (
    <Page className="flex flex-col bg-tingo-bg pb-24">
      <Header title={t("transactions.title")} showBackIcon={false} />

      <Box className="flex-1 px-4 pt-16 pb-4">
        <Box className="space-y-3">
          {loading ? (
            <SkeletonList count={5} itemClassName="h-16" />
          ) : error ? (
            <Box className="p-6 bg-red-50 rounded-3xl border border-red-100 flex flex-col items-center text-center">
              <Icon icon="zi-warning-solid" className="text-red-500 mb-3" size={32} />
              <Text className="font-bold text-red-800 mb-1">{t("transactions.errorLoad")}</Text>
              <Text size="xSmall" className="text-red-400 mb-4">
                {error}
              </Text>
              <Button
                variant="secondary"
                size="small"
                className="rounded-xl border-red-200 text-red-600"
                onClick={fetchTransactions}
              >
                {t("common.retry")}
              </Button>
            </Box>
          ) : transactions.length === 0 ? (
            <EmptyState icon="📭" title={t("transactions.noTransactions")} description={t("transactions.noTransactionsDesc")} />
          ) : (
            transactions.map((transaction) => (
              <TransactionItem key={transaction.id} transaction={transaction} />
            ))
          )}
        </Box>
      </Box>

      <BottomNav role={role} />
    </Page>
  );
};

export default TransactionsPage;
