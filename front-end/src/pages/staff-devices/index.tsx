/**
 * Trang nhân viên Tingo — route `/staff/device-issues`: hàng đợi báo hỏng/báo lỗi thiết bị
 * ở mọi cửa hàng. Xem mô tả + ảnh (nếu có), bấm "Đã xử lý" để đóng báo cáo.
 */
import React, { useEffect, useState } from "react";
import { Box, Page, Text, Header, Button, Icon, useSnackbar } from "zmp-ui";
import { useAtomValue } from "jotai";
import { userRoleAtom, DeviceIssue } from "@/state/atoms";
import { useStaffDeviceIssues } from "@/hooks/use-devices";
import { getFileUrl } from "@/utils/api";
import BottomNav from "@/components/bottom-nav";
import SectionCard from "@/components/ui/section-card";
import StatusChip from "@/components/ui/status-chip";
import { SkeletonList } from "@/components/ui/skeleton";
import EmptyState from "@/components/ui/empty-state";
import { useTranslation } from "@/i18n";

const formatDateTime = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", year: "numeric" });
};

const StaffDeviceIssuesPage: React.FC = () => {
  const role = useAtomValue(userRoleAtom);
  const isStaff = role === "STAFF";
  const { openSnackbar } = useSnackbar();
  const { issues, isLoading, error, fetchAllIssues, resolveIssue } = useStaffDeviceIssues();
  const [tab, setTab] = useState<DeviceIssue["status"]>("OPEN");
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const { t } = useTranslation();

  const TABS: { key: DeviceIssue["status"]; label: string }[] = [
    { key: "OPEN", label: t("staffDevices.tabOpen") },
    { key: "RESOLVED", label: t("staffDevices.tabResolved") },
  ];

  useEffect(() => {
    if (isStaff) fetchAllIssues(tab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStaff, tab]);

  if (!isStaff) {
    return (
      <Page className="bg-tingo-bg">
        <Header title={t("staffDevices.title")} showBackIcon />
        <Box className="pt-16">
          <EmptyState icon="🔒" title={t("staffDevices.noAccess")} description={t("staffDevices.noAccessDesc")} />
        </Box>
      </Page>
    );
  }

  const handleResolve = async (issueId: string) => {
    setResolvingId(issueId);
    try {
      await resolveIssue(issueId);
      openSnackbar({ type: "success", text: t("staffDevices.resolved"), duration: 2000 });
    } catch (err) {
      openSnackbar({ type: "error", text: err instanceof Error ? err.message : t("staffDevices.updateFailed"), duration: 3500 });
    } finally {
      setResolvingId(null);
    }
  };

  return (
    <Page className="flex flex-col bg-tingo-bg pb-24">
      <Header title={t("staffDevices.title")} showBackIcon={false} />
      <Box className="flex-1 px-4 pt-16 pb-4 space-y-3 fade-in-up">
        <Box className="flex space-x-2 overflow-x-auto no-scrollbar pb-1">
          {TABS.map((tabItem) => (
            <Button
              key={tabItem.key}
              size="small"
              variant={tab === tabItem.key ? "primary" : "secondary"}
              className={`rounded-full whitespace-nowrap ${tab === tabItem.key ? "bg-tingo-red text-white" : ""}`}
              onClick={() => setTab(tabItem.key)}
            >
              {tabItem.label}
            </Button>
          ))}
        </Box>

        {isLoading ? (
          <SkeletonList count={3} itemClassName="h-28" />
        ) : error ? (
          <EmptyState icon="⚠️" title={t("staffDevices.errorLoad")} description={error} actionLabel={t("common.retry")} onAction={() => fetchAllIssues(tab)} />
        ) : issues.length === 0 ? (
          <EmptyState icon="✅" title={tab === "OPEN" ? t("staffDevices.noOpen") : t("staffDevices.noResolved")} />
        ) : (
          issues.map((issue) => (
            <SectionCard key={issue.id}>
              <Box className="flex items-start justify-between mb-2">
                <Box className="flex-1 min-w-0">
                  <Text className="font-bold text-gray-800 dark:text-gray-100">{issue.device?.model || t("staffDevices.deviceFallback")}</Text>
                  <Text size="xSmall" className="text-gray-400 dark:text-gray-500">
                    {issue.reportedBy?.fullName} • {issue.reportedBy?.phoneZalo} • {formatDateTime(issue.createdAt)}
                  </Text>
                </Box>
                <StatusChip tone={issue.status === "OPEN" ? "warning" : "success"}>
                  {issue.status === "OPEN" ? t("staffDevices.tabOpen") : t("staffDevices.tabResolved")}
                </StatusChip>
              </Box>
              <Text size="small" className="text-gray-600 dark:text-gray-300 mb-2">{issue.description}</Text>
              {issue.photoUrl && (
                <img
                  src={getFileUrl(issue.photoUrl)}
                  alt={t("staffDevices.photoAlt")}
                  className="w-full h-40 object-cover rounded-xl mb-2"
                />
              )}
              {issue.status === "OPEN" && (
                <Button
                  fullWidth
                  size="small"
                  loading={resolvingId === issue.id}
                  disabled={resolvingId === issue.id}
                  className="bg-tingo-red text-white font-bold rounded-xl"
                  onClick={() => handleResolve(issue.id)}
                >
                  <Icon icon="zi-check-circle-solid" size={16} /> {t("staffDevices.resolve")}
                </Button>
              )}
            </SectionCard>
          ))
        )}
      </Box>
      <BottomNav role={role} />
    </Page>
  );
};

export default StaffDeviceIssuesPage;
