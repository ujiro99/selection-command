const baseConfig = require("../../tailwind.config")

/** @type {import('tailwindcss').Config} */
module.exports = {
  ...baseConfig,
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    ...baseConfig.theme,
    extend: {
      ...baseConfig.theme.extend,
      fontSize: {
        xs: "12px",
        sm: "14px",
      },
      keyframes: {
        ...baseConfig.theme.extend.keyframes,
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        marquee: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-100%)" },
        },
        marquee2: {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0%)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        marquee: "marquee var(--marquee-duration) linear infinite",
        marquee2: "marquee2 var(--marquee-duration) linear infinite",
        "spin-slow": "spin 3s linear infinite",
      },
      padding: {
        0.5: "2px",
        1: "4px",
        1.5: "6px",
        2: "8px",
      },
      translate: {
        2: "8px",
        2.5: "10px",
      },
      minWidth: {
        2: "8px",
        3: "12px",
        4: "16px",
      },
      listStyleType: {
        square: "square",
        circle: "circle",
      },
    },
  },
}
