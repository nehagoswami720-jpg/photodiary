import { useRef } from 'react';

// Screen 1 — the empty / resting state: the dashed upload container.
// Calls onFiles(fileList) when photos are dropped or chosen (one or many).
export default function EmptyState({ onFiles }) {
  const inputRef = useRef(null);

  return (
    <label
      className="flex h-[340px] w-[620px] max-w-[90vw] cursor-pointer flex-col items-center justify-center gap-1 rounded-[6px] border border-dashed border-white/20 px-[28.57px] py-[36.56px] transition-colors hover:border-white/35"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        onFiles(e.dataTransfer.files);
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*,.heic,.heif"
        multiple
        className="hidden"
        onChange={(e) => onFiles(e.target.files)}
      />
      <img src="/camera.svg" alt="" className="h-[120px] w-[210px] opacity-80 invert" />
      <p
        className="w-[360px] max-w-full text-center text-[24px] leading-[28px] tracking-[-1.2px] text-[#cfcfcf]"
        style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif', fontWeight: 300 }}
      >
        Start uploading your favorite
        <br />
        moments
      </p>
    </label>
  );
}
