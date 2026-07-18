import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'gcash_cashflow_daily_budget_v1';

export interface DailyBudget {
  /** Local calendar date YYYY-MM-DD */
  date: string;
  /** Starting cash float for the day */
  startingAmount: number;
}

export function todayLocalDate(now = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export async function loadDailyBudget(now = new Date()): Promise<DailyBudget> {
  const today = todayLocalDate(now);
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return { date: today, startingAmount: 0 };
    const parsed = JSON.parse(raw) as DailyBudget;
    if (!parsed || typeof parsed.date !== 'string') {
      return { date: today, startingAmount: 0 };
    }
    // New calendar day starts with an empty budget until the user sets it.
    if (parsed.date !== today) {
      return { date: today, startingAmount: 0 };
    }
    return {
      date: today,
      startingAmount:
        typeof parsed.startingAmount === 'number' && Number.isFinite(parsed.startingAmount)
          ? Math.max(0, parsed.startingAmount)
          : 0,
    };
  } catch {
    return { date: today, startingAmount: 0 };
  }
}

export async function saveDailyBudget(budget: DailyBudget): Promise<void> {
  const payload: DailyBudget = {
    date: budget.date,
    startingAmount:
      typeof budget.startingAmount === 'number' && Number.isFinite(budget.startingAmount)
        ? Math.max(0, budget.startingAmount)
        : 0,
  };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}
