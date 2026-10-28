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

  const play = () => { if (busy) return; setBusy(true); setWinner(null); sceneRef.current?.play(); };
  const reset = () => { setWinner(null); setBusy(false); setRound((current) => current + 1); };
  return <section className="card-game"><header className="game-header"><div><span className="eyebrow">ESCENARIO DE BEES</span><h2>Las dos puertas</h2></div><button className="button button-secondary" onClick={onExit}>← Volver</button></header><div className="game-stage"><div ref={ref} className="phaser-container" /></div>{winner !== null && <section className="completion-message"><span>🚪🐝✨</span><h3>{options[winner].label}</h3><p>Segunda opción: {options[winner === 0 ? 1 : 0].label}</p></section>}<nav className="floating-menu"><button className="button button-primary" onClick={play} disabled={busy}>🎲 Abrir una puerta</button><button className="button button-secondary" onClick={reset} disabled={busy}>↺ Reiniciar</button></nav></section>;
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
  const sceneRef = useRef<BeehivesScene | null>(null);
  const [result, setResult] = useState<{ counts: number[]; winner: number } | null>(null);
  const [round, setRound] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    const generated = randomBeeCounts(options);
    const scene = new BeehivesScene(options.map((option) => option.label), generated.counts, generated.winnerIndex, (counts, winner) => { setResult({ counts, winner }); setBusy(false); });
    sceneRef.current = scene;
    const game = createGame(ref.current, scene);
    return () => { sceneRef.current = null; game.destroy(true); };
  }, [options, round]);

  const play = () => { if (busy) return; setResult(null); setBusy(true); sceneRef.current?.play(); };
  const reset = () => { setResult(null); setBusy(false); setRound((current) => current + 1); };
  return <section className="card-game"><header className="game-header"><div><span className="eyebrow">ESCENARIO DE BEES</span><h2>La competencia de panales</h2></div><button className="button button-secondary" onClick={onExit}>← Volver</button></header><div className="game-stage"><div ref={ref} className="phaser-container" /></div>{result && <section className="completion-message"><span>🍯🐝🎉</span><h3>Ganador: {options[result.winner].label}</h3><p>{result.counts.map((count, index) => `${options[index].label}: ${count}`).join(' · ')}</p></section>}<nav className="floating-menu"><button className="button button-primary" onClick={play} disabled={busy}>🐝 Lanzar abejas</button><button className="button button-secondary" onClick={reset} disabled={busy}>↺ Reiniciar</button></nav></section>;
}
