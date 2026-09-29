import { defineConfig, loadEnv } from "vite";
import zaloMiniApp from "zmp-vite-plugin";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default ({ mode }: { mode: string }) => {
  const env = loadEnv(mode, process.cwd(), "");
  // Mặc định proxy /api sang server thật; đặt VITE_API_TARGET=http://localhost:3033 trong
  // front-end/.env (hoặc biến môi trường khi chạy lệnh) để trỏ tạm sang backend chạy local.
  const apiTarget = env.VITE_API_TARGET || "https://tingo-api-gateway.vietqr.vn";

  return defineConfig({
    root: "./",
    base: "",
    plugins: [zaloMiniApp(), react()],
    build: {
      assetsInlineLimit: 0,
    },
    resolve: {
      alias: {
        "@": "/src",
      },
    },
    server: {
      port: 3000,
      proxy: {
        "^/api/.*": {
          target: apiTarget,
          changeOrigin: true,
          rewrite: (path: string) => path.replace(/^\/api/, ""),
          configure: (proxy: any, _options: any) => {
            proxy.on("proxyRes", (proxyRes: any, _req: any, _res: any) => {
              proxyRes.headers["Access-Control-Allow-Origin"] = "*";
              proxyRes.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS";
              proxyRes.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization";
            });
          },
        },
      },
    },
  });
};
