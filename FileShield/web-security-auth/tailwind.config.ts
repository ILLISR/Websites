import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./node_modules/flowbite-react/lib/**/*.js",
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        'custom-background': "url('/image/modern-3.jpg')",
        
      },
      backgroundPosition: {
        'right-20': '50%', // Ajusta el valor según sea necesario
      },
      colors: {
        primary: '#141c27',
        secondary: '#1a202c',
        accent: '#00ff00',
      },
    },
  },
  plugins: [
    require("flowbite/plugin")
  ],
};
export default config;
