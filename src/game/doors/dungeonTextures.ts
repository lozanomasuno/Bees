import Phaser from 'phaser';

/**
 * Texturas procedurales de la mazmorra de puertas.
 *
 * Responsabilidad: pintar con Canvas 2D, una sola vez por instancia de `Phaser.Game`, todo el arte que
 * usan `DoorView`, `playDoorOpening` y `DungeonAmbience` (muros, marcos, hojas de puerta, antorchas,
 * partículas y objetos narrativos). No crea objetos de juego ni animaciones.
 *
 * Contrato:
 * - `ensureDungeonTextures(scene)` es idempotente: si una clave ya existe en el gestor de texturas no se
 *   vuelve a pintar (reinicio de escena dentro del mismo juego).
 * - Las claves y medidas públicas viven en `DUNGEON_TEXTURES`, `DOOR_FRAME`, `DOOR_LEAF` y `FLAME_FRAME`.
 * - Cada variante de puerta (0 y 1) usa una semilla fija: las grietas y tablones no cambian entre partidas,
 *   y el anverso y el reverso comparten exactamente la misma silueta.
 *
 * Las texturas funcionan con WebGL y Canvas; solo `Mesh2D` (en `doorView.ts`) exige WebGL.
 */

/** Medidas del marco de piedra; el hueco transparente queda en (openingX, openingY). */
export const DOOR_FRAME = {
  width: 252,
  height: 392,
  openingX: 42,
  openingY: 72,
  openingWidth: 168,
  openingHeight: 290,
} as const;

/** Medidas de la hoja: algo mayor que el hueco para solaparse con las jambas. */
export const DOOR_LEAF = { width: 174, height: 294 } as const;

/** Tamaño de cada fotograma de la llama de antorcha. */
export const FLAME_FRAME = { width: 48, height: 84, count: 6 } as const;

/** Colores de identidad de cada puerta (runas, luz interior y destellos). */
export const DOOR_PALETTE = [
  { rune: '#ffd56b', runeShadow: '#ff9b2f', light: 0xffc45a },
  { rune: '#8ff3ff', runeShadow: '#5c7bff', light: 0x8fd8ff },
] as const;

export const DUNGEON_TEXTURES = {
  backdrop: 'dungeon-backdrop',
  vignette: 'dungeon-vignette',
  frame: 'door-frame',
  interior: 'door-interior',
  plaque: 'door-plaque',
  lightSpill: 'door-light-spill',
  softLight: 'fx-soft-light',
  mote: 'fx-mote',
  spark: 'fx-spark',
  ember: 'fx-ember',
  splinter: 'fx-splinter',
  dustPuff: 'fx-dust-puff',
  bubble: 'fx-bubble',
  drop: 'fx-drop',
  torch: 'torch-sconce',
  flame: 'torch-flame',
  runeCircle: 'wall-rune-circle',
  cage: 'prop-cage',
  chain: 'prop-chain',
  shelf: 'prop-potion-shelf',
  egg: 'prop-egg',
  eggGlow: 'prop-egg-glow',
  nest: 'prop-nest',
  cobweb: 'prop-cobweb',
  spider: 'prop-spider',
  wand: 'prop-wand',
  puddle: 'prop-puddle',
} as const;

/** Claves de las caras de la hoja según la variante (0 = puerta 1, 1 = puerta 2). */
export function leafTextureKeys(variant: number) {
  return {
    front: `door-leaf-front-${variant}`,
    back: `door-leaf-back-${variant}`,
    runes: `door-leaf-runes-${variant}`,
  };
}

/** Posición de los cuellos de las botellas dentro de la textura del estante (para las burbujas). */
export const SHELF_BOTTLES = [
  { x: 30, y: 40, color: 0xc77dff },
  { x: 75, y: 32, color: 0x7dff9b },
  { x: 110, y: 58, color: 0x7de8ff },
] as const;

/** Punto de rotura de la varita, donde salta la chispa. */
export const WAND_SPARK_POINT = { x: 61, y: 17 } as const;

export type Rng = () => number;

/** Generador pseudoaleatorio determinista (mulberry32) para que el arte sea estable entre partidas. */
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

/** Crea una CanvasTexture si no existe y la pinta con `painter`. Devuelve la textura o null. */
function paintTexture(scene: Phaser.Scene, key: string, width: number, height: number, seed: number, painter: Painter) {
  if (scene.textures.exists(key)) return null;
  const texture = scene.textures.createCanvas(key, width, height);
  if (!texture) return null;
  painter(texture.getContext(), createRng(seed));
  texture.refresh();
  return texture;
}

/** Pinta todas las texturas necesarias para la escena de puertas. */
export function ensureDungeonTextures(scene: Phaser.Scene) {
  const keys = DUNGEON_TEXTURES;
  paintTexture(scene, keys.backdrop, 1000, 620, 11, paintBackdrop);
  paintTexture(scene, keys.vignette, 1000, 620, 12, paintVignette);
  paintTexture(scene, keys.frame, DOOR_FRAME.width, DOOR_FRAME.height, 21, paintFrame);
  paintTexture(scene, keys.interior, DOOR_FRAME.openingWidth, DOOR_FRAME.openingHeight, 22, paintInterior);
  paintTexture(scene, keys.plaque, 150, 38, 23, paintPlaque);
  paintTexture(scene, keys.lightSpill, 260, 120, 24, paintLightSpill);
  paintTexture(scene, keys.softLight, 256, 256, 31, paintSoftLight);
  paintTexture(scene, keys.mote, 24, 24, 32, paintMote);
  paintTexture(scene, keys.spark, 18, 18, 33, paintSpark);
  paintTexture(scene, keys.ember, 10, 10, 34, paintEmber);
  paintTexture(scene, keys.splinter, 18, 6, 35, paintSplinter);
  paintTexture(scene, keys.dustPuff, 48, 48, 36, paintDustPuff);
  paintTexture(scene, keys.bubble, 12, 12, 37, paintBubble);
  paintTexture(scene, keys.drop, 8, 14, 38, paintDrop);
  paintTexture(scene, keys.torch, 44, 100, 41, paintTorchSconce);
  paintFlameFrames(scene);
  paintTexture(scene, keys.runeCircle, 220, 220, 51, paintRuneCircle);
  paintTexture(scene, keys.cage, 124, 132, 52, paintCage);
  paintTexture(scene, keys.chain, 16, 190, 53, paintChain);
  paintTexture(scene, keys.shelf, 170, 120, 54, paintPotionShelf);
  paintTexture(scene, keys.egg, 70, 92, 55, paintEgg);
  paintTexture(scene, keys.eggGlow, 70, 92, 55, paintEggGlow);
  paintTexture(scene, keys.nest, 132, 46, 56, paintNest);
  paintTexture(scene, keys.cobweb, 170, 170, 57, paintCobweb);
  paintTexture(scene, keys.spider, 32, 28, 58, paintSpider);
  paintTexture(scene, keys.wand, 112, 34, 59, paintWand);
  paintTexture(scene, keys.puddle, 96, 24, 60, paintPuddle);

  [0, 1].forEach((variant) => {
    const leafKeys = leafTextureKeys(variant);
    const { width, height } = DOOR_LEAF;
    paintTexture(scene, leafKeys.front, width, height, 0, (ctx) => paintLeafFront(ctx, variant));
    paintTexture(scene, leafKeys.back, width, height, 0, (ctx) => paintLeafBack(ctx, variant));
    paintTexture(scene, leafKeys.runes, width, height, 0, (ctx) => paintLeafRunes(ctx, variant));
  });
}

/* -------------------------------------------------------------------------------------------------
 * Muro, suelo y marco
 * ---------------------------------------------------------------------------------------------- */

/** Bloque de piedra con esquinas irregulares, moteado, bisel y desconchones ocasionales. */
function drawStoneBlock(
  ctx: CanvasRenderingContext2D,
  rng: Rng,
  x: number,
  y: number,
  width: number,
  height: number,
  hue: number,
  lightness: number,
) {
  const jitter = () => range(rng, -2.5, 2.5);
  const corners: Array<[number, number]> = [
    [x + jitter(), y + jitter()],
    [x + width + jitter(), y + jitter()],
    [x + width + jitter(), y + height + jitter()],
    [x + jitter(), y + height + jitter()],
  ];
  ctx.save();
  ctx.beginPath();
  corners.forEach(([px, py], index) => (index ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
  ctx.closePath();
  const fill = ctx.createLinearGradient(x, y, x + width * 0.4, y + height);
  fill.addColorStop(0, `hsl(${hue} 14% ${lightness + 4}%)`);
  fill.addColorStop(1, `hsl(${hue} 16% ${lightness - 4}%)`);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.clip();

  // Moteado mineral: puntos claros y oscuros de baja opacidad.
  const specks = Math.floor((width * height) / 38);
  for (let index = 0; index < specks; index += 1) {
    const light = rng() > 0.5;
    ctx.fillStyle = light ? `rgba(220,210,240,${range(rng, 0.03, 0.09)})` : `rgba(8,4,16,${range(rng, 0.08, 0.2)})`;
    ctx.fillRect(x + rng() * width, y + rng() * height, range(rng, 0.8, 2.4), range(rng, 0.8, 2.4));
  }

  // Bisel: luz arriba-izquierda, sombra abajo-derecha.
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = 'rgba(230,215,255,0.13)';
  ctx.beginPath();
  ctx.moveTo(corners[3][0] + 1, corners[3][1]);
  ctx.lineTo(corners[0][0] + 1, corners[0][1] + 1);
  ctx.lineTo(corners[1][0], corners[1][1] + 1);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(5,2,10,0.55)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(corners[1][0] - 1, corners[1][1]);
  ctx.lineTo(corners[2][0] - 1, corners[2][1] - 1);
  ctx.lineTo(corners[3][0], corners[3][1] - 1);
  ctx.stroke();

  // Desconchón en una esquina.
  if (rng() < 0.22) {
    const [cx, cy] = corners[Math.floor(rng() * 4)];
    ctx.fillStyle = 'rgba(10,6,18,0.85)';
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + range(rng, -12, 12), cy + range(rng, -3, 3));
    ctx.lineTo(cx + range(rng, -4, 4), cy + range(rng, -10, 10));
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

/** Grieta como camino aleatorio con borde iluminado. */
function drawCrack(ctx: CanvasRenderingContext2D, rng: Rng, x: number, y: number, length: number, dark: string) {
  const points: Array<[number, number]> = [[x, y]];
  let angle = range(rng, Math.PI * 0.3, Math.PI * 0.7);
  for (let step = 0; step < length / 7; step += 1) {
    angle += range(rng, -0.6, 0.6);
    const [lx, ly] = points[points.length - 1];
    points.push([lx + Math.cos(angle) * 7, ly + Math.sin(angle) * 7]);
  }
  const trace = (offset: number) => {
    ctx.beginPath();
    points.forEach(([px, py], index) => (index ? ctx.lineTo(px + offset, py) : ctx.moveTo(px + offset, py)));
    ctx.stroke();
  };
  ctx.lineCap = 'round';
  ctx.strokeStyle = 'rgba(255,240,220,0.1)';
  ctx.lineWidth = 0.8;
  trace(1.2);
  ctx.strokeStyle = dark;
  ctx.lineWidth = 1.6;
  trace(0);
}

function paintBackdrop(ctx: CanvasRenderingContext2D, rng: Rng) {
  const width = 1000;
  const height = 620;
  const floorY = 508;

  const base = ctx.createLinearGradient(0, 0, 0, height);
  base.addColorStop(0, '#0d0a18');
  base.addColorStop(0.5, '#1c1630');
  base.addColorStop(1, '#120e1a');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, width, height);

  // Muro de sillares en hiladas irregulares (el fondo oscuro actúa como mortero).
  let rowY = 26;
  let row = 0;
  while (rowY < floorY) {
    const rowHeight = Math.min(range(rng, 44, 58), floorY - rowY);
    let blockX = row % 2 ? -range(rng, 30, 70) : -range(rng, 0, 20);
    while (blockX < width) {
      const blockWidth = range(rng, 72, 132);
      drawStoneBlock(ctx, rng, blockX + 2, rowY + 2, blockWidth - 4, rowHeight - 4, range(rng, 252, 276),
        range(rng, 19, 27));
      blockX += blockWidth;
    }
    rowY += rowHeight;
    row += 1;
  }

  // Bóveda oscura en la parte superior.
  const vault = ctx.createLinearGradient(0, 0, 0, 170);
  vault.addColorStop(0, 'rgba(4,2,10,0.92)');
  vault.addColorStop(1, 'rgba(4,2,10,0)');
  ctx.fillStyle = vault;
  ctx.fillRect(0, 0, width, 170);

  // Raíces colgando del techo.
  ctx.lineCap = 'round';
  for (let index = 0; index < 9; index += 1) {
    let rx = range(rng, 20, 980);
    let ry = 0;
    ctx.strokeStyle = `rgba(52,36,28,${range(rng, 0.6, 0.9)})`;
    ctx.lineWidth = range(rng, 1.5, 4);
    ctx.beginPath();
    ctx.moveTo(rx, ry);
    const segments = Math.floor(range(rng, 4, 10));
    for (let step = 0; step < segments; step += 1) {
      rx += range(rng, -7, 7);
      ry += range(rng, 6, 12);
      ctx.lineTo(rx, ry);
    }
    ctx.stroke();
  }

  // Grietas del muro.
  for (let index = 0; index < 14; index += 1) {
    drawCrack(ctx, rng, range(rng, 20, 980), range(rng, 60, 440), range(rng, 30, 90), 'rgba(4,2,8,0.85)');
  }

  // Manchas de humedad que bajan desde las juntas.
  for (let index = 0; index < 18; index += 1) {
    const sx = range(rng, 0, width);
    const sy = range(rng, 40, 300);
    const streak = ctx.createLinearGradient(0, sy, 0, sy + range(rng, 60, 160));
    streak.addColorStop(0, 'rgba(10,20,18,0.35)');
    streak.addColorStop(1, 'rgba(10,20,18,0)');
    ctx.fillStyle = streak;
    ctx.fillRect(sx, sy, range(rng, 4, 14), 160);
  }

  // Suelo de losas con perspectiva hacia el punto de fuga central.
  const vanishX = 500;
  const vanishY = 300;
  ctx.fillStyle = '#0c0912';
  ctx.fillRect(0, floorY, width, height - floorY);
  const rows = [floorY, 522, 541, 566, 598, 640];
  for (let r = 0; r < rows.length - 1; r += 1) {
    for (let column = -14; column <= 14; column += 1) {
      const toX = (bottomX: number, y: number) => vanishX + (bottomX - vanishX) * ((y - vanishY) / (640 - vanishY));
      const left = 500 + column * 92 + (r % 2 ? 46 : 0);
      const right = left + 92;
      const top = rows[r] + 1.5;
      const bottom = rows[r + 1] - 1.5;
      ctx.beginPath();
      ctx.moveTo(toX(left, top) + 1.5, top);
      ctx.lineTo(toX(right, top) - 1.5, top);
      ctx.lineTo(toX(right, bottom) - 1.5, bottom);
      ctx.lineTo(toX(left, bottom) + 1.5, bottom);
      ctx.closePath();
      ctx.fillStyle = `hsl(${range(rng, 255, 275)} 12% ${range(rng, 15, 22)}%)`;
      ctx.fill();
    }
  }
  const floorShade = ctx.createLinearGradient(0, floorY, 0, height);
  floorShade.addColorStop(0, 'rgba(4,2,10,0.55)');
  floorShade.addColorStop(0.35, 'rgba(4,2,10,0.1)');
  floorShade.addColorStop(1, 'rgba(4,2,10,0.5)');
  ctx.fillStyle = floorShade;
  ctx.fillRect(0, floorY, width, height - floorY);

  // Sombra de contacto entre muro y suelo.
  const junction = ctx.createLinearGradient(0, floorY - 40, 0, floorY + 6);
  junction.addColorStop(0, 'rgba(4,2,10,0)');
  junction.addColorStop(1, 'rgba(4,2,10,0.75)');
  ctx.fillStyle = junction;
  ctx.fillRect(0, floorY - 40, width, 46);

  // Musgo en la base del muro y en algunas juntas.
  for (let index = 0; index < 420; index += 1) {
    const mx = range(rng, 0, width);
    const my = index < 300 ? floorY - Math.pow(rng(), 2) * 60 : range(rng, 80, 480);
    const green = Math.floor(range(rng, 95, 140));
    ctx.fillStyle = `rgba(${Math.floor(range(rng, 50, 90))},${green},60,${range(rng, 0.12, 0.4)})`;
    ctx.beginPath();
    ctx.arc(mx, my, range(rng, 1, index < 300 ? 4 : 2.2), 0, Math.PI * 2);
    ctx.fill();
  }
}

function paintVignette(ctx: CanvasRenderingContext2D) {
  const gradient = ctx.createRadialGradient(500, 330, 180, 500, 330, 640);
  gradient.addColorStop(0, 'rgba(3,1,8,0)');
  gradient.addColorStop(0.6, 'rgba(3,1,8,0.35)');
  gradient.addColorStop(1, 'rgba(3,1,8,0.88)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1000, 620);
}

function paintFrame(ctx: CanvasRenderingContext2D, rng: Rng) {
  const { width, height, openingX, openingY, openingWidth, openingHeight } = DOOR_FRAME;
  const archCenterY = 112;

  // Tímpano macizo entre el arco y el dintel.
  ctx.fillStyle = '#2a2236';
  ctx.beginPath();
  ctx.arc(width / 2, archCenterY, 86, Math.PI, 0);
  ctx.lineTo(width - openingX, openingY);
  ctx.lineTo(openingX, openingY);
  ctx.closePath();
  ctx.fill();
  drawStoneBlock(ctx, rng, openingX - 6, openingY - 26, openingWidth + 12, 26, 262, 24);

  // Ojo rúnico tallado en el tímpano.
  ctx.strokeStyle = 'rgba(4,2,10,0.85)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(width / 2, 58, 22, 11, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(width / 2, 58, 5, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,220,180,0.12)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(width / 2 + 1, 59, 22, 11, 0, 0, Math.PI);
  ctx.stroke();

  // Dovelas del arco.
  const voussoirs = 9;
  for (let index = 0; index < voussoirs; index += 1) {
    const start = Math.PI + (Math.PI * index) / voussoirs + 0.012;
    const end = Math.PI + (Math.PI * (index + 1)) / voussoirs - 0.012;
    const outer = index === Math.floor(voussoirs / 2) ? 128 : 124;
    ctx.save();
    ctx.beginPath();
    ctx.arc(width / 2, archCenterY, outer, start, end);
    ctx.arc(width / 2, archCenterY, 86, end, start, true);
    ctx.closePath();
    const lightness = range(rng, 22, 30);
    ctx.fillStyle = `hsl(${range(rng, 255, 272)} 12% ${lightness}%)`;
    ctx.fill();
    ctx.clip();
    for (let speck = 0; speck < 70; speck += 1) {
      ctx.fillStyle = rng() > 0.5 ? 'rgba(230,220,255,0.06)' : 'rgba(5,2,10,0.18)';
      ctx.fillRect(range(rng, 0, width), range(rng, 0, 120), 1.6, 1.6);
    }
    ctx.restore();
    ctx.strokeStyle = 'rgba(5,2,10,0.8)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // Jambas de sillares.
  [0, width - openingX].forEach((jambX) => {
    let blockY = archCenterY;
    while (blockY < openingY + openingHeight) {
      const blockHeight = Math.min(range(rng, 38, 54), openingY + openingHeight - blockY);
      drawStoneBlock(ctx, rng, jambX + 2, blockY + 1, openingX - 4, blockHeight - 2, range(rng, 255, 272),
        range(rng, 22, 29));
      blockY += blockHeight;
    }
  });

  // Umbral gastado.
  drawStoneBlock(ctx, rng, 4, openingY + openingHeight + 1, width - 8, height - openingY - openingHeight - 4,
    262, 21);

  // Grietas sobre el marco.
  for (let index = 0; index < 4; index += 1) {
    drawCrack(ctx, rng, range(rng, 8, width - 8), range(rng, 40, 340), range(rng, 20, 50), 'rgba(4,2,8,0.9)');
  }

  // Musgo en la base de las jambas.
  for (let index = 0; index < 90; index += 1) {
    const side = rng() > 0.5 ? range(rng, 0, openingX) : range(rng, width - openingX, width);
    ctx.fillStyle = `rgba(62,${Math.floor(range(rng, 90, 120))},58,${range(rng, 0.12, 0.3)})`;
    ctx.beginPath();
    ctx.arc(side, openingY + openingHeight - Math.pow(rng(), 2) * 70, range(rng, 1, 3.2), 0, Math.PI * 2);
    ctx.fill();
  }

  // Sombra interior del vano y apertura transparente.
  ctx.clearRect(openingX, openingY, openingWidth, openingHeight);
}

function paintInterior(ctx: CanvasRenderingContext2D, rng: Rng) {
  const { openingWidth: width, openingHeight: height } = DOOR_FRAME;
  ctx.fillStyle = '#05030a';
  ctx.fillRect(0, 0, width, height);

  // Pasillo que se pierde en la oscuridad: paredes, suelo y escalones.
  const backX = width / 2;
  const backY = height * 0.42;
  const backWidth = 54;
  const backHeight = 86;
  const side = ctx.createLinearGradient(0, 0, width, 0);
  side.addColorStop(0, '#1d1530');
  side.addColorStop(0.35, '#0a0714');
  side.addColorStop(0.65, '#0a0714');
  side.addColorStop(1, '#1d1530');
  ctx.fillStyle = side;
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = '#120d20';
  ctx.fillRect(backX - backWidth / 2, backY - backHeight / 2, backWidth, backHeight);

  ctx.strokeStyle = 'rgba(120,100,170,0.18)';
  ctx.lineWidth = 1;
  [[0, 0], [width, 0], [0, height], [width, height]].forEach(([cornerX, cornerY]) => {
    ctx.beginPath();
    ctx.moveTo(cornerX, cornerY);
    ctx.lineTo(
      backX + (cornerX ? backWidth / 2 : -backWidth / 2),
      backY + (cornerY ? backHeight / 2 : -backHeight / 2),
    );
    ctx.stroke();
  });
  for (let step = 0; step < 6; step += 1) {
    const t = step / 6;
    const y = height - (height - (backY + backHeight / 2)) * t;
    const halfWidth = width / 2 - (width / 2 - backWidth / 2) * t;
    ctx.strokeStyle = `rgba(150,130,200,${0.16 - t * 0.12})`;
    ctx.beginPath();
    ctx.moveTo(backX - halfWidth, y);
    ctx.lineTo(backX + halfWidth, y);
    ctx.stroke();
  }

  // Niebla violeta al fondo y textura de piedra húmeda.
  const fog = ctx.createRadialGradient(backX, backY, 4, backX, backY, 110);
  fog.addColorStop(0, 'rgba(120,90,200,0.35)');
  fog.addColorStop(1, 'rgba(120,90,200,0)');
  ctx.fillStyle = fog;
  ctx.fillRect(0, 0, width, height);
  for (let index = 0; index < 260; index += 1) {
    ctx.fillStyle = `rgba(160,140,220,${range(rng, 0.02, 0.07)})`;
    ctx.fillRect(range(rng, 0, width), range(rng, 0, height), 1.4, 1.4);
  }

  // Sombra en los bordes del vano para dar profundidad.
  const inner = ctx.createLinearGradient(0, 0, 0, height);
  inner.addColorStop(0, 'rgba(0,0,0,0.75)');
  inner.addColorStop(0.18, 'rgba(0,0,0,0)');
  ctx.fillStyle = inner;
  ctx.fillRect(0, 0, width, height);
}

function paintPlaque(ctx: CanvasRenderingContext2D, rng: Rng) {
  const width = 150;
  const height = 38;
  ctx.fillStyle = '#4a2f1e';
  ctx.beginPath();
  ctx.moveTo(6, 3);
  ctx.lineTo(width - 4, 1);
  ctx.lineTo(width - 2, height - 4);
  ctx.lineTo(3, height - 2);
  ctx.closePath();
  ctx.fill();
  ctx.save();
  ctx.clip();
  for (let index = 0; index < 14; index += 1) {
    ctx.strokeStyle = rng() > 0.4 ? 'rgba(20,10,4,0.35)' : 'rgba(220,170,120,0.12)';
    ctx.lineWidth = range(rng, 0.6, 1.4);
    const y = range(rng, 2, height - 2);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(50, y + range(rng, -3, 3), 100, y + range(rng, -3, 3), width, y + range(rng, -2, 2));
    ctx.stroke();
  }
  ctx.restore();
  ctx.strokeStyle = '#1e120a';
  ctx.lineWidth = 2.5;
  ctx.stroke();
  [[10, height / 2], [width - 10, height / 2]].forEach(([nailX, nailY]) => {
    ctx.fillStyle = '#2b2522';
    ctx.beginPath();
    ctx.arc(nailX, nailY, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,220,190,0.4)';
    ctx.fillRect(nailX - 1, nailY - 1.5, 1.2, 1.2);
  });
}

function paintLightSpill(ctx: CanvasRenderingContext2D) {
  const width = 260;
  const height = 120;
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, 'rgba(255,255,255,0.9)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.moveTo(width / 2 - 84, 0);
  ctx.lineTo(width / 2 + 84, 0);
  ctx.lineTo(width, height);
  ctx.lineTo(0, height);
  ctx.closePath();
  ctx.fill();
}

/* -------------------------------------------------------------------------------------------------
 * Hoja de la puerta
 * ---------------------------------------------------------------------------------------------- */

interface Plank {
  x0: number;
  x1: number;
  top: Array<[number, number]>;
  bottom: Array<[number, number]>;
}

const LEAF_SEEDS = [913, 4127];

/**
 * Silueta de los tablones. Se genera siempre con la misma semilla para que anverso, reverso y runas
 * coincidan píxel a píxel. Incluye un tablón partido arriba y otro podrido abajo.
 */
function buildLeafGeometry(variant: number): Plank[] {
  const rng = createRng(LEAF_SEEDS[variant]);
  const { width, height } = DOOR_LEAF;
  const count = 5;
  const raw = Array.from({ length: count }, () => range(rng, 0.8, 1.2));
  const total = raw.reduce((sum, value) => sum + value, 0);
  const brokenTop = 1 + Math.floor(rng() * (count - 1));
  const rottenBottom = Math.floor(rng() * count);
  const planks: Plank[] = [];
  let cursor = 0;
  raw.forEach((value, index) => {
    const plankWidth = (value / total) * width;
    const x0 = cursor + (index === 0 ? 0 : 1.3);
    const x1 = cursor + plankWidth - (index === count - 1 ? 0 : 1.3);
    const top: Array<[number, number]> = [];
    const bottom: Array<[number, number]> = [];
    for (let step = 0; step <= 4; step += 1) {
      const px = x0 + ((x1 - x0) * step) / 4;
      let topY = range(rng, 0, 5);
      if (index === brokenTop && step >= 2) topY = range(rng, 14, 30) * (step / 4) + 6;
      let bottomY = height - range(rng, 0, 6);
      if (index === rottenBottom && step <= 2) bottomY = height - range(rng, 10, 20);
      top.push([px, topY]);
      bottom.push([px, bottomY]);
    }
    planks.push({ x0, x1, top, bottom });
    cursor += plankWidth;
  });
  return planks;
}

function tracePlank(ctx: CanvasRenderingContext2D, plank: Plank) {
  ctx.beginPath();
  plank.top.forEach(([px, py], index) => (index ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
  [...plank.bottom].reverse().forEach(([px, py]) => ctx.lineTo(px, py));
  ctx.closePath();
}

/** Tablones con veta, nudos, grietas y bisel; `tone` oscurece el reverso. */
function paintPlanks(ctx: CanvasRenderingContext2D, rng: Rng, planks: Plank[], variant: number, tone: number) {
  const { height } = DOOR_LEAF;
  const baseHue = variant === 0 ? 27 : 19;
  const baseSaturation = variant === 0 ? 40 : 27;
  const baseLightness = (variant === 0 ? 28 : 24) - tone;

  planks.forEach((plank) => {
    const plankWidth = plank.x1 - plank.x0;
    ctx.save();
    tracePlank(ctx, plank);
    ctx.fillStyle = `hsl(${baseHue + range(rng, -3, 3)} ${baseSaturation + range(rng, -6, 6)}% ${
      baseLightness + range(rng, -4, 4)}%)`;
    ctx.fill();
    ctx.clip();

    // Veta ondulada a lo largo del tablón.
    for (let grain = 0; grain < 20; grain += 1) {
      const gx = plank.x0 + rng() * plankWidth;
      const amplitude = range(rng, 0.4, 2.4);
      const frequency = range(rng, 0.015, 0.05);
      const phase = range(rng, 0, Math.PI * 2);
      const drift = range(rng, -4, 4);
      ctx.beginPath();
      for (let y = -4; y <= height + 4; y += 6) {
        const px = gx + Math.sin(y * frequency + phase) * amplitude + (y / height) * drift;
        if (y === -4) ctx.moveTo(px, y);
        else ctx.lineTo(px, y);
      }
      ctx.strokeStyle = rng() < 0.65 ? `rgba(28,14,6,${range(rng, 0.2, 0.45)})` : `rgba(225,175,120,${
        range(rng, 0.05, 0.13)})`;
      ctx.lineWidth = range(rng, 0.6, 1.7);
      ctx.stroke();
    }

    // Nudos de la madera.
    const knots = Math.floor(range(rng, 0, 2.6));
    for (let knot = 0; knot < knots; knot += 1) {
      const kx = plank.x0 + range(rng, 6, plankWidth - 6);
      const ky = range(rng, 30, height - 30);
      for (let ring = 4; ring >= 1; ring -= 1) {
        ctx.strokeStyle = `rgba(30,14,6,${0.15 + ring * 0.08})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(kx, ky, ring * 2.2, ring * 3.6, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.fillStyle = 'rgba(20,9,3,0.8)';
      ctx.beginPath();
      ctx.ellipse(kx, ky, 2.2, 3.4, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Desgaste: poros y manchas.
    for (let speck = 0; speck < 120; speck += 1) {
      ctx.fillStyle = rng() > 0.3 ? `rgba(15,7,2,${range(rng, 0.1, 0.3)})` : 'rgba(230,190,140,0.08)';
      ctx.fillRect(plank.x0 + rng() * plankWidth, rng() * height, range(rng, 0.6, 2), range(rng, 1, 4));
    }

    // Grietas siguiendo la veta.
    const cracks = Math.floor(range(rng, 1, 3));
    for (let crack = 0; crack < cracks; crack += 1) {
      let cx = plank.x0 + range(rng, 4, plankWidth - 4);
      let cy = range(rng, 10, height - 120);
      const length = range(rng, 40, 130);
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      const points: Array<[number, number]> = [[cx, cy]];
      for (let step = 0; step < length / 8; step += 1) {
        cx += range(rng, -1.8, 1.8);
        cy += 8;
        points.push([cx, cy]);
      }
      ctx.strokeStyle = 'rgba(8,3,1,0.9)';
      ctx.lineWidth = range(rng, 1.2, 2.2);
      ctx.beginPath();
      points.forEach(([px, py], index) => (index ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
      ctx.stroke();
      ctx.strokeStyle = 'rgba(240,200,150,0.14)';
      ctx.lineWidth = 0.7;
      ctx.beginPath();
      points.forEach(([px, py], index) => (index ? ctx.lineTo(px + 1.4, py) : ctx.moveTo(px + 1.4, py)));
      ctx.stroke();
    }

    // Bisel del tablón.
    const bevel = ctx.createLinearGradient(plank.x0, 0, plank.x1, 0);
    bevel.addColorStop(0, 'rgba(255,215,160,0.16)');
    bevel.addColorStop(0.12, 'rgba(255,215,160,0)');
    bevel.addColorStop(0.82, 'rgba(10,4,0,0)');
    bevel.addColorStop(1, 'rgba(10,4,0,0.55)');
    ctx.fillStyle = bevel;
    ctx.fillRect(plank.x0, 0, plankWidth, height);
    ctx.restore();

    tracePlank(ctx, plank);
    ctx.strokeStyle = 'rgba(12,5,2,0.85)';
    ctx.lineWidth = 1.2;
    ctx.stroke();
  });
}

/** Astillas que sobresalen de los bordes rotos de los tablones. */
function paintSplinters(ctx: CanvasRenderingContext2D, rng: Rng, planks: Plank[], tone: number) {
  planks.forEach((plank) => {
    const pieces = Math.floor(range(rng, 1, 4));
    for (let piece = 0; piece < pieces; piece += 1) {
      const fromTop = rng() > 0.45;
      const edge = fromTop ? plank.top : plank.bottom;
      const [ex, ey] = edge[Math.floor(rng() * edge.length)];
      const length = range(rng, 5, 13);
      const lean = range(rng, -4, 4);
      const direction = fromTop ? -1 : 1;
      ctx.fillStyle = `hsl(30 38% ${46 - tone}%)`;
      ctx.beginPath();
      ctx.moveTo(ex - 1.6, ey + direction * 2);
      ctx.lineTo(ex + lean, ey + direction * length);
      ctx.lineTo(ex + 1.8, ey + direction * 2);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(20,9,3,0.6)';
      ctx.lineWidth = 0.6;
      ctx.stroke();
    }
  });
}

/** Aplica sombreado global solo sobre la madera ya pintada (respeta huecos y bordes irregulares). */
function paintLeafWeathering(ctx: CanvasRenderingContext2D, rng: Rng, dampness: number) {
  const { width, height } = DOOR_LEAF;
  ctx.save();
  ctx.globalCompositeOperation = 'source-atop';
  const shade = ctx.createLinearGradient(0, 0, 0, height);
  shade.addColorStop(0, 'rgba(255,200,140,0.08)');
  shade.addColorStop(0.55, 'rgba(0,0,0,0)');
  shade.addColorStop(1, `rgba(12,24,10,${dampness})`);
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, width, height);
  for (let index = 0; index < 100; index += 1) {
    ctx.fillStyle = `rgba(${Math.floor(range(rng, 50, 75))},${Math.floor(range(rng, 85, 115))},52,${
      range(rng, 0.14, 0.34)})`;
    ctx.beginPath();
    ctx.arc(rng() * width, height - Math.pow(rng(), 2.2) * 50, range(rng, 0.8, 2.6), 0, Math.PI * 2);
    ctx.fill();
  }
  const edges = ctx.createLinearGradient(0, 0, width, 0);
  edges.addColorStop(0, 'rgba(0,0,0,0.3)');
  edges.addColorStop(0.1, 'rgba(0,0,0,0)');
  edges.addColorStop(0.9, 'rgba(0,0,0,0)');
  edges.addColorStop(1, 'rgba(0,0,0,0.35)');
  ctx.fillStyle = edges;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

/** Cinta de hierro oxidado con remaches; `length` indica hasta dónde llega desde la bisagra. */
function paintStrap(ctx: CanvasRenderingContext2D, rng: Rng, centerY: number, length: number) {
  // Regueros de óxido sobre la madera, bajo los remaches.
  for (let rivet = 12; rivet < length; rivet += 24) {
    const streak = ctx.createLinearGradient(0, centerY + 6, 0, centerY + range(rng, 18, 36));
    streak.addColorStop(0, 'rgba(150,62,22,0.45)');
    streak.addColorStop(1, 'rgba(150,62,22,0)');
    ctx.fillStyle = streak;
    ctx.fillRect(rivet - 1.5, centerY + 6, range(rng, 2, 4), 34);
  }

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(-2, centerY - 7);
  ctx.lineTo(length, centerY - 6 + range(rng, -1, 1));
  ctx.lineTo(length + 8, centerY - 10);
  ctx.lineTo(length + 16, centerY);
  ctx.lineTo(length + 8, centerY + 10);
  ctx.lineTo(length, centerY + 6 + range(rng, -1, 1));
  ctx.lineTo(-2, centerY + 7);
  ctx.closePath();
  ctx.fillStyle = '#3a2f2c';
  ctx.fill();
  ctx.clip();
  for (let blotch = 0; blotch < 50; blotch += 1) {
    ctx.fillStyle = rng() > 0.4
      ? `rgba(${Math.floor(range(rng, 130, 180))},${Math.floor(range(rng, 55, 85))},25,${range(rng, 0.2, 0.5)})`
      : 'rgba(15,10,10,0.35)';
    ctx.beginPath();
    ctx.arc(range(rng, 0, length + 16), centerY + range(rng, -8, 8), range(rng, 1, 4.5), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = 'rgba(255,225,200,0.2)';
  ctx.fillRect(-2, centerY - 7, length + 18, 1.5);
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(-2, centerY + 5, length + 18, 2);
  ctx.restore();
  ctx.strokeStyle = 'rgba(10,6,6,0.9)';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  for (let rivet = 12; rivet < length; rivet += 24) {
    ctx.fillStyle = '#1d1715';
    ctx.beginPath();
    ctx.arc(rivet, centerY, 2.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,215,180,0.45)';
    ctx.fillRect(rivet - 1.4, centerY - 1.8, 1.3, 1.3);
  }

  // Nudillo de la bisagra en el canto.
  ctx.fillStyle = '#241c1a';
  ctx.fillRect(0, centerY - 11, 7, 22);
  ctx.fillStyle = 'rgba(255,215,180,0.25)';
  ctx.fillRect(1.5, centerY - 11, 1.2, 22);
}

/** Glifos rúnicos en coordenadas normalizadas (0..1) dentro de una caja de 24×30. */
const RUNE_GLYPHS: Array<Array<Array<[number, number]>>> = [
  [[[0.35, 0], [0.35, 1]], [[0.35, 0.15], [0.85, 0.4]], [[0.35, 0.42], [0.85, 0.67]]],
  [[[0.25, 0], [0.25, 1]], [[0.25, 0.18], [0.8, 0.45], [0.25, 0.72]]],
  [[[0.5, 0], [0.5, 1]], [[0.5, 0.5], [0.12, 0.12]], [[0.5, 0.5], [0.88, 0.12]]],
  [[[0.5, 0], [0.12, 0.5], [0.5, 1], [0.88, 0.5], [0.5, 0]]],
  [[[0.15, 0], [0.15, 1]], [[0.85, 0], [0.85, 1]], [[0.15, 0.1], [0.85, 0.9]], [[0.85, 0.1], [0.15, 0.9]]],
  [[[0.8, 0.05], [0.2, 0.5], [0.8, 0.95]]],
];

const RUNE_SETS = [[0, 3, 2], [5, 4, 1]];

/** Recorre las runas de la variante; lo comparten el tallado del anverso y la textura de brillo. */
function traceRunes(ctx: CanvasRenderingContext2D, variant: number, offsetX = 0, offsetY = 0) {
  const boxWidth = 22;
  const boxHeight = 30;
  const centerX = 90;
  RUNE_SETS[variant].forEach((glyphIndex, slot) => {
    const top = 102 + slot * 44;
    RUNE_GLYPHS[glyphIndex].forEach((stroke) => {
      ctx.beginPath();
      stroke.forEach(([gx, gy], index) => {
        const px = centerX - boxWidth / 2 + gx * boxWidth + offsetX;
        const py = top + gy * boxHeight + offsetY;
        if (index) ctx.lineTo(px, py);
        else ctx.moveTo(px, py);
      });
      ctx.stroke();
    });
  });
  // Círculo de sellado alrededor de la runa central.
  ctx.beginPath();
  ctx.arc(centerX + offsetX, 161 + offsetY, 24, 0, Math.PI * 2);
  ctx.stroke();
}

function paintLeafFront(ctx: CanvasRenderingContext2D, variant: number) {
  const rng = createRng(LEAF_SEEDS[variant] + 1);
  const planks = buildLeafGeometry(variant);
  const { width } = DOOR_LEAF;
  paintPlanks(ctx, rng, planks, variant, 0);
  paintLeafWeathering(ctx, rng, 0.5);

  // Runas talladas: surco oscuro y canto iluminado.
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(255,220,170,0.14)';
  ctx.lineWidth = 1.2;
  traceRunes(ctx, variant, 1.2, 1.2);
  ctx.strokeStyle = 'rgba(14,6,2,0.92)';
  ctx.lineWidth = 3.4;
  traceRunes(ctx, variant);

  ctx.save();
  ctx.globalCompositeOperation = 'source-atop';
  paintStrap(ctx, rng, 58, Math.round(width * 0.68));
  paintStrap(ctx, rng, 238, Math.round(width * 0.62));
  ctx.restore();

  // Aldaba de anilla en el lado libre.
  const ringX = width - 26;
  ctx.fillStyle = '#2a2220';
  ctx.beginPath();
  ctx.arc(ringX, 150, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,210,170,0.25)';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.strokeStyle = '#1b1514';
  ctx.lineWidth = 4.5;
  ctx.beginPath();
  ctx.arc(ringX, 166, 13, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(200,110,60,0.55)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(ringX, 166, 13, Math.PI * 0.9, Math.PI * 1.6);
  ctx.stroke();

  // Bocallave.
  ctx.fillStyle = '#2b2321';
  ctx.fillRect(ringX - 7, 192, 14, 24);
  ctx.fillStyle = '#050304';
  ctx.beginPath();
  ctx.arc(ringX, 200, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(ringX - 1.5, 200, 3, 9);

  paintSplinters(ctx, rng, planks, 0);
}

function paintLeafBack(ctx: CanvasRenderingContext2D, variant: number) {
  const rng = createRng(LEAF_SEEDS[variant] + 2);
  const planks = buildLeafGeometry(variant);
  const { width, height } = DOOR_LEAF;
  paintPlanks(ctx, rng, planks, variant, 6);

  // Travesaños y riostra en Z, recortados a la silueta de los tablones.
  ctx.save();
  ctx.globalCompositeOperation = 'source-atop';
  const drawBatten = (points: Array<[number, number]>) => {
    ctx.beginPath();
    points.forEach(([px, py], index) => (index ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
    ctx.closePath();
    ctx.fillStyle = `hsl(${variant === 0 ? 26 : 20} 32% 25%)`;
    ctx.fill();
    ctx.strokeStyle = 'rgba(8,3,1,0.85)';
    ctx.lineWidth = 2;
    ctx.stroke();
  };
  drawBatten([[4, 42], [width - 4, 40], [width - 4, 68], [4, 70]]);
  drawBatten([[4, 226], [width - 4, 228], [width - 4, 256], [4, 254]]);
  drawBatten([[12, 226], [38, 226], [width - 12, 70], [width - 38, 70]]);
  for (let nail = 0; nail < 18; nail += 1) {
    const nx = range(rng, 10, width - 10);
    const ny = rng() > 0.5 ? range(rng, 48, 62) : range(rng, 232, 248);
    ctx.fillStyle = '#1c1614';
    ctx.beginPath();
    ctx.arc(nx, ny, 2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fillRect(0, 0, width, height);
  ctx.restore();

  // Pestillo de hierro en el lado libre.
  ctx.fillStyle = '#262020';
  ctx.fillRect(width - 44, 146, 40, 8);
  ctx.fillRect(width - 14, 140, 8, 20);

  paintSplinters(ctx, rng, planks, 8);
}

/** Capa de brillo de las runas (se dibuja con mezcla aditiva sobre la hoja). */
function paintLeafRunes(ctx: CanvasRenderingContext2D, variant: number) {
  const palette = DOOR_PALETTE[variant];
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.shadowColor = palette.runeShadow;
  ctx.shadowBlur = 10;
  ctx.strokeStyle = palette.rune;
  ctx.lineWidth = 2.4;
  traceRunes(ctx, variant);
  ctx.shadowBlur = 4;
  ctx.lineWidth = 1.2;
  ctx.strokeStyle = '#fffbe8';
  traceRunes(ctx, variant);
}

/* -------------------------------------------------------------------------------------------------
 * Luces y partículas
 * ---------------------------------------------------------------------------------------------- */

function radialSprite(ctx: CanvasRenderingContext2D, size: number, stops: Array<[number, string]>) {
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  stops.forEach(([offset, color]) => gradient.addColorStop(offset, color));
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
}

function paintSoftLight(ctx: CanvasRenderingContext2D) {
  radialSprite(ctx, 256, [[0, 'rgba(255,255,255,1)'], [0.22, 'rgba(255,255,255,0.55)'],
    [0.55, 'rgba(255,255,255,0.14)'], [1, 'rgba(255,255,255,0)']]);
}

function paintMote(ctx: CanvasRenderingContext2D) {
  radialSprite(ctx, 24, [[0, 'rgba(255,255,255,0.95)'], [0.3, 'rgba(255,255,255,0.35)'],
    [1, 'rgba(255,255,255,0)']]);
}

function paintSpark(ctx: CanvasRenderingContext2D) {
  radialSprite(ctx, 18, [[0, 'rgba(255,255,255,1)'], [0.35, 'rgba(255,255,255,0.4)'], [1, 'rgba(255,255,255,0)']]);
  ctx.strokeStyle = 'rgba(255,255,255,0.9)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(9, 0);
  ctx.lineTo(9, 18);
  ctx.moveTo(0, 9);
  ctx.lineTo(18, 9);
  ctx.stroke();
}

function paintEmber(ctx: CanvasRenderingContext2D) {
  radialSprite(ctx, 10, [[0, 'rgba(255,255,255,1)'], [0.5, 'rgba(255,255,255,0.6)'], [1, 'rgba(255,255,255,0)']]);
}

function paintSplinter(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#b07a4a';
  ctx.beginPath();
  ctx.moveTo(0, 3);
  ctx.lineTo(18, 0.5);
  ctx.lineTo(14, 4);
  ctx.lineTo(1, 6);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#3a2210';
  ctx.lineWidth = 0.8;
  ctx.stroke();
}

function paintDustPuff(ctx: CanvasRenderingContext2D, rng: Rng) {
  for (let index = 0; index < 9; index += 1) {
    const px = 24 + range(rng, -9, 9);
    const py = 24 + range(rng, -9, 9);
    const radius = range(rng, 8, 16);
    const gradient = ctx.createRadialGradient(px, py, 0, px, py, radius);
    gradient.addColorStop(0, 'rgba(200,190,210,0.35)');
    gradient.addColorStop(1, 'rgba(200,190,210,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 48, 48);
  }
}

function paintBubble(ctx: CanvasRenderingContext2D) {
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(6, 6, 4.4, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.fillRect(3.6, 3.4, 1.6, 1.6);
}

function paintDrop(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = 'rgba(170,215,255,0.9)';
  ctx.beginPath();
  ctx.moveTo(4, 0);
  ctx.quadraticCurveTo(8, 9, 4, 13.5);
  ctx.quadraticCurveTo(0, 9, 4, 0);
  ctx.fill();
}

/* -------------------------------------------------------------------------------------------------
 * Antorchas
 * ---------------------------------------------------------------------------------------------- */

function paintTorchSconce(ctx: CanvasRenderingContext2D, rng: Rng) {
  // Placa y brazo de hierro.
  ctx.fillStyle = '#231c1b';
  ctx.fillRect(14, 64, 16, 30);
  ctx.fillStyle = 'rgba(255,210,170,0.2)';
  ctx.fillRect(15, 65, 2, 28);
  // Mango de madera.
  const handle = ctx.createLinearGradient(16, 0, 28, 0);
  handle.addColorStop(0, '#5a3820');
  handle.addColorStop(1, '#2c190c');
  ctx.fillStyle = handle;
  ctx.beginPath();
  ctx.moveTo(15, 30);
  ctx.lineTo(29, 30);
  ctx.lineTo(26, 92);
  ctx.lineTo(18, 92);
  ctx.closePath();
  ctx.fill();
  // Copa de hierro con trapo carbonizado.
  ctx.fillStyle = '#2a2120';
  ctx.beginPath();
  ctx.moveTo(6, 14);
  ctx.lineTo(38, 14);
  ctx.lineTo(30, 36);
  ctx.lineTo(14, 36);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#140d0b';
  ctx.beginPath();
  ctx.ellipse(22, 14, 16, 4.5, 0, 0, Math.PI * 2);
  ctx.fill();
  for (let band = 0; band < 3; band += 1) {
    ctx.fillStyle = `rgba(150,70,30,${range(rng, 0.3, 0.6)})`;
    ctx.fillRect(10 + band * 2, 20 + band * 5, 24 - band * 4, 2);
  }
  ctx.fillStyle = 'rgba(255,170,80,0.5)';
  ctx.beginPath();
  ctx.ellipse(22, 13, 12, 2.4, 0, 0, Math.PI * 2);
  ctx.fill();
}

/** Seis fotogramas de llama con lenguas y punta desplazadas para animar el fuego. */
function paintFlameFrames(scene: Phaser.Scene) {
  const key = DUNGEON_TEXTURES.flame;
  const { width, height, count } = FLAME_FRAME;
  const texture = paintTexture(scene, key, width * count, height, 71, (ctx, rng) => {
    for (let frame = 0; frame < count; frame += 1) {
      const cx = frame * width + width / 2;
      const base = height - 8;
      const wobble = Math.sin((frame / count) * Math.PI * 2) * 4;
      const tipHeight = range(rng, 62, 74);
      const layers: Array<[number, number, Array<[number, string]>]> = [
        [1, 1, [[0, '#fff6c9'], [0.3, '#ffcf5a'], [0.65, '#ff7a1f'], [1, 'rgba(190,40,10,0)']]],
        [0.62, 0.7, [[0, '#ffffff'], [0.45, '#fff1a8'], [1, 'rgba(255,190,60,0)']]],
      ];
      layers.forEach(([scaleX, scaleY, stops]) => {
        const top = base - tipHeight * scaleY;
        ctx.beginPath();
        ctx.moveTo(cx - 15 * scaleX, base - 8);
        ctx.bezierCurveTo(cx - 19 * scaleX, base - 34 * scaleY, cx - 6 * scaleX + wobble, base - 46 * scaleY,
          cx + wobble * 1.6, top);
        ctx.bezierCurveTo(cx + 8 * scaleX + wobble, base - 44 * scaleY, cx + 19 * scaleX, base - 32 * scaleY,
          cx + 15 * scaleX, base - 8);
        ctx.quadraticCurveTo(cx, base + 4, cx - 15 * scaleX, base - 8);
        const gradient = ctx.createRadialGradient(cx, base - 14, 1, cx, base - 20, tipHeight * scaleY);
        stops.forEach(([offset, color]) => gradient.addColorStop(offset, color));
        ctx.fillStyle = gradient;
        ctx.shadowColor = 'rgba(255,120,30,0.8)';
        ctx.shadowBlur = 10;
        ctx.fill();
      });
      // Lengua de fuego desprendida en algunos fotogramas.
      if (frame % 2 === 0) {
        ctx.fillStyle = 'rgba(255,190,80,0.75)';
        ctx.beginPath();
        ctx.ellipse(cx + range(rng, -6, 6), base - tipHeight - range(rng, 2, 8), 2.4, 5, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;
    }
  });
  if (!texture) return;
  for (let frame = 0; frame < count; frame += 1) {
    texture.add(`f${frame}`, 0, frame * width, 0, width, height);
  }
}

/* -------------------------------------------------------------------------------------------------
 * Objetos narrativos
 * ---------------------------------------------------------------------------------------------- */

function paintRuneCircle(ctx: CanvasRenderingContext2D, rng: Rng) {
  const center = 110;
  ctx.strokeStyle = '#d6b8ff';
  ctx.shadowColor = '#8f5bff';
  ctx.shadowBlur = 8;
  ctx.lineWidth = 2;
  [92, 76, 40].forEach((radius) => {
    ctx.beginPath();
    ctx.arc(center, center, radius, 0, Math.PI * 2);
    ctx.stroke();
  });
  // Triángulos entrelazados.
  [0, Math.PI].forEach((rotation) => {
    ctx.beginPath();
    for (let corner = 0; corner <= 3; corner += 1) {
      const angle = rotation - Math.PI / 2 + (corner * Math.PI * 2) / 3;
      const px = center + Math.cos(angle) * 72;
      const py = center + Math.sin(angle) * 72;
      if (corner) ctx.lineTo(px, py);
      else ctx.moveTo(px, py);
    }
    ctx.stroke();
  });
  // Runas pequeñas en el anillo.
  ctx.lineWidth = 1.6;
  for (let slot = 0; slot < 12; slot += 1) {
    const angle = (slot * Math.PI * 2) / 12;
    const glyph = RUNE_GLYPHS[Math.floor(rng() * RUNE_GLYPHS.length)];
    ctx.save();
    ctx.translate(center + Math.cos(angle) * 84, center + Math.sin(angle) * 84);
    ctx.rotate(angle + Math.PI / 2);
    glyph.forEach((stroke) => {
      ctx.beginPath();
      stroke.forEach(([gx, gy], index) => {
        const px = (gx - 0.5) * 8;
        const py = (gy - 0.5) * 10;
        if (index) ctx.lineTo(px, py);
        else ctx.moveTo(px, py);
      });
      ctx.stroke();
    });
    ctx.restore();
  }
}

function paintCage(ctx: CanvasRenderingContext2D, rng: Rng) {
  const cx = 46;
  const iron = '#3b3230';
  ctx.lineCap = 'round';
  // Argolla superior.
  ctx.strokeStyle = iron;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, 8, 5, 0, Math.PI * 2);
  ctx.stroke();
  // Cúpula.
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.ellipse(cx, 42, 38, 28, 0, Math.PI, 0);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx, 13);
  ctx.lineTo(cx, 14);
  ctx.stroke();
  // Barrotes (hueco a la derecha donde estaba la puerta).
  ctx.lineWidth = 2.6;
  for (let bar = 0; bar < 7; bar += 1) {
    const bx = 10 + bar * 12;
    if (bar === 5) continue;
    ctx.strokeStyle = bar % 2 ? iron : '#4a3f3b';
    ctx.beginPath();
    ctx.moveTo(bx, 42 - Math.sqrt(Math.max(0, 1 - ((bx - cx) / 38) ** 2)) * 28);
    ctx.lineTo(bx, 120);
    ctx.stroke();
  }
  // Aros horizontales y base.
  ctx.strokeStyle = iron;
  ctx.lineWidth = 3;
  [42, 82].forEach((ringY) => {
    ctx.beginPath();
    ctx.moveTo(8, ringY);
    ctx.lineTo(84, ringY);
    ctx.stroke();
  });
  ctx.fillStyle = '#2a2220';
  ctx.beginPath();
  ctx.ellipse(cx, 121, 40, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  // Puerta de la jaula abierta y colgando.
  ctx.strokeStyle = '#4a3f3b';
  ctx.lineWidth = 2.4;
  for (let bar = 0; bar < 3; bar += 1) {
    ctx.beginPath();
    ctx.moveTo(84 + bar * 10, 46 + bar * 4);
    ctx.lineTo(90 + bar * 11, 112 + bar * 3);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(84, 46);
  ctx.lineTo(104, 54);
  ctx.moveTo(90, 112);
  ctx.lineTo(112, 118);
  ctx.stroke();
  // Óxido.
  for (let spot = 0; spot < 40; spot += 1) {
    ctx.fillStyle = `rgba(160,72,30,${range(rng, 0.25, 0.55)})`;
    ctx.fillRect(range(rng, 8, 112), range(rng, 16, 122), 1.6, 1.6);
  }
  // Plumas sueltas en el suelo de la jaula: algo escapó.
  ctx.fillStyle = 'rgba(255,214,102,0.8)';
  ctx.beginPath();
  ctx.ellipse(34, 114, 7, 2, -0.3, 0, Math.PI * 2);
  ctx.ellipse(56, 115, 5, 1.6, 0.4, 0, Math.PI * 2);
  ctx.fill();
}

function paintChain(ctx: CanvasRenderingContext2D) {
  for (let link = 0; link * 13 < 190; link += 1) {
    const y = 7 + link * 13;
    ctx.strokeStyle = link % 2 ? '#3b3230' : '#4d423e';
    ctx.lineWidth = link % 2 ? 2.4 : 2.8;
    ctx.beginPath();
    if (link % 2) ctx.ellipse(8, y, 1.6, 8, 0, 0, Math.PI * 2);
    else ctx.ellipse(8, y, 5, 8, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function paintPotionShelf(ctx: CanvasRenderingContext2D, rng: Rng) {
  // Estante y escuadras.
  ctx.fillStyle = '#4b301d';
  ctx.fillRect(0, 92, 170, 12);
  ctx.fillStyle = 'rgba(255,210,160,0.15)';
  ctx.fillRect(0, 92, 170, 2);
  ctx.fillStyle = '#2a1a10';
  [[18, 104], [150, 104]].forEach(([bx, by]) => {
    ctx.beginPath();
    ctx.moveTo(bx - 6, by);
    ctx.lineTo(bx + 6, by);
    ctx.lineTo(bx - 6, by + 16);
    ctx.closePath();
    ctx.fill();
  });

  const drawGlass = (path: () => void, liquidTop: number, color: string) => {
    ctx.save();
    path();
    ctx.fillStyle = 'rgba(180,200,230,0.18)';
    ctx.fill();
    ctx.clip();
    ctx.fillStyle = color;
    ctx.fillRect(0, liquidTop, 170, 120);
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.fillRect(0, liquidTop, 170, 2);
    ctx.restore();
    path();
    ctx.strokeStyle = 'rgba(220,235,255,0.55)';
    ctx.lineWidth = 1.4;
    ctx.stroke();
  };
  // Matraz redondo.
  drawGlass(() => {
    ctx.beginPath();
    ctx.moveTo(26, 42);
    ctx.lineTo(26, 56);
    ctx.arc(30, 73, 17.5, -Math.PI * 0.6, Math.PI * 1.6);
    ctx.lineTo(34, 42);
    ctx.closePath();
  }, 68, 'rgba(170,90,255,0.85)');
  // Botella alta.
  drawGlass(() => {
    ctx.beginPath();
    ctx.moveTo(71, 34);
    ctx.lineTo(79, 34);
    ctx.lineTo(79, 46);
    ctx.lineTo(87, 52);
    ctx.lineTo(87, 92);
    ctx.lineTo(63, 92);
    ctx.lineTo(63, 52);
    ctx.lineTo(71, 46);
    ctx.closePath();
  }, 62, 'rgba(90,230,130,0.8)');
  // Frasco pequeño.
  drawGlass(() => {
    ctx.beginPath();
    ctx.moveTo(106, 60);
    ctx.lineTo(114, 60);
    ctx.lineTo(116, 92);
    ctx.lineTo(104, 92);
    ctx.closePath();
  }, 72, 'rgba(90,220,255,0.85)');
  // Tapones de corcho.
  ctx.fillStyle = '#8a5a34';
  ctx.fillRect(25, 36, 10, 7);
  ctx.fillRect(70, 28, 10, 7);
  ctx.fillRect(105, 54, 10, 6);
  // Libro tumbado.
  ctx.fillStyle = '#5b2238';
  ctx.fillRect(126, 78, 40, 14);
  ctx.fillStyle = '#e9d8b4';
  ctx.fillRect(128, 81, 36, 3);
  ctx.fillStyle = 'rgba(255,214,102,0.7)';
  ctx.fillRect(140, 86, 12, 2);
  // Polvo sobre el estante.
  for (let speck = 0; speck < 30; speck += 1) {
    ctx.fillStyle = 'rgba(210,200,220,0.25)';
    ctx.fillRect(range(rng, 0, 170), range(rng, 90, 93), 1.5, 1);
  }
}

const EGG_CRACKS: Array<Array<[number, number]>> = [
  [[24, 30], [31, 38], [26, 46], [35, 55]],
  [[46, 52], [40, 60], [47, 68], [42, 76]],
  [[31, 38], [40, 36]],
];

function paintEgg(ctx: CanvasRenderingContext2D, rng: Rng) {
  const gradient = ctx.createRadialGradient(26, 36, 4, 35, 50, 44);
  gradient.addColorStop(0, '#4f8a8c');
  gradient.addColorStop(0.6, '#24444f');
  gradient.addColorStop(1, '#101c26');
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.ellipse(35, 50, 26, 37, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.save();
  ctx.clip();
  // Escamas.
  ctx.strokeStyle = 'rgba(8,20,24,0.55)';
  ctx.lineWidth = 1;
  for (let row = 0; row < 9; row += 1) {
    for (let column = 0; column < 7; column += 1) {
      ctx.beginPath();
      ctx.arc(8 + column * 9 + (row % 2) * 4.5, 16 + row * 9, 5, 0.1 * Math.PI, 0.9 * Math.PI);
      ctx.stroke();
    }
  }
  for (let speck = 0; speck < 26; speck += 1) {
    ctx.fillStyle = `rgba(255,214,102,${range(rng, 0.25, 0.6)})`;
    ctx.fillRect(range(rng, 10, 60), range(rng, 14, 86), 1.4, 1.4);
  }
  ctx.restore();
  ctx.strokeStyle = '#081016';
  ctx.lineWidth = 1.6;
  EGG_CRACKS.forEach((crack) => {
    ctx.beginPath();
    crack.forEach(([px, py], index) => (index ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
    ctx.stroke();
  });
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.beginPath();
  ctx.ellipse(24, 30, 6, 11, -0.4, 0, Math.PI * 2);
  ctx.fill();
}

function paintEggGlow(ctx: CanvasRenderingContext2D) {
  ctx.shadowColor = '#ffb347';
  ctx.shadowBlur = 9;
  ctx.strokeStyle = '#ffe08a';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  EGG_CRACKS.forEach((crack) => {
    ctx.beginPath();
    crack.forEach(([px, py], index) => (index ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
    ctx.stroke();
  });
}

function paintNest(ctx: CanvasRenderingContext2D, rng: Rng) {
  ctx.fillStyle = '#2a1a0e';
  ctx.beginPath();
  ctx.ellipse(66, 28, 62, 16, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineCap = 'round';
  for (let straw = 0; straw < 120; straw += 1) {
    const angle = range(rng, 0, Math.PI * 2);
    const radiusX = range(rng, 30, 62);
    const sx = 66 + Math.cos(angle) * radiusX;
    const sy = 28 + Math.sin(angle) * radiusX * 0.25;
    ctx.strokeStyle = `hsl(${range(rng, 32, 46)} ${range(rng, 40, 60)}% ${range(rng, 25, 45)}%)`;
    ctx.lineWidth = range(rng, 0.8, 1.8);
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.quadraticCurveTo(sx + range(rng, -10, 10), sy + range(rng, -6, 2), sx + range(rng, -18, 18),
      sy + range(rng, -4, 4));
    ctx.stroke();
  }
}

function paintCobweb(ctx: CanvasRenderingContext2D, rng: Rng) {
  const anchorX = 170;
  const anchorY = 0;
  const spokes = Array.from({ length: 7 }, (_, index) => Math.PI * (0.52 + index * 0.075) + range(rng, -0.03, 0.03));
  const lengths = spokes.map(() => range(rng, 120, 168));
  ctx.strokeStyle = 'rgba(225,225,240,0.32)';
  ctx.lineWidth = 0.8;
  spokes.forEach((angle, index) => {
    ctx.beginPath();
    ctx.moveTo(anchorX, anchorY);
    ctx.lineTo(anchorX + Math.cos(angle) * lengths[index], anchorY + Math.sin(angle) * lengths[index]);
    ctx.stroke();
  });
  [18, 36, 56, 78, 102, 126].forEach((radius) => {
    for (let index = 0; index < spokes.length - 1; index += 1) {
      const a = spokes[index];
      const b = spokes[index + 1];
      const middle = (a + b) / 2;
      ctx.beginPath();
      ctx.moveTo(anchorX + Math.cos(a) * radius, anchorY + Math.sin(a) * radius);
      ctx.quadraticCurveTo(anchorX + Math.cos(middle) * radius * 0.86, anchorY + Math.sin(middle) * radius * 0.86,
        anchorX + Math.cos(b) * radius, anchorY + Math.sin(b) * radius);
      ctx.stroke();
    }
  });
  // Hebra rota colgando.
  ctx.beginPath();
  ctx.moveTo(60, 70);
  ctx.quadraticCurveTo(52, 110, 64, 150);
  ctx.stroke();
}

function paintSpider(ctx: CanvasRenderingContext2D) {
  ctx.strokeStyle = '#120c14';
  ctx.lineWidth = 1.4;
  ctx.lineCap = 'round';
  [-1, 1].forEach((side) => {
    [0, 1, 2, 3].forEach((leg) => {
      const startY = 12 + leg * 2;
      ctx.beginPath();
      ctx.moveTo(16, startY);
      ctx.lineTo(16 + side * (8 + leg), startY - 6 + leg * 3);
      ctx.lineTo(16 + side * (13 + leg), startY + 2 + leg * 3);
      ctx.stroke();
    });
  });
  ctx.fillStyle = '#1c1220';
  ctx.beginPath();
  ctx.ellipse(16, 18, 6, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(16, 9, 3.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ff5c5c';
  ctx.fillRect(14, 8, 1.4, 1.4);
  ctx.fillRect(17, 8, 1.4, 1.4);
  ctx.fillStyle = 'rgba(255,214,102,0.6)';
  ctx.fillRect(15, 17, 2, 4);
}

function paintWand(ctx: CanvasRenderingContext2D) {
  ctx.lineCap = 'round';
  // Fragmento con empuñadura.
  ctx.strokeStyle = '#5a3a24';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(6, 26);
  ctx.lineTo(57, 18);
  ctx.stroke();
  ctx.strokeStyle = '#d9a441';
  ctx.lineWidth = 6.4;
  [[14, 25], [22, 23.7]].forEach(([bx, by]) => {
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(bx + 2, by - 0.3);
    ctx.stroke();
  });
  // Fragmento con estrella partida.
  ctx.strokeStyle = '#6b4630';
  ctx.lineWidth = 4.5;
  ctx.beginPath();
  ctx.moveTo(66, 16);
  ctx.lineTo(96, 10);
  ctx.stroke();
  ctx.fillStyle = '#ffd166';
  ctx.beginPath();
  for (let point = 0; point < 10; point += 1) {
    const angle = -Math.PI / 2 + (point * Math.PI) / 5;
    const radius = point % 2 ? 4 : 9;
    const px = 102 + Math.cos(angle) * radius;
    const py = 10 + Math.sin(angle) * radius;
    if (point) ctx.lineTo(px, py);
    else ctx.moveTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#3a2210';
  ctx.lineWidth = 1;
  ctx.stroke();
  // Astillas en la rotura.
  ctx.strokeStyle = '#a77a52';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(57, 18);
  ctx.lineTo(61, 14);
  ctx.moveTo(57, 18);
  ctx.lineTo(60, 21);
  ctx.moveTo(66, 16);
  ctx.lineTo(63, 12);
  ctx.stroke();
}

function paintPuddle(ctx: CanvasRenderingContext2D) {
  const gradient = ctx.createRadialGradient(48, 12, 2, 48, 12, 46);
  gradient.addColorStop(0, 'rgba(90,110,170,0.55)');
  gradient.addColorStop(1, 'rgba(40,40,80,0)');
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.ellipse(48, 12, 46, 11, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(200,220,255,0.25)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(44, 10, 20, 4, 0, Math.PI * 1.1, Math.PI * 1.8);
  ctx.stroke();
}
