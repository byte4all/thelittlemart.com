[![Shopco Screenshot](https://github.com/mohammadoftadeh/repo-assets/blob/main/shopco-cover.png?raw=true)](https://next-ecommerce-shopco.vercel.app/)

# Shopco

Shopco is an open-source project that converts a Figma design of an e-commerce website into a fully responsive front-end application. It utilizes **Next.js 16 App Router**, **TypeScript**, **Tailwind CSS**, **Redux**, **Framer Motion**, and **ShadCN UI** to deliver a modern, scalable, and optimized solution based on industry standards.

## Table of Contents

- [Shopco](#shopco)
  - [Table of Contents](#table-of-contents)
  - [Overview](#overview)
  - [Demo](#demo)
  - [Features](#features)
  - [Technologies](#technologies)
  - [Installation](#installation)
  - [Usage](#usage)
  - [Project Structure](#project-structure)
  - [Contributing](#contributing)
  - [Issues](#issues)
  - [License](#license)
  - [Contact](#contact)

## Overview

Shopco bridges the gap between design and development by converting Figma designs into production-ready code. The project follows best practices for **SEO**, **performance optimization**, and **accessibility**, making it a perfect foundation for developers looking to create scalable and maintainable e-commerce front-ends.

## Forked Website Using This Website As Template

Check out the live demo: [Demo Coming March 2026](https:///)

## Features

- **Next.js 16**: Server-side rendering (SSR), Static Site Generation (SSG), optimized routing, and API integrations.
- **TypeScript**: Strongly typed code for better error detection and maintainability.
- **Tailwind CSS**: Utility-first CSS framework for rapid UI development.
- **Redux**: State management for managing the shopping cart and other global states.
- **Framer Motion**: Smooth animations and transitions for an enhanced user experience.
- **ShadCN UI**: Beautifully styled, accessible, and customizable UI components.
- **Fully Responsive**: Mobile-first design ensuring the layout adapts across devices.
- **Performance Optimized**: Best practices followed for fast loading and interaction.
- **Accessible**: Built with accessibility standards to provide an inclusive experience.

## Technologies

- **Next.js 16** - A popular React framework with built-in SSR and optimization.
- **TypeScript** - A superset of JavaScript for strong typing and code consistency.
- **Tailwind CSS** - A utility-first CSS framework for fast, responsive design.
- **Redux** - A state management library used for the shopping cart and global app state.
- **Framer Motion** - A library for animations and interactions in React.
- **ShadCN UI** - A collection of beautiful, accessible, and customizable UI components.
- **Figma** - The design tool used as the **original** source of the project’s layout. The [Figma file](https://www.figma.com/community/file/1273571982885059508/e-commerce-website-template-freebie) designed by [Hamza Naeem](https://www.figma.com/@hamzauix)

## Installation

To get started with Shopco locally, follow these steps:

1. **Clone the repository:**

   ```bash
   git clone https://github.com/byte4all/nextjs-ecommerce-platform.git
   cd nextjs-ecommerce-platform
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```
   **OR** 
   ```bash
   yarn install
   ```

3. **Run the development server:**

   ```bash
   npm run dev
   ```

   ```bash
   yarn dev
   ```

4. **Open in your browser:**
   Navigate to [https://localhost:3000](https://localhost:3000) to view the app (use HTTPS in dev for Neon Auth session cookies).

### Neon Auth (login)

Default login is **magic link** at `/auth/magic-link`. Users can switch to **password** or **email OTP** from buttons on that page. Register still uses `/auth/sign-up`.

In the [Neon Console](https://console.neon.tech) → your project → branch → **Auth**, enable:

- **Magic Link**
- **Email OTP** (required for the email-code fallback)
- **Google OAuth** (optional; matches `social.providers` in `AuthProvider`)
- **Trusted domains**: `https://localhost:3000` for local dev

Required `.env` variables: `DATABASE_URL`, `NEON_AUTH_BASE_URL`, `NEON_AUTH_COOKIE_SECRET`, `NEXT_PUBLIC_BASE_URL` (e.g. `https://localhost:3000`).


Signed-in Stack Auth users and users who place orders are automatically added to your Resend contact list so you can email them (newsletters, promos, etc.).

- Get an API key at [resend.com](https://resend.com) and create an audience/contacts if needed.
- Add to your `.env`:
  ```bash
  RESEND_API_KEY=re_xxxxxxxxx
  # Order emails (confirmation, tracking, pickup, payment failed)
  RESEND_TRANSACTIONAL_FROM=thelittlemart <noreply@yourdomain.com>
  # Optional: where replies go when using noreply@
  RESEND_TRANSACTIONAL_REPLY_TO=support@yourdomain.com
  # Marketing / newsletter sends from the app or Resend broadcasts
  RESEND_MARKETING_FROM=thelittlemart <hello@yourdomain.com>
  # Legacy fallback if the above are not set:
  # RESEND_FROM_EMAIL=thelittlemart <orders@yourdomain.com>
  ```
- If `RESEND_API_KEY` is not set, contact sync is skipped (no errors). Contacts are added on **auth sync** (login/signup) and when a **logged-in user places an order**.
- Verify your domain in Resend. Both `noreply@` and `hello@` work on the same verified domain with one API key.

## Order notification emails

Transactional emails (via Resend):

| Event | When |
|-------|------|
| Order confirmation | After successful Billplz payment |
| Payment failed | When an unpaid bill becomes overdue |
| Shipping / tracking | Admin clicks **Send tracking email** on an order |
| Pickup reminder | Admin sends manually, or automatic via cron |

**Admin notifications center:** open **Notifications** in the admin nav (`/admin/notifications`) to see email status per order (confirmation, payment failed, tracking, pickup reminder), filter by missing sends or failures, and **resend** any type manually. Each send is recorded in the `order_notifications` audit log. Per-order history is also on **Orders** → order detail → **Notification history**.

**Shipping tracking:** **Orders** → order → enter tracking number + courier URL → **Send tracking email** (or resend from Notifications).

Required for emails:

- `RESEND_API_KEY`
- `RESEND_TRANSACTIONAL_FROM` (order notifications; e.g. `noreply@yourdomain.com`)
- Optional: `RESEND_TRANSACTIONAL_REPLY_TO`, `RESEND_MARKETING_FROM` (marketing sends)
- Legacy fallback: `RESEND_FROM_EMAIL`

**Pickup reminders (automatic):** Vercel Cron runs hourly (`vercel.json` → `/api/cron/pickup-reminders`). Set in Vercel env:

- `CRON_SECRET` — random string; cron requests must send `Authorization: Bearer <CRON_SECRET>`

On non-Vercel hosts, call the same URL on a schedule (e.g. [cron-job.org](https://cron-job.org)) with that header.

## Usage

- To explore or modify the code, navigate through the `components`, `features`, and `app` directories.
- The shopping cart logic is managed using **Redux**. You can find the store configuration and cart actions in the `src/lib/features` directory.
- **ShadCN UI** components are used across the app. They can be customized in the `src/components/ui` directory.
- You can easily modify and extend the project to suit your needs, whether for personal use or professional projects.

## Billplz payments (Production)

This project supports Billplz checkout (bill creation + redirect), webhook callbacks, and a fallback sync on the success page.

Required environment variables:

- `BILLPLZ_API_SECRET_KEY`: Billplz API key (live in production)
- `BILLPLZ_COLLECTION_ID`: Billplz collection ID (live in production)
- `BILLPLZ_USE_SANDBOX`: set to `"false"` in production to force live; set to `"true"` to force sandbox
- `BILLPLZ_CALLBACK_BASE_URL`: public base URL for callbacks/redirects (e.g. `https://www.thelittlemart.com`)
- `BILLPLZ_X_SIGNATURE_KEY` (recommended): set if you enable Billplz X-Signature callbacks

## Project Structure

```bash
Shopco/
│
├── public/                # Static assets
├── src/
│   ├── app/               # Next.js App Router
│   ├── components/        # Reusable components (including ShadCN UI components)
│   └── lib/
│       ├── features/      # The Redux logics for features (e.g., shopping cart)
│       ├── hooks/         # Custom React hooks
│       ├── store.ts       # Redux store
│       ├── utils.ts       # Utility functions
│   ├── styles/            # Tailwind CSS styles (global, utilities and fonts)
│   ├── types/             # TypeScript types
│
├── components.json         # ShadCN UI configuration
├── next.config.mjs         # Next.js configuration
├── package.json            # Node.js dependencies and scripts
├── postcss.config.mjs      # Post CSS configuration
└── README.md               # Project documentation
├── tailwind.config.js      # Tailwind CSS configuration
├── tsconfig.json           # TypeScript configuration
```

## Contributing

Contributions are welcome! If you'd like to contribute, Please follow these steps to contribute to Shopco:

1. Fork the repository.
2. Create a new branch (`git checkout -b feature/your-feature-name`).
3. Make your changes.
4. Push to the branch (`git push origin feature/your-feature-name`).
5. Open a pull request.

## Issues

Feel free to submit issues for any bugs, feature requests, or general questions related to the project.

## License

This project is licensed under the MIT License - see the [LICENSE](https://opensource.org/licenses/MIT) file for details.


## Current Repo Maintainer

- **Name**: BYTE4ALL
- **Email**: [hi@byte4all.com@byte4all.com](mailto:hi@byte4all.com)
- **GitHub**: [https://github.com/byte4all](https://github.com/byte4all)

## Original Creator Contact

Feel free to reach out to:

- **Name**: Mohammad Oftadeh
- **Email**: [mr.mohammadoftadeh@gmail.com](mailto:mr.mohammadoftadeh@gmail.com)
- **GitHub**: [https://github.com/mohammadoftadeh](https://github.com/mohammadoftadeh)
