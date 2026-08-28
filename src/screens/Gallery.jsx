import { useEffect, useMemo } from 'react';
import MomentCard from '../components/MomentCard.jsx';
import AlbumHeader from '../components/AlbumHeader.jsx';
import { PlusIcon } from '../components/icons.jsx';
import { groupIntoAlbums } from '../lib/albums.js';

// The diary — moments auto-grouped into albums by gaps in time and location
// (see lib/albums.js). Each album is a header + its own masonry grid. Content
// scrolls under a soft bottom fade; "Upload a moment" launches the upload flow.
// Spacing per the designer's tokens: 36px between columns, 24px between rows
// (on the cell, see MomentCard), 128px from the title to the grid.
const HELVETICA = '"Helvetica Neue", Helvetica, Arial, sans-serif';

export default function Gallery({ entries, onAddMoment }) {
  // one object URL per photo blob, keyed by entry id (stable across albums);
  // revoked when the set changes / on unmount
  const urlById = useMemo(() => {
    const map = new Map();
    for (const e of entries) map.set(e.id, URL.createObjectURL(e.photoBlob));
    return map;
  }, [entries]);
  useEffect(() => () => urlById.forEach((u) => URL.revokeObjectURL(u)), [urlById]);

  const albums = useMemo(() => groupIntoAlbums(entries), [entries]);

  return (
    <div className="w-full">
      <div className="mx-auto max-w-[1000px] px-6 pb-44 pt-32">
        {albums.map((album) => (
          <section key={album.id} className="mb-20">
            <AlbumHeader place={album.place} title={album.title} />
            <div className="columns-2 [column-gap:36px] md:columns-3">
              {album.moments.map((m) => (
                <MomentCard
                  key={m.id}
                  place={m.place}
                  capturedAt={m.capturedAt}
                  showTime={m.showTime}
                  imageUrl={urlById.get(m.id)}
                />
              ))}
            </div>
          </section>
        ))}
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
