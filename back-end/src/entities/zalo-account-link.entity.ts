import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { getGMT7Date } from '../utils/date-utils';

export enum ZaloAccountLinkStatus {
  LINKED = 'LINKED',
  UNLINKED = 'UNLINKED',
  /** Zalo gửi user.revoke.consent — hủy liên kết từ phía nền tảng. */
  REVOKED_BY_CONSENT = 'REVOKED_BY_CONSENT',
}

/**
 * Mapping Zalo Mini App userId ↔ tài khoản Tingo Pay (qrcert).
 * Constraint: `zalo_user_id` unique (1 Zalo → 1 row).
 * Business: khi status=LINKED, 1 Zalo ↔ 1 Tingo (service chặn ghi đè / đổi chiều).
 */
@Entity('zalo_account_links')
export class ZaloAccountLink {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Zalo platform userId (webhook `userId`, SDK). */
  @Index({ unique: true })
  @Column({ name: 'zalo_user_id', length: 64 })
  zaloUserId: string;

  /** `userId` từ qrcert `POST /api/v1/accounts/`. */
  @Index()
  @Column({ name: 'tingo_user_id', length: 128 })
  tingoUserId: string;

  /** SĐT tài khoản Tingo Pay đã đăng nhập. */
  @Index()
  @Column({ name: 'tingo_phone', length: 20 })
  tingoPhone: string;

  /** Mini App ID (tùy chọn, từ webhook/app config). */
  @Column({ name: 'app_id', length: 64, nullable: true })
  appId?: string;

  @Column({
    type: 'enum',
    enum: ZaloAccountLinkStatus,
    default: ZaloAccountLinkStatus.LINKED,
  })
  status: ZaloAccountLinkStatus;

  @Column({ name: 'linked_at', type: 'timestamp', nullable: true })
  linkedAt?: Date;

  @Column({ name: 'unlinked_at', type: 'timestamp', nullable: true })
  unlinkedAt?: Date;

  /** Timestamp sự kiện Zalo (webhook) lần cuối ảnh hưởng link. */
  @Column({ name: 'last_zalo_event_at', type: 'bigint', nullable: true })
  lastZaloEventAt?: string;

  @Column({ name: 'created_at', type: 'timestamp', nullable: true })
  createdAt: Date;

  @Column({ name: 'updated_at', type: 'timestamp', nullable: true })
  updatedAt: Date;

  @BeforeInsert()
  setTimestamps() {
    const now = getGMT7Date();
    this.createdAt = now;
    this.updatedAt = now;
    if (!this.linkedAt && this.status === ZaloAccountLinkStatus.LINKED) {
      this.linkedAt = now;
    }
  }

  @BeforeUpdate()
  updateTimestamps() {
    this.updatedAt = getGMT7Date();
  }
}
