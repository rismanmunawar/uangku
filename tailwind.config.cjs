/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#f97316", // Seabank-like orange
        primaryDark: "#ea580c",
        accent: "#fb923c",
      },
      fontFamily: {
        display: ["'Plus Jakarta Sans'", "Inter", "system-ui", "sans-serif"],
        body: ["'Plus Jakarta Sans'", "Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 10px 25px -12px rgba(15, 118, 110, 0.2)",
        card: "0 10px 25px -15px rgba(0,0,0,0.25)",
        pill: "0 12px 28px -18px rgba(249, 115, 22, 0.5)",
      },
    },
  },
  plugins: [],
};
