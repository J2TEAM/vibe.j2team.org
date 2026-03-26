export interface Recipe {
  ingredients: string[]
  steps: string[]
}

export interface RecipeMap {
  [key: string]: Recipe
}

export const recipes: RecipeMap = {
  'b1': {
    ingredients: [
      '40g yến mạch cán dẹt',
      '100ml sữa tươi/sữa hạt không đường',
      '1 muỗng hạt chia',
      'Trái cây tùy thích (chuối, dâu tây, việt quất)',
      '1/2 muỗng mật ong (tùy chọn)'
    ],
    steps: [
      'Cho yến mạch và hạt chia vào một chiếc hũ thủy tinh sạch.',
      'Đổ sữa tươi hoặc sữa hạt vào hũ sao cho ngập phần yến mạch.',
      'Thêm một chút mật ong nếu thích ăn ngọt, sau đó khuấy đều.',
      'Đậy nắp kín, cho vào ngăn mát tủ lạnh ngâm qua đêm (ít nhất 4 tiếng).',
      'Sáng hôm sau, lấy ra thêm trái cây cắt nhỏ lên trên và thưởng thức. Cực kỳ nhanh gọn!'
    ]
  },
  'l1': {
    ingredients: [
      '100g ức gà tươi',
      '1 bát cơm gạo lứt (chín)',
      '1/2 cây súp lơ xanh',
      '1 muỗng cà phê dầu oliu',
      'Tiêu chanh, hạt nêm diet, xì dầu'
    ],
    steps: [
      'Ức gà rửa sạch, khía mặt để thấm gia vị. Ướp với hạt nêm diet và tiêu chanh trong 15 phút.',
      'Súp lơ xanh cắt miếng vừa ăn, luộc chín tới.',
      'Làm nóng chảo, cho chút dầu oliu, áp chảo ức gà mỗi mặt 3-4 phút đến khi chín vàng.',
      'Thái ức gà thành lát. Bày ra đĩa cùng cơm gạo lứt và súp lơ. Ngon vô cùng!'
    ]
  },
  'd1': {
    ingredients: [
      '80g ức gà luộc xé phay',
      '1/2 bắp ngô ngọt luộc tách hạt',
      'Xà lách, cà chua bi',
      'Dầu oliu, nước cốt chanh, một chút muối hồng'
    ],
    steps: [
      'Rửa sạch xà lách và cà chua bi, cắt miếng vừa ăn.',
      'Pha nước xốt: 1 muỗng dầu oliu + 1 muỗng nước cốt chanh + xíu muối hồng.',
      'Cho rau củ, ngô ngọt và ức gà xé vào tô lớn.',
      'Rưới nước xốt lên trên trộn đều. Ăn tối nhẹ bụng nhưng vẫn đủ chất cho ngày dài năng động!'
    ]
  }
}
