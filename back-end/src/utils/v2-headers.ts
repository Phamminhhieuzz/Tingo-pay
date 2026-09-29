import { randomUUID } from 'crypto';

/** Core V2 client id — parity mobile / web v2. */
export const VIETQR_V2_CLIENT_ID = '67d0535f3df1af52e2c81320';

/** Zalo Mini App device string for Core V2 `Device` header. */
export const VIETQR_V2_DEVICE = 'platform=ZALO|client=tingo-pay-zmp';

const V2_LOGIN_ORIGIN = 'https://doitac.vietqr.vn';

/**
 * Headers for upstream `dev-v2.vietqr.vn` — mirrors web v2 `buildV2Headers`.
 * Uses lowercase `clientid`, `device`, `requestid` as sent by web/mobile interceptors.
 */
export function buildV2Headers(bearerToken: string): Record<string, string> {
  const token = bearerToken.trim();
  return {
    Accept: 'application/json, text/plain, */*',
    'Content-Type': 'application/json',
    Authorization: token.startsWith('Bearer ') ? token : `Bearer ${token}`,
    clientid: VIETQR_V2_CLIENT_ID,
    device: VIETQR_V2_DEVICE,
    requestid: randomUUID(),
  };
}

/**
 * Headers for unauthenticated Core V2 `POST /auth/login` — same client/device as Pay Box BFF.
 */
export function buildV2LoginHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json, text/plain, */*',
    Origin: V2_LOGIN_ORIGIN,
    clientid: VIETQR_V2_CLIENT_ID,
    device: VIETQR_V2_DEVICE,
    requestid: randomUUID(),
  };
}
