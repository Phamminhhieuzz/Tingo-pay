/**
 * CompanyFooter — Footer hiển thị thông tin pháp lý của công ty chủ quản
 * (tên công ty, mã số thuế, địa chỉ). Thường đặt ở cuối các trang giới thiệu/nội dung dài.
 * Không nhận props.
 */
import React from "react";
import { Box, Text } from "zmp-ui";
import { useTranslation } from "@/i18n";

// Tên công ty và số liệu (mã số thuế, địa chỉ) là dữ liệu pháp lý cố định — không dịch,
// chỉ dịch 2 nhãn "Mã số thuế"/"Địa chỉ" đứng trước
const CompanyFooter: React.FC = () => {
  const { t } = useTranslation();
  return (
    <Box className="px-4 py-8 mt-auto border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
      <Box className="space-y-2">
        <Text className="font-bold text-gray-800 dark:text-gray-100 text-xs">CÔNG TY CỔ PHẦN BLUECOM VIỆT NAM (BLUECOM)</Text>
        <Box className="flex flex-col space-y-0.5">
          <Text className="text-gray-500 dark:text-gray-400 text-[10px]">
            <span className="font-medium">{t("footer.taxCode")}:</span> 0105022466
          </Text>
          <Text className="text-gray-500 dark:text-gray-400 text-[10px]">
            <span className="font-medium">{t("footer.address")}:</span> Tòa D, Sunshine Iconic, Phúc Đồng, Long Biên, HN
          </Text>
        </Box>
      </Box>
    </Box>
  );
};

export default CompanyFooter;
