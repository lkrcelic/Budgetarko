# Budgetarko — Implementation Plan

## Project Structure

```
budgetarko/
├── public/
│   ├── favicon.ico
│   └── manifest.json              # PWA manifest
│
├── src/
│   ├── main.tsx                    # Entry point, providers
│   ├── App.tsx                     # Router + layout switch (mobile vs desktop)
│   ├── vite-env.d.ts
│   │
│   ├── lib/
│   │   ├── supabase.ts            # Supabase client init
│   │   ├── utils.ts               # cn(), money formatting, date helpers
│   │   └── constants.ts           # MONTHS, default categories, entry kinds
│   │
│   ├── types/
│   │   └── index.ts               # Entry, Category, Profile, YearData, etc.
│   │
│   ├── stores/
│   │   └── app-store.ts           # Zustand: currentProfile, year, month, UI state
│   │
│   ├── hooks/
│   │   ├── use-entries.ts          # TanStack Query: CRUD entries
│   │   ├── use-categories.ts      # TanStack Query: CRUD categories
│   │   ├── use-profiles.ts        # TanStack Query: profiles list + switch
│   │   ├── use-auth.ts            # Supabase auth state + Google login
│   │   ├── use-year-data.ts       # Computed: buildYear, monthItems, installments
│   │   └── use-media.ts           # Mobile vs desktop breakpoint
│   │
│   ├── services/
│   │   ├── entries.ts             # Supabase queries: entries table
│   │   ├── categories.ts          # Supabase queries: categories table
│   │   └── profiles.ts            # Supabase queries: profiles table
│   │
│   ├── logic/
│   │   └── budget.ts              # Pure functions: expand(), buildYear(),
│   │                              # monthItems(), activeInstallments(),
│   │                              # previewSplit() — ported from data.jsx
│   │
│   ├── components/
│   │   ├── ui/                    # shadcn/ui (auto-generated)
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── popover.tsx
│   │   │   ├── select.tsx
│   │   │   ├── badge.tsx
│   │   │   └── ...
│   │   │
│   │   ├── shared/
│   │   │   ├── money.tsx           # <Money> formatted currency display
│   │   │   ├── avatar.tsx          # Profile avatar (initials + color)
│   │   │   ├── month-picker.tsx    # Month/year popover selector
│   │   │   ├── stepper.tsx         # +/- number input
│   │   │   ├── segmented.tsx       # Segmented control (monthly/yearly/once)
│   │   │   └── icon.tsx            # Wrapper around lucide-react icons
│   │   │
│   │   ├── layout/
│   │   │   ├── mobile-shell.tsx    # Mobile wrapper (bottom nav, header)
│   │   │   ├── desktop-shell.tsx   # Desktop wrapper (sidebar + main area)
│   │   │   ├── sidebar.tsx         # Desktop sidebar (nav, profile switch)
│   │   │   └── profile-switcher.tsx
│   │   │
│   │   └── entry/
│   │       ├── entry-form.tsx      # React Hook Form: shared add/edit form
│   │       ├── type-chooser.tsx    # Step 1: pick expense/income/card/subscription
│   │       ├── category-chips.tsx  # Category selection + inline "add new"
│   │       ├── amount-pad.tsx      # Mobile numeric keypad
│   │       ├── installment-fields.tsx  # Card-specific: count, start month, preview
│   │       ├── subscription-fields.tsx # Subscription-specific: frequency
│   │       └── entry-row.tsx       # Single entry in a list
│   │
│   ├── pages/
│   │   ├── auth/
│   │   │   └── login.tsx           # Google login screen
│   │   │
│   │   ├── mobile/
│   │   │   ├── home.tsx            # Balance card, add button, recent entries
│   │   │   └── add-entry.tsx       # Full-screen add flow (type -> form -> save)
│   │   │
│   │   └── desktop/
│   │       ├── monthly.tsx         # Monthly overview: net, categories, item lists
│   │       ├── annual.tsx          # Annual matrix table (replaces Excel)
│   │       ├── installments.tsx    # Active installment plans tracker
│   │       └── categories.tsx      # Manage categories (add, toggle active)
│   │
│   └── styles/
│       └── globals.css             # Tailwind directives + custom CSS vars
│
├── supabase/
│   └── migrations/
│       └── 001_initial.sql         # Tables: profiles, categories, entries
│
├── index.html
├── tailwind.config.ts
├── tsconfig.json
├── vite.config.ts
├── components.json                 # shadcn/ui config
├── package.json
├── CLAUDE.md
└── plan.md
```

---

## Database Schema (Supabase PostgreSQL)

### profiles
| Column     | Type      | Notes                           |
|------------|-----------|---------------------------------|
| id         | uuid PK   | default gen_random_uuid()       |
| user_id    | uuid FK   | -> auth.users, who owns this    |
| name       | text      | "Lovro", "Patricija"            |
| initials   | text      | "L", "P"                        |
| tint       | text      | hex color for avatar            |
| created_at | timestamptz |                               |

### categories
| Column     | Type      | Notes                           |
|------------|-----------|---------------------------------|
| id         | uuid PK   |                                 |
| user_id    | uuid FK   | -> auth.users                   |
| name       | text      | "Groceries", "Salary"           |
| type       | text      | 'income' or 'expense'           |
| active     | boolean   | default true                    |
| is_default | boolean   | seeded vs user-created          |

### entries
| Column       | Type      | Notes                              |
|--------------|-----------|------------------------------------|
| id           | uuid PK   |                                    |
| profile_id   | uuid FK   | -> profiles                        |
| kind         | text      | 'expense','income','card','subscription' |
| amount       | numeric   | total amount in EUR                |
| category     | text      | category name                      |
| description  | text      |                                    |
| year         | int       | entry year                         |
| month        | int       | entry month (1-12)                 |
| installments | int       | null for non-card, number for card |
| start_year   | int       | custom installment start year      |
| start_month  | int       | custom installment start month     |
| frequency    | text      | 'monthly','yearly','once' for subs |
| created_at   | timestamptz |                                  |
| updated_at   | timestamptz |                                  |

RLS: all tables filtered by `auth.uid() = user_id` (entries via profile join).

---

## Implementation Phases

### Phase 1 — Project Setup
1. `npm create vite@latest` with React + TypeScript
2. Install & configure: Tailwind CSS, shadcn/ui, lucide-react
3. Install: Zustand, TanStack Query, React Hook Form, Zod
4. Install: @supabase/supabase-js, vite-plugin-pwa
5. Set up folder structure (empty files)
6. Set up Supabase project + run initial migration
7. Configure env vars (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)

### Phase 2 — Core Logic + Types
1. Port `types/index.ts` from prototype data structures
2. Port `logic/budget.ts` — pure functions: expand(), buildYear(), monthItems(), activeInstallments(), previewSplit()
3. Set up `lib/constants.ts` (months, default categories)
4. Set up `lib/utils.ts` (cn, money formatting)
5. Set up Zustand store (currentProfile, year, month)

### Phase 3 — Auth + Profiles
1. Supabase Google OAuth setup
2. Login page
3. Auth hook + protected routes
4. Profile CRUD + switcher
5. Seed default categories on first login

### Phase 4 — Shared Components
1. shadcn/ui base components (button, input, dialog, popover, etc.)
2. `<Money>`, `<Avatar>`, `<MonthPicker>`, `<Stepper>`, `<Segmented>`
3. Layout shells: mobile-shell, desktop-shell, sidebar
4. use-media hook for responsive switching

### Phase 5 — Entry System (the core)
1. Entry form with React Hook Form + Zod validation
2. Type chooser (expense / income / card / subscription)
3. Category chips + inline "add new category"
4. Amount pad (mobile)
5. Installment fields + live split preview
6. Subscription fields (frequency selector)
7. Supabase CRUD (services/entries.ts + hooks/use-entries.ts)
8. Edit + delete entries

### Phase 6 — Pages
1. **Mobile home** — balance card, "Add entry" button, active installments mini, recent items
2. **Mobile add flow** — full-screen: type -> amount -> category -> details -> save
3. **Desktop monthly** — net surplus/deficit, expenses by category bars, income/expense lists
4. **Desktop annual matrix** — the big table replacing Excel, month columns, category rows, totals, cumulative
5. **Desktop installments** — active plans with progress tracks
6. **Desktop categories** — manage list, toggle active/inactive

### Phase 7 — Export + PWA
1. CSV/Excel export from annual matrix
2. PWA config (vite-plugin-pwa): manifest, service worker, offline caching
3. App icons + splash screens

### Phase 8 — Deploy
1. Vercel project setup
2. Environment variables on Vercel
3. Domain (optional)
4. Test production build

---

## Key Decisions

| Decision | Choice | Why |
|----------|--------|-----|
| Routing | React Router (2 layouts: mobile / desktop) | Simple, based on viewport width |
| Mobile detection | CSS media query + JS `useMediaQuery` hook | No separate builds, same app |
| Installment storage | Only store the parent entry; compute splits on the fly | Matches prototype logic, simpler DB |
| Category linking | By name (text), not FK | Simpler, matches prototype |
| Money formatting | Intl.NumberFormat EUR, same as prototype | Consistent |
| State split | Zustand for UI state, TanStack Query for server data | Clean separation |
| Forms | One shared `EntryForm` component, fields show/hide by kind | Avoid 4 separate forms |

---

## Notes
- Mobile-first: the phone flow is the primary use case (quick entry)
- Desktop is for review (monthly, annual matrix, installment tracking)
- The prototype in `app/` + `Budgetarko.html` is the design reference
- All business logic (installment splitting, year aggregation) lives in `logic/budget.ts` as pure functions — easy to test
