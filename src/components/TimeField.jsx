import { useEffect, useRef, useState } from 'react';
import { ClockIcon, Caret } from './icons.jsx';

// A custom time field + popover (replaces the native time input). Value is
// "HH:MM" (24h) — same shape the native input produced. Three quiet columns:
// hour, minute, AM/PM.
const HELVETICA = '"Helvetica Neue", Helvetica, Arial, sans-serif';
const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);
const pad = (n) => String(n).padStart(2, '0');

export default function TimeField({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [dropUp, setDropUp] = useState(false);
  const rootRef = useRef(null);
  const parsed = value ? parseHM(value) : null;
  // working selection (defaults used only once the user starts picking)
  const cur = parsed || { h12: 12, min: 0, period: 'PM' };

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => rootRef.current && !rootRef.current.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  function toggle() {
    if (!open) {
      const rect = rootRef.current.getBoundingClientRect();
      setDropUp(window.innerHeight - rect.bottom < 210);
    }
    setOpen((o) => !o);
  }

  function set(next) {
    const s = { ...cur, ...next };
    const h24 = s.period === 'PM' ? (s.h12 % 12) + 12 : s.h12 % 12;
    onChange(`${pad(h24)}:${pad(s.min)}`);
  }

  const display = parsed ? `${parsed.h12}:${pad(parsed.min)} ${parsed.period}` : null;

  return (
    <div ref={rootRef} className="relative w-full" style={{ fontFamily: HELVETICA }}>
      <button
        type="button"
        onClick={toggle}
        className={`flex w-full items-center gap-2.5 rounded-[12px] px-4 py-2.5 text-left text-[15px] transition-colors ${
          open ? 'bg-white/[0.1]' : 'bg-white/[0.06] hover:bg-white/[0.1]'
        }`}
      >
        <span className="text-[#8a8a8a]"><ClockIcon /></span>
        <span className={display ? 'text-[#eaeaea]' : 'text-[#8a8a8a]'}>{display || 'Add a time'}</span>
        <span className="ml-auto text-[#8a8a8a]"><Caret open={open} /></span>
      </button>

      {open && (
        <div
          className={`picker-pop absolute left-0 z-20 flex w-[220px] gap-1 rounded-xl border border-white/10 bg-[#0f0f0f] p-2 shadow-[0_18px_50px_rgba(0,0,0,0.6)] ${
            dropUp ? 'bottom-full mb-3' : 'top-full mt-3'
          }`}
        >
          <Column items={HOURS} selected={cur.h12} render={(h) => h} onPick={(h) => set({ h12: h })} />
          <Column items={MINUTES} selected={cur.min} render={(m) => pad(m)} onPick={(m) => set({ min: m })} />
          <Column items={['AM', 'PM']} selected={cur.period} render={(p) => p} onPick={(p) => set({ period: p })} wide />
        </div>
      )}
    </div>
  );
}

function Column({ items, selected, render, onPick, wide }) {
  const ref = useRef(null);
  // center the selected row within this column only (never scroll the page)
  useEffect(() => {
    const container = ref.current;
    const el = container?.querySelector('[data-selected="true"]');
    if (container && el) {
      container.scrollTop = el.offsetTop - container.clientHeight / 2 + el.clientHeight / 2;
    }
  }, []);
  return (
    <div
      ref={ref}
      className={`relative h-[168px] overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
        wide ? 'w-[52px]' : 'flex-1'
      }`}
    >
      {items.map((it) => {
        const isSel = it === selected;
        return (
          <button
            key={String(it)}
            type="button"
            data-selected={isSel}
            onClick={() => onPick(it)}
            className={`block w-full rounded-md py-1.5 text-center text-[14px] transition-all duration-150 ${
              isSel ? 'bg-white text-[#050506]' : 'text-[#b5b5b5] hover:bg-white/10 hover:text-white'
            }`}
          >
            {render(it)}
          </button>
        );
      })}
    </div>
  );
}

function parseHM(v) {
  const [h, m] = v.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return { h12, min: m, period };
}
