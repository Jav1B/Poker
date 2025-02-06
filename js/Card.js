class Card {
    constructor(suit, rank) {
        this.suit = suit;
        this.rank = rank;
        this.element = this.createCardElement();
    }

    createCardElement() {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `${this.getSymbol()}${this.getRankDisplay()}`;
        card.style.color = this.getColor();
        return card;
    }

    getSymbol() {
        const symbols = {
            'hearts': '♥',
            'diamonds': '♦',
            'clubs': '♣',
            'spades': '♠'
        };
        return symbols[this.suit];
    }

    getColor() {
        return ['hearts', 'diamonds'].includes(this.suit) ? 'red' : 'black';
    }

    getRankDisplay() {
        const rankMap = {
            '11': 'J',
            '12': 'Q',
            '13': 'K',
            '14': 'A'
        };
        return rankMap[this.rank] || this.rank;
    }

    getValue() {
        return parseInt(this.rank);
    }
}