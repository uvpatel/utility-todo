
# Design System Inspired by Notion

> Auto-extracted from `https://www.notion.so` on 2026-04-12

## 1. Visual Theme & Atmosphere

High-contrast dark mode with vivid accents — feels modern, technical, and focused.

The hero section leads with "Meet the night shift." followed by "Notion agents keep work moving 24/7. They capture knowledge, answer questions, and push projects for".

**Key Characteristics:**

- NotionInter as the heading font (custom web font loaded via @font-face)
- NotionInter as the body font for all running text
- Heading weight 700, letter-spacing -2.125px
- Dark background (#191918) as the primary canvas
- Primary accent `#000000` used for CTAs and brand highlights
- 6 shadow level(s) detected — tinted shadows
- Rounded corners (8px+) creating a friendly, approachable feel
- Tags: dark, rounded, colorful, serif

## 2. Color Palette & Roles

### Primary

- **Primary Accent** (`#000000`): Brand color, CTA backgrounds, link text, interactive highlights.
- **Secondary Accent** (`#0075de`): Secondary brand, hover states, complementary highlights.
- **Background** (`#191918`): Page background, primary canvas.
- **Background Secondary** (`#f7f7f5`): Cards, surfaces, alternating sections.

### Text

- **Text Primary** (`#ffffff`): Headings and body text.
- **Text Secondary** (`#999999`): Muted text, captions, placeholders.

### Borders & Surfaces

- **Border** (`#f7f7f5`): Dividers, outlines, input borders.

### Full Extracted Palette

| #  | Hex         | Role        | Area   | Contrast   |
| -- | ----------- | ----------- | ------ | ---------- |
| 1  | `#ffffff` | section     | large  | text-dark  |
| 2  | `#f7f7f5` | section     | large  | text-dark  |
| 3  | `#62aef0` | text-accent | large  | text-dark  |
| 4  | `#f77463` | button      | large  | text-dark  |
| 5  | `#2a9d99` | badge       | large  | text-light |
| 6  | `#000000` | button      | large  | text-dark  |
| 7  | `#b18164` | section     | large  | text-dark  |
| 8  | `#02093a` | block       | large  | text-light |
| 9  | `#455dd3` | button      | medium | text-light |
| 10 | `#000000` | badge       | small  | text-light |
| 11 | `#0075de` | text-accent | small  | text-light |
| 12 | `#213183` | button      | small  | text-light |

## 3. Typography Rules

- **Heading Font:** `NotionInter` (web font)
- **Body Font:** `NotionInter` (web font)

### Type Hierarchy

| Role  | Font        | Size | Weight | Line Height | Letter Spacing |
| ----- | ----------- | ---- | ------ | ----------- | -------------- |
| H1    | NotionInter | 64px | 700    | 64px        | -2.125px       |
| H2    | NotionInter | 12px | 500    | 16px        | 0.125px        |
| H3    | NotionInter | 14px | 400    | 20px        | normal         |
| Body  | NotionInter | 16px | 400    | 24px        | normal         |
| Small | NotionInter | 12px | 500    | 16px        | 0.125px        |

### Type Scale

| Token   | Size     | Suggested Usage        |
| ------- | -------- | ---------------------- |
| Display | `64px` | headings               |
| H1      | `54px` | headings               |
| H2      | `48px` | headings               |
| H3      | `42px` | headings               |
| H4      | `40px` | headings               |
| Body L  | `32px` | body / supporting text |
| Body    | `26px` | body / supporting text |
| Small   | `24px` | body / supporting text |
| XS      | `22px` | body / supporting text |
| Caption | `20px` | body / supporting text |

## 4. Component Stylings

### Primary Button

```css
.btn-primary {
  background: #455dd3;
  color: #ffffff;
  border-radius: 8px;
  padding: 4px 14px;
  font-size: 16px;
  font-weight: 500;
  border: none;
  cursor: pointer;
}
```

### Secondary Button

```css
.btn-secondary {
  background: #213183;
  color: #ffffff;
  border-radius: 8px;
  padding: 6px 15px;
  font-size: 16px;
  font-weight: 500;
  border: none;
  cursor: pointer;
}
```

### Card

```css
.card {
  background: #ffffff;
  border-radius: 16px;
  padding: 0px;
}
```

## 5. Layout Principles

- **Base spacing unit:** `4px` — use multiples (8px, 12px, 16px, etc.)

### Spacing Scale (extracted from real elements)

| Token     | Value    | Role    |
| --------- | -------- | ------- |
| spacing-1 | `4px`  | element |
| spacing-2 | `24px` | card    |
| spacing-3 | `5px`  | element |
| spacing-4 | `6px`  | element |
| spacing-5 | `3px`  | element |
| spacing-6 | `16px` | element |
| spacing-7 | `8px`  | element |
| spacing-8 | `64px` | section |

### Border Radius Scale

| Token         | Value     | Element |
| ------------- | --------- | ------- |
| radius-button | `8px`   | button  |
| radius-subtle | `5px`   | subtle  |
| radius-button | `12px`  | button  |
| radius-subtle | `4px`   | subtle  |
| radius-pill   | `100px` | pill    |
| radius-card   | `16px`  | card    |

## 6. Depth & Elevation

| Level | Shadow                                                                                  | Usage                      |
| ----- | --------------------------------------------------------------------------------------- | -------------------------- |
| High  | `rgba(0, 0, 0, 0.04) 0px 4px 18px 0px, rgba(0, 0, 0, 0.027) 0px 2.025px 7.84688px...` | Modals, floating elements  |
| Low   | `rgba(0, 0, 0, 0.01) 0px 1px 3px 0px, rgba(0, 0, 0, 0.02) 0px 3px 7px 0px, rgba(0...` | Cards, subtle elevation    |
| Deep  | `rgba(0, 0, 0, 0.08) 0px 20px 50px 0px, rgba(0, 0, 0, 0.04) 0px 6px 16px 0px`         | Hero sections, deep layers |
| Low   | `rgba(0, 0, 0, 0) 0px 1px 0px 0px`                                                    | Cards, subtle elevation    |
| High  | `rgba(255, 255, 255, 0.2) 0px 0px 20px 5px`                                           | Modals, floating elements  |

## 7. Do's and Don'ts

### ✅ Do

- Use `#191918` as the primary background color
- Use `NotionInter` for all headings and `NotionInter` for body text
- Use `#000000` as the single dominant accent/CTA color
- Maintain `4px` as the base spacing unit — all gaps should be multiples
- Keep the overall feel dark — use dark surfaces throughout
- Use rounded corners (`8px`+) consistently for all interactive elements
- Use serif fonts for headlines to maintain editorial authority
- Embrace bold color combinations — playful energy is the point
- Apply the shadow system for elevation — use the extracted shadow values
- Use weight 700 for headings to match the brand's typographic voice

### ❌ Don't

- Don't use colors outside the extracted palette without justification
- Don't substitute NotionInter/NotionInter with generic alternatives
- Don't use irregular spacing — stick to 4px grid
- Don't introduce bright white surfaces — they break the dark palette
- Don't use sharp corners — they feel hostile in this rounded design language
- Don't mix in geometric sans-serif headlines — it breaks the editorial tone
- Don't use pure black (#000000) for text — use `#ffffff` instead
- Don't add decorative elements not present in the original design

## 8. Responsive Behavior

| Breakpoint | Width        | Notes                                                 |
| ---------- | ------------ | ----------------------------------------------------- |
| Mobile     | < 640px      | Single column, stack sections, reduce font sizes ~80% |
| Tablet     | 640–1024px  | 2-column where appropriate, maintain spacing ratios   |
| Desktop    | 1024–1440px | Full layout as designed                               |
| Wide       | > 1440px     | Max-width container, center content                   |

- Touch targets: minimum 44×44px on mobile
- Maintain 4px base unit across breakpoints — only scale multipliers

## 9. Agent Prompt Guide

### Quick Color Reference

```
Background:  #191918
Text:        #ffffff
Accent:      #000000
Secondary:   #0075de
Border:      #f7f7f5
```

### Example Prompts

1. "Build a hero section with a `#000000` background, `NotionInter` heading in `#000000`, and a `#000000` CTA button with 8px radius."
2. "Create a pricing card using background `#f7f7f5`, border `#f7f7f5`, `NotionInter` for text, and 12px padding."
3. "Design a navigation bar — `#191918` background, `#000000` links, `#000000` for active state."
4. "Build a feature grid with 3 columns, 12px gap, each card using the card component style."
5. "Create a footer with `#f7f7f5` background, `#000000` text, and 8px padding."

### Iteration Guide

1. Start with layout structure (sections, grid, spacing)
2. Apply colors from the palette — background first, then text, then accents
3. Set typography — font families, sizes from the type scale, weights
4. Add components — buttons, cards, inputs using the specs above
5. Apply border-radius consistently across all elements
6. Add shadows for depth — use the extracted shadow values, not defaults
7. Check responsive behavior — test mobile and tablet layouts
8. Final pass — verify all colors match, spacing is consistent, fonts are correct



/** @type {import('tailwindcss').Config} */
// Auto-generated from https://www.notion.so
module.exports = {
  content: ['./src/**/*.{html,js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#191918',
        'bg-secondary': '#f7f7f5',
        text: '#000000',
        'text-secondary': '#999999',
        primary: '#000000',
        secondary: '#0075de',
        border: '#f7f7f5',
        'primary': '#ffffff',
        'secondary': '#f7f7f5',
        'tertiary': '#62aef0',
        'accent-1': '#f77463',
        'accent-2': '#2a9d99',
        'accent-3': '#ffc95e',
      },
      fontFamily: {
        heading: ['NotionInter', 'sans-serif'],
        body: ['NotionInter', 'sans-serif'],
      },
      borderRadius: {
        'button': '8px',
        'subtle': '5px',
        'button': '12px',
        'subtle': '4px',
      },
      spacing: {
        '1': '4px',
        '2': '24px',
        '3': '5px',
        '4': '6px',
        '5': '3px',
        '6': '16px',
      },
    },
  },
  plugins: [],
};




/* Auto-generated from https://www.notion.so */
:root {
  /* Colors */
  --color-bg: #191918;
  --color-bg-secondary: #f7f7f5;
  --color-text: #000000;
  --color-text-secondary: #999999;
  --color-primary: #000000;
  --color-secondary: #0075de;
  --color-border: #f7f7f5;
  --color-primary: #ffffff;
  --color-secondary: #f7f7f5;
  --color-tertiary: #62aef0;
  --color-accent-1: #f77463;
  --color-accent-2: #2a9d99;
  --color-accent-3: #ffc95e;

  /* Typography */
  --font-heading: 'NotionInter', sans-serif;
  --font-body: 'NotionInter', sans-serif;
  --text-display: 64px;
  --text-h1: 54px;
  --text-h2: 48px;
  --text-h3: 42px;
  --text-body: 40px;
  --text-small: 32px;

  /* Spacing */
  --space-1: 4px;
  --space-2: 24px;
  --space-3: 5px;
  --space-4: 6px;
  --space-5: 3px;
  --space-6: 16px;

  /* Border radius */
  --radius-button: 8px;
  --radius-subtle: 5px;
  --radius-button: 12px;
  --radius-subtle: 4px;
}



{
  "$schema": "https://design-tokens.org/schema.json",
  "meta": {
    "source": "https://www.notion.so",
    "title": "Notion",
    "scrapedAt": "2026-04-12T15:24:54.930Z",
    "tags": [
      "dark",
      "rounded",
      "colorful",
      "serif"
    ]
  },
  "colors": {
    "background": {
      "value": "#191918",
      "type": "color"
    },
    "backgroundSecondary": {
      "value": "#f7f7f5",
      "type": "color"
    },
    "text": {
      "value": "#000000",
      "type": "color"
    },
    "textSecondary": {
      "value": "#999999",
      "type": "color"
    },
    "primary": "#000000",
    "secondary": {
      "value": "#0075de",
      "type": "color"
    },
    "border": {
      "value": "#f7f7f5",
      "type": "color"
    },
    "palette": [
      {
        "name": "primary",
        "value": "#ffffff",
        "role": "section"
      },
      {
        "name": "secondary",
        "value": "#f7f7f5",
        "role": "section"
      },
      {
        "name": "tertiary",
        "value": "#62aef0",
        "role": "text-accent"
      },
      {
        "name": "accent-1",
        "value": "#f77463",
        "role": "button"
      },
      {
        "name": "accent-2",
        "value": "#2a9d99",
        "role": "badge"
      },
      {
        "name": "accent-3",
        "value": "#ffc95e",
        "role": "button"
      },
      {
        "name": "muted-1",
        "value": "#b18164",
        "role": "section"
      },
      {
        "name": "muted-2",
        "value": "#02093a",
        "role": "block"
      },
      {
        "name": "color-9",
        "value": "#455dd3",
        "role": "button"
      },
      {
        "name": "color-10",
        "value": "#000000",
        "role": "badge"
      },
      {
        "name": "color-11",
        "value": "#0075de",
        "role": "text-accent"
      },
      {
        "name": "color-12",
        "value": "#213183",
        "role": "button"
      }
    ]
  },
  "typography": {
    "headingFont": {
      "value": "NotionInter",
      "type": "fontFamily"
    },
    "bodyFont": {
      "value": "NotionInter",
      "type": "fontFamily"
    },
    "fontSizes": [
      {
        "value": 64,
        "type": "dimension",
        "unit": "px"
      },
      {
        "value": 54,
        "type": "dimension",
        "unit": "px"
      },
      {
        "value": 48,
        "type": "dimension",
        "unit": "px"
      },
      {
        "value": 42,
        "type": "dimension",
        "unit": "px"
      },
      {
        "value": 40,
        "type": "dimension",
        "unit": "px"
      },
      {
        "value": 32,
        "type": "dimension",
        "unit": "px"
      },
      {
        "value": 26,
        "type": "dimension",
        "unit": "px"
      },
      {
        "value": 24,
        "type": "dimension",
        "unit": "px"
      },
      {
        "value": 22,
        "type": "dimension",
        "unit": "px"
      },
      {
        "value": 20,
        "type": "dimension",
        "unit": "px"
      }
    ],
    "details": [
      {
        "role": "H1",
        "size": 64,
        "weight": "700",
        "lineHeight": "64px",
        "letterSpacing": "-2.125px",
        "font": "NotionInter"
      },
      {
        "role": "H2",
        "size": 12,
        "weight": "500",
        "lineHeight": "16px",
        "letterSpacing": "0.125px",
        "font": "NotionInter"
      },
      {
        "role": "H3",
        "size": 14,
        "weight": "400",
        "lineHeight": "20px",
        "letterSpacing": "normal",
        "font": "NotionInter"
      },
      {
        "role": "Body",
        "size": 16,
        "weight": "400",
        "lineHeight": "24px",
        "letterSpacing": "normal",
        "font": "NotionInter"
      },
      {
        "role": "Small",
        "size": 12,
        "weight": "500",
        "lineHeight": "16px",
        "letterSpacing": "0.125px",
        "font": "NotionInter"
      }
    ]
  },
  "spacing": [
    {
      "value": 4,
      "type": "dimension",
      "unit": "px"
    },
    {
      "value": 24,
      "type": "dimension",
      "unit": "px"
    },
    {
      "value": 5,
      "type": "dimension",
      "unit": "px"
    },
    {
      "value": 6,
      "type": "dimension",
      "unit": "px"
    },
    {
      "value": 3,
      "type": "dimension",
      "unit": "px"
    },
    {
      "value": 16,
      "type": "dimension",
      "unit": "px"
    },
    {
      "value": 8,
      "type": "dimension",
      "unit": "px"
    },
    {
      "value": 64,
      "type": "dimension",
      "unit": "px"
    }
  ],
  "borderRadius": [
    {
      "value": 8,
      "type": "dimension",
      "unit": "px",
      "role": "button"
    },
    {
      "value": 5,
      "type": "dimension",
      "unit": "px",
      "role": "subtle"
    },
    {
      "value": 12,
      "type": "dimension",
      "unit": "px",
      "role": "button"
    },
    {
      "value": 4,
      "type": "dimension",
      "unit": "px",
      "role": "subtle"
    },
    {
      "value": 100,
      "type": "dimension",
      "unit": "px",
      "role": "pill"
    },
    {
      "value": 16,
      "type": "dimension",
      "unit": "px",
      "role": "card"
    }
  ],
  "shadows": [
    {
      "value": "rgba(0, 0, 0, 0.04) 0px 4px 18px 0px, rgba(0, 0, 0, 0.027) 0px 2.025px 7.84688px 0px, rgba(0, 0, 0, 0.02) 0px 0.8px 2.925px 0px, rgba(0, 0, 0, 0.01) 0px 0.175px 1.04062px 0px",
      "level": "high"
    },
    {
      "value": "rgba(0, 0, 0, 0.01) 0px 1px 3px 0px, rgba(0, 0, 0, 0.02) 0px 3px 7px 0px, rgba(0, 0, 0, 0.02) 0px 7px 15px 0px, rgba(0, 0, 0, 0.04) 0px 14px 28px 0px, rgba(0, 0, 0, 0.05) 0px 23px 52px 0px",
      "level": "low"
    },
    {
      "value": "rgba(0, 0, 0, 0.08) 0px 20px 50px 0px, rgba(0, 0, 0, 0.04) 0px 6px 16px 0px",
      "level": "deep"
    },
    {
      "value": "rgba(0, 0, 0, 0) 0px 1px 0px 0px",
      "level": "low"
    },
    {
      "value": "rgba(255, 255, 255, 0.2) 0px 0px 20px 5px",
      "level": "high"
    },
    {
      "value": "rgba(0, 0, 0, 0.03) 0px 3px 9px 0px, rgba(0, 0, 0, 0.016) 0px 0.7px 1.4625px 0px",
      "level": "mid"
    }
  ],
  "components": {
    "primaryButton": {
      "bg": "#455dd3",
      "color": "#ffffff",
      "borderRadius": 8,
      "paddingH": 14,
      "paddingV": 4,
      "fontSize": 16,
      "fontWeight": "500"
    },
    "secondaryButton": {
      "bg": "#213183",
      "color": "#ffffff",
      "borderRadius": 8,
      "paddingH": 15,
      "paddingV": 6,
      "fontSize": 16,
      "fontWeight": "500"
    },
    "card": {
      "bg": "#ffffff",
      "borderRadius": 16,
      "padding": 0,
      "shadow": "none"
    }
  }
}