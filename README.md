# 💪 Vasu Fitness

> A full-stack mobile-first fitness tracking and AI coaching app — connecting gym members, workout logging, personalized AI plans, community leaderboards, and a local supplement marketplace in one platform.

**Developer:** Vasu Yadav  
**Primary Stack:** Next.js 15 · React 19 · Firebase · Tailwind CSS · TypeScript  
**AI Layer:** OpenRouter (Mistral 7B / Gemma / Nemotron) · SerpAPI

---

## 📋 Table of Contents

- [Overview](#overview)
- [Core Features](#core-features)
- [Technical Architecture](#technical-architecture)
- [Database Schema](#database-schema)
- [API Routes & Cloud Functions](#api-routes--cloud-functions)
- [Project Structure](#project-structure)
- [Setup Instructions](#setup-instructions)
- [Future Roadmap](#future-roadmap)
- [License & Author](#license--author)

---

## Overview

**Vasu Fitness** is a mobile-first fitness SaaS built on Next.js and Firebase. Users can log workouts in real-time, get AI-generated training plans tailored to their goals and equipment, follow celebrity athlete programs, compete on gym leaderboards, and discover local supplement shops — all from a single mobile-optimized interface.

The app is designed around a 390px mobile viewport and supports both light and dark themes with persistent user preferences.

---

## Core Features

### 🏠 Home Dashboard
- Weekly workout stats: volume (kg), total sets, sessions, active streak
- This week vs last week volume comparison
- Today's recommended workout card
- Quick links to nearby verified supplement shops
- Real-time data sync with Firestore

### 🏋️ Workout Tracking
- Live workout session logger — add exercises, log sets with weight, reps, and RPE
- Built-in rest timer with audio alert and customizable duration
- Auto-calculated total volume and duration per session
- Save workout with custom name; history persists to Firestore
- Inline 1RM estimator (Brzycki formula) and barbell plate calculator

### 🤖 AI Coach
- Multi-step onboarding: fitness level, goal, available days, equipment
- AI-generated weekly workout plans via OpenRouter (Mistral 7B, with fallbacks to Gemma and Nemotron)
- Chat interface for plan modifications ("add more chest volume", "make it a 4-day split")
- Post-workout AI session summaries
- All AI requests routed through `/api/ai` with model fallback chain

### 🌟 Celebrity Programs
- 12+ pre-built programs: Arnold Schwarzenegger Classic, HIT, Science-Based, Powerbuilding, and more
- Daily exercise splits with sets/reps/rest prescriptions
- Browse with search and filter by program style
- Tap any day to see the full exercise list

### 🏆 Leaderboard
- Gym-based chest press 1RM rankings
- Real-time Firestore listener updates standings instantly
- Scoped to your gym — compete only with your members

### 🛒 Supplement Market
- Search supplements (creatine, whey, pre-workout) using SerpAPI integration
- See live pricing and product results
- Local Shops tab: browse verified gym equipment shops with ratings
- Each shop shows contact, location, and owner-verified badge

### 🏢 Gym Management
- Create a gym with invite code generation
- Join an existing gym via invite code
- Aadhaar-based identity verification for gym owners
- Admin approval workflow before gym goes live

### 👤 Profile & Settings
- Edit name, gym association, and avatar
- Toggle between light and dark mode (persisted to localStorage)
- Unit preferences (kg / lbs)
- Fitness calculators: 1RM, plate loader, rest timer
- Shop owner badge for verified equipment sellers

### 🔐 Authentication
- Email/password signup and login
- Google OAuth (one-click sign-in)
- Password reset via email
- Firebase Auth with persistent session

### 🛡️ Admin Panel
- Approve pending gym registrations
- Verify equipment shop listings
- Access restricted to admin email

---

## Technical Architecture

### Frontend

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router, Server + Client Components) |
| Language | TypeScript 5 (strict mode) |
| Styling | Tailwind CSS 4.2, shadcn/ui, Radix UI primitives |
| Icons | Lucide React (1000+ SVG icons) |
| Fonts | DM Sans (body), Space Mono (mono), Geist (sans) via Google Fonts |
| Animation | tw-animate-css |
| Layout | Fixed 390px viewport, mobile-first, centered on desktop |

### Backend

| Layer | Technology |
|-------|-----------|
| Database | Cloud Firestore (real-time, offline-first) |
| Authentication | Firebase Auth (email/password + Google OAuth) |
| Storage | Firebase Storage (profile images, shop assets) |
| Serverless | Firebase Cloud Functions (Node.js 24) |
| API Routes | Next.js Route Handlers (`/api/ai`, `/api/market`) |

### AI Layer

| Feature | Model / Service |
|---------|----------------|
| Workout plan generation | OpenRouter → Mistral 7B Instruct |
| Plan modification chat | OpenRouter → Mistral 7B (fallback: Gemma 3, Nemotron) |
| Session summary | Same multi-model chain |
| Supplement search | SerpAPI (Google Shopping) |
| Firebase Cloud Function | Direct Mistral 7B call with fitness system prompt |

### State & Data

- **Client state:** React `useState` / `useEffect` + localStorage for draft workouts and theme
- **Global state:** React Context (`ThemeContext`) for dark/light mode
- **Real-time state:** Firestore `onSnapshot` listeners for leaderboard and home stats
- **Type safety:** Full TypeScript interfaces for all Firestore documents and component props

---

## Database Schema

### Firestore Collections

| Collection | Purpose |
|-----------|---------|
| `users/{userId}` | Profile: name, email, gymId, role, units preference, shop owner status |
| `gyms/{gymId}` | Gym name, invite code, owner, Aadhaar verification status, member list |
| `workouts/{workoutId}` | Session data: userId, name, exercises array, total volume, duration, timestamp |
| `chest1rm/{entryId}` | userId, gymId, weight (kg), timestamp — used for leaderboard ranking |
| `shops/{shopId}` | Shop name, owner, location, contact, verified badge, rating, status |
| `shopListings/{listingId}` | shopId, product name, price, category, stock, images |

### Security Rules Summary

- Users can only read and write their own `users` document
- Workouts are private — only the owning user can read/write
- Gyms require authentication; only owners can modify
- Shops are publicly readable; owners can create/edit/delete their own
- `chest1rm` requires authentication to write; all gym members can read

---

## API Routes & Cloud Functions

### Next.js API Routes

#### `POST /api/ai`
Multi-mode AI endpoint for all workout intelligence:

| Mode | Input | Output |
|------|-------|--------|
| `generate` | fitness level, goal, days/week, equipment | Full weekly workout plan (markdown) |
| `chat` | existing plan + user message | Modified plan or coaching reply |
| `summarize` | completed workout data | Plain-language session summary |

Model chain: `mistralai/mistral-7b-instruct` → `google/gemma-3-12b-it:free` → `nvidia/llama-3.1-nemotron-nano-8b-instruct:free`

#### `POST /api/market`
Supplement search via SerpAPI:
- Input: search query string
- Output: product list with titles, prices, sources, and links

### Firebase Cloud Function

**`exports.ai`** — HTTP-triggered Cloud Function (CORS-enabled)
- Calls OpenRouter API with Mistral 7B
- System prompt: fitness-focused assistant with Indian budget product suggestions
- Fallback error messages if model unavailable
- Deployed to Firebase project `gymai-9edba`

---

## Project Structure

```
gym-app/
├── app/
│   ├── layout.tsx                  (Root layout — fonts, ThemeProvider, metadata)
│   ├── page.tsx                    (Home dashboard — stats, streaks, today's plan)
│   ├── globals.css                 (Global styles, CSS variables)
│   ├── admin/page.tsx              (Admin approval panel)
│   ├── ai/page.tsx                 (AI Coach — onboarding + plan generation + chat)
│   ├── api/
│   │   ├── ai/route.ts             (AI workout plan & chat endpoint)
│   │   └── market/route.ts         (SerpAPI supplement search)
│   ├── biology/page.tsx            (Recovery metrics — placeholder)
│   ├── dashboard/page.tsx          (Fitness analytics dashboard)
│   ├── exercise-library/page.tsx   (100+ exercise browser with filters)
│   ├── explore/
│   │   ├── page.tsx                (Celebrity programs list)
│   │   └── [id]/page.tsx           (Individual program detail view)
│   ├── gym/page.tsx                (Create/join gym with invite code)
│   ├── history/page.tsx            (Past workout sessions)
│   ├── journal/page.tsx            (Training notes — placeholder)
│   ├── leaderboard/page.tsx        (Gym chest 1RM rankings)
│   ├── login/page.tsx              (Auth — login, signup, Google OAuth, reset)
│   ├── market/page.tsx             (Supplement search + local shops)
│   ├── profile/
│   │   ├── page.tsx                (User profile, theme toggle, badges)
│   │   ├── edit/page.tsx           (Edit profile details)
│   │   ├── calculators/page.tsx    (1RM, plate, rest timer tools)
│   │   └── units/page.tsx          (kg/lbs preference)
│   ├── shop/
│   │   ├── register/page.tsx       (Shop owner registration)
│   │   └── dashboard/page.tsx      (Manage shop inventory)
│   └── workout/
│       └── new/page.tsx            (Live workout session)
│
├── app/components/                 (Feature components, co-located with routes)
│   ├── WorkoutSession.tsx          (Main workout tracker — sets, reps, weight, timer)
│   ├── ExerciseLibrary.tsx         (Exercise browser with muscle group filters)
│   ├── FitnessDashboard.tsx        (Stats: volume, sets, duration, streak, trends)
│   ├── Chest1RMLeaderboard.tsx     (Real-time gym leaderboard)
│   ├── LocalShopsTab.tsx           (Verified shop browser with ratings)
│   ├── SaveWorkoutScreen.tsx       (Name & confirm workout before saving)
│   ├── RestTimer.tsx               (Inline rest countdown)
│   ├── RestTimerSheet.tsx          (Bottom sheet rest timer with audio)
│   ├── OneRMCalculator.tsx         (Brzycki 1RM estimator)
│   ├── PlateCalculator.tsx         (Barbell plate combination calculator)
│   ├── SetRow.tsx                  (Single set input: weight, reps, RPE, PR flag)
│   ├── WorkoutHistory.tsx          (Past sessions list with volume stats)
│   ├── CalendarSection.tsx         (Calendar heatmap of workout dates)
│   ├── RoutineCard.tsx             (Workout routine display card)
│   ├── MuscleMap.tsx               (Visual muscle group selector)
│   ├── BottomNav.tsx               (Persistent mobile bottom navigation bar)
│   └── workoutTypes.ts             (TypeScript types: WorkoutExercise, WorkoutSet)
│
├── components/                     (shadcn/ui base component library)
│   └── ui/
│       ├── button.tsx
│       └── avatar.tsx
│
├── lib/
│   ├── firebase.ts                 (Firebase initialization — Auth, Firestore)
│   ├── ThemeContext.tsx            (Dark/light mode React Context)
│   └── utils.ts                   (cn() class merge utility)
│
├── data/
│   ├── exercises.json              (100+ exercises with muscle groups and equipment)
│   └── influencers.ts              (12+ pre-built celebrity workout programs)
│
├── functions/
│   ├── index.js                    (Firebase Cloud Function — AI endpoint)
│   └── package.json
│
├── public/                         (Static assets — SVGs, images)
├── firestore.rules                 (Firestore security rules)
├── firestore.indexes.json          (Composite index definitions)
├── firebase.json                   (Firebase project config)
├── .firebaserc                     (Firebase project alias)
├── tailwind.config.js
├── postcss.config.js
├── components.json                 (shadcn/ui config)
├── next.config.ts
└── package.json
```

---

## Setup Instructions

### Prerequisites

- Node.js 20+
- npm or yarn
- Firebase CLI (`npm install -g firebase-tools`)
- A Firebase project (Auth + Firestore + Storage enabled)
- OpenRouter API key (for AI features)
- SerpAPI key (for supplement market)

### 1. Clone and install dependencies

```bash
git clone https://github.com/vasuyadav2003/gym-app.git
cd gym-app
npm install
```

### 2. Configure environment variables

Create a `.env.local` file in the project root:

```env
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# AI & Market
OPENROUTER_API_KEY=your_openrouter_key
SERPAPI_KEY=your_serpapi_key
```

### 3. Firebase setup

```bash
# Login to Firebase CLI
firebase login

# Deploy Firestore rules and indexes
firebase deploy --only firestore

# Deploy Cloud Functions
cd functions
npm install
cd ..
firebase deploy --only functions
```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Build for production

```bash
npm run build
npm start
```

---

## Future Roadmap

- **Biology tab** — HRV, sleep, and recovery tracking integration
- **Journal tab** — Training notes and session diary with tagging
- **Push notifications** — Workout reminders and PR alerts via Firebase Cloud Messaging
- **Wearable sync** — Apple Health / Google Fit data import
- **Social sharing** — Share PRs and workout summaries to social media
- **Payment integration** — Premium AI coaching plans and shop checkout (Razorpay/UPI)
- **Progressive Web App** — Offline workout logging with service workers
- **Video exercise guides** — Embedded tutorial clips per exercise
- **Nutrition tracking** — Macro logging with barcode scanner
- **Multi-language support** — Hindi and regional Indian languages

---

## License & Author

© 2026 Vasu Yadav. All rights reserved.

Built as a personal project exploring the intersection of fitness, AI coaching, and community features — combining real-time workout tracking with personalized AI plans to make quality fitness guidance accessible regardless of gym membership or personal trainer budget.

> "Fitness should be smart, social, and affordable. Vasu Fitness is an attempt to make all three possible in one place."
