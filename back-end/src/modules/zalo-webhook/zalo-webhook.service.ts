import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  verifyZaloWebhookSignature,
  type ZaloConsentRevokePayload,
} from '../../utils/zalo-webhook-signature';
import { ZaloAccountLinkService } from '../zalo-account-link/zalo-account-link.service';

const CONSENT_REVOKE_EVENT = 'user.revoke.consent';

@Injectable()
export class ZaloWebhookService {
  private readonly logger = new Logger(ZaloWebhookService.name);
  private remoteSecretCache: { secretKey: string; expiresAt: number } | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly zaloAccountLinkService: ZaloAccountLinkService,
  ) {}

  /**
   * Open API key dùng verify webhook.
   * Thứ tự: ZALO_OPEN_API_KEY → ZALO_APP_SECRET → GET ZALO_CREDENTIALS_URL.
   */
  private async resolveOpenApiKey(): Promise<string | undefined> {
    const openApiKey = this.configService.get<string>('ZALO_OPEN_API_KEY');
    if (openApiKey) {
      return openApiKey;
    }

    const appSecret = this.configService.get<string>('ZALO_APP_SECRET');
    if (appSecret) {
      return appSecret;
    }

    const now = Date.now();
    if (this.remoteSecretCache && this.remoteSecretCache.expiresAt > now) {
      return this.remoteSecretCache.secretKey;
    }

    const url =
      this.configService.get<string>('ZALO_CREDENTIALS_URL') ||
      'https://qrcert.vietqr.vn/api/key/zalo';

    try {
      const res = await fetch(url, { method: 'GET' });
      if (!res.ok) {
        this.logger.warn(`Zalo webhook: could not load credentials (HTTP ${res.status})`);
        return undefined;
      }

      const body = (await res.json()) as { secretKey?: string };
      const secretKey = body?.secretKey;
      if (!secretKey) {
        this.logger.warn('Zalo webhook: credentials response missing secretKey');
        return undefined;
      }

      const ttlMs = parseInt(
        this.configService.get<string>('ZALO_CREDENTIALS_CACHE_MS') || '300000',
        10,
      );
      this.remoteSecretCache = {
        secretKey,
        expiresAt: now + (Number.isFinite(ttlMs) ? ttlMs : 300000),
      };
      return secretKey;
    } catch (err) {
      this.logger.warn(
        `Zalo webhook: failed to fetch credentials — ${err instanceof Error ? err.message : String(err)}`,
      );
      return undefined;
    }
  }

  /**
   * Verify signature → hủy liên kết Zalo ↔ Tingo Pay (nếu có) → 200 OK.
   * Không xóa tài khoản Tingo Pay trên qrcert/Core V2.
   */
  async handleConsentRevoke(
    payload: ZaloConsentRevokePayload,
    signatureHeader?: string,
  ): Promise<{ status: number; message: string }> {
    const skipVerify = this.configService.get<string>('ZALO_WEBHOOK_SKIP_VERIFY') === 'true';
    const apiKey = skipVerify ? undefined : await this.resolveOpenApiKey();

    if (!skipVerify && apiKey) {
      const valid = verifyZaloWebhookSignature(
        payload as unknown as Record<string, unknown>,
        signatureHeader,
        apiKey,
      );
      if (!valid) {
        throw new UnauthorizedException('Invalid X-ZEvent-Signature');
      }
    } else if (!skipVerify && !apiKey) {
      this.logger.warn(
        'Zalo webhook: no API key — accepting without signature verify. Set ZALO_OPEN_API_KEY or ZALO_APP_SECRET.',
      );
    }

    if (payload.event !== CONSENT_REVOKE_EVENT) {
      this.logger.warn(`Zalo webhook: unexpected event "${payload.event}"`);
    }

    const revokeResult = await this.zaloAccountLinkService.revokeByConsent(
      payload.userId,
      payload.timestamp,
    );

    this.logger.log(
      JSON.stringify({
        type: 'zalo.consent_revoke',
        event: payload.event,
        appId: payload.appId,
        userId: payload.userId,
        timestamp: payload.timestamp,
        signatureVerified: Boolean(apiKey) && !skipVerify,
        unlink: revokeResult,
      }),
    );

    return { status: 200, message: 'OK' };
  }
}
