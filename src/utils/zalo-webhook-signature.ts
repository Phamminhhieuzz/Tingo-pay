import { createHash } from 'crypto';

/** Payload Zalo POST khi user rút consent — `user.revoke.consent`. */
export type ZaloConsentRevokePayload = {
  event: string;
  appId: string;
  userId: string;
  timestamp: number;
};

/**
 * Build chuỗi content theo tài liệu Zalo Mini App Open API:
 * sort keys A→Z, nối giá trị (object → JSON.stringify).
 */
export function buildZaloWebhookSignatureContent(data: Record<string, unknown>): string {
  const keys = Object.keys(data).sort();
  let content = '';
  for (const key of keys) {
    let value: unknown = data[key];
    if (typeof value === 'object' && value !== null) {
      value = JSON.stringify(value);
    }
    content += String(value ?? '');
  }
  return content;
}

/** SHA256(content + apiKey) so với header `X-ZEvent-Signature`. */
export function verifyZaloWebhookSignature(
  payload: Record<string, unknown>,
  signatureHeader: string | undefined,
  apiKey: string,
): boolean {
  const signature = signatureHeader?.trim();
  if (!signature || !apiKey) {
    return false;
  }
  const content = buildZaloWebhookSignatureContent(payload);
  const expected = createHash('sha256').update(`${content}${apiKey}`).digest('hex');
  return expected === signature;
}
