/**
 * Component hiển thị 1 dòng giao dịch trong danh sách lịch sử giao dịch.
 * Hiển thị icon tiền vào/ra, nội dung, thời gian, số tiền (kèm dấu +/-) và trạng thái giao dịch.
 */
import React from "react";
import { Box, Text, Icon } from "zmp-ui";
import { Transaction } from "@/state/atoms";
import { useTranslation } from "@/i18n";

interface TransactionItemProps {
  transaction: Transaction;
}

// Class màu tương ứng với từng trạng thái giao dịch (dùng để tô màu badge trạng thái)
const STATUS_CLASS: Record<Transaction["status"], string> = {
  SUCCESS: "text-green-600 bg-green-50",
  PENDING: "text-amber-600 bg-amber-50",
  FAILED: "text-red-600 bg-red-50",
};

// Định dạng ngày giờ ISO sang dd/mm/yyyy hh:mm theo chuẩn Việt Nam; nếu parse lỗi thì trả nguyên chuỗi gốc
const formatTime = (isoTime: string) => {
  const date = new Date(isoTime);
  if (Number.isNaN(date.getTime())) return isoTime;
  return date.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

// Định dạng số tiền kèm dấu +/- tùy theo loại giao dịch (CREDIT = tiền vào, còn lại = tiền ra)
const formatAmount = (amount: number, type: Transaction["type"]) => {
  const formatted = amount.toLocaleString("vi-VN");
  return `${type === "CREDIT" ? "+" : "-"}${formatted}đ`;
};

const TransactionItem: React.FC<TransactionItemProps> = ({ transaction }) => {
  const { t } = useTranslation();
  const STATUS_LABEL: Record<Transaction["status"], string> = {
    SUCCESS: t("transactions.statusSuccess"),
    PENDING: t("transactions.statusPending"),
    FAILED: t("transactions.statusFailed"),
  };
  // CREDIT = giao dịch nhận tiền (tiền vào), ngược lại là tiền ra -> dùng để đổi icon/màu sắc
  const isCredit = transaction.type === "CREDIT";

  return (
    <Box className="fade-in-up bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-card flex items-center space-x-3">
      <Box
        className={`w-10 h-10 rounded-full flex items-center justify-center ${
          isCredit ? "bg-green-50" : "bg-red-50"
        }`}
      >
        <Icon
          icon={isCredit ? "zi-arrow-down" : "zi-arrow-up"}
          className={isCredit ? "text-green-600" : "text-red-600"}
        />
      </Box>

      <Box className="flex-1 min-w-0">
        <Text className="font-bold text-gray-800 dark:text-gray-100 truncate">{transaction.content}</Text>
        <Text size="xSmall" className="text-gray-400 dark:text-gray-500 mt-0.5">
          {formatTime(transaction.time)}
        </Text>
      </Box>

      <Box className="flex flex-col items-end space-y-1">
        <Text className={`font-bold ${isCredit ? "text-green-600" : "text-red-600"}`}>
          {formatAmount(transaction.amount, transaction.type)}
        </Text>
        <Text
          size="xSmall"
          className={`px-2 py-0.5 rounded-full font-medium ${STATUS_CLASS[transaction.status]}`}
        >
          {STATUS_LABEL[transaction.status]}
        </Text>
      </Box>
    </Box>
  );
};

export default TransactionItem;
