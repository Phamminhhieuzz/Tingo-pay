/**
 * Layout — Component gốc (root) của toàn bộ ứng dụng, thiết lập theme ZaUI theo
 * hệ điều hành Zalo, bọc SnackbarProvider (thông báo) và khai báo toàn bộ bảng
 * định tuyến (routes) của app thông qua ZMPRouter + AnimationRoutes.
 * Đây là nơi trung tâm quản lý điều hướng — mọi trang mới cần được khai báo ở đây.
 */
import { useEffect } from "react";
import { getSystemInfo } from "zmp-sdk";
import {
  AnimationRoutes,
  App,
  Route,
  SnackbarProvider,
  useTheme,
  ZMPRouter,
} from "zmp-ui";
import { AppProps } from "zmp-ui/app";
import { Navigate } from "react-router-dom";
import { useSetAtom } from "jotai";
import { getSavedThemeMode } from "@/utils/theme-preference";
import { getSavedLanguage } from "@/utils/language-preference";
import { languageAtom } from "@/i18n";

import WelcomePage from "@/pages/onboarding/welcome";
import RoleSelectionPage from "@/pages/onboarding/role-selection";
import DashboardPage from "@/pages/dashboard/index";
import ScanPage from "@/pages/qr/scan";
import BankAccountInfoPage from "@/pages/bank-account/index";
import BankAccountListPage from "@/pages/bank-account/list";
import CreateShopPage from "@/pages/shop/create";
import ShopDetailPage from "@/pages/shop/detail";
import StaffPage from "@/pages/staff/index";
import StaffOrdersPage from "@/pages/staff-orders/index";
import StaffOrderDetailPage from "@/pages/staff-orders/detail";
import StaffDeviceIssuesPage from "@/pages/staff-devices/index";
import CartPage from "@/pages/cart/index";
import DeviceInfoPage from "@/pages/device/index";
import DeviceDetailPage from "@/pages/device/detail";
import TransactionsPage from "@/pages/transactions/index";
import ProductDetailPage from "@/pages/product/detail";
import OrdersPage from "@/pages/orders/index";
import OrderDetailPage from "@/pages/orders/detail";
import SettingsPage from "@/pages/settings/index";
import GuidePage from "@/pages/guide/index";
import SupportPage from "@/pages/support/index";
import ComingSoonPage from "@/pages/coming-soon/index";
import LegalPage from "@/pages/legal/index";


// Áp lại lựa chọn dark mode người dùng từng tự bật tay (nếu có) ngay khi app mở lên, đè lên
// theme mặc định lấy từ hệ thống Zalo. Đặt trong <App> vì useTheme() cần context của nó.
const ApplySavedTheme = () => {
  const [, setThemeMode] = useTheme();
  const setLanguage = useSetAtom(languageAtom);
  useEffect(() => {
    getSavedThemeMode().then((saved) => {
      if (saved) setThemeMode({ mode: saved });
    });
    getSavedLanguage().then((saved) => {
      if (saved) setLanguage(saved);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
};

const Layout = () => {
  return (
    <App theme={getSystemInfo().zaloTheme as AppProps["theme"]}>
      <ApplySavedTheme />
      <SnackbarProvider>
        <ZMPRouter>
          <AnimationRoutes>
            {/* Luồng khởi động: vào "/" sẽ tự chuyển hướng thẳng tới trang Welcome */}
            <Route path="/" element={<Navigate to="/onboarding/welcome" replace />}></Route>

            {/* Luồng Onboarding & Xác thực: giới thiệu app -> đăng nhập SĐT Zalo & chọn vai trò */}
            <Route path="/onboarding/welcome" element={<WelcomePage />}></Route>
            <Route path="/onboarding/role-selection" element={<RoleSelectionPage />}></Route>

            {/* Trang chủ Dashboard: hiển thị nội dung khác nhau tùy vai trò (role-aware) */}
            <Route path="/dashboard" element={<DashboardPage />}></Route>

            {/* Luồng quét QR thông minh: camera quét mã VietQR (liên kết ngân hàng)
                hoặc mã định danh Loa Tingo (kích hoạt thiết bị) */}
            <Route path="/qr/scan" element={<ScanPage />}></Route>
            <Route path="/bank-account" element={<BankAccountListPage />}></Route>
            <Route path="/shop/create" element={<CreateShopPage />}></Route>
            <Route path="/shop/:id" element={<ShopDetailPage />}></Route>
            <Route path="/staff" element={<StaffPage />}></Route>
            <Route path="/staff/orders" element={<StaffOrdersPage />}></Route>
            <Route path="/staff/orders/:id" element={<StaffOrderDetailPage />}></Route>
            <Route path="/staff/device-issues" element={<StaffDeviceIssuesPage />}></Route>
            <Route path="/bank-account/add" element={<BankAccountInfoPage />}></Route>
            <Route path="/device/add" element={<DeviceInfoPage />}></Route>
            <Route path="/device/:id" element={<DeviceDetailPage />}></Route>

            {/* Theo dõi giao dịch & doanh thu */}
            <Route path="/transactions" element={<TransactionsPage />}></Route>

            {/* Luồng mua loa thanh toán: chi tiết sản phẩm -> đặt hàng -> theo dõi đơn */}
            <Route path="/product/:id" element={<ProductDetailPage />}></Route>
            <Route path="/orders" element={<OrdersPage />}></Route>
            <Route path="/orders/:id" element={<OrderDetailPage />}></Route>

            {/* Chức năng hỗ trợ: cài đặt tài khoản, hướng dẫn sử dụng */}
            <Route path="/settings" element={<SettingsPage />}></Route>
            <Route path="/guide" element={<GuidePage />}></Route>
            <Route path="/support" element={<SupportPage />}></Route>

            {/* Các tính năng chưa triển khai: tạm thời dùng chung 1 trang "Sắp ra mắt" */}
            <Route path="/promotions" element={<ComingSoonPage />}></Route>
            <Route path="/legal/:type" element={<LegalPage />}></Route>
            <Route path="/cart" element={<CartPage />}></Route>

          </AnimationRoutes>
        </ZMPRouter>
      </SnackbarProvider>
    </App>
  );
};
export default Layout;
