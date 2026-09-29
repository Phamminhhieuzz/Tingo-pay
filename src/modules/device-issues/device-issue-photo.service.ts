import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import { SupabaseStorageService, UploadableFile } from '../storage/supabase-storage.service';

const LOCAL_DIR = './uploads/device-issues';

// Lưu ảnh báo hỏng thiết bị: dùng Supabase Storage nếu đã cấu hình (bền vững, có URL công khai);
// chưa cấu hình thì lưu tạm ra ổ đĩa container như trước (chỉ để dev, mất khi container khởi động lại).
@Injectable()
export class DeviceIssuePhotoService {
  constructor(private storage: SupabaseStorageService) {}

  async save(file: UploadableFile): Promise<string> {
    if (this.storage.isConfigured()) {
      return this.storage.uploadImage(file);
    }

    await fs.promises.mkdir(LOCAL_DIR, { recursive: true });
    const ext = (file.originalname.split('.').pop() || 'jpg').toLowerCase();
    const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}.${ext}`;
    await fs.promises.writeFile(`${LOCAL_DIR}/${filename}`, file.buffer);
    return `/uploads/device-issues/${filename}`;
  }
}
