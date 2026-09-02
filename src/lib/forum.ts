import { FORUM_CATEGORIES } from '../../shared/bowl'

/** One colour per category, so the forum scans at a glance. */
export const categoryStyle: Record<string, { chip: string; dot: string }> = {
  general: { chip: 'bg-[oklch(0.93_0.03_250)] text-[oklch(0.4_0.09_250)]', dot: 'bg-[oklch(0.6_0.12_250)]' },
  recipes: { chip: 'bg-primary/12 text-primary', dot: 'bg-primary' },
  technique: { chip: 'bg-[oklch(0.93_0.04_300)] text-[oklch(0.42_0.12_300)]', dot: 'bg-[oklch(0.6_0.14_300)]' },
  show: { chip: 'bg-accent text-accent-foreground', dot: 'bg-[oklch(0.8_0.15_85)]' },
  regional: { chip: 'bg-scallion/15 text-scallion', dot: 'bg-scallion' },
}

export const categoryLabel = (id: string) => FORUM_CATEGORIES.find((c) => c.id === id)?.label ?? id
export const categoryBlurb = (id: string) => FORUM_CATEGORIES.find((c) => c.id === id)?.blurb
