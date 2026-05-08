---
name: Summer Ethereal
colors:
  surface: '#f9f9f9'
  surface-dim: '#dadada'
  surface-bright: '#f9f9f9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f3'
  surface-container: '#eeeeee'
  surface-container-high: '#e8e8e8'
  surface-container-highest: '#e2e2e2'
  on-surface: '#1a1c1c'
  on-surface-variant: '#4f4445'
  inverse-surface: '#2f3131'
  inverse-on-surface: '#f0f1f1'
  outline: '#807475'
  outline-variant: '#d2c3c4'
  surface-tint: '#70585b'
  primary: '#70585b'
  on-primary: '#ffffff'
  primary-container: '#fadadd'
  on-primary-container: '#765e61'
  inverse-primary: '#debfc2'
  secondary: '#37656b'
  on-secondary: '#ffffff'
  secondary-container: '#b8e8ee'
  on-secondary-container: '#3b6a6f'
  tertiary: '#615e5b'
  on-tertiary: '#ffffff'
  tertiary-container: '#e6e1dd'
  on-tertiary-container: '#676361'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#fbdbde'
  primary-fixed-dim: '#debfc2'
  on-primary-fixed: '#281719'
  on-primary-fixed-variant: '#574144'
  secondary-fixed: '#bbebf1'
  secondary-fixed-dim: '#9fcfd5'
  on-secondary-fixed: '#001f23'
  on-secondary-fixed-variant: '#1d4d53'
  tertiary-fixed: '#e7e1de'
  tertiary-fixed-dim: '#cbc5c2'
  on-tertiary-fixed: '#1d1b19'
  on-tertiary-fixed-variant: '#494644'
  background: '#f9f9f9'
  on-background: '#1a1c1c'
  surface-variant: '#e2e2e2'
typography:
  h1:
    fontFamily: Playfair Display
    fontSize: 48px
    fontWeight: '400'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  h2:
    fontFamily: Playfair Display
    fontSize: 36px
    fontWeight: '400'
    lineHeight: '1.2'
  h3:
    fontFamily: Playfair Display
    fontSize: 24px
    fontWeight: '400'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1.4'
    letterSpacing: 0.1em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  container-max: 1280px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 64px
  section-gap: 120px
---

## Brand & Style

This design system embodies a breezy, high-end summer aesthetic. The brand personality is youthful yet sophisticated, capturing the effortless elegance of a seaside retreat. The target audience values quality, minimalism, and a refined sense of playfulness. 

The design style is **Minimalist with Soft-Tactile influences**, prioritizing expansive whitespace to allow high-quality editorial photography to breathe. It avoids harsh lines in favor of organic softness, creating a UI that feels weightless and inviting. The emotional response should be one of calm, freshness, and understated luxury.

## Colors

The palette is anchored in light-drenched neutrals and delicate pastels. 

- **Primary:** A soft pastel pink used for key accents, active states, and brand highlights.
- **Secondary:** A light sky blue used for secondary actions and to provide a "breezy" contrast to the pink.
- **Backgrounds:** Utilize off-whites and cream-toned neutrals rather than pure white to maintain warmth and a high-end feel.
- **Accents:** Use a muted charcoal (#333333) for text to ensure legibility while avoiding the harshness of pure black.

## Typography

The typographic hierarchy relies on the high contrast between the romantic, high-stroke-contrast **Playfair Display** and the functional, neutral **Inter**.

- **Headlines:** Set in Playfair Display. Large headings should use slightly tighter letter spacing for a premium editorial look.
- **Body Text:** Inter provides a clean, readable counterpoint. Increased line-height (1.6) is essential to maintain the "airy" feel.
- **Labels & Captions:** Use Inter in uppercase with generous letter spacing to denote navigation or secondary metadata without distracting from the headlines.

## Layout & Spacing

The design system utilizes a **Fixed Grid** model for desktop and a **Fluid Grid** for mobile. 

- **Whitespace:** Emphasize vertical rhythm with large section gaps (120px+) to separate distinct content blocks. 
- **Margins:** Desktop layouts should feature wide horizontal margins (64px) to center content and create a focused, boutique shopping experience.
- **Alignment:** Use asymmetrical layouts for editorial sections (image-heavy) while maintaining strict grid alignment for product listings.

## Elevation & Depth

Depth is achieved through **Ambient Shadows** and tonal layering. 

- **Shadow Character:** Shadows should be extremely diffused, using low-opacity pink or blue tints (e.g., 8% opacity of the secondary color) instead of gray. This keeps the UI looking "fresh" and prevents it from feeling heavy.
- **Layers:** Use subtle tonal shifts (e.g., a tertiary background surface on a neutral background) to define areas without needing borders.
- **Blur:** Soft background blurs (10px - 20px) can be used on navigation overlays to maintain a sense of translucency and airiness.

## Shapes

The shape language is defined by **Soft Roundedness**. 

- **Elements:** Buttons and input fields use a 0.5rem (8px) radius to feel approachable and youthful.
- **Containers:** Large cards and image containers should use the `rounded-xl` (1.5rem / 24px) setting to mirror the organic flow of summer fashion.
- **Icons:** Use thin-stroke, rounded-end icons to match the weight of the Inter body text.

## Components

- **Buttons:** Primary buttons are solid pastel pink with charcoal text. Secondary buttons are outlined with a 1px stroke in sky blue. All buttons should have a subtle lift (soft shadow) on hover.
- **Cards:** Product cards use off-white backgrounds with no borders. Use soft shadows to indicate interactable areas. Images within cards should have a slight zoom-in effect on hover.
- **Input Fields:** Minimalist design with a bottom-border only or a very light sky-blue background. Focus states transition the border to the primary pink.
- **Chips/Tags:** Used for sizes or categories. Pill-shaped with light sky-blue backgrounds and darker blue text.
- **Checkboxes & Radios:** Rounded corners even for checkboxes to maintain the "soft" brand identity. Use the primary pink for the "selected" state.
- **Navigation:** A sticky top-bar with high translucency and a subtle backdrop blur to keep the content visible as the user scrolls.