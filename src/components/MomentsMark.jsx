// The homepage wordmark: "moments" + the tagline, in Cormorant Garamond Light for a
// cinematic, elegant feel (tagline in light italic). Left-aligned on the album
// shelf; pass `centered` for the canvas.
export default function MomentsMark({ centered = false }) {
  return (
    <div className={centered ? 'text-center' : ''} style={{ fontFamily: '"Cormorant Garamond", serif' }}>
      <p className="text-[32px] leading-[1.05] tracking-[-0.5px] text-white" style={{ fontWeight: 300 }}>
        moments
      </p>
      <p className="mt-0.5 text-[20px] italic leading-none tracking-[0.2px] text-[#9a9a9a]" style={{ fontWeight: 300 }}>
        a little home for your memories.
      </p>
    </div>
  );
}
