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
        // Linear-style enter/exit used by the variant B welcome overlay:
        // content resolves out of a blur instead of just sliding up.
        "onboarding-blur-in": {
          from: {
            opacity: "0",
            filter: "blur(8px)",
            transform: "translateY(6px)",
          },
          to: { opacity: "1", filter: "blur(0px)", transform: "translateY(0)" },
        },
        "onboarding-blur-out": {
          from: { opacity: "1", filter: "blur(0px)" },
          to: { opacity: "0", filter: "blur(8px)" },
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
        // The one-shot scale-in used for the the completion screen's party-popper icon.
        "onboarding-pop": {
          "0%": { opacity: "0", transform: "scale(0.72)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "onboarding-pop-2": {
          "0%": {
            opacity: "0",
            transform: "scale(0.72) translate(-10px, 10px)",
          },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        // Gentle vertical bob used to draw extra attention to the onboarding
        // callout bubble. Uses the standalone `translate` property (not
        // `transform`) so it composes with, instead of overriding, the
        // `transform` Radix Popper uses to rotate/position PopoverArrow -
        // both the bubble and its arrow share this animation and must move
        // in sync.
        "onboarding-float": {
          "0%, 100%": { translate: "0 0" },
          "50%": { translate: "0 -4px" },
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
          "onboarding-rise 0.7s cubic-bezier(0.16, 1, 0.3, 1) both",
        "onboarding-blur-in":
          "onboarding-blur-in 0.8s cubic-bezier(0.16, 1, 0.3, 1) both",
        "onboarding-blur-out":
          "onboarding-blur-out 0.32s cubic-bezier(0.4, 0, 1, 1) both",
        "onboarding-ring": "onboarding-ring 2.4s ease-in-out 0.6s infinite",
        "onboarding-blink": "onboarding-blink 1.5s ease-in-out 0.3s infinite",
        "onboarding-highlight": "onboarding-highlight 4s ease-in-out infinite",
        "onboarding-pop":
          "onboarding-pop 0.36s cubic-bezier(0.34, 1.4, 0.64, 1) both",
        "onboarding-pop-2":
          "onboarding-pop-2 0.36s cubic-bezier(0.34, 1.4, 0.64, 1) both",
        "onboarding-float": "onboarding-float 1.4s ease-in-out infinite",
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
