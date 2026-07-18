import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'gcash_cashflow_daily_budget_v1';

export interface DailyBudget {
  /** Local calendar date YYYY-MM-DD */
  date: string;
  /** Starting cash float for the day */
  startingAmount: number;
  /** Last change time — used for cross-device merge. */
  updatedAt?: string;
}

export function todayLocalDate(now = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

function normalizeBudget(value: Partial<DailyBudget> | null | undefined, fallbackDate: string): DailyBudget {
  const date = typeof value?.date === 'string' && value.date ? value.date : fallbackDate;
  const startingAmount =
    typeof value?.startingAmount === 'number' && Number.isFinite(value.startingAmount)
      ? Math.max(0, value.startingAmount)
      : 0;
  return {
    date,
    startingAmount,
    updatedAt:
      typeof value?.updatedAt === 'string' && value.updatedAt
        ? value.updatedAt
        : undefined,
  };
}

export async function loadDailyBudget(now = new Date()): Promise<DailyBudget> {
  const today = todayLocalDate(now);
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return { date: today, startingAmount: 0 };
    const parsed = normalizeBudget(JSON.parse(raw) as DailyBudget, today);
    // Keep yesterday's stored value only until sync can supply today's budget.
    // UI still treats a different date as zero until sync/apply.
    if (parsed.date !== today) {
      return { date: today, startingAmount: 0, updatedAt: undefined };
    }
    return parsed;
  } catch {
    return { date: today, startingAmount: 0 };
  }
}

/** Load raw stored budget without resetting a previous calendar day to zero. */
export async function loadStoredDailyBudget(): Promise<DailyBudget | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return normalizeBudget(JSON.parse(raw) as DailyBudget, todayLocalDate());
  } catch {
    return null;
  }
}

export async function saveDailyBudget(budget: DailyBudget): Promise<DailyBudget> {
  const payload: DailyBudget = {
    date: budget.date,
    startingAmount:
      typeof budget.startingAmount === 'number' && Number.isFinite(budget.startingAmount)
        ? Math.max(0, budget.startingAmount)
        : 0,
    updatedAt: budget.updatedAt || new Date().toISOString(),
  };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  return payload;
}

/** Pick the newest budget for today across local + remote. */
export function mergeDailyBudget(
  local: DailyBudget | null | undefined,
  remote: DailyBudget | null | undefined,
  now = new Date(),
): DailyBudget {
  const today = todayLocalDate(now);
  const candidates = [local, remote]
    .filter((item): item is DailyBudget => Boolean(item))
    .map((item) => normalizeBudget(item, today))
    .filter((item) => item.date === today);

  if (candidates.length === 0) {
    return { date: today, startingAmount: 0 };
  }

  return candidates.sort((a, b) => {
    const aTime = Date.parse(a.updatedAt || '') || 0;
    const bTime = Date.parse(b.updatedAt || '') || 0;
    return bTime - aTime;
  })[0];
}
