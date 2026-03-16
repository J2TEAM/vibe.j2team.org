export const DaiThu = `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Đại Thử: Đỉnh Điểm Mùa Hạ & Sự Tôi Luyện Của Lửa</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    
    <!-- Fonts: Philosopher (Tiêu đề - Hùng tráng), Be Vietnam Pro (Nội dung - Mạch lạc), Dancing Script (Thơ - Bay bổng) -->
    <link href="https://fonts.googleapis.com/css2?family=Philosopher:ital,wght@0,400;0,700;1,400;1,700&family=Be+Vietnam+Pro:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400&family=Dancing+Script:wght@400;700&display=swap" rel="stylesheet">
    
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        'blazing-red': '#D00000',   // Đỏ rực (Nắng cực điểm/Lò bát quái)
                        'scorched-orange': '#E85D04', // Cam cháy (Nhiệt huyết/Tam Phục)
                        'humid-green': '#6A994E',   // Xanh rêu (Thấp nhiệt/Cỏ mục)
                        'night-firefly': '#03071E', // Đen đêm (Nền tối để đom đóm sáng)
                        'steam-white': '#FDFFFC',   // Trắng (Hơi nước bốc lên)
                        'ginger-gold': '#FFBA08'    // Vàng gừng (Dương khí nội sinh)
                    },
                    fontFamily: {
                        serif: ['"Philosopher"', 'serif'],
                        sans: ['"Be Vietnam Pro"', 'sans-serif'],
                        script: ['"Dancing Script"', 'cursive'],
                    },
                    animation: {
                        'pulse-heat': 'pulseHeat 2s infinite',
                    },
                    keyframes: {
                        pulseHeat: {
                            '0%, 100%': { opacity: '1' },
                            '50%': { opacity: '0.6' },
                        }
                    }
                }
            }
        }
    </script>
    <style>
        body {
            background-color: #03071E; /* Dark theme to emphasize heat & fireflies */
            color: #FDFFFC;
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
        /* Fireflies/Sparks Canvas Layer */
        #fireflyCanvas {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 0;
            opacity: 0.6;
        }
        /* Interactions */
        .card-interaction {
            transition: all 0.3s ease-out;
            border: 1px solid #370617;
            background: rgba(55, 6, 23, 0.4);
            backdrop-filter: blur(5px);
        }
        .card-interaction:hover {
            transform: translateY(-5px);
            border-color: #E85D04;
            box-shadow: 0 10px 30px -10px rgba(232, 93, 4, 0.4);
            background: rgba(232, 93, 4, 0.1);
        }
        .active-tab {
            background-color: #D00000;
            color: white;
            border-color: #D00000;
        }
        .no-scrollbar::-webkit-scrollbar {
            display: none;
        }
        .no-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
    </style>
    <!-- Chosen Palette: "Furnace of Nature" - Dark background with Blazing Red/Orange và Firefly Yellow highlights -->
    <!-- Application Structure Plan:
        1. Hero: Title with "Firefly/Sparks" visual cue (Canvas animation). Dark mode for intensity.
        2. Thien Tuong (Cosmic): Chart showing 120° & The peak of Heat/Humidity.
        3. Tam Hau (Nature): 3 Micro-seasons (Fireflies, Wet Soil, Heavy Rain).
        4. Doi Song (Life): Tabs for Agriculture ("Double Rush") & Customs ("Plague Boat", "Herbal Tea").
        5. Duong Sinh (Health): "Winter Radish, Summer Ginger" - Food Filter (Ginger/Warm vs Ice/Cold).
        6. Chiem Nghiem (Philosophy): Tempering & Transformation (Kho Tan Cam Lai).
        7. Footer: Copyright Tich Phong Thien Son.
    -->
    <!-- Visualization & Content Choices:
        1. Solar Gauge: Chart.js Doughnut (120°).
        2. Hoàn Cảnh Khắc Nghiệt: Biểu đồ cột cho thấy Nhiệt độ và Độ ẩm đạt đỉnh (Thấp Nhiệt).
        3. Food Filter: Logic for Warming Stomach (Ginger) vs Cooling Body (Mung Bean).
        4. Firefly Animation: HTML5 Canvas for rising sparks/fireflies.
    -->
    <!-- CONFIRMATION: NO SVG graphics used. NO Mermaid JS used. -->
</head>
<body class="font-sans antialiased leading-relaxed selection:bg-blazing-red selection:text-white">

    <!-- Background Animation -->
    <canvas id="fireflyCanvas"></canvas>

    <!-- Navigation -->
    <nav class="sticky top-0 z-50 bg-[#03071E]/90 backdrop-blur-md border-b border-blazing-red/30 shadow-lg transition-all duration-300">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between h-20 items-center">
                <div class="flex-shrink-0 flex items-center gap-3">
                    <span class="text-3xl filter drop-shadow-[0_0_10px_#E85D04] animate-pulse-heat">🔥</span>
                    <div class="flex flex-col">
                        <span class="text-2xl font-serif font-bold text-blazing-red tracking-wide">Đại Thử</span>
                        <span class="text-xs font-sans text-scorched-orange uppercase tracking-widest font-bold">Lò Bát Quái Thiên Nhiên</span>
                    </div>
                </div>
                <div class="hidden md:flex space-x-10">
                    <button onclick="scrollToSection('y-nghia')" class="text-steam-white hover:text-blazing-red transition font-medium tracking-wide text-sm uppercase">Ý Nghĩa</button>
                    <button onclick="scrollToSection('tam-hau')" class="text-steam-white hover:text-blazing-red transition font-medium tracking-wide text-sm uppercase">Tam Hậu</button>
                    <button onclick="scrollToSection('doi-song')" class="text-steam-white hover:text-blazing-red transition font-medium tracking-wide text-sm uppercase">Đời Sống</button>
                    <button onclick="scrollToSection('duong-sinh')" class="text-steam-white hover:text-blazing-red transition font-medium tracking-wide text-sm uppercase">Dưỡng Sinh</button>
                    <button onclick="scrollToSection('chiem-nghiem')" class="text-steam-white hover:text-blazing-red transition font-medium tracking-wide text-sm uppercase">Chiêm Nghiệm</button>
                </div>
            </div>
        </div>
    </nav>

    <!-- Hero Section -->
    <header class="relative pt-24 pb-20 px-4 text-center z-10 overflow-hidden">
        <div class="max-w-4xl mx-auto">
            <p class="text-scorched-orange font-bold tracking-[0.3em] uppercase mb-6 text-sm font-sans">Tiết Khí Thứ 12 • 22-23 Tháng 7</p>
            <h1 class="text-6xl md:text-8xl font-serif font-bold text-steam-white mb-6 leading-tight relative inline-block">
                Đại Thử
                <span class="absolute -top-4 -right-12 text-4xl animate-bounce text-ginger-gold">🦗</span>
            </h1>
            <h2 class="text-3xl md:text-5xl font-script text-blazing-red mb-10 font-bold transform -rotate-1">
                Đỉnh Điểm Mùa Nắng Lửa
            </h2>
            <div class="w-32 h-1 bg-gradient-to-r from-blazing-red to-scorched-orange mx-auto mb-10 rounded-full shadow-[0_0_20px_#D00000]"></div>
            <p class="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto leading-loose font-light">
                "Nhiệt độ cực đại, độ ẩm cực cao. Đất trời như một lồng hấp khổng lồ. Đây là thử thách khắc nghiệt nhất, nhưng cũng là cơ hội tôi luyện mạnh mẽ nhất."
            </p>
            <div class="mt-14">
                <button onclick="scrollToSection('y-nghia')" class="group relative inline-flex items-center justify-center px-10 py-3 overflow-hidden font-serif italic tracking-wide text-white transition duration-300 ease-out border-2 border-blazing-red rounded-full shadow-[0_0_20px_#D00000] bg-blazing-red">
                    <span class="absolute inset-0 flex items-center justify-center w-full h-full text-white duration-300 -translate-x-full bg-scorched-orange group-hover:translate-x-0 ease">
                        <span class="text-xl">☀️</span>
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
            <h3 class="text-4xl font-serif font-bold text-steam-white mb-4 inline-block relative">
                Lò Luyện Của Thiên Nhiên
                <span class="absolute -bottom-2 left-0 w-full h-1 bg-blazing-red"></span>
            </h3>
            <p class="text-gray-400 max-w-2xl mx-auto mt-6 text-lg leading-relaxed">
                Mặt Trời kinh độ 120°. "Đại" là lớn, "Thử" là nắng nóng. Nhiệt độ và Dương khí đạt đến cực đại, kết hợp với mưa rào tạo nên sự oi bức ngột ngạt.
            </p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <!-- Charts Column -->
            <div class="space-y-10">
                <div class="bg-white/5 p-8 rounded-2xl shadow-lg border border-white/10 relative overflow-hidden backdrop-blur-sm">
                    <h4 class="text-xl font-serif font-bold text-blazing-red mb-2 text-center">Vị Trí Thiên Văn (120°)</h4>
                    <div class="chart-container">
                        <canvas id="solarChart"></canvas>
                    </div>
                </div>
                
                <div class="bg-white/5 p-8 rounded-2xl shadow-lg border border-white/10 backdrop-blur-sm">
                    <h4 class="text-xl font-serif font-bold text-scorched-orange mb-2 text-center">Biểu Đồ "Xông Hơi" (Thấp Nhiệt)</h4>
                    <div class="chart-container" style="height: 250px;">
                        <canvas id="climateChart"></canvas>
                    </div>
                    <p class="text-center text-sm text-gray-400 mt-4 italic">Nhiệt độ cao + Độ ẩm cao = Ngột ngạt.</p>
                </div>
            </div>

            <!-- Content Explanation -->
            <div class="space-y-8 text-lg text-gray-300 leading-relaxed font-light">
                <div class="p-6 bg-blazing-red/10 rounded-xl border-l-4 border-blazing-red shadow-[0_0_15px_rgba(208,0,0,0.2)]">
                    <strong class="text-scorched-orange font-serif text-xl block mb-2">Đỉnh Điểm Tam Phục</strong>
                    <p>
                        Đại Thử thường trùng với "Trung Phục" - giai đoạn nóng nhất trong năm. Không khí đặc quánh hơi ẩm, như ở trong lồng hấp.
                    </p>
                </div>
                <div>
                    <strong class="text-scorched-orange font-serif text-xl block mb-2">Ý Nghĩa Tên Gọi</strong>
                    <p>
                        Nắng nóng gay gắt đến cực điểm. Mọi vật dường như bị nung chảy, nhưng cũng chính là lúc vạn vật được tôi luyện để trở nên cứng cáp.
                    </p>
                </div>
            </div>
        </div>
    </section>

    <!-- Section 2: Tam Hậu (Nature) -->
    <section id="tam-hau" class="py-24 relative z-10">
        <div class="max-w-6xl mx-auto px-4">
            <h3 class="text-3xl font-serif font-bold text-ginger-gold mb-12 text-center">Tam Hậu: Ba Tín Hiệu Đêm Hè</h3>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                <!-- Card 1 -->
                <div class="card-interaction p-8 rounded-2xl cursor-default group text-center">
                    <div class="w-20 h-20 mx-auto rounded-full bg-ginger-gold/20 flex items-center justify-center text-4xl mb-6 group-hover:scale-110 transition shadow-[0_0_15px_#FFBA08]">✨</div>
                    <h5 class="font-bold text-xl text-steam-white mb-3 font-serif">1. Phụ Thảo Vi Huỳnh</h5>
                    <p class="text-gray-400 font-light">Cỏ mục sinh ra đom đóm. Trong cái nóng ẩm, người xưa tin cỏ cây hóa thành đom đóm lập lòe trong đêm.</p>
                </div>

                <!-- Card 2 -->
                <div class="card-interaction p-8 rounded-2xl cursor-default group text-center">
                    <div class="w-20 h-20 mx-auto rounded-full bg-humid-green/20 flex items-center justify-center text-4xl mb-6 group-hover:scale-110 transition">🌫️</div>
                    <h5 class="font-bold text-xl text-steam-white mb-3 font-serif">2. Thổ Nhuận Thử</h5>
                    <p class="text-gray-400 font-light">Đất đai ẩm ướt, không khí oi bức. Hơi nước bốc lên hầm hập từ lòng đất nóng hổi.</p>
                </div>

                <!-- Card 3 -->
                <div class="card-interaction p-8 rounded-2xl cursor-default group text-center">
                    <div class="w-20 h-20 mx-auto rounded-full bg-blazing-red/20 flex items-center justify-center text-4xl mb-6 group-hover:scale-110 transition">⛈️</div>
                    <h5 class="font-bold text-xl text-steam-white mb-3 font-serif">3. Đại Vũ Thời Hành</h5>
                    <p class="text-gray-400 font-light">Mưa lớn thường xuyên xuất hiện. Những cơn giông tố dữ dội giúp giải tỏa bớt nhiệt lượng tích tụ.</p>
                </div>
            </div>
        </div>
    </section>

    <!-- Section 3: Đời Sống (Tabs) -->
    <section id="doi-song" class="py-24 px-4 bg-white/5 relative z-10 backdrop-blur-sm">
        <div class="max-w-6xl mx-auto">
            <div class="mb-12 text-center">
                <h3 class="text-4xl font-serif font-bold text-scorched-orange mb-4">Song Thương & Trừ Tà</h3>
                <p class="text-gray-400 italic">"Cướp thu - Cướp cấy"</p>
            </div>

            <!-- Custom Tabs -->
            <div class="flex justify-center mb-10 space-x-4">
                <button onclick="switchTab('nong-nghiep')" id="btn-nong-nghiep" class="active-tab px-8 py-3 rounded-full border border-blazing-red font-bold transition duration-300 font-serif tracking-wide shadow-[0_0_15px_#D00000]">Nông Nghiệp</button>
                <button onclick="switchTab('phong-tuc')" id="btn-phong-tuc" class="px-8 py-3 rounded-full border border-blazing-red text-blazing-red font-bold hover:bg-blazing-red hover:text-white transition duration-300 font-serif tracking-wide shadow-sm">Phong Tục</button>
            </div>

            <!-- Content Area -->
            <div class="bg-[#0f0f13] p-8 md:p-12 rounded-3xl border border-white/10 min-h-[400px] flex items-center shadow-2xl relative overflow-hidden">
                <div class="absolute top-0 right-0 w-40 h-40 bg-blazing-red/10 rounded-bl-full pointer-events-none blur-3xl"></div>

                <!-- Nong Nghiep Content -->
                <div id="content-nong-nghiep" class="grid grid-cols-1 md:grid-cols-2 gap-10 w-full animate-fade-in">
                    <div class="flex flex-col justify-center">
                        <h4 class="text-3xl font-serif font-bold text-humid-green mb-6">Chạy Đua Với Nắng Mưa</h4>
                        <p class="text-gray-300 leading-relaxed mb-6">
                            Giai đoạn "Song Thương" (Hai lần cướp): Cướp thời gian để thu hoạch và gieo trồng.
                        </p>
                        <ul class="space-y-4 text-gray-400 font-light">
                            <li class="flex items-start gap-3">
                                <span class="text-scorched-orange font-bold">⚡</span>
                                <span><strong>Cướp Thu:</strong> Thu hoạch lúa sớm trước khi bão ập đến.</span>
                            </li>
                            <li class="flex items-start gap-3">
                                <span class="text-humid-green font-bold">🌱</span>
                                <span><strong>Cướp Cấy:</strong> Gieo cấy lúa muộn ngay lập tức cho kịp thời vụ.</span>
                            </li>
                            <li class="flex items-start gap-3">
                                <span class="text-blazing-red font-bold">🔥</span>
                                <span>Nắng Đại Thử là nguồn năng lượng quý giá cho cây trồng sinh trưởng.</span>
                            </li>
                        </ul>
                    </div>
                    <div class="flex items-center justify-center bg-white/5 rounded-2xl p-6 border border-dashed border-white/20">
                        <div class="text-center">
                            <div class="text-9xl mb-4 opacity-80 animate-pulse">🌾</div>
                            <p class="font-script text-2xl text-steam-white">Mồ hôi đổ xuống đồng</p>
                        </div>
                    </div>
                </div>

                <!-- Phong Tuc Content -->
                <div id="content-phong-tuc" class="hidden grid-cols-1 md:grid-cols-2 gap-10 w-full animate-fade-in">
                    <!-- Card 1 -->
                    <div class="bg-white/5 p-8 rounded-2xl border-l-4 border-humid-green hover:bg-white/10 transition group">
                        <div class="text-5xl mb-4 group-hover:scale-110 transition duration-300">🍵</div>
                        <h4 class="text-2xl font-serif font-bold text-steam-white mb-3">Uống Trà Phục</h4>
                        <p class="text-gray-400 leading-relaxed font-light">
                            Uống trà thảo dược (kim ngân, cam thảo) để thanh nhiệt, giải độc, chống lại cái nóng "Tam Phục".
                        </p>
                    </div>
                    <!-- Card 2 -->
                    <div class="bg-white/5 p-8 rounded-2xl border-l-4 border-blazing-red hover:bg-white/10 transition group">
                        <div class="text-5xl mb-4 group-hover:scale-110 transition duration-300">⛵</div>
                        <h4 class="text-2xl font-serif font-bold text-steam-white mb-3">Đốt Thuyền Ôn</h4>
                        <p class="text-gray-400 leading-relaxed font-light">
                            Làm thuyền giấy chở hình nhân "Ôn thần" rồi đốt hoặc thả trôi sông để xua đuổi dịch bệnh mùa hè.
                        </p>
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
                    <span class="text-ginger-gold font-bold tracking-widest uppercase text-sm">Dương Thịnh • Âm Suy</span>
                    <h3 class="text-4xl font-serif font-bold text-steam-white mt-2 mb-6">Đông Ăn Củ Cải, Hạ Ăn Gừng</h3>
                    <p class="text-gray-400 text-lg leading-relaxed mb-6">
                        Bên ngoài nóng (Dương) nhưng bên trong Tỳ vị dễ lạnh (Âm). Ăn gừng để thăng dương khí, làm ấm dạ dày.
                    </p>
                    <div class="bg-ginger-gold/10 p-6 rounded-xl border-l-4 border-ginger-gold shadow-sm">
                        <h4 class="font-bold text-lg text-ginger-gold mb-2 font-serif">Nguyên Tắc Ẩm Thực</h4>
                        <p class="text-gray-300 mb-2"><strong>Ăn Gừng:</strong> Buổi sáng, giúp giải cảm nắng, ấm bụng.</p>
                        <p class="text-gray-300"><strong>Bù Nước:</strong> Chanh muối, nước dừa để bù điện giải do mồ hôi.</p>
                    </div>
                </div>

                <div class="space-y-4 font-sans text-gray-400">
                    <div class="flex items-center gap-4 p-3 bg-white/5 rounded-lg border border-white/10">
                        <div class="w-10 h-10 rounded-full bg-blazing-red/20 flex items-center justify-center text-xl text-white">❄️</div>
                        <div>
                            <strong>Tránh Tham Mát:</strong> Không tắm nước lạnh khi đang đổ mồ hôi.
                        </div>
                    </div>
                    <div class="flex items-center gap-4 p-3 bg-white/5 rounded-lg border border-white/10">
                        <div class="w-10 h-10 rounded-full bg-blazing-red/20 flex items-center justify-center text-xl text-white">🥣</div>
                        <div>
                            <strong>Ăn Cháo:</strong> Cháo lá sen, ý dĩ giúp kiện tỳ, dễ tiêu hóa.
                        </div>
                    </div>
                </div>
            </div>

            <!-- Right: Interactive Food Filter -->
            <div class="lg:col-span-7">
                <div class="bg-white/5 rounded-3xl shadow-lg border border-white/10 overflow-hidden flex flex-col h-full backdrop-blur-sm">
                    <div class="bg-gradient-to-r from-blazing-red to-scorched-orange p-8 text-white">
                        <h4 class="text-2xl font-serif font-bold flex items-center gap-3">
                            <span>🫚</span> Thực Đơn Giải Nhiệt & Bổ Dương
                        </h4>
                        <p class="opacity-90 mt-2 font-light text-sm">Cân bằng giữa giải nhiệt và giữ ấm tỳ vị.</p>
                    </div>

                    <!-- Filters -->
                    <div class="p-6 border-b border-white/10 flex gap-3 overflow-x-auto no-scrollbar">
                        <button onclick="filterFood('all')" class="food-btn active px-5 py-2 rounded-full text-sm font-bold bg-white/10 text-gray-300 hover:bg-white/20 transition whitespace-nowrap" data-filter="all">Tất Cả</button>
                        <button onclick="filterFood('good')" class="food-btn px-5 py-2 rounded-full text-sm font-bold bg-white/10 text-gray-300 hover:bg-white/20 transition whitespace-nowrap" data-filter="good">Nên Dùng (Gừng/Mát)</button>
                        <button onclick="filterFood('bad')" class="food-btn px-5 py-2 rounded-full text-sm font-bold bg-white/10 text-gray-300 hover:bg-white/20 transition whitespace-nowrap" data-filter="bad">Hạn Chế (Lạnh/Sống)</button>
                    </div>

                    <!-- Grid -->
                    <div id="food-grid" class="p-6 grid grid-cols-2 sm:grid-cols-3 gap-4 overflow-y-auto max-h-[500px]">
                        <!-- JS populated -->
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Section 5: Chiêm Nghiệm (Philosophy) -->
    <section id="chiem-nghiem" class="py-32 relative overflow-hidden">
        <!-- Abstract Background Shape -->
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blazing-red/10 rounded-full blur-[100px] pointer-events-none"></div>

        <div class="max-w-3xl mx-auto relative z-10 text-center">
            <span class="text-6xl text-scorched-orange font-serif opacity-50 block mb-6">❝</span>
            
            <h3 class="text-4xl md:text-5xl font-serif font-bold mb-10 text-steam-white leading-tight">
                Khổ Tận Cam Lai
            </h3>
            
            <p class="text-xl text-gray-300 leading-loose mb-12 font-sans font-light">
                Cái nóng Đại Thử như ngọn lửa trong lò luyện đan, thiêu đốt tạp chất để kết tinh thành quả ngọt. Những giai đoạn gian nan nhất chính là lúc ta trưởng thành vượt bậc. Qua được Đại Thử là sẽ đến Lập Thu. Hết đắng cay sẽ đến ngày ngọt bùi.
            </p>

            <div class="inline-block border border-white/20 rounded-2xl p-10 bg-white/5 backdrop-blur-sm hover:border-ginger-gold transition duration-500 cursor-default group">
                <p class="font-bold uppercase tracking-[0.2em] text-sm text-ginger-gold mb-6 font-sans group-hover:text-white transition">Lời Chúc Đại Thử</p>
                <div class="text-3xl md:text-4xl font-script text-blazing-red leading-relaxed group-hover:scale-105 transition duration-500 shadow-text">
                    "Vượt qua nắng lửa,<br>Tâm sáng chí bền."
                </div>
            </div>
            
            <span class="text-6xl text-scorched-orange font-serif opacity-50 block mt-12">❞</span>
        </div>
    </section>

    <!-- Footer -->
    <footer class="bg-black text-gray-500 py-12 text-center text-sm font-sans border-t border-white/10">
        <p class="italic tracking-wide mb-3 text-gray-600">Biên soạn dựa trên nguyên lý 24 Tiết khí & Văn hóa Phương Đông</p>
        <p class="text-gray-500">© Bản quyền thuộc về <span class="font-script text-xl text-blazing-red ml-1">Tịch Phong Thiên Sơn - 夕风天山</span></p>
    </footer>

    <!-- Javascript Logic -->
    <script>
        // --- Data ---
        const foodData = [
            { name: "Gừng Tươi", type: "good", icon: "🫚", desc: "Ấm dạ dày, thăng dương khí" },
            { name: "Dứa (Thơm)", type: "good", icon: "🍍", desc: "Giải khát, kích thích tiêu hóa" },
            { name: "Trà Thảo Dược", type: "good", icon: "🍵", desc: "Thanh nhiệt, giải độc (Kim ngân)" },
            { name: "Chanh Muối", type: "good", icon: "🍋", desc: "Bù nước, muối khoáng" },
            { name: "Cháo Lá Sen", type: "good", icon: "🥣", desc: "Kiện tỳ, dễ tiêu hóa" },
            { name: "Đậu Xanh", type: "good", icon: "🫘", desc: "Làm mát, trừ phiền nhiệt" },
            { name: "Nước Đá", type: "bad", icon: "🧊", desc: "Làm lạnh tỳ vị, gây đau bụng" },
            { name: "Kem", type: "bad", icon: "🍦", desc: "Gây sốc nhiệt, hại dương khí" },
            { name: "Gió Lạnh", type: "bad", icon: "🌬️", desc: "Tránh quạt thốc thẳng khi ra mồ hôi" }
        ];

        // --- Tab Logic ---
        function switchTab(tab) {
            document.getElementById('content-nong-nghiep').classList.add('hidden');
            document.getElementById('content-nong-nghiep').classList.remove('grid');
            document.getElementById('content-phong-tuc').classList.add('hidden');
            document.getElementById('content-phong-tuc').classList.remove('grid');

            document.getElementById('btn-nong-nghiep').classList.remove('active-tab', 'text-white');
            document.getElementById('btn-nong-nghiep').classList.add('text-steam-white');
            document.getElementById('btn-phong-tuc').classList.remove('active-tab', 'text-white');
            document.getElementById('btn-phong-tuc').classList.add('text-steam-white');

            const content = document.getElementById(\`content-\${tab}\`);
            content.classList.remove('hidden');
            content.classList.add('grid');
            
            const btn = document.getElementById(\`btn-\${tab}\`);
            btn.classList.add('active-tab');
            btn.classList.remove('text-steam-white');
        }

        // --- Food Filter Logic ---
        function filterFood(filter) {
            const grid = document.getElementById('food-grid');
            grid.innerHTML = ''; 

            document.querySelectorAll('.food-btn').forEach(btn => {
                if(btn.dataset.filter === filter) {
                    btn.classList.add('bg-blazing-red', 'text-white');
                    btn.classList.remove('bg-white/10', 'text-gray-300');
                } else {
                    btn.classList.remove('bg-blazing-red', 'text-white');
                    btn.classList.add('bg-white/10', 'text-gray-300');
                }
            });

            const items = filter === 'all' ? foodData : foodData.filter(i => i.type === filter);

            items.forEach(item => {
                const el = document.createElement('div');
                let colorClass = item.type === 'good' 
                    ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500' 
                    : 'bg-blue-500/10 border-blue-500/30 text-blue-400 opacity-70';

                el.className = \`\${colorClass} border rounded-xl p-4 flex flex-col items-center text-center transition hover:scale-105 cursor-default group backdrop-blur-md\`;
                el.innerHTML = \`
    <div class="text-4xl mb-3 transform group-hover:scale-110 transition shadow-text">\${item.icon} </div>
        <div class="font-serif font-bold text-base mb-1 tracking-wide shadow-text">\${item.name} </div>
            <div class="text-xs font-sans shadow-text">\${item.desc} </div>
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

        // --- Canvas Animation (Fireflies & Sparks) ---
        function initFireflyCanvas() {
            const canvas = document.getElementById('fireflyCanvas');
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

            class Firefly {
                constructor() {
                    this.x = Math.random() * width;
                    this.y = Math.random() * height;
                    this.radius = Math.random() * 2 + 1;
                    this.vx = Math.random() * 1 - 0.5;
                    this.vy = Math.random() * -1 - 0.2; // Rise up
                    this.alpha = Math.random();
                    this.fadeSpeed = Math.random() * 0.02 + 0.005;
                    this.color = \`255, 186, 8\`; // Ginger Gold
                }
                update() {
                    this.x += this.vx + Math.sin(this.y * 0.01) * 0.5;
                    this.y += this.vy;
                    this.alpha -= this.fadeSpeed;

                    if (this.alpha <= 0 || this.y < 0) {
                        this.reset();
                    }
                }
                reset() {
                    this.y = height + 10;
                    this.x = Math.random() * width;
                    this.alpha = 1;
                    this.vx = Math.random() * 1 - 0.5;
                }
                draw() {
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                    ctx.fillStyle = \`rgba(\${this.color}, \${this.alpha})\`;
                    ctx.shadowBlur = 10;
                    ctx.shadowColor = \`rgba(\${this.color}, 1)\`;
                    ctx.fill();
                    ctx.shadowBlur = 0;
                }
            }

            for(let i=0; i<60; i++) particles.push(new Firefly());

            function animate() {
                ctx.clearRect(0, 0, width, height);
                // Heat haze effect overlay (optional, subtle red tint)
                // ctx.fillStyle = 'rgba(208, 0, 0, 0.02)';
                // ctx.fillRect(0, 0, width, height);
                
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
            initFireflyCanvas();
            filterFood('all');

            // Chart 1: Solar Term 120 deg
            const ctx1 = document.getElementById('solarChart').getContext('2d');
            new Chart(ctx1, {
                type: 'doughnut',
                data: {
                    labels: ['Đại Thử', 'Lập Thu', 'Xử Thử', 'Mùa Khác'],
                    datasets: [{
                        data: [15, 15, 15, 315],
                        backgroundColor: ['#D00000', '#D00000', '#E85D04', '#1f2937'],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    rotation: 30, 
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
                        ctx.fillStyle = "#D00000";
                        var text = "120°",
                            textX = Math.round((width - ctx.measureText(text).width) / 2),
                            textY = height / 2;
                        ctx.fillText(text, textX, textY);
                        ctx.save();
                    }
                }]
            });

            // Chart 2: Climate Chart (The Steam Pot)
            const ctx2 = document.getElementById('climateChart').getContext('2d');
            new Chart(ctx2, {
                type: 'bar',
                data: {
                    labels: ['Tiểu Thử', 'Đại Thử (Đỉnh)', 'Lập Thu'],
                    datasets: [
                        {
                            label: 'Nhiệt Độ',
                            data: [36, 40, 35],
                            backgroundColor: '#D00000',
                            borderRadius: 4,
                            barPercentage: 0.6,
                            yAxisID: 'y'
                        },
                        {
                            label: 'Độ Ẩm',
                            type: 'line',
                            data: [80, 90, 85],
                            borderColor: '#6A994E',
                            borderWidth: 3,
                            tension: 0.4,
                            yAxisID: 'y1'
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: { 
                            position: 'left',
                            grid: { color: 'rgba(255,255,255,0.1)' },
                            ticks: { color: '#FDFFFC' }
                        },
                        y1: {
                            position: 'right',
                            grid: { display: false },
                            ticks: { color: '#6A994E' }
                        },
                        x: { 
                            grid: { display: false },
                            ticks: { font: { family: "'Be Vietnam Pro'" }, color: '#FDFFFC' }
                        }
                    },
                    plugins: {
                        legend: { 
                            position: 'bottom',
                            labels: { font: { family: "'Be Vietnam Pro'" }, color: '#FDFFFC' }
                        }
                    }
                }
            });
        });
    </script>
</body>
</html>
`
