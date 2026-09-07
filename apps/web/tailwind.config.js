/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        night: {
          dark: "#0a0a1a",
          deeper: "#060612",
          purple: "#6b21a8",
          blue: "#1e3a5f",
          glow: "#f0e68c",
        },
      },
      fontFamily: {
        sans: ['"Noto Sans TC"', "system-ui", "sans-serif"],
      },
      animation: {
        "pulse-glow": "pulseGlow 2s ease-in-out infinite",
        float: "float 3s ease-in-out infinite",
      },
      keyframes: {
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 20px rgba(107, 33, 168, 0.3)" },
          "50%": { boxShadow: "0 0 40px rgba(107, 33, 168, 0.6)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
    },
  },
  plugins: [],
};