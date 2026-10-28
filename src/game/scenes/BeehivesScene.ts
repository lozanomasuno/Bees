import Phaser from 'phaser';

export class BeehivesScene extends Phaser.Scene {
  private options: string[];
  private counts: number[];
  private winnerIndex: number;
  private onComplete: (counts: number[], winnerIndex: number) => void;
  private running = false;

  constructor(options: string[], counts: number[], winnerIndex: number, onComplete: (counts: number[], winnerIndex: number) => void) {
    super({ key: 'BeehivesScene' });
    this.options = options;
    this.counts = counts;
    this.winnerIndex = winnerIndex;
    this.onComplete = onComplete;
  }

  create() {
    this.add.rectangle(500, 310, 1000, 620, 0x251a36);
    this.add.text(500, 42, 'LA COMPETENCIA DE PANALES', { fontFamily: 'Arial', fontSize: '27px', color: '#ffd43b', fontStyle: 'bold' }).setOrigin(0.5);
    const spacing = 850 / this.options.length;
    this.options.forEach((option, index) => {
      const x = 75 + spacing / 2 + index * spacing;
      this.add.rectangle(x, 350, 70, 150, 0x855532).setStrokeStyle(5, 0x30251b);
      const hive = this.add.ellipse(x, 250, 120, 155, 0xf7c948).setStrokeStyle(6, 0x30251b);
      this.add.text(x, 250, `${this.counts[index]} 🐝`, { fontFamily: 'Arial', fontSize: '19px', color: '#30251b', fontStyle: 'bold' }).setOrigin(0.5);
      this.add.text(x, 385, option, { fontFamily: 'Arial', fontSize: Math.max(14, 19 - this.options.length), color: '#fff', fontStyle: 'bold', align: 'center', wordWrap: { width: spacing - 12 } }).setOrigin(0.5);
      hive.setData('shown', false);
    });
  }

  play() {
    if (this.running) return;
    this.running = true;
    const targets = this.counts.flatMap((count, index) => Array(count).fill(index));
    targets.forEach((target, completed) => {
      const spacing = 850 / this.options.length;
      const targetX = 75 + spacing / 2 + target * spacing;
      const beeIcon = this.add.text(30, 520, '🐝', { fontFamily: 'Arial', fontSize: '28px' });
      this.tweens.add({ targets: beeIcon, x: targetX, y: 250 + Phaser.Math.Between(-45, 45), duration: 700, delay: completed * 160, ease: 'Sine.easeInOut', yoyo: true, onComplete: () => beeIcon.destroy() });
    });
    this.time.delayedCall(700 + targets.length * 160, () => this.onComplete(this.counts, this.winnerIndex));
  }

  reset() { this.scene.restart(); }
}
