/**
 * Hook quản lý nhân viên của cửa hàng đầu tiên của Chủ cửa hàng: xem danh sách, tra cứu
 * người dùng theo SĐT để thêm, và xoá nhân viên. Dùng state nội bộ, không cần atom chung
 * vì trang Nhân viên là nơi duy nhất cần dữ liệu này.
 */
import { useEffect, useState } from "react";
import { useAtomValue } from "jotai";
import { shopsAtom, ShopStaff } from "@/state/atoms";
import { apiService } from "@/utils/api";

interface ShopWithStaff {
  id: string;
  staffRoles: ShopStaff[];
}

export const useStaff = () => {
  const shops = useAtomValue(shopsAtom);
  const shopId = shops[0]?.id;

  const [staff, setStaff] = useState<ShopStaff[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Gọi GET /shops/:id để lấy danh sách nhân viên (staffRoles) của cửa hàng đầu tiên
  const fetchStaff = async () => {
    if (!shopId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiService.get<ShopWithStaff>(`/shops/${shopId}`);
      setStaff(data.staffRoles || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải danh sách nhân viên");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shopId]);

  // Tra cứu người dùng theo SĐT (họ phải đã đăng nhập app ít nhất 1 lần) trước khi thêm làm nhân viên
  const lookupUserByPhone = async (phone: string) => {
    return apiService.get<{ id: string; fullName: string; phoneZalo: string }>(
      "/shops/staff/lookup",
      { phone },
    );
  };

  // Thêm 1 người dùng (đã biết userId từ lookupUserByPhone) làm nhân viên cửa hàng
  const addStaff = async (userId: string, role: "SHOP_MANAGER" | "SHOP_STAFF") => {
    if (!shopId) throw new Error("Chưa có cửa hàng để thêm nhân viên");
    await apiService.put(`/shops/${shopId}/staff/${userId}`, { role });
    await fetchStaff();
  };

  // Xoá 1 nhân viên khỏi cửa hàng
  const removeStaff = async (userId: string) => {
    if (!shopId) throw new Error("Chưa có cửa hàng");
    await apiService.delete(`/shops/${shopId}/staff/${userId}`);
    setStaff((prev) => prev.filter((s) => s.user.id !== userId));
  };

  return { shopId, staff, isLoading, error, fetchStaff, lookupUserByPhone, addStaff, removeStaff };
};
