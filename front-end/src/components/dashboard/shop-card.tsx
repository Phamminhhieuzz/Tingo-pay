/**
 * ShopCard — Thẻ hiển thị thông tin một cửa hàng (tên, địa chỉ) trên trang Dashboard,
 * bấm vào sẽ điều hướng tới trang chi tiết cửa hàng. Props chính: `shop` (Shop).
 */
import React from "react";
import { Box, Text, Icon } from "zmp-ui";
import { useNavigate } from "react-router-dom";
import { Shop } from "@/state/atoms";
import iconMerchant from "@/static/icon-merchant.png";
import Pressable from "@/components/ui/pressable";

interface ShopCardProps {
  shop: Shop;
}

const ShopCard: React.FC<ShopCardProps> = ({ shop }) => {
  const navigate = useNavigate();

  return (
    <Pressable
      onClick={() => navigate(`/shop/${shop.id}`)}
      className="fade-in-up bg-gradient-to-br from-tingo-red to-[#b8321e] p-5 rounded-3xl shadow-float text-white flex items-start space-x-4 relative overflow-hidden"
    >
      {/* Vệt sáng trang trí ở góc thẻ */}
      <Box className="absolute -top-6 -right-6 w-28 h-28 bg-white/15 rounded-full blur-2xl" />

      <Box className="bg-white dark:bg-gray-800 p-1 rounded-2xl shadow-sm">
        <img src={iconMerchant} alt="Merchant" className="w-12 h-12 rounded-xl" />
      </Box>
      <Box className="flex-1 min-w-0">
        <Text className="font-bold text-lg leading-tight mb-1 truncate">{shop.name}</Text>
        <Text size="small" className="text-white/80 leading-snug truncate">{shop.address}</Text>
      </Box>
      <Icon icon="zi-chevron-right" className="text-white/70 self-center" />
    </Pressable>
  );
};

export default ShopCard;

