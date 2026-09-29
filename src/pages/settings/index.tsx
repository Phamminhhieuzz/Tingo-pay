/**
 * Trang Cài đặt — route `/settings`.
 * Hiển thị thông tin tài khoản đang đăng nhập, lối tắt hỗ trợ/gọi hotline, chuyển ngôn ngữ,
 * và cho phép đăng xuất (xóa token, reset state, quay về màn chào).
 */
import React from "react";
import { Page, Box, Text, Button, Icon, Header, Switch, useSnackbar, useTheme } from "zmp-ui";
import { useNavigate } from "react-router-dom";
import { useAtomValue, useSetAtom } from "jotai";
import { removeStorage, openPhone } from "zmp-sdk/apis";
import { currentUserAtom, userRoleAtom, UserRole } from "@/state/atoms";
import { saveThemeMode } from "@/utils/theme-preference";
import { SUPPORT_HOTLINE } from "@/utils/constants";
import { useTranslation } from "@/i18n";
import BottomNav from "@/components/bottom-nav";
import LanguageSwitch from "@/components/language-switch";

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { openSnackbar } = useSnackbar();
  const { t } = useTranslation();
  const currentUser = useAtomValue(currentUserAtom);
  const role = useAtomValue(userRoleAtom) || "GUEST";
  const setCurrentUser = useSetAtom(currentUserAtom);
  const setRole = useSetAtom(userRoleAtom);
  const [themeMode, setThemeMode] = useTheme();

  const handleToggleDarkMode = (checked: boolean) => {
    const mode = checked ? "dark" : "light";
    setThemeMode({ mode });
    saveThemeMode(mode);
  };

  const handleCall = () => {
    openPhone({ phoneNumber: SUPPORT_HOTLINE }).catch((err) =>
      console.error("Call error:", err)
    );
  };

  const handleLogout = async () => {
    try {
      // Xóa access token khỏi Secure Storage của ZMP SDK theo yêu cầu bảo mật của dự án
      await removeStorage({ keys: ["access_token"] });
    } catch (err) {
      // Không chặn luồng đăng xuất nếu xóa storage lỗi — vẫn tiếp tục reset state phía client
      console.error("Clear storage error:", err);
    }
    setCurrentUser(null);
    setRole(null);
    openSnackbar({ type: "success", text: t("settings.loggedOut"), duration: 2000 });
    navigate("/onboarding/welcome");
  };

  return (
    <Page className="flex flex-col bg-tingo-bg pb-24">
      <Header title={t("settings.title")} showBackIcon={false} />

      <Box className="fade-in-up flex-1 px-4 pt-16 pb-4 space-y-4">
        <Box className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-card flex items-center space-x-4">
          <Box className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center">
            <Icon icon="zi-user-solid" className="text-tingo-red" size={28} />
          </Box>
          <Box className="flex-1 min-w-0">
            <Text className="font-bold text-gray-800 dark:text-gray-100 truncate">
              {currentUser?.fullName || t("role.GUEST")}
            </Text>
            {currentUser?.phoneZalo && (
              <Text size="small" className="text-gray-400 dark:text-gray-500">{currentUser.phoneZalo}</Text>
            )}
            <Box className="inline-block bg-red-50 text-tingo-red px-2 py-0.5 rounded-full mt-1">
              <Text size="xSmall" className="font-medium">{t(`role.${role}`)}</Text>
            </Box>
          </Box>
        </Box>

        <Box className="bg-white dark:bg-gray-800 rounded-2xl shadow-card overflow-hidden">
          <Box className="flex items-center justify-between px-4 py-3.5">
            <Box className="flex items-center space-x-3">
              <Text className="text-xl leading-none">🌙</Text>
              <Text className="text-gray-700 dark:text-gray-200 font-medium">{t("settings.darkMode")}</Text>
            </Box>
            <Switch checked={themeMode === "dark"} onChange={(e) => handleToggleDarkMode(e.target.checked)} />
          </Box>
          <Box className="h-px bg-gray-50 dark:bg-gray-700" />
          {/* Chuyển ngôn ngữ VI/EN — dạng 2 nút bấm thay vì dropdown vì chỉ có 2 lựa chọn */}
          <Box className="flex items-center justify-between px-4 py-3.5">
            <Box className="flex items-center space-x-3">
              <Text className="text-xl leading-none">🌐</Text>
              <Text className="text-gray-700 dark:text-gray-200 font-medium">{t("settings.language")}</Text>
            </Box>
            <LanguageSwitch />
          </Box>
          <Box className="h-px bg-gray-50 dark:bg-gray-700" />
          {/* Sang trang /support (FAQ + chat + gọi) thay vì mở thẳng khung chat như trước */}
          <SettingsRow icon="zi-chat" label={t("settings.support")} onClick={() => navigate("/support")} />
          <Box className="h-px bg-gray-50 dark:bg-gray-700" />
          <SettingsRow icon="zi-call" label={t("settings.callHotline")} onClick={handleCall} />
          <Box className="h-px bg-gray-50 dark:bg-gray-700" />
          <SettingsRow icon="zi-note" label={t("settings.terms")} onClick={() => navigate("/legal/terms")} />
          <Box className="h-px bg-gray-50 dark:bg-gray-700" />
          <SettingsRow icon="zi-note" label={t("settings.privacy")} onClick={() => navigate("/legal/privacy")} />
        </Box>

        {/* Khách vãng lai (GUEST) chưa có token nên không "đăng xuất" được — thay vào đó cho
            đường quay lại màn chọn vai trò để đăng nhập thật, tránh bị kẹt ở vai trò khách */}
        {role === "GUEST" ? (
          <Button
            fullWidth
            size="large"
            className="rounded-2xl bg-tingo-red text-white font-bold"
            onClick={() => navigate("/onboarding/role-selection")}
          >
            {t("settings.loginOrChooseRole")}
          </Button>
        ) : (
          <Button
            fullWidth
            size="large"
            variant="secondary"
            className="rounded-2xl border-red-200 text-red-600"
            onClick={handleLogout}
          >
            {t("settings.logout")}
          </Button>
        )}
      </Box>

      <BottomNav role={role} />
    </Page>
  );
};

const SettingsRow = ({
  icon,
  label,
  onClick,
}: {
  icon: string;
  label: string;
  onClick: () => void;
}) => (
  <Box
    className="flex items-center justify-between px-4 py-3.5 active:bg-gray-50 dark:active:bg-gray-700 transition-colors"
    onClick={onClick}
  >
    <Box className="flex items-center space-x-3">
      <Icon icon={icon as any} className="text-gray-500 dark:text-gray-400" size={20} />
      <Text className="text-gray-700 dark:text-gray-200 font-medium">{label}</Text>
    </Box>
    <Icon icon="zi-chevron-right" className="text-gray-300 dark:text-gray-600" size={18} />
  </Box>
);

export default SettingsPage;
