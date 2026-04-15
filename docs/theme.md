# Hula-Inspired Web App Color Palette

A color system inspired by a Merrie Monarch hula dancer's teal lace dress and marigold lei. The palette pairs a cool jewel-tone teal primary with a warm marigold accent — a naturally complementary, high-contrast combination — grounded by warm cream and sand neutrals for readability.

---

## Core Palette

| Role | Name | Hex | Usage |
|---|---|---|---|
| Primary | Lehua Teal | `#1B8A8C` | Buttons, links, primary actions |
| Primary Dark | Deep Lagoon | `#0F5759` | Hover states, headers |
| Primary Light | Sea Glass | `#7FBDBE` | Highlights, secondary buttons |
| Accent | Marigold Lei | `#F2A341` | CTAs, badges, notifications |
| Accent Dark | Ember Orange | `#C77518` | Accent hover, active states |
| Neutral Dark | Stage Night | `#1A1F2B` | Body text, dark mode background |
| Neutral Mid | Woven Sand | `#A89887` | Borders, muted text |
| Neutral Light | Lauhala Cream | `#F5EFE6` | Backgrounds, cards |
| Surface | Pure White | `#FFFFFF` | Card surfaces, modals |

---

## Semantic Colors

| Role | Hex | Derivation |
|---|---|---|
| Success | `#4A9D7C` | Teal-shifted green |
| Warning | `#E89B3C` | Lei-toned amber |
| Error | `#C44536` | Warm coral-red |
| Info | `#5BA3B0` | Soft teal |

---

## Suggested Pairings

| Combination | Background | Foreground | Best For |
|---|---|---|---|
| Hero | Deep Lagoon `#0F5759` | Lauhala Cream `#F5EFE6` | Landing sections |
| CTA | Marigold Lei `#F2A341` | Stage Night `#1A1F2B` | Primary buttons |
| Card | Lauhala Cream `#F5EFE6` | Stage Night `#1A1F2B` | Content cards |
| Dark mode | Stage Night `#1A1F2B` | Sea Glass `#7FBDBE` | Night theme |

---

## Tailwind v4 Theme (CSS)

Register the palette in `index.css` using a `@theme` block. This generates Tailwind utility classes like `bg-primary`, `text-accent`, `border-neutral-light`, etc.

```css
@import "tailwindcss";

@theme {
  /* Core Palette */
  --color-primary: #1B8A8C;
  --color-primary-dark: #0F5759;
  --color-primary-light: #7FBDBE;
  --color-accent: #F2A341;
  --color-accent-dark: #C77518;
  --color-neutral-dark: #1A1F2B;
  --color-neutral-mid: #A89887;
  --color-neutral-light: #F5EFE6;
  --color-surface: #FFFFFF;

  /* Semantic Colors */
  --color-success: #4A9D7C;
  --color-warning: #E89B3C;
  --color-error: #C44536;
  --color-info: #5BA3B0;
}
```

---

## shadcn/ui Variable Mapping

After `shadcn init`, map the generated CSS variables to this palette:

```css
:root {
  --background: #F5EFE6;          /* Lauhala Cream */
  --foreground: #1A1F2B;          /* Stage Night */
  --primary: #1B8A8C;             /* Lehua Teal */
  --primary-foreground: #F5EFE6;  /* Lauhala Cream */
  --secondary: #7FBDBE;           /* Sea Glass */
  --secondary-foreground: #0F5759;/* Deep Lagoon */
  --accent: #F2A341;              /* Marigold Lei */
  --accent-foreground: #1A1F2B;   /* Stage Night */
  --muted: #A89887;               /* Woven Sand */
  --muted-foreground: #0F5759;    /* Deep Lagoon */
  --destructive: #C44536;         /* Error */
  --border: #A89887;              /* Woven Sand */
  --ring: #1B8A8C;                /* Lehua Teal */
  --card: #FFFFFF;                /* Pure White */
  --card-foreground: #1A1F2B;     /* Stage Night */
}
```

Adapt these mappings to whatever variables shadcn generates — the goal is that shadcn components inherit the palette naturally.
