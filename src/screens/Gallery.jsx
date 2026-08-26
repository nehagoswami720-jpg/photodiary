import { useEffect, useMemo } from 'react';
import MomentCard from '../components/MomentCard.jsx';

// The diary — a masonry grid of every saved moment, newest first. Content
// scrolls under a soft bottom fade; a floating "add a moment" launches the
// upload flow. (Grouping into albums and tapping a moment come later.)
const HELVETICA = '"Helvetica Neue", Helvetica, Arial, sans-serif';

export default function Gallery({ entries, onAddMoment }) {
  // one object URL per photo blob; revoked when the set changes / on unmount
  const urls = useMemo(() => entries.map((e) => URL.createObjectURL(e.photoBlob)), [entries]);
  useEffect(() => () => urls.forEach((u) => URL.revokeObjectURL(u)), [urls]);

  return (
    <div className="w-full">
      <div className="mx-auto max-w-[1000px] px-6 pb-44 pt-4">
        <div className="columns-2 [column-gap:1.5rem] md:columns-3">
          {entries.map((e, i) => (
            <MomentCard
              key={e.id}
              place={e.place}
              capturedAt={e.capturedAt}
              showTime={e.showTime}
              imageUrl={urls[i]}
            />
          ))}
        </div>
      </div>

      {/* soft bottom fade — the grid scrolls under it and reveals as you scroll */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-10 h-36 bg-gradient-to-t from-white via-white/90 to-transparent" />

      {/* floating "add a moment" (a hidden file input) */}
      <div className="fixed inset-x-0 bottom-9 z-20 flex justify-center">
        <label
          className="flex cursor-pointer items-center gap-1.5 rounded-full bg-[#111] px-6 py-3 text-[15px] text-white shadow-[0_8px_30px_rgba(0,0,0,0.18)] transition-colors hover:bg-black"
          style={{ fontFamily: HELVETICA }}
        >
          <span className="text-[17px] leading-none">+</span> add a moment
          <input
            type="file"
            accept="image/*,.heic,.heif"
            className="hidden"
            onChange={(e) => onAddMoment(e.target.files?.[0])}
          />
        </label>
      </div>
    </div>
  );
}
