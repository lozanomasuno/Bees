import Phaser from 'phaser';
import { DungeonAmbience } from '../doors/dungeonAmbience';
import { playDoorOpening } from '../doors/doorOpening';
import { DoorView } from '../doors/doorView';
import { ensureDungeonTextures } from '../doors/dungeonTextures';

/**
 * Escena «Las puertas mágicas»: coordina la mazmorra, las dos puertas y la notificación del resultado.
 *
 * Consumidores: `DoorsGame` (partida de dos opciones) y `BeehivesGame` (desempate por pares).
 *
 * Contrato:
 * - `new DoorsScene(labels, winnerIndex, onComplete, settings?)`. `winnerIndex` se conserva por compatibilidad
 *   y se ignora: el resultado lo decide la persona al abrir una puerta.
 * - La primera puerta abierta fija el resultado. `onComplete(indice)` se invoca una única vez con esa puerta;
 *   abrir la otra después solo revela su contenido.
 * - `onComplete` no se invoca mientras quede alguna apertura en curso, de modo que el consumidor puede destruir
 *   la escena al recibirlo sin cortar animaciones.
 * - `settings.lockAfterResult` bloquea las puertas cerradas en cuanto se notifica el resultado (rondas
 *   intermedias del desempate, cuya escena se destruye a continuación).
 * - `settings.onOpeningsChange(activo)` informa cuándo empiezan y terminan las aperturas, para que la interfaz
 *   impida reiniciar a mitad de una animación.
 *
 * La construcción visual vive en `src/game/doors/`: texturas (`dungeonTextures`), ambientación
 * (`dungeonAmbience`), puerta (`doorView`) y coreografía de apertura (`doorOpening`).
 */

export interface DoorsSceneSettings {
  lockAfterResult?: boolean;
  onOpeningsChange?: (active: boolean) => void;
}

const DOOR_X = [300, 700];
/** Pausa tras abrirse la puerta del resultado para que se lea la opción antes de notificarla. */
const RESULT_HOLD_MS = 650;

export class DoorsScene extends Phaser.Scene {
  private options: string[];
  private onComplete: (winnerIndex: number) => void;
  private settings: DoorsSceneSettings;
  private doors: DoorView[] = [];
  private ambience: DungeonAmbience | null = null;
  private resultIndex: number | null = null;
  private resultHoldElapsed = false;
  private resultNotified = false;
  private openingsActive = false;

  constructor(
    options: string[],
    _winnerIndex: number,
    onComplete: (winnerIndex: number) => void,
    settings: DoorsSceneSettings = {},
  ) {
    super({ key: 'DoorsScene' });
    this.options = options;
    void _winnerIndex;
    this.onComplete = onComplete;
    this.settings = settings;
  }

  create() {
    this.resultIndex = null;
    this.resultHoldElapsed = false;
    this.resultNotified = false;
    this.openingsActive = false;

    ensureDungeonTextures(this);
    this.ambience = new DungeonAmbience(this);
    this.doors = this.options.slice(0, 2).map((option, index) => {
      const door = new DoorView(this, { index, centerX: DOOR_X[index], hingeSide: index === 0 ? -1 : 1, option });
      door.hitZone.on('pointerover', () => door.setHover(true));
      door.hitZone.on('pointerout', () => door.setHover(false));
      door.hitZone.on('pointerdown', () => this.openDoor(index));
      return door;
    });

    this.add.text(500, 42, 'LAS PUERTAS MÁGICAS', {
      fontFamily: 'Arial Black, Arial',
      fontSize: '30px',
      color: '#ffd166',
      fontStyle: 'bold',
      stroke: '#1b0f2a',
      strokeThickness: 6,
      shadow: { offsetX: 0, offsetY: 0, color: '#ff9b2f', blur: 12, fill: true },
    }).setOrigin(0.5).setDepth(30);

    this.cameras.main.fadeIn(450, 5, 2, 10);
  }

  update(time: number) {
    const light = this.ambience?.update(time) ?? 1;
    this.doors.forEach((door) => door.update(time, light));
  }

  play(chosenIndex = 0) {
    this.openDoor(chosenIndex);
  }

  private openDoor(index: number) {
    const door = this.doors[index];
    if (!door || door.state !== 'closed' || this.isLocked()) return;

    // La primera puerta que se abre fija el resultado; las siguientes no lo recalculan.
    if (this.resultIndex === null) this.resultIndex = index;

    door.state = 'opening';
    door.disableInput();
    this.refreshOpenings();

    // La apertura incluye el cartel inferior: la puerta no pasa a «open» hasta que termina de mostrarse.
    playDoorOpening(this, door, {
      onComplete: () => this.showDoorResult(index, () => {
        door.state = 'open';
        this.refreshOpenings();
        if (index === this.resultIndex) {
          this.time.delayedCall(RESULT_HOLD_MS, () => {
            this.resultHoldElapsed = true;
            this.notifyResultWhenIdle();
          });
        } else {
          this.notifyResultWhenIdle();
        }
      }),
    });
  }

  private isLocked() {
    return this.resultNotified && Boolean(this.settings.lockAfterResult);
  }

  /** Comunica el cambio entre «hay aperturas en curso» y «no hay ninguna». */
  private refreshOpenings() {
    const active = this.doors.some((door) => door.state === 'opening');
    if (active === this.openingsActive) return;
    this.openingsActive = active;
    this.settings.onOpeningsChange?.(active);
  }

  /**
   * Notifica el resultado cuando la puerta elegida ya se mostró y no queda ninguna apertura activa.
   * Se llama al terminar cada apertura y al vencer la pausa de lectura; solo la primera llamada válida notifica.
   */
  private notifyResultWhenIdle() {
    if (this.resultNotified || this.resultIndex === null || !this.resultHoldElapsed) return;
    if (this.doors.some((door) => door.state === 'opening')) return;
    this.resultNotified = true;
    if (this.settings.lockAfterResult) this.doors.forEach((door) => door.disableInput());
    this.onComplete(this.resultIndex);
  }

  /** Cartel bajo cada puerta abierta; el de la puerta que fijó el resultado se destaca en dorado. */
  private showDoorResult(index: number, onShown: () => void) {
    const door = this.doors[index];
    const isResult = index === this.resultIndex;
    const banner = this.add.text(door.centerX, 574, this.options[index], {
      fontFamily: 'Arial Black, Arial',
      fontSize: '19px',
      color: isResult ? '#30251b' : '#f4ecff',
      backgroundColor: isResult ? '#ffd166' : '#3b3150',
      align: 'center',
      padding: { x: 14, y: 7 },
      wordWrap: { width: 230 },
    }).setOrigin(0.5).setDepth(30).setAlpha(0).setScale(0.85);
    this.tweens.add({
      targets: banner,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: 380,
      ease: 'Back.easeOut',
      onComplete: onShown,
    });
  }

  reset() {
    this.time.removeAllEvents();
    this.tweens.killAll();
    this.scene.restart();
  }
}
