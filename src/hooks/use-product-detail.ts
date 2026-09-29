/**
 * Hook lấy thông tin chi tiết 1 sản phẩm loa thanh toán theo id (dùng cho trang chi tiết sản phẩm).
 * Tự fetch lại mỗi khi id thay đổi, quản lý state loading/error nội bộ (không dùng atom chung).
 */
import { useEffect, useState } from "react";
import { Product } from "@/state/atoms";
import { apiService } from "@/utils/api";

export const useProductDetail = (id: string | undefined) => {
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Gọi API GET /products/:id để lấy chi tiết sản phẩm
  const fetchProduct = async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiService.get<Product>(`/products/${id}`);
      setProduct(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải sản phẩm");
    } finally {
      setIsLoading(false);
    }
  };

  // Tự động fetch lại sản phẩm mỗi khi id thay đổi (ví dụ chuyển từ sản phẩm này sang sản phẩm khác)
  useEffect(() => {
    fetchProduct();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return { product, isLoading, error, fetchProduct };
};
