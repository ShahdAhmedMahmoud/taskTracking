/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Cairo", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      fontSize: {
        xs: ["0.8125rem", { lineHeight: "1.25rem" }], // 13px (كان 12)
        sm: ["0.9375rem", { lineHeight: "1.5rem" }], // 15px (كان 14)
        base: ["1.0625rem", { lineHeight: "1.75rem" }], // 17px (كان 16)
        lg: ["1.1875rem", { lineHeight: "1.85rem" }], // 19px (كان 18)
        xl: ["1.375rem", { lineHeight: "2rem" }], // 22px (كان 20)
        "2xl": ["1.625rem", { lineHeight: "2.25rem" }], // 26px (كان 24)
        "3xl": ["2rem", { lineHeight: "2.5rem" }], // 32px (كان 30)
        "4xl": ["2.375rem", { lineHeight: "2.75rem" }], // 38px (كان 36)
        "5xl": ["3rem", { lineHeight: "1" }],
      },
      colors: {
        brand: {
          50: "#effaf7",
          100: "#d6f3ec",
          200: "#b0e6da",
          300: "#7dd3c2",
          400: "#46b9a6",
          500: "#1fa08c",
          600: "#118173",
          700: "#10675d",
          800: "#11524b",
          900: "#11443e",
        },
        surface: "#f4f7f6",
      },
      boxShadow: {
        soft: "0 2px 12px -2px rgba(16, 103, 93, 0.08), 0 1px 3px rgba(15, 23, 42, 0.04)",
        lift: "0 18px 40px -12px rgba(16, 103, 93, 0.25)",
      },
      keyframes: {
        floaty: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        rise: {
          "0%": { opacity: 0, transform: "translateY(12px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
      },
      animation: {
        floaty: "floaty 6s ease-in-out infinite",
        rise: "rise .5s ease-out both",
        "fade-up": "rise .5s ease-out both",
      },
    },
  },
  plugins: [],
};
