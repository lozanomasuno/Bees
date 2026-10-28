import Phaser from 'phaser';

export class PodiumScene extends Phaser.Scene {
  private options: string[];
  private ranking: number[];
  private onComplete: (ranking: number[]) => void;
  private running = false;

  constructor(options: string[], ranking: number[], onComplete: (ranking: number[]) => void) {
    super({ key: 'PodiumScene' });
    this.options = options;
    this.ranking = ranking;
    this.onComplete = onComplete;
  }

  create() {
    this.add.rectangle(500, 310, 1000, 620, 0x251a36);
    this.add.text(500, 45, 'EL PODIO MÁGICO', { fontFamily: 'Arial', fontSize: '30px', color: '#ffd43b', fontStyle: 'bold' }).setOrigin(0.5);
    const heights = [220, 300, 170];
    const xs = [500, 280, 720];
    this.ranking.forEach((optionIndex, place) => {
      const podium = this.add.container(xs[place], 380);
      const platform = this.add.rectangle(0, 0, 190, heights[place], place === 0 ? 0xffd43b : 0xa8dc78).setStrokeStyle(6, 0x30251b);
      const position = place === 0 ? '1º' : place === 1 ? '2º' : '3º';
      const badge = this.add.text(0, -65, position, { fontFamily: 'Arial', fontSize: '38px', color: '#30251b', fontStyle: 'bold' }).setOrigin(0.5);
      const hidden = this.add.text(0, 10, '???', { fontFamily: 'Arial', fontSize: '30px', color: '#30251b', fontStyle: 'bold' }).setOrigin(0.5);
      podium.add([platform, badge, hidden]).setData({ optionIndex, place, hidden });
      podium.setAlpha(0).setScale(0.7);
      this.tweens.add({ targets: podium, alpha: 1, scale: 1, duration: 450, delay: place * 180, ease: 'Back.easeOut' });
    });
  }

  play() {
    if (this.running) return;
    this.running = true;
    this.tweens.pauseAll();
    this.tweens.resumeAll();
    const revealOrder = [2, 1, 0];
    revealOrder.forEach((place, order) => {
      const podium = this.children.list.find((child) => child instanceof Phaser.GameObjects.Container && child.getData('place') === place) as Phaser.GameObjects.Container | undefined;
      this.time.delayedCall(700 + order * 850, () => {
        if (!podium) return;
        const hidden = podium.getData('hidden') as Phaser.GameObjects.Text;
        hidden.setText(this.options[this.ranking[place]]).setFontSize(place === 0 ? 22 : 18);
        podium.setScale(1).setAngle(place === 0 ? -3 : 0);
        this.tweens.add({ targets: podium, scaleX: place === 0 ? 1.12 : 1.08, scaleY: place === 0 ? 1.12 : 1.08, yoyo: true, duration: 280, repeat: place === 0 ? 2 : 0 });
        if (place === 0) this.time.delayedCall(850, () => this.onComplete(this.ranking));
      });
    });
  }

  reset() {
    this.time.removeAllEvents();
    this.tweens.killAll();
    this.running = false;
    this.scene.restart();
  }
}
