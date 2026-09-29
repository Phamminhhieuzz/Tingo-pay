import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, OneToMany, BeforeInsert } from 'typeorm';
import { getGMT7Date } from '../utils/date-utils';
import { Shop } from './shop.entity';
import { Order } from './order.entity';
import { Transaction } from './transaction.entity';

export enum DeviceLinkStatus {
  LINKED = 'LINKED',
  UNLINKED = 'UNLINKED',
}

export enum DeviceOpStatus {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
}

@Entity('devices')
export class Device {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  code: string;

  @Column()
  name: string;

  @Column()
  model: string;

  @Column({ unique: true })
  serial: string;

  @Column({
    type: 'enum',
    enum: DeviceLinkStatus,
    default: DeviceLinkStatus.UNLINKED,
    name: 'link_status',
  })
  linkStatus: DeviceLinkStatus;

  @Column({
    type: 'enum',
    enum: DeviceOpStatus,
    default: DeviceOpStatus.OFFLINE,
    name: 'op_status',
  })
  opStatus: DeviceOpStatus;

  @Column({ name: 'created_at', type: 'timestamp', nullable: true })
  createdAt: Date;

  @BeforeInsert()
  setCreatedAt() {
    this.createdAt = getGMT7Date();
  }

  @ManyToOne(() => Shop, (shop) => shop.devices)
  @JoinColumn({ name: 'shop_id' })
  shop: Shop;

  @OneToMany(() => Order, (order) => order.device)
  orders: Order[];

  @OneToMany(() => Transaction, (transaction) => transaction.device)
  transactions: Transaction[];
}
