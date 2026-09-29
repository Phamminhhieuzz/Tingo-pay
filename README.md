# Tingo Pay — Zalo Mini App

Zalo Mini App cho khách dùng loa thanh toán Tingo Pay: mua loa, kích hoạt qua QR, theo dõi đơn hàng/giao dịch, quản lý cửa hàng & nhân viên, báo lỗi thiết bị. Nhánh này gộp chung cả **Frontend** và **Backend** để xem toàn cảnh dự án; nếu chỉ cần một phía, xem nhánh `frontend` hoặc `backend`.

## Cấu trúc repo

```
Tingo-pay/
├── front-end/     # Zalo Mini App (React + TS + Vite + zmp-ui)
└── back-end/      # API Gateway (NestJS)
```

Đây là 2 project độc lập, mỗi bên có `package.json`, `README.md` riêng — cài đặt và chạy từng bên riêng biệt như hướng dẫn bên dưới.

## Cách hoạt động tổng quan

```
Người dùng mở Mini App trong Zalo
        │
        ▼
front-end (React SPA chạy trong ZMP)
        │  gọi API qua HTTPS (JWT Bearer token)
        ▼
back-end (NestJS API Gateway) ──► PostgreSQL (dữ liệu shop/order/device...)
        │
        ├─► Zalo OpenAPI — xác thực số điện thoại, nhận webhook OA
        ├─► VietQR — sinh mã QR thanh toán, đối soát giao dịch ngân hàng
        └─► Supabase Storage — lưu ảnh báo lỗi thiết bị
```

**Luồng chính:** khách mở Mini App → đăng nhập bằng số điện thoại Zalo → `front-end` gọi `back-end` để đồng bộ/tạo tài khoản và lấy vai trò (SHOP_OWNER, SHOP_MEMBER, STAFF, CUSTOMER) → giao diện tự đổi theo vai trò → các thao tác nghiệp vụ (mua loa, kích hoạt QR, xem giao dịch...) đều đi qua API Gateway, gateway là nguồn sự thật duy nhất cho dữ liệu.

## Chạy Frontend (local)

```bash
cd front-end
npm install
npm run start      # zmp start — http://localhost:3000
```

Deploy thật lên Zalo Mini App Platform:

```bash
npm run login       # đăng nhập tài khoản Zalo có quyền dev
npm run deploy       # đẩy bản build lên, ghi đè bản đang chạy trên Mini App ID cấu hình trong app-config.json
```

Chi tiết cấu trúc thư mục & logic (routing theo vai trò, quét QR thông minh, i18n, dark mode): xem [`front-end/README.md`](front-end/README.md).

## Chạy Backend (local)

```bash
cd back-end
npm install
cp .env.example .env   # điền giá trị thật, KHÔNG commit .env
npm run start:dev      # http://localhost:3000
```

Hoặc chạy full stack bằng Docker: `docker compose up -d --build api-gateway` (kèm Postgres, Redis, RabbitMQ).

Chi tiết các module, biến môi trường, luồng nghiệp vụ (đăng nhập, mua hàng, kích hoạt loa, báo lỗi, giao dịch): xem [`back-end/README.md`](back-end/README.md).

## Vai trò người dùng

| Vai trò | Có thể làm |
|---|---|
| `GUEST` | Xem giới thiệu, chưa đăng nhập — chỉ vào được luồng chọn vai trò |
| `CUSTOMER` | Mua loa, theo dõi đơn, xác nhận nhận hàng, báo lỗi thiết bị đã mua |
| `SHOP_MEMBER` | Thao tác vận hành trong 1 cửa hàng (không quét QR liên kết ngân hàng/kích hoạt thiết bị mới) |
| `SHOP_OWNER` | Toàn quyền 1 cửa hàng: liên kết ngân hàng, kích hoạt/huỷ liên kết thiết bị, quản lý nhân viên, xem doanh thu |
| `STAFF` | Nhân viên Tingo Pay — xử lý hàng đợi báo lỗi thiết bị từ khách |

## Trạng thái dự án

7/9 chức năng cốt lõi đã hoàn thiện: mua loa & đặt hàng, theo dõi đơn, xác nhận nhận hàng, kích hoạt/huỷ liên kết loa qua QR, báo lỗi thiết bị, tài khoản ngân hàng, giao dịch & doanh thu.

Còn thiếu:
- Quản lý loa liên kết — pin/wifi mới có ở kiểu dữ liệu, chưa lấy dữ liệu thật từ thiết bị.
- Gửi thông báo biến động số dư qua Zalo OA — mới có chiều nhận webhook, chưa có chiều gửi.
- Trung tâm hỗ trợ khách hàng — mới có FAQ + trang hướng dẫn, chưa có kênh liên hệ riêng.

## Tài liệu tham khảo Zalo Mini App

- [Zalo Mini App Official Website](https://mini.zalo.me/)
- [ZaUI Documentation](https://mini.zalo.me/documents/zaui/)
- [ZMP SDK Documentation](https://mini.zalo.me/documents/api/)
- [DevTools Documentation](https://mini.zalo.me/docs/dev-tools/)
