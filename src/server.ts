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

  socket.on('checkIfGameExists', (gameId: string) => {
    const gameExists = gameServer.checkIfGameExists(gameId)
    socket.emit('gameIdChecked', gameExists)
  })

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

  socket.on('changeUsername', ({ gameId, index, newUsername }) => {
    console.log(`Benutzername wird geändert in Spiel ${gameId}`)
    const updatedGame = gameServer.changeUsername(gameId, index, newUsername);
        if (updatedGame) {
            io.to(gameId).emit('usernameChanged', updatedGame);
        }
  })

  socket.on('removePlayer', ({ gameId, index }) => {
    console.log(`Spieler wird aus Spiel ${gameId} gekickt`)
    const result = gameServer.removePlayerByIndex(gameId, index);
    if (result?.game) {
        io.to(gameId).emit('playerRemoved', {
            game: result.game,
            removedUsername: result.removedUsername
        });
        console.log(`Spieler ${result.removedUsername} wurde aus Spiel ${JSON.stringify(result.game)} gekickt`)
    }
})

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
            if (updatedGame.isLastRound && updatedGame.lastRoundCounter == 1) {
                io.to(gameId).emit('lastRound', updatedGame);
            }
            if (updatedGame.win) {
                io.to(gameId).emit('gameWon', updatedGame.winnerIndex);
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

    socket.on('deductPointsFromPlayer', ({ gameId, username }: { gameId: string; username: string }) => {
        console.log(`Ziehe Punkte von Spieler ${username} ab`);
        const game = gameServer.deductPointsFromPlayer(gameId, username)
        if (game) {
            io.to(gameId).emit('deductedPointsFromPlayer', game)
        }
    });

    socket.on('disconnect', () => {
        console.log('Ein Spieler hat die Verbindung getrennt');
        socket.disconnect
    });

    socket.on('syncDice', (payload) => {
        const { gameId, diceValues } = payload;
        console.log(`SyncDice: received for game ${gameId}`);
        console.log("Dice values:", JSON.stringify(diceValues, null, 2));
        // Emit the received dice values to all clients in the game room
        io.to(gameId).emit('receivedDiceValues', diceValues);
      });

    socket.on('playerLeft', ({ gameId, username }: { gameId: string; username: string }) => {
        gameServer.removePlayer(gameId, username)
        const game = gameServer.getGame(gameId)
        console.log(`Spieler ${username} hat das Spiel ${gameId} verlassen`);
        if (game) {
            console.log('game Exists')
            if (game.players.length > 0) {
                console.log('emit player leaved event')
                io.to(gameId).emit('playerDidLeave', username)
                if (gameServer.isCreator(gameId, username)) {
                    game.creator = game.players[0]
                    io.to(gameId).emit('creatorChanged', game)
                }
            } else {
                gameServer.deleteGame(gameId)
            }
        }
        socket.leave(gameId)
    })
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});