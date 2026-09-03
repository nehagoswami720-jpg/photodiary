// Manual entry — screen 1: the invitation. Shown after upload when the place
// couldn't be detected. Offers "Add the details" (→ the form, built next) or
// "Skip" (→ show the photo-only card). Photo is uncropped, sized smaller than
// the hero card so the whole composition fits. Tokens from Figma 136:277,
// scaled to match the app; the button matches the error button's treatment.
const HELVETICA = '"Helvetica Neue", Helvetica, Arial, sans-serif';

export default function ManualIntro({ imageUrl, onAddDetails, onSkip }) {
  return (
    <div className="card-in flex w-full max-w-[88vw] flex-col items-center gap-9">
      <div className="flex flex-col items-center gap-9">
        <img
          src={imageUrl}
          alt=""
          className="block h-auto w-auto object-contain"
          style={{ maxWidth: 'min(430px, 88vw)', maxHeight: '34vh' }}
        />
        <div className="flex flex-col items-center gap-2 text-center">
          <p
            className="text-[24px] leading-[1.3] tracking-[-0.8px] text-[#eaeaea]"
            style={{ fontFamily: HELVETICA, fontWeight: 300 }}
          >
            This moment came without its story.
          </p>
          <p
            className="max-w-[340px] text-[15px] leading-[1.3] tracking-[0.15px] text-[#9a9a9a]"
            style={{ fontFamily: HELVETICA, fontWeight: 400 }}
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
          className="cursor-pointer whitespace-nowrap bg-white px-[22px] py-[13px] text-[18px] tracking-[-0.9px] text-[#050506] transition-colors hover:bg-[#e6e6e6]"
          style={{ fontFamily: HELVETICA, fontWeight: 400 }}
        >
          Add the details
        </button>
        <button
          type="button"
          onClick={onSkip}
          className="cursor-pointer text-[15px] tracking-[-0.75px] text-white underline transition-opacity hover:opacity-80"
          style={{ fontFamily: HELVETICA, fontWeight: 300 }}
        >
          Skip
        </button>
      </div>
    </div>
  );
}
