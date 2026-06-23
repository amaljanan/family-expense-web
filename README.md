# 💰 Family Finance Tracker

A beautiful, responsive web app to track family expenses — built for **Amal & Aiswarya**.

## ✨ Features

- **Dashboard** — Combined salary, total spent, savings rate, per-person spending cards with progress bars
- **Add Expense** — 22 categories with emoji icons, description, date, paid-by selector (Amal / Aiswarya)
- **Expenses** — Month filter, search, filter by person/category, grouped by date, edit & delete
- **Reports** — Monthly & Weekly tabs with ranked category breakdown, Amal vs Aiswarya comparison, 6-month trend, daily chart, savings insights
- **Salary** — Enter monthly salary for each person, combined family income, history

## 🗂️ Categories

Groceries · Food & Dining · Transportation · Fuel · Rent · Utilities · Mobile & Internet · Healthcare · Education · **Mutual Fund SIP** · **Loan / EMI** · Insurance · Shopping · Entertainment · Subscriptions · Travel · Personal Care · Gifts · Kids · Household · Investments · Miscellaneous

## 🛠️ Tech Stack

| Layer     | Technology                          |
|-----------|-------------------------------------|
| Frontend  | React 18 + Vite                     |
| Styling   | Tailwind CSS                        |
| Charts    | Recharts v3                         |
| Database  | Supabase (PostgreSQL)               |
| Hosting   | Netlify                             |

## 🚀 Getting Started

### 1. Clone the repo
```bash
git clone https://github.com/amaljanan/family-expense-web.git
cd family-expense-web
```

### 2. Set up Supabase
- Create a free project at [supabase.com](https://supabase.com)
- Open **SQL Editor** and run `supabase_setup.sql`
- Copy your **Project URL** and **anon key**

### 3. Create `.env`
```bash
cp .env.example .env
```
Fill in your Supabase credentials:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Install & run
```bash
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173)

## 📦 Deploy to Netlify

```bash
npm run build
# Drag the dist/ folder to netlify.com
# OR connect GitHub repo for auto-deploys
```

Add env vars in Netlify → Site configuration → Environment variables.

## 🗄️ Database Schema

```sql
expenses  (id, amount, category, description, paid_by, expense_date, created_at)
salaries  (id, person, month, year, amount, created_at)
```

---

Built with ❤️ for Amal & Aiswarya's family finance management.
