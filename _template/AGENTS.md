# AGENTS.md — Contractor One Page Website

## Project Overview

This is a **One Page contractor website** built with **Astro v6** and **Tailwind CSS v4**.
The site is designed to generate leads, showcase services, and establish trust with potential clients.
All sections are part of a single scrollable page with anchor-based navigation.

> **This template was validated and battle-tested on a real project (Wali Painting & Handyman, Delaware).**
> All patterns here reflect what actually worked — not just theory.

---

## Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Framework | [Astro](https://astro.build/) v6+ | Use latest stable |
| Styling | [Tailwind CSS](https://tailwindcss.com/) v4 | CSS-based config — NO `tailwind.config.mjs` |
| Vite Plugin | `@tailwindcss/vite` | Replaces `@astrojs/tailwind` (deprecated in v4) |
| Images | Astro `<Image />` from `astro:assets` | Images MUST be in `src/assets/images/` |
| Image Processing | `sharp` + `glob` | One-time script to crop/resize client photos |
| Forms | Netlify Forms | `data-netlify="true"` + `action="/thank-you"` |
| Maps | Google Maps Embed (`<iframe>`) | |
| Icons | Inline SVGs | No icon library needed |
| Fonts | Google Fonts via `<link>` in `<head>` | Montserrat (headings) + Inter (body) |

---

## ⚠️ Critical Architecture Rules (Learned the Hard Way)

These are NON-NEGOTIABLE. Ignoring them will break the build silently or at deploy time.

### 1. Tailwind v4 — NO `tailwind.config.mjs`
Tailwind v4 uses a **CSS-first configuration**. All tokens live in `src/styles/global.css`:

```css
@import "tailwindcss";

@theme {
  --color-brand-primary: #000000;
  --color-brand-accent:  #000000;
  --color-brand-light:   #f8f9fa;
  --color-brand-dark:    #111827;

  --font-family-heading: 'Montserrat', system-ui, sans-serif;
  --font-family-body: 'Inter', system-ui, sans-serif;
}
```

Use in components as: `bg-brand-primary`, `text-brand-accent`, `font-heading`, etc.
**Never hardcode hex values in component HTML.**

### 2. Astro + Vite 7 — `CONTENT.json` MUST live inside `src/`
Vite 7 (bundled with Astro v6) **blocks imports of files outside `src/`**. If you place
`CONTENT.json` at the project root and try to import it from a component, the build will fail.

**The correct pattern:**
```
src/
├── CONTENT.json       ← data file lives HERE
└── content.ts         ← re-exports it for all components
```

`src/content.ts`:
```ts
import content from './CONTENT.json' with { type: 'json' };
export default content;
```

Every component imports from `content.ts`, never from `CONTENT.json` directly:
```ts
import content from '../../content.ts';
```

### 3. `@tailwindcss/vite` — NOT `@astrojs/tailwind`
The old `@astrojs/tailwind` integration is for Tailwind v3. For v4 use the Vite plugin directly:

`astro.config.mjs`:
```js
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://yourclient.com',
  vite: {
    plugins: [tailwindcss()],
    json: {
      stringify: 'auto',
    },
  },
});
```

### 4. Services grid — handle odd counts automatically
If the number of services is not divisible by 3, the last card will be alone in its row
and appear misaligned. Detect it and render a horizontal layout automatically:

```astro
{services.map((service, index) => {
  const isLast = index === services.length - 1;
  const isOrphan = isLast && services.length % 3 !== 0;

  return isOrphan ? (
    <!-- horizontal card layout -->
  ) : (
    <!-- normal vertical card -->
  );
})}
```

### 5. Favicon — use the company logo
- Resize the logo to `50×50` PNG using `sharp` with `fit: 'contain'` and transparent background
- Place at `public/favicon.png`
- Reference in `BaseLayout.astro`: `<link rel="icon" type="image/png" href="/favicon.png" />`
- Use `fit: 'contain'` (NOT `cover`) so portrait logos are not cropped

### 6. TopBar — phone is an array, social media has "NO X" placeholders
`company_phone` in `CONTENT.json` is an **array** (clients often have 2+ numbers).
Render all of them with `.map()`. Social media fields use `"NO FACEBOOK"`, `"NO INSTAGRAM"` etc.
as placeholder values — always guard before rendering:

```astro
{content.company_phone.map((phone) => (
  <a href={`tel:${phone.replace(/[^0-9+]/g, '')}`}>{phone}</a>
))}

{social_media.facebook !== 'NO FACEBOOK' && social_media.facebook && (
  <a href={social_media.facebook}>...</a>
)}
```

### 7. Netlify Forms — always include `action="/thank-you"`
Both forms (LeadForm + ContactUs) need:
- `data-netlify="true"`
- `<input type="hidden" name="form-name" value="form-name" />`
- `action="/thank-you"` — without this, the user sees a generic Netlify confirmation page

---

## Pre-Development Workflow — MANDATORY

Before writing a single line of code, the following steps MUST be completed in order.
**If any step is incomplete, STOP and request the missing information.**

---

### STEP 1 — Fill and Validate `src/CONTENT.json`

This file is the **single source of truth** for all website content.

**⛔ HARD GATE — Do NOT start development if ANY of these fields still contain their placeholder value:**

| Field | Required Value |
|-------|---------------|
| `company_name` | Real company name |
| `company_phone` | Array with at least one real phone number |
| `company_email` | Array with at least one real email address |
| `company_address` | Real street address |
| `company_estimate` | e.g. `"Free Estimates"` |
| `company_license` | Real license number or `"N/A"` / `"NO LICENSE"` |
| `social_media` | At least one real URL (rest can be `"NO X"`) |
| `services[*].name` | All service names must be real (not `[SERVICE_NAME]`) |
| `company_colors` | Object with 4 keys: `primary`, `accent`, `light`, `dark` (hex values) |

If any required field is still a placeholder, output this message and stop:

```
❌ CONTENT.json is incomplete. The following fields must be filled before development can begin:
- [list the incomplete fields]

Please fill in the client information and try again.
```

Once client data is present, the AI must:
1. Read all pre-filled client fields
2. Write all `[PLACEHOLDER]` copy fields following word-count rules below
3. Copy color values from `company_colors` into `src/styles/global.css` under `@theme {}`
4. Save both files before proceeding to Step 2

**Content writing rules:**

| Field | Rule |
|-------|------|
| `phrases` | Each phrase: min 6 words, max 8 words |
| `home_content` | Each paragraph: min 50 words, max 60 words |
| `about_content` | Each paragraph: min 50 words, max 60 words |
| `service_description` | Each description: min 30 words, max 40 words |
| `company_mission` | Exactly 50 words |
| `company_vision` | Exactly 50 words |
| `company_why_choose_us` | Exactly 50 words |

---

### STEP 2 — Prepare Images from `COMPANY-PHOTOS/`

The folder `COMPANY-PHOTOS/` contains raw client photos organized in subfolders.
Run the processing script to crop, resize, and copy them to `src/assets/images/`.

**Subfolder structure:**
```
COMPANY-PHOTOS/
├── logo/       ← Company logo (PNG preferred, transparent background)
├── hero/       ← 1-2 landscape photos for hero background
├── welcome/    ← 1 photo (team, office, or job site)
├── about/      ← 1 photo (founder, team, or project)
├── services/   ← 1 photo per service — file name MUST match service in kebab-case
│   ├── residential-painting.jpg
│   ├── commercial-painting.jpg
│   └── ...
└── gallery/    ← All remaining project photos
```

**⛔ HARD GATE — Do NOT proceed if any subfolder is empty.**
The `services/` folder must have one image per service listed in `CONTENT.json`.

**Target aspect ratios:**

| Section | Ratio | Max Width |
|---------|-------|-----------|
| Hero | 16:9 | 1920px |
| Welcome | 4:3 | 800px |
| Services | 4:3 | 600px |
| About | 4:3 | 800px |
| Gallery | 1:1 | 800px |
| Logo | (copy as-is) | — |

**Run the script:**
```bash
npm install   # sharp and glob are already in package.json
node scripts/process-images.mjs
```

**Also generate the favicon from the logo:**
```bash
node scripts/generate-favicon.mjs
```

**Rules:**
- Output goes to `src/assets/images/` — NOT `public/`
- Never import raw photos from `COMPANY-PHOTOS/` in components
- Astro's `<Image />` handles final WebP conversion at build time

---

### STEP 3 — Begin Development

Only after STEP 1 and STEP 2 are complete, proceed with building components.

---

## Project Structure

```
_template/
├── COMPANY-PHOTOS/               # ⚠️ Raw client photos — DO NOT import directly
│   ├── logo/
│   ├── hero/
│   ├── welcome/
│   ├── about/
│   ├── services/
│   └── gallery/
├── scripts/
│   ├── process-images.mjs        # Crop + resize pipeline
│   └── generate-favicon.mjs      # Resize logo → public/favicon.png
├── src/
│   ├── assets/
│   │   └── images/               # ✅ Processed images — Astro optimizes these
│   │       ├── logo/
│   │       ├── hero/
│   │       ├── welcome/
│   │       ├── services/
│   │       ├── about/
│   │       └── gallery/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── TopBar.astro
│   │   │   ├── Navbar.astro
│   │   │   └── Footer.astro
│   │   ├── sections/
│   │   │   ├── Hero.astro
│   │   │   ├── Welcome.astro
│   │   │   ├── Services.astro
│   │   │   ├── Gallery.astro
│   │   │   ├── AboutUs.astro
│   │   │   ├── MissionVisionValues.astro
│   │   │   └── ContactUs.astro
│   │   └── ui/
│   │       ├── ServiceCard.astro
│   │       ├── GalleryGrid.astro
│   │       └── LeadForm.astro
│   ├── layouts/
│   │   └── BaseLayout.astro
│   ├── pages/
│   │   ├── index.astro
│   │   └── thank-you.astro       # Required — Netlify redirects here after form submit
│   ├── styles/
│   │   └── global.css            # @import "tailwindcss" + @theme {} tokens
│   ├── CONTENT.json              # ✅ Single source of truth — MUST be inside src/
│   └── content.ts                # Re-exports CONTENT.json for all components
├── public/
│   └── favicon.png               # Generated from logo by generate-favicon.mjs
├── astro.config.mjs
└── package.json
```

---

## Page Sections — Order & Specifications

### 1. Top Bar (`TopBar.astro`)

**Purpose:** Quick contact info and social proof at the very top.

**Left side:** All phone numbers (loop over array) + email — clickable links
**Right side:** Social media icons — render ONLY if value is not `"NO X"`

```astro
---
import content from '../../content.ts';
const { company_phone, company_email, social_media } = content;
---
<div class="bg-brand-dark text-white text-sm py-2 px-4 flex justify-between items-center">
  <div class="flex gap-4">
    {company_phone.map((phone) => (
      <a href={`tel:${phone.replace(/[^0-9+]/g, '')}`} class="flex items-center gap-1 hover:text-brand-accent transition-colors">
        <!-- phone icon SVG -->
        {phone}
      </a>
    ))}
  </div>
  <div class="flex gap-3">
    {social_media.facebook !== 'NO FACEBOOK' && social_media.facebook && (
      <a href={social_media.facebook} target="_blank" rel="noopener noreferrer"><!-- FB icon --></a>
    )}
    <!-- repeat for instagram, youtube, tiktok -->
  </div>
</div>
```

---

### 2. Navbar (`Navbar.astro`)

**Layout:** Logo on one side, anchor nav links on the other.
**Behavior:** `sticky top-0 z-50`, shadow on scroll via `IntersectionObserver`, hamburger on mobile.

```astro
<nav class="sticky top-0 z-50 bg-white shadow-md">
  <div class="max-w-7xl mx-auto px-4 flex justify-between items-center min-h-[80px]">
    <!-- Logo -->
    <a href="#hero">
      <Image src={logoImg} alt={company_name} height={80} width={...} />
    </a>
    <!-- Nav links -->
    <ul class="hidden md:flex gap-8">
      <li><a href="#welcome">Welcome</a></li>
      <li><a href="#services">Services</a></li>
      <li><a href="#gallery">Gallery</a></li>
      <li><a href="#about">About Us</a></li>
      <li><a href="#contact">Contact</a></li>
    </ul>
    <!-- Hamburger (mobile only) -->
  </div>
</nav>
```

**Logo sizing note:** Calculate `width` from the logo's actual pixel dimensions to maintain aspect ratio.
Example: logo is 300×319px at height 80px → width = `Math.round(300 * (80/319))` = 75px.

---

### 3. Hero Section (`Hero.astro`)

**Layout:** Two columns on desktop (headline + form), stacked on mobile.
**Background:** Full-width image with dark overlay.

```astro
<section id="hero" class="relative min-h-screen bg-cover bg-center flex items-center"
  style={`background-image: url(${heroImg.src})`}>
  <div class="absolute inset-0 bg-black/60"></div>
  <div class="relative z-10 max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center py-20">
    <!-- Left: headline + CTA -->
    <!-- Right: LeadForm component -->
  </div>
</section>
```

**LeadForm fields (all required):**
1. Full Name — `type="text"`
2. Phone — `type="tel"`
3. Email — `type="email"`
4. Zip Code — `type="text"` with 5-digit pattern
5. Service Interested In — `<select>` populated from `content.services`
6. Project Description — `<textarea rows="4">`

Submit: "Get a Free Quote" — full-width, `bg-brand-primary`

---

### 4. Welcome Section (`Welcome.astro`)

**ID:** `id="welcome"` | **Background:** `bg-white`
**Layout:** Image left, text right (2 cols desktop, stacked mobile)

---

### 5. Services Section (`Services.astro`)

**ID:** `id="services"` | **Background:** `bg-brand-light`
**Layout:** 3-column grid (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`)

**⚠️ Handle orphan cards** — if `services.length % 3 !== 0`, the last card renders
as a horizontal card spanning full width (image left, text right) to avoid a lonely card.

---

### 6. Gallery Section (`Gallery.astro`)

**ID:** `id="gallery"` | **Background:** `bg-white`
**Initial load:** 9 images. "Load More" button shows batches of 9 via vanilla JS.
Images: `aspect-square object-cover rounded-lg`

---

### 7. About Us Section (`AboutUs.astro`)

**ID:** `id="about"` | **Background:** `bg-brand-light`
**Layout:** Image left, text right. Optional key stats (years, projects, clients).

---

### 8. Mission, Vision & Why Choose Us (`MissionVisionValues.astro`)

**Placement:** Directly below About Us | **Background:** `bg-brand-dark text-white`
**Layout:** 3 equal columns — Mission | Vision | Why Choose Us
Each card: icon + title + body text from `CONTENT.json`

---

### 9. Contact Us Section (`ContactUs.astro`)

**ID:** `id="contact"` | **Background:** `bg-white`
**Layout:** Form left, Google Maps `<iframe>` right.

Form fields: Full Name, Phone, Email, Message/Project Details.
Submit: "Send Message" — `action="/thank-you"`, `data-netlify="true"`

Google Maps embed:
```html
<iframe
  src="https://www.google.com/maps/embed?pb=YOUR_EMBED_CODE"
  class="w-full rounded-xl min-h-[400px]"
  style="border:0;"
  allowfullscreen loading="lazy"
  referrerpolicy="no-referrer-when-downgrade">
</iframe>
```

---

### 10. Footer (`Footer.astro`)

**Background:** `bg-brand-dark text-gray-400`

- Left: small logo + `© {new Date().getFullYear()} [COMPANY NAME]. All rights reserved.`
- Center: quick nav links
- Right: social media icons (same guard pattern as TopBar)

---

### 11. Thank You Page (`src/pages/thank-you.astro`) — REQUIRED

Netlify redirects here after any form submission. Must include:
- Success message + checkmark icon
- CTA buttons to call each phone number (loop over `company_phone`)
- "Back to Home" link
- Facebook link (if available)

---

## Design System

### Colors — `src/styles/global.css`

```css
@import "tailwindcss";

@theme {
  --color-brand-primary: #000000;   /* from company_colors.primary */
  --color-brand-accent:  #000000;   /* from company_colors.accent  */
  --color-brand-light:   #f8f9fa;   /* from company_colors.light   */
  --color-brand-dark:    #111827;   /* from company_colors.dark    */

  --font-family-heading: 'Montserrat', system-ui, sans-serif;
  --font-family-body: 'Inter', system-ui, sans-serif;
}

@layer base {
  html { scroll-behavior: smooth; }
  body { font-family: var(--font-family-body); -webkit-font-smoothing: antialiased; }
  h1, h2, h3, h4, h5, h6 { font-family: var(--font-family-heading); }
}
```

| Token | Class | Role |
|-------|-------|------|
| `primary` | `bg-brand-primary` | CTA buttons, active links |
| `accent` | `text-brand-accent` | Hover states, highlights |
| `light` | `bg-brand-light` | Section backgrounds |
| `dark` | `bg-brand-dark` | TopBar, Footer, dark sections |

### Spacing
- Section padding: `py-20` desktop / `py-12` mobile
- Container: `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`

### Buttons
```html
<!-- Primary -->
<button class="bg-brand-primary text-white font-semibold px-6 py-3 rounded-lg hover:bg-brand-primary/90 transition-colors">

<!-- Outline -->
<button class="border-2 border-brand-primary text-brand-primary font-semibold px-6 py-3 rounded-lg hover:bg-brand-primary hover:text-white transition-colors">
```

---

## Accessibility

- All `<img>` and `<Image />` tags must have descriptive `alt`
- Form fields must have `<label>` (use `sr-only` if visually hidden)
- Interactive elements: `focus:ring-2 focus:ring-brand-primary`
- Minimum contrast ratio 4.5:1 (WCAG AA)
- Landmarks: `<header>`, `<nav>`, `<main>`, `<section>`, `<footer>`

---

## SEO

- `<title>`: `"[Primary Service] in [City] | [Company Name]"`
- `<meta name="description">`: 150-160 chars with primary keyword
- `<meta property="og:*">` for social sharing
- ONE `<h1>` per page, then `<h2>` per section, `<h3>` for cards
- JSON-LD `LocalBusiness` schema in `<head>` — populated from `CONTENT.json`

---

## Form Handling — Netlify (default)

```html
<form
  name="lead-form"
  method="POST"
  data-netlify="true"
  action="/thank-you"
>
  <input type="hidden" name="form-name" value="lead-form" />
  <!-- fields -->
</form>
```

For Formspree: `action="https://formspree.io/f/YOUR_ID"`

---

## Development Commands

```bash
npm install        # Install dependencies
npm run dev        # Start dev server (localhost:4321)
npm run build      # Production build
npm run preview    # Preview production build locally
```

---

## Naming Conventions

- **Components:** PascalCase (`ServiceCard.astro`)
- **Pages/routes:** kebab-case (`thank-you.astro`)
- **Images:** kebab-case descriptive (`interior-painting.jpg`)
- **Section IDs:** lowercase hyphen (`id="why-choose-us"`)
- **Props:** camelCase

---

## DO / DON'T

### ✅ DO
- Source ALL text from `src/content.ts` — never hardcode copy
- Use Astro `<Image />` for every image (WebP + lazy loading automatic)
- Keep sections visually distinct — alternate `bg-white` / `bg-brand-light`
- Loop over `company_phone` (it's an array)
- Guard every social media link against `"NO X"` values
- Calculate logo `width` prop from actual image dimensions

### ❌ DON'T
- Don't place `CONTENT.json` at the project root — Vite 7 will block it
- Don't use `tailwind.config.mjs` — Tailwind v4 uses CSS `@theme`
- Don't install `@astrojs/tailwind` — use `@tailwindcss/vite` instead
- Don't hardcode hex colors in HTML — use `brand-*` tokens
- Don't skip `action="/thank-you"` on Netlify forms
- Don't import images from `COMPANY-PHOTOS/` — only from `src/assets/images/`
- Don't use `fit: 'cover'` for favicon generation — use `fit: 'contain'` to preserve portrait logos
