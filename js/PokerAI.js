class PokerAI {
    static decideAction(player, gameState) {
        const { communityCards, pot, currentBet, gameStage } = gameState;
        const callAmount = currentBet - player.bet;
        const handStrength = this.evaluateHandStrength(player, communityCards);
        
        // If it's pre-flop
        if (gameStage === 'pre-flop') {
            return this.handlePreFlop(player, handStrength, callAmount);
        }

        // Calculate pot odds
        const potOdds = callAmount / (pot + callAmount);
        
        // Decide action based on hand strength and pot odds
        if (handStrength > 0.8) {
            // Strong hand - raise or call
            return this.decideRaiseAmount(player, currentBet, pot, true);
        } else if (handStrength > 0.6) {
            // Decent hand - call or raise occasionally
            return Math.random() < 0.3 ? 
                this.decideRaiseAmount(player, currentBet, pot, false) :
                { action: 'call' };
        } else if (handStrength > 0.4 && potOdds < handStrength) {
            // Marginal hand - call if pot odds are good
            return { action: 'call' };
        } else if (handStrength > 0.2 && callAmount === 0) {
            // Weak hand - check if possible
            return { action: 'call' }; // call with 0 amount is a check
        } else {
            // Fold weak hands
            return { action: 'fold' };
        }
    }

    static handlePreFlop(player, handStrength, callAmount) {
        const holeCards = player.cards;
        const card1 = parseInt(holeCards[0].rank);
        const card2 = parseInt(holeCards[1].rank);
        const isPair = card1 === card2;
        const isConnected = Math.abs(card1 - card2) <= 2;
        const isSuited = holeCards[0].suit === holeCards[1].suit;
        const highCard = Math.max(card1, card2);

        // Premium hands
        if (isPair && highCard >= 10) {
            return this.decideRaiseAmount(player, callAmount, 0, true);
        }

        // Strong hands
        if ((highCard >= 13 && isConnected) || (isPair && highCard >= 7) || 
            (isSuited && isConnected && highCard >= 11)) {
            return { action: 'call' };
        }

        // Weak but playable hands
        if (callAmount === 0 && (isConnected || isSuited || highCard >= 10)) {
            return { action: 'call' };
        }

        // Fold weak hands
        return { action: 'fold' };
    }

    static evaluateHandStrength(player, communityCards) {
        const cards = [...player.cards, ...communityCards];
        if (cards.length < 2) return 0;

        const hand = HandEvaluator.evaluateHand(cards);
        
        // Convert hand type to approximate strength value
        const strengthMap = {
            'straight-flush': 1,
            'four-of-a-kind': 0.95,
            'full-house': 0.9,
            'flush': 0.8,
            'straight': 0.75,
            'three-of-a-kind': 0.7,
            'two-pair': 0.6,
            'pair': 0.5,
            'high-card': 0.3
        };

        let baseStrength = strengthMap[hand.type];
        
        // Adjust strength based on high cards
        const highCardBonus = Math.min(0.1, hand.ranks[0] / 140);
        return baseStrength + highCardBonus;
    }

    static decideRaiseAmount(player, currentBet, pot, isStrong) {
        const minRaise = currentBet * 2;
        const maxRaise = player.chips;
        
        if (maxRaise < minRaise) {
            return { action: 'call' };
        }

        let raiseAmount;
        if (isStrong) {
            // Raise between 50% and 100% of the pot for strong hands
            raiseAmount = Math.min(maxRaise, currentBet + Math.floor(pot * (0.5 + Math.random() * 0.5)));
        } else {
            // Raise between 25% and 50% of the pot for medium hands
            raiseAmount = Math.min(maxRaise, currentBet + Math.floor(pot * (0.25 + Math.random() * 0.25)));
        }

        return {
            action: 'raise',
            amount: Math.max(minRaise, raiseAmount)
        };
    }
}