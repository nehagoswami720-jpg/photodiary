// Shared confirm modal for destructive actions (delete album / delete photo).
// Design: Figma "delete modal" (265:425) — #0f0f0f card, 24px title, a white-
// outline "No, go back" and a red "Yes, …" confirm. Clicking the dimmed backdrop
// cancels. `title` and `confirmLabel` are supplied per use.
const HELVETICA = '"Helvetica Neue", Helvetica, Arial, sans-serif';

export default function ConfirmModal({ title, confirmLabel, onConfirm, onCancel }) {
  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/55 px-6 backdrop-blur-sm"
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        className="modal-in flex max-w-[560px] flex-col items-center gap-8 bg-[#0f0f0f] px-16 py-14 text-center"
        style={{ fontFamily: HELVETICA }}
      >
        <p className="text-[24px] leading-[1.35] tracking-[-1.2px] text-white">{title}</p>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onCancel}
            className="cursor-pointer border-[0.5px] border-white px-4 py-2 text-[16px] tracking-[-0.8px] text-white transition-colors hover:bg-white/10"
          >
            No, go back
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="cursor-pointer border border-[#c20000] bg-[#c12424] px-4 py-2 text-[16px] tracking-[-0.8px] text-white transition-colors hover:bg-[#d62a2a]"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
