import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { Order, OrderStatus, PaymentMethod, PaymentStatus } from '../../entities/order.entity';
import { getGMT7Date } from '../../utils/date-utils';

export interface BankTransaction {
  transactionid?: string;
  orderId?: string;
  amount?: number | string;
  transType?: string;
}

export type ApplyResult = { ok: true; refId: string } | { ok: false; reason: string; message: string };

// Áp giao dịch "tiền vào" do VietQR báo lên đơn. Chỉ đánh dấu PAID khi mọi điều kiện đều đúng;
// mọi trường hợp lệch (sai tiền, đơn huỷ, trùng...) đều bị từ chối và ghi log để nhân viên xử lý tay.
@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,
  ) {}

  async applyBankTransaction(tx: BankTransaction): Promise<ApplyResult> {
    if (!tx?.transactionid || !tx.orderId) {
      return this.reject('INVALID_REQUEST', 'Thiếu transactionid hoặc orderId');
    }
    const transactionId = String(tx.transactionid);
    const orderCode = String(tx.orderId);

    const order = await this.ordersRepository.findOne({ where: { code: orderCode } });
    if (!order) return this.reject('ORDER_NOT_FOUND', 'Không tìm thấy đơn hàng', { orderCode, transactionId });
    if (order.paymentMethod !== PaymentMethod.BANK_QR) {
      return this.reject('NOT_BANK_QR', 'Đơn hàng không thanh toán bằng chuyển khoản', { orderCode, transactionId });
    }
    if (tx.transType !== 'C') return this.reject('NOT_CREDIT', 'Không phải giao dịch tiền vào', { orderCode, transactionId });
    if (Number(tx.amount) !== Number(order.payAmount)) {
      return this.reject('AMOUNT_MISMATCH', 'Số tiền không khớp với đơn hàng', {
        orderCode,
        transactionId,
        amount: tx.amount,
        expected: order.payAmount,
      });
    }

    // Cập nhật có điều kiện ngay tại DB (không đọc-rồi-ghi): tránh mất dữ liệu khi callback này chạy
    // song song với việc huỷ đơn hoặc một giao dịch khác cho cùng đơn — cả hai trường hợp đều làm điều
    // kiện WHERE không khớp và affected=0, khi đó ta đọc lại để biết chính xác điều gì đã xảy ra.
    let result: { affected?: number | null };
    try {
      result = await this.ordersRepository.update(
        { id: order.id, paymentStatus: PaymentStatus.UNPAID, status: Not(OrderStatus.CANCELLED) },
        { paymentStatus: PaymentStatus.PAID, paidAt: getGMT7Date(), paymentRef: transactionId },
      );
    } catch (err: any) {
      if (this.isUniqueViolation(err)) {
        return this.reject('DUPLICATE_TRANSACTION', 'Giao dịch đã được ghi nhận cho đơn khác', { orderCode, transactionId });
      }
      throw err;
    }
    if (result.affected && result.affected > 0) {
      return { ok: true, refId: order.id };
    }

    const current = await this.ordersRepository.findOne({ where: { id: order.id } });
    if (!current) return this.reject('ORDER_NOT_FOUND', 'Không tìm thấy đơn hàng', { orderCode, transactionId });

    if (current.status === OrderStatus.CANCELLED) {
      return this.reject('ORDER_CANCELLED', 'Đơn hàng đã huỷ', { orderCode, transactionId });
    }
    if (current.paymentStatus === PaymentStatus.PAID) {
      if (current.paymentRef === transactionId) {
        return { ok: true, refId: current.id };
      }
      // Nhân viên đã xác nhận tay (chưa có mã giao dịch) và callback đến sau: gắn mã giao dịch thật vào
      // thay vì báo lỗi, để không phải xử lý tay 2 lần và VietQR không bị lặp lại vô ích
      if (!current.paymentRef && Number(tx.amount) === Number(current.payAmount)) {
        await this.ordersRepository.update({ id: current.id }, { paymentRef: transactionId });
        return { ok: true, refId: current.id };
      }
      return this.reject('ALREADY_PAID', 'Đơn hàng đã được thanh toán', { orderCode, transactionId });
    }
    // Hiếm gặp: điều kiện đổi vì lý do khác chưa lường trước — an toàn nhất là từ chối để nhân viên kiểm tra tay
    return this.reject('ORDER_NOT_FOUND', 'Không xác định được trạng thái đơn hàng', { orderCode, transactionId });
  }

  private reject(reason: string, message: string, context?: Record<string, unknown>): ApplyResult {
    this.logger.warn(`Từ chối giao dịch ngân hàng (${reason}): ${message}${context ? ' ' + JSON.stringify(context) : ''}`);
    return { ok: false, reason, message };
  }

  private isUniqueViolation(err: any): boolean {
    return err?.code === '23505' || /duplicate key value/i.test(err?.message ?? '');
  }
}
