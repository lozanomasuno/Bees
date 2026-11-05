import { useCallback, useRef, useState, type FormEvent } from 'react';
import type { GameOption } from '../types/games';
import OptionList from './OptionList';
import { IconAlert, IconDice, IconLeaf, IconPlus } from './icons';

/**
 * Panel de decisiones: reúne las opciones del jugador y las entrega a `App` para iniciar el juego.
 *
 * Responsabilidades:
 * - Mantener la lista de opciones en memoria (no hay persistencia).
 * - Validar cada opción: no vacía, sin duplicados (ignora mayúsculas y espacios exteriores),
 *   máximo `MAX_OPTION_LENGTH` caracteres y como máximo `MAX_OPTIONS` opciones.
 * - Habilitar «¡A jugar!» desde `MIN_OPTIONS` opciones y llamar a `onStart(options)`; el sorteo lo
 *   realiza el escenario que elige `App` según la cantidad de opciones.
 *
 * Los límites deben coincidir con los rangos de `services/scenarioSelector.ts`.
 */
interface OptionFormProps {
  onStart: (options: GameOption[]) => void;
}

const MIN_OPTIONS = 2;
const MAX_OPTIONS = 10;
const MAX_OPTION_LENGTH = 100;

const normalizeOption = (value: string) => value.trim().toLocaleLowerCase();

export default function OptionForm({ onStart }: OptionFormProps) {
  const [options, setOptions] = useState<GameOption[]>([]);
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const isFull = options.length >= MAX_OPTIONS;
  const missing = Math.max(0, MIN_OPTIONS - options.length);

  const addOption = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const label = value.trim();

    if (!label) {
      setError('Escribe una opción antes de agregarla.');
      return;
    }

    if (options.length >= MAX_OPTIONS) {
      setError(`¡Solo puedes ingresar ${MAX_OPTIONS} opciones!`);
      return;
    }

    if (options.some((option) => normalizeOption(option.label) === normalizeOption(label))) {
      setError('Esta opción ya existe. No puedes agregar opciones duplicadas.');
      return;
    }

    setOptions((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        label,
      },
    ]);

    setValue('');
    setError('');
    // Al agregar con el botón, el foco vuelve al campo para escribir la siguiente opción.
    inputRef.current?.focus();
  };

  const removeOption = (id: string) => {
    setOptions((current) => current.filter((option) => option.id !== id));
    setError('');
  };

  const focusInput = useCallback(() => inputRef.current?.focus(), []);

  const startGame = () => {
    if (options.length < MIN_OPTIONS) {
      setError(`Necesitas al menos ${MIN_OPTIONS} opciones para jugar.`);
      return;
    }

    const normalizedLabels = options.map((option) => normalizeOption(option.label));
    if (new Set(normalizedLabels).size !== normalizedLabels.length) {
      setError('Hay opciones duplicadas. Elimina las repeticiones antes de jugar.');
      return;
    }

    setError('');
    onStart(options);
  };

  return (
    <section className="decision-panel" aria-labelledby="decision-title">
      <span className="decision-panel__emblem" aria-hidden="true">
        <svg viewBox="0 0 64 64" focusable="false">
          <polygon points="32,3 57,17.5 57,46.5 32,61 7,46.5 7,17.5" />
          <polygon className="decision-panel__emblem-cell" points="32,17 44,24 44,38 32,45 20,38 20,24" />
        </svg>
      </span>
      <span className="decision-panel__corner decision-panel__corner--top" aria-hidden="true" />
      <span className="decision-panel__corner decision-panel__corner--bottom" aria-hidden="true" />

      <div className="decision-panel__inner">
        <div className="section-heading">
          <span className="eyebrow">Prepara tu aventura</span>
          <h2 id="decision-title">¿Qué vamos a decidir?</h2>
          <p>
            Escribe tus opciones y deja que las abejitas decidan tu destino.
          </p>
        </div>

        <form className="option-entry" onSubmit={addOption}>
          <label htmlFor="option-input">Tu próxima opción</label>

          <div className="input-row">
            <div className="input-field">
              <IconLeaf className="input-field__icon" />
              <input
                ref={inputRef}
                id="option-input"
                type="text"
                value={value}
                onChange={(event) => {
                  setValue(event.target.value);
                  setError('');
                }}
                maxLength={MAX_OPTION_LENGTH}
                autoComplete="off"
                placeholder="¿Qué opción quieres agregar?"
                aria-describedby={error ? 'option-error' : undefined}
              />
            </div>

            <button
              type="submit"
              className="button button-primary"
              disabled={isFull}
            >
              <IconPlus />
              Agregar
            </button>
          </div>
        </form>

        <div className="option-list-header">
          <h3>Mis opciones</h3>

          <div className="option-progress">
            <span className="honey-meter" aria-hidden="true">
              {Array.from({ length: MAX_OPTIONS }, (_, index) => (
                <span
                  key={index}
                  className={index < options.length ? 'honey-meter__cell is-filled' : 'honey-meter__cell'}
                />
              ))}
            </span>
            <span className="counter" aria-live="polite">
              {options.length}/{MAX_OPTIONS} opciones
            </span>
          </div>
        </div>

        <OptionList options={options} onRemove={removeOption} onEmpty={focusInput} />

        {error && (
          <p id="option-error" className="form-error" role="alert">
            <IconAlert className="form-error__icon" />
            {error}
          </p>
        )}

        <div className="form-footer">
          <button
            type="button"
            className="play-button"
            onClick={startGame}
            disabled={options.length < MIN_OPTIONS}
            aria-describedby="play-hint"
          >
            <IconDice className="play-button__icon" />
            ¡A jugar!
          </button>

          <span id="play-hint" className="option-hint">
            {missing > 0
              ? `Agrega ${missing} ${missing === 1 ? 'opción más' : 'opciones más'} para jugar · `
                + `entre ${MIN_OPTIONS} y ${MAX_OPTIONS} opciones`
              : isFull
                ? `¡Panal completo! Máximo ${MAX_OPTIONS} opciones`
                : `Entre ${MIN_OPTIONS} y ${MAX_OPTIONS} opciones`}
          </span>
        </div>
      </div>
    </section>
  );
}
