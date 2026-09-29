import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, BeforeInsert } from 'typeorm';
import { getGMT7Date } from '../utils/date-utils';
import { User } from './user.entity';
import { Device } from './device.entity';

export enum OrderStatus {
  INIT = 'INIT',
  PROCESSING = 'PROCESSING',
  SHIPPING = 'SHIPPING',
  DELIVERED = 'DELIVERED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum PaymentMethod {
  BANK_QR = 'BANK_QR',
  COD = 'COD',
}

export enum PaymentStatus {
  UNPAID = 'UNPAID',
  PAID = 'PAID',
}

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  code: string;

  @Column({ name: 'order_time', type: 'timestamp', nullable: true })
  orderTime: Date;

  @BeforeInsert()
  setOrderTime() {
    this.orderTime = getGMT7Date();
  }

  @Column({ name: 'product_name', nullable: true })
  productName?: string;

  @Column()
  quantity: number;

  @ManyToOne(() => Device, (device) => device.orders)
  @JoinColumn({ name: 'device_id' })
  device: Device;

  @Column({ name: 'unit_price', type: 'decimal', precision: 12, scale: 2 })
  unitPrice: number;

  @Column({ name: 'total_amount', type: 'decimal', precision: 12, scale: 2 })
  totalAmount: number;

  @Column({ name: 'discount_amount', type: 'decimal', precision: 12, scale: 2, default: 0 })
  discountAmount: number;

  @Column({ name: 'pay_amount', type: 'decimal', precision: 12, scale: 2 })
  payAmount: number;

  @ManyToOne(() => User, (user) => user.orders)
  @JoinColumn({ name: 'customer_id' })
  customer: User;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.INIT,
  })
  status: OrderStatus;

  @Column({ name: 'delivery_time', nullable: true })
  deliveryTime: Date;

  @Column({ name: 'receiver_name' })
  receiverName: string;

  @Column({ name: 'receiver_phone' })
  receiverPhone: string;

  @Column({ name: 'receiver_address' })
  receiverAddress: string;

  @Column({ name: 'referral_code', nullable: true })
  referralCode?: string;

  @Column({ name: 'shipping_fee', type: 'decimal', precision: 12, scale: 2, default: 0 })
  shippingFee: number;

  @Column({ name: 'tracking_number', nullable: true })
  trackingNumber?: string;

  @Column({ name: 'shipping_provider', nullable: true })
  shippingProvider?: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  // Thanh toán: BANK_QR (chuyển khoản, tự xác nhận qua callback VietQR) hoặc COD (thu tiền khi giao)
  @Column({ name: 'payment_method', type: 'enum', enum: PaymentMethod, default: PaymentMethod.COD })
  paymentMethod: PaymentMethod;

  @Column({ name: 'payment_status', type: 'enum', enum: PaymentStatus, default: PaymentStatus.UNPAID })
  paymentStatus: PaymentStatus;

  @Column({ name: 'paid_at', type: 'timestamp', nullable: true })
  paidAt?: Date;

  // Mã giao dịch ngân hàng (transactionid), duy nhất để chống ghi nhận trùng
  @Column({ name: 'payment_ref', nullable: true, unique: true })
  paymentRef?: string;

  // Chuỗi VietQR EMV của đơn BANK_QR để app vẽ mã
  @Column({ name: 'payment_qr', type: 'text', nullable: true })
  paymentQr?: string;

  // Id nhân viên đánh dấu đã nhận tiền thủ công
  @Column({ name: 'paid_by', nullable: true })
  paidBy?: string;
}
