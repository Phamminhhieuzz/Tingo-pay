/**
 * File định nghĩa toàn bộ shape dữ liệu (interface) và state toàn cục (Jotai atoms) của app:
 * User, Shop, Device, Product, Transaction, Order. Các trang/hook trong app import từ đây
 * để đảm bảo dữ liệu đồng nhất, tránh định nghĩa lại type ở nhiều nơi.
 */
import { atom } from "jotai";
import speaker1 from "@/static/product-speaker-1.png";
import speaker2 from "@/static/product-speaker-2.png";
import speaker3 from "@/static/product-speaker-3.png";

/**
 * ALIGNED WITH OPENAPI SCHEMA
 */

// Vai trò người dùng trong app: chủ cửa hàng, nhân viên cửa hàng, khách hàng thường, hoặc khách (chưa đăng nhập)
export type UserRole = "SHOP_OWNER" | "SHOP_MEMBER" | "CUSTOMER" | "GUEST" | "STAFF";
// Trạng thái tài khoản: đang hoạt động, bị vô hiệu hóa, hoặc đang chờ xác thực
export type UserStatus = "ACTIVE" | "INACTIVE" | "PENDING";

// Thông tin tài khoản người dùng đã đăng nhập qua Zalo (đồng bộ với tài khoản Tingo Pay)
export interface User {
  id: string;
  fullName: string;
  phoneZalo: string;
  status: UserStatus;
  roles: UserRole[];
}

// Thông tin cửa hàng của người dùng (chủ cửa hàng có thể sở hữu nhiều cửa hàng)
export interface Shop {
  id: string;
  code: string;
  name: string;
  address: string;
  ownerId: string;
  createdAt?: string;
  // Các field bổ sung phục vụ hiển thị UI, không có trong schema gốc của backend
  avatar?: string;
  isVerified?: boolean;
  category?: string;
}

// Thông tin thiết bị loa thanh toán đã liên kết với cửa hàng/tài khoản
export interface Device {
  id: string;
  code: string;
  name: string;
  model: string;
  serial: string;
  linkStatus: "LINKED" | "UNLINKED"; // Trạng thái liên kết: đã gán vào cửa hàng hay chưa
  opStatus: "ONLINE" | "OFFLINE"; // Trạng thái hoạt động thực tế của thiết bị
  shopName?: string; // Enhanced field for UI
  // Các field bổ sung phục vụ hiển thị UI (pin, wifi, hoạt động gần nhất)
  battery?: number;
  wifiStatus?: string;
  lastActive?: string;
}

// Thông tin 1 nhân viên được gán vào cửa hàng (quan hệ user-shop, không phải chính User)
export interface ShopStaff {
  id: string;
  role: "SHOP_MANAGER" | "SHOP_STAFF";
  user: {
    id: string;
    fullName: string;
    phoneZalo: string;
  };
}

// Thông tin 1 yêu cầu báo hỏng/báo lỗi thiết bị loa, có thể kèm ảnh mô tả lỗi
export interface DeviceIssue {
  id: string;
  description: string;
  photoUrl?: string;
  status: "OPEN" | "RESOLVED";
  createdAt: string;
  // Chỉ có ở danh sách cho nhân viên (GET /device-issues) — liệt kê theo 1 thiết bị thì không cần
  device?: { id: string; model: string; code?: string };
  reportedBy?: { fullName: string; phoneZalo: string };
}

// Thông tin sản phẩm loa thanh toán bán lẻ trên Mini App
export interface Product {
  id: string;
  code: string;
  name: string;
  category: "SPEAKER" | "PAY_BOX" | "QR_BOX" | "SIM";
  model: string;
  price: number;
  status: "IN_STOCK" | "OUT_OF_STOCK";
  imageUrls: string[];
  // Các field đề xuất bổ sung phục vụ UI (giá cũ để hiển thị khuyến mãi, nhãn hot/bán chạy...)
  oldPrice?: number;
  features?: string[];
  isHot?: boolean;
  isBestSeller?: boolean;
}

// Thông tin 1 tài khoản ngân hàng liên kết VietQR để nhận tiền qua loa thanh toán
export interface BankAccount {
  id: string;
  bankBin: string;
  bankCode: string;
  accountNumber: string;
  accountHolder: string;
  phone: string;
  citizenId: string;
  status: "LINKED" | "UNLINKED";
}

// Thông tin 1 giao dịch tiền (nhận tiền/chuyển tiền) qua tài khoản ngân hàng liên kết VietQR
export interface Transaction {
  id: string;
  time: string;
  amount: number;
  content: string;
  refNumber: string;
  type: "DEBIT" | "CREDIT"; // CREDIT = tiền vào (ghi có), DEBIT = tiền ra (ghi nợ)
  accountNumber: string;
  status: "SUCCESS" | "FAILED" | "PENDING";
  refundStatus?: "NONE" | "PARTIAL" | "FULL";
}

// Thông tin đơn hàng mua loa thanh toán (từ lúc đặt hàng đến khi hoàn tất/hủy)
export interface Order {
  id: string;
  code: string;
  orderTime: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  discountAmount?: number;
  payAmount: number;
  status: "INIT" | "PROCESSING" | "SHIPPING" | "DELIVERED" | "COMPLETED" | "CANCELLED";
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  notes?: string;
  // Thông tin vận chuyển do nhân viên Tingo nhập khi chuyển đơn sang "Đang giao"
  trackingNumber?: string;
  shippingProvider?: string;
  deliveryTime?: string;
  // Client-side augmentation — Order schema in openapi.yaml has no product
  // reference field; the backend may or may not echo these back.
  productId?: string;
  productName?: string;
  // Thanh toán: BANK_QR (chuyển khoản, tự xác nhận) hoặc COD (thu khi nhận hàng)
  paymentMethod: "BANK_QR" | "COD";
  paymentStatus: "UNPAID" | "PAID";
  paidAt?: string;
  // Chuỗi VietQR EMV của đơn BANK_QR, app vẽ thành mã QR
  paymentQr?: string;
}

export type PaymentMethod = Order["paymentMethod"];

// State Atoms
// Tài khoản người dùng hiện tại đang đăng nhập (null nếu chưa đăng nhập/là khách)
export const currentUserAtom = atom<User | null>(null);
export const userRoleAtom = atom<UserRole | null>(null); // Primary active role

// Danh sách cửa hàng, thiết bị loa, sản phẩm và giao dịch — dùng chung cho toàn app
export const shopsAtom = atom<Shop[]>([]);
export const devicesAtom = atom<Device[]>([]);
export const productsAtom = atom<Product[]>([]);
export const transactionsAtom = atom<Transaction[]>([]);

// Loading states — đánh dấu đang fetch dữ liệu tương ứng để UI hiển thị skeleton/loading
export const isLoadingShopsAtom = atom(false);
export const isLoadingDevicesAtom = atom(false);
export const isLoadingProductsAtom = atom(false);
export const isLoadingTransactionsAtom = atom(false);
export const transactionsErrorAtom = atom<string | null>(null);

// Danh sách đơn hàng cùng trạng thái loading/lỗi tương ứng
export const ordersAtom = atom<Order[]>([]);
export const isLoadingOrdersAtom = atom(false);
export const ordersErrorAtom = atom<string | null>(null);

// Danh sách tài khoản ngân hàng cùng trạng thái loading/lỗi tương ứng
export const bankAccountsAtom = atom<BankAccount[]>([]);
export const isLoadingBankAccountsAtom = atom(false);
export const bankAccountsErrorAtom = atom<string | null>(null);
