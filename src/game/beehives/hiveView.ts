import Phaser from 'phaser';
import { FOREST_TEXTURES, GLINT_FRAMES, HIVE_SIZE, branchYAt, hiveTextureKey } from './forestTextures';

/**
 * Vista de un panal colgado de la rama: tallo, sombra, cuerpo, resplandor, reflejos, chispas, contador y
 * etiqueta de la opción.
 *
 * Responsabilidades:
 * - Animación ambiental propia: balanceo pendular, resplandor y reflejos con fases distintas por panal.
 * - `celebrate()`: reacción del panal ganador, con prioridad sobre el balanceo (lo pausa y lo reanuda).
 *
 * Contrato con `BeehivesScene`:
 * - `counter` es el `Text` «N 🐝» que la escena actualiza (`setText`/`setBackgroundColor`) como antes.
 * - El centro del panal queda en `(x, HIVE_CENTER_Y)`, igual que el panal original, de modo que los
 *   destinos de las abejas (`y` 330–365) siguen cayendo sobre el cuerpo y la entrada.
 * - Nada es interactivo: la vista no registra listeners de entrada.
 */

export const HIVE_CENTER_Y = 338;
const COUNTER_Y = 228;
const LABEL_Y = 442;
const SWING_DEGREES = 1.6;

const DEPTH = {
  sparkles: 2,
  hive: 3,
  label: 8,
};

export interface HiveViewConfig {
  index: number;
  x: number;
  spacing: number;
  option: string;
}

export class HiveView {
  readonly counter: Phaser.GameObjects.Text;
  private readonly scene: Phaser.Scene;
  private readonly pivot: Phaser.GameObjects.Container;
  private readonly body: Phaser.GameObjects.Image;
  private readonly glow: Phaser.GameObjects.Image;
  private readonly sparkles: Phaser.GameObjects.Particles.ParticleEmitter;
  private readonly swing: Phaser.Tweens.Tween;
  private readonly glowPulse: Phaser.Tweens.Tween;
  private celebrating = false;

  constructor(scene: Phaser.Scene, config: HiveViewConfig) {
    this.scene = scene;
    const { index, x, spacing, option } = config;
    const branchY = branchYAt(x);
    const localCenterY = HIVE_CENTER_Y - branchY;
    const hiveTop = localCenterY - HIVE_SIZE.radiusY + 4;

    // El contenedor pivota en el punto de la rama: todo el panal oscila como un péndulo.
    this.pivot = scene.add.container(x, branchY).setDepth(DEPTH.hive);
    const stem = scene.add.graphics();
    stem.lineStyle(4, 0x4a3218).beginPath().moveTo(0, 2).lineTo(0, hiveTop).strokePath();
    stem.lineStyle(1.6, 0x7fbf5a).beginPath().moveTo(-2, 6).lineTo(-1, hiveTop - 4).strokePath();
    stem.fillStyle(0x6fae55).fillEllipse(6, 18, 12, 6).fillEllipse(-6, 34, 11, 5);
    const shadow = scene.add.image(10, localCenterY + 14, FOREST_TEXTURES.shadow).setScale(1, 2.6).setAlpha(0.7);
    this.glow = scene.add.image(0, localCenterY, FOREST_TEXTURES.softLight)
      .setTint(0xffb43c)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setScale(0.95, 1.15)
      .setAlpha(0.3);
    const bodyOffsetY = HIVE_SIZE.height / 2 - HIVE_SIZE.centerY;
    this.body = scene.add.image(0, localCenterY + bodyOffsetY, hiveTextureKey(index));
    const glints = GLINT_FRAMES.map((frame) => scene.add.image(0, localCenterY + bodyOffsetY, FOREST_TEXTURES.glints,
      frame)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setAlpha(0));
    this.pivot.add([stem, shadow, this.glow, this.body, ...glints]);

    // Fases deterministas distintas por panal para que no se muevan al unísono.
    const swingDuration = 3400 + (index % 3) * 520;
    this.pivot.setAngle(-SWING_DEGREES);
    this.swing = scene.tweens.add({
      targets: this.pivot,
      angle: SWING_DEGREES,
      duration: swingDuration,
      delay: (index * 733) % swingDuration,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    this.glowPulse = scene.tweens.add({
      targets: this.glow,
      alpha: { from: 0.22, to: 0.42 },
      duration: 2100 + index * 260,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    // Reflejo que recorre las celdas: tres franjas encendidas en cadena con el mismo periodo.
    const sweepPeriod = 4200 + index * 610;
    glints.forEach((glint, step) => {
      scene.tweens.add({
        targets: glint,
        alpha: 0.75,
        duration: 260,
        yoyo: true,
        delay: 900 + index * 450 + step * 160,
        repeat: -1,
        repeatDelay: sweepPeriod - 520,
        ease: 'Sine.easeInOut',
      });
    });

    this.sparkles = scene.add.particles(x, HIVE_CENTER_Y, FOREST_TEXTURES.spark, {
      emitZone: randomZone(new Phaser.Geom.Circle(0, 0, 52)),
      frequency: 650 + index * 90,
      lifespan: { min: 1100, max: 1800 },
      speedY: { min: -26, max: -8 },
      speedX: { min: -8, max: 8 },
      scale: { start: 0.45, end: 0 },
      alpha: { start: 0.9, end: 0 },
      tint: [0xffd166, 0xfff1b8, 0xffb43c],
      blendMode: Phaser.BlendModes.ADD,
      maxAliveParticles: 6,
    }).setDepth(DEPTH.sparkles);

    this.counter = scene.add.text(x, COUNTER_Y, '0 🐝', {
      fontFamily: 'Arial Black, Arial',
      fontSize: '19px',
      color: '#30251b',
      backgroundColor: '#fff9e9',
      padding: { x: 8, y: 4 },
    }).setOrigin(0.5).setDepth(DEPTH.label);

    // Etiqueta sobre una placa cálida para que sea legible sobre el bosque.
    const labelSize = Math.max(12, Math.min(17, spacing / Math.max(7, option.length * 0.72)));
    const label = scene.add.text(x, LABEL_Y, option, {
      fontFamily: 'Arial Black, Arial',
      fontSize: `${labelSize}px`,
      color: '#fff6dc',
      align: 'center',
      stroke: '#2a1a0a',
      strokeThickness: 4,
      wordWrap: { width: spacing - 12 },
    }).setOrigin(0.5).setDepth(DEPTH.label);
    const bounds = label.getBounds();
    const plate = scene.add.graphics().setDepth(DEPTH.label - 0.5);
    plate.fillStyle(0x140c04, 0.3).fillRoundedRect(bounds.x - 9, bounds.y - 3, bounds.width + 18, bounds.height + 10, 10);
    plate.fillStyle(0x3b2a17, 0.78).fillRoundedRect(bounds.x - 10, bounds.y - 5, bounds.width + 20, bounds.height + 10,
      10);
    plate.lineStyle(2, 0xe0a83a, 0.9).strokeRoundedRect(bounds.x - 10, bounds.y - 5, bounds.width + 20,
      bounds.height + 10, 10);
  }

  /**
   * Reacción del ganador: pausa el balanceo, hace latir el panal y el resplandor y suelta chispas.
   * Reutiliza los tweens existentes (pausa/reanuda) en lugar de reiniciarlos; ignora llamadas repetidas.
   */
  celebrate() {
    if (this.celebrating) return;
    this.celebrating = true;
    this.swing.pause();
    this.glowPulse.pause();
    this.sparkles.explode(14);
    this.scene.tweens.add({
      targets: this.glow,
      alpha: 0.85,
      duration: 160,
      yoyo: true,
      repeat: 3,
    });
    this.scene.tweens.add({
      targets: this.body,
      scaleX: 1.07,
      scaleY: 1.07,
      duration: 160,
      yoyo: true,
      repeat: 3,
      onComplete: () => {
        this.celebrating = false;
        this.swing.resume();
        this.glowPulse.resume();
      },
    });
  }
}

/**
 * Zona de emisión aleatoria. Las formas de `Phaser.Geom` cumplen `getRandomPoint` en tiempo de ejecución,
 * pero su firma genérica no encaja con `RandomZoneSource` en los tipos de Phaser 4.2.1.
 */
function randomZone(shape: Phaser.Geom.Rectangle | Phaser.Geom.Circle) {
  return { type: 'random', source: shape as unknown as Phaser.Types.GameObjects.Particles.RandomZoneSource };
}
