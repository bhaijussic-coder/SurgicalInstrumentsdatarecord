/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["'IBM Plex Sans'", "ui-sans-serif", "system-ui"],
      },
      colors: {
        bg: "var(--color-bg)",
        card: "var(--color-card)",
        text: "var(--color-text)",
        muted: "var(--color-muted)",
        border: "var(--color-border)",
        brand: "var(--color-brand)",
        success: "var(--color-success)",
        danger: "var(--color-danger)",
      },
      boxShadow: {
        panel: "0 8px 30px rgba(0,0,0,0.12)",
      },
      backgroundImage: {
        "grid-pattern":
          "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.07) 1px, transparent 0)",
      },
    },
  },
  plugins: [],
};
