import {
  buildZaloWebhookSignatureContent,
  verifyZaloWebhookSignature,
} from './zalo-webhook-signature';
import { createHash } from 'crypto';

describe('zalo-webhook-signature', () => {
  const payload = {
    event: 'user.revoke.consent',
    appId: '4308874633773223654',
    userId: '4047671499938107249',
    timestamp: 1670553442564,
  };

  it('builds content with alphabetically sorted keys', () => {
    expect(buildZaloWebhookSignatureContent(payload)).toBe(
      '4308874633773223654user.revoke.consent16705534425644047671499938107249',
    );
  });

  it('verifies SHA256(content + apiKey)', () => {
    const apiKey = 'test-open-api-key';
    const content = buildZaloWebhookSignatureContent(payload);
    const signature = createHash('sha256').update(`${content}${apiKey}`).digest('hex');

    expect(verifyZaloWebhookSignature(payload, signature, apiKey)).toBe(true);
    expect(verifyZaloWebhookSignature(payload, 'bad-signature', apiKey)).toBe(false);
  });
});
