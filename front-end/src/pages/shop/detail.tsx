/**
 * Trang Chi tiết cửa hàng — route `/shop/:id`.
 * Thông tin cửa hàng lấy từ danh sách đã tải ở Dashboard (không gọi thêm API) và các lối tắt
 * tới quản lý nhân viên, tài khoản ngân hàng, thiết bị của cửa hàng.
 */
import React from "react";
import { Page, Box, Text, Icon, Header } from "zmp-ui";
import { useParams, useNavigate } from "react-router-dom";
import { useAtomValue } from "jotai";
import { shopsAtom, devicesAtom, userRoleAtom } from "@/state/atoms";
import SectionCard from "@/components/ui/section-card";
import EmptyState from "@/components/ui/empty-state";
import Pressable from "@/components/ui/pressable";
import { useTranslation } from "@/i18n";

const ShopDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const shops = useAtomValue(shopsAtom);
  const devices = useAtomValue(devicesAtom);
  const role = useAtomValue(userRoleAtom);
  const shop = shops.find((s) => s.id === id);
  const { t } = useTranslation();

  if (!shop) {
    return (
      <Page className="bg-tingo-bg">
        <Header title={t("shop.genericTitle")} showBackIcon />
        <Box className="pt-16">
          <EmptyState
            icon="🏬"
            title={t("shop.notFound")}
            description={t("shop.notFoundDesc")}
            actionLabel={t("shop.backHome")}
            onAction={() => navigate("/dashboard", { replace: true })}
          />
        </Box>
      </Page>
    );
  }

  const shopDevices = devices.filter((d) => d.shopName === shop.name);
  const links = [
    ...(role === "SHOP_OWNER" ? [{ label: t("shop.manageStaff"), icon: "zi-group-solid", to: "/staff" }] : []),
    { label: t("shop.bankAccountLink"), icon: "zi-user-solid", to: "/bank-account" },
    // Tab dưới của chủ cửa hàng đang chiếm chỗ "Nhân viên" nên không có tab Đơn hàng riêng — thêm lối tắt ở đây
    ...(role === "SHOP_OWNER" ? [{ label: t("shop.myOrders"), icon: "zi-note", to: "/orders" }] : []),
  ];

  return (
    <Page className="flex flex-col bg-tingo-bg pb-6">
      <Header title={shop.name} showBackIcon />
      <Box className="flex-1 px-4 pt-16 space-y-3 fade-in-up">
        <Box className="bg-gradient-to-br from-tingo-red to-[#b8321e] rounded-3xl p-5 text-white shadow-float">
          <Text className="font-bold text-xl">{shop.name}</Text>
          <Box className="flex items-center space-x-1.5 mt-1">
            <Icon icon="zi-location" size={16} className="text-white/85" />
            <Text size="small" className="text-white/85">{shop.address}</Text>
          </Box>
          <Text size="xSmall" className="text-white/70 mt-3">{t("shop.shopCode")}: {shop.code}</Text>
        </Box>

        <SectionCard title={`${t("shop.speakersLabel")} (${shopDevices.length})`}>
          {shopDevices.length === 0 ? (
            <Text size="small" className="text-gray-400 dark:text-gray-500">{t("shop.noSpeakersLinked")}</Text>
          ) : (
            shopDevices.map((d) => (
              <Pressable key={d.id} onClick={() => navigate(`/device/${d.id}`)} className="flex items-center justify-between py-2">
                <Text className="font-medium text-gray-700 dark:text-gray-200">{d.model}</Text>
                <Icon icon="zi-chevron-right" className="text-gray-300 dark:text-gray-600" size={18} />
              </Pressable>
            ))
          )}
        </SectionCard>

        <SectionCard>
          {links.map((l, i) => (
            <Pressable
              key={l.to}
              onClick={() => navigate(l.to)}
              className={`flex items-center justify-between py-3 ${i > 0 ? "border-t border-gray-50 dark:border-gray-800" : ""}`}
            >
              <Box className="flex items-center space-x-3">
                <Icon icon={l.icon as any} className="text-tingo-blue" size={20} />
                <Text className="font-medium text-gray-700 dark:text-gray-200">{l.label}</Text>
              </Box>
              <Icon icon="zi-chevron-right" className="text-gray-300 dark:text-gray-600" size={18} />
            </Pressable>
          ))}
        </SectionCard>
      </Box>
    </Page>
  );
};

export default ShopDetailPage;
