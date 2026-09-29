/**
 * DashboardHeader — Header cố định ở đầu trang Dashboard, hiển thị logo thương hiệu
 * và các phím tắt: Hướng dẫn, Hỗ trợ (chat Zalo), Liên hệ (gọi điện), Tài khoản.
 * Props chính: `role` (UserRole) — dùng để ẩn/hiện phím tắt "Tài khoản" với khách (GUEST).
 */
import React from "react";
import { Box, Text, Icon } from "zmp-ui";
import { useNavigate } from "react-router-dom";
import logo from "@/static/logo.png";
import { openPhone } from "zmp-sdk/apis";
import { UserRole } from "@/state/atoms";
import { SUPPORT_HOTLINE } from "@/utils/constants";
import { useTranslation } from "@/i18n";

interface HeaderProps {
  role: UserRole;
}

const DashboardHeader: React.FC<HeaderProps> = ({ role }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Gọi điện trực tiếp tới hotline hỗ trợ qua zmp-sdk
  const handleCall = () => {
    openPhone({
      phoneNumber: SUPPORT_HOTLINE,
    }).catch(err => console.error("Call error:", err));
  };

  return (
    <Box className="flex items-center justify-between px-4 py-3 bg-white/95 dark:bg-gray-800/95 backdrop-blur sticky top-0 z-50 shadow-card">
      <Box className="flex items-center space-x-2">
        <img src={logo} alt="Tingo Pay" className="h-8 w-8" />
        <Text className="font-brand font-bold text-tingo-red text-lg tracking-wide">Tingo Pay</Text>
      </Box>
      <Box className="flex space-x-5">
        <HeaderAction icon="zi-info-circle" label={t("header.guide")} onClick={() => navigate("/guide")} />
        {/* Trước đây mở thẳng khung chat — giờ sang trang /support để khách tự tra FAQ trước, có chat/gọi ngay trong đó */}
        <HeaderAction icon="zi-chat" label={t("header.support")} onClick={() => navigate("/support")} />
        <HeaderAction icon="zi-call" label={t("header.contact")} onClick={handleCall} />
        {/* Chỉ hiển thị phím tắt "Tài khoản" cho người dùng đã xác định vai trò (không phải khách vãng lai) */}
        {role !== "GUEST" && (
          <HeaderAction icon="zi-user-solid" label={t("header.account")} onClick={() => navigate("/settings")} />
        )}
      </Box>
    </Box>
  );
};

const HeaderAction = ({ icon, label, onClick }: { icon: string; label: string; onClick?: () => void }) => (
  <Box className="flex flex-col items-center cursor-pointer active:scale-90 transition-transform duration-150" onClick={onClick}>
    <Icon icon={icon as any} className="text-gray-600 dark:text-gray-300 mb-0.5" size={20} />
    <Text size="xSmall" className="text-gray-500 dark:text-gray-400 text-[10px]">{label}</Text>
  </Box>
);

export default DashboardHeader;
