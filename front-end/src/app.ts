/**
 * Entry point của ứng dụng: import các stylesheet toàn cục, khởi tạo cấu hình app từ
 * app-config.json, và mount component gốc (Layout) vào DOM để React render toàn bộ app.
 */
// ZaUI stylesheet
import "zmp-ui/zaui.css";
// Tailwind stylesheet
import "@/css/tailwind.scss";
// Your stylesheet
import "@/css/app.scss";

// React core
import React from "react";
import { createRoot } from "react-dom/client";

// Mount the app
import Layout from "@/components/layout";

// Expose app configuration
import appConfig from "../app-config.json";

// Gắn cấu hình app-config.json vào window để zmp-sdk/zmp-ui có thể đọc (chỉ gắn nếu chưa có,
// tránh ghi đè khi hot-reload trong quá trình dev)
if (!window.APP_CONFIG) {
  window.APP_CONFIG = appConfig as any;
}

// Render component gốc Layout (chứa router & toàn bộ giao diện) vào phần tử #app trong index.html
const root = createRoot(document.getElementById("app")!);
root.render(React.createElement(Layout));
