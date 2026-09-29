import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { ConfigService } from '@nestjs/config';
import { User, UserRole, UserStatus } from '../../entities/user.entity';
import { sanitizeRequestedRole, pickTokenRole, syncOwnershipRoles } from './auth-roles';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Shop } from '../../entities/shop.entity';
import { ShopStaff } from '../../entities/shop-staff.entity';

@Injectable()
export class AuthService {
  /** Cache tạm cho secret lấy từ URL cấu hình (tránh gọi mỗi request). */
  private zaloRemoteSecretCache: { secretKey: string; expiresAt: number } | null = null;

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    @InjectRepository(Shop)
    private shopsRepository: Repository<Shop>,
    @InjectRepository(ShopStaff)
    private shopStaffRepository: Repository<ShopStaff>,
  ) {}

  /**
   * Secret dùng header `secret_key` khi gọi graph.zalo.me.
   * Thứ tự: env ZALO_APP_SECRET → GET ZALO_CREDENTIALS_URL (mặc định VietQR key API).
   */
  private async resolveZaloSecretKeyForGraph(): Promise<string | undefined> {
    const fromEnv = this.configService.get<string>('ZALO_APP_SECRET');
    if (fromEnv) {
      return fromEnv;
    }

    const now = Date.now();
    if (this.zaloRemoteSecretCache && this.zaloRemoteSecretCache.expiresAt > now) {
      return this.zaloRemoteSecretCache.secretKey;
    }

    const url =
      this.configService.get<string>('ZALO_CREDENTIALS_URL') ||
      'https://qrcert.vietqr.vn/api/key/zalo';

    const res = await fetch(url, { method: 'GET' });
    if (!res.ok) {
      throw new UnauthorizedException(`Could not load Zalo credentials (HTTP ${res.status})`);
    }

    const body = (await res.json()) as { appId?: string; secretKey?: string };
    const secretKey = body?.secretKey;
    if (!secretKey) {
      throw new UnauthorizedException('Zalo credentials response missing secretKey');
    }

    const ttlMs = parseInt(this.configService.get<string>('ZALO_CREDENTIALS_CACHE_MS') || '300000', 10);
    this.zaloRemoteSecretCache = {
      secretKey,
      expiresAt: now + (Number.isFinite(ttlMs) ? ttlMs : 300000),
    };

    return secretKey;
  }

  async register(registrationData: { fullName: string; phoneZalo: string; role?: UserRole }) {
    const existingUser = await this.usersService.findOneByPhone(registrationData.phoneZalo);

    if (!existingUser) {
      // New user registration
      const user = await this.usersService.create({
        fullName: registrationData.fullName,
        phoneZalo: registrationData.phoneZalo,
        roles: [sanitizeRequestedRole(registrationData.role)],
        status: UserStatus.ACTIVE,
      });
      const loginResult = await this.login(user);
      return {
        ...loginResult,
        welcome_message: 'Chào mừng người dùng mới tham gia hệ thống',
      };
    }

    // Existing user
    if (existingUser.roles.length === 1) {
      const loginResult = await this.login(existingUser);
      return {
        ...loginResult,
        welcome_message: 'Chào mừng người dùng đã quay lại sử dụng hệ thống',
      };
    }

    // Multiple roles case
    return {
      success: true,
      id: existingUser.id,
      phone: existingUser.phoneZalo,
      roles: existingUser.roles,
    };
  }

  async login(user: User, selectedRole?: UserRole) {
    // Đồng bộ vai trò theo thực tế: có sở hữu cửa hàng nào không, có là nhân viên cửa hàng nào không
    const [shopCount, staffCount] = await Promise.all([
      this.shopsRepository.count({ where: { owner: { id: user.id } } }),
      this.shopStaffRepository.count({ where: { user: { id: user.id } } }),
    ]);
    const currentRoles = syncOwnershipRoles(user.roles, { ownsShop: shopCount > 0, isShopStaff: staffCount > 0 });
    const rolesChanged = JSON.stringify([...currentRoles].sort()) !== JSON.stringify([...user.roles].sort());

    if (rolesChanged) {
      await this.usersService.update(user.id, { roles: currentRoles });
      user.roles = currentRoles;
    }

    const role = pickTokenRole(user.roles, selectedRole);
    const payload = { sub: user.id, phone: user.phoneZalo, role: role };
    
    // Update last login
    await this.usersService.updateLastLogin(user.id);
    const updatedUser = await this.usersService.findById(user.id);

    // Use updated user if found, otherwise fallback to provided user
    const finalUser = updatedUser || user;

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: finalUser.id,
        fullName: finalUser.fullName,
        phone: finalUser.phoneZalo,
        role: role,
        status: finalUser.status,
        last_login_at: finalUser.lastLoginAt,
      },
    };
  }

  async loginWithZalo(zaloData: { accessToken: string; tokenSĐT: string; role: UserRole }) {
    // Call Zalo Graph API to retrieve phone number
    // Using native fetch available in Node.js 18+
    try {
      const appSecret = await this.resolveZaloSecretKeyForGraph();
      const headers: Record<string, string> = {
        'access_token': zaloData.accessToken,
      };
      if (appSecret) {
        headers['secret_key'] = appSecret;
      }

      const response = await fetch(`https://graph.zalo.me/v2.0/me/info?code=${zaloData.tokenSĐT}`, {
        method: 'GET',
        headers,
      });

      const result = await response.json() as any;

      if (result.error !== 0) {
        throw new UnauthorizedException(`Zalo authentication failed: ${result.message} (error: ${result.error})`);
      }

      const phone = result.data?.number;
      if (!phone) {
        throw new UnauthorizedException('Could not retrieve phone number from Zalo. Please ensure you have shared your contact information.');
      }

      // Convert 84... to 0... if necessary
      let processedPhone = phone;
      if (processedPhone.startsWith('84')) {
        processedPhone = '0' + processedPhone.substring(2);
      }
      
      let user = await this.usersService.findOneByPhone(processedPhone);
      
      if (!user) {
        // Create new user if not exists
        user = await this.usersService.create({
          fullName: result.name || 'Zalo User',
          phoneZalo: processedPhone,
          roles: [sanitizeRequestedRole(zaloData.role)],
          status: UserStatus.ACTIVE,
        });
      }
      // Không cộng thêm vai trò client yêu cầu vào tài khoản đã có: vai trò chủ shop do login()
      // đồng bộ theo số cửa hàng, còn STAFF chỉ do Tingo gán trong CSDL
      
      return this.login(user, zaloData.role);
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException(`Failed to connect to Zalo: ${error.message}`);
    }
  }

  // Exchange số điện thoại từ tokenSĐT (không tạo user / không login)
  async exchangeZaloPhone(zaloData: { accessToken: string; tokenSĐT: string }) {
    try {
      const appSecret = await this.resolveZaloSecretKeyForGraph();
      const headers: Record<string, string> = {
        access_token: zaloData.accessToken,
      };
      if (appSecret) {
        headers.secret_key = appSecret;
      }

      const response = await fetch(`https://graph.zalo.me/v2.0/me/info?code=${zaloData.tokenSĐT}`, {
        method: 'GET',
        headers,
      });

      const result = (await response.json()) as any;

      if (result.error !== 0) {
        throw new UnauthorizedException(`Zalo exchange failed: ${result.message} (error: ${result.error})`);
      }

      const phone = result.data?.number;
      if (!phone) {
        throw new UnauthorizedException('Could not retrieve phone number from Zalo.');
      }

      let processedPhone = phone;
      if (processedPhone.startsWith('84')) {
        processedPhone = '0' + processedPhone.substring(2);
      }

      return { phone: processedPhone };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException(`Failed to connect to Zalo: ${error.message}`);
    }
  }

  async validateUser(phoneZalo: string): Promise<any> {
    const user = await this.usersService.findOneByPhone(phoneZalo);
    if (user && user.status === 'ACTIVE') {
      return user;
    }
    return null;
  }
}
