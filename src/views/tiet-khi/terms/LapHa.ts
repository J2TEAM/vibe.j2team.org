export const LapHa = `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Lập Hạ: Khúc Hoan Ca Của Sự Trưởng Thành & Nhiệt Huyết</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    
    <!-- Fonts: Philosopher (Tiêu đề - Uy nghi), Be Vietnam Pro (Nội dung - Mạch lạc), Dancing Script (Thơ - Bay bổng) -->
    <link href="https://fonts.googleapis.com/css2?family=Philosopher:ital,wght@0,400;0,700;1,400;1,700&family=Be+Vietnam+Pro:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400&family=Dancing+Script:wght@400;700&display=swap" rel="stylesheet">
    
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        'summer-red': '#E63946',    // Đỏ nhiệt huyết (Hỏa/Tâm)
                        'sun-yellow': '#FFB703',    // Vàng nắng (Dương khí)
                        'growth-green': '#2A9D8F',  // Xanh sinh trưởng (Vạn vật)
                        'cool-blue': '#A8DADC',     // Xanh mát (Cân bằng/Tĩnh)
                        'paper-warm': '#FFF1E6',    // Nền giấy ấm
                        'deep-charcoal': '#1D3557'  // Màu than (Tương phản)
                    },
                    fontFamily: {
                        serif: ['"Philosopher"', 'serif'],
                        sans: ['"Be Vietnam Pro"', 'sans-serif'],
                        script: ['"Dancing Script"', 'cursive'],
                    },
                    animation: {
                        'pulse-sun': 'pulseSun 4s infinite',
                    },
                    keyframes: {
                        pulseSun: {
                            '0%, 100%': { transform: 'scale(1)', opacity: '1' },
                            '50%': { transform: 'scale(1.1)', opacity: '0.8' },
                        }
                    }
                }
            }
        }
    </script>
    <style>
        body {
            background-color: #FFF1E6;
            color: #1D3557;
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
        /* Sun Ray Canvas Layer */
        #sunCanvas {
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
        }
        .card-interaction:hover {
            transform: translateY(-5px);
            border-color: #E63946;
            box-shadow: 0 10px 30px -10px rgba(230, 57, 70, 0.2);
            background-color: white;
        }
        .active-tab {
            background-color: #E63946;
            color: white;
            border-color: #E63946;
        }
        .no-scrollbar::-webkit-scrollbar {
            display: none;
        }
        .no-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
    </style>
    <!-- Chosen Palette: "Summer Brilliance" - Fiery Red, Sun Yellow, Cool Blue Accent -->
    <!-- Application Structure Plan:
        1. Hero: Title with "Sun Rays" visual cue (Canvas animation).
        2. Thien Tuong (Cosmic): Chart showing 45° & Temperature/Yang Energy spike.
        3. Tam Hau (Nature): 3 Micro-seasons (Crickets, Earthworms, Vines).
        4. Doi Song (Life): Tabs for Agriculture ("Busy Fields") & Customs ("Weighing People", "Eggs").
        5. Duong Sinh (Health): "Nourish Heart" - Food Filter (Red/Bitter vs Greasy/Cold).
        6. Chiem Nghiem (Philosophy): Passion vs Calmness (Tam Tinh).
        7. Footer: Copyright Tich Phong Thien Son.
    -->
    <!-- Visualization & Content Choices:
        1. Solar Gauge: Chart.js Doughnut (45°).
        2. Energy Rise: Bar Chart showing Yang Energy jumping from Spring to Summer.
        3. Food Filter: Logic for Heart-nourishing foods (Red/Bitter).
        4. Sun Animation: HTML5 Canvas rotating rays.
    -->
    <!-- CONFIRMATION: NO SVG graphics used. NO Mermaid JS used. -->
</head>
<body class="font-sans antialiased leading-relaxed selection:bg-summer-red selection:text-white">

    <!-- Background Animation -->
    <canvas id="sunCanvas"></canvas>

    <!-- Navigation -->
    <nav class="sticky top-0 z-50 bg-paper-warm/95 backdrop-blur-md border-b border-summer-red/10 shadow-sm transition-all duration-300">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between h-20 items-center">
                <div class="flex-shrink-0 flex items-center gap-3">
                    <span class="text-3xl filter drop-shadow-sm animate-pulse-sun">☀️</span>
                    <div class="flex flex-col">
                        <span class="text-2xl font-serif font-bold text-summer-red tracking-wide">Lập Hạ</span>
                        <span class="text-xs font-sans text-sun-yellow uppercase tracking-widest font-bold">Khúc Hoan Ca Mùa Hạ</span>
                    </div>
                </div>
                <div class="hidden md:flex space-x-10">
                    <button onclick="scrollToSection('y-nghia')" class="text-deep-charcoal hover:text-summer-red transition font-medium tracking-wide text-sm uppercase">Ý Nghĩa</button>
                    <button onclick="scrollToSection('tam-hau')" class="text-deep-charcoal hover:text-summer-red transition font-medium tracking-wide text-sm uppercase">Tam Hậu</button>
                    <button onclick="scrollToSection('doi-song')" class="text-deep-charcoal hover:text-summer-red transition font-medium tracking-wide text-sm uppercase">Đời Sống</button>
                    <button onclick="scrollToSection('duong-sinh')" class="text-deep-charcoal hover:text-summer-red transition font-medium tracking-wide text-sm uppercase">Dưỡng Sinh</button>
                    <button onclick="scrollToSection('chiem-nghiem')" class="text-deep-charcoal hover:text-summer-red transition font-medium tracking-wide text-sm uppercase">Chiêm Nghiệm</button>
                </div>
            </div>
        </div>
    </nav>

    <!-- Hero Section -->
    <header class="relative pt-24 pb-20 px-4 text-center z-10 overflow-hidden">
        <div class="max-w-4xl mx-auto">
            <p class="text-summer-red font-bold tracking-[0.3em] uppercase mb-6 text-sm font-sans">Tiết Khí Thứ 7 • 5-6 Tháng 5</p>
            <h1 class="text-6xl md:text-8xl font-serif font-bold text-deep-charcoal mb-6 leading-tight relative inline-block">
                Lập Hạ
                <span class="absolute -top-4 -right-12 text-4xl animate-bounce">🔥</span>
            </h1>
            <h2 class="text-3xl md:text-5xl font-script text-sun-yellow mb-10 font-bold transform -rotate-1">
                Sự Trưởng Thành & Nhiệt Huyết
            </h2>
            <div class="w-24 h-1 bg-summer-red mx-auto mb-10 rounded-full shadow-lg"></div>
            <p class="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-loose font-light">
                "Lời tuyên bố dõng dạc về sự hiện diện của mùa Hè. Vạn vật sau khi sinh sôi ở mùa xuân nay bước vào giai đoạn phát triển cực thịnh dưới ánh nắng rực rỡ."
            </p>
            <div class="mt-14">
                <button onclick="scrollToSection('y-nghia')" class="group relative inline-flex items-center justify-center px-10 py-3 overflow-hidden font-serif italic tracking-wide text-white transition duration-300 ease-out border-2 border-summer-red rounded-full shadow-md bg-summer-red">
                    <span class="absolute inset-0 flex items-center justify-center w-full h-full text-white duration-300 -translate-x-full bg-sun-yellow group-hover:translate-x-0 ease">
                        <span class="text-xl text-deep-charcoal">🌻</span>
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
            <h3 class="text-4xl font-serif font-bold text-summer-red mb-4 inline-block relative">
                Ngưỡng Cửa Mùa Hè
                <span class="absolute -bottom-2 left-0 w-full h-1 bg-sun-yellow"></span>
            </h3>
            <p class="text-gray-600 max-w-2xl mx-auto mt-6 text-lg leading-relaxed">
                Mặt Trời kinh độ 45°. "Lập" là bắt đầu, "Hạ" là mùa hè. Gió Nam ấm áp thổi về, nhiệt độ tăng cao, báo hiệu sự "Trưởng" (Lớn mạnh) của vạn vật.
            </p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <!-- Charts Column -->
            <div class="space-y-10">
                <div class="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
                    <h4 class="text-xl font-serif font-bold text-summer-red mb-2 text-center">Vị Trí Thiên Văn (45°)</h4>
                    <div class="chart-container">
                        <canvas id="solarChart"></canvas>
                    </div>
                </div>
                
                <div class="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                    <h4 class="text-xl font-serif font-bold text-deep-charcoal mb-2 text-center">Sự Bùng Nổ Năng Lượng Dương</h4>
                    <div class="chart-container" style="height: 250px;">
                        <canvas id="energyChart"></canvas>
                    </div>
                    <p class="text-center text-sm text-gray-400 mt-4 italic">Nhiệt độ & Dương khí tăng mạnh so với Xuân.</p>
                </div>
            </div>

            <!-- Content Explanation -->
            <div class="space-y-8 text-lg text-gray-600 leading-relaxed font-light">
                <div class="p-6 bg-white rounded-xl border-l-4 border-summer-red shadow-sm">
                    <strong class="text-deep-charcoal font-serif text-xl block mb-2">Đặc Điểm Khí Hậu</strong>
                    <p>
                        Gió Nam thay thế gió Đông. Sấm sét và mưa rào xuất hiện nhiều hơn (Lôi vũ), tạo điều kiện lý tưởng cho cây cối quang hợp và phát triển nhanh chóng.
                    </p>
                </div>
                <div>
                    <strong class="text-deep-charcoal font-serif text-xl block mb-2">Ý Nghĩa Triết Học</strong>
                    <p>
                        Mùa Hạ là mùa của hành động, của sự bộc lộ ra bên ngoài. Năng lượng tích tụ từ mùa Đông và nảy mầm ở mùa Xuân nay được giải phóng mạnh mẽ.
                    </p>
                </div>
            </div>
        </div>
    </section>

    <!-- Section 2: Tam Hậu (Nature) -->
    <section id="tam-hau" class="py-24 bg-white relative z-10">
        <div class="max-w-6xl mx-auto px-4">
            <h3 class="text-3xl font-serif font-bold text-growth-green mb-12 text-center">Tam Hậu: Ba Tín Hiệu Mùa Hạ</h3>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                <!-- Card 1 -->
                <div class="card-interaction bg-paper-warm p-8 rounded-2xl cursor-default group text-center">
                    <div class="w-20 h-20 mx-auto rounded-full bg-sun-yellow/20 flex items-center justify-center text-4xl mb-6 group-hover:scale-110 transition">🦗</div>
                    <h5 class="font-bold text-xl text-deep-charcoal mb-3 font-serif">1. Lâu Quắc Minh</h5>
                    <p class="text-gray-600 font-light">Dế mèn (hoặc ếch nhái) cảm nhận được khí nóng bắt đầu kêu vang, báo hiệu mùa hè sôi động.</p>
                </div>

                <!-- Card 2 -->
                <div class="card-interaction bg-paper-warm p-8 rounded-2xl cursor-default group text-center">
                    <div class="w-20 h-20 mx-auto rounded-full bg-summer-red/10 flex items-center justify-center text-4xl mb-6 group-hover:scale-110 transition">🪱</div>
                    <h5 class="font-bold text-xl text-deep-charcoal mb-3 font-serif">2. Dẫn Dũng Xuất</h5>
                    <p class="text-gray-600 font-light">Giun đất chui lên khỏi mặt đất để hô hấp vì lòng đất bắt đầu nóng và ẩm ướt.</p>
                </div>

                <!-- Card 3 -->
                <div class="card-interaction bg-paper-warm p-8 rounded-2xl cursor-default group text-center">
                    <div class="w-20 h-20 mx-auto rounded-full bg-growth-green/20 flex items-center justify-center text-4xl mb-6 group-hover:scale-110 transition">🥒</div>
                    <h5 class="font-bold text-xl text-deep-charcoal mb-3 font-serif">3. Vương Qua Sinh</h5>
                    <p class="text-gray-600 font-light">Các loại dây leo như dưa chuột, mướp bắt đầu vươn ngọn mạnh mẽ, phủ xanh giàn.</p>
                </div>
            </div>
        </div>
    </section>

    <!-- Section 3: Đời Sống (Tabs) -->
    <section id="doi-song" class="py-24 px-4 bg-paper-warm relative z-10">
        <div class="max-w-6xl mx-auto">
            <div class="mb-12 text-center">
                <h3 class="text-4xl font-serif font-bold text-summer-red mb-4">Mùa Màng & Phong Tục</h3>
                <p class="text-gray-600 italic">"Lập Hạ xem lúa, Tiểu Mãn xem râu"</p>
            </div>

            <!-- Custom Tabs -->
            <div class="flex justify-center mb-10 space-x-4">
                <button onclick="switchTab('nong-nghiep')" id="btn-nong-nghiep" class="active-tab px-8 py-3 rounded-full border border-summer-red font-bold transition duration-300 font-serif tracking-wide shadow-sm">Nông Nghiệp</button>
                <button onclick="switchTab('phong-tuc')" id="btn-phong-tuc" class="px-8 py-3 rounded-full border border-summer-red text-summer-red font-bold hover:bg-summer-red hover:text-white transition duration-300 font-serif tracking-wide shadow-sm">Phong Tục</button>
            </div>

            <!-- Content Area -->
            <div class="bg-white p-8 md:p-12 rounded-3xl border border-gray-100 min-h-[400px] flex items-center shadow-sm relative overflow-hidden">
                <div class="absolute top-0 right-0 w-32 h-32 bg-sun-yellow/10 rounded-bl-full pointer-events-none"></div>

                <!-- Nong Nghiep Content -->
                <div id="content-nong-nghiep" class="grid grid-cols-1 md:grid-cols-2 gap-10 w-full animate-fade-in">
                    <div class="flex flex-col justify-center">
                        <h4 class="text-3xl font-serif font-bold text-growth-green mb-6">Bận Rộn & Hối Hả</h4>
                        <p class="text-gray-700 leading-relaxed mb-6">
                            Lúa chiêm trổ đòng, ngậm sữa. Hoa màu phát triển thần tốc.
                        </p>
                        <ul class="space-y-4 text-gray-600 font-light">
                            <li class="flex items-start gap-3">
                                <span class="text-summer-red font-bold">🌾</span>
                                <span>Đánh giá năng suất lúa, chuẩn bị thu hoạch.</span>
                            </li>
                            <li class="flex items-start gap-3">
                                <span class="text-summer-red font-bold">🌽</span>
                                <span>Làm cỏ, bón phân cho ngô, khoai, đậu đỗ.</span>
                            </li>
                            <li class="flex items-start gap-3">
                                <span class="text-summer-red font-bold">🚜</span>
                                <span>Giai đoạn "vàng" cho sự tăng trưởng sinh khối.</span>
                            </li>
                        </ul>
                    </div>
                    <div class="flex items-center justify-center bg-paper-warm rounded-2xl p-6 border border-dashed border-gray-300">
                        <div class="text-center">
                            <div class="text-9xl mb-4 opacity-80 animate-pulse">🚜</div>
                            <p class="font-script text-2xl text-deep-charcoal">Mùa vụ hối hả</p>
                        </div>
                    </div>
                </div>

                <!-- Phong Tuc Content -->
                <div id="content-phong-tuc" class="hidden grid-cols-1 md:grid-cols-2 gap-10 w-full animate-fade-in">
                    <!-- Card 1 -->
                    <div class="bg-paper-warm p-8 rounded-2xl border-l-4 border-summer-red hover:bg-gray-50 transition group">
                        <div class="text-5xl mb-4 group-hover:scale-110 transition duration-300">⚖️</div>
                        <h4 class="text-2xl font-serif font-bold text-deep-charcoal mb-3">Cân Người (Xưng Nhân)</h4>
                        <p class="text-gray-600 leading-relaxed font-light">
                            Treo cân lớn để cân mọi người. Cầu chúc sức khỏe, tránh sụt cân, gầy yếu trong mùa hè khắc nghiệt ("khổ hạ").
                        </p>
                    </div>
                    <!-- Card 2 -->
                    <div class="bg-paper-warm p-8 rounded-2xl border-l-4 border-sun-yellow hover:bg-gray-50 transition group">
                        <div class="text-5xl mb-4 group-hover:scale-110 transition duration-300">🥚</div>
                        <h4 class="text-2xl font-serif font-bold text-deep-charcoal mb-3">Ăn Trứng Lập Hạ</h4>
                        <p class="text-gray-600 leading-relaxed font-light">
                            Trẻ em đeo túi trứng trước ngực. Cầu mong trái tim khỏe mạnh, tinh thần vững vàng (Trứng tượng trưng cho Tim).
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
                    <span class="text-summer-red font-bold tracking-widest uppercase text-sm">Hành Hỏa • Tạng Tâm</span>
                    <h3 class="text-4xl font-serif font-bold text-deep-charcoal mt-2 mb-6">Dưỡng Tâm, Trọng Tĩnh</h3>
                    <p class="text-gray-600 text-lg leading-relaxed mb-6">
                        Khí trời nóng bức làm Tâm hỏa bốc lên. Nguyên tắc là <strong>"Dưỡng Tâm"</strong> và <strong>"Tâm Tĩnh Tự Nhiên Lương"</strong>.
                    </p>
                    <div class="bg-white p-6 rounded-xl border-l-4 border-summer-red shadow-sm">
                        <h4 class="font-bold text-lg text-summer-red mb-2 font-serif">Nguyên Tắc Ẩm Thực</h4>
                        <p class="text-gray-600 mb-2"><strong>Màu Đỏ & Đắng:</strong> Dưỡng Tim và thanh nhiệt (Đậu đỏ, Khổ qua).</p>
                        <p class="text-gray-600"><strong>Thanh Đạm:</strong> Tránh dầu mỡ, cay nóng gây bốc hỏa.</p>
                    </div>
                </div>

                <div class="space-y-4 font-sans text-gray-700">
                    <div class="flex items-center gap-4 p-3 bg-white rounded-lg shadow-sm">
                        <div class="w-10 h-10 rounded-full bg-summer-red/10 flex items-center justify-center text-xl">😴</div>
                        <div>
                            <strong>Tí Ngọ Giác:</strong> Ngủ trưa ngắn (15-30p) để dưỡng Tâm khí.
                        </div>
                    </div>
                    <div class="flex items-center gap-4 p-3 bg-white rounded-lg shadow-sm">
                        <div class="w-10 h-10 rounded-full bg-summer-red/10 flex items-center justify-center text-xl">🧘</div>
                        <div>
                            <strong>Tâm Tĩnh:</strong> Tránh đại hỉ đại nộ. Giữ tâm trạng vui vẻ, thoải mái.
                        </div>
                    </div>
                </div>
            </div>

            <!-- Right: Interactive Food Filter -->
            <div class="lg:col-span-7">
                <div class="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden flex flex-col h-full">
                    <div class="bg-deep-charcoal p-8 text-white">
                        <h4 class="text-2xl font-serif font-bold flex items-center gap-3">
                            <span>❤️</span> Thực Đơn Dưỡng Tâm
                        </h4>
                        <p class="opacity-90 mt-2 font-light text-sm">Chọn thực phẩm màu đỏ (bổ Tâm) và vị đắng (giải nhiệt).</p>
                    </div>

                    <!-- Filters -->
                    <div class="p-6 border-b border-gray-100 flex gap-3 overflow-x-auto no-scrollbar">
                        <button onclick="filterFood('all')" class="food-btn active px-5 py-2 rounded-full text-sm font-bold bg-gray-100 text-gray-600 hover:bg-gray-200 transition whitespace-nowrap" data-filter="all">Tất Cả</button>
                        <button onclick="filterFood('good')" class="food-btn px-5 py-2 rounded-full text-sm font-bold bg-gray-100 text-gray-600 hover:bg-gray-200 transition whitespace-nowrap" data-filter="good">Nên Dùng (Đỏ/Đắng/Mát)</button>
                        <button onclick="filterFood('bad')" class="food-btn px-5 py-2 rounded-full text-sm font-bold bg-gray-100 text-gray-600 hover:bg-gray-200 transition whitespace-nowrap" data-filter="bad">Hạn Chế (Béo/Cay/Đá)</button>
                    </div>

                    <!-- Grid -->
                    <div id="food-grid" class="p-6 grid grid-cols-2 sm:grid-cols-3 gap-4 overflow-y-auto max-h-[500px] bg-paper-warm">
                        <!-- JS populated -->
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Section 5: Chiêm Nghiệm (Philosophy) -->
    <section id="chiem-nghiem" class="py-32 bg-deep-charcoal text-white text-center px-4 relative overflow-hidden">
        <!-- Abstract Background Shape -->
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-summer-red/20 rounded-full blur-[100px] pointer-events-none"></div>

        <div class="max-w-3xl mx-auto relative z-10">
            <span class="text-6xl text-gray-500 font-serif opacity-50 block mb-6">❝</span>
            
            <h3 class="text-4xl md:text-5xl font-serif font-bold mb-10 text-white leading-tight">
                Nhiệt Huyết & Tĩnh Lặng
            </h3>
            
            <p class="text-xl text-gray-300 leading-loose mb-12 font-sans font-light">
                Sống nhiệt tình như mùa hạ, nhưng hãy giữ cái đầu lạnh và trái tim ấm áp. Giữa cái nắng chói chang, hãy giữ một "bóng râm" trong tâm hồn. Đừng để cơn giận dữ thiêu đốt bản thân. Hãy trưởng thành rực rỡ nhưng vững chãi.
            </p>

            <div class="inline-block border border-gray-600 rounded-2xl p-10 bg-white/5 backdrop-blur-sm hover:bg-white/10 transition duration-500 cursor-default group">
                <p class="font-bold uppercase tracking-[0.2em] text-sm text-sun-yellow mb-6 font-sans group-hover:text-white transition">Lời Chúc Lập Hạ</p>
                <div class="text-3xl md:text-4xl font-script text-summer-red leading-relaxed group-hover:scale-105 transition duration-500">
                    "Tâm an trong nắng lửa,<br>Dạ sáng tựa sao trời."
                </div>
            </div>
            
            <span class="text-6xl text-gray-500 font-serif opacity-50 block mt-12">❞</span>
        </div>
    </section>

    <!-- Footer -->
    <footer class="bg-[#152a45] text-gray-500 py-12 text-center text-sm font-sans border-t border-gray-800">
        <p class="italic tracking-wide mb-3 text-gray-400">Biên soạn dựa trên nguyên lý 24 Tiết khí & Văn hóa Phương Đông</p>
        <p class="text-gray-600">© Bản quyền thuộc về <span class="font-script text-xl text-summer-red ml-1">Tịch Phong Thiên Sơn - 夕风天山</span></p>
    </footer>

    <!-- Javascript Logic -->
    <script>
        // --- Data ---
        const foodData = [
            { name: "Đậu Đỏ", type: "good", icon: "🫘", desc: "Dưỡng tâm, bổ huyết, lợi thủy" },
            { name: "Khổ Qua", type: "good", icon: "🥒", desc: "Thanh nhiệt, giải độc, trừ tâm hỏa" },
            { name: "Dưa Hấu", type: "good", icon: "🍉", desc: "Giải khát, sinh tân dịch" },
            { name: "Cà Chua", type: "good", icon: "🍅", desc: "Màu đỏ dưỡng tim, mát gan" },
            { name: "Táo Đỏ", type: "good", icon: "🍎", desc: "An thần, bổ khí" },
            { name: "Sen (Tâm/Hạt)", type: "good", icon: "🪷", desc: "Thanh tâm hỏa, an giấc ngủ" },
            { name: "Ớt Cay", type: "bad", icon: "🌶️", desc: "Tăng hỏa khí, gây bứt rứt" },
            { name: "Thịt Mỡ", type: "bad", icon: "🥩", desc: "Gây khó tiêu, nóng trong" },
            { name: "Nước Đá", type: "bad", icon: "🧊", desc: "Sốc nhiệt, hại tỳ vị" }
        ];

        // --- Tab Logic ---
        function switchTab(tab) {
            document.getElementById('content-nong-nghiep').classList.add('hidden');
            document.getElementById('content-nong-nghiep').classList.remove('grid');
            document.getElementById('content-phong-tuc').classList.add('hidden');
            document.getElementById('content-phong-tuc').classList.remove('grid');

            document.getElementById('btn-nong-nghiep').classList.remove('active-tab', 'text-white');
            document.getElementById('btn-nong-nghiep').classList.add('text-summer-red');
            document.getElementById('btn-phong-tuc').classList.remove('active-tab', 'text-white');
            document.getElementById('btn-phong-tuc').classList.add('text-summer-red');

            const content = document.getElementById(\`content-\${tab}\`);
            content.classList.remove('hidden');
            content.classList.add('grid');
            
            const btn = document.getElementById(\`btn-\${tab}\`);
            btn.classList.add('active-tab');
            btn.classList.remove('text-summer-red');
        }

        // --- Food Filter Logic ---
        function filterFood(filter) {
            const grid = document.getElementById('food-grid');
            grid.innerHTML = ''; 

            document.querySelectorAll('.food-btn').forEach(btn => {
                if(btn.dataset.filter === filter) {
                    btn.classList.add('bg-deep-charcoal', 'text-white');
                    btn.classList.remove('bg-gray-100', 'text-gray-600');
                } else {
                    btn.classList.remove('bg-deep-charcoal', 'text-white');
                    btn.classList.add('bg-gray-100', 'text-gray-600');
                }
            });

            const items = filter === 'all' ? foodData : foodData.filter(i => i.type === filter);

            items.forEach(item => {
                const el = document.createElement('div');
                let colorClass = item.type === 'good' 
                    ? 'bg-red-50 border-red-100 text-red-900' 
                    : 'bg-gray-200 border-gray-300 text-gray-500 opacity-70';

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

        // --- Canvas Animation (Sun Rays) ---
        function initSunCanvas() {
            const canvas = document.getElementById('sunCanvas');
            const ctx = canvas.getContext('2d');
            let width, height;
            let rays = [];

            function resize() {
                width = window.innerWidth;
                height = window.innerHeight;
                canvas.width = width;
                canvas.height = height;
            }
            window.addEventListener('resize', resize);
            resize();

            class Ray {
                constructor() {
                    this.angle = Math.random() * Math.PI * 2;
                    this.length = Math.max(width, height);
                    this.width = Math.random() * 50 + 20;
                    this.speed = Math.random() * 0.002 + 0.001;
                    this.opacity = Math.random() * 0.1;
                }
                update() {
                    this.angle += this.speed;
                }
                draw() {
                    ctx.save();
                    ctx.translate(width/2, height/2); // Center of sun
                    ctx.rotate(this.angle);
                    
                    const gradient = ctx.createLinearGradient(0, 0, this.length, 0);
                    gradient.addColorStop(0, \`rgba(255, 183, 3, \${this.opacity})\`); // Sun Yellow
                    gradient.addColorStop(1, 'rgba(255, 183, 3, 0)');

                    ctx.fillStyle = gradient;
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.lineTo(this.length, -this.width/2);
                    ctx.lineTo(this.length, this.width/2);
                    ctx.fill();
                    ctx.restore();
                }
            }

            for(let i=0; i<12; i++) rays.push(new Ray());

            function animate() {
                ctx.clearRect(0, 0, width, height);
                rays.forEach(r => {
                    r.update();
                    r.draw();
                });
                requestAnimationFrame(animate);
            }
            animate();
        }

        // --- Init ---
        document.addEventListener('DOMContentLoaded', () => {
            initSunCanvas();
            filterFood('all');

            // Chart 1: Solar Term 45 deg
            const ctx1 = document.getElementById('solarChart').getContext('2d');
            new Chart(ctx1, {
                type: 'doughnut',
                data: {
                    labels: ['Lập Hạ', 'Tiểu Mãn', 'Mang Chủng', 'Mùa Khác'],
                    datasets: [{
                        data: [15, 15, 15, 315],
                        backgroundColor: ['#E63946', '#FFB703', '#2A9D8F', '#FFF1E6'],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    rotation: -45, 
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
                        ctx.fillStyle = "#E63946";
                        var text = "45°",
                            textX = Math.round((width - ctx.measureText(text).width) / 2),
                            textY = height / 2;
                        ctx.fillText(text, textX, textY);
                        ctx.save();
                    }
                }]
            });

            // Chart 2: Energy Rise
            const ctx2 = document.getElementById('energyChart').getContext('2d');
            new Chart(ctx2, {
                type: 'line',
                data: {
                    labels: ['Cốc Vũ', 'Lập Hạ', 'Tiểu Mãn', 'Mang Chủng'],
                    datasets: [
                        {
                            label: 'Nhiệt Lượng',
                            data: [35, 60, 75, 90],
                            borderColor: '#E63946',
                            backgroundColor: 'rgba(230, 57, 70, 0.1)',
                            fill: true,
                            tension: 0.4,
                            borderWidth: 3
                        },
                        {
                            label: 'Dương Khí',
                            data: [40, 65, 80, 95],
                            borderColor: '#FFB703',
                            borderDash: [5, 5],
                            tension: 0.4,
                            borderWidth: 2
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: { display: false },
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
