import { useId } from 'react'
import type { CoverTemplateId } from '../../../shared/bowl'
import { brothColors } from '@/lib/bowl-colors'
import { mix } from '@/lib/color'
import { cn } from '@/lib/utils'
import type { Bowl } from '@/store/bowl'
import { BowlCanvas } from '@/components/bowl/BowlCanvas'

export type CoverSource = { bowl: Bowl; imageUrl?: string | null; thumbUrl?: string | null; templateId?: string | null; name?: string }

/**
 * The picture for a build: an uploaded photo, an illustrated template tinted
 * to the broth, or the live procedural render. Always 4:3.
 */
export function BuildCover({ build, variant = 'thumb', className, alt }: { build: CoverSource; variant?: 'thumb' | 'full'; className?: string; alt?: string }) {
  const src = variant === 'thumb' ? (build.thumbUrl ?? build.imageUrl) : (build.imageUrl ?? build.thumbUrl)
  if (src) return <img src={src} alt={alt ?? build.name ?? ''} loading="lazy" className={cn('aspect-[4/3] w-full object-cover', className)} />
  const id = (build.templateId ?? 'live') as CoverTemplateId
  if (id !== 'live') return <CoverTemplate id={id} bowl={build.bowl} name={build.name} className={cn('aspect-[4/3] w-full', className)} />
  return (
    <div className={cn('grain flex aspect-[4/3] w-full items-center justify-center bg-[radial-gradient(ellipse_at_50%_35%,oklch(0.97_0.02_85),oklch(0.93_0.03_80))]', className)}>
      <BowlCanvas bowl={build.bowl} className="h-full w-auto max-w-[70%]" />
    </div>
  )
}

export function CoverTemplate({ id, bowl, name, className }: { id: Exclude<CoverTemplateId, 'live'>; bowl: Bowl; name?: string; className?: string }) {
  const c = brothColors(bowl)
  const uid = useId().replace(/:/g, '')
  const common = { className: cn('block', className), viewBox: '0 0 640 480', preserveAspectRatio: 'xMidYMid slice' as const, 'aria-hidden': true }
  switch (id) {
    case 'topdown':
      return <TopDown c={c} uid={uid} bowl={bowl} {...common} />
    case 'chopsticks':
      return <NoodleLift c={c} uid={uid} {...common} />
    case 'noren':
      return <Noren c={c} name={name} {...common} />
    case 'waves':
      return <Waves c={c} name={name} uid={uid} {...common} />
  }
}

type C = ReturnType<typeof brothColors>
type SvgProps = React.SVGProps<SVGSVGElement>

function TopDown({ c, uid, bowl, ...p }: { c: C; uid: string; bowl: Bowl } & SvgProps) {
  const hasEgg = bowl.toppings.some((t) => t.toppingId === 'ajitama')
  const hasNori = bowl.toppings.some((t) => t.toppingId === 'nori')
  const hasChashu = bowl.toppings.some((t) => t.toppingId === 'chashu')
  return (
    <svg {...p}>
      <rect width="640" height="480" fill="#f6efe2" />
      <circle cx="320" cy="250" r="230" fill="#ece3d3" />
      <circle cx="320" cy="240" r="200" fill="#fbf8f1" />
      <circle cx="320" cy="240" r="200" fill="none" stroke="#c8442a" strokeWidth="10" />
      <circle cx="320" cy="240" r="176" fill="#e6dccb" />
      <radialGradient id={`${uid}-b`} cx="45%" cy="40%" r="60%">
        <stop offset="0" stopColor={c.surface} />
        <stop offset="1" stopColor={c.deep} />
      </radialGradient>
      <circle cx="320" cy="240" r="164" fill={`url(#${uid}-b)`} opacity={Math.max(0.75, c.opacity)} />
      <g fill="none" stroke={c.noodle} strokeWidth="9" strokeLinecap="round">
        {[0, 1, 2, 3, 4].map((i) => (
          <path key={i} d={`M ${200 + i * 12} ${180 + i * 28} c 40 -30 80 30 120 0 s 80 -30 110 10`} transform={`rotate(${i * 9} 320 240)`} opacity={0.95 - i * 0.08} />
        ))}
      </g>
      {hasChashu && (
        <g transform="translate(250 290)">
          <circle r="42" fill="#e7b6a2" stroke="#7a3b2a" strokeWidth="4" />
          <path d="M-20 -10c14 10 14 22 0 32" fill="none" stroke="#f6d9cc" strokeWidth="7" strokeLinecap="round" />
        </g>
      )}
      {hasEgg && (
        <g transform="translate(395 300) rotate(-20)">
          <ellipse rx="34" ry="24" fill="#fff4dc" stroke="#b0743a" strokeWidth="3" />
          <ellipse rx="17" ry="13" fill="#f2a12e" />
        </g>
      )}
      {hasNori && <rect x="378" y="118" width="46" height="70" rx="3" fill="#1f2b22" transform="rotate(18 401 153)" />}
      <g fill="#6fc26b" stroke="#2e6b2f" strokeWidth="2">
        <circle cx="300" cy="215" r="7" />
        <circle cx="330" cy="200" r="6" />
        <circle cx="350" cy="235" r="7" />
      </g>
      <g stroke="#9a6a3a" strokeWidth="11" strokeLinecap="round">
        <path d="M470 60 L610 300" />
        <path d="M500 40 L640 280" />
      </g>
    </svg>
  )
}

function NoodleLift({ c, uid, ...p }: { c: C; uid: string } & SvgProps) {
  return (
    <svg {...p}>
      <rect width="640" height="480" fill="#fbf4e4" />
      <g transform="translate(320 300)" stroke="#f3d98a" strokeWidth="26" opacity="0.5">
        {Array.from({ length: 18 }, (_, i) => (
          <path key={i} d="M0 0 L0 -520" transform={`rotate(${i * 20})`} />
        ))}
      </g>
      <radialGradient id={`${uid}-b`} cx="50%" cy="35%" r="60%">
        <stop offset="0" stopColor={c.surface} />
        <stop offset="1" stopColor={c.deep} />
      </radialGradient>
      <ellipse cx="320" cy="450" rx="190" ry="20" fill="#7a5a3a" opacity="0.18" />
      <path d="M130 300 Q150 430 260 432 L380 432 Q490 430 510 300 Z" fill="#f2ece1" />
      <ellipse cx="320" cy="300" rx="196" ry="66" fill="#f7f2e8" stroke="#c8442a" strokeWidth="8" />
      <ellipse cx="320" cy="300" rx="176" ry="54" fill={`url(#${uid}-b)`} />
      <g fill="none" stroke={c.noodle} strokeWidth="8" strokeLinecap="round">
        <path d="M250 290 c40 -8 60 12 100 0" />
        <path d="M230 306 c50 -10 80 14 150 2" />
        {[0, 1, 2, 3].map((i) => (
          <path key={i} d={`M ${300 + i * 14} 296 C ${290 + i * 10} 220, ${340 + i * 8} 180, ${330 + i * 6} 110`} />
        ))}
      </g>
      <g stroke="#a26b3c" strokeWidth="10" strokeLinecap="round">
        <path d="M330 118 L392 -10" />
        <path d="M350 122 L420 0" />
      </g>
      <g fill="none" stroke="#b7a690" strokeWidth="6" strokeLinecap="round" opacity="0.6">
        <path d="M200 220 c-14 -18 14 -30 0 -50" />
        <path d="M440 210 c-14 -18 14 -30 0 -50" />
      </g>
    </svg>
  )
}

function Noren({ c, name, ...p }: { c: C; name?: string } & SvgProps) {
  const ink = mix(c.deep, '#1c2a44', 0.55)
  const chars = ['ら', 'ー', 'め', 'ん']
  return (
    <svg {...p}>
      <rect width="640" height="480" fill="#f4ead8" />
      <rect x="0" y="0" width="640" height="34" fill="#8a5a34" />
      <rect x="0" y="34" width="640" height="8" fill="#6b4324" />
      {chars.map((ch, i) => (
        <g key={i} transform={`translate(${20 + i * 152} 42)`}>
          <path d={`M0 0 H140 V${330 + (i % 2) * 12} Q70 ${350 + (i % 2) * 12} 0 ${330 + (i % 2) * 12} Z`} fill={ink} />
          <text x="70" y="150" textAnchor="middle" fontSize="92" fill="#fbf6ea" fontFamily="'Hiragino Sans','Noto Sans JP',sans-serif" fontWeight="700">
            {ch}
          </text>
        </g>
      ))}
      <circle cx="320" cy="300" r="70" fill="#fbf6ea" />
      <circle cx="320" cy="300" r="58" fill={c.surface} />
      <circle cx="320" cy="300" r="58" fill="none" stroke="#c8442a" strokeWidth="6" />
      <path d="M280 298 c14 -10 26 10 40 0 s26 -10 40 0" fill="none" stroke={c.noodle} strokeWidth="6" strokeLinecap="round" />
      {name && (
        <g>
          <rect x="150" y="410" width="340" height="44" rx="22" fill="#fbf6ea" stroke="#d9c9a8" strokeWidth="2" />
          <text x="320" y="439" textAnchor="middle" fontSize="21" fill="#5a4630" fontFamily="Nunito,sans-serif" fontWeight="700">
            {name.slice(0, 30)}
          </text>
        </g>
      )}
    </svg>
  )
}

function Waves({ c, name, uid, ...p }: { c: C; name?: string; uid: string } & SvgProps) {
  const a = mix(c.surface, '#ffffff', 0.35)
  const b = mix(c.deep, '#ffffff', 0.15)
  return (
    <svg {...p}>
      <defs>
        <pattern id={`${uid}-w`} width="80" height="40" patternUnits="userSpaceOnUse">
          <rect width="80" height="40" fill={a} />
          <g fill="none" stroke={b} strokeWidth="3">
            <circle cx="40" cy="40" r="36" />
            <circle cx="40" cy="40" r="26" />
            <circle cx="40" cy="40" r="16" />
            <circle cx="0" cy="20" r="36" />
            <circle cx="0" cy="20" r="26" />
            <circle cx="0" cy="20" r="16" />
            <circle cx="80" cy="20" r="36" />
            <circle cx="80" cy="20" r="26" />
            <circle cx="80" cy="20" r="16" />
          </g>
        </pattern>
      </defs>
      <rect width="640" height="480" fill={`url(#${uid}-w)`} />
      <circle cx="320" cy="230" r="118" fill="#fbf6ea" stroke="#c8442a" strokeWidth="8" />
      <ellipse cx="320" cy="240" rx="86" ry="52" fill={c.surface} />
      <ellipse cx="320" cy="240" rx="86" ry="52" fill="none" stroke={c.deep} strokeWidth="4" />
      <path d="M255 236 c20 -14 40 14 65 0 s45 -14 65 0" fill="none" stroke={c.noodle} strokeWidth="7" strokeLinecap="round" />
      <ellipse cx="350" cy="226" rx="16" ry="11" fill="#fff4dc" stroke="#b0743a" strokeWidth="2" />
      <ellipse cx="350" cy="226" rx="8" ry="6" fill="#f2a12e" />
      <rect x="270" y="196" width="22" height="34" rx="2" fill="#1f2b22" />
      {name && (
        <g>
          <rect x="140" y="376" width="360" height="52" rx="26" fill="#fbf6ea" stroke={c.deep} strokeWidth="3" />
          <text x="320" y="410" textAnchor="middle" fontSize="24" fill="#4a3826" fontFamily="Nunito,sans-serif" fontWeight="700">
            {name.slice(0, 28)}
          </text>
        </g>
      )}
    </svg>
  )
}
