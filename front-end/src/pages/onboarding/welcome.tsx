// src/pages/onboarding/welcome.tsx
/*
 * WelcomePage — Màn hình chào mừng, tương ứng route "/".
 * Đây là màn hình đầu tiên người dùng nhìn thấy khi mở Mini App:
 * giới thiệu ngắn gọn các tính năng nổi bật rồi dẫn sang bước
 * chọn vai trò & đăng nhập (/onboarding/role-selection).
 */
import React from "react";
import { Box, Button, Page, Text } from "zmp-ui";
import { useNavigate } from "react-router-dom";
import logo from "@/static/logo.png";
import { useTranslation } from "@/i18n";
import LanguageSwitch from "@/components/language-switch";

const WelcomePage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Danh sách tính năng nổi bật hiển thị dạng list minh hoạ, không lấy từ API
  const features = [
    {
      icon: "🔔",
      title: t("welcome.feature1Title"),
      description: t("welcome.feature1Desc"),
    },
    {
      icon: "📊",
      title: t("welcome.feature2Title"),
      description: t("welcome.feature2Desc"),
    },
    {
      icon: "🏦",
      title: t("welcome.feature3Title"),
      description: t("welcome.feature3Desc"),
    },
  ];

  return (
    <Page className="flex flex-col bg-white dark:bg-gray-800">
      {/* Hero Section */}
      <Box className="relative bg-tingo-red px-6 pt-16 pb-12 flex flex-col items-center rounded-b-[48px]">
        {/* Đặt ở góc trên-phải màn đầu tiên để người xem demo đổi ngôn ngữ được ngay, chưa cần đăng nhập */}
        <Box className="absolute top-4 right-4">
          <LanguageSwitch />
        </Box>
        <Box className="bg-white dark:bg-gray-800 p-3 rounded-2xl shadow-lg mb-6">
          <img src={logo} alt="Tingo Pay" className="w-16 h-16 rounded-xl" />
        </Box>
        <Text.Title size="xLarge" className="font-brand text-white font-bold text-center mb-2 tracking-wide">
          {t("welcome.title")}
        </Text.Title>
        <Text className="text-red-100 text-center text-sm leading-relaxed whitespace-pre-line">
          {t("welcome.heroTagline")}
        </Text>
      </Box>

      {/* Features List */}
      <Box className="fade-in-up flex-1 px-6 py-8 space-y-4">
        {features.map((feature, index) => (
          <Box
            key={index}
            className="flex items-start space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-2xl"
          >
            <Box className="text-2xl w-10 text-center">{feature.icon}</Box>
            <Box className="flex-1">
              <Text className="font-bold text-gray-800 dark:text-gray-100">{feature.title}</Text>
              <Text size="small" className="text-gray-500 dark:text-gray-400 mt-0.5">
                {feature.description}
              </Text>
            </Box>
          </Box>
        ))}
      </Box>

      {/* CTA Footer */}
      <Box className="px-6 pb-10 pt-4">
        <Button
          fullWidth
          size="large"
          className="bg-tingo-red text-white rounded-xl py-4 font-bold shadow-float"
          onClick={() => navigate("/onboarding/role-selection")}
        >
          {t("welcome.cta")}
        </Button>
        <Text size="xSmall" className="text-center text-gray-400 dark:text-gray-500 mt-4">
          {t("welcome.agreeToTerms")}{" "}
          <span className="underline" onClick={() => navigate("/legal/terms")}>{t("roleSelection.terms")}</span> {t("welcome.ourTerms")}
        </Text>
      </Box>
    </Page>
  );
};

export default WelcomePage;
