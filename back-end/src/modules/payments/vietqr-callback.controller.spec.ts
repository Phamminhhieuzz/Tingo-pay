import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { VietQrCallbackController } from './vietqr-callback.controller';

const make = () => {
  const auth = { issueToken: jest.fn().mockReturnValue({ access_token: 'T', token_type: 'Bearer', expires_in: 300 }), verifyBearer: jest.fn() };
  const payments = { applyBankTransaction: jest.fn() };
  return { controller: new VietQrCallbackController(auth as any, payments as any), auth, payments };
};

describe('VietQrCallbackController', () => {
  it('token_generate chuyển header Authorization cho auth service', () => {
    const { controller, auth } = make();
    expect(controller.tokenGenerate('Basic abc')).toEqual({ access_token: 'T', token_type: 'Bearer', expires_in: 300 });
    expect(auth.issueToken).toHaveBeenCalledWith('Basic abc');
  });

  it('transaction-sync thành công trả đúng định dạng VietQR', async () => {
    const { controller, payments } = make();
    payments.applyBankTransaction.mockResolvedValue({ ok: true, refId: 'o1' });
    expect(await controller.transactionSync('Bearer T', { transactionid: 'T1' })).toEqual({
      error: false,
      errorReason: null,
      toastMessage: 'Success',
      object: { reftransactionid: 'o1' },
    });
  });

  it('transaction-sync bị từ chối trả HTTP 400 với body lỗi đúng định dạng', async () => {
    const { controller, payments } = make();
    payments.applyBankTransaction.mockResolvedValue({ ok: false, reason: 'AMOUNT_MISMATCH', message: 'Số tiền không khớp' });
    const err: any = await controller.transactionSync('Bearer T', {}).catch((e) => e);
    expect(err).toBeInstanceOf(BadRequestException);
    expect(err.getResponse()).toEqual({ error: true, errorReason: 'AMOUNT_MISMATCH', toastMessage: 'Số tiền không khớp', object: null });
  });

  it('token sai thì không đụng tới đơn hàng', async () => {
    const { controller, auth, payments } = make();
    auth.verifyBearer.mockImplementation(() => {
      throw new UnauthorizedException();
    });
    await expect(controller.transactionSync('Bearer sai', {})).rejects.toThrow(UnauthorizedException);
    expect(payments.applyBankTransaction).not.toHaveBeenCalled();
  });
});
