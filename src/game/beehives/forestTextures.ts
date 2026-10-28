import Phaser from 'phaser';

/**
 * Texturas procedurales del Bosque Encantado (competencia de panales).
 *
 * Responsabilidad: pintar con Canvas 2D, una sola vez por instancia de `Phaser.Game`, el arte que usan
 * `ForestAmbience`, `HiveView` y `BeehivesScene` (capas del bosque, rama, panales, abejas y partículas).
 * No crea objetos de juego ni animaciones.
 *
 * Contrato:
 * - `ensureForestTextures(scene)` es idempotente: si una clave existe no se vuelve a pintar.
 * - Las claves públicas están en `FOREST_TEXTURES`; los fotogramas con nombre, en `BEE_FRAMES`,
 *   `FLUTTER_FRAMES` y `GLINT_FRAMES`.
 * - Todo usa semillas fijas: el bosque es el mismo en cada partida y los árboles se diferencian por semilla,
 *   no por espejo.
 * - Solo se usan funciones de Canvas 2D ampliamente soportadas (sin `ctx.filter`); el desenfoque del fondo
 *   se consigue con manchas de degradado radial. Las texturas sirven para WebGL y Canvas.
 */

export const FOREST_TEXTURES = {
  far: 'forest-far',
  mid: 'forest-mid',
  treeLeft: 'forest-tree-left',
  treeRight: 'forest-tree-right',
  branch: 'forest-branch',
  ground: 'forest-ground-front',
  shaft: 'forest-light-shaft',
  softLight: 'forest-soft-light',
  shadow: 'forest-soft-shadow',
  mote: 'forest-mote',
  spark: 'forest-spark',
  flutter: 'forest-flutter',
  bee: 'forest-bee',
  glints: 'hive-glints',
} as const;

/** Clave de cada variante de panal (se reparten en ciclo entre los panales de la partida). */
export const HIVE_VARIANTS = 3;
export function hiveTextureKey(variant: number) {
  return `forest-hive-${variant % HIVE_VARIANTS}`;
}

/** Medidas del panal; su centro visual queda en (HIVE_SIZE.centerX, HIVE_SIZE.centerY) de la textura. */
export const HIVE_SIZE = { width: 128, height: 168, centerX: 64, centerY: 86, radiusX: 50, radiusY: 66 } as const;

/** Fotogramas de aleteo de la abeja: alas arriba, en medio y abajo. */
export const BEE_FRAMES = ['up', 'mid', 'down'] as const;
const BEE_FRAME_SIZE = { width: 34, height: 28 };

/** Pétalos (lavanda, crema, amarillo, coral) y hojas (tres verdes). */
export const FLUTTER_FRAMES = {
  petals: ['p0', 'p1', 'p2', 'p3'],
  leaves: ['l0', 'l1', 'l2'],
} as const;
const FLUTTER_CELL = { width: 26, height: 16 };

/** Tres franjas diagonales de reflejos sobre las celdas; se encienden en secuencia. */
export const GLINT_FRAMES = ['g0', 'g1', 'g2'] as const;

/** Rama principal: misma curva que usaba la escena original para colgar los panales. */
export function branchYAt(x: number) {
  return 140 + Math.sin(x * 0.018) * 18;
}
export const BRANCH_TEXTURE_TOP = 40;

export type Rng = () => number;

/** Generador pseudoaleatorio determinista (mulberry32). */
export function createRng(seed: number): Rng {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function range(rng: Rng, min: number, max: number) {
  return min + rng() * (max - min);
}

type Painter = (ctx: CanvasRenderingContext2D, rng: Rng) => void;

function paintTexture(scene: Phaser.Scene, key: string, width: number, height: number, seed: number, painter: Painter) {
  if (scene.textures.exists(key)) return null;
  const texture = scene.textures.createCanvas(key, width, height);
  if (!texture) return null;
  painter(texture.getContext(), createRng(seed));
  texture.refresh();
  return texture;
}

/** Registra fotogramas de igual tamaño dispuestos en una fila. */
function addRowFrames(texture: Phaser.Textures.CanvasTexture | null, names: readonly string[], width: number,
  height: number) {
  if (!texture) return;
  names.forEach((name, index) => texture.add(name, 0, index * width, 0, width, height));
}

/** Pinta todas las texturas del bosque. */
export function ensureForestTextures(scene: Phaser.Scene) {
  const keys = FOREST_TEXTURES;
  paintTexture(scene, keys.far, 1000, 620, 101, paintFarForest);
  paintTexture(scene, keys.mid, 1000, 620, 102, paintMidForest);
  paintTexture(scene, keys.treeLeft, 260, 620, 103, (ctx, rng) => paintFrontTree(ctx, rng, false));
  paintTexture(scene, keys.treeRight, 260, 620, 104, (ctx, rng) => paintFrontTree(ctx, rng, true));
  paintTexture(scene, keys.branch, 1000, 220, 105, paintBranch);
  paintTexture(scene, keys.ground, 1000, 170, 106, paintFrontGround);
  paintTexture(scene, keys.shaft, 180, 720, 107, paintLightShaft);
  paintTexture(scene, keys.softLight, 256, 256, 108, paintSoftLight);
  paintTexture(scene, keys.shadow, 128, 56, 109, paintSoftShadow);
  paintTexture(scene, keys.mote, 20, 20, 110, paintMote);
  paintTexture(scene, keys.spark, 18, 18, 111, paintSpark);

  const flutterNames = [...FLUTTER_FRAMES.petals, ...FLUTTER_FRAMES.leaves];
  addRowFrames(
    paintTexture(scene, keys.flutter, FLUTTER_CELL.width * flutterNames.length, FLUTTER_CELL.height, 112, paintFlutter),
    flutterNames,
    FLUTTER_CELL.width,
    FLUTTER_CELL.height,
  );
  addRowFrames(
    paintTexture(scene, keys.bee, BEE_FRAME_SIZE.width * BEE_FRAMES.length, BEE_FRAME_SIZE.height, 113, paintBee),
    BEE_FRAMES,
    BEE_FRAME_SIZE.width,
    BEE_FRAME_SIZE.height,
  );
  addRowFrames(
    paintTexture(scene, keys.glints, HIVE_SIZE.width * GLINT_FRAMES.length, HIVE_SIZE.height, 114, paintGlints),
    GLINT_FRAMES,
    HIVE_SIZE.width,
    HIVE_SIZE.height,
  );
  for (let variant = 0; variant < HIVE_VARIANTS; variant += 1) {
    paintTexture(scene, hiveTextureKey(variant), HIVE_SIZE.width, HIVE_SIZE.height, 0,
      (ctx) => paintHive(ctx, variant));
  }
}

/* -------------------------------------------------------------------------------------------------
 * Vegetación y madera
 * ---------------------------------------------------------------------------------------------- */

/** Dirección de la luz solar (arriba a la derecha) normalizada; ilumina hojas y corteza. */
const SUN = { x: 0.6, y: -0.8 };

/**
 * Racimo de follaje: masa oscura de fondo y muchas hojas pequeñas, más claras en el lado del sol.
 * `light` es la luminosidad base (porcentaje HSL) y `haze` (0..1) aclara y desatura por distancia.
 */
function drawFoliage(
  ctx: CanvasRenderingContext2D,
  rng: Rng,
  cx: number,
  cy: number,
  radiusX: number,
  radiusY: number,
  light: number,
  count: number,
  haze = 0,
) {
  const mass = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(radiusX, radiusY));
  mass.addColorStop(0, `hsla(${108 - haze * 10} ${40 - haze * 15}% ${light - 8 + haze * 10}% / 0.95)`);
  mass.addColorStop(0.75, `hsla(${108 - haze * 10} ${40 - haze * 15}% ${light - 8 + haze * 10}% / 0.8)`);
  mass.addColorStop(1, `hsla(${108 - haze * 10} ${40 - haze * 15}% ${light - 8 + haze * 10}% / 0)`);
  ctx.fillStyle = mass;
  ctx.beginPath();
  ctx.ellipse(cx, cy, radiusX, radiusY, 0, 0, Math.PI * 2);
  ctx.fill();

  for (let index = 0; index < count; index += 1) {
    const angle = rng() * Math.PI * 2;
    const distance = Math.sqrt(rng());
    const px = cx + Math.cos(angle) * radiusX * distance;
    const py = cy + Math.sin(angle) * radiusY * distance;
    const lit = Phaser.Math.Clamp(0.5 + (((px - cx) / radiusX) * SUN.x + ((py - cy) / radiusY) * SUN.y) * 0.5, 0, 1);
    const hue = range(rng, 88, 122) - haze * 10;
    const saturation = range(rng, 38, 58) - haze * 18;
    const lightness = light + lit * 18 - 6 + range(rng, -4, 4) + haze * 10;
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(range(rng, 0, Math.PI * 2));
    const length = range(rng, 4.5, 8.5) * (1 - haze * 0.3);
    ctx.fillStyle = `hsl(${hue} ${saturation}% ${lightness}%)`;
    ctx.beginPath();
    ctx.moveTo(-length, 0);
    ctx.quadraticCurveTo(0, -length * 0.55, length, 0);
    ctx.quadraticCurveTo(0, length * 0.55, -length, 0);
    ctx.fill();
    if (lit > 0.65 && rng() > 0.6) {
      ctx.strokeStyle = 'rgba(255,250,200,0.25)';
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.moveTo(-length * 0.8, 0);
      ctx.lineTo(length * 0.8, 0);
      ctx.stroke();
    }
    ctx.restore();
  }
}

/** Mancha de color con bordes difuminados (sustituto de un desenfoque para planos lejanos). */
function softBlob(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, color: string, alpha: number) {
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
  gradient.addColorStop(0, `rgba(${color},${alpha})`);
  gradient.addColorStop(0.6, `rgba(${color},${alpha * 0.7})`);
  gradient.addColorStop(1, `rgba(${color},0)`);
  ctx.fillStyle = gradient;
  ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
}

/**
 * Corteza dentro de la silueta ya recortada: surcos ondulados oscuros, crestas iluminadas del lado del sol,
 * nudos y musgo. `edgeAt(t)` devuelve [izquierda, derecha] para t de 0 (abajo) a 1 (arriba).
 */
function paintBark(
  ctx: CanvasRenderingContext2D,
  rng: Rng,
  edgeAt: (t: number) => [number, number],
  bottom: number,
  top: number,
  mossSide: -1 | 1,
) {
  const grooves = 26;
  for (let groove = 0; groove < grooves; groove += 1) {
    const fraction = range(rng, 0.04, 0.96);
    const phase = range(rng, 0, Math.PI * 2);
    const wobble = range(rng, 1, 3.5);
    const startT = range(rng, 0, 0.4);
    const endT = Math.min(1, startT + range(rng, 0.25, 0.7));
    const points: Array<[number, number]> = [];
    for (let t = startT; t <= endT; t += 0.02) {
      const [left, right] = edgeAt(t);
      const y = bottom - (bottom - top) * t;
      points.push([left + (right - left) * fraction + Math.sin(t * 40 + phase) * wobble, y]);
    }
    const trace = (offset: number) => {
      ctx.beginPath();
      points.forEach(([px, py], index) => (index ? ctx.lineTo(px + offset, py) : ctx.moveTo(px + offset, py)));
      ctx.stroke();
    };
    ctx.lineCap = 'round';
    ctx.strokeStyle = `rgba(255,220,170,${fraction > 0.5 ? 0.16 : 0.07})`;
    ctx.lineWidth = range(rng, 1, 2);
    trace(1.8);
    ctx.strokeStyle = `rgba(28,16,8,${range(rng, 0.45, 0.8)})`;
    ctx.lineWidth = range(rng, 1.4, 3);
    trace(0);
  }

  // Nudos con anillos.
  for (let knot = 0; knot < 3; knot += 1) {
    const t = range(rng, 0.15, 0.85);
    const [left, right] = edgeAt(t);
    const kx = left + (right - left) * range(rng, 0.3, 0.7);
    const ky = bottom - (bottom - top) * t;
    for (let ring = 3; ring >= 1; ring -= 1) {
      ctx.strokeStyle = `rgba(30,16,8,${0.25 + ring * 0.12})`;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.ellipse(kx, ky, ring * 3.4, ring * 5, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(18,9,4,0.85)';
    ctx.beginPath();
    ctx.ellipse(kx, ky, 3, 5, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Musgo en el lado en sombra y en la base.
  for (let speck = 0; speck < 520; speck += 1) {
    const t = Math.pow(rng(), 1.6);
    const [left, right] = edgeAt(t);
    const across = mossSide < 0 ? Math.pow(rng(), 2.2) : 1 - Math.pow(rng(), 2.2);
    ctx.fillStyle = `hsla(${range(rng, 80, 110)} ${range(rng, 35, 55)}% ${range(rng, 24, 40)}% / ${
      range(rng, 0.35, 0.8)})`;
    ctx.beginPath();
    ctx.arc(left + (right - left) * across, bottom - (bottom - top) * t, range(rng, 0.8, 2.6), 0, Math.PI * 2);
    ctx.fill();
  }
}

/** Raíz cónica que sale del tronco hacia el suelo. */
function drawRoot(ctx: CanvasRenderingContext2D, fromX: number, fromY: number, toX: number, toY: number,
  thickness: number, color: string) {
  const midX = (fromX + toX) / 2;
  const midY = Math.min(fromY, toY) - 6;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(fromX - thickness, fromY);
  ctx.quadraticCurveTo(midX, midY - thickness * 0.4, toX, toY);
  ctx.quadraticCurveTo(midX, midY + thickness * 0.9, fromX + thickness, fromY + thickness * 0.6);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(20,10,4,0.55)';
  ctx.lineWidth = 1.2;
  ctx.stroke();
}

function drawFern(ctx: CanvasRenderingContext2D, rng: Rng, x: number, y: number, length: number, lean: number,
  light: number) {
  const tipX = x + lean * length;
  const tipY = y - length;
  const controlX = x + lean * length * 0.2;
  const controlY = y - length * 0.75;
  const point = (t: number) => [
    (1 - t) * (1 - t) * x + 2 * (1 - t) * t * controlX + t * t * tipX,
    (1 - t) * (1 - t) * y + 2 * (1 - t) * t * controlY + t * t * tipY,
  ];
  ctx.strokeStyle = `hsl(100 40% ${light - 10}%)`;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(controlX, controlY, tipX, tipY);
  ctx.stroke();
  for (let step = 1; step < 14; step += 1) {
    const t = step / 14;
    const [px, py] = point(t);
    const size = (1 - t) * length * 0.22 + 2;
    [-1, 1].forEach((side) => {
      ctx.fillStyle = `hsl(${range(rng, 95, 115)} ${range(rng, 40, 55)}% ${light + (side > 0 ? 6 : 0)}%)`;
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(side * 1.1 + lean * 0.4);
      ctx.beginPath();
      ctx.ellipse(size / 2, 0, size / 2, size * 0.18 + 0.8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }
}

const FLOWER_COLORS = ['#c9b6ff', '#fff1d0', '#ffe07a', '#ffb39c'];

function drawFlower(ctx: CanvasRenderingContext2D, rng: Rng, x: number, y: number, radius: number, color: string) {
  ctx.strokeStyle = '#4f8a45';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x + range(rng, -5, 5), y + 12, x + range(rng, -3, 3), y + 24);
  ctx.stroke();
  const rotation = range(rng, 0, Math.PI);
  for (let petal = 0; petal < 5; petal += 1) {
    const angle = rotation + (petal * Math.PI * 2) / 5;
    ctx.save();
    ctx.translate(x + Math.cos(angle) * radius * 0.55, y + Math.sin(angle) * radius * 0.55);
    ctx.rotate(angle);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(0, 0, radius * 0.6, radius * 0.38, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(80,50,40,0.35)';
    ctx.lineWidth = 0.6;
    ctx.stroke();
    ctx.restore();
  }
  ctx.fillStyle = '#f2a93b';
  ctx.beginPath();
  ctx.arc(x, y, radius * 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.fillRect(x - radius * 0.12, y - radius * 0.15, 1.4, 1.4);
}

function drawGrassTuft(ctx: CanvasRenderingContext2D, rng: Rng, x: number, y: number, height: number) {
  for (let blade = 0; blade < 7; blade += 1) {
    const lean = range(rng, -0.5, 0.5);
    const bladeHeight = height * range(rng, 0.6, 1);
    ctx.strokeStyle = `hsl(${range(rng, 85, 115)} ${range(rng, 40, 60)}% ${range(rng, 26, 44)}%)`;
    ctx.lineWidth = range(rng, 1.2, 2.2);
    ctx.beginPath();
    ctx.moveTo(x + blade * 1.5 - 5, y);
    ctx.quadraticCurveTo(x + lean * bladeHeight * 0.3, y - bladeHeight * 0.6, x + lean * bladeHeight, y - bladeHeight);
    ctx.stroke();
  }
}

function drawMushroom(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.fillStyle = '#efe2c4';
  ctx.fillRect(x - size * 0.18, y - size * 0.9, size * 0.36, size * 0.9);
  const cap = ctx.createRadialGradient(x - size * 0.2, y - size * 1.1, 1, x, y - size, size);
  cap.addColorStop(0, '#f2b45a');
  cap.addColorStop(1, '#9c5420');
  ctx.fillStyle = cap;
  ctx.beginPath();
  ctx.ellipse(x, y - size * 0.92, size * 0.62, size * 0.38, 0, Math.PI, 0);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(255,245,220,0.75)';
  [[-0.25, -1.05], [0.15, -1.12], [0.3, -0.98]].forEach(([dx, dy]) => {
    ctx.beginPath();
    ctx.arc(x + dx * size, y + dy * size, size * 0.06, 0, Math.PI * 2);
    ctx.fill();
  });
}

/* -------------------------------------------------------------------------------------------------
 * Planos del bosque
 * ---------------------------------------------------------------------------------------------- */

/** Plano lejano: cielo cálido, follaje difuso, troncos pálidos y bruma. */
function paintFarForest(ctx: CanvasRenderingContext2D, rng: Rng) {
  const sky = ctx.createLinearGradient(0, 0, 0, 620);
  sky.addColorStop(0, '#f3e6b4');
  sky.addColorStop(0.3, '#cddaa0');
  sky.addColorStop(0.65, '#86a86f');
  sky.addColorStop(1, '#3f5f3b');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, 1000, 620);

  const sun = ctx.createRadialGradient(730, 30, 10, 730, 30, 460);
  sun.addColorStop(0, 'rgba(255,246,205,0.95)');
  sun.addColorStop(0.35, 'rgba(255,232,160,0.45)');
  sun.addColorStop(1, 'rgba(255,232,160,0)');
  ctx.fillStyle = sun;
  ctx.fillRect(0, 0, 1000, 620);

  // Troncos lejanos, muy pálidos por la bruma.
  for (let index = 0; index < 16; index += 1) {
    const x = range(rng, 0, 1000);
    const width = range(rng, 6, 16);
    const gradient = ctx.createLinearGradient(x - width, 0, x + width, 0);
    gradient.addColorStop(0, 'rgba(110,120,90,0)');
    gradient.addColorStop(0.5, `rgba(110,118,88,${range(rng, 0.25, 0.45)})`);
    gradient.addColorStop(1, 'rgba(110,120,90,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(x - width, range(rng, 120, 220), width * 2, 420);
  }

  // Tres franjas de follaje difuso, cada una algo más oscura y cercana.
  const rows = [
    { y: 230, color: '178,200,140', alpha: 0.55, min: 50, max: 95 },
    { y: 300, color: '128,165,105', alpha: 0.6, min: 55, max: 105 },
    { y: 380, color: '92,132,80', alpha: 0.7, min: 60, max: 115 },
  ];
  rows.forEach((row) => {
    for (let index = 0; index < 34; index += 1) {
      softBlob(ctx, range(rng, -40, 1040), row.y + range(rng, -60, 50), range(rng, row.min, row.max), row.color,
        row.alpha);
    }
  });

  // Bruma luminosa a media altura y suelo lejano.
  const mist = ctx.createLinearGradient(0, 380, 0, 540);
  mist.addColorStop(0, 'rgba(236,240,205,0)');
  mist.addColorStop(0.5, 'rgba(236,240,205,0.32)');
  mist.addColorStop(1, 'rgba(236,240,205,0)');
  ctx.fillStyle = mist;
  ctx.fillRect(0, 380, 1000, 160);
  const ground = ctx.createLinearGradient(0, 470, 0, 620);
  ground.addColorStop(0, 'rgba(60,92,52,0)');
  ground.addColorStop(1, 'rgba(48,74,40,0.95)');
  ctx.fillStyle = ground;
  ctx.fillRect(0, 470, 1000, 150);
}

/** Plano intermedio: troncos medianos con corteza, copas y suelo, atenuados por la distancia. */
function paintMidForest(ctx: CanvasRenderingContext2D, rng: Rng) {
  const trunks = [70, 205, 330, 455, 590, 715, 835, 950];
  trunks.forEach((baseX, index) => {
    const bottom = 600;
    const top = range(rng, 40, 110);
    const baseWidth = range(rng, 30, 46);
    const topWidth = baseWidth * range(rng, 0.55, 0.7);
    const lean = range(rng, -18, 18);
    const edgeAt = (t: number): [number, number] => {
      const center = baseX + lean * t + Math.sin(t * 6 + index) * 3;
      const width = baseWidth + (topWidth - baseWidth) * t + (t < 0.08 ? (0.08 - t) * 160 : 0);
      return [center - width / 2, center + width / 2];
    };
    ctx.save();
    ctx.beginPath();
    for (let t = 0; t <= 1.0001; t += 0.05) {
      const [left] = edgeAt(t);
      const y = bottom - (bottom - top) * t;
      if (t === 0) ctx.moveTo(left, y);
      else ctx.lineTo(left, y);
    }
    for (let t = 1; t >= -0.0001; t -= 0.05) {
      const [, right] = edgeAt(t);
      ctx.lineTo(right, bottom - (bottom - top) * t);
    }
    ctx.closePath();
    const bark = ctx.createLinearGradient(baseX - baseWidth, 0, baseX + baseWidth, 0);
    bark.addColorStop(0, '#3a3424');
    bark.addColorStop(0.55, '#6b5a3c');
    bark.addColorStop(1, '#3e3626');
    ctx.fillStyle = bark;
    ctx.fill();
    ctx.clip();
    paintBark(ctx, rng, edgeAt, bottom, top, -1);
    // Atenuación atmosférica del plano intermedio.
    ctx.fillStyle = 'rgba(170,195,140,0.32)';
    ctx.fillRect(0, 0, 1000, 620);
    ctx.restore();
  });

  // Copas del plano intermedio en la parte superior.
  for (let index = 0; index < 13; index += 1) {
    drawFoliage(ctx, rng, index * 82 + range(rng, -20, 20), range(rng, 20, 95), range(rng, 70, 110),
      range(rng, 45, 70), 34, 240, 0.35);
  }

  // Arbustos y suelo intermedio.
  for (let index = 0; index < 12; index += 1) {
    drawFoliage(ctx, rng, range(rng, 0, 1000), range(rng, 505, 545), range(rng, 40, 75), range(rng, 22, 34), 30, 140,
      0.25);
  }
  const ground = ctx.createLinearGradient(0, 520, 0, 620);
  ground.addColorStop(0, 'rgba(58,86,46,0)');
  ground.addColorStop(0.3, 'rgba(58,86,46,0.9)');
  ground.addColorStop(1, 'rgba(40,62,32,1)');
  ctx.fillStyle = ground;
  ctx.beginPath();
  ctx.moveTo(0, 548);
  for (let x = 0; x <= 1000; x += 25) ctx.lineTo(x, 545 + Math.sin(x * 0.012) * 12 + range(rng, -2, 2));
  ctx.lineTo(1000, 620);
  ctx.lineTo(0, 620);
  ctx.closePath();
  ctx.fill();
}

/**
 * Árbol de primer plano en un borde: tronco grueso inclinado, raíces, una rama secundaria y follaje.
 * `mirrored` coloca el tronco en el borde derecho; la semilla distinta evita que sea un reflejo exacto.
 */
function paintFrontTree(ctx: CanvasRenderingContext2D, rng: Rng, mirrored: boolean) {
  if (mirrored) {
    ctx.translate(260, 0);
    ctx.scale(-1, 1);
  }
  const bottom = 640;
  const top = -10;
  const baseWidth = range(rng, 112, 128);
  const topWidth = range(rng, 58, 70);
  const lean = range(rng, 8, 22);
  const edgeAt = (t: number): [number, number] => {
    const center = 34 + lean * t + Math.sin(t * 5 + (mirrored ? 1 : 0)) * 6;
    const flare = t < 0.12 ? (0.12 - t) * 380 : 0;
    const width = baseWidth + (topWidth - baseWidth) * t + flare;
    return [center - width / 2, center + width / 2];
  };

  // Raíces detrás del tronco.
  for (let root = 0; root < 4; root += 1) {
    drawRoot(ctx, range(rng, 40, 90), bottom - range(rng, 40, 70), range(rng, 120, 210), bottom - range(rng, 0, 18),
      range(rng, 8, 15), '#4a3622');
  }

  ctx.save();
  ctx.beginPath();
  for (let t = 0; t <= 1.0001; t += 0.025) {
    const [left] = edgeAt(t);
    const y = bottom - (bottom - top) * t;
    if (t === 0) ctx.moveTo(left, y);
    else ctx.lineTo(left, y);
  }
  for (let t = 1; t >= -0.0001; t -= 0.025) {
    const [, right] = edgeAt(t);
    ctx.lineTo(right, bottom - (bottom - top) * t);
  }
  ctx.closePath();
  const bark = ctx.createLinearGradient(-40, 0, 140, 0);
  bark.addColorStop(0, '#24170c');
  bark.addColorStop(0.55, mirrored ? '#5d4128' : '#6a4a2c');
  bark.addColorStop(0.85, '#7d5a36');
  bark.addColorStop(1, '#3a2716');
  ctx.fillStyle = bark;
  ctx.fill();
  ctx.clip();
  paintBark(ctx, rng, edgeAt, bottom, top, -1);
  // Hueco en el tronco.
  const hollowY = range(rng, 330, 420);
  const hollow = ctx.createRadialGradient(46, hollowY, 2, 46, hollowY, 22);
  hollow.addColorStop(0, '#0d0804');
  hollow.addColorStop(1, '#2a1a0c');
  ctx.fillStyle = hollow;
  ctx.beginPath();
  ctx.ellipse(46, hollowY, 12, 20, 0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Rama secundaria que asciende hacia el borde del lienzo.
  const branchY = range(rng, 230, 290);
  ctx.fillStyle = '#5a3f26';
  ctx.beginPath();
  ctx.moveTo(70, branchY + 26);
  ctx.quadraticCurveTo(150, branchY - 10, 225, branchY - 70);
  ctx.lineTo(232, branchY - 62);
  ctx.quadraticCurveTo(160, branchY + 8, 76, branchY + 46);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(20,10,4,0.6)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  drawFoliage(ctx, rng, 220, branchY - 78, 48, 32, 36, 220);

  // Copa en la esquina superior.
  drawFoliage(ctx, rng, 40, 30, 150, 80, 32, 520);
  drawFoliage(ctx, rng, 150, 70, 95, 55, 38, 320);

  // Hiedra que baja por el tronco.
  ctx.strokeStyle = '#3f6b34';
  ctx.lineWidth = 2;
  ctx.beginPath();
  let ivyX = 70;
  ctx.moveTo(ivyX, 120);
  for (let y = 120; y < 470; y += 14) {
    ivyX += range(rng, -6, 6);
    ctx.lineTo(ivyX, y);
    if (rng() > 0.4) {
      ctx.save();
      ctx.fillStyle = `hsl(${range(rng, 95, 120)} 45% ${range(rng, 28, 42)}%)`;
      ctx.translate(ivyX, y);
      ctx.rotate(range(rng, -1, 1));
      ctx.beginPath();
      ctx.ellipse(5, 0, 5, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
  ctx.stroke();
}

/** Rama principal de la que cuelgan los panales; sigue `branchYAt` y entra en los troncos de los bordes. */
function paintBranch(ctx: CanvasRenderingContext2D, rng: Rng) {
  const top: Array<[number, number]> = [];
  const bottom: Array<[number, number]> = [];
  for (let x = -10; x <= 1010; x += 10) {
    const center = branchYAt(x) - BRANCH_TEXTURE_TOP;
    const taper = 1 - Math.sin((Math.max(0, Math.min(1000, x)) / 1000) * Math.PI) * 0.35;
    const thickness = 26 * taper + Math.sin(x * 0.07) * 1.6 + range(rng, -0.8, 0.8);
    top.push([x, center - thickness / 2]);
    bottom.push([x, center + thickness / 2]);
  }

  // Ramitas secundarias por detrás de la rama.
  for (let twig = 0; twig < 12; twig += 1) {
    const x = range(rng, 40, 960);
    const y = branchYAt(x) - BRANCH_TEXTURE_TOP;
    const up = rng() > 0.4;
    const endX = x + range(rng, -60, 60);
    const endY = y + (up ? -range(rng, 40, 80) : range(rng, 20, 45));
    ctx.strokeStyle = '#5a3f26';
    ctx.lineWidth = range(rng, 3, 5);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo((x + endX) / 2 + range(rng, -10, 10), (y + endY) / 2, endX, endY);
    ctx.stroke();
    drawFoliage(ctx, rng, endX, endY, range(rng, 22, 36), range(rng, 14, 22), 38, 90);
  }

  ctx.save();
  ctx.beginPath();
  top.forEach(([px, py], index) => (index ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
  [...bottom].reverse().forEach(([px, py]) => ctx.lineTo(px, py));
  ctx.closePath();
  const bark = ctx.createLinearGradient(0, 70, 0, 130);
  bark.addColorStop(0, '#8b6440');
  bark.addColorStop(0.5, '#6a4a2c');
  bark.addColorStop(1, '#33210f');
  ctx.fillStyle = bark;
  ctx.fill();
  ctx.clip();
  // Vetas a lo largo de la rama.
  for (let line = 0; line < 22; line += 1) {
    const offset = range(rng, -12, 12);
    const phase = range(rng, 0, Math.PI * 2);
    const start = range(rng, -10, 700);
    const length = range(rng, 120, 420);
    ctx.strokeStyle = rng() > 0.35 ? `rgba(30,16,8,${range(rng, 0.4, 0.7)})` : 'rgba(255,220,170,0.15)';
    ctx.lineWidth = range(rng, 1, 2.2);
    ctx.beginPath();
    for (let x = start; x <= start + length; x += 8) {
      const y = branchYAt(x) - BRANCH_TEXTURE_TOP + offset + Math.sin(x * 0.05 + phase) * 1.5;
      if (x === start) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  // Musgo sobre el lomo de la rama.
  for (let speck = 0; speck < 700; speck += 1) {
    const x = range(rng, -10, 1010);
    const y = branchYAt(x) - BRANCH_TEXTURE_TOP - range(rng, 4, 14);
    ctx.fillStyle = `hsla(${range(rng, 80, 110)} 50% ${range(rng, 30, 46)}% / ${range(rng, 0.4, 0.85)})`;
    ctx.beginPath();
    ctx.arc(x, y, range(rng, 0.8, 2.4), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  ctx.strokeStyle = 'rgba(25,14,6,0.8)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  top.forEach(([px, py], index) => (index ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
  ctx.stroke();
  ctx.beginPath();
  bottom.forEach(([px, py], index) => (index ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
  ctx.stroke();

  // Racimos de hojas sobre la rama y lianas colgantes.
  for (let cluster = 0; cluster < 14; cluster += 1) {
    const x = cluster * 74 + range(rng, 0, 40);
    drawFoliage(ctx, rng, x, branchYAt(x) - BRANCH_TEXTURE_TOP - range(rng, 12, 26), range(rng, 26, 40),
      range(rng, 12, 18), 40, 110);
  }
  for (let vine = 0; vine < 7; vine += 1) {
    const x = range(rng, 60, 940);
    let y = branchYAt(x) - BRANCH_TEXTURE_TOP + 8;
    let vx = x;
    const length = range(rng, 40, 90);
    ctx.strokeStyle = '#3f6b34';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(vx, y);
    for (let step = 0; step < length; step += 8) {
      vx += range(rng, -2.5, 2.5);
      y += 8;
      ctx.lineTo(vx, y);
    }
    ctx.stroke();
    for (let leaf = 0; leaf < length / 12; leaf += 1) {
      ctx.fillStyle = `hsl(${range(rng, 95, 120)} 45% ${range(rng, 32, 46)}%)`;
      ctx.beginPath();
      ctx.ellipse(x + range(rng, -5, 5), branchYAt(x) - BRANCH_TEXTURE_TOP + 14 + leaf * 12, 4, 2.4,
        range(rng, -1, 1), 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

/**
 * Vegetación de primer plano (franja inferior): helechos, hierba, flores, setas, piedras y raíces.
 * Los laterales son más altos; el centro queda bajo para no tapar etiquetas ni la entrada de las abejas.
 */
function paintFrontGround(ctx: CanvasRenderingContext2D, rng: Rng) {
  const height = 170;
  const profile = (x: number) => {
    const side = Math.max(0, 1 - Math.min(x, 1000 - x) / 170);
    return height - 34 - side * 70 - Math.sin(x * 0.03) * 4;
  };
  const soil = ctx.createLinearGradient(0, 60, 0, height);
  soil.addColorStop(0, '#2f4a26');
  soil.addColorStop(1, '#1b2a15');
  ctx.fillStyle = soil;
  ctx.beginPath();
  ctx.moveTo(0, height);
  for (let x = 0; x <= 1000; x += 10) ctx.lineTo(x, profile(x) + 14);
  ctx.lineTo(1000, height);
  ctx.closePath();
  ctx.fill();

  // Piedras con musgo.
  for (let stone = 0; stone < 7; stone += 1) {
    const x = range(rng, 0, 1000);
    const y = profile(x) + 22;
    const radius = range(rng, 9, 18);
    const gradient = ctx.createRadialGradient(x - radius * 0.3, y - radius * 0.4, 1, x, y, radius);
    gradient.addColorStop(0, '#8d8a7a');
    gradient.addColorStop(1, '#45453c');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(x, y, radius, radius * 0.62, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(90,140,70,0.75)';
    ctx.beginPath();
    ctx.ellipse(x - radius * 0.1, y - radius * 0.45, radius * 0.7, radius * 0.22, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Raíces que asoman en las esquinas.
  [[0, 90, 140, 150], [1000, 92, 860, 152], [0, 120, 90, 162], [1000, 118, 920, 160]].forEach(
    ([fromX, fromY, toX, toY]) => drawRoot(ctx, fromX, fromY, toX, toY, 9, '#4a3622'),
  );

  // Hierba continua.
  for (let x = 0; x <= 1000; x += 9) drawGrassTuft(ctx, rng, x + range(rng, -3, 3), profile(x) + 18, range(rng, 10, 22));

  // Helechos, más grandes en los laterales.
  for (let fern = 0; fern < 16; fern += 1) {
    const side = fern % 2 === 0;
    const x = side ? range(rng, 0, 150) : range(rng, 850, 1000);
    drawFern(ctx, rng, x, profile(x) + 20, range(rng, 50, 85), (x < 500 ? 1 : -1) * range(rng, 0.3, 0.9), 34);
  }
  for (let fern = 0; fern < 6; fern += 1) {
    const x = range(rng, 180, 820);
    drawFern(ctx, rng, x, profile(x) + 22, range(rng, 22, 34), range(rng, -0.8, 0.8), 36);
  }

  // Setas y flores.
  [[118, 1], [905, 0.9], [300, 0.6], [690, 0.7]].forEach(([x, scale]) => drawMushroom(ctx, x, profile(x) + 22,
    14 * scale));
  for (let flower = 0; flower < 26; flower += 1) {
    const x = range(rng, 10, 990);
    const tall = Math.min(x, 1000 - x) < 170;
    drawFlower(ctx, rng, x, profile(x) + (tall ? range(rng, -10, 8) : range(rng, 2, 12)), range(rng, 4.5, 7.5),
      FLOWER_COLORS[flower % FLOWER_COLORS.length]);
  }
}

/* -------------------------------------------------------------------------------------------------
 * Luz y partículas
 * ---------------------------------------------------------------------------------------------- */

/** Haz de luz vertical: centro brillante, bordes y extremo inferior transparentes. */
function paintLightShaft(ctx: CanvasRenderingContext2D) {
  const width = 180;
  const height = 720;
  const across = ctx.createLinearGradient(0, 0, width, 0);
  across.addColorStop(0, 'rgba(255,255,255,0)');
  across.addColorStop(0.5, 'rgba(255,255,255,0.9)');
  across.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = across;
  ctx.fillRect(0, 0, width, height);
  ctx.globalCompositeOperation = 'destination-in';
  const along = ctx.createLinearGradient(0, 0, 0, height);
  along.addColorStop(0, 'rgba(0,0,0,1)');
  along.addColorStop(0.6, 'rgba(0,0,0,0.45)');
  along.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = along;
  ctx.fillRect(0, 0, width, height);
  ctx.globalCompositeOperation = 'source-over';
}

function radialSprite(ctx: CanvasRenderingContext2D, width: number, height: number, stops: Array<[number, string]>) {
  ctx.save();
  ctx.scale(1, height / width);
  const gradient = ctx.createRadialGradient(width / 2, width / 2, 0, width / 2, width / 2, width / 2);
  stops.forEach(([offset, color]) => gradient.addColorStop(offset, color));
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, width);
  ctx.restore();
}

function paintSoftLight(ctx: CanvasRenderingContext2D) {
  radialSprite(ctx, 256, 256, [[0, 'rgba(255,255,255,1)'], [0.25, 'rgba(255,255,255,0.5)'],
    [0.6, 'rgba(255,255,255,0.12)'], [1, 'rgba(255,255,255,0)']]);
}

function paintSoftShadow(ctx: CanvasRenderingContext2D) {
  radialSprite(ctx, 128, 56, [[0, 'rgba(20,14,4,0.55)'], [0.6, 'rgba(20,14,4,0.25)'], [1, 'rgba(20,14,4,0)']]);
}

function paintMote(ctx: CanvasRenderingContext2D) {
  radialSprite(ctx, 20, 20, [[0, 'rgba(255,255,255,1)'], [0.3, 'rgba(255,255,255,0.4)'], [1, 'rgba(255,255,255,0)']]);
}

function paintSpark(ctx: CanvasRenderingContext2D) {
  radialSprite(ctx, 18, 18, [[0, 'rgba(255,255,255,1)'], [0.35, 'rgba(255,255,255,0.35)'],
    [1, 'rgba(255,255,255,0)']]);
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(9, 1);
  ctx.lineTo(9, 17);
  ctx.moveTo(1, 9);
  ctx.lineTo(17, 9);
  ctx.stroke();
}

/** Pétalos y hojas para las partículas que caen; cada uno ocupa una celda de la fila. */
function paintFlutter(ctx: CanvasRenderingContext2D) {
  const petalColors = [['#d9ccff', '#a993f0'], ['#fff6e2', '#e8d6b0'], ['#fff0a6', '#f2c94c'], ['#ffd0c0', '#f29a80']];
  petalColors.forEach(([light, dark], index) => {
    const cx = index * FLUTTER_CELL.width + FLUTTER_CELL.width / 2;
    const cy = FLUTTER_CELL.height / 2;
    const gradient = ctx.createLinearGradient(cx - 9, cy, cx + 9, cy);
    gradient.addColorStop(0, dark);
    gradient.addColorStop(1, light);
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(cx - 9, cy);
    ctx.bezierCurveTo(cx - 4, cy - 7, cx + 7, cy - 6, cx + 9, cy);
    ctx.bezierCurveTo(cx + 7, cy + 6, cx - 4, cy + 7, cx - 9, cy);
    ctx.fill();
    ctx.strokeStyle = 'rgba(120,80,90,0.3)';
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.moveTo(cx - 8, cy);
    ctx.lineTo(cx + 5, cy);
    ctx.stroke();
  });
  const leafColors = [['#9fd06a', '#4f8f45'], ['#6fae55', '#335f2e'], ['#d2d36a', '#8c9a3e']];
  leafColors.forEach(([light, dark], index) => {
    const cx = (index + petalColors.length) * FLUTTER_CELL.width + FLUTTER_CELL.width / 2;
    const cy = FLUTTER_CELL.height / 2;
    const gradient = ctx.createLinearGradient(cx, cy - 6, cx, cy + 6);
    gradient.addColorStop(0, light);
    gradient.addColorStop(1, dark);
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(cx - 11, cy);
    ctx.quadraticCurveTo(cx - 1, cy - 8, cx + 11, cy);
    ctx.quadraticCurveTo(cx - 1, cy + 8, cx - 11, cy);
    ctx.fill();
    ctx.strokeStyle = 'rgba(30,50,20,0.55)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(cx - 11, cy);
    ctx.lineTo(cx + 9, cy);
    ctx.stroke();
  });
}

/* -------------------------------------------------------------------------------------------------
 * Abeja
 * ---------------------------------------------------------------------------------------------- */

/**
 * Tres fotogramas de 34×28 con la abeja mirando a la derecha. Solo cambian las alas; el cuerpo coincide
 * para que el aleteo no desplace la silueta.
 */
function paintBee(ctx: CanvasRenderingContext2D) {
  const wingPoses = [
    { angle: -1.05, offsetY: -6 },
    { angle: -0.35, offsetY: -3 },
    { angle: 0.25, offsetY: 0 },
  ];
  wingPoses.forEach((pose, frame) => {
    ctx.save();
    ctx.translate(frame * BEE_FRAME_SIZE.width, 0);
    const drawWing = (x: number, y: number, length: number, alpha: number) => {
      ctx.save();
      ctx.translate(x, y + pose.offsetY);
      ctx.rotate(pose.angle);
      ctx.fillStyle = `rgba(225,242,255,${alpha})`;
      ctx.strokeStyle = 'rgba(255,255,255,0.9)';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.ellipse(-length * 0.15, -length * 0.42, length * 0.36, length * 0.62, 0.15, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = 'rgba(120,150,180,0.5)';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-length * 0.2, -length * 0.85);
      ctx.stroke();
      ctx.restore();
    };
    // Ala trasera, detrás del cuerpo.
    drawWing(14, 11, 10, 0.4);

    // Aguijón.
    ctx.fillStyle = '#2b1d0e';
    ctx.beginPath();
    ctx.moveTo(4, 16);
    ctx.lineTo(8.5, 14);
    ctx.lineTo(8.5, 18);
    ctx.closePath();
    ctx.fill();

    // Cuerpo con franjas.
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(15.5, 16, 8.5, 6.6, -0.08, 0, Math.PI * 2);
    const body = ctx.createLinearGradient(0, 10, 0, 23);
    body.addColorStop(0, '#ffe680');
    body.addColorStop(0.55, '#f5b51a');
    body.addColorStop(1, '#c47c05');
    ctx.fillStyle = body;
    ctx.fill();
    ctx.clip();
    ctx.fillStyle = '#2b1d0e';
    [10.6, 15.4].forEach((stripeX) => {
      ctx.beginPath();
      ctx.ellipse(stripeX, 16, 1.7, 7.5, -0.12, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.beginPath();
    ctx.ellipse(17, 12.2, 4.5, 1.4, -0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.strokeStyle = '#2b1d0e';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.ellipse(15.5, 16, 8.5, 6.6, -0.08, 0, Math.PI * 2);
    ctx.stroke();

    // Cabeza, ojo y antenas.
    ctx.fillStyle = '#2b1d0e';
    ctx.beginPath();
    ctx.arc(25, 13.5, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(26.6, 12.6, 2.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#120a04';
    ctx.beginPath();
    ctx.arc(27.2, 12.8, 1.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.fillRect(26.2, 11.6, 0.9, 0.9);
    ctx.strokeStyle = '#2b1d0e';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(25, 9);
    ctx.quadraticCurveTo(26, 4, 29.5, 3.5);
    ctx.moveTo(27, 9.5);
    ctx.quadraticCurveTo(29.5, 6, 32, 6.5);
    ctx.stroke();
    ctx.fillStyle = '#2b1d0e';
    ctx.beginPath();
    ctx.arc(29.5, 3.5, 1, 0, Math.PI * 2);
    ctx.arc(32, 6.5, 1, 0, Math.PI * 2);
    ctx.fill();

    // Ala delantera, sobre el cuerpo.
    drawWing(16, 11, 12, 0.55);
    ctx.restore();
  });
}

/* -------------------------------------------------------------------------------------------------
 * Panal
 * ---------------------------------------------------------------------------------------------- */

const HIVE_SEEDS = [701, 1409, 2213];
const CELL_RADIUS = 8.2;

/** Silueta orgánica del panal: más estrecha arriba, con ondulaciones suaves deterministas por variante. */
function hiveOutline(variant: number) {
  const rng = createRng(HIVE_SEEDS[variant % HIVE_VARIANTS]);
  const { centerX, centerY, radiusX, radiusY } = HIVE_SIZE;
  const phases = [range(rng, 0, Math.PI * 2), range(rng, 0, Math.PI * 2)];
  const amplitudes = [range(rng, 1.5, 3), range(rng, 1, 2.2)];
  const points: Array<[number, number]> = [];
  for (let step = 0; step < 72; step += 1) {
    const angle = (step / 72) * Math.PI * 2;
    const narrowTop = 1 - 0.2 * Math.max(0, -Math.sin(angle));
    const wobble = Math.sin(angle * 3 + phases[0]) * amplitudes[0] + Math.sin(angle * 5 + phases[1]) * amplitudes[1];
    points.push([
      centerX + Math.cos(angle) * (radiusX * narrowTop + wobble),
      centerY + Math.sin(angle) * (radiusY + wobble * 0.6),
    ]);
  }
  return points;
}

function traceOutline(ctx: CanvasRenderingContext2D, points: Array<[number, number]>) {
  ctx.beginPath();
  points.forEach(([px, py], index) => (index ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
  ctx.closePath();
}

function traceHex(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number) {
  ctx.beginPath();
  for (let corner = 0; corner < 6; corner += 1) {
    const angle = Math.PI / 6 + (corner * Math.PI) / 3;
    const px = x + Math.cos(angle) * radius;
    const py = y + Math.sin(angle) * radius;
    if (corner) ctx.lineTo(px, py);
    else ctx.moveTo(px, py);
  }
  ctx.closePath();
}

/** Centros de las celdas (rejilla de hexágonos con vértice arriba) y su distancia normalizada al centro. */
function hiveCells() {
  const { centerX, centerY, radiusX, radiusY } = HIVE_SIZE;
  const columnStep = Math.sqrt(3) * CELL_RADIUS;
  const rowStep = 1.5 * CELL_RADIUS;
  const cells: Array<{ x: number; y: number; distance: number }> = [];
  for (let row = -6; row <= 6; row += 1) {
    for (let column = -5; column <= 5; column += 1) {
      const x = centerX + column * columnStep + (row % 2 ? columnStep / 2 : 0);
      const y = centerY + row * rowStep;
      const distance = Math.hypot((x - centerX) / radiusX, (y - centerY) / radiusY);
      if (distance < 0.86) cells.push({ x, y, distance });
    }
  }
  return cells;
}

const HIVE_ENTRANCE = { x: HIVE_SIZE.centerX, y: HIVE_SIZE.centerY + 22 };

function paintHive(ctx: CanvasRenderingContext2D, variant: number) {
  const rng = createRng(HIVE_SEEDS[variant % HIVE_VARIANTS] + 1);
  const { centerX, centerY } = HIVE_SIZE;
  const outline = hiveOutline(variant);

  // Cuerpo de cera con volumen.
  ctx.save();
  traceOutline(ctx, outline);
  const body = ctx.createRadialGradient(centerX - 18, centerY - 26, 6, centerX, centerY, 78);
  body.addColorStop(0, '#ffe7a0');
  body.addColorStop(0.45, '#f7bf45');
  body.addColorStop(0.85, '#c97a12');
  body.addColorStop(1, '#8a4a08');
  ctx.fillStyle = body;
  ctx.fill();
  ctx.clip();

  // Celdas: paredes de cera claras, interiores llenos de miel o vacíos y en sombra.
  hiveCells().forEach((cell) => {
    if (rng() < 0.08) return;
    const radius = CELL_RADIUS * range(rng, 0.92, 1);
    const depthShade = cell.distance * 0.35;
    traceHex(ctx, cell.x, cell.y, radius);
    ctx.fillStyle = `rgba(255,226,140,${0.55 - depthShade * 0.4})`;
    ctx.fill();
    const filled = rng() < 0.68;
    const inner = ctx.createRadialGradient(cell.x - 1.5, cell.y - 2, 0.5, cell.x, cell.y, radius);
    if (filled) {
      inner.addColorStop(0, '#ffd970');
      inner.addColorStop(0.7, '#e59a1c');
      inner.addColorStop(1, '#b56a0b');
    } else {
      inner.addColorStop(0, '#9a5a0c');
      inner.addColorStop(1, '#6a3a06');
    }
    traceHex(ctx, cell.x, cell.y, radius - 1.6);
    ctx.fillStyle = inner;
    ctx.fill();
    // Bisel: luz arriba-izquierda y sombra abajo-derecha.
    ctx.lineWidth = 0.9;
    ctx.strokeStyle = 'rgba(255,248,215,0.55)';
    ctx.beginPath();
    ctx.arc(cell.x, cell.y, radius - 2.2, Math.PI * 1.05, Math.PI * 1.6);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(90,40,0,0.45)';
    ctx.beginPath();
    ctx.arc(cell.x, cell.y, radius - 2.2, Math.PI * 0.05, Math.PI * 0.6);
    ctx.stroke();
    if (filled && rng() < 0.35) {
      ctx.fillStyle = 'rgba(255,255,240,0.7)';
      ctx.beginPath();
      ctx.ellipse(cell.x - 2, cell.y - 2.4, 1.6, 0.9, -0.5, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  // Sombreado de volumen y luz superior izquierda.
  const volume = ctx.createRadialGradient(centerX - 10, centerY - 18, 20, centerX, centerY, 76);
  volume.addColorStop(0, 'rgba(255,240,190,0.12)');
  volume.addColorStop(0.65, 'rgba(120,60,0,0)');
  volume.addColorStop(1, 'rgba(90,40,0,0.6)');
  ctx.fillStyle = volume;
  ctx.fillRect(0, 0, HIVE_SIZE.width, HIVE_SIZE.height);
  const specular = ctx.createRadialGradient(centerX - 22, centerY - 34, 1, centerX - 22, centerY - 34, 24);
  specular.addColorStop(0, 'rgba(255,255,240,0.55)');
  specular.addColorStop(1, 'rgba(255,255,240,0)');
  ctx.fillStyle = specular;
  ctx.fillRect(0, 0, HIVE_SIZE.width, HIVE_SIZE.height);
  ctx.restore();

  // Borde exterior dorado, más grueso en el lado en sombra.
  traceOutline(ctx, outline);
  ctx.strokeStyle = '#ffcf4d';
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.save();
  traceOutline(ctx, outline);
  ctx.clip();
  ctx.strokeStyle = 'rgba(140,70,0,0.7)';
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.ellipse(centerX + 3, centerY + 4, HIVE_SIZE.radiusX, HIVE_SIZE.radiusY, 0, Math.PI * -0.1, Math.PI * 0.75);
  ctx.stroke();
  ctx.restore();
  traceOutline(ctx, outline);
  ctx.strokeStyle = '#5e3205';
  ctx.lineWidth = 1.6;
  ctx.stroke();

  // Entrada.
  const entrance = ctx.createRadialGradient(HIVE_ENTRANCE.x, HIVE_ENTRANCE.y - 2, 1, HIVE_ENTRANCE.x,
    HIVE_ENTRANCE.y, 16);
  entrance.addColorStop(0, '#120804');
  entrance.addColorStop(1, '#4a2604');
  ctx.fillStyle = entrance;
  ctx.beginPath();
  ctx.ellipse(HIVE_ENTRANCE.x, HIVE_ENTRANCE.y, 15, 9.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#ffd56a';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.ellipse(HIVE_ENTRANCE.x, HIVE_ENTRANCE.y + 0.5, 15, 9.5, 0, Math.PI * 0.1, Math.PI * 0.9);
  ctx.stroke();

  // Gotas de miel que cuelgan del borde inferior.
  const drips = 2 + (variant % 2);
  for (let drip = 0; drip < drips; drip += 1) {
    const angle = Math.PI * (0.32 + drip * 0.18 + range(rng, -0.04, 0.04));
    const [baseX, baseY] = outline[Math.round((angle / (Math.PI * 2)) * outline.length) % outline.length];
    const length = range(rng, 8, 16);
    const drop = ctx.createLinearGradient(baseX - 3, 0, baseX + 3, 0);
    drop.addColorStop(0, '#c97a12');
    drop.addColorStop(0.5, '#ffc843');
    drop.addColorStop(1, '#a95f08');
    ctx.fillStyle = drop;
    ctx.beginPath();
    ctx.moveTo(baseX - 3.2, baseY - 2);
    ctx.quadraticCurveTo(baseX - 2.4, baseY + length * 0.6, baseX - 3.4, baseY + length);
    ctx.arc(baseX, baseY + length, 3.4, Math.PI, 0, true);
    ctx.quadraticCurveTo(baseX + 2.4, baseY + length * 0.6, baseX + 3.2, baseY - 2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,240,0.8)';
    ctx.beginPath();
    ctx.arc(baseX - 1.2, baseY + length - 0.6, 1, 0, Math.PI * 2);
    ctx.fill();
  }

  // Nudo de cera donde se sujeta el tallo.
  ctx.fillStyle = '#d58f1c';
  ctx.beginPath();
  ctx.ellipse(centerX, centerY - HIVE_SIZE.radiusY + 4, 10, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#5e3205';
  ctx.lineWidth = 1.2;
  ctx.stroke();
}

/** Reflejos: cada fotograma ilumina las celdas de una franja diagonal distinta. */
function paintGlints(ctx: CanvasRenderingContext2D) {
  const cells = hiveCells();
  GLINT_FRAMES.forEach((_, frame) => {
    const offsetX = frame * HIVE_SIZE.width;
    cells.forEach((cell) => {
      const band = (cell.x - HIVE_SIZE.centerX) * 0.8 + (cell.y - HIVE_SIZE.centerY);
      const center = -40 + frame * 40;
      const strength = 1 - Math.abs(band - center) / 18;
      if (strength <= 0 || cell.distance > 0.8) return;
      const gradient = ctx.createRadialGradient(offsetX + cell.x - 1.5, cell.y - 2, 0, offsetX + cell.x, cell.y, 6);
      gradient.addColorStop(0, `rgba(255,250,220,${0.9 * strength})`);
      gradient.addColorStop(1, 'rgba(255,250,220,0)');
      ctx.fillStyle = gradient;
      traceHex(ctx, offsetX + cell.x, cell.y, CELL_RADIUS - 2);
      ctx.fill();
    });
  });
}
