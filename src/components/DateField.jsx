import { useEffect, useRef, useState } from 'react';
import { CalendarIcon, Caret } from './icons.jsx';

// A custom, elegant date field + calendar popover (replaces the native date
// input so it matches the app's aesthetic). Value is "YYYY-MM-DD" — same shape
// the native input produced, so no parsing guesswork downstream.
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];
const DOW = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const HELVETICA = '"Helvetica Neue", Helvetica, Arial, sans-serif';

const pad = (n) => String(n).padStart(2, '0');
const toYMD = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;

export default function DateField({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [dropUp, setDropUp] = useState(false);
  const rootRef = useRef(null);
  const selected = value ? parseYMD(value) : null;
  const [view, setView] = useState(() => (selected ? { y: selected.y, m: selected.m } : nowYM()));

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => rootRef.current && !rootRef.current.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  function toggle() {
    if (!open) {
      setView(selected ? { y: selected.y, m: selected.m } : nowYM());
      const rect = rootRef.current.getBoundingClientRect();
      setDropUp(window.innerHeight - rect.bottom < 330); // flip up if no room below
    }
    setOpen((o) => !o);
  }

  const firstDay = new Date(view.y, view.m, 1).getDay();
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();
  const cells = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  const today = new Date();
  const display = selected ? `${selected.d} ${MONTHS[selected.m].slice(0, 3)} ${selected.y}` : null;

  return (
    <div ref={rootRef} className="relative w-full" style={{ fontFamily: HELVETICA }}>
      <button
        type="button"
        onClick={toggle}
        className={`flex w-full items-center gap-2.5 rounded-[12px] px-4 py-2.5 text-left text-[15px] transition-colors ${
          open ? 'bg-[#ececeb]' : 'bg-[#f3f3f2] hover:bg-[#ececeb]'
        }`}
      >
        <span className="text-[#8a8a8a]"><CalendarIcon /></span>
        <span className={display ? 'text-[#333]' : 'text-[#8a8a8a]'}>{display || 'Add a date'}</span>
        <span className="ml-auto text-[#aaa]"><Caret open={open} /></span>
      </button>

      {open && (
        <div
          className={`picker-pop absolute left-0 z-20 w-[264px] rounded-xl border border-[#eee] bg-white p-3 shadow-[0_12px_40px_rgba(0,0,0,0.12)] ${
            dropUp ? 'bottom-full mb-3' : 'top-full mt-3'
          }`}
        >
          <div className="mb-2 flex items-center justify-between">
            <Arrow dir="‹" onClick={() => setView(step(view, -1))} />
            <span className="text-[14px] text-[#333]">{MONTHS[view.m]} {view.y}</span>
            <Arrow dir="›" onClick={() => setView(step(view, 1))} />
          </div>
          <div className="grid grid-cols-7 gap-y-1 text-center">
            {DOW.map((d, i) => (
              <div key={i} className="pb-1 text-[11px] tracking-wide text-[#aaa]">{d}</div>
            ))}
            {cells.map((d, i) =>
              d === null ? (
                <div key={i} />
              ) : (
                <div key={i} className="flex justify-center">
                  <button
                    type="button"
                    onClick={() => {
                      onChange(toYMD(view.y, view.m, d));
                      setOpen(false);
                    }}
                    className={dayClass(view, d, selected, today)}
                  >
                    {d}
                  </button>
                </div>
              ),
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Arrow({ dir, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-7 w-7 items-center justify-center rounded-full text-[18px] leading-none text-[#767676] transition-colors hover:bg-[#f2f2f2] hover:text-[#111]"
    >
      {dir}
    </button>
  );
}

function dayClass(view, d, selected, today) {
  const isSel = selected && selected.y === view.y && selected.m === view.m && selected.d === d;
  const isToday =
    today.getFullYear() === view.y && today.getMonth() === view.m && today.getDate() === d;
  const base =
    'flex h-8 w-8 items-center justify-center rounded-full text-[13px] transition-all duration-150';
  if (isSel) return `${base} bg-[#111] text-white`;
  if (isToday) return `${base} bg-[#f4f4f4] text-[#111] hover:bg-[#ebebeb]`;
  return `${base} text-[#333] hover:bg-[#f2f2f2]`;
}

function parseYMD(v) {
  const [y, m, d] = v.split('-').map(Number);
  return { y, m: m - 1, d };
}
function nowYM() {
  const n = new Date();
  return { y: n.getFullYear(), m: n.getMonth() };
}
function step({ y, m }, delta) {
  const total = y * 12 + m + delta;
  return { y: Math.floor(total / 12), m: ((total % 12) + 12) % 12 };
}
