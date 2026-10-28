import Phaser from 'phaser';

interface CardItem { container: Phaser.GameObjects.Container; shadow: Phaser.GameObjects.Graphics; back: Phaser.GameObjects.Graphics; bee: Phaser.GameObjects.Text; front: Phaser.GameObjects.Graphics; label: Phaser.GameObjects.Text; ornament: Phaser.GameObjects.Graphics; index: number; }

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
  private lastLayoutSignature = '';

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

    // Telón y profundidad del entorno.
    this.add.rectangle(54, height / 2, 108, height, 0x563b70).setStrokeStyle(4, 0x30251b);
    this.add.rectangle(width - 54, height / 2, 108, height, 0x563b70).setStrokeStyle(4, 0x30251b);
    for (let x = 16; x < 110; x += 28) {
      this.add.ellipse(x, height / 2, 58, height, 0x563b70, 0.72).setStrokeStyle(2, 0x30251b, 0.55);
      this.add.ellipse(width - x, height / 2, 58, height, 0x563b70, 0.72).setStrokeStyle(2, 0x30251b, 0.55);
    }

    // Mesa trapezoidal cubierta por una lona violeta, con textura procedural ligera.
    this.add.graphics().fillStyle(0x18111f, 0.45).fillRoundedRect(112, 92, width - 224, height - 142, 28);
    const table = this.add.graphics();
    table.fillStyle(0x30251b, 1).fillPoints([new Phaser.Math.Vector2(105, 105), new Phaser.Math.Vector2(width - 105, 105), new Phaser.Math.Vector2(width - 42, height - 38), new Phaser.Math.Vector2(42, height - 38)], true);
    table.fillStyle(0x563b70, 1).fillPoints([new Phaser.Math.Vector2(112, 112), new Phaser.Math.Vector2(width - 112, 112), new Phaser.Math.Vector2(width - 58, height - 58), new Phaser.Math.Vector2(58, height - 58)], true);
    table.fillStyle(0x68478b, 0.22).fillPoints([new Phaser.Math.Vector2(112, 112), new Phaser.Math.Vector2(width - 112, 112), new Phaser.Math.Vector2(width - 86, 205), new Phaser.Math.Vector2(86, 205)], true);
    table.lineStyle(3, 0x30251b, 0.7).beginPath().moveTo(58, height - 58).lineTo(width - 58, height - 58).strokePath();

    const fibers = this.add.graphics().setDepth(-1);
    fibers.lineStyle(1, 0xd6a8ff, 0.13);
    for (let y = 126; y < height - 64; y += 18) {
      fibers.beginPath().moveTo(90 + (y % 36), y).lineTo(width - 90, y + (y % 12));
      fibers.strokePath();
    }

    this.add.triangle(width / 2, 105, 0, 24, 42, -8, 84, 24, 0xff9f43).setStrokeStyle(3, 0x30251b);
    this.add.text(width / 2, 44, 'LA CAVERNA DEL MAGO', { fontFamily: 'Arial', fontSize: '25px', color: '#fff4b0', fontStyle: 'bold', stroke: '#30251b', strokeThickness: 5 }).setOrigin(0.5);

    const stars = [[132, 110], [1068, 110], [116, 330], [1084, 330], [110, 530], [1090, 530]];
    stars.forEach(([x, y], index) => {
      this.add.star(x, y, 4, index % 2 === 0 ? 7 : 5, 15, index % 2 === 0 ? 0xffd43b : 0x73c66a).setStrokeStyle(2, 0x30251b).setAlpha(0.75);
    });
    this.add.text(112, 62, '✦', { fontSize: '24px', color: '#ffd43b' });
    this.add.text(width - 112, 62, '✦', { fontSize: '24px', color: '#ffd43b' });
    const columns = Math.min(5, this.options.length);
    const rows = Math.ceil(this.options.length / columns);
    const cardWidth = Math.min(145, (width - 180) / columns - 18);
    const cardHeight = Math.min(170, (height - 180) / rows - 20);
    const gapX = cardWidth + 18;
    const gapY = cardHeight + 20;
    const startX = (width - (columns * gapX - 18)) / 2 + cardWidth / 2;
    const startY = rows === 1 ? 390 : 260;
    this.options.forEach((option, index) => {
      const x = startX + (index % columns) * gapX;
      const y = startY + Math.floor(index / columns) * gapY;
      const container = this.add.container(x, y);
      const shadow = this.add.graphics();
      shadow.fillStyle(0x18111f, 0.58).fillRoundedRect(-cardWidth / 2 + 7, -cardHeight / 2 + 8, cardWidth, cardHeight, 16);
      const back = this.add.graphics();
      back.fillStyle(0xf7c948).fillRoundedRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, 14);
      back.lineStyle(5, 0x30251b).strokeRoundedRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, 14);
      const ornament = this.add.graphics();
      ornament.lineStyle(2, 0xff9f43, 0.9);
      ornament.strokeCircle(0, -cardHeight / 2 + 17, 7);
      ornament.strokeCircle(0, cardHeight / 2 - 17, 7);
      const bee = this.add.text(0, 0, '🐝', { fontFamily: 'Arial', fontSize: Math.min(42, cardWidth * 0.34).toString() + 'px', stroke: '#30251b', strokeThickness: 2 }).setOrigin(0.5);
      const front = this.add.graphics().setVisible(false);
      front.fillStyle(0xfff9e9).fillRoundedRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, 14);
      front.lineStyle(5, 0x30251b).strokeRoundedRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, 14);
      const labelSize = Math.max(13, Math.min(17, 900 / Math.max(option.length * columns, 36)));
      const label = this.add.text(0, 4, option, { fontFamily: 'Arial', fontSize: `${labelSize}px`, color: '#30251b', fontStyle: 'bold', align: 'center', wordWrap: { width: cardWidth - 24 }, padding: { y: 2 } }).setOrigin(0.5).setVisible(false).setAlpha(0);
      container.add([shadow, back, ornament, bee, front, label]);
      container.setSize(cardWidth, cardHeight);
      this.originalPositions.push({ x, y });
      container.on('pointerdown', () => this.revealCard(index, false));
      container.on('pointerover', () => {
        if (!this.busy && !this.revealed.has(index)) {
          this.tweens.killTweensOf(container);
          container.setDepth(5);
          this.tweens.add({ targets: container, scaleX: 1.025, scaleY: 1.025, duration: 130, ease: 'Quad.easeOut' });
        }
      });
      container.on('pointerout', () => {
        if (!this.revealed.has(index)) {
          this.tweens.killTweensOf(container);
          container.setDepth(0);
          this.tweens.add({ targets: container, scaleX: 1, scaleY: 1, duration: 130, ease: 'Quad.easeOut' });
        }
      });
      this.cards.push({ container, shadow, back, bee, front, label, ornament, index });
    });

    this.setRandomLayout();
    this.cards.forEach((card, index) => {
      card.container.setAlpha(0).setScale(0.85);
      this.tweens.add({ targets: card.container, alpha: 1, scale: 1, duration: 280, delay: index * 55, ease: 'Back.easeOut' });
    });
    this.enableManualMode();
  }

  private setRandomLayout() {
    const positions = [...this.originalPositions];
    const previous = this.lastLayoutSignature;
    let signature = previous;
    let attempts = 0;
    while (signature === previous && attempts < 12) {
      Phaser.Utils.Array.Shuffle(positions);
      signature = positions.map((position) => this.originalPositions.indexOf(position)).join(',');
      attempts++;
    }
    if (signature === previous && positions.length > 1) positions.push(positions.shift() as { x: number; y: number });
    signature = positions.map((position) => this.originalPositions.indexOf(position)).join(',');
    this.lastLayoutSignature = signature;
    this.cards.forEach((card, index) => {
      card.container.setPosition(positions[index].x, positions[index].y);
    });
  }

  private revealCard(index: number, automatic: boolean) {
    if (this.busy || this.revealed.has(index)) return;
    const card = this.cards.find((item) => item.index === index);
    if (!card) return;
    this.tweens.killTweensOf(card.container);
    card.container.setDepth(0).setScale(1);
    this.onAnimationStart();
    this.revealed.add(index);
    card.container.disableInteractive();
    this.busy = true;
    this.tweens.add({ targets: card.container, scaleX: 0, duration: 160, ease: 'Quad.easeIn', onComplete: () => {
      card.back.setVisible(false); card.bee.setVisible(false); card.ornament.setVisible(false); card.front.setVisible(true); card.label.setVisible(true);
      this.tweens.add({ targets: card.label, alpha: 1, scale: { from: 0.82, to: 1 }, duration: 180, ease: 'Back.easeOut' });
      const sparkle = this.add.star(card.container.x, card.container.y, 4, 5, 24, 0xffd43b).setStrokeStyle(2, 0xffffff, 0.8);
      sparkle.setAlpha(0.9);
      this.tweens.add({ targets: sparkle, scale: 1.8, alpha: 0, y: card.container.y - 18, duration: 420, onComplete: () => sparkle.destroy() });
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

    const previous = positions.map((position) => this.originalPositions.indexOf(position)).join(',');
    if (positions.length > 1 && previous === this.lastLayoutSignature) {
      positions.push(positions.shift() as { x: number; y: number });
    }
    this.lastLayoutSignature = positions.map((position) => this.originalPositions.indexOf(position)).join(',');

    this.cards.forEach((card, index) => {
      this.tweens.killTweensOf(card.container);
      card.container.setDepth(0).setScale(1);
      const position = positions[index];
      const boundedX = Phaser.Math.Clamp(position.x, 130 + card.container.displayWidth / 2, this.scale.width - 130 - card.container.displayWidth / 2);
      const boundedY = Phaser.Math.Clamp(position.y, 115 + card.container.displayHeight / 2, this.scale.height - 48 - card.container.displayHeight / 2);
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
      card.container.setPosition(this.originalPositions[index].x, this.originalPositions[index].y).setDepth(0).setScale(1).setAngle(0).setAlpha(1);
      card.back.setVisible(true); card.bee.setVisible(true); card.ornament.setVisible(true); card.front.setVisible(false); card.label.setVisible(false).setAlpha(0);
      card.container.disableInteractive();
    });
    this.setRandomLayout();
    this.enableManualMode();
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
