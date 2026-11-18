---
name: chrome-store-screenshots
description: >
  Generate production-ready Chrome Web Store marketing screenshots (1280x800 PNG).
  Use when the user asks to create store listing graphics, promotional images, or
  marketing screenshots for a Chrome extension or browser add-on. ...
---

# Chrome Web Store Screenshot Generator

## What this skill does

Generate production-ready marketing screenshots (1280x800 PNG) for Chrome Web Store listings. Each screenshot is designed as an advertisement, not a UI showcase. The skill scaffolds a Next.js project with a single `page.tsx` that renders all slides and exports them as PNGs via html-to-image.

## When to trigger

Activate when the user asks to:

- Build Chrome Web Store screenshots
- Generate marketing screenshots for a browser extension
- Create store listing graphics for a Chrome extension
- Make promotional images for a browser add-on

## Workflow

### Phase 1: Discovery

Before writing any code, ask the user about:

1. **Extension name and one-liner** (what does it do in one sentence?)
2. **Target audience** (developers, marketers, freelancers, general users?)
3. **Number of slides** (default: 5, max: 10)
4. **Brand colors** (primary, secondary, accent). If unknown, propose a palette.
5. **Font preference** (default: Inter). Must be available on Google Fonts.
6. **Product screenshots** (ask: "Drop your extension popup or in-page UI screenshots into `public/screenshots/`. I need at least 2-3 PNGs of your actual product.")
7. **Key features to highlight** (one per slide, ordered by importance)
8. **Style direction**: minimal, bold, editorial, dark, or custom description
9. **Tone of copy**: professional, casual, punchy, technical

Do NOT proceed until the user confirms the brief.

### Phase 2: Scaffold

If starting from an empty folder, create:

```
project/
├── public/
│   ├── screenshots/       # User's product UI PNGs go here
│   └── exports/           # Final PNGs exported here
├── src/app/
│   ├── layout.tsx         # Font setup (Google Fonts import)
│   └── page.tsx           # Screenshot generator (single file)
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

Tech stack:

- Next.js 14+
- TypeScript
- Tailwind CSS
- html-to-image (for PNG export)
- React

### Phase 3: Design rules

Apply these rules to every slide:

**Canvas**

- Every slide is exactly 1280x800 pixels. Nothing extends beyond.
- Edge-to-edge composition. No outer borders, rounded corners, or safe-area padding.
- `body, html { margin: 0; padding: 0; overflow: hidden; }`

**Typography**

- Headlines: bold/black weight, 48-72px, left-aligned unless stated otherwise.
- Subheadlines: regular/medium weight, 20-28px.
- All text must be readable at 640x400 thumbnail size (the Chrome Web Store preview).
- Never use em dashes. Use periods or commas instead.

**Product UI**

- Scale product screenshots to 150-200% so UI text is legible at thumbnail size.
- Float product UI over background with a soft drop shadow (blur 40px, opacity 15%, slight downward offset).
- Product UI keeps its original styling. Do not redesign it.

**Layout variety**

- No two adjacent slides share the same layout.
- Alternate between: text-left/UI-right, text-top/UI-center, full-width UI with overlay text, split compositions.
- Each slide sells ONE idea. One headline, one visual. No feature lists.

**Color**

- Alternate background colors between slides for visual rhythm when scrolling.
- Recommended pattern: warm/light > dark > neutral > accent dark > split/light.
- Use the user's brand palette for accents and CTAs. Background colors can be independent.

**Component consistency**

- Shared components (extension popup header, tabs, buttons, status indicators) must look identical across all slides. Do not invent visual variants between shots.

**Copy principles**

- Each headline follows the "one second rule": readable and understood in one second at thumbnail size.
- Headlines are benefits, not features. "Stop losing deals to silence" not "Email tracking extension".
- Subheadlines add one concrete proof or clarification.
- Never use: "revolutionize", "unleash", "supercharge", "game-changer", "seamlessly", "leverage", "empower", "cutting-edge", "next-generation".

### Phase 4: Slide archetypes

Use these archetypes as the default structure. The user can override any of them.

**Slide 1 (Hero)**: Brand introduction. Logo + headline + product popup in action. Include a free-tier badge if applicable.

**Slide 2 (Trigger)**: Show how the user activates the extension. Zero friction. Dark background for contrast after slide 1.

**Slide 3 (Value delivery)**: The "wow" moment. Show the output or result the extension produces. Light background.

**Slide 4 (Power features)**: Dashboard, analytics, or advanced features. Dark accent background. If there is a paid tier, show the PRO badge here.

**Slide 5 (Trust)**: Privacy, security, or social proof. No product UI. Clean graphic composition with trust signals (GDPR, encryption, reviews). Split or white background.

### Phase 5: Build

Write the entire generator as a single `page.tsx` file. Structure:

```tsx
// Theme tokens from user brief
const THEME = {
  bg: [...],       // one per slide
  fg: [...],
  accent: "...",
  font: "...",
};

// Slide data
const SLIDES = [
  {
    headline: "...",
    subheadline: "...",
    layout: "text-left-ui-right",
    screenshot: "/screenshots/popup-active.png",
    bgColor: THEME.bg[0],
  },
  // ...
];

// Render each slide as a 1280x800 div
// Export button per slide using html-to-image toPng()
```

Each slide renders as a fixed 1280x800 div. A row of export buttons at the top triggers `toPng()` from html-to-image and downloads each as `01_hero.png`, `02_trigger.png`, etc.

Also include an "Export all" button that downloads all slides sequentially.

### Phase 6: Review and iterate

After the first render:

1. Start the dev server (`npm run dev` or `bun dev`)
2. Tell the user to open `localhost:3000` in their browser
3. Ask them to review each slide and request changes
4. Iterate on copy, colors, layout, or screenshot placement
5. When approved, export final PNGs via the export buttons

## Export specification

| Target                           | Resolution |
| -------------------------------- | ---------- |
| Chrome Web Store                 | 1280 x 800 |
| Chrome Web Store (small promo)   | 440 x 280  |
| Chrome Web Store (marquee promo) | 1400 x 560 |

Default export is 1280x800. If the user asks for promotional tiles, also generate 440x280 and 1400x560 variants.

## What NOT to do

- Do NOT use placeholder text. Every visible string must be real, final copy.
- Do NOT use Material Design or generic UI components for the product mockup. Use the user's actual screenshots.
- Do NOT add decorative shapes, dots, patterns, or background textures.
- Do NOT use stock photos or illustrations of people.
- Do NOT put a device frame (phone, laptop) around the extension UI unless the user asks for it. Browser extensions are not mobile apps.
- Do NOT generate all slides as one wide canvas. Each slide is an isolated 1280x800 render.
- Do NOT skip the discovery phase. Always ask before building.
