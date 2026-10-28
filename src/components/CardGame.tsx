import { useCallback, useEffect, useRef, useState } from 'react';
import { createBeesGame } from '../game/BeesGame';
import type { CardsScene } from '../game/scenes/CardsScene';

interface GameOption {
  id: string;
  label: string;
}

interface CardGameProps {
  options: GameOption[];
  onExit: () => void;
}

export default function CardGame({ options, onExit }: CardGameProps) {
  const gameContainer = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<CardsScene | null>(null);

  const [revealed, setRevealed] = useState<number[]>([]);
  const [notice, setNotice] = useState('');
  const [animating, setAnimating] = useState(false);

  const handleReveal = useCallback((index: number) => {
    setRevealed((current) => {
      const next = current.includes(index) ? current : [...current, index];
      if (next.length === options.length) setAnimating(false);
      return next;
    });

    setNotice('¡Has descubierto una opción!');
  }, [options.length]);

  const handleAnimationStart = useCallback(() => {
    setAnimating(true);
  }, []);

  const handleCardComplete = useCallback(() => {
    setAnimating(false);
  }, []);

  const handleSequenceComplete = useCallback(() => {
    setAnimating(false);
    setNotice('¡Todas las cartas han sido reveladas!');
  }, []);

  useEffect(() => {
    if (!gameContainer.current) return;

    const { game, scene } = createBeesGame(
      gameContainer.current,
      options.map((option) => option.label),
      handleReveal,
      handleAnimationStart,
      handleCardComplete,
      handleSequenceComplete,
    );

    sceneRef.current = scene;

    return () => {
      sceneRef.current = null;
      game.destroy(true);
    };
  }, [options, handleReveal, handleAnimationStart, handleCardComplete, handleSequenceComplete]);

  const revealAll = () => {
    if (animating) return;

    setAnimating(true);
    setNotice('¡Las cartas están revelando sus secretos!');
    sceneRef.current?.revealAll();
  };

  const shuffle = () => {
    if (animating || revealed.length > 0) return;

    sceneRef.current?.shuffleCards();
    setNotice('¡Las cartas se han mezclado!');
  };

  const reset = () => {
    if (animating) return;

    sceneRef.current?.resetCards();
    setRevealed([]);
    setNotice('¡Una nueva ronda comienza!');
  };

  const allRevealed = revealed.length === options.length;

  return (
    <section className="card-game">
      <header className="game-header">
        <div>
          <span className="eyebrow">ESCENARIO DE CARTAS</span>
          <h2>La caverna del mago</h2>
        </div>

        <button
          className="button button-secondary"
          onClick={onExit}
          disabled={animating}
        >
          ← Volver
        </button>
      </header>

      <div className="card-game-layout">
        <div className="game-board">
          <div className="game-stage">
            <div ref={gameContainer} className="phaser-container" />
          </div>

          <nav className="floating-menu" aria-label="Controles del juego">
        <button
          className="button button-secondary"
          onClick={shuffle}
          disabled={animating || revealed.length > 0}
        >
          ↻ Revolver
        </button>

        <button
          className="button button-primary"
          onClick={revealAll}
          disabled={animating || allRevealed}
        >
          ↓ Voltear todas
        </button>

        <button
          className="button button-secondary"
          onClick={reset}
          disabled={animating}
        >
          ↺ Reiniciar
        </button>
          </nav>
        </div>

        <section className="results-panel">
        <div className="results-heading">
          <h3>Opciones descubiertas</h3>
          <span className="counter">
            {revealed.length}/{options.length}
          </span>
        </div>

        {revealed.length === 0 ? (
          <p className="results-empty">
            Las opciones aparecerán aquí cuando descubras las cartas.
          </p>
        ) : (
          <ol className="revealed-list">
            {revealed.map((index, discoveryIndex) => (
              <li key={options[index].id}>
                <span className="option-number">{discoveryIndex + 1}</span>
                <span>{options[index].label}</span>
              </li>
            ))}
          </ol>
        )}

        {notice && (
          <p className="game-notice" role="status">
            {notice}
          </p>
        )}

        {allRevealed && (
          <div className="completion-message" role="status">
            <span aria-hidden="true">🎉🐝🎉</span>
            <h3>¡Has descubierto todas las opciones!</h3>
            <p>El misterio de la caverna ha sido revelado.</p>
          </div>
        )}
        </section>
      </div>
    </section>
  );
}