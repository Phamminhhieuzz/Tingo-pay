import { OrderStatus, PaymentMethod, PaymentStatus } from '../../entities/order.entity';
import { PaymentsService } from './payments.service';

const order = (over: any = {}) => ({
  id: 'o1',
  code: 'ORD-ABC12345',
  status: OrderStatus.INIT,
  payAmount: '500000.00',
  paymentMethod: PaymentMethod.BANK_QR,
  paymentStatus: PaymentStatus.UNPAID,
  paymentRef: null,
  ...over,
});

// updateResult: kết quả trả về của repo.update() (mô phỏng UPDATE ... WHERE có điều kiện ở DB);
// refetch: bản ghi đọc lại khi affected=0 (tức có ai đó đã đổi trạng thái giữa lúc đọc đầu và lúc UPDATE)
const setup = (byCode: any, updateResult: { affected: number } | Error = { affected: 1 }, refetch?: any) => {
  const repo = {
    findOne: jest.fn(async ({ where }: any) => (where.code !== undefined ? byCode : (refetch ?? null))),
    update: jest.fn(async (..._args: any[]) => {
      if (updateResult instanceof Error) throw updateResult;
      return updateResult;
    }),
  };
  return { service: new PaymentsService(repo as any), repo };
};

const tx = (over: any = {}) => ({ transactionid: 'T1', orderId: 'ORD-ABC12345', amount: 500000, transType: 'C', ...over });

describe('PaymentsService.applyBankTransaction', () => {
  it('đủ điều kiện: UPDATE có điều kiện (không đọc-rồi-ghi), trả id đơn', async () => {
    const { service, repo } = setup(order());
    const res = await service.applyBankTransaction(tx());
    expect(res).toEqual({ ok: true, refId: 'o1' });
    const [criteria, patch] = repo.update.mock.calls[0] as [any, any];
    expect(criteria).toMatchObject({ id: 'o1', paymentStatus: PaymentStatus.UNPAID });
    expect(patch).toMatchObject({ paymentStatus: PaymentStatus.PAID, paymentRef: 'T1' });
    expect(patch.paidAt).toBeInstanceOf(Date);
    expect(repo.findOne).toHaveBeenCalledTimes(1); // không đọc lại khi UPDATE thành công ngay
  });

  it('nhận số tiền dạng chuỗi', async () => {
    const { service } = setup(order());
    expect(await service.applyBankTransaction(tx({ amount: '500000' }))).toMatchObject({ ok: true });
  });

  it.each([499999, 500001, 0, 'abc', undefined])('sai số tiền %p: KHÔNG gọi UPDATE, KHÔNG đánh dấu PAID', async (amount) => {
    const { service, repo } = setup(order());
    const res = await service.applyBankTransaction(tx({ amount }));
    expect(res).toMatchObject({ ok: false, reason: 'AMOUNT_MISMATCH' });
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('cùng transactionid gửi lại cho đơn đã PAID (đọc đầu đã thấy PAID): thành công, không gọi UPDATE', async () => {
    const { service, repo } = setup(order({ paymentStatus: PaymentStatus.PAID, paymentRef: 'T1' }));
    // affected=0 vì điều kiện paymentStatus=UNPAID không khớp — code phải tự đọc lại và nhận ra đã PAID đúng giao dịch
    const res = await service.applyBankTransaction(tx());
    expect(res).toEqual({ ok: true, refId: 'o1' });
  });

  it('race: UPDATE báo affected=0 vì đơn vừa bị huỷ đúng lúc đó — đọc lại thấy CANCELLED, từ chối', async () => {
    const o = order();
    const { service, repo } = setup(o, { affected: 0 }, order({ status: OrderStatus.CANCELLED }));
    const res = await service.applyBankTransaction(tx());
    expect(res).toMatchObject({ ok: false, reason: 'ORDER_CANCELLED' });
    expect(repo.findOne).toHaveBeenCalledTimes(2);
  });

  it('race: UPDATE báo affected=0, đọc lại thấy đã PAID bằng giao dịch khác — từ chối ALREADY_PAID', async () => {
    const { service } = setup(order(), { affected: 0 }, order({ paymentStatus: PaymentStatus.PAID, paymentRef: 'T-KHAC' }));
    const res = await service.applyBankTransaction(tx());
    expect(res).toMatchObject({ ok: false, reason: 'ALREADY_PAID' });
  });

  it('race: nhân viên vừa xác nhận tay (PAID, chưa có mã giao dịch) đúng lúc callback tới — gắn mã giao dịch, trả thành công', async () => {
    const { service, repo } = setup(
      order(),
      { affected: 0 },
      order({ paymentStatus: PaymentStatus.PAID, paymentRef: null }),
    );
    const res = await service.applyBankTransaction(tx());
    expect(res).toEqual({ ok: true, refId: 'o1' });
    // Có gọi update lần 2 để gắn mã giao dịch thật vào cho đơn đã được nhân viên xác nhận tay
    expect(repo.update).toHaveBeenCalledTimes(2);
    expect((repo.update.mock.calls[1] as any[])[1]).toMatchObject({ paymentRef: 'T1' });
  });

  it('đơn đã huỷ: UPDATE không đổi được dòng nào (do điều kiện status<>CANCELLED), từ chối ORDER_CANCELLED', async () => {
    const o = order({ status: OrderStatus.CANCELLED });
    const { service, repo } = setup(o, { affected: 0 }, o);
    const res = await service.applyBankTransaction(tx());
    expect(res).toMatchObject({ ok: false, reason: 'ORDER_CANCELLED' });
    expect(repo.update).toHaveBeenCalledTimes(1);
  });

  it('đơn COD: từ chối NOT_BANK_QR, không gọi UPDATE', async () => {
    const { service, repo } = setup(order({ paymentMethod: PaymentMethod.COD }));
    expect(await service.applyBankTransaction(tx())).toMatchObject({ ok: false, reason: 'NOT_BANK_QR' });
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('giao dịch tiền ra (D): từ chối NOT_CREDIT', async () => {
    const { service } = setup(order());
    expect(await service.applyBankTransaction(tx({ transType: 'D' }))).toMatchObject({ ok: false, reason: 'NOT_CREDIT' });
  });

  it('không có đơn với orderId đó: ORDER_NOT_FOUND', async () => {
    const { service } = setup(null);
    expect(await service.applyBankTransaction(tx())).toMatchObject({ ok: false, reason: 'ORDER_NOT_FOUND' });
  });

  it.each([{ transactionid: undefined }, { orderId: undefined }, { orderId: '' }])('thiếu trường bắt buộc %p: INVALID_REQUEST', async (over) => {
    const { service } = setup(order());
    expect(await service.applyBankTransaction(tx(over))).toMatchObject({ ok: false, reason: 'INVALID_REQUEST' });
  });

  it('2 giao dịch cùng transactionid cho 2 đơn khác nhau chạy song song: UPDATE thứ hai vi phạm unique -> DUPLICATE_TRANSACTION (không phải lỗi 500)', async () => {
    const uniqueViolation = Object.assign(new Error('duplicate key value violates unique constraint'), { code: '23505' });
    const { service, repo } = setup(order({ id: 'o2', code: 'ORD-OTHER' }), uniqueViolation);
    const res = await service.applyBankTransaction(tx({ orderId: 'ORD-OTHER' }));
    expect(res).toMatchObject({ ok: false, reason: 'DUPLICATE_TRANSACTION' });
    expect(repo.findOne).toHaveBeenCalledTimes(1); // không cần đọc lại, lỗi DB đã đủ thông tin
  });

  it('lỗi DB khác (không phải trùng khoá) thì ném ra ngoài, không nuốt thành DUPLICATE_TRANSACTION', async () => {
    const { service } = setup(order(), new Error('connection lost'));
    await expect(service.applyBankTransaction(tx())).rejects.toThrow('connection lost');
  });
});
