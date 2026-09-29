/*
 * DeviceInfoPage — Màn hình thông tin thiết bị loa, route "/device/add".
 * Hiển thị dữ liệu thiết bị (model, serial...) đã được parse từ mã QR định danh
 * Loa Tingo (truyền qua state của react-router), tạo thiết bị thật qua POST /devices
 * rồi liên kết vào cửa hàng đầu tiên của Chủ cửa hàng (nếu có).
 */
import React, { useState } from "react";
import { Page, Box, Text, Button, Icon, Header, useSnackbar } from "zmp-ui";
import { useLocation, useNavigate } from "react-router-dom";
import { useAtomValue } from "jotai";
import CompanyFooter from "@/components/company-footer";
import { shopsAtom, Device } from "@/state/atoms";
import { apiService } from "@/utils/api";
import { useTranslation } from "@/i18n";

const DeviceInfoPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { openSnackbar } = useSnackbar();
  const shops = useAtomValue(shopsAtom);
  const { t } = useTranslation();

  // Dữ liệu thiết bị được ScanPage truyền qua router state sau khi quét & parse QR;
  // dùng "|| {}" để tránh lỗi khi người dùng vào thẳng trang này không qua quét mã
  const { deviceData } = location.state || {};
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleActivate = async () => {
    if (!deviceData?.serial || !deviceData?.model) {
      openSnackbar({ type: "error", text: t("device.missingQrData"), duration: 3000 });
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await apiService.post<Device>("/devices", {
        serial: deviceData.serial,
        model: deviceData.model,
      });

      // Nếu Chủ cửa hàng đã có sẵn cửa hàng, liên kết thiết bị vừa tạo vào cửa hàng đầu tiên luôn
      if (shops.length > 0) {
        await apiService.put(`/devices/${created.id}/link/${shops[0].id}`);
      }

      openSnackbar({ type: "success", text: t("device.activateSuccess"), duration: 3000 });
      navigate("/dashboard");
    } catch (error: any) {
      openSnackbar({
        type: "error",
        text: `${t("device.activateFailed")} ${error.message || t("roleSelection.unknownReason")}`,
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Page className="flex flex-col bg-tingo-bg">
      <Header title={t("device.addTitle")} showBackIcon />

      <Box className="flex-1 p-6">
        <Box className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm space-y-6">
          <Box className="flex items-center justify-between pb-4 border-b border-gray-50 dark:border-gray-800">
            <Box className="flex items-center space-x-3">
              <Box className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center">
                <Icon icon="zi-notif-ring" className="text-orange-600" />
              </Box>
              <Box>
                <Text className="font-bold text-gray-800 dark:text-gray-100">{t("device.deviceName")}</Text>
                <Text size="xSmall" className="text-gray-400 dark:text-gray-500 font-medium">{deviceData?.model || "---"}</Text>
              </Box>
            </Box>
            <Box className="bg-orange-100 text-orange-600 px-2 py-1 rounded text-[10px] font-bold">{t("device.notConnected")}</Box>
          </Box>

          <Box className="grid grid-cols-2 gap-4">
            <Box>
              <Text size="xSmall" className="text-gray-400 dark:text-gray-500 font-medium mb-1">{t("device.serialNumber")}</Text>
              <Text className="font-bold text-gray-800 dark:text-gray-100">{deviceData?.serial || "---"}</Text>
            </Box>
            <Box>
              <Text size="xSmall" className="text-gray-400 dark:text-gray-500 font-medium mb-1">{t("device.condition")}</Text>
              <Box className="flex items-center space-x-1">
                <Box className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-500" />
                <Text className="font-bold text-gray-400 dark:text-gray-500">{t("device.offline")}</Text>
              </Box>
            </Box>
          </Box>

          <Box>
            <Text size="xSmall" className="text-gray-400 dark:text-gray-500 font-medium mb-1">{t("device.description")}</Text>
            <Text className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
              {t("device.descriptionText")}
            </Text>
          </Box>

          <Box className="pt-4">
            <Button
              fullWidth
              size="large"
              loading={isSubmitting}
              disabled={isSubmitting}
              className="bg-tingo-red text-white font-bold rounded-2xl"
              onClick={handleActivate}
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

export default DeviceInfoPage;
