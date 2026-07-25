import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Akademik ko'k — asosiy brend rangi.
        navy: {
          DEFAULT: "#1E3A5F",
          deep: "#14293F",
          light: "#2C5282",
          container: "#E8EEF4",
        },
        // Oltin — kam va maqsadli ishlatiladi (nishonlar, urg'u).
        gold: {
          DEFAULT: "#C9A227",
          deep: "#A07E14",
          container: "#FBF3DC",
        },
        ink: {
          DEFAULT: "#16202C",
          muted: "#5A6B7D",
        },
        line: "#DCE3EA",
        surface: {
          DEFAULT: "#FFFFFF",
          muted: "#EDF1F5",
          page: "#F4F6F8",
        },
        state: {
          success: "#2F855A",
          danger: "#C53030",
          warning: "#B7791F",
        },
        // Eski nomlar bilan moslik (qolgan sahifalar hali ishlatadi).
        brand: {
          DEFAULT: "#1E3A5F",
          dark: "#14293F",
          light: "#2C5282",
        },
        coral: {
          DEFAULT: "#A07E14",
          dark: "#A07E14",
        },
      },
      borderRadius: {
        // Akademik uslub: burchaklar deyarli tekis.
        DEFAULT: "4px",
        sm: "3px",
        md: "4px",
        lg: "4px",
        xl: "6px",
        "2xl": "6px",
        "3xl": "8px",
      },
      fontSize: {
        overline: ["0.6875rem", { lineHeight: "1rem", letterSpacing: "0.08em" }],
      },
      boxShadow: {
        // Soyalar deyarli yo'q — ierarxiya chegara chiziqlari orqali beriladi.
        soft: "none",
        "soft-lg": "none",
      },
    },
  },
  plugins: [],
} satisfies Config;
