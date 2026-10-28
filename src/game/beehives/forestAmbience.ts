import Phaser from 'phaser';
import { BRANCH_TEXTURE_TOP, FLUTTER_FRAMES, FOREST_TEXTURES } from './forestTextures';

/**
 * Ambientación del Bosque Encantado: capas de profundidad, haces de luz, luz en el suelo, hojas, pétalos
 * y motas de luz.
 *
 * Capas (profundidad): lejano -40 · haces -36 · intermedio -30 · luz en el suelo -28 · hojas y pétalos
 * traseros -6 · árboles de primer plano -4 · rama -3 · (panales 3, etiquetas 8, abejas 12) · motas 6 ·
 * hojas y pétalos delanteros 14 · vegetación frontal 20 · (título 30).
 *
 * Presupuesto de partículas simultáneas: motas ≤ 55, hojas/pétalos traseros ≤ 14, delanteros ≤ 8
 * (más ≤ 6 chispas por panal en `HiveView`). Ningún objeto es interactivo, así que no bloquea clics.
 * Tweens y emisores pertenecen a la escena y Phaser los elimina al destruirla o reiniciarla.
 */

const DEPTH = {
  far: -40,
  shafts: -36,
  mid: -30,
  groundLight: -28,
  flutterBack: -6,
  trees: -4,
  branch: -3,
  motes: 6,
  flutterFront: 14,
  ground: 20,
};

/** Haces de luz que bajan en diagonal desde el sol (arriba a la derecha). */
const SHAFTS = [
  { x: 560, width: 0.9, alpha: 0.26, duration: 5200 },
  { x: 690, width: 1.3, alpha: 0.32, duration: 6400 },
  { x: 810, width: 0.8, alpha: 0.24, duration: 4700 },
  { x: 380, width: 0.7, alpha: 0.18, duration: 7100 },
];
const SHAFT_ANGLE = 18;

export class ForestAmbience {
  private readonly scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    scene.add.image(500, 310, FOREST_TEXTURES.far).setDepth(DEPTH.far);
    this.createLightShafts();
    scene.add.image(500, 310, FOREST_TEXTURES.mid).setDepth(DEPTH.mid);
    scene.add.image(0, 0, FOREST_TEXTURES.treeLeft).setOrigin(0, 0).setDepth(DEPTH.trees);
    scene.add.image(1000, 0, FOREST_TEXTURES.treeRight).setOrigin(1, 0).setDepth(DEPTH.trees);
    scene.add.image(0, BRANCH_TEXTURE_TOP, FOREST_TEXTURES.branch).setOrigin(0, 0).setDepth(DEPTH.branch);
    scene.add.image(500, 620, FOREST_TEXTURES.ground).setOrigin(0.5, 1).setDepth(DEPTH.ground);
    this.createFallingFlutter();
    this.createMotes();
  }

  private createLightShafts() {
    SHAFTS.forEach((shaft, index) => {
      const beam = this.scene.add.image(shaft.x, -30, FOREST_TEXTURES.shaft)
        .setOrigin(0.5, 0)
        .setAngle(SHAFT_ANGLE)
        .setScale(shaft.width, 1)
        .setTint(0xffe7a3)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(DEPTH.shafts)
        .setAlpha(shaft.alpha * 0.6);
      this.scene.tweens.add({
        targets: beam,
        alpha: shaft.alpha,
        scaleX: shaft.width * 1.08,
        duration: shaft.duration,
        delay: index * 900,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });

      // Mancha de luz donde el haz toca el suelo, sincronizada con él.
      const landingX = shaft.x - Math.tan(Phaser.Math.DegToRad(SHAFT_ANGLE)) * 560;
      const pool = this.scene.add.image(landingX, 560, FOREST_TEXTURES.softLight)
        .setScale(shaft.width * 1.1, 0.3)
        .setTint(0xffe2a0)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(DEPTH.groundLight)
        .setAlpha(shaft.alpha * 0.9);
      this.scene.tweens.add({
        targets: pool,
        alpha: shaft.alpha * 1.6,
        duration: shaft.duration,
        delay: index * 900,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    });
  }

  /**
   * Hojas y pétalos en dos profundidades. La deriva lateral curva usa una aceleración horizontal que oscila
   * durante la vida de cada partícula; la fase depende de su vida total, así que no caen todas igual.
   */
  private createFallingFlutter() {
    const sway = (amplitude: number) => ({
      onEmit: () => 0,
      onUpdate: (particle: Phaser.GameObjects.Particles.Particle, _key: string, t: number) =>
        Math.sin(t * Math.PI * 4 + particle.life * 0.003) * amplitude,
    });
    const frames = [...FLUTTER_FRAMES.leaves, ...FLUTTER_FRAMES.leaves, ...FLUTTER_FRAMES.petals];

    this.scene.add.particles(0, 0, FOREST_TEXTURES.flutter, {
      frame: frames,
      emitZone: randomZone(new Phaser.Geom.Rectangle(80, 90, 900, 40)),
      frequency: 650,
      lifespan: { min: 8000, max: 12000 },
      speedY: { min: 14, max: 28 },
      speedX: { min: -12, max: 8 },
      accelerationX: sway(14),
      rotate: { start: 0, end: 360 },
      scale: { min: 0.45, max: 0.7 },
      alpha: { values: [0, 0.75, 0.75, 0] },
      maxAliveParticles: 14,
      advance: 6000,
    }).setDepth(DEPTH.flutterBack);

    this.scene.add.particles(0, 0, FOREST_TEXTURES.flutter, {
      frame: frames,
      emitZone: randomZone(new Phaser.Geom.Rectangle(40, -20, 920, 30)),
      frequency: 1500,
      lifespan: { min: 6000, max: 8500 },
      speedY: { min: 40, max: 65 },
      speedX: { min: -20, max: 14 },
      accelerationX: sway(26),
      rotate: { start: 0, end: -420 },
      scale: { min: 0.95, max: 1.25 },
      alpha: { values: [0, 0.95, 0.95, 0] },
      maxAliveParticles: 8,
      advance: 4000,
    }).setDepth(DEPTH.flutterFront);
  }

  /** Motas de luz: una nube general y otra más densa bajo los haces de luz. */
  private createMotes() {
    const common = {
      lifespan: { min: 5000, max: 9000 },
      speedX: { min: -6, max: 6 },
      speedY: { min: -8, max: 5 },
      blendMode: Phaser.BlendModes.ADD,
      tint: [0xfff3c4, 0xffe08a, 0xffffff],
    };
    this.scene.add.particles(0, 0, FOREST_TEXTURES.mote, {
      ...common,
      emitZone: randomZone(new Phaser.Geom.Rectangle(40, 80, 920, 460)),
      frequency: 220,
      scale: { min: 0.15, max: 0.4 },
      alpha: { values: [0, 0.6, 0.45, 0] },
      maxAliveParticles: 35,
      advance: 7000,
    }).setDepth(DEPTH.motes);
    this.scene.add.particles(0, 0, FOREST_TEXTURES.mote, {
      ...common,
      emitZone: randomZone(new Phaser.Geom.Rectangle(430, 60, 380, 360)),
      frequency: 300,
      scale: { min: 0.2, max: 0.55 },
      alpha: { values: [0, 0.85, 0.6, 0] },
      maxAliveParticles: 20,
      advance: 7000,
    }).setDepth(DEPTH.motes);
  }
}

/**
 * Zona de emisión aleatoria. Las formas de `Phaser.Geom` cumplen `getRandomPoint` en tiempo de ejecución,
 * pero su firma genérica no encaja con `RandomZoneSource` en los tipos de Phaser 4.2.1.
 */
function randomZone(shape: Phaser.Geom.Rectangle | Phaser.Geom.Circle) {
  return { type: 'random', source: shape as unknown as Phaser.Types.GameObjects.Particles.RandomZoneSource };
}
