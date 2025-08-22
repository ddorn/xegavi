This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Deploy

Make targets are provided to build and deploy to a remote host (defaults assume `ssh pine` and `/srv/barrace`).

- Default dataset file is loaded from `/load.json` at runtime.
  - Place it at `web/barrace/public/load.json` locally.
  - Or copy it separately with `make put-load`.
  - An example is provided at `public/load.json.example`.

Common commands (run from `web/barrace/`):

```bash
# Install deps and build
make install
make build

# Prepare standalone dist/ and rsync to remote (HOST, DEST overridable)
make deploy HOST=pine DEST=/srv/barrace

# Copy env file to remote (expects .env-prod locally)
make put-env HOST=pine DEST=/srv/barrace

# Copy load.json to remote public/
make put-load HOST=pine DEST=/srv/barrace

# Install and enable systemd service on remote
make service-install HOST=pine APP=barrace

# Manage service
make restart HOST=pine APP=barrace
make status HOST=pine APP=barrace
make logs HOST=pine APP=barrace
```

Notes:
- Build output uses Next.js `output: "standalone"`; the service runs `node server.js` in the deployment root.
- Ensure Node.js is installed on the server (the service uses `/usr/bin/node`).
- To customize port/host, set `PORT` and `HOST` in `/srv/barrace/.env` (see `.env.example`).
