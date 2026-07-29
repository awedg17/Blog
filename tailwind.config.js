/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        cream: "#F4F1EC",
        ink: "#1E1E1E",
        olive: "#6B7A3A",
        muted: "#6B6B66",
        danger: "#C0392B",
        border: "#E4E0D8",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
