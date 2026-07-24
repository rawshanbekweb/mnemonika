import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#6d28d9",
          dark: "#5b21b6",
          light: "#8b5cf6",
        },
        coral: {
          DEFAULT: "#fb7185",
          dark: "#f43f5e",
        },
        ink: {
          DEFAULT: "#1f1b2e",
          muted: "#6b6780",
        },
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)",
        "hero-gradient": "linear-gradient(135deg, #9333ea 0%, #6d28d9 60%, #7c3aed 100%)",
        "coral-gradient": "linear-gradient(135deg, #fb7185 0%, #f43f5e 100%)",
      },
      boxShadow: {
        soft: "0 6px 24px -8px rgba(109, 40, 217, 0.18)",
        "soft-lg": "0 12px 40px -12px rgba(109, 40, 217, 0.25)",
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
      },
    },
  },
  plugins: [],
} satisfies Config;
