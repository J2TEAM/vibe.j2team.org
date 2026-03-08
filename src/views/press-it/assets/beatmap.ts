export interface BeatMapItem {
  id: number;
  text: string;
  beat: number;
  time: number;
  phrase: number;
  accent: boolean;
}

type RawBeatItem = Omit<BeatMapItem, "time">;

const rawBeatMap: RawBeatItem[] = [
  // Intro Beat
  { id: 0, text: "Time 2 Rhyme start!", beat: 0, phrase: 0, accent: true },

  // Phrase 1
  { id: 1, text: "Truck", beat: 1, phrase: 1, accent: true },
  { id: 2, text: "Duck", beat: 2, phrase: 1, accent: false },
  { id: 3, text: "Pluck", beat: 3, phrase: 1, accent: false },
  { id: 4, text: "Fun 2 Rhyme", beat: 4, phrase: 1, accent: false },

  // Phrase 2
  { id: 5, text: "Quick", beat: 5, phrase: 2, accent: true },
  { id: 6, text: "Stick", beat: 6, phrase: 2, accent: false },
  { id: 7, text: "Lick", beat: 7, phrase: 2, accent: false },
  { id: 8, text: "Dinner Time", beat: 8, phrase: 2, accent: false },

  // Phrase 3
  { id: 9, text: "Spit", beat: 9, phrase: 3, accent: true },
  { id: 10, text: "Split", beat: 10, phrase: 3, accent: false },
  { id: 11, text: "Slit", beat: 11, phrase: 3, accent: false },
  { id: 12, text: "Shut Your Eyes", beat: 12, phrase: 3, accent: false },

  // Phrase 4
  { id: 13, text: "Witch", beat: 13, phrase: 4, accent: true },
  { id: 14, text: "Stitch", beat: 14, phrase: 4, accent: false },
  { id: 15, text: "Pitch", beat: 15, phrase: 4, accent: false },
  { id: 16, text: "Big Surprize", beat: 16, phrase: 4, accent: false },

  // Phrase 5
  { id: 17, text: "Messy", beat: 17, phrase: 5, accent: true },
  { id: 18, text: "Sassy", beat: 18, phrase: 5, accent: false },
  { id: 19, text: "Bossy", beat: 19, phrase: 5, accent: false },
  { id: 20, text: "Purify", beat: 20, phrase: 5, accent: false },

  // Phrase 6
  { id: 21, text: "Bigger", beat: 21, phrase: 6, accent: true },
  { id: 22, text: "Trigger", beat: 22, phrase: 6, accent: false },
  { id: 23, text: "Digger", beat: 23, phrase: 6, accent: false },
  { id: 24, text: "Nice A Hat", beat: 24, phrase: 6, accent: false },

  // Phrase 7
  { id: 25, text: "Corn", beat: 25, phrase: 7, accent: true },
  { id: 26, text: "Horn", beat: 26, phrase: 7, accent: false },
  { id: 27, text: "Worn", beat: 27, phrase: 7, accent: false },
  { id: 28, text: "Party Time", beat: 28, phrase: 7, accent: false },

  // Phrase 8
  { id: 29, text: "Mum", beat: 29, phrase: 8, accent: true },
  { id: 30, text: "Hum", beat: 30, phrase: 8, accent: false },
  { id: 31, text: "Sum", beat: 31, phrase: 8, accent: false },
  { id: 32, text: "Cutie Pie", beat: 32, phrase: 8, accent: false },

  // Phrase 9
  { id: 33, text: "Denis", beat: 33, phrase: 9, accent: true },
  { id: 34, text: "Tennis", beat: 34, phrase: 9, accent: false },
  { id: 35, text: "Lenis", beat: 35, phrase: 9, accent: false },
  { id: 36, text: "Pretty Nice", beat: 36, phrase: 9, accent: false },

  // Phrase 10
  { id: 37, text: "Say", beat: 37, phrase: 10, accent: true },
  { id: 38, text: "Way", beat: 38, phrase: 10, accent: false },
  { id: 39, text: "Play", beat: 39, phrase: 10, accent: false },
  { id: 40, text: "Give Me Five", beat: 40, phrase: 10, accent: false },

  // Phrase 11
  { id: 41, text: "Kit", beat: 41, phrase: 11, accent: true },
  { id: 42, text: "Bit", beat: 42, phrase: 11, accent: false },
  { id: 43, text: "Hit", beat: 43, phrase: 11, accent: false },
  { id: 44, text: "Time 4 Rhyme", beat: 44, phrase: 11, accent: false },

  // Phrase 12
  { id: 45, text: "Sore", beat: 45, phrase: 12, accent: true },
  { id: 46, text: "Bore", beat: 46, phrase: 12, accent: false },
  { id: 47, text: "Adore", beat: 47, phrase: 12, accent: false },
  { id: 48, text: "Where Is Mine", beat: 48, phrase: 12, accent: false },

  // Phrase 13
  { id: 49, text: "Twerk", beat: 49, phrase: 13, accent: true },
  { id: 50, text: "Clerk", beat: 50, phrase: 13, accent: false },
  { id: 51, text: "Perk", beat: 51, phrase: 13, accent: false },
  { id: 52, text: "Just In Time", beat: 52, phrase: 13, accent: false },

  // Phrase 14
  { id: 53, text: "Bank", beat: 53, phrase: 14, accent: true },
  { id: 54, text: "Rank", beat: 54, phrase: 14, accent: false },
  { id: 55, text: "Tank", beat: 55, phrase: 14, accent: false },
  { id: 56, text: "Wonderland", beat: 56, phrase: 14, accent: false },

  // Phrase 15
  { id: 57, text: "Rock", beat: 57, phrase: 15, accent: true },
  { id: 58, text: "Lock", beat: 58, phrase: 15, accent: false },
  { id: 59, text: "Sock", beat: 59, phrase: 15, accent: false },
  { id: 60, text: "Cooking Rice", beat: 60, phrase: 15, accent: false },

  // Phrase 16
  { id: 61, text: "Tap", beat: 61, phrase: 16, accent: true },
  { id: 62, text: "Rap", beat: 62, phrase: 16, accent: false },
  { id: 63, text: "Map", beat: 63, phrase: 16, accent: false },
  { id: 64, text: "Funny Line", beat: 64, phrase: 16, accent: false },

  // Phrase 17
  { id: 65, text: "Grunt", beat: 65, phrase: 17, accent: true },
  { id: 66, text: "Hunt", beat: 66, phrase: 17, accent: false },
  { id: 67, text: "Punt", beat: 67, phrase: 17, accent: false },
  { id: 68, text: "Come Inside", beat: 68, phrase: 17, accent: false },

  // Phrase 18
  { id: 69, text: "Brass", beat: 69, phrase: 18, accent: true },
  { id: 70, text: "Glass", beat: 70, phrase: 18, accent: false },
  { id: 71, text: "Apple Slice", beat: 71, phrase: 18, accent: false },

  // Phrase 19
  { id: 72, text: "Hex", beat: 72, phrase: 19, accent: true },
  { id: 73, text: "Rex", beat: 73, phrase: 19, accent: false },
  { id: 74, text: "Flex", beat: 74, phrase: 19, accent: false },
  { id: 75, text: "Seek And Hide", beat: 75, phrase: 19, accent: false },

  // Phrase 20
  { id: 76, text: "Any", beat: 76, phrase: 20, accent: true },
  { id: 77, text: "Many", beat: 77, phrase: 20, accent: false },
  { id: 78, text: "Johnny", beat: 78, phrase: 20, accent: false },
  { id: 79, text: "Horse To Ride", beat: 79, phrase: 20, accent: false },

  // Phrase 21
  { id: 80, text: "Final", beat: 80, phrase: 21, accent: true },
  { id: 81, text: "Metal", beat: 81, phrase: 21, accent: false },
  { id: 82, text: "Normal", beat: 82, phrase: 21, accent: false },
  { id: 83, text: "Anykind", beat: 83, phrase: 21, accent: false },
];

export const GAME_CONFIG = {
  BPM: 80,
  beatDuration: 1,
  offset: 0.8,
  totalBeats: rawBeatMap.length,
  perfectWindow: 0.35,
  goodWindow: 0.5,
};

export const beatMap: BeatMapItem[] = rawBeatMap.map((item) => ({
  ...item,
  time: item.beat * GAME_CONFIG.beatDuration + GAME_CONFIG.offset,
}));
