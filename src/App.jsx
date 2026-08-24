import { useRef } from 'react';

// Screen 1 — Empty State (built to match the Figma "Moments- Empty State",
// scaled down for real browser viewport sizes).
// The upload container is the drop / click target; later screens (loading,
// card, manual entry, error) get wired in as we build them.
export default function App() {
  const inputRef = useRef(null);

  function onFiles(fileList) {
    const file = fileList?.[0];
    if (!file) return;
    // Next screen (loading) is not built yet — nothing happens on select for now.
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-white">
      <h1
        className="mt-12 whitespace-nowrap text-[64px] leading-none tracking-[-0.64px] text-[#1a1a1a]"
        style={{ fontFamily: '"DM Serif Text", serif' }}
        aria-label="Moments"
      >
        <span className="title-breathe inline-block">
          {'MOMENTS'.split('').map((letter, i) => (
            <span
              key={i}
              className="title-letter"
              style={{ animationDelay: `${i * 0.09}s` }}
              aria-hidden="true"
            >
              {letter}
            </span>
          ))}
        </span>
      </h1>

      <div className="flex w-full flex-1 items-center justify-center">
        <label
          className="flex h-[340px] w-[620px] max-w-[90vw] cursor-pointer flex-col items-center justify-center gap-1 rounded-[6px] border border-dashed border-[#525252] px-7 py-9"
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
            className="hidden"
            onChange={(e) => onFiles(e.target.files)}
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
      </div>
    </div>
  );
}
