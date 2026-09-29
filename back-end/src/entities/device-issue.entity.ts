import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, BeforeInsert } from 'typeorm';
import { getGMT7Date } from '../utils/date-utils';
import { Device } from './device.entity';
import { User } from './user.entity';

export enum DeviceIssueStatus {
  OPEN = 'OPEN',
  RESOLVED = 'RESOLVED',
}

// Yêu cầu báo hỏng/báo lỗi thiết bị loa thanh toán, có thể kèm 1 ảnh mô tả lỗi.
// LƯU Ý: photoUrl trỏ tới file lưu tạm trong container (xem main.ts) — sẽ mất khi
// container khởi động lại, cần chuyển sang lưu trữ bền vững (Cloudinary/S3) sau.
@Entity('device_issues')
export class DeviceIssue {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Device, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'device_id' })
  device: Device;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'reported_by' })
  reportedBy: User;

  @Column({ type: 'text' })
  description: string;

  @Column({ name: 'photo_url', nullable: true })
  photoUrl?: string;

  @Column({
    type: 'enum',
    enum: DeviceIssueStatus,
    default: DeviceIssueStatus.OPEN,
  })
  status: DeviceIssueStatus;

  @Column({ name: 'created_at', type: 'timestamp', nullable: true })
  createdAt: Date;

  @BeforeInsert()
  setCreatedAt() {
    this.createdAt = getGMT7Date();
  }
}
