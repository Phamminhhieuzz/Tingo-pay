/**
 * Vùng bấm có phản hồi nhấn (thu nhỏ nhẹ) để cảm giác chạm mượt hơn.
 */
import React from "react";
import { Box } from "zmp-ui";

interface PressableProps {
  onClick?: () => void;
  className?: string;
  children: React.ReactNode;
}

const Pressable: React.FC<PressableProps> = ({ onClick, className = "", children }) => (
  <Box
    onClick={onClick}
    className={`transition-transform duration-150 active:scale-[0.98] ${onClick ? "cursor-pointer" : ""} ${className}`}
  >
    {children}
  </Box>
);

export default Pressable;
