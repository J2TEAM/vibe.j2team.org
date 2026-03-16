export const TieuThu = `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tiểu Thử: Khúc Dạo Đầu Của Mùa Nắng Lửa</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    
    <!-- Fonts: Philosopher (Tiêu đề - Sâu lắng), Be Vietnam Pro (Nội dung - Mạch lạc), Dancing Script (Thơ - Bay bổng) -->
    <link href="https://fonts.googleapis.com/css2?family=Philosopher:ital,wght@0,400;0,700;1,400;1,700&family=Be+Vietnam+Pro:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400&family=Dancing+Script:wght@400;700&display=swap" rel="stylesheet">
    
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        'heat-orange': '#FB8500',   // Cam lửa (Nắng nóng)
                        'lotus-pink': '#FFB5A7',    // Hồng sen (Giải nhiệt/Thanh tao)
                        'straw-yellow': '#FFD166',  // Vàng rơm (Phơi phóng)
                        'deep-green': '#2D6A4F',    // Xanh lá đậm (Bóng râm/Cây cối)
                        'steam-white': '#FDFCDC',   // Trắng hơi nước
                        'earth-dry': '#9D8189'      // Nâu đất khô
                    },
                    fontFamily: {
                        serif: ['"Philosopher"', 'serif'],
                        sans: ['"Be Vietnam Pro"', 'sans-serif'],
                        script: ['"Dancing Script"', 'cursive'],
                    },
                    animation: {
                        'shimmer': 'shimmer 2s infinite',
                    },
                    keyframes: {
                        shimmer: {
                            '0%': { opacity: '0.8' },
                            '50%': { opacity: '1' },
                            '100%': { opacity: '0.8' },
                        }
                    }
                }
            }
        }
    </script>
    <style>
        body {
            background-color: #FDFCDC;
            color: #2D6A4F;
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
        /* Heat Haze Canvas Layer */
        #heatCanvas {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 0;
            opacity: 0.3;
        }
        /* Interactions */
        .card-interaction {
            transition: all 0.3s ease-out;
            border: 1px solid transparent;
        }
        .card-interaction:hover {
            transform: translateY(-5px);
            border-color: #FB8500;
            box-shadow: 0 10px 30px -10px rgba(251, 133, 0, 0.2);
            background-color: white;
        }
        .active-tab {
            background-color: #FB8500;
            color: white;
            border-color: #FB8500;
        }
        .no-scrollbar::-webkit-scrollbar {
            display: none;
        }
        .no-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
    </style>
    <!-- Chosen Palette: "Simmering Heat" - Burning Orange, Cooling Lotus Pink, Deep Shade Green -->
    <!-- Application Structure Plan:
        1. Hero: Title with "Heat Haze" visual cue (Canvas animation).
        2. Thien Tuong (Cosmic): Chart showing 105° & Temperature rising towards peak.
        3. Tam Hau (Nature): 3 Micro-seasons (Hot Wind, Crickets in Walls, Hawks).
        4. Doi Song (Life): Tabs for Agriculture ("Flood Prevention") & Customs ("Sun Drying", "Lotus").
        5. Duong Sinh (Health): "Calm Heart/Clear Heat" - Food Filter (Lotus/Eel vs Cold/Raw).
        6. Chiem Nghiem (Philosophy): Patience & Tempering (Su Toi Luyen).
        7. Footer: Copyright Tich Phong Thien Son.
    -->
    <!-- Visualization & Content Choices:
        1. Solar Gauge: Chart.js Doughnut (105°).
        2. Heat Index: Line Chart showing rising Temp & Humidity (Sauna effect).
        3. Food Filter: Logic for Heart-calming/Heat-clearing foods (Lotus root, Mung bean).
        4. Heat Animation: HTML5 Canvas for shimmering heat waves.
    -->
    <!-- CONFIRMATION: NO SVG graphics used. NO Mermaid JS used. -->
</head>
<body class="font-sans antialiased leading-relaxed selection:bg-heat-orange selection:text-white">

    <!-- Background Animation -->
    <canvas id="heatCanvas"></canvas>

    <!-- Navigation -->
    <nav class="sticky top-0 z-50 bg-steam-white/95 backdrop-blur-md border-b border-heat-orange/20 shadow-sm transition-all duration-300">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between h-20 items-center">
                <div class="flex-shrink-0 flex items-center gap-3">
                    <span class="text-3xl filter drop-shadow-sm animate-shimmer">🔥</span>
                    <div class="flex flex-col">
                        <span class="text-2xl font-serif font-bold text-heat-orange tracking-wide">Tiểu Thử</span>
                        <span class="text-xs font-sans text-deep-green uppercase tracking-widest font-bold">Nắng Nóng Chớm Nở</span>
                    </div>
                </div>
                <div class="hidden md:flex space-x-10">
                    <button onclick="scrollToSection('y-nghia')" class="text-deep-green hover:text-heat-orange transition font-medium tracking-wide text-sm uppercase">Ý Nghĩa</button>
                    <button onclick="scrollToSection('tam-hau')" class="text-deep-green hover:text-heat-orange transition font-medium tracking-wide text-sm uppercase">Tam Hậu</button>
                    <button onclick="scrollToSection('doi-song')" class="text-deep-green hover:text-heat-orange transition font-medium tracking-wide text-sm uppercase">Đời Sống</button>
                    <button onclick="scrollToSection('duong-sinh')" class="text-deep-green hover:text-heat-orange transition font-medium tracking-wide text-sm uppercase">Dưỡng Sinh</button>
                    <button onclick="scrollToSection('chiem-nghiem')" class="text-deep-green hover:text-heat-orange transition font-medium tracking-wide text-sm uppercase">Chiêm Nghiệm</button>
                </div>
            </div>
        </div>
    </nav>

    <!-- Hero Section -->
    <header class="relative pt-24 pb-20 px-4 text-center z-10 overflow-hidden">
        <div class="max-w-4xl mx-auto">
            <p class="text-heat-orange font-bold tracking-[0.3em] uppercase mb-6 text-sm font-sans">Tiết Khí Thứ 11 • 7-8 Tháng 7</p>
            <h1 class="text-6xl md:text-8xl font-serif font-bold text-deep-green mb-6 leading-tight relative inline-block">
                Tiểu Thử
                <span class="absolute -top-4 -right-12 text-4xl animate-bounce text-straw-yellow">☀️</span>
            </h1>
            <h2 class="text-3xl md:text-5xl font-script text-lotus-pink mb-10 font-bold transform -rotate-1">
                Khúc Dạo Đầu Của Mùa Nắng Lửa
            </h2>
            <div class="w-24 h-1 bg-heat-orange mx-auto mb-10 rounded-full shadow-[0_0_15px_#FB8500]"></div>
            <p class="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-loose font-light">
                "Cái nóng thực sự bắt đầu nhen nhóm. Không khí như nồi xông hơi, thử thách sự kiên nhẫn. Nhưng trong cái nắng lửa ấy, hoa sen vẫn nở rộ, tỏa hương thanh khiết."
            </p>
            <div class="mt-14">
                <button onclick="scrollToSection('y-nghia')" class="group relative inline-flex items-center justify-center px-10 py-3 overflow-hidden font-serif italic tracking-wide text-white transition duration-300 ease-out border-2 border-heat-orange rounded-full shadow-md bg-heat-orange">
                    <span class="absolute inset-0 flex items-center justify-center w-full h-full text-white duration-300 -translate-x-full bg-deep-green group-hover:translate-x-0 ease">
                        <span class="text-xl">🥵</span>
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
            <h3 class="text-4xl font-serif font-bold text-deep-green mb-4 inline-block relative">
                Cái Nóng Còn E Ấp
                <span class="absolute -bottom-2 left-0 w-full h-1 bg-lotus-pink"></span>
            </h3>
            <p class="text-gray-600 max-w-2xl mx-auto mt-6 text-lg leading-relaxed">
                Mặt Trời kinh độ 105°. "Tiểu" là nhỏ, "Thử" là nắng nóng. Tuy gọi là nhỏ nhưng nhiệt độ đã rất cao, mở đầu cho "Tam Phục" - chuỗi ngày nóng nhất năm.
            </p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <!-- Charts Column -->
            <div class="space-y-10">
                <div class="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
                    <h4 class="text-xl font-serif font-bold text-heat-orange mb-2 text-center">Vị Trí Thiên Văn (105°)</h4>
                    <div class="chart-container">
                        <canvas id="solarChart"></canvas>
                    </div>
                </div>
                
                <div class="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                    <h4 class="text-xl font-serif font-bold text-deep-green mb-2 text-center">Chỉ Số "Xông Hơi"</h4>
                    <div class="chart-container" style="height: 250px;">
                        <canvas id="heatIndexChart"></canvas>
                    </div>
                    <p class="text-center text-sm text-gray-400 mt-4 italic">Nhiệt độ cao kết hợp độ ẩm lớn.</p>
                </div>
            </div>

            <!-- Content Explanation -->
            <div class="space-y-8 text-lg text-gray-600 leading-relaxed font-light">
                <div class="p-6 bg-white rounded-xl border-l-4 border-heat-orange shadow-sm">
                    <strong class="text-deep-green font-serif text-xl block mb-2">Đặc Điểm Thời Tiết</strong>
                    <p>
                        "Nóng và Ẩm". Gió Đông Nam mang hơi nước gặp nhiệt độ cao tạo cảm giác oi bức, ngột ngạt. Đây là lúc con người dễ cảm thấy bứt rứt nhất.
                    </p>
                </div>
                <div>
                    <strong class="text-deep-green font-serif text-xl block mb-2">Ý Nghĩa Tên Gọi</strong>
                    <p>
                        Người xưa cho rằng cái nóng chưa đến cực điểm (Đại Thử) nên gọi là Tiểu Thử. Tuy nhiên, đây là giai đoạn khởi động cho những thử thách khắc nghiệt nhất của mùa hè.
                    </p>
                </div>
            </div>
        </div>
    </section>

    <!-- Section 2: Tam Hậu (Nature) -->
    <section id="tam-hau" class="py-24 bg-white relative z-10">
        <div class="max-w-6xl mx-auto px-4">
            <h3 class="text-3xl font-serif font-bold text-heat-orange mb-12 text-center">Tam Hậu: Ba Tín Hiệu Nắng Nóng</h3>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                <!-- Card 1 -->
                <div class="card-interaction bg-steam-white p-8 rounded-2xl cursor-default group text-center">
                    <div class="w-20 h-20 mx-auto rounded-full bg-heat-orange/20 flex items-center justify-center text-4xl mb-6 group-hover:scale-110 transition">🌬️</div>
                    <h5 class="font-bold text-xl text-deep-green mb-3 font-serif">1. Ôn Phong Chí</h5>
                    <p class="text-gray-600 font-light">Gió nóng bắt đầu thổi. Không còn làn gió mát, gió lúc này mang theo hơi nóng hầm hập như lò nung.</p>
                </div>

                <!-- Card 2 -->
                <div class="card-interaction bg-steam-white p-8 rounded-2xl cursor-default group text-center">
                    <div class="w-20 h-20 mx-auto rounded-full bg-earth-dry/20 flex items-center justify-center text-4xl mb-6 group-hover:scale-110 transition">🦗</div>
                    <h5 class="font-bold text-xl text-deep-green mb-3 font-serif">2. Dế Mèn Ở Vách</h5>
                    <p class="text-gray-600 font-light">Mặt đất quá nóng, dế mèn phải rời hang tìm nơi mát mẻ hơn trên các kẽ nứt tường vách.</p>
                </div>

                <!-- Card 3 -->
                <div class="card-interaction bg-steam-white p-8 rounded-2xl cursor-default group text-center">
                    <div class="w-20 h-20 mx-auto rounded-full bg-lotus-pink/20 flex items-center justify-center text-4xl mb-6 group-hover:scale-110 transition">🦅</div>
                    <h5 class="font-bold text-xl text-deep-green mb-3 font-serif">3. Ưng Thủy Chí</h5>
                    <p class="text-gray-600 font-light">Chim ưng con bắt đầu tập bay và săn mồi. Sự tôi luyện bản lĩnh trong điều kiện khắc nghiệt.</p>
                </div>
            </div>
        </div>
    </section>

    <!-- Section 3: Đời Sống (Tabs) -->
    <section id="doi-song" class="py-24 px-4 bg-steam-white relative z-10">
        <div class="max-w-6xl mx-auto">
            <div class="mb-12 text-center">
                <h3 class="text-4xl font-serif font-bold text-heat-orange mb-4">Mùa Phơi Phóng & Thưởng Sen</h3>
                <p class="text-gray-600 italic">"Tiểu Thử lươn vàng béo như sâm"</p>
            </div>

            <!-- Custom Tabs -->
            <div class="flex justify-center mb-10 space-x-4">
                <button onclick="switchTab('phong-tuc')" id="btn-phong-tuc" class="active-tab px-8 py-3 rounded-full border border-heat-orange font-bold transition duration-300 font-serif tracking-wide shadow-sm">Phong Tục</button>
                <button onclick="switchTab('nong-nghiep')" id="btn-nong-nghiep" class="px-8 py-3 rounded-full border border-heat-orange text-heat-orange font-bold hover:bg-heat-orange hover:text-white transition duration-300 font-serif tracking-wide shadow-sm">Nông Nghiệp</button>
            </div>

            <!-- Content Area -->
            <div class="bg-white p-8 md:p-12 rounded-3xl border border-gray-100 min-h-[400px] flex items-center shadow-sm relative overflow-hidden">
                <div class="absolute top-0 right-0 w-32 h-32 bg-straw-yellow/10 rounded-bl-full pointer-events-none"></div>

                <!-- Phong Tuc Content -->
                <div id="content-phong-tuc" class="grid grid-cols-1 md:grid-cols-2 gap-10 w-full animate-fade-in">
                    <div class="grid grid-cols-1 gap-6">
                        <!-- Item 1 -->
                        <div class="flex items-start gap-4">
                            <div class="text-3xl text-heat-orange">👕</div>
                            <div>
                                <h4 class="font-serif font-bold text-deep-green text-lg">Phơi Đồ (Sái Phục)</h4>
                                <p class="text-sm text-gray-600 mt-1">Tận dụng nắng gắt để phơi quần áo, sách vở, diệt khuẩn và chống ẩm mốc do độ ẩm cao.</p>
                            </div>
                        </div>
                        <!-- Item 2 -->
                        <div class="flex items-start gap-4">
                            <div class="text-3xl text-lotus-pink">🪷</div>
                            <div>
                                <h4 class="font-serif font-bold text-deep-green text-lg">Thưởng Sen</h4>
                                <p class="text-sm text-gray-600 mt-1">Hoa sen nở rộ nhất. Ngắm hoa, thưởng trà sen là thú vui tao nhã xua tan cái nóng.</p>
                            </div>
                        </div>
                        <!-- Item 3 -->
                        <div class="flex items-start gap-4">
                            <div class="text-3xl text-straw-yellow">🍚</div>
                            <div>
                                <h4 class="font-serif font-bold text-deep-green text-lg">Thực Tân (Ăn Cơm Mới)</h4>
                                <p class="text-sm text-gray-600 mt-1">Cúng tổ tiên bằng gạo mới sau vụ thu hoạch, chia sẻ hương vị mùa màng với xóm giềng.</p>
                            </div>
                        </div>
                    </div>
                    <div class="flex items-center justify-center bg-steam-white rounded-2xl p-6 border border-dashed border-gray-300">
                        <div class="text-center">
                            <div class="text-9xl mb-4 opacity-80 animate-pulse">🌞</div>
                            <p class="font-script text-2xl text-deep-green">Nắng vàng hong khô</p>
                        </div>
                    </div>
                </div>

                <!-- Nong Nghiep Content -->
                <div id="content-nong-nghiep" class="hidden grid-cols-1 md:grid-cols-2 gap-10 w-full animate-fade-in">
                    <div class="flex flex-col justify-center">
                        <h4 class="text-3xl font-serif font-bold text-deep-green mb-6">Quản Lý Nước & Mùa Vụ</h4>
                        <p class="text-gray-700 leading-relaxed mb-6">
                            Giai đoạn cây trồng phát triển nhanh nhưng cũng đầy rủi ro thiên tai.
                        </p>
                        <ul class="space-y-4 text-gray-600 font-light">
                            <li class="flex items-start gap-3">
                                <span class="text-heat-orange font-bold">🌪️</span>
                                <span><strong>Phòng Chống Bão:</strong> Mùa bão nhiệt đới, cần khơi thông dòng chảy.</span>
                            </li>
                            <li class="flex items-start gap-3">
                                <span class="text-deep-green font-bold">🌾</span>
                                <span><strong>Chăm Sóc:</strong> Cây lúa, hoa màu lớn nhanh, cần nhiều nước và phân bón.</span>
                            </li>
                        </ul>
                    </div>
                    <div class="flex items-center justify-center bg-steam-white rounded-2xl p-6 border border-dashed border-gray-300">
                        <div class="text-center">
                            <div class="text-9xl mb-4 opacity-80">🚜</div>
                            <p class="font-script text-2xl text-deep-green">Nhà nông bận rộn</p>
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
                    <span class="text-lotus-pink font-bold tracking-widest uppercase text-sm">Kiện Tỳ • Dưỡng Tâm</span>
                    <h3 class="text-4xl font-serif font-bold text-deep-green mt-2 mb-6">Giải Nhiệt, Không Tham Lạnh</h3>
                    <p class="text-gray-600 text-lg leading-relaxed mb-6">
                        Khí hậu nóng ẩm gây bứt rứt, chán ăn ("Khổ hạ"). Cần thanh nhiệt nhưng tránh đồ quá lạnh hại Tỳ.
                    </p>
                    <div class="bg-white p-6 rounded-xl border-l-4 border-lotus-pink shadow-sm">
                        <h4 class="font-bold text-lg text-lotus-pink mb-2 font-serif">Nguyên Tắc Ẩm Thực</h4>
                        <p class="text-gray-600 mb-2"><strong>Thanh Nhiệt:</strong> Ngó sen, Đậu xanh, Lươn vàng (bổ khí huyết).</p>
                        <p class="text-gray-600"><strong>Tránh Lạnh:</strong> Khí ẩm đang vượng, ăn lạnh dễ tiêu chảy.</p>
                    </div>
                </div>

                <div class="space-y-4 font-sans text-gray-700">
                    <div class="flex items-center gap-4 p-3 bg-white rounded-lg shadow-sm">
                        <div class="w-10 h-10 rounded-full bg-heat-orange/10 flex items-center justify-center text-xl">🧘</div>
                        <div>
                            <strong>Tâm Tĩnh:</strong> "Tâm tĩnh tự nhiên lương". Giữ bình thản để bớt nóng.
                        </div>
                    </div>
                    <div class="flex items-center gap-4 p-3 bg-white rounded-lg shadow-sm">
                        <div class="w-10 h-10 rounded-full bg-heat-orange/10 flex items-center justify-center text-xl">😴</div>
                        <div>
                            <strong>Ngủ Trưa:</strong> Phục hồi năng lượng cho Tim, tránh mất ngủ.
                        </div>
                    </div>
                </div>
            </div>

            <!-- Right: Interactive Food Filter -->
            <div class="lg:col-span-7">
                <div class="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden flex flex-col h-full">
                    <div class="bg-deep-green p-8 text-white">
                        <h4 class="text-2xl font-serif font-bold flex items-center gap-3">
                            <span>🍵</span> Thực Đơn Tiêu Thử
                        </h4>
                        <p class="opacity-90 mt-2 font-light text-sm">Chọn thực phẩm giải nhiệt và bồi bổ khí huyết.</p>
                    </div>

                    <!-- Filters -->
                    <div class="p-6 border-b border-gray-100 flex gap-3 overflow-x-auto no-scrollbar">
                        <button onclick="filterFood('all')" class="food-btn active px-5 py-2 rounded-full text-sm font-bold bg-gray-100 text-gray-600 hover:bg-gray-200 transition whitespace-nowrap" data-filter="all">Tất Cả</button>
                        <button onclick="filterFood('good')" class="food-btn px-5 py-2 rounded-full text-sm font-bold bg-gray-100 text-gray-600 hover:bg-gray-200 transition whitespace-nowrap" data-filter="good">Nên Dùng (Mát/Bổ)</button>
                        <button onclick="filterFood('bad')" class="food-btn px-5 py-2 rounded-full text-sm font-bold bg-gray-100 text-gray-600 hover:bg-gray-200 transition whitespace-nowrap" data-filter="bad">Hạn Chế (Lạnh/Sống)</button>
                    </div>

                    <!-- Grid -->
                    <div id="food-grid" class="p-6 grid grid-cols-2 sm:grid-cols-3 gap-4 overflow-y-auto max-h-[500px] bg-steam-white">
                        <!-- JS populated -->
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Section 5: Chiêm Nghiệm (Philosophy) -->
    <section id="chiem-nghiem" class="py-32 bg-deep-green text-white text-center px-4 relative overflow-hidden">
        <!-- Abstract Background Shape -->
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-heat-orange/20 rounded-full blur-[100px] pointer-events-none"></div>

        <div class="max-w-3xl mx-auto relative z-10">
            <span class="text-6xl text-straw-yellow font-serif opacity-50 block mb-6">❝</span>
            
            <h3 class="text-4xl md:text-5xl font-serif font-bold mb-10 text-white leading-tight">
                Sự Tôi Luyện Trong<br>Khắc Nghiệt
            </h3>
            
            <p class="text-xl text-gray-300 leading-loose mb-12 font-sans font-light">
                Cái nóng không phải là sự hủy diệt, mà là môi trường để trưởng thành. Không có áp lực, không có kết tinh ngọt ngào. Hãy coi Tiểu Thử là lò bát quái luyện nên bản lĩnh. Đi qua nắng lửa mới thấu hiểu giá trị của bóng mát.
            </p>

            <div class="inline-block border border-gray-500 rounded-2xl p-10 bg-white/5 backdrop-blur-sm hover:bg-white/10 transition duration-500 cursor-default group">
                <p class="font-bold uppercase tracking-[0.2em] text-sm text-straw-yellow mb-6 font-sans group-hover:text-white transition">Lời Chúc Tiểu Thử</p>
                <div class="text-3xl md:text-4xl font-script text-lotus-pink leading-relaxed group-hover:scale-105 transition duration-500">
                    "Tâm sen thanh tịnh,<br>Lòng vững như đồng."
                </div>
            </div>
            
            <span class="text-6xl text-straw-yellow font-serif opacity-50 block mt-12">❞</span>
        </div>
    </section>

    <!-- Footer -->
    <footer class="bg-[#1a3c2f] text-gray-400 py-12 text-center text-sm font-sans border-t border-gray-800">
        <p class="italic tracking-wide mb-3 text-gray-500">Biên soạn dựa trên nguyên lý 24 Tiết khí & Văn hóa Phương Đông</p>
        <p class="text-gray-400">© Bản quyền thuộc về <span class="font-script text-xl text-heat-orange ml-1">Tịch Phong Thiên Sơn - 夕风天山</span></p>
    </footer>

    <!-- Javascript Logic -->
    <script>
        // --- Data ---
        const foodData = [
            { name: "Ngó Sen", type: "good", icon: "🪷", desc: "Mát máu, an thần, thanh nhiệt" },
            { name: "Đậu Xanh", type: "good", icon: "🫘", desc: "Giải độc, tiêu thử cực tốt" },
            { name: "Lươn Vàng", type: "good", icon: "🐍", desc: "Bồi bổ khí huyết, mạnh gân cốt" },
            { name: "Dưa Hấu", type: "good", icon: "🍉", desc: "Giải khát, sinh tân dịch" },
            { name: "Bí Đao", type: "good", icon: "🍈", desc: "Lợi tiểu, thanh nhiệt" },
            { name: "Chanh Muối", type: "good", icon: "🍋", desc: "Bù nước, điện giải" },
            { name: "Nước Đá", type: "bad", icon: "🧊", desc: "Gây lạnh bụng, tiêu chảy" },
            { name: "Đồ Sống", type: "bad", icon: "🥗", desc: "Hại tỳ vị trong mùa thấp nhiệt" },
            { name: "Kem Lạnh", type: "bad", icon: "🍦", desc: "Gây sốc nhiệt" }
        ];

        // --- Tab Logic ---
        function switchTab(tab) {
            document.getElementById('content-nong-nghiep').classList.add('hidden');
            document.getElementById('content-nong-nghiep').classList.remove('grid');
            document.getElementById('content-phong-tuc').classList.add('hidden');
            document.getElementById('content-phong-tuc').classList.remove('grid');

            document.getElementById('btn-nong-nghiep').classList.remove('active-tab', 'text-white');
            document.getElementById('btn-nong-nghiep').classList.add('text-heat-orange');
            document.getElementById('btn-phong-tuc').classList.remove('active-tab', 'text-white');
            document.getElementById('btn-phong-tuc').classList.add('text-heat-orange');

            const content = document.getElementById(\`content-\${tab}\`);
            content.classList.remove('hidden');
            content.classList.add('grid');
            
            const btn = document.getElementById(\`btn-\${tab}\`);
            btn.classList.add('active-tab');
            btn.classList.remove('text-heat-orange');
        }

        // --- Food Filter Logic ---
        function filterFood(filter) {
            const grid = document.getElementById('food-grid');
            grid.innerHTML = ''; 

            document.querySelectorAll('.food-btn').forEach(btn => {
                if(btn.dataset.filter === filter) {
                    btn.classList.add('bg-deep-green', 'text-white');
                    btn.classList.remove('bg-gray-100', 'text-gray-600');
                } else {
                    btn.classList.remove('bg-deep-green', 'text-white');
                    btn.classList.add('bg-gray-100', 'text-gray-600');
                }
            });

            const items = filter === 'all' ? foodData : foodData.filter(i => i.type === filter);

            items.forEach(item => {
                const el = document.createElement('div');
                let colorClass = item.type === 'good' 
                    ? 'bg-green-50 border-green-100 text-green-900' 
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

        // --- Canvas Animation (Heat Haze) ---
        function initHeatCanvas() {
            const canvas = document.getElementById('heatCanvas');
            const ctx = canvas.getContext('2d');
            let width, height;
            let particles = [];

            function resize() {
                width = window.innerWidth;
                height = window.innerHeight;
                canvas.width = width;
                canvas.height = height;
            }
            window.addEventListener('resize', resize);
            resize();

            class Particle {
                constructor() {
                    this.x = Math.random() * width;
                    this.y = Math.random() * height;
                    this.vx = Math.random() * 0.5 - 0.25;
                    this.vy = Math.random() * -1 - 0.5; // Rise up
                    this.size = Math.random() * 3 + 1;
                    this.opacity = Math.random() * 0.3;
                }
                update() {
                    this.x += this.vx + Math.sin(this.y * 0.05) * 0.5; // Wavy motion
                    this.y += this.vy;
                    if (this.y < 0) {
                        this.y = height;
                        this.x = Math.random() * width;
                    }
                }
                draw() {
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                    ctx.fillStyle = \`rgba(251, 133, 0, \${this.opacity})\`; // Heat Orange
                    ctx.fill();
                }
            }

            for(let i=0; i<50; i++) particles.push(new Particle());

            function animate() {
                ctx.clearRect(0, 0, width, height);
                particles.forEach(p => {
                    p.update();
                    p.draw();
                });
                requestAnimationFrame(animate);
            }
            animate();
        }

        // --- Init ---
        document.addEventListener('DOMContentLoaded', () => {
            initHeatCanvas();
            filterFood('all');

            // Chart 1: Solar Term 105 deg
            const ctx1 = document.getElementById('solarChart').getContext('2d');
            new Chart(ctx1, {
                type: 'doughnut',
                data: {
                    labels: ['Tiểu Thử', 'Đại Thử', 'Lập Thu', 'Mùa Khác'],
                    datasets: [{
                        data: [15, 15, 15, 315],
                        backgroundColor: ['#FB8500', '#FB8500', '#FFD166', '#FDFCDC'],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    rotation: 15, 
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
                        ctx.fillStyle = "#FB8500";
                        var text = "105°",
                            textX = Math.round((width - ctx.measureText(text).width) / 2),
                            textY = height / 2;
                        ctx.fillText(text, textX, textY);
                        ctx.save();
                    }
                }]
            });

            // Chart 2: Heat Index (Line)
            const ctx2 = document.getElementById('heatIndexChart').getContext('2d');
            new Chart(ctx2, {
                type: 'line',
                data: {
                    labels: ['Hạ Chí', 'Tiểu Thử (Đầu)', 'Tiểu Thử (Cuối)', 'Đại Thử'],
                    datasets: [
                        {
                            label: 'Nhiệt Độ',
                            data: [32, 34, 36, 38],
                            borderColor: '#FB8500',
                            backgroundColor: 'rgba(251, 133, 0, 0.1)',
                            fill: true,
                            tension: 0.4,
                            yAxisID: 'y'
                        },
                        {
                            label: 'Độ Ẩm',
                            data: [70, 75, 80, 85],
                            borderColor: '#2D6A4F',
                            tension: 0.4,
                            yAxisID: 'y1'
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: { position: 'left', grid: { display: false } },
                        y1: { position: 'right', grid: { display: false } },
                        x: { 
                            grid: { display: false },
                            ticks: { font: { family: "'Be Vietnam Pro'" } }
                        }
                    },
                    plugins: {
                        legend: { 
                            position: 'bottom',
                            labels: { font: { family: "'Be Vietnam Pro'" } }
                        }
                    }
                }
            });
        });
    </script>
</body>
</html>
`
