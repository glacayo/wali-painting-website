# Wali Painting & Handyman — Website

One-page lead generation website for Wali Painting & Handyman, based in Delaware.

## Tech Stack

- [Astro](https://astro.build/) v6
- [Tailwind CSS](https://tailwindcss.com/) v4
- Netlify Forms (contact & lead forms)

## Getting Started

```bash
npm install
npm run dev
```

## Content

All website copy and company data is managed from a single file:

```
src/CONTENT.json
```

Edit that file to update company info, services, colors, and text.

## Images

Raw client photos go in `COMPANY-PHOTOS/`. Run the processing script to crop and resize them:

```bash
node scripts/process-images.mjs
```

Processed images land in `src/assets/images/` and are optimized automatically by Astro at build time.

## Deploy

The site is configured for Netlify. Push to `main` to trigger a deploy.
