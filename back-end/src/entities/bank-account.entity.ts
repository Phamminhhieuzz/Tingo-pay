import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, BeforeInsert, BeforeUpdate } from 'typeorm';
import { getGMT7Date } from '../utils/date-utils';
import { Shop } from './shop.entity';

export enum BankAccountStatus {
  LINKED = 'LINKED',
  UNLINKED = 'UNLINKED',
}

@Entity('bank_accounts')
export class BankAccount {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'bank_bin' })
  bankBin: string;

  @Column({ name: 'bank_code' })
  bankCode: string;

  @Column({ name: 'account_number' })
  accountNumber: string;

  @Column({ name: 'account_holder' })
  accountHolder: string;

  @Column()
  phone: string;

  @Column({ name: 'citizen_id' })
  citizenId: string;

  @Column({
    type: 'enum',
    enum: BankAccountStatus,
    default: BankAccountStatus.UNLINKED,
  })
  status: BankAccountStatus;

  @ManyToOne(() => Shop, (shop) => shop.bankAccounts)
  @JoinColumn({ name: 'shop_id' })
  shop: Shop;

  @Column({ name: 'created_by', nullable: true })
  createdBy: string;

  @Column({ name: 'updated_by', nullable: true })
  updatedBy: string;

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
}
