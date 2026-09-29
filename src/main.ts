import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { join } from 'path';
import { AppModule } from './app.module';

// Force redeployment to pick up new /products route

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Header bảo mật HTTP cơ bản (HSTS, X-Content-Type-Options, chặn clickjacking...)
  app.use(helmet());

  // Validate/transform toàn bộ request body theo DTO (class-validator) — trước đây thiếu dòng
  // này nên các decorator @IsString/@IsEnum... trên DTO không có tác dụng gì, API nhận dữ liệu
  // tuỳ ý không kiểm tra. whitelist: true tự loại field lạ không khai báo trong DTO.
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Ảnh báo hỏng thiết bị được lưu tạm trong container ở thư mục uploads/ và phục vụ tĩnh
  // qua /uploads/... LƯU Ý: đây là lưu trữ tạm — ảnh sẽ MẤT khi container khởi động lại/deploy
  // lại. Cần chuyển sang lưu trữ bền vững (Cloudinary/S3) trước khi lên production thật.
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads' });

  // Enable CORS for Zalo Mini App — origin: true vì webview Zalo không có domain cố định.
  // credentials tắt vì API chỉ xác thực qua Authorization: Bearer, không dùng cookie — bật
  // credentials cùng lúc với origin phản xạ tuỳ ý là tổ hợp rủi ro không cần thiết ở đây.
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders:
      'Content-Type, Accept, Authorization, access_token, secret_key, X-ZEvent-Signature',
    credentials: false,
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
