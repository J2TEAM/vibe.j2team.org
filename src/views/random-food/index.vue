<script setup lang="ts">
import { ref, computed } from 'vue' // <-- CHÚ Ý: Bổ sung import 'computed'
import { Icon } from '@iconify/vue'
import { useClipboard } from '@vueuse/core'

interface FoodItem {
  id: number
  foodName: string
  storeName: string
  location: string
  mapsLink: string
  rating: number
  priceVnd: number
}

// 1. Static Database (100 Món ngon Hà Nội)
const foodDatabase: FoodItem[] = [
  // Phở Bò / Phở Gà
  {
    id: 1,
    foodName: 'Phở Bò',
    storeName: 'Phở Gia Truyền Bát Đàn',
    location: '49 Bát Đàn, Hoàn Kiếm',
    mapsLink: 'https://www.google.com/maps/search/?api=1&query=Phở+Gia+Truyền+Bát+Đàn',
    rating: 4.6,
    priceVnd: 60000,
  },
  {
    id: 2,
    foodName: 'Phở Bò Tái Lăn',
    storeName: 'Phở Thìn Lò Đúc',
    location: '13 Lò Đúc, Hai Bà Trưng',
    mapsLink: 'https://www.google.com/maps/search/?api=1&query=Phở+Thìn+Lò+Đúc',
    rating: 4.4,
    priceVnd: 70000,
  },
  {
    id: 3,
    foodName: 'Phở Bò',
    storeName: 'Phở Lý Quốc Sư',
    location: '10 Lý Quốc Sư, Hoàn Kiếm',
    mapsLink: 'https://www.google.com/maps/search/?api=1&query=Phở+Lý+Quốc+Sư',
    rating: 4.5,
    priceVnd: 80000,
  },
  {
    id: 4,
    foodName: 'Phở Bò',
    storeName: 'Phở Khôi Hói',
    location: '50C Hàng Vải, Hoàn Kiếm',
    mapsLink: 'https://www.google.com/maps/search/?api=1&query=Phở+Khôi+Hói',
    rating: 4.5,
    priceVnd: 55000,
  },
  {
    id: 5,
    foodName: 'Phở Gà',
    storeName: 'Phở Gà Nguyệt',
    location: '5B Phủ Doãn, Hoàn Kiếm',
    mapsLink: 'https://www.google.com/maps/search/?api=1&query=Phở+Gà+Nguyệt',
    rating: 4.6,
    priceVnd: 50000,
  },
  {
    id: 6,
    foodName: 'Phở Gà Trộn',
    storeName: 'Phở Gà Lâm',
    location: '7 Nam Ngư, Hoàn Kiếm',
    mapsLink: 'https://www.google.com/maps/search/?api=1&query=Phở+Gà+Lâm',
    rating: 4.3,
    priceVnd: 45000,
  },
  {
    id: 7,
    foodName: 'Phở Gà',
    storeName: 'Phở Gà Châm',
    location: '64 Yên Ninh, Ba Đình',
    mapsLink: 'https://www.google.com/maps/search/?api=1&query=Phở+Gà+Châm',
    rating: 4.4,
    priceVnd: 70000,
  },

  // Bún Chả / Bún Thịt Nướng
  {
    id: 8,
    foodName: 'Bún Chả',
    storeName: 'Bún Chả Hương Liên (Obama)',
    location: '24 Lê Văn Hưu, Hai Bà Trưng',
    mapsLink: 'https://www.google.com/maps/search/?api=1&query=Bún+Chả+Hương+Liên',
    rating: 4.2,
    priceVnd: 60000,
  },
  {
    id: 9,
    foodName: 'Bún Chả',
    storeName: 'Bún Chả Đắc Kim',
    location: '1 Hàng Mành, Hoàn Kiếm',
    mapsLink: 'https://www.google.com/maps/search/?api=1&query=Bún+Chả+Đắc+Kim',
    rating: 4.1,
    priceVnd: 60000,
  },
  {
    id: 10,
    foodName: 'Bún Chả',
    storeName: 'Bún Chả Sinh Từ',
    location: '2 Nguyễn Khuyến, Đống Đa',
    mapsLink: 'https://www.google.com/maps/search/?api=1&query=Bún+Chả+Sinh+Từ',
    rating: 4.3,
    priceVnd: 50000,
  },
  {
    id: 11,
    foodName: 'Bún Chả Nem Cua Bể',
    storeName: 'Bún Chả Tuyết',
    location: '34 Hàng Than, Ba Đình',
    mapsLink: 'https://www.google.com/maps/search/?api=1&query=Bún+Chả+Tuyết',
    rating: 4.5,
    priceVnd: 55000,
  },
  {
    id: 12,
    foodName: 'Bún Thịt Nướng',
    storeName: 'Bún Thịt Nướng Vạn Kiếp',
    location: 'Ngõ 290 Kim Mã, Ba Đình',
    mapsLink: 'https://www.google.com/maps/search/?api=1&query=Bún+Thịt+Nướng+Kim+Mã',
    rating: 4.4,
    priceVnd: 40000,
  },

  // Bún Riêu / Bún Ốc
  {
    id: 13,
    foodName: 'Bún Riêu Cua',
    storeName: 'Bún Riêu Trang',
    location: '23 Nguyễn Siêu, Hoàn Kiếm',
    mapsLink: 'https://www.google.com/maps/search/?api=1&query=Bún+Riêu+Trang',
    rating: 4.4,
    priceVnd: 45000,
  },
  {
    id: 14,
    foodName: 'Bún Riêu Bò',
    storeName: 'Bún Riêu Quang Trung',
    location: '41 Quang Trung, Hoàn Kiếm',
    mapsLink: 'https://www.google.com/maps/search/?api=1&query=Bún+Riêu+Quang+Trung',
    rating: 4.5,
    priceVnd: 50000,
  },
  {
    id: 15,
    foodName: 'Bún Riêu Sườn Sụn',
    storeName: 'Bún Riêu Nguyễn Du',
    location: 'Ngã tư Nguyễn Du - Bà Triệu',
    mapsLink: 'https://www.google.com/maps/search/?api=1&query=Bún+Riêu+Nguyễn+Du',
    rating: 4.3,
    priceVnd: 45000,
  },
  {
    id: 16,
    foodName: 'Bún Ốc',
    storeName: 'Bún Ốc Cô Thêm',
    location: '6 Hàng Chai, Hoàn Kiếm',
    mapsLink: 'https://www.google.com/maps/search/?api=1&query=Bún+Ốc+Cô+Thêm',
    rating: 4.4,
    priceVnd: 40000,
  },
  {
    id: 17,
    foodName: 'Bún Ốc',
    storeName: 'Bún Ốc Giang',
    location: '36 Lương Ngọc Quyến, Hoàn Kiếm',
    mapsLink: 'https://www.google.com/maps/search/?api=1&query=Bún+Ốc+Giang',
    rating: 4.5,
    priceVnd: 50000,
  },
  {
    id: 18,
    foodName: 'Bún Ốc Nguội',
    storeName: 'Bún Ốc Nguội Ô Quan Chưởng',
    location: '1 Hàng Chiếu, Hoàn Kiếm',
    mapsLink: 'https://www.google.com/maps/search/?api=1&query=Bún+Ốc+Nguội+Ô+Quan+Chưởng',
    rating: 4.3,
    priceVnd: 40000,
  },

  // Bún Thang / Bún Cá
  {
    id: 19,
    foodName: 'Bún Thang',
    storeName: 'Bún Thang Bà Đức',
    location: '48 Cầu Gỗ, Hoàn Kiếm',
    mapsLink: 'https://www.google.com/maps/search/?api=1&query=Bún+Thang+Bà+Đức',
    rating: 4.2,
    priceVnd: 45000,
  },
  {
    id: 20,
    foodName: 'Bún Thang',
    storeName: 'Bún Thang Hàng Hòm',
    location: '11 Hàng Hòm, Hoàn Kiếm',
    mapsLink: 'https://www.google.com/maps/search/?api=1&query=Bún+Thang+Hàng+Hòm',
    rating: 4.4,
    priceVnd: 40000,
  },
  {
    id: 21,
    foodName: 'Bún Cá',
    storeName: 'Bún Cá Sâm Cây Si',
    location: 'Ngõ Trung Yên, Hoàn Kiếm',
    mapsLink: 'https://www.google.com/maps/search/?api=1&query=Bún+Cá+Sâm+Cây+Si',
    rating: 4.5,
    priceVnd: 45000,
  },
  {
    id: 22,
    foodName: 'Bún Cá',
    storeName: 'Bún Cá Hạnh Béo',
    location: '30 Nguyễn Thái Học, Ba Đình',
    mapsLink: 'https://www.google.com/maps/search/?api=1&query=Bún+Cá+Hạnh+Béo',
    rating: 4.3,
    priceVnd: 40000,
  },
  {
    id: 23,
    foodName: 'Bún Cá Chấm',
    storeName: 'Bún Cá Chấm Gốc Đa',
    location: '33 Vũ Thạnh, Đống Đa',
    mapsLink: 'https://www.google.com/maps/search/?api=1&query=Bún+Cá+Chấm+Vũ+Thạnh',
    rating: 4.4,
    priceVnd: 45000,
  },

  // Bún Đậu Mắm Tôm
  {
    id: 24,
    foodName: 'Bún Đậu Mắm Tôm',
    storeName: 'Bún Đậu Hàng Khay',
    location: 'Ngõ 31 Hàng Khay, Hoàn Kiếm',
    mapsLink: 'https://www.google.com/maps/search/?api=1&query=Bún+Đậu+Hàng+Khay',
    rating: 4.5,
    priceVnd: 55000,
  },
  {
    id: 25,
    foodName: 'Bún Đậu Mắm Tôm',
    storeName: 'Bún Đậu Trung Hương',
    location: '49 Phất Lộc, Hoàn Kiếm',
    mapsLink: 'https://www.google.com/maps/search/?api=1&query=Bún+Đậu+Trung+Hương',
    rating: 4.4,
    priceVnd: 50000,
  },
  {
    id: 26,
    foodName: 'Bún Đậu Mắm Tôm',
    storeName: 'Bún Đậu Cây Đa',
    location: '235B Thụy Khuê, Tây Hồ',
    mapsLink: 'https://www.google.com/maps/search/?api=1&query=Bún+Đậu+Cây+Đa',
    rating: 4.3,
    priceVnd: 45000,
  },

  // Bún Bò Huế / Bún Bò Nam Bộ
  {
    id: 27,
    foodName: 'Bún Bò Huế',
    storeName: 'Bún Bò Huế O Xuân',
    location: '3 Quang Trung, Hoàn Kiếm',
    mapsLink: 'https://www.google.com/maps/search/?api=1&query=Bún+Bò+Huế+O+Xuân',
    rating: 4.3,
    priceVnd: 50000,
  },
  {
    id: 28,
    foodName: 'Bún bò huế',
    storeName: 'Bún Bò Huế Nghĩa Tân',
    location: '101A14 P. Nghĩa Tân, Khu tập thể Nghĩa Tân, Cầu Giấy, Hà Nội',
    mapsLink: 'https://maps.app.goo.gl/Jkf2Q9sakQ1ZtUF27',
    rating: 5,
    priceVnd: 50000,
  },
  {
    id: 29,
    foodName: 'Bún Bò Nam Bộ',
    storeName: 'Bún Bò Nam Bộ Bách Phương',
    location: '67 Hàng Điếu, Hoàn Kiếm',
    mapsLink: 'https://www.google.com/maps/search/?api=1&query=Bún+Bò+Nam+Bộ+Hàng+Điếu',
    rating: 4.3,
    priceVnd: 65000,
  },

  // Bánh Mì / Bánh Mì Chảo
  {
    id: 30,
    foodName: 'Bánh Mì Pate',
    storeName: 'Bánh Mì Phố Huế',
    location: '118 Phố Huế, Hai Bà Trưng',
    mapsLink: 'https://www.google.com/maps/search/?api=1&query=Bánh+Mì+Phố+Huế',
    rating: 4.4,
    priceVnd: 35000,
  },
  {
    id: 31,
    foodName: 'Bánh Mì Dân Tổ',
    storeName: 'Bánh Mì Dân Tổ',
    location: 'Ngã ba Cao Thắng - Trần Nhật Duật',
    mapsLink: 'https://www.google.com/maps/search/?api=1&query=Bánh+Mì+Dân+Tổ',
    rating: 4.1,
    priceVnd: 25000,
  },
  {
    id: 32,
    foodName: 'Bánh Mì Sốt Vang',
    storeName: 'Bánh Mì Trâm',
    location: '252 Cửa Nam, Hoàn Kiếm',
    mapsLink: 'https://www.google.com/maps/search/?api=1&query=Bánh+Mì+Trâm+Cửa+Nam',
    rating: 4.5,
    priceVnd: 50000,
  },
  {
    id: 33,
    foodName: 'Bánh Mì Chảo',
    storeName: 'Bánh Mì Chảo Cột Điện',
    location: '71 Nghĩa Tân, Cầu Giấy',
    mapsLink: 'https://www.google.com/maps/search/?api=1&query=Bánh+Mì+Chảo+Cột+Điện',
    rating: 4.4,
    priceVnd: 45000,
  },
  {
    id: 34,
    foodName: 'Bánh Mì Chảo',
    storeName: 'Bánh Mì Chảo Hiệu Lực',
    location: '326 Bà Triệu, Hai Bà Trưng',
    mapsLink: 'https://www.google.com/maps/search/?api=1&query=Bánh+Mì+Chảo+Hiệu+Lực',
    rating: 4.3,
    priceVnd: 40000,
  },

  // Bánh Cuốn / Bánh Giò
  {
    id: 35,
    foodName: 'Bánh Cuốn Chả',
    storeName: 'Bánh Cuốn Bà Hoành',
    location: '66 Tô Hiến Thành, Hai Bà Trưng',
    mapsLink: 'https://www.google.com/maps/search/?api=1&query=Bánh+Cuốn+Bà+Hoành',
    rating: 4.3,
    priceVnd: 35000,
  },
  {
    id: 36,
    foodName: 'Bánh Cuốn',
    storeName: 'Bánh Cuốn Thanh Vân',
    location: '12 Hàng Gà, Hoàn Kiếm',
    mapsLink: 'https://www.google.com/maps/search/?api=1&query=Bánh+Cuốn+Thanh+Vân',
    rating: 4.4,
    priceVnd: 45000,
  },
  {
    id: 37,
    foodName: 'Bánh Giò',
    storeName: 'Bánh Giò Thụy Khuê',
    location: '5 Thụy Khuê, Tây Hồ',
    mapsLink: 'https://www.google.com/maps/search/?api=1&query=Bánh+Giò+Thụy+Khuê',
    rating: 4.5,
    priceVnd: 30000,
  },
  {
    id: 38,
    foodName: 'Bánh Giò',
    storeName: 'Bánh Giò Đông Các',
    location: '33 Đông Các, Đống Đa',
    mapsLink: 'https://www.google.com/maps/search/?api=1&query=Bánh+Giò+Đông+Các',
    rating: 4.3,
    priceVnd: 35000,
  },

  // Xôi
  {
    id: 39,
    foodName: 'Xôi Xéo',
    storeName: 'Xôi Yến',
    location: '35B Nguyễn Hữu Huân, Hoàn Kiếm',
    mapsLink: 'https://www.google.com/maps/search/?api=1&query=Xôi+Yến',
    rating: 4.0,
    priceVnd: 45000,
  },
  {
    id: 40,
    foodName: 'Xôi Sườn Cay',
    storeName: 'Xôi Sườn Cay Phương',
    location: '628 Trường Chinh, Đống Đa',
    mapsLink: 'https://www.google.com/maps/search/?api=1&query=Xôi+Sườn+Cay+Trường+Chinh',
    rating: 4.4,
    priceVnd: 40000,
  },
  {
    id: 41,
    foodName: 'Xôi Thịt Kho',
    storeName: 'Xôi Lộc',
    location: '68 Tạ Quang Bửu, Hai Bà Trưng',
    mapsLink: 'https://www.google.com/maps/search/?api=1&query=Xôi+Lộc',
    rating: 4.5,
    priceVnd: 35000,
  },
  {
    id: 42,
    foodName: 'Xôi Cát Lâm',
    storeName: 'Xôi Cát Lâm',
    location: '24B Đường Thành, Hoàn Kiếm',
    mapsLink: 'https://www.google.com/maps/search/?api=1&query=Xôi+Cát+Lâm',
    rating: 4.2,
    priceVnd: 40000,
  },

  // Chả Cá / Ngan
  {
    id: 43,
    foodName: 'Chả Cá',
    storeName: 'Chả Cá Lã Vọng',
    location: '14 Chả Cá, Hoàn Kiếm',
    mapsLink: 'https://www.google.com/maps/search/?api=1&query=Chả+Cá+Lã+Vọng',
    rating: 4.0,
    priceVnd: 350000,
  },
  {
    id: 44,
    foodName: 'Chả Cá',
    storeName: 'Chả Cá Thăng Long',
    location: '21 Đường Thành, Hoàn Kiếm',
    mapsLink: 'https://www.google.com/maps/search/?api=1&query=Chả+Cá+Thăng+Long',
    rating: 4.4,
    priceVnd: 150000,
  },
  {
    id: 45,
    foodName: 'Ngan Cháy Tỏi',
    storeName: 'Ngan Thủy',
    location: '51 Hàng Lược, Hoàn Kiếm',
    mapsLink: 'https://www.google.com/maps/search/?api=1&query=Ngan+Thủy+Hàng+Lược',
    rating: 4.3,
    priceVnd: 120000,
  },
  {
    id: 46,
    foodName: 'Bún Ngan',
    storeName: 'Bún Ngan Nhàn',
    location: '14 Ngõ Trung Yên, Hoàn Kiếm',
    mapsLink: 'https://www.google.com/maps/search/?api=1&query=Bún+Ngan+Nhàn',
    rating: 3.9,
    priceVnd: 50000,
  },
  {
    id: 47,
    foodName: 'Ngan Luộc',
    storeName: 'Khoa Ngan',
    location: '77 Hai Bà Trưng, Hoàn Kiếm',
    mapsLink: 'https://www.google.com/maps/search/?api=1&query=Khoa+Ngan',
    rating: 4.4,
    priceVnd: 150000,
  },

  // Phở Cuốn / Bánh Xèo / Nem Nướng
  {
    id: 48,
    foodName: 'Phở Cuốn',
    storeName: 'Phở Cuốn Hương Mai',
    location: '25 Ngũ Xã, Ba Đình',
    mapsLink: 'https://www.google.com/maps/search/?api=1&query=Phở+Cuốn+Hương+Mai',
    rating: 4.3,
    priceVnd: 70000,
  },
  {
    id: 49,
    foodName: 'Phở Cuốn',
    storeName: 'Phở Cuốn Hưng Bền',
    location: '33 Ngũ Xã, Ba Đình',
    mapsLink: 'https://www.google.com/maps/search/?api=1&query=Phở+Cuốn+Hưng+Bền',
    rating: 4.2,
    priceVnd: 65000,
  },
  {
    id: 50,
    foodName: 'Bánh Xèo',
    storeName: 'Bánh Xèo Đội Cấn',
    location: '166 Đội Cấn, Ba Đình',
    mapsLink: 'https://www.google.com/maps/search/?api=1&query=Bánh+Xèo+Đội+Cấn',
    rating: 4.1,
    priceVnd: 50000,
  },
  {
    id: 51,
    foodName: 'Bánh Xèo',
    storeName: 'Bánh Xèo Tôn Đức Thắng',
    location: '29 Tôn Đức Thắng, Đống大',
    mapsLink: 'https://www.google.com/maps/search/?api=1&query=Bánh+Xèo+Tôn+Đức+Thắng',
    rating: 4.3,
    priceVnd: 45000,
  },
  {
    id: 52,
    foodName: 'Nem Nướng Nha Trang',
    storeName: 'Nem Nướng Hảo Hảo',
    location: 'Ngõ 130 Xuân Thủy, Cầu Giấy',
    mapsLink: 'https://www.google.com/maps/search/?api=1&query=Nem+Nướng+Xuân+Thủy',
    rating: 4.4,
    priceVnd: 40000,
  },
  {
    id: 53,
    foodName: 'Nem Nướng',
    storeName: 'Nem Nướng Ấu Triệu',
    location: '10 Ấu Triệu, Hoàn Kiếm',
    mapsLink: 'https://www.google.com/maps/search/?api=1&query=Nem+Nướng+Ấu+Triệu',
    rating: 4.5,
    priceVnd: 60000,
  },

  // Bún Hải Sản / Bánh Đa Cua / Miến
  {
    id: 54,
    foodName: 'Bún Hải Sản',
    storeName: 'Bún Hải Sản Ngũ Xã',
    location: '24 Ngũ Xã, Ba Đình',
    mapsLink: 'https://www.google.com/maps/search/?api=1&query=Bún+Hải+Sản+Ngũ+Xã',
    rating: 4.2,
    priceVnd: 50000,
  },
  {
    id: 55,
    foodName: 'Bánh Đa Cua',
    storeName: 'Bánh Đa Cua Hàng Đồng',
    location: '8 Hàng Đồng, Hoàn Kiếm',
    mapsLink: 'https://www.google.com/maps/search/?api=1&query=Bánh+Đa+Cua+Hàng+Đồng',
    rating: 4.4,
    priceVnd: 45000,
  },
  {
    id: 56,
    foodName: 'Bánh Đa Cua Trộn',
    storeName: 'Bánh Đa Cua Phùng Hưng',
    location: '6B Phùng Hưng, Hoàn Kiếm',
    mapsLink: 'https://www.google.com/maps/search/?api=1&query=Bánh+Đa+Cua+Phùng+Hưng',
    rating: 4.5,
    priceVnd: 45000,
  },
  {
    id: 57,
    foodName: 'Miến Lươn',
    storeName: 'Miến Lươn Đông Thịnh',
    location: '87 Hàng Điếu, Hoàn Kiếm',
    mapsLink: 'https://www.google.com/maps/search/?api=1&query=Miến+Lươn+Đông+Thịnh',
    rating: 4.3,
    priceVnd: 55000,
  },
  {
    id: 58,
    foodName: 'Miến Trộn',
    storeName: 'Miến Trộn Mực',
    location: 'Ngõ Trung Yên, Hoàn Kiếm',
    mapsLink: 'https://www.google.com/maps/search/?api=1&query=Miến+Trộn+Mực+Trung+Yên',
    rating: 4.4,
    priceVnd: 45000,
  },

  // Cơm
  {
    id: 59,
    foodName: 'Cơm Đảo Gà Rang',
    storeName: 'Cơm Đảo Tống Duy Tân',
    location: '24 Tống Duy Tân, Hoàn Kiếm',
    mapsLink: 'https://www.google.com/maps/search/?api=1&query=Cơm+Đảo+Tống+Duy+Tân',
    rating: 4.2,
    priceVnd: 80000,
  },
  {
    id: 60,
    foodName: 'Cơm Sườn Nướng',
    storeName: 'Cơm Sườn Đào Duy Từ',
    location: '47 Đào Duy Từ, Hoàn Kiếm',
    mapsLink: 'https://www.google.com/maps/search/?api=1&query=Cơm+Sườn+Đào+Duy+Từ',
    rating: 4.4,
    priceVnd: 60000,
  },
  {
    id: 61,
    foodName: 'Cơm Tấm',
    storeName: 'Cơm Tấm Ali',
    location: '304 Kim Ngưu, Hai Bà Trưng',
    mapsLink: 'https://www.google.com/maps/search/?api=1&query=Cơm+Tấm+Ali',
    rating: 4.5,
    priceVnd: 50000,
  },
  {
    id: 62,
    foodName: 'Cơm Chay',
    storeName: 'Cơm Chay Nàng Tấm',
    location: '79A Trần Hưng Đạo, Hoàn Kiếm',
    mapsLink: 'https://www.google.com/maps/search/?api=1&query=Cơm+Chay+Nàng+Tấm',
    rating: 4.3,
    priceVnd: 100000,
  },

  // Lẩu các loại
  {
    id: 63,
    foodName: 'Lẩu Ếch',
    storeName: 'Lẩu Ếch Dũng Hà',
    location: '15 Lò Đúc, Hai Bà Trưng',
    mapsLink: 'https://www.google.com/maps/search/?api=1&query=Lẩu+Ếch+Dũng+Hà',
    rating: 4.2,
    priceVnd: 150000,
  },
  {
    id: 64,
    foodName: 'Lẩu Ếch',
    storeName: 'Lẩu Ếch Phong Mập',
    location: '88 Phó Đức Chính, Ba Đình',
    mapsLink: 'https://www.google.com/maps/search/?api=1&query=Lẩu+Ếch+Phong+Mập',
    rating: 4.3,
    priceVnd: 140000,
  },
  {
    id: 65,
    foodName: 'Lẩu Bò Nhúng Dấm',
    storeName: 'Bò Nhúng Dấm 555',
    location: '275 Tô Hiệu, Cầu Giấy',
    mapsLink: 'https://www.google.com/maps/search/?api=1&query=Bò+Nhúng+Dấm+555',
    rating: 4.4,
    priceVnd: 160000,
  },
  {
    id: 66,
    foodName: 'Lẩu Riêu Cua',
    storeName: 'Lẩu Riêu Cua Phó Đức Chính',
    location: '66 Phó Đức Chính, Ba Đình',
    mapsLink: 'https://www.google.com/maps/search/?api=1&query=Lẩu+Riêu+Cua+Phó+Đức+Chính',
    rating: 4.5,
    priceVnd: 150000,
  },
  {
    id: 67,
    foodName: 'Lẩu Thái',
    storeName: 'ThaiExpress',
    location: 'Vincom Bà Triệu, Hai Bà Trưng',
    mapsLink: 'https://www.google.com/maps/search/?api=1&query=ThaiExpress+Vincom',
    rating: 4.1,
    priceVnd: 250000,
  },

  // Nướng / Đồ Nhậu
  {
    id: 68,
    foodName: 'Bò Tơ Nướng',
    storeName: 'Bò Tơ Quán Mộc',
    location: '102 Thái Thịnh, Đống Đa',
    mapsLink: 'https://www.google.com/maps/search/?api=1&query=Bò+Tơ+Quán+Mộc',
    rating: 4.4,
    priceVnd: 200000,
  },
  {
    id: 69,
    foodName: 'Nướng Lụi',
    storeName: 'Nướng Lụi Hùng Béo',
    location: '91 Bạch Mai, Hai Bà Trưng',
    mapsLink: 'https://www.google.com/maps/search/?api=1&query=Nướng+Lụi+Hùng+Béo',
    rating: 4.2,
    priceVnd: 150000,
  },
  {
    id: 70,
    foodName: 'Nầm Bò Nướng',
    storeName: 'Nầm Bò Nướng Bà Hoa',
    location: '33 Gầm Cầu, Hoàn Kiếm',
    mapsLink: 'https://www.google.com/maps/search/?api=1&query=Nầm+Bò+Nướng+Gầm+Cầu',
    rating: 4.1,
    priceVnd: 130000,
  },
  {
    id: 71,
    foodName: 'Ốc Luộc / Xào',
    storeName: 'Ốc Chị Lệ',
    location: '88 Cửa Bắc, Ba Đình',
    mapsLink: 'https://www.google.com/maps/search/?api=1&query=Ốc+Chị+Lệ',
    rating: 4.3,
    priceVnd: 100000,
  },
  {
    id: 72,
    foodName: 'Ốc Nóng',
    storeName: 'Ốc Trang',
    location: '1 Đinh Liệt, Hoàn Kiếm',
    mapsLink: 'https://www.google.com/maps/search/?api=1&query=Ốc+Trang+Đinh+Liệt',
    rating: 4.4,
    priceVnd: 80000,
  },

  // Ăn vặt (Nem chua, Bánh tráng, Thịt xiên, Cháo)
  {
    id: 73,
    foodName: 'Nem Chua Rán',
    storeName: 'Nem Chua Rán Tạm Thương',
    location: 'Ngõ Tạm Thương, Hoàng Kiếm',
    mapsLink: 'https://www.google.com/maps/search/?api=1&query=Nem+Chua+Rán+Tạm+Thương',
    rating: 4.5,
    priceVnd: 50000,
  },
  {
    id: 74,
    foodName: 'Bánh Tráng Trộn',
    storeName: 'Bánh Tráng Cô Toàn',
    location: 'A17 Tôn Thất Tùng, Đống Đa',
    mapsLink: 'https://www.google.com/maps/search/?api=1&query=Bánh+Tráng+Cô+Toàn',
    rating: 4.4,
    priceVnd: 25000,
  },
  {
    id: 75,
    foodName: 'Thịt Xiên Nướng',
    storeName: 'Thịt Xiên Hoàng Đức',
    location: '55 Chùa Láng, Đống Đa',
    mapsLink: 'https://www.google.com/maps/search/?api=1&query=Thịt+Xiên+Hoàng+Đức',
    rating: 4.6,
    priceVnd: 10000,
  },
  {
    id: 76,
    foodName: 'Cháo Trai',
    storeName: 'Cháo Trai Trần Xuân Soạn',
    location: '26 Trần Xuân Soạn, Hai Bà Trưng',
    mapsLink: 'https://www.google.com/maps/search/?api=1&query=Cháo+Trai+Trần+Xuân+Soạn',
    rating: 4.4,
    priceVnd: 30000,
  },
  {
    id: 77,
    foodName: 'Cháo Sườn',
    storeName: 'Cháo Sườn Ngõ Huyện',
    location: '61A Ngõ Huyện, Hoàn Kiếm',
    mapsLink: 'https://www.google.com/maps/search/?api=1&query=Cháo+Sườn+Ngõ+Huyện',
    rating: 4.5,
    priceVnd: 25000,
  },
  {
    id: 78,
    foodName: 'Cháo Lòng',
    storeName: 'Cháo Lòng Bà Tý Còi',
    location: '39 Châu Long, Ba Đình',
    mapsLink: 'https://www.google.com/maps/search/?api=1&query=Cháo+Lòng+Bà+Tý+Còi',
    rating: 4.3,
    priceVnd: 45000,
  },
  {
    id: 79,
    foodName: 'Bánh Tôm',
    storeName: 'Bánh Tôm Hồ Tây',
    location: '1 Thanh Niên, Tây Hồ',
    mapsLink: 'https://www.google.com/maps/search/?api=1&query=Bánh+Tôm+Hồ+Tây',
    rating: 3.8,
    priceVnd: 60000,
  },
  {
    id: 80,
    foodName: 'Bánh Đúc Nóng',
    storeName: 'Bánh Đúc Lê Ngọc Hân',
    location: '8 Ngõ 8B Lê Ngọc Hân, Hai Bà Trưng',
    mapsLink: 'https://www.google.com/maps/search/?api=1&query=Bánh+Đúc+Lê+Ngọc+Hân',
    rating: 4.5,
    priceVnd: 25000,
  },
  {
    id: 81,
    foodName: 'Nộm Bò Khô',
    storeName: 'Nộm Long Vi Dung',
    location: '23 Hồ Hoàn Kiếm',
    mapsLink: 'https://www.google.com/maps/search/?api=1&query=Nộm+Long+Vi+Dung',
    rating: 4.1,
    priceVnd: 40000,
  },
  {
    id: 82,
    foodName: 'Bánh Gối',
    storeName: 'Bánh Gối Lý Quốc Sư',
    location: '52 Lý Quốc Sư, Hoàn Kiếm',
    mapsLink: 'https://www.google.com/maps/search/?api=1&query=Bánh+Gối+Lý+Quốc+Sư',
    rating: 4.2,
    priceVnd: 15000,
  },
  {
    id: 83,
    foodName: 'Quẩy Nóng',
    storeName: 'Quẩy Béo',
    location: '431 Nguyễn Khang, Cầu Giấy',
    mapsLink: 'https://www.google.com/maps/search/?api=1&query=Quẩy+Béo+Nguyễn+Khang',
    rating: 4.3,
    priceVnd: 20000,
  },
  {
    id: 84,
    foodName: 'Há Cảo / Bánh Bao',
    storeName: 'Há Cảo Hàng Bồ',
    location: '55 Hàng Bồ, Hoàn Kiếm',
    mapsLink: 'https://www.google.com/maps/search/?api=1&query=Há+Cảo+Hàng+Bồ',
    rating: 4.4,
    priceVnd: 35000,
  },

  // Món Âu / Á khác
  {
    id: 85,
    foodName: 'Pizza',
    storeName: "Pizza 4P's",
    location: 'Tràng Tiền Plaza, Hoàn Kiếm',
    mapsLink: 'https://www.google.com/maps/search/?api=1&query=Pizza+4Ps+Tràng+Tiền',
    rating: 4.7,
    priceVnd: 250000,
  },
  {
    id: 86,
    foodName: 'Mì Ý',
    storeName: 'Capricciosa',
    location: 'Vincom Metropolis, Ba Đình',
    mapsLink: 'https://www.google.com/maps/search/?api=1&query=Capricciosa+Metropolis',
    rating: 4.3,
    priceVnd: 180000,
  },
  {
    id: 87,
    foodName: 'Dimsum',
    storeName: 'Tim Ho Wan',
    location: 'Lotte Center, Ba Đình',
    mapsLink: 'https://www.google.com/maps/search/?api=1&query=Tim+Ho+Wan+Lotte',
    rating: 4.2,
    priceVnd: 300000,
  },
  {
    id: 88,
    foodName: 'Sushi',
    storeName: 'Sushi Kei',
    location: 'Aeon Mall Long Biên',
    mapsLink: 'https://www.google.com/maps/search/?api=1&query=Sushi+Kei+Aeon+Mall',
    rating: 4.3,
    priceVnd: 250000,
  },
  {
    id: 89,
    foodName: 'Gà Rán Hàn Quốc',
    storeName: 'Don Chicken',
    location: '250 Hàng Bông, Hoàn Kiếm',
    mapsLink: 'https://www.google.com/maps/search/?api=1&query=Don+Chicken+Hàng+Bông',
    rating: 4.5,
    priceVnd: 150000,
  },
  {
    id: 90,
    foodName: 'Mì Cay',
    storeName: 'Mì Cay Sasin',
    location: '75 Phạm Tuấn Tài, Cầu Giấy',
    mapsLink: 'https://www.google.com/maps/search/?api=1&query=Mì+Cay+Sasin+Phạm+Tuấn+Tài',
    rating: 4.2,
    priceVnd: 50000,
  },

  // Tráng miệng / Đồ Uống
  {
    id: 91,
    foodName: 'Kem',
    storeName: 'Kem Tràng Tiền',
    location: '35 Tràng Tiền, Hoàn Kiếm',
    mapsLink: 'https://www.google.com/maps/search/?api=1&query=Kem+Tràng+Tiền',
    rating: 4.6,
    priceVnd: 15000,
  },
  {
    id: 92,
    foodName: 'Kem Xôi',
    storeName: 'Kem Xôi Thu Nga',
    location: '8 Hai Bà Trưng, Hoàn Kiếm',
    mapsLink: 'https://www.google.com/maps/search/?api=1&query=Kem+Xôi+Hai+Bà+Trưng',
    rating: 4.3,
    priceVnd: 25000,
  },
  {
    id: 93,
    foodName: 'Chè',
    storeName: 'Chè Bốn Mùa',
    location: '4 Hàng Cân, Hoàn Kiếm',
    mapsLink: 'https://www.google.com/maps/search/?api=1&query=Chè+Bốn+Mùa+Hàng+Cân',
    rating: 4.5,
    priceVnd: 25000,
  },
  {
    id: 94,
    foodName: 'Chè Khúc Bạch',
    storeName: 'Chè Diệp Phương',
    location: '9 Bùi Thị Xuân, Hai Bà Trưng',
    mapsLink: 'https://www.google.com/maps/search/?api=1&query=Chè+Diệp+Phương',
    rating: 4.4,
    priceVnd: 30000,
  },
  {
    id: 95,
    foodName: 'Tào Phớ',
    storeName: 'Tào Phớ Nghĩa Tân',
    location: '106C2 Nghĩa Tân, Cầu Giấy',
    mapsLink: 'https://www.google.com/maps/search/?api=1&query=Tào+Phớ+Nghĩa+Tân',
    rating: 4.4,
    priceVnd: 15000,
  },
  {
    id: 96,
    foodName: 'Sữa Chua Mít',
    storeName: 'Sữa Chua Mít Hoàng Anh',
    location: '22 Bà Triệu, Hoàn Kiếm',
    mapsLink: 'https://www.google.com/maps/search/?api=1&query=Sữa+Chua+Mít+Bà+Triệu',
    rating: 4.3,
    priceVnd: 25000,
  },
  {
    id: 97,
    foodName: 'Cà Phê Trứng',
    storeName: 'Cafe Giảng',
    location: '39 Nguyễn Hữu Huân, Hoàn Kiếm',
    mapsLink: 'https://www.google.com/maps/search/?api=1&query=Cafe+Giảng',
    rating: 4.7,
    priceVnd: 35000,
  },
  {
    id: 98,
    foodName: 'Cà Phê Trứng',
    storeName: 'Cafe Đinh',
    location: '13 Đinh Tiên Hoàng, Hoàn Kiếm',
    mapsLink: 'https://www.google.com/maps/search/?api=1&query=Cafe+Đinh',
    rating: 4.5,
    priceVnd: 30000,
  },
  {
    id: 99,
    foodName: 'Nước Mía',
    storeName: 'Nước Mía Hàng Điếu',
    location: '37 Hàng Điếu, Hoàn Kiếm',
    mapsLink: 'https://www.google.com/maps/search/?api=1&query=Nước+Mía+Hàng+Điếu',
    rating: 4.4,
    priceVnd: 15000,
  },
  {
    id: 100,
    foodName: 'Trà Chanh',
    storeName: 'Trà Chanh Đào Duy Từ',
    location: '31 Đào Duy Từ, Hoàn Kiếm',
    mapsLink: 'https://www.google.com/maps/search/?api=1&query=Trà+Chanh+Đào+Duy+Từ',
    rating: 4.3,
    priceVnd: 20000,
  },
]

// 3. Contribution Form State & Logic
const formData = ref({
  foodName: '',
  storeName: '',
  location: '',
  mapsLink: '',
  rating: 5.0,
  priceVnd: 50000,
})

const generatedCode = ref('')
const { copy, copied } = useClipboard({ source: generatedCode })

const generateCode = () => {
  const newId = foodDatabase.length + 1
  const newEntry = {
    id: newId,
    ...formData.value,
  }
  generatedCode.value = JSON.stringify(newEntry, null, 2) + ','
}

// 4. SỬA LẠI TÍNH NĂNG TẠO LINK GOOGLE FORM (DÙNG COMPUTED)
const formUrl = computed(() => {
  // Nếu chưa sinh ra code thì trả về dấu # (để link không bấm được)
  if (!generatedCode.value) return '#'

  const encodedJson = encodeURIComponent(generatedCode.value)

  // !!! QUAN TRỌNG: THAY LINK NÀY BẰNG LINK PRE-FILLED CỦA BẠN !!!
  // Hãy đảm bảo có cái chuỗi "entry.xxxxxxxx=" ở trước biến ${encodedJson}
  return `https://docs.google.com/forms/d/e/1FAIpQLSeSdN6thc72C1k3ymxB5LEmQNlxeF2NYHcA6KZRBmbzoXVygg/viewform?usp=pp_url&entry.123456789=${encodedJson}`
})

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)
}

// KHAI BÁO CLASS CHUNG CHO INPUT
const inputClasses =
  'block w-full px-4 py-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white shadow-sm transition-shadow outline-none'
</script>

<template>
  <div
    class="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-200 text-neutral-900 font-sans pb-24"
  >
    <header
      class="bg-white/80 backdrop-blur-md border-b border-neutral-200 sticky top-0 z-10 shadow-sm"
    >
      <div class="max-w-md mx-auto px-4 h-16 flex items-center gap-2 text-orange-500">
        <Icon icon="fluent-emoji-flat:bento-box" class="text-3xl" />
        <h1 class="text-xl font-extrabold tracking-tight">J2 Vibe Eats</h1>
      </div>
    </header>

    <main class="max-w-md mx-auto px-4 py-8">
      <section class="flex flex-col items-center w-full mb-16">
        <div class="text-center mb-10">
          <h2 class="text-3xl font-bold tracking-tight mb-2">Trưa nay ăn gì?</h2>
          <p class="text-neutral-500">Để số phận quyết định bữa ăn của bạn.</p>
        </div>

        <div
          class="w-full aspect-[4/3] max-w-[320px] bg-white rounded-3xl shadow-xl border-4 border-orange-100 flex items-center justify-center p-6 mb-8 relative overflow-hidden transition-all duration-300"
          :class="isSpinning ? 'scale-95 shadow-inner' : 'scale-100'"
        >
          <div :key="displayedName" class="text-center" :class="{ 'animate-pulse': isSpinning }">
            <span
              :class="[
                'font-black tracking-tight',
                isSpinning ? 'text-4xl text-neutral-300' : 'text-5xl text-orange-500',
              ]"
            >
              {{ displayedName }}
            </span>
          </div>
        </div>

        <button
          @click="pickRandomFood"
          :disabled="isSpinning"
          class="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-bold text-xl shadow-lg shadow-orange-500/30 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
        >
          <Icon v-if="!isSpinning" icon="mingcute:dices-2-fill" class="text-2xl" />
          <Icon v-else icon="line-md:loading-loop" class="text-2xl" />
          {{ isSpinning ? 'Đang quay món...' : 'Quay số ngay' }}
        </button>

        <transition name="slide-up">
          <div
            v-if="selectedFood && !isSpinning"
            class="w-full mt-8 bg-white rounded-2xl p-1 shadow-md border border-neutral-200 overflow-hidden relative"
          >
            <div class="bg-orange-50/50 p-5 rounded-xl">
              <div class="flex justify-between items-start mb-4">
                <div>
                  <h3 class="text-xl font-bold text-neutral-800">{{ selectedFood.storeName }}</h3>
                  <div class="flex items-center gap-1 text-amber-500 mt-1">
                    <Icon icon="ic:round-star" />
                    <span class="font-medium text-sm">{{ selectedFood.rating.toFixed(1) }}</span>
                  </div>
                </div>
                <div
                  class="bg-orange-100 text-orange-700 px-3 py-1 rounded-lg text-sm font-bold border border-orange-200"
                >
                  {{ formatCurrency(selectedFood.priceVnd) }}
                </div>
              </div>

              <div class="flex items-start gap-2 text-neutral-600 mb-6">
                <Icon icon="mdi:map-marker" class="text-xl shrink-0 mt-0.5 text-neutral-400" />
                <p class="text-sm font-medium leading-relaxed">{{ selectedFood.location }}</p>
              </div>

              <a
                :href="selectedFood.mapsLink"
                target="_blank"
                rel="noopener noreferrer"
                class="w-full flex items-center justify-center gap-2 py-3 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl font-medium transition-colors"
              >
                <Icon icon="logos:google-maps" class="text-lg" />
                Xem trên Google Maps
              </a>
            </div>
          </div>
        </transition>
      </section>

      <section class="w-full border-t-2 border-dashed border-neutral-300 pt-12">
        <div class="mb-8">
          <div class="flex items-center gap-2 mb-2">
            <Icon icon="mdi:code-tags" class="text-2xl text-emerald-500" />
            <h2 class="text-2xl font-bold tracking-tight">Đóng góp quán ăn</h2>
          </div>
          <p class="text-neutral-500 text-sm">
            Điền thông tin quán ruột của bạn, tạo code và gửi PR để J2TEAM cùng ăn nhé!
          </p>
        </div>

        <form @submit.prevent="generateCode" class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-neutral-500 uppercase mb-1">Tên món</label>
              <input
                type="text"
                v-model="formData.foodName"
                required
                :class="inputClasses"
                placeholder="VD: Bún riêu"
              />
            </div>
            <div>
              <label class="block text-xs font-bold text-neutral-500 uppercase mb-1"
                >Tên quán</label
              >
              <input
                type="text"
                v-model="formData.storeName"
                required
                :class="inputClasses"
                placeholder="VD: Bún riêu Cua Đồng"
              />
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold text-neutral-500 uppercase mb-1">Địa chỉ</label>
            <input
              type="text"
              v-model="formData.location"
              required
              :class="inputClasses"
              placeholder="Chi tiết địa chỉ quán..."
            />
          </div>

          <div>
            <label class="block text-xs font-bold text-neutral-500 uppercase mb-1"
              >Google Maps Link</label
            >
            <input
              type="url"
              v-model="formData.mapsLink"
              required
              :class="inputClasses"
              placeholder="https://maps.google.com/..."
            />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-neutral-500 uppercase mb-1"
                >Đánh giá (0-5)</label
              >
              <input
                type="number"
                v-model="formData.rating"
                required
                min="0"
                max="5"
                step="0.1"
                :class="inputClasses"
              />
            </div>
            <div>
              <label class="block text-xs font-bold text-neutral-500 uppercase mb-1"
                >Giá TB (VNĐ)</label
              >
              <input
                type="number"
                v-model="formData.priceVnd"
                required
                min="0"
                step="1000"
                :class="inputClasses"
              />
            </div>
          </div>

          <button
            type="submit"
            class="w-full py-4 mt-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <Icon icon="mdi:auto-fix" class="text-xl" />
            Tạo Code JSON
          </button>
        </form>

        <transition name="slide-up">
          <div
            v-if="generatedCode"
            class="mt-8 space-y-4 bg-neutral-900 p-4 rounded-2xl border border-neutral-800"
          >
            <div class="flex justify-between items-center mb-2">
              <span class="text-xs font-mono text-emerald-400">🔥 Code đã sẵn sàng!</span>
              <button
                @click="copy()"
                class="flex items-center gap-1 px-3 py-1 bg-neutral-800 hover:bg-neutral-700 text-white text-xs rounded-md transition-colors"
              >
                <Icon
                  :icon="copied ? 'mdi:check-all' : 'mdi:content-copy'"
                  :class="copied ? 'text-emerald-400' : ''"
                />
                {{ copied ? 'Đã Copy!' : 'Copy Code' }}
              </button>
            </div>

            <textarea
              readonly
              :value="generatedCode"
              rows="9"
              class="block w-full bg-transparent text-emerald-300 font-mono text-sm focus:outline-none resize-none selection:bg-emerald-900"
            ></textarea>

            <a
              :href="formUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="w-full flex items-center justify-center gap-2 py-3 bg-[#4285F4] hover:bg-[#3367D6] text-white rounded-xl font-bold transition-transform hover:scale-[1.02] active:scale-95 mt-4 shadow-md"
            >
              <Icon icon="mdi:google-spreadsheet" class="text-xl" />
              Gửi đóng góp (Qua Google Form)
            </a>
          </div>
        </transition>
      </section>
    </main>
  </div>
</template>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.slide-up-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.slide-up-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}
</style>
