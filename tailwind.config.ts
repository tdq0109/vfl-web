import type { Config } from "tailwindcss";

/* ============================================================================
   TOKEN ĐẶT TÊN THEO NGHĨA, KHÔNG THEO MÀU.

   Viết `bg-brand`, không viết `bg-cyan-700`. Viết `text-muted`, không viết
   `text-slate-500`. Đây là điều kiện duy nhất để lần thay layout sau chỉ phải
   sửa tệp này — nếu mã màu rải trong component thì Tailwind không giúp gì hơn
   CSS thường.

   Giá trị trích nguyên từ commercial-console.html đang chạy, để bản mới trông
   y hệt bản cũ trong giai đoạn này.
   ============================================================================ */

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        /* Nền và mực */
        bg: "#EEF5F8",
        surface: "#FFFFFF",
        ink: "#0F2733",
        muted: "#5B7280",
        line: "#DBE7EE",

        /* Thương hiệu */
        brand: {
          DEFAULT: "#0E7490",
          ink: "#0B5566",   // hover, trạng thái nhấn
          soft: "#EAF3F6",  // nền hover menu
          tint: "#F1F7F9",  // nền nhóm nút
        },
        accent: "#E0533D",

        /* Trạng thái — dùng cho chữ và viền */
        ok: "#15803D",
        warn: "#B45309",
        bad: "#B91C1C",

        /* Nền nhãn trạng thái (pill) */
        pill: {
          bg: "#E0F2FE", fg: "#075985",
          "ok-bg": "#DCFCE7", "ok-fg": "#166534",
          "warn-bg": "#FEF3C7", "warn-fg": "#92400E",
          "bad-bg": "#FEE2E2", "bad-fg": "#991B1B",
        },
      },

      borderRadius: {
        card: "14px",
        control: "10px",
      },

      boxShadow: {
        card: "0 1px 2px rgba(15,39,51,.06), 0 6px 20px rgba(15,39,51,.06)",
        menu: "0 12px 30px rgba(15,39,51,.14)",
      },

      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },

      fontSize: {
        // Hệ cũ chạy nền 15px chứ không phải 16px — giữ nguyên để mật độ bảng
        // biểu không đổi, người vận hành nhìn quen mắt.
        base: ["15px", "1.45"],
      },
    },
  },
  plugins: [],
};

export default config;