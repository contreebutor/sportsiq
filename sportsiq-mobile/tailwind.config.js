/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Custom brand hexes only. Everything else maps to existing Tailwind
        // tokens: text→slate-50, muted→slate-400, faint→slate-600, green→green-500,
        // red→red-500. BRAND.gold (#F59E0B) matches amber-500 exactly.
        brand: {
          bg: "#050912",
          purple: "#5545D3",
          "purple-light": "#7C6EF5",
        },
      },
    },
  },
  plugins: [],
};
