/**
 * HTTP client wrapper cho toàn app: tự động gắn Bearer token vào mọi request, tự chọn base URL
 * theo môi trường (local dev qua proxy /api hoặc production gọi thẳng API Gateway), và cung cấp
 * các hàm tiện ích get/post/put/delete để gọi API mà không phải lặp lại logic fetch.
 */
import { getStorage, setStorage } from "zmp-sdk";

// Nhận diện môi trường local (localhost/127.0.0.1/ngrok) để chọn base URL phù hợp:
// - Local: gọi qua "/api" (được Vite proxy sang backend thật, tránh lỗi CORS khi dev)
// - Production: gọi thẳng tới domain API Gateway thật
const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" || window.location.hostname.includes("ngrok");
const BASE_URL = isLocal ? "/api" : "https://tingo-api-gateway.vietqr.vn";

// Lấy access token đã lưu trong Secure Storage của ZMP SDK (không dùng localStorage thô)
export const getAccessToken = async () => {
  try {
    const { access_token } = await getStorage({ keys: ["access_token"] });
    return access_token;
  } catch (err) {
    return null;
  }
};

// Lưu access token vào Secure Storage của ZMP SDK sau khi đăng nhập thành công
export const setAccessToken = async (token: string) => {
  await setStorage({
    data: { access_token: token },
  });
};

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  data?: any;
  params?: Record<string, string | number>;
}

export const request = async <T>(path: string, options: RequestOptions = {}): Promise<T> => {
  const { method = "GET", data, params } = options;
  // Lấy token hiện có (nếu đã đăng nhập) để tự động đính kèm vào request — nhờ vậy các hàm
  // gọi API ở nơi khác không cần tự lo việc gắn Authorization header
  const token = await getAccessToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Accept": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Construct URL with query params
  let url = `${BASE_URL}${path}`;
  if (params) {
    const queryString = Object.entries(params)
      .map(([key, val]) => `${encodeURIComponent(key)}=${encodeURIComponent(val)}`)
      .join("&");
    url += `?${queryString}`;
  }

  console.log(`[API] ${method} ${url}`);

  const response = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `API Error: ${response.status}`);
  }

  // Đọc response dưới dạng text trước rồi mới parse JSON, thay vì gọi response.json() trực tiếp,
  // vì một số API trả về body rỗng (ví dụ DELETE/PUT không có nội dung trả về) — nếu gọi
  // response.json() trên body rỗng sẽ throw lỗi parse. Kiểm tra text rỗng trước giúp tránh lỗi này.
  const text = await response.text();
  if (!text) {
    return undefined as T;
  }
  return JSON.parse(text) as T;
};

// Ghép URL đầy đủ cho 1 đường dẫn file backend trả về (ví dụ ảnh báo lỗi thiết bị dạng
// "/uploads/..."), dùng đúng base URL theo môi trường giống mọi request khác trong app
export const getFileUrl = (path: string) => {
  if (path.startsWith("http")) return path;
  return `${BASE_URL}${path}`;
};

// Gửi request dạng multipart/form-data (dùng khi cần đính kèm file, ví dụ ảnh báo hỏng thiết bị).
// KHÔNG tự set Content-Type: trình duyệt tự thêm boundary đúng khi thấy body là FormData;
// nếu set tay sẽ hỏng.
export const postFormData = async <T>(path: string, formData: FormData): Promise<T> => {
  const token = await getAccessToken();
  const headers: Record<string, string> = { Accept: "application/json" };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers,
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `API Error: ${response.status}`);
  }

  const text = await response.text();
  return text ? (JSON.parse(text) as T) : (undefined as T);
};

// Các hàm tiện ích ngắn gọn cho từng method HTTP, dùng chung trong toàn app
export const apiService = {
  get: <T>(path: string, params?: any) => request<T>(path, { method: "GET", params }),
  post: <T>(path: string, data?: any) => request<T>(path, { method: "POST", data }),
  put: <T>(path: string, data?: any) => request<T>(path, { method: "PUT", data }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
