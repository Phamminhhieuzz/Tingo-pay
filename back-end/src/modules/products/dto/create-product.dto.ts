import { IsString, IsEnum, IsOptional, IsNumber, IsArray, IsBoolean, IsJSON } from 'class-validator';
import { ProductCategory, ProductStatus } from '../../../entities/product.entity';

export class CreateProductDto {
  @IsString()
  code: string;

  @IsString()
  name: string;

  @IsEnum(ProductCategory)
  @IsOptional()
  category?: ProductCategory;

  @IsString()
  model: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsOptional()
  spec?: any;

  @IsNumber()
  price: number;

  @IsNumber()
  @IsOptional()
  salePrice?: number;

  @IsEnum(ProductStatus)
  @IsOptional()
  status?: ProductStatus;

  @IsBoolean()
  @IsOptional()
  isBestSeller?: boolean;

  @IsBoolean()
  @IsOptional()
  isPopular?: boolean;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  imageUrls?: string[];
}
