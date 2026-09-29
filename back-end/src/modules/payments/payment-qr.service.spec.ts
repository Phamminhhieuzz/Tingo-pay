import { ServiceUnavailableException } from '@nestjs/common';
import { PaymentQrService } from './payment-qr.service';

const account = {
  VIETQR_BANK_CODE: 'MB',
  VIETQR_BANK_BIN: '970422',
  VIETQR_BANK_ACCOUNT: '0123456789',
  VIETQR_ACCOUNT_NAME: 'TINGO TEST',
};

const make = (env: Record<string, string | undefined>, configured: boolean) => {
  const client = { isConfigured: jest.fn().mockReturnValue(configured), generateQr: jest.fn().mockResolvedValue('VIETQR-EMV') };
  const service = new PaymentQrService({ get: (k: string) => env[k] } as any, client as any);
  return { service, client };
};

describe('PaymentQrService.createQr', () => {
  const input = { orderCode: 'ORD-ABC12345', amount: 500000 };

  it('có cấu hình VietQR: gọi API, orderId và content đều là mã đơn', async () => {
    const { service, client } = make({ ...account }, true);
    expect(await service.createQr(input)).toBe('VIETQR-EMV');
    expect(client.generateQr).toHaveBeenCalledWith({
      bankCode: 'MB',
      bankAccount: '0123456789',
      userBankName: 'TINGO TEST',
      content: 'ORD-ABC12345',
      amount: 500000,
      orderId: 'ORD-ABC12345',
    });
  });

  it('chưa có VietQR nhưng bật ENABLE_DEBUG_PAYMENT: dựng mã cục bộ đúng số tiền và nội dung', async () => {
    const { service, client } = make({ ...account, ENABLE_DEBUG_PAYMENT: 'true' }, false);
    const qr = await service.createQr(input);
    expect(client.generateQr).not.toHaveBeenCalled();
    expect(qr.startsWith('000201')).toBe(true);
    expect(qr).toContain('5406500000');
    expect(qr).toContain('0812ORD-ABC12345');
  });

  it('chưa có VietQR và không bật dev: 503, không dựng mã giả', async () => {
    const { service } = make({ ...account }, false);
    await expect(service.createQr(input)).rejects.toThrow(ServiceUnavailableException);
  });

  it('thiếu tài khoản nhận tiền: 503 dù VietQR đã cấu hình', async () => {
    const { service } = make({ ...account, VIETQR_BANK_ACCOUNT: undefined }, true);
    await expect(service.createQr(input)).rejects.toThrow(ServiceUnavailableException);
  });
});
