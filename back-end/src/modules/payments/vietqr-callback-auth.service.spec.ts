import { ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { VietQrCallbackAuthService } from './vietqr-callback-auth.service';

const SECRET = 's'.repeat(32);
const env = (over: Record<string, string | undefined> = {}) =>
  ({ VIETQR_CALLBACK_USER: 'vqr', VIETQR_CALLBACK_PASS: 'pw', VIETQR_CALLBACK_JWT_SECRET: SECRET, ...over }) as Record<string, string | undefined>;
const make = (over: Record<string, string | undefined> = {}) => {
  const e = env(over);
  return new VietQrCallbackAuthService({ get: (k: string) => e[k] } as any, new JwtService({}));
};
const basic = (u: string, p: string) => 'Basic ' + Buffer.from(`${u}:${p}`).toString('base64');

describe('issueToken', () => {
  it('Basic đúng: phát token Bearer sống 300 giây', () => {
    const res = make().issueToken(basic('vqr', 'pw'));
    expect(res.token_type).toBe('Bearer');
    expect(res.expires_in).toBe(300);
    expect(typeof res.access_token).toBe('string');
  });

  it.each([basic('vqr', 'sai'), basic('sai', 'pw'), 'Basic', 'Bearer abc', '', undefined])('từ chối %p', (h) => {
    expect(() => make().issueToken(h as any)).toThrow(UnauthorizedException);
  });

  it.each(['VIETQR_CALLBACK_USER', 'VIETQR_CALLBACK_PASS', 'VIETQR_CALLBACK_JWT_SECRET'])('thiếu %s: 503, không có giá trị mặc định', (key) => {
    expect(() => make({ [key]: undefined }).issueToken(basic('vqr', 'pw'))).toThrow(ServiceUnavailableException);
  });
});

describe('verifyBearer', () => {
  const token = (svc = make()) => svc.issueToken(basic('vqr', 'pw')).access_token;

  it('token vừa phát: hợp lệ', () => {
    const svc = make();
    expect(() => svc.verifyBearer(`Bearer ${token(svc)}`)).not.toThrow();
  });

  it.each(['', 'Bearer', 'Bearer rác', 'Basic abc', undefined])('từ chối header %p', (h) => {
    expect(() => make().verifyBearer(h as any)).toThrow(UnauthorizedException);
  });

  it('token ký bằng khoá khác (ví dụ token đăng nhập thường) bị từ chối', () => {
    const other = new JwtService({}).sign({ scope: 'vietqr-callback' }, { secret: 'khac'.repeat(10) });
    expect(() => make().verifyBearer(`Bearer ${other}`)).toThrow(UnauthorizedException);
  });

  it('token đúng khoá nhưng sai scope bị từ chối', () => {
    const wrong = new JwtService({}).sign({ scope: 'login', sub: 'u1' }, { secret: SECRET, expiresIn: 300 });
    expect(() => make().verifyBearer(`Bearer ${wrong}`)).toThrow(UnauthorizedException);
  });

  it('token hết hạn bị từ chối', () => {
    const expired = new JwtService({}).sign({ scope: 'vietqr-callback' }, { secret: SECRET, expiresIn: -10 });
    expect(() => make().verifyBearer(`Bearer ${expired}`)).toThrow(UnauthorizedException);
  });

  it('thiếu secret: 503', () => {
    expect(() => make({ VIETQR_CALLBACK_JWT_SECRET: undefined }).verifyBearer('Bearer x')).toThrow(ServiceUnavailableException);
  });
});
