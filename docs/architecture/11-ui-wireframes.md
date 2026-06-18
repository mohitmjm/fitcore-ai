# FitCore AI — UI Wireframes (low-fi)

> Document 11 · Status: DRAFT. Mobile-first. Tailwind + shadcn/ui + Framer Motion. Dark/light.
> The home is **Today** (one decision), not a dashboard (vision §5.2).

## Today (home)
```
┌──────────────────────────────┐
│ Good morning, Aman 🔥         │
│ "Back after the trip—ease in" │
│                              │
│ ┌──────────────────────────┐ │
│ │ TODAY · Upper body · 35m │ │   ← the one primary action
│ │ [ Start ]  [Why this?]   │ │
│ └──────────────────────────┘ │
│ Quick log: 🍽️ 💧 ⚖️ 🎤(voice) │   ← 2–3 taps max
│ Momentum: ▮▮▮▮▯ on a roll     │   ← identity, not a scary score
└──────────────────────────────┘
 [Today] [Coach] [Progress] [More]   ← minimal bottom nav
```

## Onboarding (short, one Q per screen)
`Goal → experience → equipment → diet → health → done → first plan generating…`

## Meal log (photo-first)
```
[📷 snap]  → "Dal + 2 roti · ~520 kcal · P28 (range)"
            [Looks right] [Fix portion]   + coach swap tip
```

## Coach chat (voice-first)
```
🎤 / type (Hinglish ok) … bubbles … [What your coach remembers ▸]
```

## Progress = Health Timeline (story, not charts)
```
"March was your strongest month. Weight improved after more protein."
 ▸ tap for detailed charts (power users)
```

## Weekly Story (shareable)
```
full-screen vertical card · consistency · standout moment · next focus
[Share]  → IG/WhatsApp status
```

## Comeback screen
```
"Welcome back 👋 You've done this before. Just 10 min today."
[Start easy session]   (streak protected)
```

## Other screens (briefs)
- Trainer marketplace: list → profile (bio, certs, reviews, price) → book/buy.
- Paywall: plan compare (doc 10) shown at the moment a Premium feature is tapped.
- Family Mode: members + shared challenge + privacy toggle.
- Admin: users / trainers (verify) / revenue / reports / moderation queue (functional, dense).

Principles: one decision per screen, big tap targets, motion to celebrate wins, no clutter,
fast first paint, WCAG-minded (labels, contrast, keyboard).
