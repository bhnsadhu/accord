"use client";

import Link from "next/link";
import { useId, useState } from "react";
import type { FragranceSummary } from "@/lib/catalog/queries";
import { ArrowIcon, PlusIcon } from "./icons";

type Connection = { key: string; label: string; total: number; fragrances: FragranceSummary[] };

/** Follow a listed note into real catalog entries, without leaving the bench. */
export function NoteExplorer({ connections }: { connections: Connection[] }) {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const selected = connections.find(note => note.key === selectedKey);
  if (!connections.length) return null;

  return (
    <div className="note-explorer">
      <h3>Follow a note</h3>
      <div className="note-explorer-choices" role="group" aria-label="Explore the notes">
        {connections.map(note => (
          <button
            key={note.key}
            type="button"
            aria-expanded={open && selectedKey === note.key}
            aria-controls={panelId}
            onClick={() => {
              setOpen(selectedKey === note.key ? !open : true);
              setSelectedKey(note.key);
            }}
          >
            {note.label}<PlusIcon />
          </button>
        ))}
      </div>
      <p className="sr-only" role="status">{open && selected ? `${selected.total.toLocaleString("en-US")} fragrances list ${selected.label.toLowerCase()}.` : ""}</p>
      <div className="note-explorer-reveal" data-open={open} id={panelId} inert={!open} aria-hidden={!open}>
        <div>
          {selected && <section key={selected.key} className="note-connection" aria-label={`${selected.label} connections`}>
            <div className="note-connection-heading">
              <p><strong>{selected.total.toLocaleString("en-US")}</strong> fragrances list {selected.label.toLowerCase()}.</p>
              <Link href={`/discover?note=${encodeURIComponent(selected.key)}`}>Explore the note <ArrowIcon /></Link>
            </div>
            <ul>
              {selected.fragrances.map(fragrance => <li key={fragrance.productId}>
                <Link href={`/fragrance/${fragrance.slug}`}>
                  <span><strong>{fragrance.name}</strong><span>{fragrance.brand}</span></span>
                  <ArrowIcon />
                </Link>
              </li>)}
            </ul>
          </section>}
        </div>
      </div>
    </div>
  );
}
