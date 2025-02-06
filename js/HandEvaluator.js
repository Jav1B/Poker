class HandEvaluator {
    static evaluateHand(cards) {
        const allCards = [...cards];
        const ranks = allCards.map(card => card.getValue()).sort((a, b) => b - a);
        const suits = allCards.map(card => card.suit);
        
        // Check for flush
        const isFlush = suits.every(suit => suit === suits[0]);
        
        // Check for straight
        let isStraight = false;
        for (let i = 0; i < ranks.length - 4; i++) {
            if (ranks[i] - ranks[i + 4] === 4) {
                isStraight = true;
                break;
            }
        }
        // Special case for Ace-low straight (A,2,3,4,5)
        if (!isStraight && ranks[0] === 14 && ranks[1] === 5) {
            isStraight = ranks.slice(1, 5).every((rank, i) => rank === 5 - i);
        }

        // Count rank frequencies
        const rankCounts = new Map();
        ranks.forEach(rank => {
            rankCounts.set(rank, (rankCounts.get(rank) || 0) + 1);
        });
        
        const frequencies = Array.from(rankCounts.values()).sort((a, b) => b - a);
        const ranksByFrequency = Array.from(rankCounts.entries())
            .sort((a, b) => b[1] - a[1] || b[0] - a[0])
            .map(entry => entry[0]);

        // Evaluate hand
        if (isFlush && isStraight) return { type: 'straight-flush', ranks: ranksByFrequency };
        if (frequencies[0] === 4) return { type: 'four-of-a-kind', ranks: ranksByFrequency };
        if (frequencies[0] === 3 && frequencies[1] === 2) return { type: 'full-house', ranks: ranksByFrequency };
        if (isFlush) return { type: 'flush', ranks: ranksByFrequency };
        if (isStraight) return { type: 'straight', ranks: ranksByFrequency };
        if (frequencies[0] === 3) return { type: 'three-of-a-kind', ranks: ranksByFrequency };
        if (frequencies[0] === 2 && frequencies[1] === 2) return { type: 'two-pair', ranks: ranksByFrequency };
        if (frequencies[0] === 2) return { type: 'pair', ranks: ranksByFrequency };
        return { type: 'high-card', ranks: ranksByFrequency };
    }

    static compareHands(hand1, hand2) {
        const handRanking = {
            'straight-flush': 8,
            'four-of-a-kind': 7,
            'full-house': 6,
            'flush': 5,
            'straight': 4,
            'three-of-a-kind': 3,
            'two-pair': 2,
            'pair': 1,
            'high-card': 0
        };

        if (handRanking[hand1.type] > handRanking[hand2.type]) return 1;
        if (handRanking[hand1.type] < handRanking[hand2.type]) return -1;

        // Compare ranks if hand types are equal
        for (let i = 0; i < hand1.ranks.length; i++) {
            if (hand1.ranks[i] > hand2.ranks[i]) return 1;
            if (hand1.ranks[i] < hand2.ranks[i]) return -1;
        }
        return 0;
    }
}