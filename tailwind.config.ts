import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mux}",
    "./src/**/*.{js,ts,jsx,tsx,mux}",
  ],
  theme: {
    extend: {
      // Tu peux étendre ton design system ici (couleurs, fonts, etc.)
            colors: { border: "hsl(var(--border))" },
    },
  },
  darkMode: "class", // pour ton thème sombre contrôlé par une classe
  plugins: [],
};

export default config;
