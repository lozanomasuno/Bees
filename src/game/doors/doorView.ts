import Phaser from 'phaser';
import { DOOR_FRAME, DOOR_LEAF, DOOR_PALETTE, DUNGEON_TEXTURES, leafTextureKeys } from './dungeonTextures';

/**
 * Vista de una puerta de la mazmorra: marco de piedra, pasillo interior, hoja de madera, canto,
 * runas brillantes, cartel «PUERTA N», opción oculta y zona de clic.
 *
 * Responsabilidades:
 * - Construir los objetos de la puerta y mantenerlos sincronizados en `update()` a partir de `pose`
 *   (ángulo de giro, hundimiento y temblor) y de `fx` (intensidad de runas y luz interior).
 * - Proyectar la hoja en perspectiva alrededor de la bisagra. Con WebGL usa dos `Mesh2D` que comparten
 *   el mismo arreglo de vértices (madera y runas quedan siempre alineadas); con Canvas recurre a imágenes
 *   escaladas, porque `Mesh2D` no se dibuja en ese renderizador.
 *
 * No decide resultados ni dispara la apertura: eso corresponde a `DoorsScene` (coordinación) y a
 * `playDoorOpening` (coreografía), que solo animan `pose`, `fx` y los objetos públicos de esta clase.
 */

export type DoorState = 'closed' | 'opening' | 'open';

/** Postura física de la hoja. `angle` en grados (0 = cerrada); `sag` y `shake` en píxeles. */
export interface DoorPose {
  angle: number;
  sag: number;
  shake: number;
}

/** Intensidades animables de efectos: runas (0..1.5) y luz del pasillo (0..1). */
export interface DoorFx {
  runes: number;
  interiorLight: number;
}

/** Punto de fuga y distancia focal de la proyección; compartidos por ambas puertas. */
const VANISHING_POINT = { x: 500, y: 300 };
const FOCAL_LENGTH = 950;
/** Resolución de la malla: más columnas reducen la deformación afín de cada triángulo. */
const MESH_COLUMNS = 10;
const MESH_ROWS = 6;
const LEAF_THICKNESS = 9;
const DOOR_CENTER_Y = 330;

const DEPTH = {
  interior: -40,
  interiorGlow: -39,
  option: -38,
  lightSpill: -37,
  frame: -30,
  plaque: -29,
  edge: -21,
  leaf: -20,
  runes: -19,
};

/**
 * `Mesh2D` implementa `setTint` en tiempo de ejecución (Phaser 4.2.1, `Mesh2D.js`), pero sus definiciones
 * de tipos no lo declaran. Este tipo documenta el método que se usa.
 */
type TintableMesh = Phaser.GameObjects.Mesh2D & { setTint(color: number): Phaser.GameObjects.Mesh2D };

export interface DoorViewConfig {
  index: number;
  centerX: number;
  /** Lado de la bisagra: -1 a la izquierda del hueco, 1 a la derecha. */
  hingeSide: -1 | 1;
  option: string;
}

export class DoorView {
  readonly index: number;
  readonly centerX: number;
  readonly openingTop: number;
  readonly openingBottom: number;
  readonly hingeX: number;
  readonly pose: DoorPose = { angle: 0, sag: 0, shake: 0 };
  readonly fx: DoorFx = { runes: 0.35, interiorLight: 0 };
  readonly optionText: Phaser.GameObjects.Text;
  readonly hitZone: Phaser.GameObjects.Zone;
  readonly lightColor: number;
  state: DoorState = 'closed';

  private readonly scene: Phaser.Scene;
  /** Sentido en que se extiende la hoja desde la bisagra cuando está cerrada (+1 hacia la derecha). */
  private readonly direction: number;
  private readonly textures: ReturnType<typeof leafTextureKeys>;
  private readonly vertices: number[];
  private readonly leafMesh: TintableMesh | null = null;
  private readonly runeMesh: TintableMesh | null = null;
  private readonly leafImage: Phaser.GameObjects.Image | null = null;
  private readonly runeImage: Phaser.GameObjects.Image | null = null;
  private readonly edge: Phaser.GameObjects.Graphics;
  private readonly interiorGlow: Phaser.GameObjects.Image;
  private readonly lightSpill: Phaser.GameObjects.Image;
  private showingFront = true;

  constructor(scene: Phaser.Scene, config: DoorViewConfig) {
    this.scene = scene;
    this.index = config.index;
    this.centerX = config.centerX;
    this.direction = -config.hingeSide;
    this.textures = leafTextureKeys(config.index);
    this.lightColor = DOOR_PALETTE[config.index].light;

    const frameTop = DOOR_CENTER_Y - DOOR_FRAME.height / 2;
    this.openingTop = frameTop + DOOR_FRAME.openingY;
    this.openingBottom = this.openingTop + DOOR_FRAME.openingHeight;
    const openingCenterY = (this.openingTop + this.openingBottom) / 2;
    this.hingeX = this.centerX + (config.hingeSide * DOOR_LEAF.width) / 2;

    // Pasillo interior, luz que brota al abrir y opción oculta hasta la revelación.
    scene.add.image(this.centerX, openingCenterY, DUNGEON_TEXTURES.interior).setDepth(DEPTH.interior);
    this.interiorGlow = scene.add.image(this.centerX, openingCenterY - 10, DUNGEON_TEXTURES.softLight)
      .setDepth(DEPTH.interiorGlow)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setTint(this.lightColor)
      .setScale(0.95, 1.35)
      .setAlpha(0);
    this.optionText = scene.add.text(this.centerX, openingCenterY - 6, config.option, {
      fontFamily: 'Arial Black, Arial',
      fontSize: config.option.length > 18 ? '17px' : '21px',
      color: '#fff6d8',
      align: 'center',
      stroke: '#1b0f2a',
      strokeThickness: 6,
      wordWrap: { width: 148 },
      shadow: { offsetX: 0, offsetY: 0, color: '#ffcf6b', blur: 14, fill: true, stroke: true },
    }).setOrigin(0.5).setDepth(DEPTH.option).setVisible(false);
    this.lightSpill = scene.add.image(this.centerX, this.openingBottom + 2, DUNGEON_TEXTURES.lightSpill)
      .setOrigin(0.5, 0)
      .setDepth(DEPTH.lightSpill)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setTint(this.lightColor)
      .setAlpha(0);

    // Marco de piedra y cartel con el nombre genérico de la puerta.
    scene.add.image(this.centerX, DOOR_CENTER_Y, DUNGEON_TEXTURES.frame).setDepth(DEPTH.frame);
    scene.add.image(this.centerX, frameTop - 14, DUNGEON_TEXTURES.plaque)
      .setDepth(DEPTH.plaque)
      .setAngle(config.index === 0 ? -2.5 : 2);
    scene.add.text(this.centerX, frameTop - 14, `PUERTA ${config.index + 1}`, {
      fontFamily: 'Arial Black, Arial',
      fontSize: '16px',
      color: '#ffd98a',
      stroke: '#1e120a',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(DEPTH.plaque).setAngle(config.index === 0 ? -2.5 : 2);

    this.edge = scene.add.graphics().setDepth(DEPTH.edge);

    // Malla compartida: índices ya emparejados en quads (TL, BL, TR) + (BL, TR, BR) para el lote WebGL.
    this.vertices = new Array((MESH_COLUMNS + 1) * (MESH_ROWS + 1) * 4).fill(0);
    if (scene.renderer.type === Phaser.WEBGL) {
      const indices: number[] = [];
      for (let row = 0; row < MESH_ROWS; row += 1) {
        for (let column = 0; column < MESH_COLUMNS; column += 1) {
          const topLeft = row * (MESH_COLUMNS + 1) + column;
          const bottomLeft = topLeft + MESH_COLUMNS + 1;
          indices.push(topLeft, bottomLeft, topLeft + 1, 0, bottomLeft, topLeft + 1, bottomLeft + 1, 0);
        }
      }
      this.leafMesh = this.createMesh(this.textures.front, indices, DEPTH.leaf);
      this.runeMesh = this.createMesh(this.textures.runes, indices, DEPTH.runes)
        .setBlendMode(Phaser.BlendModes.ADD);
    } else {
      // Origen en la bisagra (u = 0); un `scaleX` negativo extiende y refleja la hoja hacia la izquierda.
      this.leafImage = scene.add.image(this.hingeX, openingCenterY, this.textures.front)
        .setOrigin(0, 0.5)
        .setDepth(DEPTH.leaf);
      this.runeImage = scene.add.image(this.hingeX, openingCenterY, this.textures.runes)
        .setOrigin(0, 0.5)
        .setDepth(DEPTH.runes)
        .setBlendMode(Phaser.BlendModes.ADD);
    }

    // La zona cubre marco y hueco; no depende de la hoja, que se sale del marco al abrir.
    this.hitZone = scene.add.zone(this.centerX, openingCenterY, DOOR_FRAME.openingWidth + 36,
      DOOR_FRAME.openingHeight + 40)
      .setDepth(100)
      .setInteractive({ useHandCursor: true });
  }

  private createMesh(texture: string, indices: number[], depth: number) {
    // `flipV`: los vértices usan v = 0 arriba, mientras que Phaser 4 espera coordenadas GL (de abajo arriba).
    const mesh = this.scene.add.mesh2d(0, 0, texture, this.vertices, indices, true)
      .setDepth(depth) as TintableMesh;
    mesh.indicesOrdered = indices;
    mesh.setUseOrderedIndices(true);
    return mesh;
  }

  /** Inclina ligeramente la hoja al pasar el puntero, como si el pestillo cediera. */
  setHover(hovering: boolean) {
    if (this.state !== 'closed') return;
    this.scene.tweens.killTweensOf([this.pose, this.fx]);
    this.scene.tweens.add({ targets: this.pose, angle: hovering ? 4 : 0, duration: 280, ease: 'Sine.easeOut' });
    this.scene.tweens.add({ targets: this.fx, runes: hovering ? 0.85 : 0.35, duration: 280 });
  }

  disableInput() {
    this.hitZone.disableInteractive();
  }

  /**
   * Recalcula la geometría de la hoja y la iluminación. `light` es el factor de las antorchas (≈0.85..1.1)
   * que entrega `DungeonAmbience.update`.
   */
  update(time: number, light: number) {
    const angle = Phaser.Math.DegToRad(this.pose.angle);
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const { width, height } = DOOR_LEAF;
    const top = (this.openingTop + this.openingBottom) / 2 - height / 2;
    const hingeX = this.hingeX + this.pose.shake;

    for (let column = 0; column <= MESH_COLUMNS; column += 1) {
      const distance = (column / MESH_COLUMNS) * width;
      const worldX = hingeX + this.direction * distance * cos;
      const depthZ = distance * sin;
      const sag = this.pose.sag * (distance / width);
      for (let row = 0; row <= MESH_ROWS; row += 1) {
        const [projectedX, projectedY] = project(worldX, top + (row / MESH_ROWS) * height + sag, depthZ);
        const offset = (row * (MESH_COLUMNS + 1) + column) * 4;
        this.vertices[offset] = projectedX;
        this.vertices[offset + 1] = projectedY;
        this.vertices[offset + 2] = column / MESH_COLUMNS;
        this.vertices[offset + 3] = row / MESH_ROWS;
      }
    }

    // Cara visible: si el canto libre cruza al otro lado de la bisagra en pantalla, se ve el reverso.
    const freeEdge = project(hingeX + this.direction * width * cos, top + height / 2, width * sin);
    const hinge = project(hingeX, top + height / 2, 0);
    const projectedWidth = (freeEdge[0] - hinge[0]) * this.direction;
    const showFront = projectedWidth >= 0;
    if (showFront !== this.showingFront) {
      this.showingFront = showFront;
      const key = showFront ? this.textures.front : this.textures.back;
      this.leafMesh?.setTexture(key);
      this.leafImage?.setTexture(key);
    }

    // Sombreado según la orientación de la hoja respecto a la luz frontal de las antorchas.
    const facing = showFront ? 0.62 + 0.38 * Math.abs(cos) : 0.5 + 0.18 * sin;
    const brightness = Phaser.Math.Clamp(facing * light, 0, 1);
    const tint = Phaser.Display.Color.GetColor(brightness * 255, brightness * 238, brightness * 225);
    const pulse = 0.78 + 0.22 * Math.sin(time * 0.0032 + this.index * 2.1);
    const runeAlpha = showFront ? Phaser.Math.Clamp(this.fx.runes * pulse, 0, 1) : 0;

    if (this.leafMesh && this.runeMesh) {
      this.leafMesh.setTint(tint);
      this.runeMesh.setAlpha(runeAlpha);
      this.drawEdge(hingeX, top, cos, sin, showFront);
    } else if (this.leafImage && this.runeImage) {
      // Alternativa Canvas: escalado horizontal equivalente a la anchura proyectada.
      const span = (freeEdge[0] - hinge[0]) / width;
      const scaleX = Math.sign(span || 1) * Math.max(0.04, Math.abs(span));
      const scaleY = (freeEdge[2] + 1) / 2;
      this.leafImage.setPosition(hinge[0], hinge[1] + this.pose.sag / 2).setScale(scaleX, scaleY).setTint(tint);
      this.runeImage.setPosition(hinge[0], hinge[1] + this.pose.sag / 2).setScale(scaleX, scaleY);
      this.runeImage.setAlpha(runeAlpha);
    }

    const interior = this.fx.interiorLight;
    this.interiorGlow.setAlpha(interior * (0.6 + 0.12 * pulse) * light);
    this.lightSpill.setAlpha(interior * 0.42 * light);
  }

  /** Canto de la hoja en el lado libre: une la cara frontal con la trasera desplazada por el grosor. */
  private drawEdge(hingeX: number, top: number, cos: number, sin: number, showFront: boolean) {
    this.edge.clear();
    if (this.pose.angle < 1) return;
    const { width, height } = DOOR_LEAF;
    const frontX = hingeX + this.direction * width * cos;
    const frontZ = width * sin;
    // Normal de la cara frontal en el plano XZ; el reverso queda a `LEAF_THICKNESS` en sentido contrario.
    const normalX = -this.direction * sin;
    const normalZ = cos;
    const backX = frontX - normalX * LEAF_THICKNESS;
    const backZ = frontZ - normalZ * LEAF_THICKNESS;
    const sag = this.pose.sag;
    const corners = [
      project(frontX, top + sag, frontZ),
      project(frontX, top + height + sag, frontZ),
      project(backX, top + height + sag, backZ),
      project(backX, top + sag, backZ),
    ];
    this.edge.fillStyle(showFront ? 0x2e1c10 : 0x3d2716, 1);
    this.edge.beginPath();
    this.edge.moveTo(corners[0][0], corners[0][1]);
    corners.slice(1).forEach(([px, py]) => this.edge.lineTo(px, py));
    this.edge.closePath();
    this.edge.fillPath();
    this.edge.lineStyle(1.2, 0x7a5232, 0.8);
    this.edge.beginPath();
    this.edge.moveTo(corners[0][0], corners[0][1]);
    this.edge.lineTo(corners[1][0], corners[1][1]);
    this.edge.strokePath();
  }
}

/** Proyección en perspectiva hacia el punto de fuga. Devuelve [x, y, factor de escala]. */
function project(x: number, y: number, z: number): [number, number, number] {
  const scale = FOCAL_LENGTH / (FOCAL_LENGTH - z);
  return [
    VANISHING_POINT.x + (x - VANISHING_POINT.x) * scale,
    VANISHING_POINT.y + (y - VANISHING_POINT.y) * scale,
    scale,
  ];
}
