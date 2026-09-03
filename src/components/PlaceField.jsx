import { useEffect, useRef, useState } from 'react';
import { PinIcon } from './icons.jsx';

// A place input with a quiet autocomplete. As you type, it suggests matching
// places you've ALREADY recorded in this diary — so a revisited spot is one tap,
// and (per the privacy principle) nothing you type ever leaves the device: the
// suggestions come purely from your own on-device entries. Free text still works.
const HELVETICA = '"Helvetica Neue", Helvetica, Arial, sans-serif';

export default function PlaceField({ value, onChange, suggestions = [], placeholder = 'Add a place' }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1); // keyboard-highlighted row
  const rootRef = useRef(null);

  const q = value.trim().toLowerCase();
  const matches = q
    ? suggestions
        .filter((p) => p.toLowerCase().includes(q) && p.toLowerCase() !== q)
        .sort((a, b) => Number(b.toLowerCase().startsWith(q)) - Number(a.toLowerCase().startsWith(q)))
        .slice(0, 6)
    : [];

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => rootRef.current && !rootRef.current.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  function pick(p) {
    onChange(p);
    setOpen(false);
    setActive(-1);
  }
  function onKeyDown(e) {
    if (!open || matches.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(matches.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === 'Enter' && active >= 0) {
      e.preventDefault();
      pick(matches[active]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

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

      {open && matches.length > 0 && (
        <div className="picker-pop absolute left-0 top-full z-20 mt-2 w-full overflow-hidden rounded-[12px] border border-white/10 bg-[#0f0f0f] py-1 shadow-[0_18px_50px_rgba(0,0,0,0.6)]">
          {matches.map((p, i) => (
            <button
              key={p}
              type="button"
              onMouseEnter={() => setActive(i)}
              onClick={() => pick(p)}
              className={`flex w-full items-center gap-2 px-4 py-2 text-left text-[14px] transition-colors ${
                i === active ? 'bg-white/10 text-white' : 'text-[#c4c4c4] hover:bg-white/[0.06]'
              }`}
            >
              <span className="text-[#7a7a7a]"><PinIcon /></span>
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
