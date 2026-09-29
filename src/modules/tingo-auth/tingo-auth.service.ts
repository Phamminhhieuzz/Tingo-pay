import {
  BadGatewayException,
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { createHmac } from 'crypto';
import { buildV2LoginHeaders, VIETQR_V2_DEVICE } from '../../utils/v2-headers';

const AUTH_V1_BASE = 'https://api.vietqr.org/vqr/api';
const AUTH_V2_LOGIN_URL = 'https://dev-v2.vietqr.vn/auth/login';
const LOGIN_WRONG_CREDENTIALS = 'Số điện thoại hoặc mật khẩu không đúng.';

type V1Claims = Record<string, unknown> & {
  userId?: string;
  phoneNo?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  imgId?: string;
};

export type TingoLoginSession = {
  userId: string;
  phoneNo: string;
  fullName: string;
  token: string;
  tokenV2: string;
  refreshTokenV2?: string;
  tokenV2ExpiresAt?: string;
  imgId?: string;
};

@Injectable()
export class TingoAuthService {
  normalizePhone(raw: string): string {
    let phone = String(raw ?? '').replace(/\D/g, '');
    if (phone.startsWith('84') && phone.length >= 10) {
      phone = `0${phone.slice(2)}`;
    }
    return phone;
  }

  private validateCredentials(phone: string, pin: string) {
    if (!/^0\d{9}$/.test(phone)) {
      throw new BadRequestException('Số điện thoại không hợp lệ.');
    }
    if (!/^\d{6}$/.test(pin)) {
      throw new BadRequestException('Mật khẩu phải gồm đúng 6 số.');
    }
  }

  private encryptPin(phone: string, pin: string): string {
    return createHmac('sha256', phone).update(pin).digest('hex');
  }

  private decodeV1Token(token: string): V1Claims {
    try {
      const part = token.split('.')[1];
      if (!part) throw new Error('missing payload');
      return JSON.parse(Buffer.from(part, 'base64url').toString('utf8')) as V1Claims;
    } catch {
      throw new BadGatewayException('Phiên đăng nhập V1 không hợp lệ.');
    }
  }

  private fullName(claims: V1Claims): string {
    return [claims.lastName, claims.middleName, claims.firstName]
      .map((value) => String(value ?? '').trim())
      .filter(Boolean)
      .join(' ');
  }

  private async loginV1(phone: string, encryptedPin: string): Promise<string> {
    const response = await fetch(`${AUTH_V1_BASE}/accounts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'text/plain, */*' },
      body: JSON.stringify({
        phoneNo: phone,
        password: encryptedPin,
        platform: 'ZALO',
        device: VIETQR_V2_DEVICE,
        fcmToken: '',
        sharingCode: '',
      }),
    });

    if (!response.ok) {
      throw new UnauthorizedException('Số điện thoại hoặc mật khẩu không đúng.');
    }

    const token = (await response.text()).trim();
    if (!token || token.split('.').length < 3) {
      throw new UnauthorizedException('Số điện thoại hoặc mật khẩu không đúng.');
    }
    return token;
  }

  private async loginV2(phone: string, encryptedPin: string) {
    const response = await fetch(AUTH_V2_LOGIN_URL, {
      method: 'POST',
      headers: buildV2LoginHeaders(),
      body: JSON.stringify({ username: phone, password: encryptedPin }),
    });

    const body = (await response.json().catch(() => null)) as
      | {
          code?: string;
          message?: string;
          data?: {
            token?: string;
            refreshToken?: string;
            expiresAt?: string;
            tokenExpiresAt?: string;
          };
        }
      | null;

    const token = body?.data?.token?.trim();
    if (!response.ok || body?.code !== '000' || !token) {
      throw new UnauthorizedException(LOGIN_WRONG_CREDENTIALS);
    }
    return body.data!;
  }

  async login(phoneRaw: string, pinRaw: string): Promise<TingoLoginSession> {
    const phone = this.normalizePhone(phoneRaw);
    const pin = String(pinRaw ?? '').replace(/\s/g, '');
    this.validateCredentials(phone, pin);
    const encryptedPin = this.encryptPin(phone, pin);

    // Giống Web V2 BFF: V1 trước (JWT account), sau đó V2 (tokenV2). Cả hai phải thành công.
    const token = await this.loginV1(phone, encryptedPin);
    const v2 = await this.loginV2(phone, encryptedPin);
    const claims = this.decodeV1Token(token);
    const userId = String(claims.userId ?? '').trim();
    if (!userId) {
      throw new BadGatewayException('Token V1 không chứa userId.');
    }

    return {
      userId,
      phoneNo: String(claims.phoneNo ?? phone).trim() || phone,
      fullName: this.fullName(claims),
      token,
      tokenV2: v2.token!,
      refreshTokenV2: v2.refreshToken,
      tokenV2ExpiresAt: v2.tokenExpiresAt || v2.expiresAt,
      imgId: claims.imgId != null ? String(claims.imgId) : undefined,
    };
  }

  async phoneExists(phoneRaw: string): Promise<boolean> {
    const phone = this.normalizePhone(phoneRaw);
    if (!/^0\d{9}$/.test(phone)) {
      throw new BadRequestException('Số điện thoại không hợp lệ.');
    }
    const response = await fetch(
      `${AUTH_V1_BASE}/accounts/search/${encodeURIComponent(phone)}`,
      { headers: { Accept: 'application/json' } },
    );

    // V1: 200 + profile `{ id, phoneNo, ... }` = đã đăng ký.
    // V1: 201 + `{ status: "CHECK", message: "C01" }` = chưa đăng ký (còn trống).
    if (response.status === 200) {
      const body = (await response.json().catch(() => null)) as
        | { id?: string; userId?: string; phoneNo?: string; status?: string }
        | null;
      if (!body || typeof body !== 'object') return false;
      if (String(body.status ?? '').toUpperCase() === 'CHECK') return false;
      return Boolean(
        String(body.id ?? '').trim() ||
          String(body.userId ?? '').trim() ||
          String(body.phoneNo ?? '').trim(),
      );
    }

    if (
      response.status === 201 ||
      response.status === 400 ||
      response.status === 404
    ) {
      return false;
    }

    throw new BadGatewayException('Không kiểm tra được số điện thoại.');
  }

  async register(phoneRaw: string, pinRaw: string): Promise<TingoLoginSession> {
    const phone = this.normalizePhone(phoneRaw);
    const pin = String(pinRaw ?? '').replace(/\s/g, '');
    this.validateCredentials(phone, pin);

    if (await this.phoneExists(phone)) {
      throw new ConflictException('Số điện thoại đã đăng ký Tingo Pay.');
    }

    const response = await fetch(`${AUTH_V1_BASE}/accounts/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        phoneNo: phone,
        password: this.encryptPin(phone, pin),
        device: VIETQR_V2_DEVICE,
        fcmToken: '',
        sharingCode: '0962906213',
        platform: 'ZALO',
      }),
    });
    const body = (await response.json().catch(() => null)) as
      | { status?: string; message?: string }
      | null;
    if (!response.ok || String(body?.status ?? '').toUpperCase() !== 'SUCCESS') {
      throw new BadGatewayException(body?.message || 'Đăng ký tài khoản thất bại.');
    }

    return this.login(phone, pin);
  }

  async verifyV1Session(authorization?: string): Promise<{
    userId: string;
    phoneNo: string;
  }> {
    const token = String(authorization ?? '').replace(/^Bearer\s+/i, '').trim();
    if (!token) throw new UnauthorizedException('Missing Tingo Pay bearer token.');

    const claims = this.decodeV1Token(token);
    const userId = String(claims.userId ?? '').trim();
    if (!userId) throw new UnauthorizedException('Invalid Tingo Pay bearer token.');

    const response = await fetch(
      `${AUTH_V1_BASE}/user/information/${encodeURIComponent(userId)}`,
      {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      },
    );
    if (!response.ok) throw new UnauthorizedException('Tingo Pay session expired.');
    const profile = (await response.json().catch(() => null)) as
      | { userId?: string; phoneNo?: string }
      | null;
    if (String(profile?.userId ?? '').trim() !== userId) {
      throw new UnauthorizedException('Tingo Pay session mismatch.');
    }

    return {
      userId,
      phoneNo:
        this.normalizePhone(String(profile?.phoneNo ?? claims.phoneNo ?? '')) ||
        String(claims.phoneNo ?? '').trim(),
    };
  }
}
