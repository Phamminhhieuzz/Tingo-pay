/**
 * Trang Chi tiết thiết bị loa — route `/device/:id`.
 * Xem thông tin thiết bị, huỷ liên kết khỏi cửa hàng (#5), và báo hỏng/báo lỗi thiết bị
 * kèm ảnh mô tả lỗi tuỳ chọn (#6). Ảnh báo lỗi hiện lưu tạm trong container backend.
 */
import React, { useRef, useState } from "react";
import { Page, Box, Text, Button, Icon, Header, Input, useSnackbar } from "zmp-ui";
import { Skeleton, SkeletonList } from "@/components/ui/skeleton";
import EmptyState from "@/components/ui/empty-state";
import StatusChip from "@/components/ui/status-chip";
import { useParams, useNavigate } from "react-router-dom";
import { useDeviceDetail, useDeviceIssues } from "@/hooks/use-devices";
import { getFileUrl } from "@/utils/api";
import { useTranslation } from "@/i18n";

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", year: "numeric" });

const DeviceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { openSnackbar } = useSnackbar();
  const { device, isLoading, error, fetchDevice, unlinkDevice } = useDeviceDetail(id);
  const { issues, isLoading: loadingIssues, error: issuesError, fetchIssues, reportIssue } = useDeviceIssues(id);
  const { t } = useTranslation();

  const [isUnlinking, setIsUnlinking] = useState(false);
  const [description, setDescription] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [isReporting, setIsReporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUnlink = async () => {
    setIsUnlinking(true);
    try {
      await unlinkDevice();
      openSnackbar({ type: "success", text: t("device.unlinkSuccess"), duration: 3000 });
    } catch (err: any) {
      openSnackbar({ type: "error", text: `${t("device.unlinkFailed")} ${err.message || t("roleSelection.unknownReason")}`, duration: 4000 });
    } finally {
      setIsUnlinking(false);
    }
  };

  const handleReportIssue = async () => {
    if (!description.trim()) {
      openSnackbar({ type: "warning", text: t("device.reportMissingDesc"), duration: 3000 });
      return;
    }
    setIsReporting(true);
    try {
      await reportIssue(description.trim(), photo || undefined);
      setDescription("");
      setPhoto(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      openSnackbar({ type: "success", text: t("device.reportSuccess"), duration: 3000 });
    } catch (err: any) {
      openSnackbar({ type: "error", text: `${t("device.reportFailed")} ${err.message || t("roleSelection.unknownReason")}`, duration: 4000 });
    } finally {
      setIsReporting(false);
    }
  };

  if (isLoading) {
    return (
      <Page className="flex flex-col bg-tingo-bg">
        <Header title={t("device.detailTitle")} showBackIcon />
        <Box className="px-4 pt-16 space-y-3">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-48 w-full" />
        </Box>
      </Page>
    );
  }

  if (error || !device) {
    return (
      <Page className="flex flex-col bg-tingo-bg">
        <Header title={t("device.detailTitle")} showBackIcon />
        <Box className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <Icon icon="zi-warning-solid" className="text-red-500 mb-3" size={32} />
          <Text className="font-bold text-gray-700 dark:text-gray-200 mb-1">{t("device.errorLoadDetail")}</Text>
          <Text size="small" className="text-gray-400 dark:text-gray-500 mb-4">{error || t("device.notFound")}</Text>
          <Button variant="secondary" size="small" onClick={fetchDevice} className="rounded-xl">{t("common.retry")}</Button>
        </Box>
      </Page>
    );
  }

  const isOnline = device.opStatus === "ONLINE";

  return (
    <Page className="flex flex-col bg-tingo-bg pb-6">
      <Header title={t("device.detailTitle")} showBackIcon />

      <Box className="flex-1 px-4 pt-16 pb-4 space-y-4">
        <Box className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-card space-y-3">
          <Box className="flex items-center justify-between">
            <Text className="font-bold text-gray-800 dark:text-gray-100 text-lg">{device.model}</Text>
            <Box className="flex items-center space-x-1.5">
              <Box className={`w-2 h-2 rounded-full ${isOnline ? "bg-green-500" : "bg-gray-300 dark:bg-gray-500"}`} />
              <Text size="xSmall" className={isOnline ? "text-green-600 font-medium" : "text-gray-400 dark:text-gray-500"}>
                {isOnline ? t("device.online") : t("device.offline")}
              </Text>
            </Box>
          </Box>
          <Box>
            <Text size="xSmall" className="text-gray-400 dark:text-gray-500">{t("device.serial")}</Text>
            <Text className="font-bold text-gray-700 dark:text-gray-200">{device.serial}</Text>
          </Box>
          <Box>
            <Text size="xSmall" className="text-gray-400 dark:text-gray-500">{t("device.shopLabel")}</Text>
            <Text className="font-bold text-gray-700 dark:text-gray-200">{device.shopName || t("device.noShopAttached")}</Text>
          </Box>

          {device.shopName && (
            <Button
              fullWidth
              size="small"
              variant="secondary"
              loading={isUnlinking}
              disabled={isUnlinking}
              className="rounded-xl border-red-200 text-red-600 mt-2"
              onClick={handleUnlink}
            >
              {t("device.unlink")}
            </Button>
          )}
        </Box>

        <Box className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-card space-y-3">
          <Text className="font-bold text-gray-800 dark:text-gray-100">{t("device.reportIssue")}</Text>
          <Input
            placeholder={t("device.reportPlaceholder")}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            capture="environment"
            className="text-sm"
            onChange={(e) => setPhoto(e.target.files?.[0] || null)}
          />
          <Button
            fullWidth
            size="small"
            loading={isReporting}
            disabled={isReporting}
            className="bg-tingo-red text-white rounded-xl"
            onClick={handleReportIssue}
          >
            {t("device.submitReport")}
          </Button>
        </Box>

        <Box className="space-y-2">
          <Text className="font-bold text-gray-800 dark:text-gray-100 px-1">{t("device.issueHistory")}</Text>
          {loadingIssues ? (
            <SkeletonList count={2} itemClassName="h-20" />
          ) : issuesError ? (
            <Box className="p-4 bg-red-50 rounded-2xl border border-red-100 text-center">
              <Text size="small" className="text-red-500 mb-2">{issuesError}</Text>
              <Button size="small" variant="secondary" className="rounded-xl" onClick={fetchIssues}>{t("common.retry")}</Button>
            </Box>
          ) : issues.length === 0 ? (
            <EmptyState icon="🛠️" title={t("device.noIssuesYet")} />
          ) : (
            issues.map((issue) => (
              <Box key={issue.id} className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-card space-y-2">
                <Box className="flex items-center justify-between">
                  <StatusChip tone={issue.status === "OPEN" ? "warning" : "success"}>
                    {issue.status === "OPEN" ? t("device.issuePending") : t("device.statusResolved")}
                  </StatusChip>
                  <Text size="xSmall" className="text-gray-400 dark:text-gray-500">{formatDateTime(issue.createdAt)}</Text>
                </Box>
                <Text size="small" className="text-gray-700 dark:text-gray-200">{issue.description}</Text>
                {issue.photoUrl && (
                  <img
                    src={getFileUrl(issue.photoUrl)}
                    alt={t("device.issuePhotoAlt")}
                    className="w-full max-w-[200px] rounded-xl border border-gray-100 dark:border-gray-700"
                  />
                )}
              </Box>
            ))
          )}
        </Box>
      </Box>
    </Page>
  );
};

export default DeviceDetailPage;
