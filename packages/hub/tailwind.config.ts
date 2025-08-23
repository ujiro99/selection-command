import type { Config } from "tailwindcss"
const baseConfig = require("../../tailwind.config")

const config: Config = {
  ...baseConfig,
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    ...baseConfig.theme,
    extend: {
      ...baseConfig.theme.extend,
      colors: {
        ...baseConfig.theme.extend.colors,
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
      },
      keyframes: {
        ...baseConfig.theme.extend.keyframes,
        scalePop: {
          "0%": { transform: "scale(100%)" },
          "60%": { transform: "scale(105%)" },
          "100%": { transform: "scale(100%)" },
        },
        slideToRight: {
          "0%": { left: "0", transform: "translateX(-100%)" },
          "100%": { left: "100%", transform: "translateX(0)" },
        },
      },
      animation: {
        scalePop: "scalePop 0.2s",
        slideToRight: "slideToRight 0.2s",
      },
    },
    data: {
      clickable: 'clickable="true"',
      starred: 'starred="true"',
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
}
export default config
