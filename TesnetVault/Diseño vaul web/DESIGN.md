---
name: Celestial Finance System
colors:
  surface: '#0e1416'
  surface-dim: '#0e1416'
  surface-bright: '#343a3c'
  surface-container-lowest: '#090f11'
  surface-container-low: '#161d1e'
  surface-container: '#1a2122'
  surface-container-high: '#242b2d'
  surface-container-highest: '#2f3638'
  on-surface: '#dde4e5'
  on-surface-variant: '#bbc9cd'
  inverse-surface: '#dde4e5'
  inverse-on-surface: '#2b3233'
  outline: '#859397'
  outline-variant: '#3c494c'
  surface-tint: '#2fd9f4'
  primary: '#8aebff'
  on-primary: '#00363e'
  primary-container: '#22d3ee'
  on-primary-container: '#005763'
  inverse-primary: '#006877'
  secondary: '#c0c1ff'
  on-secondary: '#1000a9'
  secondary-container: '#3131c0'
  on-secondary-container: '#b0b2ff'
  tertiary: '#61f6b9'
  on-tertiary: '#003825'
  tertiary-container: '#3dd99e'
  on-tertiary-container: '#005a3e'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#a2eeff'
  primary-fixed-dim: '#2fd9f4'
  on-primary-fixed: '#001f25'
  on-primary-fixed-variant: '#004e5a'
  secondary-fixed: '#e1e0ff'
  secondary-fixed-dim: '#c0c1ff'
  on-secondary-fixed: '#07006c'
  on-secondary-fixed-variant: '#2f2ebe'
  tertiary-fixed: '#68fcbf'
  tertiary-fixed-dim: '#45dfa4'
  on-tertiary-fixed: '#002114'
  on-tertiary-fixed-variant: '#005137'
  background: '#0e1416'
  on-background: '#dde4e5'
  surface-variant: '#2f3638'
typography:
  headline-xl:
    fontFamily: Geist
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  data-lg:
    fontFamily: Geist Mono
    fontSize: 18px
    fontWeight: '500'
    lineHeight: 24px
    letterSpacing: 0.05em
  data-sm:
    fontFamily: Geist Mono
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0.1em
  label-caps:
    fontFamily: Geist
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.15em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  container-max: 1280px
  gutter: 24px
  margin-mobile: 16px
  unit-xs: 4px
  unit-sm: 8px
  unit-md: 16px
  unit-lg: 32px
  unit-xl: 64px
---

## Brand & Style
The design system is engineered for a futuristic Web3 environment, specifically targeting high-net-worth users in the decentralized finance space. The brand personality is "Celestial Authority"—combining the vastness of deep space with the precision of advanced aerospace technology.

The aesthetic follows a **High-End Minimalist Sci-Fi** direction. It leverages a refined version of **Glassmorphism**, where surfaces feel like reinforced polycarbonate or holographic projections. The emotional response is one of security, immense technical capability, and quiet sophistication. Key characteristics include high-contrast structural lines, "data-glow" accents, and a deep-space background that provides infinite visual depth.

## Colors
The palette is rooted in the "Lunar Vault" concept, using deep space tones as a foundation for holographic data layers.

- **Background (Slate-950/Navy):** The core canvas is a deep, immersive navy-slate, creating a void that allows UI elements to appear as if they are floating.
- **Primary (Cyan-400):** Used for interactive states and primary actions. It represents the "holographic" light source of the UI.
- **Secondary (Indigo-500):** Used for structural depth and brand-level accents.
- **Stable Accent (Emerald-400):** Reserved strictly for positive growth, stable coin indicators, and successful transaction states.
- **Volatile Accent (Fuchsia-500):** Used for high-energy data points, market volatility, or warnings requiring immediate attention.

## Typography
The typography system uses a dual-font approach to balance human readability with technical precision.

- **Primary Sans (Geist/Inter):** Geist is used for headings to provide a sharp, modern technical feel. Inter handles body copy for maximum legibility.
- **Monospace Accents (Geist Mono):** All wallet addresses, transaction hashes, and numerical balances must use the monospace font. This ensures character alignment and reinforces the "technical instrument" aesthetic.
- **Styling:** Headings should use tight letter spacing, while small labels and data points should use expanded tracking to evoke the feel of aerospace HUDs (Heads-Up Displays).

## Layout & Spacing
The layout follows a **Fluid Grid** model with high-precision alignment. 

- **Grid:** A 12-column grid system is used for desktop, shifting to a single column for mobile. 
- **Rhythm:** An 8px linear scale governs all padding and margins. 
- **Density:** The design should maintain high "negative space" to allow the glass effects to breathe. Content blocks should be grouped into logical modules (modules within modules) to mimic a complex instrument panel.
- **Mobile Adaption:** On mobile devices, the glass panels stretch to the edge of the screen (0px margin for the panel itself, but internal 16px padding) to maximize the limited viewport.

## Elevation & Depth
Depth is conveyed through transparency and light emission rather than traditional shadows.

- **Glassmorphism:** Surfaces use a background blur (backdrop-filter: blur(12px)) combined with a semi-transparent dark fill (rgba(15, 23, 42, 0.6)).
- **The "Inner Glow":** Active or high-importance elements should feature a subtle inner glow (1px stroke with a 2px blur) using the Primary Cyan color at low opacity.
- **Bloom Effects:** Instead of black shadows, use "Bloom"—subtle, diffused glows that inherit the color of the element (e.g., a Cyan button has a soft Cyan ambient glow behind it).
- **Borders:** Every card and container must have a 1px solid border using `white/10`. This creates a crisp, architectural "wireframe" feel.

## Shapes
The shape language is "Precision-Softened." 

We avoid overly rounded "bubbly" shapes. Instead, we use a consistent **Soft (4px - 12px)** radius that suggests advanced manufacturing. Buttons and small inputs use the `rounded-sm` (4px), while major dashboard cards use `rounded-lg` (12px). 

Interactive states may involve "shaving" the corners or adding technical notches in the iconography to reinforce the sci-fi theme.

## Components

- **Buttons:** Primary buttons are solid Cyan with black text for maximum contrast. Secondary buttons are "Ghost" style: 1px Cyan borders with a very subtle Cyan tint on hover.
- **Cards/Vaults:** These are the centerpiece. Use the frosted glass effect with a 1px `white/10` border. Titles should be in Geist SemiBold, and balances in Geist Mono.
- **Inputs:** Input fields are dark and recessed. On focus, the border transitions from `white/10` to `Cyan-400` with a subtle bloom.
- **Chips/Status:** For "Stable" vs "Volatile," use small pill-shaped indicators with high-saturation text and a 10% opacity background of the same color.
- **Micro-interactions:** Use "Ease-in-out-expo" for transitions. Hovering over a card should slightly increase the backdrop blur and brighten the border stroke.
- **Iconography:** Use 1.5pt thin-stroke icons. Icons should never be filled; they should remain as technical line art.