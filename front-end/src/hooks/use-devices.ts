/**
 * Hook quản lý thao tác với 1 thiết bị loa: lấy chi tiết, huỷ liên kết khỏi cửa hàng,
 * và báo hỏng/báo lỗi thiết bị (kèm ảnh tuỳ chọn). Quản lý state nội bộ, không dùng atom
 * chung vì các trang này chỉ thao tác trên 1 thiết bị tại 1 thời điểm (giống use-product-detail).
 */
import { useState, useEffect } from "react";
import { Device, DeviceIssue } from "@/state/atoms";
import { apiService, postFormData } from "@/utils/api";

// Backend trả thiết bị kèm quan hệ "shop" lồng bên trong (hoặc null nếu chưa gắn), khác với
// field phẳng "shopName" mà phần còn lại của app dùng để hiển thị — chuyển đổi ở 1 chỗ duy
// nhất để không lặp lại logic này ở use-dashboard.ts và use-devices.ts
export interface BackendDevice extends Omit<Device, "shopName"> {
  shop?: { id: string; name: string } | null;
}

export const mapBackendDevice = (raw: BackendDevice): Device => ({
  ...raw,
  shopName: raw.shop?.name,
});

export const useDeviceDetail = (id: string | undefined) => {
  const [device, setDevice] = useState<Device | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDevice = async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiService.get<BackendDevice>(`/devices/${id}`);
      setDevice(mapBackendDevice(data));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải thiết bị");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDevice();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Huỷ liên kết loa khỏi cửa hàng (giữ nguyên bản ghi thiết bị, chỉ gỡ khỏi shop)
  const unlinkDevice = async (): Promise<Device> => {
    if (!id) throw new Error("Missing device id");
    const updated = mapBackendDevice(await apiService.put<BackendDevice>(`/devices/${id}/unlink`));
    setDevice(updated);
    return updated;
  };

  return { device, isLoading, error, fetchDevice, unlinkDevice };
};

export const useDeviceIssues = (deviceId: string | undefined) => {
  const [issues, setIssues] = useState<DeviceIssue[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchIssues = async () => {
    if (!deviceId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiService.get<DeviceIssue[]>(`/devices/${deviceId}/issues`);
      setIssues(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải lịch sử báo lỗi");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceId]);

  // Gửi báo hỏng thiết bị: mô tả (bắt buộc) + ảnh (tuỳ chọn). Ảnh hiện lưu tạm trong
  // container backend (xem back-end/src/main.ts), sẽ mất khi container khởi động lại.
  const reportIssue = async (description: string, photo?: File): Promise<DeviceIssue> => {
    if (!deviceId) throw new Error("Missing device id");
    const formData = new FormData();
    formData.append("description", description);
    if (photo) {
      formData.append("photo", photo);
    }
    const created = await postFormData<DeviceIssue>(`/devices/${deviceId}/issues`, formData);
    setIssues((prev) => [created, ...prev]);
    return created;
  };

  return { issues, isLoading, error, fetchIssues, reportIssue };
};

// Dành cho nhân viên Tingo: xem toàn bộ báo lỗi ở mọi thiết bị và đánh dấu đã xử lý
export const useStaffDeviceIssues = () => {
  const [issues, setIssues] = useState<DeviceIssue[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAllIssues = async (status?: DeviceIssue["status"]) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiService.get<DeviceIssue[]>("/device-issues", status ? { status } : undefined);
      setIssues(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải danh sách báo lỗi");
    } finally {
      setIsLoading(false);
    }
  };

  const resolveIssue = async (issueId: string): Promise<DeviceIssue> => {
    const updated = await apiService.put<DeviceIssue>(`/device-issues/${issueId}/status`, { status: "RESOLVED" });
    setIssues((prev) => prev.map((i) => (i.id === issueId ? { ...i, status: "RESOLVED" } : i)));
    return updated;
  };

  return { issues, isLoading, error, fetchAllIssues, resolveIssue };
};
