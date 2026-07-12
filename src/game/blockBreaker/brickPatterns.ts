/**
 * Symmetric brick-row layouts: uniform horizontal rectangles, varying count per row.
 * Level 1 = full rectangle. Higher levels = diamond / pyramid / etc. silhouettes.
 */

export type LayoutName =
  | 'Rectangle'
  | 'Diamond'
  | 'Pyramid'
  | 'Hourglass'
  | 'Castle'
  | 'Wings'

const LAYOUT_CYCLE: LayoutName[] = ['Rectangle', 'Diamond', 'Pyramid', 'Hourglass', 'Castle', 'Wings']

export function getLayoutNameForLevel(level: number): LayoutName {
  if (level <= 1) return 'Rectangle'
  return LAYOUT_CYCLE[1 + ((level - 2) % (LAYOUT_CYCLE.length - 1))]
}

/** Seeded PRNG for deterministic per-level variation */
function seededRand(seed: number) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 0xffffffff
  }
}

function clampCount(c: number, max: number): number {
  return Math.max(2, Math.min(max, Math.round(c)))
}

/** Symmetric row brick counts (each value ≤ maxCols) */
export function getRowBrickCounts(level: number, rows: number, maxCols: number): number[] {
  if (level <= 1) {
    return Array.from({ length: rows }, () => maxCols)
  }

  const layout = getLayoutNameForLevel(level)
  const mid = (rows - 1) / 2
  const rng = seededRand(level * 7919)

  switch (layout) {
    case 'Diamond':
      return Array.from({ length: rows }, (_, r) => {
        const dist = Math.abs(r - mid)
        return clampCount(maxCols - dist * 2, maxCols)
      })

    case 'Pyramid':
      return Array.from({ length: rows }, (_, r) =>
        clampCount(2 + r * Math.floor(maxCols / rows), maxCols)
      )

    case 'Hourglass':
      return Array.from({ length: rows }, (_, r) => {
        const dist = Math.abs(r - mid)
        const narrow = Math.max(2, Math.floor(maxCols / 2) - 1)
        return clampCount(narrow + Math.floor(dist * 2), maxCols)
      })

    case 'Castle': {
      const counts = Array.from({ length: rows }, () => maxCols)
      for (let r = 1; r < rows - 1; r++) {
        if (r % 2 === 1) counts[r] = clampCount(maxCols - 2, maxCols)
      }
      return counts
    }

    case 'Wings': {
      const base = Array.from({ length: rows }, (_, r) => {
        const dist = Math.abs(r - mid)
        return clampCount(maxCols - 1 - Math.floor(dist * 1.2), maxCols)
      })
      // Slight seeded notch on inner rows for variety while staying symmetric
      for (let r = 1; r < mid; r++) {
        if (rng() > 0.55) {
          const v = clampCount(base[r] - 1, maxCols)
          base[r] = v
          base[rows - 1 - r] = v
        }
      }
      return base
    }

    default:
      return Array.from({ length: rows }, () => maxCols)
  }
}

export function getPatternLabel(level: number): string {
  return getLayoutNameForLevel(level)
}
