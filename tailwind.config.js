/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // NexusMind Design System
        nexus: {
          bg: "#0A0A0F",
          surface: "#1A1A2E",
          "surface-light": "#242438",
          border: "#2A2A3E",
          purple: "#9D00FF",
          "purple-dark": "#7B00CC",
          "purple-light": "#B44DFF",
          "purple-muted": "rgba(157, 0, 255, 0.15)",
          text: "#FFFFFF",
          "text-secondary": "#8E8E93",
          "text-muted": "#6E6E73",
          accent: "#FF3B6F",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
