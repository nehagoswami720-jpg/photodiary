import { useState } from 'react';
import DateField from '../components/DateField.jsx';
import TimeField from '../components/TimeField.jsx';

// Manual entry — screen 2: the form. The user adds the place / date / time the
// photo didn't carry, then Submit builds the card. All fields optional — only
// what's entered is shown (nothing invented). Date & time use native pickers so
// the value is exactly what the user chose (no ambiguous text parsing).
// Tokens from Figma 136:301, scaled to match the invitation screen.
const HELVETICA = '"Helvetica Neue", Helvetica, Arial, sans-serif';
const fieldClass =
  'w-full border-b border-[#c4c4c4] bg-transparent pb-1.5 text-[15px] tracking-[-0.3px] ' +
  'text-[#333] outline-none placeholder:italic placeholder:text-[#767676] focus:border-[#767676]';

export default function ManualForm({ imageUrl, onSubmit }) {
  const [place, setPlace] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit({ place: place.trim() || null, date: date || null, time: time || null });
  }

  return (
    <form onSubmit={handleSubmit} className="card-in flex flex-col items-center gap-9">
      <img
        src={imageUrl}
        alt=""
        className="block h-auto w-auto object-contain"
        style={{ maxWidth: 'min(430px, 88vw)', maxHeight: '34vh' }}
      />

      <div className="flex w-[min(430px,88vw)] flex-col gap-4" style={{ fontFamily: HELVETICA, fontWeight: 300 }}>
        <input
          type="text"
          value={place}
          onChange={(e) => setPlace(e.target.value)}
          placeholder="add a place"
          className={fieldClass}
        />
        <div className="flex justify-between gap-6">
          <DateField value={date} onChange={setDate} />
          <TimeField value={time} onChange={setTime} />
        </div>
      </div>

      <button
        type="submit"
        className="mt-2 cursor-pointer whitespace-nowrap bg-[#111] px-[22px] py-[13px] text-[18px] tracking-[-0.9px] text-white"
        style={{ fontFamily: HELVETICA, fontWeight: 400 }}
      >
        Submit
      </button>
    </form>
  );
}
