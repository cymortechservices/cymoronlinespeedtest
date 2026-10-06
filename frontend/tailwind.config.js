/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#070A12",
        panel: "#0E1424",
        edge: "#1E2A44",
        mist: "#9AA7C2",
        cyan: { DEFAULT: "#22D3EE" },
        violet: { DEFAULT: "#8B5CF6" },
      },
      fontFamily: {
        display: ['"Sora"', "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
      },
    },
  },
  plugins: [],
};
