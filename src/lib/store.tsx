"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { mergeGuestAction, removeEntryAction, saveEntryAction, saveProfileAction } from "@/app/actions/collection";
import { authClient } from "./auth-client";
import { emptyProfile, guestStateSchema, type CollectionEntry, type GuestState, type TasteProfile } from "./profile";

const STORAGE_KEY = "accord:guest:v1";
const TRAIL_KEY = "accord:trail:v1";
const TRAIL_LIMIT = 12;

type Account = { id: string; name: string; email: string } | null;

type Store = {
  ready: boolean;
  account: Account;
  profile: TasteProfile;
  collection: CollectionEntry[];
  /** Fragrances recently opened, newest first: the strips laid on the bench. */
  trail: string[];
  error: string | null;
  entryFor: (productId: string) => CollectionEntry | undefined;
  saveEntry: (entry: CollectionEntry) => Promise<void>;
  removeEntry: (productId: string) => Promise<void>;
  saveProfile: (profile: TasteProfile) => Promise<void>;
  visit: (productId: string) => void;
  clearError: () => void;
  refresh: () => Promise<void>;
};

const StoreContext = createContext<Store | null>(null);

function readLocal<T>(key: string, parse: (v: unknown) => T, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? parse(JSON.parse(raw)) : fallback;
  } catch {
    return fallback;
  }
}

function writeLocal(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Private mode or storage full: the session still works in memory.
  }
}

function removeLocal(key: string) {
  try {
    window.localStorage.removeItem(key);
  } catch {}
}

// The trail lives in localStorage and is read through useSyncExternalStore so
// server HTML and the first client render agree. Snapshots are cached by the
// raw string so React sees a stable value between writes.
const EMPTY_TRAIL: string[] = [];
const trailListeners = new Set<() => void>();
let trailCache: { raw: string | null; value: string[] } = { raw: null, value: EMPTY_TRAIL };

function readTrail(): string[] {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(TRAIL_KEY);
  } catch {}
  if (raw === trailCache.raw) return trailCache.value;
  let value = EMPTY_TRAIL;
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (Array.isArray(parsed)) value = parsed.filter((x): x is string => typeof x === "string").slice(0, TRAIL_LIMIT);
  } catch {}
  trailCache = { raw, value };
  return value;
}

function subscribeTrail(notify: () => void) {
  trailListeners.add(notify);
  window.addEventListener("storage", notify);
  return () => {
    trailListeners.delete(notify);
    window.removeEventListener("storage", notify);
  };
}

const emptyGuest: GuestState = { version: 1, profile: emptyProfile, collection: [] };

export function AccordProvider({ children }: { children: ReactNode }) {
  const session = authClient.useSession();
  const [ready, setReady] = useState(false);
  const [account, setAccount] = useState<Account>(null);
  const [profile, setProfile] = useState<TasteProfile>(emptyProfile);
  const [collection, setCollection] = useState<CollectionEntry[]>([]);
  // Server and hydration render an empty trail; the stored one arrives right after.
  const trail = useSyncExternalStore(subscribeTrail, readTrail, () => EMPTY_TRAIL);
  const [error, setError] = useState<string | null>(null);
  const userId = session.data?.user.id ?? null;
  const loadedFor = useRef<string | null | undefined>(undefined);

  const loadAccount = useCallback(async () => {
    const res = await fetch("/api/me", { cache: "no-store" });
    if (!res.ok) throw new Error("load failed");
    const data = (await res.json()) as { user: NonNullable<Account>; profile: TasteProfile; collection: CollectionEntry[] };
    setAccount(data.user);
    setProfile(data.profile);
    setCollection(data.collection);
  }, []);

  useEffect(() => {
    if (session.isPending || loadedFor.current === userId) return;
    loadedFor.current = userId;
    (async () => {
      const guest = readLocal(STORAGE_KEY, (v) => guestStateSchema.parse(v), emptyGuest);
      if (!userId) {
        setAccount(null);
        setProfile(guest.profile);
        setCollection(guest.collection);
        setReady(true);
        return;
      }
      try {
        if (guest.collection.length || guest.profile.likedNotes.length || guest.profile.families.length || guest.profile.likedAccords.length) {
          const merged = await mergeGuestAction(guest);
          if (merged.ok) removeLocal(STORAGE_KEY);
        }
        await loadAccount();
      } catch {
        setError("Couldn't load your collection. Refresh to try again.");
      } finally {
        setReady(true);
      }
    })();
  }, [session.isPending, userId, loadAccount]);

  const persistGuest = useCallback((next: Partial<GuestState>) => {
    const current = readLocal(STORAGE_KEY, (v) => guestStateSchema.parse(v), emptyGuest);
    writeLocal(STORAGE_KEY, { ...current, ...next });
  }, []);

  const saveEntry = useCallback(
    async (entry: CollectionEntry) => {
      const previous = collection;
      const next = [entry, ...collection.filter((e) => e.productId !== entry.productId)];
      setCollection(next);
      if (!account) return persistGuest({ collection: next });
      const result = await saveEntryAction(entry);
      if (!result.ok) {
        setCollection(previous);
        setError(result.error);
      }
    },
    [account, collection, persistGuest],
  );

  const removeEntry = useCallback(
    async (productId: string) => {
      const previous = collection;
      const next = collection.filter((e) => e.productId !== productId);
      setCollection(next);
      if (!account) return persistGuest({ collection: next });
      const result = await removeEntryAction(productId);
      if (!result.ok) {
        setCollection(previous);
        setError(result.error);
      }
    },
    [account, collection, persistGuest],
  );

  const saveProfile = useCallback(
    async (nextProfile: TasteProfile) => {
      const previous = profile;
      setProfile(nextProfile);
      if (!account) return persistGuest({ profile: nextProfile });
      const result = await saveProfileAction(nextProfile);
      if (!result.ok) {
        setProfile(previous);
        setError(result.error);
      }
    },
    [account, profile, persistGuest],
  );

  const visit = useCallback((productId: string) => {
    const current = readTrail();
    if (current[0] === productId) return;
    writeLocal(TRAIL_KEY, [productId, ...current.filter((id) => id !== productId)].slice(0, TRAIL_LIMIT));
    trailListeners.forEach((notify) => notify());
  }, []);

  const value = useMemo<Store>(
    () => ({
      ready,
      account,
      profile,
      collection,
      trail,
      error,
      entryFor: (id) => collection.find((e) => e.productId === id),
      saveEntry,
      removeEntry,
      saveProfile,
      visit,
      clearError: () => setError(null),
      refresh: loadAccount,
    }),
    [ready, account, profile, collection, trail, error, saveEntry, removeEntry, saveProfile, visit, loadAccount],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useAccord(): Store {
  const store = useContext(StoreContext);
  if (!store) throw new Error("useAccord must be used inside AccordProvider");
  return store;
}
