import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Shop } from './shop.entity';
import { User } from './user.entity';

export enum ShopRole {
  SHOP_MANAGER = 'SHOP_MANAGER',
  SHOP_STAFF = 'SHOP_STAFF',
}

@Entity('shop_staff')
export class ShopStaff {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Shop, (shop) => shop.staffRoles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'shop_id' })
  shop: Shop;

  @ManyToOne(() => User, (user) => user.shopStaffRoles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({
    type: 'enum',
    enum: ShopRole,
    default: ShopRole.SHOP_STAFF,
  })
  role: ShopRole;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
