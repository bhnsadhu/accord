import type { Budget } from "./budget";

/** Best-effort limits per server instance for local computation, with no database reads.
 * Paid upstream work must continue to use the distributed database quotas.
 */
const counters = new Map<string, { used: number; expires: number }>();
export function consumeLocalBudget(budgets: Budget[], now = Date.now()) {
  for (const [key, value] of counters) if (value.expires <= now) counters.delete(key);
  const windows = budgets.map(rule => ({ rule, expires: (Math.floor(now / (rule.seconds * 1000)) + 1) * rule.seconds * 1000 }));
  if (windows.some(({ rule }) => !Number.isInteger(rule.limit) || rule.limit < 1 || !Number.isInteger(rule.seconds) || rule.seconds < 1 || rule.calendarMonth || (counters.get(rule.scope)?.used ?? 0) >= rule.limit)) return false;
  // Bound memory even if a caller supplies many different identifiers.
  if (counters.size + windows.filter(({ rule }) => !counters.has(rule.scope)).length > 10_000) return false;
  for (const { rule, expires } of windows) counters.set(rule.scope, { used: (counters.get(rule.scope)?.used ?? 0) + 1, expires });
  return true;
}
