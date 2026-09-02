import { useId, useMemo, useRef } from 'react'
import { AnimatePresence, motion, useMotionValue } from 'motion/react'
import { byId } from '@/data/ingredients'
import { darken, mix } from '@/lib/color'
import { cn } from '@/lib/utils'
import { useBowlStore, type Bowl, type PlacedTopping } from '@/store/bowl'
import { computeTotals } from '@/lib/totals'
import { ToppingGlyph } from './ToppingGlyph'

/**
 * The bowl is rendered in "bowl-space": a 400×400 box. The broth surface is an
 * ellipse centred at (200, 210). Static layers (ceramic, broth, noodles, oil)
 * are one SVG; toppings are absolutely-positioned HTML so Motion's drag works
 * without SVG transform headaches.
 */
const CX = 200
const CY = 210
const RX = 150
const RY = 92

type Props = {
  bowl: Bowl
  /** full builder mode: drag/tap toppings, steam, hover states */
  interactive?: boolean
  className?: string
}

export function BowlCanvas({ bowl, interactive = false, className }: Props) {
  const broth = bowl.brothId ? byId.broth[bowl.brothId] : null
  const tare = bowl.tareId ? byId.tare[bowl.tareId] : null
  const noodle = bowl.noodleId ? byId.noodle[bowl.noodleId] : null
  const oil = bowl.oilId ? byId.oil[bowl.oilId] : null
  const totals = computeTotals(bowl)

  const base = broth?.color ?? '#d6c6a8'
  const baseDeep = broth?.deep ?? '#b8a381'
  const surface = tare ? mix(base, tare.tint, tare.tintStrength) : base
  const deep = tare ? mix(baseDeep, tare.tint, tare.tintStrength * 0.8) : baseDeep
  const spiceTint = totals.spice > 0 ? mix(surface, '#c2321d', 0.12 * totals.spice) : surface
  const gradientId = `broth-${useId().replace(/:/g, '')}`

  const wave = noodle?.wave ?? 0
  const noodlePaths = useMemo(() => buildNoodles(wave), [wave])
  const drops = oil?.drops ?? 0
  const oilDrops = useMemo(() => seededSpots(drops, 7), [drops])
  const flakes = useMemo(() => seededSpots(totals.spice * 7, 3), [totals.spice])
  const sheen = 0.06 + (totals.richness / 100) * 0.22 + (oil ? 0.08 : 0)

  const containerRef = useRef<HTMLDivElement>(null)

  return (
    <div ref={containerRef} className={cn('relative aspect-square w-full select-none', className)}>
      <svg viewBox="0 0 400 400" className="absolute inset-0 size-full">
        <defs>
          <radialGradient id={gradientId} cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor={spiceTint} />
            <stop offset="75%" stopColor={mix(spiceTint, deep, 0.5)} />
            <stop offset="100%" stopColor={deep} />
          </radialGradient>
          <clipPath id={`${gradientId}-clip`}>
            <ellipse cx={CX} cy={CY} rx={RX - 4} ry={RY - 3} />
          </clipPath>
          <filter id={`${gradientId}-blur`}>
            <feGaussianBlur stdDeviation="2" />
          </filter>
        </defs>

        {/* table shadow */}
        <ellipse cx={CX} cy={352} rx={150} ry={16} fill="#6b5a48" opacity="0.22" filter={`url(#${gradientId}-blur)`} />

        {/* ceramic body */}
        <path
          d={`M ${CX - 172} ${CY + 6} Q ${CX - 150} ${CY + 130} ${CX - 60} ${CY + 132} L ${CX + 60} ${CY + 132} Q ${CX + 150} ${CY + 130} ${CX + 172} ${CY + 6} Z`}
          fill="#f2ece1"
        />
        <path
          d={`M ${CX - 172} ${CY + 6} Q ${CX - 150} ${CY + 130} ${CX - 60} ${CY + 132} L ${CX + 60} ${CY + 132} Q ${CX + 150} ${CY + 130} ${CX + 172} ${CY + 6} Z`}
          fill="url(#ceramic)"
          opacity="0.5"
        />
        <linearGradient id="ceramic" x1="0" x2="1">
          <stop offset="0" stopColor="#cfc4b3" />
          <stop offset="0.5" stopColor="#fbf8f2" />
          <stop offset="1" stopColor="#d8cdbb" />
        </linearGradient>
        {/* foot */}
        <rect x={CX - 60} y={CY + 130} width="120" height="10" rx="3" fill="#cdbfa9" />
        {/* rim */}
        <ellipse cx={CX} cy={CY} rx={172} ry={106} fill="#f7f2e8" />
        <ellipse cx={CX} cy={CY} rx={172} ry={106} fill="none" stroke="#c8442a" strokeWidth="6" opacity="0.9" />
        <ellipse cx={CX} cy={CY} rx={162} ry={98} fill="#e3d9c8" />
        {/* dark interior so translucent broths read as deep */}
        <ellipse cx={CX} cy={CY} rx={RX} ry={RY} fill="#c9b596" />

        {/* broth */}
        <ellipse cx={CX} cy={CY} rx={RX} ry={RY} fill={`url(#${gradientId})`} opacity={broth ? broth.opacity : 0.5} />

        {/* noodles */}
        <g clipPath={`url(#${gradientId}-clip)`}>
          <AnimatePresence mode="popLayout" initial={false}>
            {noodle && (
            <motion.g
              key={noodle.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
            >
              {noodlePaths.map((d, i) => (
                <motion.path
                  key={i}
                  d={d}
                  fill="none"
                  stroke={i % 2 ? noodle.color : darken(noodle.color, 0.12)}
                  strokeWidth={noodle.width}
                  strokeLinecap="round"
                  initial={interactive ? { pathLength: 0 } : false}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.8, delay: i * 0.04, ease: 'easeOut' }}
                />
              ))}
            </motion.g>
            )}
          </AnimatePresence>

          {/* aroma oil */}
          <AnimatePresence>
            {oilDrops.map((s, i) => (
              <motion.circle
                key={`${oil?.id}-${i}`}
                cx={CX + s.x * RX * 0.9}
                cy={CY + s.y * RY * 0.9}
                r={s.r}
                fill={oil?.color ?? 'transparent'}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 0.85 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 18, delay: i * 0.03 }}
                style={{ transformOrigin: `${CX + s.x * RX * 0.9}px ${CY + s.y * RY * 0.9}px` }}
              />
            ))}
          </AnimatePresence>

          {/* chili flakes */}
          {flakes.map((s, i) => (
            <circle key={i} cx={CX + s.x * RX * 0.95} cy={CY + s.y * RY * 0.95} r={s.r * 0.35} fill="#c8341f" opacity="0.8" />
          ))}

          {/* sheen */}
          <ellipse cx={CX - 40} cy={CY - 36} rx={70} ry={22} fill="white" opacity={sheen} filter={`url(#${gradientId}-blur)`} />
        </g>

      </svg>

      {/* toppings layer */}
      <div className="absolute inset-0">
        <AnimatePresence>
          {bowl.toppings.map((t) => (
            <PlacedToppingView key={t.key} placed={t} interactive={interactive} containerRef={containerRef} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}

function PlacedToppingView({
  placed,
  interactive,
  containerRef,
}: {
  placed: PlacedTopping
  interactive: boolean
  containerRef: React.RefObject<HTMLDivElement | null>
}) {
  const topping = byId.topping[placed.toppingId]
  const moveTopping = useBowlStore((s) => s.moveTopping)
  const removeTopping = useBowlStore((s) => s.removeTopping)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const dragged = useRef(false)
  const pct = (v: number) => `${(v / 400) * 100}%`

  return (
    <motion.div
      className={cn('absolute -translate-x-1/2 -translate-y-1/2', interactive && 'cursor-grab active:cursor-grabbing')}
      style={{ left: pct(placed.x), top: pct(placed.y), width: pct(topping.size), x, y, rotate: placed.rotation }}
      initial={{ scale: 0, opacity: 0, y: -40 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 380, damping: 22 }}
      drag={interactive}
      dragMomentum={false}
      whileDrag={{ scale: 1.12, zIndex: 10 }}
      onDragStart={() => {
        dragged.current = false
      }}
      onDrag={(_e, info) => {
        if (Math.abs(info.offset.x) + Math.abs(info.offset.y) > 4) dragged.current = true
      }}
      onTap={() => {
        if (!interactive) return
        if (dragged.current) {
          dragged.current = false
          return
        }
        removeTopping(placed.key)
      }}
      onDragEnd={() => {
        const el = containerRef.current
        if (!el) return
        const scale = 400 / el.clientWidth
        const next = clampToBroth(placed.x + x.get() * scale, placed.y + y.get() * scale)
        x.set(0)
        y.set(0)
        moveTopping(placed.key, next.x, next.y)
      }}
      title={interactive ? `${topping.name} — drag to move, tap to remove` : topping.name}
    >
      <div className="aspect-square w-full drop-shadow-[0_3px_3px_rgba(0,0,0,0.35)]">
        <ToppingGlyph glyph={topping.glyph} className="size-full" />
      </div>
    </motion.div>
  )
}


/** Keep a topping inside the broth ellipse (slightly inset). */
function clampToBroth(x: number, y: number) {
  const rx = RX - 18
  const ry = RY - 12
  const dx = (x - CX) / rx
  const dy = (y - CY) / ry
  const d = Math.sqrt(dx * dx + dy * dy)
  if (d <= 1) return { x, y }
  return { x: CX + (dx / d) * rx, y: CY + (dy / d) * ry }
}

/** Seeded pseudo-random points in the unit ellipse. */
function seededSpots(n: number, sizeBase: number) {
  const out: { x: number; y: number; r: number }[] = []
  let seed = 1234 + n * 17
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280
    return seed / 233280
  }
  for (let i = 0; i < n; i++) {
    const a = rand() * Math.PI * 2
    const r = Math.sqrt(rand())
    out.push({ x: Math.cos(a) * r, y: Math.sin(a) * r, r: sizeBase * (0.5 + rand()) })
  }
  return out
}

/** A mound of noodles across the broth surface as smooth wavy paths. */
function buildNoodles(wave: number) {
  const paths: string[] = []
  const amp = 3 + wave * 9
  for (let i = 0; i < 9; i++) {
    const baseY = CY - 30 + i * 8 + (i % 2) * 3
    const pts: [number, number][] = []
    for (let x = CX - 150; x <= CX + 150; x += 22) {
      const phase = i * 1.7 + x / (18 + wave * 6)
      pts.push([x, baseY + Math.sin(phase) * amp + Math.cos(x / 60 + i) * 6])
    }
    paths.push(catmullRom(pts))
  }
  return paths
}

function catmullRom(pts: [number, number][]) {
  if (pts.length < 2) return ''
  let d = `M ${pts[0][0]} ${pts[0][1]}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(i - 1, 0)]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[Math.min(i + 2, pts.length - 1)]
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6]
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]
    d += ` C ${c1[0].toFixed(1)} ${c1[1].toFixed(1)}, ${c2[0].toFixed(1)} ${c2[1].toFixed(1)}, ${p2[0]} ${p2[1]}`
  }
  return d
}
