const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static(path.join(__dirname, 'public')));

// Game state
const gameState = {
  players: {},
  gameMaster: null,
  currentRound: 0,
  maxRounds: 10,
  phase: 'waiting', // waiting, prompt, writing, voting, results, ended
  currentPrompt: '',
  currentImageUrl: '',
  cards: {},
  votes: {},
  timer: null,
  timerEndTime: null
};

// Helper functions
function getPlayersList() {
  return Object.values(gameState.players).map(p => ({
    id: p.id,
    name: p.name,
    emoji: p.emoji,
    points: p.points,
    isGM: p.isGM
  }));
}

function broadcastGameState() {
  io.emit('game:state', {
    phase: gameState.phase,
    currentRound: gameState.currentRound,
    maxRounds: gameState.maxRounds,
    currentPrompt: gameState.currentPrompt,
    players: getPlayersList(),
    gameMaster: gameState.gameMaster
  });
}

function startWritingPhase() {
  gameState.phase = 'writing';
  gameState.cards = {};
  gameState.votes = {};
  gameState.timerEndTime = Date.now() + 180000; // 3 minutes
  
  io.emit('phase:writing', {
    prompt: gameState.currentPrompt,
    imageUrl: gameState.currentImageUrl,
    timerEndTime: gameState.timerEndTime
  });
  
  // Auto-advance after 3 minutes
  if (gameState.timer) clearTimeout(gameState.timer);
  gameState.timer = setTimeout(() => {
    startVotingPhase();
  }, 180000);
}

function startVotingPhase() {
  if (gameState.timer) clearTimeout(gameState.timer);
  gameState.phase = 'voting';
  
  // Prepare cards (shuffle for anonymity)
  const cardsList = Object.entries(gameState.cards).map(([playerId, text]) => ({
    id: playerId,
    text: text
  }));
  
  // Shuffle cards
  for (let i = cardsList.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cardsList[i], cardsList[j]] = [cardsList[j], cardsList[i]];
  }
  
  io.emit('phase:voting', {
    cards: cardsList
  });
}

function endRound() {
  gameState.phase = 'results';
  
  // Calculate points
  const results = {};
  Object.entries(gameState.votes).forEach(([cardId, voters]) => {
    const points = voters.length;
    if (gameState.players[cardId]) {
      gameState.players[cardId].points += points;
      results[cardId] = {
        playerId: cardId,
        playerName: gameState.players[cardId].name,
        playerEmoji: gameState.players[cardId].emoji,
        cardText: gameState.cards[cardId],
        votes: points
      };
    }
  });
  
  io.emit('phase:results', {
    results: Object.values(results),
    leaderboard: getPlayersList().sort((a, b) => b.points - a.points)
  });
  
  // Check if game is over
  if (gameState.currentRound >= gameState.maxRounds) {
    setTimeout(() => {
      endGame();
    }, 5000);
  }
  // GM will manually advance to next round
}

function endGame() {
  gameState.phase = 'ended';
  const leaderboard = getPlayersList().sort((a, b) => b.points - a.points);
  
  // Check for tie at the top
  const topScore = leaderboard.length > 0 ? leaderboard[0].points : 0;
  const topWinners = leaderboard.filter(p => p.points === topScore && topScore > 0);
  
  // If multiple winners, send array. If single winner, send that winner.
  const winner = topWinners.length > 1 ? topWinners : (topWinners.length === 1 ? topWinners[0] : null);
  
  console.log('=== END GAME DEBUG ===');
  console.log('Top score:', topScore);
  console.log('Top winners:', topWinners);
  console.log('Winner to send:', winner);
  console.log('Is winner array?', Array.isArray(winner));
  
  io.emit('game:ended', {
    leaderboard: leaderboard,
    winner: winner
  });
}

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('New connection:', socket.id);
  
  // Check if GM exists
  socket.on('gm:check', () => {
    socket.emit('gm:status', { hasGM: gameState.gameMaster !== null });
  });
  
  // Player joins
  socket.on('player:join', (data) => {
    gameState.players[socket.id] = {
      id: socket.id,
      name: data.name,
      emoji: data.emoji,
      points: 0,
      isGM: data.isGM || false
    };
    
    // Only allow GM if none exists
    if (data.isGM && gameState.gameMaster === null) {
      gameState.gameMaster = socket.id;
      gameState.players[socket.id].isGM = true;
    } else if (data.isGM && gameState.gameMaster !== null) {
      // Someone tried to be GM but position is taken
      gameState.players[socket.id].isGM = false;
    }
    
    socket.emit('player:joined', {
      playerId: socket.id,
      isGM: gameState.players[socket.id].isGM
    });
    
    // Broadcast GM status to all clients
    io.emit('gm:status', { hasGM: gameState.gameMaster !== null });
    io.emit('players:update', getPlayersList());
    broadcastGameState();
    
    // If game is in progress, sync the new player to current phase
    if (gameState.phase === 'writing') {
      socket.emit('phase:writing', {
        prompt: gameState.currentPrompt,
        imageUrl: gameState.currentImageUrl,
        timerEndTime: gameState.timerEndTime
      });
    } else if (gameState.phase === 'voting') {
      // Send current cards to new player
      const cardsList = Object.entries(gameState.cards).map(([playerId, text]) => ({
        id: playerId,
        text: text
      }));
      // Shuffle for the new player
      for (let i = cardsList.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [cardsList[i], cardsList[j]] = [cardsList[j], cardsList[i]];
      }
      socket.emit('phase:voting', { cards: cardsList });
      
      // Send current vote counts
      const voteCounts = {};
      Object.entries(gameState.votes).forEach(([cardId, voters]) => {
        voteCounts[cardId] = voters.length;
      });
      socket.emit('votes:update', voteCounts);
    } else if (gameState.phase === 'results') {
      // Send current results
      const results = {};
      Object.entries(gameState.votes).forEach(([cardId, voters]) => {
        const points = voters.length;
        if (gameState.players[cardId]) {
          results[cardId] = {
            playerId: cardId,
            playerName: gameState.players[cardId].name,
            playerEmoji: gameState.players[cardId].emoji,
            cardText: gameState.cards[cardId],
            votes: points
          };
        }
      });
      socket.emit('phase:results', {
        results: Object.values(results),
        leaderboard: getPlayersList().sort((a, b) => b.points - a.points)
      });
    }
  });
  
  // GM starts game
  socket.on('game:start', () => {
    if (socket.id === gameState.gameMaster && gameState.phase === 'waiting') {
      // Check if there are at least 2 non-GM players
      const nonGMPlayers = Object.keys(gameState.players).filter(id => id !== gameState.gameMaster);
      if (nonGMPlayers.length < 2) {
        socket.emit('game:error', { message: 'Need at least 2 players (not including Game Master) to start!' });
        return;
      }
      
      gameState.currentRound = 1;
      gameState.phase = 'prompt';
      broadcastGameState();
    }
  });
  
  // GM submits prompt
  socket.on('prompt:submit', (data) => {
    if (socket.id === gameState.gameMaster && gameState.phase === 'prompt') {
      gameState.currentPrompt = data.prompt;
      gameState.currentImageUrl = data.imageUrl || '';
      startWritingPhase();
    }
  });
  
  // Player submits card
  socket.on('card:submit', (data) => {
    if (gameState.phase === 'writing' && socket.id !== gameState.gameMaster) {
      gameState.cards[socket.id] = data.text;
      
      // Check if all non-GM players have submitted
      const nonGMPlayers = Object.keys(gameState.players).filter(id => id !== gameState.gameMaster);
      const submittedCount = Object.keys(gameState.cards).length;
      
      // Broadcast submission count
      io.emit('cards:submitted', {
        count: submittedCount,
        total: nonGMPlayers.length
      });
      
      if (submittedCount === nonGMPlayers.length) {
        startVotingPhase();
      }
    }
  });
  
  // Player votes
  socket.on('vote:cast', (data) => {
    if (gameState.phase === 'voting' && data.cardId !== socket.id && socket.id !== gameState.gameMaster) {
      // Remove previous vote if exists
      Object.keys(gameState.votes).forEach(cardId => {
        if (gameState.votes[cardId]) {
          gameState.votes[cardId] = gameState.votes[cardId].filter(voterId => voterId !== socket.id);
        }
      });
      
      // Add new vote
      if (!gameState.votes[data.cardId]) {
        gameState.votes[data.cardId] = [];
      }
      gameState.votes[data.cardId].push(socket.id);
      
      // Broadcast vote counts
      const voteCounts = {};
      Object.entries(gameState.votes).forEach(([cardId, voters]) => {
        voteCounts[cardId] = voters.length;
      });
      
      io.emit('votes:update', voteCounts);
      
      // Check if all non-GM players have voted
      const nonGMPlayers = Object.keys(gameState.players).filter(id => id !== gameState.gameMaster);
      const totalVotes = Object.values(gameState.votes).flat().length;
      
      if (totalVotes === nonGMPlayers.length) {
        endRound();
      }
    }
  });
  
  // GM advances to next round
  socket.on('round:next', () => {
    if (socket.id === gameState.gameMaster && gameState.phase === 'results') {
      gameState.currentRound++;
      gameState.phase = 'prompt';
      broadcastGameState();
    }
  });
  
  // Player disconnects
  socket.on('disconnect', () => {
    console.log('Disconnected:', socket.id);
    
    if (gameState.players[socket.id]) {
      const wasGM = gameState.players[socket.id].isGM;
      
      if (wasGM) {
        // GM left
        gameState.gameMaster = null;
        
        if (gameState.phase === 'ended') {
          // Game ended naturally - GM exiting from end screen resets everything
          gameState.currentRound = 0;
          gameState.phase = 'waiting';
          gameState.currentPrompt = '';
          gameState.currentImageUrl = '';
          gameState.cards = {};
          gameState.votes = {};
          gameState.timer = null;
          gameState.timerEndTime = null;
          
          // Reset all player points
          Object.keys(gameState.players).forEach(playerId => {
            gameState.players[playerId].points = 0;
          });
          
          delete gameState.players[socket.id];
          
          io.emit('game:reset', {
            message: 'Game Master left - starting new game'
          });
        } else if (gameState.phase !== 'waiting') {
          // GM left mid-game - show leaderboard then reset after 60s
          const leaderboard = getPlayersList().sort((a, b) => b.points - a.points);
          const topScore = leaderboard.length > 0 ? leaderboard[0].points : 0;
          const topWinners = leaderboard.filter(p => p.points === topScore && topScore > 0);
          const winner = topWinners.length > 1 ? topWinners : (topWinners.length === 1 ? topWinners[0] : null);
          
          gameState.phase = 'ended';
          io.emit('game:ended', {
            leaderboard: leaderboard,
            winner: winner,
            reason: 'Game Master left - game will reset in 60 seconds'
          });
          
          delete gameState.players[socket.id];
          
          // Reset after 60 seconds
          setTimeout(() => {
            gameState.currentRound = 0;
            gameState.phase = 'waiting';
            gameState.currentPrompt = '';
            gameState.currentImageUrl = '';
            gameState.cards = {};
            gameState.votes = {};
            gameState.timer = null;
            gameState.timerEndTime = null;
            
            Object.keys(gameState.players).forEach(playerId => {
              gameState.players[playerId].points = 0;
            });
            
            io.emit('game:reset', {
              message: 'New game starting!'
            });
            io.emit('gm:status', { hasGM: false });
            io.emit('players:update', getPlayersList());
            broadcastGameState();
          }, 60000);
        } else {
          // GM left from waiting room
          delete gameState.players[socket.id];
        }
        
        io.emit('gm:status', { hasGM: false });
        io.emit('players:update', getPlayersList());
        if (gameState.phase !== 'ended') {
          broadcastGameState();
        }
      } else {
        // Regular player left - they just leave, game continues
        delete gameState.players[socket.id];
        io.emit('players:update', getPlayersList());
        // Don't broadcast game state - game continues for others
      }
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
