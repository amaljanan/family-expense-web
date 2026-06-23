export const CATEGORIES = [
  { id: 'groceries',        label: 'Groceries',             emoji: '🛒', color: '#22c55e' },
  { id: 'food_dining',      label: 'Food & Dining',         emoji: '🍽️', color: '#f97316' },
  { id: 'transportation',   label: 'Transportation',        emoji: '🚗', color: '#3b82f6' },
  { id: 'fuel',             label: 'Fuel',                  emoji: '⛽', color: '#f59e0b' },
  { id: 'rent',             label: 'Rent / Housing',        emoji: '🏠', color: '#8b5cf6' },
  { id: 'utilities',        label: 'Electricity & Utilities',emoji: '💡', color: '#06b6d4' },
  { id: 'mobile_internet',  label: 'Mobile & Internet',     emoji: '📱', color: '#14b8a6' },
  { id: 'healthcare',       label: 'Healthcare',            emoji: '💊', color: '#ef4444' },
  { id: 'education',        label: 'Education',             emoji: '📚', color: '#6366f1' },
  { id: 'sip',              label: 'Mutual Fund SIP',       emoji: '📈', color: '#10b981' },
  { id: 'loan_emi',         label: 'Loan / EMI',            emoji: '🏦', color: '#dc2626' },
  { id: 'insurance',        label: 'Insurance',             emoji: '🛡️', color: '#0ea5e9' },
  { id: 'shopping',         label: 'Shopping',              emoji: '🛍️', color: '#ec4899' },
  { id: 'entertainment',    label: 'Entertainment',         emoji: '🎬', color: '#a855f7' },
  { id: 'subscriptions',    label: 'Subscriptions / OTT',   emoji: '📺', color: '#4f46e5' },
  { id: 'travel',           label: 'Travel & Vacation',     emoji: '✈️', color: '#fb923c' },
  { id: 'personal_care',    label: 'Personal Care',         emoji: '💈', color: '#f43f5e' },
  { id: 'gifts',            label: 'Gifts & Celebrations',  emoji: '🎁', color: '#e879f9' },
  { id: 'kids',             label: 'Kids & Family',         emoji: '👨‍👩‍👧', color: '#84cc16' },
  { id: 'household',        label: 'Household Items',       emoji: '🏡', color: '#a8a29e' },
  { id: 'investments',      label: 'Investments',           emoji: '💹', color: '#34d399' },
  { id: 'miscellaneous',    label: 'Miscellaneous',         emoji: '💸', color: '#94a3b8' },
]

export const getCategoryById = (id) =>
  CATEGORIES.find(c => c.id === id) ?? { id, label: id, emoji: '💸', color: '#94a3b8' }
