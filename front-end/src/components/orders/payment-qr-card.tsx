/**
 * Thẻ thanh toán chuyển khoản của đơn: mã QR vẽ từ chuỗi VietQR, số tiền, nội dung chuyển khoản
 * (nút sao chép) và dòng chờ xác nhận. Việc dò trạng thái do trang cha đảm nhiệm.
 */
import React from "react";
import { Box, Text, Icon, useSnackbar } from "zmp-ui";
import { QRCodeSVG } from "qrcode.react";
import { Order } from "@/state/atoms";
import SectionCard from "@/components/ui/section-card";
import { useTranslation } from "@/i18n";

const formatMoney = (amount: number) => `${Number(amount).toLocaleString("vi-VN")}đ`;

const PaymentQrCard: React.FC<{ order: Order }> = ({ order }) => {
  const { openSnackbar } = useSnackbar();
  const { t } = useTranslation();

  const copyContent = async () => {
    try {
      await navigator.clipboard.writeText(order.code);
      openSnackbar({ type: "success", text: t("orders.copyContentSuccess"), duration: 1500 });
    } catch {
      openSnackbar({ type: "warning", text: `${t("orders.contentLabel")}: ${order.code}`, duration: 4000 });
    }
  };

  return (
    <SectionCard title={t("orders.bankTransferTitle")}>
      <Box className="flex flex-col items-center">
        {order.paymentQr ? (
          <Box className="bg-white dark:bg-gray-800 p-3 rounded-2xl border border-gray-100 dark:border-gray-700">
            <QRCodeSVG value={order.paymentQr} size={200} level="M" includeMargin={false} />
          </Box>
        ) : (
          <Text size="small" className="text-red-500">{t("orders.noQrYet")}</Text>
        )}
        <Text className="font-bold text-tingo-red text-xl mt-3">{formatMoney(order.payAmount)}</Text>
        <Box className="flex items-center space-x-2 mt-1" onClick={copyContent}>
          <Text size="small" className="text-gray-500 dark:text-gray-400">{t("orders.contentLabel")}: <b className="text-gray-800 dark:text-gray-100">{order.code}</b></Text>
          <Icon icon="zi-copy" size={16} className="text-tingo-blue" />
        </Box>
        <Text size="xSmall" className="text-gray-400 dark:text-gray-500 mt-3 text-center">
          {t("orders.scanInstruction")}
        </Text>
        <Text size="xSmall" className="text-amber-600 mt-1">{t("orders.waitingText")}</Text>
      </Box>
    </SectionCard>
  );
};

export default PaymentQrCard;
