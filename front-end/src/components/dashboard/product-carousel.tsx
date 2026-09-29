/**
 * ProductCarousel — Carousel cuộn ngang hiển thị danh sách sản phẩm loa thanh toán
 * chào bán trên trang Dashboard, có giá, nhãn Hot/Bán chạy và nút "Mua nhanh"
 * dẫn tới trang chi tiết sản phẩm. Props chính: `products` (Product[]).
 */
import React from "react";
import { Box, Text, Button, Icon } from "zmp-ui";
import { useNavigate } from "react-router-dom";
import { Product } from "@/state/atoms";
import { useTranslation } from "@/i18n";

interface ProductCarouselProps {
  products: Product[];
}

const ProductCarousel: React.FC<ProductCarouselProps> = ({ products }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Định dạng số tiền theo chuẩn tiền tệ Việt Nam (VND)
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const getImageUrl = (imageName: string | undefined) => {
    if (!imageName) return "";
    // If it's already a full URL, return it
    if (imageName.startsWith("http")) return imageName;
    // Resolve dynamic path from static folder in Vite
    return new URL(`../../static/${imageName}`, import.meta.url).href;
  };

  return (
    <Box className="overflow-x-auto flex space-x-4 px-4 pb-4 no-scrollbar">
      {products.map((product) => (
        <Box key={product.id} className="min-w-[280px] bg-white dark:bg-gray-800 rounded-3xl shadow-md overflow-hidden flex flex-col border border-gray-50 dark:border-gray-800">
          <Box className="relative h-40">
            <img 
              src={getImageUrl(product.imageUrls && product.imageUrls.length > 0 ? product.imageUrls[0] : undefined)} 
              alt={product.name} 
              className="w-full h-full object-cover" 
            />
            <Box className="absolute top-3 right-3 flex flex-col space-y-2">
              {product.isHot && (
                <Box className="bg-red-500 text-white text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wider shadow-sm">{t("product.hot")}</Box>
              )}
              {product.isBestSeller && (
                <Box className="bg-orange-500 text-white text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wider shadow-sm">{t("product.bestSeller")}</Box>
              )}
            </Box>
          </Box>
          
          <Box className="p-4 flex-1 flex flex-col">
            <Text size="xSmall" className="text-gray-400 dark:text-gray-500 mb-0.5">{product.model}</Text>
            <Text className="font-bold text-gray-800 dark:text-gray-100 mb-2 leading-tight">{product.name}</Text>
            
            <Box className="flex items-baseline space-x-2 mb-3">
              <Text className="text-tingo-red font-bold text-lg">{formatPrice(product.price)}</Text>
              {product.oldPrice && (
                <Text size="small" className="text-gray-300 dark:text-gray-600 line-through">{formatPrice(product.oldPrice)}</Text>
              )}
            </Box>
            
            <Box className="flex flex-wrap gap-1 mb-4">
              {product.features?.map((feature, i) => (
                <Box key={i} className="bg-gray-50 dark:bg-gray-700 px-2 py-0.5 rounded text-[10px] text-gray-500 dark:text-gray-400">{feature}</Box>
              ))}
            </Box>
            
            <Button
              size="small"
              className="mt-auto bg-tingo-blue rounded-xl font-bold py-2"
              onClick={() => navigate(`/product/${product.id}`)}
            >
              {t("product.quickBuy")}
            </Button>
          </Box>
        </Box>
      ))}
    </Box>
  );
};

export default ProductCarousel;
