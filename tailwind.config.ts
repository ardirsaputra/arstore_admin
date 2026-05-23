import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eefbf7",
          100: "#d5f5ec",
          200: "#aeebdb",
          300: "#7ddbc4",
          400: "#49c4a7",
          500: "#26a98e",
          600: "#1a8974",
          700: "#186d5e",
          800: "#17564c",
          900: "#154840",
        },
      },
    },
  },
  plugins: [],
};

export default config;
