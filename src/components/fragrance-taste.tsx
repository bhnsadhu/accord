"use client";

import Link from "next/link";
import { useAccord } from "@/lib/store";

export function FragranceTaste({ notes, family }: { notes: { key: string; label: string }[]; family: string | null }) {
  const { ready, profile } = useAccord();
  if (!ready) return null;
  const liked = notes.filter(note => profile.likedNotes.includes(note.key));
  const avoided = notes.filter(note => profile.dislikedNotes.includes(note.key));
  const likedFamily = family && profile.families.includes(family);
  const hasPreferences = profile.likedNotes.length + profile.dislikedNotes.length + profile.families.length > 0;
  return <div className="research-taste"><h3>For your taste</h3>{hasPreferences ? <>
    {liked.length > 0 && <p>Includes notes you like: {liked.map(n => n.label.toLowerCase()).join(", ")}.</p>}
    {avoided.length > 0 && <p>Also includes notes you prefer to avoid: {avoided.map(n => n.label.toLowerCase()).join(", ")}.</p>}
    {likedFamily && <p>Part of {family}, a family you enjoy.</p>}
    {!liked.length && !avoided.length && !likedFamily && <p>No direct overlap with the notes or families in your taste profile yet.</p>}
    <Link href="/for-you">See your recommendations</Link>
  </> : <p><Link href="/profile">Add your preferred notes and families</Link> to see how this fragrance connects with your taste.</p>}</div>;
}
