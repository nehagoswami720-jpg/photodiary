import { useState } from 'react';
import DateField from '../components/DateField.jsx';
import TimeField from '../components/TimeField.jsx';
import { PinIcon } from '../components/icons.jsx';

// Manual entry — screen 2: the form. The user adds the place / date / time the
// photo didn't carry, then Submit builds the card. All fields optional — only
// what's entered is shown (nothing invented). Date & time use custom pickers so
// the value is exactly what the user chose (no ambiguous text parsing). Fields
// are soft-filled pills with line icons (place / date / time).
const HELVETICA = '"Helvetica Neue", Helvetica, Arial, sans-serif';

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

      <div className="flex w-[min(430px,88vw)] flex-col gap-3" style={{ fontFamily: HELVETICA, fontWeight: 400 }}>
        <label className="flex items-center gap-2.5 rounded-[12px] bg-[#f3f3f2] px-4 py-2.5 text-[15px] transition-colors focus-within:bg-[#ececeb]">
          <span className="text-[#8a8a8a]"><PinIcon /></span>
          <input
            type="text"
            value={place}
            onChange={(e) => setPlace(e.target.value)}
            placeholder="Add a place"
            className="w-full bg-transparent text-[#333] outline-none placeholder:text-[#8a8a8a]"
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
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
