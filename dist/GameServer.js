"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = require("crypto");
class GameServer {
    constructor() {
        this.games = new Map();
    }
    createGame(gameId) {
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
            disconnectedPlayers: [],
            currentPlayerIndex: 0,
            menu: false,
            creator: { id: (0, crypto_1.randomUUID)(), score: 0, username: '', zeroCount: 0, scoreHistory: [] },
            isLastRound: false,
            lastRoundCounter: 0,
        });
    }
    checkIfGameExists(gameId) {
        const game = this.games.get(gameId);
        if (game) {
            return true;
        }
        else {
            return false;
        }
    }
    changeUsername(gameId, index, newUsername) {
        const game = this.games.get(gameId);
        if (game) {
            game.players[index].username = newUsername;
        }
        console.log('Username changed to ' + newUsername);
        return game;
    }
    createRandomDiceRotation() {
        const randomFloat = (min, max) => Math.random() * (max - min) + min;
        return {
            x: randomFloat(-Math.PI, Math.PI),
            y: randomFloat(-Math.PI, Math.PI),
            z: randomFloat(-Math.PI, Math.PI)
        };
    }
    rollDice(gameId) {
        const game = this.games.get(gameId);
        if (game) {
            game.diceRotations = Array(6).fill(null).map(() => this.createRandomDiceRotation());
            game.thrown = true;
        }
        return game;
    }
    selectDice(gameId, index, value) {
        const game = this.games.get(gameId);
        if (!game)
            return null;
        const diceIndex = game.selectedDice.findIndex(d => d.index === index);
        if (diceIndex > -1) {
            // Wenn der Würfel bereits ausgewählt ist, entfernen wir ihn
            game.selectedDice.splice(diceIndex, 1);
        }
        else {
            // Wenn der Würfel noch nicht ausgewählt ist, fügen wir ihn hinzu
            game.selectedDice.push({ index, value });
        }
        return game;
    }
    calculateThrowScore(game) {
        game.throwScore = 0;
        const diceValues = game.selectedDice.map(die => die.value);
        console.log(diceValues);
        const diceCount = game.selectedDice.length;
        console.log("DiceCount: " + diceCount);
        if (diceCount < 3) {
            this.calculateSingleDiceScores(game);
        }
        else if (diceCount === 3) {
            this.calculateTripleScores(game, diceValues);
        }
        else if (diceCount === 4) {
            this.calculateQuadrupleScores(game, diceValues);
        }
        else if (diceCount === 5) {
            this.calculateQuintupleScores(game, diceValues);
        }
        else if (diceCount === 6) {
            this.calculateSextupleScores(game, diceValues);
        }
        console.log("Throw score: " + game.throwScore);
    }
    calculateSingleDiceScores(game) {
        console.log("calculateSingleDiceScores");
        game.selectedDice.forEach(die => {
            if (die.value === 1) {
                game.throwScore += 100;
            }
            else if (die.value === 5) {
                game.throwScore += 50;
            }
        });
    }
    calculateTripleScores(game, diceValues) {
        if (diceValues.every(value => value === diceValues[0])) {
            game.throwScore += diceValues[0] === 1 ? 1000 : diceValues[0] * 100;
        }
        else {
            this.calculateSingleDiceScores(game);
        }
    }
    calculateQuadrupleScores(game, diceValues) {
        if (diceValues.every(value => value === diceValues[0])) {
            game.throwScore += diceValues[0] === 1 ? 2000 : diceValues[0] * 200;
        }
        else {
            this.calculateMixedQuadrupleScores(game, diceValues);
        }
    }
    calculateMixedQuadrupleScores(game, diceValues) {
        const numberWithThreeOccurrences = this.findNumberWithOccurrences(diceValues, 3);
        const numberWithOneOccurrence = diceValues.find(value => value !== numberWithThreeOccurrences);
        if (numberWithThreeOccurrences != 0) {
            game.throwScore += numberWithThreeOccurrences === 1 ? 1000 : numberWithThreeOccurrences * 100;
            if (numberWithOneOccurrence === 1) {
                game.throwScore += 100;
            }
            else if (numberWithOneOccurrence === 5) {
                game.throwScore += 50;
            }
        }
        else {
            this.calculateSingleDiceScores(game);
        }
    }
    calculateQuintupleScores(game, diceValues) {
        if (diceValues.every(value => value === diceValues[0])) {
            game.throwScore += diceValues[0] === 1 ? 4000 : diceValues[0] * 400;
        }
        else {
            this.calculateMixedQuintupleScores(game, diceValues);
        }
    }
    calculateMixedQuintupleScores(game, diceValues) {
        const numberWithFourOccurrences = this.findNumberWithOccurrences(diceValues, 4);
        const numberWithOneOccurrence = diceValues.find(value => value !== numberWithFourOccurrences);
        if (numberWithFourOccurrences != 0) {
            game.throwScore += numberWithFourOccurrences === 1 ? 2000 : numberWithFourOccurrences * 200;
            if (numberWithOneOccurrence === 1) {
                game.throwScore += 100;
            }
            else if (numberWithOneOccurrence === 5) {
                game.throwScore += 50;
            }
        }
        else {
            this.calculateMixedTripleFromQuintupleScores(game, diceValues);
        }
    }
    calculateMixedTripleFromQuintupleScores(game, diceValues) {
        const numberWithThreeOccurrences = this.findNumberWithOccurrences(diceValues, 3);
        const otherNumbers = diceValues.filter(value => value !== numberWithThreeOccurrences);
        if (numberWithThreeOccurrences != 0) {
            game.throwScore += numberWithThreeOccurrences === 1 ? 1000 : numberWithThreeOccurrences * 100;
            otherNumbers.forEach(number => {
                if (number === 1) {
                    game.throwScore += 100;
                }
                else if (number === 5) {
                    game.throwScore += 50;
                }
            });
        }
        else {
            this.calculateSingleDiceScores(game);
        }
    }
    calculateSextupleScores(game, diceValues) {
        console.log("calculateSextupleScores");
        if (diceValues.every(value => value === diceValues[0])) {
            game.throwScore += diceValues[0] === 1 ? 8000 : diceValues[0] * 800;
        }
        else if (this.isThreePairs(diceValues)) {
            game.throwScore += 750;
        }
        else if (this.isStreet(diceValues)) {
            game.throwScore += 1500;
        }
        else {
            this.calculateMixedSextupleScores(game, diceValues);
        }
    }
    calculateMixedSextupleScores(game, diceValues) {
        console.log("calculateMixedSextupleScores");
        const numberWithFiveOccurrences = this.findNumberWithOccurrences(diceValues, 5);
        const numberWithOneOccurrence = diceValues.find(value => value !== numberWithFiveOccurrences);
        if (numberWithFiveOccurrences != 0) {
            console.log(numberWithFiveOccurrences);
            game.throwScore += numberWithFiveOccurrences === 1 ? 4000 : numberWithFiveOccurrences * 400;
            if (numberWithOneOccurrence === 1) {
                game.throwScore += 100;
            }
            else if (numberWithOneOccurrence === 5) {
                game.throwScore += 50;
            }
        }
        else {
            this.calculateMixedQuadrupleScoresFromSextuple(game, diceValues);
        }
    }
    calculateMixedQuadrupleScoresFromSextuple(game, diceValues) {
        console.log("calculateMixedQuadrupleScoresFromSextuple");
        const numberWithFourOccurrences = this.findNumberWithOccurrences(diceValues, 4);
        const otherNumbers = diceValues.filter(value => value !== numberWithFourOccurrences);
        if (numberWithFourOccurrences != 0) {
            game.throwScore += numberWithFourOccurrences === 1 ? 2000 : numberWithFourOccurrences * 200;
            otherNumbers.forEach(number => {
                if (number === 1) {
                    game.throwScore += 100;
                }
                else if (number === 5) {
                    game.throwScore += 50;
                }
            });
        }
        else {
            this.calculateMixedTriplesScoresFromSextuple(game, diceValues);
        }
    }
    calculateMixedTriplesScoresFromSextuple(game, diceValues) {
        console.log("calculateMixedTriplesScoresFromSextuple");
        const numbersWithThreeOccurrences = this.findNumbersWithOccurrences(diceValues, 3);
        const otherNumbers = diceValues.filter(value => value !== numbersWithThreeOccurrences[0]);
        if (numbersWithThreeOccurrences.length === 2) {
            console.log("numbersWithThreeOccurrences === 2");
            numbersWithThreeOccurrences.forEach(key => {
                this.calculateTripleScores(game, Array(3).fill(key));
            });
        }
        else if (numbersWithThreeOccurrences.length === 1) {
            console.log("numbersWithThreeOccurrences === 1");
            console.log("Other numbers" + otherNumbers);
            game.throwScore += numbersWithThreeOccurrences[0] === 1 ? 2000 : numbersWithThreeOccurrences[0] * 100;
            otherNumbers.forEach(number => {
                if (number === 1) {
                    game.throwScore += 100;
                }
                else if (number === 5) {
                    game.throwScore += 50;
                }
            });
        }
        else {
            this.calculateSingleDiceScores(game);
        }
    }
    calculateRoundScore(gameId) {
        const game = this.games.get(gameId);
        if (game) {
            this.calculateThrowScore(game);
            game.roundScore += game.throwScore;
            game.throwScore = 0;
            game.selectedDice = [];
        }
        return game;
    }
    calculateScore(gameId) {
        const game = this.games.get(gameId);
        if (game) {
            this.calculateThrowScore(game);
        }
        return game;
    }
    endRound(gameId) {
        const game = this.games.get(gameId);
        if (game) {
            game.takenDice = [];
            game.selectedDice = [];
            game.players[game.currentPlayerIndex].score += game.roundScore + game.throwScore + 9000;
            game.players[game.currentPlayerIndex].scoreHistory.push(game.players[game.currentPlayerIndex].score);
            game.players[game.currentPlayerIndex].zeroCount = 0;
            game.roundScore = 0;
            game.throwScore = 0;
            game.thrown = false;
            if (game.players[game.currentPlayerIndex].score >= 10000 && game.isLastRound == false) {
                console.log('first player reached 10k');
                game.isLastRound = true;
                game.lastRoundCounter += 1;
            }
            else if (game.isLastRound == true && game.lastRoundCounter == game.players.length - 1) {
                console.log('WIN!!!!');
                game.win = true;
                return game;
            }
            else if (game.isLastRound) {
                console.log('Plus lastRoundCounter');
                game.lastRoundCounter += 1;
            }
            console.log('normal Round ended');
            game.currentPlayerIndex = (game.currentPlayerIndex + 1) % game.players.length;
        }
        return game;
    }
    removePlayerByIndex(gameId, index) {
        console.log('removePlayerByIndex');
        const game = this.games.get(gameId);
        if (game) {
            console.log(game.players);
            const removedPlayer = game.players.splice(index, 1)[0];
            let removedUsername = '';
            console.log(game.players);
            console.log(removedPlayer);
            removedUsername = removedPlayer.username;
            console.log({ game, removedUsername });
            return { game, removedUsername };
        }
        return undefined;
    }
    removePlayer(gameId, username) {
        console.log(username);
        const game = this.games.get(gameId);
        if (game) {
            const disconnectedPlayer = game.players.find(player => player.username === username);
            game.players = game.players.filter(player => player.username !== username);
            if (disconnectedPlayer) {
                game.disconnectedPlayers.push(disconnectedPlayer);
            }
            console.log(game.players);
        }
        return game;
    }
    deductPointsFromPlayer(gameId, username) {
        const game = this.games.get(gameId);
        if (game) {
            const playerToDeduct = game.players.find(player => player.username === username);
            if (playerToDeduct) {
                playerToDeduct.score -= 500;
                playerToDeduct.score = Math.max(playerToDeduct.score, 0);
                console.log(`Deducted ${500} points from ${username} in game ${gameId}`);
            }
            else {
                console.error(`Player ${username} not found in game ${gameId}`);
            }
        }
        return game;
    }
    zero(gameId) {
        const game = this.games.get(gameId);
        if (game) {
            game.players[game.currentPlayerIndex].zeroCount += 1;
            if (game.players[game.currentPlayerIndex].zeroCount == 3) {
                if (game.players[game.currentPlayerIndex].score > 0) {
                    game.players[game.currentPlayerIndex].score -= 500;
                    if (game.players[game.currentPlayerIndex].score < 0) {
                        game.players[game.currentPlayerIndex].score = 0;
                    }
                }
                game.players[game.currentPlayerIndex].zeroCount = 0;
            }
            game.players[game.currentPlayerIndex].scoreHistory.push(game.players[game.currentPlayerIndex].score);
            game.takenDice = [];
            game.selectedDice = [];
            game.roundScore = 0;
            game.throwScore = 0;
            game.thrown = false;
            game.currentPlayerIndex = (game.currentPlayerIndex + 1) % game.players.length;
        }
        return game;
    }
    addPlayer(gameId, username, isCreator) {
        console.log('Add Player');
        const game = this.games.get(gameId);
        if (game) {
            const formerPlayer = this.getFormerPlayer(gameId, username);
            if (formerPlayer) {
                console.log(`isFormerPlayer: ${JSON.stringify(formerPlayer)}`);
                game.players.push(formerPlayer);
            }
            else {
                console.log(`isNotFormerPlayer: ${formerPlayer}`);
                game.players.push({ id: (0, crypto_1.randomUUID)(), score: 0, username: username, zeroCount: 0, scoreHistory: [] });
            }
            if (isCreator) {
                game.creator = game.players[0];
            }
        }
        return game;
    }
    getFormerPlayer(gameId, username) {
        const game = this.games.get(gameId);
        if (game) {
            console.log(`getFormerPlayer for ${username} from ${game.disconnectedPlayers}`);
            const formerPlayer = game.disconnectedPlayers.find(player => player.username == username);
            if (formerPlayer) {
                return formerPlayer;
            }
        }
    }
    isCreator(gameId, username) {
        const game = this.games.get(gameId);
        if (game) {
            if (game.creator.username == username) {
                return true;
            }
            else {
                return false;
            }
        }
        return false;
    }
    deleteGame(gameId) {
        this.games.delete(gameId);
    }
    checkSelectedDice(gameId) {
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
    checkThrownDice(gameId) {
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
    findNumberWithOccurrences(array, count) {
        const frequencyDictionary = array.reduce((counts, number) => {
            counts[number] = (counts[number] || 0) + 1;
            return counts;
        }, {});
        const entry = Object.entries(frequencyDictionary).find(([, value]) => value === count);
        return entry ? parseInt(entry[0]) : 0;
    }
    findNumbersWithOccurrences(array, count) {
        const frequencyDictionary = array.reduce((counts, number) => {
            counts[number] = (counts[number] || 0) + 1;
            return counts;
        }, {});
        return Object.keys(frequencyDictionary)
            .filter(key => frequencyDictionary[parseInt(key)] === count)
            .map(Number);
    }
    findAllNumbersWithCount(array) {
        return array.reduce((counts, number) => {
            counts[number] = (counts[number] || 0) + 1;
            return counts;
        }, {});
    }
    isThreePairs(array) {
        const frequencyDictionary = this.findAllNumbersWithCount(array);
        return Object.values(frequencyDictionary).filter(count => count === 2).length === 3;
    }
    isStreet(array) {
        const uniqueValues = new Set(array);
        return uniqueValues.size === array.length && uniqueValues.size === 6;
    }
    getGame(gameId) {
        return this.games.get(gameId);
    }
}
exports.default = GameServer;
