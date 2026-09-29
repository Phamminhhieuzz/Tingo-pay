import { ZaloAccountLinkStatus } from '../../entities/zalo-account-link.entity';

describe('ZaloAccountLinkStatus', () => {
  it('exposes link lifecycle statuses used by API and webhook', () => {
    expect(ZaloAccountLinkStatus.LINKED).toBe('LINKED');
    expect(ZaloAccountLinkStatus.UNLINKED).toBe('UNLINKED');
    expect(ZaloAccountLinkStatus.REVOKED_BY_CONSENT).toBe('REVOKED_BY_CONSENT');
  });
});
