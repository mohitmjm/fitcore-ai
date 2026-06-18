# FitCore AI — Feature Roadmap

> Document 12 · Status: DRAFT. Sequenced by the North Star (consistency). Phase 0 blocks all.

| Phase | Theme | Ships | Exit criteria |
|---|---|---|---|
| **0** | Foundation | Clerk auth + middleware, MongoDB + repos (owner-scoped), service layer, AI router + fallback, Coach Memory shell, RBAC, Clerk↔Mongo webhooks, (data migration if any) | A logged-in user has a synced profile; one feature works end-to-end through a service |
| **1** | Core loop | Onboarding, **Today**, Living Plan (adaptive), photo/voice/text logging, Coach chat **with memory** | A user can onboard → get a plan → log → be coached, all memory-aware |
| **2** | Retention | Comeback system, life-aware streaks, Weekly Story, smart nudges, **Exam Mode** | D7/D30 + comeback rate measurable and moving |
| **3** | Nutrition depth | Food DB (Indian), macro/water tracking, **AI meal image analysis**, grocery lists | Meal logging < 10s; estimates correctable |
| **4** | WhatsApp surface | Inbound router, voice/photo, daily/weekly templates, feature parity (doc 06) | Full daily loop usable in chat once Meta creds live |
| **5** | Monetization | Subscriptions (Razorpay+Stripe), gating, coupons, referrals | Free→paid conversion live + reliable webhooks |
| **6** | Marketplace | Trainer **+ AI hybrid**, profiles/verification, booking, **Family Mode** | Trainer can manage clients; AI flags at-risk clients |
| **7** | Engagement | Light community (pods/recognition), challenges, gamification (supporting), **Health Timeline** | Engagement aids consistency (not just time-in-app) |
| **8** | Growth | Affiliate, waitlist, SEO blog/CMS, testimonials, email campaigns, retention analytics | Acquisition + retention loops instrumented |
| **9** | Mobile apps | React Native/Expo over `/api/v1`, push (FCM/APNs), offline sync | Parity for daily loop on device |
| **10** | Scale & wearables | Google Fit/Fitbit/Garmin, sharding, caching, load/observability hardening | Sustained perf at target load |

Cross-cutting from Phase 0: security (doc 09), accessibility, i18n (English/Hinglish),
ethical guardrails (vision §8). Each phase is shippable and verifiable, never stubs.
