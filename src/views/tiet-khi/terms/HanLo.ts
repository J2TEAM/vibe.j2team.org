export const HanLo = `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Hàn Lộ: Sương Lạnh Thấm Sâu & Vẻ Đẹp Tĩnh Lặng</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    
    <!-- Fonts: Philosopher (Tiêu đề - Trầm mặc), Be Vietnam Pro (Nội dung - Rõ ràng), Dancing Script (Thơ - Sâu lắng) -->
    <link href="https://fonts.googleapis.com/css2?family=Philosopher:ital,wght@0,400;0,700;1,400;1,700&family=Be+Vietnam+Pro:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400&family=Dancing+Script:wght@400;700&display=swap" rel="stylesheet">
    
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        'cold-indigo': '#2B2D42',   // Chàm lạnh (Hàn khí/Đêm sâu)
                        'chrysanthemum-gold': '#FFB703', // Vàng cúc (Kiên cường/Dương khí còn lại)
                        'frost-gray': '#8D99AE',    // Xám sương giá (Lạnh lẽo)
                        'mist-white': '#EDF2F4',    // Trắng sương mù (Nền)
                        'withered-leaf': '#D90429', // Đỏ lá phong (Cuối thu)
                        'deep-water': '#14213D'     // Nước sâu (Tĩnh lặng)
                    },
                    fontFamily: {
                        serif: ['"Philosopher"', 'serif'],
                        sans: ['"Be Vietnam Pro"', 'sans-serif'],
                        script: ['"Dancing Script"', 'cursive'],
                    },
                    animation: {
                        'shiver': 'shiver 3s ease-in-out infinite',
                    },
                    keyframes: {
                        shiver: {
                            '0%, 100%': { transform: 'translateX(0)' },
                            '25%': { transform: 'translateX(-2px)' },
                            '75%': { transform: 'translateX(2px)' },
                        }
                    }
                }
            }
        }
    </script>
    <style>
        body {
            background-color: #EDF2F4;
            color: #2B2D42;
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
        /* Frost/Mist Canvas Layer */
        #frostCanvas {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 0;
            opacity: 0.4;
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
            border-color: #FFB703;
            box-shadow: 0 10px 30px -10px rgba(141, 153, 174, 0.3);
        }
        .active-tab {
            background-color: #2B2D42;
            color: white;
            border-color: #2B2D42;
        }
        .no-scrollbar::-webkit-scrollbar {
            display: none;
        }
        .no-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
    </style>
    <!-- Chosen Palette: "Late Autumn Frost" - Cold Indigo, Chrysanthemum Gold, Frost Gray -->
    <!-- Application Structure Plan:
        1. Hero: Title with "Frost/Cold Mist" visual cue (Canvas animation).
        2. Thien Tuong (Cosmic): Chart showing 195° & Temp crossing the "Cold" threshold.
        3. Tam Hau (Nature): 3 Micro-seasons (Late Geese, Sparrows into Clams, Chrysanthemums).
        4. Doi Song (Life): Tabs for Agriculture ("Late Harvest") & Customs ("Climbing High", "Chrysanthemum Wine").
        5. Duong Sinh (Health): "Cold Feet Warm Heart" - Food Filter (Sesame/Warm vs Cold/Raw).
        6. Chiem Nghiem (Philosophy): Resilience (Kien Cuong).
        7. Footer: Copyright Tich Phong Thien Son.
    -->
    <!-- Visualization & Content Choices:
        1. Solar Gauge: Chart.js Doughnut (195°).
        2. Cold Penetration: Radar Chart showing Cold, Dryness, và Night Length increasing.
        3. Food Filter: Logic for Yin-nourishing/Warming foods (Black sesame, Persimmon).
        4. Frost Animation: HTML5 Canvas for drifting mist/frost particles.
    -->
    <!-- CONFIRMATION: NO SVG graphics used. NO Mermaid JS used. -->
</head>
<body class="font-sans antialiased leading-relaxed selection:bg-cold-indigo selection:text-chrysanthemum-gold">

    <!-- Background Animation -->
    <canvas id="frostCanvas"></canvas>

    <!-- Navigation -->
    <nav class="sticky top-0 z-50 bg-mist-white/90 backdrop-blur-md border-b border-frost-gray/30 shadow-sm transition-all duration-300">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between h-20 items-center">
                <div class="flex-shrink-0 flex items-center gap-3">
                    <span class="text-3xl filter drop-shadow-sm animate-shiver">❄️</span>
                    <div class="flex flex-col">
                        <span class="text-2xl font-serif font-bold text-cold-indigo tracking-wide">Hàn Lộ</span>
                        <span class="text-xs font-sans text-frost-gray uppercase tracking-widest font-bold">Sương Lạnh Thấm Sâu</span>
                    </div>
                </div>
                <div class="hidden md:flex space-x-10">
                    <button onclick="scrollToSection('y-nghia')" class="text-cold-indigo hover:text-chrysanthemum-gold transition font-medium tracking-wide text-sm uppercase">Ý Nghĩa</button>
                    <button onclick="scrollToSection('tam-hau')" class="text-cold-indigo hover:text-chrysanthemum-gold transition font-medium tracking-wide text-sm uppercase">Tam Hậu</button>
                    <button onclick="scrollToSection('doi-song')" class="text-cold-indigo hover:text-chrysanthemum-gold transition font-medium tracking-wide text-sm uppercase">Đời Sống</button>
                    <button onclick="scrollToSection('duong-sinh')" class="text-cold-indigo hover:text-chrysanthemum-gold transition font-medium tracking-wide text-sm uppercase">Dưỡng Sinh</button>
                    <button onclick="scrollToSection('chiem-nghiem')" class="text-cold-indigo hover:text-chrysanthemum-gold transition font-medium tracking-wide text-sm uppercase">Chiêm Nghiệm</button>
                </div>
            </div>
        </div>
    </nav>

    <!-- Hero Section -->
    <header class="relative pt-24 pb-20 px-4 text-center z-10 overflow-hidden">
        <div class="max-w-4xl mx-auto">
            <p class="text-cold-indigo font-bold tracking-[0.3em] uppercase mb-6 text-sm font-sans">Tiết Khí Thứ 17 • 8-9 Tháng 10</p>
            <h1 class="text-6xl md:text-8xl font-serif font-bold text-deep-water mb-6 leading-tight relative inline-block">
                Hàn Lộ
                <span class="absolute -top-4 -right-12 text-4xl animate-pulse text-frost-gray">🌫️</span>
            </h1>
            <h2 class="text-3xl md:text-5xl font-script text-chrysanthemum-gold mb-10 font-bold transform -rotate-1 shadow-black">
                Nét Vẽ Trầm Mặc Của Mùa Thu
            </h2>
            <div class="w-24 h-1 bg-cold-indigo mx-auto mb-10 rounded-full shadow-sm"></div>
            <p class="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-loose font-light">
                "Sương không còn trắng mà đã lạnh buốt, chực chờ hóa đá. Khí Dương suy tàn, khí Âm bao trùm. Vạn vật thu mình, chỉ có hoa cúc kiên cường khoe sắc."
            </p>
            <div class="mt-14">
                <button onclick="scrollToSection('y-nghia')" class="group relative inline-flex items-center justify-center px-10 py-3 overflow-hidden font-serif italic tracking-wide text-white transition duration-300 ease-out border-2 border-cold-indigo rounded-full shadow-md bg-cold-indigo">
                    <span class="absolute inset-0 flex items-center justify-center w-full h-full text-white duration-300 -translate-x-full bg-frost-gray group-hover:translate-x-0 ease">
                        <span class="text-xl">🧊</span>
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
            <h3 class="text-4xl font-serif font-bold text-cold-indigo mb-4 inline-block relative">
                Sương Lạnh Ngưng Tụ
                <span class="absolute -bottom-2 left-0 w-full h-1 bg-frost-gray/50"></span>
            </h3>
            <p class="text-gray-600 max-w-2xl mx-auto mt-6 text-lg leading-relaxed">
                Mặt Trời kinh độ 195°. "Hàn" là lạnh, "Lộ" là sương. Nhiệt độ giảm sâu, sương đêm lạnh giá, báo hiệu mùa đông đang đến rất gần.
            </p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <!-- Charts Column -->
            <div class="space-y-10">
                <div class="bg-white p-8 rounded-2xl shadow-sm border border-frost-gray/20 relative overflow-hidden">
                    <h4 class="text-xl font-serif font-bold text-deep-water mb-2 text-center">Vị Trí Thiên Văn (195°)</h4>
                    <div class="chart-container">
                        <canvas id="solarChart"></canvas>
                    </div>
                </div>
                
                <div class="bg-white p-8 rounded-2xl shadow-sm border border-frost-gray/20">
                    <h4 class="text-xl font-serif font-bold text-cold-indigo mb-2 text-center">Chỉ Số Khí Hậu</h4>
                    <div class="chart-container" style="height: 300px;">
                        <canvas id="climateRadar"></canvas>
                    </div>
                    <p class="text-center text-sm text-gray-500 mt-4 italic">Đặc trưng: Lạnh (Hàn) và Khô (Táo) tăng mạnh.</p>
                </div>
            </div>

            <!-- Content Explanation -->
            <div class="space-y-8 text-lg text-gray-600 leading-relaxed font-light">
                <div class="p-6 bg-white rounded-xl border-l-4 border-cold-indigo shadow-sm">
                    <strong class="text-deep-water font-serif text-xl block mb-2">Bước Tiến Của Khí Hàn</strong>
                    <p>
                        Nếu Bạch Lộ là khí lạnh mới chớm, thì Hàn Lộ là khí lạnh đã thấm sâu. Âm khí cực thịnh, Dương khí lặn sâu vào lòng đất.
                    </p>
                </div>
                <div>
                    <strong class="text-deep-water font-serif text-xl block mb-2">Cảnh Sắc Tiêu Sơ</strong>
                    <p>
                        Cây cối trút lá mạnh, khung cảnh thiên nhiên mang màu sắc tĩnh mịch. Chỉ có hoa cúc nở vàng rực rỡ, thách thức sương giá.
                    </p>
                </div>
            </div>
        </div>
    </section>

    <!-- Section 2: Tam Hậu (Nature) -->
    <section id="tam-hau" class="py-24 bg-white relative z-10">
        <div class="max-w-6xl mx-auto px-4">
            <h3 class="text-3xl font-serif font-bold text-chrysanthemum-gold mb-12 text-center">Tam Hậu: Ba Tín Hiệu Cuối Thu</h3>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                <!-- Card 1 -->
                <div class="card-interaction p-8 rounded-2xl cursor-default group text-center">
                    <div class="w-20 h-20 mx-auto rounded-full bg-cold-indigo/10 flex items-center justify-center text-4xl mb-6 group-hover:scale-110 transition">🪿</div>
                    <h5 class="font-bold text-xl text-deep-water mb-3 font-serif">1. Hồng Nhạn Lai Tân</h5>
                    <p class="text-gray-600 font-light">Những đàn chim nhạn cuối cùng bay về phương Nam, được coi là những vị "khách" đến muộn của mùa di cư.</p>
                </div>

                <!-- Card 2 -->
                <div class="card-interaction p-8 rounded-2xl cursor-default group text-center">
                    <div class="w-20 h-20 mx-auto rounded-full bg-deep-water/20 flex items-center justify-center text-4xl mb-6 group-hover:scale-110 transition">🐚</div>
                    <h5 class="font-bold text-xl text-deep-water mb-3 font-serif">2. Tước Nhập Đại Thủy</h5>
                    <p class="text-gray-600 font-light">Chim sẻ biến mất, sò ốc xuất hiện nhiều. Người xưa ngỡ chim lặn xuống nước hóa thành sò (biểu tượng Âm khí thịnh).</p>
                </div>

                <!-- Card 3 -->
                <div class="card-interaction p-8 rounded-2xl cursor-default group text-center">
                    <div class="w-20 h-20 mx-auto rounded-full bg-chrysanthemum-gold/20 flex items-center justify-center text-4xl mb-6 group-hover:scale-110 transition">🌼</div>
                    <h5 class="font-bold text-xl text-deep-water mb-3 font-serif">3. Cúc Hữu Hoàng Hoa</h5>
                    <p class="text-gray-600 font-light">Hoa cúc nở vàng rực rỡ. Biểu tượng của sự kiên cường, ngạo nghễ giữa trời thu lạnh giá.</p>
                </div>
            </div>
        </div>
    </section>

    <!-- Section 3: Đời Sống (Tabs) -->
    <section id="doi-song" class="py-24 px-4 bg-mist-white relative z-10">
        <div class="max-w-6xl mx-auto">
            <div class="mb-12 text-center">
                <h3 class="text-4xl font-serif font-bold text-cold-indigo mb-4">Mùa Gặt Muộn & Thưởng Cúc</h3>
                <p class="text-gray-600 italic">"Hàn Lộ cước bất lộ" - Chân không để hở</p>
            </div>

            <!-- Custom Tabs -->
            <div class="flex justify-center mb-10 space-x-4">
                <button onclick="switchTab('phong-tuc')" id="btn-phong-tuc" class="active-tab px-8 py-3 rounded-full border border-cold-indigo font-bold transition duration-300 font-serif tracking-wide shadow-sm">Phong Tục</button>
                <button onclick="switchTab('nong-nghiep')" id="btn-nong-nghiep" class="px-8 py-3 rounded-full border border-cold-indigo text-cold-indigo font-bold hover:bg-cold-indigo hover:text-white transition duration-300 font-serif tracking-wide shadow-sm">Nông Nghiệp</button>
            </div>

            <!-- Content Area -->
            <div class="bg-white p-8 md:p-12 rounded-3xl border border-gray-100 min-h-[400px] flex items-center shadow-sm relative overflow-hidden">
                <div class="absolute top-0 right-0 w-32 h-32 bg-chrysanthemum-gold/10 rounded-bl-full pointer-events-none"></div>

                <!-- Phong Tuc Content -->
                <div id="content-phong-tuc" class="grid grid-cols-1 md:grid-cols-2 gap-10 w-full animate-fade-in">
                    <!-- Card 1 -->
                    <div class="bg-mist-white p-8 rounded-2xl border-l-4 border-chrysanthemum-gold hover:bg-gray-50 transition group">
                        <div class="text-5xl mb-4 group-hover:scale-110 transition duration-300">⛰️</div>
                        <h4 class="text-2xl font-serif font-bold text-deep-water mb-3">Đăng Cao (Leo Núi)</h4>
                        <p class="text-gray-600 leading-relaxed font-light">
                            Trùng với Tết Trùng Cửu. Leo lên nơi cao để ngắm cảnh thu, hít thở không khí trong lành, tránh "tà khí" ẩm thấp.
                        </p>
                    </div>
                    <!-- Card 2 -->
                    <div class="bg-mist-white p-8 rounded-2xl border-l-4 border-cold-indigo hover:bg-gray-50 transition group">
                        <div class="text-5xl mb-4 group-hover:scale-110 transition duration-300">🍶</div>
                        <h4 class="text-2xl font-serif font-bold text-deep-water mb-3">Uống Rượu Cúc</h4>
                        <p class="text-gray-600 leading-relaxed font-light">
                            Thưởng hoa cúc và uống rượu ngâm hoa cúc để trừ hàn, giải nhiệt độc và cầu mong sự trường thọ.
                        </p>
                    </div>
                </div>

                <!-- Nong Nghiep Content -->
                <div id="content-nong-nghiep" class="hidden grid-cols-1 md:grid-cols-2 gap-10 w-full animate-fade-in">
                    <div class="flex flex-col justify-center">
                        <h4 class="text-3xl font-serif font-bold text-withered-leaf mb-6">Thu Hoạch Nước Rút</h4>
                        <p class="text-gray-600 leading-relaxed mb-6">
                            Sương lạnh có thể gây hại hoa màu, cần thu hoạch khẩn trương.
                        </p>
                        <ul class="space-y-4 text-gray-500 font-light">
                            <li class="flex items-start gap-3">
                                <span class="text-chrysanthemum-gold font-bold">🌾</span>
                                <span><strong>Thu Hoạch:</strong> Lúa mùa muộn, bông vải, các loại đậu.</span>
                            </li>
                            <li class="flex items-start gap-3">
                                <span class="text-cold-indigo font-bold">🌱</span>
                                <span><strong>Gieo Vụ Đông:</strong> Trồng cây chịu lạnh như lúa mì, cải dầu, tỏi.</span>
                            </li>
                        </ul>
                    </div>
                    <div class="flex items-center justify-center bg-mist-white rounded-2xl p-6 border border-dashed border-gray-300">
                        <div class="text-center">
                            <div class="text-9xl mb-4 opacity-80 animate-pulse">🌾</div>
                            <p class="font-script text-2xl text-deep-water">Mùa gặt cuối</p>
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
                    <span class="text-frost-gray font-bold tracking-widest uppercase text-sm">Dưỡng Âm • Phòng Táo</span>
                    <h3 class="text-4xl font-serif font-bold text-deep-water mt-2 mb-6">Hàn Lộ Cước Bất Lộ</h3>
                    <p class="text-gray-600 text-lg leading-relaxed mb-6">
                        Chân không được để hở. Hàn khí từ chân xâm nhập sẽ hại Thận. Cần giữ ấm và dưỡng âm nhuận táo.
                    </p>
                    <div class="bg-white p-6 rounded-xl border-l-4 border-cold-indigo shadow-sm">
                        <h4 class="font-bold text-lg text-cold-indigo mb-2 font-serif">Nguyên Tắc Ẩm Thực</h4>
                        <p class="text-gray-600 mb-2"><strong>Tư Âm:</strong> Ăn vừng, mật ong, sữa để nhuận tràng, dưỡng huyết.</p>
                        <p class="text-gray-600"><strong>Tránh Lạnh:</strong> Không ăn dưa hấu, kem để tránh hàn tà.</p>
                    </div>
                </div>

                <div class="space-y-4 font-sans text-gray-700">
                    <div class="flex items-center gap-4 p-3 bg-white rounded-lg shadow-sm">
                        <div class="w-10 h-10 rounded-full bg-frost-gray/20 flex items-center justify-center text-xl">🦶</div>
                        <div>
                            <strong>Ngâm Chân:</strong> Nước ấm thảo dược trước khi ngủ để thông kinh lạc.
                        </div>
                    </div>
                    <div class="flex items-center gap-4 p-3 bg-white rounded-lg shadow-sm">
                        <div class="w-10 h-10 rounded-full bg-frost-gray/20 flex items-center justify-center text-xl">🧦</div>
                        <div>
                            <strong>Đi Tất:</strong> Giữ ấm bàn chân mọi lúc, tránh đi chân đất.
                        </div>
                    </div>
                </div>
            </div>

            <!-- Right: Interactive Food Filter -->
            <div class="lg:col-span-7">
                <div class="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden flex flex-col h-full">
                    <div class="bg-cold-indigo p-8 text-white">
                        <h4 class="text-2xl font-serif font-bold flex items-center gap-3">
                            <span>🥣</span> Thực Đơn Nhuận Táo
                        </h4>
                        <p class="opacity-80 mt-2 font-light text-sm">Chọn thực phẩm dưỡng âm, giữ ấm nhẹ.</p>
                    </div>

                    <!-- Filters -->
                    <div class="p-6 border-b border-gray-100 flex gap-3 overflow-x-auto no-scrollbar">
                        <button onclick="filterFood('all')" class="food-btn active px-5 py-2 rounded-full text-sm font-bold bg-deep-water text-white hover:bg-gray-800 transition whitespace-nowrap" data-filter="all">Tất Cả</button>
                        <button onclick="filterFood('good')" class="food-btn px-5 py-2 rounded-full text-sm font-bold bg-gray-100 text-gray-600 hover:bg-gray-200 transition whitespace-nowrap" data-filter="good">Nên Dùng (Dưỡng Âm)</button>
                        <button onclick="filterFood('bad')" class="food-btn px-5 py-2 rounded-full text-sm font-bold bg-gray-100 text-gray-600 hover:bg-gray-200 transition whitespace-nowrap" data-filter="bad">Hạn Chế (Lạnh/Cay)</button>
                    </div>

                    <!-- Grid -->
                    <div id="food-grid" class="p-6 grid grid-cols-2 sm:grid-cols-3 gap-4 overflow-y-auto max-h-[500px] bg-mist-white">
                        <!-- JS populated -->
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Section 5: Chiêm Nghiệm (Philosophy) -->
    <section id="chiem-nghiem" class="py-32 bg-deep-water text-white text-center px-4 relative overflow-hidden">
        <!-- Abstract Background Shape -->
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-chrysanthemum-gold/10 rounded-full blur-[100px] pointer-events-none"></div>

        <div class="max-w-3xl mx-auto relative z-10">
            <span class="text-6xl text-frost-gray font-serif opacity-50 block mb-6">❝</span>
            
            <h3 class="text-4xl md:text-5xl font-serif font-bold mb-10 text-white leading-tight">
                Vẻ Đẹp Của Sự<br>Kiên Cường
            </h3>
            
            <p class="text-xl text-gray-300 leading-loose mb-12 font-sans font-light">
                Giữa trời thu hiu hắt, sương lạnh bao phủ, hoa cúc vẫn bung nở rực rỡ. Đời người cũng vậy, những giai đoạn "lạnh lẽo" nhất là lúc để tôi luyện bản lĩnh. Hãy như đóa cúc vàng, dùng sự khắc nghiệt làm nền tảng để tỏa sáng.
            </p>

            <div class="inline-block border border-gray-600 rounded-2xl p-10 bg-white/5 backdrop-blur-sm hover:bg-white/10 transition duration-500 cursor-default group">
                <p class="font-bold uppercase tracking-[0.2em] text-sm text-chrysanthemum-gold mb-6 font-sans group-hover:text-white transition">Lời Chúc Hàn Lộ</p>
                <div class="text-3xl md:text-4xl font-script text-frost-gray leading-relaxed group-hover:scale-105 transition duration-500">
                    "Chân ấm, Tâm an,<br>Vững vàng như cúc."
                </div>
            </div>
            
            <span class="text-6xl text-frost-gray font-serif opacity-50 block mt-12">❞</span>
        </div>
    </section>

    <!-- Footer -->
    <footer class="bg-[#0a111f] text-gray-500 py-12 text-center text-sm font-sans border-t border-gray-800">
        <p class="italic tracking-wide mb-3 text-gray-600">Biên soạn dựa trên nguyên lý 24 Tiết khí & Văn hóa Phương Đông</p>
        <p class="text-gray-500">© Bản quyền thuộc về <span class="font-script text-xl text-chrysanthemum-gold ml-1">Tịch Phong Thiên Sơn - 夕风天山</span></p>
    </footer>

    <!-- Javascript Logic -->
    <script>
        // --- Data ---
        const foodData = [
            { name: "Vừng Đen", type: "good", icon: "⚫", desc: "Đại bổ can thận, dưỡng huyết" },
            { name: "Quả Hồng", type: "good", icon: "🍅", desc: "Nhuận phế, trừ đờm, sinh tân" },
            { name: "Mật Ong", type: "good", icon: "🍯", desc: "Nhuận tràng, kháng khuẩn" },
            { name: "Gạo Nếp", type: "good", icon: "🍚", desc: "Ôn ấm tỳ vị, bổ khí" },
            { name: "Sữa Tươi", type: "good", icon: "🥛", desc: "Sinh tân dịch, dưỡng da" },
            { name: "Hạt Sen", type: "good", icon: "🪷", desc: "Dưỡng tâm, an thần, kiện tỳ" },
            { name: "Dưa Hấu", type: "bad", icon: "🍉", desc: "Tính hàn, gây lạnh bụng" },
            { name: "Tiêu Ớt", type: "bad", icon: "🌶️", desc: "Gây khô táo, hại phế âm" },
            { name: "Nước Đá", type: "bad", icon: "🧊", desc: "Hàn tà xâm nhập" }
        ];

        // --- Tab Logic ---
        function switchTab(tab) {
            document.getElementById('content-phong-tuc').classList.add('hidden');
            document.getElementById('content-phong-tuc').classList.remove('grid');
            document.getElementById('content-nong-nghiep').classList.add('hidden');
            document.getElementById('content-nong-nghiep').classList.remove('grid');

            document.getElementById('btn-phong-tuc').classList.remove('active-tab', 'text-white');
            document.getElementById('btn-phong-tuc').classList.add('text-cold-indigo');
            document.getElementById('btn-nong-nghiep').classList.remove('active-tab', 'text-white');
            document.getElementById('btn-nong-nghiep').classList.add('text-cold-indigo');

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
                    btn.classList.add('bg-cold-indigo', 'text-white');
                    btn.classList.remove('bg-gray-100', 'text-gray-600');
                } else {
                    btn.classList.remove('bg-cold-indigo', 'text-white');
                    btn.classList.add('bg-gray-100', 'text-gray-600');
                }
            });

            const items = filter === 'all' ? foodData : foodData.filter(i => i.type === filter);

            items.forEach(item => {
                const el = document.createElement('div');
                let colorClass = item.type === 'good' 
                    ? 'bg-yellow-50 border-yellow-100 text-yellow-900' 
                    : 'bg-blue-50 border-blue-100 text-blue-900 opacity-70';

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

        // --- Canvas Animation (Frost/Mist) ---
        function initFrostCanvas() {
            const canvas = document.getElementById('frostCanvas');
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
                    this.vy = Math.random() * 0.2 + 0.1; // Slow fall
                    this.size = Math.random() * 2 + 0.5;
                    this.opacity = Math.random() * 0.5 + 0.1;
                }
                update() {
                    this.x += this.vx;
                    this.y += this.vy;
                    if (this.y > height) {
                        this.y = -5;
                        this.x = Math.random() * width;
                    }
                }
                draw() {
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                    ctx.fillStyle = \`rgba(255, 255, 255, \${this.opacity})\`;
                    ctx.fill();
                }
            }

            for(let i=0; i<80; i++) particles.push(new Particle());

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
            initFrostCanvas();
            filterFood('all');

            // Chart 1: Solar Term 195 deg
            const ctx1 = document.getElementById('solarChart').getContext('2d');
            new Chart(ctx1, {
                type: 'doughnut',
                data: {
                    labels: ['Hàn Lộ', 'Sương Giáng', 'Lập Đông', 'Mùa Khác'],
                    datasets: [{
                        data: [15, 15, 15, 315],
                        backgroundColor: ['#2B2D42', '#8D99AE', '#14213D', '#EDF2F4'],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    rotation: 105, 
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
                        ctx.fillStyle = "#2B2D42";
                        var text = "195°",
                            textX = Math.round((width - ctx.measureText(text).width) / 2),
                            textY = height / 2;
                        ctx.fillText(text, textX, textY);
                        ctx.save();
                    }
                }]
            });

            // Chart 2: Climate Radar
            const ctx2 = document.getElementById('climateRadar').getContext('2d');
            new Chart(ctx2, {
                type: 'radar',
                data: {
                    labels: ['Độ Lạnh (Hàn)', 'Độ Khô (Táo)', 'Độ Dài Đêm', 'Dương Khí', 'Sương Giá'],
                    datasets: [{
                        label: 'Mức Độ',
                        data: [80, 70, 60, 30, 75],
                        backgroundColor: 'rgba(43, 45, 66, 0.2)',
                        borderColor: '#2B2D42',
                        pointBackgroundColor: '#FFB703',
                        pointBorderColor: '#fff',
                        pointHoverBackgroundColor: '#fff',
                        pointHoverBorderColor: '#2B2D42'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        r: {
                            angleLines: { color: '#8D99AE' },
                            grid: { color: '#8D99AE' },
                            pointLabels: { color: '#2B2D42', font: { family: "'Be Vietnam Pro'", size: 12 } },
                            ticks: { display: false, backdropColor: 'transparent' }
                        }
                    },
                    plugins: {
                        legend: { display: false }
                    }
                }
            });
        });
    </script>
</body>
</html>
`
