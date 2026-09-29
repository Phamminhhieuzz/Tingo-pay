/**
 * Trạng thái rỗng dùng chung: biểu tượng (emoji), tiêu đề, mô tả và một nút hành động tuỳ chọn.
 */
import React from "react";
import { Box, Text, Button } from "zmp-ui";

interface EmptyStateProps {
  icon: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, actionLabel, onAction }) => (
  <Box className="fade-in-up flex flex-col items-center justify-center py-14 px-6 text-center">
    <Box className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mb-4">
      <Text className="text-4xl leading-none">{icon}</Text>
    </Box>
    <Text className="font-bold text-gray-800 dark:text-gray-100">{title}</Text>
    {description && (
      <Text size="small" className="text-gray-400 dark:text-gray-500 mt-1 max-w-[260px]">
        {description}
      </Text>
    )}
    {actionLabel && onAction && (
      <Button size="small" className="mt-5 bg-tingo-red text-white rounded-xl px-5" onClick={onAction}>
        {actionLabel}
      </Button>
    )}
  </Box>
);

export default EmptyState;
