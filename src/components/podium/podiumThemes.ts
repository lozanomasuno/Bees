/**
 * Datos de presentación del podio mágico, separados de los componentes que los dibujan.
 *
 * - `MagicMaterial`: identidad visual de un panel. Cada material tiene marco, medallón y decoraciones
 *   propios en `MagicOptionDecorations.tsx` y su sección de estilos `.magic-card--<material>` en
 *   `src/index.css`. Para añadir uno nuevo hay que completar los tres puntos.
 * - `MagicCardStatus`: estado que decide el juego (nunca el cursor):
 *   `locked` (oculto y aún no disponible), `ready` (oculto y disponible para revelar),
 *   `revealed` (contenido visible) y `selected` (contenido visible y elegido: el ganador).
 * - `PODIUM_PLACES`: textos y material de cada puesto del escenario «El podio mágico»
 *   (`PodiumGame` en `ScenarioGames.tsx`). `place` usa la misma base que el ranking: 0 = 1.er puesto.
 */
export type MagicMaterial = 'roots' | 'honeycomb' | 'stone';

export type MagicCardStatus = 'locked' | 'ready' | 'revealed' | 'selected';

/**
 * Contrato de cada panel que recibe `MagicOptionsPodium`.
 *
 * - `content`: texto principal; `null` muestra el panel oculto («???»).
 * - `onActivate`: acción real del panel. Solo se ejecuta en estado `ready`; los paneles `revealed` y
 *   `selected` se dibujan como contenido estático porque no tienen acción.
 * - `pedestal`: texto tallado en el pedestal (por ejemplo, el número del puesto).
 */
export interface MagicPodiumItem {
  id: string;
  title: string;
  content: string | null;
  description: string;
  material: MagicMaterial;
  status: MagicCardStatus;
  pedestal: string;
  featured?: boolean;
  onActivate?: () => void;
}

export interface PodiumPlaceTheme {
  place: 0 | 1 | 2;
  ordinal: string;
  title: string;
  description: string;
  material: MagicMaterial;
}

/** Puestos en el orden visual del podio: 2.º a la izquierda, 1.º en el centro, 3.º a la derecha. */
export const PODIUM_PLACES: readonly PodiumPlaceTheme[] = [
  {
    place: 1,
    ordinal: '2º',
    title: 'Segundo puesto',
    description: 'Muy cerca de la cima',
    material: 'roots',
  },
  {
    place: 0,
    ordinal: '1º',
    title: 'Primer puesto',
    description: '¡La magia ha decidido!',
    material: 'honeycomb',
  },
  {
    place: 2,
    ordinal: '3º',
    title: 'Tercer puesto',
    description: 'Un lugar en el podio',
    material: 'stone',
  },
];

/** Orden de revelado (por `place`): se conserva el suspense del escenario original, 3.º → 2.º → 1.º. */
export const PODIUM_REVEAL_ORDER: readonly (0 | 1 | 2)[] = [2, 1, 0];
