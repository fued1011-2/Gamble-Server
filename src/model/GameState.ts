import { Player } from "./Player";

export interface GameState {
    gameId: String
    thrownDiceValues: number[]
    selectedDice: Dice[];
    takenDice: Dice[];
    diceRotations: DiceRotation[];
    roundScore: number;
    throwScore: number;
    thrown: boolean;
    win: boolean;
    players: Player[],
    currentPlayerIndex: number;
    menu: boolean;
    creator: Player
}