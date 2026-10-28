import Phaser from 'phaser';

export class BeehivesScene extends Phaser.Scene {
  private options: string[];
  private counts: number[];
  private winnerIndex: number;
  private onComplete: (counts: number[], winnerIndex: number) => void;
  private running = false;
  private counterTexts: Phaser.GameObjects.Text[] = [];
  private visibleCounts: number[] = [];
  private hiveGraphics: Phaser.GameObjects.Graphics[] = [];
  private bees: Phaser.GameObjects.Text[] = [];

  constructor(options: string[], counts: number[], winnerIndex: number, onComplete: (counts: number[], winnerIndex: number) => void) {
    super({ key: 'BeehivesScene' });
    this.options = options;
    this.counts = counts;
    this.winnerIndex = winnerIndex;
    this.onComplete = onComplete;
  }

  create() {
    this.running = false;
    this.counterTexts = [];
    this.visibleCounts = this.counts.map(() => 0);
    this.hiveGraphics = [];
    this.bees = [];

    this.add.rectangle(500, 310, 1000, 620, 0x251a36);
    this.add.rectangle(500, 290, 1000, 500, 0x668d58).setDepth(-20);
    this.add.graphics().fillStyle(0x30251b, 0.5).fillEllipse(500, 582, 930, 70).setDepth(-8);
    for (let x = 12; x < 1000; x += 145) {
      this.add.rectangle(x, 455, 38, 250, 0x855532).setStrokeStyle(4, 0x30251b).setDepth(-10);
      this.add.circle(x, 350, 90, x % 2 ? 0x4f7656 : 0x668d58).setStrokeStyle(5, 0x30251b).setDepth(-9);
    }
    this.add.text(500, 42, 'LA COMPETENCIA DE PANALES', { fontFamily: 'Arial Black, Arial', fontSize: '27px', color: '#ffd43b', fontStyle: 'bold', stroke: '#30251b', strokeThickness: 5 }).setOrigin(0.5).setDepth(20);

    const spacing = Math.min(170, 860 / this.options.length);
    const totalWidth = spacing * (this.options.length - 1);
    this.options.forEach((option, index) => {
      const x = 500 - totalWidth / 2 + index * spacing;
      this.add.rectangle(x, 420, 18, 190, 0x855532).setStrokeStyle(3, 0x30251b).setDepth(-2);

      const hive = this.add.graphics().setDepth(1);
      hive.fillStyle(0x30251b, 0.5).fillEllipse(x + 7, 325, 112, 145);
      hive.fillStyle(0xf7c948).fillEllipse(x, 315, 108, 142);
      hive.lineStyle(6, 0x30251b).strokeEllipse(x, 315, 108, 142);
      hive.lineStyle(4, 0xff9f43);
      for (let row = 0; row < 4; row += 1) hive.strokeEllipse(x, 275 + row * 27, 86 - row * 8, 15);
      this.add.graphics().fillStyle(0x30251b).fillEllipse(x, 332, 34, 23).setDepth(2);
      this.hiveGraphics.push(hive);

      const counter = this.add.text(x, 220, '0 🐝', { fontFamily: 'Arial Black, Arial', fontSize: '20px', color: '#30251b', backgroundColor: '#fff9e9', padding: { x: 8, y: 4 } }).setOrigin(0.5).setDepth(6);
      this.counterTexts.push(counter);

      const labelSize = Math.max(12, Math.min(17, spacing / Math.max(7, option.length * 0.72)));
      this.add.text(x, 470, option, { fontFamily: 'Arial Black, Arial', fontSize: `${labelSize}px`, color: '#fff9e9', align: 'center', stroke: '#30251b', strokeThickness: 4, wordWrap: { width: spacing - 12 } }).setOrigin(0.5).setDepth(8);
      this.add.star(x, 365, 4, 10, 22, 0xffd43b).setStrokeStyle(2, 0x30251b).setDepth(3).setAlpha(0.35);
    });

    this.add.text(500, 548, 'La salida', { fontFamily: 'Arial', fontSize: '13px', fontStyle: 'bold', color: '#30251b', backgroundColor: '#fff9e9', padding: { x: 8, y: 4 } }).setOrigin(0.5).setDepth(5);
  }

  play() {
    if (this.running) return;
    this.running = true;
    const targets = this.counts.flatMap((count, index) => Array.from({ length: count }, () => index));
    for (let index = targets.length - 1; index > 0; index -= 1) {
      const swap = Phaser.Math.Between(0, index);
      [targets[index], targets[swap]] = [targets[swap], targets[index]];
    }

    targets.forEach((target, beeIndex) => {
      const spacing = Math.min(170, 860 / this.options.length);
      const totalWidth = spacing * (this.options.length - 1);
      const targetX = 500 - totalWidth / 2 + target * spacing;
      const startX = 455 + Phaser.Math.Between(-100, 100);
      const startY = 552 + Phaser.Math.Between(-12, 12);
      const targetY = 315 + Phaser.Math.Between(-38, 38);
      const flightTime = Phaser.Math.Between(950, 1450);
      const wave = Phaser.Math.Between(18, 38);
      const bee = this.add.text(startX, startY, '🐝', { fontFamily: 'Arial', fontSize: '27px' }).setOrigin(0.5).setDepth(12);
      this.bees.push(bee);
      const progress = { value: 0 };

      this.tweens.add({
        targets: progress, value: 1, duration: flightTime, delay: beeIndex * 85 + Phaser.Math.Between(0, 180), ease: 'Sine.easeInOut',
        onUpdate: () => {
          const t = progress.value;
          bee.setPosition(Phaser.Math.Linear(startX, targetX, t), Phaser.Math.Linear(startY, targetY, t) - Math.sin(t * Math.PI) * wave);
          bee.setAngle(Math.sin(t * Math.PI * 3) * 8);
        },
        onComplete: () => {
          this.visibleCounts[target] += 1;
          this.counterTexts[target].setText(`${this.visibleCounts[target]} 🐝`);
          this.tweens.add({ targets: bee, scale: 0.2, alpha: 0, duration: 180, onComplete: () => {
            bee.destroy();
            this.bees = this.bees.filter((item) => item !== bee);
          } });
        },
      });
    });

    this.time.delayedCall(1450 + targets.length * 265, () => {
      this.highlightWinner();
      this.running = false;
      this.onComplete([...this.counts], this.winnerIndex);
    });
  }

  private highlightWinner() {
    const hive = this.hiveGraphics[this.winnerIndex];
    this.tweens.add({ targets: hive, alpha: { from: 1, to: 0.72 }, yoyo: true, repeat: 3, duration: 180 });
    this.counterTexts[this.winnerIndex].setBackgroundColor('#73C66A');
    const spacing = Math.min(170, 860 / this.options.length);
    const totalWidth = spacing * (this.options.length - 1);
    const x = 500 - totalWidth / 2 + this.winnerIndex * spacing;
    for (let index = 0; index < 10; index += 1) {
      const sparkle = this.add.star(x + Phaser.Math.Between(-75, 75), 300 + Phaser.Math.Between(-70, 70), 4, 4, 12, index % 2 ? 0xff9f43 : 0xffd43b).setDepth(15);
      this.tweens.add({ targets: sparkle, alpha: 0, scale: 1.6, y: sparkle.y - 28, duration: 650, delay: index * 35, onComplete: () => sparkle.destroy() });
    }
  }

  reset() {
    this.time.removeAllEvents();
    this.tweens.killAll();
    this.bees.forEach((bee) => bee.destroy());
    this.bees = [];
    this.scene.restart();
  }
}
