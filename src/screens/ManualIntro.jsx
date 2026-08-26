// Manual entry — screen 1: the invitation. Shown after upload when the place
// couldn't be detected. Offers "Add the details" (→ the form, built next) or
// "Skip" (→ show the photo-only card).
//
// This screen uses the EXACT Figma tokens (136:277) — it is deliberately NOT
// scaled like the other screens. Photo stays uncropped (never-crop principle),
// sized to the Figma's 430px width.
const HELVETICA = '"Helvetica Neue", Helvetica, Arial, sans-serif';

export default function ManualIntro({ imageUrl, onAddDetails, onSkip }) {
  return (
    <div className="card-in flex max-w-[88vw] flex-col items-center gap-12">
      <div className="flex flex-col items-center gap-12">
        <img
          src={imageUrl}
          alt=""
          className="block h-auto w-auto object-contain"
          style={{ maxWidth: 'min(430px, 88vw)', maxHeight: '38vh' }}
        />
        <div className="flex max-w-full flex-col items-center gap-2 text-center">
          <p
            className="text-[32px] leading-[41px] tracking-[-1.6px] text-[#333]"
            style={{ fontFamily: HELVETICA, fontWeight: 400 }}
          >
            This moment came without its story.
          </p>
          <p
            className="max-w-[448px] text-[20px] leading-[26px] tracking-[-1px] text-[#595959]"
            style={{ fontFamily: HELVETICA, fontWeight: 300 }}
          >
            Some photos don&apos;t remember where or when they were taken. You can add it, if you
            like.
          </p>
        </div>
      </div>

      <div className="flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={onAddDetails}
          className="cursor-pointer whitespace-nowrap bg-[#111] px-[24px] py-[16px] text-[24px] leading-[41px] tracking-[-1.2px] text-white"
          style={{ fontFamily: HELVETICA, fontWeight: 400 }}
        >
          Add the details
        </button>
        <button
          type="button"
          onClick={onSkip}
          className="cursor-pointer text-[20px] leading-[41px] tracking-[-1px] text-[#1c1c1c] underline"
          style={{ fontFamily: HELVETICA, fontWeight: 400 }}
        >
          Skip
        </button>
      </div>
    </div>
  );
}
