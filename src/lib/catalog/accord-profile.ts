/**
 * An accord profile estimated from a fragrance's listed notes. For each note
 * we know which accord families the catalog's fragrances containing it belong
 * to. A note "signals" a family when it appears there more often than the
 * family's overall share (lift). Averaging those signals over the listed
 * notes gives relative strengths. It is a catalog statistic, never a
 * measurement of the juice, and the page says so.
 */

export type NoteFamilyStats = {
  /** note key -> family -> fragrances containing the note in that family */
  byNote: Record<string, Record<string, number>>;
  /** family -> fragrances in that family */
  families: Record<string, number>;
  total: number;
};

export type AccordStrength = { family: string; strength: number; notes: string[] };

/** Notes in fewer fragrances than this carry too little evidence to count. */
const MIN_NOTE_SUPPORT = 8;

export function accordProfile(noteKeys: string[], stats: NoteFamilyStats, opts: { limit?: number; primary?: string | null } = {}): AccordStrength[] {
  const limit = opts.limit ?? 6;
  const scores = new Map<string, { score: number; notes: string[] }>();
  let counted = 0;
  for (const key of new Set(noteKeys)) {
    const dist = stats.byNote[key];
    if (!dist) continue;
    const support = Object.values(dist).reduce((a, b) => a + b, 0);
    if (support < MIN_NOTE_SUPPORT) continue;
    counted++;
    for (const [family, n] of Object.entries(dist)) {
      const base = (stats.families[family] ?? 0) / stats.total;
      if (!base) continue;
      const lift = n / support / base;
      if (lift <= 1) continue;
      const entry = scores.get(family) ?? { score: 0, notes: [] };
      // Log lift keeps one rare, highly specific note from dominating.
      entry.score += Math.log(lift);
      if (lift >= 1.5) entry.notes.push(key);
      scores.set(family, entry);
    }
  }
  if (!counted) return opts.primary ? [{ family: opts.primary, strength: 1, notes: [] }] : [];
  // The catalog's own family classification is evidence too: it always leads.
  if (opts.primary) {
    const top = Math.max(0, ...[...scores.values()].map(s => s.score));
    const own = scores.get(opts.primary) ?? { score: 0, notes: [] };
    scores.set(opts.primary, { ...own, score: Math.max(own.score, top) * 1.05 + 0.0001 });
  }
  const ranked = [...scores.entries()].map(([family, v]) => ({ family, score: v.score, notes: v.notes })).sort((a, b) => b.score - a.score || a.family.localeCompare(b.family));
  const max = ranked[0]?.score ?? 0;
  if (max <= 0) return [];
  return ranked
    .slice(0, limit)
    .map(r => ({ family: r.family, strength: Math.round((r.score / max) * 100) / 100, notes: r.notes }))
    .filter(r => r.strength >= 0.12);
}
