# Tingo Pay — Zalo Mini App (Frontend)

Zalo Mini App cho khách dùng loa thanh toán Tingo Pay: mua loa, kích hoạt qua QR, theo dõi đơn hàng/giao dịch, quản lý cửa hàng & nhân viên, báo lỗi thiết bị. Hỗ trợ song ngữ Việt/Anh và dark mode tự theo theme Zalo.

**Nhánh này chỉ chứa code Frontend.** Muốn xem code Backend hoặc toàn bộ dự án gộp chung, xem nhánh `backend` và `main`.

## Tech stack

React 18 + TypeScript + Vite + TailwindCSS v3 + Jotai (state) + `zmp-ui`/`zmp-sdk` (SDK chính thức của nền tảng Zalo Mini App).

## Cài đặt & chạy local

```bash
npm install
npm run start      # zmp start — mở http://localhost:3000 (giả lập khung điện thoại Zalo)
```

Trình duyệt xem trước dùng công cụ ZMP DevTools: khung điện thoại/thanh trạng thái bên ngoài là do công cụ dev vẽ ra để mô phỏng, không phải code của app — code thật nằm trong iframe bên trong.

App gọi API tới backend qua proxy cấu hình ở `vite.config.mts` (mặc định trỏ `https://tingo-api-gateway.vietqr.vn`, đổi nếu chạy backend ở máy local).

## Build & deploy lên Zalo Mini App Platform

```bash
npm run build        # đóng gói production
npm run login         # zmp login — đăng nhập tài khoản Zalo có quyền dev của Mini App
npm run deploy        # zmp deploy — đẩy bản build lên Zalo, ghi đè bản đang chạy
```

`npm run deploy` sẽ thay thế trực tiếp bản Mini App đang chạy trên ID đã cấu hình trong `app-config.json` — chỉ chạy khi chắc chắn muốn phát hành.

## Cấu trúc thư mục

```
src/
├── app.ts                   # Entry point — khởi tạo React root & theme ZaUI
├── components/               # Component dùng chung (layout, bottom-nav, header, i18n switch...)
├── pages/                    # Từng màn hình, chia theo route (onboarding, dashboard, qr, cart, orders, device, staff...)
├── state/atoms.ts             # State toàn cục bằng Jotai (user, role, shops, devices, products, ngôn ngữ...)
├── hooks/                     # Custom hook (fetch dashboard, v.v.)
├── utils/                     # HTTP client, xử lý QR, auth, hằng số
├── i18n/                      # Từ điển song ngữ vi/en + hook useTranslation()
└── static/                    # Ảnh, logo, icon
```

## Cách vận hành logic chính

1. **Onboarding:** Welcome → chọn vai trò/đăng nhập số điện thoại Zalo (`onboarding/role-selection`) → Dashboard.
2. **Phân quyền theo vai trò** (`userRoleAtom`): `SHOP_OWNER`, `SHOP_MEMBER`, `STAFF` (nhân viên Tingo), `CUSTOMER`, `GUEST`. Giao diện (bottom nav, các nút trên Dashboard) tự ẩn/hiện theo vai trò đang đăng nhập.
3. **Quét QR thông minh** (`utils/qr-parser.ts`): một điểm quét dùng cho 2 mục đích — mã VietQR chuẩn EMV (bắt đầu `000201...`) điều hướng sang thêm tài khoản ngân hàng; mã định danh riêng của Tingo (`TINGO|...`) điều hướng sang kích hoạt thiết bị loa.
4. **Ngôn ngữ:** `languageAtom` (Jotai) + `i18n/index.ts` tra cứu theo key dạng `namespace.key`, tự fallback về tiếng Việt nếu thiếu bản dịch tiếng Anh. Lựa chọn ngôn ngữ được lưu qua `zmp-sdk` Storage nên giữ nguyên giữa các lần mở app.
5. **Theme:** tự theo dark/light mode của Zalo, có công tắc bật/tắt tay trong Cài đặt, lưu lại qua Storage tương tự ngôn ngữ.

## Trạng thái dự án

7/9 chức năng cốt lõi (mua loa & đặt hàng, theo dõi đơn, xác nhận nhận hàng, kích hoạt/huỷ liên kết loa qua QR, báo lỗi thiết bị, tài khoản ngân hàng, giao dịch & doanh thu) đã hoàn thiện.

Còn thiếu: quản lý loa liên kết mới có trạng thái Online/Offline thật (pin/wifi còn là dữ liệu giả lập); chưa có chiều gửi thông báo biến động số dư qua Zalo OA; trung tâm hỗ trợ khách hàng còn đơn giản (mới có FAQ + trang `/guide`).

## Tài liệu tham khảo Zalo Mini App

- [Zalo Mini App Official Website](https://mini.zalo.me/)
- [ZaUI Documentation](https://mini.zalo.me/documents/zaui/)
- [ZMP SDK Documentation](https://mini.zalo.me/documents/api/)
- [DevTools Documentation](https://mini.zalo.me/docs/dev-tools/)
