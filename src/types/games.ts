export type ScenarioType =
  | 'doors'
  | 'podium'
  | 'beehives'
  | 'cards';

export interface GameOption {
  id: string;
  label: string;
}

export interface GameConfig {
  options: GameOption[];
  scenario: ScenarioType;
}