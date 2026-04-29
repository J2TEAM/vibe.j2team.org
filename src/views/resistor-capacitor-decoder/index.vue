<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Icon } from '@iconify/vue'
import { RouterLink } from 'vue-router'

type MainTab = 'resistor-band' | 'resistor-smd' | 'capacitor-smd'
type BandMode = '4' | '5' | '6'
type Lang = 'vi' | 'en' | 'ko' | 'zh' | 'ru' | 'fr' | 'ja'
type ColorKey =
  | 'black'
  | 'brown'
  | 'red'
  | 'orange'
  | 'yellow'
  | 'green'
  | 'blue'
  | 'violet'
  | 'gray'
  | 'white'
  | 'silver'
  | 'gold'
  | 'none'

interface ColorBandOption {
  key: ColorKey
  value?: number
  multiplier?: number
  tolerance?: string
  tempco?: string
  swatchClass: string
  textClass: string
}

interface TranslationPack {
  languageName: string
  badge: string
  title: string
  subtitle: string
  supportLine: string
  backHome: string
  language: string
  tabs: {
    resistorBand: string
    resistorSmd: string
    capacitorSmd: string
  }
  resistorBand: {
    title: string
    desc: string
    value: string
    quickRules: string
    band1: string
    band2: string
    band3: string
    band4Multiplier: string
    band5Tolerance: string
    band6Tempco: string
    multiplierBand3: string
    multiplierBand4: string
    toleranceBand4: string
    toleranceBand5: string
    formula: string
    tolerance: string
    tempco: string
    illustration: string
    rule4: string
    rule5: string
    rule6: string
  }
  resistorSmd: {
    title: string
    desc: string
    input: string
    placeholder: string
    result: string
    codeType: string
    formula: string
    note: string
    illustration: string
    type3Digit: string
    type4Digit: string
    typeR: string
    typeEia96: string
  }
  capacitorSmd: {
    title: string
    desc: string
    input: string
    placeholder: string
    result: string
    codeType: string
    formula: string
    note: string
    illustration: string
  }
  common: {
    empty: string
    unsupported: string
    unknown: string
    enterResistorSmd: string
    enterCapacitorSmd: string
    rNotationNote: string
    smd3DigitNote: string
    smd4DigitNote: string
    eia96Note: string
    capacitor3DigitNote: string
    capacitorUnknownNote: string
    decimalRole: string
    defaultPfUnit: string
    examples: string
    footer: string
  }
  colors: Record<ColorKey, string>
}

const translations: Record<Lang, TranslationPack> = {
  vi: {
    languageName: 'Tiếng Việt',
    badge: 'Component Code Decoder by',
    title: 'Resistor & Capacitor Decoder',
    subtitle:
      'Đọc nhanh giá trị điện trở vạch màu, điện trở SMD và tụ gốm trợ giúp cho kỹ sư điện - điện tử.',
    supportLine: '(Hỗ trợ 4/5/6 band, 3-digit, 4-digit, R notation và EIA-96)',
    backHome: '← Về trang chủ',
    language: 'Ngôn ngữ',
    tabs: {
      resistorBand: 'Điện trở vạch màu',
      resistorSmd: 'Điện trở SMD',
      capacitorSmd: 'Tụ gốm',
    },
    resistorBand: {
      title: 'Điện trở vạch màu',
      desc: 'Chọn 4, 5 hoặc 6 band rồi chọn màu từng vòng để tính nhanh giá trị điện trở.',
      value: 'Giá trị điện trở',
      quickRules: 'Quy tắc nhanh',
      band1: 'Vạch 1',
      band2: 'Vạch 2',
      band3: 'Vạch 3',
      band4Multiplier: 'Hệ số nhân (Vạch 4)',
      band5Tolerance: 'Sai số (Vạch 5)',
      band6Tempco: 'Hệ số nhiệt (Vạch 6)',
      multiplierBand3: 'Hệ số nhân (Vạch 3)',
      multiplierBand4: 'Hệ số nhân (Vạch 4)',
      toleranceBand4: 'Sai số (Vạch 4)',
      toleranceBand5: 'Sai số (Vạch 5)',
      formula: 'Công thức',
      tolerance: 'Tolerance',
      tempco: 'Tempco',
      illustration: 'Minh họa điện trở qua lỗ',
      rule4: '4 band = 2 số có nghĩa + hệ số nhân + sai số',
      rule5: '5 band = 3 số có nghĩa + hệ số nhân + sai số',
      rule6: '6 band = 5 band + tempco (ppm/°C)',
    },
    resistorSmd: {
      title: 'Điện trở SMD',
      desc: 'Hỗ trợ mã 3 digit, 4 digit, R notation và EIA-96.',
      input: 'Nhập mã điện trở SMD',
      placeholder: 'Ví dụ: 472, 1001, 4R7, 01Y',
      result: 'Kết quả',
      codeType: 'Loại mã',
      formula: 'Công thức',
      note: 'Ghi chú',
      illustration: 'Minh họa điện trở SMD',
      type3Digit: '3 digit',
      type4Digit: '4 digit',
      typeR: 'R notation',
      typeEia96: 'EIA-96',
    },
    capacitorSmd: {
      title: 'Tụ gốm',
      desc: 'Giải mã mã tụ gốm phổ biến. Đơn vị mặc định của mã 3 chữ số là pF.',
      input: 'Nhập mã tụ gốm',
      placeholder: 'Ví dụ: 101, 104, 105, 4R7',
      result: 'Kết quả',
      codeType: 'Loại mã',
      formula: 'Công thức',
      note: 'Ghi chú',
      illustration: 'Minh họa tụ chip MLCC',
    },
    common: {
      empty: '—',
      unsupported: 'Không hỗ trợ',
      unknown: 'Không xác định',
      enterResistorSmd: 'Nhập mã điện trở SMD để giải mã',
      enterCapacitorSmd: 'Nhập mã tụ gốm để giải mã',
      rNotationNote: 'Chữ R đóng vai trò là dấu thập phân',
      smd3DigitNote: '2 số đầu là trị số có nghĩa, số cuối là bậc nhân',
      smd4DigitNote: 'Mã chính xác hơn, thường dùng cho điện trở sai số thấp',
      eia96Note: 'Mã điện trở SMD 1% theo chuẩn EIA-96',
      capacitor3DigitNote: 'Đơn vị mặc định của mã tụ SMD là pF',
      capacitorUnknownNote: 'Nhiều tụ SMD nhỏ không in mã, cần BOM hoặc LCR meter để xác định',
      decimalRole: 'R notation',
      defaultPfUnit: 'Đơn vị mặc định là pF',
      examples: 'Ví dụ',
      footer: 'Busan, South Korea, 2026',
    },
    colors: {
      black: 'Đen',
      brown: 'Nâu',
      red: 'Đỏ',
      orange: 'Cam',
      yellow: 'Vàng',
      green: 'Lục',
      blue: 'Lam',
      violet: 'Tím',
      gray: 'Xám',
      white: 'Trắng',
      silver: 'Bạc',
      gold: 'Vàng kim',
      none: 'Không có',
    },
  },
  en: {
    languageName: 'English',
    badge: 'Component Code Decoder by',
    title: 'Resistor & Capacitor Decoder',
    subtitle:
      'Quickly decode color-band resistors, SMD resistors, and ceramic capacitors for electrical and electronics work.',
    supportLine: '(Supports 4/5/6 band, 3-digit, 4-digit, R notation, and EIA-96)',
    backHome: '← Back to Home',
    language: 'Language',
    tabs: {
      resistorBand: 'Color Band Resistor',
      resistorSmd: 'SMD Resistor',
      capacitorSmd: 'Ceramic Capacitor',
    },
    resistorBand: {
      title: 'Color Band Resistor',
      desc: 'Choose 4, 5, or 6 bands, then select each color to calculate the resistor value.',
      value: 'Resistance Value',
      quickRules: 'Quick Rules',
      band1: 'Band 1',
      band2: 'Band 2',
      band3: 'Band 3',
      band4Multiplier: 'Multiplier (Band 4)',
      band5Tolerance: 'Tolerance (Band 5)',
      band6Tempco: 'Tempco (Band 6)',
      multiplierBand3: 'Multiplier (Band 3)',
      multiplierBand4: 'Multiplier (Band 4)',
      toleranceBand4: 'Tolerance (Band 4)',
      toleranceBand5: 'Tolerance (Band 5)',
      formula: 'Formula',
      tolerance: 'Tolerance',
      tempco: 'Tempco',
      illustration: 'Through-hole resistor illustration',
      rule4: '4 band = 2 significant digits + multiplier + tolerance',
      rule5: '5 band = 3 significant digits + multiplier + tolerance',
      rule6: '6 band = 5 band + tempco (ppm/°C)',
    },
    resistorSmd: {
      title: 'SMD Resistor',
      desc: 'Supports 3-digit, 4-digit, R notation, and EIA-96.',
      input: 'Enter SMD resistor code',
      placeholder: 'Example: 472, 1001, 4R7, 01Y',
      result: 'Result',
      codeType: 'Code Type',
      formula: 'Formula',
      note: 'Note',
      illustration: 'SMD resistor illustration',
      type3Digit: '3 digit',
      type4Digit: '4 digit',
      typeR: 'R notation',
      typeEia96: 'EIA-96',
    },
    capacitorSmd: {
      title: 'Ceramic Capacitor',
      desc: 'Decode common ceramic capacitor codes. The default unit for 3-digit codes is pF.',
      input: 'Enter ceramic capacitor code',
      placeholder: 'Example: 101, 104, 105, 4R7',
      result: 'Result',
      codeType: 'Code Type',
      formula: 'Formula',
      note: 'Note',
      illustration: 'MLCC chip capacitor illustration',
    },
    common: {
      empty: '—',
      unsupported: 'Not supported',
      unknown: 'Unknown',
      enterResistorSmd: 'Enter an SMD resistor code to decode',
      enterCapacitorSmd: 'Enter a ceramic capacitor code to decode',
      rNotationNote: 'The letter R acts as a decimal point',
      smd3DigitNote:
        'The first 2 digits are significant figures, the last digit is the multiplier exponent',
      smd4DigitNote: 'Higher-precision code, commonly used for low-tolerance resistors',
      eia96Note: '1% SMD resistor code based on EIA-96',
      capacitor3DigitNote: 'The default unit for ceramic capacitor code is pF',
      capacitorUnknownNote:
        'Many small SMD capacitors are unmarked; use the BOM or an LCR meter to identify them',
      decimalRole: 'R notation',
      defaultPfUnit: 'Default unit is pF',
      examples: 'Examples',
      footer: 'Busan, South Korea, 2026',
    },
    colors: {
      black: 'Black',
      brown: 'Brown',
      red: 'Red',
      orange: 'Orange',
      yellow: 'Yellow',
      green: 'Green',
      blue: 'Blue',
      violet: 'Violet',
      gray: 'Gray',
      white: 'White',
      silver: 'Silver',
      gold: 'Gold',
      none: 'None',
    },
  },
  ko: {
    languageName: '한국어',
    badge: 'Component Code Decoder by',
    title: '저항 & 커패시터 디코더',
    subtitle: '컬러 밴드 저항, SMD 저항, 세라믹 커패시터 값을 빠르게 해독합니다.',
    supportLine: '(4/5/6 밴드, 3자리, 4자리, R 표기, EIA-96 지원)',
    backHome: '← 홈으로',
    language: '언어',
    tabs: {
      resistorBand: '컬러 밴드 저항',
      resistorSmd: 'SMD 저항',
      capacitorSmd: '세라믹 커패시터',
    },
    resistorBand: {
      title: '컬러 밴드 저항',
      desc: '4, 5 또는 6 밴드를 선택하고 각 색상을 골라 저항값을 계산하세요.',
      value: '저항값',
      quickRules: '빠른 규칙',
      band1: '밴드 1',
      band2: '밴드 2',
      band3: '밴드 3',
      band4Multiplier: '승수 (밴드 4)',
      band5Tolerance: '허용오차 (밴드 5)',
      band6Tempco: '온도계수 (밴드 6)',
      multiplierBand3: '승수 (밴드 3)',
      multiplierBand4: '승수 (밴드 4)',
      toleranceBand4: '허용오차 (밴드 4)',
      toleranceBand5: '허용오차 (밴드 5)',
      formula: '공식',
      tolerance: '허용오차',
      tempco: '온도계수',
      illustration: '리드형 저항 예시',
      rule4: '4 밴드 = 유효숫자 2개 + 승수 + 허용오차',
      rule5: '5 밴드 = 유효숫자 3개 + 승수 + 허용오차',
      rule6: '6 밴드 = 5 밴드 + 온도계수 (ppm/°C)',
    },
    resistorSmd: {
      title: 'SMD 저항',
      desc: '3자리, 4자리, R 표기, EIA-96 지원.',
      input: 'SMD 저항 코드 입력',
      placeholder: '예: 472, 1001, 4R7, 01Y',
      result: '결과',
      codeType: '코드 종류',
      formula: '공식',
      note: '설명',
      illustration: 'SMD 저항 예시',
      type3Digit: '3자리',
      type4Digit: '4자리',
      typeR: 'R 표기',
      typeEia96: 'EIA-96',
    },
    capacitorSmd: {
      title: '세라믹 커패시터',
      desc: '일반적인 세라믹 커패시터 코드를 해독합니다. 3자리 코드는 기본 단위가 pF입니다.',
      input: '세라믹 커패시터 코드 입력',
      placeholder: '예: 101, 104, 105, 4R7',
      result: '결과',
      codeType: '코드 종류',
      formula: '공식',
      note: '설명',
      illustration: 'MLCC 칩 커패시터 예시',
    },
    common: {
      empty: '—',
      unsupported: '지원되지 않음',
      unknown: '알 수 없음',
      enterResistorSmd: '해독할 SMD 저항 코드를 입력하세요',
      enterCapacitorSmd: '해독할 세라믹 커패시터 코드를 입력하세요',
      rNotationNote: '문자 R은 소수점을 의미합니다',
      smd3DigitNote: '앞의 2자리는 유효숫자, 마지막 자리는 승수 지수입니다',
      smd4DigitNote: '더 높은 정밀도의 코드로, 낮은 허용오차 저항에 자주 사용됩니다',
      eia96Note: 'EIA-96 기반 1% SMD 저항 코드',
      capacitor3DigitNote: '세라믹 커패시터 코드의 기본 단위는 pF입니다',
      capacitorUnknownNote:
        '작은 SMD 커패시터는 마킹이 없는 경우가 많으므로 BOM 또는 LCR 미터가 필요합니다',
      decimalRole: 'R 표기',
      defaultPfUnit: '기본 단위는 pF',
      examples: '예시',
      footer: 'Busan, South Korea, 2026',
    },
    colors: {
      black: '검정',
      brown: '갈색',
      red: '빨강',
      orange: '주황',
      yellow: '노랑',
      green: '초록',
      blue: '파랑',
      violet: '보라',
      gray: '회색',
      white: '흰색',
      silver: '은색',
      gold: '금색',
      none: '없음',
    },
  },
  zh: {
    languageName: '中文',
    badge: 'Component Code Decoder by',
    title: '电阻与电容解码器',
    subtitle: '快速解读色环电阻、SMD 电阻和陶瓷电容数值。',
    supportLine: '(支持 4/5/6 环、3 位码、4 位码、R 表示法和 EIA-96)',
    backHome: '← 返回首页',
    language: '语言',
    tabs: { resistorBand: '色环电阻', resistorSmd: 'SMD 电阻', capacitorSmd: '陶瓷电容' },
    resistorBand: {
      title: '色环电阻',
      desc: '选择 4、5 或 6 环，然后为每一环选择颜色以计算阻值。',
      value: '电阻值',
      quickRules: '快速规则',
      band1: '第1环',
      band2: '第2环',
      band3: '第3环',
      band4Multiplier: '倍乘系数（第4环）',
      band5Tolerance: '误差（第5环）',
      band6Tempco: '温度系数（第6环）',
      multiplierBand3: '倍乘系数（第3环）',
      multiplierBand4: '倍乘系数（第4环）',
      toleranceBand4: '误差（第4环）',
      toleranceBand5: '误差（第5环）',
      formula: '公式',
      tolerance: '误差',
      tempco: '温度系数',
      illustration: '轴向电阻示意图',
      rule4: '4 环 = 2 位有效数字 + 倍乘系数 + 误差',
      rule5: '5 环 = 3 位有效数字 + 倍乘系数 + 误差',
      rule6: '6 环 = 5 环 + 温度系数 (ppm/°C)',
    },
    resistorSmd: {
      title: 'SMD 电阻',
      desc: '支持 3 位码、4 位码、R 表示法和 EIA-96。',
      input: '输入 SMD 电阻代码',
      placeholder: '例如：472, 1001, 4R7, 01Y',
      result: '结果',
      codeType: '代码类型',
      formula: '公式',
      note: '说明',
      illustration: 'SMD 电阻示意图',
      type3Digit: '3 位码',
      type4Digit: '4 位码',
      typeR: 'R 表示法',
      typeEia96: 'EIA-96',
    },
    capacitorSmd: {
      title: '陶瓷电容',
      desc: '解码常见陶瓷电容代码。3 位码默认单位为 pF。',
      input: '输入陶瓷电容代码',
      placeholder: '例如：101, 104, 105, 4R7',
      result: '结果',
      codeType: '代码类型',
      formula: '公式',
      note: '说明',
      illustration: 'MLCC 贴片电容示意图',
    },
    common: {
      empty: '—',
      unsupported: '不支持',
      unknown: '未知',
      enterResistorSmd: '请输入要解码的 SMD 电阻代码',
      enterCapacitorSmd: '请输入要解码的陶瓷电容代码',
      rNotationNote: '字母 R 作为小数点',
      smd3DigitNote: '前两位是有效数字，最后一位是乘数指数',
      smd4DigitNote: '更高精度的代码，常用于低误差电阻',
      eia96Note: '基于 EIA-96 的 1% SMD 电阻代码',
      capacitor3DigitNote: '陶瓷电容代码默认单位为 pF',
      capacitorUnknownNote: '许多小型 SMD 电容没有丝印，需要 BOM 或 LCR 表确认',
      decimalRole: 'R 表示法',
      defaultPfUnit: '默认单位为 pF',
      examples: '示例',
      footer: 'Busan, South Korea, 2026',
    },
    colors: {
      black: '黑',
      brown: '棕',
      red: '红',
      orange: '橙',
      yellow: '黄',
      green: '绿',
      blue: '蓝',
      violet: '紫',
      gray: '灰',
      white: '白',
      silver: '银',
      gold: '金',
      none: '无',
    },
  },
  ru: {
    languageName: 'Русский',
    badge: 'Component Code Decoder by',
    title: 'Декодер резисторов и конденсаторов',
    subtitle:
      'Быстрое определение номиналов цветовых резисторов, SMD-резисторов и керамических конденсаторов.',
    supportLine: '(Поддержка 4/5/6 полос, 3-значного, 4-значного, R-обозначения и EIA-96)',
    backHome: '← На главную',
    language: 'Язык',
    tabs: {
      resistorBand: 'Цветовой резистор',
      resistorSmd: 'SMD-резистор',
      capacitorSmd: 'Керамический конденсатор',
    },
    resistorBand: {
      title: 'Цветовой резистор',
      desc: 'Выберите 4, 5 или 6 полос и задайте цвет каждой полосы для расчёта сопротивления.',
      value: 'Сопротивление',
      quickRules: 'Быстрые правила',
      band1: 'Полоса 1',
      band2: 'Полоса 2',
      band3: 'Полоса 3',
      band4Multiplier: 'Множитель (полоса 4)',
      band5Tolerance: 'Допуск (полоса 5)',
      band6Tempco: 'ТКС (полоса 6)',
      multiplierBand3: 'Множитель (полоса 3)',
      multiplierBand4: 'Множитель (полоса 4)',
      toleranceBand4: 'Допуск (полоса 4)',
      toleranceBand5: 'Допуск (полоса 5)',
      formula: 'Формула',
      tolerance: 'Допуск',
      tempco: 'ТКС',
      illustration: 'Иллюстрация выводного резистора',
      rule4: '4 полосы = 2 значащие цифры + множитель + допуск',
      rule5: '5 полос = 3 значащие цифры + множитель + допуск',
      rule6: '6 полос = 5 полос + ТКС (ppm/°C)',
    },
    resistorSmd: {
      title: 'SMD-резистор',
      desc: 'Поддерживаются 3-значный, 4-значный код, R-обозначение и EIA-96.',
      input: 'Введите код SMD-резистора',
      placeholder: 'Например: 472, 1001, 4R7, 01Y',
      result: 'Результат',
      codeType: 'Тип кода',
      formula: 'Формула',
      note: 'Примечание',
      illustration: 'Иллюстрация SMD-резистора',
      type3Digit: '3-значный',
      type4Digit: '4-значный',
      typeR: 'R-обозначение',
      typeEia96: 'EIA-96',
    },
    capacitorSmd: {
      title: 'Керамический конденсатор',
      desc: 'Декодирование распространённых кодов керамических конденсаторов. Единица по умолчанию для 3-значного кода — pF.',
      input: 'Введите код керамического конденсатора',
      placeholder: 'Например: 101, 104, 105, 4R7',
      result: 'Результат',
      codeType: 'Тип кода',
      formula: 'Формула',
      note: 'Примечание',
      illustration: 'Иллюстрация MLCC-конденсатора',
    },
    common: {
      empty: '—',
      unsupported: 'Не поддерживается',
      unknown: 'Неизвестно',
      enterResistorSmd: 'Введите код SMD-резистора для декодирования',
      enterCapacitorSmd: 'Введите код керамического конденсатора для декодирования',
      rNotationNote: 'Буква R используется как десятичная точка',
      smd3DigitNote: 'Первые 2 цифры — значащие, последняя — степень множителя',
      smd4DigitNote: 'Более точный код, обычно используется для резисторов с малым допуском',
      eia96Note: 'Код 1% SMD-резистора по стандарту EIA-96',
      capacitor3DigitNote: 'Единица по умолчанию для кода керамического конденсатора — pF',
      capacitorUnknownNote:
        'Многие маленькие SMD-конденсаторы не имеют маркировки; используйте BOM или LCR-метр',
      decimalRole: 'R-обозначение',
      defaultPfUnit: 'Единица по умолчанию — pF',
      examples: 'Примеры',
      footer: 'Busan, South Korea, 2026',
    },
    colors: {
      black: 'Чёрный',
      brown: 'Коричневый',
      red: 'Красный',
      orange: 'Оранжевый',
      yellow: 'Жёлтый',
      green: 'Зелёный',
      blue: 'Синий',
      violet: 'Фиолетовый',
      gray: 'Серый',
      white: 'Белый',
      silver: 'Серебро',
      gold: 'Золото',
      none: 'Нет',
    },
  },
  fr: {
    languageName: 'Français',
    badge: 'Component Code Decoder by',
    title: 'Décodeur de résistances et condensateurs',
    subtitle:
      'Décodage rapide des résistances à bandes, résistances CMS et condensateurs céramiques.',
    supportLine: '(Prend en charge 4/5/6 bandes, 3 chiffres, 4 chiffres, notation R et EIA-96)',
    backHome: '← Retour à l’accueil',
    language: 'Langue',
    tabs: {
      resistorBand: 'Résistance à bandes',
      resistorSmd: 'Résistance CMS',
      capacitorSmd: 'Condensateur céramique',
    },
    resistorBand: {
      title: 'Résistance à bandes',
      desc: 'Choisissez 4, 5 ou 6 bandes, puis sélectionnez chaque couleur pour calculer la valeur.',
      value: 'Valeur de résistance',
      quickRules: 'Règles rapides',
      band1: 'Bande 1',
      band2: 'Bande 2',
      band3: 'Bande 3',
      band4Multiplier: 'Multiplicateur (bande 4)',
      band5Tolerance: 'Tolérance (bande 5)',
      band6Tempco: 'Tempco (bande 6)',
      multiplierBand3: 'Multiplicateur (bande 3)',
      multiplierBand4: 'Multiplicateur (bande 4)',
      toleranceBand4: 'Tolérance (bande 4)',
      toleranceBand5: 'Tolérance (bande 5)',
      formula: 'Formule',
      tolerance: 'Tolérance',
      tempco: 'Tempco',
      illustration: 'Illustration d’une résistance traversante',
      rule4: '4 bandes = 2 chiffres significatifs + multiplicateur + tolérance',
      rule5: '5 bandes = 3 chiffres significatifs + multiplicateur + tolérance',
      rule6: '6 bandes = 5 bandes + tempco (ppm/°C)',
    },
    resistorSmd: {
      title: 'Résistance CMS',
      desc: 'Prend en charge 3 chiffres, 4 chiffres, notation R et EIA-96.',
      input: 'Saisir le code de la résistance CMS',
      placeholder: 'Exemple : 472, 1001, 4R7, 01Y',
      result: 'Résultat',
      codeType: 'Type de code',
      formula: 'Formule',
      note: 'Note',
      illustration: 'Illustration d’une résistance CMS',
      type3Digit: '3 chiffres',
      type4Digit: '4 chiffres',
      typeR: 'Notation R',
      typeEia96: 'EIA-96',
    },
    capacitorSmd: {
      title: 'Condensateur céramique',
      desc: 'Décode les codes courants des condensateurs céramiques. L’unité par défaut du code à 3 chiffres est le pF.',
      input: 'Saisir le code du condensateur céramique',
      placeholder: 'Exemple : 101, 104, 105, 4R7',
      result: 'Résultat',
      codeType: 'Type de code',
      formula: 'Formule',
      note: 'Note',
      illustration: 'Illustration d’un condensateur MLCC CMS',
    },
    common: {
      empty: '—',
      unsupported: 'Non pris en charge',
      unknown: 'Inconnu',
      enterResistorSmd: 'Saisissez un code de résistance CMS à décoder',
      enterCapacitorSmd: 'Saisissez un code de condensateur céramique à décoder',
      rNotationNote: 'La lettre R joue le rôle de séparateur décimal',
      smd3DigitNote:
        'Les 2 premiers chiffres sont significatifs, le dernier est l’exposant du multiplicateur',
      smd4DigitNote: 'Code plus précis, souvent utilisé pour les résistances à faible tolérance',
      eia96Note: 'Code de résistance CMS 1% selon la norme EIA-96',
      capacitor3DigitNote: 'L’unité par défaut du code de condensateur céramique est le pF',
      capacitorUnknownNote:
        'De nombreux petits condensateurs CMS ne sont pas marqués ; il faut un BOM ou un LCR mètre',
      decimalRole: 'Notation R',
      defaultPfUnit: 'L’unité par défaut est le pF',
      examples: 'Exemples',
      footer: 'Busan, South Korea, 2026',
    },
    colors: {
      black: 'Noir',
      brown: 'Marron',
      red: 'Rouge',
      orange: 'Orange',
      yellow: 'Jaune',
      green: 'Vert',
      blue: 'Bleu',
      violet: 'Violet',
      gray: 'Gris',
      white: 'Blanc',
      silver: 'Argent',
      gold: 'Or',
      none: 'Aucune',
    },
  },
  ja: {
    languageName: '日本語',
    badge: 'Component Code Decoder by',
    title: '抵抗器・コンデンサ デコーダ',
    subtitle: 'カラーコード抵抗、SMD抵抗、セラミックコンデンサの値をすばやく読み取ります。',
    supportLine: '(4/5/6バンド、3桁、4桁、R表記、EIA-96 に対応)',
    backHome: '← ホームへ戻る',
    language: '言語',
    tabs: {
      resistorBand: 'カラーコード抵抗',
      resistorSmd: 'SMD抵抗',
      capacitorSmd: 'セラミックコンデンサ',
    },
    resistorBand: {
      title: 'カラーコード抵抗',
      desc: '4、5、6バンドを選び、各色を選択して抵抗値を計算します。',
      value: '抵抗値',
      quickRules: 'クイックルール',
      band1: 'バンド1',
      band2: 'バンド2',
      band3: 'バンド3',
      band4Multiplier: '倍率（バンド4）',
      band5Tolerance: '許容差（バンド5）',
      band6Tempco: '温度係数（バンド6）',
      multiplierBand3: '倍率（バンド3）',
      multiplierBand4: '倍率（バンド4）',
      toleranceBand4: '許容差（バンド4）',
      toleranceBand5: '許容差（バンド5）',
      formula: '式',
      tolerance: '許容差',
      tempco: '温度係数',
      illustration: 'リード抵抗のイラスト',
      rule4: '4バンド = 有効数字2桁 + 倍率 + 許容差',
      rule5: '5バンド = 有効数字3桁 + 倍率 + 許容差',
      rule6: '6バンド = 5バンド + 温度係数 (ppm/°C)',
    },
    resistorSmd: {
      title: 'SMD抵抗',
      desc: '3桁、4桁、R表記、EIA-96 に対応。',
      input: 'SMD抵抗コードを入力',
      placeholder: '例: 472, 1001, 4R7, 01Y',
      result: '結果',
      codeType: 'コード種別',
      formula: '式',
      note: 'メモ',
      illustration: 'SMD抵抗のイラスト',
      type3Digit: '3桁',
      type4Digit: '4桁',
      typeR: 'R表記',
      typeEia96: 'EIA-96',
    },
    capacitorSmd: {
      title: 'セラミックコンデンサ',
      desc: '一般的なセラミックコンデンサコードを解読します。3桁コードの既定単位は pF です。',
      input: 'セラミックコンデンサコードを入力',
      placeholder: '例: 101, 104, 105, 4R7',
      result: '結果',
      codeType: 'コード種別',
      formula: '式',
      note: 'メモ',
      illustration: 'MLCCチップコンデンサのイラスト',
    },
    common: {
      empty: '—',
      unsupported: '未対応',
      unknown: '不明',
      enterResistorSmd: '解読する SMD 抵抗コードを入力してください',
      enterCapacitorSmd: '解読するセラミックコンデンサコードを入力してください',
      rNotationNote: '文字 R は小数点として機能します',
      smd3DigitNote: '最初の2桁は有効数字、最後の1桁は倍率の指数です',
      smd4DigitNote: 'より高精度なコードで、低許容差抵抗によく使われます',
      eia96Note: 'EIA-96 に基づく 1% SMD 抵抗コード',
      capacitor3DigitNote: 'セラミックコンデンサコードの既定単位は pF です',
      capacitorUnknownNote:
        '小型の SMD コンデンサは無印字のことが多く、BOM や LCR メータが必要です',
      decimalRole: 'R表記',
      defaultPfUnit: '既定単位は pF',
      examples: '例',
      footer: 'Busan, South Korea, 2026',
    },
    colors: {
      black: '黒',
      brown: '茶',
      red: '赤',
      orange: '橙',
      yellow: '黄',
      green: '緑',
      blue: '青',
      violet: '紫',
      gray: '灰',
      white: '白',
      silver: '銀',
      gold: '金',
      none: 'なし',
    },
  },
}

const lang = ref<Lang>('vi')
const tr = computed(() => translations[lang.value])

const activeTab = ref<MainTab>('resistor-band')
const resistorBandMode = ref<BandMode>('4')

const resistorDigitColors: ColorBandOption[] = [
  { key: 'black', value: 0, multiplier: 1, swatchClass: 'bg-black', textClass: 'text-white' },
  {
    key: 'brown',
    value: 1,
    multiplier: 10,
    tolerance: '±1%',
    tempco: '100 ppm/°C',
    swatchClass: 'bg-amber-900',
    textClass: 'text-white',
  },
  {
    key: 'red',
    value: 2,
    multiplier: 100,
    tolerance: '±2%',
    tempco: '50 ppm/°C',
    swatchClass: 'bg-red-500',
    textClass: 'text-white',
  },
  {
    key: 'orange',
    value: 3,
    multiplier: 1_000,
    tempco: '15 ppm/°C',
    swatchClass: 'bg-orange-500',
    textClass: 'text-white',
  },
  {
    key: 'yellow',
    value: 4,
    multiplier: 10_000,
    tempco: '25 ppm/°C',
    swatchClass: 'bg-yellow-400',
    textClass: 'text-black',
  },
  {
    key: 'green',
    value: 5,
    multiplier: 100_000,
    tolerance: '±0.5%',
    swatchClass: 'bg-green-500',
    textClass: 'text-white',
  },
  {
    key: 'blue',
    value: 6,
    multiplier: 1_000_000,
    tolerance: '±0.25%',
    tempco: '10 ppm/°C',
    swatchClass: 'bg-blue-500',
    textClass: 'text-white',
  },
  {
    key: 'violet',
    value: 7,
    multiplier: 10_000_000,
    tolerance: '±0.1%',
    tempco: '5 ppm/°C',
    swatchClass: 'bg-violet-500',
    textClass: 'text-white',
  },
  {
    key: 'gray',
    value: 8,
    multiplier: 100_000_000,
    tolerance: '±0.05%',
    swatchClass: 'bg-gray-400',
    textClass: 'text-black',
  },
  {
    key: 'white',
    value: 9,
    multiplier: 1_000_000_000,
    swatchClass: 'bg-white',
    textClass: 'text-black',
  },
]

const resistorMultiplierColors: ColorBandOption[] = [
  { key: 'silver', multiplier: 0.01, swatchClass: 'bg-slate-300', textClass: 'text-black' },
  { key: 'gold', multiplier: 0.1, swatchClass: 'bg-yellow-600', textClass: 'text-white' },
  ...resistorDigitColors,
]

const resistorToleranceColors: ColorBandOption[] = [
  { key: 'brown', tolerance: '±1%', swatchClass: 'bg-amber-900', textClass: 'text-white' },
  { key: 'red', tolerance: '±2%', swatchClass: 'bg-red-500', textClass: 'text-white' },
  { key: 'green', tolerance: '±0.5%', swatchClass: 'bg-green-500', textClass: 'text-white' },
  { key: 'blue', tolerance: '±0.25%', swatchClass: 'bg-blue-500', textClass: 'text-white' },
  { key: 'violet', tolerance: '±0.1%', swatchClass: 'bg-violet-500', textClass: 'text-white' },
  { key: 'gray', tolerance: '±0.05%', swatchClass: 'bg-gray-400', textClass: 'text-black' },
  { key: 'gold', tolerance: '±5%', swatchClass: 'bg-yellow-600', textClass: 'text-white' },
  { key: 'silver', tolerance: '±10%', swatchClass: 'bg-slate-300', textClass: 'text-black' },
  {
    key: 'none',
    tolerance: '±20%',
    swatchClass: 'bg-transparent border border-dashed border-text-dim',
    textClass: 'text-text-secondary',
  },
]

const resistorTempcoColors: ColorBandOption[] = [
  { key: 'brown', tempco: '100 ppm/°C', swatchClass: 'bg-amber-900', textClass: 'text-white' },
  { key: 'red', tempco: '50 ppm/°C', swatchClass: 'bg-red-500', textClass: 'text-white' },
  { key: 'orange', tempco: '15 ppm/°C', swatchClass: 'bg-orange-500', textClass: 'text-white' },
  { key: 'yellow', tempco: '25 ppm/°C', swatchClass: 'bg-yellow-400', textClass: 'text-black' },
  { key: 'blue', tempco: '10 ppm/°C', swatchClass: 'bg-blue-500', textClass: 'text-white' },
  { key: 'violet', tempco: '5 ppm/°C', swatchClass: 'bg-violet-500', textClass: 'text-white' },
]

const selectedBand1 = ref<ColorKey>('yellow')
const selectedBand2 = ref<ColorKey>('violet')
const selectedBand3 = ref<ColorKey>('black')
const selectedBand4 = ref<ColorKey>('gold')
const selectedBand5 = ref<ColorKey>('brown')
const selectedBand6 = ref<ColorKey>('brown')

const resistorSmdCode = ref('472')
const capacitorSmdCode = ref('104')

const eia96BaseMap: Record<string, number> = {
  '01': 100,
  '02': 102,
  '03': 105,
  '04': 107,
  '05': 110,
  '06': 113,
  '07': 115,
  '08': 118,
  '09': 121,
  '10': 124,
  '11': 127,
  '12': 130,
  '13': 133,
  '14': 137,
  '15': 140,
  '16': 143,
  '17': 147,
  '18': 150,
  '19': 154,
  '20': 158,
  '21': 162,
  '22': 165,
  '23': 169,
  '24': 174,
  '25': 178,
  '26': 182,
  '27': 187,
  '28': 191,
  '29': 196,
  '30': 200,
  '31': 205,
  '32': 210,
  '33': 215,
  '34': 221,
  '35': 226,
  '36': 232,
  '37': 237,
  '38': 243,
  '39': 249,
  '40': 255,
  '41': 261,
  '42': 267,
  '43': 274,
  '44': 280,
  '45': 287,
  '46': 294,
  '47': 301,
  '48': 309,
  '49': 316,
  '50': 324,
  '51': 332,
  '52': 340,
  '53': 348,
  '54': 357,
  '55': 365,
  '56': 374,
  '57': 383,
  '58': 392,
  '59': 402,
  '60': 412,
  '61': 422,
  '62': 432,
  '63': 442,
  '64': 453,
  '65': 464,
  '66': 475,
  '67': 487,
  '68': 499,
  '69': 511,
  '70': 523,
  '71': 536,
  '72': 549,
  '73': 562,
  '74': 576,
  '75': 590,
  '76': 604,
  '77': 619,
  '78': 634,
  '79': 649,
  '80': 665,
  '81': 681,
  '82': 698,
  '83': 715,
  '84': 732,
  '85': 750,
  '86': 768,
  '87': 787,
  '88': 806,
  '89': 825,
  '90': 845,
  '91': 866,
  '92': 887,
  '93': 909,
  '94': 931,
  '95': 953,
  '96': 976,
}
const eia96MultiplierMap: Record<string, number> = {
  Z: 0.001,
  Y: 0.01,
  X: 0.1,
  A: 1,
  B: 10,
  C: 100,
  D: 1000,
  E: 10000,
  F: 100000,
}

function colorLabel(color: ColorKey): string {
  return tr.value.colors[color]
}

function getBandOption(options: ColorBandOption[], key: string): ColorBandOption | undefined {
  return options.find((option) => option.key === key)
}

function normalizeBandForMode(mode: BandMode) {
  if (!getBandOption(resistorDigitColors, selectedBand1.value)) selectedBand1.value = 'brown'
  if (!getBandOption(resistorDigitColors, selectedBand2.value)) selectedBand2.value = 'black'

  if (mode === '4') {
    if (!getBandOption(resistorMultiplierColors, selectedBand3.value)) selectedBand3.value = 'black'
    if (!getBandOption(resistorToleranceColors, selectedBand4.value)) selectedBand4.value = 'gold'
    return
  }

  if (!getBandOption(resistorDigitColors, selectedBand3.value)) selectedBand3.value = 'black'
  if (!getBandOption(resistorMultiplierColors, selectedBand4.value)) selectedBand4.value = 'black'
  if (!getBandOption(resistorToleranceColors, selectedBand5.value)) selectedBand5.value = 'brown'

  if (mode === '6' && !getBandOption(resistorTempcoColors, selectedBand6.value)) {
    selectedBand6.value = 'brown'
  }
}

function stripZero(value: number): string {
  return Number(value.toFixed(6)).toString()
}

function formatOhm(value: number): string {
  const abs = Math.abs(value)
  if (abs >= 1_000_000_000) return `${stripZero(value / 1_000_000_000)} GΩ`
  if (abs >= 1_000_000) return `${stripZero(value / 1_000_000)} MΩ`
  if (abs >= 1_000) return `${stripZero(value / 1_000)} kΩ`
  if (abs >= 1) return `${stripZero(value)} Ω`
  if (abs >= 0.001) return `${stripZero(value * 1_000)} mΩ`
  return `${stripZero(value)} Ω`
}

function formatCapacitanceFromPf(valuePf: number): string {
  if (valuePf >= 1_000_000) return `${stripZero(valuePf / 1_000_000)} µF`
  if (valuePf >= 1_000) return `${stripZero(valuePf / 1_000)} nF`
  return `${stripZero(valuePf)} pF`
}

const resistorBandResult = computed(() => {
  const band1 = getBandOption(resistorDigitColors, selectedBand1.value)
  const band2 = getBandOption(resistorDigitColors, selectedBand2.value)
  const band3 = getBandOption(resistorDigitColors, selectedBand3.value)
  const multiplier = getBandOption(resistorMultiplierColors, selectedBand4.value)
  const tolerance = getBandOption(resistorToleranceColors, selectedBand5.value)
  const tempco = getBandOption(resistorTempcoColors, selectedBand6.value)

  if (!band1 || !band2) {
    return {
      rawValue: 0,
      display: tr.value.common.empty,
      tolerance: tr.value.common.empty,
      tempco: '',
      formula: tr.value.common.empty,
    }
  }

  if (resistorBandMode.value === '4') {
    const multiplier4 = getBandOption(resistorMultiplierColors, selectedBand3.value)
    const tolerance4 = getBandOption(resistorToleranceColors, selectedBand4.value)
    const rawValue = ((band1.value ?? 0) * 10 + (band2.value ?? 0)) * (multiplier4?.multiplier ?? 1)
    return {
      rawValue,
      display: formatOhm(rawValue),
      tolerance: tolerance4?.tolerance ?? tr.value.common.empty,
      tempco: '',
      formula: `(${band1.value}${band2.value}) × ${multiplier4?.multiplier ?? 1}`,
    }
  }

  if (!band3 || !multiplier) {
    return {
      rawValue: 0,
      display: tr.value.common.empty,
      tolerance: tr.value.common.empty,
      tempco: '',
      formula: tr.value.common.empty,
    }
  }

  const significant = (band1.value ?? 0) * 100 + (band2.value ?? 0) * 10 + (band3.value ?? 0)
  const rawValue = significant * (multiplier.multiplier ?? 1)
  return {
    rawValue,
    display: formatOhm(rawValue),
    tolerance: tolerance?.tolerance ?? tr.value.common.empty,
    tempco: resistorBandMode.value === '6' ? (tempco?.tempco ?? tr.value.common.empty) : '',
    formula: `(${band1.value}${band2.value}${band3.value}) × ${multiplier.multiplier ?? 1}`,
  }
})

const resistorBodyBands = computed(() => {
  if (resistorBandMode.value === '4')
    return [selectedBand1.value, selectedBand2.value, selectedBand3.value, selectedBand4.value]
  if (resistorBandMode.value === '5')
    return [
      selectedBand1.value,
      selectedBand2.value,
      selectedBand3.value,
      selectedBand4.value,
      selectedBand5.value,
    ]
  return [
    selectedBand1.value,
    selectedBand2.value,
    selectedBand3.value,
    selectedBand4.value,
    selectedBand5.value,
    selectedBand6.value,
  ]
})

function localizeSmdType(type: 'r' | '3' | '4' | 'eia96' | 'unknown' | 'empty'): string {
  if (type === 'r') return tr.value.resistorSmd.typeR
  if (type === '3') return tr.value.resistorSmd.type3Digit
  if (type === '4') return tr.value.resistorSmd.type4Digit
  if (type === 'eia96') return tr.value.resistorSmd.typeEia96
  if (type === 'empty') return tr.value.common.empty
  return tr.value.common.unknown
}

function decodeResistorSmd(code: string) {
  const normalized = code.trim().toUpperCase()
  if (!normalized) {
    return {
      normalized: '',
      type: localizeSmdType('empty'),
      value: tr.value.common.empty,
      formula: tr.value.common.empty,
      note: tr.value.common.enterResistorSmd,
    }
  }
  if (/^(?:\d+R\d*|R\d+)$/.test(normalized)) {
    const ohmValue = Number(normalized.replace('R', '.'))
    return {
      normalized,
      type: localizeSmdType('r'),
      value: formatOhm(ohmValue),
      formula: `${normalized.replace('R', '.')} Ω`,
      note: tr.value.common.rNotationNote,
    }
  }
  if (/^\d{3}$/.test(normalized)) {
    const base = Number(normalized.slice(0, 2))
    const multiplier = Number(normalized[2])
    const rawValue = base * 10 ** multiplier
    return {
      normalized,
      type: localizeSmdType('3'),
      value: formatOhm(rawValue),
      formula: `${base} × 10^${multiplier}`,
      note: tr.value.common.smd3DigitNote,
    }
  }
  if (/^\d{4}$/.test(normalized)) {
    const base = Number(normalized.slice(0, 3))
    const multiplier = Number(normalized[3])
    const rawValue = base * 10 ** multiplier
    return {
      normalized,
      type: localizeSmdType('4'),
      value: formatOhm(rawValue),
      formula: `${base} × 10^${multiplier}`,
      note: tr.value.common.smd4DigitNote,
    }
  }
  if (/^\d{2}[A-Z]$/.test(normalized)) {
    const base = eia96BaseMap[normalized.slice(0, 2)]
    const multiplier = eia96MultiplierMap[normalized.charAt(2)]
    if (base !== undefined && multiplier !== undefined) {
      const rawValue = base * multiplier
      return {
        normalized,
        type: localizeSmdType('eia96'),
        value: formatOhm(rawValue),
        formula: `${base} × ${multiplier}`,
        note: tr.value.common.eia96Note,
      }
    }
  }
  return {
    normalized,
    type: tr.value.common.unknown,
    value: tr.value.common.unsupported,
    formula: tr.value.common.empty,
    note: tr.value.common.unsupported,
  }
}

function decodeCapacitorSmd(code: string) {
  const normalized = code.trim().toUpperCase()
  if (!normalized) {
    return {
      normalized: '',
      type: tr.value.common.empty,
      value: tr.value.common.empty,
      formula: tr.value.common.empty,
      note: tr.value.common.enterCapacitorSmd,
    }
  }
  if (/^\d+R\d+$/.test(normalized)) {
    const valuePf = Number(normalized.replace('R', '.'))
    return {
      normalized,
      type: tr.value.resistorSmd.typeR,
      value: formatCapacitanceFromPf(valuePf),
      formula: `${normalized.replace('R', '.')} pF`,
      note: tr.value.common.rNotationNote,
    }
  }
  if (/^\d{3}$/.test(normalized)) {
    const base = Number(normalized.slice(0, 2))
    const multiplier = Number(normalized[2])
    const valuePf = base * 10 ** multiplier
    return {
      normalized,
      type: tr.value.resistorSmd.type3Digit,
      value: formatCapacitanceFromPf(valuePf),
      formula: `${base} × 10^${multiplier} pF`,
      note: tr.value.common.capacitor3DigitNote,
    }
  }
  return {
    normalized,
    type: tr.value.common.unknown,
    value: tr.value.common.unsupported,
    formula: tr.value.common.empty,
    note: tr.value.common.capacitorUnknownNote,
  }
}

const resistorSmdResult = computed(() => decodeResistorSmd(resistorSmdCode.value))
const capacitorSmdResult = computed(() => decodeCapacitorSmd(capacitorSmdCode.value))

watch(resistorBandMode, (mode) => normalizeBandForMode(mode))

function getSwatchClass(colorKey: string): string {
  const option =
    getBandOption(resistorDigitColors, colorKey) ||
    getBandOption(resistorMultiplierColors, colorKey) ||
    getBandOption(resistorToleranceColors, colorKey) ||
    getBandOption(resistorTempcoColors, colorKey)
  return option?.swatchClass ?? 'bg-transparent border border-border-default'
}

function pickBand(target: 'b1' | 'b2' | 'b3' | 'b4' | 'b5' | 'b6', colorKey: ColorKey) {
  if (target === 'b1') selectedBand1.value = colorKey
  if (target === 'b2') selectedBand2.value = colorKey
  if (target === 'b3') selectedBand3.value = colorKey
  if (target === 'b4') selectedBand4.value = colorKey
  if (target === 'b5') selectedBand5.value = colorKey
  if (target === 'b6') selectedBand6.value = colorKey
}

const languages: Lang[] = ['vi', 'en', 'ko', 'zh', 'ru', 'fr', 'ja']
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary font-body">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <header class="mb-12 text-center">
        <div
          class="inline-flex items-center gap-2 border border-border-default bg-bg-surface px-4 py-2 text-xs text-text-secondary"
        >
          <Icon icon="lucide:cpu" class="size-4 text-accent-coral" />
          {{ tr.badge }}
          <a
            href="https://facebook.com/vnmh.mta"
            target="_blank"
            rel="noopener"
            class="text-accent-coral hover:underline"
            >Vu Nguyen Minh Hung</a
          >
        </div>

        <h1
          class="mt-6 font-display text-4xl min-[375px]:text-5xl sm:text-6xl font-bold text-accent-coral"
        >
          {{ tr.title }}
        </h1>
        <p class="mt-4 text-text-secondary text-lg max-w-3xl mx-auto">{{ tr.subtitle }}</p>
        <p class="mt-3 text-text-dim text-sm">{{ tr.supportLine }}</p>

        <div class="mt-6 flex flex-col sm:flex-row gap-3 justify-between items-center">
          <RouterLink
            to="/"
            class="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium border border-border-default rounded-lg bg-bg-elevated hover:border-accent-coral hover:text-accent-coral transition"
          >
            {{ tr.backHome }}
          </RouterLink>

          <div
            class="flex items-center gap-3 border border-border-default bg-bg-surface px-3 py-2 rounded-lg"
          >
            <Icon icon="lucide:languages" class="size-4 text-accent-coral" />
            <label class="text-sm text-text-secondary">{{ tr.language }}</label>
            <select
              v-model="lang"
              class="bg-bg-elevated border border-border-default px-3 py-2 text-sm focus:border-accent-coral focus:outline-none rounded-md"
            >
              <option v-for="code in languages" :key="code" :value="code">
                {{ translations[code].languageName }}
              </option>
            </select>
          </div>
        </div>
      </header>

      <section class="mb-10">
        <div
          class="border border-border-default bg-bg-surface p-2 grid grid-cols-1 sm:grid-cols-3 gap-2"
        >
          <button
            class="px-4 py-3 text-sm transition flex items-center justify-center gap-2 border"
            :class="
              activeTab === 'resistor-band'
                ? 'border-accent-coral bg-accent-coral/10 text-accent-coral'
                : 'border-border-default text-text-secondary hover:border-accent-coral hover:text-accent-coral'
            "
            @click="activeTab = 'resistor-band'"
          >
            <Icon icon="lucide:palette" class="size-4" />
            {{ tr.tabs.resistorBand }}
          </button>
          <button
            class="px-4 py-3 text-sm transition flex items-center justify-center gap-2 border"
            :class="
              activeTab === 'resistor-smd'
                ? 'border-accent-amber bg-accent-amber/10 text-accent-amber'
                : 'border-border-default text-text-secondary hover:border-accent-amber hover:text-accent-amber'
            "
            @click="activeTab = 'resistor-smd'"
          >
            <Icon icon="lucide:scan-search" class="size-4" />
            {{ tr.tabs.resistorSmd }}
          </button>
          <button
            class="px-4 py-3 text-sm transition flex items-center justify-center gap-2 border"
            :class="
              activeTab === 'capacitor-smd'
                ? 'border-accent-sky bg-accent-sky/10 text-accent-sky'
                : 'border-border-default text-text-secondary hover:border-accent-sky hover:text-accent-sky'
            "
            @click="activeTab = 'capacitor-smd'"
          >
            <Icon icon="lucide:cable" class="size-4" />
            {{ tr.tabs.capacitorSmd }}
          </button>
        </div>
      </section>

      <section v-if="activeTab === 'resistor-band'" class="space-y-8">
        <div class="border border-border-default bg-bg-surface p-6">
          <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <div>
              <h2 class="font-display text-2xl font-semibold flex items-center gap-3">
                <span class="text-accent-coral text-sm tracking-widest font-display">//</span
                >{{ tr.resistorBand.title }}
              </h2>
              <p class="mt-2 text-sm text-text-secondary">{{ tr.resistorBand.desc }}</p>
            </div>
            <div class="flex gap-2">
              <button
                class="border px-4 py-2 text-sm transition"
                :class="
                  resistorBandMode === '4'
                    ? 'border-accent-coral bg-accent-coral/10 text-accent-coral'
                    : 'border-border-default text-text-secondary hover:border-accent-coral hover:text-accent-coral'
                "
                @click="resistorBandMode = '4'"
              >
                4 band
              </button>
              <button
                class="border px-4 py-2 text-sm transition"
                :class="
                  resistorBandMode === '5'
                    ? 'border-accent-coral bg-accent-coral/10 text-accent-coral'
                    : 'border-border-default text-text-secondary hover:border-accent-coral hover:text-accent-coral'
                "
                @click="resistorBandMode = '5'"
              >
                5 band
              </button>
              <button
                class="border px-4 py-2 text-sm transition"
                :class="
                  resistorBandMode === '6'
                    ? 'border-accent-coral bg-accent-coral/10 text-accent-coral'
                    : 'border-border-default text-text-secondary hover:border-accent-coral hover:text-accent-coral'
                "
                @click="resistorBandMode = '6'"
              >
                6 band
              </button>
            </div>
          </div>

          <div class="mb-6">
            <div class="border border-border-default bg-bg-elevated p-5 overflow-x-auto">
              <div class="min-w-[520px] flex items-center gap-4">
                <div
                  class="w-10 h-10 border border-border-default rotate-45 bg-bg-surface shrink-0"
                />
                <div
                  class="flex-1 h-20 rounded-full bg-[#e9d5a1] relative border border-black/10 overflow-hidden"
                >
                  <div
                    v-for="(band, index) in resistorBodyBands"
                    :key="`${band}-${index}`"
                    class="absolute top-0 h-full w-4 sm:w-5"
                    :class="getSwatchClass(band)"
                    :style="{
                      left: `${18 + index * (resistorBandMode === '4' ? 17 : resistorBandMode === '5' ? 14 : 12)}%`,
                    }"
                  />
                </div>
                <div
                  class="w-10 h-10 border border-border-default rotate-45 bg-bg-surface shrink-0"
                />
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 xl:grid-cols-[1.4fr_1fr] gap-6">
            <div class="space-y-5">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="border border-border-default bg-bg-elevated p-4">
                  <label class="block text-text-dim text-xs mb-2">{{
                    tr.resistorBand.band1
                  }}</label>
                  <select
                    v-model="selectedBand1"
                    class="w-full bg-bg-surface border border-border-default px-3 py-2 text-sm focus:border-accent-coral focus:outline-none"
                  >
                    <option
                      v-for="option in resistorDigitColors"
                      :key="option.key"
                      :value="option.key"
                    >
                      {{ colorLabel(option.key) }}
                    </option>
                  </select>
                  <div class="mt-3 flex flex-wrap gap-2">
                    <button
                      v-for="option in resistorDigitColors"
                      :key="`b1-${option.key}`"
                      :class="[option.swatchClass, option.textClass]"
                      class="w-8 h-8 border border-white/10 text-[10px] font-bold"
                      :title="colorLabel(option.key)"
                      @click="pickBand('b1', option.key)"
                    >
                      {{ option.value }}
                    </button>
                  </div>
                </div>

                <div class="border border-border-default bg-bg-elevated p-4">
                  <label class="block text-text-dim text-xs mb-2">{{
                    tr.resistorBand.band2
                  }}</label>
                  <select
                    v-model="selectedBand2"
                    class="w-full bg-bg-surface border border-border-default px-3 py-2 text-sm focus:border-accent-coral focus:outline-none"
                  >
                    <option
                      v-for="option in resistorDigitColors"
                      :key="option.key"
                      :value="option.key"
                    >
                      {{ colorLabel(option.key) }}
                    </option>
                  </select>
                  <div class="mt-3 flex flex-wrap gap-2">
                    <button
                      v-for="option in resistorDigitColors"
                      :key="`b2-${option.key}`"
                      :class="[option.swatchClass, option.textClass]"
                      class="w-8 h-8 border border-white/10 text-[10px] font-bold"
                      :title="colorLabel(option.key)"
                      @click="pickBand('b2', option.key)"
                    >
                      {{ option.value }}
                    </button>
                  </div>
                </div>

                <div
                  v-if="resistorBandMode !== '4'"
                  class="border border-border-default bg-bg-elevated p-4"
                >
                  <label class="block text-text-dim text-xs mb-2">{{
                    tr.resistorBand.band3
                  }}</label>
                  <select
                    v-model="selectedBand3"
                    class="w-full bg-bg-surface border border-border-default px-3 py-2 text-sm focus:border-accent-coral focus:outline-none"
                  >
                    <option
                      v-for="option in resistorDigitColors"
                      :key="option.key"
                      :value="option.key"
                    >
                      {{ colorLabel(option.key) }}
                    </option>
                  </select>
                  <div class="mt-3 flex flex-wrap gap-2">
                    <button
                      v-for="option in resistorDigitColors"
                      :key="`b3-${option.key}`"
                      :class="[option.swatchClass, option.textClass]"
                      class="w-8 h-8 border border-white/10 text-[10px] font-bold"
                      :title="colorLabel(option.key)"
                      @click="pickBand('b3', option.key)"
                    >
                      {{ option.value }}
                    </button>
                  </div>
                </div>

                <div class="border border-border-default bg-bg-elevated p-4">
                  <label class="block text-text-dim text-xs mb-2">{{
                    resistorBandMode === '4'
                      ? tr.resistorBand.multiplierBand3
                      : tr.resistorBand.multiplierBand4
                  }}</label>
                  <select
                    v-if="resistorBandMode === '4'"
                    v-model="selectedBand3"
                    class="w-full bg-bg-surface border border-border-default px-3 py-2 text-sm focus:border-accent-coral focus:outline-none"
                  >
                    <option
                      v-for="option in resistorMultiplierColors"
                      :key="option.key"
                      :value="option.key"
                    >
                      {{ colorLabel(option.key) }}
                    </option>
                  </select>
                  <select
                    v-else
                    v-model="selectedBand4"
                    class="w-full bg-bg-surface border border-border-default px-3 py-2 text-sm focus:border-accent-coral focus:outline-none"
                  >
                    <option
                      v-for="option in resistorMultiplierColors"
                      :key="option.key"
                      :value="option.key"
                    >
                      {{ colorLabel(option.key) }}
                    </option>
                  </select>
                  <div class="mt-3 flex flex-wrap gap-2">
                    <button
                      v-for="option in resistorMultiplierColors"
                      :key="`mult-${option.key}`"
                      :class="[option.swatchClass, option.textClass]"
                      class="min-w-8 px-2 h-8 border border-white/10 text-[10px] font-bold"
                      :title="colorLabel(option.key)"
                      @click="pickBand(resistorBandMode === '4' ? 'b3' : 'b4', option.key)"
                    >
                      ×{{ option.multiplier }}
                    </button>
                  </div>
                </div>

                <div class="border border-border-default bg-bg-elevated p-4">
                  <label class="block text-text-dim text-xs mb-2">{{
                    resistorBandMode === '4'
                      ? tr.resistorBand.toleranceBand4
                      : tr.resistorBand.toleranceBand5
                  }}</label>
                  <select
                    v-if="resistorBandMode === '4'"
                    v-model="selectedBand4"
                    class="w-full bg-bg-surface border border-border-default px-3 py-2 text-sm focus:border-accent-coral focus:outline-none"
                  >
                    <option
                      v-for="option in resistorToleranceColors"
                      :key="option.key"
                      :value="option.key"
                    >
                      {{ colorLabel(option.key) }}
                    </option>
                  </select>
                  <select
                    v-else
                    v-model="selectedBand5"
                    class="w-full bg-bg-surface border border-border-default px-3 py-2 text-sm focus:border-accent-coral focus:outline-none"
                  >
                    <option
                      v-for="option in resistorToleranceColors"
                      :key="option.key"
                      :value="option.key"
                    >
                      {{ colorLabel(option.key) }}
                    </option>
                  </select>
                  <div class="mt-3 flex flex-wrap gap-2">
                    <button
                      v-for="option in resistorToleranceColors"
                      :key="`tol-${option.key}`"
                      :class="[option.swatchClass, option.textClass]"
                      class="min-w-8 px-2 h-8 border border-white/10 text-[10px] font-bold"
                      :title="colorLabel(option.key)"
                      @click="pickBand(resistorBandMode === '4' ? 'b4' : 'b5', option.key)"
                    >
                      {{ option.tolerance }}
                    </button>
                  </div>
                </div>

                <div
                  v-if="resistorBandMode === '6'"
                  class="border border-border-default bg-bg-elevated p-4 md:col-span-2"
                >
                  <label class="block text-text-dim text-xs mb-2">{{
                    tr.resistorBand.band6Tempco
                  }}</label>
                  <select
                    v-model="selectedBand6"
                    class="w-full bg-bg-surface border border-border-default px-3 py-2 text-sm focus:border-accent-coral focus:outline-none"
                  >
                    <option
                      v-for="option in resistorTempcoColors"
                      :key="option.key"
                      :value="option.key"
                    >
                      {{ colorLabel(option.key) }}
                    </option>
                  </select>
                  <div class="mt-3 flex flex-wrap gap-2">
                    <button
                      v-for="option in resistorTempcoColors"
                      :key="`temp-${option.key}`"
                      :class="[option.swatchClass, option.textClass]"
                      class="min-w-8 px-2 h-8 border border-white/10 text-[10px] font-bold"
                      :title="colorLabel(option.key)"
                      @click="pickBand('b6', option.key)"
                    >
                      {{ option.tempco }}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div class="space-y-4">
              <div class="border border-border-default bg-bg-elevated p-5">
                <div class="text-text-dim text-xs mb-2">{{ tr.resistorBand.value }}</div>
                <div
                  class="font-display text-4xl sm:text-5xl font-bold text-accent-coral break-words"
                >
                  {{ resistorBandResult.display }}
                </div>
                <div class="mt-4 grid grid-cols-1 gap-3 text-sm">
                  <div class="border border-border-default bg-bg-surface p-3">
                    <div class="text-text-dim text-xs mb-1">{{ tr.resistorBand.tolerance }}</div>
                    <div class="font-mono text-text-primary">
                      {{ resistorBandResult.tolerance }}
                    </div>
                  </div>
                  <div
                    v-if="resistorBandMode === '6'"
                    class="border border-border-default bg-bg-surface p-3"
                  >
                    <div class="text-text-dim text-xs mb-1">{{ tr.resistorBand.tempco }}</div>
                    <div class="font-mono text-text-primary">{{ resistorBandResult.tempco }}</div>
                  </div>
                  <div class="border border-border-default bg-bg-surface p-3">
                    <div class="text-text-dim text-xs mb-1">{{ tr.resistorBand.formula }}</div>
                    <div class="font-mono text-text-primary break-all">
                      {{ resistorBandResult.formula }}
                    </div>
                  </div>
                </div>
              </div>
              <div class="border border-border-default bg-bg-elevated p-5">
                <div class="text-text-dim text-xs mb-3">{{ tr.resistorBand.quickRules }}</div>
                <ul class="space-y-2 text-sm text-text-secondary">
                  <li>{{ tr.resistorBand.rule4 }}</li>
                  <li>{{ tr.resistorBand.rule5 }}</li>
                  <li>{{ tr.resistorBand.rule6 }}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section v-else-if="activeTab === 'resistor-smd'" class="space-y-8">
        <div class="border border-border-default bg-bg-surface p-6">
          <h2 class="font-display text-2xl font-semibold flex items-center gap-3 mb-2">
            <span class="text-accent-amber text-sm tracking-widest font-display">//</span
            >{{ tr.resistorSmd.title }}
          </h2>
          <p class="text-sm text-text-secondary mb-6">{{ tr.resistorSmd.desc }}</p>

          <div class="grid grid-cols-1 xl:grid-cols-[1.15fr_1fr] gap-6">
            <div>
              <label class="block text-text-dim text-xs mb-2">{{ tr.resistorSmd.input }}</label>
              <input
                v-model="resistorSmdCode"
                type="text"
                :placeholder="tr.resistorSmd.placeholder"
                class="w-full bg-bg-elevated border border-border-default px-4 py-3 text-lg font-mono text-text-primary placeholder:text-text-dim focus:border-accent-amber focus:outline-none transition"
              />
              <div class="mt-4 flex flex-wrap gap-2">
                <button
                  class="border border-border-default bg-bg-elevated px-3 py-2 text-sm text-text-secondary hover:border-accent-amber hover:text-accent-amber transition"
                  @click="resistorSmdCode = '472'"
                >
                  472
                </button>
                <button
                  class="border border-border-default bg-bg-elevated px-3 py-2 text-sm text-text-secondary hover:border-accent-amber hover:text-accent-amber transition"
                  @click="resistorSmdCode = '1001'"
                >
                  1001
                </button>
                <button
                  class="border border-border-default bg-bg-elevated px-3 py-2 text-sm text-text-secondary hover:border-accent-amber hover:text-accent-amber transition"
                  @click="resistorSmdCode = '4R7'"
                >
                  4R7
                </button>
                <button
                  class="border border-border-default bg-bg-elevated px-3 py-2 text-sm text-text-secondary hover:border-accent-amber hover:text-accent-amber transition"
                  @click="resistorSmdCode = '01Y'"
                >
                  01Y
                </button>
              </div>
            </div>
            <div class="border border-border-default bg-bg-elevated p-5">
              <div class="text-text-dim text-xs mb-2">{{ tr.resistorSmd.result }}</div>
              <div class="font-display text-4xl font-bold text-accent-amber break-words">
                {{ resistorSmdResult.value }}
              </div>
              <div class="mt-4 space-y-3 text-sm">
                <div class="border border-border-default bg-bg-surface p-3">
                  <div class="text-text-dim text-xs mb-1">{{ tr.resistorSmd.codeType }}</div>
                  <div class="font-mono">{{ resistorSmdResult.type }}</div>
                </div>
                <div class="border border-border-default bg-bg-surface p-3">
                  <div class="text-text-dim text-xs mb-1">{{ tr.resistorSmd.formula }}</div>
                  <div class="font-mono break-all">{{ resistorSmdResult.formula }}</div>
                </div>
                <div class="border border-border-default bg-bg-surface p-3">
                  <div class="text-text-dim text-xs mb-1">{{ tr.resistorSmd.note }}</div>
                  <div class="text-text-secondary">{{ resistorSmdResult.note }}</div>
                </div>
              </div>
            </div>
          </div>

          <div class="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <div class="border border-border-default bg-bg-elevated p-4">
              <div class="text-text-dim text-xs mb-1">{{ tr.resistorSmd.type3Digit }}</div>
              <div class="font-mono text-sm text-text-secondary">XYM → (XY) × 10^M</div>
            </div>
            <div class="border border-border-default bg-bg-elevated p-4">
              <div class="text-text-dim text-xs mb-1">{{ tr.resistorSmd.type4Digit }}</div>
              <div class="font-mono text-sm text-text-secondary">XYZM → (XYZ) × 10^M</div>
            </div>
            <div class="border border-border-default bg-bg-elevated p-4">
              <div class="text-text-dim text-xs mb-1">{{ tr.resistorSmd.typeR }}</div>
              <div class="font-mono text-sm text-text-secondary">4R7 = 4.7 Ω</div>
            </div>
            <div class="border border-border-default bg-bg-elevated p-4">
              <div class="text-text-dim text-xs mb-1">{{ tr.resistorSmd.typeEia96 }}</div>
              <div class="font-mono text-sm text-text-secondary">01Y = 100 × 0.01</div>
            </div>
          </div>
        </div>
      </section>

      <section v-else class="space-y-8">
        <div class="border border-border-default bg-bg-surface p-6">
          <h2 class="font-display text-2xl font-semibold flex items-center gap-3 mb-2">
            <span class="text-accent-sky text-sm tracking-widest font-display">//</span
            >{{ tr.capacitorSmd.title }}
          </h2>
          <p class="text-sm text-text-secondary mb-6">{{ tr.capacitorSmd.desc }}</p>

          <div class="grid grid-cols-1 xl:grid-cols-[1.15fr_1fr] gap-6">
            <div>
              <label class="block text-text-dim text-xs mb-2">{{ tr.capacitorSmd.input }}</label>
              <input
                v-model="capacitorSmdCode"
                type="text"
                :placeholder="tr.capacitorSmd.placeholder"
                class="w-full bg-bg-elevated border border-border-default px-4 py-3 text-lg font-mono text-text-primary placeholder:text-text-dim focus:border-accent-sky focus:outline-none transition"
              />
              <div class="mt-4 flex flex-wrap gap-2">
                <button
                  class="border border-border-default bg-bg-elevated px-3 py-2 text-sm text-text-secondary hover:border-accent-sky hover:text-accent-sky transition"
                  @click="capacitorSmdCode = '101'"
                >
                  101
                </button>
                <button
                  class="border border-border-default bg-bg-elevated px-3 py-2 text-sm text-text-secondary hover:border-accent-sky hover:text-accent-sky transition"
                  @click="capacitorSmdCode = '102'"
                >
                  102
                </button>
                <button
                  class="border border-border-default bg-bg-elevated px-3 py-2 text-sm text-text-secondary hover:border-accent-sky hover:text-accent-sky transition"
                  @click="capacitorSmdCode = '104'"
                >
                  104
                </button>
                <button
                  class="border border-border-default bg-bg-elevated px-3 py-2 text-sm text-text-secondary hover:border-accent-sky hover:text-accent-sky transition"
                  @click="capacitorSmdCode = '105'"
                >
                  105
                </button>
                <button
                  class="border border-border-default bg-bg-elevated px-3 py-2 text-sm text-text-secondary hover:border-accent-sky hover:text-accent-sky transition"
                  @click="capacitorSmdCode = '4R7'"
                >
                  4R7
                </button>
              </div>
            </div>
            <div class="border border-border-default bg-bg-elevated p-5">
              <div class="text-text-dim text-xs mb-2">{{ tr.capacitorSmd.result }}</div>
              <div class="font-display text-4xl font-bold text-accent-sky break-words">
                {{ capacitorSmdResult.value }}
              </div>
              <div class="mt-4 space-y-3 text-sm">
                <div class="border border-border-default bg-bg-surface p-3">
                  <div class="text-text-dim text-xs mb-1">{{ tr.capacitorSmd.codeType }}</div>
                  <div class="font-mono">{{ capacitorSmdResult.type }}</div>
                </div>
                <div class="border border-border-default bg-bg-surface p-3">
                  <div class="text-text-dim text-xs mb-1">{{ tr.capacitorSmd.formula }}</div>
                  <div class="font-mono break-all">{{ capacitorSmdResult.formula }}</div>
                </div>
                <div class="border border-border-default bg-bg-surface p-3">
                  <div class="text-text-dim text-xs mb-1">{{ tr.capacitorSmd.note }}</div>
                  <div class="text-text-secondary">{{ capacitorSmdResult.note }}</div>
                </div>
              </div>
            </div>
          </div>

          <div class="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <div class="border border-border-default bg-bg-elevated p-4">
              <div class="text-text-dim text-xs mb-1">101</div>
              <div class="font-mono text-sm text-text-secondary">100 pF</div>
            </div>
            <div class="border border-border-default bg-bg-elevated p-4">
              <div class="text-text-dim text-xs mb-1">102</div>
              <div class="font-mono text-sm text-text-secondary">1 nF</div>
            </div>
            <div class="border border-border-default bg-bg-elevated p-4">
              <div class="text-text-dim text-xs mb-1">104</div>
              <div class="font-mono text-sm text-text-secondary">100 nF</div>
            </div>
            <div class="border border-border-default bg-bg-elevated p-4">
              <div class="text-text-dim text-xs mb-1">105</div>
              <div class="font-mono text-sm text-text-secondary">1 µF</div>
            </div>
          </div>
        </div>
      </section>

      <footer class="mt-14 pt-6 border-t border-border-default text-center">
        <p class="text-text-dim text-sm">{{ tr.common.footer }}</p>
      </footer>
    </div>
  </div>
</template>
