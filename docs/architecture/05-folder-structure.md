# FitCore AI — Folder Structure

> Document 05 · Status: DRAFT. Governed by the vision doc. API-first, service-layer-centric.

```
fitcore-ai/
├─ app/
│  ├─ (marketing)/            # public, SEO: landing, pricing, blog, testimonials
│  ├─ (auth)/                 # Clerk sign-in / sign-up / sso-callback
│  ├─ (app)/                  # authenticated USER surface
│  │  ├─ today/               # the home (PRD B1)
│  │  ├─ coach/               # AI coach chat + "what your coach remembers"
│  │  ├─ plan/  log/  progress/  timeline/  story/  family/  settings/
│  ├─ (trainer)/              # trainer dashboard (clients, plan builder, schedule)
│  ├─ (admin)/                # admin panel (RBAC-gated)
│  ├─ api/
│  │  ├─ v1/                  # versioned REST (mobile/3rd-party contract)
│  │  │  ├─ meals/ workouts/ progress/ today/ coach/ plans/ timeline/
│  │  │  ├─ subscriptions/ trainers/ families/ sync/
│  │  └─ webhooks/            # clerk/ razorpay/ stripe/ whatsapp/
│  ├─ layout.tsx  globals.css
├─ lib/
│  ├─ core/                   # context, errors, http helpers, result types
│  ├─ db/                     # mongo.ts (cached client), repositories base
│  ├─ services/               # ← ALL business logic (framework-agnostic)
│  │  ├─ memory/ today/ workout/ nutrition/ progress/ coach/ comeback/
│  │  ├─ gamification/ story/ social/ marketplace/ billing/ notification/
│  │  ├─ whatsapp/ family/ analytics/
│  ├─ ai/                     # provider router (openai/claude/gemini) + fallback
│  ├─ integrations/           # adapters: payments, storage, messaging, push, email
│  ├─ policy/                 # deterministic decision fns (Today, mode, comeback)
│  ├─ validation/             # shared Zod schemas
│  └─ auth/                   # Clerk helpers, role guards
├─ components/
│  ├─ ui/                     # shadcn primitives
│  ├─ today/ charts/ forms/ coach/ story/ layout/   # feature components
├─ jobs/                      # cron entrypoints (reflection, today, story, nudges)
├─ docs/architecture/         # this doc set
├─ public/   middleware.ts   vercel.json   .env.example
```

Rules: route handlers & Server Actions live in `app/`, stay thin, and call `lib/services/*`.
No collection access outside `lib/db` repos. No `window`/`document` in `lib/services` (mobile
reuse). Existing UI in `app/` is migrated incrementally; `lib/supabase.ts`/`db.ts`/`auth.ts`
are retired on re-platform approval.
