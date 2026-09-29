/**
 * Trang Giỏ hàng — route `/cart`.
 * Backend hiện chỉ hỗ trợ 1 đơn hàng = 1 loại loa (không có bảng nhiều dòng sản phẩm/đơn),
 * nên "giỏ hàng" ở đây là chọn 1 sản phẩm rồi đi thẳng vào luồng đặt hàng có sẵn ở
 * /product/:id (chọn số lượng, nhập người nhận, đặt hàng).
 */
import React, { useEffect, useState } from "react";
import { Page, Box, Text, Header, Button, Icon } from "zmp-ui";
import { useNavigate } from "react-router-dom";
import { Product } from "@/state/atoms";
import { apiService } from "@/utils/api";
import { SkeletonList } from "@/components/ui/skeleton";
import EmptyState from "@/components/ui/empty-state";
import Pressable from "@/components/ui/pressable";
import { useTranslation } from "@/i18n";

const formatPrice = (price: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);

const getImageUrl = (imageName: string | undefined) => {
  if (!imageName) return "";
  if (imageName.startsWith("http")) return imageName;
  return new URL(`../../static/${imageName}`, import.meta.url).href;
};

const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiService.get<Product[]>("/products");
      setProducts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("dashboard.errorLoadProducts"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <Page className="flex flex-col bg-tingo-bg">
      <Header title={t("cart.title")} showBackIcon />

      <Box className="flex-1 px-4 pt-16 pb-6 space-y-3">
        <Text size="small" className="text-gray-400 dark:text-gray-500 px-1">
          {t("cart.subtitle")}
        </Text>

        {isLoading ? (
          <SkeletonList count={3} itemClassName="h-[88px]" />
        ) : error ? (
          <Box className="p-6 bg-red-50 rounded-3xl border border-red-100 flex flex-col items-center text-center">
            <Icon icon="zi-warning-solid" className="text-red-500 mb-3" size={32} />
            <Text className="font-bold text-red-800 mb-1">{t("cart.errorLoad")}</Text>
            <Text size="xSmall" className="text-red-400 mb-4">{error}</Text>
            <Button variant="secondary" size="small" className="rounded-xl border-red-200 text-red-600" onClick={fetchProducts}>
              {t("common.retry")}
            </Button>
          </Box>
        ) : products.length === 0 ? (
          <EmptyState icon="📦" title={t("cart.empty")} description={t("cart.emptyDesc")} />
        ) : (
          products.map((product) => (
            <Pressable
              key={product.id}
              onClick={() => navigate(`/product/${product.id}`)}
              className="fade-in-up bg-white dark:bg-gray-800 rounded-2xl p-3 shadow-card flex items-center space-x-3"
            >
              <img
                src={getImageUrl(product.imageUrls?.[0])}
                alt={product.name}
                className="w-16 h-16 rounded-xl object-cover bg-gray-50 dark:bg-gray-700 shrink-0"
              />
              <Box className="flex-1">
                <Text size="xSmall" className="text-gray-400 dark:text-gray-500">{product.model}</Text>
                <Text className="font-bold text-gray-800 dark:text-gray-100">{product.name}</Text>
                <Text className="text-tingo-red font-bold">{formatPrice(product.price)}</Text>
              </Box>
              <Icon icon="zi-chevron-right" className="text-gray-300 dark:text-gray-600" />
            </Pressable>
          ))
        )}
      </Box>
    </Page>
  );
};

export default CartPage;
