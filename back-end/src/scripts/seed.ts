import 'dotenv/config';
import { DataSource } from 'typeorm';
import { User, UserRole, UserStatus } from '../entities/user.entity';
import { Shop } from '../entities/shop.entity';
import { ShopStaff, ShopRole } from '../entities/shop-staff.entity';
import { BankAccount, BankAccountStatus } from '../entities/bank-account.entity';
import { Device, DeviceLinkStatus, DeviceOpStatus } from '../entities/device.entity';
import { Transaction, TransactionStatus, TransactionType, RefundStatus } from '../entities/transaction.entity';
import { Order, OrderStatus } from '../entities/order.entity';
import { Product, ProductCategory, ProductStatus } from '../entities/product.entity';

// Set timezone to GMT+7
process.env.TZ = 'Asia/Ho_Chi_Minh';

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [User, Shop, ShopStaff, BankAccount, Device, Transaction, Order, Product],
  synchronize: true,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

function removeVietnameseTones(str: string): string {
    str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
    str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
    str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
    str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
    str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
    str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
    str = str.replace(/đ/g, "d");
    str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
    str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
    str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
    str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
    str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
    str = str.replace(/Ỳ|Ý|Ỷ|Ỹ/g, "Y");
    str = str.replace(/Đ/g, "D");
    return str.toUpperCase();
}

const VIETNAMESE_NAMES = [
    'Nguyễn Văn An', 'Trần Thị Bình', 'Lê Hoàng Cường', 'Phạm Minh Đức', 'Hoàng Thu Thảo',
    'Vũ Quang Huy', 'Đặng Ngọc Lan', 'Bùi Xuân Nam', 'Đỗ Thành Long', 'Ngô Kim Ngân'
];

const VIETNAMESE_SHOPS = [
    'Phở Gia Truyền', 'Cà Phê Muối', 'Bánh Mì Sài Gòn', 'Trà Sữa Tingo', 'Quán Ăn Ngon',
    'Shop Thời Trang Việt', 'Siêu Thị Mini', 'Nhà Thuốc 24h', 'Tiệm Cắt Tóc Nam', 'Văn Phòng Phẩm'
];

const CITIES = [
    { city: 'Hà Nội', wards: ['Phường Tràng Tiền', 'Phường Hàng Đào', 'Phường Kim Mã'] },
    { city: 'TP. Hồ Chí Minh', wards: ['Phường Bến Nghé', 'Phường Đa Kao', 'Phường Võ Thị Sáu'] },
    { city: 'Đà Nẵng', wards: ['Phường Thạch Thang', 'Phường Hải Châu I', 'Phường Phước Ninh'] },
    { city: 'Hải Phòng', wards: ['Phường Minh Khai', 'Phường Phan Bội Châu'] },
    { city: 'Cần Thơ', wards: ['Phường Tân An', 'Phường Cái Khế'] }
];

async function seed() {
  await AppDataSource.initialize();
  console.log('Data Source has been initialized!');

  // Manual cleanup to ensure fresh start
  console.log('Cleaning up existing data...');
  await AppDataSource.query('TRUNCATE TABLE transactions, orders, bank_accounts, devices, shop_staff, shops, users, products CASCADE');
  console.log('Cleanup completed.');

  const userRepository = AppDataSource.getRepository(User);
  const shopRepository = AppDataSource.getRepository(Shop);
  const bankAccountRepository = AppDataSource.getRepository(BankAccount);
  const deviceRepository = AppDataSource.getRepository(Device);
  const transactionRepository = AppDataSource.getRepository(Transaction);
  const productRepository = AppDataSource.getRepository(Product);
  const orderRepository = AppDataSource.getRepository(Order);
  const shopStaffRepository = AppDataSource.getRepository(ShopStaff);

  console.log('Seeding products...');
  // Lưu ý: danh sách này KHÔNG khớp đầy đủ với catalog thật đang chạy (thiếu SIM-VTL-180,
  // VQRCS88-NOSIM, VQRCS88-SIM) — chỉ sửa lại tên file ảnh cho 2 mã trùng để không bị lùi về
  // ảnh cũ nếu có ai chạy lại seed, không mở rộng thêm phạm vi trong lần sửa này.
  const products = [
    {
      code: 'VQRY18W',
      name: 'Loa VQRY18W (chỉ wifi)',
      category: ProductCategory.SPEAKER,
      model: 'VQRY18W',
      description: 'Giải pháp thanh toán bằng mã QR thông báo bằng giọng nói tức thì.',
      spec: { connection: 'Wifi' },
      price: 350000,
      salePrice: 350000,
      status: ProductStatus.OUT_OF_STOCK,
      isBestSeller: true,
      imageUrls: ['product-speaker-loa.png']
    },
    {
      code: 'VQRY18WG-SIM',
      name: 'Loa VQRY18WG (wifi+4G), kèm SIM',
      category: ProductCategory.SPEAKER,
      model: 'VQRY18WG',
      description: 'Giải pháp thanh toán bằng mã QR thông báo bằng giọng nói tức thì. Sản phẩm kèm SIM 4G (1 năm).',
      spec: { connection: 'Wifi+4G', sim: 'Included (1 year)' },
      price: 550000,
      salePrice: 550000,
      status: ProductStatus.IN_STOCK,
      isBestSeller: true,
      imageUrls: ['product-speaker-loa.png']
    },
    {
      code: 'VQRY18WG',
      name: 'Loa VQRY18WG (wifi+4G), không SIM',
      category: ProductCategory.SPEAKER,
      model: 'VQRY18WG',
      description: 'Giải pháp thanh toán bằng mã QR thông báo bằng giọng nói tức thì. Sản phẩm KHÔNG kèm SIM 4G.',
      spec: { connection: 'Wifi+4G', sim: 'Not included' },
      price: 450000,
      salePrice: 450000,
      status: ProductStatus.IN_STOCK,
      isBestSeller: false,
      imageUrls: ['product-speaker-3.png']
    }
  ];

  for (const p of products) {
    const product = productRepository.create(p);
    await productRepository.save(product);
  }

  const banks = [
    { code: 'MB', bin: '970422' },
    { code: 'BIDV', bin: '970418' },
    { code: 'TPB', bin: '970423' },
    { code: 'VIB', bin: '970441' },
  ];

  for (let i = 0; i < 5; i++) {
    console.log(`Seeding data for customer ${i + 1}...`);
    // 1. Create Owner
    const ownerName = VIETNAMESE_NAMES[i % VIETNAMESE_NAMES.length];
    const owner = new User();
    owner.fullName = ownerName;
    owner.phoneZalo = `090${Math.floor(1000000 + Math.random() * 9000000)}`;
    owner.status = UserStatus.ACTIVE;
    owner.roles = [UserRole.SHOP_OWNER];
    await userRepository.save(owner);

    // 2. Create Staff (1-3)
    const staffCount = Math.floor(Math.random() * 3) + 1;
    const staffMembers: User[] = [];
    for (let j = 0; j < staffCount; j++) {
      const staff = new User();
      staff.fullName = `Nhân viên ${j + 1} của ${ownerName}`;
      staff.phoneZalo = `091${Math.floor(1000000 + Math.random() * 9000000)}`;
      staff.status = UserStatus.ACTIVE;
      // Randomly assign STAFF or SHOP_MEMBER
      staff.roles = [Math.random() > 0.5 ? UserRole.STAFF : UserRole.SHOP_MEMBER];
      await userRepository.save(staff);
      staffMembers.push(staff);
    }

    // 3. Create Shops (1-3)
    const shopCount = Math.floor(Math.random() * 3) + 1;
    const shops: Shop[] = [];
    for (let j = 0; j < shopCount; j++) {
      const cityIdx = Math.floor(Math.random() * CITIES.length);
      const city = CITIES[cityIdx];
      const ward = city.wards[Math.floor(Math.random() * city.wards.length)];
      
      const shop = new Shop();
      shop.code = `SHOP_${i + 1}_${j + 1}`;
      shop.name = `${VIETNAMESE_SHOPS[(i * 3 + j) % VIETNAMESE_SHOPS.length]} - ${ownerName}`;
      shop.address = `${Math.floor(Math.random() * 200 + 1)} Đường Chính, ${ward}, ${city.city}`;
      shop.owner = owner;
      await shopRepository.save(shop);
      shops.push(shop);

      for (const staff of staffMembers) {
        const shopStaff = new ShopStaff();
        shopStaff.shop = shop;
        shopStaff.user = staff;
        shopStaff.role = ShopRole.SHOP_STAFF;
        await shopStaffRepository.save(shopStaff);
      }
    }

    // 4. Create Bank Accounts (1-2)
    const bankCount = Math.floor(Math.random() * 2) + 1;
    for (let j = 0; j < bankCount; j++) {
      const bankInfo = banks[Math.floor(Math.random() * banks.length)];
      const bankAccount = new BankAccount();
      bankAccount.bankBin = bankInfo.bin;
      bankAccount.bankCode = bankInfo.code;
      bankAccount.accountNumber = `${Math.floor(1000000000 + Math.random() * 9000000000)}`;
      bankAccount.accountHolder = removeVietnameseTones(owner.fullName);
      bankAccount.phone = owner.phoneZalo;
      bankAccount.citizenId = `${Math.floor(100000000000 + Math.random() * 900000000000)}`;
      bankAccount.status = BankAccountStatus.LINKED;
      bankAccount.shop = shops[Math.floor(Math.random() * shops.length)];
      await bankAccountRepository.save(bankAccount);

      // 5. Create Transactions for Bank Account (3-15 per day, last 7 days)
      for (let day = 0; day < 7; day++) {
        const transCount = Math.floor(Math.random() * 13) + 3;
        for (let t = 0; t < transCount; t++) {
          const transDate = new Date();
          transDate.setDate(transDate.getDate() - day);
          transDate.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));

          const trans = new Transaction();
          trans.time = transDate;
          trans.amount = Math.floor(Math.random() * 50) * 10000 + 20000;
          trans.type = TransactionType.CREDIT;
          trans.accountNumber = bankAccount.accountNumber;
          trans.shop = bankAccount.shop;
          trans.status = TransactionStatus.SUCCESS;
          trans.refundStatus = RefundStatus.NONE;
          trans.content = `CK QR ${bankAccount.bankCode} ${bankAccount.accountNumber}`;
          trans.refNumber = `MB${Math.floor(Math.random() * 1000000)}`;
          await transactionRepository.save(trans);
        }
      }
    }

    // 6. Create Speakers (Devices) (1-3)
    const deviceCount = Math.floor(Math.random() * 3) + 1;
    for (let j = 0; j < deviceCount; j++) {
      const isLinked = Math.random() > 0.2;
      const device = new Device();
      device.code = `DEV_${i + 1}_${j + 1}`;
      device.name = `Loa Thanh Toán ${j + 1} - ${ownerName}`;
      device.model = 'TINGO-S1-PRO';
      device.serial = `SN${owner.phoneZalo}${j}${Math.floor(Math.random() * 1000)}`;
      device.linkStatus = isLinked ? DeviceLinkStatus.LINKED : DeviceLinkStatus.UNLINKED;
      device.opStatus = DeviceOpStatus.ONLINE;
      if (isLinked) {
        device.shop = shops[Math.floor(Math.random() * shops.length)];
      }

      await deviceRepository.save(device);

      // 7. Create Transactions for Device (3-15 per day, last 7 days)
      if (isLinked) {
        for (let day = 0; day < 7; day++) {
          const transCount = Math.floor(Math.random() * 13) + 3;
          for (let t = 0; t < transCount; t++) {
            const transDate = new Date();
            transDate.setDate(transDate.getDate() - day);
            transDate.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));

            const trans = new Transaction();
            trans.time = transDate;
            trans.amount = Math.floor(Math.random() * 50) * 10000 + 20000;
            trans.type = TransactionType.CREDIT;
            trans.accountNumber = `DEV_ACC_${i + 1}_${j + 1}`;
            trans.shop = device.shop;
            trans.device = device;
            trans.status = TransactionStatus.SUCCESS;
            trans.refundStatus = RefundStatus.NONE;
            trans.content = `THANH TOAN LOA ${device.code}`;
            trans.refNumber = `VQR${Math.floor(Math.random() * 1000000)}`;
            await transactionRepository.save(trans);

            // 8. Create Order for each transaction
            const order = new Order();
            order.code = `ORD${transDate.getTime()}${Math.floor(Math.random() * 1000)}`;
            order.orderTime = transDate;
            order.quantity = 1;
            order.device = device;
            order.unitPrice = trans.amount;
            order.totalAmount = trans.amount;
            order.discountAmount = 0;
            order.payAmount = trans.amount;
            order.customer = owner;
            order.status = OrderStatus.COMPLETED;
            order.receiverName = owner.fullName;
            order.receiverPhone = owner.phoneZalo;
            order.receiverAddress = `Dia chi cua ${owner.fullName}`;
            order.referralCode = 'TINGO_PROMO';
            order.shippingFee = 30000;
            order.trackingNumber = `TRACK${transDate.getTime()}`;
            order.shippingProvider = 'Viettel Post';
            await orderRepository.save(order);
          }
        }
      }
    }
  }

  console.log('Seeding completed successfully with localized data!');
  await AppDataSource.destroy();
}

seed().catch((err) => {
  console.error('Error during seeding:', err);
  process.exit(1);
});
