export const XuThu = `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Xử Thử: Điểm Dừng Của Nắng Hạ & Sự Tĩnh Tại Tâm Hồn</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    
    <!-- Fonts: Philosopher (Tiêu đề - Trầm lắng), Be Vietnam Pro (Nội dung - Chân phương), Dancing Script (Thơ - Sâu sắc) -->
    <link href="https://fonts.googleapis.com/css2?family=Philosopher:ital,wght@0,400;0,700;1,400;1,700&family=Be+Vietnam+Pro:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400&family=Dancing+Script:wght@400;700&display=swap" rel="stylesheet">
    
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        'cool-gray': '#E0E1DD',     // Xám khói (Tĩnh lặng/Nền)
                        'autumn-blue': '#778DA9',   // Xanh lam nhạt (Khí thu mát mẻ)
                        'harvest-brown': '#9B2226', // Nâu đỏ (Lúa chín/Lá phong)
                        'fading-heat': '#E9C46A',   // Vàng nhạt (Nắng cuối hạ)
                        'deep-night': '#1B263B',    // Xanh đêm (Sâu lắng)
                        'lantern-light': '#F4A261'  // Cam ánh đèn
                    },
                    fontFamily: {
                        serif: ['"Philosopher"', 'serif'],
                        sans: ['"Be Vietnam Pro"', 'sans-serif'],
                        script: ['"Dancing Script"', 'cursive'],
                    },
                    animation: {
                        'float-lantern': 'floatLantern 8s ease-in-out infinite',
                    },
                    keyframes: {
                        floatLantern: {
                            '0%, 100%': { transform: 'translateY(0) rotate(2deg)' },
                            '50%': { transform: 'translateY(-15px) rotate(-2deg)' },
                        }
                    }
                }
            }
        }
    </script>
    <style>
        body {
            background-color: #E0E1DD;
            color: #1B263B;
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
        /* Lantern Canvas Layer */
        #lanternCanvas {
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
        }
        .card-interaction:hover {
            transform: translateY(-5px);
            border-color: #778DA9;
            box-shadow: 0 10px 30px -10px rgba(119, 141, 169, 0.3);
            background-color: white;
        }
        .active-tab {
            background-color: #1B263B;
            color: white;
            border-color: #1B263B;
        }
        .no-scrollbar::-webkit-scrollbar {
            display: none;
        }
        .no-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
    </style>
    <!-- Chosen Palette: "Fading Summer" - Cool Gray, Autumn Blue, Harvest Brown -->
    <!-- Application Structure Plan:
        1. Hero: Title with "Floating Lantern" visual cue (Canvas animation).
        2. Thien Tuong (Cosmic): Chart showing 150° & Temperature dropping significantly.
        3. Tam Hau (Nature): 3 Micro-seasons (Eagle Hunting, Wither, Harvest).
        4. Doi Song (Life): Tabs for Agriculture ("Harvest Gold") & Customs ("Lanterns", "Duck").
        5. Duong Sinh (Health): "Moisten Dryness" - Food Filter (Moist/Sour vs Spicy/Dry).
        6. Chiem Nghiem (Philosophy): Knowing When to Stop (Tri Chi).
        7. Footer: Copyright Tich Phong Thien Son.
    -->
    <!-- Visualization & Content Choices:
        1. Solar Gauge: Chart.js Doughnut (150°).
        2. Temp Shift: Line Chart showing Day/Night temp gap widening.
        3. Food Filter: Logic for Lung-moistening foods (Lily bulb, Honey).
        4. Lantern Animation: HTML5 Canvas for floating lanterns on water.
    -->
    <!-- CONFIRMATION: NO SVG graphics used. NO Mermaid JS used. -->
</head>
<body class="font-sans antialiased leading-relaxed selection:bg-autumn-blue selection:text-white">

    <!-- Background Animation -->
    <canvas id="lanternCanvas"></canvas>

    <!-- Navigation -->
    <nav class="sticky top-0 z-50 bg-cool-gray/95 backdrop-blur-md border-b border-autumn-blue/30 shadow-sm transition-all duration-300">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between h-20 items-center">
                <div class="flex-shrink-0 flex items-center gap-3">
                    <span class="text-3xl filter drop-shadow-sm animate-float-lantern">🏮</span>
                    <div class="flex flex-col">
                        <span class="text-2xl font-serif font-bold text-deep-night tracking-wide">Xử Thử</span>
                        <span class="text-xs font-sans text-autumn-blue uppercase tracking-widest font-bold">Điểm Dừng Của Nắng Hạ</span>
                    </div>
                </div>
                <div class="hidden md:flex space-x-10">
                    <button onclick="scrollToSection('y-nghia')" class="text-deep-night hover:text-autumn-blue transition font-medium tracking-wide text-sm uppercase">Ý Nghĩa</button>
                    <button onclick="scrollToSection('tam-hau')" class="text-deep-night hover:text-autumn-blue transition font-medium tracking-wide text-sm uppercase">Tam Hậu</button>
                    <button onclick="scrollToSection('doi-song')" class="text-deep-night hover:text-autumn-blue transition font-medium tracking-wide text-sm uppercase">Đời Sống</button>
                    <button onclick="scrollToSection('duong-sinh')" class="text-deep-night hover:text-autumn-blue transition font-medium tracking-wide text-sm uppercase">Dưỡng Sinh</button>
                    <button onclick="scrollToSection('chiem-nghiem')" class="text-deep-night hover:text-autumn-blue transition font-medium tracking-wide text-sm uppercase">Chiêm Nghiệm</button>
                </div>
            </div>
        </div>
    </nav>

    <!-- Hero Section -->
    <header class="relative pt-24 pb-20 px-4 text-center z-10 overflow-hidden">
        <div class="max-w-4xl mx-auto">
            <p class="text-autumn-blue font-bold tracking-[0.3em] uppercase mb-6 text-sm font-sans">Tiết Khí Thứ 14 • 22-23 Tháng 8</p>
            <h1 class="text-6xl md:text-8xl font-serif font-bold text-deep-night mb-6 leading-tight relative inline-block">
                Xử Thử
                <span class="absolute -top-4 -right-12 text-4xl animate-bounce text-fading-heat">🍂</span>
            </h1>
            <h2 class="text-3xl md:text-5xl font-script text-harvest-brown mb-10 font-bold transform -rotate-1">
                Khi Cái Nóng "Ẩn Mình"
            </h2>
            <div class="w-24 h-1 bg-autumn-blue mx-auto mb-10 rounded-full shadow-sm"></div>
            <p class="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-loose font-light">
                "Cái nóng oi bức của mùa hè đến đây là kết thúc. Khí hỏa lui về ẩn nấp, nhường chỗ cho sự mát lành và tĩnh tại của mùa thu."
            </p>
            <div class="mt-14">
                <button onclick="scrollToSection('y-nghia')" class="group relative inline-flex items-center justify-center px-10 py-3 overflow-hidden font-serif italic tracking-wide text-white transition duration-300 ease-out border-2 border-autumn-blue rounded-full shadow-md bg-autumn-blue">
                    <span class="absolute inset-0 flex items-center justify-center w-full h-full text-white duration-300 -translate-x-full bg-deep-night group-hover:translate-x-0 ease">
                        <span class="text-xl">🛑</span>
                    </span>
                    <span class="absolute flex items-center justify-center w-full h-full text-white transition-all duration-300 transform group-hover:translate-x-full ease">Khám Phá</span>
                    <span class="relative invisible">Khám Phá</span>
                </button>
            </div>
        </div>
    </header>

    <!-- Section 1: Ý Nghĩa & Thiên Tượng -->
    <section id="y-nghia" class="py-24 px-4 max-w-6xl mx-auto relative z-10">
        <div class="mb-16 text-center">
            <h3 class="text-4xl font-serif font-bold text-autumn-blue mb-4 inline-block relative">
                Sự Chuyển Giao Triệt Để
                <span class="absolute -bottom-2 left-0 w-full h-1 bg-fading-heat"></span>
            </h3>
            <p class="text-gray-600 max-w-2xl mx-auto mt-6 text-lg leading-relaxed">
                Mặt Trời kinh độ 150°. "Xử" là dừng lại, ẩn náu. "Thử" là nắng nóng. Xử Thử là thời điểm cái nóng mùa hè chấm dứt, khí hậu chuyển từ Nóng sang Mát.
            </p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <!-- Charts Column -->
            <div class="space-y-10">
                <div class="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
                    <h4 class="text-xl font-serif font-bold text-deep-night mb-2 text-center">Vị Trí Thiên Văn (150°)</h4>
                    <div class="chart-container">
                        <canvas id="solarChart"></canvas>
                    </div>
                </div>
                
                <div class="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                    <h4 class="text-xl font-serif font-bold text-harvest-brown mb-2 text-center">Biên Độ Nhiệt Ngày & Đêm</h4>
                    <div class="chart-container" style="height: 250px;">
                        <canvas id="tempDiffChart"></canvas>
                    </div>
                    <p class="text-center text-sm text-gray-400 mt-4 italic">Ban ngày còn ấm (Thu lão hổ), ban đêm se lạnh.</p>
                </div>
            </div>

            <!-- Content Explanation -->
            <div class="space-y-8 text-lg text-gray-600 leading-relaxed font-light">
                <div class="p-6 bg-white rounded-xl border-l-4 border-autumn-blue shadow-sm">
                    <strong class="text-deep-night font-serif text-xl block mb-2">Ý Nghĩa Tên Gọi</strong>
                    <p>
                        "Xử" mang hàm ý lui về, chấm dứt. Đây là cột mốc quan trọng đánh dấu sự rút lui của khí Dương và sự trỗi dậy mạnh mẽ hơn của khí Âm.
                    </p>
                </div>
                <div>
                    <strong class="text-deep-night font-serif text-xl block mb-2">Đặc Điểm Khí Hậu</strong>
                    <p>
                        Không khí bắt đầu khô hanh (Thu táo). Chênh lệch nhiệt độ giữa ngày và đêm tăng lên rõ rệt, sáng sớm và đêm khuya trời lạnh.
                    </p>
                </div>
            </div>
        </div>
    </section>

    <!-- Section 2: Tam Hậu (Nature) -->
    <section id="tam-hau" class="py-24 bg-white relative z-10">
        <div class="max-w-6xl mx-auto px-4">
            <h3 class="text-3xl font-serif font-bold text-harvest-brown mb-12 text-center">Tam Hậu: Ba Tín Hiệu Của Sự Chuyển Mùa</h3>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                <!-- Card 1 -->
                <div class="card-interaction bg-cool-gray p-8 rounded-2xl cursor-default group text-center">
                    <div class="w-20 h-20 mx-auto rounded-full bg-deep-night/20 flex items-center justify-center text-4xl mb-6 group-hover:scale-110 transition">🦅</div>
                    <h5 class="font-bold text-xl text-deep-night mb-3 font-serif">1. Ưng Nãi Tế Điểu</h5>
                    <p class="text-gray-600 font-light">Chim ưng bắt đầu săn bắt các loài chim nhỏ, bày ra như đang cúng tế trời đất, chuẩn bị tích trữ năng lượng.</p>
                </div>

                <!-- Card 2 -->
                <div class="card-interaction bg-cool-gray p-8 rounded-2xl cursor-default group text-center">
                    <div class="w-20 h-20 mx-auto rounded-full bg-autumn-blue/20 flex items-center justify-center text-4xl mb-6 group-hover:scale-110 transition">🍂</div>
                    <h5 class="font-bold text-xl text-deep-night mb-3 font-serif">2. Thiên Địa Thủy Túc</h5>
                    <p class="text-gray-600 font-light">Khí trời và đất bắt đầu trở nên nghiêm nghị, vạn vật điêu tàn dần, lá cây bắt đầu rụng nhiều.</p>
                </div>

                <!-- Card 3 -->
                <div class="card-interaction bg-cool-gray p-8 rounded-2xl cursor-default group text-center">
                    <div class="w-20 h-20 mx-auto rounded-full bg-harvest-brown/20 flex items-center justify-center text-4xl mb-6 group-hover:scale-110 transition">🌾</div>
                    <h5 class="font-bold text-xl text-deep-night mb-3 font-serif">3. Hòa Nãi Đăng</h5>
                    <p class="text-gray-600 font-light">Các loại lúa và ngũ cốc mùa thu bắt đầu chín vàng, báo hiệu một mùa gặt bội thu sắp tới.</p>
                </div>
            </div>
        </div>
    </section>

    <!-- Section 3: Đời Sống (Tabs) -->
    <section id="doi-song" class="py-24 px-4 bg-cool-gray relative z-10">
        <div class="max-w-6xl mx-auto">
            <div class="mb-12 text-center">
                <h3 class="text-4xl font-serif font-bold text-deep-night mb-4">Mùa Gặt & Lễ Vu Lan</h3>
                <p class="text-gray-600 italic">"Xử Thử ăn vịt, không bệnh tật"</p>
            </div>

            <!-- Custom Tabs -->
            <div class="flex justify-center mb-10 space-x-4">
                <button onclick="switchTab('phong-tuc')" id="btn-phong-tuc" class="active-tab px-8 py-3 rounded-full border border-autumn-blue font-bold transition duration-300 font-serif tracking-wide shadow-sm">Phong Tục</button>
                <button onclick="switchTab('nong-nghiep')" id="btn-nong-nghiep" class="px-8 py-3 rounded-full border border-autumn-blue text-deep-night font-bold hover:bg-autumn-blue hover:text-white transition duration-300 font-serif tracking-wide shadow-sm">Nông Nghiệp</button>
            </div>

            <!-- Content Area -->
            <div class="bg-white p-8 md:p-12 rounded-3xl border border-gray-100 min-h-[400px] flex items-center shadow-sm relative overflow-hidden">
                <div class="absolute top-0 right-0 w-32 h-32 bg-lantern-light/10 rounded-bl-full pointer-events-none"></div>

                <!-- Phong Tuc Content -->
                <div id="content-phong-tuc" class="grid grid-cols-1 md:grid-cols-2 gap-10 w-full animate-fade-in">
                    <!-- Card 1 -->
                    <div class="bg-cool-gray p-8 rounded-2xl border-l-4 border-lantern-light hover:bg-gray-100 transition group">
                        <div class="text-5xl mb-4 group-hover:scale-110 transition duration-300">🏮</div>
                        <h4 class="text-2xl font-serif font-bold text-deep-night mb-3">Thả Đèn Hoa Đăng</h4>
                        <p class="text-gray-600 leading-relaxed font-light">
                            Dịp Rằm tháng Bảy (Vu Lan/Trung Nguyên). Thả đèn trên sông để tưởng nhớ người đã khuất và cầu siêu cho các vong linh.
                        </p>
                    </div>
                    <!-- Card 2 -->
                    <div class="bg-cool-gray p-8 rounded-2xl border-l-4 border-autumn-blue hover:bg-gray-100 transition group">
                        <div class="text-5xl mb-4 group-hover:scale-110 transition duration-300">🦆</div>
                        <h4 class="text-2xl font-serif font-bold text-deep-night mb-3">Ăn Thịt Vịt</h4>
                        <p class="text-gray-600 leading-relaxed font-light">
                            Vịt có tính mát, bổ âm, giúp thanh nhiệt và dưỡng vị, rất thích hợp để cân bằng cơ thể trong mùa thu khô hanh.
                        </p>
                    </div>
                </div>

                <!-- Nong Nghiep Content -->
                <div id="content-nong-nghiep" class="hidden grid-cols-1 md:grid-cols-2 gap-10 w-full animate-fade-in">
                    <div class="flex flex-col justify-center">
                        <h4 class="text-3xl font-serif font-bold text-harvest-brown mb-6">Mùa Vàng Thu Hoạch</h4>
                        <p class="text-gray-700 leading-relaxed mb-6">
                            Nắng thu hanh hao là điều kiện lý tưởng để phơi phóng nông sản.
                        </p>
                        <ul class="space-y-4 text-gray-600 font-light">
                            <li class="flex items-start gap-3">
                                <span class="text-autumn-blue font-bold">🌾</span>
                                <span><strong>Thu Hoạch:</strong> Gặt lúa mùa sớm và các loại hoa màu.</span>
                            </li>
                            <li class="flex items-start gap-3">
                                <span class="text-deep-night font-bold">💧</span>
                                <span><strong>Chống Hạn:</strong> Phòng "Thu táo" (khô hạn), giữ nước cho lúa muộn.</span>
                            </li>
                        </ul>
                    </div>
                    <div class="flex items-center justify-center bg-cool-gray rounded-2xl p-6 border border-dashed border-gray-300">
                        <div class="text-center">
                            <div class="text-9xl mb-4 opacity-80 animate-pulse">🚜</div>
                            <p class="font-script text-2xl text-deep-night">Đồng vàng trĩu hạt</p>
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
                    <span class="text-autumn-blue font-bold tracking-widest uppercase text-sm">Hành Kim • Táo Khí</span>
                    <h3 class="text-4xl font-serif font-bold text-deep-night mt-2 mb-6">Nhuận Táo, Dưỡng Âm</h3>
                    <p class="text-gray-600 text-lg leading-relaxed mb-6">
                        Khí hậu khô hanh dễ gây khô họng, ho khan. Cần bổ sung tân dịch, tránh làm tổn thương Phế âm.
                    </p>
                    <div class="bg-white p-6 rounded-xl border-l-4 border-autumn-blue shadow-sm">
                        <h4 class="font-bold text-lg text-autumn-blue mb-2 font-serif">Nguyên Tắc Ẩm Thực</h4>
                        <p class="text-gray-600 mb-2"><strong>Đồ Nhuận:</strong> Mật ong, lê, ngân nhĩ giúp sinh tân dịch.</p>
                        <p class="text-gray-600"><strong>Bớt Cay:</strong> Tránh hành, ớt làm hao tổn khí âm.</p>
                    </div>
                </div>

                <div class="space-y-4 font-sans text-gray-700">
                    <div class="flex items-center gap-4 p-3 bg-white rounded-lg shadow-sm">
                        <div class="w-10 h-10 rounded-full bg-deep-night/10 flex items-center justify-center text-xl">🛌</div>
                        <div>
                            <strong>Ngủ Nghỉ:</strong> Ngủ sớm dưỡng âm, dậy sớm hít thở khí dương.
                        </div>
                    </div>
                    <div class="flex items-center gap-4 p-3 bg-white rounded-lg shadow-sm">
                        <div class="w-10 h-10 rounded-full bg-deep-night/10 flex items-center justify-center text-xl">🧣</div>
                        <div>
                            <strong>Giữ Ấm:</strong> Chú ý vùng bụng, không mặc quá phong phanh khi trời lạnh.
                        </div>
                    </div>
                </div>
            </div>

            <!-- Right: Interactive Food Filter -->
            <div class="lg:col-span-7">
                <div class="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden flex flex-col h-full">
                    <div class="bg-deep-night p-8 text-white">
                        <h4 class="text-2xl font-serif font-bold flex items-center gap-3">
                            <span>🍯</span> Thực Đơn Nhuận Phế
                        </h4>
                        <p class="opacity-90 mt-2 font-light text-sm">Chọn thực phẩm dưỡng âm, trị khô háo.</p>
                    </div>

                    <!-- Filters -->
                    <div class="p-6 border-b border-gray-100 flex gap-3 overflow-x-auto no-scrollbar">
                        <button onclick="filterFood('all')" class="food-btn active px-5 py-2 rounded-full text-sm font-bold bg-gray-100 text-gray-600 hover:bg-gray-200 transition whitespace-nowrap" data-filter="all">Tất Cả</button>
                        <button onclick="filterFood('good')" class="food-btn px-5 py-2 rounded-full text-sm font-bold bg-gray-100 text-gray-600 hover:bg-gray-200 transition whitespace-nowrap" data-filter="good">Nên Dùng (Nhuận/Mát)</button>
                        <button onclick="filterFood('bad')" class="food-btn px-5 py-2 rounded-full text-sm font-bold bg-gray-100 text-gray-600 hover:bg-gray-200 transition whitespace-nowrap" data-filter="bad">Hạn Chế (Cay/Lạnh)</button>
                    </div>

                    <!-- Grid -->
                    <div id="food-grid" class="p-6 grid grid-cols-2 sm:grid-cols-3 gap-4 overflow-y-auto max-h-[500px] bg-cool-gray">
                        <!-- JS populated -->
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Section 5: Chiêm Nghiệm (Philosophy) -->
    <section id="chiem-nghiem" class="py-32 bg-deep-night text-white text-center px-4 relative overflow-hidden">
        <!-- Abstract Background Shape -->
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-autumn-blue/10 rounded-full blur-[100px] pointer-events-none"></div>

        <div class="max-w-3xl mx-auto relative z-10">
            <span class="text-6xl text-fading-heat font-serif opacity-50 block mb-6">❝</span>
            
            <h3 class="text-4xl md:text-5xl font-serif font-bold mb-10 text-white leading-tight">
                Nghệ Thuật Của Sự<br>Biết Dừng
            </h3>
            
            <p class="text-xl text-gray-300 leading-loose mb-12 font-sans font-light">
                Biết tiến là dũng khí, biết dừng là trí tuệ. Xử Thử dạy ta cách dừng lại những ham muốn, những tranh đấu để tìm về sự tĩnh tại. Dừng lại một chút để lắng nghe tiếng lòng và cảm nhận sự viên mãn của mùa thu.
            </p>

            <div class="inline-block border border-gray-600 rounded-2xl p-10 bg-white/5 backdrop-blur-sm hover:bg-white/10 transition duration-500 cursor-default group">
                <p class="font-bold uppercase tracking-[0.2em] text-sm text-autumn-blue mb-6 font-sans group-hover:text-white transition">Lời Chúc Xử Thử</p>
                <div class="text-3xl md:text-4xl font-script text-fading-heat leading-relaxed group-hover:scale-105 transition duration-500">
                    "Thân tâm an tịnh,<br>Vạn sự tùy duyên."
                </div>
            </div>
            
            <span class="text-6xl text-fading-heat font-serif opacity-50 block mt-12">❞</span>
        </div>
    </section>

    <!-- Footer -->
    <footer class="bg-[#0d131e] text-gray-400 py-12 text-center text-sm font-sans border-t border-gray-800">
        <p class="italic tracking-wide mb-3 text-gray-500">Biên soạn dựa trên nguyên lý 24 Tiết khí & Văn hóa Phương Đông</p>
        <p class="text-gray-400">© Bản quyền thuộc về <span class="font-script text-xl text-autumn-blue ml-1">Tịch Phong Thiên Sơn - 夕风天山</span></p>
    </footer>

    <!-- Javascript Logic -->
    <script>
        // --- Data ---
        const foodData = [
            { name: "Thịt Vịt", type: "good", icon: "🦆", desc: "Bổ âm, thanh nhiệt, dưỡng vị" },
            { name: "Quả Lê", type: "good", icon: "🍐", desc: "Nhuận phế, sinh tân, giảm ho" },
            { name: "Mía", type: "good", icon: "🎋", desc: "Giải khát, trừ khô nóng" },
            { name: "Củ Sen", type: "good", icon: "🪷", desc: "Mát máu, an thần" },
            { name: "Mật Ong", type: "good", icon: "🍯", desc: "Nhuận tràng, bổ tỳ vị" },
            { name: "Ngân Nhĩ", type: "good", icon: "🍄", desc: "Dưỡng âm, làm đẹp da" },
            { name: "Ớt Cay", type: "bad", icon: "🌶️", desc: "Hao tổn tân dịch, gây khô" },
            { name: "Kem Lạnh", type: "bad", icon: "🍦", desc: "Hại tỳ vị đang yếu" },
            { name: "Hạt Tiêu", type: "bad", icon: "🧂", desc: "Tính nóng, không tốt cho Phế" }
        ];

        // --- Tab Logic ---
        function switchTab(tab) {
            document.getElementById('content-phong-tuc').classList.add('hidden');
            document.getElementById('content-phong-tuc').classList.remove('grid');
            document.getElementById('content-nong-nghiep').classList.add('hidden');
            document.getElementById('content-nong-nghiep').classList.remove('grid');

            document.getElementById('btn-phong-tuc').classList.remove('active-tab', 'text-white');
            document.getElementById('btn-phong-tuc').classList.add('text-deep-night');
            document.getElementById('btn-nong-nghiep').classList.remove('active-tab', 'text-white');
            document.getElementById('btn-nong-nghiep').classList.add('text-deep-night');

            const content = document.getElementById(\`content-\${tab}\`);
            content.classList.remove('hidden');
            content.classList.add('grid');
            
            const btn = document.getElementById(\`btn-\${tab}\`);
            btn.classList.add('active-tab');
            btn.classList.remove('text-deep-night');
        }

        // --- Food Filter Logic ---
        function filterFood(filter) {
            const grid = document.getElementById('food-grid');
            grid.innerHTML = ''; 

            document.querySelectorAll('.food-btn').forEach(btn => {
                if(btn.dataset.filter === filter) {
                    btn.classList.add('bg-deep-night', 'text-white');
                    btn.classList.remove('bg-gray-100', 'text-gray-600');
                } else {
                    btn.classList.remove('bg-deep-night', 'text-white');
                    btn.classList.add('bg-gray-100', 'text-gray-600');
                }
            });

            const items = filter === 'all' ? foodData : foodData.filter(i => i.type === filter);

            items.forEach(item => {
                const el = document.createElement('div');
                let colorClass = item.type === 'good' 
                    ? 'bg-blue-50 border-blue-100 text-blue-900' 
                    : 'bg-orange-50 border-orange-100 text-orange-900 opacity-70';

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

        // --- Canvas Animation (Floating Lanterns) ---
        function initLanternCanvas() {
            const canvas = document.getElementById('lanternCanvas');
            const ctx = canvas.getContext('2d');
            let width, height;
            let lanterns = [];

            function resize() {
                width = window.innerWidth;
                height = window.innerHeight;
                canvas.width = width;
                canvas.height = height;
            }
            window.addEventListener('resize', resize);
            resize();

            class Lantern {
                constructor() {
                    this.x = Math.random() * width;
                    this.y = Math.random() * height + height; // Start below
                    this.width = 15;
                    this.height = 20;
                    this.speed = Math.random() * 0.5 + 0.2;
                    this.sway = Math.random() * 0.5;
                    this.color = '#F4A261'; // Lantern light
                }
                update() {
                    this.y -= this.speed;
                    this.x += Math.sin(this.y * 0.01) * this.sway;
                    if (this.y < -50) {
                        this.y = height + 50;
                        this.x = Math.random() * width;
                    }
                }
                draw() {
                    ctx.save();
                    ctx.translate(this.x, this.y);
                    ctx.fillStyle = this.color;
                    ctx.shadowBlur = 15;
                    ctx.shadowColor = this.color;
                    
                    // Simple lantern shape
                    ctx.beginPath();
                    ctx.rect(-this.width/2, -this.height/2, this.width, this.height);
                    ctx.fill();
                    
                    ctx.restore();
                }
            }

            for(let i=0; i<12; i++) lanterns.push(new Lantern());

            function animate() {
                ctx.clearRect(0, 0, width, height);
                lanterns.forEach(l => {
                    l.update();
                    l.draw();
                });
                requestAnimationFrame(animate);
            }
            animate();
        }

        // --- Init ---
        document.addEventListener('DOMContentLoaded', () => {
            initLanternCanvas();
            filterFood('all');

            // Chart 1: Solar Term 150 deg
            const ctx1 = document.getElementById('solarChart').getContext('2d');
            new Chart(ctx1, {
                type: 'doughnut',
                data: {
                    labels: ['Xử Thử', 'Bạch Lộ', 'Thu Phân', 'Mùa Khác'],
                    datasets: [{
                        data: [15, 15, 15, 315],
                        backgroundColor: ['#1B263B', '#778DA9', '#E0E1DD', '#F5F5F5'],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    rotation: 60, 
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
                        ctx.fillStyle = "#1B263B";
                        var text = "150°",
                            textX = Math.round((width - ctx.measureText(text).width) / 2),
                            textY = height / 2;
                        ctx.fillText(text, textX, textY);
                        ctx.save();
                    }
                }]
            });

            // Chart 2: Temp Shift (Line)
            const ctx2 = document.getElementById('tempDiffChart').getContext('2d');
            new Chart(ctx2, {
                type: 'line',
                data: {
                    labels: ['Lập Thu', 'Xử Thử', 'Bạch Lộ'],
                    datasets: [
                        {
                            label: 'Nhiệt Độ Ngày',
                            data: [32, 30, 28],
                            borderColor: '#E9C46A',
                            tension: 0.4
                        },
                        {
                            label: 'Nhiệt Độ Đêm',
                            data: [26, 22, 18],
                            borderColor: '#778DA9',
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
                        title: {
                            display: true,
                            text: 'Chênh Lệch Nhiệt Độ Ngày - Đêm',
                            font: { family: "'Be Vietnam Pro'" }
                        }
                    }
                }
            });
        });
    </script>
</body>
</html>
`
