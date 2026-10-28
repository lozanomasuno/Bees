import Phaser from 'phaser';

interface BeeFlight {
  bee: Phaser.GameObjects.Text;
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

export class BeehivesScene extends Phaser.Scene {
  private options: string[];
  private counts: number[];
  private winnerIndex: number;
  private onComplete: (counts: number[], winnerIndex: number, tiedWinnerIndexes: number[]) => void;
  private running = false;
  private counterTexts: Phaser.GameObjects.Text[] = [];
  private visibleCounts: number[] = [];
  private hiveGraphics: Phaser.GameObjects.Graphics[] = [];
  private beePool: Phaser.GameObjects.Text[] = [];
  private flights: BeeFlight[] = [];
  private remainingTargets: number[] = [];
  private launchIndex = 0;
  private launchAccumulator = 0;
  private leafTimer?: Phaser.Time.TimerEvent;
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
    this.hiveGraphics = [];
    this.flights = [];
    this.beePool = [];
    this.drawForest();
    this.drawCurvedBranch();

    const spacing = Math.min(178, 850 / this.options.length);
    const totalWidth = spacing * (this.options.length - 1);
    this.options.forEach((option, index) => {
      const x = 500 - totalWidth / 2 + index * spacing;
      this.drawHive(x, index, spacing, option);
    });

    for (let index = 0; index < BEE_POOL_SIZE; index += 1) {
      const bee = this.add.text(-40, -40, '🐝', { fontFamily: 'Arial', fontSize: '22px' }).setOrigin(0.5).setDepth(12).setVisible(false);
      this.beePool.push(bee);
    }
    this.scheduleLeafFall();
  }

  private drawForest() {
    const sky = this.add.graphics().setDepth(-40);
    sky.fillGradientStyle(0x6f7190, 0x6f7190, 0x4f7656, 0x294b35, 1).fillRect(0, 0, 1000, 620);
    sky.fillStyle(0xfff9e9, 0.16).fillTriangle(0, 70, 330, 620, 520, 620);
    sky.fillStyle(0xffd43b, 0.12).fillCircle(820, 115, 100);

    [-20, 150, 330, 560, 820, 980].forEach((x, index) => {
      const cloud = this.add.graphics().setDepth(-35);
      cloud.fillStyle(0xfff9e9, 0.62).fillEllipse(x, 105 + index % 3 * 22, 130, 34);
      cloud.fillCircle(x - 35, 96 + index % 3 * 22, 28).fillCircle(x + 28, 91 + index % 3 * 22, 36);
    });

    const distant = this.add.graphics().setDepth(-32);
    distant.fillStyle(0x294b35, 0.72);
    [70, 220, 390, 560, 730, 910].forEach((x, index) => {
      distant.fillTriangle(x, 390, x - 70, 120 + index % 2 * 40, x + 85, 390);
      distant.fillTriangle(x, 330, x - 58, 70 + index % 3 * 35, x + 68, 330);
    });

    const middleTrees = this.add.graphics().setDepth(-24);
    [35, 175, 845, 970].forEach((x, index) => {
      middleTrees.fillStyle(0x855532, 1).fillRect(x, 270, 42, 310);
      middleTrees.lineStyle(5, 0x30251b).strokeRect(x, 270, 42, 310);
      const top = 250 + index % 2 * 28;
      middleTrees.fillStyle(index % 2 ? 0x4f7656 : 0x294b35, 1);
      middleTrees.fillCircle(x + 2, top, 82).fillCircle(x - 42, top + 28, 58).fillCircle(x + 52, top + 35, 66);
      middleTrees.lineStyle(5, 0x30251b).strokeCircle(x + 2, top, 82);
      middleTrees.lineStyle(3, 0x30251b, 0.8).beginPath().moveTo(x + 8, 390).lineTo(x + 25, 435).moveTo(x + 18, 455).lineTo(x - 2, 490).strokePath();
    });

    const ground = this.add.graphics().setDepth(-18);
    ground.fillStyle(0x294b35).fillEllipse(500, 585, 1000, 105);
    ground.lineStyle(5, 0x30251b).beginPath().moveTo(0, 548);
    for (let x = 100; x <= 1000; x += 100) ground.lineTo(x, 548 + Math.sin(x * 0.012) * 18);
    ground.strokePath();

    const details = this.add.graphics().setDepth(-16);
    for (let x = 25; x < 975; x += 48) {
      const height = Phaser.Math.Between(12, 26);
      details.lineStyle(3, x % 96 ? 0x73c66a : 0x4f7656).beginPath().moveTo(x, 570).lineTo(x - 7, 570 - height).moveTo(x, 570).lineTo(x + 3, 570 - height + 5).strokePath();
    }
    [150, 335, 685, 865].forEach((x, index) => {
      details.fillStyle(index % 2 ? 0xff9f43 : 0xfff9e9).fillCircle(x, 548, 7);
      details.lineStyle(3, 0x30251b).strokeCircle(x, 548, 7);
      details.lineStyle(3, 0x73c66a).beginPath().moveTo(x, 555).lineTo(x, 570).strokePath();
    });
    [70, 930].forEach((x) => {
      details.fillStyle(0xfff9e9).fillEllipse(x, 552, 27, 18);
      details.fillStyle(0xff9f43).fillEllipse(x, 560, 14, 13);
      details.lineStyle(3, 0x30251b).strokeEllipse(x, 552, 27, 18);
      details.lineStyle(4, 0x855532).beginPath().moveTo(x, 558).lineTo(x, 575).strokePath();
    });

    for (let index = 0; index < 18; index += 1) {
      this.add.circle(Phaser.Math.Between(80, 920), Phaser.Math.Between(90, 430), Phaser.Math.Between(2, 4), index % 2 ? 0xffd43b : 0xfff9e9, 0.38).setDepth(-14);
    }
    this.add.text(500, 42, 'LA COMPETENCIA DE PANALES', {
      fontFamily: 'Arial Black, Arial', fontSize: '27px', color: '#ffd43b', fontStyle: 'bold', stroke: '#30251b', strokeThickness: 5,
    }).setOrigin(0.5).setDepth(30);
  }

  private drawCurvedBranch() {
    const branchShadow = this.add.graphics().setDepth(-3);
    const branch = this.add.graphics().setDepth(-2);
    branchShadow.lineStyle(29, 0x30251b, 0.45).beginPath();
    branch.lineStyle(24, 0x855532).beginPath();
    branchShadow.beginPath();
    branch.beginPath();
    const points = [
      new Phaser.Math.Vector2(55, 150), new Phaser.Math.Vector2(270, 100),
      new Phaser.Math.Vector2(500, 135), new Phaser.Math.Vector2(735, 105), new Phaser.Math.Vector2(950, 145),
    ];
    branchShadow.moveTo(points[0].x, points[0].y + 7);
    branch.moveTo(points[0].x, points[0].y);
    for (let index = 1; index < points.length; index += 1) {
      const current = points[index];
      branchShadow.lineTo(current.x, current.y + 7);
      branch.lineTo(current.x, current.y);
    }
    branchShadow.strokePath();
    branch.strokePath();
    branch.lineStyle(7, 0xb87843).beginPath().moveTo(70, 145).lineTo(930, 140).strokePath();

    for (let x = 110; x < 940; x += 105) {
      const y = 140 + Math.sin(x * 0.018) * 18;
      const leaf = this.add.graphics().setDepth(-1);
      leaf.fillStyle(x % 210 ? 0x73c66a : 0x4f7656).fillEllipse(x, y - 8, 32, 14);
      leaf.lineStyle(2, 0x30251b).strokeEllipse(x, y - 8, 32, 14);
      leaf.setAngle(Phaser.Math.Between(-30, 30));
      if (x % 210 === 0) branch.lineStyle(5, 0x855532).beginPath().moveTo(x, y).lineTo(x + 20, y + 42).strokePath();
    }
  }

  private drawHive(x: number, _index: number, spacing: number, option: string) {
    const branchY = 140 + Math.sin(x * 0.018) * 18;
    const stem = this.add.graphics().setDepth(1);
    stem.lineStyle(4, 0x30251b).beginPath().moveTo(x, branchY + 2).lineTo(x, 188).strokePath();
    stem.lineStyle(2, 0x73c66a).beginPath().moveTo(x - 3, branchY + 5).lineTo(x, 188).strokePath();

    const hive = this.add.graphics().setDepth(3);
    hive.fillStyle(0x30251b, 0.45).fillEllipse(x + 7, 350, 112, 142);
    hive.fillStyle(0xf7c948).fillEllipse(x, 338, 108, 138);
    hive.lineStyle(6, 0x30251b).strokeEllipse(x, 338, 108, 138);
    hive.lineStyle(4, 0xff9f43);
    for (let row = 0; row < 4; row += 1) hive.strokeEllipse(x, 298 + row * 27, 86 - row * 8, 15);
    hive.fillStyle(0x30251b).fillEllipse(x, 356, 34, 23);
    this.hiveGraphics.push(hive);

    const counter = this.add.text(x, 228, '0 🐝', {
      fontFamily: 'Arial Black, Arial', fontSize: '19px', color: '#30251b', backgroundColor: '#fff9e9', padding: { x: 8, y: 4 },
    }).setOrigin(0.5).setDepth(8);
    this.counterTexts.push(counter);

    const labelSize = Math.max(12, Math.min(17, spacing / Math.max(7, option.length * 0.72)));
    this.add.text(x, 442, option, {
      fontFamily: 'Arial Black, Arial', fontSize: `${labelSize}px`, color: '#fff9e9', align: 'center', stroke: '#30251b', strokeThickness: 4, wordWrap: { width: spacing - 12 },
    }).setOrigin(0.5).setDepth(8);
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
    const hive = this.hiveGraphics[this.winnerIndex];
    this.tweens.add({ targets: hive, alpha: { from: 1, to: 0.68 }, yoyo: true, repeat: 3, duration: 160 });
    this.counterTexts[this.winnerIndex].setBackgroundColor('#73C66A');
    const spacing = Math.min(178, 850 / this.options.length);
    const totalWidth = spacing * (this.options.length - 1);
    const x = 500 - totalWidth / 2 + this.winnerIndex * spacing;
    for (let index = 0; index < 12; index += 1) {
      const sparkle = this.add.star(x + Phaser.Math.Between(-55, 55), 330 + Phaser.Math.Between(-60, 60), 4, 4, 12, index % 2 ? 0xff9f43 : 0xffd43b).setDepth(15);
      this.tweens.add({ targets: sparkle, alpha: 0, scale: 1.5, y: sparkle.y - 24, duration: 500, onComplete: () => sparkle.destroy() });
    }
  }

  private scheduleLeafFall() {
    this.leafTimer = this.time.addEvent({ delay: 2400, loop: true, callback: () => {
      const leaf = this.add.graphics().fillStyle(Phaser.Math.Between(0, 1) ? 0x73c66a : 0x4f7656).fillEllipse(0, 0, 24, 12).lineStyle(2, 0x30251b).strokeEllipse(0, 0, 24, 12).setPosition(Phaser.Math.Between(120, 880), 125).setDepth(5);
      this.tweens.add({
        targets: leaf, y: 545, x: leaf.x + Phaser.Math.Between(-90, 90), angle: Phaser.Math.Between(180, 540), alpha: 0.85, duration: Phaser.Math.Between(2600, 4200), ease: 'Sine.easeInOut',
        onUpdate: (_tween, target: Phaser.GameObjects.Graphics) => target.x += Math.sin(this.time.now * 0.008) * 0.12,
        onComplete: () => leaf.destroy(),
      });
    } });
  }

  reset() {
    this.running = false;
    this.leafTimer?.remove(false);
    this.leafTimer = undefined;
    this.flights.forEach((flight) => flight.bee.destroy());
    this.flights = [];
    this.tweens.killAll();
    this.scene.restart();
  }
}
