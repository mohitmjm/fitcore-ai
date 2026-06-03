# FitCore AI — Personal Fitness Companion

FitCore AI is a premium, full-stack personal fitness companion web application. It is designed to create customized workout plans, structure Indian macro meal logs, track progress metrics and photographs, and provide a direct chat interface with an AI coach.

All AI features run locally using a self-hosted **Ollama** instance with **Llama 3.2 (8B)**, ensuring complete privacy, zero external API costs, and full offline capabilities.

---

## ⚡ Key Features

*   **AI Workout Planner**: Generates multi-day split plans customized by goal (muscle gain, fat loss, endurance), experience levels, and equipment. Exercises include form tips and clickable daily checkoffs.
*   **AI Diet & Nutrition logs**: Prepares custom 7-day Indian meal plans with visual gauges for calories, protein, carbs, and fats.
*   **AI Localization (English & Hinglish)**: Option to set your preferred AI language. Choosing Hinglish instructs the AI to generate exercise advice, food logs, and chat coaching responses in romanized Hindi (*e.g., "Back straight rakhein aur slowly perform karein"*).
*   **Progress Analytics Dashboard**: Visualizes changes in bodyweight and measurements (chest, waist, arms) over time using interactive Recharts graphs. Includes a local progress photo log.
*   **AI Coach Chat**: Directly consult your AI trainer for form adjustments, motivation, or diet swaps.
*   **Offline Fallback Sync**: Implements a robust `localStorage` backup that functions immediately out-of-the-box if remote databases or Ollama servers are offline.

---

## 🛠️ Technology Stack

*   **Frontend & Backend**: Next.js 14 (App Router) + TypeScript
*   **Styling**: Tailwind CSS v4, dark-mode first design, glassmorphism panels, harmonious glow gradients
*   **Charts & Visuals**: Recharts (responsive line/area plots)
*   **Icons**: Lucide React
*   **Database**: Supabase (PostgreSQL) with local fallback layer
*   **Local AI Inference**: Ollama API running Llama 3.2 8B (`http://localhost:11434`)

---

## 🚀 Getting Started

### 1. Prerequisites
*   Node.js (v18.0.0 or higher)
*   Ollama (installed and running locally)

### 2. Setup local AI
Ensure Ollama is running and pull the Llama 3.2 model:
```bash
ollama pull llama3.2
```

### 3. Install Dependencies
Clone the repository and install the packages:
```bash
npm install
```

### 4. Database Setup (Supabase)
Create a new Supabase project and execute the migration file located at:
`supabase/migrations/20260603000000_fitness_companion_schema.sql`

Configure your keys in `.env.local` to connect:
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
OLLAMA_API_URL=http://localhost:11434
```
*Note: If these keys are left empty, the application will run in Offline LocalStorage Mode automatically.*

### 5. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔒 Proprietary License

Copyright (c) 2026 Mohit. All rights reserved.

This repository is **PROPRIETARY AND CONFIDENTIAL**. Copying, redistributing, publishing, sublicensing, reverse-engineering, or creating derivative works of this source code, database structures, or styling systems is strictly prohibited under federal and international copyright laws. Violations will result in civil and criminal prosecution. See the [LICENSE](LICENSE) file for details.
