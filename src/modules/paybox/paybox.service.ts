import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { buildV2Headers } from '../../utils/v2-headers';

const DEFAULT_CORE_V2_BASE = 'https://dev-v2.vietqr.vn';
const PAYBOX_LIST_PATH = '/merchant-adm/mobile/paybox';
const CORE_V2_SUCCESS_CODE = '000';

type UpstreamEnvelope = {
  code?: string;
  errorCode?: string;
  message?: string;
  desc?: string;
  data?: unknown;
};

export type PayboxListQuery = {
  status?: string;
  searchTerm?: string;
  pageSize?: string;
  pageNumber?: string;
  fromDate?: string;
  toDate?: string;
};

@Injectable()
export class PayboxService {
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
   * BFF for Zalo Mini App — proxies Pay Box list to Core V2 server-side (no browser CORS).
   * Upstream: GET /merchant-adm/mobile/paybox (mobile PayBoxApiV2 parity).
   */
  async fetchPayboxList(authorization: string | undefined, query: PayboxListQuery) {
    const bearer = this.extractBearer(authorization);

    const upstream = new URL(`${this.coreV2Base()}${PAYBOX_LIST_PATH}`);
    if (query.status != null && query.status !== '') upstream.searchParams.set('status', query.status);
    upstream.searchParams.set('searchTerm', query.searchTerm ?? '');
    if (query.pageSize != null && query.pageSize !== '') upstream.searchParams.set('pageSize', query.pageSize);
    if (query.pageNumber != null && query.pageNumber !== '') {
      upstream.searchParams.set('pageNumber', query.pageNumber);
    }
    if (query.fromDate != null && query.fromDate !== '') upstream.searchParams.set('fromDate', query.fromDate);
    if (query.toDate != null && query.toDate !== '') upstream.searchParams.set('toDate', query.toDate);

    const response = await fetch(upstream.toString(), {
      method: 'GET',
      headers: buildV2Headers(bearer),
    });

    const json = (await response.json().catch(() => null)) as UpstreamEnvelope | null;
    const code = String(json?.code ?? json?.errorCode ?? '').trim();

    if (!response.ok) {
      return {
        success: false as const,
        code: code || `http_${response.status}`,
        message: String(json?.message ?? json?.desc ?? 'Upstream request failed').trim(),
        data: json?.data ?? null,
      };
    }

    if (code !== CORE_V2_SUCCESS_CODE && code !== '002') {
      return {
        success: false as const,
        code: code || 'server_error',
        message: String(json?.message ?? json?.desc ?? 'Pay Box list failed').trim(),
        data: json?.data ?? null,
      };
    }

    return {
      success: true as const,
      data: json?.data ?? null,
    };
  }
}
