import type { Ref } from 'react';
import { IconLock } from '../icons';
import { MagicOptionDecorations, MagicOptionMedallion } from './MagicOptionDecorations';
import type { MagicPodiumItem } from './podiumThemes';

/**
 * Panel del podio mágico: marco tallado del material, medallón, placa de texto y pedestal.
 *
 * El elemento raíz depende del estado que decide el juego (`item.status`):
 * - `ready`: `<button>` que ejecuta `onActivate` (hover, foco visible y pulsación).
 * - `locked`: `<button disabled>`; se ve apagado y sin animaciones, con candado.
 * - `revealed` / `selected`: `<div>` estático, porque ya no hay acción. `selected` añade la cinta
 *   «Ganadora», resplandor y partículas.
 * Al pasar de botón a `div` React monta un elemento nuevo; eso dispara la animación de revelado y obliga a
 * que `MagicOptionsPodium` devuelva el foco (lo hace al siguiente panel disponible o al destino final).
 *
 * El nombre accesible del botón es su texto visible (puesto, «oculto» y la indicación); los separadores
 * `{' '}` evitan que el lector de pantalla junte palabras de bloques distintos.
 */
interface MagicOptionCardProps {
  item: MagicPodiumItem;
  onActivate: () => void;
  ref?: Ref<HTMLButtonElement>;
}

const PARTICLE_COUNT = 10;

export default function MagicOptionCard({ item, onActivate, ref }: MagicOptionCardProps) {
  const { title, content, description, material, status, featured = false, pedestal } = item;
  const className = [
    'magic-card',
    `magic-card--${material}`,
    `magic-card--${status}`,
    featured ? 'magic-card--featured' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const body = (
    <>
      <span className="magic-card__glow" aria-hidden="true" />
      {(featured || status === 'selected') && (
        <span className="magic-card__particles" aria-hidden="true">
          {Array.from({ length: PARTICLE_COUNT }, (_, index) => (
            <i key={index} />
          ))}
        </span>
      )}
      <span className="magic-card__frame">
        <span className="magic-card__medallion" aria-hidden="true">
          <MagicOptionMedallion material={material} />
        </span>
        <span className="magic-card__plaque">
          {status === 'selected' && (
            <>
              <span className="magic-card__ribbon">Ganadora</span>{' '}
            </>
          )}
          <span className="magic-card__title">{title}</span>{' '}
          {content === null ? (
            <span className="magic-card__mystery">
              {status === 'locked' && <IconLock className="magic-card__lock" />}
              <span aria-hidden="true">???</span>
              <span className="visually-hidden">oculto</span>
            </span>
          ) : (
            <span className="magic-card__label">{content}</span>
          )}{' '}
          <span className="magic-card__description">{description}</span>
        </span>
      </span>
      <span className="magic-card__pedestal" aria-hidden="true">
        {pedestal}
      </span>
      <MagicOptionDecorations material={material} />
    </>
  );

  if (status === 'ready' || status === 'locked') {
    return (
      <button
        ref={ref}
        type="button"
        className={className}
        disabled={status === 'locked'}
        onClick={onActivate}
      >
        {body}
      </button>
    );
  }

  return <div className={className}>{body}</div>;
}
