/*
 * DashboardPage — Trang chủ Dashboard, route "/dashboard".
 * Đây là màn hình chính sau khi đăng nhập/chọn vai trò: hiển thị các khu vực
 * Cửa hàng, Thiết bị loa và Sản phẩm bán lẻ, nội dung được phân quyền hiển thị
 * theo vai trò hiện tại (SHOP_OWNER / SHOP_MEMBER / CUSTOMER / GUEST).
 */
import React from "react";
import { Box, Page, Text, Button, Icon } from "zmp-ui";
import { useNavigate } from "react-router-dom";
import { useAtomValue } from "jotai";
import {
  userRoleAtom,
  currentUserAtom,
  shopsAtom,
  devicesAtom,
  productsAtom,
  isLoadingShopsAtom,
  isLoadingDevicesAtom,
  isLoadingProductsAtom
} from "@/state/atoms";
import { useDashboardData } from "@/hooks/use-dashboard";
import DashboardHeader from "@/components/dashboard/header";
import QuickAccess from "@/components/dashboard/quick-access";
import ShopCard from "@/components/dashboard/shop-card";
import DeviceCard from "@/components/dashboard/device-card";
import ProductCarousel from "@/components/dashboard/product-carousel";
import BottomNav from "@/components/bottom-nav";
import { SkeletonList } from "@/components/ui/skeleton";
import EmptyState from "@/components/ui/empty-state";
import { useTranslation } from "@/i18n";

import ErrorBoundary from "@/components/error-boundary";

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  // Mặc định về GUEST nếu chưa xác định vai trò, để tránh hiển thị nhầm
  // các khu vực chỉ dành cho tài khoản đã đăng nhập/phân quyền
  const role = useAtomValue(userRoleAtom) || "GUEST";
  const currentUser = useAtomValue(currentUserAtom);
  const shops = useAtomValue(shopsAtom);
  const devices = useAtomValue(devicesAtom);
  const products = useAtomValue(productsAtom);
  
  const loadingShops = useAtomValue(isLoadingShopsAtom);
  const loadingDevices = useAtomValue(isLoadingDevicesAtom);
  const loadingProducts = useAtomValue(isLoadingProductsAtom);

  const { fetchShops, fetchDevices, fetchProducts } = useDashboardData();

  return (
    <Page className="flex flex-col bg-tingo-bg pb-24">
      <DashboardHeader role={role} />

      {/* Hero chào mừng — điểm nhấn màu sắc duy nhất của Dashboard, vòng sóng âm mờ phía sau
          gợi liên tưởng loa Tingo phát âm thanh khi nhận tiền */}
      <Box className="relative overflow-hidden bg-gradient-to-br from-[#FF6B4A] to-tingo-sunsetTo px-5 py-6 mx-4 mt-4 rounded-3xl">
        <Box className="sound-ripple absolute right-4 top-1/2 -translate-y-1/2 w-16 h-16 opacity-40" />
        <Text className="text-white/90 text-sm font-medium mb-0.5">
          {currentUser?.fullName ? `${t("dashboard.greetingUser")}, ${currentUser.fullName}` : t("dashboard.greetingGuest")}
        </Text>
        <Text className="text-white font-bold text-xl">{t("dashboard.heroSubtitle")}</Text>
      </Box>

      <QuickAccess role={role} />

      <Box className="flex-1 px-4 space-y-8">
        {/* Khu vực Cửa hàng — chỉ hiển thị cho Chủ cửa hàng/Thành viên, ẩn với Khách */}
        {(role === "SHOP_OWNER" || role === "SHOP_MEMBER") && (
          <ErrorBoundary title={t("dashboard.errorLoadShops")} retryLabel={t("common.retry")} onRetry={fetchShops}>
            <Box>
              <Box className="flex items-center justify-between mb-4">
                <Text className="font-bold text-gray-800 dark:text-gray-100 text-lg">{t("dashboard.shopsSection")}</Text>
                {role === "SHOP_OWNER" && (
                  <Button
                    variant="tertiary"
                    size="small"
                    className="text-tingo-red flex items-center p-0"
                    onClick={() => navigate("/shop/create")}
                  >
                    <Icon icon="zi-plus" size={16} />
                    <span className="ml-1 font-bold">{t("dashboard.addNew")}</span>
                  </Button>
                )}
              </Box>
              <Box className="space-y-4">
                {loadingShops ? (
                  <SkeletonList count={1} itemClassName="h-[92px]" />
                ) : (
                  shops.map((shop) => (
                    <ShopCard key={shop.id} shop={shop} />
                  ))
                )}
                {!loadingShops && shops.length === 0 && (
                  <EmptyState
                    icon="🏬"
                    title={t("dashboard.noShopsTitle")}
                    description={t("dashboard.noShopsDesc")}
                    actionLabel={role === "SHOP_OWNER" ? t("dashboard.createShop") : undefined}
                    onAction={role === "SHOP_OWNER" ? () => navigate("/shop/create") : undefined}
                  />
                )}
              </Box>
            </Box>
          </ErrorBoundary>
        )}

        {/* Khu vực Thiết bị loa — chỉ hiển thị cho Chủ cửa hàng/Thành viên, ẩn với Khách */}
        {(role === "SHOP_OWNER" || role === "SHOP_MEMBER") && (
          <ErrorBoundary title={t("dashboard.errorLoadDevices")} retryLabel={t("common.retry")} onRetry={fetchDevices}>
            <Box id="device-section">
              <Box className="flex items-center justify-between mb-4">
                <Text className="font-bold text-gray-800 dark:text-gray-100 text-lg">{t("dashboard.devicesSection")}</Text>
                {role === "SHOP_OWNER" && (
                  <Button
                    variant="tertiary"
                    size="small"
                    className="text-tingo-red flex items-center p-0"
                    onClick={() => navigate("/qr/scan")}
                  >
                    <Icon icon="zi-plus" size={16} />
                    <span className="ml-1 font-bold">{t("dashboard.addNew")}</span>
                  </Button>
                )}
              </Box>
              <Box className="grid grid-cols-2 gap-3">
                {loadingDevices ? (
                  <Box className="col-span-2"><SkeletonList count={1} itemClassName="h-[120px]" /></Box>
                ) : (
                  devices.map((device) => (
                    <DeviceCard key={device.id} device={device} />
                  ))
                )}
                {role === "SHOP_OWNER" && !loadingDevices && (
                  <Box
                    onClick={() => navigate("/qr/scan")}
                    className="bg-dashed border-2 border-dashed border-gray-200 dark:border-gray-700 p-4 rounded-2xl flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
                    <Icon icon="zi-plus" size={24} className="mb-2" />
                    <Text size="xSmall" className="font-medium text-center">{t("dashboard.addDevice")}</Text>
                  </Box>
                )}
              </Box>
            </Box>
          </ErrorBoundary>
        )}

        {/* Khu vực mua sắm sản phẩm — luôn hiển thị cho mọi vai trò, kể cả Khách */}
        <ErrorBoundary title={t("dashboard.errorLoadProducts")} retryLabel={t("common.retry")} onRetry={fetchProducts}>
          <Box id="shop-section">
            <Box className="mb-4">
              <Text className="font-bold text-gray-800 dark:text-gray-100 text-lg">{t("dashboard.productsSection")}</Text>
              <Text size="small" className="text-gray-400 dark:text-gray-500">{t("dashboard.productsSectionDesc")}</Text>
            </Box>
            {loadingProducts ? (
              <Box className="px-4"><SkeletonList count={1} itemClassName="h-[300px]" /></Box>
            ) : (
              <ProductCarousel products={products} />
            )}
          </Box>
        </ErrorBoundary>
      </Box>

      <BottomNav role={role} />
    </Page>
  );
};

export default DashboardPage;
