/**
 * QuickAccess — Lưới phím tắt thao tác nhanh trên trang Dashboard (ví dụ: Thiết bị loa,
 * Ưu đãi, Giỏ hàng, Trợ giúp...). Bộ phím tắt hiển thị khác nhau tùy vai trò người dùng.
 * Props chính: `role` (UserRole).
 */
import React from "react";
import { Box, Text, Icon } from "zmp-ui";
import { useNavigate } from "react-router-dom";
import { UserRole } from "@/state/atoms";
import { useTranslation } from "@/i18n";

interface QuickAccessProps {
  role: UserRole;
}

// Cuộn mượt tới 1 khu vực trên cùng trang Dashboard theo id section
const scrollToSection = (id: string) => () => {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
};

const QuickAccess: React.FC<QuickAccessProps> = ({ role }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  // GUEST/CUSTOMER: các phím tắt hướng tới mua sắm (thiết bị, ưu đãi, giỏ hàng, trợ giúp)
  // Các vai trò còn lại (chủ/nhân viên cửa hàng): phím tắt hướng tới quản lý cửa hàng
  const actions = (role === "GUEST" || role === "CUSTOMER")
    ? [
        { label: t("quickAccess.devices"), icon: "zi-notif-ring", color: "bg-orange-50 text-orange-600", onClick: scrollToSection("shop-section") },
        { label: t("quickAccess.promotions"), icon: "zi-star-solid", color: "bg-red-50 text-red-600", onClick: () => navigate("/promotions", { state: { title: t("quickAccess.promotions"), emoji: "🎁" } }) },
        { label: t("quickAccess.cart"), icon: "zi-list-2", color: "bg-blue-50 text-blue-600", onClick: () => navigate("/cart", { state: { title: t("quickAccess.cart"), emoji: "🛒" } }) },
        { label: t("quickAccess.help"), icon: "zi-help-circle", color: "bg-green-50 text-green-600", onClick: () => navigate("/support") },
      ]
    : [
        // Chỉ chủ cửa hàng (SHOP_OWNER) mới thấy phím tắt "Nhân viên" để quản lý nhân sự
        ...(role === "SHOP_OWNER" ? [{ label: t("quickAccess.staff"), icon: "zi-group-solid", color: "bg-blue-50 text-blue-600", onClick: () => navigate("/staff") }] : []),
        { label: t("quickAccess.speaker"), icon: "zi-notif-ring", color: "bg-orange-50 text-orange-600", onClick: scrollToSection("device-section") },
        { label: t("quickAccess.account"), icon: "zi-user-solid", color: "bg-purple-50 text-purple-600", onClick: () => navigate("/bank-account") },
        { label: t("quickAccess.cart"), icon: "zi-list-2", color: "bg-red-50 text-red-600", onClick: () => navigate("/cart", { state: { title: t("quickAccess.cart"), emoji: "🛒" } }) },
      ];

  const gridCols = "grid-cols-4 px-4";

  return (
    <Box className={`grid ${gridCols} gap-4 py-6 bg-white dark:bg-gray-800`}>
      {actions.map((action, index) => (
        <Box key={index} className="flex flex-col items-center" onClick={action.onClick}>
          <Box className={`${action.color} p-4 rounded-2xl mb-2 flex items-center justify-center shadow-sm`}>
            <Icon icon={action.icon as any} size={24} />
          </Box>
          <Text size="xSmall" className="text-gray-700 dark:text-gray-200 text-center font-medium leading-tight">
            {action.label}
          </Text>
        </Box>
      ))}
    </Box>
  );
};

export default QuickAccess;
