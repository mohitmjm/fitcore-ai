# FitCore AI — WhatsApp Architecture

> Document 06 of the architecture set · Status: DRAFT FOR APPROVAL
> Governed by `vision-and-north-star.md` (§5.3 is a core bet). WhatsApp is a **first-class
> product surface**, not a notification channel.

---

## 1. Strategy

**One ecosystem, two doors.** The app is the rich, weekly home; WhatsApp is the effortless
daily habit. Both enter the **same service layer** (doc 04) and the **same Coach Memory**
(doc 02), so a meal logged by photo in the app and "maine 2 roti aur dal khayi" on WhatsApp
are the same operation.

**Design for "off by default, on when credentials arrive."** Until Meta WhatsApp Business
API (WABA) credentials are provided, WhatsApp ships behind a feature flag with a stub
`MessagingProvider`. When credentials arrive we flip the flag and swap the adapter — **no core
architecture change** (vision §5.3). This is an explicit requirement and it's satisfied by the
adapter pattern in doc 04 §6.

---

## 2. Architecture

```
                Meta WhatsApp Cloud API
                   ▲                │ (inbound webhook)
       (outbound)  │                ▼
┌──────────────────┴────────────────────────────────────────────┐
│  WhatsApp Service Layer  (lib/services/whatsapp/*)              │
│                                                                 │
│  INBOUND:  webhook → verify sig → ack fast → enqueue            │
│            → normalize(msg) → resolve identity (phone→user)     │
│            → INTENT ROUTER (rules + LLM, Hinglish-aware)        │
│            → call domain service (nutrition/workout/coach/...)  │
│            → compose reply → send                               │
│                                                                 │
│  OUTBOUND: template (proactive) | session reply (<24h)          │
│            interactive buttons/lists for 1-tap actions          │
└───────────────┬───────────────────────────────┬───────────────┘
                ▼                                 ▼
        Domain services                   Coach Memory (signals)
        (same as app/mobile)              one brain, many doors
```

Inbound is **acknowledged immediately** (Meta requires a fast 200) and processed
asynchronously via a queue so heavy work (AI vision, STT) never blocks the webhook.

---

## 3. Inbound pipeline

### 3.1 Webhook endpoint
- `GET /api/webhooks/whatsapp` — Meta verification challenge (`hub.verify_token`).
- `POST /api/webhooks/whatsapp` — message events. **Verify the `X-Hub-Signature-256`** HMAC
  against the app secret before trusting the body (treat all inbound as untrusted — doc 08).
- **Dedupe** on Meta `message.id` (idempotent; Meta may retry). Store + check in `wa_messages`.
- Ack 200 → enqueue for processing.

### 3.2 Message normalization
A normalizer converts every Meta message type into one internal shape:
```ts
interface InboundMessage {
  waMessageId: string; phoneE164: string;
  kind: 'text'|'audio'|'image'|'interactive'|'location';
  text?: string;                 // text body or interactive reply id/title
  mediaId?: string;              // for audio/image (downloaded lazily)
  timestamp: Date;
}
```

### 3.3 Identity resolution & opt-in
- Look up `wa_contacts` by `phoneE164` → `clerkUserId`.
- **Linking:** user adds/verifies their phone in the app (Clerk phone number) or starts via a
  click-to-chat link carrying a short-lived link token; first contact confirms opt-in.
- **No opt-in → no proactive messages.** Unknown numbers get a friendly link-your-account flow.
- Build `AuthContext` with `source: 'whatsapp'` (doc 04 §2.2).

### 3.4 Intent router (the NLU core)
Hybrid for accuracy + cost:
1. **Fast rules** for high-frequency, unambiguous patterns (numbers, keywords, units):
   `^\d+ ?kg` → weight; "glass/litre/paani" → water; button payloads → exact action.
2. **LLM intent classification** (cheap model, strict JSON) for everything else, **Hinglish /
   code-mixed aware**, with the Coach Brief for context.
3. Output: `{ intent, entities, confidence }` → mapped to a domain service call.

Confidence handling: high → act + confirm in the reply; medium → act + easy undo; low →
ask one short clarifying question. Never silently guess on health data.

### 3.5 Voice notes (§A5 / vision §5.13)
`audio` → download media → **STT** (multilingual + code-mixed, Hindi/English/Hinglish) →
feed transcript to the intent router. Same path as text thereafter. "Aaj sirf 20 minute hai"
→ `today.shorten`.

### 3.6 Meal photos (§A2 / B4)
`image` → download → Cloudinary → `nutrition` meal-vision pipeline → macros + swap → log →
reply with the result and a one-tap "fix portion" button.

---

## 4. Outbound messaging

### 4.1 The 24-hour window (the rule everything bends around)
Meta allows free-form replies only within **24h of the user's last message** (the customer
service window). Outside it, you may only send **pre-approved template messages**.

Strategy:
- **Proactive** (morning Today, weekly Story, reminders, comeback re-engage) → **templates**
  designed to pull the user into a session ("Reply 1 to start").
- Once the user replies, the **24h session opens** → rich, conversational coaching.
- This is why proactive copy is template-shaped and reactive copy is free.

### 4.2 Template registry
`wa_templates` stores each approved template: name, language(s) (en/hi/hinglish), category
(UTILITY/MARKETING), variables, and approval status. Daily coaching/reminders are UTILITY;
promotional sends are MARKETING (and respect marketing opt-in separately).

### 4.3 Interactive messages
Use quick-reply **buttons** and **lists** to make actions one tap: "Start workout · Move ·
Skip", "Log water: 250ml · 500ml · 1L". Reduces typing (friction) and improves intent accuracy.

---

## 5. Feature parity matrix (every app feature ↔ WhatsApp)

| Capability | WhatsApp interaction |
|---|---|
| Daily check-in | Template "How's energy/time today?" → buttons → adapts Today |
| Workout logging | "done chest" / voice / "Start workout" button → `workout.log` |
| Meal logging | Photo, or "2 roti dal" text/voice → `nutrition.logMeal` |
| Water | "1 litre" / quick-reply buttons → `water.add` |
| Sleep | "slept 6h" → `sleep.log` |
| Weight / check-in | "78" / "weight 78kg" → `progress.logWeight` |
| AI coach Q&A | Free text/voice within 24h window → `coach.ask` (full memory) |
| Diet plan | "diet plan" → summary + deep link to rich view |
| Grocery list | "grocery list" → itemized list message |
| Workout plan | "today" / "plan" → today's session |
| Progress report | Weekly **Story** image (template-initiated) |
| Challenges | Join/track via buttons; family/group challenges |
| Habit tracking | "meditated" / reminders → `habit.log` |
| Trainer messaging | Routed to trainer (hybrid model §5.15) within policy |
| Appointment reminders | Template reminders for bookings |
| Exam Mode | "exams next week" → mode switch + protected streak |

If a capability can't be expressed in chat, it stays in-app by design (deep galleries,
detailed charts) — see vision §5.3 ("WhatsApp-complete for the daily loop").

---

## 6. Conversation state

- **Mostly stateless:** Coach Memory holds the durable context, so we don't keep big chat
  state. Each message is interpreted with the Coach Brief.
- **Short-lived flow state** (Redis, TTL minutes) only for genuine multi-step flows: phone
  linking, correcting a meal estimate, conversational onboarding. Keyed by `phoneE164`.

---

## 7. MongoDB collections (cross-ref doc 03 §5.12)

- **`wa_contacts`** — `{ clerkUserId, phoneE164 (unique), optInAt, optOutAt, marketingOptIn,
  lastInboundAt, lastSessionAt, qualityState }`.
- **`wa_messages`** — append-only in/out log: `{ waMessageId (unique), phoneE164, direction,
  kind, payloadRef, intent?, status, createdAt }`. TTL/archive for old rows. Used for dedupe,
  audit, and analytics.
- **`wa_templates`** — approved template registry (name, lang, category, variables, status).

All WhatsApp writes also emit normal **memory signals** so the coach learns from chat behavior
(preferred channel, response times → nudge timing).

---

## 8. Compliance, safety, deliverability

- **Opt-in required** before any proactive message; **STOP/"band karo"** → set `optOutAt`,
  cease sends. Honor instantly.
- **Template pre-approval** for all proactive content; respect UTILITY vs MARKETING + separate
  marketing consent.
- **Signature verification** on every webhook; inbound is untrusted input (doc 08).
- **Rate limits & quality rating:** Meta throttles by phone-number quality tier; we monitor
  `qualityState`, cap frequency (respect quiet hours), and keep content useful to protect the
  number's rating.
- **Privacy:** phone numbers are PII; store E.164, reference by key, never log message bodies
  with secrets; health content handled per DPDP/GDPR (doc 02 §9).
- **Health humility & ED safety** (vision §8) apply identically on WhatsApp.

---

## 9. Scale

- Webhook acks fast, processes via queue (QStash/SQS) → absorbs bursts.
- Idempotent on `waMessageId`.
- Supports multiple WABA phone numbers / number pool for volume and per-region routing.
- Outbound sends are queued + rate-shaped per number tier.

---

## 10. "Turn it on" checklist (when you provide Meta credentials)

1. Meta Business verification + WABA + a registered phone number.
2. Secrets: `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_BUSINESS_ACCOUNT_ID`,
   `WHATSAPP_WEBHOOK_VERIFY_TOKEN`, `WHATSAPP_APP_SECRET`.
3. Submit + get approval for the initial template set (daily Today, weekly Story, reminders,
   comeback, exam-mode) in en/hi/hinglish.
4. Point Meta webhook → `/api/webhooks/whatsapp`; subscribe to message events.
5. Flip `FEATURE_WHATSAPP=on`. The stub adapter is replaced by the live Meta adapter; **no
   service or schema changes** — that's the whole point of the design.
