/**
 * BottomNav — Thanh điều hướng cố định ở đáy màn hình cho các trang chính.
 * Bộ tab đổi theo vai trò: khách mua sắm, chủ/thành viên cửa hàng, nhân viên Tingo xử lý đơn.
 */
import React from "react";
import { Box, Icon, Text } from "zmp-ui";
import { useNavigate, useLocation } from "react-router-dom";
import { UserRole } from "@/state/atoms";
import { useTranslation } from "@/i18n";
import iconScanQr from "@/static/icon-scan-qr.png";

interface BottomNavProps {
  role: UserRole;
}

interface Tab {
  id: string;
  label: string;
  icon: string;
  path: string;
  isSpecial?: boolean;
}

const getTabs = (role: UserRole, t: (key: string) => string): Tab[] => {
  if (role === "STAFF") {
    return [
      { id: "staff-orders", label: t("bottomNav.staffOrders"), icon: "zi-note", path: "/staff/orders" },
      { id: "staff-devices", label: t("bottomNav.staffDevices"), icon: "zi-warning-solid", path: "/staff/device-issues" },
      { id: "settings", label: t("bottomNav.settings"), icon: "zi-setting", path: "/settings" },
    ];
  }
  if (role === "GUEST" || role === "CUSTOMER") {
    return [
      { id: "shops", label: t("bottomNav.shopping"), icon: "zi-home", path: "/dashboard" },
      { id: "transactions", label: t("bottomNav.history"), icon: "zi-clock-2", path: "/transactions" },
      { id: "qr", label: t("bottomNav.scanQr"), icon: "zi-scan", path: "/qr/scan", isSpecial: true },
      { id: "orders", label: t("bottomNav.orders"), icon: "zi-note", path: "/orders" },
      { id: "settings", label: t("bottomNav.settings"), icon: "zi-setting", path: "/settings" },
    ];
  }
  return [
    { id: "shops", label: t("bottomNav.shops"), icon: "zi-home", path: "/dashboard" },
    { id: "transactions", label: t("bottomNav.transactions"), icon: "zi-clock-2", path: "/transactions" },
    { id: "qr", label: t("bottomNav.scanQr"), icon: "zi-scan", path: "/qr/scan", isSpecial: true },
    role === "SHOP_OWNER"
      ? { id: "staff", label: t("bottomNav.staff"), icon: "zi-group", path: "/staff" }
      : { id: "orders", label: t("bottomNav.orders"), icon: "zi-note", path: "/orders" },
    { id: "settings", label: t("bottomNav.settings"), icon: "zi-setting", path: "/settings" },
  ];
};

// Tab đang active: khớp theo tiền tố đường dẫn, trừ /staff phải khớp chính xác để không nuốt /staff/orders
const isActive = (tab: Tab, pathname: string) => {
  if (tab.id === "staff-orders") return pathname.startsWith("/staff/orders");
  if (tab.id === "staff") return pathname === "/staff";
  if (tab.id === "shops") return pathname === "/dashboard" || pathname.startsWith("/shop/");
  if (tab.path === "/orders") return pathname.startsWith("/orders");
  return pathname === tab.path;
};

const BottomNav: React.FC<BottomNavProps> = ({ role }) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { t } = useTranslation();
  const tabs = getTabs(role, t);

  return (
    <Box className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 flex items-center justify-around px-2 pb-6 pt-2 z-50 rounded-t-[30px] shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
      {tabs.map((tab) => {
        const active = isActive(tab, pathname);
        return (
          <Box
            key={tab.id}
            onClick={() => navigate(tab.path)}
            className={`flex flex-col items-center space-y-1 relative transition-transform duration-150 active:scale-95 ${tab.isSpecial ? "-mt-10" : ""}`}
          >
            {tab.isSpecial ? (
              <Box className="bg-tingo-red p-1 rounded-full shadow-float border-4 border-white">
                <img src={iconScanQr} alt="Scan QR" className="w-14 h-14 rounded-full" />
              </Box>
            ) : (
              <>
                <Icon icon={tab.icon as any} size={24} className={active ? "text-tingo-red" : "text-gray-400 dark:text-gray-500"} />
                <Text size="xSmall" className={`text-[10px] uppercase font-bold tracking-tight ${active ? "text-tingo-red" : "text-gray-400 dark:text-gray-500"}`}>
                  {tab.label}
                </Text>
                {active && <Box className="absolute -bottom-2 w-1 h-1 bg-tingo-red rounded-full" />}
              </>
            )}
          </Box>
        );
      })}
    </Box>
  );
};

export default BottomNav;
