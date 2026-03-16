export const BachLo = `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bạch Lộ: Giọt Sương Trắng Ngưng Tụ & Nỗi Niềm Mùa Thu</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    
    <!-- Fonts: Philosopher (Tiêu đề - Tinh tế), Be Vietnam Pro (Nội dung - Trong sáng), Dancing Script (Thơ - Lãng mạn) -->
    <link href="https://fonts.googleapis.com/css2?family=Philosopher:ital,wght@0,400;0,700;1,400;1,700&family=Be+Vietnam+Pro:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400&family=Dancing+Script:wght@400;700&display=swap" rel="stylesheet">
    
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        'dew-white': '#F8F9FA',     // Trắng sương (Hành Kim/Tinh khôi)
                        'mist-gray': '#CED4DA',     // Xám bạc (Sương mù)
                        'cool-blue': '#A9D6E5',     // Xanh lam nhạt (Khí thu se lạnh)
                        'autumn-leaf': '#D4A373',   // Nâu vàng (Lá thu)
                        'deep-indigo': '#212529',   // Đen than (Đêm lạnh)
                        'pure-tea': '#606C38'       // Xanh trà (Thanh tao)
                    },
                    fontFamily: {
                        serif: ['"Philosopher"', 'serif'],
                        sans: ['"Be Vietnam Pro"', 'sans-serif'],
                        script: ['"Dancing Script"', 'cursive'],
                    },
                    animation: {
                        'fade-in': 'fadeIn 2s ease-in-out',
                        'float': 'float 4s ease-in-out infinite',
                    },
                    keyframes: {
                        fadeIn: {
                            '0%': { opacity: '0' },
                            '100%': { opacity: '1' },
                        },
                        float: {
                            '0%, 100%': { transform: 'translateY(0)' },
                            '50%': { transform: 'translateY(-10px)' },
                        }
                    }
                }
            }
        }
    </script>
    <style>
        body {
            background-color: #F8F9FA;
            color: #212529;
            scroll-behavior: smooth;
        }
        /* Chart Container Styling - Mandatory */
        .chart-container {
            position: relative;
            width: 100%;
            max-width: 600px;
            height: 350px;
            max-height: 400px;
            margin: 0 auto;
        }
        @media (max-width: 768px) {
            .chart-container {
                height: 300px;
            }
        }
        /* Dew Drop Canvas Layer */
        #dewCanvas {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 0;
            opacity: 0.5;
        }
        /* Interactions */
        .card-interaction {
            transition: all 0.3s ease-out;
            border: 1px solid transparent;
            background: rgba(255, 255, 255, 0.8);
            backdrop-filter: blur(5px);
        }
        .card-interaction:hover {
            transform: translateY(-5px);
            border-color: #A9D6E5;
            box-shadow: 0 10px 30px -10px rgba(169, 214, 229, 0.4);
        }
        .active-tab {
            background-color: #A9D6E5;
            color: #212529;
            border-color: #A9D6E5;
        }
        .no-scrollbar::-webkit-scrollbar {
            display: none;
        }
        .no-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
    </style>
    <!-- Chosen Palette: "Morning Dew" - Ethereal White, Soft Mist Gray, Pale Blue, touches of Autumn Brown -->
    <!-- Application Structure Plan:
        1. Hero: Title with "Dew Drop" visual cue (Canvas animation).
        2. Thien Tuong (Cosmic): Chart showing 165° & Condensation point (Temperature drops).
        3. Tam Hau (Nature): 3 Micro-seasons (Geese, Swallows, Birds storing food).
        4. Doi Song (Life): Tabs for Agriculture ("Cotton & Rice") & Customs ("Tea & Wine").
        5. Duong Sinh (Health): "White Dew Body Not Exposed" - Food Filter (White/Moist vs Cold/Spicy).
        6. Chiem Nghiem (Philosophy): Impermanence & Purity (Vo Thuong).
        7. Footer: Copyright Tich Phong Thien Son.
    -->
    <!-- Visualization & Content Choices:
        1. Solar Gauge: Chart.js Doughnut (165°).
        2. Temp Drop: Line Chart showing sharp drop in Night temperature vs Day.
        3. Food Filter: Logic for Lung-moistening foods (White foods like Pear, Lily bulb).
        4. Dew Animation: HTML5 Canvas for forming và dripping water droplets.
    -->
    <!-- CONFIRMATION: NO SVG graphics used. NO Mermaid JS used. -->
</head>
<body class="font-sans antialiased leading-relaxed selection:bg-cool-blue selection:text-deep-indigo">

    <!-- Background Animation -->
    <canvas id="dewCanvas"></canvas>

    <!-- Navigation -->
    <nav class="sticky top-0 z-50 bg-dew-white/90 backdrop-blur-md border-b border-mist-gray/30 shadow-sm transition-all duration-300">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between h-20 items-center">
                <div class="flex-shrink-0 flex items-center gap-3">
                    <span class="text-3xl filter drop-shadow-sm animate-float">💧</span>
                    <div class="flex flex-col">
                        <span class="text-2xl font-serif font-bold text-cool-blue tracking-wide">Bạch Lộ</span>
                        <span class="text-xs font-sans text-mist-gray uppercase tracking-widest font-bold">Giọt Sương Tinh Khôi</span>
                    </div>
                </div>
                <div class="hidden md:flex space-x-10">
                    <button onclick="scrollToSection('y-nghia')" class="text-deep-indigo hover:text-cool-blue transition font-medium tracking-wide text-sm uppercase">Ý Nghĩa</button>
                    <button onclick="scrollToSection('tam-hau')" class="text-deep-indigo hover:text-cool-blue transition font-medium tracking-wide text-sm uppercase">Tam Hậu</button>
                    <button onclick="scrollToSection('doi-song')" class="text-deep-indigo hover:text-cool-blue transition font-medium tracking-wide text-sm uppercase">Đời Sống</button>
                    <button onclick="scrollToSection('duong-sinh')" class="text-deep-indigo hover:text-cool-blue transition font-medium tracking-wide text-sm uppercase">Dưỡng Sinh</button>
                    <button onclick="scrollToSection('chiem-nghiem')" class="text-deep-indigo hover:text-cool-blue transition font-medium tracking-wide text-sm uppercase">Chiêm Nghiệm</button>
                </div>
            </div>
        </div>
    </nav>

    <!-- Hero Section -->
    <header class="relative pt-24 pb-20 px-4 text-center z-10 overflow-hidden">
        <div class="max-w-4xl mx-auto">
            <p class="text-cool-blue font-bold tracking-[0.3em] uppercase mb-6 text-sm font-sans">Tiết Khí Thứ 15 • 7-8 Tháng 9</p>
            <h1 class="text-6xl md:text-8xl font-serif font-bold text-deep-indigo mb-6 leading-tight relative inline-block animate-fade-in">
                Bạch Lộ
                <span class="absolute -top-4 -right-12 text-4xl animate-bounce text-dew-white drop-shadow-md">🌫️</span>
            </h1>
            <h2 class="text-3xl md:text-5xl font-script text-autumn-leaf mb-10 font-bold transform -rotate-1">
                Nỗi Niềm Của Mùa Thu
            </h2>
            <div class="w-24 h-1 bg-cool-blue mx-auto mb-10 rounded-full shadow-sm"></div>
            <p class="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto leading-loose font-light">
                "Khí âm trong đêm ngưng tụ hơi nước thành những hạt sương trắng xóa. Mùa thu chuyển mình từ mát mẻ sang se lạnh, mang theo vẻ đẹp của sự vô thường."
            </p>
            <div class="mt-14">
                <button onclick="scrollToSection('y-nghia')" class="group relative inline-flex items-center justify-center px-10 py-3 overflow-hidden font-serif italic tracking-wide text-deep-indigo transition duration-300 ease-out border border-cool-blue rounded-full shadow-md bg-white hover:bg-cool-blue">
                    <span class="absolute inset-0 flex items-center justify-center w-full h-full text-white duration-300 -translate-x-full bg-cool-blue group-hover:translate-x-0 ease">
                        <span class="text-xl">🍂</span>
                    </span>
                    <span class="absolute flex items-center justify-center w-full h-full text-deep-indigo transition-all duration-300 transform group-hover:translate-x-full ease">Khám Phá</span>
                    <span class="relative invisible">Khám Phá</span>
                </button>
            </div>
        </div>
    </header>

    <!-- Section 1: Ý Nghĩa & Thiên Tượng -->
    <section id="y-nghia" class="py-24 px-4 max-w-6xl mx-auto relative z-10">
        <div class="mb-16 text-center">
            <h3 class="text-4xl font-serif font-bold text-cool-blue mb-4 inline-block relative">
                Sự Kết Tinh Của Khí Thu
                <span class="absolute -bottom-2 left-0 w-full h-1 bg-mist-gray/50"></span>
            </h3>
            <p class="text-gray-500 max-w-2xl mx-auto mt-6 text-lg leading-relaxed">
                Mặt Trời kinh độ 165°. "Bạch" là trắng (màu của hành Kim/Mùa Thu), "Lộ" là sương. Khí lạnh ngưng tụ thành sương trắng, đánh dấu bước ngoặt nhiệt độ.
            </p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <!-- Charts Column -->
            <div class="space-y-10">
                <div class="bg-white p-8 rounded-2xl shadow-sm border border-mist-gray/20 relative overflow-hidden">
                    <h4 class="text-xl font-serif font-bold text-deep-indigo mb-2 text-center">Vị Trí Thiên Văn (165°)</h4>
                    <div class="chart-container">
                        <canvas id="solarChart"></canvas>
                    </div>
                </div>
                
                <div class="bg-white p-8 rounded-2xl shadow-sm border border-mist-gray/20">
                    <h4 class="text-xl font-serif font-bold text-cool-blue mb-2 text-center">Chênh Lệch Nhiệt Độ Ngày - Đêm</h4>
                    <div class="chart-container" style="height: 250px;">
                        <canvas id="tempGapChart"></canvas>
                    </div>
                    <p class="text-center text-sm text-gray-400 mt-4 italic">Ban ngày ấm, ban đêm lạnh nhanh -> Sương.</p>
                </div>
            </div>

            <!-- Content Explanation -->
            <div class="space-y-8 text-lg text-gray-600 leading-relaxed font-light">
                <div class="p-6 bg-white rounded-xl border-l-4 border-cool-blue shadow-sm">
                    <strong class="text-deep-indigo font-serif text-xl block mb-2">Ý Nghĩa Ngũ Hành</strong>
                    <p>
                        Mùa Thu thuộc hành Kim, màu đại diện là Trắng. Sương trắng (Bạch Lộ) là biểu tượng tinh khiết nhất của khí thu ngưng tụ.
                    </p>
                </div>
                <div>
                    <strong class="text-deep-indigo font-serif text-xl block mb-2">Đặc Điểm Khí Hậu</strong>
                    <p>
                        Chênh lệch nhiệt độ ngày đêm lớn nhất trong năm. Hơi nước gặp lạnh ban đêm không bay hơi mà đọng lại thành hạt trên cây cỏ.
                    </p>
                </div>
            </div>
        </div>
    </section>

    <!-- Section 2: Tam Hậu (Nature) -->
    <section id="tam-hau" class="py-24 bg-white relative z-10">
        <div class="max-w-6xl mx-auto px-4">
            <h3 class="text-3xl font-serif font-bold text-autumn-leaf mb-12 text-center">Tam Hậu: Ba Tín Hiệu Di Cư</h3>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                <!-- Card 1 -->
                <div class="card-interaction p-8 rounded-2xl cursor-default group text-center">
                    <div class="w-20 h-20 mx-auto rounded-full bg-cool-blue/20 flex items-center justify-center text-4xl mb-6 group-hover:scale-110 transition">🪿</div>
                    <h5 class="font-bold text-xl text-deep-indigo mb-3 font-serif">1. Hồng Nhạn Lai</h5>
                    <p class="text-gray-500 font-light">Chim nhạn (ngỗng trời) bắt đầu bay về phương Nam theo đội hình chữ V để tránh cái rét sắp tới.</p>
                </div>

                <!-- Card 2 -->
                <div class="card-interaction p-8 rounded-2xl cursor-default group text-center">
                    <div class="w-20 h-20 mx-auto rounded-full bg-deep-indigo/10 flex items-center justify-center text-4xl mb-6 group-hover:scale-110 transition">🐦</div>
                    <h5 class="font-bold text-xl text-deep-indigo mb-3 font-serif">2. Huyền Điểu Quy</h5>
                    <p class="text-gray-500 font-light">Chim én (huyền điểu) - sứ giả mùa xuân - cũng bắt đầu hành trình di cư về phương Nam ấm áp.</p>
                </div>

                <!-- Card 3 -->
                <div class="card-interaction p-8 rounded-2xl cursor-default group text-center">
                    <div class="w-20 h-20 mx-auto rounded-full bg-autumn-leaf/20 flex items-center justify-center text-4xl mb-6 group-hover:scale-110 transition">🥜</div>
                    <h5 class="font-bold text-xl text-deep-indigo mb-3 font-serif">3. Quần Điểu Dưỡng Tu</h5>
                    <p class="text-gray-500 font-light">Các loài chim ở lại bắt đầu tích trữ lương thực (hạt, quả) để chuẩn bị cho mùa đông khắc nghiệt.</p>
                </div>
            </div>
        </div>
    </section>

    <!-- Section 3: Đời Sống (Tabs) -->
    <section id="doi-song" class="py-24 px-4 bg-dew-white relative z-10">
        <div class="max-w-6xl mx-auto">
            <div class="mb-12 text-center">
                <h3 class="text-4xl font-serif font-bold text-deep-indigo mb-4">Mùa Gặt & Thưởng Trà</h3>
                <p class="text-gray-500 italic">"Bạch Lộ trà, Thu phân rượu"</p>
            </div>

            <!-- Custom Tabs -->
            <div class="flex justify-center mb-10 space-x-4">
                <button onclick="switchTab('phong-tuc')" id="btn-phong-tuc" class="active-tab px-8 py-3 rounded-full border border-cool-blue font-bold transition duration-300 font-serif tracking-wide shadow-sm">Phong Tục</button>
                <button onclick="switchTab('nong-nghiep')" id="btn-nong-nghiep" class="px-8 py-3 rounded-full border border-cool-blue text-deep-indigo font-bold hover:bg-cool-blue hover:text-white transition duration-300 font-serif tracking-wide shadow-sm">Nông Nghiệp</button>
            </div>

            <!-- Content Area -->
            <div class="bg-white p-8 md:p-12 rounded-3xl border border-gray-100 min-h-[400px] flex items-center shadow-sm relative overflow-hidden">
                <div class="absolute top-0 right-0 w-32 h-32 bg-pure-tea/10 rounded-bl-full pointer-events-none"></div>

                <!-- Phong Tuc Content -->
                <div id="content-phong-tuc" class="grid grid-cols-1 md:grid-cols-2 gap-10 w-full animate-fade-in">
                    <!-- Card 1 -->
                    <div class="bg-dew-white p-8 rounded-2xl border-l-4 border-pure-tea hover:bg-gray-50 transition group">
                        <div class="text-5xl mb-4 group-hover:scale-110 transition duration-300">🍵</div>
                        <h4 class="text-2xl font-serif font-bold text-deep-indigo mb-3">Thưởng Trà Bạch Lộ</h4>
                        <p class="text-gray-600 leading-relaxed font-light">
                            Trà hái vào tiết này có vị ngọt thanh, hương thơm dịu dàng, không chát như trà hạ cũng không non như trà xuân.
                        </p>
                    </div>
                    <!-- Card 2 -->
                    <div class="bg-dew-white p-8 rounded-2xl border-l-4 border-autumn-leaf hover:bg-gray-50 transition group">
                        <div class="text-5xl mb-4 group-hover:scale-110 transition duration-300">🍶</div>
                        <h4 class="text-2xl font-serif font-bold text-deep-indigo mb-3">Rượu Bạch Lộ</h4>
                        <p class="text-gray-600 leading-relaxed font-light">
                            Tục nấu rượu nếp vào tiết này để đãi khách. Rượu có vị ngọt, ấm, giúp trừ hàn khí khi trời trở lạnh.
                        </p>
                    </div>
                </div>

                <!-- Nong Nghiep Content -->
                <div id="content-nong-nghiep" class="hidden grid-cols-1 md:grid-cols-2 gap-10 w-full animate-fade-in">
                    <div class="flex flex-col justify-center">
                        <h4 class="text-3xl font-serif font-bold text-autumn-leaf mb-6">Thu Hoạch Khẩn Trương</h4>
                        <p class="text-gray-600 leading-relaxed mb-6">
                            Sương sớm tuy đẹp nhưng có thể gây hại cho mùa màng (sương muối).
                        </p>
                        <ul class="space-y-4 text-gray-500 font-light">
                            <li class="flex items-start gap-3">
                                <span class="text-cool-blue font-bold">🌾</span>
                                <span><strong>Lúa Mùa:</strong> Đang trổ bông, ngậm sữa, cần giữ ấm chân lúa.</span>
                            </li>
                            <li class="flex items-start gap-3">
                                <span class="text-dew-white font-bold bg-gray-300 rounded-full w-6 h-6 flex items-center justify-center text-xs">☁️</span>
                                <span><strong>Bông Vải:</strong> Nở rộ, cần thu hoạch gấp trước khi sương làm hỏng.</span>
                            </li>
                        </ul>
                    </div>
                    <div class="flex items-center justify-center bg-dew-white rounded-2xl p-6 border border-dashed border-gray-300">
                        <div class="text-center">
                            <div class="text-9xl mb-4 opacity-80 animate-pulse">☁️</div>
                            <p class="font-script text-2xl text-deep-indigo">Đồng bông trắng xóa</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Section 4: Dưỡng Sinh (Health) -->
    <section id="duong-sinh" class="py-24 px-4 max-w-6xl mx-auto relative z-10">
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-16">
            <!-- Left: Theory -->
            <div class="lg:col-span-5 space-y-8">
                <div>
                    <span class="text-mist-gray font-bold tracking-widest uppercase text-sm">Thu Táo • Tạng Phế</span>
                    <h3 class="text-4xl font-serif font-bold text-deep-indigo mt-2 mb-6">Bạch Lộ Thân Bất Lộ</h3>
                    <p class="text-gray-600 text-lg leading-relaxed mb-6">
                        Không để hở da thịt vì khí lạnh dễ xâm nhập. Khí trời hanh khô (Táo) cần dưỡng Phế, giữ ẩm.
                    </p>
                    <div class="bg-white p-6 rounded-xl border-l-4 border-mist-gray shadow-sm">
                        <h4 class="font-bold text-lg text-cool-blue mb-2 font-serif">Nguyên Tắc Ẩm Thực</h4>
                        <p class="text-gray-600 mb-2"><strong>Màu Trắng:</strong> Ăn thực phẩm màu trắng để bổ Phổi (Lê, Củ sen).</p>
                        <p class="text-gray-600"><strong>Nhuận Táo:</strong> Chọn đồ ăn nhiều nước, sinh tân dịch.</p>
                    </div>
                </div>

                <div class="space-y-4 font-sans text-gray-700">
                    <div class="flex items-center gap-4 p-3 bg-white rounded-lg shadow-sm">
                        <div class="w-10 h-10 rounded-full bg-autumn-leaf/20 flex items-center justify-center text-xl">🦶</div>
                        <div>
                            <strong>Giữ Ấm Chân:</strong> "Hàn tùng túc hạ sinh". Ngâm chân nước ấm trước khi ngủ.
                        </div>
                    </div>
                    <div class="flex items-center gap-4 p-3 bg-white rounded-lg shadow-sm">
                        <div class="w-10 h-10 rounded-full bg-autumn-leaf/20 flex items-center justify-center text-xl">🚫</div>
                        <div>
                            <strong>Không Cởi Trần:</strong> Đêm lạnh, cần mặc áo kín để bảo vệ Phế.
                        </div>
                    </div>
                </div>
            </div>

            <!-- Right: Interactive Food Filter -->
            <div class="lg:col-span-7">
                <div class="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden flex flex-col h-full">
                    <div class="bg-cool-blue p-8 text-deep-indigo">
                        <h4 class="text-2xl font-serif font-bold flex items-center gap-3">
                            <span>🍐</span> Thực Đơn Dưỡng Phế
                        </h4>
                        <p class="opacity-80 mt-2 font-light text-sm">Chọn thực phẩm màu trắng, tính nhuận.</p>
                    </div>

                    <!-- Filters -->
                    <div class="p-6 border-b border-gray-100 flex gap-3 overflow-x-auto no-scrollbar">
                        <button onclick="filterFood('all')" class="food-btn active px-5 py-2 rounded-full text-sm font-bold bg-deep-indigo text-white hover:bg-gray-800 transition whitespace-nowrap" data-filter="all">Tất Cả</button>
                        <button onclick="filterFood('good')" class="food-btn px-5 py-2 rounded-full text-sm font-bold bg-gray-100 text-gray-600 hover:bg-gray-200 transition whitespace-nowrap" data-filter="good">Nên Dùng (Trắng/Nhuận)</button>
                        <button onclick="filterFood('bad')" class="food-btn px-5 py-2 rounded-full text-sm font-bold bg-gray-100 text-gray-600 hover:bg-gray-200 transition whitespace-nowrap" data-filter="bad">Hạn Chế (Lạnh/Cay)</button>
                    </div>

                    <!-- Grid -->
                    <div id="food-grid" class="p-6 grid grid-cols-2 sm:grid-cols-3 gap-4 overflow-y-auto max-h-[500px] bg-dew-white">
                        <!-- JS populated -->
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Section 5: Chiêm Nghiệm (Philosophy) -->
    <section id="chiem-nghiem" class="py-32 bg-deep-indigo text-white text-center px-4 relative overflow-hidden">
        <!-- Abstract Background Shape -->
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cool-blue/10 rounded-full blur-[100px] pointer-events-none"></div>

        <div class="max-w-3xl mx-auto relative z-10">
            <span class="text-6xl text-mist-gray font-serif opacity-50 block mb-6">❝</span>
            
            <h3 class="text-4xl md:text-5xl font-serif font-bold mb-10 text-white leading-tight">
                Vẻ Đẹp Của Sự<br>Phù Du
            </h3>
            
            <p class="text-xl text-gray-300 leading-loose mb-12 font-sans font-light">
                Giọt sương long lanh như ngọc nhưng nắng lên là tan biến. Đời người cũng ngắn ngủi như vậy. Chính sự vô thường ấy làm nên vẻ đẹp quý giá của hiện tại. Hãy sống trong trẻo và trọn vẹn như giọt sương mai, để lại sự hiện diện thuần khiết cho đời.
            </p>

            <div class="inline-block border border-gray-600 rounded-2xl p-10 bg-white/5 backdrop-blur-sm hover:bg-white/10 transition duration-500 cursor-default group">
                <p class="font-bold uppercase tracking-[0.2em] text-sm text-cool-blue mb-6 font-sans group-hover:text-white transition">Lời Chúc Bạch Lộ</p>
                <div class="text-3xl md:text-4xl font-script text-mist-gray leading-relaxed group-hover:scale-105 transition duration-500">
                    "Tâm trong như sương,<br>Lòng an như đất."
                </div>
            </div>
            
            <span class="text-6xl text-mist-gray font-serif opacity-50 block mt-12">❞</span>
        </div>
    </section>

    <!-- Footer -->
    <footer class="bg-[#121416] text-gray-500 py-12 text-center text-sm font-sans border-t border-gray-800">
        <p class="italic tracking-wide mb-3 text-gray-600">Biên soạn dựa trên nguyên lý 24 Tiết khí & Văn hóa Phương Đông</p>
        <p class="text-gray-500">© Bản quyền thuộc về <span class="font-script text-xl text-cool-blue ml-1">Tịch Phong Thiên Sơn - 夕风天山</span></p>
    </footer>

    <!-- Javascript Logic -->
    <script>
        // --- Data ---
        const foodData = [
            { name: "Lê Hấp", type: "good", icon: "🍐", desc: "Nhuận phế, trị ho khan, tiêu đờm" },
            { name: "Củ Sen", type: "good", icon: "🪷", desc: "Thanh nhiệt, dưỡng huyết, an thần" },
            { name: "Ngân Nhĩ", type: "good", icon: "🍄", desc: "Dưỡng âm, bổ phổi, đẹp da" },
            { name: "Mật Ong", type: "good", icon: "🍯", desc: "Nhuận tràng, kháng khuẩn, bổ tỳ" },
            { name: "Khoai Lang", type: "good", icon: "🍠", desc: "Bổ tỳ vị, nhuận tràng" },
            { name: "Vừng Trắng", type: "good", icon: "⚪", desc: "Dưỡng huyết, nhuận táo" },
            { name: "Hải Sản Sống", type: "bad", icon: "🍣", desc: "Tính hàn, dễ gây lạnh bụng" },
            { name: "Kem Lạnh", type: "bad", icon: "🍦", desc: "Hại Phế khí và Tỳ vị" },
            { name: "Ớt Cay", type: "bad", icon: "🌶️", desc: "Gây khô nóng, hại tân dịch" }
        ];

        // --- Tab Logic ---
        function switchTab(tab) {
            document.getElementById('content-phong-tuc').classList.add('hidden');
            document.getElementById('content-phong-tuc').classList.remove('grid');
            document.getElementById('content-nong-nghiep').classList.add('hidden');
            document.getElementById('content-nong-nghiep').classList.remove('grid');

            document.getElementById('btn-phong-tuc').classList.remove('active-tab', 'text-deep-indigo');
            document.getElementById('btn-phong-tuc').classList.add('text-deep-indigo'); // Default color
            document.getElementById('btn-nong-nghiep').classList.remove('active-tab', 'text-deep-indigo');
            document.getElementById('btn-nong-nghiep').classList.add('text-deep-indigo');

            const content = document.getElementById(\`content-\${tab}\`);
            content.classList.remove('hidden');
            content.classList.add('grid');
            
            const btn = document.getElementById(\`btn-\${tab}\`);
            btn.classList.add('active-tab');
        }

        // --- Food Filter Logic ---
        function filterFood(filter) {
            const grid = document.getElementById('food-grid');
            grid.innerHTML = ''; 

            document.querySelectorAll('.food-btn').forEach(btn => {
                if(btn.dataset.filter === filter) {
                    btn.classList.add('bg-deep-indigo', 'text-white');
                    btn.classList.remove('bg-gray-100', 'text-gray-600');
                } else {
                    btn.classList.remove('bg-deep-indigo', 'text-white');
                    btn.classList.add('bg-gray-100', 'text-gray-600');
                }
            });

            const items = filter === 'all' ? foodData : foodData.filter(i => i.type === filter);

            items.forEach(item => {
                const el = document.createElement('div');
                let colorClass = item.type === 'good' 
                    ? 'bg-blue-50 border-blue-100 text-blue-900' 
                    : 'bg-red-50 border-red-100 text-red-900 opacity-70';

                el.className = \`\${colorClass} border rounded-xl p-4 flex flex-col items-center text-center transition hover:scale-105 cursor-default group\`;
                el.innerHTML = \`
    <div class="text-4xl mb-3 transform group-hover:scale-110 transition shadow-text">\${item.icon} </div>
        <div class="font-serif font-bold text-base mb-1 tracking-wide shadow-text">\${item.name} </div>
            <div class="text-xs opacity-70 font-sans shadow-text">\${item.desc} </div>
                \`;
                grid.appendChild(el);
            });
        }

        // --- Scroll Logic ---
        function scrollToSection(id) {
            const el = document.getElementById(id);
            const offset = 80;
            const bodyRect = document.body.getBoundingClientRect().top;
            const elementRect = el.getBoundingClientRect().top;
            const elementPosition = elementRect - bodyRect;
            const offsetPosition = elementPosition - offset;

            window.scrollTo({
                top: offsetPosition,
                behavior: "smooth"
            });
        }

        // --- Canvas Animation (Dew Drops) ---
        function initDewCanvas() {
            const canvas = document.getElementById('dewCanvas');
            const ctx = canvas.getContext('2d');
            let width, height;
            let drops = [];

            function resize() {
                width = window.innerWidth;
                height = window.innerHeight;
                canvas.width = width;
                canvas.height = height;
            }
            window.addEventListener('resize', resize);
            resize();

            class DewDrop {
                constructor() {
                    this.x = Math.random() * width;
                    this.y = Math.random() * height;
                    this.size = Math.random() * 3;
                    this.speed = Math.random() * 0.2 + 0.1;
                    this.opacity = Math.random() * 0.5 + 0.2;
                }
                update() {
                    this.y += this.speed;
                    if (this.y > height) {
                        this.y = -10;
                        this.x = Math.random() * width;
                    }
                }
                draw() {
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                    ctx.fillStyle = \`rgba(169, 214, 229, \${this.opacity})\`; // Cool Blue
                    ctx.fill();
                }
            }

            for(let i=0; i<50; i++) drops.push(new DewDrop());

            function animate() {
                ctx.clearRect(0, 0, width, height);
                drops.forEach(d => {
                    d.update();
                    d.draw();
                });
                requestAnimationFrame(animate);
            }
            animate();
        }

        // --- Init ---
        document.addEventListener('DOMContentLoaded', () => {
            initDewCanvas();
            filterFood('all');

            // Chart 1: Solar Term 165 deg
            const ctx1 = document.getElementById('solarChart').getContext('2d');
            new Chart(ctx1, {
                type: 'doughnut',
                data: {
                    labels: ['Bạch Lộ', 'Thu Phân', 'Hàn Lộ', 'Mùa Khác'],
                    datasets: [{
                        data: [15, 15, 15, 315],
                        backgroundColor: ['#A9D6E5', '#CED4DA', '#CED4DA', '#212529'],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    rotation: 75, 
                    cutout: '75%',
                    plugins: {
                        legend: { display: false },
                        tooltip: { enabled: false }
                    }
                },
                plugins: [{
                    id: 'textCenter',
                    beforeDraw: function(chart) {
                        var width = chart.width, height = chart.height, ctx = chart.ctx;
                        ctx.restore();
                        ctx.font = "bold 20px 'Philosopher', serif";
                        ctx.textBaseline = "middle";
                        ctx.fillStyle = "#A9D6E5";
                        var text = "165°",
                            textX = Math.round((width - ctx.measureText(text).width) / 2),
                            textY = height / 2;
                        ctx.fillText(text, textX, textY);
                        ctx.save();
                    }
                }]
            });

            // Chart 2: Temp Gap (Line)
            const ctx2 = document.getElementById('tempGapChart').getContext('2d');
            new Chart(ctx2, {
                type: 'line',
                data: {
                    labels: ['Xử Thử', 'Bạch Lộ (Đầu)', 'Bạch Lộ (Cuối)', 'Thu Phân'],
                    datasets: [
                        {
                            label: 'Nhiệt Độ Ngày',
                            data: [30, 28, 26, 24],
                            borderColor: '#D4A373', // Autumn Leaf
                            tension: 0.4
                        },
                        {
                            label: 'Nhiệt Độ Đêm',
                            data: [22, 18, 15, 12], // Drops faster
                            borderColor: '#A9D6E5', // Cool Blue
                            tension: 0.4
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: { grid: { display: false } },
                        x: { 
                            grid: { display: false },
                            ticks: { font: { family: "'Be Vietnam Pro'" } }
                        }
                    },
                    plugins: {
                        legend: { 
                            position: 'bottom',
                            labels: { font: { family: "'Be Vietnam Pro'" } }
                        },
                        tooltip: {
                            callbacks: {
                                footer: () => 'Chênh lệch lớn tạo sương.'
                            }
                        }
                    }
                }
            });
        });
    </script>
</body>
</html>
`
