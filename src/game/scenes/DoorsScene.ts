import Phaser from 'phaser';

export class DoorsScene extends Phaser.Scene {
  private options: string[];
  private winnerIndex: number;
  private onComplete: (winnerIndex: number) => void;
  private running = false;
  private doors: Phaser.GameObjects.Container[] = [];

  constructor(options: string[], winnerIndex: number, onComplete: (winnerIndex: number) => void) {
    super({ key: 'DoorsScene' });
    this.options = options;
    this.winnerIndex = winnerIndex;
    this.onComplete = onComplete;
  }

  create() {
    this.add.rectangle(500, 310, 1000, 620, 0x251a36);
    this.add.text(500, 45, 'ELIGE UNA PUERTA', { fontFamily: 'Arial', fontSize: '30px', color: '#ffd43b', fontStyle: 'bold' }).setOrigin(0.5);
    this.options.forEach((_, index) => this.drawDoor(index));
  }

  private drawDoor(index: number) {
    const x = index === 0 ? 300 : 700;
    const door = this.add.container(x, 330);
    const body = this.add.rectangle(0, 0, 250, 360, index === 0 ? 0x8d5f3b : 0x6f8f4c).setStrokeStyle(8, 0x30251b);
    const arch = this.add.circle(0, -180, 125, index === 0 ? 0x8d5f3b : 0x6f8f4c).setStrokeStyle(8, 0x30251b);
    const knob = this.add.circle(75, 20, 12, 0xffd43b).setStrokeStyle(4, 0x30251b);
    const label = this.add.text(0, 15, optionIndexLabel(index), { fontFamily: 'Arial', fontSize: '18px', color: '#fff', fontStyle: 'bold', backgroundColor: '#30251b', padding: { x: 10, y: 6 } }).setOrigin(0.5);
    door.add([arch, body, knob, label]);
    door.setSize(250, 360).setInteractive();
    door.on('pointerdown', () => this.play(index));
    this.doors.push(door);
  }

  play(chosenIndex = this.winnerIndex) {
    if (this.running) return;
    this.running = true;
    const winnerDoor = this.doors[this.winnerIndex];
    this.doors.forEach((door, index) => {
      door.disableInteractive();
      this.tweens.add({ targets: door, angle: index === chosenIndex ? (index === 0 ? 4 : -4) : 0, duration: 180, yoyo: true, repeat: 2 });
    });
    this.time.delayedCall(650, () => {
      this.tweens.add({ targets: winnerDoor, scaleX: 0.12, duration: 500, ease: 'Back.easeIn', onComplete: () => {
        winnerDoor.setVisible(false);
        this.add.text(winnerDoor.x, 540, '🐝 ¡OPCIÓN ELEGIDA!', { fontFamily: 'Arial', fontSize: '22px', color: '#ffd43b', fontStyle: 'bold' }).setOrigin(0.5);
        this.add.text(winnerDoor.x, 575, this.options[this.winnerIndex], { fontFamily: 'Arial', fontSize: '24px', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5);
        this.onComplete(this.winnerIndex);
      }});
    });
  }

  reset() {
    if (!this.running) return;
    this.time.removeAllEvents();
    this.tweens.killAll();
    this.running = false;
    this.doors.forEach((door) => {
      door.setVisible(true).setScale(1).setAngle(0).setInteractive();
    });
  }
}

function optionIndexLabel(index: number) { return index === 0 ? 'PUERTA A' : 'PUERTA B'; }
