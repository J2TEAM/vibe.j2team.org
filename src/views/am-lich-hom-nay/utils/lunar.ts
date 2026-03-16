const PI = Math.PI

/* === Julian Day Number === */
export function jdFromDate(day: number, month: number, year: number): number {
  const a = Math.floor((14 - month) / 12)
  const y = year + 4800 - a
  const m = month + 12 * a - 3
  let julianDay =
    day +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045
  if (julianDay < 2299161) {
    julianDay = day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - 32083
  }
  return julianDay
}

/* === New Moon === */
function newMoon(k: number): number {
  const T = k / 1236.85
  const T2 = T * T
  const T3 = T2 * T
  const dr = PI / 180

  let Jd1 = 2415020.75933 + 29.53058868 * k + 0.0001178 * T2 - 0.000000155 * T3
  Jd1 += 0.00033 * Math.sin((166.56 + 132.87 * T - 0.009173 * T2) * dr)

  const M = 359.2242 + 29.10535608 * k - 0.0000333 * T2 - 0.00000347 * T3
  const Mpr = 306.0253 + 385.81691806 * k + 0.0107306 * T2 + 0.00001236 * T3
  const F = 21.2964 + 390.67050646 * k - 0.0016528 * T2 - 0.00000239 * T3

  let C1 =
    (0.1734 - 0.000393 * T) * Math.sin(M * dr) +
    0.0021 * Math.sin(2 * dr * M) -
    0.4068 * Math.sin(Mpr * dr) +
    0.0161 * Math.sin(dr * 2 * Mpr) -
    0.0004 * Math.sin(dr * 3 * Mpr) +
    0.0104 * Math.sin(dr * 2 * F) -
    0.0051 * Math.sin(dr * (M + Mpr)) -
    0.0074 * Math.sin(dr * (M - Mpr)) +
    0.0004 * Math.sin(dr * (2 * F + M)) -
    0.0004 * Math.sin(dr * (2 * F - M)) -
    0.0006 * Math.sin(dr * (2 * F + Mpr)) +
    0.001 * Math.sin(dr * (2 * F - Mpr)) +
    0.0005 * Math.sin(dr * (2 * Mpr + M))

  let dt: number
  if (T < -11) {
    dt = 0.001 + 0.000839 * T + 0.0002261 * T2 - 0.00000845 * T3 - 0.000000081 * T * T3
  } else {
    dt = -0.000278 + 0.000265 * T + 0.000262 * T2
  }
  C1 = C1 - dt
  return Jd1 + C1
}

function sunLongitude(jdn: number): number {
  const T = (jdn - 2451545.0) / 36525
  const T2 = T * T
  const dr = PI / 180

  const M = 357.5291 + 35999.0503 * T - 0.0001559 * T2 - 0.00000048 * T * T2
  const L0 = 280.46645 + 36000.76983 * T + 0.0003032 * T2
  let DL = (1.9146 - 0.004817 * T - 0.000014 * T2) * Math.sin(dr * M)
  DL += (0.019993 - 0.000101 * T) * Math.sin(dr * 2 * M) + 0.00029 * Math.sin(dr * 3 * M)
  let L = L0 + DL
  L = L * dr
  L = L - PI * 2 * Math.floor(L / (PI * 2))
  return L
}

function getSunLongitude(dayNumber: number, timeZone: number): number {
  return Math.floor((sunLongitude(dayNumber - 0.5 - timeZone / 24) / PI) * 6)
}

function getNewMoonDay(k: number, timeZone: number): number {
  return Math.floor(newMoon(k) + 0.5 + timeZone / 24)
}

function getLunarMonth11(year: number, timeZone: number): number {
  const off = jdFromDate(31, 12, year) - 2415021
  const k = Math.floor(off / 29.530588853)
  let newMoonDay = getNewMoonDay(k, timeZone)
  const sunLong = getSunLongitude(newMoonDay, timeZone)
  if (sunLong >= 9) {
    newMoonDay = getNewMoonDay(k - 1, timeZone)
  }
  return newMoonDay
}

function getLeapMonthOffset(month11DayNumber: number, timeZone: number): number {
  const k = Math.floor((month11DayNumber - 2415021.076998695) / 29.530588853 + 0.5)
  let last = 0
  let i = 1
  let arc = getSunLongitude(getNewMoonDay(k + i, timeZone), timeZone)
  do {
    last = arc
    i++
    arc = getSunLongitude(getNewMoonDay(k + i, timeZone), timeZone)
  } while (arc !== last && i < 14)
  return i - 1
}

export interface LunarDate {
  day: number
  month: number
  year: number
  leap: boolean
  jd: number
}

export function solarToLunar(day: number, month: number, year: number, timeZone = 7): LunarDate {
  const dayNumber = jdFromDate(day, month, year)
  const k = Math.floor((dayNumber - 2415021.076998695) / 29.530588853)

  let monthStart = getNewMoonDay(k + 1, timeZone)
  if (monthStart > dayNumber) {
    monthStart = getNewMoonDay(k, timeZone)
  }

  let month11DayNumber = getLunarMonth11(year, timeZone)
  let nextMonth11DayNumber = month11DayNumber

  let lunarYear: number
  if (month11DayNumber >= monthStart) {
    lunarYear = year
    month11DayNumber = getLunarMonth11(year - 1, timeZone)
  } else {
    lunarYear = year + 1
    nextMonth11DayNumber = getLunarMonth11(year + 1, timeZone)
  }

  const lunarDay = dayNumber - monthStart + 1
  const diff = Math.floor((monthStart - month11DayNumber) / 29)
  let lunarLeap = false
  let lunarMonth = diff + 11

  if (nextMonth11DayNumber - month11DayNumber > 365) {
    const leapMonthDiff = getLeapMonthOffset(month11DayNumber, timeZone)
    if (diff >= leapMonthDiff) {
      lunarMonth = diff + 10
      if (diff === leapMonthDiff) {
        lunarLeap = true
      }
    }
  }

  if (lunarMonth > 12) {
    lunarMonth = lunarMonth - 12
  }
  if (lunarMonth >= 11 && diff < 4) {
    lunarYear -= 1
  }

  return {
    day: lunarDay,
    month: lunarMonth,
    year: lunarYear,
    leap: lunarLeap,
    jd: dayNumber,
  }
}

export const CAN = ['Giáp', 'Ất', 'Bính', 'Đinh', 'Mậu', 'Kỷ', 'Canh', 'Tân', 'Nhâm', 'Quý']
export const CHI = [
  'Tý',
  'Sửu',
  'Dần',
  'Mão',
  'Thìn',
  'Tỵ',
  'Ngọ',
  'Mùi',
  'Thân',
  'Dậu',
  'Tuất',
  'Hợi',
]

export function getYearCanChi(lunarYear: number) {
  const can = (lunarYear + 6) % 10
  const chi = (lunarYear + 8) % 12
  return { can: CAN[can], chi: CHI[chi] }
}

export function getMonthCanChi(lunarMonth: number, lunarYear: number) {
  const yearCan = (lunarYear + 6) % 10
  const baseCan = ((yearCan % 5) * 2 + 2) % 10
  const can = (baseCan + lunarMonth - 1) % 10
  const chi = (lunarMonth + 1) % 12
  return { can: CAN[can], chi: CHI[chi] }
}

export function getDayCanChi(jd: number) {
  const can = (jd + 9) % 10
  const chi = (jd + 1) % 12
  return { can: CAN[can], chi: CHI[chi] }
}

export function getHourCanChi(hourChiIndex: number, jd: number) {
  const dayCan = (jd + 9) % 10
  const baseCan = ((dayCan % 5) * 2) % 10
  const can = (baseCan + hourChiIndex) % 10
  return { can: CAN[can], chi: CHI[hourChiIndex] }
}

const ZODIAC_HOURS = [
  [0, 1, 3, 6, 8, 9], // Tý, Ngọ
  [2, 3, 5, 8, 10, 11], // Sửu, Mùi
  [0, 1, 4, 5, 7, 10], // Dần, Thân
  [0, 2, 3, 6, 7, 9], // Mão, Dậu
  [2, 4, 5, 8, 9, 11], // Thìn, Tuất
  [1, 4, 6, 7, 10, 11], // Tỵ, Hợi
]

export function getZodiacHours(jd: number) {
  const dayChi = (jd + 1) % 12
  const group = dayChi % 6
  return (ZODIAC_HOURS[group] || []).map((chiIndex) => CHI[chiIndex])
}
