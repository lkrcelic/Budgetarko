# Budgetarko

Personal finance PWA — quick entry on phone, full review on desktop. Replaces an Excel budgeting workbook.

**Features:** expense / income / card-installment / subscription tracking · automatic installment splitting across months · monthly overview · annual matrix table · CSV export · Google login · multi-profile (Lovro / Patricija) · offline-ready PWA

---

## Tech stack

| Layer | Tools |
|---|---|
| Frontend | Vite 6, React 18, TypeScript |
| UI | Tailwind CSS v3, shadcn/ui, lucide-react |
| State | Zustand (UI) + TanStack Query (server data) |
| Forms | React Hook Form + Zod |
| Backend | Supabase (PostgreSQL, Auth, RLS) |
| Deploy | Vercel |
| PWA | vite-plugin-pwa + Workbox |

---

## Running locally

### 1. Prerequisites

- Node.js 18+ (project tested on v22.13.1 — use `nvm use 22` if needed)
- A [Supabase](https://supabase.com) project (free tier works fine)

### 2. Clone and install

```bash
git clone https://github.com/your-username/budgetarko.git
cd budgetarko
npm install
```

### 3. Set up environment variables

Copy the example file and fill in your Supabase credentials:

```bash
cp .env.example .env
```

Open `.env` and set:

```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Both values are in your Supabase dashboard under **Project Settings → API**.

### 4. Run the database migration

In your Supabase project, go to **SQL Editor** and run the contents of:

```
supabase/migrations/001_initial.sql
```

This creates the `profiles`, `categories`, and `entries` tables with RLS policies.

### 5. Enable Google OAuth

In your Supabase project:

1. Go to **Authentication → Providers → Google**
2. Enable Google provider
3. Create OAuth credentials in [Google Cloud Console](https://console.cloud.google.com):
   - Authorized JavaScript origins: `http://localhost:5173`
   - Authorized redirect URIs: `https://your-project-ref.supabase.co/auth/v1/callback`
4. Paste the **Client ID** and **Client Secret** into Supabase

### 6. Start the dev server

```bash
npm run dev
```

App runs at [http://localhost:5173](http://localhost:5173)

---

## Building for production

```bash
npm run build
```

Output goes to `dist/`. Preview it locally:

```bash
npm run preview
```

---

## Deploying to Vercel

### First deploy

1. Push the repo to GitHub
2. Go to [vercel.com](https://vercel.com) → **Add New Project** → import the repo
3. Framework preset: **Vite** (auto-detected)
4. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Click **Deploy**

### Update Google OAuth for production

After deploy, add your Vercel domain to Google Cloud Console:

- Authorized JavaScript origins: `https://your-app.vercel.app`
- Authorized redirect URIs: `https://your-project-ref.supabase.co/auth/v1/callback` *(already set)*

Also add the domain in Supabase under **Authentication → URL Configuration → Site URL**.

### Subsequent deploys

Every push to `main` auto-deploys via Vercel's GitHub integration.

---

## Regenerating app icons

If you change the icon design in `scripts/generate-icons.cjs`:

```bash
npm run icons
```

This writes `pwa-64.png`, `pwa-192.png`, `pwa-512.png`, and `apple-touch-icon.png` to `public/` using only Node.js built-in modules (no extra packages needed).

---

## Project structure

```
src/
├── App.tsx                  # Auth guard, profile gate, mobile/desktop switch
├── pages/
│   ├── auth/login.tsx       # Google sign-in screen
│   ├── home/                # Mobile: balance card, add-entry flow
│   ├── monthly/             # Desktop: monthly overview
│   ├── annual/              # Desktop: 12-column matrix table + CSV export
│   ├── installments/        # Desktop: card payment plan tracker
│   └── categories/          # Desktop: manage categories
├── components/
│   ├── entry/               # EntryForm, AmountPad, CategoryChips, ...
│   ├── layout/              # MobileShell, DesktopShell, Sidebar
│   └── shared/              # Money, Avatar, MonthPicker, Stepper, ...
├── logic/budget.ts          # Pure functions: expand(), buildYear(), monthItems(), ...
├── hooks/                   # TanStack Query hooks + auth + media
├── services/                # Supabase queries (entries, categories, profiles)
├── stores/app-store.ts      # Zustand: current profile, year, month
└── lib/                     # Constants, money formatter, Zod schemas
supabase/
└── migrations/001_initial.sql
scripts/
└── generate-icons.cjs       # PWA icon generator (no extra packages)
```

---

## Key design decisions

- **Installment logic** — only the parent entry is stored in the DB; all monthly splits are computed on the fly in `logic/budget.ts`. Cross-year rollover is handled automatically.
- **Category linking** — categories are stored by name (text), not foreign key, matching the original Excel prototype.
- **Mobile vs desktop** — same app, layout switches at 1024px via `useIsDesktop()`. Mobile is optimised for quick entry; desktop is for reviewing data.
- **Offline** — Workbox pre-caches the full app shell. Fonts are cache-first (1-year TTL). Supabase API calls use network-first with a 24-hour fallback.
