/*
 * BankAccountInfoPage — Màn hình thông tin tài khoản ngân hàng, route
 * "/bank-account/add". Hiển thị dữ liệu ngân hàng đã được parse từ mã VietQR
 * (truyền qua state của react-router), cho nhập thêm SĐT + CCCD/CMND (backend
 * bắt buộc nhưng QR không có), rồi tạo tài khoản và liên kết vào cửa hàng đầu
 * tiên của Chủ cửa hàng (nếu có).
 */
import React, { useState } from "react";
import { Page, Box, Text, Button, Icon, Header, Input, useSnackbar } from "zmp-ui";
import { useLocation, useNavigate } from "react-router-dom";
import { useAtomValue } from "jotai";
import CompanyFooter from "@/components/company-footer";
import { shopsAtom } from "@/state/atoms";
import { useBankAccounts } from "@/hooks/use-bank-accounts";
import { useTranslation } from "@/i18n";

const BankAccountInfoPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { openSnackbar } = useSnackbar();
  const shops = useAtomValue(shopsAtom);
  const { createBankAccount, linkBankAccountToShop } = useBankAccounts();
  const { t } = useTranslation();

  // Dữ liệu ngân hàng được ScanPage truyền qua router state sau khi quét & parse QR;
  // dùng "|| {}" để tránh lỗi khi người dùng vào thẳng trang này không qua quét mã
  const { bankData } = location.state || {};

  const [phone, setPhone] = useState("");
  const [citizenId, setCitizenId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAdd = async () => {
    if (!bankData?.accountNo) {
      openSnackbar({ type: "error", text: t("bankAccount.missingQrData"), duration: 3000 });
      return;
    }
    if (!phone.trim() || !citizenId.trim()) {
      openSnackbar({ type: "warning", text: t("bankAccount.missingFields"), duration: 3000 });
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await createBankAccount({
        bankBin: bankData.bankId || "",
        bankCode: bankData.bankId || "",
        accountNumber: bankData.accountNo,
        accountHolder: bankData.accountName || "",
        phone: phone.trim(),
        citizenId: citizenId.trim(),
      });

      // Nếu Chủ cửa hàng đã có sẵn cửa hàng, liên kết tài khoản vừa thêm vào cửa hàng đầu tiên luôn
      if (shops.length > 0) {
        await linkBankAccountToShop(created.id, shops[0].id);
      }

      openSnackbar({ type: "success", text: t("bankAccount.addSuccess"), duration: 3000 });
      navigate("/bank-account");
    } catch (error: any) {
      openSnackbar({
        type: "error",
        text: `${t("bankAccount.addFailed")} ${error.message || t("roleSelection.unknownReason")}`,
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Page className="flex flex-col bg-tingo-bg">
      <Header title={t("bankAccount.addTitle")} showBackIcon />

      <Box className="flex-1 p-6 pt-16">
        <Box className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm space-y-6">
          <Box className="flex items-center space-x-4 pb-6 border-b border-gray-50 dark:border-gray-800">
            <Box className="w-12 h-12 bg-gray-50 dark:bg-gray-700 rounded-xl flex items-center justify-center border border-gray-100 dark:border-gray-700">
              <Icon icon="zi-home" className="text-tingo-blue" />
            </Box>
            <Box>
              <Text size="xSmall" className="text-gray-400 dark:text-gray-500 font-medium">{t("bankAccount.bank")}</Text>
              <Text className="font-bold text-gray-800 dark:text-gray-100">{bankData?.bankId || t("bankAccount.undetermined")}</Text>
            </Box>
          </Box>

          <Box>
            <Text size="xSmall" className="text-gray-400 dark:text-gray-500 font-medium mb-1">{t("bankAccount.accountNumberLabel")}</Text>
            <Text className="font-bold text-gray-800 dark:text-gray-100 text-lg">{bankData?.accountNo || "---"}</Text>
          </Box>

          <Box>
            <Text size="xSmall" className="text-gray-400 dark:text-gray-500 font-medium mb-1">{t("bankAccount.accountHolderLabel")}</Text>
            <Text className="font-bold text-gray-800 dark:text-gray-100 uppercase">{bankData?.accountName || "---"}</Text>
          </Box>

          <Box>
            <Text size="xSmall" className="text-gray-400 dark:text-gray-500 font-medium mb-1">{t("bankAccount.phoneLabel")}</Text>
            <Input placeholder={t("bankAccount.phonePlaceholder")} value={phone} onChange={(e) => setPhone(e.target.value)} />
          </Box>

          <Box>
            <Text size="xSmall" className="text-gray-400 dark:text-gray-500 font-medium mb-1">{t("bankAccount.citizenIdLabel")}</Text>
            <Input placeholder={t("bankAccount.citizenIdPlaceholder")} value={citizenId} onChange={(e) => setCitizenId(e.target.value)} />
          </Box>

          <Box className="pt-4">
            <Button
              fullWidth
              size="large"
              loading={isSubmitting}
              disabled={isSubmitting}
              className="bg-tingo-red text-white font-bold rounded-2xl"
              onClick={handleAdd}
            >
              {t("dashboard.addNew")}
            </Button>
          </Box>
        </Box>
      </Box>

      <CompanyFooter />
    </Page>
  );
};

export default BankAccountInfoPage;
