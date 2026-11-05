import { useEffect, useRef, type RefObject } from 'react';
import MagicOptionCard from './MagicOptionCard';
import { MagicPodiumBackdrop, MagicPodiumForeground } from './MagicOptionDecorations';
import type { MagicPodiumItem } from './podiumThemes';

/**
 * Podio mágico reutilizable: tres paneles sobre un bosque con profundidad.
 *
 * Uso actual: escenario «El podio mágico» (`PodiumGame` en `ScenarioGames.tsx`).
 *
 * Contrato:
 * - `items`: paneles en orden visual (izquierda, centro, derecha). El marcado como `featured` se dibuja
 *   más alto y, en móvil, pasa al primer lugar. Los pedestales siguen las alturas clásicas de un podio
 *   (centro > izquierda > derecha), así que el componente está pensado para exactamente tres paneles.
 * - El estado de cada panel lo decide quien usa el componente (`MagicPodiumItem.status`); el podio no
 *   guarda selección propia.
 * - `announcement`: texto que se anuncia a los lectores de pantalla cuando cambia (región `aria-live`).
 * - `focusAfterLastRef`: dónde poner el foco cuando, tras activar un panel, ya no queda ninguno en `ready`
 *   (si no se indica, el foco no se mueve).
 *
 * Ejemplo:
 * ```tsx
 * <MagicOptionsPodium label="Podio" items={[izquierda, centro, derecha]} announcement={mensaje} />
 * ```
 */
interface MagicOptionsPodiumProps {
  items: readonly MagicPodiumItem[];
  label: string;
  announcement?: string;
  focusAfterLastRef?: RefObject<HTMLElement | null>;
}

export default function MagicOptionsPodium({
  items,
  label,
  announcement = '',
  focusAfterLastRef,
}: MagicOptionsPodiumProps) {
  const buttons = useRef(new Map<string, HTMLButtonElement>());
  const focusPending = useRef(false);

  // Al activar un panel su botón se sustituye por contenido estático y el foco se perdería: se traslada al
  // siguiente panel disponible o al destino final. Solo ocurre tras una activación del usuario.
  useEffect(() => {
    if (!focusPending.current) return;
    focusPending.current = false;
    const next = items.find((item) => item.status === 'ready');
    const target = next ? buttons.current.get(next.id) : focusAfterLastRef?.current;
    target?.focus();
  });

  const activate = (item: MagicPodiumItem) => {
    if (item.status !== 'ready' || !item.onActivate) return;
    focusPending.current = true;
    item.onActivate();
  };

  return (
    <div className="magic-podium">
      <MagicPodiumBackdrop />

      <ul className="magic-podium__row" aria-label={label}>
        {items.map((item) => (
          <li
            key={item.id}
            className={[
              'magic-podium__slot',
              `magic-podium__slot--${item.status}`,
              item.featured ? 'magic-podium__slot--featured' : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            <MagicOptionCard
              item={item}
              onActivate={() => activate(item)}
              ref={(element) => {
                if (element) buttons.current.set(item.id, element);
                else buttons.current.delete(item.id);
              }}
            />
          </li>
        ))}
      </ul>

      <MagicPodiumForeground />

      <p className="visually-hidden" aria-live="polite">
        {announcement}
      </p>
    </div>
  );
}
