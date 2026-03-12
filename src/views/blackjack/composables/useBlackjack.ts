import { ref, computed } from "vue";
import type { Card, Suit, Rank, GameStatus, Player, Dealer } from "../types/blackjack";

export function useBlackjack() {
  const suits: Suit[] = ["hearts", "diamonds", "clubs", "spades"];
  const ranks: Rank[] = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

  const deck = ref<Card[]>([]);
  const status = ref<GameStatus>("betting");
  const resultMessage = ref<string>("Đặt cược để bắt đầu");

  const player = ref<Player>({
    hands: [[]],
    currentHandIndex: 0,
    scores: [0],
    bets: [0],
    balance: 1000,
  });

  const dealer = ref<Dealer>({
    hand: [],
    score: 0,
  });

  const isSoundEnabled = ref(true);

  const toggleSound = () => {
    isSoundEnabled.value = !isSoundEnabled.value;
  };

  // Sound Engine (Web Audio API - Simple Classic Sounds)
  const playSound = (type: 'deal' | 'flip' | 'win' | 'lose' | 'bust') => {
    if (!isSoundEnabled.value) return;

    interface WindowWithWebkit extends Window {
      webkitAudioContext: typeof AudioContext;
    }
    
    const AudioContextClass = window.AudioContext || (window as unknown as WindowWithWebkit).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    if (type === 'deal') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.1);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.start(); osc.stop(now + 0.1);
    } else if (type === 'flip') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.05);
      gain.gain.setValueAtTime(0.05, now);
      osc.start(); osc.stop(now + 0.05);
    } else if (type === 'win') {
      [523.25, 659.25, 783.99].forEach((f, i) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'square';
        o.frequency.value = f;
        o.connect(g); g.connect(ctx.destination);
        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(0.1, now + i * 0.1 + 0.05);
        g.gain.linearRampToValueAtTime(0, now + i * 0.1 + 0.2);
        o.start(now + i * 0.1); o.stop(now + i * 0.1 + 0.2);
      });
    } else if (type === 'lose' || type === 'bust') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.linearRampToValueAtTime(110, now + 0.4);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.4);
      osc.start(); osc.stop(now + 0.4);
    }
  };

  const createDeck = () => {
    const newDeck: Card[] = [];
    for (const suit of suits) {
      for (const rank of ranks) {
        newDeck.push({ suit, rank, isFaceUp: true });
      }
    }
    for (let i = newDeck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = newDeck[i];
      const target = newDeck[j];
      if (temp && target) {
        newDeck[i] = target;
        newDeck[j] = temp;
      }
    }
    deck.value = newDeck;
  };

  const calculateScore = (hand: Card[]) => {
    let score = 0;
    let aceCount = 0;
    for (const card of hand) {
      if (card.rank === "A") { aceCount++; score += 11; }
      else if (["J", "Q", "K"].includes(card.rank)) { score += 10; }
      else { score += parseInt(card.rank); }
    }
    while (score > 21 && aceCount > 0) { score -= 10; aceCount--; }
    return score;
  };

  const getScoreDisplay = (hand: Card[]) => {
    if (hand.length === 0) return "0";
    let hardScore = 0;
    let softScore = 0;
    let hasAce = false;
    for (const card of hand) {
      if (card.rank === "A") { hasAce = true; hardScore += 1; softScore += 11; }
      else if (["J", "Q", "K"].includes(card.rank)) { hardScore += 10; softScore += 10; }
      else { const val = parseInt(card.rank); hardScore += val; softScore += val; }
    }
    if (!hasAce || softScore > 21 || softScore === hardScore) return `${hardScore}`;
    return `${hardScore} / ${softScore}`;
  };

  const startNewGame = async (betAmount: number) => {
    if (betAmount > player.value.balance) return;
    status.value = "dealer_turn";
    player.value.balance -= betAmount;
    player.value.bets = [betAmount];
    player.value.hands = [[]];
    player.value.currentHandIndex = 0;
    dealer.value.hand = [];
    createDeck();

    const dealSequence = [
      { to: 'player', faceUp: true },
      { to: 'dealer', faceUp: true },
      { to: 'player', faceUp: true },
      { to: 'dealer', faceUp: false }
    ];

    for (const step of dealSequence) {
      await new Promise(r => setTimeout(r, 400));
      playSound('deal');
      const poppedCard = deck.value.pop();
      if (!poppedCard) continue;
      
      const card = { ...poppedCard, isFaceUp: step.faceUp };
      if (step.to === 'player') {
        const firstHand = player.value.hands[0];
        if (firstHand) firstHand.push(card);
      } else {
        dealer.value.hand.push(card);
      }
      updateScores();
    }

    status.value = "playing";
    resultMessage.value = "Đến lượt bạn";

    if (player.value.scores[0] === 21) {
      await new Promise(r => setTimeout(r, 600));
      stand();
    }
  };

  const updateScores = () => {
    player.value.scores = player.value.hands.map(h => calculateScore(h));
    dealer.value.score = calculateScore(dealer.value.hand.filter(c => c.isFaceUp));
  };

  const hit = () => {
    if (status.value !== "playing") return;
    playSound('deal');
    const currentHand = player.value.hands[player.value.currentHandIndex];
    const poppedCard = deck.value.pop();
    if (currentHand && poppedCard) {
      currentHand.push(poppedCard);
      updateScores();
      const currentScore = player.value.scores[player.value.currentHandIndex];
      if (currentScore !== undefined && currentScore > 21) {
        if (player.value.currentHandIndex < player.value.hands.length - 1) {
          player.value.currentHandIndex++;
        } else {
          stand();
        }
      }
    }
  };

  const stand = async () => {
    if (status.value !== "playing" && status.value !== "dealer_turn") return;
    
    if (player.value.currentHandIndex < player.value.hands.length - 1) {
      player.value.currentHandIndex++;
      return;
    }

    status.value = "dealer_turn";
    const allBusted = player.value.scores.every(s => s > 21);
    
    const hiddenCard = dealer.value.hand[1];
    if (hiddenCard && !hiddenCard.isFaceUp) {
      await new Promise(r => setTimeout(r, 400));
      playSound('flip');
      hiddenCard.isFaceUp = true;
      updateScores();
    }

    if (!allBusted) {
      while (dealer.value.score < 17) {
        await new Promise(r => setTimeout(r, 600));
        playSound('deal');
        const poppedCard = deck.value.pop();
        if (poppedCard) {
          dealer.value.hand.push(poppedCard);
          updateScores();
        } else {
          break;
        }
      }
    } else {
      await new Promise(r => setTimeout(r, 600));
    }
    
    determineResults();
  };

  const doubleDown = () => {
    const idx = player.value.currentHandIndex;
    const currentBet = player.value.bets[idx];
    const currentHand = player.value.hands[idx];
    
    if (status.value !== "playing" || currentBet === undefined || player.value.balance < currentBet || !currentHand) return;
    
    playSound('deal');
    player.value.balance -= currentBet;
    player.value.bets[idx] = currentBet * 2;
    const poppedCard = deck.value.pop();
    if (poppedCard) {
      currentHand.push(poppedCard);
      updateScores();
      stand();
    }
  };

  const split = () => {
    const idx = player.value.currentHandIndex;
    const hand = player.value.hands[idx];
    const currentBet = player.value.bets[idx];
    
    if (status.value !== "playing" || !hand || hand.length !== 2 || currentBet === undefined || player.value.balance < currentBet) return;
    
    const card1 = hand[0];
    const card2 = hand[1];
    if (!card1 || !card2) return;

    const v1 = (card1.rank === "A" ? 11 : (["J", "Q", "K"].includes(card1.rank) ? 10 : parseInt(card1.rank)));
    const v2 = (card2.rank === "A" ? 11 : (["J", "Q", "K"].includes(card2.rank) ? 10 : parseInt(card2.rank)));
    if (v1 !== v2) return;

    playSound('deal');
    const secondCard = hand.pop();
    if (!secondCard) return;
    
    player.value.balance -= currentBet;
    player.value.bets.push(currentBet);
    player.value.hands.push([secondCard]);
    
    const p1 = deck.value.pop();
    const p2 = deck.value.pop();
    
    if (p1) hand.push(p1);
    if (p2) {
      const lastHand = player.value.hands[player.value.hands.length - 1];
      if (lastHand) lastHand.push(p2);
    }
    updateScores();
  };

  const determineResults = () => {
    status.value = "ended";
    let totalWin = 0;
    let anyWin = false;

    const results = player.value.hands.map((hand, i) => {
      const pScore = player.value.scores[i];
      const dScore = dealer.value.score;
      const currentBet = player.value.bets[i];
      if (pScore === undefined || currentBet === undefined) return "THUA";
      
      const isBlackjack = hand.length === 2 && pScore === 21;

      if (pScore > 21) return "QUÁ 21";
      if (isBlackjack && (dScore !== 21 || dealer.value.hand.length !== 2)) {
        totalWin += currentBet * 2.5; 
        anyWin = true;
        return "BLACKJACK";
      }
      if (dScore > 21 || pScore > dScore) {
        totalWin += currentBet * 2;
        anyWin = true;
        return "THẮNG";
      }
      if (pScore === dScore) {
        totalWin += currentBet;
        return "HÒA";
      }
      return "THUA";
    });

    player.value.balance += totalWin;
    resultMessage.value = results.join(" / ");
    if (anyWin) playSound('win');
    else if (results.every(r => r === 'THUA' || r === 'QUÁ 21')) playSound('lose');
  };

  const resetGame = () => {
    status.value = "betting";
    resultMessage.value = "Đặt cược để bắt đầu";
  };

  const canSplit = computed(() => {
    const idx = player.value.currentHandIndex;
    const hand = player.value.hands[idx];
    const currentBet = player.value.bets[idx];
    if (!hand || hand.length !== 2 || currentBet === undefined) return false;
    
    const card1 = hand[0];
    const card2 = hand[1];
    if (!card1 || !card2) return false;

    const v1 = (card1.rank === "A" ? 11 : (["J", "Q", "K"].includes(card1.rank) ? 10 : parseInt(card1.rank)));
    const v2 = (card2.rank === "A" ? 11 : (["J", "Q", "K"].includes(card2.rank) ? 10 : parseInt(card2.rank)));
    return status.value === "playing" && v1 === v2 && player.value.balance >= currentBet;
  });

  const canDouble = computed(() => {
    const idx = player.value.currentHandIndex;
    const currentBet = player.value.bets[idx];
    const currentHand = player.value.hands[idx];
    return status.value === "playing" && currentHand?.length === 2 && currentBet !== undefined && player.value.balance >= currentBet;
  });

  return { 
    player, dealer, status, resultMessage, 
    startNewGame, hit, stand, doubleDown, split, resetGame, 
    canSplit, canDouble, getScoreDisplay,
    isSoundEnabled, toggleSound
  };
}
