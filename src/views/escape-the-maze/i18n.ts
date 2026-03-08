export type Language = 'vi' | 'en'

export interface Translations {
  backToHome: string
  title: string
  subtitle: string
  selectDifficulty: string
  trollMessages: string[]
  difficulty: {
    noob: {
      label: string
      desc: string
    }
    medium: {
      label: string
      desc: string
    }
    hard: {
      label: string
      desc: string
    }
    asian: {
      label: string
      desc: string
    }
  }
  start: string
  time: string
  steps: string
  controls: string
  keyboardControls: string
  mobileControls: string
  congratulations: string
  youEscaped: string
  efficiency: string
  optimalSteps: string
  newRecord: string
  playAgain: string
  changeDifficulty: string
  bestTime: string
  noBestYet: string
}

export const translations: Record<Language, Translations> = {
  vi: {
    backToHome: '← Về trang chủ',
    title: 'Escape The Maze',
    subtitle: 'Thoát khỏi mê cung được tạo ngẫu nhiên',
    selectDifficulty: 'Chọn độ khó',
    trollMessages: [
      'ơ con gà này?',
      'Gia tiên đang chờ.',
      'Thêm thanh ram không em?',
      'Chắc đi học về chưa ấm chỗ?',
      'Bạn có chắc là IQ bình thường?',
      'Gọi điện cho mẹ chưa hôm nay?',
    ],
    difficulty: {
      noob: {
        label: 'Gà',
        desc: 'Ez game, gà cũng qua được',
      },
      medium: {
        label: 'Cũng ngon',
        desc: 'IQ bình thường là qua được',
      },
      hard: {
        label: 'Ca này Khó',
        desc: 'Đi làm lon bò húc rồi quay lại',
      },
      asian: {
        label: 'Châu Á',
        desc: 'Chỉ dành cho tụi Châu Á',
      },
    },
    start: 'Bắt đầu',
    time: 'Thời gian',
    steps: 'Số bước',
    controls: 'Điều khiển',
    keyboardControls: 'Bàn phím',
    mobileControls: 'Di động',
    congratulations: 'Lụm tiền!',
    youEscaped: 'Bạn đã thoát khỏi mê cung',
    efficiency: 'Hiệu suất',
    optimalSteps: 'Bước tối ưu',
    newRecord: 'Kỷ lục mới!',
    playAgain: 'Chơi lại',
    changeDifficulty: 'Đổi độ khó',
    bestTime: 'Thời gian tốt nhất',
    noBestYet: 'Chưa có kỷ lục',
  },
  en: {
    backToHome: '← Back to Home',
    title: 'Escape The Maze',
    subtitle: 'Escape from a randomly generated maze',
    selectDifficulty: 'Select Difficulty',
    trollMessages: [
      'You fucking donkey?',
      'Your ancestors are waiting.',
      'Wanna add a new RAM bar?',
      'Are you even trying?',
      'My grandma could do better.',
      'Have you called your mom today?',
    ],
    difficulty: {
      noob: {
        label: 'Noob',
        desc: 'Ez game, even chickens can pass',
      },
      medium: {
        label: 'Not Bad',
        desc: 'Normal IQ should do it',
      },
      hard: {
        label: "This One's Tough",
        desc: 'Go get a Red Bull then come back',
      },
      asian: {
        label: 'Asian',
        desc: 'Only for Asians',
      },
    },
    start: 'Start',
    time: 'Time',
    steps: 'Steps',
    controls: 'Controls',
    keyboardControls: 'Keyboard',
    mobileControls: 'Mobile',
    congratulations: 'Cha-ching!',
    youEscaped: 'You escaped the maze',
    efficiency: 'Efficiency',
    optimalSteps: 'Optimal steps',
    newRecord: 'New record!',
    playAgain: 'Play Again',
    changeDifficulty: 'Change Difficulty',
    bestTime: 'Best Time',
    noBestYet: 'No record yet',
  },
}
