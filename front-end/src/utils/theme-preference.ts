/**
 * Lưu/đọc lựa chọn dark mode người dùng tự bật tay trong Cài đặt (dùng Storage của ZMP SDK,
 * giống cách lưu access token). Nếu chưa từng tự chọn (trả về null), app dùng theo theme hệ
 * thống Zalo như mặc định — xem Layout.tsx.
 */
import { getStorage, setStorage } from "zmp-sdk";

export type ThemeMode = "light" | "dark";
const STORAGE_KEY = "theme_mode";

export const getSavedThemeMode = async (): Promise<ThemeMode | null> => {
  try {
    const data = await getStorage({ keys: [STORAGE_KEY] });
    const value = (data as Record<string, unknown>)[STORAGE_KEY];
    return value === "dark" || value === "light" ? value : null;
  } catch {
    return null;
  }
};

export const saveThemeMode = async (mode: ThemeMode): Promise<void> => {
  try {
    await setStorage({ data: { [STORAGE_KEY]: mode } });
  } catch {
    // Không chặn UI nếu lưu thất bại — lần mở app sau sẽ quay về theme hệ thống
  }
};
