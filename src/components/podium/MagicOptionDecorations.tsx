import type { ComponentType } from 'react';
import BeeMascot from '../BeeMascot';
import type { MagicMaterial } from './podiumThemes';

/**
 * Ilustraciones SVG originales del podio mágico. Todas son decorativas (`aria-hidden`).
 *
 * Exporta:
 * - `MagicOptionMedallion`: medallón superior de cada material (brújula, panal o cofre).
 * - `MagicOptionDecorations`: adornos que sobresalen del marco (hojas, raíces, panales, cristales, flores).
 *   Cada adorno es un SVG con la clase `magic-decor magic-decor--<posición>`; su posición y tamaño se
 *   definen en la sección «El podio mágico» de `src/index.css`.
 * - `MagicPodiumBackdrop` y `MagicPodiumForeground`: capas de bosque detrás y delante de los paneles.
 *
 * Las animaciones se aplican desde CSS con clases (`magic-sway`, `magic-bloom`, `magic-twinkle`,
 * `magic-needle`, `magic-glow`): por eso cada elemento animado va dentro de un `<g>` propio, separado del
 * `<g>` que lo posiciona con el atributo `transform` (una animación CSS de `transform` lo sustituiría).
 *
 * Los colores repiten los tokens `--bees-*` porque los atributos de presentación SVG no admiten `var()`
 * de forma fiable en todos los navegadores.
 */
const INK = '#392318';
const WOOD = '#9B6338';
const WOOD_DARK = '#74462A';
const WOOD_LIGHT = '#E8C48E';
const HONEY = '#FFC928';
const HONEY_LIGHT = '#FFE9A3';
const GOLD = '#D99513';
const FOREST = '#386B42';
const MINT = '#A9DDB6';
const CREAM = '#FFF8E8';
const STONE = '#E8DDC7';
const ROSE = '#F5B9C7';
const ROSE_STRONG = '#F29FB3';
const LAVENDER = '#D7C8F4';
const LAVENDER_DEEP = '#B9A3EA';
const CRYSTAL = '#70C9F4';
const CRYSTAL_DEEP = '#3F9FD4';

/* ---------- Piezas básicas ---------- */

/** Vértices de un hexágono con el vértice hacia arriba (geometría de panal). */
function hexPoints(cx: number, cy: number, r: number) {
  return Array.from({ length: 6 }, (_, index) => {
    const angle = (Math.PI / 180) * (60 * index - 90);
    return `${(cx + r * Math.cos(angle)).toFixed(1)},${(cy + r * Math.sin(angle)).toFixed(1)}`;
  }).join(' ');
}

interface PlacedProps {
  x: number;
  y: number;
  rotate?: number;
  size?: number;
}

const place = ({ x, y, rotate = 0, size = 1 }: PlacedProps) =>
  `translate(${x} ${y}) rotate(${rotate}) scale(${size})`;

/** Hoja orgánica con nervio central; su base está en (x, y) y se balancea desde ahí. */
function Leaf({ tone = FOREST, ...placed }: PlacedProps & { tone?: string }) {
  return (
    <g transform={place(placed)}>
      <g className="magic-sway">
        <path
          d="M0 0C-11-8-12-24 0-34C12-24 11-8 0 0Z"
          fill={tone}
          stroke={INK}
          strokeWidth={2.5}
          strokeLinejoin="round"
        />
        <path d="M0-3V-28" stroke={INK} strokeWidth={1.6} strokeLinecap="round" opacity={0.5} />
      </g>
    </g>
  );
}

/** Flor de cinco pétalos centrada en (x, y). */
function Flower({ petal = ROSE, ...placed }: PlacedProps & { petal?: string }) {
  return (
    <g transform={place(placed)}>
      <g className="magic-bloom">
        {[0, 72, 144, 216, 288].map((angle) => (
          <ellipse
            key={angle}
            cx={0}
            cy={-7}
            rx={5.2}
            ry={7.4}
            transform={`rotate(${angle})`}
            fill={petal}
            stroke={INK}
            strokeWidth={2}
          />
        ))}
        <circle r={3.8} fill={HONEY} stroke={INK} strokeWidth={1.8} />
      </g>
    </g>
  );
}

/** Celda de panal: cera dorada, miel luminosa y un brillo. `glow` elige el desfase del parpadeo. */
function Comb({ cx, cy, r, glow }: { cx: number; cy: number; r: number; glow?: 'a' | 'b' | 'c' }) {
  return (
    <g>
      <polygon points={hexPoints(cx, cy, r)} fill={GOLD} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
      <polygon
        className={glow ? `magic-twinkle magic-twinkle--${glow}` : undefined}
        points={hexPoints(cx, cy, r * 0.64)}
        fill={HONEY}
      />
      <polygon points={hexPoints(cx - r * 0.2, cy - r * 0.26, r * 0.17)} fill={HONEY_LIGHT} />
    </g>
  );
}

/** Cristal facetado con su base en (x, y). */
function Crystal(placed: PlacedProps) {
  return (
    <g transform={place(placed)}>
      <polygon points="-9,0 -9,-22 0,-36 0,6" fill={CRYSTAL_DEEP} />
      <polygon points="0,-36 9,-22 9,0 0,6" fill={CRYSTAL} />
      <polygon className="magic-twinkle magic-twinkle--b" points="-5,-21 0,-30 0,-12" fill="#FFFFFF" opacity={0.7} />
      <path d="M0-36V6" stroke={INK} strokeWidth={1.4} opacity={0.45} />
      <path d="M-9 0V-22L0-36L9-22V0L0 6Z" fill="none" stroke={INK} strokeWidth={2.6} strokeLinejoin="round" />
    </g>
  );
}

/** Rama o raíz con contorno: un trazo de tinta y encima el color del material. */
function Branch({ d, color = WOOD_DARK, width = 5 }: { d: string; color?: string; width?: number }) {
  return (
    <>
      <path d={d} fill="none" stroke={INK} strokeWidth={width + 4} strokeLinecap="round" />
      <path d={d} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" />
    </>
  );
}

/* ---------- Medallones ---------- */

function CompassMedallion() {
  return (
    <svg viewBox="0 0 120 120" focusable="false">
      <Leaf x={24} y={80} rotate={-62} size={1.2} />
      <Leaf x={30} y={94} rotate={-104} size={0.9} tone={MINT} />
      <Leaf x={96} y={80} rotate={62} size={1.2} tone={MINT} />
      <circle cx={60} cy={60} r={44} fill={WOOD} stroke={INK} strokeWidth={4} />
      <circle cx={60} cy={60} r={39} fill="none" stroke={WOOD_LIGHT} strokeWidth={2.5} strokeDasharray="5 8" />
      <circle cx={60} cy={60} r={32} fill={CREAM} stroke={INK} strokeWidth={3} />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
        <line
          key={angle}
          x1={60}
          y1={31}
          x2={60}
          y2={angle % 90 === 0 ? 38 : 35}
          transform={`rotate(${angle} 60 60)`}
          stroke={INK}
          strokeWidth={angle % 90 === 0 ? 3 : 2}
          strokeLinecap="round"
        />
      ))}
      <g className="magic-needle">
        <polygon points="60,33 67,60 53,60" fill={ROSE_STRONG} stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
        <polygon points="53,60 67,60 60,87" fill={WOOD_LIGHT} stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
      </g>
      <circle cx={60} cy={60} r={5} fill={HONEY} stroke={INK} strokeWidth={2.5} />
      <Flower x={94} y={28} size={1.05} />
    </svg>
  );
}

function HoneycombMedallion() {
  const r = 19;
  const dx = Math.sqrt(3) * r;
  const dy = 1.5 * r;
  const cx = 70;
  const cy = 66;
  return (
    <svg viewBox="0 0 140 130" focusable="false">
      <circle className="magic-glow" cx={cx} cy={cy} r={58} fill={HONEY} opacity={0.4} />
      <Comb cx={cx - dx / 2} cy={cy - dy} r={r} glow="b" />
      <Comb cx={cx + dx / 2} cy={cy - dy} r={r} />
      <Comb cx={cx - dx} cy={cy} r={r} />
      <Comb cx={cx} cy={cy} r={r} glow="a" />
      <Comb cx={cx + dx} cy={cy} r={r} glow="c" />
      <Comb cx={cx - dx / 2} cy={cy + dy} r={r} glow="c" />
      <Comb cx={cx + dx / 2} cy={cy + dy} r={r} />
      <path
        d="M86 108C86 116 82 118 82 122A4 4 0 0 0 90 122C90 118 86 116 86 108Z"
        fill={HONEY}
        stroke={INK}
        strokeWidth={2}
      />
    </svg>
  );
}

function ChestMedallion() {
  return (
    <svg viewBox="0 0 120 120" focusable="false">
      <circle className="magic-glow" cx={60} cy={54} r={48} fill={CRYSTAL} opacity={0.35} />
      <g className="magic-twinkle magic-twinkle--a" stroke={CRYSTAL} strokeWidth={3.5} strokeLinecap="round">
        <path d="M60 22V8M42 26 34 14M78 26 86 14" />
      </g>
      <rect x={20} y={58} width={80} height={44} rx={7} fill={WOOD} stroke={INK} strokeWidth={4} />
      <path d="M23 81H97" stroke={WOOD_DARK} strokeWidth={2.5} />
      <path
        d="M20 62V50C20 35 36 28 60 28C84 28 100 35 100 50V62Z"
        fill={WOOD_DARK}
        stroke={INK}
        strokeWidth={4}
        strokeLinejoin="round"
      />
      <path className="magic-twinkle magic-twinkle--c" d="M23 61H97" stroke={CRYSTAL} strokeWidth={3.5} />
      <path d="M32 101V37Q34 32 41 31V101Z" fill={GOLD} stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
      <path d="M79 101V31Q86 32 88 37V101Z" fill={GOLD} stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
      <rect x={52} y={54} width={16} height={18} rx={4} fill={HONEY} stroke={INK} strokeWidth={2.5} />
      <circle cx={60} cy={61} r={2.4} fill={INK} />
      <path d="M60 62V67" stroke={INK} strokeWidth={2.4} strokeLinecap="round" />
      <Crystal x={90} y={34} rotate={18} size={0.55} />
      <Crystal x={80} y={31} rotate={-8} size={0.4} />
      <Flower x={20} y={100} size={0.85} petal={LAVENDER} />
    </svg>
  );
}

const MEDALLIONS: Record<MagicMaterial, ComponentType> = {
  roots: CompassMedallion,
  honeycomb: HoneycombMedallion,
  stone: ChestMedallion,
};

export function MagicOptionMedallion({ material }: { material: MagicMaterial }) {
  const Medallion = MEDALLIONS[material];
  return <Medallion />;
}

/* ---------- Adornos del marco ---------- */

function RootsDecorations() {
  return (
    <>
      <svg className="magic-decor magic-decor--crown-left" viewBox="0 0 100 100" focusable="false">
        <Branch d="M46 90C30 72 20 54 30 38C38 26 54 28 54 40" />
        <Leaf x={42} y={88} rotate={-72} size={1.3} />
        <Leaf x={46} y={86} rotate={-30} size={1.4} tone={MINT} />
        <Leaf x={52} y={88} rotate={10} size={1.15} />
        <Flower x={56} y={40} size={1.1} />
        <Flower x={22} y={62} size={0.8} petal={ROSE_STRONG} />
      </svg>
      <svg className="magic-decor magic-decor--side-right" viewBox="0 0 50 170" focusable="false">
        <Branch d="M30 2C14 32 40 62 22 94C8 120 30 142 24 168" color={FOREST} width={3} />
        <Leaf x={27} y={32} rotate={64} size={0.8} tone={MINT} />
        <Leaf x={21} y={72} rotate={-60} size={0.8} />
        <Leaf x={24} y={114} rotate={62} size={0.85} tone={MINT} />
        <Leaf x={21} y={152} rotate={-56} size={0.75} />
        <Flower x={30} y={90} size={0.85} />
      </svg>
      <svg className="magic-decor magic-decor--roots" viewBox="0 0 240 60" focusable="false">
        <Branch d="M10 8C30 22 26 40 40 54" />
        <Branch d="M64 6C70 24 60 36 72 52" width={4} />
        <Branch d="M172 6C178 26 198 32 196 52" width={4} />
        <Branch d="M222 8C216 26 230 40 224 56" />
        <Branch d="M2 12C42 2 82 16 122 8S202 16 238 8" width={7} color={WOOD} />
        <Leaf x={118} y={10} rotate={-12} size={0.7} />
        <Leaf x={127} y={10} rotate={32} size={0.6} tone={MINT} />
      </svg>
      <svg className="magic-decor magic-decor--flowers" viewBox="0 0 80 60" focusable="false">
        <Leaf x={20} y={58} rotate={-40} size={1} />
        <Leaf x={30} y={58} rotate={12} size={0.9} tone={MINT} />
        <Flower x={22} y={26} size={1} />
        <Flower x={50} y={36} size={0.8} petal={ROSE_STRONG} />
        <Flower x={64} y={18} size={0.6} />
      </svg>
    </>
  );
}

function HoneycombDecorations() {
  return (
    <>
      <svg className="magic-decor magic-decor--combs-left" viewBox="0 0 70 110" focusable="false">
        <Comb cx={26} cy={26} r={15} glow="c" />
        <Comb cx={39} cy={48.5} r={15} />
        <Comb cx={26} cy={71} r={15} glow="a" />
        <path
          d="M26 86C26 94 22 96 22 100A4 4 0 0 0 30 100C30 96 26 94 26 86Z"
          fill={HONEY}
          stroke={INK}
          strokeWidth={2}
        />
      </svg>
      <svg className="magic-decor magic-decor--combs-right" viewBox="0 0 80 100" focusable="false">
        <Comb cx={28} cy={22} r={15} glow="b" />
        <Comb cx={54} cy={22} r={15} />
        <Comb cx={41} cy={44.5} r={15} glow="a" />
        <Comb cx={54} cy={67} r={15} glow="c" />
      </svg>
      <span className="magic-decor magic-decor--bee-one">
        <BeeMascot animated />
      </span>
      <span className="magic-decor magic-decor--bee-two">
        <BeeMascot animated />
      </span>
    </>
  );
}

function StoneDecorations() {
  return (
    <>
      <svg className="magic-decor magic-decor--crystals-left" viewBox="0 0 90 80" focusable="false">
        <Crystal x={28} y={72} rotate={-20} size={1.15} />
        <Crystal x={50} y={74} rotate={6} size={1.5} />
        <Crystal x={70} y={72} rotate={26} size={1} />
        <path d="M6 78C12 64 30 62 46 66C60 60 80 64 86 78Z" fill={STONE} stroke={INK} strokeWidth={3} />
      </svg>
      <svg className="magic-decor magic-decor--crystals-right" viewBox="0 0 60 70" focusable="false">
        <Crystal x={24} y={62} rotate={-12} size={1.1} />
        <Crystal x={42} y={64} rotate={22} size={0.8} />
        <path d="M6 68C12 58 26 56 34 60C44 56 54 60 56 68Z" fill={STONE} stroke={INK} strokeWidth={3} />
      </svg>
      <svg className="magic-decor magic-decor--lilacs" viewBox="0 0 80 70" focusable="false">
        <Leaf x={30} y={68} rotate={-32} size={1} tone={MINT} />
        <Leaf x={44} y={68} rotate={24} size={1} />
        <Flower x={26} y={30} size={1} petal={LAVENDER} />
        <Flower x={52} y={22} size={0.85} petal={LAVENDER_DEEP} />
        <Flower x={60} y={46} size={0.7} petal={LAVENDER} />
      </svg>
      <svg className="magic-decor magic-decor--emblem" viewBox="0 0 60 60" focusable="false">
        <polygon points={hexPoints(30, 30, 26)} fill={GOLD} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
        <polygon points={hexPoints(30, 30, 18)} fill={CREAM} stroke={INK} strokeWidth={2} strokeLinejoin="round" />
        <polygon points="30,17 39,30 30,43 21,30" fill={CRYSTAL} />
        <polygon points="30,17 30,43 21,30" fill={CRYSTAL_DEEP} />
        <polygon points="30,17 39,30 30,43 21,30" fill="none" stroke={INK} strokeWidth={2.4} strokeLinejoin="round" />
      </svg>
    </>
  );
}

const DECORATIONS: Record<MagicMaterial, ComponentType> = {
  roots: RootsDecorations,
  honeycomb: HoneycombDecorations,
  stone: StoneDecorations,
};

export function MagicOptionDecorations({ material }: { material: MagicMaterial }) {
  const Decorations = DECORATIONS[material];
  return (
    <span className="magic-card__decor" aria-hidden="true">
      <Decorations />
    </span>
  );
}

/* ---------- Bosque ---------- */

interface TreeSpec {
  x: number;
  h: number;
  w: number;
}

/** Árbol de silueta simple: tronco y copa de tres círculos. La base queda en y = 600. */
function Tree({ x, h, w, fill }: TreeSpec & { fill: string }) {
  const top = 600 - h;
  return (
    <g fill={fill}>
      <rect x={x - w * 0.09} y={top + w * 0.6} width={w * 0.18} height={h - w * 0.6} rx={w * 0.05} />
      <circle cx={x} cy={top + w * 0.35} r={w * 0.42} />
      <circle cx={x - w * 0.3} cy={top + w * 0.7} r={w * 0.34} />
      <circle cx={x + w * 0.3} cy={top + w * 0.66} r={w * 0.36} />
    </g>
  );
}

const FAR_TREES: readonly TreeSpec[] = [
  { x: 40, h: 330, w: 150 },
  { x: 190, h: 280, w: 130 },
  { x: 320, h: 360, w: 160 },
  { x: 470, h: 250, w: 120 },
  { x: 740, h: 270, w: 125 },
  { x: 880, h: 350, w: 155 },
  { x: 1020, h: 290, w: 135 },
  { x: 1170, h: 340, w: 150 },
];

const NEAR_TREES: readonly TreeSpec[] = [
  { x: -20, h: 560, w: 230 },
  { x: 130, h: 470, w: 170 },
  { x: 1080, h: 480, w: 175 },
  { x: 1225, h: 570, w: 235 },
];

/** Capas de fondo: árboles lejanos desenfocados, árboles cercanos en los bordes, haces de luz y suelo. */
export function MagicPodiumBackdrop() {
  return (
    <div className="magic-backdrop" aria-hidden="true">
      <svg className="magic-backdrop__far" viewBox="0 0 1200 600" preserveAspectRatio="xMidYMax slice">
        {FAR_TREES.map((tree) => (
          <Tree key={tree.x} {...tree} fill="#4c7c55" />
        ))}
      </svg>
      <span className="magic-backdrop__rays" />
      <svg className="magic-backdrop__near" viewBox="0 0 1200 600" preserveAspectRatio="xMidYMax slice">
        {NEAR_TREES.map((tree) => (
          <Tree key={tree.x} {...tree} fill="#1a3423" />
        ))}
        <path d="M0 540Q300 498 600 524T1200 512V600H0Z" fill="#2c5434" />
        <path d="M0 572Q260 546 600 562T1200 556V600H0Z" fill={FOREST} />
      </svg>
      <span className="magic-backdrop__mist" />
      <span className="magic-backdrop__fireflies">
        {Array.from({ length: 7 }, (_, index) => (
          <span key={index} />
        ))}
      </span>
    </div>
  );
}

/** Franja de hierba en primer plano que cubre la base de los pedestales y da profundidad. */
const GRASS_PATH = (() => {
  let d = 'M0 60V34';
  for (let x = 0; x < 1200; x += 24) {
    const tip = 6 + ((x * 7) % 17);
    d += `Q${x + 6} ${tip} ${x + 12} 30Q${x + 18} ${tip + 8} ${x + 24} 34`;
  }
  return `${d}V60Z`;
})();

export function MagicPodiumForeground() {
  return (
    <svg className="magic-foreground" viewBox="0 0 1200 60" preserveAspectRatio="none" aria-hidden="true">
      <path d={GRASS_PATH} fill={FOREST} stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
    </svg>
  );
}
