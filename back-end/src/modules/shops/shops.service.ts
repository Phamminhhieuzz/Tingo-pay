import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Shop } from '../../entities/shop.entity';
import { User, UserRole } from '../../entities/user.entity';
import { Transaction, TransactionStatus } from '../../entities/transaction.entity';
import { DeviceOpStatus } from '../../entities/device.entity';
import { ShopStaff, ShopRole } from '../../entities/shop-staff.entity';
import { getGMT7Date } from '../../utils/date-utils';

@Injectable()
export class ShopsService {
  constructor(
    @InjectRepository(Shop)
    private shopsRepository: Repository<Shop>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Transaction)
    private transactionsRepository: Repository<Transaction>,
    @InjectRepository(ShopStaff)
    private shopStaffRepository: Repository<ShopStaff>,
  ) {}

  async findAll(ownerId?: string): Promise<Shop[]> {
    if (ownerId) {
      return this.shopsRepository.find({
        where: { owner: { id: ownerId } },
        relations: ['owner', 'staffRoles', 'staffRoles.user'],
      });
    }
    return this.shopsRepository.find({ relations: ['owner', 'staffRoles', 'staffRoles.user'] });
  }

  async getDashboard(ownerId?: string, search?: string): Promise<any[]> {
    const query = this.shopsRepository.createQueryBuilder('shop')
      .leftJoinAndSelect('shop.owner', 'owner')
      .leftJoinAndSelect('shop.devices', 'devices')
      .leftJoinAndSelect('shop.staffRoles', 'staffRoles')
      .leftJoinAndSelect('staffRoles.user', 'staffUser');

    if (ownerId) {
      query.where('shop.owner_id = :ownerId', { ownerId });
    }

    if (search) {
      query.andWhere('(shop.name ILIKE :search OR shop.code ILIKE :search)', { search: `%${search}%` });
    }

    const shops = await query.getMany();

    const now = getGMT7Date();
    const today = new Date(now);
    today.setUTCHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setUTCDate(today.getUTCDate() + 1);

    const enrichedShops = await Promise.all(shops.map(async (shop) => {
      const todayTransactions = await this.transactionsRepository.find({
        where: { shop: { id: shop.id }, status: TransactionStatus.SUCCESS, time: Between(today, tomorrow) }
      });
      const todayRevenue = todayTransactions.reduce((acc, t) => acc + Number(t.amount), 0);

      const onlineDevicesCount = shop.devices ? shop.devices.filter(d => d.opStatus === DeviceOpStatus.ONLINE).length : 0;
      const offlineDevicesCount = shop.devices ? shop.devices.filter(d => d.opStatus === DeviceOpStatus.OFFLINE).length : 0;

      return {
        ...shop,
        stats: {
          todayRevenue,
          onlineDevicesCount,
          offlineDevicesCount
        }
      };
    }));

    return enrichedShops;
  }

  async findOne(id: string): Promise<Shop> {
    const shop = await this.shopsRepository.findOne({
      where: { id },
      relations: ['owner', 'staffRoles', 'staffRoles.user', 'devices', 'bankAccounts'],
    });
    if (!shop) {
      throw new NotFoundException(`Shop with ID ${id} not found`);
    }
    return shop;
  }

  async create(shopData: Partial<Shop>, owner: User): Promise<Shop> {
    const shop = this.shopsRepository.create({
      ...shopData,
      owner,
      createdBy: owner.id,
    });
    const savedShop = await this.shopsRepository.save(shop);

    // Swap CUSTOMER to SHOP_OWNER if applicable
    if (!owner.roles.includes(UserRole.SHOP_OWNER)) {
      const newRoles = owner.roles.filter(role => role !== UserRole.CUSTOMER);
      newRoles.push(UserRole.SHOP_OWNER);
      await this.usersRepository.update(owner.id, { roles: newRoles });
    }

    return savedShop;
  }

  async update(id: string, shopData: Partial<Shop>): Promise<Shop> {
    const shop = await this.findOne(id);
    const updatedShop = Object.assign(shop, shopData);
    return this.shopsRepository.save(updatedShop);
  }

  async addStaff(shopId: string, userId: string, role: ShopRole = ShopRole.SHOP_STAFF): Promise<ShopStaff> {
    const shop = await this.findOne(shopId);
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    
    let shopStaff = await this.shopStaffRepository.findOne({
      where: { shop: { id: shopId }, user: { id: userId } }
    });

    if (shopStaff) {
      shopStaff.role = role;
    } else {
      shopStaff = this.shopStaffRepository.create({
        shop,
        user,
        role,
      });
    }
    
    return this.shopStaffRepository.save(shopStaff);
  }

  async removeStaff(shopId: string, userId: string): Promise<void> {
    await this.shopStaffRepository.delete({ shop: { id: shopId }, user: { id: userId } });
  }

  async remove(id: string): Promise<void> {
    const shop = await this.findOne(id);
    const ownerId = shop.owner.id;
    
    await this.shopsRepository.delete(id);

    // If no shops left, revert SHOP_OWNER to CUSTOMER
    const shopCount = await this.shopsRepository.count({ where: { owner: { id: ownerId } } });
    if (shopCount === 0) {
      const owner = await this.usersRepository.findOne({ where: { id: ownerId } });
      if (owner && owner.roles.includes(UserRole.SHOP_OWNER)) {
        const newRoles = owner.roles.filter(role => role !== UserRole.SHOP_OWNER);
        if (!newRoles.includes(UserRole.CUSTOMER)) {
          newRoles.push(UserRole.CUSTOMER);
        }
        await this.usersRepository.update(ownerId, { roles: newRoles });
      }
    }
  }

  async getStats(
    shopId: string,
    startDate?: string,
    endDate?: string,
    interval: 'day' | 'week' | 'month' = 'day'
  ) {
    const end = endDate ? new Date(endDate) : getGMT7Date();
    const start = startDate ? new Date(startDate) : new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    // Normalize time to full days
    start.setUTCHours(0, 0, 0, 0);
    end.setUTCHours(23, 59, 59, 999);

    const transactions = await this.transactionsRepository.find({
      where: {
        shop: { id: shopId },
        time: Between(start, end),
      },
      order: { time: 'ASC' },
    });

    let totalRevenue = 0;
    let successCount = 0;
    let failedCount = 0;

    // Grouping by date string
    const groupedData: Record<string, any> = {};

    transactions.forEach(t => {
      const dateKey = t.time.toISOString().split('T')[0];
      if (!groupedData[dateKey]) {
        groupedData[dateKey] = { date: dateKey, revenue: 0, success: 0, failed: 0 };
      }

      if (t.status === TransactionStatus.SUCCESS) {
        groupedData[dateKey].revenue += Number(t.amount);
        groupedData[dateKey].success++;
        totalRevenue += Number(t.amount);
        successCount++;
      } else if (t.status === TransactionStatus.FAILED) {
        groupedData[dateKey].failed++;
        failedCount++;
      }
    });

    return {
      summary: {
        totalRevenue,
        successCount,
        failedCount,
      },
      chartData: Object.values(groupedData),
    };
  }

  async exportTransactions(shopId: string, startDate?: string, endDate?: string): Promise<string> {
    const end = endDate ? new Date(endDate) : getGMT7Date();
    const start = startDate ? new Date(startDate) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    start.setUTCHours(0, 0, 0, 0);
    end.setUTCHours(23, 59, 59, 999);

    const transactions = await this.transactionsRepository.find({
      where: {
        shop: { id: shopId },
        time: Between(start, end),
      },
      order: { time: 'DESC' },
    });

    let csv = 'Time,Reference Number,Amount,Content,Account/Device,Status\n';
    
    for (const t of transactions) {
      const timeStr = t.time.toISOString();
      const amount = t.amount;
      const content = `"${(t.content || '').replace(/"/g, '""')}"`;
      const account = t.accountNumber || '';
      const status = t.status;
      csv += `${timeStr},${t.refNumber || ''},${amount},${content},${account},${status}\n`;
    }

    return csv;
  }
}
