import Phaser from 'phaser';
import { DUNGEON_TEXTURES, FLAME_FRAME, SHELF_BOTTLES, WAND_SPARK_POINT } from './dungeonTextures';

/**
 * Ambientación viva de la mazmorra: fondo, antorchas, iluminación, polvo, niebla y objetos narrativos.
 *
 * Responsabilidades:
 * - Crear la decoración (ninguna pieza es interactiva, así que no intercepta los clics de las puertas).
 * - Animar de forma continua antorchas, círculo rúnico, jaula, cadenas, araña, pociones, huevo, varita y gotera.
 * - Calcular en `update()` el parpadeo de las antorchas y devolver el factor de luz global (≈0.85..1.1) que
 *   `DoorView` aplica al sombreado de las hojas.
 *
 * Todos los tweens, temporizadores y emisores pertenecen a la escena: Phaser los elimina al destruirla o
 * reiniciarla, por lo que no hay que liberarlos a mano.
 */

const DEPTH = {
  backdrop: -100,
  runeCircle: -95,
  props: -70,
  torch: -62,
  torchLight: -55,
  embers: -54,
  fog: -26,
  motes: 5,
  vignette: 10,
};

const TORCHES = [
  { x: 128, y: 250, seed: 1.3 },
  { x: 872, y: 250, seed: 4.7 },
];

const FLAME_ANIMATION = 'torch-burn';

interface Torch {
  flame: Phaser.GameObjects.Sprite;
  halo: Phaser.GameObjects.Image;
  pool: Phaser.GameObjects.Image;
  seed: number;
  baseX: number;
  gust: number;
  gustTarget: number;
  nextGustAt: number;
}

export class DungeonAmbience {
  private readonly scene: Phaser.Scene;
  private readonly torches: Torch[] = [];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    scene.add.image(500, 310, DUNGEON_TEXTURES.backdrop).setDepth(DEPTH.backdrop);
    this.createRuneCircle();
    this.createTorches();
    this.createHangingCage();
    this.createChains();
    this.createCobwebAndSpider();
    this.createPotionShelf();
    this.createDragonEgg();
    this.createBrokenWand();
    this.createDrip();
    this.createFog();
    this.createDustMotes();
    scene.add.image(500, 310, DUNGEON_TEXTURES.vignette).setDepth(DEPTH.vignette);
  }

  /** Actualiza el parpadeo de las antorchas y devuelve el factor de luz medio para iluminar las puertas. */
  update(time: number) {
    let total = 0;
    this.torches.forEach((torch) => {
      // Ráfagas de corriente: un objetivo aleatorio cada pocos cientos de milisegundos, alcanzado con suavidad.
      if (time >= torch.nextGustAt) {
        torch.gustTarget = Phaser.Math.FloatBetween(0.82, 1.06);
        torch.nextGustAt = time + Phaser.Math.Between(240, 900);
      }
      torch.gust += (torch.gustTarget - torch.gust) * 0.08;
      const wave = 0.07 * Math.sin(time * 0.0093 + torch.seed)
        + 0.05 * Math.sin(time * 0.0231 + torch.seed * 2.1)
        + 0.03 * Math.sin(time * 0.057 + torch.seed * 0.7);
      const flicker = torch.gust + wave;
      torch.flame.setScale(0.9 + flicker * 0.12, 0.82 + flicker * 0.22);
      torch.flame.setX(torch.baseX + Math.sin(time * 0.013 + torch.seed) * 1.4);
      torch.halo.setAlpha(0.42 * flicker).setScale(0.55 + flicker * 0.08);
      torch.pool.setAlpha(0.2 * flicker).setScale(2.3 + flicker * 0.15);
      total += flicker;
    });
    return Phaser.Math.Clamp(0.12 + total / Math.max(1, this.torches.length), 0.85, 1.1);
  }

  private createRuneCircle() {
    const circle = this.scene.add.image(500, 212, DUNGEON_TEXTURES.runeCircle)
      .setDepth(DEPTH.runeCircle)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setScale(0.72)
      .setAlpha(0.28);
    this.scene.tweens.add({ targets: circle, angle: 360, duration: 60000, repeat: -1 });
    this.scene.tweens.add({
      targets: circle,
      alpha: { from: 0.18, to: 0.42 },
      duration: 2600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private createTorches() {
    const { scene } = this;
    if (!scene.anims.exists(FLAME_ANIMATION)) {
      scene.anims.create({
        key: FLAME_ANIMATION,
        frames: Array.from({ length: FLAME_FRAME.count }, (_, frame) => ({
          key: DUNGEON_TEXTURES.flame,
          frame: `f${frame}`,
        })),
        frameRate: 13,
        repeat: -1,
      });
    }

    TORCHES.forEach(({ x, y, seed }) => {
      const pool = scene.add.image(x, y + 30, DUNGEON_TEXTURES.softLight)
        .setDepth(DEPTH.torchLight)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setTint(0xff9a3c);
      const halo = scene.add.image(x, y - 32, DUNGEON_TEXTURES.softLight)
        .setDepth(DEPTH.torch + 1)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setTint(0xffb347);
      scene.add.image(x, y + 10, DUNGEON_TEXTURES.torch).setDepth(DEPTH.torch);
      const flame = scene.add.sprite(x, y - 30, DUNGEON_TEXTURES.flame, 'f0')
        .setOrigin(0.5, 0.9)
        .setDepth(DEPTH.torch + 2);
      flame.play({ key: FLAME_ANIMATION, startFrame: Phaser.Math.Between(0, FLAME_FRAME.count - 1) });

      scene.add.particles(x, y - 52, DUNGEON_TEXTURES.ember, {
        frequency: 110,
        lifespan: { min: 700, max: 1500 },
        speedX: { min: -14, max: 14 },
        speedY: { min: -95, max: -40 },
        accelerationX: { min: -40, max: 40 },
        scale: { start: 0.7, end: 0 },
        alpha: { start: 1, end: 0 },
        tint: [0xffd166, 0xff8a3c, 0xfff2b0],
        blendMode: Phaser.BlendModes.ADD,
      }).setDepth(DEPTH.embers);

      this.torches.push({ flame, halo, pool, seed, baseX: x, gust: 1, gustTarget: 1, nextGustAt: 0 });
    });
  }

  /** Jaula vacía con la puerta arrancada: algo escapó. Se balancea colgada de su cadena. */
  private createHangingCage() {
    const { scene } = this;
    const chain = scene.add.image(56, -20, DUNGEON_TEXTURES.chain).setOrigin(0.5, 0).setDepth(DEPTH.props);
    const cage = scene.add.image(56, 160, DUNGEON_TEXTURES.cage).setOrigin(46 / 124, 0).setDepth(DEPTH.props);
    // La cadena y la jaula oscilan como un péndulo desde el mismo punto del techo.
    scene.tweens.addCounter({
      from: -1,
      to: 1,
      duration: 2600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      onUpdate: (tween) => {
        const swing = (tween.getValue() ?? 0) * 5;
        const radians = Phaser.Math.DegToRad(swing);
        chain.setAngle(swing);
        cage.setAngle(swing).setPosition(56 - Math.sin(radians) * 180, -20 + Math.cos(radians) * 180);
      },
    });
  }

  private createChains() {
    [{ x: 958, length: 1, duration: 3400 }, { x: 984, length: 0.7, duration: 2900 }].forEach((config) => {
      const chain = this.scene.add.image(config.x, -6, DUNGEON_TEXTURES.chain)
        .setOrigin(0.5, 0)
        .setScale(1, config.length)
        .setDepth(DEPTH.props)
        .setAngle(-2.5);
      this.scene.tweens.add({
        targets: chain,
        angle: 2.5,
        duration: config.duration,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    });
  }

  /** Telaraña en la esquina con una araña que sube y baja por su hilo. */
  private createCobwebAndSpider() {
    const { scene } = this;
    scene.add.image(1000, 0, DUNGEON_TEXTURES.cobweb).setOrigin(1, 0).setDepth(DEPTH.props);
    const anchor = { x: 928, y: 36 };
    const thread = scene.add.graphics().setDepth(DEPTH.props);
    const spider = scene.add.image(anchor.x, 70, DUNGEON_TEXTURES.spider).setDepth(DEPTH.props);
    const drawThread = () => {
      thread.clear();
      thread.lineStyle(1, 0xe1e1f0, 0.45);
      thread.lineBetween(anchor.x, anchor.y, spider.x, spider.y - 8);
    };
    scene.tweens.add({
      targets: spider,
      y: 150,
      duration: 3200,
      hold: 1400,
      repeatDelay: 1800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      onUpdate: drawThread,
    });
    scene.tweens.add({ targets: spider, angle: { from: -8, to: 8 }, duration: 900, yoyo: true, repeat: -1 });
    drawThread();
  }

  /** Estante con pociones burbujeantes que brillan con pulsos desfasados. */
  private createPotionShelf() {
    const { scene } = this;
    const left = 14;
    const top = 400;
    scene.add.image(left, top, DUNGEON_TEXTURES.shelf).setOrigin(0, 0).setDepth(DEPTH.props);
    SHELF_BOTTLES.forEach((bottle, index) => {
      const glow = scene.add.image(left + bottle.x, top + bottle.y + 30, DUNGEON_TEXTURES.softLight)
        .setDepth(DEPTH.props + 1)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setTint(bottle.color)
        .setScale(0.22)
        .setAlpha(0.25);
      scene.tweens.add({
        targets: glow,
        alpha: 0.55,
        scale: 0.27,
        duration: 1400 + index * 380,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
      scene.add.particles(left + bottle.x, top + bottle.y, DUNGEON_TEXTURES.bubble, {
        frequency: 520 + index * 170,
        lifespan: { min: 1100, max: 1800 },
        speedY: { min: -32, max: -14 },
        speedX: { min: -5, max: 5 },
        scale: { start: 0.4, end: 0.9 },
        alpha: { start: 0.85, end: 0 },
        tint: bottle.color,
      }).setDepth(DEPTH.props + 2);
    });
  }

  /** Huevo de dragón en su nido: late con luz en las grietas y se tambalea de vez en cuando. */
  private createDragonEgg() {
    const { scene } = this;
    const x = 926;
    const y = 548;
    scene.add.image(x, y + 34, DUNGEON_TEXTURES.nest).setDepth(DEPTH.props);
    const aura = scene.add.image(x, y, DUNGEON_TEXTURES.softLight)
      .setDepth(DEPTH.props)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setTint(0xffa63d)
      .setScale(0.5)
      .setAlpha(0.15);
    const egg = scene.add.image(x, y + 42, DUNGEON_TEXTURES.egg).setOrigin(0.5, 1).setDepth(DEPTH.props + 1);
    const cracks = scene.add.image(x, y + 42, DUNGEON_TEXTURES.eggGlow)
      .setOrigin(0.5, 1)
      .setDepth(DEPTH.props + 2)
      .setBlendMode(Phaser.BlendModes.ADD);
    scene.tweens.add({
      targets: [cracks, aura],
      alpha: { from: 0.2, to: 0.9 },
      duration: 1100,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    const wobble = () => {
      scene.tweens.add({
        targets: [egg, cracks],
        angle: { from: -6, to: 6 },
        duration: 90,
        yoyo: true,
        repeat: 3,
        onComplete: () => {
          egg.setAngle(0);
          cracks.setAngle(0);
        },
      });
      scene.time.delayedCall(Phaser.Math.Between(3500, 6500), wobble);
    };
    scene.time.delayedCall(2500, wobble);
  }

  /** Varita rota en el suelo que suelta chispas mágicas intermitentes. */
  private createBrokenWand() {
    const { scene } = this;
    const left = 812;
    const top = 576;
    scene.add.image(left, top, DUNGEON_TEXTURES.wand).setOrigin(0, 0).setDepth(DEPTH.props).setAngle(-6);
    const sparks = scene.add.particles(left + WAND_SPARK_POINT.x, top + WAND_SPARK_POINT.y - 6,
      DUNGEON_TEXTURES.spark, {
        emitting: false,
        lifespan: { min: 300, max: 700 },
        speed: { min: 30, max: 90 },
        angle: { min: -160, max: -20 },
        gravityY: 120,
        scale: { start: 0.7, end: 0 },
        tint: [0xffd166, 0xc77dff, 0xffffff],
        blendMode: Phaser.BlendModes.ADD,
      }).setDepth(DEPTH.props + 1);
    scene.time.addEvent({
      delay: 1300,
      loop: true,
      callback: () => sparks.explode(Phaser.Math.Between(3, 8)),
    });
  }

  /** Gota que cae del techo a un charco entre las puertas. */
  private createDrip() {
    const { scene } = this;
    const x = 468;
    const floorY = 590;
    scene.add.image(x, floorY, DUNGEON_TEXTURES.puddle).setDepth(DEPTH.props);
    const drop = scene.add.image(x, 40, DUNGEON_TEXTURES.drop).setDepth(DEPTH.props + 1).setAlpha(0);
    const ripple = scene.add.ellipse(x, floorY, 18, 5).setStrokeStyle(1, 0xbcd6ff, 0.8).setDepth(DEPTH.props + 1);
    ripple.setAlpha(0);
    const fall = () => {
      drop.setPosition(x, 40).setAlpha(0.9).setScale(0.4);
      scene.tweens.add({ targets: drop, scale: 1, duration: 500 });
      scene.tweens.add({
        targets: drop,
        y: floorY - 4,
        duration: 760,
        delay: 500,
        ease: 'Quad.easeIn',
        onComplete: () => {
          drop.setAlpha(0);
          ripple.setScale(0.4).setAlpha(0.9);
          scene.tweens.add({
            targets: ripple,
            scaleX: 3.2,
            scaleY: 2.2,
            alpha: 0,
            duration: 700,
            ease: 'Sine.easeOut',
          });
          scene.time.delayedCall(Phaser.Math.Between(1800, 3600), fall);
        },
      });
    };
    scene.time.delayedCall(1200, fall);
  }

  /** Bancos de niebla violeta que se deslizan a ras de suelo. */
  private createFog() {
    [{ x: 260, duration: 9000 }, { x: 740, duration: 11000 }].forEach(({ x, duration }, index) => {
      const fog = this.scene.add.image(x, 598, DUNGEON_TEXTURES.softLight)
        .setDepth(DEPTH.fog)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setTint(0x7a6cff)
        .setScale(3.4, 0.5)
        .setAlpha(0.14);
      this.scene.tweens.add({
        targets: fog,
        x: x + (index ? -120 : 120),
        alpha: 0.24,
        duration,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    });
  }

  /** Motas de polvo en suspensión, con la escena ya poblada desde el primer fotograma (`advance`). */
  private createDustMotes() {
    this.scene.add.particles(0, 0, DUNGEON_TEXTURES.mote, {
      emitZone: randomZone(new Phaser.Geom.Rectangle(40, 70, 920, 500)),
      frequency: 160,
      lifespan: { min: 6000, max: 10000 },
      speedX: { min: -9, max: 9 },
      speedY: { min: -11, max: 4 },
      scale: { min: 0.15, max: 0.45 },
      alpha: { values: [0, 0.55, 0.45, 0] },
      tint: [0xffe7b3, 0xd9d0e8, 0xffffff],
      blendMode: Phaser.BlendModes.ADD,
      maxAliveParticles: 70,
      advance: 8000,
    }).setDepth(DEPTH.motes);
  }
}

/**
 * Zona de emisión aleatoria. Las formas de `Phaser.Geom` cumplen el contrato `getRandomPoint` en tiempo de
 * ejecución, pero su firma genérica no encaja con `RandomZoneSource` en los tipos de Phaser 4.2.1.
 */
function randomZone(shape: Phaser.Geom.Rectangle | Phaser.Geom.Circle) {
  return { type: 'random', source: shape as unknown as Phaser.Types.GameObjects.Particles.RandomZoneSource };
}
