import { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import type { GameOption } from '../types/games';
import { pickRandomIndex, randomBeeCounts, shuffle } from '../services/randomResult';
import { DoorsScene } from '../game/scenes/DoorsScene';
import { BeehivesScene } from '../game/scenes/BeehivesScene';
import MagicOptionsPodium from './podium/MagicOptionsPodium';
import {
  PODIUM_PLACES,
  PODIUM_REVEAL_ORDER,
  type MagicCardStatus,
  type MagicPodiumItem,
} from './podium/podiumThemes';

interface Props { options: GameOption[]; onExit: () => void; }

function createGame(parent: HTMLDivElement, scene: Phaser.Scene) {
  const game = new Phaser.Game({ type: Phaser.AUTO, parent, width: 1000, height: 620, backgroundColor: '#251a36', scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH }, scene: [] });
  game.scene.add(scene.constructor.name, scene, true);
  return game;
}

export function DoorsGame({ options, onExit }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<DoorsScene | null>(null);
  const [winner, setWinner] = useState<number | null>(null);
  const [round, setRound] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    // `onOpeningsChange` mantiene «Reiniciar» deshabilitado mientras una puerta se abre.
    const scene = new DoorsScene(
      options.map((option) => option.label),
      pickRandomIndex(options.length),
      (index) => { setWinner(index); setBusy(false); },
      { onOpeningsChange: setBusy },
    );
    sceneRef.current = scene;
    const game = createGame(ref.current, scene);
    return () => { sceneRef.current = null; game.destroy(true); };
  }, [options, round]);

  const reset = () => { setWinner(null); setBusy(false); setRound((current) => current + 1); };
  return <section className="card-game"><header className="game-header"><div><span className="eyebrow">ESCENARIO DE BEES</span><h2>Las dos puertas</h2></div><button className="button button-secondary" onClick={onExit}>← Volver</button></header><div className="game-stage"><div ref={ref} className="phaser-container" /></div>{winner !== null && <section className="completion-message"><span>🚪🐝✨</span><h3>{options[winner].label}</h3><p>Segunda opción: {options[winner === 0 ? 1 : 0].label}</p></section>}<nav className="floating-menu"><button className="button button-secondary" onClick={reset} disabled={busy}>↺ Reiniciar</button></nav></section>;
}

/** Pausa antes del primer revelado automático y entre los siguientes (misma cadencia que la escena Phaser). */
const PODIUM_FIRST_REVEAL_DELAY = 300;
const PODIUM_REVEAL_STEP_DELAY = 850;

/**
 * Escenario «El podio mágico» (3 opciones), dibujado con `MagicOptionsPodium` (React, SVG y CSS).
 *
 * - `ranking[place]` es el índice de la opción en cada puesto (0 = 1.er puesto); se sortea al montar y al
 *   reiniciar.
 * - Revelado por pasos: `revealedCount` puestos visibles siguiendo `PODIUM_REVEAL_ORDER` (3.º → 2.º → 1.º).
 *   El jugador pulsa el panel disponible, o «Revelar podio» revela los restantes con temporizador; mientras
 *   tanto (`busy`) los paneles y «Reiniciar» quedan bloqueados.
 * - El 1.er puesto revelado es el estado `selected` del podio; el mensaje final aparece con los tres puestos.
 */
export function PodiumGame({ options, onExit }: Props) {
  const totalPlaces = PODIUM_REVEAL_ORDER.length;
  const [ranking, setRanking] = useState(() => shuffle(options.map((_, index) => index)));
  const [revealedCount, setRevealedCount] = useState(0);
  const [autoRevealing, setAutoRevealing] = useState(false);
  const completionRef = useRef<HTMLElement>(null);

  const finished = revealedCount >= totalPlaces;
  const busy = autoRevealing && !finished;

  useEffect(() => {
    if (!busy) return;
    const timer = window.setTimeout(
      () => setRevealedCount((current) => Math.min(current + 1, totalPlaces)),
      revealedCount === 0 ? PODIUM_FIRST_REVEAL_DELAY : PODIUM_REVEAL_STEP_DELAY,
    );
    return () => window.clearTimeout(timer);
  }, [busy, revealedCount, totalPlaces]);

  const revealNext = () => {
    if (busy) return;
    setRevealedCount((current) => Math.min(current + 1, totalPlaces));
  };
  const revealAll = () => {
    if (busy || finished) return;
    setAutoRevealing(true);
  };
  const reset = () => {
    setRanking(shuffle(options.map((_, index) => index)));
    setRevealedCount(0);
    setAutoRevealing(false);
  };

  const items: MagicPodiumItem[] = PODIUM_PLACES.map((theme) => {
    const step = PODIUM_REVEAL_ORDER.indexOf(theme.place);
    const isRevealed = revealedCount > step;
    const isNext = !busy && revealedCount === step;
    let status: MagicCardStatus = 'locked';
    if (isRevealed) status = theme.place === 0 ? 'selected' : 'revealed';
    else if (isNext) status = 'ready';

    let description = 'Aún bajo el hechizo';
    if (isRevealed) description = theme.description;
    else if (isNext) description = 'Toca para revelar';

    return {
      id: `place-${theme.place}`,
      title: theme.title,
      content: isRevealed ? options[ranking[theme.place]].label : null,
      description,
      material: theme.material,
      status,
      pedestal: String(theme.place + 1),
      featured: theme.place === 0,
      onActivate: isNext ? revealNext : undefined,
    };
  });

  const lastPlace = revealedCount > 0 ? PODIUM_REVEAL_ORDER[revealedCount - 1] : null;
  const lastTheme = PODIUM_PLACES.find((theme) => theme.place === lastPlace);
  const announcement = lastPlace !== null && lastTheme
    ? `${lastTheme.title}: ${options[ranking[lastPlace]].label}`
    : '';

  return (
    <section className="card-game">
      <header className="game-header">
        <div>
          <span className="eyebrow">ESCENARIO DE BEES</span>
          <h2>El podio mágico</h2>
        </div>
        <button className="button button-secondary" onClick={onExit}>← Volver</button>
      </header>

      <div className="game-stage game-stage--podium">
        <MagicOptionsPodium
          items={items}
          label="Podio con las tres opciones"
          announcement={announcement}
          focusAfterLastRef={completionRef}
        />
      </div>

      {finished && (
        <section className="completion-message" ref={completionRef} tabIndex={-1}>
          <span>🏆🐝✨</span>
          <h3>Ganador: {options[ranking[0]].label}</h3>
          <p>2º {options[ranking[1]].label} · 3º {options[ranking[2]].label}</p>
        </section>
      )}

      <nav className="floating-menu">
        <button className="button button-primary" onClick={revealAll} disabled={busy || finished}>
          ✨ Revelar podio
        </button>
        <button className="button button-secondary" onClick={reset} disabled={busy}>↺ Reiniciar</button>
      </nav>
    </section>
  );
}

export function BeehivesGame({ options, onExit }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<BeehivesScene | DoorsScene | null>(null);
  const [result, setResult] = useState<{ counts: number[]; winner: number } | null>(null);
  const [round, setRound] = useState(0);
  const [busy, setBusy] = useState(false);
  const [tiedCandidates, setTiedCandidates] = useState<number[] | null>(null);
  const [tiePairIndex, setTiePairIndex] = useState(1);
  const [tieChampion, setTieChampion] = useState<number | null>(null);
  const [finalTiebreakWinner, setFinalTiebreakWinner] = useState<number | null>(null);

  useEffect(() => {
    if (!ref.current || tiedCandidates) return;
    const generated = randomBeeCounts(options);
    setBusy(true);
    setResult(null);
    const scene = new BeehivesScene(options.map((option) => option.label), generated.counts, generated.winnerIndex, (counts, _winner, tiedIndexes) => {
      setBusy(false);
      if (tiedIndexes.length > 1) {
        setResult({ counts, winner: tiedIndexes[0] });
        setTiedCandidates(tiedIndexes);
        setTiePairIndex(1);
        setTieChampion(null);
      } else {
        setResult({ counts, winner: tiedIndexes[0] });
      }
    });
    sceneRef.current = scene;
    const game = createGame(ref.current, scene);
    // El temporizador se cancela al desmontar: si no, StrictMode o un reinicio en los primeros 350 ms
    // llamarían a `play()` sobre una escena ya destruida.
    const playTimer = window.setTimeout(() => scene.play(), 350);
    return () => {
      window.clearTimeout(playTimer);
      sceneRef.current = null;
      game.destroy(true);
    };
  }, [options, round, tiedCandidates]);

  useEffect(() => {
    if (!ref.current || !tiedCandidates || tiedCandidates.length < 2) return;
    const firstIndex = tieChampion ?? tiedCandidates[0];
    const secondIndex = tiedCandidates[tiePairIndex];
    const pairLabels = [options[firstIndex].label, options[secondIndex].label];
    const doorWinner = pickRandomIndex(2);
    const isFinalPair = tiePairIndex >= tiedCandidates.length - 1;
    // En rondas intermedias la escena se destruye al recibir el resultado: se bloquean las puertas restantes.
    // En la ronda final se puede abrir la otra puerta, pero solo revela su contenido (no cambia el ganador).
    const scene = new DoorsScene(pairLabels, doorWinner, (doorIndex) => {
      const winner = doorIndex === 0 ? firstIndex : secondIndex;
      if (isFinalPair) {
        setFinalTiebreakWinner(winner);
        return;
      }
      setTieChampion(winner);
      setTiePairIndex((current) => current + 1);
    }, { lockAfterResult: !isFinalPair, onOpeningsChange: setBusy });
    sceneRef.current = scene;
    const game = createGame(ref.current, scene);
    return () => { sceneRef.current = null; game.destroy(true); };
  }, [options, tiedCandidates, tiePairIndex, tieChampion]);

  const reset = () => {
    setResult(null);
    setBusy(false);
    setTiedCandidates(null);
    setTiePairIndex(1);
    setTieChampion(null);
    setFinalTiebreakWinner(null);
    setRound((current) => current + 1);
  };

  const displayedWinner = finalTiebreakWinner ?? result?.winner ?? null;
  return <section className="card-game"><header className="game-header"><div><span className="eyebrow">ESCENARIO DE BEES</span><h2>La competencia de panales</h2></div><button className="button button-secondary" onClick={onExit}>← Volver</button></header><div className="game-stage"><div ref={ref} className="phaser-container" /></div>{result && <section className="completion-message"><span>{finalTiebreakWinner !== null ? '🚪🐝🎉' : '🍯🐝🎉'}</span><h3>Ganador: {options[displayedWinner ?? result.winner].label}</h3>{finalTiebreakWinner !== null && <p>Empate resuelto mediante las puertas.</p>}<p>{result.counts.map((count, index) => `${options[index].label}: ${count}`).join(' · ')}</p></section>}<nav className="floating-menu"><button className="button button-secondary" onClick={reset} disabled={busy}>↺ Reiniciar</button></nav></section>;
}
