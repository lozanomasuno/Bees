/**
 * Escenario decorativo del bosque mágico que rodea la interfaz.
 *
 * Responsabilidades:
 * - Dibujar en SVG y CSS el follaje superior, dos árboles con raíces y panales colgantes, rayos de sol,
 *   hojas y pétalos flotantes, destellos, abejitas y el suelo con flores.
 * - No contiene información ni controles: todo el bloque está oculto a los lectores de pantalla y no
 *   recibe eventos del puntero (`pointer-events: none` en CSS).
 *
 * Dependencias: estilos `.forest*` de `src/index.css`, que fijan posiciones, reducen la decoración en
 * pantallas estrechas y desactivan las animaciones con `prefers-reduced-motion`.
 * `App` lo coloca como primer hijo de `.app-shell`, detrás del contenido.
 */

const INK = '#392318';
const WOOD = '#9B6338';
const WOOD_DARK = '#74462A';
const FOREST = '#386B42';
const FOREST_LIGHT = '#5E9A5A';
const SAGE = '#CBE5A5';
const HONEY = '#FFC928';
const HONEY_LIGHT = '#FFD84D';
const GOLD = '#D99513';
const ROSE = '#F5B9C7';
const LAVENDER = '#D7C8F4';

/** Copas del árbol: [cx, cy, r]. Se pintan dos veces para obtener solo el contorno exterior. */
const CANOPY: Array<[number, number, number]> = [
  [40, 120, 70],
  [125, 88, 80],
  [205, 128, 62],
  [92, 200, 70],
  [172, 198, 58],
  [16, 220, 55],
];

/** Celdas hexagonales del panal, relativas a su centro. */
const HIVE_CELLS: Array<[number, number]> = [
  [-17, -22], [0, -32], [17, -22],
  [-17, -2], [0, -12], [17, -2],
  [-17, 18], [0, 8], [17, 18],
  [0, 28],
];

const hexagon = (cx: number, cy: number, r: number) =>
  Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI / 3) * i;
    return `${(cx + r * Math.cos(angle)).toFixed(1)},${(cy + r * Math.sin(angle)).toFixed(1)}`;
  }).join(' ');

function Flower({ x, y, color, size = 1 }: { x: number; y: number; color: string; size?: number }) {
  const r = 5 * size;
  return (
    <g>
      {[0, 72, 144, 216, 288].map((angle) => (
        <circle
          key={angle}
          cx={x + Math.cos((angle * Math.PI) / 180) * r}
          cy={y + Math.sin((angle * Math.PI) / 180) * r}
          r={r * 0.85}
          fill={color}
          stroke={INK}
          strokeWidth={1.6}
        />
      ))}
      <circle cx={x} cy={y} r={r * 0.6} fill={HONEY} stroke={INK} strokeWidth={1.6} />
    </g>
  );
}

function Hive({ x, ropeTop, ropeLength }: { x: number; ropeTop: number; ropeLength: number }) {
  const cy = ropeTop + ropeLength + 45;
  return (
    <g className="forest__hive">
      <line x1={x} y1={ropeTop} x2={x} y2={ropeTop + ropeLength} stroke={INK} strokeWidth={3} />
      <path
        d={`M${x} ${cy - 45}c35 5 50 45 40 80-10 25-70 25-80 0-10-35 5-75 40-80z`}
        fill={HONEY}
        stroke={INK}
        strokeWidth={4}
      />
      {HIVE_CELLS.map(([dx, dy]) => (
        <polygon
          key={`${dx}-${dy}`}
          points={hexagon(x + dx, cy + dy, 9)}
          fill={HONEY_LIGHT}
          stroke={GOLD}
          strokeWidth={2.4}
        />
      ))}
      <ellipse cx={x} cy={cy + 22} rx={8} ry={6} fill={INK} />
      <path d={`M${x + 18} ${cy + 30}q4 10 0 14q-4-4 0-14z`} fill={GOLD} stroke={INK} strokeWidth={2} />
    </g>
  );
}

function Leaf({ x, y, angle }: { x: number; y: number; angle: number }) {
  return (
    <ellipse
      cx={x}
      cy={y}
      rx={13}
      ry={6}
      transform={`rotate(${angle} ${x} ${y})`}
      fill={FOREST_LIGHT}
      stroke={INK}
      strokeWidth={2.5}
    />
  );
}

/**
 * Árbol del bosque. La variante `b` cambia flores y altura del panal para que los dos lados no sean
 * idénticos; el lado derecho se refleja en CSS.
 */
function Tree({ variant }: { variant: 'a' | 'b' }) {
  const flowerColor = variant === 'a' ? ROSE : LAVENDER;
  return (
    <svg className={`forest__tree forest__tree--${variant}`} viewBox="-20 0 340 800" focusable="false">
      {/* Raíces y tronco */}
      <path
        d={
          'M55 230C60 380 50 520 40 640 30 700 0 740-12 782l42-10c20-20 30-40 40-52 5 30 0 60-10 80h80'
          + 'c-10-20-15-50-12-80 12 15 32 40 62 58l10-10c-30-28-50-68-60-128-10-120-15-260-12-410z'
        }
        fill={WOOD}
        stroke={INK}
        strokeWidth={5}
        strokeLinejoin="round"
      />
      <path
        d="M80 300c5 40-4 80 2 120M108 420c-4 40 4 80-2 110M70 560c-3 30 3 50-2 70"
        fill="none"
        stroke={WOOD_DARK}
        strokeWidth={4}
        strokeLinecap="round"
      />
      <ellipse cx={92} cy={470} rx={15} ry={22} fill="#4A2E1E" stroke={INK} strokeWidth={4} />

      {/* Rama con hojas, flores y panal */}
      <path
        d="M120 300c50-10 110-30 198-38v16c-78 10-138 27-194 44z"
        fill={WOOD}
        stroke={INK}
        strokeWidth={4}
        strokeLinejoin="round"
      />
      <Leaf x={170} y={280} angle={-30} />
      <Leaf x={212} y={292} angle={25} />
      <Leaf x={258} y={264} angle={-20} />
      <Leaf x={300} y={278} angle={30} />
      <Flower x={192} y={281} color={flowerColor} />
      <Flower x={282} y={262} color={flowerColor} size={0.9} />
      <Hive
        x={variant === 'a' ? 248 : 228}
        ropeTop={variant === 'a' ? 276 : 282}
        ropeLength={variant === 'a' ? 22 : 48}
      />

      {/* Copa: contorno y relleno separados para no marcar las uniones internas */}
      <g fill={INK}>
        {CANOPY.map(([cx, cy, r]) => <circle key={`o-${cx}`} cx={cx} cy={cy} r={r + 4} />)}
      </g>
      <g fill={FOREST}>
        {CANOPY.map(([cx, cy, r]) => <circle key={`f-${cx}`} cx={cx} cy={cy} r={r} />)}
      </g>
      <g fill={FOREST_LIGHT}>
        {CANOPY.map(([cx, cy, r]) => (
          <circle key={`h-${cx}`} cx={cx - r * 0.2} cy={cy - r * 0.25} r={r * 0.55} />
        ))}
      </g>
      <g fill={SAGE} opacity={0.8}>
        <circle cx={110} cy={60} r={12} />
        <circle cx={30} cy={95} r={9} />
        <circle cx={190} cy={110} r={8} />
      </g>
      <Flower x={60} y={150} color={flowerColor} />
      <Flower x={150} y={70} color={ROSE} size={0.8} />
      <Flower x={196} y={170} color={LAVENDER} size={0.9} />
      <Flower x={20} y={235} color={flowerColor} size={0.8} />

      {/* Liana */}
      <path d="M182 240c10 50-8 90 4 140" fill="none" stroke={FOREST} strokeWidth={4} strokeLinecap="round" />
      <Leaf x={190} y={300} angle={60} />
      <Leaf x={182} y={350} angle={-60} />

      {/* Montículo de hierba donde se hunden las raíces */}
      <ellipse cx={80} cy={784} rx={130} ry={16} fill={SAGE} stroke={INK} strokeWidth={4} />
      <path
        d="M10 774l5-12 4 12M150 772l6-14 4 14"
        fill="none"
        stroke={FOREST}
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FloatingLeaf() {
  return (
    <svg viewBox="0 0 24 24" focusable="false">
      <path d="M3 21C3 10 10 4 21 3c-1 11-7 18-18 18z" fill={SAGE} stroke={INK} strokeWidth={1.6} />
      <path d="M3 21 14 10" stroke={FOREST} strokeWidth={1.6} strokeLinecap="round" />
    </svg>
  );
}

function FloatingPetal({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 24 24" focusable="false">
      <path d="M12 2c6 5 7 13 0 20-7-7-6-15 0-20z" fill={color} stroke={INK} strokeWidth={1.6} />
    </svg>
  );
}

function TinyBee() {
  return (
    <svg viewBox="0 0 40 32" focusable="false">
      <ellipse cx={18} cy={8} rx={7} ry={9} fill="#FFFFFF" fillOpacity={0.85} stroke={INK} strokeWidth={1.8} />
      <ellipse cx={20} cy={19} rx={13} ry={10} fill={HONEY} stroke={INK} strokeWidth={2} />
      <path d="M15 10v18M22 9v20" stroke={INK} strokeWidth={3.2} />
      <circle cx={29} cy={17} r={1.8} fill={INK} />
    </svg>
  );
}

/** Flores del suelo: [x, y, color, tamaño], sobre la colina trasera para no tapar el pie de página. */
const GROUND_FLOWERS: Array<[number, number, string, number]> = [
  [110, 66, ROSE, 1.5], [290, 50, LAVENDER, 1.3], [450, 68, '#FFFDF5', 1.4], [620, 76, ROSE, 1.2],
  [800, 48, LAVENDER, 1.5], [980, 54, ROSE, 1.3], [1160, 58, '#FFFDF5', 1.4], [1330, 52, LAVENDER, 1.3],
];

/** Colinas con flores. `slice` conserva la proporción y recorta los lados en pantallas estrechas. */
function Ground() {
  return (
    <svg
      className="forest__ground"
      viewBox="0 0 1440 160"
      preserveAspectRatio="xMidYMax slice"
      focusable="false"
    >
      <path
        d="M-10 170V78C180 28 380 38 560 83c160-35 340-55 520-10 160-30 280-25 370-5v107z"
        fill="#A9CF7F"
        stroke={INK}
        strokeWidth={4}
      />
      {GROUND_FLOWERS.map(([x, y, color, size]) => (
        <g key={x}>
          <path d={`M${x} ${y + 6}v18`} stroke={FOREST} strokeWidth={3} strokeLinecap="round" />
          <Flower x={x} y={y} color={color} size={size} />
        </g>
      ))}
      <path
        d="M-10 170v-68c250-30 490-25 730-5 240-25 480-25 730 0v73z"
        fill={SAGE}
        stroke={INK}
        strokeWidth={4}
      />
      <path
        d="M200 104l6-14 4 14M520 106l5-12 5 12M900 102l6-14 4 14M1250 104l5-12 5 12"
        fill="none"
        stroke={FOREST}
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const FLOATERS = [
  'leaf', 'petal-rose', 'leaf', 'petal-lavender', 'petal-rose',
  'leaf', 'petal-lavender', 'leaf', 'petal-rose', 'leaf',
] as const;

export default function ForestBackdrop() {
  return (
    <div className="forest" aria-hidden="true">
      <div className="forest__rays" />
      <div className="forest__canopy" />
      <Tree variant="a" />
      <div className="forest__tree-flip">
        <Tree variant="b" />
      </div>

      {FLOATERS.map((kind, index) => (
        <span key={index} className={`forest__floater forest__floater--${index + 1}`}>
          {kind === 'leaf' ? (
            <FloatingLeaf />
          ) : (
            <FloatingPetal color={kind === 'petal-rose' ? ROSE : LAVENDER} />
          )}
        </span>
      ))}

      {[1, 2, 3, 4, 5, 6].map((index) => (
        <span key={index} className={`forest__sparkle forest__sparkle--${index}`} />
      ))}

      <span className="forest__tiny-bee forest__tiny-bee--1">
        <TinyBee />
      </span>
      <span className="forest__tiny-bee forest__tiny-bee--2">
        <TinyBee />
      </span>

      <Ground />
    </div>
  );
}
