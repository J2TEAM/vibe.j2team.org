export interface Answer {
  text: string;
  correct: boolean;
}

export interface Question {
  id: number;
  text: string;
  category: string;
  answers: Answer[];
  explanation?: string | null;
  imageUrl?: string | null;
  isCritical?: boolean;
}
