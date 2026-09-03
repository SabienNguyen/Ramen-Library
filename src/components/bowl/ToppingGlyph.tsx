import type { ToppingGlyph as GlyphId } from '../../../shared/ingredients'

/**
 * Hand-drawn-ish SVG glyphs for each topping. All share a 60×60 viewBox and
 * are meant to be read at 24–60px, so shapes stay chunky.
 */
export function ToppingGlyph({ glyph, className }: { glyph: GlyphId; className?: string }) {
  return (
    <svg viewBox="0 0 60 60" className={className} aria-hidden>
      {glyphs[glyph]}
    </svg>
  )
}

const glyphs: Record<GlyphId, React.ReactNode> = {
  chashu: (
    <g>
      <circle cx="30" cy="30" r="26" fill="#e7b6a2" />
      <circle cx="30" cy="30" r="26" fill="none" stroke="#7a3b2a" strokeWidth="3" />
      <path d="M30 4a26 26 0 0 1 26 26" fill="none" stroke="#c9584a" strokeWidth="6" strokeLinecap="round" opacity=".7" />
      <path d="M16 20c8 6 8 14 0 22" fill="none" stroke="#f6d9cc" strokeWidth="5" strokeLinecap="round" />
      <path d="M30 14c6 8 6 24 0 32" fill="none" stroke="#f6d9cc" strokeWidth="4" strokeLinecap="round" opacity=".8" />
      <circle cx="30" cy="30" r="5" fill="#b56a56" />
    </g>
  ),
  ajitama: (
    <g>
      <ellipse cx="30" cy="30" rx="26" ry="20" fill="#fff4dc" />
      <ellipse cx="30" cy="30" rx="26" ry="20" fill="none" stroke="#b0743a" strokeWidth="2.5" />
      <ellipse cx="30" cy="31" rx="14" ry="11" fill="#f2a12e" />
      <ellipse cx="27" cy="28" rx="7" ry="5" fill="#ffcf5e" opacity=".9" />
    </g>
  ),
  nori: (
    <g>
      <rect x="10" y="4" width="40" height="52" rx="2" fill="#1f2b22" />
      <rect x="13" y="7" width="34" height="46" rx="1" fill="none" stroke="#3b5a45" strokeWidth="1.5" opacity=".8" />
      <path d="M16 14h28M16 24h28M16 34h28M16 44h28" stroke="#2f4636" strokeWidth="1.2" opacity=".7" />
    </g>
  ),
  scallion: (
    <g fill="#6fc26b" stroke="#2e6b2f" strokeWidth="2">
      <circle cx="18" cy="20" r="8" />
      <circle cx="40" cy="16" r="7" />
      <circle cx="30" cy="36" r="9" />
      <circle cx="46" cy="42" r="6" />
      <circle cx="14" cy="44" r="6" />
      <g fill="#d6f2c9" stroke="none">
        <circle cx="18" cy="20" r="3" />
        <circle cx="40" cy="16" r="2.5" />
        <circle cx="30" cy="36" r="3.5" />
        <circle cx="46" cy="42" r="2" />
        <circle cx="14" cy="44" r="2" />
      </g>
    </g>
  ),
  menma: (
    <g fill="#e2b463" stroke="#9c6b1f" strokeWidth="2" strokeLinejoin="round">
      <path d="M6 30l40-20 8 6-40 22z" />
      <path d="M10 46l38-16 6 8-38 16z" />
      <path d="M12 12l32 6-2 8-32-4z" opacity=".9" />
    </g>
  ),
  corn: (
    <g fill="#ffd23f" stroke="#c98d0b" strokeWidth="1.5">
      <circle cx="16" cy="18" r="6" />
      <circle cx="32" cy="14" r="6" />
      <circle cx="46" cy="24" r="6" />
      <circle cx="22" cy="34" r="6" />
      <circle cx="40" cy="40" r="6" />
      <circle cx="14" cy="48" r="6" />
      <circle cx="30" cy="50" r="6" />
    </g>
  ),
  naruto: (
    <g>
      <path d="M30 4c14 0 26 10 26 26S44 56 30 56 4 46 4 30 16 4 30 4z" fill="#fff8ec" stroke="#e59ab0" strokeWidth="2.5" />
      <path d="M10 30c0-11 9-20 20-20s20 9 20 20-9 20-20 20" fill="none" stroke="#f26d94" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M30 14c8 0 14 6 14 14s-6 14-14 14" fill="none" stroke="#f26d94" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M30 22c4 0 7 3 7 7" fill="none" stroke="#f26d94" strokeWidth="3.5" strokeLinecap="round" />
    </g>
  ),
  butter: (
    <g>
      <rect x="10" y="16" width="40" height="30" rx="3" fill="#ffe08a" stroke="#d9a520" strokeWidth="2" />
      <rect x="10" y="16" width="40" height="10" rx="3" fill="#fff0bb" />
      <ellipse cx="30" cy="50" rx="22" ry="5" fill="#ffd45c" opacity=".5" />
    </g>
  ),
  sprouts: (
    <g fill="none" stroke="#efe7c8" strokeWidth="3" strokeLinecap="round">
      <path d="M8 44c12-6 22-16 34-30" />
      <path d="M12 52c14-8 26-14 40-26" />
      <path d="M6 30c10-2 20-8 30-20" />
      <path d="M20 56c8-10 20-16 32-20" />
      <g fill="#f7e9a8" stroke="#c9b25c" strokeWidth="1.5">
        <circle cx="42" cy="14" r="3.5" />
        <circle cx="52" cy="26" r="3.5" />
        <circle cx="36" cy="10" r="3" />
      </g>
    </g>
  ),
  kikurage: (
    <g fill="#3b2a26" stroke="#1c1210" strokeWidth="1.5">
      <path d="M8 24c6-10 18-12 26-6 4 4 10 2 16 6-8 2-10 10-6 16-8-2-14 2-18 8-2-8-10-10-16-6 2-6 0-12-2-18z" />
      <path d="M22 26c6-2 12 0 16 6" fill="none" stroke="#6b4a44" strokeWidth="2" strokeLinecap="round" />
    </g>
  ),
  bokchoy: (
    <g>
      <path d="M18 56c-8-14-8-30 2-40 4 8 6 16 6 26 0-14 4-24 12-32 2 12 0 24-6 36 2-10 8-18 18-22-2 12-10 24-18 32z" fill="#4f9a4a" stroke="#2f6b2f" strokeWidth="2" strokeLinejoin="round" />
      <path d="M26 56c-2-14-2-24 2-34" fill="none" stroke="#dff3cf" strokeWidth="3" strokeLinecap="round" />
    </g>
  ),
  chili: (
    <g fill="none" stroke="#e0342b" strokeWidth="2.5" strokeLinecap="round">
      <path d="M6 40c10-14 22-18 40-30" />
      <path d="M10 50c14-12 28-14 44-18" />
      <path d="M4 26c14-2 26-6 40-18" />
      <path d="M22 56c8-8 18-16 32-16" />
    </g>
  ),
  garlic: (
    <g fill="#e9c57c" stroke="#9c6b1f" strokeWidth="1.5">
      <ellipse cx="18" cy="20" rx="8" ry="6" transform="rotate(-20 18 20)" />
      <ellipse cx="40" cy="18" rx="8" ry="6" transform="rotate(15 40 18)" />
      <ellipse cx="30" cy="38" rx="9" ry="6" transform="rotate(-5 30 38)" />
      <ellipse cx="46" cy="44" rx="7" ry="5" transform="rotate(30 46 44)" />
      <ellipse cx="14" cy="46" rx="7" ry="5" transform="rotate(-30 14 46)" />
    </g>
  ),
  sesame: (
    <g fill="#f5efd8" stroke="#b9a874" strokeWidth="1">
      {[
        [12, 14, -30],
        [26, 10, 20],
        [42, 16, -10],
        [16, 32, 45],
        [32, 28, -40],
        [48, 34, 15],
        [22, 48, -15],
        [40, 46, 35],
      ].map(([x, y, r], i) => (
        <ellipse key={i} cx={x} cy={y} rx="4.5" ry="2.5" transform={`rotate(${r} ${x} ${y})`} />
      ))}
    </g>
  ),
}
