import { useEffect, useRef, useState } from 'react';
import { PinIcon } from './icons.jsx';

// A place input with autocomplete. Your OWN recorded places match instantly with
// no network; below them, global results come from Photon (Komoot's OpenStreetMap
// geocoder — free, no key). NOTE: typing here sends the query text to that service
// (debounced) — a deliberate, user-approved extension of the "only GPS leaves the
// device" principle (see docs/06-decisions.md, D30). Free text still works.
const HELVETICA = '"Helvetica Neue", Helvetica, Arial, sans-serif';
const ENDPOINT = 'https://photon.komoot.io/api/';

// Build a readable "City, Region, Country" label from a Photon feature.
function labelOf(feature) {
  const p = feature?.properties || {};
  const parts = [];
  if (p.name) parts.push(p.name);
  const mid = p.state || p.city || p.county;
  if (mid && mid !== p.name) parts.push(mid);
  if (p.country && p.country !== p.name && p.country !== mid) parts.push(p.country);
  return parts.join(', ');
}

export default function PlaceField({ value, onChange, suggestions = [], placeholder = 'Add a place' }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1); // keyboard-highlighted row
  const [online, setOnline] = useState([]); // global results (labels)
  const [loading, setLoading] = useState(false);
  const rootRef = useRef(null);
  const justPickedRef = useRef(false); // don't re-search right after selecting a result

  const q = value.trim();
  const ql = q.toLowerCase();

  // your own places, matched locally (no network)
  const ownMatches = ql
    ? suggestions
        .filter((p) => p.toLowerCase().includes(ql) && p.toLowerCase() !== ql)
        .sort((a, b) => Number(b.toLowerCase().startsWith(ql)) - Number(a.toLowerCase().startsWith(ql)))
        .slice(0, 4)
    : [];
  const ownSet = new Set(ownMatches.map((p) => p.toLowerCase()));
  const onlineMatches = online.filter((o) => !ownSet.has(o.toLowerCase())).slice(0, 6);
  const rows = [...ownMatches, ...onlineMatches];

  // debounced global search on the typed text
  useEffect(() => {
    if (justPickedRef.current) {
      justPickedRef.current = false;
      setLoading(false);
      return;
    }
    if (q.length < 2) {
      setOnline([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`${ENDPOINT}?q=${encodeURIComponent(q)}&limit=6&lang=en`, { signal: ctrl.signal });
        const data = await res.json();
        const labels = [...new Set((data.features || []).map(labelOf).filter(Boolean))];
        setOnline(labels);
      } catch (e) {
        if (e.name !== 'AbortError') setOnline([]);
      } finally {
        setLoading(false);
      }
    }, 320);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => rootRef.current && !rootRef.current.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  function pick(p) {
    justPickedRef.current = true;
    onChange(p);
    setOpen(false);
    setActive(-1);
    setOnline([]);
  }
  function onKeyDown(e) {
    if (!open || rows.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(rows.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === 'Enter' && active >= 0) {
      e.preventDefault();
      pick(rows[active]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  const showPop = open && (rows.length > 0 || (loading && q.length >= 2));

  return (
    <div ref={rootRef} className="relative w-full" style={{ fontFamily: HELVETICA }}>
      <label className="flex items-center gap-2.5 rounded-[12px] bg-white/[0.06] px-4 py-2.5 text-[15px] transition-colors focus-within:bg-white/[0.1]">
        <span className="text-[#8a8a8a]"><PinIcon /></span>
        <input
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
            setActive(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          className="w-full bg-transparent text-[#eaeaea] outline-none placeholder:text-[#8a8a8a]"
        />
      </label>

      {showPop && (
        <div className="picker-pop absolute left-0 top-full z-20 mt-2 w-full overflow-hidden rounded-[12px] border border-white/10 bg-[#0f0f0f] py-1 shadow-[0_18px_50px_rgba(0,0,0,0.6)]">
          {rows.map((p, i) => (
            <button
              key={p}
              type="button"
              onMouseEnter={() => setActive(i)}
              onClick={() => pick(p)}
              className={`flex w-full items-center gap-2 px-4 py-2 text-left text-[14px] transition-colors ${
                i === active ? 'bg-white/10 text-white' : 'text-[#c4c4c4] hover:bg-white/[0.06]'
              }`}
            >
              <span className="shrink-0 text-[#7a7a7a]"><PinIcon /></span>
              <span className="truncate">{p}</span>
            </button>
          ))}
          {loading && (
            <div className="px-4 py-2 text-[13px] text-[#7a7a7a]">Searching…</div>
          )}
        </div>
      )}
    </div>
  );
}
