import Phaser from 'phaser';
import { DOOR_FRAME, DUNGEON_TEXTURES } from './dungeonTextures';
import type { DoorView } from './doorView';

/**
 * Coreografía de apertura de una puerta desvencijada.
 *
 * Secuencia (≈2,9 s): la hoja forcejea contra el pestillo, cede con una sacudida que suelta polvo del dintel,
 * cruje despacio, se engancha en la bisagra oxidada y finalmente se abre de golpe hacia el espectador, rebota
 * y se asienta. Mientras gira, el pasillo se ilumina, saltan astillas y la opción se revela con un destello.
 *
 * Contrato:
 * - Solo anima `door.pose`, `door.fx` y `door.optionText`; el cálculo de la malla lo hace `DoorView.update`.
 * - `onComplete` se invoca exactamente una vez, cuando terminan la hoja, la revelación del texto y las
 *   partículas creadas por la apertura. `DoorsScene` usa esa señal para saber que ya no hay animaciones de
 *   apertura activas antes de notificar el resultado (y permitir que React destruya la escena).
 * - Si la escena se destruye antes (por ejemplo, al salir), Phaser elimina tweens, temporizadores y emisores
 *   y `onComplete` no llega a invocarse.
 */

export interface DoorOpeningHandlers {
  /** Momento en que la opción se hace visible dentro del pasillo. */
  onReveal?: () => void;
  /** Fin de todas las animaciones de esta apertura. */
  onComplete: () => void;
}

/** Vida máxima de las partículas de la apertura; se espera este tiempo antes de dar la apertura por terminada. */
const PARTICLE_MAX_LIFESPAN = 1300;
const PARTICLE_DEPTH = -10;

export function playDoorOpening(scene: Phaser.Scene, door: DoorView, handlers: DoorOpeningHandlers) {
  scene.tweens.killTweensOf([door.pose, door.fx]);

  // Tres trabajos deben terminar: giro de la hoja, revelación del texto y partículas.
  let pending = 3;
  const finishPart = () => {
    pending -= 1;
    if (pending === 0) handlers.onComplete();
  };

  const effects = createOpeningEffects(scene, door);
  const hingeDirection = Math.sign(door.hingeX - door.centerX);

  const latchGives = () => {
    scene.cameras.main.shake(150, 0.0022);
    effects.lintelDust.explode(16, door.centerX, door.openingTop + 4);
    effects.runeSparks.explode(14, door.centerX - hingeDirection * 2, door.openingTop + 150);
    scene.tweens.add({
      targets: door.fx,
      runes: 1.5,
      duration: 180,
      ease: 'Quad.easeOut',
      yoyo: true,
      hold: 260,
    });
  };

  const reveal = () => {
    door.optionText.setVisible(true).setAlpha(0).setScale(0.6);
    handlers.onReveal?.();
    effects.burst.explode(26, door.optionText.x, door.optionText.y);
    scene.tweens.add({
      targets: door.optionText,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: 460,
      ease: 'Back.easeOut',
      onComplete: finishPart,
    });
    // Las partículas de la apertura se emiten antes o durante la revelación: tras su vida máxima ya no queda
    // ninguna activa y los emisores se pueden destruir.
    scene.time.delayedCall(PARTICLE_MAX_LIFESPAN, () => {
      effects.destroy();
      finishPart();
    });
  };

  const swing = () => {
    effects.floorDust.explode(18, door.centerX, door.openingBottom - 2);
    effects.splinters.explode(9, door.hingeX, door.openingTop + 60);
    effects.splinters.explode(7, door.hingeX, door.openingBottom - 60);
    scene.tweens.add({ targets: door.fx, interiorLight: 1, duration: 700, ease: 'Sine.easeOut' });
    scene.tweens.add({ targets: door.fx, runes: 0, duration: 900, delay: 300 });
    scene.time.delayedCall(320, reveal);
  };

  scene.tweens.chain({
    targets: door.pose,
    tweens: [
      // Forcejeo contra el pestillo atascado.
      { angle: 2.5, shake: 1.6, duration: 70, yoyo: true, repeat: 2, ease: 'Sine.easeInOut' },
      // El pestillo cede: la hoja se descuelga un poco.
      { angle: 7, sag: 2, shake: 0, duration: 170, ease: 'Quad.easeOut', onStart: latchGives },
      // Crujido lento.
      { angle: 26, sag: 4, duration: 640, ease: 'Sine.easeInOut' },
      // La bisagra oxidada se engancha.
      { angle: 22, duration: 150, ease: 'Sine.easeOut' },
      // Apertura de golpe hacia el espectador.
      { angle: 88, sag: 7, duration: 780, ease: 'Cubic.easeOut', onStart: swing },
      // Rebote y asiento.
      { angle: 81, duration: 210, ease: 'Sine.easeInOut' },
      { angle: 85, duration: 260, ease: 'Sine.easeOut' },
    ],
    onComplete: finishPart,
  });
}

/** Emisores de un solo uso para esta apertura (se crean detenidos y se disparan con `explode`). */
function createOpeningEffects(scene: Phaser.Scene, door: DoorView) {
  const openingWidth = DOOR_FRAME.openingWidth;
  const lintelDust = scene.add.particles(0, 0, DUNGEON_TEXTURES.dustPuff, {
    emitting: false,
    emitZone: randomZone(new Phaser.Geom.Rectangle(-openingWidth / 2, -4, openingWidth, 8)),
    lifespan: { min: 800, max: PARTICLE_MAX_LIFESPAN },
    speedX: { min: -18, max: 18 },
    speedY: { min: 20, max: 60 },
    gravityY: 90,
    scale: { start: 0.3, end: 0.85 },
    alpha: { start: 0.6, end: 0 },
    rotate: { min: 0, max: 360 },
  }).setDepth(PARTICLE_DEPTH);

  const floorDust = scene.add.particles(0, 0, DUNGEON_TEXTURES.dustPuff, {
    emitting: false,
    emitZone: randomZone(new Phaser.Geom.Rectangle(-openingWidth / 2, -6, openingWidth, 10)),
    lifespan: { min: 700, max: 1200 },
    speedX: { min: -70, max: 70 },
    speedY: { min: -40, max: -8 },
    scale: { start: 0.4, end: 1.2 },
    alpha: { start: 0.5, end: 0 },
  }).setDepth(PARTICLE_DEPTH);

  const splinters = scene.add.particles(0, 0, DUNGEON_TEXTURES.splinter, {
    emitting: false,
    lifespan: { min: 700, max: 1100 },
    speed: { min: 90, max: 190 },
    angle: { min: -150, max: -30 },
    gravityY: 480,
    rotate: { start: 0, end: 540 },
    scale: { min: 0.6, max: 1.1 },
    alpha: { start: 1, end: 0.2 },
  }).setDepth(PARTICLE_DEPTH);

  const runeSparks = scene.add.particles(0, 0, DUNGEON_TEXTURES.spark, {
    emitting: false,
    emitZone: randomZone(new Phaser.Geom.Circle(0, 0, 48)),
    lifespan: { min: 500, max: 900 },
    speed: { min: 20, max: 80 },
    scale: { start: 0.9, end: 0 },
    alpha: { start: 1, end: 0 },
    tint: door.lightColor,
    blendMode: Phaser.BlendModes.ADD,
  }).setDepth(PARTICLE_DEPTH);

  const burst = scene.add.particles(0, 0, DUNGEON_TEXTURES.spark, {
    emitting: false,
    lifespan: { min: 600, max: 1000 },
    speed: { min: 60, max: 210 },
    scale: { start: 1.3, end: 0 },
    alpha: { start: 1, end: 0 },
    tint: [door.lightColor, 0xffffff, 0xfff1b8],
    blendMode: Phaser.BlendModes.ADD,
  }).setDepth(PARTICLE_DEPTH);

  const emitters = [lintelDust, floorDust, splinters, runeSparks, burst];
  return {
    lintelDust,
    floorDust,
    splinters,
    runeSparks,
    burst,
    destroy: () => emitters.forEach((emitter) => emitter.destroy()),
  };
}

/**
 * Zona de emisión aleatoria. Las formas de `Phaser.Geom` cumplen el contrato `getRandomPoint` en tiempo de
 * ejecución, pero su firma genérica no encaja con `RandomZoneSource` en los tipos de Phaser 4.2.1.
 */
function randomZone(shape: Phaser.Geom.Rectangle | Phaser.Geom.Circle) {
  return { type: 'random', source: shape as unknown as Phaser.Types.GameObjects.Particles.RandomZoneSource };
}
