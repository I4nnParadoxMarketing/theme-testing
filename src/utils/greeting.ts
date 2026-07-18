export function getTimeGreeting(now = new Date()): string {
  const hour = now.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export function formatGreetingName(displayName?: string | null, username?: string | null): string {
  const raw = (displayName || username || 'there').trim();
  if (!raw) return 'there';
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

export function buildGreeting(
  displayName?: string | null,
  username?: string | null,
  now = new Date(),
): string {
  return `${getTimeGreeting(now)}, ${formatGreetingName(displayName, username)}`;
}
