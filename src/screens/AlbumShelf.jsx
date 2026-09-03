import { useEffect, useMemo, useRef } from 'react';
import SparkleCursor from '../components/SparkleCursor.jsx';
import MomentsMark from '../components/MomentsMark.jsx';

// The home shelf: album covers in a front-facing horizontal row. The cover nearest
// the centre takes the spotlight — tallest & full opacity — and covers shrink and
// dim symmetrically toward the edges. Endless horizontal scroll (two-finger wheel),
// covers follow the finger with inertia; scroll VELOCITY adds a travelling vertical
// wave (the snake). Hovering a cover lifts it. All DOM + CSS; one rAF loop mutates
// transforms directly. (Design: Figma "new homepage".)
const HELVETICA = '"Helvetica Neue", Helvetica, Arial, sans-serif';
const BG = '#050506';

const COVER_W = 267; // constant cover width (keeps the 32px gaps exact)
const GAP = 16;
const STEP = COVER_W + GAP; // centre-to-centre horizontal spacing
const H_MAX = 400; // centre (spotlit) cover height — dominant
const H_FALLOFF = 0.2; // height lost per step from centre (sides shrink faster)
const H_MIN = 0.35; // floor as a fraction of H_MAX (sides can get smaller)
const OP_FALLOFF = 0.42; // opacity lost per step from centre (sides fade to black faster)
const BASELINE = 0.72; // cover bottoms sit here (fraction of viewport height)

// On hover the cover lifts by exactly (gap + label height) so the revealed label's
// bottom lands on the other covers' baseline.
const LABEL_GAP = 16; // gap between the image and the label
const LABEL_H = 50; // label block height (location + count)
const HOVER_UP = LABEL_GAP + LABEL_H;

// velocity-driven travelling wave (vertical bob)
const WAVE_K = 900; // speed → amplitude
const WAVE_MAX = 130; // px cap
const WAVE_FREQ = 0.7; // spatial frequency along the row
const WAVE_SPEED = 0.4; // crawl as you scroll

const PARALLAX_X = 52; // px the whole row drifts toward the cursor (x)
const PARALLAX_Y = 32; // (y)
const ENTER_DUR = 520; // ms per-cover entrance
const ENTER_STAGGER = 70; // ms delay per step from centre
const ENTER_RISE = 46; // px covers rise from on entrance

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const mod = (a, n) => ((a % n) + n) % n;
const easeOut = (p) => 1 - Math.pow(1 - p, 3);

// average colour of an image (downscaled to 16×16), boosted a touch so the glow
// reads on the near-black background
function avgColor(url) {
  return new Promise((res) => {
    const img = new Image();
    img.onload = () => {
      try {
        const c = document.createElement('canvas');
        c.width = 16;
        c.height = 16;
        const ctx = c.getContext('2d');
        ctx.drawImage(img, 0, 0, 16, 16);
        const d = ctx.getImageData(0, 0, 16, 16).data;
        // saturation-weighted average → the vivid dominant hue, not a muddy grey
        let r = 0;
        let g = 0;
        let b = 0;
        let w = 0;
        for (let i = 0; i < d.length; i += 4) {
          const pr = d[i];
          const pg = d[i + 1];
          const pb = d[i + 2];
          const wt = (Math.max(pr, pg, pb) - Math.min(pr, pg, pb)) + 6; // colourful pixels count more
          r += pr * wt;
          g += pg * wt;
          b += pb * wt;
          w += wt;
        }
        r /= w;
        g /= w;
        b /= w;
        // boost saturation around the tone's mean, then lift brightness a touch
        const mean = (r + g + b) / 3;
        const sat = 1.85;
        const bright = (v) => Math.min(255, Math.max(0, (mean + (v - mean) * sat) * 1.1 + 12));
        res([bright(r), bright(g), bright(b)]);
      } catch {
        res([40, 40, 55]);
      }
    };
    img.onerror = () => res([40, 40, 55]);
    img.src = url;
  });
}

export default function AlbumShelf({ albums, onOpen, onUpload }) {
  const rootRef = useRef(null);
  const cardRefs = useRef([]);
  const scroll = useRef(0); // scroll position (unbounded — the row loops)
  const smooth = useRef(0); // eased scroll
  const vel = useRef(0); // per-frame change in smooth (drives the wave)
  const waveAmp = useRef(0); // eased wave amplitude
  const scrollVel = useRef(0); // wheel velocity with inertia
  const imgRefs = useRef([]); // image wrappers (height set per frame)
  const imgElRefs = useRef([]); // the <img> elements (for the Ken Burns drift)
  const labelRefs = useRef([]); // per-cover labels (revealed on hover)
  const hoverTarget = useRef([]);
  const hoverLift = useRef([]);
  const rowRef = useRef(null); // the covers container (cursor parallax)
  const glowRef = useRef(null); // ambient colour halo behind the centre cover
  const glowRGB = useRef([30, 30, 40]); // eased glow colour
  const par = useRef({ x: 0, y: 0 }); // eased parallax
  const parTarget = useRef({ x: 0, y: 0 }); // cursor-driven parallax target
  const enterStart = useRef(0); // entrance-animation start time
  const kbCenter = useRef(-1); // which card currently holds the centre (Ken Burns)
  const kbStart = useRef(0); // when it entered the centre
  const colorsRef = useRef([]); // dominant [r,g,b] per album cover (read in the loop)

  const covers = useMemo(
    () => albums.map((a) => (a.cover?.photoBlob instanceof Blob ? URL.createObjectURL(a.cover.photoBlob) : null)),
    [albums],
  );
  useEffect(() => () => covers.forEach((u) => u && URL.revokeObjectURL(u)), [covers]);

  // extract each cover's dominant colour (a tiny 16×16 average) for the ambient glow
  useEffect(() => {
    let cancelled = false;
    Promise.all(covers.map((u) => (u ? avgColor(u) : Promise.resolve([30, 30, 40])))).then((cs) => {
      if (!cancelled) colorsRef.current = cs;
    });
    return () => {
      cancelled = true;
    };
  }, [covers]);

  // enough duplicate sets to fill the visible row and loop seamlessly
  const cardList = useMemo(() => {
    const n = albums.length;
    if (!n) return [];
    const copies = Math.max(2, Math.ceil(9 / n) + 1);
    const list = [];
    for (let c = 0; c < copies; c++)
      for (let i = 0; i < n; i++) list.push({ album: albums[i], cover: covers[i], num: i + 1 });
    return list;
  }, [albums, covers]);
  const P = cardList.length;

  useEffect(() => {
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    enterStart.current = performance.now();
    const nAlb = albums.length;
    let raf;
    function frame() {
      const now = performance.now();
      scroll.current += scrollVel.current;
      scrollVel.current *= 0.935;
      // snap the nearest cover into the centre "bucket" as the flick decays (so only
      // ONE cover ever holds the centre); the pull fades in as velocity drops
      const snapEase = 0.14 * clamp(1 - Math.abs(scrollVel.current) / 0.01, 0, 1);
      scroll.current += (Math.round(scroll.current) - scroll.current) * snapEase;
      const prev = smooth.current;
      smooth.current += (scroll.current - smooth.current) * (reduced ? 1 : 0.1);
      vel.current = smooth.current - prev;
      const targetAmp = reduced ? 0 : clamp(Math.abs(vel.current) * WAVE_K, 0, WAVE_MAX);
      waveAmp.current += (targetAmp - waveAmp.current) * 0.08;
      const amp = waveAmp.current;

      const vh = window.innerHeight;
      const hMax = Math.min(H_MAX, vh * 0.52);
      const baseY = vh * BASELINE;

      // cursor parallax: the whole row drifts toward the cursor (eased)
      par.current.x += (parTarget.current.x - par.current.x) * 0.06;
      par.current.y += (parTarget.current.y - par.current.y) * 0.06;
      if (rowRef.current) rowRef.current.style.transform = `translate3d(${par.current.x}px, ${par.current.y}px, 0)`;

      // which card holds the centre — restart Ken Burns when it changes
      const centerCard = mod(Math.round(smooth.current), P);
      if (centerCard !== kbCenter.current) {
        kbCenter.current = centerCard;
        kbStart.current = now;
      }
      const elapsedEnter = now - enterStart.current;

      for (let i = 0; i < cardRefs.current.length; i++) {
        const el = cardRefs.current[i];
        if (!el) continue;
        // centre the visible window on t = 0
        const t = mod(i - smooth.current + P / 2, P) - P / 2;
        const at = Math.abs(t);

        const h = hMax * clamp(1 - H_FALLOFF * at, H_MIN, 1);
        let op = clamp(1 - OP_FALLOFF * at, 0, 1);
        const wave = Math.sin(t * WAVE_FREQ + smooth.current * WAVE_SPEED) * amp;

        const lift = (hoverLift.current[i] || 0) + ((hoverTarget.current[i] || 0) - (hoverLift.current[i] || 0)) * 0.16;
        hoverLift.current[i] = lift;

        // staggered entrance, rippling out from the centre
        let enterRise = 0;
        if (!reduced) {
          const e = easeOut(clamp((elapsedEnter - at * ENTER_STAGGER) / ENTER_DUR, 0, 1));
          op *= e;
          enterRise = (1 - e) * ENTER_RISE;
        }

        const x = t * STEP - COVER_W / 2;
        const y = baseY - h + wave - lift * HOVER_UP + enterRise;
        el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
        el.style.opacity = op;
        el.style.zIndex = String(Math.round(1000 - at * 10));
        el.style.pointerEvents = op > 0.25 ? 'auto' : 'none';
        const imgEl = imgRefs.current[i];
        if (imgEl) imgEl.style.height = `${h}px`;
        const labelEl = labelRefs.current[i];
        if (labelEl) labelEl.style.opacity = String(lift);

        // Ken Burns: a slow zoom + drift on the centred cover only
        const pic = imgElRefs.current[i];
        if (pic) {
          if (i === centerCard && !reduced) {
            const s = (now - kbStart.current) / 1000;
            const scale = 1 + Math.min(s * 0.01, 0.11);
            pic.style.transform = `scale(${scale}) translate(${Math.sin(s * 0.16) * 9}px, ${Math.cos(s * 0.12) * 6}px)`;
          } else {
            pic.style.transform = '';
          }
        }
      }

      // ambient glow: ease toward the centred album's colour, parked behind centre
      const centerAlb = nAlb ? mod(Math.round(smooth.current), nAlb) : 0;
      const target = colorsRef.current[centerAlb] || [30, 30, 40];
      const gc = glowRGB.current;
      gc[0] += (target[0] - gc[0]) * 0.05;
      gc[1] += (target[1] - gc[1]) * 0.05;
      gc[2] += (target[2] - gc[2]) * 0.05;
      if (glowRef.current) {
        glowRef.current.style.background = `radial-gradient(closest-side, rgba(${gc[0] | 0},${gc[1] | 0},${gc[2] | 0},0.4), transparent)`;
        glowRef.current.style.transform = `translate3d(calc(-50% + ${par.current.x * 0.5}px), ${par.current.y * 0.5}px, 0)`;
      }
      raf = requestAnimationFrame(frame);
    }
    frame();
    return () => cancelAnimationFrame(raf);
  }, [P, albums]);

  // Two-finger scroll moves the row; one-finger is just for hover/click. Non-passive
  // so preventDefault() blocks Chrome's swipe navigation.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const onWheel = (e) => {
      e.preventDefault();
      scrollVel.current += (e.deltaX + e.deltaY) * 0.0016; // either axis; follows the finger
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  // cursor parallax: 1-finger movement sets a subtle drift target for the whole row
  function onParallax(e) {
    parTarget.current.x = (e.clientX / window.innerWidth - 0.5) * 2 * PARALLAX_X;
    parTarget.current.y = (e.clientY / window.innerHeight - 0.5) * 2 * PARALLAX_Y;
  }

  return (
    <div
      ref={rootRef}
      onPointerMove={onParallax}
      className="fixed inset-0 select-none overflow-hidden"
      style={{ background: BG, width: '100vw', height: '100vh', overscrollBehavior: 'none' }}
    >
      <SparkleCursor />

      {/* ambient colour glow behind the spotlit cover (colour eased in the loop) */}
      <div
        ref={glowRef}
        className="pointer-events-none absolute left-1/2 z-0"
        style={{ top: '14%', width: 'min(1100px, 78vw)', height: '620px', filter: 'blur(120px)' }}
      />

      <div ref={rowRef} className="absolute left-1/2 top-0 z-10">
        {cardList.map(({ album: a, cover, num }, i) => (
          <button
            key={i}
            ref={(el) => (cardRefs.current[i] = el)}
            onClick={() => onOpen(a.id)}
            onPointerEnter={() => (hoverTarget.current[i] = 1)}
            onPointerLeave={() => (hoverTarget.current[i] = 0)}
            className="absolute left-0 top-0 flex w-[267px] cursor-pointer flex-col"
            style={{ willChange: 'transform, opacity' }}
          >
            {/* typewriter index, 4px above the cover's top-left */}
            <span
              className="absolute left-0 top-0 -translate-y-[calc(100%+4px)] text-[13px] text-white/75"
              style={{ fontFamily: '"Courier Prime", monospace' }}
            >
              {num}
            </span>
            <div
              ref={(el) => (imgRefs.current[i] = el)}
              className="relative w-full shrink-0 overflow-hidden rounded-[24px] bg-[#161616]"
            >
              {cover && (
                <img
                  ref={(el) => (imgElRefs.current[i] = el)}
                  src={cover}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                  style={{ willChange: 'transform' }}
                  draggable={false}
                />
              )}
            </div>
            {/* location + moment count — revealed only while this cover is hovered,
                bottom-aligned to the other covers' baseline (via the lift above) */}
            <div
              ref={(el) => (labelRefs.current[i] = el)}
              className="flex flex-col items-center text-center"
              style={{ opacity: 0, height: LABEL_H, marginTop: LABEL_GAP }}
            >
              <p className="truncate text-[20px] leading-tight tracking-[-0.2px] text-white/95" style={{ fontFamily: '"Newsreader", serif', fontWeight: 400 }}>
                {a.place ?? a.title}
              </p>
              <p className="mt-1 text-[11px] uppercase tracking-[0.22em] text-white/45" style={{ fontFamily: HELVETICA, fontWeight: 400 }}>
                {a.moments.length} {a.moments.length === 1 ? 'moment' : 'moments'}
              </p>
            </div>
          </button>
        ))}
      </div>

      {/* homepage wordmark + tagline, top-left (Figma "new homepage") */}
      <div className="caption-in pointer-events-none fixed left-[clamp(18px,3.2vw,54px)] top-[56px] z-20">
        <MomentsMark />
      </div>

      {/* upload trigger: a plus icon in the top-right corner (same spot as the
          canvas menu); clicking it opens the file picker → the upload flow */}
      <label
        aria-label="Upload a moment"
        className="pointer-events-auto fixed right-[40px] top-[40px] z-40 flex cursor-pointer items-center justify-center p-3 text-white transition-opacity hover:opacity-70"
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
        <input
          type="file"
          accept="image/*,.heic,.heif"
          multiple
          className="hidden"
          onChange={(e) => onUpload(e.target.files)}
        />
      </label>
    </div>
  );
}
