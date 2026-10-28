import { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import type { GameOption } from '../types/games';
import { pickRandomIndex, randomBeeCounts, shuffle } from '../services/randomResult';
import { DoorsScene } from '../game/scenes/DoorsScene';
import { PodiumScene } from '../game/scenes/PodiumScene';
import { BeehivesScene } from '../game/scenes/BeehivesScene';

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
    const scene = new DoorsScene(options.map((option) => option.label), pickRandomIndex(options.length), (index) => { setWinner(index); setBusy(false); });
    sceneRef.current = scene;
    const game = createGame(ref.current, scene);
    return () => { sceneRef.current = null; game.destroy(true); };
  }, [options, round]);

  const reset = () => { setWinner(null); setBusy(false); setRound((current) => current + 1); };
  return <section className="card-game"><header className="game-header"><div><span className="eyebrow">ESCENARIO DE BEES</span><h2>Las dos puertas</h2></div><button className="button button-secondary" onClick={onExit}>← Volver</button></header><div className="game-stage"><div ref={ref} className="phaser-container" /></div>{winner !== null && <section className="completion-message"><span>🚪🐝✨</span><h3>{options[winner].label}</h3><p>Segunda opción: {options[winner === 0 ? 1 : 0].label}</p></section>}<nav className="floating-menu"><button className="button button-secondary" onClick={reset} disabled={busy}>↺ Reiniciar</button></nav></section>;
}

export function PodiumGame({ options, onExit }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<PodiumScene | null>(null);
  const [ranking, setRanking] = useState<number[] | null>(null);
  const [round, setRound] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    const result = shuffle(options.map((_, index) => index));
    const scene = new PodiumScene(options.map((option) => option.label), result, (places) => { setRanking(places); setBusy(false); });
    sceneRef.current = scene;
    const game = createGame(ref.current, scene);
    return () => { sceneRef.current = null; game.destroy(true); };
  }, [options, round]);

  const play = () => { if (busy) return; setRanking(null); setBusy(true); sceneRef.current?.play(); };
  const reset = () => { setRanking(null); setBusy(false); setRound((current) => current + 1); };
  return <section className="card-game"><header className="game-header"><div><span className="eyebrow">ESCENARIO DE BEES</span><h2>El podio mágico</h2></div><button className="button button-secondary" onClick={onExit}>← Volver</button></header><div className="game-stage"><div ref={ref} className="phaser-container" /></div>{ranking && <section className="completion-message"><span>🏆🐝✨</span><h3>Ganador: {options[ranking[0]].label}</h3><p>2º {options[ranking[1]].label} · 3º {options[ranking[2]].label}</p></section>}<nav className="floating-menu"><button className="button button-primary" onClick={play} disabled={busy}>✨ Revelar podio</button><button className="button button-secondary" onClick={reset} disabled={busy}>↺ Reiniciar</button></nav></section>;
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
    window.setTimeout(() => scene.play(), 350);
    return () => { sceneRef.current = null; game.destroy(true); };
  }, [options, round, tiedCandidates]);

  useEffect(() => {
    if (!ref.current || !tiedCandidates || tiedCandidates.length < 2) return;
    const firstIndex = tieChampion ?? tiedCandidates[0];
    const secondIndex = tiedCandidates[tiePairIndex];
    const pairLabels = [options[firstIndex].label, options[secondIndex].label];
    const doorWinner = pickRandomIndex(2);
    const scene = new DoorsScene(pairLabels, doorWinner, (doorIndex) => {
      const winner = doorIndex === 0 ? firstIndex : secondIndex;
      if (tiePairIndex >= tiedCandidates.length - 1) {
        setFinalTiebreakWinner(winner);
        return;
      }
      setTieChampion(winner);
      setTiePairIndex((current) => current + 1);
    });
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
