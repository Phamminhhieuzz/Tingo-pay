/**
 * Timeline dọc theo dõi đơn hàng: Đã đặt → Đang xử lý → Đang giao → Đã giao → Hoàn tất.
 * Backend chỉ lưu giờ đặt và giờ giao nên chỉ hai mốc đó có thời gian; đơn huỷ hiện banner riêng.
 */
import React from "react";
import { Box, Text, Icon } from "zmp-ui";
import { Order } from "@/state/atoms";
import { useTranslation } from "@/i18n";

interface OrderTimelineProps {
  status: Order["status"];
  orderTime: string;
  deliveryTime?: string;
}

const formatTime = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" });
};

const OrderTimeline: React.FC<OrderTimelineProps> = ({ status, orderTime, deliveryTime }) => {
  const { t } = useTranslation();
  const STEPS: { key: Order["status"]; title: string; hint: string }[] = [
    { key: "INIT", title: t("orders.statusInit"), hint: t("orders.timelineHintInit") },
    { key: "PROCESSING", title: t("orders.statusProcessing"), hint: t("orders.timelineHintProcessing") },
    { key: "SHIPPING", title: t("orders.statusShipping"), hint: t("orders.timelineHintShipping") },
    { key: "DELIVERED", title: t("orders.statusDelivered"), hint: t("orders.timelineHintDelivered") },
    { key: "COMPLETED", title: t("orders.statusCompleted"), hint: t("orders.timelineHintCompleted") },
  ];

  if (status === "CANCELLED") {
    return (
      <Box className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-center space-x-3">
        <Icon icon="zi-close-circle" className="text-red-500" size={24} />
        <Box>
          <Text className="font-bold text-red-600">{t("orders.cancelledTitle")}</Text>
          <Text size="xSmall" className="text-red-400">{t("orders.orderedAt")} {formatTime(orderTime)}</Text>
        </Box>
      </Box>
    );
  }

  const currentIndex = STEPS.findIndex((s) => s.key === status);
  const timeFor = (key: Order["status"]) =>
    key === "INIT" ? formatTime(orderTime) : key === "DELIVERED" ? formatTime(deliveryTime) : "";

  return (
    <Box>
      {STEPS.map((step, index) => {
        const done = index <= currentIndex;
        const current = index === currentIndex;
        const isLast = index === STEPS.length - 1;
        const time = done ? timeFor(step.key) : "";
        return (
          <Box key={step.key} className="flex">
            <Box className="flex flex-col items-center mr-3">
              <Box
                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                  done ? "bg-tingo-red" : "bg-gray-200 dark:bg-gray-600"
                } ${current ? "ring-4 ring-red-100" : ""}`}
              >
                {done && <Icon icon="zi-check" size={14} className="text-white" />}
              </Box>
              {!isLast && (
                <Box className={`w-0.5 flex-1 min-h-[28px] ${index < currentIndex ? "bg-tingo-red" : "bg-gray-200 dark:bg-gray-600"}`} />
              )}
            </Box>
            <Box className={`flex-1 ${isLast ? "" : "pb-4"}`}>
              <Box className="flex justify-between items-start">
                <Text className={`font-bold ${done ? "text-gray-800 dark:text-gray-100" : "text-gray-400 dark:text-gray-500"}`}>{step.title}</Text>
                {time && <Text size="xSmall" className="text-gray-400 dark:text-gray-500">{time}</Text>}
              </Box>
              {current && <Text size="xSmall" className="text-gray-500 dark:text-gray-400 mt-0.5">{step.hint}</Text>}
            </Box>
          </Box>
        );
      })}
    </Box>
  );
};

export default OrderTimeline;
