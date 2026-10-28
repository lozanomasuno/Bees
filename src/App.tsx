import { useState } from 'react';
import OptionForm from './components/OptionForm';
import { getScenarioLabel, getScenarioType } from './services/scenarioSelector';
import type { GameOption } from './types/games';
import CardGame from './components/CardGame';
import { BeehivesGame, DoorsGame, PodiumGame } from './components/ScenarioGames';

function App() {
  const [gameOptions, setGameOptions] = useState<GameOption[] | null>(null);

  const startGame = (options: GameOption[]) => {
    setGameOptions(options);
  };

  const resetGame = () => {
    setGameOptions(null);
  };

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="BEES, inicio">
          <span className="brand-icon" aria-hidden="true">🐝</span>
          <span>BEES<span className="brand-dot">.</span></span>
        </a>

        <span className="topbar-label">EL JUEGO DE LAS DECISIONES</span>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <span className="hero-badge">
            ✨ PEQUEÑAS DECISIONES, GRANDES AVENTURAS
          </span>

          <h1>
            Deja que la
            <br />
            <span>magia decida.</span>
          </h1>

          <p>
            ¿No sabes qué elegir? Prepara tus opciones,
            respira profundo y descubre qué sorpresa
            tiene preparada el universo BEES.
          </p>

          <div className="hero-stats">
            <span>🐝 2–10 opciones</span>
            <span>🎲 Resultados aleatorios</span>
          </div>
        </div>

        <div className="hero-art" aria-hidden="true">
          <span className="art-spark spark-one">✦</span>
          <span className="art-spark spark-two">✧</span>
          <div className="sunburst">
            <span>🐝</span>
          </div>
          <span className="art-caption">¡Bzz, bzz!</span>
        </div>
      </section>

      <div className={gameOptions ? 'content content-game' : 'content'}>
        {!gameOptions ? (
          <OptionForm onStart={startGame} />
        ) : getScenarioType(gameOptions.length) === 'doors' ? (
          <DoorsGame options={gameOptions} onExit={resetGame} />
        ) : getScenarioType(gameOptions.length) === 'podium' ? (
          <PodiumGame options={gameOptions} onExit={resetGame} />
        ) : getScenarioType(gameOptions.length) === 'beehives' ? (
          <BeehivesGame options={gameOptions} onExit={resetGame} />
        ) : getScenarioType(gameOptions.length) === 'cards' ? (
          <CardGame options={gameOptions} onExit={resetGame} />
        ) : (
          <section className="game-preview">
            <span className="eyebrow">ESCENARIO EN PREPARACIÓN</span>
            <h2>¡Tu aventura está lista!</h2>

            <p className="scenario-name">
              Escenario: {getScenarioLabel(
                getScenarioType(gameOptions.length)
              )}
            </p>

            <div className="preview-options">
              {gameOptions.map((option, index) => (
                <div className="preview-option" key={option.id}>
                  <span className="option-number">{index + 1}</span>
                  <span>{option.label}</span>
                </div>
              ))}
            </div>

            <button
              className="button button-primary"
              type="button"
              onClick={resetGame}
            >
              ← Volver a las opciones
            </button>
          </section>
        )}
      </div>

      <footer className="footer">
        Hecho con 🐝 y un poquito de magia.
      </footer>
    </main>
  );
}

export default App;