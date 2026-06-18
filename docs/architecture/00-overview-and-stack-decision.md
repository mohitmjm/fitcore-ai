# FitCore AI — Architecture Overview & Stack Decision

> Status: **DRAFT FOR APPROVAL** · Owner: Engineering · Last updated: 2026-06-17
>
> This is document 0 of 13. It is the index for the pre-coding architecture set and
> records the single most important decision that must be made before any code is written.

---

## 1. The decision that blocks everything: re-platforming

The mandated stack conflicts with what is already built in this repository. This is not a
detail — it determines whether we extend the current app or rebuild its foundations.

| Concern | What exists today (in this repo) | What the new mandate requires |
|---|---|---|
| Auth | **Supabase Auth** (email/OTP, password reset) — `lib/auth.ts` | **Clerk only** (email, Google, GitHub, Apple) |
| Database | **Supabase Postgres** with 6 migrations, RLS, audit columns, soft delete | **MongoDB Atlas** (document model) |
| Data access | `@supabase/supabase-js`, RLS-enforced, `lib/db.ts` | Mongo driver / ODM, app-enforced authorization |
| Storage | Supabase Storage bucket `fitcore-uploads` | Vercel Blob or Cloudinary |
| AI | Google Gemini (`lib/ai.ts`) | OpenAI + Claude + Gemini (multi-provider) |
| Framework | Next.js **16.2.7** installed | Spec says Next.js **15** |
| Messaging | none | WhatsApp Business API (Meta) |

### What this means honestly

Adopting Clerk + MongoDB **retires the entire current backend**: Supabase Auth, all six SQL
migrations, the RLS security model, and the `lib/db.ts` / `lib/auth.ts` / `lib/supabase.ts`
layers. The React UI, AI prompt logic, and the rule-based AI fallback in `lib/ai.ts` are
**reusable**; the auth and data layers are **not**.

This is a hard-to-reverse, high-impact change. The architecture below is written **to the
mandated stack** because the instruction was explicit ("MANDATORY", "Clerk ONLY",
"MongoDB Atlas"). Before implementation begins I need an explicit "yes" on the items in
§4 so we don't half-migrate and end up with two auth systems.

### CTO recommendation (you can overrule)

- **Clerk:** Excellent DX, fastest path to Google/GitHub/Apple + the session features you
  listed (device management, multi-session, long-lived sessions). Cost grows with Monthly
  Active Users — fine to start, model the bill before 1M MAU. **Accept.**
- **MongoDB Atlas:** Workable, and great for the flexible documents (AI plans, WhatsApp
  message logs, social feed). The relational parts (subscriptions, payments, trainer↔client
  links, referrals) need disciplined modeling and transactions. **Accept, with the modeling
  rules in doc 02.**
- **Next.js version:** The repo has **16.2.7**, not 15. Recommend we **standardize on the
  installed 16.x** (newer App Router, Server Actions) rather than downgrade. Per repo rule
  in `AGENTS.md`, the implementer must read `node_modules/next/dist/docs/` before writing
  Next code, because this version has breaking changes vs. training data. **Decision needed.**
- **Storage:** **Cloudinary** if we want on-the-fly image transforms for meal/progress photos
  and AI image analysis pipelines; **Vercel Blob** if we want the simplest Vercel-native
  option. Recommend **Cloudinary** for the vision-heavy roadmap.

---

## 2. The 13 deliverables (this document set)

| # | Document | Covers your requested item |
|---|---|---|
| 00 | `00-overview-and-stack-decision.md` | This index + the re-platform decision |
| 01 | `01-prd.md` | Complete Product Requirements Document |
| 02 | `02-database-and-collections.md` | Database Schema **+** MongoDB Collections |
| 03 | `03-api-architecture.md` | API Architecture |
| 04 | `04-folder-structure.md` | Folder Structure |
| 05 | `05-clerk-auth.md` | Clerk Integration Architecture |
| 06 | `06-whatsapp-architecture.md` | WhatsApp Architecture |
| 07 | `07-mobile-architecture.md` | Mobile App Architecture |
| 08 | `08-security.md` | Security Design |
| 09 | `09-subscriptions.md` | Subscription Architecture |
| 10 | `10-ui-wireframes.md` | UI Wireframes |
| 11 | `11-roadmap.md` | Feature Roadmap |
| 12 | `12-vercel-deployment.md` | Vercel Deployment Plan |

---

## 3. Target system at a glance

```
                          ┌─────────────────────────────────────────────┐
   Web (Next.js 16)  ─────┤                                             │
   React Native app  ─────┤   API LAYER  /api/v1/*  (versioned, REST)   │
   Flutter app       ─────┤   thin route handlers → call SERVICE LAYER  │
   WhatsApp (Meta)   ─────┤                                             │
                          └───────────────┬─────────────────────────────┘
                                          │
                          ┌───────────────▼─────────────────────────────┐
                          │  SERVICE LAYER (lib/services/*)              │
                          │  framework-agnostic business logic           │
                          │  workouts · nutrition · progress · ai ·      │
                          │  gamification · social · billing · whatsapp  │
                          └───┬───────────┬───────────┬─────────────┬────┘
                              │           │           │             │
                       ┌──────▼───┐ ┌─────▼─────┐ ┌───▼─────┐ ┌─────▼──────┐
                       │ MongoDB  │ │  Clerk    │ │  AI     │ │ 3rd-party  │
                       │ Atlas    │ │  (auth)   │ │ OpenAI/ │ │ Razorpay/  │
                       │          │ │           │ │ Claude/ │ │ Stripe/    │
                       │          │ │           │ │ Gemini  │ │ Cloudinary │
                       └──────────┘ └───────────┘ └─────────┘ └────────────┘
                                          │
                                   ┌──────▼──────┐
                                   │ Upstash     │  rate limiting, caching,
                                   │ Redis       │  WhatsApp/session state
                                   └─────────────┘
```

The non-negotiable rule that makes mobile + WhatsApp possible: **route handlers and Server
Actions contain no business logic.** They authenticate, validate, and delegate to the
service layer. Web, mobile, and WhatsApp all enter through the same services.

---

## 4. Approval gate — answer these before code

1. **Confirm re-platform:** Replace Supabase (auth + Postgres + storage) with Clerk +
   MongoDB Atlas + Cloudinary? (yes/no)
2. **Next.js version:** Standardize on installed **16.x** (recommended) or downgrade to 15?
3. **Storage:** Cloudinary (recommended) or Vercel Blob?
4. **AI default provider:** Which model is primary for text (cost vs. quality)? Vision for
   meal analysis — OpenAI `gpt-4o`-class or Gemini?
5. **Region/data residency:** Primary user base India (affects Atlas region, Razorpay-first,
   WhatsApp templates language). Confirm.
6. **Legacy data:** Is there real user data in Supabase to migrate, or is `data/users.json`
   + Supabase a dev sandbox we can drop?
7. **Build order:** Roadmap doc 11 proposes Phase 0 = auth/data foundation. Approve, or
   reprioritize (e.g. WhatsApp-first)?

Once these are answered, implementation starts at Phase 0 in doc 11. Nothing destructive
(removing Supabase files, dropping data) happens until item 1 and item 6 are confirmed.
