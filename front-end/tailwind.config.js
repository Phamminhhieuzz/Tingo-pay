module.exports = {
  darkMode: ["selector", '[zaui-theme="dark"]'],
  purge: {
    enabled: true,
    content: ["./src/**/*.{js,jsx,ts,tsx,vue}"],
  },
  theme: {
    extend: {
      colors: {
        tingo: {
          red: "#DC4028",
          blue: "#0F4EA7",
          // Đọc từ biến CSS để tự đổi theo dark mode (định nghĩa ở css/app.scss), không cần
          // sửa "bg-tingo-bg" ở từng trang khi thêm dark mode
          bg: "var(--tingo-bg)",
        },
        primary: "#DC4028",
        secondary: "#0F4EA7",
        accent: "#F59E0B",
      },
      boxShadow: {
        card: "0 1px 2px rgba(16,24,40,0.04), 0 4px 14px rgba(16,24,40,0.06)",
        float: "0 10px 28px rgba(220,64,40,0.22)",
      },
      fontFamily: {
        mono: ["Roboto Mono", "monospace"],
        // Chỉ dùng cho chữ thương hiệu "Tingo Pay" (logo chữ), không dùng cho nội dung thường
        brand: ["Playfair Display", "serif"],
      },
    },
  },
};
