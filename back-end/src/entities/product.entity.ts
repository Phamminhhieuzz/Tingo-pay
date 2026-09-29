import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, BeforeInsert, BeforeUpdate } from 'typeorm';
import { getGMT7Date } from '../utils/date-utils';

export enum ProductStatus {
  IN_STOCK = 'IN_STOCK',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
}

export enum ProductCategory {
  SPEAKER = 'SPEAKER',
  PAY_BOX = 'PAY_BOX',
  QR_BOX = 'QR_BOX',
  SIM = 'SIM',
}

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  code: string;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: ProductCategory,
    default: ProductCategory.SPEAKER,
  })
  category: ProductCategory;

  @Column()
  model: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'jsonb', nullable: true })
  spec: any;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  price: number;

  @Column({ name: 'sale_price', type: 'decimal', precision: 12, scale: 2, nullable: true })
  salePrice: number;

  @Column({
    type: 'enum',
    enum: ProductStatus,
    default: ProductStatus.IN_STOCK,
  })
  status: ProductStatus;

  @Column({ name: 'likes_count', default: 0 })
  likesCount: number;

  @Column({ name: 'sold_count', default: 0 })
  soldCount: number;

  @Column({ name: 'is_best_seller', default: false })
  isBestSeller: boolean;

  @Column({ name: 'is_popular', default: false })
  isPopular: boolean;

  // Nhãn ngắn hiển thị dạng chip trên thẻ sản phẩm (VD: "Nhỏ gọn", "4G tốc độ cao")
  @Column({ type: 'text', array: true, nullable: true })
  features: string[];

  @Column({ name: 'image_urls', type: 'text', array: true, nullable: true })
  imageUrls: string[];

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
