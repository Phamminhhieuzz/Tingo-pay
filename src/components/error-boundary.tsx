/**
 * ErrorBoundary — Component lớp (class component) dùng để bọc quanh các phần UI
 * có nguy cơ lỗi runtime, hiển thị giao diện lỗi thân thiện kèm nút "Thử lại"
 * thay vì làm crash toàn bộ ứng dụng. Props chính: `children`, `fallback` (UI thay thế tùy chỉnh),
 * `title` (tiêu đề lỗi), `onRetry` (callback khi bấm thử lại).
 */
import React, { Component, ErrorInfo, ReactNode } from "react";
import { Box, Text, Button, Icon } from "zmp-ui";

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
  title?: string;
  description?: string;
  retryLabel?: string;
  onRetry?: () => void;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  // React gọi hàm này khi component con bên dưới ném lỗi trong quá trình render,
  // dùng để cập nhật state và chuyển sang hiển thị UI lỗi.
  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  // Ghi log chi tiết lỗi (kèm stack trace) ra console để debug.
  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      // Nếu có truyền sẵn UI fallback tùy chỉnh thì ưu tiên dùng nó,
      // ngược lại hiển thị UI lỗi mặc định bên dưới.
      if (this.props.fallback) return this.props.fallback;

      return (
        <Box className="p-6 bg-red-50 rounded-3xl border border-red-100 flex flex-col items-center text-center">
          <Icon icon="zi-warning-solid" className="text-red-500 mb-3" size={32} />
          <Text className="font-bold text-red-800 mb-1">
            {this.props.title || "Đã có lỗi xảy ra"}
          </Text>
          <Text size="xSmall" className="text-red-400 mb-4">
            {this.props.description || "Không thể tải dữ liệu phần này. Vui lòng thử lại sau."}
          </Text>
          <Button
            variant="secondary"
            size="small"
            className="rounded-xl border-red-200 text-red-600"
            onClick={() => {
              // Reset lại trạng thái lỗi để render lại children, đồng thời
              // gọi callback onRetry (nếu có) để component cha thử tải lại dữ liệu.
              this.setState({ hasError: false });
              this.props.onRetry?.();
            }}
          >
            {this.props.retryLabel || "Thử lại"}
          </Button>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
