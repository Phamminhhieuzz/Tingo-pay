/**
 * Hook quản lý thao tác tạo cửa hàng. Backend cho phép cả CUSTOMER gọi POST /shops — đây
 * chính là cách một người dùng thường trở thành Chủ cửa hàng lần đầu (tạo cửa hàng đầu tiên).
 * Response trả kèm access_token + user mới (đã nâng vai trò lên SHOP_OWNER), nên hook này
 * lưu token mới và cập nhật atom user/role luôn, không cần đăng nhập lại.
 */
import { useSetAtom } from "jotai";
import { currentUserAtom, userRoleAtom, Shop } from "@/state/atoms";
import { apiService, setAccessToken } from "@/utils/api";
import { BackendAuthUser, mapBackendUser } from "@/utils/auth";

export interface CreateShopPayload {
  name: string;
  address: string;
}

interface CreateShopResponse {
  shop: Shop;
  access_token: string;
  user: BackendAuthUser;
}

// Sinh mã cửa hàng ngắn, đủ khác biệt để tránh trùng ràng buộc unique ở backend
const generateShopCode = () => `SHOP-${Date.now().toString(36).toUpperCase()}`;

export const useShops = () => {
  const setCurrentUser = useSetAtom(currentUserAtom);
  const setUserRole = useSetAtom(userRoleAtom);

  // Gọi API POST /shops để tạo cửa hàng đầu tiên; sau khi thành công, lưu access token mới
  // và cập nhật vai trò hiện tại thành SHOP_OWNER
  const createShop = async (payload: CreateShopPayload): Promise<Shop> => {
    const response = await apiService.post<CreateShopResponse>("/shops", {
      ...payload,
      code: generateShopCode(),
    });

    await setAccessToken(response.access_token);
    setCurrentUser(mapBackendUser(response.user));
    setUserRole("SHOP_OWNER");

    return response.shop;
  };

  return { createShop };
};
