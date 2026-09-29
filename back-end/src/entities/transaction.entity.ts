import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, BeforeInsert } from 'typeorm';
import { getGMT7Date } from '../utils/date-utils';
import { Shop } from './shop.entity';
import { Device } from './device.entity';

export enum TransactionType {
  DEBIT = 'DEBIT',
  CREDIT = 'CREDIT',
}

export enum TransactionStatus {
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  PENDING = 'PENDING',
}

export enum RefundStatus {
  NONE = 'NONE',
  PARTIAL = 'PARTIAL',
  FULL = 'FULL',
}

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'timestamp', nullable: true })
  time: Date;

  @BeforeInsert()
  setTime() {
    this.time = getGMT7Date();
  }

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ name: 'content', type: 'text', nullable: true })
  content?: string;

  @Column({ name: 'ref_number', nullable: true })
  refNumber?: string;

  @Column({
    type: 'enum',
    enum: TransactionType,
  })
  type: TransactionType;

  @Column({ name: 'account_number' })
  accountNumber: string;

  @ManyToOne(() => Shop, (shop) => shop.transactions)
  @JoinColumn({ name: 'shop_id' })
  shop: Shop;

  @ManyToOne(() => Device, (device) => device.transactions)
  @JoinColumn({ name: 'device_id' })
  device: Device;

  @Column({
    type: 'enum',
    enum: TransactionStatus,
    default: TransactionStatus.PENDING,
  })
  status: TransactionStatus;

  @Column({
    type: 'enum',
    enum: RefundStatus,
    default: RefundStatus.NONE,
    name: 'refund_status',
  })
  refundStatus: RefundStatus;
}
