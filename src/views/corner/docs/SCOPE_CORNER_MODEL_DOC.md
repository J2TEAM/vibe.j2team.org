# TÀI LIỆU KỸ THUẬT: MÔ HÌNH DỰ ĐOÁN PHẠT GÓC SCOPE CORNER

---

## MỤC LỤC

1. [Giới thiệu tổng quan](#1-giới-thiệu-tổng-quan)
2. [Sự tương thích với nguyên tắc vibe.j2team.org](#2-sự-tương-thích-với-nguyên-tắc-vibej2teamorg)
3. [Kiến trúc hệ thống Offline & Online](#3-kiến-trúc-hệ-thống-offline--online)
4. [Nguồn dữ liệu và tiền xử lý (Offline)](#4-nguồn-dữ-liệu-và-tiền-xử-lý-offline)
5. [Mô hình LightGBM Classifier & XGBoost (Offline)](#5-mô-hình-lightgbm-classifier--xgboost-offline)
6. [Feature Engineering (Offline)](#6-feature-engineering-offline)
7. [Cơ chế Ensemble Blending & Calibration](#7-cơ-chế-ensemble-blending--calibration)
8. [Vòng lặp phản hồi (Offline Feedback Loop)](#8-vòng-lặp-phản-hồi-offline-feedback-loop)
9. [Hệ thống Front-end Vue 3 (Production)](#9-hệ-thống-front-end-vue-3-production)
10. [Kết luận](#10-kết-luận)

---

## 1. Giới Thiệu Tổng Quan

### 1.1. Bối cảnh bài toán

Dự đoán phạt góc (corner kicks) trong bóng đá là một bài toán thống kê phức tạp. Khác với bàn thắng, phạt góc là hệ quả gián tiếp của nhiều yếu tố đan xen: chiến thuật pressing, tần suất tạt bóng, khả năng cản phá, thể lực, và tính biến thiên (stochastic) cực kỳ cao.

Bài toán cụ thể mà ứng dụng **SCOPE CORNER** giải quyết: Dự đoán tổng số phạt góc của một trận đấu Premier League (E0) và đưa ra thống kê / khuyến nghị (Over/Under) tại các ngưỡng 8.5, 9.5, 10.5, 11.5 và 12.5. 

### 1.2 Giải pháp 

Hệ thống tiếp cận bằng kiến trúc **Dual-Model Ensemble** (kết hợp LightGBM phân loại nhị phân và XGBoost dự đoán góc tĩnh). Tuy nhiên, vì lý do triển khai trên ứng dụng web độc lập, ứng dụng sẽ tách biệt phần phân tích AI đồ sộ (Offline) và một giao diện xem dự đoán trực quan, mượt mà (Online).

---

## 2. Sự Tương Thích Với Nguyên Tắc vibe.j2team.org

Dựa trên yêu cầu của `README.md` và tuân theo Design System, SCOPE CORNER được tái cấu trúc hoàn toàn cho môi trường **Frontend-Only**:

1. **Không có database**: Không tồn tại hệ thống cơ sở dữ liệu như PostgreSQL. Các trọng số dự đoán hoặc kết quả AI được biên dịch trước thành các file `.json` hoặc file Typescript tĩnh. Toàn bộ tính toán hiển thị nằm ở Front-end.
2. **Nút Home về trang chủ**: Ứng dụng có sẵn nút quay lại trang chủ (Home) ở góc trên cùng bên trái. Giao diện trang bị sẵn hiển thị nhãn `VOL.01 / 2026` theo định dạng của Launcher.
3. **Ngôn ngữ**: Hiển thị, tài liệu và mã nguồn tuân thủ đặt tên tiếng Anh, kết hợp comment/tài liệu giải thích tiếng Việt rõ ràng.
4. **Responsive đỉnh cao**: Giao diện ứng dụng dự đoán góc được xây dựng với **Tailwind CSS**, thiết kế dạng Thẻ hiển thị (Cards / Grid) có thể scale hoàn hảo trên Mobile, Web, hoặc Tablet. Mỗi trang con hoạt động trơn tru.
5. **Độc lập 100%**: Mọi file logic tĩnh (`.ts`), `.json` và thành phần `.vue` tự do gói gọn hoàn toàn trong thư mục `src/views/corner/`. Không can thiệp ra ngoài phạm vi này.
6. **Không thêm dependency backend/python**: Tất cả các thao tác Data, Backend ML của bản gốc được "chuyển về hậu trường" (Offline). Giao diện online chỉ sử dụng các thư viện cho phép (Vue 3, Pinia, `@vueuse/core`, `TailwindCSS`). Tận dụng UI components chung.

---

## 3. Kiến Trúc Hệ Thống Offline & Online

```text
┌────────────────────────────────────────────────────────┐
│               MÔI TRƯỜNG OFFLINE (Máy Dev)             │
│   Python/MLPipeline ──▶ Huấn luyện & Data Extraction   │
│   (LightGBM + XGBoost + CSV football-data.co.uk)       │
└───────────────────────────┬────────────────────────────┘
                            │ (Xuất Model Result / Weights)
                            ▼ JSON Static Files
┌────────────────────────────────────────────────────────┐
│         MÔI TRƯỜNG ONLINE (vibe.j2team.org)            │
│   src/views/corner/                                    │
│    ├─ index.vue (Giao diện chính - Vue 3)              │
│    ├─ meta.ts (Thông tin SEO, Tác giả)                 │
│    ├─ components/ (Bảng phân tích, Thẻ dự đoán)        │
│    └─ data/ (Chứa pre-calculate json tĩnh)             │
│                                                        │
│   [Pinia] Xử lý State   [Tailwind CSS] Giao diện Đẹp   │
└────────────────────────────────────────────────────────┘
```

---

## 4. Nguồn Dữ Liệu Và Tiền Xử Lý (Offline)

Việc thu thập dữ liệu (ETL) được duy trì chạy trên **môi trường máy phát triển cục bộ**.
- Hệ thống kéo CSV từ `football-data.co.uk`, phân chia dữ liệu mùa giải (như 2020 đến 2026) với tính năng TimeSeriesSplit (tránh data leakage).
- Mục tiêu dự đoán: tổng góc liên tục hoặc tỷ lệ/biến nhị phân tại mỗi ngưỡng (Threshold).
- Dữ liệu thu thập sau đó sẽ được làm sạch thành những "con số chỉ số đội" (Rolling features theo 5 trận gần nhất, Venue-aware) và lưu sẵn vào Static JSON. Giao diện web online thuộc repo Vibe chỉ việc import và đọc (đảm bảo luật không có database).

---

## 5. Mô Hình LightGBM Classifier & XGBoost (Offline)

### 5.1. LightGBM (Tính xác suất theo ngưỡng)
Hệ thống offline có 5 mô hình riêng biệt tính từ ngưỡng 8.5 đến 12.5. Mỗi mô hình (Binary_Logloss) học mức độ quan trọng qua: `num_leaves=31`, `early_stopping_rounds=30`.

### 5.2. XGBoost (Hồi quy phân phối góc)
Hệ thống XGBoost sử dụng object `count:poisson` chuyên cho dữ liệu dạng "Đếm" (dữ liệu rời rạc, không âm như góc). Hồi quy của XGB sẽ dự đoán "Kỳ vọng góc", sau đó dịch qua đường Logistic Curve để tính ra xác suất P(Over).

---

## 6. Feature Engineering (Offline)

Sức mạnh thực sự nằm ở đặc trưng tạo ra (Tính toán Local, Build ra json phân phối Web):
- **Phạt Góc Cơ Bản**: `home_corners_avg`, `away_corners_avg` theo Exponential Moving Average (EMA). Trọng số trận mới cao hơn các trận cũ.
- **Dứt Điểm**: Số cú sút, sút trúng đích và chỉ số sút bị chặn - vốn là tương quan số một tới phạt góc.
- **Phong Độ**: Lịch thi đấu (ngày nghỉ phục hồi thể lực), hiệu số tổng bàn thắng.

---

## 7. Cơ Chế Ensemble Blending & Calibration

**Logic Inference Tĩnh (Phía Client - Vue 3):**
Thay vì thiết lập service Python, ứng dụng tải các trọng số json được Calibration và Ensemble (50% từ LGB, 50% từ dự đoán XGB). Nếu file `json` có ghi nhận mô hình dự báo Xác suất là `65% P(Over)`, logic TS trên Web Client sẽ xử lý việc so sánh với ngưỡng Confidence (`>0.52`) để in ra khuyến nghị cho giao diện.

```ts
// Ví dụ logic trên Front-End tại src/views/corner/store/
const getRecommendation = (probOver: number, probUnder: number) => {
    if (probOver > 0.52) return "OVER";
    if (probUnder > 0.52) return "UNDER";
    return "NO BET";
};
```

---

## 8. Vòng Lặp Phản Hồi (Offline Feedback Loop)

Do giới hạn hoàn toàn **không lưu trữ data**, chức năng **Auto-feedback** và vòng lặp backfill cập nhật trận đấu được tác giả triển khai riêng dưới dạng local bot hoặc script offline. 
- Mỗi khi có kết quả tuần mới, Bot offline sẽ cập nhật số liệu.
- Retrain hệ thống AI với `sample_weights` để trừng phạt nếu AI học sai.
- CI/CD tự động (hoặc copy tay) đẩy tệp static data JSON mới lên repo của Vibe. Người dùng web sẽ luôn nhận được dự đoán mới, chính xác nhất mà không cần Vibe gánh thêm Database.

---

## 9. Hệ Thống Front-end Vue 3 (Production)

Phiên bản SCOPE CORNER tại `vibe.j2team.org` được xây dựng hướng đến chuẩn SPA mượt mà, UX tuyệt đỉnh.

### 9.1 Tính năng UI tích hợp
- **Navigation Navbar chuẩn**: Có chứa tiêu đề `<app-name>`, text `VOL.01 / 2026` trên góc đỉnh, thanh điều hướng chứa nút Home (Quay lại `/`) nằm ngay góc trái.
- **Giao diện thẻ bài (Dashboard/Widgets)**: TailwindCSS grid. Bố cục có Thẻ Thông Kê (Cards) trực quan, cho người dùng biết xác suất Over/Under từng mức kèo (VD: O/U 10.5 Góc).

### 9.2 Trạng thái với Pinia & `@vueuse`
- Khi người dùng click vào cặp lịch thi đấu cụ thể, **Pinia Store** lưu State trận đang hiển thị mà không cần tải lại web.
- Kết hợp `@vueuse/core` để tạo hiệu ứng thao tác tiện dụng và xử lý media queries trên giao diện thay cho các media rule CSS quá lằng nhằng.

### 9.3 Mã Sạch, Dễ Sửa, Dễ Đọc
- Các thư mục trong `src/views/corner/` sẽ được chia thành `components` (các mảnh giao diện nhỏ thống nhất), `data` (JSON cứng từ ML), `composables` (Logic xử lý).
- Code Typescript sử dụng tiếng Anh chuẩn cho định nghĩa hàm, biến. Nhưng tận dụng **tối đa chú thích tiếng Việt** (Comments) để các anh em lập trình viên theo dõi và góp ý.

---

## 10. Kết Luận

Giải pháp của **SCOPE CORNER** trên `vibe.j2team.org` đã giải quyết bài toán lớn: Làm thế nào biến một hệ thống AI thống kê / Machine Learning cồng kềnh thành một Mini App nhẹ nhàng bằng quy chuẩn Frontend Vue3 Static:
1. Giải pháp Offline Data processing kết hợp Online Static Serving không vi phạm nguyên tắc "Database-less".
2. Tái tạo Giao diện (UI) tuyệt đẹp với Tailwind dựa trên hệ thống API thiết kế dự án.
3. Code đóng gói gọn gàng, hoạt động độc lập và minh bạch thông tin ở `meta.ts`.
4. Không chèn thêm dependency cồng kềnh, sử dụng các core module sẵn có và nhẹ nhất có thể!

*Đóng góp phát triển và tối ưu trải nghiệm luôn được hoan nghênh. Mã nguồn tại: `src/views/corner/`.*
