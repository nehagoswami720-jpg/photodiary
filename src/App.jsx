import { useRef } from 'react';

// Screen 1 — Empty State (built to match the Figma "Moments- Empty State").
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
    <div className="flex min-h-screen flex-col items-center justify-center gap-[88px] bg-white py-12">
      <h1
        className="whitespace-nowrap text-[64px] leading-none tracking-[-0.64px] text-[#1a1a1a]"
        style={{ fontFamily: '"DM Serif Text", serif' }}
      >
        MOMENTS
      </h1>

      <label
        className="flex h-[465px] w-[868px] max-w-[90vw] cursor-pointer flex-col items-center justify-center gap-1 rounded-[6px] border border-dashed border-[#525252] px-10 py-[50px]"
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
        <img src="/camera.svg" alt="" className="h-[171px] w-[300px]" />
        <p
          className="w-[504px] max-w-full text-center text-[36px] leading-[41px] tracking-[-1.8px] text-[#333]"
          style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif', fontWeight: 300 }}
        >
          Start uploading your favorite moments
        </p>
      </label>
    </div>
  );
}
