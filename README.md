# 💜 BackToYou — Campus Lost & Found Platform

A campus-focused Lost & Found platform built for the **Newton School of Technology** community.

BackToYou helps students report lost belongings, share found items, and reconnect people with their missing possessions.

## ✨ Features

- **User Authentication** — Sign up, sign in, and sign out.
- **Report Lost Items** — Publish details of missing belongings.
- **Report Found Items** — Help others find their belongings.
- **Campus Item Board** — Browse reports submitted by the community.
- **Search & Filters** — Find items by name, location, category, or status.
- **Item Details** — View descriptions, categories, locations, and report dates.
- **Database Persistence** — Reports are stored using Supabase and remain available after refreshing.

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| React | User interface |
| TypeScript | Type-safe development |
| Vite | Development and build tooling |
| Tailwind CSS | Styling |
| Supabase | Authentication and database |
| Lucide React | Icons |
| Git & GitHub | Version control |

## 🚀 Run Locally

### 1. Clone the repository

```bash
git clone https://github.com/ShambhaviSharma28/BackToYou.git
cd BackToYou
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

Use your own Supabase project credentials. Never commit your `.env` file.

### 4. Start the development server

```bash
npm run dev
```

### 5. Create a production build

```bash
npm run build
```

## 🔮 Future Improvements

- Item photo uploads using Supabase Storage.
- Claim and recovery request workflow.
- User profiles and report management.
- Improved ownership verification.
- Public deployment for campus-wide access.

## 👩‍💻 Built By

**Shambhavi Sharma**

First-year B.Tech CSE (AI & ML) student.

Built as a project to explore full-stack web development and solve a real campus problem.

---

*Helping lost belongings find their way back. 💜*
