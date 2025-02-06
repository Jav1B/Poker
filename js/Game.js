class Game {
    constructor() {
        this.deck = new Deck();
        this.players = [];
        this.communityCards = [];
        this.pot = 0;
        this.currentPlayer = 0;
        this.currentBet = 0;
        this.gameContainer = document.querySelector('.game-container');
        this.communityCardsElement = document.querySelector('.community-cards');
        this.potElement = document.querySelector('.pot');
        this.playersContainer = document.querySelector('.players-container');
        this.setupControls();
        this.initializePlayers();
        this.gameStage = 'pre-flop'; // pre-flop, flop, turn, river, showdown
        this.dealerIndex = 0;
        this.smallBlind = 10;
        this.bigBlind = 20;
        this.minRaise = this.bigBlind;
        this.winners = [];
        this.humanPlayerIndex = 0; // Bottom position is the human player
        this.soundManager = new SoundManager();
        this.setupSoundControls();
    }

    setupControls() {
        document.getElementById('fold-btn').addEventListener('click', () => this.handleFold());
        document.getElementById('call-btn').addEventListener('click', () => this.handleCall());
        document.getElementById('raise-btn').addEventListener('click', () => this.handleRaise());
        
        const raiseSlider = document.getElementById('raise-slider');
        raiseSlider.addEventListener('input', (e) => {
            document.getElementById('raise-amount').textContent = `$${e.target.value}`;
        });
        // Update raise slider min/max
        raiseSlider.min = this.bigBlind;
        raiseSlider.max = Math.max(...this.players.map(p => p.chips));
        raiseSlider.value = this.bigBlind;
    }

    setupSoundControls() {
        const controls = document.querySelector('.controls');
        
        const soundControls = document.createElement('div');
        soundControls.className = 'sound-controls';
        soundControls.innerHTML = `
            <button id="sound-toggle" class="action-btn">
                <span class="sound-on">🔊</span>
                <span class="sound-off" style="display: none">🔇</span>
            </button>
            <input type="range" id="volume-slider" min="0" max="100" value="50">
        `;
        
        controls.appendChild(soundControls);

        const soundToggle = document.getElementById('sound-toggle');
        const volumeSlider = document.getElementById('volume-slider');

        soundToggle.addEventListener('click', () => {
            const soundOn = soundToggle.querySelector('.sound-on');
            const soundOff = soundToggle.querySelector('.sound-off');
            
            if (soundOn.style.display !== 'none') {
                this.soundManager.mute();
                soundOn.style.display = 'none';
                soundOff.style.display = 'inline';
            } else {
                this.soundManager.unmute();
                soundOn.style.display = 'inline';
                soundOff.style.display = 'none';
            }
        });

        volumeSlider.addEventListener('input', (e) => {
            this.soundManager.setVolume(e.target.value / 100);
        });
    }

    initializePlayers() {
        const positions = [
            { x: 50, y: 90 },  // bottom (human player)
            { x: 10, y: 60 },  // bottom left
            { x: 10, y: 30 },  // top left
            { x: 50, y: 10 },  // top
            { x: 90, y: 30 },  // top right
            { x: 90, y: 60 }   // bottom right
        ];

        for (let i = 0; i < 6; i++) {
            const isHuman = i === this.humanPlayerIndex;
            const player = new Player(
                isHuman ? 'You' : `Player ${i + 1}`,
                1000,
                positions[i],
                isHuman
            );
            this.players.push(player);
            this.playersContainer.appendChild(player.element);
        }
    }

    startGame() {
        this.resetGame();
        this.dealerIndex = (this.dealerIndex + 1) % this.players.length;
        this.postBlinds();
        this.dealInitialCards();
        this.currentPlayer = (this.dealerIndex + 3) % this.players.length; // Start with player after big blind
        this.updateUI();
    }

    resetGame() {
        this.deck = new Deck();
        this.communityCards = [];
        this.pot = 0;
        this.currentBet = 0;
        this.communityCardsElement.innerHTML = '';
        this.players.forEach(player => player.reset());
        this.updateUI();
    }

    dealInitialCards() {
        // Deal cards with animation delay
        let dealDelay = 0;
        for (let i = 0; i < 2; i++) {
            this.players.forEach((player, index) => {
                if (!player.folded) {
                    setTimeout(() => {
                        this.soundManager.play('dealCard');
                        player.receiveCard(this.deck.deal());
                    }, dealDelay);
                    dealDelay += 200;
                }
            });
        }
    }

    dealCommunityCards(count) {
        let dealDelay = 0;
        for (let i = 0; i < count; i++) {
            setTimeout(() => {
                this.soundManager.play('dealCard');
                const card = this.deck.deal();
                card.element.classList.add('dealing');
                this.communityCards.push(card);
                this.communityCardsElement.appendChild(card.element);
                setTimeout(() => card.element.classList.remove('dealing'), 500);
            }, dealDelay);
            dealDelay += 200;
        }
    }

    postBlinds() {
        const sbIndex = (this.dealerIndex + 1) % this.players.length;
        const bbIndex = (this.dealerIndex + 2) % this.players.length;
        
        this.players[sbIndex].placeBet(this.smallBlind);
        this.players[bbIndex].placeBet(this.bigBlind);
        this.pot = this.smallBlind + this.bigBlind;
        this.currentBet = this.bigBlind;
    }

    nextStage() {
        const stages = ['pre-flop', 'flop', 'turn', 'river', 'showdown'];
        const currentIndex = stages.indexOf(this.gameStage);
        
        if (currentIndex < stages.length - 1) {
            this.gameStage = stages[currentIndex + 1];
            this.currentBet = 0;
            this.players.forEach(player => player.bet = 0);
            
            switch (this.gameStage) {
                case 'flop':
                    this.dealCommunityCards(3);
                    break;
                case 'turn':
                case 'river':
                    this.dealCommunityCards(1);
                    break;
                case 'showdown':
                    this.determineWinner();
                    break;
            }
            
            if (this.gameStage !== 'showdown') {
                this.currentPlayer = (this.dealerIndex + 1) % this.players.length;
                while (this.players[this.currentPlayer].folded) {
                    this.currentPlayer = (this.currentPlayer + 1) % this.players.length;
                }
            }
        }
        this.updateUI();
    }

    determineWinner() {
        const activePlayers = this.players.filter(player => !player.folded);
        const hands = activePlayers.map(player => {
            const bestHand = HandEvaluator.evaluateHand([...player.cards, ...this.communityCards]);
            
            // Reveal AI cards at showdown
            if (player.isAI) {
                const cardsContainer = player.element.querySelector('.player-cards');
                cardsContainer.innerHTML = '';
                player.cards.forEach(card => {
                    cardsContainer.appendChild(card.element);
                });
            }
            
            return { player, hand: bestHand };
        });

        hands.sort((a, b) => HandEvaluator.compareHands(b.hand, a.hand));
        
        // Find all players with the best hand (in case of tie)
        const bestHand = hands[0].hand;
        this.winners = hands
            .filter(h => HandEvaluator.compareHands(h.hand, bestHand) === 0)
            .map(h => h.player);

        // Animate chips moving to winners
        const winAmount = Math.floor(this.pot / this.winners.length);
        this.winners.forEach(winner => {
            // Create winning chips animation
            const chip = document.createElement('div');
            chip.className = 'chip betting';
            chip.textContent = `$${winAmount}`;
            chip.style.left = '50%';
            chip.style.top = '50%';
            document.querySelector('.poker-table').appendChild(chip);

            // Animate to winner
            setTimeout(() => {
                chip.style.left = `${winner.position.x}%`;
                chip.style.top = `${winner.position.y}%`;
                setTimeout(() => {
                    chip.remove();
                    winner.chips += winAmount;
                    winner.updatePlayerElement();
                }, 500);
            }, 50);
        });

        // Play win sound when showing winner
        this.soundManager.play('win');
        
        // Show winner information with animation
        const winnerDisplay = document.createElement('div');
        winnerDisplay.className = 'winner-display';
        winnerDisplay.innerHTML = `
            Winner${this.winners.length > 1 ? 's' : ''}: ${this.winners.map(w => w.name).join(', ')}<br>
            <small>${this.getHandDescription(bestHand)}</small>
        `;
        this.gameContainer.appendChild(winnerDisplay);
        setTimeout(() => winnerDisplay.remove(), 5000);
    }

    getHandDescription(hand) {
        const handNames = {
            'straight-flush': 'Straight Flush',
            'four-of-a-kind': 'Four of a Kind',
            'full-house': 'Full House',
            'flush': 'Flush',
            'straight': 'Straight',
            'three-of-a-kind': 'Three of a Kind',
            'two-pair': 'Two Pair',
            'pair': 'Pair',
            'high-card': 'High Card'
        };
        return handNames[hand.type] || hand.type;
    }

    handleFold() {
        this.soundManager.play('fold');
        const player = this.players[this.currentPlayer];
        player.fold();
        this.nextPlayer();
    }

    handleCall() {
        const player = this.players[this.currentPlayer];
        const callAmount = this.currentBet - player.bet;
        
        if (player.placeBet(callAmount)) {
            this.soundManager.play(callAmount === 0 ? 'check' : 'call');
            this.pot += callAmount;
            this.nextPlayer();
        }
    }

    handleRaise() {
        const player = this.players[this.currentPlayer];
        const raiseAmount = parseInt(document.getElementById('raise-slider').value);
        const totalAmount = this.currentBet - player.bet + raiseAmount;
        
        if (player.placeBet(totalAmount)) {
            this.soundManager.play('raise');
            this.pot += totalAmount;
            this.currentBet = player.bet;
            this.nextPlayer();
        }
    }

    nextPlayer() {
        let allPlayersActed = true;
        const activePlayers = this.players.filter(p => !p.folded);

        // Check if only one player remains
        if (activePlayers.length === 1) {
            this.winners = [activePlayers[0]];
            activePlayers[0].chips += this.pot;
            this.gameStage = 'showdown';
            this.updateUI();
            return;
        }

        // Check if all players have matched the current bet
        for (const player of activePlayers) {
            if (player.bet !== this.currentBet) {
                allPlayersActed = false;
                break;
            }
        }

        if (allPlayersActed) {
            this.nextStage();
        } else {
            do {
                this.currentPlayer = (this.currentPlayer + 1) % this.players.length;
            } while (this.players[this.currentPlayer].folded);

            // If it's an AI player's turn, make their move
            if (this.currentPlayer !== this.humanPlayerIndex && !this.players[this.currentPlayer].folded) {
                this.makeAIMove();
            }
        }

        this.updateUI();
    }

    makeAIMove() {
        const player = this.players[this.currentPlayer];
        player.showThinking();

        const gameState = {
            communityCards: this.communityCards,
            pot: this.pot,
            currentBet: this.currentBet,
            gameStage: this.gameStage,
            activePlayers: this.players.filter(p => !p.folded).length
        };

        // Add personality-based delay for more realistic AI behavior
        const minDelay = 1000;
        const maxDelay = 3000;
        const thinkingTime = minDelay + Math.random() * (maxDelay - minDelay);

        setTimeout(() => {
            player.hideThinking();
            const decision = PokerAI.decideAction(player, gameState);
            
            // Show decision bubble before action
            player.showDecision(decision);

            // Delay the actual action to let players see the decision
            setTimeout(() => {
                switch (decision.action) {
                    case 'fold':
                        this.handleFold();
                        break;
                    case 'call':
                        this.handleCall();
                        break;
                    case 'raise':
                        const raiseSlider = document.getElementById('raise-slider');
                        raiseSlider.value = decision.amount;
                        document.getElementById('raise-amount').textContent = `$${decision.amount}`;
                        this.handleRaise();
                        break;
                }
            }, 1000);
        }, thinkingTime);
    }

    updateUI() {
        this.potElement.textContent = `Pot: $${this.pot}`;
        this.players.forEach((player, index) => {
            player.element.classList.toggle('active', index === this.currentPlayer);
        });
        // Update raise slider max value based on current player's chips
        const raiseSlider = document.getElementById('raise-slider');
        const currentPlayerChips = this.players[this.currentPlayer].chips;
        raiseSlider.max = currentPlayerChips;
        raiseSlider.min = Math.min(this.currentBet * 2, currentPlayerChips);

        // Update button states
        const callBtn = document.getElementById('call-btn');
        const raiseBtn = document.getElementById('raise-btn');
        const callAmount = this.currentBet - this.players[this.currentPlayer].bet;
        
        callBtn.textContent = callAmount === 0 ? 'Check' : `Call $${callAmount}`;
        callBtn.disabled = callAmount > currentPlayerChips;
        raiseBtn.disabled = currentPlayerChips <= this.currentBet;

        // Show dealer button
        this.players.forEach((player, index) => {
            const dealerButton = player.element.querySelector('.dealer-button');
            if (index === this.dealerIndex) {
                if (!dealerButton) {
                    const button = document.createElement('div');
                    button.className = 'dealer-button';
                    button.textContent = 'D';
                    player.element.appendChild(button);
                }
            } else if (dealerButton) {
                dealerButton.remove();
            }
        });

        // Only enable controls for human player's turn
        const isHumanTurn = this.currentPlayer === this.humanPlayerIndex;
        document.getElementById('fold-btn').disabled = !isHumanTurn;
        document.getElementById('call-btn').disabled = !isHumanTurn;
        document.getElementById('raise-btn').disabled = !isHumanTurn;
        document.getElementById('raise-slider').disabled = !isHumanTurn;
    }
}