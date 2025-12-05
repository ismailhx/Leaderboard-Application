# 🎭 PopularPoser

A real-time multiplayer party game where players submit anonymous responses to prompts and try to win the crowd's votes! Can you become the most popular poser?

## Features

### Core Gameplay
- 🎮 Real-time multiplayer gameplay using WebSockets
- 🎭 Anonymous card submissions
- 🗳️ Live voting system
- 📊 Dynamic leaderboard
- ⏱️ 3-minute timer for each round
- 🏆 10 rounds per game
- 👥 Game Master role for creating prompts
- 😀 72+ fun emoji avatars to choose from

### Game Enhancements
- 🎯 **Achievement System** - Unlock 5 different achievements based on getting votes:
  - 🎯 First Fan: Get your first vote
  - 🔥 Hot Streak: Get votes 3 rounds in a row
  - ⭐ Crowd Pleaser: Get 5+ votes in one round
  - 🏆 Popular Choice: Get the most votes in a round
  - 👑 Unanimous: Get all votes in a round
- 🔊 **Sound Effects** - Satisfying audio feedback for actions
- 📸 **Image Support** - Upload images from computer or use URLs in prompts
- 🎊 **Confetti Effect** - Celebration animation when game ends
- 💬 **Pop-up Notifications** - Real-time feedback for game events
- ✨ **Animated UI** - Fun bouncing, floating, and glowing effects throughout

## Prerequisites

You need to have Node.js installed on your system. If you don't have it:

### Install Node.js on macOS

```bash
# Using Homebrew (recommended)
brew install node

# Or download from https://nodejs.org/
```

## Setup

1. Navigate to the game directory:
```bash
cd multiplayer-card-game
```

2. Install dependencies:
```bash
npm install
```

## Running the Game

1. Start the server:
```bash
npm start
```

2. Open your browser and go to:
```
http://localhost:3000
```

3. Open multiple browser windows/tabs to simulate multiple players
   - Each player selects an emoji and name
   - One player should check "I want to be the Game Master"
   - Game Master starts the game and writes prompts
   - Other players submit responses
   - Everyone votes for their favorite responses
   - Points are awarded based on votes received

## How to Play

### For the Game Master:
1. Join as Game Master (only one GM allowed per game)
2. Click "Start Game" when all players have joined
3. Write a prompt for each round (e.g., "What's the best excuse for being late?")
4. Optionally add an image (upload from computer or paste URL)
5. Watch players submit responses and vote
6. Click "Start Next Round" when ready to continue
7. **Note**: The GM is the host and does not submit cards or vote
8. **Important**: If the GM leaves, the game ends immediately

### For Players:
1. Join with your name and emoji
2. Wait for Game Master to start the game
3. Read the prompt and submit your anonymous response within 3 minutes
4. Vote for your favorite response (you can't vote for your own)
5. See results and earn points based on votes received
6. Repeat for 10 rounds - highest score wins!

## Game Structure

- **10 rounds** per game
- **3-minute timer** for submitting responses
- Points are awarded equal to the number of votes received
- Cards are shuffled for anonymity
- Final leaderboard shows winner

## Files

```
multiplayer-card-game/
├── server.js           # Backend server with game logic
├── package.json        # Dependencies
├── public/
│   ├── index.html     # Join page
│   ├── game.html      # Game interface
│   ├── style.css      # Styling
│   └── client.js      # Client-side logic
└── README.md          # This file
```

## Technology Stack

- **Backend**: Node.js, Express, Socket.io
- **Frontend**: HTML, CSS, Vanilla JavaScript
- **Real-time Communication**: WebSockets via Socket.io

## Port Configuration

Default port is 3000. To use a different port:

```bash
PORT=8080 npm start
```

## Notes

- Game state is stored in memory (resets when server restarts)
- Players are disconnected when they close their browser
- Multiple games cannot run simultaneously on the same server instance
- For production use, consider adding a database and authentication

Enjoy the game! 🎉
