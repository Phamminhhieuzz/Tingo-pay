/**
 * Trang Điều khoản dịch vụ / Chính sách bảo mật — dùng chung 1 component cho 2 route
 * (`/legal/terms`, `/legal/privacy`), phân biệt qua param `:type`. Bắt buộc phải có nội dung
 * thật (không phải "sắp ra mắt") vì Zalo yêu cầu khai báo 2 trang này khi gửi duyệt Mini App.
 */
import React from "react";
import { Page, Box, Text, Header } from "zmp-ui";
import { useParams } from "react-router-dom";
import CompanyFooter from "@/components/company-footer";
import { useTranslation } from "@/i18n";

const LegalPage: React.FC = () => {
  const { type } = useParams<{ type: "terms" | "privacy" }>();
  const isPrivacy = type === "privacy";
  const { t } = useTranslation();

  const sections = isPrivacy
    ? [1, 2, 3, 4].map((n) => ({
        title: t(`legal.privacySection${n}Title`),
        body: t(`legal.privacySection${n}Body`),
      }))
    : [1, 2, 3, 4, 5].map((n) => ({
        title: t(`legal.termsSection${n}Title`),
        body: t(`legal.termsSection${n}Body`),
      }));

  return (
    <Page className="flex flex-col bg-tingo-bg">
      <Header title={isPrivacy ? t("legal.privacyTitle") : t("legal.termsTitle")} showBackIcon />
      <Box className="flex-1 px-4 pt-16 pb-6">
        {sections.map((section) => (
          <React.Fragment key={section.title}>
            <Text className="font-bold text-gray-800 dark:text-gray-100 mb-2">{section.title}</Text>
            <Text size="small" className="text-gray-600 dark:text-gray-300 mb-4">{section.body}</Text>
          </React.Fragment>
        ))}
      </Box>
      <CompanyFooter />
    </Page>
  );
};

export default LegalPage;
