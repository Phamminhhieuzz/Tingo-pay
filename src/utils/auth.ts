/**
 * Xử lý luồng đăng nhập/đăng ký qua Zalo: lấy số điện thoại Zalo của người dùng, gọi API
 * backend để đăng nhập/đồng bộ tài khoản Tingo Pay hoặc đăng ký tài khoản mới, và lưu access
 * token trả về vào Secure Storage.
 */
import { getPhoneNumber, getAccessToken } from "zmp-sdk";
import { apiService, setAccessToken } from "./api";
import { User, UserRole, UserStatus } from "@/state/atoms";

// Shape thật của "user" mà các API đăng nhập (auth/login, auth/zalo, shops.create...) trả về:
// dùng "phone" + "role" (số ít), khác với shape User của app dùng "phoneZalo" + "roles" (mảng).
// Đây là chỗ duy nhất chuyển đổi, để phần còn lại của app luôn dùng đúng 1 shape User.
export interface BackendAuthUser {
  id: string;
  fullName: string;
  phone: string;
  role: string;
  status: string;
  last_login_at?: string;
}

export const mapBackendUser = (backendUser: BackendAuthUser): User => ({
  id: backendUser.id,
  fullName: backendUser.fullName,
  phoneZalo: backendUser.phone,
  status: backendUser.status as UserStatus,
  roles: [backendUser.role as UserRole],
});

/**
 * Lấy token số điện thoại từ Zalo (cần user cấp quyền).
 * Nếu getPhoneNumber() thất bại (ví dụ chạy local/dev) thì fallback sang mock token.
 * Backend chịu trách nhiệm đổi token này lấy số điện thoại thật qua Zalo API.
 */
const getZaloToken = async (): Promise<string> => {
  try {
    const response = await getPhoneNumber();
    if (response.token) {
      return response.token;
    }
    throw new Error("Empty Zalo phone token");
  } catch (err) {
    console.warn("Could not get real phone token, using mock for dev:", err);
    return "MOCK_TOKEN_" + Math.random().toString(36).substring(2, 9);
  }
};

/**
 * Lấy access token của Zalo Mini App (khác với token số điện thoại).
 * Backend dùng cặp (accessToken, tokenSĐT) để gọi Graph API của Zalo đổi ra số điện thoại thật.
 * Ngoài app Zalo (dev trên trình duyệt) sẽ fallback sang mock, backend sẽ từ chối.
 */
const getZaloAccessToken = async (): Promise<string> => {
  try {
    const token = await getAccessToken();
    if (token) {
      return token;
    }
    throw new Error("Empty Zalo access token");
  } catch (err) {
    console.warn("Could not get real Zalo access token, using mock for dev:", err);
    return "MOCK_ACCESS_TOKEN_" + Math.random().toString(36).substring(2, 9);
  }
};

// Đăng nhập bằng Zalo: gửi accessToken + token số điện thoại + vai trò lên POST /auth/zalo,
// backend đổi ra SĐT thật, tự tạo tài khoản nếu chưa có rồi trả về JWT của Tingo Pay
export const loginWithZalo = async (role: UserRole): Promise<{ user: User; token: string } | null> => {
  const [accessToken, phoneToken] = await Promise.all([getZaloAccessToken(), getZaloToken()]);
  try {
    const response = await apiService.post<{ access_token: string; user: BackendAuthUser }>("/auth/zalo", {
      accessToken,
      tokenSĐT: phoneToken,
      role,
    });
    return await saveLogin(response);
  } catch (error) {
    console.error("Auth Error:", error);
    throw error;
  }
};

// Đăng nhập debug (chỉ dùng khi chạy dev trên trình duyệt): gửi thẳng chuỗi do dev nhập
// lên /auth/login thay cho token Zalo, dùng với tài khoản test do Backend cấp
export const loginWithDebugToken = async (debugToken: string): Promise<{ user: User; token: string } | null> => {
  return loginWithPhoneToken(debugToken.trim());
};

// Lưu access token trả về vào Secure Storage để các request sau tự động đính kèm
const saveLogin = async (
  response: { access_token: string; user: BackendAuthUser } | undefined,
): Promise<{ user: User; token: string } | null> => {
  if (response && response.access_token) {
    await setAccessToken(response.access_token);
    return { user: mapBackendUser(response.user), token: response.access_token };
  }
  return null;
};

// Gọi /auth/login với giá trị phoneZalo đã có (SĐT của tài khoản test), rồi lưu access token
const loginWithPhoneToken = async (phoneToken: string): Promise<{ user: User; token: string } | null> => {
  try {
    const response = await apiService.post<{ access_token: string; user: BackendAuthUser }>("/auth/login", {
      phoneZalo: phoneToken,
    });
    return await saveLogin(response);
  } catch (error) {
    console.error("Auth Error:", error);
    throw error;
  }
};

// Đăng ký tài khoản mới khi số điện thoại Zalo chưa liên kết với tài khoản Tingo Pay nào
export const registerUser = async (fullName: string, role: UserRole) => {
  try {
    const zaloToken = await getZaloToken();

    return await apiService.post("/auth/register", {
      fullName,
      phoneZalo: zaloToken,
      role,
    });
  } catch (error) {
    console.error("Register Error:", error);
    throw error;
  }
};
