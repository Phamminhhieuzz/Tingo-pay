import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';

// Force redeployment to pick up new /products route

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Ảnh báo hỏng thiết bị được lưu tạm trong container ở thư mục uploads/ và phục vụ tĩnh
  // qua /uploads/... LƯU Ý: đây là lưu trữ tạm — ảnh sẽ MẤT khi container khởi động lại/deploy
  // lại. Cần chuyển sang lưu trữ bền vững (Cloudinary/S3) trước khi lên production thật.
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads' });

  // Enable CORS for Zalo Mini App
  app.enableCors({
    origin: true, // Allow any origin to reflect back in Access-Control-Allow-Origin
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders:
      'Content-Type, Accept, Authorization, access_token, secret_key, X-ZEvent-Signature',
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
