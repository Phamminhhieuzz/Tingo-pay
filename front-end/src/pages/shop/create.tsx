/**
 * Trang Tạo cửa hàng — route "/shop/create".
 * Bất kỳ tài khoản nào (kể cả CUSTOMER) cũng vào được: tạo cửa hàng đầu tiên chính là cách
 * người dùng thường trở thành Chủ cửa hàng. Sau khi tạo xong, useShops tự lưu token mới
 * (đã có vai trò SHOP_OWNER) nên quay lại Dashboard là dùng được ngay các chức năng quản lý.
 */
import React, { useState } from "react";
import { Page, Box, Text, Button, Input, Header, useSnackbar } from "zmp-ui";
import { useNavigate } from "react-router-dom";
import { useShops } from "@/hooks/use-shops";
import { useTranslation } from "@/i18n";

const CreateShopPage: React.FC = () => {
  const navigate = useNavigate();
  const { openSnackbar } = useSnackbar();
  const { createShop } = useShops();
  const { t } = useTranslation();

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async () => {
    if (!name.trim() || !address.trim()) {
      openSnackbar({ type: "warning", text: t("shop.createMissingFields"), duration: 3000 });
      return;
    }

    setIsSubmitting(true);
    try {
      await createShop({ name: name.trim(), address: address.trim() });
      openSnackbar({ type: "success", text: t("shop.createSuccess"), duration: 3000 });
      navigate("/dashboard");
    } catch (error: any) {
      openSnackbar({
        type: "error",
        text: `${t("shop.createFailed")} ${error.message || t("roleSelection.unknownReason")}`,
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Page className="flex flex-col bg-tingo-bg">
      <Header title={t("shop.createTitle")} showBackIcon />

      <Box className="flex-1 p-6 pt-16">
        <Box className="fade-in-up bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-card space-y-6">
          <Box>
            <Text size="xSmall" className="text-gray-400 dark:text-gray-500 font-medium mb-1">{t("shop.shopName")}</Text>
            <Input placeholder={t("shop.shopNamePlaceholder")} value={name} onChange={(e) => setName(e.target.value)} />
          </Box>

          <Box>
            <Text size="xSmall" className="text-gray-400 dark:text-gray-500 font-medium mb-1">{t("shop.shopAddress")}</Text>
            <Input placeholder={t("shop.shopAddressPlaceholder")} value={address} onChange={(e) => setAddress(e.target.value)} />
          </Box>

          <Box className="pt-4">
            <Button
              fullWidth
              size="large"
              loading={isSubmitting}
              disabled={isSubmitting}
              className="bg-tingo-red text-white font-bold rounded-2xl"
              onClick={handleCreate}
            >
              {t("shop.createButton")}
            </Button>
          </Box>
        </Box>
      </Box>
    </Page>
  );
};

export default CreateShopPage;
