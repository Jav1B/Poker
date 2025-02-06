class Player {
    constructor(name, chips, position, isHuman = false) {
        this.name = name;
        this.chips = chips;
        this.position = position;
        this.cards = [];
        this.bet = 0;
        this.folded = false;
        this.isAI = !isHuman;
        this.element = this.createPlayerElement();
    }

    createPlayerElement() {
        const player = document.createElement('div');
        player.className = 'player';
        player.style.left = `${this.position.x}%`;
        player.style.top = `${this.position.y}%`;
        this.updatePlayerElement(player);
        return player;
    }

    updatePlayerElement(element = this.element) {
        element.innerHTML = `
            <div class="player-cards"></div>
            <div class="player-info">
                <div>${this.name}</div>
                <div>$${this.chips}</div>
                ${this.bet ? `<div>Bet: $${this.bet}</div>` : ''}
                <div class="thinking-indicator" style="display: none;">Thinking...</div>
            </div>
        `;
        
        // Add a class to identify human player
        element.classList.toggle('human-player', !this.isAI);
        return element;
    }

    receiveCard(card) {
        this.cards.push(card);
        const cardsContainer = this.element.querySelector('.player-cards');
        card.element.classList.add('dealing');
        
        // For AI players, hide the card content
        if (this.isAI) {
            const cardBack = document.createElement('div');
            cardBack.className = 'card card-back dealing';
            cardsContainer.appendChild(cardBack);
        } else {
            cardsContainer.appendChild(card.element);
        }
        
        setTimeout(() => {
            const cards = cardsContainer.querySelectorAll('.card');
            cards.forEach(c => c.classList.remove('dealing'));
        }, 500);
    }

    placeBet(amount) {
        if (amount > this.chips) return false;
        
        this.chips -= amount;
        const previousBet = this.bet;
        this.bet += amount;
        
        // Create and animate chip
        const chip = document.createElement('div');
        chip.className = 'chip betting';
        chip.textContent = `$${amount}`;
        
        // Position chip relative to player
        chip.style.left = `${this.position.x}%`;
        chip.style.top = `${this.position.y}%`;
        
        document.querySelector('.poker-table').appendChild(chip);
        
        // Animate chip to pot
        setTimeout(() => {
            chip.style.left = '50%';
            chip.style.top = '50%';
            setTimeout(() => chip.remove(), 500);
        }, 50);

        this.updatePlayerElement();
        return true;
    }

    showDecision(decision) {
        const bubble = document.createElement('div');
        bubble.className = 'decision-bubble';
        
        let text;
        switch (decision.action) {
            case 'fold':
                text = 'Fold';
                break;
            case 'call':
                text = this.bet === 0 ? 'Check' : `Call $${this.bet}`;
                break;
            case 'raise':
                text = `Raise to $${decision.amount}`;
                break;
        }
        
        bubble.textContent = text;
        
        // Position bubble above player
        bubble.style.left = `${this.position.x}%`;
        bubble.style.top = `${this.position.y - 15}%`;
        
        document.querySelector('.poker-table').appendChild(bubble);
        requestAnimationFrame(() => bubble.classList.add('show'));
        
        // Remove bubble after animation
        setTimeout(() => bubble.remove(), 2000);
    }

    fold() {
        this.folded = true;
        this.element.style.opacity = '0.5';
        this.element.querySelector('.player-cards').style.transform = 'scale(0.8)';
    }

    reset() {
        this.cards = [];
        this.bet = 0;
        this.folded = false;
        this.element.style.opacity = '1';
        this.element.querySelector('.player-cards').style.transform = 'scale(1)';
        this.updatePlayerElement();
    }

    showThinking() {
        const indicator = this.element.querySelector('.thinking-indicator');
        if (indicator) {
            indicator.style.display = 'block';
        }
    }

    hideThinking() {
        const indicator = this.element.querySelector('.thinking-indicator');
        if (indicator) {
            indicator.style.display = 'none';
        }
    }
}