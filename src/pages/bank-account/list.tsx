/**
 * Trang Danh sách tài khoản ngân hàng — route `/bank-account`.
 * Hiển thị các tài khoản ngân hàng liên kết VietQR của Chủ cửa hàng, xử lý trạng thái
 * loading, lỗi tải dữ liệu (có nút thử lại), trạng thái rỗng, và cho phép xoá tài khoản.
 */
import React, { useEffect, useState } from "react";
import { Box, Page, Text, Header, Button, Icon, useSnackbar } from "zmp-ui";
import { useAtomValue, useSetAtom } from "jotai";
import { useNavigate } from "react-router-dom";
import { bankAccountsAtom, isLoadingBankAccountsAtom, bankAccountsErrorAtom, BankAccount } from "@/state/atoms";
import { useBankAccounts } from "@/hooks/use-bank-accounts";
import { SkeletonList } from "@/components/ui/skeleton";
import EmptyState from "@/components/ui/empty-state";
import StatusChip from "@/components/ui/status-chip";
import { useTranslation } from "@/i18n";

const BankAccountListPage: React.FC = () => {
  const navigate = useNavigate();
  const { openSnackbar } = useSnackbar();
  const { t } = useTranslation();
  const bankAccounts = useAtomValue(bankAccountsAtom);
  const setBankAccounts = useSetAtom(bankAccountsAtom);
  const loading = useAtomValue(isLoadingBankAccountsAtom);
  const error = useAtomValue(bankAccountsErrorAtom);
  const { fetchBankAccounts, deleteBankAccount } = useBankAccounts();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchBankAccounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDelete = async (account: BankAccount) => {
    setDeletingId(account.id);
    try {
      await deleteBankAccount(account.id);
      // Cập nhật lại danh sách tại chỗ, không cần gọi lại API
      setBankAccounts((prev) => prev.filter((a) => a.id !== account.id));
      openSnackbar({ type: "success", text: t("bankAccount.deleteSuccess"), duration: 2500 });
    } catch (err: any) {
      openSnackbar({
        type: "error",
        text: `${t("bankAccount.deleteFailed")} ${err.message || t("roleSelection.unknownReason")}`,
        duration: 4000,
      });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Page className="flex flex-col bg-tingo-bg">
      <Header title={t("bankAccount.title")} showBackIcon />

      <Box className="flex-1 px-4 pt-16 pb-6 space-y-3">
        {loading ? (
          <SkeletonList count={2} itemClassName="h-[84px]" />
        ) : error ? (
          <Box className="p-6 bg-red-50 rounded-3xl border border-red-100 flex flex-col items-center text-center">
            <Icon icon="zi-warning-solid" className="text-red-500 mb-3" size={32} />
            <Text className="font-bold text-red-800 mb-1">{t("bankAccount.errorLoad")}</Text>
            <Text size="xSmall" className="text-red-400 mb-4">
              {error}
            </Text>
            <Button
              variant="secondary"
              size="small"
              className="rounded-xl border-red-200 text-red-600"
              onClick={fetchBankAccounts}
            >
              {t("common.retry")}
            </Button>
          </Box>
        ) : bankAccounts.length === 0 ? (
          <EmptyState
            icon="🏦"
            title={t("bankAccount.noAccounts")}
            description={t("bankAccount.noAccountsDesc")}
            actionLabel={t("bankAccount.scanQrAction")}
            onAction={() => navigate("/qr/scan")}
          />
        ) : (
          bankAccounts.map((account) => (
            <Box key={account.id} className="fade-in-up bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-card flex items-center space-x-3">
              <Box className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                <Icon icon="zi-home" className="text-tingo-blue" />
              </Box>
              <Box className="flex-1">
                <Text className="font-bold text-gray-800 dark:text-gray-100">{account.bankCode || t("bankAccount.bank")}</Text>
                <Text size="small" className="text-gray-500 dark:text-gray-400">{account.accountNumber}</Text>
                <Text size="xSmall" className="text-gray-400 dark:text-gray-500 uppercase">{account.accountHolder}</Text>
                <StatusChip tone={account.status === "LINKED" ? "success" : "neutral"}>
                  {account.status === "LINKED" ? t("bankAccount.linkedToShop") : t("bankAccount.notLinkedToShop")}
                </StatusChip>
              </Box>
              <Button
                size="small"
                variant="secondary"
                loading={deletingId === account.id}
                disabled={deletingId === account.id}
                className="rounded-xl border-red-200 text-red-600"
                onClick={() => handleDelete(account)}
              >
                {t("bankAccount.delete")}
              </Button>
            </Box>
          ))
        )}
      </Box>
    </Page>
  );
};

export default BankAccountListPage;
