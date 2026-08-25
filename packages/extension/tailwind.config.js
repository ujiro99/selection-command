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
        popup: {
          "0%": {
            opacity: "0",
            transform: "scale(0.5) translate(-10px, 10px)",
          },
          "100%": {
            opacity: "1",
            transform: "scale(1)",
          },
        },
        // Onboarding-only keyframes. Namespaced with an `onboarding-` prefix
        // (see also the `onboarding-` animation names below) so they read as
        // a related set alongside the rest of this file's keyframes.
        "onboarding-rise": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "onboarding-ring": {
          "0%, 100%": { boxShadow: "0 0 0 0 var(--onboarding-ring-color)" },
          "50%": { boxShadow: "0 0 0 6px var(--onboarding-ring-color)" },
        },
        "onboarding-blink": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.45" },
        },
        // Drives the selection-demo highlight span: fades a selection-blue
        // background in, holds, then fades it out, looping.
        "onboarding-highlight": {
          "0%, 10%": { backgroundColor: "rgb(191 219 254 / 0)" },
          "44%, 70%": { backgroundColor: "rgb(191 219 254 / 1)" },
          "82%, 100%": { backgroundColor: "rgb(191 219 254 / 0)" },
        },
        // The one-shot scale-in used for the value-shown checkmark badge and
        // the completion screen's party-popper icon.
        "onboarding-pop": {
          "0%": { opacity: "0", transform: "scale(0.72)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        marquee: "marquee var(--marquee-duration) linear infinite",
        marquee2: "marquee2 var(--marquee-duration) linear infinite",
        "spin-slow": "spin 3s linear infinite",
        popup: "popup 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) both",
        "onboarding-rise":
          "onboarding-rise 0.38s cubic-bezier(0.16, 1, 0.3, 1) both",
        "onboarding-ring": "onboarding-ring 2.4s ease-in-out 0.6s infinite",
        "onboarding-blink": "onboarding-blink 2.4s ease-in-out 0.3s infinite",
        "onboarding-highlight": "onboarding-highlight 4s ease-in-out infinite",
        "onboarding-pop":
          "onboarding-pop 0.36s cubic-bezier(0.34, 1.4, 0.64, 1) both",
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
