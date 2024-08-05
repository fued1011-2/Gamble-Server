"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const GameServer_1 = __importDefault(require("./GameServer"));
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server);
const gameServer = new GameServer_1.default();
// Middleware für statische Dateien (falls benötigt)
app.use(express_1.default.static('public'));
io.on('connection', (socket) => {
    console.log('Ein Spieler hat sich verbunden');
    socket.on('createGame', ({ gameId, username }) => {
        gameServer.createGame(gameId);
        const game = gameServer.addPlayer(gameId, username, true);
        if (game) {
            socket.join(gameId);
            socket.playerId = game.players.length.toString();
            socket.username = username;
            socket.emit('gameCreated', game);
            console.log(`Spiel erstellt: ${gameId} von Spieler: ${username}`);
        }
    });
    socket.on('checkIfGameExists', (gameId) => {
        const gameExists = gameServer.checkIfGameExists(gameId);
        socket.emit('gameIdChecked', gameExists);
    });
    socket.on('joinGame', ({ gameId, username }) => {
        const game = gameServer.addPlayer(gameId, username, false);
        if (game) {
            socket.join(gameId);
            socket.playerId = game.players.length.toString();
            socket.username = username;
            socket.emit('gameJoined', game);
            io.to(gameId).emit('playerJoined', game);
            console.log(`Spieler ${username} ist Spiel ${gameId} beigetreten`);
        }
        else {
            socket.emit('gameJoinError', 'Spiel nicht gefunden');
        }
    });
    socket.on('startGame', (gameId) => {
        console.log(`Event eingegangeen`);
        io.to(gameId).emit('gameStarted');
        console.log(`Spiel ${gameId} gestartet`);
    });
    socket.on('changeUsername', ({ gameId, index, newUsername }) => {
        console.log(`Benutzername wird geändert in Spiel ${gameId}`);
        const updatedGame = gameServer.changeUsername(gameId, index, newUsername);
        if (updatedGame) {
            io.to(gameId).emit('usernameChanged', updatedGame);
        }
    });
    socket.on('removePlayer', ({ gameId, index }) => {
        console.log(`Spieler wird aus Spiel ${gameId} gekickt`);
        const result = gameServer.removePlayerByIndex(gameId, index);
        if (result === null || result === void 0 ? void 0 : result.game) {
            io.to(gameId).emit('playerRemoved', {
                game: result.game,
                removedUsername: result.removedUsername
            });
            console.log(`Spieler ${result.removedUsername} wurde aus Spiel ${JSON.stringify(result.game)} gekickt`);
        }
    });
    socket.on('rollDice', (gameId) => {
        const updatedGame = gameServer.rollDice(gameId);
        if (updatedGame) {
            io.to(gameId).emit('diceRolled', updatedGame);
            console.log(`Würfel gerollt in Spiel ${gameId}`);
        }
    });
    socket.on('diceSelected', ({ gameId, index, value }) => {
        const updatedGame = gameServer.selectDice(gameId, index, value);
        const isValid = gameServer.checkSelectedDice(gameId);
        if (updatedGame) {
            io.to(gameId).emit('diceSelectionChanged', { index, game: updatedGame });
            console.log(`Würfel ${index} mit Wert ${value} wurde in Spiel ${gameId} ausgewählt`);
            io.to(gameId).emit('selectedDiceChecked', isValid);
            console.log(`Ausgewählte Würfel überprüft in Spiel ${gameId}: ${isValid}`);
        }
    });
    socket.on('calculateRoundScore', (gameId) => {
        const updatedGame = gameServer.calculateRoundScore(gameId);
        if (updatedGame) {
            io.to(gameId).emit('roundScoreCalculated', updatedGame);
            console.log(`Rundenpunkte berechnet in Spiel ${gameId}`);
        }
    });
    socket.on('calculateThrowScore', (gameId) => {
        const updatedGame = gameServer.calculateScore(gameId);
        if (updatedGame) {
            io.to(gameId).emit('throwScoreCalculated', updatedGame);
            console.log(`Wurfpunkte berechnet in Spiel ${gameId}`);
        }
    });
    socket.on('endRound', (gameId) => {
        const updatedGame = gameServer.endRound(gameId);
        if (updatedGame) {
            io.to(gameId).emit('roundEnded', updatedGame);
            if (updatedGame.isLastRound && updatedGame.lastRoundCounter == 1) {
                io.to(gameId).emit('lastRound', updatedGame);
            }
            if (updatedGame.win) {
                io.to(gameId).emit('gameWon', updatedGame.currentPlayerIndex);
            }
            console.log(`Runde beendet in Spiel ${gameId}`);
        }
    });
    socket.on('zero', (gameId) => {
        console.log('ZERO ENCOUNTERED');
        const updatedGame = gameServer.zero(gameId);
        if (updatedGame) {
            io.to(gameId).emit('zeroed', updatedGame);
            console.log(`Nullrunde in Spiel ${gameId}`);
        }
    });
    socket.on('checkSelectedDice', (gameId) => {
        const isValid = gameServer.checkSelectedDice(gameId);
        io.to(gameId).emit('selectedDiceChecked', isValid);
        console.log(`Ausgewählte Würfel überprüft in Spiel ${gameId}: ${isValid}`);
    });
    socket.on('checkThrownDiceValues', (gameId) => {
        const isValid = gameServer.checkThrownDice(gameId);
        io.to(gameId).emit('thrownDiceChecked', isValid);
        console.log(`Geworfene Würfel überprüft in Spiel ${gameId}: ${isValid}`);
    });
    socket.on('deductPointsFromPlayer', ({ gameId, username }) => {
        console.log(`Ziehe Punkte von Spieler ${username} ab`);
        const game = gameServer.deductPointsFromPlayer(gameId, username);
        if (game) {
            io.to(gameId).emit('deductedPointsFromPlayer', game);
        }
    });
    socket.on('disconnect', () => {
        console.log('Ein Spieler hat die Verbindung getrennt');
        socket.disconnect;
    });
    socket.on('syncDice', (payload) => {
        const { gameId, diceValues } = payload;
        console.log(`SyncDice: received for game ${gameId}`);
        console.log("Dice values:", JSON.stringify(diceValues, null, 2));
        // Emit the received dice values to all clients in the game room
        io.to(gameId).emit('receivedDiceValues', diceValues);
    });
    socket.on('playerLeft', ({ gameId, username }) => {
        gameServer.removePlayer(gameId, username);
        const game = gameServer.getGame(gameId);
        console.log(`Spieler ${username} hat das Spiel ${gameId} verlassen`);
        if (game) {
            console.log('game Exists');
            if (game.players.length > 0) {
                console.log('emit player leaved event');
                io.to(gameId).emit('playerDidLeave', username);
                if (gameServer.isCreator(gameId, username)) {
                    game.creator = game.players[0];
                    io.to(gameId).emit('creatorChanged', game);
                }
            }
            else {
                gameServer.deleteGame(gameId);
            }
        }
        socket.leave(gameId);
    });
});
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
