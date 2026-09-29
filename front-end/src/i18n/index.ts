/**
 * Hạ tầng đa ngôn ngữ của app. `languageAtom` giữ ngôn ngữ đang chọn (mặc định "vi"), Layout.tsx
 * áp lại lựa chọn đã lưu lúc mở app (giống ApplySavedTheme). `useTranslation()` trả về hàm `t(key)`
 * nhận khoá dạng "trang.tên" (dot path) và lấy đúng chuỗi theo ngôn ngữ hiện tại.
 */
import { atom } from "jotai";
import { useAtomValue } from "jotai";
import vi from "./vi";
import en from "./en";

export type Language = "vi" | "en";

export const languageAtom = atom<Language>("vi");

const DICTS: Record<Language, typeof vi> = { vi, en };

// Lấy giá trị theo dot path (vd "settings.darkMode") trong 1 object lồng nhau
const getByPath = (obj: any, path: string): string | undefined =>
  path.split(".").reduce((acc, key) => (acc && typeof acc === "object" ? acc[key] : undefined), obj);

export const translate = (lang: Language, key: string): string => {
  const value = getByPath(DICTS[lang], key);
  if (typeof value === "string") return value;
  // Thiếu bản dịch tiếng Anh thì fallback về tiếng Việt thay vì hiện khoá thô ngoài UI
  if (lang !== "vi") {
    const fallback = getByPath(DICTS.vi, key);
    if (typeof fallback === "string") return fallback;
  }
  console.warn(`[i18n] Thiếu bản dịch cho khoá: ${key}`);
  return key;
};

export const useTranslation = () => {
  const language = useAtomValue(languageAtom);
  const t = (key: string) => translate(language, key);
  return { t, language };
};
