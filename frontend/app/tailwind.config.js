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
          50: "#f2f3fa",
          100: "#e4e6f4",
          200: "#ccd2ec",
          300: "#a3aee0",
          400: "#6f7dd0",
          500: "#414a9b",
          600: "#2a317a",
          700: "#2a317a",
          800: "#2a317a",
          900: "#2a317a",
        },
        surface: "#f8f9fc",
        neutral: {
          50: "#f8f8f8",
          100: "#f0f0f0",
          200: "#e1e1e0",
          300: "#c8c8c7",
          400: "#9a9a99",
          500: "#70706f",
          600: "#585857",
          700: "#3c3c3b",
          800: "#323231",
          900: "#3c3c3b",
        },
      },
      boxShadow: {
        soft: "0 2px 12px -2px rgba(42, 49, 122, 0.08), 0 1px 3px rgba(60, 60, 59, 0.04)",
        lift: "0 18px 40px -12px rgba(42, 49, 122, 0.18)",
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
  floaty: 'floaty 6s ease-in-out infinite',
  rise: 'rise .5s ease-out backwards',
  'fade-up': 'rise .5s ease-out backwards',
},
    },
  },
  plugins: [],
};
