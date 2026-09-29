import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { buildVietQr } from './emv-qr';
import { VietQrClient } from './vietqr-client';

export interface CreateQrInput {
  orderCode: string;
  amount: number;
}

// Tạo chuỗi QR thanh toán cho 1 đơn: gọi API VietQR nếu đã cấu hình; nếu không thì chỉ ở chế độ dev
// (ENABLE_DEBUG_PAYMENT=true) mới dựng cục bộ. Production thiếu cấu hình sẽ trả 503 thay vì mã giả.
@Injectable()
export class PaymentQrService {
  constructor(
    private config: ConfigService,
    private client: VietQrClient,
  ) {}

  async createQr({ orderCode, amount }: CreateQrInput): Promise<string> {
    const bankCode = this.config.get<string>('VIETQR_BANK_CODE');
    const bankBin = this.config.get<string>('VIETQR_BANK_BIN');
    const accountNo = this.config.get<string>('VIETQR_BANK_ACCOUNT');
    const accountName = this.config.get<string>('VIETQR_ACCOUNT_NAME');
    if (!bankCode || !bankBin || !accountNo || !accountName) {
      throw new ServiceUnavailableException('Chưa cấu hình tài khoản nhận tiền');
    }

    if (this.client.isConfigured()) {
      // orderId và content đều là mã đơn: callback đối chiếu đơn theo orderId
      return this.client.generateQr({
        bankCode,
        bankAccount: accountNo,
        userBankName: accountName,
        content: orderCode,
        amount,
        orderId: orderCode,
      });
    }

    if (this.config.get<string>('ENABLE_DEBUG_PAYMENT') === 'true') {
      return buildVietQr({ bankBin, accountNo, accountName, amount, content: orderCode });
    }

    throw new ServiceUnavailableException('Thanh toán chuyển khoản tạm thời chưa khả dụng');
  }
}
