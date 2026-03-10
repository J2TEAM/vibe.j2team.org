export type Suit = "hearts" | "diamonds" | "clubs" | "spades";
export type Rank = "A" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K";

export interface Card {
  suit: Suit;
  rank: Rank;
  isFaceUp: boolean;
}

export type GameStatus = "betting" | "playing" | "dealer_turn" | "ended";

export type GameResult = "win" | "lose" | "push" | "blackjack" | "bust" | null;

export interface Player {
  hands: Card[][]; 
  currentHandIndex: number;
  scores: number[];
  bets: number[];
  balance: number;
}

export interface Dealer {
  hand: Card[];
  score: number;
}
