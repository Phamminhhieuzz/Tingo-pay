/**
 * Lưu/đọc lựa chọn ngôn ngữ người dùng tự chọn trong Cài đặt (dùng Storage của ZMP SDK, giống
 * theme-preference.ts). Nếu chưa từng tự chọn (trả về null), app dùng tiếng Việt làm mặc định.
 */
import { getStorage, setStorage } from "zmp-sdk";
import { Language } from "@/i18n";

const STORAGE_KEY = "language";

export const getSavedLanguage = async (): Promise<Language | null> => {
  try {
    const data = await getStorage({ keys: [STORAGE_KEY] });
    const value = (data as Record<string, unknown>)[STORAGE_KEY];
    return value === "vi" || value === "en" ? value : null;
  } catch {
    return null;
  }
};

export const saveLanguage = async (lang: Language): Promise<void> => {
  try {
    await setStorage({ data: { [STORAGE_KEY]: lang } });
  } catch {
    // Không chặn UI nếu lưu thất bại — lần mở app sau sẽ quay về tiếng Việt mặc định
  }
};
