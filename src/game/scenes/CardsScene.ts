import Phaser from 'phaser';

interface CardItem { container: Phaser.GameObjects.Container; back: Phaser.GameObjects.Rectangle; bee: Phaser.GameObjects.Text; front: Phaser.GameObjects.Rectangle; label: Phaser.GameObjects.Text; index: number; }

export class CardsScene extends Phaser.Scene {
  private options: string[];
  private onReveal: (index: number) => void;
  private onAnimationStart: () => void;
  private onCardComplete: () => void;
  private onSequenceComplete: () => void;
  private revealed = new Set<number>();
  private cards: CardItem[] = [];
  private originalPositions: { x: number; y: number }[] = [];
  private busy = false;
  private revealQueue: number[] = [];

  constructor(options: string[], onReveal: (index: number) => void, onAnimationStart: () => void, onCardComplete: () => void, onSequenceComplete: () => void) {
    super({ key: 'CardsScene' });
    this.options = options;
    this.onReveal = onReveal;
    this.onAnimationStart = onAnimationStart;
    this.onCardComplete = onCardComplete;
    this.onSequenceComplete = onSequenceComplete;
  }

  create() {
    const { width, height } = this.scale;
    this.add.rectangle(width / 2, height / 2, width, height, 0x251a36);
    this.add.circle(55, 65, 25, 0xffa33a, 0.9);
    this.add.circle(width - 55, 65, 25, 0xffa33a, 0.9);
    this.add.text(width / 2, 35, 'LA CAVERNA DEL MAGO', { fontFamily: 'Arial', fontSize: '25px', color: '#ffd43b', fontStyle: 'bold' }).setOrigin(0.5);
    const columns = Math.min(5, this.options.length);
    const rows = Math.ceil(this.options.length / columns);
    const cardWidth = Math.min(145, (width - 60) / columns - 12);
    const cardHeight = Math.min(170, (height - 110) / rows - 12);
    const gapX = cardWidth + 12;
    const gapY = cardHeight + 12;
    const startX = (width - (columns * gapX - 12)) / 2 + cardWidth / 2;
    const startY = 100 + cardHeight / 2;
    this.options.forEach((option, index) => {
      const x = startX + (index % columns) * gapX;
      const y = startY + Math.floor(index / columns) * gapY;
      const container = this.add.container(x, y);
      const back = this.add.rectangle(0, 0, cardWidth, cardHeight, 0xf7c948).setStrokeStyle(5, 0x30251b);
      const bee = this.add.text(0, 0, '🐝', { fontSize: '42px' }).setOrigin(0.5);
      const front = this.add.rectangle(0, 0, cardWidth, cardHeight, 0xfff9e9).setStrokeStyle(5, 0x30251b).setVisible(false);
      const label = this.add.text(0, 0, option, { fontFamily: 'Arial', fontSize: '17px', color: '#30251b', fontStyle: 'bold', align: 'center', wordWrap: { width: cardWidth - 18 } }).setOrigin(0.5).setVisible(false);
      container.add([back, bee, front, label]);
      container.setSize(cardWidth, cardHeight);
      this.originalPositions.push({ x, y });
      container.on('pointerdown', () => this.revealCard(index, false));
      this.cards.push({ container, back, bee, front, label, index });
    });

    this.enableManualMode();
  }

  private revealCard(index: number, automatic: boolean) {
    if (this.busy || this.revealed.has(index)) return;
    const card = this.cards.find((item) => item.index === index);
    if (!card) return;
    this.onAnimationStart();
    this.revealed.add(index);
    card.container.disableInteractive();
    this.busy = true;
    this.tweens.add({ targets: card.container, scaleX: 0, duration: 160, ease: 'Quad.easeIn', onComplete: () => {
      card.back.setVisible(false); card.bee.setVisible(false); card.front.setVisible(true); card.label.setVisible(true);
      this.tweens.add({ targets: card.container, scaleX: 1, duration: 160, ease: 'Quad.easeOut', onComplete: () => {
        this.busy = false;
        this.onReveal(card.index);
        if (automatic) {
          if (this.revealQueue.length > 0) this.time.delayedCall(220, () => this.revealNext());
          else this.onSequenceComplete();
        } else {
          this.onCardComplete();
          this.enableManualMode();
        }
      }});
    }});
  }

  revealAll() {
    if (this.busy || this.revealQueue.length > 0) return;
    this.disableAllCards();
    this.revealQueue = this.cards.filter((card) => !this.revealed.has(card.index)).map((card) => card.index);
    if (this.revealQueue.length === 0) { this.onSequenceComplete(); return; }
    this.revealNext();
  }

  private revealNext() {
    if (this.busy) return;
    const nextIndex = this.revealQueue.shift();
    if (nextIndex === undefined) { this.onSequenceComplete(); return; }
    this.revealCard(nextIndex, true);
  }

  shuffleCards() {
    if (this.busy || this.revealed.size > 0) return;

    const positions = [...this.originalPositions];
    Phaser.Utils.Array.Shuffle(positions);

    this.cards.forEach((card, index) => {
      const position = positions[index];
      const boundedX = Phaser.Math.Clamp(position.x, card.container.displayWidth / 2 + 10, this.scale.width - card.container.displayWidth / 2 - 10);
      const boundedY = Phaser.Math.Clamp(position.y, 95 + card.container.displayHeight / 2, this.scale.height - card.container.displayHeight / 2 - 10);
      this.tweens.add({
        targets: card.container,
        x: boundedX,
        y: boundedY,
        angle: Phaser.Math.Between(-5, 5),
        duration: 350,
        ease: 'Back.easeOut',
      });
    });
  }

  resetCards() {
    this.revealQueue = [];
    this.busy = false;
    this.time.removeAllEvents();
    this.tweens.killAll();
    this.revealed.clear();
    this.cards.forEach((card, index) => {
      const position = this.originalPositions[index];
      card.container.setPosition(position.x, position.y).setScale(1).setAngle(0);
      card.back.setVisible(true); card.bee.setVisible(true); card.front.setVisible(false); card.label.setVisible(false);
      card.container.disableInteractive();
    });
  }

  private disableAllCards() { this.cards.forEach((card) => card.container.disableInteractive()); }

  enableManualMode() {
    if (this.busy || this.revealQueue.length > 0) return;
    this.cards.forEach((card) => {
      if (!this.revealed.has(card.index)) card.container.setInteractive();
      else card.container.disableInteractive();
    });
  }

  getRevealedCount() { return this.revealed.size; }
}
