/**
 * Dựng chuỗi VietQR chuẩn EMV (Tag-Length-Value) ngay trên server, dùng ở chế độ dev khi chưa có
 * thông tin API VietQR. Cấu trúc khớp với mã VietQR chuẩn mà front-end (qr-parser.ts) đọc được.
 */
export interface VietQrInput {
  bankBin: string;
  accountNo: string;
  accountName: string;
  amount: number;
  content: string;
}

const tlv = (tag: string, value: string): string =>
  `${tag}${String(value.length).padStart(2, '0')}${value}`;

// CRC-16/CCITT-FALSE (poly 0x1021, init 0xFFFF) theo chuẩn EMV QR, trả về 4 ký tự HEX hoa
export const crc16 = (data: string): string => {
  let crc = 0xffff;
  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8;
    for (let bit = 0; bit < 8; bit++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
};

export const stripDiacritics = (text: string): string =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');

export const buildVietQr = (input: VietQrInput): string => {
  if (!Number.isInteger(input.amount) || input.amount <= 0) {
    throw new Error('Số tiền không hợp lệ');
  }
  const beneficiary = tlv('00', input.bankBin) + tlv('01', input.accountNo);
  const merchant = tlv('00', 'A000000727') + tlv('01', beneficiary) + tlv('02', 'QRIBFTTA');
  const body =
    tlv('00', '01') +
    tlv('01', '12') + // 12 = mã động (có số tiền)
    tlv('38', merchant) +
    tlv('53', '704') + // VND
    tlv('54', String(input.amount)) +
    tlv('58', 'VN') +
    tlv('59', stripDiacritics(input.accountName).toUpperCase()) +
    tlv('62', tlv('08', input.content)) +
    '6304';
  return body + crc16(body);
};
