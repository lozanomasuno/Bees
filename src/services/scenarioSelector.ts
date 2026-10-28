import type { ScenarioType } from '../types/games';

export function getScenarioType(count: number): ScenarioType {
  if (count === 2) return 'doors';
  if (count === 3) return 'podium';
  if (count >= 4 && count <= 6) return 'beehives';
  if (count >= 7 && count <= 10) return 'cards';

  throw new Error('BEES necesita entre 2 y 10 opciones.');
}

export function getScenarioLabel(scenario: ScenarioType): string {
  const labels: Record<ScenarioType, string> = {
    doors: 'Las dos puertas',
    podium: 'El podio mágico',
    beehives: 'La competencia de panales',
    cards: 'Las cartas del mago',
  };

  return labels[scenario];
}