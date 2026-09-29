/**
 * Trang Hướng dẫn sử dụng — route `/guide`.
 * Trang tĩnh liệt kê các bước sử dụng nhanh 4 chức năng chính của app
 * (mua loa, theo dõi đơn, kích hoạt loa, xem giao dịch) để hỗ trợ người dùng mới.
 */
import React from "react";
import { Page, Box, Text, Header } from "zmp-ui";
import { useTranslation } from "@/i18n";

interface GuideStep {
  emoji: string;
  title: string;
  description: string;
}

const GuidePage: React.FC = () => {
  const { t } = useTranslation();

  const steps: GuideStep[] = [
    { emoji: "🛒", title: t("guide.step1Title"), description: t("guide.step1Desc") },
    { emoji: "📦", title: t("guide.step2Title"), description: t("guide.step2Desc") },
    { emoji: "📷", title: t("guide.step3Title"), description: t("guide.step3Desc") },
    { emoji: "🕐", title: t("guide.step4Title"), description: t("guide.step4Desc") },
  ];

  return (
    <Page className="flex flex-col bg-tingo-bg">
      <Header title={t("guide.title")} showBackIcon />

      <Box className="flex-1 px-4 pt-16 pb-6 space-y-3">
        {steps.map((step, index) => (
          <Box key={index} className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm flex space-x-3">
            <Box className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center shrink-0">
              <Text className="text-xl leading-none">{step.emoji}</Text>
            </Box>
            <Box className="flex-1">
              <Text className="font-bold text-gray-800 dark:text-gray-100 mb-1">{step.title}</Text>
              <Text size="small" className="text-gray-500 dark:text-gray-400 leading-relaxed">{step.description}</Text>
            </Box>
          </Box>
        ))}
      </Box>
    </Page>
  );
};

export default GuidePage;
