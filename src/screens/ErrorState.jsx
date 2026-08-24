// Screen — the error state: the bar stops partway in red, an honest message,
// and a button to start over. Bar sits at the same position as the loading bar
// (button is an absolute overlay below) so loading -> error doesn't jump.
export default function ErrorState({ percent = 25, onRetry }) {
  return (
    <div className="relative flex w-[620px] max-w-[90vw] flex-col gap-2">
      {/* bar stopped partway, in red (#de0000) */}
      <div className="h-[8px] w-full bg-[#d9d9d9]">
        <div className="error-fill h-full bg-[#de0000]" style={{ width: `${percent}%` }} />
      </div>
      <div
        className="flex items-center justify-between py-1 text-[18px] leading-[1.7] tracking-[-0.6px] text-[#767676]"
        style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif', fontWeight: 300 }}
      >
        <span>we had trouble uploading this moment..</span>
        <span className="tabular-nums">{percent}%</span>
      </div>

      {/* retry button — absolute so it doesn't shift the bar's position */}
      <div className="absolute left-1/2 top-full mt-[58px] -translate-x-1/2">
        <button
          type="button"
          onClick={onRetry}
          className="error-btn cursor-pointer whitespace-nowrap bg-[#111] px-[22px] py-[13px] text-[18px] tracking-[-0.9px] text-white"
          style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif', fontWeight: 400 }}
        >
          Upload another moment
        </button>
      </div>
    </div>
  );
}
