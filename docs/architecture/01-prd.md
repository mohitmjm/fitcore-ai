# FitCore AI — Product Requirements Document (PRD)

> Document 01 of 13 · Status: **FOR APPROVAL** · **Subordinate to `vision-and-north-star.md`.**
> This PRD is organized around the North Star (consistency), not around a feature list.
> Every capability below is justified by the job it does for consistency. If a requirement
> here conflicts with the vision doc, the vision doc wins.

---

## 1. North Star (restated)

The company optimizes **sustained consistency** — users staying in the game toward their
goal, week after week — measured as the share of activated users who hit their *own* weekly
commitment for 4+ consecutive weeks. Workouts logged, calories tracked, and screens viewed
are not goals. See vision doc §1 for the full definition and guardrail metrics.

**The product promise:** the user shows up; the app does everything else.

## 2. Personas & roles

| Role | Job-to-be-done | How we measure their success |
|---|---|---|
| **User** | Stay consistent and see results with minimal effort | Sustained consistency, comeback rate |
| **Trainer** | Run a coaching business; keep clients consistent | Client retention, GMV |
| **Nutritionist** | Keep clients adherent to nutrition | Client adherence |
| **Admin** | Keep the ecosystem healthy, safe, and growing | Platform retention, trust, revenue |

Default role on signup is **user**. Trainer/nutritionist require application + admin
verification (RBAC in doc 08). Multi-role identity is keyed to `clerkUserId`.

## 3. The core loop (what the whole product serves)

> Daily check-in → adapted **Today** → effortless photo/voice logging → a small win
> celebrated → a contextual nudge tomorrow → a shareable **Weekly Story** → a friend joins.

Every feature below maps to one of five **consistency jobs**:

- **A. Reduce friction** — make showing up + logging effortless.
- **B. Do the thinking** — adapt the plan and coach proactively.
- **C. Motivate & retain** — make returning feel good.
- **D. Comeback** — refuse to let users quit quietly.
- **E. Grow** — turn consistent users into new users.

---

## 4. Features by consistency job

### Job A — Reduce friction

**A1. Lightweight onboarding** *(one-time, editable)*
Collect the minimum to generate a first plan; infer the rest over time via Coach Memory.
Fields: personal (name, age/DOB, gender, height, weight); fitness (goal, activity level,
experience); nutrition (veg / vegan / non-veg / keto / high-protein); health (injuries,
conditions, allergies); equipment (gym / home gym / dumbbells / bands / bodyweight).
Stored permanently in MongoDB; **never re-asked** unless the user edits profile.
*Acceptance:* completing onboarding generates an initial Living Plan + first meal plan and
sets `onboardingCompletedAt`; re-login never re-triggers it. *WhatsApp:* onboarding can be
completed conversationally.

**A2. Photo/voice/text-first logging** *(the friction killer)*
Meal photo → AI vision → food + portion + macros (with confidence range) → one-tap correct →
coach note + healthier swap → logged. Also "2 rotis and dal" by text or voice note. Barcode
optional, never primary. Indian-cuisine fluency required. *WhatsApp:* identical pipeline in chat.

**A3. Invisible math**
Calories, macros, training volume, BMI, progressive overload are computed silently. The user
never does arithmetic. Numbers are available one tap deeper for those who want them.

**A4. Effortless workout + water + sleep logging**
"Done chest", "2 glasses", "slept 6h" — natural input in app or WhatsApp; parsed and stored.
Set/rep/weight capture stays optional and fast for users who want detail (Job B uses it).

**A5. Voice-first coach** *(vision §5.13)*
Full coach usable by voice in Hindi / English / Hinglish (code-mixed), in-app and via WhatsApp
voice notes. "Aaj sirf 20 minute hai" → shortens today; "Maine 2 roti aur dal khayi" → logs
the meal; "Aaj gym nahi ja paunga" → adapts + triggers comeback. *Acceptance:* a user can run
the entire daily loop hands-free by voice. Serves accessibility and low-literacy inclusion.

### Job B — Do the thinking

**B1. The Daily "Today" experience** *(home screen)*
One screen, one decision: today's primary action + a "Why this today?" explanation + 2–3
quick logs. Regenerated each morning from Coach Memory + check-in + context. States:
training / recovery / comeback / deload / travel / "ahead". Replaces the numbers dashboard
as the home. *WhatsApp:* delivered as a morning template with quick-reply actions.

**B2. The Living Plan (adaptive workouts + nutrition)**
Plans adapt weekly (macro-loop) and intra-week (micro-loop) from real signals — skips,
energy, performance, time, fatigue (mapping in vision §5.7). **There is no "behind."**
Covers gym / home / bodyweight; progressive overload and deloads automatic. Meal plans:
calories, macros, suggestions, grocery lists; Indian-cuisine aware; English/Hinglish.

**B3. AI Coach with Memory** *(not a chatbot)*
Persistent five-layer per-user model (vision §5.1), injected into every AI interaction;
proactive, continuous, tone-adaptive. Multi-provider (OpenAI/Claude/Gemini) routed per task
with a deterministic fallback (reuse `lib/ai.ts` logic). **"What your coach remembers"**
screen lets users view/edit memory. *WhatsApp:* full coach available in chat.

**B4. AI image analysis** — meal photo understanding powering A2 (shared pipeline, app + WhatsApp).

**B5. Weekly review (automated)** — produces the Weekly Story (C3) and next week's plan.

**B6. Progress understanding (not a chart dump)**
Weight, body fat, measurements, strength, photos tracked; surfaced as *humanized insight*
("trending to your goal in ~6 weeks"), not raw graphs. Detailed weekly/monthly/yearly charts
live one tap deeper for power users.

**B7. Exam / Life Mode** *(vision §5.11 — India student moat)*
Coach Memory detects life crunches (exams, placements, internship season, university
submissions; also travel, illness, work deadlines) from onboarding, added dates, or natural
language, and auto-switches the Living Plan: 10-min workouts, brain-food meals, sleep
protection, stress management, and automatic streak protection. Reframes success to
"protect the routine," then ramps back automatically. *Acceptance:* entering an exam date (or
saying "exams next week") visibly shifts today's plan and protects the streak.

### Job C — Motivate & retain

**C1. Emotional, adaptive coaching voice** — hype / calm / data / tough-love, learned per user;
warm, human, Hinglish-capable; never shaming (vision §5.8).

**C2. Meaningful micro-celebrations** — specific, earned moments (Framer Motion), not confetti spam.

**C3. Weekly Story / Wrapped** — beautiful, vertical, shareable recap: consistency, standout
moment, humanized trend, one focus for next week. Even tough weeks get a kind, forward-looking
story. *WhatsApp:* delivered as an image.

**C4. Smart, earned nudges** — timed to the user's real patterns, respecting quiet hours;
contextual ("you usually train around 7 — 20 minutes free?"). Never spam.

**C5. AI Health Timeline** *(vision §5.14)*
Progress told as a narrative story, not charts: "January you struggled with consistency;
February your sleep improved; March was your strongest month; weight trend improved after you
increased protein." Generated from Coach Memory (episodic + behavioral) + metrics; honest
about correlation vs. cause. Makes progress memorable and shareable; cross-refs B6.

### Job D — Comeback (anti-churn)

**D1. Comeback System** — replaces punitive streaks. Life-aware protection, warm re-entry with
a shrunken ask, celebration of the return, identity framing ("you keep coming back"). Comeback
Rate is a first-class metric. (Vision §5.6.)

**D2. Life-aware streaks** — streaks express momentum and identity, not a fragile chain;
sickness/travel/overload auto-protected. The Consistency Score stays mostly internal; users
see momentum, not a number to fear.

### Job E — Grow

**E1. Community (intentionally light)** — feed, posts, comments, likes, follows, fitness groups.
Scoped to pride and accountability, **not** an attention-maximizing social network. Demoted
from "core" to "supporting" until it provably aids consistency.

**E2. Challenges** — personalized + with-friends (via WhatsApp groups); reward XP/badges that
ladder to identity, not vanity.

**E3. Gamification (supporting actor)** — XP, levels, badges, leaderboards exist only where
they reinforce consistency/comeback/identity. Any casino-like mechanic is cut.

**E4. Natural viral loops** — shareable Weekly Story, transformation reels (opt-in), "gift a
week of Premium," buddy/pods, trainer marketplace as supply-side growth. No forced shares.

**E5. Trainer + AI Hybrid marketplace** *(vision §5.15)*
Discover trainers; profiles (bio, certifications, reviews, pricing); book sessions; buy
programs. The model is **hybrid, not trainer-only:** AI runs the daily layer (coaching,
logging, plans, nudges) while trainers handle expert intervention, plan reviews, and form
checks. **AI routes attention** — flagging lapsed/plateaued/at-risk clients so trainers
intervene at the right moment, improving client retention with fewer trainer-hours. Trainers
monetize the high-touch Pro tier and bring their clients into the ecosystem.

**E6. Family Mode** *(vision §5.12 — India retention + referral moat)*
Opt-in progress sharing with parent/spouse (granular — momentum vs. raw numbers),
accountability partner, family challenges + leaderboard, and gift-a-plan. Privacy-first.
Drives social accountability (retention) and organic family invites (acquisition); pairs with
the gifting viral loop (E4).

---

## 5. Platform requirements (support the loop)

**5.1 Subscriptions (monetization is downstream of love).** Free (basic), Premium (AI coach +
advanced analytics), Pro (trainer access + priority support). Razorpay (India-first) + Stripe
(global). Detail in doc 09.

**5.2 Notifications.** Unified preference center across **Email** (Resend), **Push** (web now;
FCM/APNs with mobile), **WhatsApp** (templates). Per-channel opt-in, quiet hours, categories.
All notifications serve the loop (nudges, celebrations, weekly story, comeback) — never spam.

**5.3 Admin panel.** User mgmt, trainer mgmt + verification, analytics, revenue tracking,
reports, support dashboard, content moderation, eating-disorder/safety review queue.

**5.4 Growth/startup features.** Referral, affiliate, coupons, waitlist, SEO blog/CMS,
testimonials, retention analytics, email campaigns. Each tied to consistency or acquisition.

**5.5 Cross-cutting.** API-first + shared business logic (mobile-ready, doc 07); RBAC, rate
limiting, input validation, CSRF, audit logs (doc 08); scale to 1M+ via indexing, pooling,
caching, CDN (docs 02 & 12); i18n (English + Hinglish min); accessibility (WCAG-minded;
full compliance needs manual assistive-tech testing).

---

## 6. Traceability — your original feature list → consistency job

Nothing requested is dropped; everything is reframed to serve the North Star.

| Original request | Where it lives now | Consistency job |
|---|---|---|
| Workout plans / tracking / PRs | B2, A4 | Do the thinking / reduce friction |
| Exercise database | B2 (powers Living Plan) | Do the thinking |
| Nutrition / calories / macros / water / grocery | A2, A3, B2 | Reduce friction / invisible math |
| AI meal suggestions + image analysis | B3, B4 | Do the thinking |
| Progress tracking + charts | B6 | Do the thinking (humanized) |
| AI coach / daily + weekly coaching | B1, B3, B5, C1 | Do the thinking / motivate |
| Community / feed / groups | E1 | Grow (light) |
| Gamification / XP / badges / challenges | E2, E3, D2 | Grow / comeback (supporting) |
| Streaks | D1, D2 | **Comeback (reframed from punishment)** |
| Trainer marketplace | E5 | Grow |
| WhatsApp everything | A2, A4, B1, B3, C3, D1 + doc 06 | All jobs (first-class surface) |
| Subscriptions / payments | 5.1, doc 09 | Monetization (downstream) |
| Admin panel | 5.3 | Platform health |
| Referral / affiliate / coupons / waitlist / blog / testimonials | 5.4, E4 | Grow |
| Security / RBAC / audit | 5.5, doc 08 | Trust (enables retention) |
| Mobile / 1M-scale | 5.5, docs 07 & 12 | Reach |
| Exam Mode (new) | B7 | Do the thinking (India moat) |
| Family Mode (new) | E6 | Grow + retention (India moat) |
| Voice-first coach (new) | A5 | Reduce friction |
| AI Health Timeline (new) | C5 | Motivate (progress as story) |
| Trainer + AI Hybrid (new) | E5 | Grow + business model |

## 7. Out of scope / non-goals

Native mobile apps this phase (architecture *enables* them); medical/clinical advice;
real-time video coaching; Apple HealthKit web sync (no web API — native phase); **a large
attention-maximizing social feed (confirmed cut — see vision §7)**; any engagement-maximizing
mechanic that raises time-in-app without raising sustained consistency.

## 8. Success metrics & release phases

Metrics per vision doc §9 (North Star, retention, comeback rate, activation, share/referral,
monetization; anti-metric = raw time-in-app). Phasing in doc 11 — Phase 0 (Clerk + MongoDB +
service layer + Coach Memory foundation + RBAC) precedes all feature work, because the
adaptive "feels alive" magic depends on it.

## 9. Ethical guardrails

Per vision doc §8: no dark patterns; eating-disorder & body-image safety; health humility
(ranges, not false precision); privacy/consent (visible-editable memory, DPDP/GDPR-minded);
honest AI. These are requirements, not aspirations.
