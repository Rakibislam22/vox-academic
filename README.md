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

## CI/CD Pipeline

This repository now includes a GitHub Actions workflow at [.github/workflows/ci-cd.yml](.github/workflows/ci-cd.yml) that does two things:

1. On every pull request and push to `develop` or `main`, it installs dependencies, runs `npm run lint`, and runs `npm run build`.
2. On pushes to `main`, it also deploys the app to Vercel after the checks pass.

To enable the deployment job, add these GitHub repository secrets:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

How it works:

- `actions/checkout` pulls your code into the runner.
- `actions/setup-node` installs Node.js 20 and enables npm caching.
- `npm ci` installs exactly what is locked in `package-lock.json`.
- `npm run lint` and `npm run build` act as the quality gate.
- The deploy job uses the Vercel CLI to pull project settings, build a production artifact, and publish that prebuilt output.

Enforcing checks with Branch Protection

To require this CI before merges, add a branch protection rule for your `main` branch in the GitHub repository settings and require the status check named `ci/verify` (this is the check run created by the workflow). After adding that requirement, pull requests cannot be merged until the workflow completes successfully.
