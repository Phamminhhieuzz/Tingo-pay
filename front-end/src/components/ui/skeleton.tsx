/**
 * Khung xương hiển thị khi đang tải dữ liệu, thay cho vòng xoay để trang không "nhảy" bố cục.
 */
import React from "react";
import { Box } from "zmp-ui";

export const Skeleton: React.FC<{ className?: string }> = ({ className = "" }) => (
  <Box className={`animate-pulse rounded-2xl bg-gray-200/70 dark:bg-gray-700/70 ${className}`} />
);

export const SkeletonList: React.FC<{ count?: number; itemClassName?: string }> = ({
  count = 3,
  itemClassName = "h-20",
}) => (
  <Box className="space-y-3">
    {Array.from({ length: count }).map((_, i) => (
      <Skeleton key={i} className={`w-full ${itemClassName}`} />
    ))}
  </Box>
);
