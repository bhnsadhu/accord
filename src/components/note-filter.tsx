"use client";

import { useState } from "react";
import { CloseIcon } from "./icons";

export function NoteFilter({ label, name, selected, options }: { label: string; name: "note" | "without"; selected: string[]; options: { key: string; label: string }[] }) {
  const [values, setValues] = useState(selected);
  return <fieldset className="note-filter">
    <legend>{label}</legend>
    {values.length > 0 && <ul>{values.map(key => <li key={key}><input type="hidden" name={name} value={key} /><span>{options.find(n => n.key === key)?.label ?? key}</span><button type="button" aria-label={`Remove ${options.find(n => n.key === key)?.label ?? key} from ${label.toLowerCase()}`} onClick={() => setValues(current => current.filter(v => v !== key))}><CloseIcon width={14} height={14} /></button></li>)}</ul>}
    <select aria-label={`Add a note to ${label.toLowerCase()}`} value="" disabled={values.length >= 12} onChange={event => { const value = event.target.value; if (value) setValues(current => [...current, value]); }}>
      <option value="">{values.length ? "Add another note" : "Choose a note"}</option>
      {options.filter(note => !values.includes(note.key)).map(note => <option key={note.key} value={note.key}>{note.label}</option>)}
    </select>
    <noscript><label>Choose a note<select name={name} defaultValue=""><option value="">Any</option>{options.map(note => <option key={note.key} value={note.key}>{note.label}</option>)}</select></label></noscript>
  </fieldset>;
}
