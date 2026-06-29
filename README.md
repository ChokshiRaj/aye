<div align="center">
  <h1>AYE Dashboard</h1>
  <p>A sleek, minimal, full-stack personal command centre — built for privacy, productivity, and daily clarity.</p>

  [![Live Demo](https://img.shields.io/badge/Live-aye--dashboard.vercel.app-blue?style=flat-square)](https://aye-dashboard.vercel.app)
  [![Tech Stack](https://img.shields.io/badge/Stack-React%20%2B%20Node%20%2B%20PostgreSQL-green?style=flat-square)]()
  [![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)]()

</div>

---

## What is AYE?

AYE is a private, personal dashboard built for one person — you. No public signup, no ads, no tracking. Just a clean command centre for your day.

---

## Features

### 🧩 12 Dashboard Widgets
Clock, Weather, Finance & Stocks, HackerNews Feed, Markdown Notes, Habit Tracker, Bookmarks, Calendar, Events, Pomodoro Timer, Daily Quote, Todo List.

### 📈 Markets (`/markets`)
Indian indices (NIFTY, SENSEX, Bank NIFTY), Gold & Silver (MCX rates in ₹), Forex rates (USD/INR, EUR/INR, AED/INR + converter), Crypto in INR.

### 📊 Analytics (`/analytics`)
365-day activity heatmap, focus time charts, habit consistency bars, todo velocity tracking, personal productivity stats.

### 📅 Calendar (`/calendar`)
Full-screen split layout, event categories (Work / Personal / Important), mobile-responsive stacked view.

### 🔥 Habits (`/habits`)
7-day grid + yearly heatmap, flame streak tracking, inline editing.

### 🔔 Notifications (`/notifications`)
In-app inbox with filters, push notifications via Web Push API, automated reminders for habits, events, and streaks.

### ✉️ Smart Email System
Weekly analytics reports, streak warnings, event reminders, login alerts — all configurable per-email in Settings.

### 🛡️ Security
- Seed-only access (no public registration)
- JWT + refresh token rotation
- 2FA with TOTP (Google Authenticator)
- Active session management
- bcrypt password hashing (12 rounds)
- HttpOnly secure cookies

### 📲 PWA
Installable on Android, iOS, and desktop. Offline support via Workbox.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + TypeScript |
| Styling | Tailwind CSS + Lucide Icons |
| State | Zustand |
| Backend | Node.js + Express + TypeScript |
| Database | Neon DB (PostgreSQL) + Prisma ORM |
| Auth | JWT + bcrypt + TOTP 2FA |
| Email | Nodemailer + Gmail SMTP |
| Push | Web Push API + VAPID |
| PWA | vite-plugin-pwa + Workbox |
| Deploy | Vercel (frontend) + Render (backend) |

---

## Local Setup

### Prerequisites
- Node.js v18+
- npm v9+
- Neon DB account (free at [neon.tech](https://neon.tech))

### 1. Clone
```bash
git clone https://github.com/YOUR_USERNAME/aye.git
cd aye
```

### 2. Server setup
```bash
cd server
cp .env.example .env
# Fill in your values in .env
npm install
npx prisma migrate dev --name init
npm run seed
npm run dev
```

### 3. Client setup
```bash
cd ../client
cp .env.example .env
# Set VITE_API_URL=http://localhost:5000
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) and sign in with your seeded credentials.

---

## Deployment

| Service | Platform | Root Directory |
|---|---|---|
| Frontend | Vercel | `client/` |
| Backend | Render | `server/` |
| Database | Neon DB | — |

- **Frontend (Vercel):** Connect repo → set root to `client/` → add `VITE_API_URL` + `VITE_VAPID_PUBLIC_KEY` env vars → Deploy
- **Backend (Render):** Connect repo → set root to `server/` → Build: `npm install && npx prisma generate && npm run build` → Start: `npm start` → add all env vars → Deploy
- **Uptime:** Use [UptimeRobot](https://uptimerobot.com) (free) to ping `https://aye-backend.onrender.com/api/health` every 5 minutes to keep the Render free tier alive

---

## License
MIT — feel free to fork and build your own version.
