import Phaser from 'phaser';

type DoorState = 'closed' | 'opening' | 'open';

interface DoorView {
  container: Phaser.GameObjects.Container;
  leaf: Phaser.GameObjects.Container;
  glow: Phaser.GameObjects.Arc;
  optionText: Phaser.GameObjects.Text;
  dust: Phaser.GameObjects.Arc[];
  state: DoorState;
}

const DOOR_X = [300, 700];

export class DoorsScene extends Phaser.Scene {
  private options: string[];
  private onComplete: (winnerIndex: number) => void;
  private doors: DoorView[] = [];
  private hitZones: Phaser.GameObjects.Zone[] = [];

  constructor(options: string[], _winnerIndex: number, onComplete: (winnerIndex: number) => void) {
    super({ key: 'DoorsScene' });
    this.options = options;
    void _winnerIndex;
    this.onComplete = onComplete;
  }

  create() {
    this.doors = [];
    this.hitZones = [];
    this.drawCave();
    this.options.slice(0, 2).forEach((option, index) => this.drawDoor(index, option));

    this.doors.forEach((door, index) => {
      door.container.setAlpha(0).setY(355).setScale(0.92);
      this.tweens.add({
        targets: door.container,
        alpha: 1,
        y: 330,
        scaleX: 1,
        scaleY: 1,
        delay: index * 180,
        duration: 520,
        ease: 'Back.easeOut',
      });
    });
  }

  private drawCave() {
    this.add.rectangle(500, 310, 1000, 620, 0x172a46);

    const distant = this.add.graphics().setDepth(-35);
    distant.fillStyle(0x34316b).fillRoundedRect(0, 0, 1000, 620, 22);
    distant.fillStyle(0x172a46, 0.9).fillEllipse(500, 82, 820, 170);
    distant.fillStyle(0x6554a4, 0.55).fillEllipse(500, 610, 980, 150);

    const vaults = this.add.graphics().setDepth(-30);
    vaults.lineStyle(18, 0x30251b, 0.65);
    vaults.beginPath();
    this.drawQuadratic(vaults, 0, 155, 500, -60, 1000, 155);
    vaults.strokePath();
    vaults.lineStyle(7, 0x665c62).beginPath();
    this.drawQuadratic(vaults, 0, 150, 500, -65, 1000, 150);
    vaults.strokePath();

    const masonry = this.add.graphics().setDepth(-24);
    masonry.fillStyle(0x665c62, 0.95);
    for (let row = 0; row < 7; row += 1) {
      const y = 118 + row * 68;
      for (let column = -1; column < 8; column += 1) {
        const offset = row % 2 ? 64 : 0;
        const x = column * 138 + offset;
        const width = 126 + (column + row) % 3 * 5;
        masonry.fillStyle((column + row) % 3 ? 0x665c62 : 0x766b70, 0.95);
        masonry.fillRoundedRect(x, y, width, 56, 12);
        masonry.lineStyle(3, 0x30251b, 0.9).strokeRoundedRect(x, y, width, 56, 12);
      }
    }

    const cracks = this.add.graphics().setDepth(-22);
    cracks.lineStyle(3, 0x30251b, 0.8);
    [[105, 180], [780, 145], [910, 390], [210, 430], [490, 110]].forEach(([x, y], index) => {
      cracks.beginPath().moveTo(x, y);
      cracks.lineTo(x + 18 + index * 3, y + 14).lineTo(x + 7, y + 31).lineTo(x + 27, y + 52).strokePath();
    });

    const foreground = this.add.graphics().setDepth(-12);
    foreground.fillStyle(0x30251b, 0.72).fillEllipse(500, 637, 980, 140);
    foreground.fillStyle(0x506b4d, 0.82).fillEllipse(500, 610, 980, 68);
    foreground.lineStyle(5, 0x30251b).beginPath();
    this.drawQuadratic(foreground, 20, 570, 500, 530, 980, 570);
    foreground.strokePath();

    this.drawWallDetails();
    this.drawTorches();
    this.drawNarrativeDetails();
    this.drawAmbientDust();

    this.add.text(500, 42, 'LAS PUERTAS MÁGICAS', {
      fontFamily: 'Arial Black, Arial', fontSize: '30px', color: '#ffd166', fontStyle: 'bold', stroke: '#30251b', strokeThickness: 5,
    }).setOrigin(0.5).setDepth(30);
  }

  private drawQuadratic(graphics: Phaser.GameObjects.Graphics, startX: number, startY: number, controlX: number, controlY: number, endX: number, endY: number) {
    graphics.moveTo(startX, startY);
    for (let step = 1; step <= 24; step += 1) {
      const t = step / 24;
      const inverse = 1 - t;
      const x = inverse * inverse * startX + 2 * inverse * t * controlX + t * t * endX;
      const y = inverse * inverse * startY + 2 * inverse * t * controlY + t * t * endY;
      graphics.lineTo(x, y);
    }
  }

  private drawWallDetails() {
    const details = this.add.graphics().setDepth(-18);
    details.lineStyle(4, 0xd8b7ff, 0.34);
    [[500, 145], [155, 280], [845, 280]].forEach(([x, y], index) => {
      details.strokeCircle(x, y, 22 + index * 4);
      details.beginPath().moveTo(x - 12, y).lineTo(x + 12, y).moveTo(x, y - 12).lineTo(x, y + 12).strokePath();
      details.strokeCircle(x, y, 4);
    });

    [95, 905].forEach((x) => {
      details.lineStyle(5, 0x506b4d, 0.8).beginPath().moveTo(x, 550).lineTo(x + (x < 500 ? 24 : -24), 490).lineTo(x + (x < 500 ? 8 : -8), 430).strokePath();
      for (let index = 0; index < 3; index += 1) {
        details.fillStyle(0x506b4d).fillEllipse(x + (x < 500 ? 18 : -18) + index * 8, 455 + index * 18, 30, 13);
        details.lineStyle(2, 0x30251b).strokeEllipse(x + (x < 500 ? 18 : -18) + index * 8, 455 + index * 18, 30, 13);
      }
    });

    details.lineStyle(3, 0x506b4d, 0.7);
    for (let x = 30; x < 970; x += 55) {
      if (x > 225 && x < 775) continue;
      details.beginPath().moveTo(x, 575).lineTo(x - 9, 545).moveTo(x, 575).lineTo(x + 8, 550).strokePath();
    }
  }

  private drawTorches() {
    [150, 850].forEach((x) => {
      const bracket = this.add.graphics().setDepth(-8);
      bracket.lineStyle(7, 0x30251b).beginPath().moveTo(x, 270).lineTo(x, 315).strokePath();
      bracket.lineStyle(5, 0x665c62).beginPath().moveTo(x - 18, 315).lineTo(x + 18, 315).strokePath();

      const halo = this.add.circle(x, 250, 95, 0xf5a623, 0.09).setDepth(-7);
      const outer = this.add.ellipse(x, 250, 32, 56, 0xf5a623).setStrokeStyle(3, 0x30251b).setDepth(-6);
      const flame = this.add.ellipse(x, 244, 22, 43, 0xffd166).setDepth(-5);
      const core = this.add.ellipse(x, 247, 12, 27, 0xfff9e9).setDepth(-4);

      this.tweens.add({ targets: [outer, flame], scaleX: { from: 0.88, to: 1.08 }, scaleY: { from: 0.92, to: 1.12 }, duration: Phaser.Math.Between(620, 820), yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this.tweens.add({ targets: flame, x: { from: x - 2, to: x + 2 }, duration: 480, yoyo: true, repeat: -1 });
      this.tweens.add({ targets: core, alpha: { from: 0.72, to: 1 }, duration: 390, yoyo: true, repeat: -1 });
      this.tweens.add({ targets: halo, alpha: { from: 0.06, to: 0.13 }, scale: { from: 0.94, to: 1.06 }, duration: 700, yoyo: true, repeat: -1 });
      this.time.addEvent({
        delay: Phaser.Math.Between(900, 1600),
        loop: true,
        callback: () => {
          const spark = this.add.circle(x + Phaser.Math.Between(-8, 8), 235, 2, 0xffd166).setDepth(-4);
          this.tweens.add({
            targets: spark,
            x: spark.x + Phaser.Math.Between(-18, 18),
            y: spark.y - Phaser.Math.Between(30, 55),
            alpha: 0,
            duration: Phaser.Math.Between(650, 950),
            onComplete: () => spark.destroy(),
          });
        },
      });
    });
  }

  private drawNarrativeDetails() {
    const shelf = this.add.graphics().setDepth(-9);
    shelf.fillStyle(0x70452f).fillRoundedRect(36, 470, 82, 15, 4);
    shelf.fillStyle(0x30251b).fillRoundedRect(42, 485, 68, 8, 3);
    shelf.lineStyle(3, 0x30251b).strokeRoundedRect(36, 470, 82, 15, 4);
    shelf.fillStyle(0x6554a4).fillRoundedRect(48, 445, 15, 25, 3);
    shelf.fillStyle(0x506b4d).fillRoundedRect(68, 450, 18, 20, 3);
    shelf.lineStyle(3, 0xf5a623).strokeRoundedRect(48, 445, 15, 25, 3);

    const egg = this.add.graphics().setDepth(-8);
    egg.fillStyle(0x34316b).fillEllipse(916, 500, 38, 58);
    egg.lineStyle(5, 0x30251b).strokeEllipse(916, 500, 38, 58);
    egg.lineStyle(3, 0xffd166, 0.85).beginPath().moveTo(905, 480).lineTo(918, 490).lineTo(906, 505).moveTo(922, 512).lineTo(913, 525).strokePath();
    this.tweens.add({ targets: egg, alpha: { from: 0.82, to: 1 }, scaleY: { from: 0.97, to: 1.03 }, duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    const cage = this.add.graphics().setDepth(-7);
    cage.lineStyle(5, 0x30251b).strokeRoundedRect(88, 185, 72, 95, 10);
    cage.lineStyle(3, 0x665c62);
    for (let x = 98; x <= 150; x += 13) cage.beginPath().moveTo(x, 190).lineTo(x, 275).strokePath();
    cage.lineStyle(4, 0x30251b).beginPath().moveTo(124, 185).lineTo(124, 160).strokePath();
    cage.fillStyle(0x6554a4).fillCircle(124, 232, 13);
    cage.fillStyle(0xffd166).fillCircle(120, 228, 3).fillCircle(129, 228, 3);

    const brokenRod = this.add.graphics().setDepth(-7);
    brokenRod.lineStyle(8, 0x70452f).beginPath().moveTo(805, 535).lineTo(866, 510).strokePath();
    brokenRod.lineStyle(3, 0xffd166).beginPath().moveTo(805, 535).lineTo(821, 529).strokePath();
    const rodSpark = this.add.star(805, 535, 4, 3, 9, 0xffd166).setDepth(-6);
    this.tweens.add({ targets: rodSpark, alpha: { from: 1, to: 0 }, scale: 1.4, duration: 650, yoyo: true, repeat: -1 });
  }

  private drawAmbientDust() {
    for (let index = 0; index < 16; index += 1) {
      const mote = this.add.circle(Phaser.Math.Between(120, 880), Phaser.Math.Between(150, 540), Phaser.Math.Between(1, 3), index % 3 === 0 ? 0xffd166 : 0xd9d0e8, 0.3).setDepth(-5);
      this.tweens.add({
        targets: mote,
        x: mote.x + Phaser.Math.Between(-32, 32),
        y: mote.y - Phaser.Math.Between(35, 80),
        alpha: { from: 0.12, to: 0.42 },
        duration: Phaser.Math.Between(2600, 4600),
        delay: Phaser.Math.Between(0, 1600),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }
  }

  private drawDoor(index: number, option: string) {
    const x = DOOR_X[index];
    const container = this.add.container(x, 330);

    const glow = this.add.circle(0, 0, 145, 0xffd43b, 0).setStrokeStyle(0, 0xffd43b, 0);
    const frameShadow = this.add.graphics();
    frameShadow.fillStyle(0x30251b, 0.55).fillRoundedRect(-126, -190, 252, 380, 18);
    const frame = this.add.graphics();
    frame.fillStyle(index === 0 ? 0x855532 : 0x6f543f).fillRoundedRect(-118, -182, 236, 364, 16);
    frame.lineStyle(8, 0x30251b).strokeRoundedRect(-118, -182, 236, 364, 16);

    const leaf = this.add.container(0, 0);
    const wood = this.add.graphics();
    wood.fillStyle(index === 0 ? 0x9b7046 : 0x855532).fillRoundedRect(-101, -158, 202, 316, 12);
    wood.lineStyle(6, 0x30251b).strokeRoundedRect(-101, -158, 202, 316, 12);

    wood.lineStyle(3, 0xf0bf69, 0.7);
    for (let y = -125; y <= 125; y += 38) {
      wood.beginPath().moveTo(-78, y);
      for (let step = 1; step <= 8; step += 1) {
        const t = step / 8;
        const curveX = -78 + 146 * t;
        const curveY = y + (y % 2 ? 9 : -7) * Math.sin(t * Math.PI) + 4 * t;
        wood.lineTo(curveX, curveY);
      }
      wood.strokePath();
    }

    [-62, 62].forEach((panelX) => {
      wood.lineStyle(4, 0x30251b).strokeRoundedRect(panelX - 38, -112, 76, 92, 8);
      wood.strokeRoundedRect(panelX - 38, 18, 76, 92, 8);
    });

    [-65, 65].forEach((hingeX) => {
      [-92, 92].forEach((hingeY) => {
        wood.fillStyle(0xf7c948).fillCircle(hingeX, hingeY, 8);
        wood.lineStyle(3, 0x30251b).strokeCircle(hingeX, hingeY, 8);
      });
    });

    const knob = this.add.circle(index === 0 ? 66 : -66, 18, 13, 0xf7c948).setStrokeStyle(5, 0x30251b);
    const optionText = this.add.text(0, 145, option, {
      fontFamily: 'Arial Black, Arial', fontSize: option.length > 18 ? '15px' : '18px', color: '#fff9e9', align: 'center',
      backgroundColor: '#30251b', padding: { x: 10, y: 6 }, wordWrap: { width: 190 },
    }).setOrigin(0.5);
    const doorLabel = this.add.text(0, -12, optionIndexLabel(index), {
      fontFamily: 'Arial Black, Arial', fontSize: '14px', color: '#30251b', backgroundColor: '#ffd43b', padding: { x: 8, y: 4 },
    }).setOrigin(0.5);

    optionText.setVisible(false);
    leaf.add([wood, knob, doorLabel]);
    container.add([glow, frameShadow, frame, leaf, optionText]);
    container.setSize(252, 380);
    const hitZone = this.add.zone(x, 330, 252, 380).setDepth(100);
    hitZone.setInteractive({ useHandCursor: true });
    hitZone.on('pointerover', () => this.onDoorHover(index, true));
    hitZone.on('pointerout', () => this.onDoorHover(index, false));
    hitZone.on('pointerdown', () => this.openDoor(index));
    this.hitZones.push(hitZone);
    this.doors.push({ container, leaf, glow, optionText, dust: [], state: 'closed' });
  }

  private onDoorHover(index: number, hovering: boolean) {
    const door = this.doors[index];
    if (!door || door.state !== 'closed') return;
    this.tweens.killTweensOf(door.container);
    this.tweens.add({
      targets: door.container,
      scaleX: hovering ? 1.035 : 1,
      scaleY: hovering ? 1.035 : 1,
      y: hovering ? 323 : 330,
      duration: 130,
      ease: 'Sine.easeOut',
    });
  }

  play(chosenIndex = 0) {
    this.openDoor(chosenIndex);
  }

  private openDoor(index: number) {
    const door = this.doors[index];
    if (!door || door.state !== 'closed') return;

    door.state = 'opening';
    door.container.setDepth(20);
    this.hitZones[index].disableInteractive();

    this.tweens.add({ targets: door.container, angle: index === 0 ? 3 : -3, duration: 130, yoyo: true, repeat: 1 });
    this.tweens.add({ targets: door.glow, alpha: 0.78, scale: 1.45, duration: 300, ease: 'Sine.easeOut' });
    this.tweens.add({
      targets: door.leaf,
      scaleX: 0.12,
      x: index === 0 ? -92 : 92,
      angle: index === 0 ? -12 : 12,
      duration: 620,
      delay: 180,
      ease: 'Back.easeInOut',
      onComplete: () => {
        door.optionText.setVisible(true);
        door.state = 'open';
        door.container.disableInteractive();
        this.createMagicBurst(door.container.x, door.container.y);
        this.showDoorResult(index);
        this.time.delayedCall(300, () => this.onComplete(index));
      },
    });
  }

  private createMagicBurst(x: number, y: number) {
    for (let index = 0; index < 18; index += 1) {
      const particle = this.add.star(x, y, 4, 3, index % 2 ? 10 : 15, index % 3 ? 0xffd43b : 0xfff9e9).setDepth(25);
      const angle = (Math.PI * 2 * index) / 18;
      const distance = Phaser.Math.Between(55, 150);
      this.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance,
        alpha: 0,
        scale: 0.35,
        angle: Phaser.Math.Between(-180, 180),
        duration: 680,
        ease: 'Cubic.easeOut',
        onComplete: () => particle.destroy(),
      });
    }
  }

  private showDoorResult(index: number) {
    const result = this.add.text(500, 555, '🚪  ' + this.options[index], {
      fontFamily: 'Arial Black, Arial', fontSize: '23px', color: '#30251b', backgroundColor: '#fff9e9', padding: { x: 16, y: 8 },
    }).setOrigin(0.5).setDepth(30).setAlpha(0).setScale(0.85);
    this.tweens.add({ targets: result, alpha: 1, scaleX: 1, scaleY: 1, duration: 380, ease: 'Back.easeOut' });
  }

  reset() {
    this.time.removeAllEvents();
    this.tweens.killAll();
    this.scene.restart();
  }
}

function optionIndexLabel(index: number) { return index === 0 ? 'PUERTA 1' : 'PUERTA 2'; }
