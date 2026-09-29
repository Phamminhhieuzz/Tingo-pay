import { BadGatewayException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface GenerateQrParams {
  bankCode: string;
  bankAccount: string;
  userBankName: string;
  content: string;
  amount: number;
  orderId: string;
}

// Giới hạn của API generate-customer: content ≤ 23 ký tự, orderId ≤ 13, chỉ ASCII chữ/số/khoảng trắng/gạch
const CONTENT_MAX = 23;
const ORDER_ID_MAX = 13;
const SAFE_TEXT = /^[A-Za-z0-9 _-]+$/;

// Chiều GỌI RA VietQR: lấy token rồi tạo mã QR động. Không bao giờ log token/Basic Auth/phản hồi thô.
@Injectable()
export class VietQrClient {
  private readonly logger = new Logger(VietQrClient.name);
  private token: { value: string; expiresAt: number } | null = null;

  constructor(private config: ConfigService) {}

  isConfigured(): boolean {
    return Boolean(this.config.get<string>('VIETQR_API_BASE') && this.config.get<string>('VIETQR_BASIC_AUTH'));
  }

  private get base(): string {
    return (this.config.get<string>('VIETQR_API_BASE') || '').replace(/\/+$/, '');
  }

  // Đường dẫn lấy token của chiều gọi ra chưa có trong tài liệu công khai: cho phép đổi bằng biến môi trường
  private async getToken(): Promise<string> {
    if (this.token && this.token.expiresAt > Date.now() + 10_000) return this.token.value;

    const path = this.config.get<string>('VIETQR_TOKEN_PATH') || '/vqr/api/token_generate';
    const res = await fetch(`${this.base}${path}`, {
      method: 'POST',
      headers: { Authorization: `Basic ${this.config.get<string>('VIETQR_BASIC_AUTH')}` },
    });
    const body: any = await res.json().catch(() => null);
    if (!res.ok || !body?.access_token) {
      this.logger.error(`Lấy token VietQR thất bại (HTTP ${res.status})`);
      throw new BadGatewayException('Không kết nối được cổng thanh toán');
    }
    const ttlMs = (Number(body.expires_in) || 300) * 1000;
    this.token = { value: body.access_token, expiresAt: Date.now() + ttlMs };
    return this.token.value;
  }

  async generateQr(p: GenerateQrParams): Promise<string> {
    if (
      p.content.length > CONTENT_MAX ||
      p.orderId.length > ORDER_ID_MAX ||
      !SAFE_TEXT.test(p.content) ||
      !SAFE_TEXT.test(p.orderId)
    ) {
      throw new Error('Nội dung hoặc mã đơn không hợp lệ với VietQR');
    }

    const token = await this.getToken();
    const res = await fetch(`${this.base}/vqr/api/qr/generate-customer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        bankCode: p.bankCode,
        bankAccount: p.bankAccount,
        userBankName: p.userBankName,
        content: p.content,
        qrType: 0,
        amount: p.amount,
        orderId: p.orderId,
        transType: 'C',
      }),
    });
    const body: any = await res.json().catch(() => null);
    if (!res.ok || !body?.qrCode) {
      this.logger.error(`Tạo mã VietQR thất bại (HTTP ${res.status})`);
      throw new BadGatewayException('Không tạo được mã thanh toán');
    }
    return body.qrCode as string;
  }
}
