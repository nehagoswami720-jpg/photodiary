import { useRef } from 'react';

// Screen 1 — the empty / resting state: the dashed upload container.
// Calls onFile(file) when a photo is dropped or chosen.
export default function EmptyState({ onFile }) {
  const inputRef = useRef(null);

  return (
    <label
      className="flex h-[340px] w-[620px] max-w-[90vw] cursor-pointer flex-col items-center justify-center gap-1 rounded-[6px] border border-dashed border-[#525252] px-[28.57px] py-[36.56px]"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        onFile(e.dataTransfer.files?.[0]);
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*,.heic,.heif"
        className="hidden"
        onChange={(e) => onFile(e.target.files?.[0])}
      />
      <img src="/camera.svg" alt="" className="h-[120px] w-[210px]" />
      <p
        className="w-[360px] max-w-full text-center text-[24px] leading-[28px] tracking-[-1.2px] text-[#333]"
        style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif', fontWeight: 300 }}
      >
        Start uploading your favorite
        <br />
        moments
      </p>
    </label>
  );
}
