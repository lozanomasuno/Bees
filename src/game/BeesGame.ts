import Phaser from 'phaser';
import { CardsScene } from './scenes/CardsScene';

export function createBeesGame(
  parent: HTMLDivElement,
  options: string[],
  onReveal: (index: number) => void,
  onAnimationStart: () => void,
  onCardComplete: () => void,
  onSequenceComplete: () => void,
) {
  const scene = new CardsScene(options, onReveal, onAnimationStart, onCardComplete, onSequenceComplete);

  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: 1000,
    height: 620,
    backgroundColor: '#251a36',
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [],
  });

  game.scene.add('CardsScene', scene, true);

  return { game, scene };
}