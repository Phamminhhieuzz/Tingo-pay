import { BadRequestException, Body, Controller, Headers, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import type { BankTransaction } from './payments.service';
import { VietQrCallbackAuthService } from './vietqr-callback-auth.service';

// Hai endpoint do VietQR gọi vào (khai báo trong hồ sơ merchant). Không dùng JWT người dùng.
@Controller()
export class VietQrCallbackController {
  constructor(
    private readonly auth: VietQrCallbackAuthService,
    private readonly payments: PaymentsService,
  ) {}

  @Post('api/token_generate')
  @HttpCode(HttpStatus.OK)
  tokenGenerate(@Headers('authorization') authorization?: string) {
    return this.auth.issueToken(authorization);
  }

  @Post('bank/api/transaction-sync')
  @HttpCode(HttpStatus.OK)
  async transactionSync(@Headers('authorization') authorization: string | undefined, @Body() body: BankTransaction) {
    this.auth.verifyBearer(authorization);
    const result = await this.payments.applyBankTransaction(body);
    if (result.ok) {
      return { error: false, errorReason: null, toastMessage: 'Success', object: { reftransactionid: result.refId } };
    }
    throw new BadRequestException({ error: true, errorReason: result.reason, toastMessage: result.message, object: null });
  }
}
