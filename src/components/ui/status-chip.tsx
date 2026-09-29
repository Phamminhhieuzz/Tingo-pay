/**
 * Nhãn trạng thái nhỏ có màu theo mức độ (dùng cho đơn hàng, thiết bị, báo lỗi).
 */
import React from "react";
import { Text } from "zmp-ui";

export type ChipTone = "neutral" | "info" | "warning" | "success" | "danger";

const TONE_CLASS: Record<ChipTone, string> = {
  neutral: "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300",
  info: "bg-blue-50 text-tingo-blue",
  warning: "bg-amber-50 text-amber-600",
  success: "bg-green-50 text-green-600",
  danger: "bg-red-50 text-red-600",
};

const StatusChip: React.FC<{ tone: ChipTone; children: React.ReactNode }> = ({ tone, children }) => (
  <Text size="xSmall" className={`inline-block px-2.5 py-0.5 rounded-full font-semibold ${TONE_CLASS[tone]}`}>
    {children}
  </Text>
);

export default StatusChip;
