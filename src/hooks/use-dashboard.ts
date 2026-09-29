/**
 * Hook fetch dữ liệu cho trang Dashboard: danh sách cửa hàng (shops), thiết bị loa (devices)
 * và sản phẩm loa chào bán (products). Kết quả được lưu vào các atom tương ứng để các
 * component khác trong app dùng chung.
 */
import { useEffect } from "react";
import { useSetAtom } from "jotai";
import {
  shopsAtom,
  devicesAtom,
  productsAtom,
  isLoadingShopsAtom,
  isLoadingDevicesAtom,
  isLoadingProductsAtom,
  Shop,
  Device,
  Product
} from "@/state/atoms";
import { apiService } from "@/utils/api";
import { BackendDevice, mapBackendDevice } from "./use-devices";

export const useDashboardData = () => {
  const setShops = useSetAtom(shopsAtom);
  const setDevices = useSetAtom(devicesAtom);
  const setProducts = useSetAtom(productsAtom);
  
  const setIsLoadingShops = useSetAtom(isLoadingShopsAtom);
  const setIsLoadingDevices = useSetAtom(isLoadingDevicesAtom);
  const setIsLoadingProducts = useSetAtom(isLoadingProductsAtom);

  // Gọi API GET /shops, lưu kết quả vào shopsAtom
  const fetchShops = async () => {
    setIsLoadingShops(true);
    try {
      const data = await apiService.get<Shop[]>("/shops");
      setShops(data);
    } catch (err) {
      console.error("Failed to fetch shops:", err);
    } finally {
      setIsLoadingShops(false);
    }
  };

  // Gọi API GET /devices, lưu kết quả vào devicesAtom
  const fetchDevices = async () => {
    setIsLoadingDevices(true);
    try {
      const data = await apiService.get<BackendDevice[]>("/devices");
      setDevices(data.map(mapBackendDevice));
    } catch (err) {
      console.error("Failed to fetch devices:", err);
    } finally {
      setIsLoadingDevices(false);
    }
  };

  // Gọi API GET /products, lưu kết quả vào productsAtom
  const fetchProducts = async () => {
    setIsLoadingProducts(true);
    try {
      // Products API in OpenAPI returns simple array
      const data = await apiService.get<Product[]>("/products");
      setProducts(data);
    } catch (err) {
      console.error("Failed to fetch products:", err);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  // Gọi đồng thời cả 3 API trên để load toàn bộ dữ liệu Dashboard 1 lần
  const refreshAll = async () => {
    try {
      await Promise.all([
        fetchShops(),
        fetchDevices(),
        fetchProducts(),
      ]);
    } catch (err) {
      console.error("Error refreshing dashboard:", err);
    }
  };

  // Tự động load dữ liệu ngay khi hook được mount lần đầu
  useEffect(() => {
    refreshAll();
  }, []);

  return { refreshAll, fetchShops, fetchDevices, fetchProducts };
};
