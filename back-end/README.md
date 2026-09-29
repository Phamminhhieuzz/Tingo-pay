# Tingo Pay API Gateway — Zalo Mini App

Backend NestJS phục vụ Zalo Mini App Tingo Pay: xác thực Zalo, quản lý cửa hàng/nhân viên/thiết bị loa, mua hàng & thanh toán VietQR, giao dịch/doanh thu.

- **Repo Frontend (Mini App):** [tingo_pay_zalo_mini_app](https://github.com/vietqrtech/tingo_pay_zalo_mini_app)
- **API Gateway chạy tại:** `https://tingo-api-gateway.vietqr.vn`
- **Stack:** NestJS 11 + TypeORM (PostgreSQL/Supabase) + JWT + Jest

## Cài đặt & chạy local

```bash
npm install
cp .env.example .env   # điền giá trị thật, KHÔNG commit .env
npm run start:dev      # http://localhost:3000
```

Hoặc chạy full stack (API + Postgres + Redis) bằng Docker:

```bash
docker compose up -d --build api-gateway
```

Các biến môi trường cần thiết (đã có mô tả chi tiết trong `.env.example`):

| Nhóm | Biến | Ghi chú |
|---|---|---|
| Database | `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME` | Supabase Postgres |
| Auth | `JWT_SECRET`, `JWT_EXPIRATION` | Bắt buộc set trên production, không dùng giá trị mặc định |
| Zalo | `ZALO_APP_SECRET`, `ZALO_OPEN_API_KEY` | Xác thực số điện thoại Zalo + verify webhook |
| VietQR | `VIETQR_API_BASE`, `VIETQR_BASIC_AUTH`, `VIETQR_BANK_*` | Tạo mã QR thanh toán + đồng bộ giao dịch ngân hàng |
| Supabase Storage | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_BUCKET` | Lưu ảnh báo hỏng thiết bị (nếu bỏ trống sẽ tự lưu tạm ra đĩa container, chỉ dùng dev) |

⚠️ **Cờ debug chỉ bật ở máy dev, KHÔNG bao giờ bật trên production:** `ENABLE_DEBUG_AUTH`, `ENABLE_DEBUG_PAYMENT`, `ZALO_WEBHOOK_SKIP_VERIFY`.

## Test

```bash
npm test          # unit test (Jest), TDD — mọi module đều có .spec.ts
npm run test:cov  # kèm coverage
npm run test:e2e  # end-to-end
```

## Kiến trúc — các module chính (`src/modules/`)

| Module | Chức năng |
|---|---|
| `auth/` | Đăng nhập/đăng ký, JWT, đồng bộ vai trò (SHOP_OWNER/SHOP_MEMBER/STAFF/CUSTOMER) theo dữ liệu thật mỗi lần login |
| `tingo-auth/` | BFF đăng nhập bằng SĐT + PIN Tingo Pay gốc (song song với đăng nhập Zalo) |
| `zalo-account-link/` | Liên kết 1 tài khoản Zalo ↔ 1 tài khoản Tingo Pay |
| `zalo-webhook/` | Nhận sự kiện từ Zalo OA (hiện xử lý `user.revoke.consent` — huỷ liên kết khi khách rút quyền) |
| `shops/` | Cửa hàng, nhân viên cửa hàng (shop_staff) |
| `devices/` | Kích hoạt loa qua QR/serial, huỷ liên kết, trạng thái Online/Offline |
| `device-issues/` | Báo hỏng/báo lỗi thiết bị kèm ảnh (Supabase Storage), hàng đợi xử lý cho nhân viên Tingo |
| `products/` | Danh mục sản phẩm loa/thiết bị thanh toán |
| `orders/` | Đơn hàng: máy trạng thái INIT→PROCESSING→SHIPPING→DELIVERED→COMPLETED (hoặc CANCELLED), phân quyền theo chủ đơn/nhân viên |
| `payments/` | Thanh toán VietQR (sinh mã QR, đối soát giao dịch ngân hàng, callback), hoặc COD |
| `bank-accounts/` | Tài khoản ngân hàng nhận tiền liên kết VietQR |
| `transactions/` | Lịch sử giao dịch & doanh thu |
| `paybox/`, `vib/`, `integration/` | Tích hợp hệ thống Tingo Pay Core / đối tác ngân hàng |
| `storage/` | Wrapper Supabase Storage dùng chung (upload ảnh) |
| `users/` | Hồ sơ người dùng |

## Trạng thái hiện tại (2026-09-28)

✅ Đã hoàn thiện: auth + đồng bộ vai trò, cửa hàng/nhân viên, kích hoạt & huỷ liên kết loa, báo lỗi thiết bị (kèm ảnh lưu Supabase, có hàng đợi cho nhân viên xử lý), luồng mua hàng đầy đủ (đặt hàng → xử lý → giao → hoàn tất), thanh toán VietQR tự đối soát + COD, tài khoản ngân hàng, giao dịch/doanh thu.

🔴 Chưa làm: gửi thông báo biến động số dư qua Zalo OA (mới có chiều nhận webhook, chưa có chiều gửi).

⚠️ Lưu ý triển khai: `TypeOrmModule` đang dùng `synchronize: true` (tự đồng bộ schema) — chưa có migration chính thức cho các cột `payment_*`, cần viết trước khi thấy an toàn để tắt `synchronize`.

## Deploy

Push lên nhánh `main` của repo `vietqrtech/tingo-pay-api-gateway-mini-app` sẽ **tự động deploy lên production** (`tingo-api-gateway.vietqr.vn`) — luôn xác nhận với người phụ trách trước khi push nhánh này.
