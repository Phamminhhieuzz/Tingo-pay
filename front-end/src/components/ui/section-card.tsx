/**
 * Khối nội dung nền trắng, bo góc, đổ bóng nhẹ thống nhất cho toàn app; có thể kèm tiêu đề.
 */
import React from "react";
import { Box, Text } from "zmp-ui";

interface SectionCardProps {
  title?: string;
  className?: string;
  children: React.ReactNode;
}

const SectionCard: React.FC<SectionCardProps> = ({ title, className = "", children }) => (
  <Box className={`bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-card ${className}`}>
    {title && <Text className="font-bold text-gray-800 dark:text-gray-100 mb-2">{title}</Text>}
    {children}
  </Box>
);

export default SectionCard;
