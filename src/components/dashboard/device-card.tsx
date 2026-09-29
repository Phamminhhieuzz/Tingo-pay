/**
 * DeviceCard — Thẻ hiển thị thông tin ngắn gọn của một thiết bị loa thanh toán
 * (model, cửa hàng đang gắn, trạng thái online/offline). Dùng trong danh sách
 * thiết bị ở trang Dashboard. Props chính: `device` (Device — dữ liệu thiết bị).
 */
import React from "react";
import { Box, Text, Icon } from "zmp-ui";
import { useNavigate } from "react-router-dom";
import { Device } from "@/state/atoms";
import Pressable from "@/components/ui/pressable";
import StatusChip from "@/components/ui/status-chip";
import { useTranslation } from "@/i18n";

interface DeviceCardProps {
  device: Device;
}

const DeviceCard: React.FC<DeviceCardProps> = ({ device }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  // Chỉ coi là "đang hoạt động" khi trạng thái vận hành của thiết bị là ONLINE
  const isOnline = device.opStatus === "ONLINE";
  return (
    <Pressable
      onClick={() => navigate(`/device/${device.id}`)}
      className="fade-in-up bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-card flex flex-col items-center text-center"
    >
      <Box className={`p-3 rounded-full mb-3 ${isOnline ? "bg-red-50 text-tingo-red" : "bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500"}`}>
        <Icon icon="zi-notif-ring" size={24} />
      </Box>
      <Text className="font-bold text-gray-800 dark:text-gray-100 text-sm leading-tight mb-1">{device.model}</Text>
      <Text size="xSmall" className="text-gray-400 dark:text-gray-500 mb-2 truncate max-w-full">{device.shopName || t("device.noShopAttached")}</Text>
      <StatusChip tone={isOnline ? "success" : "neutral"}>{isOnline ? t("device.online") : t("device.offline")}</StatusChip>
    </Pressable>
  );
};

export default DeviceCard;
