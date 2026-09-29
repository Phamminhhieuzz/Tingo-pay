import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn, BeforeInsert } from 'typeorm';
import { getGMT7Date } from '../utils/date-utils';
import { User } from './user.entity';
import { Device } from './device.entity';
import { BankAccount } from './bank-account.entity';
import { Transaction } from './transaction.entity';
import { ShopStaff } from './shop-staff.entity';

@Entity('shops')
export class Shop {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  code: string;

  @Column()
  name: string;

  @Column()
  address: string;

  @Column({ name: 'avatar_url', nullable: true })
  avatarUrl: string;

  @Column({ name: 'created_by', nullable: true })
  createdBy?: string;

  @Column({ name: 'created_at', type: 'timestamp', nullable: true })
  createdAt: Date;

  @BeforeInsert()
  setCreatedAt() {
    this.createdAt = getGMT7Date();
  }

  @ManyToOne(() => User, (user) => user.ownedShops)
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @OneToMany(() => Device, (device) => device.shop)
  devices: Device[];

  @OneToMany(() => BankAccount, (bankAccount) => bankAccount.shop)
  bankAccounts: BankAccount[];

  @OneToMany(() => Transaction, (transaction) => transaction.shop)
  transactions: Transaction[];

  @OneToMany(() => ShopStaff, (shopStaff) => shopStaff.shop, { cascade: true })
  staffRoles: ShopStaff[];
}
