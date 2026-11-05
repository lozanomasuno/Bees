import { useEffect, useRef } from 'react';
import type { GameOption } from '../types/games';
import BeeMascot from './BeeMascot';
import { IconTrash } from './icons';

/**
 * Lista numerada de opciones del panel de decisiones.
 *
 * Entradas:
 * - `options`: opciones en el orden en que se agregaron; la numeración se recalcula en cada render.
 * - `onRemove(id)`: elimina una opción. El estado vive en `OptionForm`; este componente no lo modifica.
 * - `onEmpty`: se llama cuando se elimina la última opción, para que el formulario recupere el foco.
 *
 * Tras eliminar, el foco pasa al botón «Eliminar» de la opción que ocupa su lugar (o a la anterior),
 * de modo que el teclado no pierde la posición. Los botones son `type="button"` y no pueden enviar
 * el formulario ni iniciar el juego.
 */
interface OptionListProps {
  options: GameOption[];
  onRemove: (id: string) => void;
  onEmpty: () => void;
}

export default function OptionList({ options, onRemove, onEmpty }: OptionListProps) {
  const listRef = useRef<HTMLOListElement>(null);
  // Posición de la opción eliminada; se consume en el render siguiente para mover el foco.
  const pendingFocus = useRef<number | null>(null);

  useEffect(() => {
    const index = pendingFocus.current;
    if (index === null) return;
    pendingFocus.current = null;

    const buttons = listRef.current?.querySelectorAll<HTMLButtonElement>('.remove-button');
    if (buttons && buttons.length > 0) {
      buttons[Math.min(index, buttons.length - 1)].focus();
    } else {
      onEmpty();
    }
  }, [options, onEmpty]);

  const remove = (id: string, index: number) => {
    pendingFocus.current = index;
    onRemove(id);
  };

  if (options.length === 0) {
    return (
      <div className="empty-state">
        <BeeMascot className="empty-state__bee" />
        <p>¡Tu aventura comienza con una idea!</p>
        <span>Agrega al menos dos opciones.</span>
      </div>
    );
  }

  return (
    <ol className="option-list" ref={listRef}>
      {options.map((option, index) => (
        <li className="option-item" key={option.id}>
          <span className="option-number">{index + 1}</span>
          <span className="option-label">{option.label}</span>
          <button
            type="button"
            className="remove-button"
            aria-label={`Eliminar ${option.label}`}
            onClick={() => remove(option.id, index)}
          >
            <IconTrash />
            <span className="remove-button__text" aria-hidden="true">Eliminar</span>
          </button>
        </li>
      ))}
    </ol>
  );
}
