import Phaser from 'phaser';
import { ForestAmbience } from '../beehives/forestAmbience';
import { BEE_FRAMES, FOREST_TEXTURES, ensureForestTextures } from '../beehives/forestTextures';
import { HiveView } from '../beehives/hiveView';

/**
 * Escena «La competencia de panales»: coordina el Bosque Encantado, los panales y el vuelo de las abejas.
 *
 * El arte y la ambientación viven en `src/game/beehives/` (texturas, ambientación y vista de panal).
 * El movimiento de las abejas (constantes, cadencia de lanzamiento, trayectoria y orientación en `update`)
 * es el original y no debe ajustarse para compensar cambios visuales: el aleteo es una animación de
 * fotogramas independiente y la orientación horizontal (`flipX`) no altera posición ni giro.
 */

interface BeeFlight {
  bee: Phaser.GameObjects.Sprite;
  targetIndex: number;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  elapsed: number;
  duration: number;
  wave: number;
  active: boolean;
}

const FLY_TIME_MIN = 550;
const FLY_TIME_MAX = 850;
const WAVE_INTERVAL_MIN = 18;
const WAVE_INTERVAL_MAX = 25;
const BEE_POOL_SIZE = 48;
/** Aleteo visual: alas arriba, medio, abajo, medio. No interviene en el desplazamiento. */
const BEE_FLAP_ANIMATION = 'bee-flap';
const BEE_FLAP_FRAME_RATE = 36;

export class BeehivesScene extends Phaser.Scene {
  private options: string[];
  private counts: number[];
  private winnerIndex: number;
  private onComplete: (counts: number[], winnerIndex: number, tiedWinnerIndexes: number[]) => void;
  private running = false;
  private counterTexts: Phaser.GameObjects.Text[] = [];
  private visibleCounts: number[] = [];
  private hives: HiveView[] = [];
  private beePool: Phaser.GameObjects.Sprite[] = [];
  private flights: BeeFlight[] = [];
  private remainingTargets: number[] = [];
  private launchIndex = 0;
  private launchAccumulator = 0;
  private arrivedCount = 0;
  private finished = false;

  constructor(options: string[], counts: number[], winnerIndex: number, onComplete: (counts: number[], winnerIndex: number, tiedWinnerIndexes: number[]) => void) {
    super({ key: 'BeehivesScene' });
    this.options = options;
    this.counts = counts;
    this.winnerIndex = winnerIndex;
    this.onComplete = onComplete;
  }

  create() {
    this.running = false;
    this.finished = false;
    this.arrivedCount = 0;
    this.counterTexts = [];
    this.visibleCounts = this.counts.map(() => 0);
    this.hives = [];
    this.flights = [];
    this.beePool = [];
    ensureForestTextures(this);
    new ForestAmbience(this);

    const spacing = Math.min(178, 850 / this.options.length);
    const totalWidth = spacing * (this.options.length - 1);
    this.options.forEach((option, index) => {
      const x = 500 - totalWidth / 2 + index * spacing;
      this.hives.push(new HiveView(this, { index, x, spacing, option }));
    });
    this.counterTexts = this.hives.map((hive) => hive.counter);

    this.add.text(500, 42, 'LA COMPETENCIA DE PANALES', {
      fontFamily: 'Arial Black, Arial',
      fontSize: '27px',
      color: '#ffd43b',
      fontStyle: 'bold',
      stroke: '#30251b',
      strokeThickness: 6,
      shadow: { offsetX: 0, offsetY: 2, color: '#1b1206', blur: 8, fill: true, stroke: true },
    }).setOrigin(0.5).setDepth(30);

    if (!this.anims.exists(BEE_FLAP_ANIMATION)) {
      this.anims.create({
        key: BEE_FLAP_ANIMATION,
        frames: [0, 1, 2, 1].map((frame) => ({ key: FOREST_TEXTURES.bee, frame: BEE_FRAMES[frame] })),
        frameRate: BEE_FLAP_FRAME_RATE,
        repeat: -1,
      });
    }
    for (let index = 0; index < BEE_POOL_SIZE; index += 1) {
      const bee = this.add.sprite(-40, -40, FOREST_TEXTURES.bee, BEE_FRAMES[0])
        .setOrigin(0.5)
        .setDepth(12)
        .setVisible(false);
      bee.play({ key: BEE_FLAP_ANIMATION, startFrame: index % 4 });
      this.beePool.push(bee);
    }
  }

  play() {
    if (this.running) return;
    this.running = true;
    const targets: number[] = [];
    this.counts.forEach((count, target) => {
      for (let index = 0; index < count; index += 1) targets.push(target);
    });
    for (let index = targets.length - 1; index > 0; index -= 1) {
      const swap = Phaser.Math.Between(0, index);
      [targets[index], targets[swap]] = [targets[swap], targets[index]];
    }
    this.remainingTargets = targets;
    this.launchIndex = 0;
    this.launchAccumulator = 0;
    this.arrivedCount = 0;
    this.finished = false;
    this.counterTexts.forEach((text) => text.setText('0 🐝').setBackgroundColor('#fff9e9'));
  }

  update(_time: number, delta: number) {
    if (!this.running || this.finished) return;
    this.launchAccumulator += delta;
    const waveInterval = Phaser.Math.Between(WAVE_INTERVAL_MIN, WAVE_INTERVAL_MAX);
    if (this.launchAccumulator >= waveInterval && this.launchIndex < this.remainingTargets.length) {
      this.launchAccumulator -= waveInterval;
      const batchSize = this.launchIndex < 40 && Phaser.Math.FloatBetween(0, 1) > 0.72 ? 2 : 1;
      for (let batchIndex = 0; batchIndex < batchSize && this.launchIndex < this.remainingTargets.length; batchIndex += 1) {
        if (!this.launchBee(this.remainingTargets[this.launchIndex])) break;
        this.launchIndex += 1;
      }
    }

    this.flights.forEach((flight) => {
      if (!flight.active) return;
      flight.elapsed += delta;
      const t = Math.min(1, flight.elapsed / flight.duration);
      const baseX = Phaser.Math.Linear(flight.startX, flight.targetX, t);
      const baseY = Phaser.Math.Linear(flight.startY, flight.targetY, t);
      flight.bee.setPosition(baseX + Math.sin(t * Math.PI * 3 + flight.wave) * 18, baseY - Math.sin(t * Math.PI) * flight.wave * 0.55);
      flight.bee.setAngle(Math.sin(t * Math.PI * 4) * 7);
      if (t >= 1) {
        flight.active = false;
        flight.bee.setVisible(false);
        this.visibleCounts[flight.targetIndex] += 1;
        this.arrivedCount += 1;
        this.counterTexts[flight.targetIndex].setText(`${this.visibleCounts[flight.targetIndex]} 🐝`);
        if (this.launchIndex >= this.remainingTargets.length && this.arrivedCount >= this.remainingTargets.length && !this.finished) this.completeCompetition();
      }
    });
  }

  private launchBee(targetIndex: number): boolean {
    const flight = this.flights.find((item) => !item.active);
    const bee = flight?.bee ?? this.beePool.find((candidate) => !candidate.visible);
    if (!bee) return false;
    const edge = Phaser.Math.Between(0, 3);
    const start = edge === 0 ? { x: -20, y: Phaser.Math.Between(120, 520) }
      : edge === 1 ? { x: 1020, y: Phaser.Math.Between(120, 520) }
      : edge === 2 ? { x: Phaser.Math.Between(80, 920), y: -20 }
      : { x: Phaser.Math.Between(80, 920), y: 610 };
    const spacing = Math.min(178, 850 / this.options.length);
    const totalWidth = spacing * (this.options.length - 1);
    const targetX = 500 - totalWidth / 2 + targetIndex * spacing;
    const targetY = Phaser.Math.Between(330, 365);
    // Solo visual: la abeja mira hacia su destino. No cambia posición, giro ni consumo de aleatorios.
    bee.setFlipX(targetX < start.x);
    bee.setPosition(start.x, start.y).setVisible(true).setAlpha(1).setScale(Phaser.Math.FloatBetween(0.72, 1.08));
    if (flight) {
      flight.targetIndex = targetIndex;
      flight.startX = start.x;
      flight.startY = start.y;
      flight.targetX = targetX;
      flight.targetY = targetY;
      flight.elapsed = 0;
      flight.duration = Phaser.Math.Between(FLY_TIME_MIN, FLY_TIME_MAX);
      flight.wave = Phaser.Math.Between(18, 38);
      flight.active = true;
    } else {
      this.flights.push({ bee, targetIndex, startX: start.x, startY: start.y, targetX, targetY, elapsed: 0, duration: Phaser.Math.Between(FLY_TIME_MIN, FLY_TIME_MAX), wave: Phaser.Math.Between(18, 38), active: true });
    }
    return true;
  }

  private completeCompetition() {
    this.finished = true;
    this.running = false;
    this.visibleCounts = [...this.counts];
    this.counterTexts.forEach((text, index) => text.setText(`${this.counts[index]} 🐝`));
    this.highlightWinner();
    const highestCount = Math.max(...this.counts);
    const tiedWinnerIndexes = this.counts
      .map((count, index) => ({ count, index }))
      .filter(({ count }) => count === highestCount)
      .map(({ index }) => index);
    this.onComplete([...this.counts], this.winnerIndex, tiedWinnerIndexes);
  }

  private highlightWinner() {
    this.hives[this.winnerIndex].celebrate();
    this.counterTexts[this.winnerIndex].setBackgroundColor('#73C66A');
  }

  reset() {
    this.running = false;
    this.flights.forEach((flight) => flight.bee.destroy());
    this.flights = [];
    this.tweens.killAll();
    this.scene.restart();
  }
}
