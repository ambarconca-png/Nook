import type { Config } from "tailwindcss";

export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        nook: {
          background: "#f7f3ef",
          card: "#fffdfb",
          ink: "#232224",
          muted: "#77716d",
          teal: "#2e978b",
          violet: "#7567b8",
          rose: "#d67b95",
        },
      },
      boxShadow: {
        nook: "0 18px 55px rgba(53, 43, 38, 0.09)",
      },
      borderRadius: {
        nook: "24px",
      },
    },
  },
  plugins: [],
} satisfies Config;
