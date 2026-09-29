import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { buildV2Headers } from '../../utils/v2-headers';

const DEFAULT_CORE_V2_BASE = 'https://dev-v2.vietqr.vn';
const VIB_CONTRACT_LIST_PATH = '/vib/contract/list';
const VIB_REGISTER_INIT_PATH = '/vib/balance-change/register/init';
const VIB_REGISTER_CONFIRM_PATH = '/vib/balance-change/register/confirm';
const VIB_UNREGISTER_INIT_PATH = '/vib/balance-change/unregister/init';
const VIB_UNREGISTER_CONFIRM_PATH = '/vib/balance-change/unregister/confirm';

type UpstreamEnvelope = {
  status?: string;
  code?: string;
  errorCode?: string;
  error_code?: string;
  message?: string;
  desc?: string;
  data?: unknown;
};

export type VibContractListBody = {
  userId?: string;
  linkType?: string;
  acctNo?: string;
};

/** Passthrough body — validated lightly; Core V2 enforces required fields. */
export type VibProxyBody = Record<string, unknown>;

export type VibBffEnvelope = {
  success: boolean;
  status: string;
  message: string;
  code?: string;
  data?: unknown;
};

@Injectable()
export class VibService {
  constructor(private readonly configService: ConfigService) {}

  private coreV2Base(): string {
    return (
      this.configService.get<string>('VIETQR_CORE_V2_BASE_URL')?.replace(/\/$/, '') ||
      DEFAULT_CORE_V2_BASE
    );
  }

  private extractBearer(authorization?: string): string {
    const raw = String(authorization ?? '').trim();
    if (!raw) {
      throw new UnauthorizedException('Missing Authorization bearer token (tokenV2).');
    }
    const match = /^Bearer\s+(.+)$/i.exec(raw);
    const token = (match?.[1] ?? raw).trim();
    if (!token) {
      throw new UnauthorizedException('Invalid Authorization header.');
    }
    return token;
  }

  /**
   * Proxy POST to Core V2 VIB paths — returns normalized envelope for Mini App.
   * Keeps upstream `status` / `message` / `data` so business fails (hasLinkedVA, OTP) stay intact.
   */
  private async proxyVibPost(
    upstreamPath: string,
    authorization: string | undefined,
    body: VibProxyBody,
    fallbackFailMessage: string,
  ): Promise<VibBffEnvelope> {
    const bearer = this.extractBearer(authorization);
    const payload = body && typeof body === 'object' ? body : {};

    const response = await fetch(`${this.coreV2Base()}${upstreamPath}`, {
      method: 'POST',
      headers: buildV2Headers(bearer),
      body: JSON.stringify(payload),
    });

    const json = (await response.json().catch(() => null)) as UpstreamEnvelope | null;
    const status = String(json?.status ?? '').trim().toUpperCase();
    const code = String(
      json?.code ?? json?.errorCode ?? json?.error_code ?? '',
    ).trim();
    const message = String(
      json?.message ?? json?.desc ?? (response.ok ? fallbackFailMessage : 'Upstream request failed'),
    ).trim();

    // Business FAILED/CHECK with JSON body — still return fields (e.g. hasLinkedVA).
    if (json && typeof json === 'object') {
      const ok = response.ok && status === 'SUCCESS';
      return {
        success: ok,
        status: status || (response.ok ? 'FAILED' : 'FAILED'),
        message,
        code: code || undefined,
        data: json.data ?? null,
      };
    }

    return {
      success: false,
      status: 'FAILED',
      message: message || fallbackFailMessage,
      code: code || `http_${response.status}`,
      data: null,
    };
  }

  /**
   * BFF for Zalo Mini App — proxies VIB VA contract list to Core V2 server-side.
   * Upstream: POST /vib/contract/list (mobile CreateBankApiV2.getVirtualAccountsVib).
   */
  async fetchContractList(authorization: string | undefined, body: VibContractListBody) {
    const userId = String(body?.userId ?? '').trim();
    const linkType = String(body?.linkType ?? '').trim();
    if (!userId) {
      return {
        success: false as const,
        code: '400',
        message: 'Missing required field: userId',
        data: null,
      };
    }
    if (!linkType) {
      return {
        success: false as const,
        code: '400',
        message: 'Missing required field: linkType',
        data: null,
      };
    }

    const upstreamBody: Record<string, string> = { userId, linkType };
    const acctNo = String(body?.acctNo ?? '').trim();
    if (acctNo) upstreamBody.acctNo = acctNo;

    const envelope = await this.proxyVibPost(
      VIB_CONTRACT_LIST_PATH,
      authorization,
      upstreamBody,
      'VIB contract list failed',
    );

    if (!envelope.success) {
      return {
        success: false as const,
        code: envelope.code || envelope.status || 'FAILED',
        message: envelope.message,
        data: envelope.data ?? null,
      };
    }

    return {
      success: true as const,
      data: Array.isArray(envelope.data) ? envelope.data : [],
    };
  }

  /** `POST /vib/balance-change/register/init` */
  registerInit(authorization: string | undefined, body: VibProxyBody) {
    return this.proxyVibPost(
      VIB_REGISTER_INIT_PATH,
      authorization,
      body,
      'Không gửi được mã OTP VIB',
    );
  }

  /** `POST /vib/balance-change/register/confirm` */
  registerConfirm(authorization: string | undefined, body: VibProxyBody) {
    return this.proxyVibPost(
      VIB_REGISTER_CONFIRM_PATH,
      authorization,
      body,
      'Xác nhận OTP VIB thất bại',
    );
  }

  /** `POST /vib/balance-change/unregister/init` */
  unregisterInit(authorization: string | undefined, body: VibProxyBody) {
    return this.proxyVibPost(
      VIB_UNREGISTER_INIT_PATH,
      authorization,
      body,
      'Không gửi được mã OTP VIB',
    );
  }

  /** `POST /vib/balance-change/unregister/confirm` */
  unregisterConfirm(authorization: string | undefined, body: VibProxyBody) {
    return this.proxyVibPost(
      VIB_UNREGISTER_CONFIRM_PATH,
      authorization,
      body,
      'Xác nhận OTP hủy liên kết VIB thất bại',
    );
  }
}
