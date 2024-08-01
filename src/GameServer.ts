import { randomUUID } from "crypto";
import { GameState } from "./model/GameState";

class GameServer {
    private games: Map<string, GameState>;

    constructor() {
        this.games = new Map<string, GameState>();
    }

    createGame(gameId: string): void {
        this.games.set(gameId, {
            gameId: gameId,
            thrownDiceValues: [],
            selectedDice: [],
            takenDice: [],
            diceRotations: [],
            roundScore: 0,
            throwScore: 0,
            thrown: false,
            win: false,
            players: [],
            currentPlayerIndex: 0,
            menu: false,
            creator: {id: randomUUID(), score: 0, username: '', zeroCount: 0, scoreHistory: []}
        });
    }

    private createRandomDiceRotation(): DiceRotation {
        const randomFloat = (min: number, max: number) => Math.random() * (max - min) + min;

        return {
            x: randomFloat(-Math.PI, Math.PI),
            y: randomFloat(-Math.PI, Math.PI),
            z: randomFloat(-Math.PI, Math.PI)
        };
    }

    rollDice(gameId: string): GameState | undefined {
        const game = this.games.get(gameId);
        if (game) {
            game.diceRotations = Array(6).fill(null).map(() => this.createRandomDiceRotation());
            game.thrown = true;
        }
        return game;
    }

    selectDice(gameId: string, index: number, value: number): GameState | null {
        const game = this.games.get(gameId);
        if (!game) return null;
    
        const diceIndex = game.selectedDice.findIndex(d => d.index === index);
        if (diceIndex > -1) {
            // Wenn der Würfel bereits ausgewählt ist, entfernen wir ihn
            game.selectedDice.splice(diceIndex, 1);
        } else {
            // Wenn der Würfel noch nicht ausgewählt ist, fügen wir ihn hinzu
            game.selectedDice.push({ index, value });
        }
    
        return game;
    }

    private calculateThrowScore(game: GameState): void {
        game.throwScore = 0;
        const diceValues = game.selectedDice.map(die => die.value);
        console.log(diceValues)
        const diceCount = game.selectedDice.length;
        console.log("DiceCount: " + diceCount)

        if (diceCount < 3) {
            this.calculateSingleDiceScores(game);
        } else if (diceCount === 3) {
            this.calculateTripleScores(game, diceValues);
        } else if (diceCount === 4) {
            this.calculateQuadrupleScores(game, diceValues);
        } else if (diceCount === 5) {
            this.calculateQuintupleScores(game, diceValues);
        } else if (diceCount === 6) {
            this.calculateSextupleScores(game, diceValues);
        }

        console.log("Throw score: " + game.throwScore)
    }

    private calculateSingleDiceScores(game: GameState): void {
        console.log("calculateSingleDiceScores")
        game.selectedDice.forEach(die => {
            if (die.value === 1) {
                game.throwScore += 100;
            } else if (die.value === 5) {
                game.throwScore += 50;
            }
        });
    }

    private calculateTripleScores(game: GameState, diceValues: number[]): void {
        if (diceValues.every(value => value === diceValues[0])) {
            game.throwScore += diceValues[0] === 1 ? 1000 : diceValues[0] * 100;
        } else {
            this.calculateSingleDiceScores(game);
        }
    }

    private calculateQuadrupleScores(game: GameState, diceValues: number[]): void {
        if (diceValues.every(value => value === diceValues[0])) {
            game.throwScore += diceValues[0] === 1 ? 2000 : diceValues[0] * 200;
        } else {
            this.calculateMixedQuadrupleScores(game, diceValues);
        }
    }

    private calculateMixedQuadrupleScores(game: GameState, diceValues: number[]): void {
        const numberWithThreeOccurrences = this.findNumberWithOccurrences(diceValues, 3);
        const numberWithOneOccurrence = diceValues.find(value => value !== numberWithThreeOccurrences);

        if (numberWithThreeOccurrences != 0) {
            game.throwScore += numberWithThreeOccurrences === 1 ? 1000 : numberWithThreeOccurrences * 100;

            if (numberWithOneOccurrence === 1) {
                game.throwScore += 100;
            } else if (numberWithOneOccurrence === 5) {
                game.throwScore += 50;
            }
        } else {
            this.calculateSingleDiceScores(game);
        }
    }

    private calculateQuintupleScores(game: GameState, diceValues: number[]): void {
        if (diceValues.every(value => value === diceValues[0])) {
            game.throwScore += diceValues[0] === 1 ? 4000 : diceValues[0] * 400;
        } else {
            this.calculateMixedQuintupleScores(game, diceValues);
        }
    }

    private calculateMixedQuintupleScores(game: GameState, diceValues: number[]): void {
        const numberWithFourOccurrences = this.findNumberWithOccurrences(diceValues, 4);
        const numberWithOneOccurrence = diceValues.find(value => value !== numberWithFourOccurrences);

        if (numberWithFourOccurrences != 0) {
            game.throwScore += numberWithFourOccurrences === 1 ? 2000 : numberWithFourOccurrences * 200;

            if (numberWithOneOccurrence === 1) {
                game.throwScore += 100;
            } else if (numberWithOneOccurrence === 5) {
                game.throwScore += 50;
            }
        } else {
            this.calculateMixedTripleFromQuintupleScores(game, diceValues);
        }
    }

    private calculateMixedTripleFromQuintupleScores(game: GameState, diceValues: number[]): void {
        const numberWithThreeOccurrences = this.findNumberWithOccurrences(diceValues, 3);
        const otherNumbers = diceValues.filter(value => value !== numberWithThreeOccurrences);

        if (numberWithThreeOccurrences != 0) {
            game.throwScore += numberWithThreeOccurrences === 1 ? 1000 : numberWithThreeOccurrences * 100;

            otherNumbers.forEach(number => {
                if (number === 1) {
                    game.throwScore += 100;
                } else if (number === 5) {
                    game.throwScore += 50;
                }
            });
        } else {
            this.calculateSingleDiceScores(game);
        }
    }

    private calculateSextupleScores(game: GameState, diceValues: number[]): void {
        console.log("calculateSextupleScores")
        if (diceValues.every(value => value === diceValues[0])) {
            game.throwScore += diceValues[0] === 1 ? 8000 : diceValues[0] * 800;
        } else if (this.isThreePairs(diceValues)) {
            game.throwScore += 750;
        } else if (this.isStreet(diceValues)) {
            game.throwScore += 1500;
        } else {
            this.calculateMixedSextupleScores(game, diceValues);
        }
    }

    private calculateMixedSextupleScores(game: GameState, diceValues: number[]): void {
        console.log("calculateMixedSextupleScores")
        const numberWithFiveOccurrences = this.findNumberWithOccurrences(diceValues, 5);
        const numberWithOneOccurrence = diceValues.find(value => value !== numberWithFiveOccurrences);

        if (numberWithFiveOccurrences != 0) {
            console.log(numberWithFiveOccurrences)
            game.throwScore += numberWithFiveOccurrences === 1 ? 4000 : numberWithFiveOccurrences * 400;

            if (numberWithOneOccurrence === 1) {
                game.throwScore += 100;
            } else if (numberWithOneOccurrence === 5) {
                game.throwScore += 50;
            }
        } else {
            this.calculateMixedQuadrupleScoresFromSextuple(game, diceValues);
        }
    }

    private calculateMixedQuadrupleScoresFromSextuple(game: GameState, diceValues: number[]): void {
        console.log("calculateMixedQuadrupleScoresFromSextuple")

        const numberWithFourOccurrences = this.findNumberWithOccurrences(diceValues, 4);
        const otherNumbers = diceValues.filter(value => value !== numberWithFourOccurrences);

        if (numberWithFourOccurrences != 0) {
            game.throwScore += numberWithFourOccurrences === 1 ? 2000 : numberWithFourOccurrences * 200;

            otherNumbers.forEach(number => {
                if (number === 1) {
                    game.throwScore += 100;
                } else if (number === 5) {
                    game.throwScore += 50;
                }
            });
        } else {
            this.calculateMixedTriplesScoresFromSextuple(game, diceValues);
        }
    }

    private calculateMixedTriplesScoresFromSextuple(game: GameState, diceValues: number[]): void {
        console.log("calculateMixedTriplesScoresFromSextuple")
        const numbersWithThreeOccurrences = this.findNumbersWithOccurrences(diceValues, 3);
        const otherNumbers = diceValues.filter(value => value !== numbersWithThreeOccurrences[0]);

        if (numbersWithThreeOccurrences.length === 2) {
            console.log("numbersWithThreeOccurrences === 2")
            numbersWithThreeOccurrences.forEach(key => {
                this.calculateTripleScores(game, Array(3).fill(key));
            });
        } else if (numbersWithThreeOccurrences.length === 1) {
            console.log("numbersWithThreeOccurrences === 1")
            console.log("Other numbers" + otherNumbers)
            game.throwScore += numbersWithThreeOccurrences[0] === 1 ? 2000 : numbersWithThreeOccurrences[0] * 200;

            otherNumbers.forEach(number => {
                if (number === 1) {
                    game.throwScore += 100;
                } else if (number === 5) {
                    game.throwScore += 50;
                }
            });
        } else {
            this.calculateSingleDiceScores(game);
        }
    }

    calculateRoundScore(gameId: string): GameState | undefined {
        const game = this.games.get(gameId);
        if (game) {
            this.calculateThrowScore(game)
            game.roundScore += game.throwScore;
            game.throwScore = 0;
            game.selectedDice = []
        }
        return game;
    }

    calculateScore(gameId: string): GameState | undefined {
        const game = this.games.get(gameId);
        if (game) {
            this.calculateThrowScore(game)
        }
        return game;
    }

    endRound(gameId: string): GameState | undefined {
        const game = this.games.get(gameId);
        if (game) {
            game.takenDice = [];
            game.selectedDice = [];
            game.players[game.currentPlayerIndex].score += game.roundScore + game.throwScore;
            game.players[game.currentPlayerIndex].scoreHistory.push(game.players[game.currentPlayerIndex].score)
            game.players[game.currentPlayerIndex].zeroCount = 0
            game.roundScore = 0;
            game.throwScore = 0;
            game.thrown = false;

            if (game.players[game.currentPlayerIndex].score >= 10000) {
                setTimeout(() => {
                    if (game) {
                        game.players[game.currentPlayerIndex].score = 0;
                        game.win = true;
                    }
                }, 3000);
                return game;
            }

            game.currentPlayerIndex = (game.currentPlayerIndex + 1) % game.players.length;
        }
        return game;
    }

    zero(gameId: string): GameState | undefined {
        const game = this.games.get(gameId);
        if (game) {
            game.players[game.currentPlayerIndex].zeroCount += 1
            if (game.players[game.currentPlayerIndex].zeroCount == 3) {
                if (game.players[game.currentPlayerIndex].score > 0) {
                    game.players[game.currentPlayerIndex].score -= 500
                    if (game.players[game.currentPlayerIndex].score < 0) {
                        game.players[game.currentPlayerIndex].score = 0
                    }
                }
                game.players[game.currentPlayerIndex].zeroCount = 0
            }
            game.players[game.currentPlayerIndex].scoreHistory.push(game.players[game.currentPlayerIndex].score)
            game.takenDice = [];
            game.selectedDice = [];
            game.roundScore = 0;
            game.throwScore = 0;
            game.thrown = false;
            game.currentPlayerIndex = (game.currentPlayerIndex + 1) % game.players.length;
        }
        return game;
    }

    addPlayer(gameId: string, username: string, isCreator: boolean): GameState | undefined {
        const game = this.games.get(gameId);
        if (game) {
            game.players.push({id: randomUUID(), score: 0 , username: username, zeroCount: 0, scoreHistory: []});
            if (isCreator) {
                game.creator = game.players[0]
            }
        }
        return game;
    }

    checkSelectedDice(gameId: string): boolean {
        const game = this.games.get(gameId);
        if (game) {
            const diceValues = game.selectedDice.map(die => die.value);

            if (diceValues.length == 0) {
                return false;
            }

            if (this.isStreet(diceValues) || this.isThreePairs(diceValues)) {
                return true;
            }

            const counts = [2, 3, 4, 6];
            for (const count of counts) {
                if (game.selectedDice.some(die => die.value === count)) {
                    if (game.selectedDice.filter(die => die.value === count).length < 3) {
                        return false;
                    }
                }
            }
            return true;
        }
        return false;
    }

    checkThrownDice(gameId: string): boolean {
        const game = this.games.get(gameId);
        if (game) {

            if (game.thrownDiceValues.length == 0) {
                return false;
            }

            if (this.isStreet(game.thrownDiceValues) || this.isThreePairs(game.thrownDiceValues)) {
                return true;
            }

            const counts = [2, 3, 4, 6];
            for (const count of counts) {
                if (game.thrownDiceValues.some(value => value === count)) {
                    if (game.thrownDiceValues.filter(value => value === count).length < 3) {
                        return false;
                    }
                }
            }
            return true;
        }
        return false;
    }

    private findNumberWithOccurrences(array: number[], count: number): number {
        const frequencyDictionary = array.reduce((counts, number) => {
            counts[number] = (counts[number] || 0) + 1;
            return counts;
        }, {} as Record<number, number>);
        const entry = Object.entries(frequencyDictionary).find(([, value]) => value === count);
        return entry ? parseInt(entry[0]) : 0;
    }

    private findNumbersWithOccurrences(array: number[], count: number): number[] {
        const frequencyDictionary = array.reduce((counts, number) => {
            counts[number] = (counts[number] || 0) + 1;
            return counts;
        }, {} as Record<number, number>);
        return Object.keys(frequencyDictionary)
            .filter(key => frequencyDictionary[parseInt(key)] === count)
            .map(Number);
    }

    private findAllNumbersWithCount(array: number[]): Record<number, number> {
        return array.reduce((counts, number) => {
            counts[number] = (counts[number] || 0) + 1;
            return counts;
        }, {} as Record<number, number>);
    }

    private isThreePairs(array: number[]): boolean {
        const frequencyDictionary = this.findAllNumbersWithCount(array);
        return Object.values(frequencyDictionary).filter(count => count === 2).length === 3;
    }

    private isStreet(array: number[]): boolean {
        const uniqueValues = new Set(array);
        return uniqueValues.size === array.length && uniqueValues.size === 6;
    }
}

export default GameServer;