# My AWS Dashboards

> A browser-based AWS cost and billing monitor with interactive charts, service breakdowns, and exportable reports — built as part of [vibe.j2team.org](https://vibe.j2team.org).

![My AWS Dashboards](https://vibe.j2team.org/my-aws-dashboard)

## Overview

**My AWS Dashboards** is a self-contained, client-side tool for visualizing AWS account costs and billing data. It ships with a full-featured demo mode using realistic simulated data so you can explore the dashboard immediately — no AWS account required.

When connected to a real AWS account, the app authenticates through **Amazon Cognito Identity Pools**, which issues short-lived STS credentials. No long-lived IAM access keys are ever entered or stored.

> [!IMPORTANT]
> AWS Cost Explorer does not support CORS for direct browser requests. When connected via Cognito, the app will attempt a live connection and gracefully fall back to demo mode if CORS blocks the request. See [Real AWS Data](#real-aws-data) for workarounds.

## Features

- **Cost Explorer Dashboard** — visualize spending across all AWS services in a selected date range
- **4 Chart Types** — grouped bar, stacked bar, line chart, and donut chart
- **Date Range Filter** — pick any custom date range with daily or monthly granularity
- **Service Filter** — show or hide individual AWS services from the chart
- **Summary Cards** — total cost, top service, average per period, cost trend vs. previous period
- **Sortable Breakdown Table** — sort services by name, cost, or percentage share
- **Export Reports** — download the current dashboard data as **CSV** or **XLSX**
- **Demo Mode** — instantly explore with 6 months of realistic simulated AWS data
- **Cognito Authentication** — zero long-lived keys; temporary STS credentials only
- **5-Minute Auto-Logout** — session expires automatically; countdown shown in the header

## Authentication

### Security Model

The app follows AWS best practices for browser-based credential management:

| Old approach (removed) | New approach |
|---|---|
| Long-lived IAM Access Key + Secret stored in `localStorage` | Temporary STS credentials from Cognito — **in memory only** |
| Credentials persist indefinitely across sessions | Session expires after **5 minutes**, then auto-logout |
| Secret key visible in browser storage | No secrets ever touch storage |

### How It Works

1. User provides their **Cognito Identity Pool ID** (a non-secret public identifier).
2. The app calls the **Cognito Identity API** (`GetId` → `GetCredentialsForIdentity`) to obtain temporary STS credentials.
3. Credentials are held **in memory only** — never written to `localStorage`, `sessionStorage`, or any cache.
4. A **5-minute countdown timer** is displayed in the header. When it reaches zero the session is cleared and the user is logged out automatically.
5. On the next visit (or page refresh), the Identity Pool ID is pre-filled; one click reconnects and issues fresh credentials.

### Setting Up a Cognito Identity Pool

1. Open **AWS Console → Cognito → Identity Pools** and click *Create identity pool*.
2. Enable **Guest access (unauthenticated identities)**.
3. On the IAM role step, attach a role with the minimum policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["ce:GetCostAndUsage"],
      "Resource": "*"
    }
  ]
}
```

4. Copy the **Identity Pool ID** (format: `us-east-1:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`).
5. Paste it into the app and click **Connect via Cognito**.

> [!TIP]
> The Identity Pool ID is a public identifier — it is safe to save in localStorage (which the app does for reconnect UX). Only the temporary STS credentials are sensitive, and those are never persisted.

## Architecture

```
src/views/my-aws-dashboard/
├── index.vue                        # Page entry — orchestrates auth vs. dashboard state
├── meta.ts                          # Page metadata for the launcher
├── types.ts                         # Shared TypeScript interfaces (CognitoConfig, CognitoSession, …)
├── components/
│   ├── AwsAuth.vue                  # Cognito Identity Pool credential form
│   └── CostDashboard.vue            # Full dashboard with charts, table, and export
├── composables/
│   ├── useCognitoAuth.ts            # Cognito auth flow, session timer, and auto-logout
│   └── useAwsCost.ts                # Data fetching — real or demo fallback
└── utils/
    ├── cognitoClient.ts             # Cognito GetId + GetCredentialsForIdentity API calls
    ├── demoData.ts                  # Deterministic demo cost data generator
    ├── chartUtils.ts                # Chart.js config builders for each chart type
    ├── exportUtils.ts               # CSV and XLSX export logic
    └── sigv4.ts                     # AWS Signature Version 4 signing (Web Crypto API)
```

## Getting Started

This app is part of the vibe.j2team.org project. To run it locally:

```sh
pnpm install
pnpm dev
```

Visit `http://localhost:5173/my-aws-dashboard`.

### Demo Mode

On first visit the Cognito auth form is shown. Click **Try with Demo Data** to instantly load simulated data — no configuration needed. You can also click the **Demo** button in the page header at any time.

### Real AWS Data

To connect to your AWS account:

1. [Set up a Cognito Identity Pool](#setting-up-a-cognito-identity-pool) as described above.
2. Click **Connect AWS** in the page header (or use the auth form on first visit).
3. Enter the **Identity Pool ID** and **Region**, then click **Connect via Cognito**.

> [!WARNING]
> Due to CORS restrictions on the AWS Cost Explorer API endpoint (`ce.us-east-1.amazonaws.com`), direct browser requests are blocked. The app will show an error and revert to demo data.

**Workarounds for real data:**

- Use a browser extension that disables CORS (development only)
- Set up a local CORS proxy and point requests through it
- Run the equivalent AWS CLI command and paste the output:

```sh
aws ce get-cost-and-usage \
  --time-period Start=2025-11-01,End=2026-04-30 \
  --granularity MONTHLY \
  --group-by Type=DIMENSION,Key=SERVICE \
  --metrics BlendedCost
```

## Security

- **No long-lived keys** — the app never asks for or stores IAM Access Keys or Secret Access Keys.
- **In-memory credentials only** — STS credentials from Cognito are held in a Vue reactive ref; they disappear on page refresh or tab close.
- **5-minute session timeout** — auto-logout is enforced client-side via `setTimeout`; a countdown is visible in the header.
- **Public config only in storage** — `localStorage` holds only the non-secret Identity Pool ID for reconnect UX.
- **No third-party data transmission** — all API calls go directly to `*.amazonaws.com` and `cognito-identity.*.amazonaws.com`.
- **Static deployment** — the app runs as a static site on Cloudflare Workers with no backend.

## Tech Stack

| Library | Purpose |
|---------|---------|
| Vue 3 + TypeScript | UI framework |
| VueUse `useLocalStorage` | Non-secret config persistence (Identity Pool ID only) |
| VueUse `useScriptTag` | Lazy-load Chart.js and SheetJS from CDN |
| Amazon Cognito Identity | Federated identity and temporary STS credential issuance |
| [Chart.js 4](https://www.chartjs.org/) | Interactive charts (loaded from CDN) |
| [SheetJS (xlsx)](https://sheetjs.com/) | XLSX export (loaded from CDN on demand) |
| Tailwind CSS v4 | Styling via project design system |

## Author

Built by **J2TEAM** as part of [vibe.j2team.org](https://vibe.j2team.org).
