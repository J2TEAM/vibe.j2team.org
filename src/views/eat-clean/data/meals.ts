export interface Meal {
  id: string
  name: string
  calories: number
}

export interface DayPlan {
  day: string
  breakfast: Meal
  lunch: Meal
  dinner: Meal
}

export const breakfasts: Meal[] = [
  { id: 'b1', name: 'Yến mạch ngâm sữa hạt (Overnight Oats) 🥣', calories: 300 },
  { id: 'b2', name: 'Bánh mì đen & Trứng ốp la 🥚🍞', calories: 280 },
  { id: 'b3', name: 'Sinh tố xanh (Rau bina, bơ, chuối) 🥑', calories: 250 },
  { id: 'b4', name: 'Sữa chua không đường & Trái cây tươi 🍓', calories: 200 },
  { id: 'b5', name: 'Khoai lang luộc & Bơ đậu phộng 🍠', calories: 260 },
  { id: 'b6', name: 'Trứng luộc & Táo xanh 🍏', calories: 150 },
  { id: 'b7', name: 'Pancake yến mạch chuối 🥞', calories: 320 },
  { id: 'b8', name: 'Bún lứt trộn ức gà xé 🍜', calories: 350 },
  { id: 'b9', name: 'Smoothie bowl ngũ cốc trái cây 🥥', calories: 280 }
]

export const lunches: Meal[] = [
  { id: 'l1', name: 'Cơm gạo lứt & Ức gà nướng tiêu 🍗', calories: 450 },
  { id: 'l2', name: 'Salad cá ngừ ngâm nước sốt chanh dây 🥗', calories: 380 },
  { id: 'l3', name: 'Bún lứt xào thịt bò nạc & cải thìa 🍜', calories: 420 },
  { id: 'l4', name: 'Cơm lứt & Cá hồi áp chảo măng tây 🍣', calories: 500 },
  { id: 'l5', name: 'Mì rau củ xốt cà chua thịt nạc băm 🍝', calories: 400 },
  { id: 'l6', name: 'Nui lứt lườn cá hồi xốt Pesto 🥣', calories: 460 },
  { id: 'l7', name: 'Salad ức gà áp chảo sốt mè rang 🍗', calories: 350 },
  { id: 'l8', name: 'Cơm quinoa & Đậu hũ xốt nấm 🍄', calories: 380 },
  { id: 'l9', name: 'Cuốn tôm thịt luộc & bánh tráng lứt 🍤', calories: 320 },
  { id: 'l10', name: 'Cơm lứt & Thịt heo nạc xào giá hẹ 🍛', calories: 430 }
]

export const dinners: Meal[] = [
  { id: 'd1', name: 'Salad ức gà xé phay & bắp ngọt 🌽', calories: 280 },
  { id: 'd2', name: 'Bò né nạc áp chảo kèm salad giấm 🥩', calories: 350 },
  { id: 'd3', name: 'Tôm hấp & Canh bí đỏ thịt băm 🦐', calories: 300 },
  { id: 'd4', name: 'Ức gà cuộn rau củ hấp 🥕', calories: 250 },
  { id: 'd5', name: 'Súp lơ xanh luộc & Cá lóc hấp hành 🐟', calories: 280 },
  { id: 'd6', name: 'Salad dưa leo cà chua & Trứng luộc 🍅', calories: 200 },
  { id: 'd7', name: 'Đậu hũ non sốt cà chua & Nấm kim châm 🍲', calories: 220 },
  { id: 'd8', name: 'Canh rong biển đậu non & thịt băm nạc 🌿', calories: 150 },
  { id: 'd9', name: 'Bắp bắp luộc & Thịt băm xào nấm mộc nhĩ 🌽', calories: 300 }
]

export const getRandomItem = (array: Meal[], excludeId: string | null = null): Meal => {
  let filtered = excludeId ? array.filter(item => item.id !== excludeId) : array
  if (filtered.length === 0) filtered = array
  const randomIndex = Math.floor(Math.random() * filtered.length)
  return filtered[randomIndex]!
}

export const generateWeeklyMenu = (): DayPlan[] => {
  const daysOfWeek = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật']
  return daysOfWeek.map((day) => {
    return {
      day,
      breakfast: getRandomItem(breakfasts),
      lunch: getRandomItem(lunches),
      dinner: getRandomItem(dinners),
    }
  })
}
