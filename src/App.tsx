import { useState } from 'react';
import OptionForm from './components/OptionForm';
import { getScenarioLabel, getScenarioType } from './services/scenarioSelector';
import type { GameOption } from './types/games';
import CardGame from './components/CardGame';
import { BeehivesGame, DoorsGame, PodiumGame } from './components/ScenarioGames';
import ForestBackdrop from './components/ForestBackdrop';
import GameHeader from './components/GameHeader';
import HeroSection from './components/HeroSection';
import BeeMascot from './components/BeeMascot';

/**
 * Pantalla principal de BEES.
 *
 * Sin opciones confirmadas muestra el hero y el panel de decisiones; al pulsar «¡A jugar!» oculta el
 * hero y monta el escenario que corresponde a la cantidad de opciones (`getScenarioType`).
 * El fondo del bosque y la cabecera permanecen en ambos estados; durante el juego `app-shell--playing`
 * retira los árboles y elementos flotantes para que no queden detrás de los títulos y controles.
 */
function App() {
  const [gameOptions, setGameOptions] = useState<GameOption[] | null>(null);

  const startGame = (options: GameOption[]) => {
    setGameOptions(options);
  };

  const resetGame = () => {
    setGameOptions(null);
  };

  return (
    <div className={gameOptions ? 'app-shell app-shell--playing' : 'app-shell'}>
      <ForestBackdrop />
      <GameHeader />

      <main className="app-main">
        {!gameOptions && <HeroSection />}

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
      </main>

      <footer className="footer">
        Hecho con{' '}
        <BeeMascot className="footer__bee" />
        <span className="visually-hidden">abejas</span>{' '}
        y un poquito de magia.
      </footer>
    </div>
  );
}

export default App;
