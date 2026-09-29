import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ZaloAccountLink,
  ZaloAccountLinkStatus,
} from '../../entities/zalo-account-link.entity';
import { getGMT7Date } from '../../utils/date-utils';

/** Structured conflict codes for Mini App mapping. */
export const ZALO_LINK_ERROR = {
  ZALO_LINKED_OTHER_TINGO: 'ZALO_LINKED_OTHER_TINGO',
  TINGO_LINKED_OTHER_ZALO: 'TINGO_LINKED_OTHER_ZALO',
} as const;

@Injectable()
export class ZaloAccountLinkService {
  private readonly logger = new Logger(ZaloAccountLinkService.name);

  constructor(
    @InjectRepository(ZaloAccountLink)
    private readonly linksRepository: Repository<ZaloAccountLink>,
  ) {}

  private normalizePhone(phone: string): string {
    let p = String(phone ?? '').replace(/\D/g, '');
    if (p.startsWith('84') && p.length >= 10) {
      p = `0${p.slice(2)}`;
    }
    return p;
  }

  private conflict(code: string, message: string): never {
    throw new HttpException(
      {
        statusCode: HttpStatus.CONFLICT,
        code,
        message,
      },
      HttpStatus.CONFLICT,
    );
  }

  private toPublic(link: ZaloAccountLink) {
    return {
      id: link.id,
      zaloUserId: link.zaloUserId,
      tingoUserId: link.tingoUserId,
      tingoPhone: link.tingoPhone,
      appId: link.appId ?? null,
      status: link.status,
      linkedAt: link.linkedAt ?? null,
      unlinkedAt: link.unlinkedAt ?? null,
      lastZaloEventAt: link.lastZaloEventAt ?? null,
    };
  }

  /**
   * Liên kết 1–1: một Zalo userId ↔ một Tingo Pay account (khi status=LINKED).
   * Không ghi đè im lặng khi đã liên kết với bên khác — trả 409 + mã lỗi.
   */
  async link(params: {
    zaloUserId: string;
    tingoUserId: string;
    tingoPhone: string;
    appId?: string;
  }) {
    const zaloUserId = String(params.zaloUserId ?? '').trim();
    const tingoUserId = String(params.tingoUserId ?? '').trim();
    const tingoPhone = this.normalizePhone(params.tingoPhone);
    const appId = params.appId?.trim() || undefined;

    if (!zaloUserId || !tingoUserId || !tingoPhone) {
      throw new BadRequestException(
        'zaloUserId, tingoUserId and tingoPhone are required',
      );
    }

    const byZalo = await this.linksRepository.findOne({ where: { zaloUserId } });
    const byTingo = await this.linksRepository.findOne({
      where: { tingoUserId, status: ZaloAccountLinkStatus.LINKED },
      order: { updatedAt: 'DESC' },
    });

    // Idempotent: cùng cặp đã LINKED.
    if (
      byZalo &&
      byZalo.status === ZaloAccountLinkStatus.LINKED &&
      byZalo.tingoUserId === tingoUserId
    ) {
      return this.toPublic(byZalo);
    }

    // Zalo đang gắn Tingo khác.
    if (
      byZalo &&
      byZalo.status === ZaloAccountLinkStatus.LINKED &&
      byZalo.tingoUserId !== tingoUserId
    ) {
      this.conflict(
        ZALO_LINK_ERROR.ZALO_LINKED_OTHER_TINGO,
        'Tài khoản Zalo này đã liên kết với một tài khoản Tingo Pay khác. Hãy đăng nhập đúng tài khoản đó rồi hủy liên kết trước.',
      );
    }

    // Tingo đang gắn Zalo khác.
    if (byTingo && byTingo.zaloUserId !== zaloUserId) {
      this.conflict(
        ZALO_LINK_ERROR.TINGO_LINKED_OTHER_ZALO,
        'Tài khoản Tingo Pay này đã liên kết với một tài khoản Zalo khác. Chỉ tài khoản Zalo đó mới hủy được liên kết.',
      );
    }

    const now = getGMT7Date();
    let link = byZalo;

    if (!link) {
      link = this.linksRepository.create({
        zaloUserId,
        tingoUserId,
        tingoPhone,
        appId,
        status: ZaloAccountLinkStatus.LINKED,
        linkedAt: now,
        unlinkedAt: undefined,
      });
    } else {
      // Row cũ UNLINKED / REVOKED_BY_CONSENT — cho phép liên kết lại.
      link.tingoUserId = tingoUserId;
      link.tingoPhone = tingoPhone;
      if (appId) link.appId = appId;
      link.status = ZaloAccountLinkStatus.LINKED;
      link.linkedAt = now;
      link.unlinkedAt = null as unknown as undefined;
    }

    const saved = await this.linksRepository.save(link);
    this.logger.log(
      JSON.stringify({
        type: 'zalo.account_link',
        action: 'link',
        zaloUserId: saved.zaloUserId,
        tingoUserId: saved.tingoUserId,
        tingoPhone: saved.tingoPhone,
      }),
    );
    return this.toPublic(saved);
  }

  /**
   * Hủy liên kết do user (trong Profile).
   * Chỉ Zalo đã gắn cặp đó mới hủy được — không cho Zalo khác hủy hộ.
   * (Webhook revoke consent đi qua `revokeByConsent(zaloUserId)`.)
   */
  async unlink(params: { zaloUserId?: string; tingoUserId: string }) {
    const zaloUserId = params.zaloUserId?.trim();
    const tingoUserId = params.tingoUserId.trim();
    if (!tingoUserId) throw new BadRequestException('tingoUserId is required');
    if (!zaloUserId) throw new BadRequestException('zaloUserId is required');

    const link = await this.linksRepository.findOne({
      where: {
        zaloUserId,
        tingoUserId,
        status: ZaloAccountLinkStatus.LINKED,
      },
    });

    if (!link) {
      const linkedElsewhere = await this.linksRepository.findOne({
        where: { tingoUserId, status: ZaloAccountLinkStatus.LINKED },
        order: { updatedAt: 'DESC' },
      });
      if (linkedElsewhere) {
        this.conflict(
          ZALO_LINK_ERROR.TINGO_LINKED_OTHER_ZALO,
          'Tài khoản Tingo Pay này đã liên kết với một tài khoản Zalo khác. Chỉ tài khoản Zalo đó mới hủy được liên kết.',
        );
      }
      throw new NotFoundException('Zalo account link not found');
    }

    if (link.status !== ZaloAccountLinkStatus.LINKED) {
      return this.toPublic(link);
    }

    link.status = ZaloAccountLinkStatus.UNLINKED;
    link.unlinkedAt = getGMT7Date();
    const saved = await this.linksRepository.save(link);

    this.logger.log(
      JSON.stringify({
        type: 'zalo.account_link',
        action: 'unlink',
        zaloUserId: saved.zaloUserId,
        tingoUserId: saved.tingoUserId,
      }),
    );
    return this.toPublic(saved);
  }

  /**
   * Zalo webhook user.revoke.consent — hủy liên kết theo zaloUserId.
   * Idempotent: không có link vẫn OK (caller trả 200).
   */
  async revokeByConsent(zaloUserId: string, eventTimestamp?: number) {
    const id = String(zaloUserId ?? '').trim();
    if (!id) {
      return { revoked: false, reason: 'missing_zalo_user_id' as const };
    }

    const link = await this.linksRepository.findOne({ where: { zaloUserId: id } });
    if (!link) {
      this.logger.log(
        JSON.stringify({
          type: 'zalo.account_link',
          action: 'consent_revoke',
          zaloUserId: id,
          result: 'no_link',
        }),
      );
      return { revoked: false, reason: 'no_link' as const };
    }

    if (link.status === ZaloAccountLinkStatus.REVOKED_BY_CONSENT) {
      return { revoked: false, reason: 'already_revoked' as const, link: this.toPublic(link) };
    }

    link.status = ZaloAccountLinkStatus.REVOKED_BY_CONSENT;
    link.unlinkedAt = getGMT7Date();
    if (eventTimestamp != null && Number.isFinite(eventTimestamp)) {
      link.lastZaloEventAt = String(eventTimestamp);
    }
    const saved = await this.linksRepository.save(link);

    this.logger.log(
      JSON.stringify({
        type: 'zalo.account_link',
        action: 'consent_revoke',
        zaloUserId: saved.zaloUserId,
        tingoUserId: saved.tingoUserId,
        result: 'revoked',
      }),
    );

    return { revoked: true, reason: 'revoked' as const, link: this.toPublic(saved) };
  }

  async getStatus(params: { zaloUserId?: string; tingoUserId?: string }) {
    const zaloUserId = params.zaloUserId?.trim();
    const tingoUserId = params.tingoUserId?.trim();

    if (!tingoUserId) {
      throw new BadRequestException('tingoUserId is required');
    }

    // Always resolve by Tingo session first — avoid false "Chưa liên kết"
    // when this account is already LINKED to a different Zalo userId.
    const linkedForTingo = await this.linksRepository.findOne({
      where: { tingoUserId, status: ZaloAccountLinkStatus.LINKED },
      order: { updatedAt: 'DESC' },
    });

    if (linkedForTingo) {
      const matchesCurrentZalo = Boolean(
        zaloUserId && linkedForTingo.zaloUserId === zaloUserId,
      );
      return {
        linked: true,
        status: linkedForTingo.status,
        matchesCurrentZalo,
      };
    }

    if (zaloUserId) {
      const pair = await this.linksRepository.findOne({
        where: { zaloUserId, tingoUserId },
      });
      if (pair) {
        return {
          linked: false,
          status: pair.status,
          matchesCurrentZalo: false,
        };
      }
    }

    return {
      linked: false,
      status: null,
      matchesCurrentZalo: false,
    };
  }

  /**
   * Public lookup for Mini App welcome auto-login when local Tingo session is absent.
   */
  async getStatusByZaloUserId(zaloUserId?: string) {
    const id = String(zaloUserId ?? '').trim();
    if (!id) {
      throw new BadRequestException('zaloUserId is required');
    }

    const link = await this.linksRepository.findOne({
      where: { zaloUserId: id },
      order: { updatedAt: 'DESC' },
    });

    if (!link) {
      return {
        linked: false,
        status: null,
        tingoPhone: null,
      };
    }

    return {
      linked: link.status === ZaloAccountLinkStatus.LINKED,
      status: link.status,
      tingoPhone:
        link.status === ZaloAccountLinkStatus.LINKED
          ? this.normalizePhone(link.tingoPhone)
          : null,
    };
  }
}
