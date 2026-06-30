-- ============================================================
-- Family Expense Tracker — Supabase Database Setup
-- Run this in the Supabase SQL Editor at supabase.com
-- ============================================================

-- 1. Expenses table
create table if not exists expenses (
  id          uuid default gen_random_uuid() primary key,
  amount      decimal(12, 2) not null,
  category    text not null,
  description text default '',
  paid_by     text not null,
  expense_date date not null default current_date,
  is_recurring boolean default false,
  created_at  timestamptz default now()
);

-- 2. Salaries table
create table if not exists salaries (
  id       uuid default gen_random_uuid() primary key,
  person   text not null,
  month    integer not null check (month between 1 and 12),
  year     integer not null,
  amount   decimal(12, 2) not null,
  created_at timestamptz default now(),
  unique (person, month, year)
);

-- 3. Enable Row Level Security (required by Supabase)
alter table expenses enable row level security;
alter table salaries  enable row level security;

-- 4. Open policies for personal use (no auth needed)
create policy "Allow all on expenses"
  on expenses for all
  using (true) with check (true);

create policy "Allow all on salaries"
  on salaries for all
  using (true) with check (true);

-- 5. Helpful indexes
create index if not exists idx_expenses_date    on expenses (expense_date desc);
create index if not exists idx_expenses_paid_by on expenses (paid_by);
create index if not exists idx_expenses_category on expenses (category);
create index if not exists idx_salaries_lookup  on salaries (person, year, month);
