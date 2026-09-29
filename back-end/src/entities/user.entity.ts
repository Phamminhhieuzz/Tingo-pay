import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, BeforeInsert, BeforeUpdate } from 'typeorm';
import { getGMT7Date } from '../utils/date-utils';
import { Shop } from './shop.entity';
import { Order } from './order.entity';
import { ShopStaff } from './shop-staff.entity';

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  PENDING = 'PENDING',
}

export enum UserRole {
  SHOP_OWNER = 'SHOP_OWNER',
  STAFF = 'STAFF',
  SHOP_MEMBER = 'SHOP_MEMBER',
  CUSTOMER = 'CUSTOMER',
  GUEST = 'GUEST',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'full_name' })
  fullName: string;

  @Column({ name: 'phone_zalo', unique: true, nullable: true })
  phoneZalo: string;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.PENDING,
  })
  status: UserStatus;

  @Column({
    type: 'enum',
    enum: UserRole,
    array: true,
    default: [UserRole.CUSTOMER],
  })
  roles: UserRole[];

  @Column({ name: 'password', length: 256, nullable: true })
  password?: string;

  @Column({ name: 'last_login_at', type: 'timestamp', nullable: true })
  lastLoginAt?: Date;

  @Column({ name: 'created_at', type: 'timestamp', nullable: true })
  createdAt: Date;

  @Column({ name: 'updated_at', type: 'timestamp', nullable: true })
  updatedAt: Date;

  @BeforeInsert()
  setTimestamps() {
    const now = getGMT7Date();
    this.createdAt = now;
    this.updatedAt = now;
  }

  @BeforeUpdate()
  updateTimestamps() {
    this.updatedAt = getGMT7Date();
  }

  @OneToMany(() => Shop, (shop) => shop.owner)
  ownedShops: Shop[];

  @OneToMany(() => Order, (order) => order.customer)
  orders: Order[];

  @OneToMany(() => ShopStaff, (shopStaff) => shopStaff.user)
  shopStaffRoles: ShopStaff[];
}
