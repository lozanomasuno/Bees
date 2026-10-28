import { useState, type FormEvent } from 'react';
import type { GameOption } from '../types/games';

interface OptionFormProps {
  onStart: (options: GameOption[]) => void;
}

export default function OptionForm({ onStart }: OptionFormProps) {
  const [options, setOptions] = useState<GameOption[]>([]);
  const [value, setValue] = useState('');
  const [error, setError] = useState('');

  const addOption = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const label = value.trim();

    if (!label) {
      setError('Escribe una opción antes de agregarla.');
      return;
    }

    if (options.length >= 10) {
      setError('¡Solo puedes ingresar 10 opciones!');
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
  };

  const removeOption = (id: string) => {
    setOptions((current) => current.filter((option) => option.id !== id));
    setError('');
  };

  const startGame = () => {
    if (options.length < 2) {
      setError('Necesitas al menos 2 opciones para jugar.');
      return;
    }

    setError('');
    onStart(options);
  };

  return (
    <section className="option-form">
      <div className="section-heading">
        <span className="eyebrow">PREPARA TU AVENTURA</span>
        <h2>¿Qué vamos a decidir?</h2>
        <p>
          Escribe tus opciones y deja que las abejitas decidan tu destino.
        </p>
      </div>

      <form className="option-entry" onSubmit={addOption}>
        <label htmlFor="option-input">Tu próxima opción</label>

        <div className="input-row">
          <input
            id="option-input"
            type="text"
            value={value}
            onChange={(event) => {
              setValue(event.target.value);
              setError('');
            }}
            maxLength={100}
            placeholder="Ej. ¿Qué película vemos?"
            aria-describedby={error ? 'option-error' : undefined}
          />

          <button
            type="submit"
            className="button button-secondary"
            disabled={options.length >= 10}
          >
            + Agregar
          </button>
        </div>
      </form>

      <div className="option-list-header">
        <h3>Mis opciones</h3>
        <span className="counter">{options.length}/10</span>
      </div>

      {options.length === 0 ? (
        <div className="empty-state">
          <span className="empty-bee" aria-hidden="true">🐝</span>
          <p>¡Tu aventura comienza con una idea!</p>
          <span>Agrega al menos dos opciones.</span>
        </div>
      ) : (
        <ul className="option-list">
          {options.map((option, index) => (
            <li className="option-item" key={option.id}>
              <span className="option-number">{index + 1}</span>
              <span className="option-label">{option.label}</span>
              <button
                type="button"
                className="remove-button"
                aria-label={`Eliminar ${option.label}`}
                onClick={() => removeOption(option.id)}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      {error && (
        <p id="option-error" className="form-error" role="alert">
          {error}
        </p>
      )}

      <div className="form-footer">
        <span className="option-hint">
          Entre 2 y 10 opciones
        </span>

        <button
          type="button"
          className="button button-primary"
          onClick={startGame}
          disabled={options.length < 2}
        >
          ¡A jugar! <span aria-hidden="true">→</span>
        </button>
      </div>
    </section>
  );
}