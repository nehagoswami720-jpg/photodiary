import { useEffect, useMemo } from 'react';
import MomentCard from '../components/MomentCard.jsx';
import { PlusIcon } from '../components/icons.jsx';

// The diary — a masonry grid of every saved moment, newest first. Content
// scrolls under a soft bottom fade; "Upload a moment" launches the upload flow.
// Spacing per the designer's tokens: 36px between columns, 48px between rows
// (on the cell, see MomentCard), 128px from the title to the grid.
const HELVETICA = '"Helvetica Neue", Helvetica, Arial, sans-serif';

export default function Gallery({ entries, onAddMoment }) {
  // one object URL per photo blob; revoked when the set changes / on unmount
  const urls = useMemo(() => entries.map((e) => URL.createObjectURL(e.photoBlob)), [entries]);
  useEffect(() => () => urls.forEach((u) => URL.revokeObjectURL(u)), [urls]);

  return (
    <div className="w-full">
      <div className="mx-auto max-w-[1000px] px-6 pb-44 pt-32">
        <div className="columns-2 [column-gap:36px] md:columns-3">
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

      {/* soft bottom fade — the grid gently dissolves and reveals as you scroll */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-10 h-40 bg-gradient-to-t from-white to-transparent" />

      {/* "Upload a moment" (a hidden file input), matching the Figma button */}
      <div className="fixed inset-x-0 bottom-10 z-20 flex justify-center">
        <label
          className="flex cursor-pointer items-center gap-2 bg-[#111] px-[22px] py-3 text-[18px] tracking-[-0.9px] text-white shadow-[0_6px_24px_rgba(0,0,0,0.16)] transition-colors hover:bg-black"
          style={{ fontFamily: HELVETICA, fontWeight: 400 }}
        >
          <PlusIcon /> Upload a moment
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
