/**
 * Công tắc chuyển sáng/tối dạng icon tròn nhỏ gọn — dùng lại ở nhiều nơi (màn Chào mừng,
 * Chọn vai trò trước khi đăng nhập, và trong Cài đặt) để người dùng đổi giao diện được
 * ngay từ lúc bước chân vào app, không phải đăng nhập xong mới vào được Cài đặt.
 */
import React from "react";
import { Box, useTheme } from "zmp-ui";
import { saveThemeMode } from "@/utils/theme-preference";

interface ThemeSwitchProps {
  className?: string;
}

const ThemeSwitch: React.FC<ThemeSwitchProps> = ({ className = "" }) => {
  const [themeMode, setThemeMode] = useTheme();
  const isDark = themeMode === "dark";

  const handleToggle = () => {
    const mode = isDark ? "light" : "dark";
    setThemeMode({ mode });
    saveThemeMode(mode);
  };

  return (
    <Box
      className={`w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 cursor-pointer shrink-0 text-base ${className}`}
      onClick={handleToggle}
    >
      {isDark ? "☀️" : "🌙"}
    </Box>
  );
};

export default ThemeSwitch;
