import { SupabaseStorageService } from './supabase-storage.service';

const env = (over: Record<string, string | undefined> = {}) =>
  ({
    get: (k: string) =>
      ({
        SUPABASE_URL: 'https://ncrpwsfigbkavcsjogbo.supabase.co',
        SUPABASE_SERVICE_ROLE_KEY: 'anon-key-test',
        SUPABASE_BUCKET: 'device-issues',
        ...over,
      })[k],
  }) as any;

const file = () => ({
  buffer: Buffer.from('fake-image-bytes'),
  originalname: 'loi-thiet-bi.png',
  mimetype: 'image/png',
});

describe('SupabaseStorageService.isConfigured', () => {
  it('true khi có đủ URL, key và bucket', () => {
    expect(new SupabaseStorageService(env()).isConfigured()).toBe(true);
  });

  it.each(['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_BUCKET'])('false khi thiếu %s', (key) => {
    expect(new SupabaseStorageService(env({ [key]: undefined })).isConfigured()).toBe(false);
  });
});

describe('SupabaseStorageService.uploadImage', () => {
  it('chưa cấu hình: ném lỗi rõ ràng, không gọi Supabase', async () => {
    const service = new SupabaseStorageService(env({ SUPABASE_URL: undefined }));
    await expect(service.uploadImage(file() as any)).rejects.toThrow('Chưa cấu hình lưu trữ ảnh');
  });

  it('upload thành công: gọi đúng bucket, trả về publicUrl, tên file có đuôi khớp ảnh gốc', async () => {
    const upload = jest.fn().mockResolvedValue({ data: { path: 'device-issues/some-path.png' }, error: null });
    const getPublicUrl = jest.fn().mockReturnValue({ data: { publicUrl: 'https://ncrpwsfigbkavcsjogbo.supabase.co/storage/v1/object/public/device-issues/some-path.png' } });
    const from = jest.fn().mockReturnValue({ upload, getPublicUrl });
    const service = new SupabaseStorageService(env());
    (service as any).client = { storage: { from } };
    const f = file();

    const url = await service.uploadImage(f as any);

    expect(from).toHaveBeenCalledWith('device-issues');
    expect(upload.mock.calls[0][0]).toMatch(/\.png$/);
    expect(upload.mock.calls[0][1]).toBe(f.buffer);
    expect(upload.mock.calls[0][2]).toMatchObject({ contentType: 'image/png' });
    expect(url).toBe('https://ncrpwsfigbkavcsjogbo.supabase.co/storage/v1/object/public/device-issues/some-path.png');
  });

  it('Supabase trả lỗi: ném lỗi kèm thông điệp gốc, không nuốt lỗi', async () => {
    const upload = jest.fn().mockResolvedValue({ data: null, error: { message: 'Bucket not found' } });
    const from = jest.fn().mockReturnValue({ upload });
    const service = new SupabaseStorageService(env());
    (service as any).client = { storage: { from } };

    await expect(service.uploadImage(file() as any)).rejects.toThrow('Bucket not found');
  });

  it('từ chối file không có buffer (chưa cấu hình memoryStorage đúng)', async () => {
    const service = new SupabaseStorageService(env());
    await expect(service.uploadImage({ originalname: 'a.png', mimetype: 'image/png' } as any)).rejects.toThrow(
      'Thiếu dữ liệu file',
    );
  });
});
