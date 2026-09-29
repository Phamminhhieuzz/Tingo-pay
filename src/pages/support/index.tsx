/**
 * Trang Hỗ trợ — route `/support`. Gộp 2 kênh liên hệ trực tiếp (chat Zalo, gọi hotline) với
 * danh sách câu hỏi thường gặp (FAQ) xổ ra khi bấm, để khách tự tra cứu trước khi cần chat/gọi.
 * Trước đây "H.Trợ" ở header chỉ mở thẳng khung chat, không có nơi tự tra cứu — trang này thay thế.
 */
import React, { useState } from "react";
import { Page, Box, Text, Header, Icon } from "zmp-ui";
import { useNavigate } from "react-router-dom";
import { openChat, openPhone } from "zmp-sdk/apis";
import { SUPPORT_HOTLINE } from "@/utils/constants";
import SectionCard from "@/components/ui/section-card";
import { useTranslation } from "@/i18n";

interface FaqItem {
  question: string;
  answer: string;
}

// Mở khung chat Zalo với hotline hỗ trợ; log lỗi ra console thay vì chặn UI nếu SDK lỗi
const handleChat = () => {
  openChat({ type: "user", id: SUPPORT_HOTLINE }).catch((err) => console.error("Support chat error:", err));
};

// Gọi điện trực tiếp tới hotline hỗ trợ qua zmp-sdk
const handleCall = () => {
  openPhone({ phoneNumber: SUPPORT_HOTLINE }).catch((err) => console.error("Call error:", err));
};

const FaqAccordion: React.FC<{ item: FaqItem }> = ({ item }) => {
  const [open, setOpen] = useState(false);
  return (
    <Box className="border-b border-gray-50 dark:border-gray-700 last:border-0 py-3">
      <Box className="flex items-center justify-between cursor-pointer" onClick={() => setOpen((v) => !v)}>
        <Text className="flex-1 font-medium text-gray-700 dark:text-gray-200 pr-3">{item.question}</Text>
        <Icon
          icon="zi-chevron-down"
          size={18}
          className={`text-gray-400 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </Box>
      {open && (
        <Text size="small" className="text-gray-500 dark:text-gray-400 mt-2 leading-relaxed fade-in-up">
          {item.answer}
        </Text>
      )}
    </Box>
  );
};

const SupportPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const faqs: FaqItem[] = [
    { question: t("support.faq1Q"), answer: t("support.faq1A") },
    { question: t("support.faq2Q"), answer: t("support.faq2A") },
    { question: t("support.faq3Q"), answer: t("support.faq3A") },
    { question: t("support.faq4Q"), answer: t("support.faq4A") },
    { question: t("support.faq5Q"), answer: t("support.faq5A") },
  ];

  return (
    <Page className="flex flex-col bg-tingo-bg">
      <Header title={t("support.title")} showBackIcon />

      <Box className="flex-1 px-4 pt-16 pb-6 space-y-3 fade-in-up">
        {/* 2 kênh liên hệ trực tiếp, đặt lên đầu vì đây là mục đích chính khi khách vào trang này */}
        <Box className="grid grid-cols-2 gap-3">
          <ContactButton icon="zi-chat" label={t("support.chat")} onClick={handleChat} />
          <ContactButton icon="zi-call" label={t("support.call")} onClick={handleCall} />
        </Box>

        <SectionCard title={t("support.faqTitle")}>
          {faqs.map((item) => (
            <FaqAccordion key={item.question} item={item} />
          ))}
        </SectionCard>

        <SectionCard>
          <Box className="flex items-center justify-between py-1 cursor-pointer" onClick={() => navigate("/guide")}>
            <Text className="text-gray-700 dark:text-gray-200 font-medium">{t("support.viewGuide")}</Text>
            <Icon icon="zi-chevron-right" size={18} className="text-gray-300 dark:text-gray-600" />
          </Box>
        </SectionCard>
      </Box>
    </Page>
  );
};

// Nút liên hệ nhanh dạng thẻ vuông, dùng chung layout cho Chat và Gọi hotline
const ContactButton = ({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) => (
  <Box
    className="bg-white dark:bg-gray-800 rounded-2xl shadow-card p-4 flex flex-col items-center space-y-2 active:scale-95 transition-transform duration-150 cursor-pointer"
    onClick={onClick}
  >
    <Box className="w-11 h-11 bg-red-50 rounded-full flex items-center justify-center">
      <Icon icon={icon as any} className="text-tingo-red" size={22} />
    </Box>
    <Text size="small" className="font-medium text-gray-700 dark:text-gray-200">{label}</Text>
  </Box>
);

export default SupportPage;
