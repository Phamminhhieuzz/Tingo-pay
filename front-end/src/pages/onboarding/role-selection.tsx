/*
 * RoleSelectionPage — Màn hình chọn vai trò, route "/onboarding/role-selection".
 * Người dùng chọn 1 trong 4 vai trò (Chủ cửa hàng / Thành viên / Khách hàng /
 * Khách vãng lai), sau đó thực hiện đăng nhập Zalo (hoặc bỏ qua nếu là Guest)
 * rồi được điều hướng vào Dashboard tương ứng với vai trò đã chọn.
 */
import React, { useState } from "react";
import { Box, Button, Icon, Page, Text } from "zmp-ui";
import { useNavigate } from "react-router-dom";
import logo from "@/static/logo.png";
import { useSetAtom } from "jotai";
import { userRoleAtom, UserRole, currentUserAtom } from "@/state/atoms";
import { loginWithZalo, loginWithDebugToken, registerUser } from "@/utils/auth";
import { useSnackbar, Input } from "zmp-ui";
import { useTranslation } from "@/i18n";
import LanguageSwitch from "@/components/language-switch";

const RoleSelectionPage: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const setRole = useSetAtom(userRoleAtom);
  const setCurrentUser = useSetAtom(currentUserAtom);
  const navigate = useNavigate();
  const { openSnackbar } = useSnackbar();
  const { t } = useTranslation();

  const roles = [
    {
      id: "SHOP_OWNER" as UserRole,
      title: t("roleSelection.shopOwner"),
      description: t("roleSelection.shopOwnerDesc"),
      icon: "zi-user-solid",
    },
    {
      id: "SHOP_MEMBER" as UserRole,
      title: t("roleSelection.shopMember"),
      description: t("roleSelection.shopMemberDesc"),
      icon: "zi-group-solid",
    },
    {
      id: "CUSTOMER" as UserRole,
      title: t("roleSelection.customer"),
      description: t("roleSelection.customerDesc"),
      icon: "zi-user-solid",
    },
    {
      id: "GUEST" as UserRole,
      title: t("roleSelection.guest"),
      description: t("roleSelection.guestDesc"),
      icon: "zi-contact-solid",
    },
  ];

  // Đăng nhập debug: chỉ dùng khi dev trên trình duyệt (khối UI bên dưới chỉ render khi DEV)
  const [debugToken, setDebugToken] = useState("");
  const handleDebugLogin = async () => {
    if (!debugToken.trim()) return;
    setIsLoading(true);
    try {
      const authData = await loginWithDebugToken(debugToken);
      if (authData) {
        // Luôn dùng đúng vai trò backend trả về (không phải thẻ đang chọn trên màn hình) — backend
        // mới biết chính xác tài khoản này có sở hữu/là nhân viên cửa hàng hay không
        const role = authData.user.roles[0];
        setRole(role);
        setCurrentUser(authData.user);
        navigate(role === "STAFF" ? "/staff/orders" : "/dashboard");
      } else {
        openSnackbar({ type: "error", text: t("roleSelection.debugLoginFailed"), duration: 3000 });
      }
    } catch (error: any) {
      openSnackbar({
        type: "error",
        text: `${t("roleSelection.debugLoginError")} ${error.message || t("roleSelection.unknownReason")}`,
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinue = async () => {
    if (selectedRole) {
      setIsLoading(true);
      try {
        if (selectedRole === "GUEST") {
          // Bỏ qua xác thực Zalo cho vai trò Khách vãng lai: tạo user giả (mock)
          // với id ngẫu nhiên để vào thẳng Dashboard trải nghiệm cơ bản
          const mockGuestUser = {
            id: `guest_${Math.random().toString(36).substring(7)}`,
            fullName: t("role.GUEST"),
            phoneZalo: "",
            status: "ACTIVE" as const,
            roles: [selectedRole]
          };
          setRole(selectedRole);
          setCurrentUser(mockGuestUser);
          navigate("/dashboard");
        } else {
          // Vì loginWithZalo trong auth.ts hiện chỉ lấy token làm phoneZalo,
          // ta thử đăng nhập trực tiếp với vai trò đã chọn.
          // Ở một luồng hoàn chỉnh hơn, cần kiểm tra tài khoản đã tồn tại trước.
          const authData = await loginWithZalo(selectedRole);

          if (authData) {
            // Luôn dùng đúng vai trò backend trả về, không phải thẻ vừa bấm chọn — ví dụ bấm "Chủ cửa
            // hàng" nhưng tài khoản chưa có cửa hàng nào thì backend trả về CUSTOMER, phải hiện đúng vậy
            const role = authData.user.roles[0];
            setRole(role);
            setCurrentUser(authData.user);
            navigate(role === "STAFF" ? "/staff/orders" : "/dashboard");
          } else {
            // Không tìm thấy user hợp lệ — phần đăng ký mới (register) phụ thuộc
            // vào logic backend, tạm thời chỉ báo lỗi cho người dùng thử lại.
            openSnackbar({
              type: "error",
              text: t("roleSelection.authFailed"),
              duration: 3000,
            });
          }
        }
      } catch (error: any) {
        // Bắt lỗi chung cho toàn bộ quá trình xác thực (mạng, SDK Zalo, backend...)
        console.error("Auth failed:", error);
        openSnackbar({
          type: "error",
          text: `${t("roleSelection.authError")} ${error.message || t("roleSelection.unknownReason")}`,
          duration: 5000,
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <Page className="flex flex-col bg-tingo-bg">
      {/* Header Banner */}
      <Box className="bg-white dark:bg-gray-800 px-6 py-8 rounded-b-[40px] shadow-card mb-8">
        <Box className="flex items-center justify-between space-x-4 mb-6">
          <Box className="flex items-center space-x-4 min-w-0">
            <Box className="bg-white dark:bg-gray-800 p-1.5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 shrink-0">
              <img src={logo} alt="Tingo" className="w-10 h-10 rounded-lg" />
            </Box>
            <Box className="bg-red-50 px-4 py-2 rounded-full truncate">
              <Text size="small" className="text-tingo-red font-bold">{t("roleSelection.brandTag")}</Text>
            </Box>
          </Box>
          <LanguageSwitch />
        </Box>
        <Text.Title size="xLarge" className="font-bold mb-2">{t("roleSelection.title")}</Text.Title>
        <Text className="text-gray-500 dark:text-gray-400">
          {t("roleSelection.subtitle")}
        </Text>
      </Box>

      {/* Role Selection Cards */}
      <Box className="fade-in-up flex-1 px-6 space-y-4">
        {roles.map((role) => (
          <Box
            key={role.id}
            onClick={() => setSelectedRole(role.id)}
            className={`p-5 rounded-2xl flex items-start space-x-4 transition-all duration-150 active:scale-[0.98] border-2 ${selectedRole === role.id
              ? "border-tingo-red bg-red-50"
              : "border-white bg-white dark:bg-gray-800 shadow-card"
              }`}
          >
            <Box className={`p-3 rounded-xl ${selectedRole === role.id ? "bg-tingo-red text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500"
              }`}>
              <Icon icon={role.icon as any} />
            </Box>
            <Box className="flex-1">
              <Text className={`font-bold ${selectedRole === role.id ? "text-red-700" : "text-gray-800 dark:text-gray-100"}`}>
                {role.title}
              </Text>
              <Text size="small" className="text-gray-500 dark:text-gray-400 mt-1 leading-snug">
                {role.description}
              </Text>
            </Box>
            {selectedRole === role.id && (
              <Box className="bg-tingo-red rounded-full p-1">
                <Icon icon={"zi-check" as any} className="text-white scale-75" />
              </Box>
            )}
          </Box>
        ))}
      </Box>

      {/* Action Footer */}
      <Box className="px-6 pb-10 pt-6 bg-white dark:bg-gray-800 rounded-t-[40px] shadow-lg">
        <Button
          fullWidth
          size="large"
          disabled={!selectedRole || isLoading}
          loading={isLoading}
          className={`rounded-xl py-4 font-bold ${selectedRole ? "bg-tingo-blue text-white shadow-float" : "bg-gray-200 dark:bg-gray-600 text-gray-400 dark:text-gray-500"
            }`}
          onClick={handleContinue}
        >
          {t("roleSelection.continue")}
        </Button>
        {import.meta.env.DEV && (
          <Box className="mt-4 p-3 border border-dashed border-gray-300 dark:border-gray-600 rounded-xl space-y-2">
            <Text size="xSmall" className="text-gray-500 dark:text-gray-400">{t("roleSelection.debugLoginTitle")}</Text>
            <Input
              placeholder={t("roleSelection.debugLoginPlaceholder")}
              value={debugToken}
              onChange={(e) => setDebugToken(e.target.value)}
            />
            <Button
              fullWidth
              size="small"
              variant="secondary"
              disabled={!debugToken.trim() || isLoading}
              onClick={handleDebugLogin}
            >
              {t("roleSelection.debugLoginButton")}
            </Button>
          </Box>
        )}
        <Box className="mt-6 flex justify-center space-x-4 text-gray-400 dark:text-gray-500">
          <Text size="xSmall" className="underline" onClick={() => navigate("/legal/terms")}>{t("roleSelection.terms")}</Text>
          <Text size="xSmall" className="text-gray-300 dark:text-gray-600">|</Text>
          <Text size="xSmall" className="underline" onClick={() => navigate("/legal/privacy")}>{t("roleSelection.privacy")}</Text>
        </Box>
      </Box>
    </Page>
  );
};

export default RoleSelectionPage;
