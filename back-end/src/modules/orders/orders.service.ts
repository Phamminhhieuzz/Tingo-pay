import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { isUUID } from 'class-validator';
import { Order, OrderStatus, PaymentMethod, PaymentStatus } from '../../entities/order.entity';
import { Product, ProductStatus } from '../../entities/product.entity';
import { User, UserRole } from '../../entities/user.entity';
import { getGMT7Date } from '../../utils/date-utils';
import { canAdvance, canCancel, STAFF_TARGETS } from './order-status';
import { canStartProcessing, staffMarkPaidProblem } from './order-payment';
import { PaymentQrService } from '../payments/payment-qr.service';

export type Actor = { id: string; role: UserRole };

export interface CreateOrderInput {
  productId: string;
  quantity: number;
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  notes?: string;
  paymentMethod?: string;
}

export interface ShippingInput {
  trackingNumber?: string;
  shippingProvider?: string;
}

const MAX_QUANTITY = 99;
const requireText = (value: unknown, message: string): string => {
  if (typeof value !== 'string' || !value.trim()) throw new BadRequestException(message);
  return value.trim();
};

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
    private paymentQr: PaymentQrService,
  ) {}

  // STAFF thấy mọi đơn; người khác (khách, chủ cửa hàng đang là người mua) chỉ thấy đơn của mình
  async findAll(
    actor: Actor,
    page: any = 1,
    limit: any = 10,
    status?: string,
  ): Promise<{ data: Order[]; total: number }> {
    const p = parseInt(page, 10) || 1;
    const l = parseInt(limit, 10) || 10;
    const take = Math.min(l, 25);
    const skip = (p - 1) * take;

    const where: any = {};
    if (actor.role !== UserRole.STAFF) {
      where.customer = { id: actor.id };
    }
    if (status) {
      if (!Object.values(OrderStatus).includes(status as OrderStatus)) {
        throw new BadRequestException('Trạng thái lọc không hợp lệ');
      }
      where.status = status;
    }

    const [data, total] = await this.ordersRepository.findAndCount({
      where,
      relations: ['customer', 'device'],
      order: { orderTime: 'DESC' },
      take,
      skip,
    });
    return { data, total };
  }

  async findOne(id: string): Promise<Order> {
    const order = await this.ordersRepository.findOne({
      where: { id },
      relations: ['customer', 'device'],
    });
    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }
    return order;
  }

  async findOneFor(id: string, actor: Actor): Promise<Order> {
    const order = await this.findOne(id);
    if (actor.role !== UserRole.STAFF && order.customer?.id !== actor.id) {
      throw new ForbiddenException('Bạn không có quyền với đơn hàng này');
    }
    return order;
  }

  // Giá luôn tính ở server từ sản phẩm; body do client gửi chỉ được dùng cho các trường liệt kê dưới
  async create(input: CreateOrderInput, customer: User): Promise<Order> {
    const quantity = Number(input.quantity);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY) {
      throw new BadRequestException(`Số lượng phải là số nguyên từ 1 đến ${MAX_QUANTITY}`);
    }
    const receiverName = requireText(input.receiverName, 'Vui lòng nhập tên người nhận');
    const receiverPhone = requireText(input.receiverPhone, 'Vui lòng nhập số điện thoại người nhận');
    const receiverAddress = requireText(input.receiverAddress, 'Vui lòng nhập địa chỉ nhận hàng');
    if (!isUUID(input.productId)) {
      throw new BadRequestException('Mã sản phẩm không hợp lệ');
    }
    const paymentMethod = input.paymentMethod ?? PaymentMethod.COD;
    if (!Object.values(PaymentMethod).includes(paymentMethod as PaymentMethod)) {
      throw new BadRequestException('Phương thức thanh toán không hợp lệ');
    }

    const product = await this.productsRepository.findOne({ where: { id: input.productId } });
    if (!product) {
      throw new NotFoundException('Không tìm thấy sản phẩm');
    }
    if (product.status !== ProductStatus.IN_STOCK) {
      throw new BadRequestException('Sản phẩm đã hết hàng');
    }

    const unitPrice = Number(product.price);
    const totalAmount = unitPrice * quantity;
    const order = this.ordersRepository.create({
      code: `ORD-${Date.now().toString(36).toUpperCase()}`,
      productName: product.name,
      quantity,
      unitPrice,
      totalAmount,
      discountAmount: 0,
      payAmount: totalAmount,
      receiverName,
      receiverPhone,
      receiverAddress,
      notes: typeof input.notes === 'string' ? input.notes.trim() || undefined : undefined,
      status: OrderStatus.INIT,
      customer,
      paymentMethod: paymentMethod as PaymentMethod,
      paymentStatus: PaymentStatus.UNPAID,
    });
    if (order.paymentMethod === PaymentMethod.BANK_QR) {
      // Tạo mã lỗi thì ném lỗi ra ngoài trước khi lưu, để khách không có đơn "treo" không thanh toán được
      order.paymentQr = await this.paymentQr.createQr({ orderCode: order.code, amount: totalAmount });
    }
    return this.ordersRepository.save(order);
  }

  // Nhân viên Tingo đẩy đơn sang bước kế tiếp; bước giao hàng bắt buộc có thông tin vận chuyển
  async advance(id: string, target: OrderStatus, shipping: ShippingInput = {}): Promise<Order> {
    if (!STAFF_TARGETS.includes(target)) {
      throw new BadRequestException('Nhân viên chỉ được chuyển sang Đang xử lý, Đang giao hoặc Đã giao');
    }
    const order = await this.findOne(id);
    if (!canAdvance(order.status, target)) {
      throw new BadRequestException(`Không thể chuyển đơn từ ${order.status} sang ${target}`);
    }
    if (target === OrderStatus.PROCESSING && !canStartProcessing(order)) {
      throw new BadRequestException('Đơn chuyển khoản chưa được thanh toán');
    }
    if (target === OrderStatus.SHIPPING) {
      order.shippingProvider = requireText(shipping.shippingProvider, 'Vui lòng nhập đơn vị vận chuyển');
      order.trackingNumber = requireText(shipping.trackingNumber, 'Vui lòng nhập mã vận đơn');
    }
    if (target === OrderStatus.DELIVERED) {
      order.deliveryTime = getGMT7Date();
    }
    order.status = target;
    return this.ordersRepository.save(order);
  }

  async confirmReceived(id: string, actor: Actor): Promise<Order> {
    const order = await this.findOneFor(id, actor);
    if (order.status !== OrderStatus.DELIVERED) {
      throw new BadRequestException('Chỉ xác nhận nhận hàng khi đơn đã giao');
    }
    order.status = OrderStatus.COMPLETED;
    return this.ordersRepository.save(order);
  }

  async cancel(id: string, actor: Actor): Promise<Order> {
    const order = await this.findOneFor(id, actor);
    if (!canCancel(order.status)) {
      throw new BadRequestException('Không thể huỷ đơn đã giao đi hoặc đã hoàn tất');
    }
    if (order.paymentMethod === PaymentMethod.BANK_QR && order.paymentStatus === PaymentStatus.PAID) {
      // Hoàn tiền không tự động (ngoài phạm vi hiện tại) — ghi log để nhân viên biết mà xử lý tay
      this.logger.warn(`Huỷ đơn ${order.code} đã thanh toán chuyển khoản — cần hoàn tiền thủ công`);
    }
    order.status = OrderStatus.CANCELLED;
    return this.ordersRepository.save(order);
  }

  // Nhân viên đánh dấu đã nhận tiền: COD sau khi giao, hoặc đơn chuyển khoản khi callback không tới
  async markPaidByStaff(id: string, staffId: string): Promise<Order> {
    const order = await this.findOne(id);
    const problem = staffMarkPaidProblem(order);
    if (problem) throw new BadRequestException(problem);
    order.paymentStatus = PaymentStatus.PAID;
    order.paidAt = getGMT7Date();
    order.paidBy = staffId;
    return this.ordersRepository.save(order);
  }

  // Chỉ để dev: giả lập VietQR báo tiền vào (controller bọc bằng DebugPaymentGuard)
  async devMarkPaid(id: string, actor: Actor): Promise<Order> {
    const order = await this.findOneFor(id, actor);
    if (order.paymentMethod !== PaymentMethod.BANK_QR || order.paymentStatus !== PaymentStatus.UNPAID) {
      throw new BadRequestException('Chỉ giả lập cho đơn chuyển khoản chưa thanh toán');
    }
    order.paymentStatus = PaymentStatus.PAID;
    order.paidAt = getGMT7Date();
    order.paymentRef = `DEV-${Date.now()}`;
    return this.ordersRepository.save(order);
  }
}
