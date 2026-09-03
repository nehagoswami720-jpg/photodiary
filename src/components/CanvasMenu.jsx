import { useEffect, useRef, useState } from 'react';

// Top-right menu for the canvas. The trigger is the user's own icon — three uneven,
// staggered lines that SETTLE to an even hamburger on hover and ROTATE + morph into
// an X when open. It opens a small dropdown directly below: "Upload a moment" and,
// inside a real album, "Delete album" (each slides + fades in, staggered; a dot
// appears on hover). Delete opens a confirm modal — "No, go back" returns to the
// canvas; "Yes, delete this album" removes it and lands on the home shelf.
// Design: Figma "menu UI" (262:385) + "delete modal" (265:413).
const HELVETICA = '"Helvetica Neue", Helvetica, Arial, sans-serif';
const W_FULL = 24; // line length when even / in the X
const W_SHORT = 14; // line length at rest (the uneven look)
const OFF = 7; // vertical offset of the top/bottom lines from centre

function PlusGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
function TrashGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 7h16M9 7V5.6A1.6 1.6 0 0 1 10.6 4h2.8A1.6 1.6 0 0 1 15 5.6V7M6.6 7l.7 12a2 2 0 0 0 2 1.9h5.4a2 2 0 0 0 2-1.9L18.4 7" />
    </svg>
  );
}

// The animated trigger. rest = uneven staggered lines · hover = even hamburger ·
// open = the whole glyph rotates and the lines morph into an X.
function MenuIcon({ open, hovered }) {
  const bar = 'absolute h-[2px] rounded-full bg-white';
  const trans = { transition: 'all 340ms cubic-bezier(0.4, 0, 0.2, 1)', transformOrigin: 'center' };
  const wide = open || hovered; // top & bottom lines go full-width when hovered or open
  return (
    <span
      className="relative block h-[24px] w-[24px]"
      style={{ transition: 'transform 420ms cubic-bezier(0.4, 0, 0.2, 1)', transform: open ? 'rotate(90deg)' : 'rotate(0deg)' }}
    >
      <span
        className={bar}
        style={{ ...trans, top: '50%', left: 0, width: wide ? W_FULL : W_SHORT, transform: open ? 'translateY(-50%) rotate(45deg)' : `translateY(calc(-50% - ${OFF}px))` }}
      />
      <span
        className={bar}
        style={{ ...trans, top: '50%', left: 0, width: W_FULL, opacity: open ? 0 : 1, transform: 'translateY(-50%)' }}
      />
      <span
        className={bar}
        style={{ ...trans, top: '50%', right: 0, width: wide ? W_FULL : W_SHORT, transform: open ? 'translateY(-50%) rotate(-45deg)' : `translateY(calc(-50% + ${OFF}px))` }}
      />
    </span>
  );
}

// One dropdown row: leading dot (fades in on hover) + icon + label; slides left on hover.
function MenuItem({ icon, label, onClick, delay }) {
  return (
    <div className="menu-item-in" style={{ animationDelay: `${delay}ms` }}>
      <button
        type="button"
        onClick={onClick}
        className="group flex cursor-pointer items-center gap-2 text-[16px] tracking-[-0.8px] text-[#b5b5b5] transition-[color,transform] duration-200 hover:-translate-x-1 hover:text-white"
      >
        <span className="h-[5px] w-[5px] -translate-x-1 rounded-full bg-white opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100" />
        {icon}
        {label}
      </button>
    </div>
  );
}

export default function CanvasMenu({ onUpload, onDeleteAlbum, rightInset, top }) {
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [modal, setModal] = useState(false);
  const rootRef = useRef(null);
  const fileRef = useRef(null);

  // click outside / Esc closes the dropdown
  useEffect(() => {
    if (!open) return;
    function onDoc(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    }
    function onKey(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('pointerdown', onDoc);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDoc);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <>
      <div ref={rootRef} className="fixed z-40 flex flex-col items-end" style={{ right: rightInset, top }}>
        <button
          type="button"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((o) => !o)}
          onPointerEnter={() => setHovered(true)}
          onPointerLeave={() => setHovered(false)}
          className="pointer-events-auto flex cursor-pointer items-center justify-center p-3 text-white"
        >
          <MenuIcon open={open} hovered={hovered} />
        </button>

        {open && (
          <div className="mt-1 flex flex-col items-end gap-2" style={{ fontFamily: HELVETICA }}>
            <MenuItem
              icon={<PlusGlyph />}
              label="Upload a moment"
              delay={0}
              onClick={() => {
                setOpen(false);
                fileRef.current?.click();
              }}
            />
            {onDeleteAlbum && (
              <MenuItem
                icon={<TrashGlyph />}
                label="Delete album"
                delay={70}
                onClick={() => {
                  setOpen(false);
                  setModal(true);
                }}
              />
            )}
          </div>
        )}
      </div>

      {/* hidden file input shared by "Upload a moment" */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*,.heic,.heif"
        multiple
        className="hidden"
        onChange={(e) => onUpload(e.target.files)}
      />

      {modal && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/55 px-6 backdrop-blur-sm"
          onPointerDown={(e) => {
            if (e.target === e.currentTarget) setModal(false);
          }}
        >
          <div
            className="modal-in flex max-w-[560px] flex-col items-center gap-8 bg-[#0f0f0f] px-16 py-14 text-center"
            style={{ fontFamily: HELVETICA }}
          >
            <p className="text-[24px] leading-[1.35] tracking-[-1.2px] text-white">
              Are you sure you want to delete this album?
            </p>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setModal(false)}
                className="cursor-pointer border-[0.5px] border-white px-4 py-2 text-[16px] tracking-[-0.8px] text-white transition-colors hover:bg-white/10"
              >
                No, go back
              </button>
              <button
                type="button"
                onClick={() => {
                  setModal(false);
                  onDeleteAlbum();
                }}
                className="cursor-pointer border border-[#c20000] bg-[#c12424] px-4 py-2 text-[16px] tracking-[-0.8px] text-white transition-colors hover:bg-[#d62a2a]"
              >
                Yes, delete this album
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
