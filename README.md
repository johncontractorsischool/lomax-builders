# Lomax Builders

A responsive Next.js website using the supplied house rendering, with a server-side email handler for project inquiries.

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
npm test
npm run build
```

The production build is generated in `.next/`. Run it locally with `npm start`. The homepage is prerendered. Google Fonts are optional, with system font fallbacks.

## Form email configuration

Add these server-only variables in [Vercel environment settings](https://vercel.com/contractor-intelligence-school/lomax-builders/settings/environment-variables) for Production, then redeploy to apply them:

| Variable           | Value                                    |
| ------------------ | ---------------------------------------- |
| `SMTP_USER`        | `leo@contractorsischool.com`             |
| `SMTP_PASSWORD`    | The Google app password for that account |
| `CONTACT_TO_EMAIL` | `info@lomaxbuilders.com`                 |

For local development, copy `.env.example` to `.env.local` and fill in the password. Never commit `.env.local` or use a `NEXT_PUBLIC_` prefix for these values. Gmail SMTP uses TLS on port 465. Spaces in a copied app password are removed automatically.

`POST /api/contact` validates the fields and sends the full inquiry to the configured recipient. The visitor's email becomes Reply-To; the authenticated account is always the sender. Newsletter consent is included in the email but does not subscribe the visitor to a mailing platform. No database is used. Success means SMTP accepted the message, not that inbox delivery has been independently verified.

The handler limits body size, rejects cross-origin browser requests and a hidden honeypot field, and applies a best-effort per-instance IP throttle. The throttle is not shared across Vercel instances; configure Vercel Firewall rules if stronger abuse protection is needed. Tests mock SMTP and do not send real email.

## Vercel deployment

Import this repository with the repository root as the Root Directory (leave it blank). The tracked `vercel.json` sets the Next.js framework, installs dependencies with `npm ci`, builds with `npm run build`, and uses `.next/` as the Next.js build directory. Vercel handles routing and serving the generated assets.

Deploy the `main` branch. If a previous deployment returned Vercel's `NOT_FOUND` page, deploy the latest commit so the configuration takes effect. Confirm the production domain is assigned to that deployment.
