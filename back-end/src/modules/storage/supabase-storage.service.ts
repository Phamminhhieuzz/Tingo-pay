import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import WebSocket from 'ws';

// Kiểu file tối thiểu cần dùng, khớp với Express.Multer.File khi dùng memoryStorage (có buffer)
export interface UploadableFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
}

// Upload ảnh lên Supabase Storage (thay cho lưu tạm trên ổ đĩa container, mất khi redeploy).
// Chưa cấu hình đủ biến môi trường thì báo lỗi rõ ràng thay vì âm thầm bỏ qua ảnh.
@Injectable()
export class SupabaseStorageService {
  private readonly logger = new Logger(SupabaseStorageService.name);
  private client: SupabaseClient | null = null;

  constructor(private config: ConfigService) {}

  isConfigured(): boolean {
    return Boolean(
      this.config.get<string>('SUPABASE_URL') &&
        this.config.get<string>('SUPABASE_SERVICE_ROLE_KEY') &&
        this.config.get<string>('SUPABASE_BUCKET'),
    );
  }

  private getClient(): SupabaseClient {
    if (!this.client) {
      this.client = createClient(
        this.config.get<string>('SUPABASE_URL')!,
        this.config.get<string>('SUPABASE_SERVICE_ROLE_KEY')!,
        // Ta chỉ dùng Storage, không dùng Realtime, nhưng supabase-js luôn khởi tạo RealtimeClient
        // ngay khi tạo client — Node 20 (chưa có WebSocket sẵn) sẽ lỗi nếu không tự cấp transport
        { realtime: { transport: WebSocket as any } },
      );
    }
    return this.client;
  }

  async uploadImage(file: UploadableFile): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('Chưa cấu hình lưu trữ ảnh (SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY/SUPABASE_BUCKET)');
    }
    if (!file?.buffer) {
      throw new Error('Thiếu dữ liệu file (cần dùng memoryStorage cho multer)');
    }

    const bucket = this.config.get<string>('SUPABASE_BUCKET')!;
    const ext = (file.originalname.split('.').pop() || 'jpg').toLowerCase();
    const path = `${Date.now()}-${Math.round(Math.random() * 1e9)}.${ext}`;

    const { error } = await this.getClient()
      .storage.from(bucket)
      .upload(path, file.buffer, { contentType: file.mimetype, upsert: false });
    if (error) {
      this.logger.error(`Upload ảnh lên Supabase thất bại: ${error.message}`);
      throw new Error(error.message);
    }

    const { data } = this.getClient().storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  }
}
