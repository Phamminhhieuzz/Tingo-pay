/**
 * Hai thẻ chọn phương thức thanh toán khi đặt hàng: chuyển khoản QR (tự xác nhận) hoặc COD.
 */
import React from "react";
import { Box, Text } from "zmp-ui";
import { PaymentMethod } from "@/state/atoms";
import Pressable from "@/components/ui/pressable";
import { useTranslation } from "@/i18n";

interface Props {
  value: PaymentMethod;
  onChange: (method: PaymentMethod) => void;
}

const PaymentMethodPicker: React.FC<Props> = ({ value, onChange }) => {
  const { t } = useTranslation();
  const OPTIONS: { id: PaymentMethod; icon: string; title: string; desc: string }[] = [
    { id: "BANK_QR", icon: "📱", title: t("product.bankQr"), desc: t("product.bankQrDesc") },
    { id: "COD", icon: "💵", title: t("product.cod"), desc: t("product.codDesc") },
  ];
  return (
  <Box className="space-y-2">
    {OPTIONS.map((opt) => {
      const selected = value === opt.id;
      return (
        <Pressable
          key={opt.id}
          onClick={() => onChange(opt.id)}
          className={`p-3 rounded-2xl flex items-center space-x-3 border-2 ${
            selected ? "border-tingo-red bg-red-50" : "border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800"
          }`}
        >
          <Text className="text-2xl">{opt.icon}</Text>
          <Box className="flex-1">
            <Text className={`font-bold ${selected ? "text-red-700" : "text-gray-800 dark:text-gray-100"}`}>{opt.title}</Text>
            <Text size="xSmall" className="text-gray-500 dark:text-gray-400">{opt.desc}</Text>
          </Box>
          <Box
            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
              selected ? "border-tingo-red" : "border-gray-300 dark:border-gray-600"
            }`}
          >
            {selected && <Box className="w-2.5 h-2.5 rounded-full bg-tingo-red" />}
          </Box>
        </Pressable>
      );
    })}
  </Box>
  );
};

export default PaymentMethodPicker;
