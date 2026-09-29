/**
 * Hàm tiện ích parse nội dung QR quét được từ camera, phân biệt 2 loại mã: VietQR chuẩn EMV
 * (tài khoản ngân hàng) và mã QR định danh thiết bị Loa Tingo, để điều hướng người dùng sang
 * đúng màn hình xử lý (thêm tài khoản ngân hàng hoặc kích hoạt thiết bị).
 */
export interface VietQRData {
  bankId?: string;
  accountNo?: string;
  accountName?: string;
}

export interface TingoDeviceData {
  model?: string;
  serial?: string;
  certificate?: string;
}

// Điểm vào chính: dựa vào phần đầu nội dung QR để phân biệt 2 định dạng khác nhau
export const parseQRData = (content: string) => {
  // Mã VietQR chuẩn EMV luôn bắt đầu bằng "000201" (Payload Format Indicator theo chuẩn EMVCo)
  if (content.startsWith("000201")) {
    return parseVietQR(content);
  }

  // Mã định danh thiết bị Loa Tingo dùng định dạng riêng: "TINGO|MODEL|SERIAL|CERT"
  if (content.startsWith("TINGO|")) {
    return parseTingoQR(content);
  }

  // Không khớp định dạng nào đã biết -> mã không hợp lệ
  return null;
};

// Parse mã VietQR chuẩn EMV: dữ liệu được mã hóa dạng Tag-Length-Value (TLV) lồng nhau
const parseVietQR = (content: string): { type: "VIETQR"; data: VietQRData } => {
  const data: VietQRData = {};

  // Tag 38: Merchant Account Information (chứa thông tin ngân hàng + số tài khoản, dạng TLV lồng)
  const tag38 = extractTag(content, "38");
  if (tag38) {
    // VietQR chuẩn: 38/01 là nhóm TLV lồng chứa 00 = BIN ngân hàng và 01 = số tài khoản
    // (còn 38/00 là mã dịch vụ, 38/02 là loại dịch vụ như QRIBFTTA, không phải số tài khoản)
    const beneficiary = extractTag(tag38, "01");
    const bin = beneficiary ? extractTag(beneficiary, "00") : null;
    const account = beneficiary ? extractTag(beneficiary, "01") : null;
    if (bin && account) {
      data.bankId = bin;
      data.accountNo = account;
    } else {
      // Định dạng không chuẩn (BIN ở 38/01, số tài khoản ở 38/02): giữ cách đọc cũ để không hỏng mã đang dùng
      data.bankId = beneficiary || undefined;
      data.accountNo = extractTag(tag38, "02") || undefined;
    }
  }

  // Tag 59: Merchant Name (tên chủ tài khoản)
  data.accountName = extractTag(content, "59") || undefined;

  return { type: "VIETQR", data };
};

// Parse mã QR định danh Loa Tingo: tách các phần theo dấu "|" -> [TINGO, model, serial, certificate]
const parseTingoQR = (content: string): { type: "TINGO"; data: TingoDeviceData } => {
  const parts = content.split("|");
  return {
    type: "TINGO",
    data: {
      model: parts[1],
      serial: parts[2],
      certificate: parts[3],
    },
  };
};

// Trích xuất giá trị của 1 tag trong chuỗi TLV theo chuẩn EMV: mỗi tag gồm 2 ký tự mã tag,
// 2 ký tự độ dài giá trị, rồi đến giá trị thực tế với độ dài tương ứng
const extractTag = (content: string, tag: string): string | null => {
  let index = 0;
  while (index < content.length) {
    const currentTag = content.substring(index, index + 2);
    const length = parseInt(content.substring(index + 2, index + 4));
    const value = content.substring(index + 4, index + 4 + length);

    if (currentTag === tag) {
      return value;
    }

    index += 4 + length;
  }
  return null;
};
