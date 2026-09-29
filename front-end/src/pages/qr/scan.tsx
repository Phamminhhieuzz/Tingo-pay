/*
 * ScanPage — Màn hình quét QR, route "/qr/scan".
 * Kiểm tra quyền truy cập theo vai trò, yêu cầu quyền camera, quét mã QR
 * rồi phân loại mã (VietQR ngân hàng hoặc QR thiết bị Tingo) để điều hướng
 * sang trang thêm tài khoản ngân hàng hoặc thêm thiết bị loa tương ứng.
 */
import React, { useEffect, useState } from "react";
import { Page, Box, Text, Icon, Button, Input, Header, useSnackbar } from "zmp-ui";
import { useNavigate } from "react-router-dom";
import { useAtomValue } from "jotai";
import { userRoleAtom } from "@/state/atoms";
import { scanQRCode, requestCameraPermission } from "zmp-sdk/apis";
import { parseQRData } from "@/utils/qr-parser";
import { useTranslation } from "@/i18n";

const ScanPage: React.FC = () => {
  const role = useAtomValue(userRoleAtom);
  const navigate = useNavigate();
  const { openSnackbar } = useSnackbar();
  const { t } = useTranslation();
  // Chỉ dùng khi dev trên trình duyệt (không có camera Zalo): cho dán tay nội dung mã QR
  const [showManual, setShowManual] = useState(false);
  const [manualContent, setManualContent] = useState("");

  useEffect(() => {
    // Tự động bắt đầu quy trình quét ngay khi vào trang, không cần thao tác thêm
    handleScanProcess();
  }, []);

  // Phân tích nội dung QR: có thể là mã VietQR chuẩn EMV (ngân hàng)
  // hoặc mã định danh thiết bị loa Tingo, mỗi loại điều hướng khác nhau
  const handleContent = (content: string) => {
    const parsed = parseQRData(content.trim());

    if (parsed?.type === "VIETQR") {
      navigate("/bank-account/add", { state: { bankData: parsed.data } });
    } else if (parsed?.type === "TINGO") {
      navigate("/device/add", { state: { deviceData: parsed.data } });
    } else {
      // Mã QR không thuộc 2 định dạng được hỗ trợ -> báo lỗi (dev dán tay thì ở lại để thử lại)
      openSnackbar({
        type: "error",
        text: t("qrScan.invalidCode"),
        duration: 3000,
      });
      if (!showManual) navigate("/dashboard");
    }
  };

  const handleScanProcess = async () => {
    // 1. Kiểm tra quyền theo vai trò: chưa có vai trò hoặc là Khách vãng lai
    // thì không được dùng chức năng quét, yêu cầu đăng ký/chọn vai trò trước
    if (!role || role === "GUEST") {
      openSnackbar({
        type: "warning",
        text: t("qrScan.needRegister"),
        duration: 3000,
      });
      navigate("/onboarding/role-selection");
      return;
    }

    if (role === "CUSTOMER") {
      // Khách hàng mua loa chưa có cửa hàng/thiết bị để gắn nên không cần quét QR
      openSnackbar({
        type: "warning",
        text: t("qrScan.needManagerOrMember"),
        duration: 3000,
      });
      navigate("/onboarding/role-selection");
      return;
    }

    if (role === "SHOP_MEMBER") {
      // Chỉ Chủ cửa hàng mới có quyền liên kết ngân hàng/kích hoạt thiết bị mới
      openSnackbar({
        type: "error",
        text: t("qrScan.ownerOnly"),
        duration: 3000,
      });
      navigate("/dashboard");
      return;
    }

    // 2. Xin quyền camera rồi mở trình quét QR
    try {
      await requestCameraPermission({});
      const { content } = await scanQRCode({});

      if (content) {
        handleContent(content);
      } else {
        // Người dùng đóng camera / không có nội dung quét được
        navigate("/dashboard");
      }
    } catch (error) {
      // Lỗi có thể do từ chối quyền camera hoặc người dùng hủy quét giữa chừng
      console.error("Scan error:", error);
      if (import.meta.env.DEV) {
        // Trên trình duyệt dev không có camera: ở lại trang và hiện ô dán nội dung mã thay vì thoát
        setShowManual(true);
        return;
      }
      openSnackbar({
        type: "error",
        text: t("qrScan.cameraError"),
        duration: 3000,
      });
      navigate("/dashboard");
    }
  };

  return (
    <Page className="flex flex-col items-center justify-center bg-black">
      {/* Trước đây trang này không có cách nào thoát ra nếu camera không phản hồi (bị kẹt hẳn) —
          thêm nút quay lại để luôn có đường thoát thủ công */}
      <Header title={t("qrScan.title")} showBackIcon onBackClick={() => navigate("/dashboard")} />
      <Box className="flex flex-col items-center space-y-4">
        <Box className="w-64 h-64 border-2 border-tingo-red border-dashed rounded-3xl flex items-center justify-center">
          <Icon icon={"zi-scan" as any} size={48} className="text-white opacity-50" />
        </Box>
        <Text className="text-white font-medium text-center">{t("qrScan.preparing")}</Text>
        {import.meta.env.DEV && showManual && (
          <Box className="w-80 max-w-full p-3 border border-dashed border-gray-500 rounded-xl space-y-2">
            <Text size="xSmall" className="text-gray-300 dark:text-gray-600">
              {t("qrScan.devPasteHint")}
            </Text>
            <Input
              placeholder={t("qrScan.pastePlaceholder")}
              value={manualContent}
              onChange={(e) => setManualContent(e.target.value)}
            />
            <Button
              fullWidth
              size="small"
              disabled={!manualContent.trim()}
              onClick={() => handleContent(manualContent)}
            >
              {t("qrScan.processCode")}
            </Button>
          </Box>
        )}
      </Box>
    </Page>
  );
};

export default ScanPage;
