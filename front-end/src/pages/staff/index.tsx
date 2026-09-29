/**
 * Trang Quản lý nhân viên — route `/staff`.
 * Xem danh sách nhân viên của cửa hàng đầu tiên, tra cứu người dùng theo SĐT để thêm làm
 * nhân viên (Quản lý/Nhân viên), và xoá nhân viên khỏi cửa hàng.
 */
import React, { useState } from "react";
import { Page, Box, Text, Button, Icon, Header, Input, useSnackbar } from "zmp-ui";
import { useNavigate } from "react-router-dom";
import { useStaff } from "@/hooks/use-staff";
import { SkeletonList } from "@/components/ui/skeleton";
import EmptyState from "@/components/ui/empty-state";
import { useTranslation } from "@/i18n";

const StaffPage: React.FC = () => {
  const { openSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const { shopId, staff, isLoading, error, fetchStaff, lookupUserByPhone, addStaff, removeStaff } = useStaff();
  const { t } = useTranslation();

  const [phone, setPhone] = useState("");
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [foundUser, setFoundUser] = useState<{ id: string; fullName: string; phoneZalo: string } | null>(null);
  const [selectedRole, setSelectedRole] = useState<"SHOP_STAFF" | "SHOP_MANAGER">("SHOP_STAFF");
  const [isAdding, setIsAdding] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const handleLookup = async () => {
    if (!phone.trim()) return;
    setIsLookingUp(true);
    setFoundUser(null);
    try {
      const user = await lookupUserByPhone(phone.trim());
      setFoundUser(user);
    } catch (err: any) {
      openSnackbar({ type: "error", text: err.message || t("staff.userNotFound"), duration: 3000 });
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleAdd = async () => {
    if (!foundUser) return;
    setIsAdding(true);
    try {
      await addStaff(foundUser.id, selectedRole);
      openSnackbar({ type: "success", text: `${t("staff.addedSuccess")} ${foundUser.fullName} ${t("staff.addedSuccessSuffix")}`, duration: 3000 });
      setFoundUser(null);
      setPhone("");
    } catch (err: any) {
      openSnackbar({ type: "error", text: err.message || t("staff.addFailed"), duration: 4000 });
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemove = async (userId: string, name: string) => {
    setRemovingId(userId);
    try {
      await removeStaff(userId);
      openSnackbar({ type: "success", text: `${t("staff.removedSuccess")} ${name} ${t("staff.removedSuccessSuffix")}`, duration: 2500 });
    } catch (err: any) {
      openSnackbar({ type: "error", text: err.message || t("staff.removeFailed"), duration: 4000 });
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <Page className="flex flex-col bg-tingo-bg">
      <Header title={t("staff.pageTitle")} showBackIcon />

      <Box className="flex-1 px-4 pt-16 pb-6 space-y-4">
        {!shopId ? (
          <EmptyState
            icon="🏬"
            title={t("staff.noShopTitle")}
            description={t("staff.noShopDesc")}
            actionLabel={t("dashboard.createShop")}
            onAction={() => navigate("/shop/create")}
          />
        ) : (
          <>
            <Box className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-card space-y-3">
              <Text className="font-bold text-gray-800 dark:text-gray-100">{t("staff.addNewStaff")}</Text>
              <Box className="flex space-x-2">
                <Box className="flex-1">
                  <Input placeholder={t("staff.phonePlaceholder")} value={phone} onChange={(e) => setPhone(e.target.value)} />
                </Box>
                <Button size="small" loading={isLookingUp} disabled={isLookingUp} className="rounded-xl" onClick={handleLookup}>
                  {t("staff.find")}
                </Button>
              </Box>

              {foundUser && (
                <Box className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3 space-y-2">
                  <Text className="font-bold text-gray-700 dark:text-gray-200">{foundUser.fullName}</Text>
                  <Text size="xSmall" className="text-gray-400 dark:text-gray-500">{foundUser.phoneZalo}</Text>
                  <Box className="flex space-x-2">
                    <Button
                      size="small"
                      variant={selectedRole === "SHOP_STAFF" ? "primary" : "secondary"}
                      className="rounded-xl flex-1"
                      onClick={() => setSelectedRole("SHOP_STAFF")}
                    >
                      {t("staff.staffRole")}
                    </Button>
                    <Button
                      size="small"
                      variant={selectedRole === "SHOP_MANAGER" ? "primary" : "secondary"}
                      className="rounded-xl flex-1"
                      onClick={() => setSelectedRole("SHOP_MANAGER")}
                    >
                      {t("staff.manager")}
                    </Button>
                  </Box>
                  <Button fullWidth size="small" loading={isAdding} disabled={isAdding} className="bg-tingo-red text-white rounded-xl" onClick={handleAdd}>
                    {t("staff.addToShop")}
                  </Button>
                </Box>
              )}
            </Box>

            <Box className="space-y-2">
              <Text className="font-bold text-gray-800 dark:text-gray-100 px-1">{t("staff.staffList")}</Text>
              {isLoading ? (
                <SkeletonList count={2} itemClassName="h-[72px]" />
              ) : error ? (
                <Box className="p-4 bg-red-50 rounded-2xl border border-red-100 text-center">
                  <Text size="small" className="text-red-500 mb-2">{error}</Text>
                  <Button size="small" variant="secondary" className="rounded-xl" onClick={fetchStaff}>{t("common.retry")}</Button>
                </Box>
              ) : staff.length === 0 ? (
                <EmptyState icon="👥" title={t("staff.noStaff")} description={t("staff.noStaffDesc")} />
              ) : (
                staff.map((s) => (
                  <Box key={s.id} className="fade-in-up bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-card flex items-center space-x-3">
                    <Box className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                      <Icon icon="zi-user-solid" className="text-tingo-blue" />
                    </Box>
                    <Box className="flex-1">
                      <Text className="font-bold text-gray-800 dark:text-gray-100">{s.user.fullName}</Text>
                      <Text size="xSmall" className="text-gray-400 dark:text-gray-500">{s.user.phoneZalo}</Text>
                      <Text size="xSmall" className="text-tingo-blue font-medium">
                        {s.role === "SHOP_MANAGER" ? t("staff.manager") : t("staff.staffRole")}
                      </Text>
                    </Box>
                    <Button
                      size="small"
                      variant="secondary"
                      loading={removingId === s.user.id}
                      disabled={removingId === s.user.id}
                      className="rounded-xl border-red-200 text-red-600"
                      onClick={() => handleRemove(s.user.id, s.user.fullName)}
                    >
                      {t("bankAccount.delete")}
                    </Button>
                  </Box>
                ))
              )}
            </Box>
          </>
        )}
      </Box>
    </Page>
  );
};

export default StaffPage;
