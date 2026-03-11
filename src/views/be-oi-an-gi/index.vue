<script setup lang="ts">
import { ref, computed } from 'vue'
import { RouterLink } from 'vue-router'

const database = [
  { name: "Bánh mì pate Hoàng Oanh", dish: "Bánh mì", type: "Bánh mì", addr: "8 Phan Văn Hân", dist: "Quận Bình Thạnh", time: "14h-3h", price: "20k-25k" },
  { name: "Cơm Tấm Cô Bảy", dish: "Cơm tấm", type: "Cơm", addr: "453/77A Lê Văn Sỹ", dist: "Quận 3", time: "6h-11h30", price: "45k" },
  { name: "Bánh mì thịt khìa Cô cúc", dish: "Bánh mì", type: "Bánh mì", addr: "36 An Dương Vương", dist: "Quận 5", time: "6h-11h30", price: "25k-30k" },
  { name: "Bánh mì thịt pate nướng", dish: "Bánh mì", type: "Bánh mì", addr: "001 Lô L chung cư Ngô Gia Tự", dist: "Quận 10", time: "6h-20h", price: "22-31k" },
  { name: "Cơm Tấm 2 Chị Em", dish: "Cơm tấm", type: "Cơm", addr: "682/20 Võ Văn Kiệt", dist: "Quận 5", time: "16h-20h", price: "40k-65k" },
  { name: "Lẩu cá dân ích", dish: "Lẩu cá", type: "Lẩu", addr: "99 Châu Văn Liêm", dist: "Quận 5", time: "16h-22h", price: "280k-450k" },
  { name: "Bánh canh của 121", dish: "Bánh canh", type: "Món nước", addr: "121 Nguyễn Trãi", dist: "Quận 5", time: "6h-10h", price: "24k" },
  { name: "Mì bò Đài Loan", dish: "Mì bò trộn, nước", type: "Món nước", addr: "171 Nguyễn Gia Trí", dist: "Quận Bình Thạnh", time: "18h-hết", price: "45-55k" },
  { name: "Bún bò Quận 7", dish: "Bún bò", type: "Món nước", addr: "156/5 Nguyễn Văn Linh", dist: "Quận 7", time: "5h-21h", price: "50-60k" },
  { name: "Bánh mì Bà Hà", dish: "Bánh mì", type: "Bánh mì", addr: "247 Hoàng Sa, Tân Định", dist: "Quận 10", time: "6:00 - 17:00", price: "15-25k" },
  { name: "RaoHe - Món Đài Loan", dish: "Món Đài Loan", type: "Sang choảnh", addr: "119 Phạm Văn Chiêu", dist: "Quận Gò Vấp", time: "16h-22h", price: "Vừa phải" },
  { name: "Cơm Tấm Mai", dish: "Cơm tấm", type: "Cơm", addr: "129 Đoàn Văn Bơ", dist: "Quận 4", time: "16h-hết", price: "50k" },
  { name: "Thơm", dish: "Quán nước", type: "Quán nước", addr: "42CT Tam Đảo", dist: "Quận 10", time: "9h-24h", price: "Vừa phải" },
  { name: "Bún bò Nam Hưng", dish: "Bún bò", type: "Món nước", addr: "1 Công Trường Hoà Bình, P.19", dist: "Quận Bình Thạnh", time: "16h-21h", price: "40-60k" },
  { name: "Bún bò Gò vấp", dish: "Bún bò", type: "Món nước", addr: "69 Lê Lợi, P.4", dist: "Quận Gò Vấp", time: "07:45 - 22:30", price: "40-60k" },
  { name: "Lẩu bò, nướng Cô Út", dish: "Bò né nướng, lẩu", type: "Lẩu", addr: "53 Trần Hưng Đạo, Phường 6", dist: "Quận 5", time: "07:00 - 22:00", price: "Vừa phải" },
  { name: "Lẩu cù lao", dish: "Lẩu miền tây", type: "Lẩu", addr: "410 Nguyễn Xí, P.13", dist: "Quận Bình Thạnh", time: "15h30-22h", price: "Vừa phải" },
  { name: "Bếp Chảo nhà 56", dish: "Bánh mì chảo", type: "Món khô", addr: "53 Phan Đình Phùng", dist: "Quận Phú Nhuận", time: "24/24", price: "35-55k" },
  { name: "Bánh Canh Càng Cúm", dish: "Bánh canh", type: "Món nước", addr: "108/22C Trần Quang Diệu P.14", dist: "Quận 3", time: "08:00 - 21:00", price: "40-55k" },
  { name: "Bún bò rẻ Quận 5", dish: "Bún bò", type: "Món nước", addr: "70 Nguyễn Duy, P.9", dist: "Quận 5", time: "Sáng - Chiều", price: "35k" },
  { name: "Bún bò ngon số 1 SG", dish: "Bún bò", type: "Món nước", addr: "109 Trần Quốc Toản", dist: "Quận 3", time: "15:00 - 20:30", price: "60k" },
  { name: "Bánh mì chấm xíu mại", dish: "Bánh mì", type: "Bánh mì", addr: "284 Nam Kỳ Khởi Nghĩa, P.8", dist: "Quận 3", time: "7h-21h", price: "40k" },
  { name: "Bánh flan Minh Phụng", dish: "Flan", type: "Tráng miệng", addr: "347/22 Minh Phụng, P.2", dist: "Quận 11", time: "10:00 - 22:00", price: "10-20k" },
  { name: "Mì trộn thái cay", dish: "Mì trộn", type: "Món khô", addr: "100 Số 13, Tân Quy", dist: "Quận 7", time: "07:00 - 22:00", price: "60k" },
  { name: "Ty Thy", dish: "Ăn vặt", type: "Ăn vặt", addr: "546 Đ. An D. Vương, Phường 10", dist: "Quận 6", time: "12h-22h", price: "Vừa phải" },
  { name: "Bò Kho Gánh", dish: "Bò kho", type: "Món nước", addr: "029 Lô H chung cư Ngô Gia Tự", dist: "Quận 10", time: "11h-22h", price: "50k" },
  { name: "Bánh bò thốt nốt Baaboo", dish: "Bánh bò", type: "Ăn vặt", addr: "337/37 Nguyễn Đình Chiểu, P.5", dist: "Quận 3", time: "Online", price: "Vừa phải" },
  { name: "Bánh Xèo, Hỏi, Bò Lá Lốt", dish: "Các loại bánh", type: "Món khô", addr: "023 Lô H chung cư Ngô Gia Tự", dist: "Quận 10", time: "16h-20h", price: "35k" },
  { name: "Katte Donut", dish: "Mochi", type: "Ăn vặt", addr: "124 Vạn Kiếp", dist: "Quận Bình Thạnh", time: "17h-hết", price: "từ 17k" },
  { name: "Trà sữa Together", dish: "Trà sữa", type: "Quán nước", addr: "200 Nguyễn Thượng Hiền, P. 5", dist: "Quận Phú Nhuận", time: "13:00 - 21:30", price: "29k-40k" },
  { name: "Lò Đất BBQ", dish: "BBQ", type: "Nhậu nhẹt", addr: "922 Quang Trung, Phường 8 (CN3)", dist: "Quận Gò Vấp", time: "16:00 - 23:30", price: "Vừa phải" },
  { name: "7 Ngày 7 Món Q5", dish: "Món gì cũng có", type: "Món nước", addr: "465 Trần Hưng Đạo", dist: "Quận 5", time: "6h-9h", price: "40k" },
  { name: "Bánh Mì nướng Muối Ớt", dish: "Bánh mì", type: "Bánh mì", addr: "50 Nguyễn Xuân Khoát, Tân Phú", dist: "Quận Tân Phú", time: "16h30-22h", price: "35k" },
  { name: "Nem nướng Liên", dish: "Nem nướng", type: "Món cuốn", addr: "Chợ Nguyễn Văn Trỗi, Q3", dist: "Quận 3", time: "14h-19h", price: "35k" },
  { name: "Bánh cuốn Quảng Đông", dish: "Bánh cuốn", type: "Món khô", addr: "28 Dương Đình Nghệ, Q11", dist: "Quận 11", time: "6h-15h", price: "35k-50k" },
  { name: "Bánh mì Cá Nục", dish: "Bánh mì", type: "Bánh mì", addr: "6 Hồ Xuân Hương, Phường 14", dist: "Quận Bình Thạnh", time: "6h-19h", price: "20-40k" },
  { name: "Bánh mì bì thịt mắm", dish: "Bánh mì", type: "Bánh mì", addr: "Ngã 3 Nam Kỳ KN & Ngô Thời Nhiệm", dist: "Quận 3", time: "5h-10h30", price: "17k-20k" },
  { name: "Hẻm ăn vặt 284", dish: "Ăn vặt", type: "Ăn vặt", addr: "284 Lê Văn Sỹ", dist: "Quận 3", time: "Chiều tối", price: "Vừa phải" },
  { name: "7 Ngày 7 Món Q3", dish: "7 Ngày 7 Món", type: "Món nước", addr: "108/20A Trần Quang Diệu, P.14", dist: "Quận 3", time: "6h-9h", price: "35-50k" },
  { name: "Bánh Mì thịt xiên nướng", dish: "Bánh mì", type: "Món khô", addr: "375 Nguyễn Trãi, Q5", dist: "Quận 5", time: "6h-10h30", price: "13k" },
  { name: "Bánh Mì Chả bằng thịt", dish: "Bánh mì", type: "Món khô", addr: "Ngã Tư Phạm Hữu Trí - Thuận Kiều", dist: "Quận 5", time: "6h-10h", price: "13k" },
  { name: "Cơm Tấm Hẻm Đình", dish: "Cơm tấm", type: "Cơm", addr: "Hẻm 241 Bến Vân Đồn, Q4", dist: "Quận 4", time: "4h-9h", price: "30-40k" },
  { name: "BBQ - Hàu chén nướng", dish: "Hàu", type: "Nhậu nhẹt", addr: "539 Phạm Văn Đồng", dist: "Quận Bình Thạnh", time: "15h-1h khuya", price: "Bình dân" },
  { name: "Bánh Mì phá lấu, Bì", dish: "Bánh mì", type: "Bánh mì", addr: "358/2 Lê Quang Sung, Q6", dist: "Quận 6", time: "6h-8h; 13h-16h", price: "15k" },
  { name: "Bánh mì Gánh siêu dài", dish: "Bánh mì", type: "Bánh mì", addr: "31 Tân Tiến, Tân Bình", dist: "Quận Tân Bình", time: "6h-11h", price: "15-25k" },
  { name: "Lẩu Mini", dish: "Lẩu", type: "Lẩu", addr: "577 Sư Vạn Hạnh Q10", dist: "Quận 10", time: "10-22h", price: "45k" },
  { name: "Bánh bèo Phú Nhuận", dish: "Bánh bèo", type: "Ăn vặt", addr: "211/116 Hoàng Hoa Thám", dist: "Quận Phú Nhuận", time: "14h-16h", price: "30k" },
  { name: "Xôi nghệ sĩ", dish: "Xôi", type: "Món khô", addr: "98 Minh Phụng, Q6", dist: "Quận 6", time: "16h30-hết", price: "20-25k" },
  { name: "Tiệm nướng Nọ trong vườn", dish: "Nướng", type: "Sang choảnh", addr: "80 Nguyễn Thái Sơn", dist: "Quận Gò Vấp", time: "16h-hết", price: "Vừa phải" },
  { name: "Buffet YinShi", dish: "Lẩu & Nướng, Dimsum", type: "Sang choảnh", addr: "37B Đ. Cô Bắc, P.Cầu Ông Lãnh", dist: "Quận 1", time: "9h-21h30", price: "239-269k" },
  { name: "Hủ tiếu mỹ tho dì 9", dish: "Hủ tiếu trứng cuộn", type: "Món nước", addr: "538/51 Đoàn Văn Bơ, P. 14", dist: "Quận 4", time: "17:30 - 23:00", price: "50k" },
  { name: "Bún bò Khánh Ngọc", dish: "Bún bò", type: "Món nước", addr: "27/63 Điện Biên Phủ", dist: "Quận Bình Thạnh", time: "11:00 - 22:00", price: "30-50k" },
  { name: "Cà phê sân vườn", dish: "Cafe", type: "Quán nước", addr: "1122/8/8 Quang Trung, P8", dist: "Quận Gò Vấp", time: "7h-22h", price: "45k" },
  { name: "Bò bít tết cô út", dish: "bò", type: "Món khô", addr: "009 Lô K chung cư Nguyễn Thiện Thuật", dist: "Quận 3", time: "6h-12h", price: "35-100k" },
  { name: "Đá me", dish: "Đá me", type: "Quán nước", addr: "96 Cao Thắng", dist: "Quận 3", time: "6h - 18h", price: "18k" },
  { name: "Mì xào bò trứng non", dish: "Mì", type: "Món khô", addr: "214 Nguyễn Phúc Nguyên, Q3", dist: "Quận 3", time: "13h30-16h30", price: "15k-20k" },
  { name: "Bánh mì thịt xiên Q6", dish: "Bánh mì", type: "Bánh mì", addr: "165 Nguyễn Văn Luông, P.10", dist: "Quận 6", time: "14h30-17h", price: "15k-20k" },
  { name: "Mì gà Gò Vấp", dish: "Mì gà", type: "Món nước", addr: "440/14 Thống Nhất, P.16", dist: "Quận Gò Vấp", time: "9h-21h", price: "50k" },
  { name: "Xôi khâu nhục", dish: "Xôi", type: "Món khô", addr: "259/263 Lã Binh Thăng, Q.11", dist: "Quận 11", time: "6h-11h", price: "35k" },
  { name: "Bún riêu cua Q1", dish: "Bún riêu", type: "Món nước", addr: "219 Nguyễn Trãi, P. NCT", dist: "Quận 1", time: "11h-22h", price: "Vừa phải" },
  { name: "Hủ tiếu nam vang Chú Tứ", dish: "Hủ tiếu", type: "Món nước", addr: "Đầu hẻm 73 Trần Bình Trọng", dist: "Quận 5", time: "6h-22h", price: "35k-50k" },
  { name: "Cơm Tấm Cô Giang", dish: "Cơm tấm", type: "Cơm", addr: "25 Cô Giang, P. Cầu Ông Lãnh", dist: "Quận 1", time: "17h – 22h", price: "Vừa phải" },
  { name: "Hủ tiếu xí quách", dish: "Hủ tiếu", type: "Món nước", addr: "16/1 Lữ Gia, Q.11", dist: "Quận 11", time: "6-13h, 16h-22h", price: "45k-60k" },
  { name: "Bún mì vàng Tiến Phát", dish: "Bún mì hủ tiếu", type: "Món nước", addr: "177 Trần Quý", dist: "Quận 11", time: "6h-22h", price: "Vừa phải" },
  { name: "Hủ tiếu bò viên Trường Sa", dish: "Hủ tiếu", type: "Món nước", addr: "1046 Trường Sa, Q.3", dist: "Quận 3", time: "16h-22h", price: "45k" },
  { name: "Quán ốc Hoa Sữa 29", dish: "Ốc", type: "Nhậu nhẹt", addr: "11 Hoa Sữa", dist: "Quận Phú Nhuận", time: "15:00 - 23:59", price: "Vừa phải" },
  { name: "Mì trộn muối ớt", dish: "Mì", type: "Món nước", addr: "296 Hậu Giang, P.5, Q.6", dist: "Quận 6", time: "12h-2h khuya", price: "35k-45k" },
  { name: "Đá bào túi to đùng", dish: "Đá bào", type: "Quán nước", addr: "17 Trần Quang Khải, Tân Định", dist: "Quận 1", time: "10h-23h", price: "25-30k" },
  { name: "Dimsum Crystal Jade", dish: "Dimsum", type: "Sang choảnh", addr: "Nhiều chi nhánh", dist: "Quận 1", time: "10h-21h", price: "Cao" },
  { name: "Dimsum Tân Sanh Hoạt", dish: "Hủ tiếu Dimsum", type: "Món nước", addr: "322 Nguyễn Thị Minh Khai", dist: "Quận 3", time: "4h-12h", price: "25-65k" },
  { name: "Gò Da Quán", dish: "Đồ miền trung", type: "Món khô", addr: "Hẻm 80 QL13", dist: "Quận Bình Thạnh", time: "15h30-21h", price: "Vừa phải" },
  { name: "Mì trộn Tùm Lum", dish: "Mì trộn", type: "Món khô", addr: "1196 CMT8, P.4", dist: "Quận Tân Bình", time: "10h-22h", price: "Vừa phải" },
  { name: "Xủi cảo Hà Tôn Quyền", dish: "Xủi Cảo", type: "Món khô", addr: "162 Hà Tôn Quyền, Q11", dist: "Quận 11", time: "15h-0h", price: "50k-100k" },
  { name: "Nem nướng Nha Trang", dish: "Nem nướng", type: "Món cuốn", addr: "504 Minh Phụng, P.9", dist: "Quận 11", time: "8h-23h", price: "Vừa phải" },
  { name: "Đặc sản Phan Rang", dish: "Bánh căn, bánh khọt", type: "Món cuốn", addr: "CC22 Trường Sơn, Cư Xá Bắc Hải", dist: "Quận 10", time: "09:00 - 22:30", price: "40-60k" },
  { name: "Sushi sashimi Kimochi", dish: "Sushi, Sashimi", type: "Sang choảnh", addr: "167/2/5 Ngô Tất Tố, P. 22", dist: "Quận Bình Thạnh", time: "10h-22h", price: "Vừa phải" },
  { name: "Bánh Mì Xíu Mại Gánh", dish: "Bánh mì xíu mại", type: "Bánh mì", addr: "A2/8 Chung Cư Miếu Nổi, P.2", dist: "Quận Bình Thạnh", time: "14:00 - 18:00", price: "15k" },
  { name: "Gum Fastfood - Món âu", dish: "Món âu", type: "Sang choảnh", addr: "245/1 Nguyễn Trãi", dist: "Quận 1", time: "10h-21h30", price: "Vừa phải" },
  { name: "Mì quảng O Hè", dish: "Mì quảng", type: "Món nước", addr: "Cuối hẻm 315 Lê Văn Sỹ, P.13", dist: "Quận 3", time: "06:30 - 12:30", price: "45-50k" },
  { name: "Bánh mì Hồng", dish: "Bánh mì ba chỉ muối", type: "Bánh mì", addr: "311 Nguyễn Tri Phương", dist: "Quận 10", time: "17h30-24h", price: "Vừa phải" },
  { name: "Hủ tiếu Cầu Dừa", dish: "Hủ tiếu, bánh canh", type: "Món nước", addr: "Quận 4", dist: "Quận 4", time: "19h-21h", price: "45k" },
  { name: "Tré trộn Bà Đào", dish: "Tré trộn", type: "Ăn vặt", addr: "85 Rạch Bung Binh, Phường 9", dist: "Quận 3", time: "09:00 - 22:00", price: "50k" },
  { name: "Bún thái Ni", dish: "Bún thái", type: "Món nước", addr: "232 Hoàng Hoa Thám, phường 5", dist: "Quận Bình Thạnh", time: "17:00 - 22:00", price: "45-65k" },
  { name: "Món nhật Sachi Sushi", dish: "Món nhật", type: "Sang choảnh", addr: "13 Đường số 10, Tân Quy", dist: "Quận 7", time: "17h-22h", price: "Vừa phải" },
  { name: "Cơm tấm Cô Giang", dish: "Cơm tấm", type: "Cơm", addr: "Đối diện 27 Cô Giang, Cầu Ông Lãnh", dist: "Quận 1", time: "16-22h", price: "Vừa phải" },
  { name: "Bún thịt nướng ngon", dish: "Bún thịt nướng", type: "Món khô", addr: "Số 1 Nguyễn Trung Trực", dist: "Quận 10", time: "8:00 - 19:00", price: "50-70k" },
  { name: "Làng Chài - Nem nướng", dish: "Nem nướng", type: "Món cuốn", addr: "52 Hoàng Diệu, p.12", dist: "Quận 4", time: "7h-21h", price: "Vừa phải" },
  { name: "Bún Bò Huế O HẠNH", dish: "Bún bò", type: "Món nước", addr: "32 Đ. Số 10, Tân Kiểng", dist: "Quận 7", time: "6h30-20h", price: "35-40k" },
  { name: "Nem lụi Cô Đào", dish: "Nem lụi cuốn", type: "Món cuốn", addr: "Hẻm 209 Lê Văn Sỹ", dist: "Quận 3", time: "12:30 - 19:00", price: "Vừa phải" },
  { name: "Cơm tấm đêm", dish: "Cơm tấm đêm", type: "Cơm", addr: "178 Hậu Giang, P.6", dist: "Quận 6", time: "22h - 5h sáng", price: "Vừa phải" },
  { name: "Bếp cô Linh", dish: "Cơm tấm Long xuyên", type: "Cơm", addr: "710/6/8 Phan Văn Trị, P.10", dist: "Quận Gò Vấp", time: "06:30 - 18:00", price: "35-50k" },
  { name: "Bánh mì nướng ớt đỏ", dish: "Bánh mì nướng", type: "Bánh mì", addr: "50 Nguyễn Xuân Khoái, Tân Thành", dist: "Quận Tân Phú", time: "11h-21h", price: "20k" },
  { name: "7 Ngày 7 Món Q1", dish: "Bún mắm", type: "Món nước", addr: "26 Cô Giang", dist: "Quận 1", time: "6h-11h", price: "Vừa phải" },
  { name: "K-Jeju Chicken", dish: "Món hàn (gà)", type: "Sang choảnh", addr: "222 Đường D5, P.25", dist: "Quận Bình Thạnh", time: "10:00 - 22:00", price: "100k-300k" },
  { name: "Norang Tongdak", dish: "Món hàn (gà)", type: "Sang choảnh", addr: "34 Đường số 6, Hưng Vượng 2, Tân Phong", dist: "Quận 7", time: "11:30 - 23:59", price: "Vừa phải" },
  { name: "Pháp mì gà", dish: "Mì gà, hủ tiếu", type: "Món nước", addr: "440/14 Thống Nhất, P.16", dist: "Quận Gò Vấp", time: "10:00 - 21:00", price: "35k" },
  { name: "Cơm gà xối mỡ ngon", dish: "Cơm gà", type: "Cơm", addr: "702 Trường Sa, Phường 14", dist: "Quận 3", time: "8h-18h", price: "Vừa phải" },
  { name: "Chả lụi nướng Lagi", dish: "Chả lụi Lagi", type: "Món cuốn", addr: "21 Nguyễn Văn Nghi, Phường 4", dist: "Quận Gò Vấp", time: "15h-22h", price: "28k" },
  { name: "Bánh mì Cá Hàng Xanh", dish: "Bánh mì cá", type: "Bánh mì", addr: "246D XVNT", dist: "Quận Bình Thạnh", time: "14:00 - 23:00", price: "Vừa phải" },
  { name: "Hủ tiếu Sườn sụn", dish: "Hủ tiếu", type: "Món nước", addr: "Hẻm 618 CMT8 (Đối diện CV Lê Thị Riêng)", dist: "Quận 10", time: "17:00 - 22:00", price: "35-50k" },
  { name: "Johnson - Tokbokki", dish: "Món hàn", type: "Sang choảnh", addr: "118 Nguyễn Gia Trí", dist: "Quận Bình Thạnh", time: "10h45-21h30", price: "Giá sinh viên" },
  { name: "Phở trộn", dish: "Phở trộn", type: "Món nước", addr: "433 Hậu Giang, P,11", dist: "Quận 6", time: "6h30-23h30", price: "55k-60k" },
  { name: "Dimsum nổi tiếng", dish: "Dimsum", type: "Món nước", addr: "38B Học Lạc, P.14", dist: "Quận 5", time: "6h-12h | 15h-21h", price: "45k" },
  { name: "Mì quảng miền Nam", dish: "Mì quảng bánh canh", type: "Món nước", addr: "Hẻm 85 Trần Quang Diệu, P.13", dist: "Quận 3", time: "06:00 - 12:00", price: "55k" },
  { name: "Miến gà trộn ĐH Kiến Trúc", dish: "Miến trộn", type: "Món khô", addr: "196 Pasteur, Vo Thi Sau", dist: "Quận 3", time: "6h-12h", price: "25k" },
  { name: "Bò chảo Tân Định", dish: "Bò chảo", type: "Món khô", addr: "181 Đinh Tiên Hoàng", dist: "Quận 1", time: "06:30 - 22:00", price: "50k" },
  { name: "Mì trộn muối ớt Bà Quàng", dish: "Mì trộn", type: "Món nước", addr: "40/49 Lê Thị Riêng, p.17", dist: "Quận Gò Vấp", time: "06:00 - 22:00", price: "35-50k" },
  { name: "Burger Trịu Viu", dish: "Burger, Mì ý", type: "Fastfood", addr: "348 Tôn Đản", dist: "Quận 4", time: "09:30 - 22:00", price: "40-60k" },
  { name: "Bánh bèo Cô Ba", dish: "Bánh bèo", type: "Món khô", addr: "123 Nguyễn Thông, P9", dist: "Quận 3", time: "16h-hết", price: "Vừa phải" },
  { name: "Bún bò Ngọc Nhân", dish: "Bún bò", type: "Món nước", addr: "102 Ngô Thị Thu Minh", dist: "Quận Tân Bình", time: "07:30 - 21:00", price: "45-60k" },
  { name: "Bánh mì nướng Phúc Mập", dish: "Bánh mì nướng", type: "Bánh mì", addr: "235 Nguyễn Thái Bình", dist: "Quận Tân Bình", time: "14:00 - 21:00", price: "27k" },
  { name: "Cơm Tấm 64A", dish: "Cơm tấm", type: "Cơm", addr: "64A Lý Nam Đế, P. 7", dist: "Quận 11", time: "6:20 - 12:00", price: "Vừa phải" },
  { name: "Buffet Cơm Chay", dish: "Cơm chay", type: "Đồ chay", addr: "47 Bis Võ Văn Tần", dist: "Quận 3", time: "10h30-14h", price: "50k" },
  { name: "Lẩu bò 150", dish: "Lẩu bò", type: "Lẩu", addr: "150 Phan Xích Long", dist: "Quận Phú Nhuận", time: "16h-23h", price: "200k/2 người" },
  { name: "Mì Hàn Quốc tự động MYTO", dish: "Cửa hàng tiện lợi", type: "Món khô", addr: "20-22 Phạm Ngọc Thạch", dist: "Quận 3", time: "7h-0h", price: "Vừa phải" },
  { name: "Hủ tiếu gõ bình dân", dish: "Hủ tiếu", type: "Món nước", addr: "368 Nơ Trang Long, P.13", dist: "Quận Bình Thạnh", time: "Chiều tối", price: "Bình dân" },
  { name: "Bánh canh cua Cầu Calmette", dish: "Bánh canh cua", type: "Món nước", addr: "19 Calmette, P. NTB", dist: "Quận 1", time: "11h - 17h", price: "Vừa phải" },
  { name: "Bánh canh của Cô Tư", dish: "Banh canh cua", type: "Món nước", addr: "45 Bạch Vân, P.5", dist: "Quận 5", time: "14h-18h", price: "50-100k" },
  { name: "Bún bò 25k lề đường", dish: "Bún bò", type: "Món nước", addr: "Đối diện 151C Hai Bà Trưng", dist: "Quận 3", time: "10h-hết", price: "25k" },
  { name: "Bún riêu cua 120", dish: "Bún riêu", type: "Món nước", addr: "120 Hậu Giang", dist: "Quận 6", time: "18:00 - 23:59", price: "50-60k" },
  { name: "Mì trộn Dách Lou", dish: "Mì trộn", type: "Ăn vặt", addr: "75D Phú Thọ", dist: "Quận 11", time: "10h-23h", price: "Vừa phải" },
  { name: "Ăn vặt SPEIT", dish: "Đồ ăn vặt xịn", type: "Ăn vặt", addr: "349/16 Nguyễn Trãi", dist: "Quận 5", time: "11h-22h", price: "Vừa phải" },
  { name: "Xúc xích đức Leon King", dish: "Xúc xích đức", type: "Ăn vặt", addr: "491/32 Nguyễn Văn Công, P.3", dist: "Quận Gò Vấp", time: "8h-21h", price: "Vừa phải" },
  { name: "Bánh mì thịt nướng", dish: "Bánh mì", type: "Bánh mì", addr: "247 Hoàng Sa, Tân định", dist: "Quận 1", time: "6h30-14h", price: "Vừa phải" },
  { name: "Xôi Bánh Mì Cô Tuyền", dish: "Xôi - Bánh mì", type: "Bánh mì", addr: "82 Nguyễn Du, Bến Nghé", dist: "Quận 1", time: "05:00 - 09:30", price: "25k" },
  { name: "Núp Coffee & Tea", dish: "Cà phê trân châu", type: "Quán nước", addr: "45 Dương Đình Nghệ, P8, Q11", dist: "Quận 11", time: "08:00 - 22:00", price: "40-60k" },
  { name: "Phở Thu (Phở trộn)", dish: "Phở nước, trộn", type: "Món nước", addr: "433 Hậu Giang, P.11", dist: "Quận 6", time: "6h30-1h30 sáng", price: "Vừa phải" },
  { name: "Chickita - Gà nướng", dish: "Gà nướng", type: "Sang choảnh", addr: "94 Hồ Tùng Mậu, P. Bến Nghé", dist: "Quận 1", time: "10:30 - 20:45", price: "100-300k" },
  { name: "Nem nướng - Chả lagi", dish: "Nem nướng - Chả lagi", type: "Món khô", addr: "43/1 Tăng Bạt Hổ", dist: "Quận Bình Thạnh", time: "15:30 - 22:00", price: "30k" },
  { name: "The B6.Saigon", dish: "Box đồ ăn thập cẩm Hàn", type: "Sang choảnh", addr: "157/28D Nguyễn Gia Trí, P.25", dist: "Quận Bình Thạnh", time: "9:00 - 22:00", price: "2xx" },
  { name: "Bánh Mì 3 Cô", dish: "Bánh mì xíu mại ngon", type: "Bánh mì", addr: "217 Lê Văn Sỹ , Phường 13", dist: "Quận 3", time: "06H00 - 11H00", price: "15k-25k" },
  { name: "Quán chay Thanh Lạc", dish: "Chay", type: "Đồ chay", addr: "144 Nguyễn Tất Thành", dist: "Quận 4", time: "10h30-21h", price: "Vừa phải" },
  { name: "Ramen Danbo", dish: "Mì ramen", type: "Món nước", addr: "8a/7b1 Thái Văn Lung", dist: "Quận 1", time: "Vừa phải", price: "Vừa phải" },
  { name: "Bún riêu Cô Hương Béo", dish: "Bún riêu vị bắc", type: "Món nước", addr: "19B Nguyễn Thị Minh Khai", dist: "Quận 1", time: "6h - 21h30", price: "45-60k" },
  { name: "Mì Trộn Nghèo", dish: "Mì trộn", type: "Món khô", addr: "42CT Tam Đảo, Q.10", dist: "Quận 10", time: "12h-23h", price: "15k-35k" },
  { name: "Hẻm Trộn Ăn Vặt", dish: "Ăn vặt", type: "Ăn vặt", addr: "2 Nguyễn Lâm", dist: "Quận Bình Thạnh", time: "9h-22h", price: "15k-60k" },
  { name: "Xôi Ngọc", dish: "Xôi", type: "Món khô", addr: "101 Vạn Kiếp", dist: "Quận Bình Thạnh", time: "6-10h; 15-23h", price: "35k" },
  { name: "Mì Hoành Thánh Sủi Cảo", dish: "Mì", type: "Món nước", addr: "388 CMT8", dist: "Quận 3", time: "6-22h", price: "25k" },
  { name: "Mì Quảng Cô Yến", dish: "Mì quảng", type: "Món nước", addr: "736/31 CMT8, P.5", dist: "Quận Tân Bình", time: "6-10h30; 14h30-18h30", price: "30-40k" },
  { name: "Bánh đúc hành phi", dish: "Bánh đúc", type: "Món nước", addr: "100/14 Thích Quảng Đức, P5", dist: "Quận Phú Nhuận", time: "11h - hết", price: "22-27k" },
  { name: "Lẩu Sa Tế Uyên Ương", dish: "Lẩu", type: "Lẩu", addr: "213 Trần Tuấn khải, P.7", dist: "Quận 5", time: "18h-23h", price: "170-250k" },
  { name: "Bún bò Huế Hoàng Sa", dish: "Bún bò Huế", type: "Món nước", addr: "725 Hoàng Sa", dist: "Quận 3", time: "17h-19h", price: "35k-50k" },
  { name: "Mì Ốc Hên Dì Lan", dish: "Mì", type: "Món nước", addr: "1A Cư Xá Đồng Tiến, Thành Thái", dist: "Quận 10", time: "08:30 - 20:00", price: "42k" },
  { name: "Bún măm Đầu Cá", dish: "Bún", type: "Món nước", addr: "98 Diên Hồng", dist: "Quận Bình Thạnh", time: "9h-20h", price: "50k" },
  { name: "Bánh mì cụ lý", dish: "Bánh mì", type: "Bánh mì", addr: "189 Hai Bà Trưng", dist: "Quận 3", time: "6h-9h", price: "25k" },
  { name: "Bánh mì Đồng Nai", dish: "Bánh mì", type: "Bánh mì", addr: "70 Đồng Nai, P.15", dist: "Quận 10", time: "6h-13h", price: "17k" },
  { name: "Bún xì dầu", dish: "Bún xì dầu", type: "Món nước", addr: "01 Quách văn tuấn, p.12", dist: "Quận Tân Bình", time: "9h-20h", price: "40k" },
  { name: "Bánh mì chiên tôm", dish: "Bánh mì", type: "Bánh mì", addr: "403 Đoàn văn bơ, p13", dist: "Quận 4", time: "12h30-17h30", price: "Vừa phải" },
  { name: "Mì quảng - Hủ tiếu mực", dish: "Mì quảng", type: "Món nước", addr: "243B Nguyễn Thượng Hiền, P.6", dist: "Quận Bình Thạnh", time: "6h-20h", price: "59k-70k" },
  { name: "Bánh mì Chả Cá NT", dish: "Bánh mì", type: "Bánh mì", addr: "12 Nguyễn Thị Minh Khai", dist: "Quận 1", time: "6h-2h sáng", price: "20k-30k" },
  { name: "Bánh Mì Bì Thịt", dish: "Bánh mì", type: "Bánh mì", addr: "22 Trần Kế Xương", dist: "Quận Phú Nhuận", time: "Sáng", price: "15-35k" },
  { name: "Bún bò Hẻm Hoàng Diệu", dish: "Bún bò", type: "Món nước", addr: "243/35 Hoàng Diệu", dist: "Quận 4", time: "Vừa phải", price: "Vừa phải" },
  { name: "Bánh Mì Chả Cá Quảng Nam", dish: "Bánh mì", type: "Bánh mì", addr: "05 Hoa Sứ", dist: "Quận Phú Nhuận", time: "Vừa phải", price: "Vừa phải" },
  { name: "Bánh mì Heo quay", dish: "Bánh mì", type: "Bánh mì", addr: "Hẻm 19 Trần Bình Trọng", dist: "Quận Bình Thạnh", time: "6-10h", price: "20k" },
  { name: "Bún Thịt Nướng Đêm", dish: "Bún thịt nướng", type: "Món nước", addr: "14 Vĩnh Khánh", dist: "Quận 4", time: "17h-3h sáng", price: "37k" },
  { name: "Bánh Ướt Cô Út 2H", dish: "Bánh Ướt", type: "Món nước", addr: "710/2 Phan Văn Trị", dist: "Quận Gò Vấp", time: "11h30-21h30", price: "100k" },
  { name: "Bún thịt nướng Cô Nga", dish: "Bún thịt nướng", type: "Món khô", addr: "14 Vĩnh Khánh", dist: "Quận 4", time: "17h-3h sáng", price: "37k" },
  { name: "Bánh mì 12k", dish: "Bánh mì", type: "Bánh mì", addr: "24 lương thế vinh", dist: "Quận Tân Phú", time: "Tối", price: "12k" },
  { name: "Thịt xiên nướng Marie Curie", dish: "Thịt xiên nướng", type: "Ăn vặt", addr: "159 Nam Kỳ Khởi Nghĩa", dist: "Quận 3", time: "Tối", price: "8k" },
  { name: "Cơm chiên ngon lạp xưởng", dish: "Cơm chiên", type: "Cơm", addr: "349 nguyễn công trứ", dist: "Quận 1", time: "3h30 - 5h", price: "30k" },
  { name: "Bánh mì Kebab Lai VN", dish: "Bánh mì", type: "Bánh mì", addr: "752 Điện Biên Phủ", dist: "Quận Bình Thạnh", time: "6h00-12h30", price: "22k" },
  { name: "Bún riêu chị Lan", dish: "Bún riêu", type: "Món nước", addr: "41 Thái Ly", dist: "Quận 2", time: "16h-21h", price: "25-40k" },
  { name: "Bánh mì ca dé Hoa", dish: "Bánh mì", type: "Bánh mì", addr: "327J Tùng Thiện Vương", dist: "Quận 8", time: "6h-8h", price: "25 - 45k" },
  { name: "Hủ Tiếu Ngon rẻ", dish: "Hủ Tiếu", type: "Món nước", addr: "679/6 Vĩnh Viễn", dist: "Quận 11", time: "15:00 - 22:00", price: "25k" },
  { name: "Xôi mặn gà gán", dish: "Xôi", type: "Món khô", addr: "Trước trường Bạch Đằng Lê Văn Sỹ", dist: "Quận 3", time: "Sáng", price: "25k" },
  { name: "Bún bò siêu chất lượng", dish: "Bún bò", type: "Món nước", addr: "273/1B Tô Hiến Thành", dist: "Quận 10", time: "5h - 11h tối", price: "50k" },
  { name: "Bánh xèo giòn bình thuận", dish: "Bánh xèo", type: "Món khô", addr: "1 Huỳnh đình Hai", dist: "Quận Phú Nhuận", time: "15h-21h", price: "12k" },
  { name: "Bánh mì chiên tôm cô sen", dish: "Bánh mì", type: "Món khô", addr: "403 Đoàn Văn Bơ", dist: "Quận 4", time: "12h-4h", price: "25 - 45k" },
  { name: "Nem chả lụi Gò Vấp", dish: "Nem", type: "Món khô", addr: "21 Nguyễn Văn Nghi", dist: "Quận Gò Vấp", time: "15h-22h", price: "35k" },
  { name: "Bánh mì bơ Campuchia", dish: "Bánh mì", type: "Bánh mì", addr: "175 Cống Quỳnh", dist: "Quận 1", time: "Sáng - Chiều", price: "5k - 15k" },
  { name: "Hủ tiếu Thái Lan Hihi", dish: "Hủ tiếu", type: "Món khô", addr: "225/7 Nguyễn Đình Chiểu", dist: "Quận 3", time: "10h-21h30", price: "35k" },
  { name: "Bánh xèo tôm nhảy", dish: "Bánh xèo", type: "Món khô", addr: "104 Nơ Trang Long", dist: "Quận Bình Thạnh", time: "09:00 - 22:00", price: "30k" },
  { name: "Hủ tiếu xóm chiếu", dish: "Hủ tiếu", type: "Món nước", addr: "Số 9 Tôn Đản, P. 13", dist: "Quận 4", time: "Chiều - tối", price: "Vừa phải" },
  { name: "Bún Bò Sông Hương", dish: "Bún Bò", type: "Món nước", addr: "123 Trần Quốc Thảo", dist: "Quận 3", time: "6-10h", price: "60k" },
  { name: "Lẩu nướng bò ba lão", dish: "Lẩu nướng", type: "Lẩu", addr: "993 Hoàng Sa", dist: "Quận Bình Thạnh", time: "16-22h", price: "20k - 200k" },
  { name: "Hủ tiếu Dê GIA ĐẠT", dish: "Hủ tiếu", type: "Món nước", addr: "111 Thái Phiên, P.2", dist: "Quận 11", time: "6h - 10h30", price: "40k - 120k" },
  { name: "Tré trộn đặc biệt", dish: "Tré trộn", type: "Ăn vặt", addr: "Góc đường Nguyễn Thị Minh Khai - Trương Định", dist: "Quận 3", time: "17h", price: "80k" },
  { name: "Bún Mộc A Chảy", dish: "Bún mộc", type: "Món nước", addr: "2028 Phạm Thế Hiển", dist: "Quận 8", time: "23-8h", price: "50-60k" },
  { name: "Cá Viên Lữ Gia", dish: "Cá", type: "Món khô", addr: "20i Lạc Long Quân", dist: "Quận 11", time: "Vừa phải", price: "Vừa phải" },
  { name: "Bơ bán bò Xemisxis", dish: "Bò nướng", type: "Sang choảnh", addr: "31E Lý Tự Trọng", dist: "Quận 1", time: "17g00-22g00", price: "450k 2 người" },
  { name: "SUPER BÒ", dish: "Bò nướng", type: "Nhậu nhẹt", addr: "254 Hoàng Diệu 2, Linh Chiểu", dist: "Thủ Đức", time: "17:00-22:00", price: "Vừa phải" },
  { name: "Bánh Mì 179", dish: "Bánh mì", type: "Bánh mì", addr: "179 Xóm Chiếu", dist: "Quận 4", time: "16-21H", price: "20-25k" },
  { name: "Bún bò Food By K", dish: "Bún bò, lẩu sườn", type: "Món nước", addr: "17A Nguyễn Thị Minh Khai", dist: "Quận 1", time: "07:00 - 21:00", price: "65-80k" },
  { name: "Bánh mì sườn sụn", dish: "Bánh mì", type: "Bánh mì", addr: "118B Nguyễn Thần Hiến", dist: "Quận 4", time: "15h-22h", price: "10k - 30k" },
  { name: "Bún Riêu Hà Nội", dish: "Bún Riêu", type: "Món nước", addr: "110 Cao Thắng", dist: "Quận 3", time: "08:00 - 21:30", price: "15k - 80k" },
  { name: "Cơm Bình Nga", dish: "Cơm", type: "Cơm", addr: "349 Nguyễn Công Trứ", dist: "Quận 1", time: "16:00 - 23:59", price: "30k - 65k" },
  { name: "Phở Phan Bội Châu", dish: "Phở", type: "Món nước", addr: "17B Phan Bội Châu", dist: "Quận Bình Thạnh", time: "5h-24h", price: "60k" },
  { name: "Lẩu tôm hùm đại dương", dish: "Lẩu", type: "Lẩu", addr: "67 Lê Trung Nghĩa", dist: "Quận Tân Bình", time: "từ 5h chiều", price: "140k" },
  { name: "Chú béo BBQ", dish: "Nướng", type: "Sang choảnh", addr: "16 Đồng Nai, Phường 15", dist: "Quận 10", time: "từ 5h chiều", price: "139k" },
  { name: "Bánh mì gánh xíu mại", dish: "Bánh mì gánh", type: "Bánh mì", addr: "Ngã ba Vũ Huy Tấn + Vạn Kiếp", dist: "Quận Bình Thạnh", time: "14:00 - 17:30", price: "15k" },
  { name: "Bún bò O Thuỷ", dish: "Bún bò", type: "Món nước", addr: "220/5 Lê Văn Sỹ, P. 14", dist: "Quận 3", time: "06:30 - 20:00", price: "60-80k" },
  { name: "bún bò cô Cúc", dish: "Bún bò", type: "Món nước", addr: "Chợ Nguyễn Văn Trỗi", dist: "Quận 3", time: "14h - 18h", price: "50k" },
  { name: "Xuân Huỳnh Trái Cây", dish: "Trái cây", type: "Ăn vặt", addr: "244A Lê Quang Sung", dist: "Quận 6", time: "13:30 - 21:00", price: "35-40k" },
  { name: "Bún Cá Hạnh Béo", dish: "Bún cá chấm", type: "Món nước", addr: "88 Phan Xích Long, P. 3", dist: "Quận Bình Thạnh", time: "07:30 - 21:30", price: "50-60k" },
  { name: "Bánh Mì Thịt Nướng", dish: "Bánh mì thịt nướng", type: "Bánh mì", addr: "39 Đ. Nguyễn Trãi", dist: "Quận 1", time: "17:00 - 19:30", price: "28k" },
  { name: "Thanh Tâm - Bò Nhúng", dish: "Lẩu", type: "Lẩu", addr: "1346 CMT8", dist: "Thủ Dầu Một", time: "16H - 21H", price: "200k" },
  { name: "Lẩu Bò Nhúng Ông Lập", dish: "Bò nhúng mắm ruốc", type: "Lẩu", addr: "591 Cách Mạng Tháng 8, P. 15", dist: "Quận 10", time: "09:00 - 22:00", price: "300k" },
  { name: "Bún Thái Chợ Cao Đạt", dish: "Bún mắm", type: "Món nước", addr: "197 Cao Đạt, Phường 01", dist: "Quận 5", time: "8H-15H", price: "Vừa phải" },
  { name: "Bún Mắm Bạch Tuộc", dish: "Bún mắm", type: "Món nước", addr: "198/18 Dương Bá Trạc, Phường 2", dist: "Quận 8", time: "6h sáng đến hết", price: "Vừa phải" },
  { name: "Bún Thái Cá Hồi", dish: "Bún thái", type: "Món nước", addr: "032 Lô E Cc Nguyễn Thiện Thuật", dist: "Quận 3", time: "8h - 17h", price: "55-65k" },
  { name: "Bánh Mì Chảo ĐTC", dish: "Bánh mì chảo", type: "Bánh mì", addr: "8 Đặng Trần Côn", dist: "Quận 1", time: "4:00-11:00", price: "48k" },
  { name: "Bún thịt nướng sáng", dish: "Bún thịt nướng", type: "Món khô", addr: "205 Lạc Long Quân,P3", dist: "Quận 11", time: "5h30_9h30", price: "15k-25K" },
  { name: "Bún thịt nướng sốt đậu", dish: "Bún thịt nướng", type: "Món khô", addr: "64 Hồng Hà", dist: "Quận Tân Bình", time: "8:30 - 21:30", price: "40-45" },
  { name: "Tré trộn Kiều Quách", dish: "Tré trộn", type: "Nhậu nhẹt", addr: "27 đường 302 Bông Sao, Phường 5", dist: "Quận 8", time: "16h-20h", price: "Vừa phải" },
  { name: "Bò La Lốt Hoa Trang", dish: "Bò là lốt", type: "Món khô", addr: "100b Thích Quảng Đức, Phường 5", dist: "Quận Phú Nhuận", time: "15h-21h", price: "Vừa phải" },
  { name: "Ăn + trà sữa Vĩnh Viễn", dish: "Ăn vặt", type: "Ăn vặt", addr: "152/15 Vĩnh Viễn, P.9", dist: "Quận 10", time: "15h-22h", price: "Bình dân" },
  { name: "Bánh flan Bờ kè", dish: "Bánh flan, rau câu", type: "Tráng miệng", addr: "893 Hoàng Sa", dist: "Quận 3", time: "15:30 - 22:00", price: "10k" },
  { name: "Lẩu Xí Quách Q8", dish: "Lẩu xí quách", type: "Lẩu", addr: "Hẻm 90 Nguyễn Thị Tần, P. 2", dist: "Quận 8", time: "04:00 - 08:00 | 16:00 - 20:00", price: "120-170k, hủ tiếu 40-50k" },
  { name: "Bún Thái Hongkong", dish: "Bún thái", type: "Món nước", addr: "456 Sư Vạn Hạnh, P. 9", dist: "Quận 10", time: "07:30 - 13:30 | 16:00 - 21:30", price: "50k-70k" },
  { name: "Cơm tấm Nạc giòn", dish: "Cơm tấm", type: "Cơm", addr: "33/16 Nguyễn Đình Chính", dist: "Quận Phú Nhuận", time: "05:30 - 11:00", price: "45-60k" },
  { name: "Hột vịt lộn Hoàng Vân", dish: "Hột vịt lộn", type: "Ăn vặt", addr: "2B Bàn cờ", dist: "Quận 3", time: "15h - 22h", price: "Bình dân" },
  { name: "Thằng Đậu - Bún Bò", dish: "Lẩu bò", type: "Lẩu", addr: "566 Sư Vạn Hạnh, P. 10", dist: "Quận 10", time: "06:00 - 23:00", price: "250-300k" },
  { name: "Cà phê Nghèo", dish: "Cà phê quán cốc", type: "Quán nước", addr: "441/7 Nguyễn Đình Chiểu, P. 5", dist: "Quận 3", time: "15h-12h khuya", price: "25-30k" },
  { name: "Bò Cô Ri - Thành Thái", dish: "Bò nướng", type: "Sang choảnh", addr: "5 Thành Thái", dist: "Quận 10", time: "07:00 - 23:00", price: "200-300k" },
  { name: "Bún cá Chấm giòn", dish: "Bún cá chấm", type: "Món nước", addr: "5 Thành Thái, P. 14", dist: "Quận 10", time: "07:00 - 23:00", price: "55-60k" },
  { name: "Phở bò viên Đào", dish: "Phở", type: "Món nước", addr: "C13 Tôn Đản", dist: "Quận 4", time: "17h-2h", price: "Vừa phải" },
  { name: "Bánh canh cua ngon Q1", dish: "Bánh canh cua", type: "Món nước", addr: "87 Trần Khắc Chân", dist: "Quận 1", time: "11h-22h", price: "Vừa phải" },
  { name: "Bánh mì Bì xíu mại Q7", dish: "Bánh mì", type: "Bánh mì", addr: "Ngã tư đường số 10 và 17, Tân kiểng", dist: "Quận 7", time: "6h30-10h", price: "22k" },
  { name: "Bánh mì Chị Trang", dish: "Bánh mì", type: "Bánh mì", addr: "82 Tân Khai", dist: "Quận 11", time: "6h-11h", price: "15k-25k" },
  { name: "Bún đậu Bếp Xưa", dish: "Lẩu riêu cua", type: "Món khô", addr: "79 Lê Văn Duyệt", dist: "Quận Bình Thạnh", time: "7h-23h", price: "150-200k" },
  { name: "Vua Đậu", dish: "Bún đậu", type: "Món khô", addr: "Nhiều chi nhánh", dist: "Quận 10", time: "10:00 - 21:51", price: "50-60k" },
  { name: "Thịt xiên nướng - Cơm Lam", dish: "Thịt xiên nướng", type: "Món khô", addr: "48 Đồng Đen, P.12", dist: "Quận Tân Bình", time: "16h-22h", price: "12k-20k" },
  { name: "Osaka Ramen", dish: "Mì Ramen", type: "Món nước", addr: "64 Nguyễn Thời Trung", dist: "Quận 5", time: "11:00 - 22:00", price: "50-60" },
  { name: "Bún thịt nướng Hằng", dish: "Bún thịt nướng", type: "Món khô", addr: "338 Đ. Nguyễn Công Trứ", dist: "Quận 1", time: "12h-18h", price: "40k" },
  { name: "Young Dabang", dish: "Đồ hàn", type: "Sang choảnh", addr: "19M KDC Miếu Nổi đường Vũ Huy Tấn", dist: "Quận Bình Thạnh", time: "11h - 22h", price: "300k" },
  { name: "Bánh canh Bò viên", dish: "Bánh canh", type: "Món nước", addr: "29 Đ. Nguyễn Văn Nguyễn", dist: "Quận 1", time: "11h-19h", price: "30-40k" },
  { name: "Ốc Ti", dish: "Ốc", type: "Nhậu nhẹt", addr: "18 Lô D Chung cư Nguyễn Thiện Thuận", dist: "Quận 3", time: "15:30 - 23:59", price: "Bình dân" },
  { name: "Bít tết 015", dish: "Bò beefsteak", type: "Món khô", addr: "015F Chung cư Ấn Quang", dist: "Quận 10", time: "08:00 - 21:00", price: "Sinh viên" },
  { name: "Bún bò huế O Xíu", dish: "Bún bò", type: "Món nước", addr: "102 Trần Quang Khải", dist: "Quận 1", time: "15H00 - 03H00", price: "40K - 60K/Phần" },
  { name: "Tré trộn Út Vân", dish: "Tré trộn", type: "Nhậu nhẹt", addr: "152 Nguyễn Thượng Hiền, P. 4", dist: "Quận 3", time: "10:00 - 17:00", price: "50k" },
  { name: "Tré trộn Cô Bé", dish: "Tré trộn", type: "Nhậu nhẹt", addr: "306 Nguyễn Thượng Hiền, P. 4", dist: "Quận 3", time: "08:00 - 21:00", price: "50k" },
  { name: "Xôi Mặn Bắc Chuẩn Vị", dish: "Xôi mặn", type: "Bánh mì", addr: "180 Ký Con, P. Nguyễn Thái Bình", dist: "Quận 1", time: "06:30 - 21:00", price: "40-60k" },
  { name: "Bánh bèo Huế Bến Thành", dish: "Bánh bèo", type: "Ăn vặt", addr: "Cửa 7 Chợ Bến Thành", dist: "Quận 1", time: "7h-17h", price: "23k" },
  { name: "Hủ tiếu gà Gò Công", dish: "Hủ tiếu", type: "Món nước", addr: "1B Đường số 10, Tân Quy", dist: "Quận 7", time: "6h-22h", price: "40-60k" },
  { name: "Bánh mì Bì Nem Xe Đạp", dish: "Bánh mì", type: "Bánh mì", addr: "Phan Châu Trinh -> Cô Giang", dist: "Quận 1", time: "14h", price: "15k" },
  { name: "Cơm Tấm Đề Thám", dish: "Cơm tấm", type: "Cơm", addr: "272 Đề Thám, P. Phạm Ngũ Lão", dist: "Quận 1", time: "9h - 1h ság", price: "50k" },
  { name: "Bún Riêu Cô Út", dish: "Bún riêu", type: "Món nước", addr: "219 Nguyễn Trãi, Nguyễn Cư Trình", dist: "Quận 1", time: "11h-22h", price: "30k" },
  { name: "Bánh mì Xíu mại ngon", dish: "Bánh mì", type: "Bánh mì", addr: "1A Hồ Văn Huê", dist: "Quận Phú Nhuận", time: "Sáng", price: "30-100k" },
  { name: "Bún thịt nướng sốt đậu", dish: "Bún thịt nướng", type: "Món khô", addr: "314 Nguyễn Thái Sơn", dist: "Quận Gò Vấp", time: "15:00 - 22:00", price: "30-40k" },
  { name: "Bún Đậu Nhà Vua", dish: "Bún đậu", type: "Món khô", addr: "63 Bình Thới, P. 11", dist: "Quận 11", time: "10:00 - 22:20", price: "50-60k" },
  { name: "Bún cá Kiên Giang", dish: "Bún cá", type: "Món nước", addr: "251/5 Nguyễn Thiện Thuật", dist: "Quận 3", time: "6h-18h", price: "35k" },
  { name: "Phở bê Thanh Đa", dish: "Phở", type: "Món nước", addr: "21-23 Hoàng Sa, Đa Kao", dist: "Quận 1", time: "6h-13h", price: "70k" },
  { name: "Miến măng vịt", dish: "Miến vịt", type: "Món nước", addr: "181 Bùi Thị Xuân", dist: "Quận Tân Bình", time: "11h-21h", price: "50k" },
  { name: "Bún mọc Hiếu Hiền", dish: "Bún mọc", type: "Món nước", addr: "23/2 Hoàng Sa, Đa Kao", dist: "Quận 1", time: "6h-13h", price: "45k" },
  { name: "Mì bò hầm Đài Loan", dish: "Mì bò hầm", type: "Món nước", addr: "Hẻm 80 Lê Hồng Phong", dist: "Quận 5", time: "09:30 - 21:00", price: "60-70k" },
  { name: "Bánh canh Cá Lóc 25k", dish: "Bánh canh", type: "Món nước", addr: "340 Nguyễn Sơn", dist: "Quận Tân Phú", time: "6h-23h", price: "25k" },
  { name: "Bánh canh Cá Lóc O Hiền", dish: "Bánh canh", type: "Món nước", addr: "12/20 Phạm Văn Hai", dist: "Quận Tân Bình", time: "12h-19h", price: "30k" },
  { name: "Hoành thành lá tôm khô", dish: "Hoành thánh", type: "Món nước", addr: "Hẻm 66 Lãnh Binh Thăng, Phường 13", dist: "Quận 11", time: "14h30", price: "Vừa phải" },
  { name: "Vua Mì", dish: "Mì bò Đài Loạn", type: "Món nước", addr: "76 Đường D5", dist: "Quận Bình Thạnh", time: "11:00 - 23:59", price: "6-70k" },
  { name: "Dimsum - Trà sữa", dish: "Dimsum - Trà sữa", type: "Món khô", addr: "89A Nguyễn Đình Chiểu", dist: "Quận 3", time: "08:00 - 22:00", price: "50-60k" },
  { name: "Baito Ramen", dish: "Mì Ramen", type: "Món nước", addr: "C24/7 Xóm Chiếu", dist: "Quận 4", time: "16h30-21h30", price: "45-60k" },
  { name: "Hủ tiếu Mì Thập Cẩm", dish: "Hủ tiếu", type: "Món nước", addr: "160 Phạm Phú Thứ, P.4", dist: "Quận 6", time: "6h-21h", price: "43-53k" },
  { name: "Bánh canh cua Ba Lúa", dish: "Bánh canh cua", type: "Món nước", addr: "206 Tôn Đản", dist: "Quận 4", time: "07:00 - 22:00", price: "50k" },
  { name: "Cơm tấm Mai cua", dish: "Cơm tấm", type: "Cơm", addr: "185 Trần Bình Trọng, P.3", dist: "Quận 6", time: "18h-23h30", price: "35k-50k" },
  { name: "Cuốn thịt heo Hoàng Bèo", dish: "Bánh tráng cuốn", type: "Món cuốn", addr: "216 Nguyễn Oanh, Phường 17", dist: "Quận Gò Vấp", time: "07:00 - 23:00", price: "60k-70k" },
  { name: "Bún đầu Tiến Vua 86k", dish: "Bún đậu", type: "Món khô", addr: "29 Thành Thái, P. 14", dist: "Quận 10", time: "10:00 - 21:51", price: "86k" },
  { name: "Lẩu Cá & Nướng A Mín", dish: "Lẩu cá", type: "Lẩu", addr: "333 Vĩnh Khánh, P. 8", dist: "Quận 4", time: "16:00 - 23:59", price: "150k" },
  { name: "Kem Chiên", dish: "Kem Chiên", type: "Tráng miệng", addr: "177 Hải Thượng Lãn Ông", dist: "Quận 5", time: "18h-22h", price: "Vừa phải" },
  { name: "Cơm Gà Xối Mỡ Su Su", dish: "Cơm gà xối mỡ", type: "Cơm", addr: "117/1D Cống Quỳnh", dist: "Quận 1", time: "11:00 - 21:00", price: "50k" },
  { name: "Cơm tấm dễ thương 25k", dish: "Cơm tấm", type: "Cơm", addr: "641 Đoàn Văn Bơ, Phường 18", dist: "Quận 4", time: "5h-9h", price: "từ 25k" },
  { name: "Flan, Chè Hoài Thương", dish: "Ăn vặt", type: "Ăn vặt", addr: "10 Cô Giang", dist: "Quận Phú Nhuận", time: "10:00 - 20:00", price: "từ 20k" },
  { name: "Lẩu bò kho Xương ống", dish: "Lẩu bò", type: "Lẩu", addr: "207/6 Trần Bình Trọng", dist: "Quận 5", time: "16h30-22h", price: "160k" },
  { name: "Xôi mặn Heo Quay", dish: "Xôi mặn", type: "Bánh mì", addr: "509 CMT8", dist: "Quận 10", time: "16h-23h", price: "25-35k" },
  { name: "Tất Ký Mì Gia", dish: "Mì thập cẩm", type: "Món nước", addr: "499/4A CMT8", dist: "Quận 10", time: "16h-23h", price: "Vừa phải" },
  { name: "Bánh tráng trộn mỡ hành", dish: "Bánh tráng trộn", type: "Ăn vặt", addr: "1005/71 Nguyễn Kiệm, P3", dist: "Quận Gò Vấp", time: "14h-22h", price: "Vừa phải" },
  { name: "Phá Lấu Giò Heo Kha Thi", dish: "Phá lấu", type: "Món khô", addr: "211 Phạm Văn Chiêu", dist: "Quận Gò Vấp", time: "9h-20h", price: "Vừa phải" },
  { name: "Cơm tấm Xí Muội", dish: "Cơm tấm", type: "Cơm", addr: "1090 Lạc Long Quân, P.8", dist: "Quận Tân Bình", time: "7h - 19h", price: "35-50k" },
  { name: "Lẩu bò Campuchia", dish: "Lẩu bò", type: "Lẩu", addr: "128 Vườn Chuối, p.4", dist: "Quận 3", time: "16h-22h", price: "170k" },
  { name: "Nướng Lẩu Zaka 79", dish: "Nướng lẩu", type: "Lẩu", addr: "16 Trường Chính, P.4", dist: "Quận Tân Bình", time: "15h-23h", price: "79k-150k" },
  { name: "Bún Riêu Cua 30 Năm", dish: "Bún riêu", type: "Món nước", addr: "384/22 Nam Kỳ Khởi Nghĩa", dist: "Quận 3", time: "9h tới 13h", price: "30k" },
  { name: "Gòn BÚN CHẢ bà Khách", dish: "Bún chả", type: "Món nước", addr: "3 Hậu Giang", dist: "Quận Tân Bình", time: "8h-22h", price: "45k" },
  { name: "Bánh mì Tăng", dish: "Bánh mì", type: "Bánh mì", addr: "822 Nguyễn Trãi", dist: "Quận 5", time: "5h30-23h30", price: "20k" },
  { name: "Aroy Thái", dish: "Mì - Hủ tiếu thái", type: "Món nước", addr: "60/1 Lý Chính Thắng", dist: "Quận 3", time: "7h-21h", price: "45-65k" },
  { name: "Cơm Tấm Ba Há", dish: "Cơm tấm", type: "Cơm", addr: "389 Hưng Phú, P. 9", dist: "Quận 8", time: "16-19h30", price: "8-90k" },
  { name: "Bánh Mì Xíu Mại Phô Mai", dish: "Bánh mì", type: "Bánh mì", addr: "356 Bùi Hữu Nghĩa, P. 14", dist: "Quận Bình Thạnh", time: "06H00 - 21H00", price: "20-25k" },
  { name: "Bánh Canh Cua Oanh", dish: "Bánh canh", type: "Món nước", addr: "80 Văn Cao, P. Phú Thọ Hòa", dist: "Quận Tân Phú", time: "09:00 - 22:00", price: "45-55k" },
  { name: "Bún thịt nướng Bà Năm", dish: "Bún thịt nướng", type: "Món khô", addr: "108/20B Trần Quang Diệu", dist: "Quận 3", time: "06:00 - 12:00", price: "35k" },
  { name: "Mì Khô Xá Xíu Gia Phúc", dish: "Hủ tiếu mì", type: "Món nước", addr: "198B Xóm Chiếu, P. 14", dist: "Quận 4", time: "16:00 - 22:30", price: "35k" },
  { name: "Bach Hoa Lẩu", dish: "Lẩu", type: "Sang choảnh", addr: "Quận 3", dist: "Quận 3", time: "Vừa phải", price: "Vừa phải" },
  { name: "Bún bò viên Tân Phát", dish: "Hủ tiếu mì", type: "Món nước", addr: "404 Trần Phú, P.7", dist: "Quận 5", time: "09:00 - 21:00", price: "40-55k" },
  { name: "Chill Thái", dish: "Buffet lẩu", type: "Sang choảnh", addr: "Nhiều chi nhánh", dist: "Quận 1", time: "Vừa phải", price: "159-239k" },
  { name: "Sủi cảo Liên Xô", dish: "Hủ tiếu mì", type: "Món nước", addr: "104 Mạc Vân, p.12", dist: "Quận 8", time: "11h đến hết", price: "30-45k" },
  { name: "Hủ Tiếu Cá Tài Ký", dish: "Hủ tiếu cá", type: "Món nước", addr: "185A Tân Sơn Nhì", dist: "Quận Tân Phú", time: "06:00 - 12:00", price: "40-55k" },
  { name: "Miì trộn khô Hồng kong", dish: "Mì trộn khô", type: "Món khô", addr: "684/24 Trần Hưng Đạo", dist: "Quận 5", time: "Vừa phải", price: "từ 55k" },
  { name: "Lẩu mắm Út Nhàn", dish: "Lẩu", type: "Lẩu", addr: "409 Phạm Văn Đồng", dist: "Quận Bình Thạnh", time: "15:00 - 22:00", price: "295k" },
  { name: "Quán Ù Pa", dish: "Ăn vặt", type: "Ăn vặt", addr: "9A Nguyễn Án, P. 11", dist: "Quận 5", time: "14:00 - 22:00", price: "5k-19k" },
  { name: "Bún bò Cô Hạnh", dish: "Bún bò", type: "Món nước", addr: "190-192 Hà Tôn Quyền", dist: "Quận 11", time: "06:30 - 11:00", price: "25k-30k" },
  { name: "Ramen Tomidaya", dish: "Mì ramen", type: "Món nước", addr: "68 Phạm Viết Chánh", dist: "Quận Bình Thạnh", time: "11:30-14h", price: "50k-220k" },
  { name: "Hủ Tiếu Gà - Vĩnh Nam", dish: "Hủ tiếu", type: "Món nước", addr: "43 Vĩnh Nam, P. 11", dist: "Quận 8", time: "13:00 - 21:00", price: "5k-40k" },
  { name: "Ốc Táo", dish: "Ốc", type: "Nhậu nhẹt", addr: "80 Đường Số 28, P. Tân Phong", dist: "Quận 7", time: "16:00-23:59", price: "50k-200k" },
  { name: "Sủi cảo Huy Ngân", dish: "Sủi cảo", type: "Món nước", addr: "538 Lý Thái Tổ, P. 10", dist: "Quận 10", time: "10:00 - 22:00", price: "35k-50k" },
  { name: "Trà sữa A Chà", dish: "Trà sữa", type: "Ăn vặt", addr: "140 Châu Văn Liêm", dist: "Quận 5", time: "10:00 - 22:00", price: "15k-30k" },
  { name: "Bò né 2 Péo", dish: "Cơm tấm", type: "Cơm", addr: "69/2/44 Nguyễn Gia Trí", dist: "Quận Bình Thạnh", time: "10:00 - 14:00", price: "10k-55k" },
  { name: "Chè Thạch Xanh", dish: "Chè", type: "Ăn vặt", addr: "91 Lý Thường Kiệt, P.7", dist: "Quận 10", time: "18:00 - 21:00", price: "14k" },
  { name: "Hồng trà dì Anh", dish: "Hồng Trà", type: "Ăn vặt", addr: "70 Đường số 5 - Cư xá Bình Thới", dist: "Quận 11", time: "15h - 23h30", price: "16k-25k" },
  { name: "Tiềm Ngã Ba Đường", dish: "Ăn vặt", type: "Ăn vặt", addr: "Y12 Hồng Lĩnh, P. 15", dist: "Quận 10", time: "13:00 - 22:00", price: "30k" },
  { name: "Gà nướng cô gái Ấn", dish: "Gà nướng", type: "Nhậu nhẹt", addr: "45A Ung Văn Khiêm", dist: "Quận Bình Thạnh", time: "15:30 - 23:59", price: "5k-130k" },
  { name: "Khanh - Bánh Khọt", dish: "Bánh khọt", type: "Món khô", addr: "7 Đồng Nai, P. 15", dist: "Quận 10", time: "10:00 - 21:00", price: "15k-50k" },
  { name: "Cơm Cu Hải", dish: "Cơm bò", type: "Cơm", addr: "189B/A30 Cống Quỳnh", dist: "Quận 1", time: "16:30-23:59", price: "70k-90k" },
  { name: "Tiệm mì Chọn Tui", dish: "Mì", type: "Món nước", addr: "292 Tô Hiến Thành", dist: "Quận 10", time: "07:30 - 21:15", price: "15k-45k" },
  { name: "Bánh mì Bùi Thị Xuân", dish: "Bánh mì", type: "Món khô", addr: "122E Bùi Thị Xuân", dist: "Quận 1", time: "05:30 - 01:00", price: "20k-30k" },
  { name: "Shabu Ya - Vạn Hạnh Mall", dish: "Lẩu Nhật", type: "Lẩu", addr: "Tầng 6 Vạn Hạnh Mall", dist: "Quận 10", time: "10:00 - 21:30", price: "138k-238k" },
  { name: "Má heo Ngọc Yến", dish: "Má heo", type: "Nhậu nhẹt", addr: "51 đường số 10, Linh Trung", dist: "Thủ Đức", time: "8:00 - 00:00", price: "60k-120k" },
  { name: "Bánh Canh Trảng Bàng", dish: "Bánh canh", type: "Món nước", addr: "439-441 Nguyễn Tri Phương", dist: "Quận 10", time: "10:00 - 22:00", price: "30-60k" },
  { name: "Bún bò cô Đào", dish: "Bún bò", type: "Món nước", addr: "22A Điện Biên Phủ", dist: "Quận Bình Thạnh", time: "06:00-10:30", price: "43k" },
  { name: "Đồi Thái", dish: "Lẩu thái", type: "Lẩu", addr: "36 Chu Mạnh Trinh", dist: "Quận 1", time: "9:00 - 22:00", price: "149k" },
  { name: "Bánh Tráng Trộn Nhà Thờ", dish: "Bánh tráng trộn", type: "Ăn vặt", addr: "25 Học Lạc, Phường 14", dist: "Quận 5", time: "21:30 - 2:00", price: "18-36k" },
  { name: "Chú Mập Thanh Đa", dish: "Trà sữa", type: "Ăn vặt", addr: "183 Bình Quới", dist: "Quận Bình Thạnh", time: "11:00 - 19:00", price: "15-25k" },
  { name: "Trà Chanh Con Cá", dish: "Trà chanh", type: "Quán nước", addr: "321 Tôn Đản, P. 15", dist: "Quận 4", time: "09:30 - 21:30", price: "5-33k" },
  { name: "Cô Hằng Thịt Nướng", dish: "Bún thịt nướng", type: "Món khô", addr: "Hẻm 710/2 Phan Văn Trị", dist: "Quận Gò Vấp", time: "07:00 - 21:00", price: "37-80k" },
  { name: "Tân Hương Nam Quán", dish: "Mì sụn Bạc Liêu", type: "Món nước", addr: "382 Bà Hạt, P.8", dist: "Quận 10", time: "08:00 - 22:00", price: "25-80k" },
  { name: "Mạ Tôi - Bánh Canh Cua", dish: "Bánh canh cua", type: "Món nước", addr: "86 Vạn Kiếp, P. 4", dist: "Quận Bình Thạnh", time: "15:00 - 21:00", price: "22-40k" },
  { name: "STEAK FRITES SAIGON", dish: "Steak và spaghetti", type: "Sang choảnh", addr: "7/96 Thành Thái, P. 14", dist: "Quận 10", time: "10-14h | 18-21h", price: "150k" },
  { name: "Ốc Bông", dish: "Ốc", type: "Ăn vặt", addr: "260 Nguyễn Tiểu La, P.8", dist: "Quận 10", time: "16:00-23:00", price: "60-100k" },
  { name: "Cơm Chiên Bé Tám", dish: "Cơm chiên", type: "Cơm", addr: "246 Nguyễn Công Trứ", dist: "Quận 1", time: "18:30-23:59", price: "30-55k" },
  { name: "Món Huế", dish: "Bún bò Huế", type: "Món nước", addr: "26A Hoàng Hoa Thám", dist: "Quận Tân Bình", time: "16:00 - 21:00", price: "30-50k" },
  { name: "Thanh Tâm Ký", dish: "Bò Kho & Hủ Tiếu Mì", type: "Món nước", addr: "51 Trần Hữu Trang", dist: "Quận Phú Nhuận", time: "05:30 - 13:30", price: "20-30k" },
  { name: "Cô Tám Bánh Mì", dish: "Bánh Mì Nướng", type: "Bánh mì", addr: "56T Lê Quang Sung", dist: "Quận 6", time: "09:00 - 22:00", price: "15-20k" },
  { name: "An An", dish: "bánh mì chảo", type: "Bánh mì", addr: "282/1 Nguyễn Gia Trí", dist: "Quận Bình Thạnh", time: "06:00 - 22;00", price: "27-69k" },
  { name: "Quán Sương", dish: "Bánh canh", type: "Món nước", addr: "1181 Lê Văn Lương", dist: "Huyện Nhà Bè", time: "07:00 - 21:00", price: "20-25k" },
  { name: "Mì Gà Xá Kén K3", dish: "Mì gà", type: "Món nước", addr: "82 Đường Đồng Đen", dist: "Quận Tân Bình", time: "16:30 - 21:00", price: "50-99k" },
  { name: "Lẩu Xưa 139k", dish: "Lẩu", type: "Lẩu", addr: "292/1 Nguyễn Xí", dist: "Quận Bình Thạnh", time: "Vừa phải", price: "139-219k" },
  { name: "Quán Hào 598", dish: "Ốp La Bò Sốt Tiêu Đen", type: "Món khô", addr: "004 Lô F Chung Cư Xóm Cải", dist: "Quận 5", time: "09:00 - 22:00", price: "40k" },
  { name: "Bánh Ướt & Bánh Cuốn", dish: "Bánh ướt/cuốn", type: "Món nước", addr: "752/53 Lạc Long Quân", dist: "Quận Tân Bình", time: "15:00 - 20:00", price: "30-40k" },
  { name: "Quán cháo", dish: "Cháo đủ loại", type: "Món nước", addr: "108 Trần Văn Quang", dist: "Quận Tân Bình", time: "16:00 - 21:00", price: "20-30k" },
  { name: "Hủ tiếu Dì Hai", dish: "Hủ tiếu, bánh canh", type: "Món nước", addr: "266/98 Tôn Đản", dist: "Quận 4", time: "11:00 - 19:00", price: "25-50k" },
  { name: "Xe bánh mì, xôi", dish: "Xôi lá chuối tôm khô", type: "Món khô", addr: "271 Tùng Thiện Vương", dist: "Quận 8", time: "05:00 - 10:00", price: "17-20k" },
  { name: "Cơm Tấm Bà Chị Hai", dish: "Câm tấm", type: "Cơm", addr: "51 Đặng Văn Ngữ", dist: "Quận Phú Nhuận", time: "18:00 - 22:00", price: "40-70k" },
  { name: "Heo quay Kim Mai", dish: "heo quay", type: "Món khô", addr: "15 Lô B, chợ Bình Tiên", dist: "Quận 6", time: "06:30–11:00", price: "170-320k" },
  { name: "Bánh canh hẹ Phú Yên", dish: "Bánh canh", type: "Món nước", addr: "18A/4 Nguyễn Thị Minh Khai", dist: "Quận 1", time: "16g30 - 21g30", price: "40k trở lên" },
  { name: "Bánh Đúc Nóng NGUYÊN", dish: "Bánh đúc", type: "Món khô", addr: "188 Vạn Kiếp", dist: "Quận Bình Thạnh", time: "11:00 - 18:00", price: "30-45k" },
  { name: "Bánh Mì Dậu", dish: "Bánh mì", type: "Bánh mì", addr: "538/161 Đoàn Văn Bơ", dist: "Quận 4", time: "16:00 - 22:00", price: "5-20k" },
  { name: "Bánh căn Cô Hằng", dish: "Bánh căn tôm mực", type: "Món khô", addr: "100 Trần Hưng Đạo", dist: "Quận 1", time: "16:00 – 9:00", price: "6-25k" },
  { name: "Ốc Trứng Muối - Đường B6", dish: "Ôc", type: "Ăn vặt", addr: "11 Đường B6, P. 12", dist: "Quận Tân Bình", time: "15:00 - 23:00", price: "20-500k" },
  { name: "Kim Ký", dish: "Hủ Tiếu Mì", type: "Món nước", addr: "255 Nguyễn Công Trứ", dist: "Quận 1", time: "18:00 - 22:00", price: "34-45k" },
  { name: "Gánh bánh mì đêm", dish: "Bánh mì", type: "Bánh mì", addr: "65F Nguyễn Thái Học", dist: "Quận 1", time: "19:00 - 05:00", price: "15k" },
  { name: "Tiệm Bún Đậu CÁM", dish: "Bún đậu", type: "Món khô", addr: "206 Nguyễn Tri Phương", dist: "Quận 10", time: "10:00 - 22:00", price: "20-100k" },
  { name: "Bún Bò Phú Hưng", dish: "Bún bò", type: "Món nước", addr: "284/2 Chợ Lớn, P. 11", dist: "Quận 6", time: "06:00 - 12:00", price: "25-35k" },
  { name: "Đông Mập", dish: "Trà Sữa & Gà Cay", type: "Ăn vặt", addr: "164/5 Nguyễn Oanh", dist: "Quận Gò Vấp", time: "17:00 - 22:00", price: "15-50k" },
  { name: "Hủ tiếu heo gà", dish: "hủ tiếu", type: "Món nước", addr: "160 Trần Bình Trọng", dist: "Quận 5", time: "18:30 - 04:00", price: "35-100k" },
  { name: "Nước Vỉa Hè 347", dish: "Trà đào dầm", type: "Quán nước", addr: "347 Nguyễn Chí Thanh", dist: "Quận 5", time: "19:00 - 23:00", price: "7-15k" },
  { name: "Bánh Canh Chả Cá Go79", dish: "Bánh canh", type: "Món nước", addr: "264 Trường Sa, P. 3", dist: "Quận Bình Thạnh", time: "16:00 - 23:00", price: "19-69k" },
  { name: "TRUYỀN THUYẾT CHAMPONG", dish: "Mì cay", type: "Món nước", addr: "62 Nguyễn Hoàng, P. An Phú", dist: "Quận 2", time: "11:00 - 22:00", price: "120-220k" },
  { name: "Xe cá viên chiên", dish: "cá viên chiên", type: "Ăn vặt", addr: "Công trưởng UEH", dist: "Quận 3", time: "", price: "5k" },
  { name: "Bánh Mì Chảo Cô Lệ", dish: "Bánh mì chảo", type: "Món khô", addr: "003 Lô D Chung Cư Nguyễn Thiện Thuật", dist: "Quận 3", time: "07:00 - 14:00", price: "20-35k" },
  { name: "Vạn quán", dish: "Lẩu gà lá é", type: "Lẩu", addr: "123/17 Nguyễn Xí", dist: "Quận Bình Thạnh", time: "09:00 - 23:59", price: "120-399k" },
  { name: "Hoành thánh lá Ngũ Trảo", dish: "Hoành thánh lá tôm", type: "Món nước", addr: "Hẻm 66 Lãnh Binh Thăng", dist: "Quận 11", time: "15:00 - 22:00", price: "35k" },
  { name: "Bánh Canh Chả Cá Phan Rang", dish: "Bánh canh chả cá", type: "Món nước", addr: "135 Đình Phong Phú", dist: "Thủ Đức", time: "06:00 - 12:00", price: "20-30k" },
  { name: "ĂN vặt Q4", dish: "Bánh tráng trộn", type: "Ăn vặt", addr: "5 Đường Số 42, P. 4", dist: "Quận 4", time: "09:00 - 22:00", price: "20-40k" },
  { name: "Hàu đại dương", dish: "Hàu", type: "Nhậu nhẹt", addr: "179 Phạm Hùng, P.4", dist: "Quận 8", time: "16:00 tới hết", price: "30-50k" },
  { name: "Lẩu Bò Hẻm 616", dish: "Lẩu bò", type: "Lẩu", addr: "Hẻm 616 Cách Mạng Tháng 8", dist: "Quận 10", time: "18:00 - 22:00", price: "100-200k" },
  { name: "Hachiba ramen", dish: "Mì ramen", type: "Món nước", addr: "353 Sư Phạm Hạnh, P12", dist: "Quận 10", time: "10:00 - 21:30", price: "48-80k" },
  { name: "Nhi Nhi Quán", dish: "Bánh tráng, cá viên", type: "Ăn vặt", addr: "164 Đường 20, P. 5", dist: "Quận Gò Vấp", time: "15:00 - 22:30", price: "7-28k" },
  { name: "Thèm Gì Cũng Có", dish: "Bánh tráng tóp mỡ", type: "Ăn vặt", addr: "327 Phan Đình Phùng", dist: "Quận Phú Nhuận", time: "09:00 - 22:00", price: "5- 75k" },
  { name: "Hey Pelo", dish: "Bánh Tacos", type: "Món khô", addr: "Số 60 Trần Khắc Chân", dist: "Quận 1", time: "10:30 - 22:20", price: "30-110k" },
  { name: "Hải Sản Phan Thiết", dish: "Ốc", type: "Nhậu nhẹt", addr: "005 Lô D C/c Nguyễn Thiện Thuật", dist: "Quận 3", time: "14:00 - 23:00", price: "50-110k" },
  { name: "Bánh Mì Cô Điệp", dish: "Bánh mì", type: "Bánh mì", addr: "238 Võ Thành Trang", dist: "Quận Tân Bình", time: "06:00 - 00:00", price: "25k" },
  { name: "Bánh mì Ngã tư Tân Khai", dish: "Bánh mì", type: "Bánh mì", addr: "Ngã tư Tân Khai, Nguyễn bá học", dist: "Quận 11", time: "05:00 - 11:00", price: "10-20k" },
  { name: "Giò Heo Phá Lấu Kha Thi", dish: "Giò heo phá lấu", type: "Món khô", addr: "37 Đường Số 1, P. An Lạc", dist: "Quận Bình Tân", time: "09:00 - 21:00", price: "10-70k" },
  { name: "Hủ tiếu cá Pháp Mập", dish: "Hủ tiếu cá", type: "Món nước", addr: "108/1 Bis Calmette", dist: "Quận 1", time: "06:00 - 10:30", price: "25-45k" },
  { name: "Sunset & Chill Sky Bar", dish: "Cafe", type: "Quán nước", addr: "1143 Bình Quới", dist: "Quận Bình Thạnh", time: "07:00 - 00:00", price: "Vừa phải" },
  { name: "Buffe ốc Cô Giang", dish: "Ốc", type: "Nhậu nhẹt", addr: "59 Nguyễn Hữu Dật", dist: "Quận Tân Phú", time: "Vừa phải", price: "159k" },
  { name: "Chick And Cheese", dish: "Gà cay, gà rán", type: "Ăn vặt", addr: "963A1 Lò Gốm, P. 8", dist: "Quận 6", time: "10:30 - 21:30", price: "29-219k" },
  { name: "Bánh Cuốn Cô Loan", dish: "Bánh cuốn", type: "Món cuốn", addr: "357B Lê Đại Hành", dist: "Quận 11", time: "06:00 - 11:30", price: "35-50k" },
  { name: "Quán Nướng Má Hai", dish: "Lẩu, nướng", type: "Lẩu", addr: "200 Nguyễn Thượng Hiền", dist: "Quận 3", time: "10:00 - 22:00", price: "20-70k" },
  { name: "Doya Jjambbong", dish: "Món Hàn", type: "Sang choảnh", addr: "S63-1 Sky Garden 3", dist: "Quận 7", time: "11:00 - 22:00", price: "Vừa phải" },
  { name: "Quán Chà Bá", dish: "Mực viên, bò viên", type: "Ăn vặt", addr: "185Q Mai Xuân Thưởng", dist: "Quận 6", time: "13:00 - 22:00", price: "10-30k" },
  { name: "Bò Kho Cây Thoại Ngọc Hầu", dish: "Bò Kho", type: "Món nước", addr: "644 Âu Cơ, P.10", dist: "Quận Tân Bình", time: "09:00 - 22:00", price: "55k" },
  { name: "Lẩu 72 Nguyễn Trường Tộ", dish: "Lẩu", type: "Lẩu", addr: "72 Nguyễn Trường Tộ", dist: "Tp. Vũng Tàu", time: "09:00 - 21:00", price: "50-200k" },
  { name: "Hủ Tiếu Cô Bảy", dish: "Hủ tiếu", type: "Món nước", addr: "Hẻm 301 Lê Văn Sỹ, P. 13", dist: "Quận 3", time: "22:00 - 05:00", price: "40-50k" },
  { name: "Tibon By Jayden", dish: "Trà trái cây", type: "Quán nước", addr: "299 Hoàng Sa", dist: "Quận 1", time: "06:00 - 22:30", price: "15-45k" },
  { name: "Nhà Thơm", dish: "Trà trái cây", type: "Quán nước", addr: "42CT Tam Đảo, Cư Xá Bắc Hải", dist: "Quận 10", time: "08:00 - 22:00", price: "20-30k" },
  { name: "San San", dish: "Mì Gà Quay", type: "Món khô", addr: "147 Hoa Lan, P. 2", dist: "Quận Phú Nhuận", time: "09:30 - 22:00", price: "50k" },
  { name: "Bún Bò Cô Thu", dish: "Bún bò", type: "Món nước", addr: "463B Cách Mạng Tháng 8", dist: "Quận 10", time: "15:30 - 00:00", price: "30-40k" },
  { name: "Quán Út Phượng", dish: "Há cảo, phá lấu", type: "Món nước", addr: "12/15 Lương Định Của", dist: "Thủ Đức", time: "12:00 - 20:00", price: "20-35k" },
  { name: "Mì Vịt Tiềm Hữu Ký", dish: "Mì", type: "Món nước", addr: "84 Nguyễn Văn Lạc", dist: "Quận Bình Thạnh", time: "06:00 - 23:59", price: "50-100k" },
  { name: "Bánh Canh Cua Bùi Phát", dish: "bánh canh cua", type: "Món nước", addr: "453/95 Lê Văn Sỹ", dist: "Quận 3", time: "08:00 - 21:00", price: "35k" },
  { name: "Bún Riêu Yến", dish: "bún riêu", type: "Món nước", addr: "1346 Trường Sa, P. 3", dist: "Quận Tân Bình", time: "06:00 - 18:10", price: "32k" },
  { name: "Bún Đậu Homemade", dish: "Bún đậu", type: "Món khô", addr: "1 Nguyễn Văn Tráng", dist: "Quận 1", time: "10:00 - 20:30", price: "25-100k" },
  { name: "Bánh Canh Gia Lai", dish: "Bánh canh", type: "Món nước", addr: "33 Dân Trí, P. 6", dist: "Quận Tân Bình", time: "12:00 - 22:00", price: "30-76k" },
  { name: "Bánh mì cô Huyền", dish: "Bánh Mì Gà Xé Bơ", type: "Bánh mì", addr: "6/7 Đồ Sơn, P. 4", dist: "Quận Tân Bình", time: "06:00 - 23:00", price: "25k" },
  { name: "Phở Sụn Ông Già Đầu Bạc", dish: "Phở sụn", type: "Món nước", addr: "Đối diện 212/7 Nguyễn Văn Nguyễn", dist: "Quận 1", time: "6h30 - 13h00", price: "Vừa phải" },
  { name: "MỘC", dish: "Bò bít tết", type: "Món khô", addr: "11 Công Chúa Ngọc Hân", dist: "Quận 11", time: "07:30 - 21:00", price: "60-75k" },
  { name: "Pizza 777", dish: "Pizza & Hotdog", type: "Món khô", addr: "122/7 Yên Thế, P. 2", dist: "Quận Tân Bình", time: "10:00 - 23:59", price: "50-200k" },
  { name: "Hẻm nướng 197", dish: "Đồ nướng", type: "Món khô", addr: "197 Ngô Quyền, P. 6,", dist: "Quận 10", time: "18:30 - 21:00", price: "Vừa phải" },
  { name: "Lyn’s Chicken", dish: "Gà rán sốt", type: "Món khô", addr: "69 Tân Trang, P. 9", dist: "Quận Tân Bình", time: "11:00 - 20:30", price: "20-30k" },
  { name: "Bánh ướt 25k", dish: "Bánh ướt", type: "Món nước", addr: "117 Thoại Ngọc Hầu", dist: "Quận Tân Phú", time: "7h đến hết", price: "25k" },
  { name: "Trang Minh", dish: "Bún Chả Hà Nội", type: "Món nước", addr: "169 Bùi Đình Túy", dist: "Quận Bình Thạnh", time: "06:30 - 20:00", price: "30-50k" },
  { name: "BamBoo Quán", dish: "Bánh mì chảo", type: "Bánh mì", addr: "47/24/33 Bùi Đình Túy", dist: "Quận Bình Thạnh", time: "14:00 - 22:00", price: "30-50k" },
  { name: "Bánh mì Cô Lành", dish: "Bánh mì thịt bò nướng", type: "Bánh mì", addr: "6 Hồ Xuân Hương, P. 14", dist: "Quận Bình Thạnh", time: "06:00 - 19:30", price: "30-40k" },
  { name: "Ốc Singapore", dish: "Ốc", type: "Ăn vặt", addr: "295 nguyễn gia trí", dist: "Quận Bình Thạnh", time: "15:00 - 23:00", price: "20-200k" },
  { name: "Bánh canh sườn cây 10k", dish: "Bánh canh", type: "Món nước", addr: "939 Phạm Thế Hiển, P. 4", dist: "Quận 8", time: "13:00 - 18:00", price: "15-25k" },
  { name: "Cháo Trắng Về Đây Em", dish: "Cháo", type: "Món nước", addr: "221/10 Phan Văn Khỏe", dist: "Quận 6", time: "16:00 - 19:00", price: "2-20k" },
  { name: "Há Cảo Chi Lăng", dish: "Há cảo", type: "Món nước", addr: "340 Lãnh Binh Thăng, P. 11", dist: "Quận 11", time: "16:00 - 22:00", price: "10-30k" },
  { name: "Mì Khô Xá Xíu Gia Phúc", dish: "Mì khô xá xíu", type: "Món khô", addr: "198B Xóm Chiếu, P. 14", dist: "Quận 4", time: "16:00 - 22:30", price: "30-50k" },
  { name: "Hủ Tíu Chay Hẻm 80", dish: "Hủ tíu chay", type: "Món nước", addr: "Hẻm 80 Lãnh Binh Thăng, P. 13", dist: "Quận 11", time: "14:00 - 21:00", price: "30-40k" },
  { name: "MiinTea", dish: "Trà Sữa & Trà Trái Cây", type: "Quán nước", addr: "104 Đường 17, P.Tân Kiểng", dist: "Quận 7", time: "08:00 - 22:30", price: "19-39k" },
  { name: "Chicken Hot Spicy", dish: "Gà rán", type: "Món khô", addr: "445 Nguyễn Tri Phương, P. 8", dist: "Quận 8", time: "", price: "30-150k" },
  { name: "Quán ốc Như", dish: "Ốc", type: "Nhậu nhẹt", addr: "45 Đ. Số 4, Trường Thọ, Thủ Đức", dist: "Thủ Đức", time: "16:00 - 23:00", price: "50-200k" },
  { name: "Tàu Hủ Đá", dish: "Tàu Hũ Đá", type: "Tráng miệng", addr: "475 Đ. Nguyễn Văn Bá", dist: "Thủ Đức", time: "15:30 - 21:30", price: "15k-50k" },
  { name: "Marukame Udon", dish: "Mì Udon Nhật", type: "Món Nhật", addr: "27 Thảo Điền", dist: "Thủ Đức", time: "10:00 - 22:00", price: "80k - 150k" },
  { name: "The Deck Saigon", dish: "Món Âu View Sông", type: "Sang chảnh", addr: "38 Nguyễn Ư Dĩ", dist: "Thủ Đức", time: "08:00 - 23:00", price: "500k++" },
  { name: "Ốc Vịnh Nhỏ", dish: "Ốc các loại", type: "Ốc", addr: "5 Thảo Điền", dist: "Thủ Đức", time: "16:00 - 23:00", price: "Cao" },
  { name: "Cơm Tấm Kiều Giang", dish: "Cơm tấm", type: "Cơm", addr: "652 Xa Lộ Hà Nội", dist: "Thủ Đức", time: "06:00 - 21:00", price: "45k - 70k" },
  { name: "Lẩu Bò Giáo Toàn", dish: "Lẩu bò", type: "Lẩu", addr: "218 Quốc Lộ 1K", dist: "Thủ Đức", time: "09:00 - 22:00", price: "150k - 250k" },
  { name: "Nem Nướng Ninh Hòa", dish: "Nem nướng", type: "Món cuốn", addr: "104 Hoàng Diệu 2", dist: "Thủ Đức", time: "10:00 - 22:00", price: "40k - 60k" },
  { name: "Làng Nướng Gió Chiều", dish: "Đồ nướng", type: "Nhậu nhẹt", addr: "58 Đường 10, Tăng Nhơn Phú B", dist: "Thủ Đức", time: "09:00 - 23:00", price: "Bình dân" },
  { name: "Gà Nướng Ò Ó O", dish: "Gà nướng", type: "Món khô", addr: "82 Đường số 2, P. Trường Thọ", dist: "Thủ Đức", time: "10:00 - 22:00", price: "140k/con" },
  { name: "Hàng Dương Quán", dish: "Hải sản tươi sống", type: "Sang chảnh", addr: "132 Đường 65", dist: "Quận 7", time: "09:00 - 23:00", price: "Cao" },
  { name: "D'Maris Buffet", dish: "Buffet cao cấp", type: "Sang chảnh", addr: "Tầng 3 Lotte Mart, Q7", dist: "Quận 7", time: "11:00 - 22:00", price: "400k - 600k" },
  { name: "Bò Tơ Quán Mộc", dish: "Bò tơ", type: "Nhậu nhẹt", addr: "486 Nguyễn Thị Thập", dist: "Quận 7", time: "10:00 - 23:00", price: "200k" },
  { name: "Cháo Vịt Gò Công", dish: "Cháo vịt", type: "Món nước", addr: "315 Lê Văn Lương", dist: "Quận 7", time: "15:00 - 22:00", price: "40k" },
  { name: "Cơm Niêu Thiên Lý", dish: "Cơm niêu", type: "Cơm", addr: "74 Nguyễn Thị Thập", dist: "Quận 7", time: "10:00 - 21:00", price: "100k" },
  { name: "Ốc Luộc Chợ Tân Mỹ", dish: "Ốc luộc", type: "Ốc", addr: "Chợ Tân Mỹ", dist: "Quận 7", time: "16:00 - 23:00", price: "Bình dân" },
  { name: "Mì Quảng Sâm", dish: "Mì quảng", type: "Món nước", addr: "8 Ca Văn Thỉnh", dist: "Quận Tân Bình", time: "06:00 - 13:00", price: "40k" },
  { name: "Bò Kho Cô Mai", dish: "Bò kho", type: "Món nước", addr: "25 Thăng Long", dist: "Quận Tân Bình", time: "06:00 - 22:00", price: "55k" },
  { name: "Cơm Niêu Việt Nam", dish: "Cơm niêu", type: "Sang chảnh", addr: "234 Cộng Hòa", dist: "Quận Tân Bình", time: "10:00 - 22:00", price: "Cao" },
  { name: "Ốc Nhớ Sài Gòn", dish: "Ốc", type: "Nhậu nhẹt", addr: "136 Trịnh Đình Trọng", dist: "Quận Tân Phú", time: "16:00 - 23:00", price: "50k - 100k" },
  { name: "Bún Bò Huế A Hùng", dish: "Bún bò", type: "Món nước", addr: "68/10 Gò Dầu", dist: "Quận Tân Phú", time: "06:00 - 21:00", price: "40k" },
  { name: "Lẩu Bò Tươi", dish: "Lẩu bò", type: "Lẩu", addr: "298 Tân Sơn Nhì", dist: "Quận Tân Phú", time: "10:00 - 23:00", price: "150k" },
  { name: "Tokbokki Ông Park", dish: "Lẩu Tokbokki", type: "Món Hàn", addr: "26 Tân Sơn Nhì", dist: "Quận Tân Phú", time: "11:00 - 22:00", price: "120k" },
  { name: "Lẩu Ếch Sáu Hiếu", dish: "Lẩu ếch", type: "Lẩu", addr: "429/9 Quang Trung", dist: "Quận Gò Vấp", time: "15:30 - 23:00", price: "150k" },
  { name: "Bánh Mì Chảo Hạnh Thông Tây", dish: "Bánh mì chảo", type: "Bánh mì", addr: "20 Đường số 18", dist: "Quận Gò Vấp", time: "06:00 - 13:00", price: "35k" },
  { name: "Mì Vịt Tiềm A Mành", dish: "Mì vịt tiềm", type: "Món nước", addr: "375 Nguyễn Oanh", dist: "Quận Gò Vấp", time: "15:00 - 22:00", price: "80k - 100k" },
  { name: "Lẩu Dê Đức Hùng", dish: "Lẩu dê", type: "Lẩu", addr: "45/3A Song Hành", dist: "Quận 12", time: "09:00 - 23:00", price: "150k - 200k" },
  { name: "Bún Bò Huế Xưa", dish: "Bún bò", type: "Món nước", addr: "309 Lê Văn Khương", dist: "Quận 12", time: "06:00 - 22:00", price: "40k" },
  { name: "Ốc Sinh Viên", dish: "Ốc", type: "Ốc", addr: "19 Đường số 1", dist: "Quận Bình Tân", time: "15:00 - 23:00", price: "Bình dân" },
  { name: "Aeon Mall Bình Tân", dish: "Food Court", type: "Ăn vặt", addr: "1 Đường số 17A", dist: "Quận Bình Tân", time: "10:00 - 22:00", price: "Đa dạng" },
  { name: "Lẩu Bò Tơ Năm Sánh", dish: "Lẩu bò tơ", type: "Lẩu", addr: "86 Đường số 7", dist: "Quận Bình Tân", time: "10:00 - 23:00", price: "Vừa phải" },
  { name: "Ốc 24h", dish: "Ốc", type: "Nhậu nhẹt", addr: "C4/10 Phạm Hùng", dist: "Huyện Bình Chánh", time: "15:00 - 23:00", price: "Bình dân" },
  { name: "Kichi Kichi", dish: "Lẩu băng chuyền", type: "Lẩu", addr: "Nhiều chi nhánh", dist: "Toàn Thành Phố", time: "10:00 - 22:00", price: "300k" },
  { name: "Gogi House", dish: "Thịt nướng Hàn Quốc", type: "Nướng", addr: "Nhiều chi nhánh", dist: "Toàn Thành Phố", time: "10:00 - 22:00", price: "350k" },
  { name: "Manwah", dish: "Lẩu Đài Loan", type: "Lẩu", addr: "Nhiều chi nhánh", dist: "Toàn Thành Phố", time: "10:00 - 22:00", price: "400k" },
  { name: "Highlands Coffee", dish: "Cà phê & Bánh", type: "Cafe", addr: "Nhiều chi nhánh", dist: "Toàn Thành Phố", time: "07:00 - 23:00", price: "35k - 65k" },
  { name: "Phúc Long", dish: "Trà sữa", type: "Trà sữa", addr: "Nhiều chi nhánh", dist: "Toàn Thành Phố", time: "07:00 - 22:30", price: "45k - 70k" },
  { name: "Pizza Company", dish: "Pizza", type: "Món Âu", addr: "Nhiều chi nhánh", dist: "Toàn Thành Phố", time: "10:00 - 22:00", price: "200k - 400k" },
  { name: "Texas Chicken", dish: "Gà rán", type: "Món khô", addr: "Nhiều chi nhánh", dist: "Toàn Thành Phố", time: "10:00 - 22:00", price: "100k" },
  { name: "Lotteria", dish: "Gà rán & Burger", type: "Fastfood", addr: "Nhiều chi nhánh", dist: "Toàn Thành Phố", time: "09:00 - 22:00", price: "40k - 80k" },
  { name: "Jollibee", dish: "Gà rán & Mì ý", type: "Fastfood", addr: "Nhiều chi nhánh", dist: "Toàn Thành Phố", time: "09:00 - 22:00", price: "40k - 80k" },
  { name: "The Coffee House", dish: "Cà phê & Trà", type: "Cafe", addr: "Nhiều chi nhánh", dist: "Toàn Thành Phố", time: "07:00 - 22:30", price: "40k - 70k" },
  { name: "Bún Đậu Mắm Tôm A Chảnh", dish: "Bún đậu", type: "Món khô", addr: "Nhiều chi nhánh", dist: "Toàn Thành Phố", time: "10:00 - 22:00", price: "55k" },
  { name: "Mì Cay Sasin", dish: "Mì cay 7 cấp độ", type: "Món nước", addr: "Nhiều chi nhánh", dist: "Toàn Thành Phố", time: "09:00 - 22:00", price: "45k - 60k" },
  { name: "Hủ Tiếu Mực Ông Già Cali", dish: "Hủ tiếu mực", type: "Món nước", addr: "Nhiều chi nhánh", dist: "Toàn Thành Phố", time: "06:00 - 23:00", price: "50k - 70k" },
  { name: "Bò Lế Rồ", dish: "Bò nhúng sốt", type: "Lẩu", addr: "Nhiều chi nhánh", dist: "Toàn Thành Phố", time: "11:00 - 22:00", price: "150k - 250k" },
  { name: "Phở Thìn Lò Đúc", dish: "Phở tái lăn", type: "Món nước", addr: "13 Lò Đúc", dist: "Hà Nội", time: "06:00 - 21:00", price: "70k - 90k" },
  { name: "Bún Chả Hương Liên", dish: "Bún chả Obama", type: "Món nước", addr: "24 Lê Văn Hưu", dist: "Hà Nội", time: "08:00 - 20:30", price: "50k - 80k" },
  { name: "Chả Cá Lã Vọng", dish: "Chả cá", type: "Đặc sản", addr: "14 Chả Cá", dist: "Hà Nội", time: "11:00 - 22:00", price: "175k/suất" },
  { name: "Bún Đậu Mắm Tôm Hàng Khay", dish: "Bún đậu", type: "Món khô", addr: "Ngõ 31 Hàng Khay", dist: "Hà Nội", time: "09:00 - 21:00", price: "40k - 60k" },
  { name: "Phở Lý Quốc Sư", dish: "Phở bò", type: "Món nước", addr: "10 Lý Quốc Sư", dist: "Hà Nội", time: "06:00 - 22:00", price: "60k - 100k" },
  { name: "Xôi Yến", dish: "Xôi xéo", type: "Món khô", addr: "35B Nguyễn Hữu Huân", dist: "Hà Nội", time: "06:00 - 23:00", price: "40k - 60k" },
  { name: "Cafe Giảng", dish: "Cà phê trứng", type: "Cafe", addr: "39 Nguyễn Hữu Huân", dist: "Hà Nội", time: "07:00 - 22:00", price: "35k" },
  { name: "Bún Thang Bà Đức", dish: "Bún thang", type: "Món nước", addr: "48 Cầu Gỗ", dist: "Hà Nội", time: "07:00 - 23:00", price: "45k" },
  { name: "Bánh Cuốn Bà Hoành", dish: "Bánh cuốn Thanh Trì", type: "Món cuốn", addr: "66 Tô Hiến Thành", dist: "Hà Nội", time: "06:00 - 20:00", price: "40k - 60k" },
  { name: "Nộm Bố Già", dish: "Nộm bò khô", type: "Ăn vặt", addr: "1 Nguyễn Trung Trực", dist: "Hà Nội", time: "13:00 - 18:00", price: "30k" },
  { name: "Mì Quảng Bà Mua", dish: "Mì quảng ếch", type: "Món nước", addr: "95A Nguyễn Tri Phương", dist: "Đà Nẵng", time: "06:00 - 22:00", price: "40k - 60k" },
  { name: "Bánh Tráng Thịt Heo Trần", dish: "Đặc sản cuốn", type: "Món cuốn", addr: "4 Lê Duẩn", dist: "Đà Nẵng", time: "09:00 - 22:00", price: "150k - 200k" },
  { name: "Hải Sản Bé Mặn", dish: "Hải sản tươi", type: "Nhậu nhẹt", addr: "Lô 11 Võ Nguyên Giáp", dist: "Đà Nẵng", time: "09:00 - 23:00", price: "Bình dân" },
  { name: "Bún Chả Cá 109", dish: "Bún chả cá", type: "Món nước", addr: "109 Nguyễn Chí Thanh", dist: "Đà Nẵng", time: "06:00 - 22:00", price: "30k - 40k" },
  { name: "Bánh Xèo Bà Dưỡng", dish: "Bánh xèo nem lụi", type: "Món cuốn", addr: "K280/23 Hoàng Diệu", dist: "Đà Nẵng", time: "09:30 - 21:00", price: "50k - 80k" },
  { name: "Chè Liên", dish: "Chè sầu riêng", type: "Tráng miệng", addr: "189 Hoàng Diệu", dist: "Đà Nẵng", time: "08:00 - 22:00", price: "20k - 30k" },
  { name: "Cơm Gà Bà Buội", dish: "Cơm gà Hội An", type: "Cơm", addr: "22 Phan Chu Trinh", dist: "Hội An", time: "10:30 - 20:00", price: "40k - 60k" },
  { name: "Bánh Mì Phượng", dish: "Bánh mì", type: "Bánh mì", addr: "2B Phan Chu Trinh", dist: "Hội An", time: "06:30 - 21:30", price: "30k - 40k" },
  { name: "Cao Lầu Thanh", dish: "Cao lầu", type: "Món khô", addr: "26 Thái Phiên", dist: "Hội An", time: "07:00 - 19:00", price: "30k - 40k" },
  { name: "Mót Hội An", dish: "Nước thảo mộc", type: "Quán nước", addr: "150 Trần Phú", dist: "Hội An", time: "08:00 - 22:00", price: "12k" },
  { name: "Lẩu Gà Lá É Tao Ngộ", dish: "Lẩu gà", type: "Lẩu", addr: "5 Đường 3/4", dist: "Đà Lạt", time: "07:00 - 23:00", price: "200k - 300k" },
  { name: "Bánh Căn Lệ", dish: "Bánh căn", type: "Ăn vặt", addr: "27/44 Yersin", dist: "Đà Lạt", time: "07:00 - 17:00", price: "30k - 50k" },
  { name: "Lẩu Bò Quán Gỗ (Ba Toa)", dish: "Lẩu bò", type: "Lẩu", addr: "1/29 Hoàng Diệu", dist: "Đà Lạt", time: "10:00 - 22:00", price: "200k - 300k" },
  { name: "Bánh Tráng Nướng Dì Đinh", dish: "Pizza Đà Lạt", type: "Ăn vặt", addr: "26 Hoàng Diệu", dist: "Đà Lạt", time: "14:00 - 18:30", price: "20k - 30k" },
  { name: "Kem Bơ Thanh Thảo", dish: "Kem bơ", type: "Tráng miệng", addr: "76 Nguyễn Văn Trỗi", dist: "Đà Lạt", time: "07:00 - 22:00", price: "25k - 40k" },
  { name: "Nem Nướng Bà Hùng", dish: "Nem nướng", type: "Món cuốn", addr: "328 Phan Đình Phùng", dist: "Đà Lạt", time: "11:00 - 21:00", price: "50k" },
  { name: "Tiệm Cà Phê Túi Mơ To", dish: "Cafe view thung lũng", type: "Cafe", addr: "Hẻm 31 Sào Nam", dist: "Đà Lạt", time: "07:00 - 21:30", price: "50k - 80k" },
  { name: "Nem Nướng Đặng Văn Quyên", dish: "Nem nướng", type: "Món cuốn", addr: "16A Lãn Ông", dist: "Nha Trang", time: "07:30 - 20:30", price: "50k" },
  { name: "Bún Cá Hạnh Nhiên", dish: "Bún chả cá sứa", type: "Món nước", addr: "61 Trịnh Phong", dist: "Nha Trang", time: "06:00 - 11:00", price: "35k - 45k" },
  { name: "Bò Lạc Cảnh", dish: "Bò nướng", type: "Nướng", addr: "44 Nguyễn Bỉnh Khiêm", dist: "Nha Trang", time: "10:00 - 22:00", price: "150k - 200k" },
  { name: "Hải Sản Thanh Sương", dish: "Hải sản", type: "Nhậu nhẹt", addr: "21 Trần Phú", dist: "Nha Trang", time: "15:00 - 23:00", price: "Bình dân" },
  { name: "Cơm Hến Hoa Đông", dish: "Cơm hến, bún hến", type: "Món khô", addr: "64 Kiệt 7 Ưng Bình", dist: "Huế", time: "07:00 - 22:00", price: "15k - 20k" },
  { name: "Bún Bò Huế Bà Tuyết", dish: "Bún bò", type: "Món nước", addr: "47 Nguyễn Công Trứ", dist: "Huế", time: "06:00 - 11:00", price: "35k - 50k" },
  { name: "Chè Hẻm", dish: "Chè bột lọc heo quay", type: "Tráng miệng", addr: "1 Kiệt 29 Hùng Vương", dist: "Huế", time: "10:00 - 22:00", price: "15k" },
  { name: "Bánh Bèo Nậm Lọc Bà Đỏ", dish: "Bánh huế", type: "Ăn vặt", addr: "8 Nguyễn Bỉnh Khiêm", dist: "Huế", time: "08:00 - 21:30", price: "Bình dân" },
  { name: "Bánh Đa Cua Bà Cụ", dish: "Bánh đa cua bể", type: "Món nước", addr: "179 Cầu Đất", dist: "Hải Phòng", time: "06:00 - 22:00", price: "50k" },
  { name: "Bánh Mì Cay Bà Già", dish: "Bánh mì que", type: "Bánh mì", addr: "57 Lê Lợi", dist: "Hải Phòng", time: "07:00 - 22:30", price: "5k/cái" },
  { name: "Dừa Dầm Cô Hằng", dish: "Dừa dầm", type: "Tráng miệng", addr: "124 Lạch Tray", dist: "Hải Phòng", time: "09:00 - 22:00", price: "25k - 30k" },
  { name: "Ốc Thủy Dương", dish: "Ốc cay", type: "Ốc", addr: "30/263 Lạch Tray", dist: "Hải Phòng", time: "15:00 - 22:00", price: "50k - 100k" },
  { name: "Lẩu Mắm Dạ Lý", dish: "Lẩu mắm", type: "Lẩu", addr: "89 Đường 3/2", dist: "Cần Thơ", time: "10:00 - 22:00", price: "200k - 300k" },
  { name: "Bánh Xèo 7 Tới", dish: "Bánh xèo củ hủ dừa", type: "Món khô", addr: "45 Hoàng Quốc Việt", dist: "Cần Thơ", time: "07:30 - 22:00", price: "40k - 60k" },
  { name: "Nem Nướng Thanh Vân", dish: "Nem nướng", type: "Món cuốn", addr: "17 Đại Lộ Hòa Bình", dist: "Cần Thơ", time: "08:00 - 22:00", price: "50k - 70k" },
  { name: "Pizza Hủ Tiếu Sáu Hoài", dish: "Pizza hủ tiếu", type: "Đặc sản", addr: "476/14 Lộ Vòng Cung", dist: "Cần Thơ", time: "06:00 - 18:00", price: "35k - 50k" },
  { name: "Lẩu Tôm 5 Ri Biên Hòa", dish: "Lẩu tôm", type: "Lẩu", addr: "20/3C Khóm 5, P. Hòa Bình", dist: "Biên Hòa", time: "10:00 - 22:00", price: "200k" },
  { name: "Chả Lụi Biên Hòa", dish: "Chả lụi", type: "Ăn vặt", addr: "Huỳnh Văn Nghệ", dist: "Biên Hòa", time: "14:00 - 22:00", price: "Bình dân" },
  { name: "Bánh Canh Chả Cá Bà Lý", dish: "Bánh canh chả cá", type: "Món nước", addr: "566 Trần Hưng Đạo", dist: "Phan Thiết", time: "16:00 - 22:00", price: "25k" },
  { name: "Lẩu Thả Khánh Sơ", dish: "Lẩu thả", type: "Lẩu", addr: "54 Nguyễn Đình Chiểu", dist: "Phan Thiết", time: "09:00 - 22:00", price: "250k" },
  { name: "Bánh Khọt Gốc Vú Sữa", dish: "Bánh khọt tôm", type: "Đặc sản", addr: "14 Nguyễn Trường Tộ, P.2", dist: "Vũng Tàu", time: "07:00 - 15:30", price: "50k - 60k" },
  { name: "Bánh Khọt Cô Ba Vũng Tàu", dish: "Bánh khọt", type: "Đặc sản", addr: "1 Hoàng Hoa Thám, P.3", dist: "Vũng Tàu", time: "07:00 - 22:00", price: "60k - 80k" },
  { name: "Bánh Khọt Bà Hai", dish: "Bánh khọt giòn", type: "Đặc sản", addr: "42 Trần Đồng, P.3", dist: "Vũng Tàu", time: "06:00 - 12:00", price: "40k - 60k" },
  { name: "Bánh Khọt Miền Đông", dish: "Bánh khọt", type: "Đặc sản", addr: "59 Bà Triệu, P.4", dist: "Vũng Tàu", time: "06:00 - 21:00", price: "35k - 50k" },
  { name: "Bánh Khọt Cây Sung", dish: "Bánh khọt", type: "Đặc sản", addr: "19 Hoàng Hoa Thám, P.3", dist: "Vũng Tàu", time: "09:00 - 21:00", price: "50k" },
  { name: "Hải Sản Gành Hào", dish: "Hải sản cao cấp", type: "Sang chảnh", addr: "03 Trần Phú, P.5", dist: "Vũng Tàu", time: "10:00 - 21:30", price: "Cao" },
  { name: "Ốc Tự Nhiên", dish: "Ốc hương, móng tay", type: "Ốc", addr: "34 Trần Phú, P.1", dist: "Vũng Tàu", time: "11:00 - 23:00", price: "Bình dân" },
  { name: "Hải Sản Thành Phát 1", dish: "Hải sản tươi sống", type: "Nhậu nhẹt", addr: "334 Trần Phú, P.5", dist: "Vũng Tàu", time: "08:30 - 22:30", price: "Vừa phải" },
  { name: "Ốc Năm Tầng", dish: "Ốc bình dân", type: "Ốc", addr: "A12 Nguyễn Thái Học", dist: "Vũng Tàu", time: "17:00 - 22:00", price: "Bình dân" },
  { name: "Quán Nướng Cô Nên", dish: "Bạch tuộc nướng", type: "Nướng", addr: "20 Trần Phú, P.1", dist: "Vũng Tàu", time: "16:00 - 23:00", price: "100k - 200k" },
  { name: "Chợ Đêm Vũng Tàu", dish: "Hải sản chế biến", type: "Nhậu nhẹt", addr: "Sau lưng KS Imperial", dist: "Vũng Tàu", time: "18:00 - 02:00", price: "Đa dạng" },
  { name: "Lẩu Cá Đuối Hoàng Minh", dish: "Lẩu cá đuối", type: "Lẩu", addr: "44 Trương Công Định", dist: "Vũng Tàu", time: "09:00 - 23:30", price: "200k - 300k" },
  { name: "Lẩu Cá Đuối 7 Lượm", dish: "Lẩu cá đuối", type: "Lẩu", addr: "37 Nguyễn Trường Tộ", dist: "Vũng Tàu", time: "09:00 - 23:00", price: "150k - 250k" },
  { name: "Lẩu Cá Đuối Út Mười", dish: "Lẩu cá đuối", type: "Lẩu", addr: "16A Trương Công Định", dist: "Vũng Tàu", time: "08:30 - 22:00", price: "180k" },
  { name: "Hủ Tiếu Mực Ông Già Cali", dish: "Hủ tiếu mực", type: "Món nước", addr: "113 Hoàng Hoa Thám", dist: "Vũng Tàu", time: "06:00 - 22:00", price: "60k - 80k" },
  { name: "Bánh Canh Ghẹ Anh Vy", dish: "Bánh canh ghẹ", type: "Món nước", addr: "109 Võ Thị Sáu", dist: "Vũng Tàu", time: "06:00 - 21:00", price: "40k - 70k" },
  { name: "Bún Súng Vũng Tàu", dish: "Bún súng", type: "Món nước", addr: "Sát Bãi Sau", dist: "Vũng Tàu", time: "07:00 - 18:00", price: "40k" },
  { name: "Bánh Bông Lan Gốc Cột Điện", dish: "Bông lan trứng muối", type: "Ăn vặt", addr: "17B Nguyễn Trường Tộ", dist: "Vũng Tàu", time: "06:00 - 22:00", price: "25k - 40k" },
  { name: "Kem Alibaba", dish: "Kem Thổ Nhĩ Kỳ", type: "Tráng miệng", addr: "1A Trần Phú (Cáp treo)", dist: "Vũng Tàu", time: "16:00 - 22:00", price: "30k" },
  { name: "Yaourt Cô Tiên", dish: "Yaourt, Trứng lòng đào", type: "Ăn vặt", addr: "Đường lên ngọn Hải Đăng", dist: "Vũng Tàu", time: "07:00 - 17:00", price: "10k - 20k" },
  { name: "Soho Coffee", dish: "Cafe view biển", type: "Cafe", addr: "66 Hạ Long", dist: "Vũng Tàu", time: "07:00 - 23:00", price: "45k - 80k" },
  { name: "Lightroom Coffee", dish: "Cafe view biển", type: "Cafe", addr: "2/23 Hải Đăng", dist: "Vũng Tàu", time: "07:00 - 22:00", price: "40k - 70k" },
  { name: "Gazebo Beach Front", dish: "Cocktail, Cafe", type: "Sang chảnh", addr: "90 Hạ Long", dist: "Vũng Tàu", time: "07:00 - 02:00", price: "Cao" },
  { name: "Bánh Mì Chảo Hàng Quyên", dish: "Bánh mì chảo", type: "Bánh mì", addr: "268 Trương Công Định", dist: "Vũng Tàu", time: "06:00 - 13:00", price: "35k - 50k" }
]

const allDistricts = [...new Set(database.map(item => item.dist))].sort()
const selectedDistricts = ref<string[]>([...allDistricts])
const showModal = ref(false)
const isFlipped = ref(false)

const result = ref({
  dish: 'Tên món ăn',
  name: 'Tên Quán',
  addr: 'Địa chỉ đầy đủ',
  dist: 'Quận ?',
  time: '--:--',
  price: '-- k',
  type: 'Món Ngon',
  mapLink: '#'
})

const filterCountText = computed(() => {
  if (selectedDistricts.value.length === allDistricts.length) return "Tất cả"
  return `${selectedDistricts.value.length} khu vực`
})

const mascotIcon = computed(() => {
  const combined = (result.value.dish + " " + result.value.type).toLowerCase()
  const icons: Record<string, string> = {
    'bánh mì': '🥖', 'cơm': '🍚', 'phở': '🍜', 'bún': '🍜', 'hủ tiếu': '🍜', 'mì': '🍜',
    'lẩu': '🥘', 'nướng': '🥩', 'bò': '🥩', 'steak': '🥩', 'ăn vặt': '🍡', 
    'trà sữa': '🧋', 'cafe': '☕', 'tráng miệng': '🍮', 'chè': '🍧', 'kem': '🍦',
    'ốc': '🐚', 'hàn': '🇰🇷', 'nhật': '🍣', 'sushi': '🍣', 'chay': '🥗', 
    'pizza': '🍕', 'gà': '🍗', 'xôi': '🍙', 'bánh canh': '🍜', 'cháo': '🥣',
    'nem': '🌯', 'cuốn': '🌯', 'hàu': '🦪', 'dimsum': '🥟', 'há cảo': '🥟', 'sủi cảo': '🥟'
  }
  for (const key in icons) {
    if (combined.includes(key)) return icons[key]
  }
  return '🍽️'
})

const badgeClass = computed(() => {
  const t = result.value.type.toLowerCase()
  if (t.includes('bánh mì')) return 'type-banhmi'
  if (t.includes('cơm')) return 'type-com'
  if (t.includes('nước') || t.includes('phở') || t.includes('bún') || t.includes('hủ tiếu') || t.includes('lẩu')) return 'type-nuoc'
  if (t.includes('lẩu')) return 'type-lau'
  if (t.includes('ăn vặt') || t.includes('tráng miệng') || t.includes('trà')) return 'type-anvat'
  if (t.includes('sang') || t.includes('nhật') || t.includes('hàn')) return 'type-sang'
  if (t.includes('khô') || t.includes('cuốn') || t.includes('nướng')) return 'type-kho'
  return 'type-anvat'
})

function toggleAll() {
  if (selectedDistricts.value.length === allDistricts.length) {
    selectedDistricts.value = []
  } else {
    selectedDistricts.value = [...allDistricts]
  }
}

function updateData() {
  const filteredData = database.filter(item => selectedDistricts.value.includes(item.dist))
  if (filteredData.length === 0) {
    alert("Không tìm thấy quán nào ở khu vực bạn chọn.")
    return
  }
  
  const item = filteredData[Math.floor(Math.random() * filteredData.length)]
  result.value = {
    dish: item.dish,
    name: item.name,
    addr: item.addr,
    dist: item.dist,
    time: item.time,
    price: item.price && item.price.trim() !== "" ? item.price : "Bình dân",
    type: item.type,
    mapLink: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.name + ' ' + item.addr + ' ' + item.dist)}`
  }
  isFlipped.value = true
}

function pickFood() {
  if (selectedDistricts.value.length === 0) {
    alert("Vui lòng chọn ít nhất một khu vực.")
    showModal.value = true
    return
  }
  if (isFlipped.value) {
    isFlipped.value = false
    setTimeout(updateData, 600)
  } else {
    updateData()
  }
}
</script>

<template>
  <div class="app-wrapper">
    <RouterLink to="/" class="btn-back-home">Trang chủ</RouterLink>

    <div class="header-section">
      <h1>🎀 Bé Ơi Ăn Gì? 🎀</h1>
      <div class="filter-trigger" @click="showModal = true">
        Chọn Quận (<span>{{ filterCountText }}</span>)
      </div>
    </div>

    <div v-if="showModal" class="modal">
      <div class="modal-content">
        <div class="modal-header">Chọn Khu Vực</div>
        <div class="filter-list">
          <label 
            v-for="dist in allDistricts" 
            :key="dist" 
            class="filter-item" 
            :class="{ active: selectedDistricts.includes(dist) }"
          >
            <input type="checkbox" :value="dist" v-model="selectedDistricts">
            <span>{{ dist }}</span>
          </label>
        </div>
        <div class="modal-footer">
          <button class="btn-modal btn-cancel" @click="toggleAll">Bỏ Chọn</button>
          <button class="btn-modal btn-apply" @click="showModal = false">Xong</button>
        </div>
      </div>
    </div>

    <div class="card-container">
      <div class="card" :class="{ 'is-flipped': isFlipped }">
        <div class="card-face card-back">
          <div class="card-hint">www.mtdes23.id.vn</div>
        </div>
        
        <div class="card-face card-front">
          <div class="card-content-scroll">
            <div class="mascot-area">{{ mascotIcon }}</div>
            <div class="badge-type" :class="badgeClass">{{ result.type }}</div>
            <div class="result-dish">{{ result.dish }}</div>
            <div class="result-name">{{ result.name }}</div>
            <div class="result-addr">{{ result.addr }}</div>

            <div class="info-box">
              <div class="info-row">
                <span class="info-icon">Khu vực:</span>
                <div class="info-content"><span class="info-value">{{ result.dist }}</span></div>
              </div>
              <div class="info-row">
                <span class="info-icon">Giờ mở:</span>
                <div class="info-content"><span class="info-value">{{ result.time }}</span></div>
              </div>
              <div class="info-row">
                <span class="info-icon">Giá:</span>
                <div class="info-content"><span class="info-value">{{ result.price }}</span></div>
              </div>
            </div>
          </div>
          <div class="card-footer">
            <a :href="result.mapLink" target="_blank" class="btn-map-link">Xem Bản Đồ</a>
          </div>
        </div>
      </div>
    </div>

    <div class="footer-section">
      <button class="btn-spin" @click="pickFood">Chọn Món Ngẫu Nhiên</button>
    </div>
  </div>
</template>

<style scoped>
.app-wrapper {
  --primary-pink: #ff9eb5;
  --dark-pink: #ff758f;
  --soft-pink: #fff0f5;
  --text-color: #555;
  --white: #ffffff;
  --shadow-soft: 0 10px 25px rgba(255, 158, 181, 0.3);

  font-family: 'Quicksand', sans-serif;
  background-color: #fff5f8;
  background-image: repeating-linear-gradient(45deg, #fff0f5 25%, transparent 25%, transparent 75%, #fff0f5 75%, #fff0f5), repeating-linear-gradient(45deg, #fff0f5 25%, #fff5f8 25%, #fff5f8 75%, #fff0f5 75%, #fff0f5);
  background-size: 20px 20px;
  
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  height: 100vh;
  margin: 0;
  color: var(--text-color);
  padding: 10px;
  padding-top: max(50px, env(safe-area-inset-top));
  position: relative;
}

.btn-back-home {
  position: absolute;
  top: 10px;
  left: 10px;
  background: white;
  color: var(--dark-pink);
  border: 1px solid var(--primary-pink);
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: bold;
  text-decoration: none;
  z-index: 10;
}

.header-section { flex-shrink: 0; display: flex; flex-direction: column; align-items: center; width: 100%; gap: 10px; }
h1 { color: var(--dark-pink); font-size: 1.5rem; text-align: center; margin: 0; background: white; padding: 8px 20px; border-radius: 50px; border: 2px solid var(--primary-pink); }
.filter-trigger { background: white; color: var(--dark-pink); border: 1px dashed var(--primary-pink); padding: 6px 15px; border-radius: 20px; font-weight: 700; font-size: 0.85rem; cursor: pointer; }

.card-container { perspective: 1000px; width: 100%; max-width: 360px; flex-grow: 1; margin: 15px 0; display: flex; align-items: center; justify-content: center; position: relative; }
.card { width: 100%; height: 100%; max-height: 60vh; min-height: 380px; position: relative; transform-style: preserve-3d; transition: transform 0.6s cubic-bezier(0.68, -0.55, 0.27, 1.55); border-radius: 30px; box-shadow: var(--shadow-soft); }
.card.is-flipped { transform: rotateY(180deg); }
.card-face { position: absolute; width: 100%; height: 100%; backface-visibility: hidden; border-radius: 30px; display: flex; flex-direction: column; align-items: center; background: var(--white); padding: 20px; box-sizing: border-box; border: 6px solid white; }

.card-back { background: linear-gradient(135deg, #ff9eb5 0%, #ffc2d1 100%); justify-content: center; }
.card-hint { font-weight: 800; color: var(--dark-pink); font-size: 1.6rem; text-align: center; background: rgba(255, 255, 255, 0.95); padding: 15px 30px; border-radius: 30px; }
.card-front { transform: rotateY(180deg); justify-content: flex-start; padding-top: 15px; }

.card-content-scroll { width: 100%; display: flex; flex-direction: column; align-items: center; overflow-y: auto; flex-grow: 1; scrollbar-width: none; }
.mascot-area { font-size: 3.5rem; margin-bottom: 5px; }
.badge-type { padding: 5px 15px; border-radius: 15px; font-size: 0.75rem; font-weight: 700; margin-bottom: 8px; color: white; background: #ccc; }

.type-banhmi { background: #e67e22; }
.type-com { background: #27ae60; }
.type-nuoc { background: #3498db; }
.type-lau { background: #e74c3c; }
.type-anvat { background: #9b59b6; }
.type-sang { background: #f1c40f; color: #333;}
.type-kho { background: #d35400; }

.result-dish { font-size: 0.95rem; color: #999; font-weight: 600; margin-bottom: 2px; }
.result-name { font-size: 1.3rem; font-weight: 800; color: var(--dark-pink); text-align: center; margin-bottom: 8px; }
.result-addr { font-size: 0.85rem; color: #666; text-align: center; margin-bottom: 10px; }

.info-box { background: var(--soft-pink); width: 100%; border-radius: 15px; padding: 8px; border: 2px dashed #ffc2d1; }
.info-row { display: flex; align-items: center; gap: 10px; font-size: 0.9rem; padding: 8px 10px; border-bottom: 1px dashed rgba(255, 158, 181, 0.3); }
.info-icon { font-weight: 600; font-size: 0.85rem; width: 60px; }
.info-value { font-weight: 700; color: #444; }

.card-footer { width: 100%; padding-top: 10px; margin-top: auto; }
.btn-map-link { text-decoration: none; color: white; font-weight: 700; text-align: center; background: var(--dark-pink); padding: 10px; border-radius: 25px; display: block; }
.footer-section { padding-bottom: 20px; }
.btn-spin { padding: 12px 40px; background: white; color: var(--dark-pink); border: 3px solid var(--dark-pink); border-radius: 50px; font-weight: 800; cursor: pointer; box-shadow: 0 5px 0 var(--primary-pink); }

.modal { position: fixed; z-index: 100; left: 0; top: 0; width: 100%; height: 100%; background-color: rgba(255,255,255,0.7); backdrop-filter: blur(5px); display: flex; align-items: center; justify-content: center; }
.modal-content { background-color: #fff; padding: 20px; border: 3px solid var(--primary-pink); border-radius: 25px; width: 85%; max-width: 380px; max-height: 70vh; display: flex; flex-direction: column; }
.filter-list { overflow-y: auto; display: grid; grid-template-columns: 1fr 1fr; gap: 8px; padding: 5px; }
.filter-item { display: flex; align-items: center; gap: 5px; font-size: 0.9rem; background: #fff0f3; padding: 8px; border-radius: 10px; cursor: pointer; }
.filter-item.active { background: var(--dark-pink); color: white; }
.filter-item input { display: none; }
.modal-footer { margin-top: 15px; display: flex; gap: 10px; }
.btn-modal { padding: 10px 0; border-radius: 20px; border: none; font-weight: 700; flex: 1; cursor: pointer; }
.btn-cancel { background: #eee; color: #666; }
.btn-apply { background: var(--dark-pink); color: white; }
</style>