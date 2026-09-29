import { buildVietQr, crc16, stripDiacritics } from './emv-qr';

const input = {
  bankBin: '970422',
  accountNo: '0123456789',
  accountName: 'Phạm Minh Hiếu',
  amount: 500000,
  content: 'ORD-ABC12345',
};

describe('crc16', () => {
  it('đúng vector chuẩn CRC-16/CCITT-FALSE', () => {
    expect(crc16('123456789')).toBe('29B1');
  });
});

describe('stripDiacritics', () => {
  it('bỏ dấu tiếng Việt kể cả đ', () => {
    expect(stripDiacritics('Phạm Minh Hiếu Đặng')).toBe('Pham Minh Hieu Dang');
  });
});

describe('buildVietQr', () => {
  it('có đúng phần đầu, số tiền, tên không dấu viết hoa và nội dung', () => {
    const qr = buildVietQr(input);
    expect(qr.startsWith('000201010212')).toBe(true);
    expect(qr).toContain('5406500000');
    expect(qr).toContain('5914PHAM MINH HIEU');
    expect(qr).toContain('6216' + '0812ORD-ABC12345');
  });

  it('chứa BIN và số tài khoản trong nhóm 38/01', () => {
    const qr = buildVietQr(input);
    expect(qr).toContain('0006970422' + '0110' + '0123456789');
    expect(qr).toContain('A000000727');
    expect(qr).toContain('0208QRIBFTTA');
  });

  it('CRC ở 4 ký tự cuối khớp với phần còn lại', () => {
    const qr = buildVietQr(input);
    const body = qr.slice(0, -4);
    expect(body.endsWith('6304')).toBe(true);
    expect(qr.slice(-4)).toBe(crc16(body));
  });

  it.each([0, -5, 1.5, NaN])('từ chối số tiền %p', (amount) => {
    expect(() => buildVietQr({ ...input, amount })).toThrow('Số tiền không hợp lệ');
  });
});
