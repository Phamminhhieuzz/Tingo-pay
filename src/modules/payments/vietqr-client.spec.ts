import { BadGatewayException } from '@nestjs/common';
import { VietQrClient } from './vietqr-client';

const cfg = (over: Record<string, string | undefined> = {}) =>
  ({
    get: (k: string) =>
      ({ VIETQR_API_BASE: 'https://vietqr.test', VIETQR_BASIC_AUTH: 'BASIC-TEST', ...over })[k],
  }) as any;

const params = {
  bankCode: 'MB',
  bankAccount: '0123456789',
  userBankName: 'TINGO TEST',
  content: 'ORD-ABC12345',
  amount: 500000,
  orderId: 'ORD-ABC12345',
};

const jsonRes = (status: number, body: unknown) =>
  ({ ok: status >= 200 && status < 300, status, json: async () => body }) as any;

afterEach(() => jest.restoreAllMocks());

describe('VietQrClient', () => {
  it('isConfigured chỉ true khi có cả địa chỉ API và Basic Auth', () => {
    expect(new VietQrClient(cfg()).isConfigured()).toBe(true);
    expect(new VietQrClient(cfg({ VIETQR_BASIC_AUTH: undefined })).isConfigured()).toBe(false);
    expect(new VietQrClient(cfg({ VIETQR_API_BASE: '' })).isConfigured()).toBe(false);
  });

  it('lấy token bằng Basic rồi gọi generate-customer với Bearer, qrType 0', async () => {
    const fetchMock = jest
      .spyOn(global, 'fetch')
      .mockResolvedValueOnce(jsonRes(200, { access_token: 'TKN', expires_in: 300 }))
      .mockResolvedValueOnce(jsonRes(200, { qrCode: 'EMV-STRING' }));
    const qr = await new VietQrClient(cfg()).generateQr(params);
    expect(qr).toBe('EMV-STRING');

    const [tokenUrl, tokenInit] = fetchMock.mock.calls[0] as [string, any];
    expect(tokenUrl).toBe('https://vietqr.test/vqr/api/token_generate');
    expect(tokenInit.headers.Authorization).toBe('Basic BASIC-TEST');

    const [genUrl, genInit] = fetchMock.mock.calls[1] as [string, any];
    expect(genUrl).toBe('https://vietqr.test/vqr/api/qr/generate-customer');
    expect(genInit.headers.Authorization).toBe('Bearer TKN');
    expect(JSON.parse(genInit.body)).toMatchObject({ qrType: 0, transType: 'C', amount: 500000, orderId: 'ORD-ABC12345' });
  });

  it('dùng lại token còn hạn cho lần gọi sau', async () => {
    const fetchMock = jest
      .spyOn(global, 'fetch')
      .mockResolvedValueOnce(jsonRes(200, { access_token: 'TKN', expires_in: 300 }))
      .mockResolvedValue(jsonRes(200, { qrCode: 'EMV' }));
    const client = new VietQrClient(cfg());
    await client.generateQr(params);
    await client.generateQr(params);
    expect(fetchMock).toHaveBeenCalledTimes(3); // 1 token + 2 generate
  });

  it('VietQR trả lỗi hoặc thiếu qrCode thì báo 502 và không lộ nội dung phản hồi', async () => {
    jest
      .spyOn(global, 'fetch')
      .mockResolvedValueOnce(jsonRes(200, { access_token: 'TKN', expires_in: 300 }))
      .mockResolvedValueOnce(jsonRes(200, { error: 'E34', secret: 'LEAK' }));
    await expect(new VietQrClient(cfg()).generateQr(params)).rejects.toThrow(BadGatewayException);
  });

  it('lấy token thất bại thì báo 502', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValueOnce(jsonRes(401, {}));
    await expect(new VietQrClient(cfg()).generateQr(params)).rejects.toThrow(BadGatewayException);
  });

  it.each([
    ['content dài quá 23 ký tự', { content: 'A'.repeat(24) }],
    ['orderId dài quá 13 ký tự', { orderId: 'ORD-1234567890' }],
    ['content có dấu', { content: 'Đơn hàng' }],
  ])('chặn trước khi gọi mạng: %s', async (_name, over) => {
    const fetchMock = jest.spyOn(global, 'fetch');
    await expect(new VietQrClient(cfg()).generateQr({ ...params, ...over })).rejects.toThrow(
      'Nội dung hoặc mã đơn không hợp lệ với VietQR',
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
