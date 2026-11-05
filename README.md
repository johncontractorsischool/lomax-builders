# Lomax Builders

A responsive, front-end-only Next.js website using the supplied house rendering.

## Local development

Requires Node.js 20.9 or newer.

```sh
npm install
npm run dev
```

Open http://localhost:3000.

## Checks and production build

```sh
npm run typecheck
npm run build
```

The production site is exported to `out/` for static hosting. The form includes native validation and a demo confirmation. It does not transmit or store submissions. Google Fonts are optional, with system font fallbacks.

## Vercel deployment

Import this repository with the repository root as the Root Directory (leave it blank). The tracked `vercel.json` sets the Next.js framework, installs dependencies with `npm ci`, builds with `npm run build`, and serves the static `out/` directory.

Deploy the `main` branch. If a previous deployment returned Vercel's `NOT_FOUND` page, deploy the latest commit so the configuration takes effect. Confirm the production domain is assigned to that deployment.
