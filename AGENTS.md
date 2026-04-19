# AGENTS.md — Contractor One Page Website

## Project Overview

This is a **One Page contractor website** built with **Astro** and **Tailwind CSS**.
The site is designed to generate leads, showcase services, and establish trust with potential clients.
All sections are part of a single scrollable page with anchor-based navigation.

---

## Pre-Development Workflow — MANDATORY

Before writing a single line of code, the following steps MUST be completed in order.
**If any step is incomplete, STOP and request the missing information.**

---

### STEP 1 — Validate `CONTENT.json`

The file `CONTENT.json` (located at the project root) is the **single source of truth** for all website content.
It contains variables with instructions for AI-generated copy and pre-filled client data.

**⛔ HARD GATE — Do NOT start development if ANY of these fields still contain their placeholder value:**

| Field | Required Value |
|-------|---------------|
| `company_name` | Real company name |
| `company_phone` | At least one real phone number |
| `company_email` | At least one real email address |
| `company_address` | Real street address |
| `company_estimate` | e.g. `"Free Estimates"` |
| `company_license` | Real license number or `"N/A"` |
| `social_media` | At least one real social media URL |
| `services[*].name` | All 6 service names must be real (not `[SERVICE_NAME]`) |
| `company_colors` | Object with 4 keys: `primary`, `accent`, `light`, `dark` (hex values) |

If any required field is still a placeholder, output this message and stop:

```
❌ CONTENT.json is incomplete. The following fields must be filled before development can begin:
- [list the incomplete fields]

Please fill in the client information and try again.
```

**Content writing rules (defined in `_instructions` inside `CONTENT.json`):**

| Field | Rule |
|-------|------|
| `phrases` | Each phrase: min 6 words, max 8 words |
| `home_content` | Each paragraph: min 50 words, max 60 words |
| `about_content` | Each paragraph: min 50 words, max 60 words |
| `service_description` | Each description: min 30 words, max 40 words |
| `company_mission` | Exactly 50 words |
| `company_vision` | Exactly 50 words |
| `company_why_choose_us` | Exactly 50 words |

Once the client data is present, the AI must:
1. Read all pre-filled client fields
2. Write all `[PLACEHOLDER]` copy fields following the word-count rules above
3. Save the completed `CONTENT.json` before proceeding to Step 2

**How to consume `CONTENT.json` in Astro components:**
```ts
// In any .astro file
import content from '../../CONTENT.json';

// Usage
const { company_name, company_phone, services, phrases } = content;
```

All dynamic text in every component MUST be sourced from `CONTENT.json`. **Never hardcode copy.**

---

### STEP 2 — Prepare Images from `COMPANY-PHOTOS`

The folder `COMPANY-PHOTOS/` (at the project root) contains raw client photos of various sizes and weights.
These images must be processed (cropped to correct aspect ratio) and placed in `src/assets/images/`
so that Astro's built-in `<Image />` component handles the final optimization (WebP, compression, lazy loading).

**Image assignment strategy — Convention over Configuration:**

The client or developer organizes photos into subfolders inside `COMPANY-PHOTOS/`:

```
COMPANY-PHOTOS/
├── logo/              ← Company logo (PNG/SVG, transparent background preferred)
├── hero/              ← 1-2 landscape photos for the hero background
├── welcome/           ← 1 photo (team, office, or job site)
├── about/             ← 1 photo (founder, team, or project)
├── services/          ← 1 photo per service (file name = service in kebab-case)
│   ├── interior-painting.jpg
│   ├── exterior-painting.jpg
│   ├── cabinet-refinishing.jpg
│   ├── pressure-washing.jpg
│   ├── drywall-repair.jpg
│   └── color-consultation.jpg
└── gallery/           ← All remaining project photos
```

**⛔ HARD GATE — Do NOT proceed if `COMPANY-PHOTOS/` subfolders are empty or missing.**
Each section subfolder MUST contain at least one image. The `services/` folder must have one image per service listed in `CONTENT.json`.

**Target aspect ratios by section (crop only — Astro handles optimization):**

| Section | Source Subfolder | Crop Aspect Ratio | Notes |
|---------|-----------------|-------------------|-------|
| Hero | `COMPANY-PHOTOS/hero/` | 16:9 | Most impactful landscape photo |
| Welcome | `COMPANY-PHOTOS/welcome/` | 4:3 | Team or on-site work |
| Services | `COMPANY-PHOTOS/services/` | 4:3 | One per service, named to match |
| About Us | `COMPANY-PHOTOS/about/` | 4:3 | Founder, team, or signature project |
| Gallery | `COMPANY-PHOTOS/gallery/` | 1:1 | Square crop for grid consistency |

**Image processing script — `scripts/process-images.mjs`:**

```js
// scripts/process-images.mjs
// Run with: node scripts/process-images.mjs
// Requires: npm install sharp glob
// PURPOSE: Crop images to correct aspect ratios, rename with convention, copy to src/assets/images/
// Astro's <Image /> handles final WebP conversion and compression.

import sharp from 'sharp';
import { glob } from 'glob';
import path from 'path';
import fs from 'fs/promises';

const SECTIONS = [
  { name: 'logo',     ratio: null,     maxWidth: null  },  // No crop — just copy
  { name: 'hero',     ratio: [16, 9],  maxWidth: 1920 },
  { name: 'welcome',  ratio: [4, 3],   maxWidth: 800  },
  { name: 'services', ratio: [4, 3],   maxWidth: 600  },
  { name: 'about',    ratio: [4, 3],   maxWidth: 800  },
  { name: 'gallery',  ratio: [1, 1],   maxWidth: 800  },
];

const SOURCE = './COMPANY-PHOTOS';
const OUTPUT = './src/assets/images';

function getOutputName(section, file, index, totalFiles) {
  const ext = path.extname(file);

  switch (section.name) {
    case 'logo':
      // Keep original extension (could be SVG/PNG)
      return `logo${ext.toLowerCase()}`;
    case 'hero':
      return totalFiles > 1 ? `hero-bg-${index + 1}.jpg` : 'hero-bg.jpg';
    case 'welcome':
      return 'welcome.jpg';
    case 'about':
      return 'about.jpg';
    case 'services':
      // Keep original name — it IS the service identifier
      const baseName = path.basename(file, ext)
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');
      return `${baseName}.jpg`;
    case 'gallery':
      // Sequential numbering: gallery-01, gallery-02, etc.
      return `gallery-${String(index + 1).padStart(2, '0')}.jpg`;
    default:
      return `${section.name}-${index + 1}.jpg`;
  }
}

async function processSection(section) {
  const srcDir = path.join(SOURCE, section.name);
  const outDir = path.join(OUTPUT, section.name);
  await fs.mkdir(outDir, { recursive: true });

  const files = await glob(`${srcDir}/*.{jpg,jpeg,png,webp,svg,JPG,JPEG,PNG,SVG}`);

  if (files.length === 0) {
    console.warn(`⚠️  No images found in ${srcDir}/`);
    return;
  }

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const outputName = getOutputName(section, file, i, files.length);
    const outputPath = path.join(outDir, outputName);

    // Logo: just copy without processing (may be SVG)
    if (section.ratio === null) {
      await fs.copyFile(file, outputPath);
      console.log(`  ✅ [${section.name}] ${outputName} (copied as-is)`);
      continue;
    }

    const [rw, rh] = section.ratio;
    const targetWidth = section.maxWidth;
    const targetHeight = Math.round(targetWidth * rh / rw);

    await sharp(file)
      .resize(targetWidth, targetHeight, { fit: 'cover', position: 'centre' })
      .jpeg({ quality: 90 })  // High quality — Astro will do final optimization
      .toFile(outputPath);

    console.log(`  ✅ [${section.name}] ${outputName} (${targetWidth}×${targetHeight})`);
  }
}

async function main() {
  console.log('📸 Processing COMPANY-PHOTOS...\n');

  for (const section of SECTIONS) {
    await processSection(section);
  }

  console.log('\n🎉 Done. Images ready in src/assets/images/');
  console.log('   Astro will handle WebP conversion and compression at build time.');
}

main().catch(console.error);
```

**How to run:**
```bash
# Install the image processing dependency (one-time)
npm install sharp glob

# Process all images from COMPANY-PHOTOS/ → src/assets/images/
node scripts/process-images.mjs
```

**How to use processed images in Astro components:**
```astro
---
import { Image } from 'astro:assets';
import heroImg from '../../assets/images/hero/team-working-exterior.jpg';
---

<Image src={heroImg} alt="Professional painting team at work" />
```

**Rules:**
- The script crops and resizes — Astro optimizes (WebP, compression, srcset)
- Output goes to `src/assets/images/` (NOT `public/`) so Astro can process them
- File naming: kebab-case, descriptive (`interior-painting.jpg`, not `IMG_2847.jpg`)
- Never use the same image in two different sections
- **⛔ Do NOT import raw photos from `COMPANY-PHOTOS/` directly in components**

---

### STEP 3 — Begin Development

Only after STEP 1 (content validated + written) and STEP 2 (images processed) are complete,
proceed with building the Astro components as defined in the sections below.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Astro](https://astro.build/) (latest stable) |
| Styling | [Tailwind CSS](https://tailwindcss.com/) v4 (CSS-based config via `@tailwindcss/vite`) |
| Icons | [Astro Icon](https://github.com/natemoo-re/astro-icon) or inline SVGs |
| Fonts | Google Fonts via `<link>` in `<head>` or `@fontsource` packages |
| Images | Astro `<Image />` from `astro:assets` — images in `src/assets/images/` |
| Forms | Native HTML5 form — integrate with Netlify Forms, Formspree, or custom endpoint |
| Maps | Google Maps Embed API (`<iframe>` embed) |

---

## Project Structure

```
/
├── COMPANY-PHOTOS/           # ⚠️ Raw client photos — DO NOT import directly
│   ├── logo/                 # Company logo (PNG/SVG)
│   ├── hero/                 # 1-2 landscape photos for hero background
│   ├── welcome/              # 1 photo (team, office, or job site)
│   ├── about/                # 1 photo (founder, team, or project)
│   ├── services/             # 1 photo per service (kebab-case file names)
│   └── gallery/              # All remaining project photos
├── scripts/
│   └── process-images.mjs    # Crop + resize pipeline (sharp + glob)
├── src/
│   ├── assets/
│   │   └── images/           # ✅ Processed images — Astro optimizes these
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
│   │   └── index.astro
│   └── styles/
│       └── global.css
├── public/
│   └── favicon.svg
├── CONTENT.json              # ✅ Single source of truth for all copy
├── astro.config.mjs
└── package.json
```

---

## Page Sections — Order & Specifications

### 1. Top Bar (`TopBar.astro`)

**Purpose:** Quick contact info and social proof at the very top of the page.

**Layout:** Full-width bar, dark or brand-colored background.

**Left side:**
- Phone number with a phone icon (clickable `tel:` link)
- Email address with mail icon (clickable `mailto:` link)

**Right side:**
- Social media icons: Facebook, Instagram, LinkedIn, YouTube (use only the ones available)
- Each icon must be an `<a>` tag with `target="_blank"` and `rel="noopener noreferrer"`

**Tailwind classes reference:**
```html
<div class="bg-gray-900 text-white text-sm py-2 px-4 flex justify-between items-center">
```

**Rules:**
- Font size: `text-sm`
- Icon size: `w-4 h-4` or `w-5 h-5`
- Hover effect on icons: `hover:text-brand-color transition-colors`

---

### 2. Navbar (`Navbar.astro`)

**Purpose:** Primary navigation with logo and anchor links.

**Layout:** Two-column flex row.
- **Left:** Navigation menu links (anchor links to page sections)
- **Right:** Company logo (image or SVG)

**Navigation links (anchor-based):**
- Home → `#hero`
- Welcome → `#welcome`
- Services → `#services`
- Gallery → `#gallery`
- About Us → `#about`
- Contact → `#contact`

**Behavior:**
- Sticky on scroll: `sticky top-0 z-50`
- Background becomes opaque with shadow on scroll (use `IntersectionObserver` or a small inline `<script>`)
- Mobile: hamburger menu that toggles a vertical nav drawer
- Active link highlight based on scroll position (optional but recommended)

**Tailwind classes reference:**
```html
<nav class="sticky top-0 z-50 bg-white shadow-md">
  <div class="max-w-7xl mx-auto px-4 flex justify-between items-center h-16">
```

**Rules:**
- Logo max height: `h-12` or `h-14`
- Nav links: `font-medium text-gray-700 hover:text-brand-primary transition-colors`
- Hamburger icon only visible on mobile: `md:hidden`

---

### 3. Hero Section (`Hero.astro`)

**Purpose:** First impression — capture lead immediately with a form.

**Layout:** Two-column grid on desktop, stacked on mobile.

**Background:**
- Full-width background image (`object-cover`)
- Dark overlay: `bg-black/60` or `bg-gradient-to-r from-black/70 to-black/40`
- Minimum height: `min-h-screen` or `min-h-[600px]`

**Left Column — Headline & CTA:**
- `<h1>` with a strong, benefit-driven headline (e.g., "Quality Painting Services You Can Trust")
- Paragraph: ~50 words describing the company value proposition
- CTA Button: **"Call Us Now"** — styled as primary button, links to `tel:+1XXXXXXXXXX`
- Text color: white (on dark overlay)

**Right Column — Lead Form (`LeadForm.astro`):**
- Background: `bg-white/95` or `bg-white` with rounded corners and shadow
- Form fields (all required unless noted):
  1. **Full Name** — `type="text"` — placeholder: "Your full name"
  2. **Phone** — `type="tel"` — placeholder: "(555) 000-0000"
  3. **Email** — `type="email"` — placeholder: "you@example.com"
  4. **Zip Code** — `type="text"` pattern validation for 5-digit ZIP
  5. **Services Interested In** — `<select>` or `<checkboxes>` (based on available services)
  6. **Brief Description of Project** — `<textarea>` rows="4" — placeholder: "Describe your project..."
- Submit button: full-width, brand primary color, text "Get a Free Quote"
- Form must have `novalidate` removed — use native HTML5 validation
- On mobile, form stacks below the headline content

**Tailwind classes reference:**
```html
<section id="hero" class="relative min-h-screen bg-cover bg-center flex items-center"
  style="background-image: url('/images/hero-bg.jpg')">
  <div class="absolute inset-0 bg-black/60"></div>
  <div class="relative z-10 max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
```

---

### 4. Welcome Section (`Welcome.astro`)

**Purpose:** Introduce the company and build trust.

**ID:** `id="welcome"`

**Layout:** Two-column grid on desktop.
- **Left:** Company image (team photo, office, or job site) — `rounded-xl shadow-lg`
- **Right:** Headline + body content

**Right column content:**
- `<h2>` — "Welcome to [COMPANY NAME]"
- Subheadline or tagline (optional `<h3>` or styled `<p>`)
- 2–3 paragraphs of company introduction content
- Optional: list of bullet points with key differentiators (icon + text)
- Optional CTA button: "Learn More About Us" → `#about`

**Tailwind classes reference:**
```html
<section id="welcome" class="py-20 bg-white">
  <div class="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
```

---

### 5. Services Section (`Services.astro`)

**Purpose:** Showcase what the contractor offers.

**ID:** `id="services"`

**Layout:**
- Section heading centered at top: `<h2>` "Our Services" + optional subtitle
- Grid: 3 columns on desktop (`grid-cols-3`), 2 on tablet (`md:grid-cols-2`), 1 on mobile (`grid-cols-1`)
- Each service = `ServiceCard.astro` component

**`ServiceCard.astro` structure:**
```
┌──────────────────────┐
│   [Service Image]    │  ← aspect-ratio: 4/3 or 16/9, object-cover
│                      │
├──────────────────────┤
│  Service Title       │  ← <h3> font-bold text-xl
│  Descriptive text    │  ← <p> text-gray-600 text-sm, 2-3 sentences
│  [Learn More →]      │  ← optional text link or button
└──────────────────────┘
```

**Card styling:**
- `rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow`
- Hover: slight scale `hover:scale-[1.02] transition-transform`

**Background:** Light gray `bg-gray-50` or white `bg-white`

**Minimum 6 service cards.** Content is passed via props or a data array defined in the `.astro` file.

**Data pattern:**
```ts
// Inside Services.astro
import content from '../../CONTENT.json';

const services = content.services.map(s => ({
  title: s.name,
  description: s.description,
  // Image imported from src/assets/images/services/{kebab-name}.jpg
}));
```

---

### 6. Gallery Section (`Gallery.astro`)

**Purpose:** Show real work — social proof through visuals.

**ID:** `id="gallery"`

**Layout:**
- Section heading centered: "Our Work" or "Project Gallery"
- Initial load: **9 images** in a responsive grid
  - Desktop: `grid-cols-3`
  - Tablet: `grid-cols-2`
  - Mobile: `grid-cols-1`
- Each image: `aspect-square object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity`

**Infinite Load behavior:**
- Below the grid: "Load More" button — centered, outlined style
- On click: loads next batch of 9 images (from a JSON array or static data)
- Implement with a `<script>` tag inside the component using vanilla JS or Alpine.js
- Images are stored in a JS array; the script slices the array per page
- No full page reload — pure client-side DOM manipulation

**Lightbox (optional but recommended):**
- On image click: open a simple lightbox overlay
- Can use a lightweight library like `GLightbox` or custom vanilla JS

**Implementation note:**
```html
<!-- Gallery script pattern -->
<script>
  const allImages = [/* array of image paths */];
  let loaded = 9;
  const grid = document.getElementById('gallery-grid');
  const btn = document.getElementById('load-more-btn');

  btn.addEventListener('click', () => {
    const next = allImages.slice(loaded, loaded + 9);
    next.forEach(src => {
      const img = document.createElement('img');
      img.src = src;
      img.className = 'aspect-square object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity';
      grid.appendChild(img);
    });
    loaded += 9;
    if (loaded >= allImages.length) btn.style.display = 'none';
  });
</script>
```

---

### 7. About Us Section (`AboutUs.astro`)

**Purpose:** Tell the company story, humanize the brand.

**ID:** `id="about"`

**Layout:** Two-column grid on desktop.
- **Left:** Company image (founder, team, or project) — `rounded-xl shadow-lg`
- **Right:** Headline + content

**Right column content:**
- `<h2>` "About Us" or "About [COMPANY NAME]"
- 2–3 paragraphs of company history, values, and expertise
- Key stats (optional): years in business, projects completed, clients served
  - Display as 3 inline stats: `<span class="text-4xl font-bold text-brand-primary">250+</span>`
- Optional CTA: "Contact Us Today" → `#contact`

**Background:** White `bg-white` or very light gray

**Tailwind classes reference:**
```html
<section id="about" class="py-20 bg-gray-50">
  <div class="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
```

---

### 8. Mission, Vision & Why Choose Us (`MissionVisionValues.astro`)

**Purpose:** Reinforce company values and differentiation.

**Placement:** Immediately below the About Us section (same `#about` anchor zone or own `id="values"`)

**Layout:** 3 columns on desktop (`grid-cols-3`), 1 on mobile

**Three columns:**

| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| **Our Mission** | **Our Vision** | **Why Choose Us** |
| Icon + Title + 2-3 sentences | Icon + Title + 2-3 sentences | Icon + Title + bullet list (4-5 points) |

**Card style:**
- `bg-white rounded-xl p-8 shadow-sm border border-gray-100`
- Icon: brand color, `w-10 h-10` at top
- Title: `text-xl font-bold mb-3`
- Content: `text-gray-600`

**Section background:** Brand primary color or dark (`bg-gray-900 text-white`) for visual contrast

---

### 9. Contact Us Section (`ContactUs.astro`)

**Purpose:** Final conversion point — form + map.

**ID:** `id="contact"`

**Layout:** Two-column grid on desktop.

**Left column — Contact Form:**
- `<h2>` "Contact Us" or "Get In Touch"
- Brief text: "Fill out the form below and we'll get back to you within 24 hours."
- Form fields:
  1. **Full Name** — `type="text"`
  2. **Phone** — `type="tel"`
  3. **Email** — `type="email"`
  4. **Message / Project Details** — `<textarea>` rows="5"
- Submit button: "Send Message" — full-width, brand primary

**Right column — Google Maps Embed:**
- `<iframe>` with Google Maps Embed API pointing to company location
- `w-full h-full min-h-[400px] rounded-xl`
- Must have `loading="lazy"` and `allowfullscreen`
- Placeholder embed code:
```html
<iframe
  src="https://www.google.com/maps/embed?pb=YOUR_EMBED_CODE"
  width="100%"
  height="100%"
  class="rounded-xl min-h-[400px]"
  style="border:0;"
  allowfullscreen=""
  loading="lazy"
  referrerpolicy="no-referrer-when-downgrade">
</iframe>
```

**Below the two columns — Contact Info Strip (optional):**
- Address | Phone | Email — displayed inline with icons

---

### 10. Footer (`Footer.astro`)

**Purpose:** Compact closing — legal and quick links.

**Layout:** Single row or 2-row compact block.

**Content:**
- Left: Company logo (small) + copyright notice
  - `© {currentYear} [COMPANY NAME]. All rights reserved.`
- Center (optional): Quick nav links (Home, Services, Gallery, Contact)
- Right: Social media icons (same as TopBar)

**Design:**
- Dark background: `bg-gray-900 text-gray-400`
- Compact height: `py-6`
- Border top: `border-t border-gray-800`

**Dynamic year:**
```astro
---
const year = new Date().getFullYear();
---
<p>© {year} Company Name. All rights reserved.</p>
```

---

## Design System

### Colors

Colors are defined by the client in `CONTENT.json` under `company_colors` as a semantic object:

```json
"company_colors": {
  "primary": "#1e40af",
  "accent": "#f59e0b",
  "light": "#f8f9fa",
  "dark": "#111827"
}
```

**Color roles:**

| Token | Role | Usage |
|-------|------|-------|
| `primary` | Main brand color | Buttons, links, active states, CTA backgrounds |
| `accent` | Highlight / secondary | Hover states, badges, icons, section accents |
| `light` | Light background | Section backgrounds, card backgrounds, body bg |
| `dark` | Dark background | TopBar, Footer, Hero overlay, dark sections |

**How to apply in `src/styles/global.css` (Tailwind v4):**

The AI must read the 4 values from `CONTENT.json` and write them into `global.css`:

```css
@import "tailwindcss";

@theme {
  --color-brand-primary: #1e40af;   /* from company_colors.primary */
  --color-brand-accent: #f59e0b;    /* from company_colors.accent */
  --color-brand-light: #f8f9fa;     /* from company_colors.light */
  --color-brand-dark: #111827;      /* from company_colors.dark */
}
```

**Usage in Tailwind classes:** `bg-brand-primary`, `text-brand-accent`, `border-brand-dark`, `bg-brand-light`

**Rules:**
- **Never hardcode hex values** in component HTML — always use `brand-*` tokens
- If `company_colors` is missing or incomplete in `CONTENT.json`, STOP and request the colors
- The AI copies the values once during setup — this is NOT a dynamic runtime operation

> **Note:** Tailwind v4 does NOT use `tailwind.config.mjs`. All configuration is CSS-based via `@theme`.

### Typography
- **Headings:** Bold, clear hierarchy — `h1` > `h2` > `h3`
- **Body:** `text-base` (16px), line-height `leading-relaxed`
- **Recommended fonts:** Montserrat (headings) + Open Sans or Inter (body)

### Spacing
- Section padding: `py-20` (desktop), `py-12` (mobile)
- Container max-width: `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`

### Buttons
```html
<!-- Primary -->
<button class="bg-brand-primary text-white font-semibold px-6 py-3 rounded-lg hover:bg-brand-primary/90 transition-colors">

<!-- Secondary / Outline -->
<button class="border-2 border-brand-primary text-brand-primary font-semibold px-6 py-3 rounded-lg hover:bg-brand-primary hover:text-white transition-colors">
```

---

## Responsive Breakpoints

| Breakpoint | Tailwind | Behavior |
|-----------|---------|---------|
| Mobile | `< 768px` | Single column, stacked layout |
| Tablet | `md: 768px` | 2-column grids where applicable |
| Desktop | `lg: 1024px` | Full layout as designed |
| Wide | `xl: 1280px` | Max-width container constraint |

---

## Accessibility Rules

- All images must have descriptive `alt` attributes
- Form fields must have `<label>` elements (use `sr-only` if visually hidden)
- Interactive elements must be keyboard navigable (`focus:ring` classes)
- Color contrast ratio: minimum 4.5:1 for normal text (WCAG AA)
- Landmark roles: `<header>`, `<nav>`, `<main>`, `<section>`, `<footer>`
- Skip-to-content link at the very top for screen readers

---

## Performance Rules

- Use Astro's `<Image />` component for ALL images (automatic WebP + lazy loading)
- Hero background image: use CSS `background-image` but preload it via `<link rel="preload">`
- No unused CSS — Tailwind purges automatically in production
- External scripts (e.g., Google Maps) loaded with `defer` or `loading="lazy"`
- Fonts: use `font-display: swap` to prevent FOIT

---

## SEO Rules

- `<title>` tag: "[Service] in [City] | [Company Name]"
- `<meta name="description">`: 150-160 chars, include primary keyword
- `<meta property="og:*">` tags for social sharing
- Structured data: `LocalBusiness` JSON-LD schema in `<head>`
- All section headings follow H1 → H2 → H3 hierarchy (only ONE H1 per page)
- Image file names: descriptive kebab-case (`interior-painting-service.jpg`)

**JSON-LD schema template:**
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "[COMPANY NAME]",
  "telephone": "[PHONE]",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "[ADDRESS]",
    "addressLocality": "[CITY]",
    "addressRegion": "[STATE]",
    "postalCode": "[ZIP]"
  },
  "url": "[WEBSITE URL]",
  "image": "[HERO IMAGE URL]"
}
</script>
```

---

## Form Handling

**Option A — Netlify Forms (recommended for static deploy):**
```html
<form name="lead-form" method="POST" data-netlify="true">
  <input type="hidden" name="form-name" value="lead-form" />
```

**Option B — Formspree:**
```html
<form action="https://formspree.io/f/YOUR_ID" method="POST">
```

**Option C — Custom API endpoint:**
- Create `src/pages/api/contact.ts` as an Astro API route
- Handle server-side validation and email sending (e.g., Nodemailer, Resend, SendGrid)

---

## Development Commands

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## Naming Conventions

- **Files:** PascalCase for components (`ServiceCard.astro`), kebab-case for pages/routes
- **CSS classes:** Tailwind utility-first — no custom class names unless necessary
- **Images:** `kebab-case-descriptive-name.jpg` stored in `src/assets/images/[section]/`
- **Component props:** camelCase, typed with TypeScript interfaces where possible
- **Section IDs:** lowercase, hyphen-separated: `id="about"`, `id="why-choose-us"`

---

## DO / DON'T

### ✅ DO
- Use Astro components for every repeated UI element
- Keep sections visually distinct (alternating `bg-white` / `bg-gray-50`)
- Test on real mobile device — not just browser DevTools
- Compress all images before adding to `/public`
- Validate forms on both client AND server side

### ❌ DON'T
- Don't use `<div>` for layout when semantic HTML exists (`<section>`, `<article>`, `<header>`)
- Don't hardcode colors inline — use Tailwind config tokens
- Don't import heavy JS frameworks (React/Vue) unless absolutely necessary — Astro Islands only when needed
- Don't skip `alt` attributes on images
- Don't use `!important` in styles — restructure Tailwind classes instead
- Don't put real API keys in frontend code — use environment variables (`import.meta.env`)
