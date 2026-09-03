import { useState } from 'react';
import DateField from '../components/DateField.jsx';
import TimeField from '../components/TimeField.jsx';
import { PinIcon } from '../components/icons.jsx';

// The "came without its story" deck — shown after a multi-photo upload for the
// photos whose place couldn't be detected. Step through them with ‹ › arrows,
// filling place / date / time for each (all optional; nothing invented). Date &
// time are pre-filled from the photo's own EXIF when it had them. "Add to diary"
// saves the WHOLE batch (these + the auto-detected ones) at once; "Cancel"
// discards everything (nothing was saved yet).
const HELVETICA = '"Helvetica Neue", Helvetica, Arial, sans-serif';
const pad = (n) => String(n).padStart(2, '0');
const toYMD = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const toHM = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

export default function ManualDeck({ items, onDone, onCancel }) {
  const [i, setI] = useState(0);
  // one {place,date,time} per photo — date/time pre-filled from EXIF if present
  const [values, setValues] = useState(() =>
    items.map((it) => ({
      place: '',
      date: it.capturedAt instanceof Date ? toYMD(it.capturedAt) : '',
      time: it.capturedAt instanceof Date ? toHM(it.capturedAt) : '',
    })),
  );

  const it = items[i];
  const v = values[i];
  const set = (patch) => setValues((vs) => vs.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));

  return (
    <div className="card-in flex w-full max-w-[88vw] flex-col items-center gap-7">
      <div className="flex flex-col items-center gap-2 text-center">
        <p className="text-[24px] leading-[1.3] tracking-[-0.2px] text-[#eaeaea]" style={{ fontFamily: HELVETICA, fontWeight: 300 }}>
          This moment came without its story.
        </p>
        <p className="max-w-[360px] text-[15px] leading-[1.3] tracking-[0.15px] text-[#c4c4c4]" style={{ fontFamily: HELVETICA, fontWeight: 300 }}>
          A few photos don&apos;t remember where or when they were taken. Add what you like — step
          through them below.
        </p>
      </div>

      <img
        src={it.imageUrl}
        alt=""
        className="block h-auto w-auto object-contain"
        style={{ maxWidth: 'min(400px, 86vw)', maxHeight: '30vh' }}
      />

      {/* ‹  2 of 3  › */}
      <div className="flex items-center gap-5" style={{ fontFamily: HELVETICA }}>
        <Arrow dir="‹" disabled={i === 0} onClick={() => setI((n) => Math.max(0, n - 1))} />
        <span className="text-[14px] tracking-[0.3px] text-[#8f8f8f]">
          {i + 1} of {items.length}
        </span>
        <Arrow dir="›" disabled={i === items.length - 1} onClick={() => setI((n) => Math.min(items.length - 1, n + 1))} />
      </div>

      <div className="flex w-[min(430px,88vw)] flex-col gap-3" style={{ fontFamily: HELVETICA, fontWeight: 400 }}>
        <label className="flex items-center gap-2.5 rounded-[12px] bg-white/[0.06] px-4 py-2.5 text-[15px] transition-colors focus-within:bg-white/[0.1]">
          <span className="text-[#8a8a8a]"><PinIcon /></span>
          <input
            type="text"
            value={v.place}
            onChange={(e) => set({ place: e.target.value })}
            placeholder="Add a place"
            className="w-full bg-transparent text-[#eaeaea] outline-none placeholder:text-[#8a8a8a]"
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          {/* keyed by index so the pickers reset to the current photo's values */}
          <DateField key={`d${i}`} value={v.date} onChange={(date) => set({ date })} />
          <TimeField key={`t${i}`} value={v.time} onChange={(time) => set({ time })} />
        </div>
      </div>

      <div className="mt-1 flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={() => onDone(values)}
          className="cursor-pointer whitespace-nowrap bg-white px-[22px] py-[13px] text-[18px] tracking-[-0.9px] text-[#050506] transition-colors hover:bg-[#e6e6e6]"
          style={{ fontFamily: HELVETICA, fontWeight: 400 }}
        >
          Add to diary
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="cursor-pointer text-[15px] tracking-[-0.2px] text-white transition-opacity hover:opacity-80"
          style={{ fontFamily: HELVETICA, fontWeight: 300 }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function Arrow({ dir, disabled, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex h-9 w-9 items-center justify-center rounded-full text-[22px] leading-none transition-colors ${
        disabled ? 'cursor-default text-[#3a3a3a]' : 'text-[#c9c9c9] hover:bg-white/10 hover:text-white'
      }`}
    >
      {dir}
    </button>
  );
}
