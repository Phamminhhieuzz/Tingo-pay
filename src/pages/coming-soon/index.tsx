/**
 * Trang "Sắp ra mắt" — dùng chung cho các route trỏ tới tính năng chưa hoàn thiện.
 * Nội dung (tiêu đề, emoji, thông điệp) được truyền động qua router state từ nơi điều hướng tới,
 * cho phép tái sử dụng 1 trang cho nhiều tính năng đang phát triển khác nhau.
 */
import React from "react";
import { Page, Box, Text, Header } from "zmp-ui";
import { useLocation } from "react-router-dom";
import { useTranslation } from "@/i18n";

interface ComingSoonState {
  title?: string;
  emoji?: string;
  message?: string;
}

const ComingSoonPage: React.FC = () => {
  const location = useLocation();
  const { t } = useTranslation();
  // location.state có thể rỗng nếu người dùng vào thẳng route này (vd. reload trang),
  // nên luôn fallback về object rỗng rồi dùng giá trị mặc định khi render bên dưới
  const { title, emoji, message } = (location.state as ComingSoonState) || {};

  return (
    <Page className="flex flex-col bg-tingo-bg">
      <Header title={title || t("comingSoon.title")} showBackIcon />

      <Box className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <Text className="text-5xl mb-4">{emoji || "🚧"}</Text>
        <Text className="font-bold text-gray-700 dark:text-gray-200 mb-1">{t("comingSoon.description")}</Text>
        <Text size="small" className="text-gray-400 dark:text-gray-500">
          {message || t("comingSoon.footer")}
        </Text>
      </Box>
    </Page>
  );
};

export default ComingSoonPage;
