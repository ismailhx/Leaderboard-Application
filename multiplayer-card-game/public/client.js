// Get player info from session storage
const playerName = sessionStorage.getItem('playerName');
const playerEmoji = sessionStorage.getItem('playerEmoji');
const isGM = sessionStorage.getItem('isGM') === 'true';

// Redirect if no player info
if (!playerName || !playerEmoji) {
    window.location.href = '/';
}

// Preload cat GIFs immediately
const catGifs = [
    'https://media.giphy.com/media/JIX9t2j0ZTN9S/giphy.gif',
    'https://media0.giphy.com/media/v1.Y2lkPTZjMDliOTUyY3dtajhodDBubDJrODIxcHExeTk2aTFrdnVnNjlscXh4aTNpa212ayZlcD12MV9naWZzX3NlYXJjaCZjdD1n/In0Lpu4FVivjISX9HT/200w.gif',
    'https://media.tenor.com/qePkAWV7sicAAAAM/funny-cats.gif',
];

catGifs.forEach(url => {
    const img = new Image();
    img.src = url;
});

// Initialize socket connection
const socket = io();

// Game state
let myPlayerId = null;
let currentPhase = 'waiting';
let hasSubmittedCard = false;
let myVotedCardId = null;
let timerInterval = null;

// Game stats and achievements
let playerStats = {
    votesReceived: 0,
    votingStreak: 0,
    maxVotesInRound: 0,
    perfectRounds: 0,
    achievements: []
};

const achievements = [
    { id: 'first_vote', name: 'First Fan', desc: 'Get your first vote', icon: '🎯' },
    { id: 'hot_streak', name: 'Hot Streak!', desc: 'Get votes 3 rounds in a row', icon: '🔥' },
    { id: 'crowd_pleaser', name: 'Crowd Pleaser', desc: 'Get 5+ votes in one round', icon: '⭐' },
    { id: 'popular', name: 'Popular Choice', desc: 'Get the most votes in a round', icon: '🏆' },
    { id: 'unanimous', name: 'Unanimous!', desc: 'Get all votes in a round', icon: '👑' },
];

// Create shared AudioContext for all sounds
let audioContext = null;

// Sound effects using cartoon-style synthesized sounds
const playSound = (type) => {
    try {
        // Create or reuse AudioContext
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        
        // Resume AudioContext if suspended (needed for autoplay policies)
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }
        
        const now = audioContext.currentTime;
        
        switch(type) {
            case 'submit': {
                // Cartoon "boing" sound
                const osc = audioContext.createOscillator();
                const gain = audioContext.createGain();
                osc.connect(gain);
                gain.connect(audioContext.destination);
                
                osc.type = 'sine';
                osc.frequency.setValueAtTime(200, now);
                osc.frequency.exponentialRampToValueAtTime(800, now + 0.05);
                osc.frequency.exponentialRampToValueAtTime(300, now + 0.15);
                
                gain.gain.setValueAtTime(0.15, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
                
                osc.start(now);
                osc.stop(now + 0.2);
                break;
            }
            case 'vote': {
                // Cartoon "bling" sound with shimmer
                const osc1 = audioContext.createOscillator();
                const osc2 = audioContext.createOscillator();
                const osc3 = audioContext.createOscillator();
                const gain = audioContext.createGain();
                
                osc1.connect(gain);
                osc2.connect(gain);
                osc3.connect(gain);
                gain.connect(audioContext.destination);
                
                // Three-note ascending arpeggio
                osc1.type = 'triangle';
                osc2.type = 'triangle';
                osc3.type = 'triangle';
                
                osc1.frequency.value = 659; // E5
                osc2.frequency.value = 784; // G5
                osc3.frequency.value = 988; // B5
                
                gain.gain.setValueAtTime(0.12, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
                
                osc1.start(now);
                osc2.start(now + 0.05);
                osc3.start(now + 0.1);
                
                osc1.stop(now + 0.4);
                osc2.stop(now + 0.45);
                osc3.stop(now + 0.5);
                break;
            }
            case 'achievement': {
                // Cartoon "success" fanfare
                const osc1 = audioContext.createOscillator();
                const osc2 = audioContext.createOscillator();
                const gain = audioContext.createGain();
                
                osc1.connect(gain);
                osc2.connect(gain);
                gain.connect(audioContext.destination);
                
                osc1.type = 'square';
                osc2.type = 'square';
                
                // Triumphant two-note jump
                osc1.frequency.setValueAtTime(523, now); // C5
                osc1.frequency.setValueAtTime(784, now + 0.08); // G5
                osc2.frequency.setValueAtTime(659, now); // E5
                osc2.frequency.setValueAtTime(988, now + 0.08); // B5
                
                gain.gain.setValueAtTime(0.15, now);
                gain.gain.setValueAtTime(0.15, now + 0.08);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
                
                osc1.start(now);
                osc2.start(now);
                osc1.stop(now + 0.3);
                osc2.stop(now + 0.3);
                break;
            }
            case 'win': {
                // Cute, gentle victory jingle (even lower and softer)
                const frequencies = [330, 392, 494, 587]; // E-G-B-D (gentle, low)
                
                frequencies.forEach((freq, i) => {
                    const osc = audioContext.createOscillator();
                    const gain = audioContext.createGain();
                    osc.connect(gain);
                    gain.connect(audioContext.destination);
                    
                    osc.type = 'sine'; // Soft sine wave
                    osc.frequency.value = freq;
                    
                    const startTime = now + (i * 0.15);
                    gain.gain.setValueAtTime(0.08, startTime); // Very quiet
                    gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.4);
                    
                    osc.start(startTime);
                    osc.stop(startTime + 0.4);
                });
                break;
            }
        }
    } catch (e) {
        console.log('Audio not supported');
    }
};

// Cool phrases for narrator
const coolPhrases = [
    "you are doing well my friend, what an absolute bigman you are",
    "legend, you are cooking",
    "wow everybody loves what you have to say my man",
    "incredible stuff buddie, I wish I was cool like you",
    "damn boi, you smashed this round",
    "wowza, people like what you think, you should do ted talks",
    "crazy stuff, you are super popular this round",
    "nice work my friend, keep it up",
    "absolutely killing it out there",
    "the crowd goes wild for you",
    "you're on fire today",
    "stellar performance my friend",
    "slay queen",
    "you beautiful loved specimen"
];

// Global lock to ensure only ONE narration ever happens
let narratorLocked = false;

const narrateRoundWinner = (winnerName, isTie = false) => {
    // HARD STOP - if locked, do nothing
    if (narratorLocked) {
        console.log('Narrator locked, skipping');
        return;
    }
    
    if (!('speechSynthesis' in window)) return;
    
    // LOCK IT IMMEDIATELY
    narratorLocked = true;
    
    // KILL any existing speech HARD
    window.speechSynthesis.cancel();
    
    // Pick ONE phrase
    const phrase = coolPhrases[Math.floor(Math.random() * coolPhrases.length)];
    
    let text;
    if (isTie) {
        // For ties, make it plural
        const pluralPhrase = phrase
            .replace('you are', 'you all are')
            .replace('my friend', 'my friends')
            .replace('my man', 'legends')
            .replace('buddie,', 'buddies,')
            .replace('you think', 'you all think')
            .replace('you have to say', 'you all have to say')
            .replace('you smashed', 'you all smashed')
            .replace('you should do', 'you all should do')
            .replace("you're", "you all are");
        text = `${winnerName}, ${pluralPhrase}`;
    } else {
        text = `${winnerName}, ${phrase}`;
    }
    
    // Create utterance
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.75;
    utterance.pitch = 0.7;
    utterance.volume = 0.95;
    
    // Unlock when done
    utterance.onend = () => {
        narratorLocked = false;
        console.log('Narrator finished, unlocked');
    };
    utterance.onerror = (e) => {
        narratorLocked = false;
        console.log('Narrator error, unlocked', e);
    };
    
    // Get voice
    const voices = window.speechSynthesis.getVoices();
    const deepVoice = voices.find(v => 
        v.name.includes('Fred') || 
        v.name.includes('Bruce') || 
        v.name.includes('Aaron')
    ) || voices.find(v => v.lang === 'en-US');
    
    if (deepVoice) utterance.voice = deepVoice;
    
    // Speak ONCE
    console.log('Speaking:', text);
    window.speechSynthesis.speak(utterance);
    
    // Safety unlock after 10 seconds
    setTimeout(() => {
        if (narratorLocked) {
            console.log('Safety unlock triggered');
            narratorLocked = false;
        }
    }, 10000);
};

const showNotification = (message, type = 'info') => {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #667eea, #764ba2);
        color: white;
        padding: 15px 25px;
        border-radius: 10px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        z-index: 10000;
        animation: slideInRight 0.5s ease, fadeOut 0.5s ease 2.5s;
        font-weight: 600;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
};

const checkAchievement = (id) => {
    if (playerStats.achievements.includes(id)) return;
    
    const achievement = achievements.find(a => a.id === id);
    if (achievement) {
        playerStats.achievements.push(id);
        playSound('achievement');
        showNotification(`${achievement.icon} Achievement Unlocked: ${achievement.name}!`);
        updateAchievements();
    }
};

const updateAchievements = () => {
    const container = document.getElementById('achievements-list');
    container.innerHTML = '';
    
    playerStats.achievements.forEach(id => {
        const achievement = achievements.find(a => a.id === id);
        if (achievement) {
            const div = document.createElement('div');
            div.style.cssText = `
                padding: 8px;
                margin: 5px 0;
                background: linear-gradient(135deg, #ffd700, #ffed4e);
                border-radius: 6px;
                font-weight: 600;
            `;
            div.textContent = `${achievement.icon} ${achievement.name}`;
            container.appendChild(div);
        }
    });
};

// Join the game
socket.emit('player:join', {
    name: playerName,
    emoji: playerEmoji,
    isGM: isGM
});

// Socket event handlers
socket.on('player:joined', (data) => {
    myPlayerId = data.playerId;
    
    if (data.isGM) {
        document.getElementById('start-game-btn').style.display = 'block';
    }
});

socket.on('players:update', (players) => {
    updatePlayersList(players);
    updateLeaderboard(players);
});

socket.on('game:state', (state) => {
    currentPhase = state.phase;
    showPhase(state.phase);
    
    // Hide start button once game has started
    if (state.phase !== 'waiting' && isGM) {
        document.getElementById('start-game-btn').style.display = 'none';
    }
    
    if (state.phase === 'prompt' && state.gameMaster === myPlayerId) {
        document.getElementById('prompt-round').textContent = state.currentRound;
    }
    
    if (state.currentRound > 0) {
        document.getElementById('round-display').textContent = 
            `Round ${state.currentRound} / ${state.maxRounds}`;
    }
});

socket.on('phase:writing', (data) => {
    currentPhase = 'writing';
    hasSubmittedCard = false;
    playerStats.submitTime = Date.now();
    document.getElementById('writing-prompt-display').textContent = data.prompt;
    document.getElementById('card-input').value = '';
    document.getElementById('submit-card-btn').disabled = false;
    
    // Handle image if provided
    const imageContainer = document.getElementById('prompt-image-container');
    const imageElem = document.getElementById('prompt-image');
    if (data.imageUrl && data.imageUrl.trim()) {
        imageElem.src = data.imageUrl;
        imageContainer.style.display = 'block';
    } else {
        imageContainer.style.display = 'none';
    }
    
    showPhase('writing');
    startTimer(data.timerEndTime);
});

socket.on('cards:submitted', (data) => {
    document.getElementById('submission-status').textContent = 
        `${data.count} / ${data.total} players have submitted`;
});

socket.on('phase:voting', (data) => {
    currentPhase = 'voting';
    myVotedCardId = null;
    stopTimer();
    showPhase('voting');
    displayCards(data.cards);
});

socket.on('votes:update', (voteCounts) => {
    updateVoteCounts(voteCounts);
});

socket.on('phase:results', (data) => {
    currentPhase = 'results';
    showPhase('results');
    displayResults(data.results);
    updateLeaderboard(data.leaderboard);
    
    // Find and announce the round winner(s) - handle ties
    if (data.results.length > 0) {
        const sortedResults = [...data.results].sort((a, b) => b.votes - a.votes);
        const topVotes = sortedResults[0].votes;
        
        console.log('=== NARRATOR CALL CHECK ===');
        console.log('Results:', data.results);
        console.log('Top votes:', topVotes);
        
        // Only narrate if winner(s) have at least 1 vote
        if (topVotes > 0) {
            // Find all players with the top vote count (ties)
            const winners = sortedResults.filter(r => r.votes === topVotes);
            
            console.log('Winners:', winners);
            
            if (winners.length > 1) {
                // It's a tie - announce all winners
                const names = winners.map(w => w.playerName).join(' and ');
                console.log('Calling narrateRoundWinner for TIE:', names);
                narrateRoundWinner(names, true); // Pass true for tie
            } else {
                // Single winner
                console.log('Calling narrateRoundWinner for SINGLE winner:', winners[0].playerName);
                narrateRoundWinner(winners[0].playerName, false);
            }
        }
    }
    
    // Show next round button for GM
    if (isGM) {
        document.getElementById('next-round-btn').style.display = 'block';
    }
    
    // Check achievements for player
    const myResult = data.results.find(r => r.playerId === myPlayerId);
    if (myResult) {
        const votes = myResult.votes;
        playerStats.votesReceived += votes;
        
        // First vote achievement
        if (votes > 0 && playerStats.votesReceived === votes) {
            checkAchievement('first_vote');
        }
        
        // Crowd pleaser
        if (votes >= 5) {
            checkAchievement('crowd_pleaser');
        }
        
        // Track streak
        if (votes > 0) {
            playerStats.votingStreak++;
            if (playerStats.votingStreak >= 3) {
                checkAchievement('hot_streak');
            }
        } else {
            playerStats.votingStreak = 0;
        }
        
        // Check unanimous
        const totalPlayers = data.leaderboard.length;
        if (votes === totalPlayers) {
            checkAchievement('unanimous');
        }
        
        // Check if player got the most votes this round
        const maxVotes = Math.max(...data.results.map(r => r.votes));
        if (votes > 0 && votes === maxVotes) {
            checkAchievement('popular');
        }
        
        // Show bonus points notification
        if (votes > 0) {
            setTimeout(() => {
                showNotification(`🎉 You earned ${votes} point${votes > 1 ? 's' : ''}!`);
            }, 500);
        }
    }
});

socket.on('game:ended', (data) => {
    currentPhase = 'ended';
    showPhase('ended');
    displayWinner(data.winner);
    displayDancingCats();
    displayFinalLeaderboard(data.leaderboard);
    
    // Always play win sound and confetti when game ends
    playSound('win');
    createConfetti();
    
    // Create MORE confetti for the end screen
    setTimeout(() => createConfetti(), 500);
    setTimeout(() => createConfetti(), 1000);
    
    // If GM left, show notification after a delay
    if (data.reason) {
        setTimeout(() => {
            showNotification('⚠️ ' + data.reason);
        }, 1000);
    }
});

socket.on('game:reset', (data) => {
    // GM left - redirect all players back to lobby
    alert(data.message + ' - Returning to lobby...');
    socket.disconnect();
    sessionStorage.clear();
    window.location.href = '/';
});

const createConfetti = () => {
    const colors = ['#667eea', '#764ba2', '#f093fb', '#ffd700', '#ff6b6b', '#4ecdc4'];
    
    for (let i = 0; i < 50; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            confetti.style.cssText = `
                position: fixed;
                width: 10px;
                height: 10px;
                background: ${colors[Math.floor(Math.random() * colors.length)]};
                top: -10px;
                left: ${Math.random() * 100}%;
                z-index: 9999;
                border-radius: 50%;
                animation: confettiFall ${2 + Math.random() * 2}s linear;
            `;
            document.body.appendChild(confetti);
            setTimeout(() => confetti.remove(), 4000);
        }, i * 30);
    }
};

const displayDancingCats = () => {
    const container = document.getElementById('dancing-cats');
    
    container.innerHTML = '';
    
    // Add 3 dancing cats with error handling
    catGifs.forEach((gifUrl, index) => {
        const catDiv = document.createElement('div');
        catDiv.style.cssText = `
            animation: bounce ${0.5 + index * 0.1}s ease-in-out infinite alternate;
        `;
        
const img = document.createElement('img');
        img.src = gifUrl;
        img.style.cssText = 'width: 150px; height: 150px; border-radius: 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.3); object-fit: cover;';
        img.alt = 'Dancing cat';
        
        // Add error handler to show fallback if GIF fails to load
        img.onerror = () => {
            console.log('GIF failed to load:', gifUrl);
            img.src = 'https://via.placeholder.com/150/667eea/ffffff?text=Cat+' + (index + 1);
        };
        
        catDiv.appendChild(img);
        container.appendChild(catDiv);
    });
};

// Handle game errors
socket.on('game:error', (data) => {
    showNotification('⚠️ ' + data.message);
});

// Button handlers
document.getElementById('start-game-btn').addEventListener('click', () => {
    socket.emit('game:start');
});

// Handle image file upload
let uploadedImageData = null;
document.getElementById('prompt-image-file').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            uploadedImageData = event.target.result;
            // Show preview
            const preview = document.getElementById('image-preview');
            preview.innerHTML = `<img src="${uploadedImageData}" style="max-width: 200px; max-height: 200px; border-radius: 8px; box-shadow: 0 5px 15px rgba(0,0,0,0.2);" />`;
        };
        reader.readAsDataURL(file);
    }
});

document.getElementById('submit-prompt-btn').addEventListener('click', () => {
    const prompt = document.getElementById('prompt-input').value.trim();
    const imageUrl = document.getElementById('prompt-image-url').value.trim();
    const imageData = uploadedImageData || imageUrl;
    
    if (prompt) {
        socket.emit('prompt:submit', { prompt, imageUrl: imageData });
        document.getElementById('prompt-input').value = '';
        document.getElementById('prompt-image-url').value = '';
        document.getElementById('prompt-image-file').value = '';
        document.getElementById('image-preview').innerHTML = '';
        uploadedImageData = null;
    }
});

document.getElementById('submit-card-btn').addEventListener('click', () => {
    const text = document.getElementById('card-input').value.trim();
    if (text && !hasSubmittedCard) {
        socket.emit('card:submit', { text });
        hasSubmittedCard = true;
        document.getElementById('submit-card-btn').disabled = true;
        document.getElementById('card-input').disabled = true;
        document.getElementById('submission-status').textContent = 
            'Response submitted! Waiting for other players...';
        
        playSound('submit');
        showNotification('✅ Card submitted!');
    }
});

document.getElementById('next-round-btn').addEventListener('click', () => {
    socket.emit('round:next');
    document.getElementById('next-round-btn').style.display = 'none';
});

document.getElementById('exit-game-btn').addEventListener('click', () => {
    if (confirm('Are you sure you want to exit the game?')) {
        socket.disconnect();
        sessionStorage.clear();
        window.location.href = '/';
    }
});

document.getElementById('play-again-btn').addEventListener('click', () => {
    socket.disconnect();
    sessionStorage.clear();
    window.location.href = '/';
});

// UI update functions
function showPhase(phase) {
    const phases = ['waiting', 'prompt', 'writing', 'voting', 'results', 'ended'];
    phases.forEach(p => {
        const elem = document.getElementById(`${p}-phase`);
        if (elem) {
            elem.style.display = 'none';
        }
    });
    
    if (phase === 'prompt' && isGM) {
        document.getElementById('prompt-phase').style.display = 'flex';
    } else if (phase === 'writing' && !isGM) {
        // Only non-GM players can write
        document.getElementById('writing-phase').style.display = 'flex';
        document.getElementById('card-input').disabled = false;
    } else if (phase === 'writing' && isGM) {
        // GM waits during writing phase
        document.getElementById('waiting-phase').style.display = 'flex';
        document.querySelector('#waiting-phase h2').textContent = 
            'Waiting for players to submit their responses...';
    } else if (phase === 'voting' && isGM) {
        // GM waits during voting phase
        document.getElementById('waiting-phase').style.display = 'flex';
        document.querySelector('#waiting-phase h2').textContent = 
            'Waiting for players to vote...';
    } else if (phase === 'prompt' && !isGM) {
        document.getElementById('waiting-phase').style.display = 'flex';
        document.querySelector('#waiting-phase h2').textContent = 
            'Waiting for Game Master to write a prompt...';
    } else {
        const phaseElem = document.getElementById(`${phase}-phase`);
        if (phaseElem) {
            phaseElem.style.display = 'flex';
        }
    }
}

function updatePlayersList(players) {
    const container = document.getElementById('players-list');
    container.innerHTML = '';
    
    players.forEach(player => {
        const div = document.createElement('div');
        div.className = 'player-item';
        div.innerHTML = `
            <span class="player-emoji">${player.emoji}</span>
            <span class="player-name">${player.name}</span>
            ${player.isGM ? '<span class="player-badge">GM</span>' : ''}
        `;
        container.appendChild(div);
    });
}

function updateLeaderboard(players) {
    const container = document.getElementById('leaderboard');
    container.innerHTML = '';
    
    const sorted = [...players].sort((a, b) => b.points - a.points);
    
    // Find the top score to check for ties
    const topScore = sorted.length > 0 ? sorted[0].points : 0;
    
    sorted.forEach((player, index) => {
        const div = document.createElement('div');
        div.className = 'leaderboard-item';
        div.innerHTML = `
            <span class="leaderboard-emoji">${player.emoji}</span>
            <span class="leaderboard-name">${player.name}</span>
            <span class="leaderboard-points">${player.points}</span>
        `;
        // Highlight ALL players with the top score (in case of tie)
        if (player.points === topScore && player.points > 0) {
            div.style.background = 'linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)';
        }
        container.appendChild(div);
    });
}

function displayCards(cards) {
    const container = document.getElementById('cards-grid');
    container.innerHTML = '';
    
    cards.forEach(card => {
        const div = document.createElement('div');
        div.className = 'card-item';
        div.dataset.cardId = card.id;
        
        // Don't allow voting for own card
        const isMyCard = card.id === myPlayerId;
        if (isMyCard) {
            div.style.cursor = 'not-allowed';
            div.style.opacity = '0.7';
            div.style.border = '3px solid #ffd700';
        }
        
        div.innerHTML = `
            ${isMyCard ? '<div style="background: #ffd700; color: #333; padding: 5px 10px; border-radius: 5px; font-weight: 700; margin-bottom: 10px; text-align: center;">⭐ YOUR CARD ⭐</div>' : ''}
            <div class="card-text">${card.text}</div>
            <div class="card-votes">
                <span class="vote-count" data-card-id="${card.id}">0 votes</span>
            </div>
        `;
        
        if (card.id !== myPlayerId) {
            div.addEventListener('click', () => voteForCard(card.id));
        }
        
        container.appendChild(div);
    });
}

function voteForCard(cardId) {
    if (cardId === myPlayerId) return;
    
    socket.emit('vote:cast', { cardId });
    myVotedCardId = cardId;
    
    // Update UI
    document.querySelectorAll('.card-item').forEach(card => {
        card.classList.remove('voted');
    });
    document.querySelector(`[data-card-id="${cardId}"]`).parentElement.classList.add('voted');
    
    playSound('vote');
    showNotification('⭐ Vote cast!');
}

function updateVoteCounts(voteCounts) {
    Object.entries(voteCounts).forEach(([cardId, count]) => {
        const voteElem = document.querySelector(`.vote-count[data-card-id="${cardId}"]`);
        if (voteElem) {
            voteElem.textContent = `${count} vote${count !== 1 ? 's' : ''}`;
        }
    });
}

function displayResults(results) {
    const container = document.getElementById('results-display');
    container.innerHTML = '';
    
    if (results.length === 0) {
        container.innerHTML = '<p>No cards were submitted this round.</p>';
        return;
    }
    
    const sorted = [...results].sort((a, b) => b.votes - a.votes);
    
    sorted.forEach(result => {
        const div = document.createElement('div');
        div.className = 'result-card';
        div.innerHTML = `
            <div class="result-player">
                <span class="result-emoji">${result.playerEmoji}</span>
                <div>
                    <div style="font-weight: 600;">${result.playerName}</div>
                    <div style="font-size: 0.9em; opacity: 0.9; margin-top: 5px;">"${result.cardText}"</div>
                </div>
            </div>
            <div class="result-votes">+${result.votes} pts</div>
        `;
        container.appendChild(div);
    });
}

function displayWinner(winner) {
    console.log('=== DISPLAY WINNER DEBUG ===');
    console.log('Winner data:', winner);
    console.log('Is array?', Array.isArray(winner));
    console.log('Winner type:', typeof winner);
    
    const container = document.getElementById('winner-display');
    container.style.cssText = `
        text-align: center;
        padding: 40px 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 20px;
        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        margin: 20px;
    `;
    
    // Winner can be array (tie), single player, or null
    if (Array.isArray(winner)) {
        // Multiple tied winners - show each with their emoji
        const winnersHTML = winner.map(w => 
            `<div style="font-size: 4em; margin: 10px 0; animation: spinGrow 2s ease-in-out infinite;">${w.emoji}</div>
             <div style="font-size: 2em; font-weight: 700; color: white; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);">${w.name}</div>`
        ).join('<div style="font-size: 2em; color: #ffd700; margin: 10px 0;">&</div>');
        
        container.innerHTML = `
            <div style="font-size: 5em; margin-bottom: 20px; animation: bounce 1s ease-in-out infinite;">🏆</div>
            <div style="font-size: 3em; font-weight: 800; color: #ffd700; text-shadow: 3px 3px 6px rgba(0,0,0,0.3); margin-bottom: 20px;">It's a Tie!</div>
            ${winnersHTML}
            <div style="font-size: 2.5em; font-weight: 700; background: linear-gradient(135deg, #ffd700, #ffed4e); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-top: 25px;">🎭 The PopularPosers! 🎭</div>
            <div style="font-size: 1.5em; color: white; margin-top: 20px; font-weight: 600;">${winner[0].points} points each</div>
        `;
    } else if (!winner) {
        container.innerHTML = `
            <div style="font-size: 5em; margin-bottom: 20px; animation: bounce 1s ease-in-out infinite;">🏆</div>
            <div style="font-size: 2em; font-weight: 700; color: white;">🎭 No Winner 🎭</div>
        `;
    } else {
        container.innerHTML = `
            <div style="font-size: 5em; margin-bottom: 20px; animation: bounce 1s ease-in-out infinite;">🏆</div>
            <div style="font-size: 6em; margin: 20px 0; animation: spinGrow 2s ease-in-out infinite;">${winner.emoji}</div>
            <div style="font-size: 3em; font-weight: 800; color: white; text-shadow: 3px 3px 6px rgba(0,0,0,0.3); margin-bottom: 15px;">${winner.name}</div>
            <div style="font-size: 2.5em; font-weight: 700; background: linear-gradient(135deg, #ffd700, #ffed4e); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-top: 15px;">🎭 The PopularPoser! 🎭</div>
            <div style="font-size: 1.5em; color: white; margin-top: 20px; font-weight: 600;">${winner.points} points</div>
        `;
    }
}

function displayFinalLeaderboard(players) {
    const container = document.getElementById('final-leaderboard');
    container.innerHTML = '<h3 style="margin-bottom: 25px; font-size: 1.8em; text-align: center; color: #667eea;">🏆 Final Leaderboard 🏆</h3>';
    
    // Find top score and all tied winners
    const topScore = players.length > 0 ? players[0].points : 0;
    const topWinners = players.filter(p => p.points === topScore && topScore > 0);
    const isTieForFirst = topWinners.length > 1;
    
    players.forEach((player, index) => {
        const div = document.createElement('div');
        div.className = 'result-card';
        
        // Check if this player is tied for first
        const isTiedWinner = player.points === topScore && topScore > 0;
        
        // Special styling - all tied winners get gold
        if (isTiedWinner) {
            div.style.background = 'linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)';
            div.style.border = '3px solid #ffa500';
            div.style.transform = 'scale(1.05)';
        } else if (index === topWinners.length) {
            // First non-winner gets silver (2nd place or tied for 2nd)
            div.style.background = 'linear-gradient(135deg, #c0c0c0 0%, #e8e8e8 100%)';
            div.style.border = '3px solid #a0a0a0';
        } else if (index === topWinners.length + 1) {
            // Next gets bronze (3rd place or tied for 3rd)
            div.style.background = 'linear-gradient(135deg, #cd7f32 0%, #e8a87c 100%)';
            div.style.border = '3px solid #b87333';
        } else {
            div.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        }
        
        // Medal logic - all tied winners get gold medal
        let medal = '';
        if (isTiedWinner) {
            medal = '🥇';
        } else if (index === topWinners.length) {
            medal = '🥈';
        } else if (index === topWinners.length + 1) {
            medal = '🥉';
        }
        
        div.innerHTML = `
            <div class="result-player">
                <span style="font-size: 2em; min-width: 50px;">${medal || `${index + 1}.`}</span>
                <span class="result-emoji" style="font-size: 2em;">${player.emoji}</span>
                <span style="font-size: 1.2em; font-weight: 600;">${player.name}</span>
            </div>
            <div class="result-votes" style="font-size: 1.5em;">${player.points} pts</div>
        `;
        container.appendChild(div);
    });
}

function startTimer(endTime) {
    stopTimer();
    
    timerInterval = setInterval(() => {
        const remaining = Math.max(0, endTime - Date.now());
        const minutes = Math.floor(remaining / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);
        
        document.getElementById('timer').textContent = 
            `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        if (remaining <= 0) {
            stopTimer();
        }
    }, 100);
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    document.getElementById('timer').textContent = '';
}
