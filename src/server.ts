import express from 'express';
import http from 'http';
import { Server, Socket } from 'socket.io';
import GameServer from './GameServer';

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const gameServer = new GameServer();

// Middleware für statische Dateien (falls benötigt)
app.use(express.static('public'));

// Typdefinition für Socket mit Spieler-ID
interface GameSocket extends Socket {
    playerId?: string;
    username?: string
}

io.on('connection', (socket: GameSocket) => {
    console.log('Ein Spieler hat sich verbunden');

    socket.on('createGame', ({ gameId, username }: { gameId: string; username: string }) => {
      gameServer.createGame(gameId);
      const game = gameServer.addPlayer(gameId, username, true);
      if (game) {
          socket.join(gameId);
          socket.playerId = game.players.length.toString();
          socket.username = username;
          socket.emit('gameCreated',  game);
          console.log(`Spiel erstellt: ${gameId} von Spieler: ${username}`);
      }
  });

  socket.on('joinGame', ({ gameId, username }: { gameId: string; username: string }) => {
      const game = gameServer.addPlayer(gameId, username, false);
      if (game) {
          socket.join(gameId);
          socket.playerId = game.players.length.toString();
          socket.username = username;
          socket.emit('gameJoined', game);
          io.to(gameId).emit('playerJoined', game);
          console.log(`Spieler ${username} ist Spiel ${gameId} beigetreten`);
      } else {
          socket.emit('gameJoinError', 'Spiel nicht gefunden');
      }
  });

  socket.on('startGame', (gameId: string) => {
      console.log(`Event eingegangeen`);
      io.to(gameId).emit('gameStarted');
      console.log(`Spiel ${gameId} gestartet`);
  });

    socket.on('rollDice', (gameId: string) => {
        const updatedGame = gameServer.rollDice(gameId);
        if (updatedGame) {
            io.to(gameId).emit('diceRolled', updatedGame);
            console.log(`Würfel gerollt in Spiel ${gameId}`);
        }
    });

    socket.on('diceSelected', ({ gameId, index, value }) => {
      const updatedGame = gameServer.selectDice(gameId, index, value);
      const isValid = gameServer.checkSelectedDice(gameId)
       if (updatedGame) {
          io.to(gameId).emit('diceSelectionChanged', { index, game: updatedGame});
          console.log(`Würfel ${index} mit Wert ${value} wurde in Spiel ${gameId} ausgewählt`);
          io.to(gameId).emit('selectedDiceChecked', isValid);
          console.log(`Ausgewählte Würfel überprüft in Spiel ${gameId}: ${isValid}`);
       }
    });

    socket.on('calculateRoundScore', (gameId: string) => {
        const updatedGame = gameServer.calculateRoundScore(gameId);
        if (updatedGame) {
            io.to(gameId).emit('roundScoreCalculated', updatedGame);
            console.log(`Rundenpunkte berechnet in Spiel ${gameId}`);
        }
    });

    socket.on('calculateThrowScore', (gameId: string) => {
      const updatedGame = gameServer.calculateScore(gameId);
      if (updatedGame) {
          io.to(gameId).emit('throwScoreCalculated', updatedGame);
          console.log(`Wurfpunkte berechnet in Spiel ${gameId}`);
      }
  });

    socket.on('endRound', (gameId: string) => {
        const updatedGame = gameServer.endRound(gameId);
        if (updatedGame) {
            io.to(gameId).emit('roundEnded', updatedGame);
            if (updatedGame.win) {
                io.to(gameId).emit('gameWon', { winnerId: updatedGame.currentPlayerIndex });
            }
            console.log(`Runde beendet in Spiel ${gameId}`);
        }
    });

    socket.on('zero', (gameId: string) => {
      console.log('ZERO ENCOUNTERED')
        const updatedGame = gameServer.zero(gameId);
        if (updatedGame) {
            io.to(gameId).emit('zeroed', updatedGame);
            console.log(`Nullrunde in Spiel ${gameId}`);
        }
    });

    socket.on('checkSelectedDice', (gameId: string) => {
        const isValid = gameServer.checkSelectedDice(gameId);
        io.to(gameId).emit('selectedDiceChecked', isValid);
        console.log(`Ausgewählte Würfel überprüft in Spiel ${gameId}: ${isValid}`);
    });

    socket.on('checkThrownDiceValues', (gameId: string) => {
      const isValid = gameServer.checkThrownDice(gameId);
      io.to(gameId).emit('thrownDiceChecked', isValid);
      console.log(`Geworfene Würfel überprüft in Spiel ${gameId}: ${isValid}`);
  });

    socket.on('disconnect', () => {
        console.log('Ein Spieler hat die Verbindung getrennt');
        socket.disconnect
    });

    socket.on('syncDice', (payload: { gameId: string; diceValues: DiceValue[] }) => {
        io.to(payload.gameId).emit('recievedDiceValues', payload.diceValues)
    })

    socket.on('playerLeft', (data: { gameId: string; username: string }) => {
        gameServer.removePlayer(data.gameId, data.username)
        console.log(`Spieler ${data.username} hat das Spiel ${data.gameId} verlassen`);
        io.to(data.gameId).emit('playerDidLeave', data.username)
        socket.leave(data.gameId)
    })
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});