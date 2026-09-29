import * as fs from 'fs';
import { DeviceIssuePhotoService } from './device-issue-photo.service';

const file = () => ({ buffer: Buffer.from('fake'), originalname: 'a.png', mimetype: 'image/png' });

describe('DeviceIssuePhotoService.save', () => {
  it('Supabase đã cấu hình: dùng luôn, trả về URL Supabase', async () => {
    const storage = { isConfigured: () => true, uploadImage: jest.fn().mockResolvedValue('https://x.supabase.co/storage/v1/object/public/device-issues/a.png') };
    const service = new DeviceIssuePhotoService(storage as any);
    const url = await service.save(file() as any);
    expect(url).toBe('https://x.supabase.co/storage/v1/object/public/device-issues/a.png');
    expect(storage.uploadImage).toHaveBeenCalledWith(file());
  });

  it('Chưa cấu hình Supabase: lưu tạm ra ổ đĩa, trả về đường dẫn /uploads/...', async () => {
    const storage = { isConfigured: () => false, uploadImage: jest.fn() };
    const service = new DeviceIssuePhotoService(storage as any);
    const url = await service.save(file() as any);
    expect(url).toMatch(/^\/uploads\/device-issues\/.+\.png$/);
    expect(storage.uploadImage).not.toHaveBeenCalled();
    const written = fs.readFileSync('.' + url);
    expect(written.toString()).toBe('fake');
    fs.unlinkSync('.' + url);
  });
});
