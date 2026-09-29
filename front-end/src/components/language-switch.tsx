/**
 * Công tắc chuyển ngôn ngữ VI/EN dạng viên thuốc nhỏ gọn — dùng lại ở nhiều nơi (màn Chào mừng,
 * Chọn vai trò trước khi đăng nhập, và trong Cài đặt) để người xem demo đổi ngôn ngữ được ngay
 * từ màn hình đầu tiên, không phải đăng nhập xong mới vào được Cài đặt.
 */
import React from "react";
import { Box, Text } from "zmp-ui";
import { useAtomValue, useSetAtom } from "jotai";
import { languageAtom, Language } from "@/i18n";
import { saveLanguage } from "@/utils/language-preference";

interface LanguageSwitchProps {
  className?: string;
}

const LanguageSwitch: React.FC<LanguageSwitchProps> = ({ className = "" }) => {
  const language = useAtomValue(languageAtom);
  const setLanguage = useSetAtom(languageAtom);

  const handleChange = (lang: Language) => {
    setLanguage(lang);
    saveLanguage(lang);
  };

  return (
    <Box className={`flex bg-gray-100 dark:bg-gray-700 rounded-full p-1 shrink-0 ${className}`}>
      <Box
        className={`px-3 py-1 rounded-full cursor-pointer transition-colors ${language === "vi" ? "bg-tingo-red text-white" : "text-gray-500 dark:text-gray-300"}`}
        onClick={() => handleChange("vi")}
      >
        <Text size="small" className="font-bold">VI</Text>
      </Box>
      <Box
        className={`px-3 py-1 rounded-full cursor-pointer transition-colors ${language === "en" ? "bg-tingo-red text-white" : "text-gray-500 dark:text-gray-300"}`}
        onClick={() => handleChange("en")}
      >
        <Text size="small" className="font-bold">EN</Text>
      </Box>
    </Box>
  );
};

export default LanguageSwitch;
