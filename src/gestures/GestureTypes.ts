/** Spellcaster gameplay gestures mapped to elemental spells */
export type SpellGesture =
  | 'fist'        // Fire
  | 'open_palm'   // Shield
  | 'l_shape'     // Lightning
  | 'rock_on'     // Earth
  | 'ok_sign'     // Water

export type GestureType =
  | 'none'
  | SpellGesture
  | 'pause_toggle'  // fist → index+middle open (system)

export interface Landmark {
  x: number
  y: number
  z: number
}

export interface GestureResult {
  gesture: GestureType
  confidence: number
  landmarks: Landmark[]
  /** Normalized hand center in camera space (raw MediaPipe) */
  handCenter?: { x: number; y: number }
  /** Mapped 0–1 position on the game canvas (from camera play zone) */
  playPosition?: { x: number; y: number }
  stabilityMs?: number
  isSystemGesture?: boolean
}

/** Training checklist keys — all 5 spells must be performed once */
export const TRAINING_GESTURES: SpellGesture[] = [
  'fist',
  'open_palm',
  'l_shape',
  'rock_on',
  'ok_sign',
]

export const SPELL_LABELS: Record<SpellGesture, { name: string; element: string; emoji: string }> = {
  fist:      { name: 'Tight Fist',        element: 'Fire',      emoji: '🔥' },
  open_palm: { name: 'Open Palm',         element: 'Shield',    emoji: '🛡️' },
  l_shape:   { name: 'L-Shape',           element: 'Lightning', emoji: '⚡' },
  rock_on:   { name: 'Horns Sign (🤘)',   element: 'Earth',     emoji: '🪨' },
  ok_sign:   { name: 'OK / Pinch',        element: 'Water',     emoji: '💧' },
}

/** Plain-language hand instructions + knockout targets for each spell */
export const GESTURE_HELP: Record<SpellGesture, { howTo: string; effect: string; knocksOut: string }> = {
  fist: {
    howTo: 'Curl all fingers tightly into your palm — a closed fist.',
    effect: 'Shoots a fireball from the barrier toward your crosshair.',
    knocksOut: '🟢 Goblin (Wood)  •  🔵 Frost Spirit (Ice)',
  },
  open_palm: {
    howTo: 'Hold your hand flat with all five fingers spread open.',
    effect: 'Raises a shield bubble at the barrier — does NOT attack.',
    knocksOut: 'No kills — blocks enemy projectiles only',
  },
  l_shape: {
    howTo: 'Extend thumb and index finger in an “L”; curl middle, ring, and pinky down.',
    effect: 'Lightning bolt strikes wherever your crosshair is aimed.',
    knocksOut: '🟣 Bat (Air)  •  🔵 Frost Spirit (Ice)',
  },
  rock_on: {
    howTo: 'Extend index and pinky upward (🤘 horns); curl middle and ring; tuck thumb.',
    effect: 'Earth spikes strike the area under your crosshair.',
    knocksOut: '🟤 Orc (Earth) only',
  },
  ok_sign: {
    howTo: 'Touch thumb tip to index tip forming a circle.',
    effect: 'Water blast hits the area under your crosshair.',
    knocksOut: '🟠 Fire Elemental (Fire) only',
  },
}

/** System gesture — not part of training checklist */
export const PAUSE_GESTURE_HELP = {
  name: 'Pause / Resume',
  emoji: '⏸️',
  howTo:
    'During battle only: (1) Hold a tight fist for about half a second. (2) Open index + middle fingers (peace sign ✌️) with ring + pinky curled and thumb tucked down.',
  effect: 'Pauses or resumes the game while playing.',
}
