import React from 'react';

/**
 * Decorative background for the login screen.
 * Static, CSS/SVG only, no image files. Sits behind the card.
 *
 * Usage: make the page wrapper `relative overflow-hidden`, then render
 * <LoginBackground /> as its FIRST child. The card stays on top.
 */

// One weight plate: rim, grip ring, inner rings, centre hole.
const Plate: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 600 600" fill="none" stroke="currentColor" aria-hidden="true" className={className}>
    <circle cx="300" cy="300" r="290" strokeWidth="16" />
    <circle cx="300" cy="300" r="262" strokeWidth="2" />
    <circle cx="300" cy="300" r="215" strokeWidth="22" strokeDasharray="3 13" />
    <circle cx="300" cy="300" r="165" strokeWidth="2" />
    <circle cx="300" cy="300" r="120" strokeWidth="6" />
    <circle cx="300" cy="300" r="52" strokeWidth="12" />
  </svg>
);

type Kind = 'dumbbell' | 'kettlebell' | 'stopwatch' | 'barbell' | 'shaker' | 'spark';

// Line-art doodles on a 100x100 canvas.
const shapes: Record<Kind, React.ReactNode> = {
  dumbbell: (
    <>
      <path d="M30 50H70" />
      <rect x="21" y="32" width="9" height="36" rx="2" />
      <rect x="11" y="39" width="10" height="22" rx="2" />
      <rect x="70" y="32" width="9" height="36" rx="2" />
      <rect x="79" y="39" width="10" height="22" rx="2" />
      <path d="M5 50H11M89 50H95" />
    </>
  ),
  kettlebell: (
    <>
      <path d="M35 40C33 12 67 12 65 40" />
      <path d="M30 47C20 62 26 87 50 87C74 87 80 62 70 47C62 40 38 40 30 47Z" />
      <path d="M37 59C35 66 37 72 41 77" />
      <path d="M40 87H60" />
    </>
  ),
  stopwatch: (
    <>
      <circle cx="50" cy="57" r="28" />
      <path d="M43 20H57M50 20V29" />
      <path d="M50 57V41M50 57L61 63" />
      <path d="M73 34L79 28" />
      <path d="M50 32V34M75 57H73M50 82V80M25 57H27" />
    </>
  ),
  barbell: (
    <>
      <path d="M4 50H96" />
      <rect x="22" y="24" width="9" height="52" rx="3" />
      <rect x="31" y="33" width="6" height="34" rx="2" />
      <rect x="69" y="24" width="9" height="52" rx="3" />
      <rect x="63" y="33" width="6" height="34" rx="2" />
      <path d="M42 44V56M58 44V56" />
    </>
  ),
  shaker: (
    <>
      <rect x="38" y="9" width="24" height="11" rx="3" />
      <path d="M34 26H66L70 37V86Q70 92 64 92H36Q30 92 30 86V37Z" />
      <path d="M38 52H62M38 62H55M30 37H70" />
    </>
  ),
  spark: (
    <>
      <path d="M50 14V86M14 50H86" />
      <path d="M26 26L74 74M74 26L26 74" strokeWidth="1.5" />
    </>
  ),
};

// [kind, left %, top %, size px (desktop), rotation deg, tone]
type Item = [Kind, number, number, number, number, 'ink' | 'lime'];

const items: Item[] = [
  // top band
  ['dumbbell', 2, 3, 92, -12, 'lime'],
  ['spark', 15, 4, 28, 0, 'ink'],
  ['stopwatch', 20, 9, 64, 14, 'ink'],
  ['kettlebell', 34, 2, 80, 8, 'ink'],
  ['spark', 46, 7, 30, 0, 'lime'],
  ['shaker', 52, 3, 70, -9, 'lime'],
  ['barbell', 64, 8, 110, 5, 'ink'],
  ['spark', 78, 3, 34, 0, 'lime'],
  ['stopwatch', 84, 7, 76, 12, 'ink'],
  ['dumbbell', 94, 5, 70, 18, 'lime'],
  // upper middle
  ['barbell', 4, 24, 104, 9, 'ink'],
  ['spark', 17, 27, 26, 0, 'lime'],
  ['kettlebell', 90, 22, 84, -10, 'lime'],
  ['spark', 80, 28, 28, 0, 'ink'],
  ['shaker', 12, 38, 74, -14, 'lime'],
  ['dumbbell', 88, 38, 96, 8, 'ink'],
  // middle band
  ['stopwatch', 2, 50, 70, -6, 'lime'],
  ['spark', 19, 52, 30, 0, 'ink'],
  ['kettlebell', 93, 52, 76, 12, 'ink'],
  ['spark', 82, 56, 26, 0, 'lime'],
  ['barbell', 6, 63, 100, -8, 'ink'],
  ['shaker', 86, 66, 80, 14, 'lime'],
  // lower band
  ['dumbbell', 16, 72, 84, 10, 'lime'],
  ['spark', 5, 78, 30, 0, 'lime'],
  ['kettlebell', 3, 86, 88, -8, 'ink'],
  ['stopwatch', 22, 86, 66, 12, 'ink'],
  ['spark', 31, 80, 28, 0, 'lime'],
  ['barbell', 33, 91, 104, -5, 'lime'],
  ['shaker', 47, 85, 72, 11, 'ink'],
  ['spark', 56, 92, 30, 0, 'ink'],
  ['dumbbell', 60, 83, 90, -14, 'lime'],
  ['kettlebell', 74, 88, 80, 6, 'ink'],
  ['spark', 70, 78, 26, 0, 'lime'],
  ['stopwatch', 83, 80, 70, -10, 'lime'],
  ['barbell', 90, 90, 98, 9, 'ink'],
  ['spark', 95, 74, 28, 0, 'ink'],
];

const tones = {
  ink: 'text-slate-500 opacity-30 dark:text-white dark:opacity-[0.12]',
  lime: 'text-lime-600 opacity-40 dark:text-lime-400 dark:opacity-[0.18]',
};

const LoginBackground: React.FC = () => (
  <div
    aria-hidden="true"
    className="pointer-events-none absolute inset-0 -z-10 overflow-hidden bg-slate-100 dark:bg-slate-950"
  >
    {/* Fine grid, fades out toward the edges */}
    <div
      className="absolute inset-0 text-slate-400 opacity-20 dark:text-white dark:opacity-[0.06]"
      style={{
        backgroundImage:
          'linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        WebkitMaskImage: 'radial-gradient(ellipse at center, black 25%, transparent 72%)',
        maskImage: 'radial-gradient(ellipse at center, black 25%, transparent 72%)',
      }}
    />

    {/* Big plates bleeding off two corners */}
    <Plate className="absolute -bottom-40 -right-40 h-[34rem] w-[34rem] text-lime-500 opacity-20 dark:opacity-[0.10] md:-bottom-56 md:-right-48 md:h-[46rem] md:w-[46rem]" />
    <Plate className="absolute -left-28 -top-28 h-80 w-80 text-emerald-600 opacity-15 dark:opacity-[0.08] md:-left-36 md:-top-36 md:h-[26rem] md:w-[26rem]" />

    {/* Soft light on the floor behind the card */}
    <div className="absolute left-1/2 top-1/2 h-[28rem] w-[44rem] max-w-full -translate-x-1/2 -translate-y-1/2 rounded-full bg-lime-300/30 blur-3xl dark:bg-lime-400/10" />

    {/* Gym equipment doodles scattered across the whole screen.
        Sizes scale down on small screens. The card covers the middle ones. */}
    {items.map(([kind, left, top, size, rot, tone], i) => (
      <svg
        key={i}
        viewBox="0 0 100 100"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`absolute ${tones[tone]}`}
        style={{
          left: `${left}%`,
          top: `${top}%`,
          width: `clamp(${Math.round(size * 0.45)}px, ${size / 14}vw, ${size}px)`,
          height: `clamp(${Math.round(size * 0.45)}px, ${size / 14}vw, ${size}px)`,
          transform: `rotate(${rot}deg)`,
        }}
      >
        {shapes[kind]}
      </svg>
    ))}
  </div>
);

export default LoginBackground;
