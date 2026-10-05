/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        davu: {
          red: {
            50: "#fff1f2",
            100: "#ffe4e6",
            200: "#fecdd3",
            300: "#fda4af",
            400: "#fb7185",
            500: "#ed1c24", // DAV Bright Red
            600: "#c8102e", // DAV Primary Crimson Red
            700: "#9f1228",
            800: "#7c0d20",
            900: "#500a16",
          },
          navy: {
            50: "#eff6ff",
            100: "#dbeafe",
            200: "#bfdbfe",
            300: "#93c5fd",
            400: "#60a5fa",
            500: "#2563eb",
            600: "#1d4ed8",
            700: "#1e3a8a", // DAV Navy Blue
            800: "#16284f",
            900: "#0d1b38",
            950: "#070e1e",
          },
          gold: {
            50: "#fffbeb",
            100: "#fef3c7",
            200: "#fde68a",
            300: "#fcd34d",
            400: "#fbbf24",
            500: "#f59e0b",
            600: "#d97706",
            700: "#b45309",
            800: "#92400e",
          },
        },
      },
    },
  },
  plugins: [],
};
