import type { GameOption } from '../types/games';

export function shuffle<T>(items: readonly T[]): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

export function pickRandomIndex(length: number): number {
  return Math.floor(Math.random() * length);
}

export function randomRanking(options: readonly GameOption[]): GameOption[] {
  return shuffle(options);
}

export function randomBeeCounts(options: readonly GameOption[]) {
  const counts = options.map(() => 0);
  const beeTotal = options.length + 3;

  for (let bee = 0; bee < beeTotal; bee += 1) {
    counts[pickRandomIndex(counts.length)] += 1;
  }

  const highestCount = Math.max(...counts);
  const winnerIndex = counts.findIndex((count) => count === highestCount);
  return { counts, winnerIndex };
}
