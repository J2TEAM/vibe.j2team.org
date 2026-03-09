export const MangChung = `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mang Chủng: Khúc Giao Hưởng Của Mùa Gieo Gặt</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    
    <!-- Fonts: Philosopher (Tiêu đề - Sâu sắc), Be Vietnam Pro (Nội dung - Chân phương), Dancing Script (Thơ - Bay bổng) -->
    <link href="https://fonts.googleapis.com/css2?family=Philosopher:ital,wght@0,400;0,700;1,400;1,700&family=Be+Vietnam+Pro:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400&family=Dancing+Script:wght@400;700&display=swap" rel="stylesheet">
    
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        'harvest-gold': '#F4A261',  // Vàng cam (Lúa chín/Thu hoạch)
                        'sowing-green': '#2A9D8F',  // Xanh mạ (Gieo trồng/Hy vọng)
                        'earth-brown': '#6F4E37',   // Nâu đất (Cần cù/Gốc rễ)
                        'rain-gray': '#E9ECEF',     // Xám mưa (Mưa Mai Ngư)
                        'deep-indigo': '#264653',   // Xanh chàm (Sâu sắc)
                        'rice-white': '#FEFAE0'     // Trắng ngà (Nền)
                    },
                    fontFamily: {
                        serif: ['"Philosopher"', 'serif'],
                        sans: ['"Be Vietnam Pro"', 'sans-serif'],
                        script: ['"Dancing Script"', 'cursive'],
                    },
                    animation: {
                        'sprout': 'sprout 3s ease-out infinite',
                    },
                    keyframes: {
                        sprout: {
                            '0%': { transform: 'scale(0.8)', opacity: '0.5' },
                            '50%': { transform: 'scale(1.1)', opacity: '1' },
                            '100%': { transform: 'scale(0.8)', opacity: '0.5' },
                        }
                    }
                }
            }
        }
    </script>
    <style>
        body {
            background-color: #FEFAE0;
            color: #264653;
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
        /* Grain Canvas Layer */
        #grainCanvas {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 0;
            opacity: 0.2;
        }
        /* Interactions */
        .card-interaction {
            transition: all 0.3s ease-out;
            border: 1px solid transparent;
        }
        .card-interaction:hover {
            transform: translateY(-5px);
            border-color: #F4A261;
            box-shadow: 0 10px 30px -10px rgba(244, 162, 97, 0.3);
            background-color: white;
        }
        .active-tab {
            background-color: #2A9D8F;
            color: white;
            border-color: #2A9D8F;
        }
        .no-scrollbar::-webkit-scrollbar {
            display: none;
        }
        .no-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
    </style>
    <!-- Chosen Palette: "Harvest & Sowing" - Golden Orange, Fresh Green, Deep Earth -->
    <!-- Application Structure Plan:
        1. Hero: Title with "Grain/Seed" visual cue (Canvas animation).
        2. Thien Tuong (Cosmic): Chart showing 75° & The cycle of End/Begin.
        3. Tam Hau (Nature): 3 Micro-seasons (Mantis, Shrike, Mockingbird).
        4. Doi Song (Life): Tabs for Agriculture ("Race against Time") & Customs ("Farewell Flora", "Plum Wine").
        5. Duong Sinh (Health): "Clear Dampness/Awaken Spirit" - Food Filter (Bitter/Cooling vs Greasy/Salty).
        6. Chiem Nghiem (Philosophy): Karma & Continuity (Gieo Nhan Gat Qua).
        7. Footer: Copyright Tich Phong Thien Son.
    -->
    <!-- Visualization & Content Choices:
        1. Solar Gauge: Chart.js Doughnut (75°).
        2. Cycle Chart: Pie Chart showing 50% Harvesting / 50% Sowing overlap.
        3. Food Filter: Logic for Heat-clearing/Diuretic foods (Bitter melon, Mung bean).
        4. Grain Animation: HTML5 Canvas for falling seeds/grains.
    -->
    <!-- CONFIRMATION: NO SVG graphics used. NO Mermaid JS used. -->
</head>
<body class="font-sans antialiased leading-relaxed selection:bg-harvest-gold selection:text-white">

    <!-- Background Animation -->
    <canvas id="grainCanvas"></canvas>

    <!-- Navigation -->
    <nav class="sticky top-0 z-50 bg-rice-white/95 backdrop-blur-md border-b border-sowing-green/20 shadow-sm transition-all duration-300">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between h-20 items-center">
                <div class="flex-shrink-0 flex items-center gap-3">
                    <span class="text-3xl filter drop-shadow-sm animate-sprout">🌾</span>
                    <div class="flex flex-col">
                        <span class="text-2xl font-serif font-bold text-earth-brown tracking-wide">Mang Chủng</span>
                        <span class="text-xs font-sans text-sowing-green uppercase tracking-widest font-bold">Gieo Gặt Song Hành</span>
                    </div>
                </div>
                <div class="hidden md:flex space-x-10">
                    <button onclick="scrollToSection('y-nghia')" class="text-deep-indigo hover:text-harvest-gold transition font-medium tracking-wide text-sm uppercase">Ý Nghĩa</button>
                    <button onclick="scrollToSection('tam-hau')" class="text-deep-indigo hover:text-harvest-gold transition font-medium tracking-wide text-sm uppercase">Tam Hậu</button>
                    <button onclick="scrollToSection('doi-song')" class="text-deep-indigo hover:text-harvest-gold transition font-medium tracking-wide text-sm uppercase">Đời Sống</button>
                    <button onclick="scrollToSection('duong-sinh')" class="text-deep-indigo hover:text-harvest-gold transition font-medium tracking-wide text-sm uppercase">Dưỡng Sinh</button>
                    <button onclick="scrollToSection('chiem-nghiem')" class="text-deep-indigo hover:text-harvest-gold transition font-medium tracking-wide text-sm uppercase">Chiêm Nghiệm</button>
                </div>
            </div>
        </div>
    </nav>

    <!-- Hero Section -->
    <header class="relative pt-24 pb-20 px-4 text-center z-10 overflow-hidden">
        <div class="max-w-4xl mx-auto">
            <p class="text-sowing-green font-bold tracking-[0.3em] uppercase mb-6 text-sm font-sans">Tiết Khí Thứ 9 • 5-6 Tháng 6</p>
            <h1 class="text-6xl md:text-8xl font-serif font-bold text-deep-indigo mb-6 leading-tight relative inline-block">
                Mang Chủng
                <span class="absolute -top-4 -right-12 text-4xl animate-bounce">🌱</span>
            </h1>
            <h2 class="text-3xl md:text-5xl font-script text-harvest-gold mb-10 font-bold transform -rotate-1">
                Khúc Giao Hưởng Của Mùa Gieo Gặt
            </h2>
            <div class="w-24 h-1 bg-sowing-green mx-auto mb-10 rounded-full"></div>
            <p class="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-loose font-light">
                "Vừa gặt hái thành quả mùa trước, vừa gieo xuống hy vọng cho mùa sau. Cái Kết và Khởi Đầu giao thoa mạnh mẽ nhất trong tiết khí này."
            </p>
            <div class="mt-14">
                <button onclick="scrollToSection('y-nghia')" class="group relative inline-flex items-center justify-center px-10 py-3 overflow-hidden font-serif italic tracking-wide text-white transition duration-300 ease-out border-2 border-harvest-gold rounded-full shadow-md bg-harvest-gold">
                    <span class="absolute inset-0 flex items-center justify-center w-full h-full text-white duration-300 -translate-x-full bg-sowing-green group-hover:translate-x-0 ease">
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
            <h3 class="text-4xl font-serif font-bold text-earth-brown mb-4 inline-block relative">
                Khi Hạt Có Râu Lên Tiếng
                <span class="absolute -bottom-2 left-0 w-full h-1 bg-harvest-gold/50"></span>
            </h3>
            <p class="text-gray-600 max-w-2xl mx-auto mt-6 text-lg leading-relaxed">
                Mặt Trời kinh độ 75°. "Mang" là râu của ngũ cốc, "Chủng" là hạt giống. Thời điểm vừa thu hoạch lúa mì (có râu), vừa gieo cấy lúa mùa.
            </p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <!-- Charts Column -->
            <div class="space-y-10">
                <div class="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
                    <h4 class="text-xl font-serif font-bold text-sowing-green mb-2 text-center">Vị Trí Thiên Văn (75°)</h4>
                    <div class="chart-container">
                        <canvas id="solarChart"></canvas>
                    </div>
                </div>
                
                <div class="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                    <h4 class="text-xl font-serif font-bold text-harvest-gold mb-2 text-center">Giao Thoa: Thu Hoạch & Gieo Trồng</h4>
                    <div class="chart-container" style="height: 250px;">
                        <canvas id="cycleChart"></canvas>
                    </div>
                    <p class="text-center text-sm text-gray-400 mt-4 italic">Sự tiếp nối không ngừng nghỉ của vòng đời.</p>
                </div>
            </div>

            <!-- Content Explanation -->
            <div class="space-y-8 text-lg text-gray-600 leading-relaxed font-light">
                <div class="p-6 bg-white rounded-xl border-l-4 border-harvest-gold shadow-sm">
                    <strong class="text-deep-indigo font-serif text-xl block mb-2">Ý Nghĩa Kép</strong>
                    <p>
                        Mang Chủng hàm chứa hai hành động song hành: Thu hoạch ngũ cốc vụ trước (lúa mì, đại mạch) và Gieo trồng hạt giống vụ sau (lúa mùa).
                    </p>
                </div>
                <div>
                    <strong class="text-deep-indigo font-serif text-xl block mb-2">Khí Hậu Đặc Trưng</strong>
                    <p>
                        Nóng ẩm rõ rệt, mưa nhiều (mưa Mai Ngư). Dương khí cực thịnh, độ ẩm cao thúc đẩy sự sinh trưởng mạnh mẽ nhưng cũng dễ gây mệt mỏi.
                    </p>
                </div>
            </div>
        </div>
    </section>

    <!-- Section 2: Tam Hậu (Nature) -->
    <section id="tam-hau" class="py-24 bg-white relative z-10">
        <div class="max-w-6xl mx-auto px-4">
            <h3 class="text-3xl font-serif font-bold text-sowing-green mb-12 text-center">Tam Hậu: Ba Tín Hiệu Của Đất Trời</h3>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                <!-- Card 1 -->
                <div class="card-interaction bg-rice-white p-8 rounded-2xl cursor-default group text-center">
                    <div class="w-20 h-20 mx-auto rounded-full bg-sowing-green/20 flex items-center justify-center text-4xl mb-6 group-hover:scale-110 transition">🦗</div>
                    <h5 class="font-bold text-xl text-deep-indigo mb-3 font-serif">1. Đường Lang Sinh</h5>
                    <p class="text-gray-600 font-light">Bọ ngựa con phá vỏ trứng chui ra, bắt đầu một vòng đời mới đầy sức sống.</p>
                </div>

                <!-- Card 2 -->
                <div class="card-interaction bg-rice-white p-8 rounded-2xl cursor-default group text-center">
                    <div class="w-20 h-20 mx-auto rounded-full bg-harvest-gold/20 flex items-center justify-center text-4xl mb-6 group-hover:scale-110 transition">🦅</div>
                    <h5 class="font-bold text-xl text-deep-indigo mb-3 font-serif">2. Quy Bắt Đầu Kêu</h5>
                    <p class="text-gray-600 font-light">Chim Bách Thanh (loài chim thích ăn sâu bọ) cất tiếng kêu, báo hiệu mùa hè sâu bọ sinh sôi.</p>
                </div>

                <!-- Card 3 -->
                <div class="card-interaction bg-rice-white p-8 rounded-2xl cursor-default group text-center">
                    <div class="w-20 h-20 mx-auto rounded-full bg-earth-brown/20 flex items-center justify-center text-4xl mb-6 group-hover:scale-110 transition">🐦</div>
                    <h5 class="font-bold text-xl text-deep-indigo mb-3 font-serif">3. Phản Thiệt Vô Thanh</h5>
                    <p class="text-gray-600 font-light">Chim Phản Thiệt (hót hay mùa xuân) ngừng hót, nhường chỗ cho âm thanh sôi động của mùa hạ.</p>
                </div>
            </div>
        </div>
    </section>

    <!-- Section 3: Đời Sống (Tabs) -->
    <section id="doi-song" class="py-24 px-4 bg-rice-white relative z-10">
        <div class="max-w-6xl mx-auto">
            <div class="mb-12 text-center">
                <h3 class="text-4xl font-serif font-bold text-harvest-gold mb-4">Nhà Nông Bất Hạ Thủ</h3>
                <p class="text-gray-600 italic">"Mang Chủng bận rộn, không ai được nghỉ ngơi"</p>
            </div>

            <!-- Custom Tabs -->
            <div class="flex justify-center mb-10 space-x-4">
                <button onclick="switchTab('nong-nghiep')" id="btn-nong-nghiep" class="active-tab px-8 py-3 rounded-full border border-sowing-green font-bold transition duration-300 font-serif tracking-wide shadow-sm">Nông Nghiệp</button>
                <button onclick="switchTab('phong-tuc')" id="btn-phong-tuc" class="px-8 py-3 rounded-full border border-sowing-green text-sowing-green font-bold hover:bg-sowing-green hover:text-white transition duration-300 font-serif tracking-wide shadow-sm">Phong Tục</button>
            </div>

            <!-- Content Area -->
            <div class="bg-white p-8 md:p-12 rounded-3xl border border-gray-100 min-h-[400px] flex items-center shadow-sm relative overflow-hidden">
                <div class="absolute top-0 right-0 w-32 h-32 bg-harvest-gold/10 rounded-bl-full pointer-events-none"></div>

                <!-- Nong Nghiep Content -->
                <div id="content-nong-nghiep" class="grid grid-cols-1 md:grid-cols-2 gap-10 w-full animate-fade-in">
                    <div class="flex flex-col justify-center">
                        <h4 class="text-3xl font-serif font-bold text-sowing-green mb-6">Chạy Đua Với Thời Gian</h4>
                        <p class="text-gray-700 leading-relaxed mb-6">
                            Tranh thủ từng khắc, giành giật từng giây. Vừa gặt xong là phải gieo ngay.
                        </p>
                        <ul class="space-y-4 text-gray-600 font-light">
                            <li class="flex items-start gap-3">
                                <span class="text-harvest-gold font-bold">🌾</span>
                                <span><strong>Thu Hoạch:</strong> Lúa mì, đại mạch chín vàng, cần gặt gấp trước khi mưa bão.</span>
                            </li>
                            <li class="flex items-start gap-3">
                                <span class="text-sowing-green font-bold">🌱</span>
                                <span><strong>Gieo Trồng:</strong> Làm đất, cấy lúa mùa ngay để kịp thời vụ.</span>
                            </li>
                        </ul>
                    </div>
                    <div class="flex items-center justify-center bg-rice-white rounded-2xl p-6 border border-dashed border-gray-300">
                        <div class="text-center">
                            <div class="text-9xl mb-4 opacity-80 animate-pulse">🚜</div>
                            <p class="font-script text-2xl text-deep-indigo">Hối hả mùa vụ</p>
                        </div>
                    </div>
                </div>

                <!-- Phong Tuc Content -->
                <div id="content-phong-tuc" class="hidden grid-cols-1 md:grid-cols-2 gap-10 w-full animate-fade-in">
                    <!-- Card 1 -->
                    <div class="bg-rice-white p-8 rounded-2xl border-l-4 border-harvest-gold hover:bg-gray-50 transition group">
                        <div class="text-5xl mb-4 group-hover:scale-110 transition duration-300">🌺</div>
                        <h4 class="text-2xl font-serif font-bold text-deep-indigo mb-3">Tiễn Hoa Thần</h4>
                        <p class="text-gray-600 leading-relaxed font-light">
                            Tháng 5 hoa xuân đã tàn. Người xưa làm lễ tiễn Hoa Thần về trời, bày tỏ lòng biết ơn và chút tiếc nuối (Điển tích "Đại Ngọc chôn hoa").
                        </p>
                    </div>
                    <!-- Card 2 -->
                    <div class="bg-rice-white p-8 rounded-2xl border-l-4 border-sowing-green hover:bg-gray-50 transition group">
                        <div class="text-5xl mb-4 group-hover:scale-110 transition duration-300">🍶</div>
                        <h4 class="text-2xl font-serif font-bold text-deep-indigo mb-3">Thanh Mai Chử Tửu</h4>
                        <p class="text-gray-600 leading-relaxed font-light">
                            Mùa mơ chín vàng. Nấu rượu mơ (luận anh hùng), ngâm nước mơ. Vị chua giúp sinh tân dịch, giải khát ngày hè.
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
                    <span class="text-sowing-green font-bold tracking-widest uppercase text-sm">Trừ Thấp • Tỉnh Thần</span>
                    <h3 class="text-4xl font-serif font-bold text-deep-indigo mt-2 mb-6">Thanh Nhiệt, Lợi Thấp</h3>
                    <p class="text-gray-600 text-lg leading-relaxed mb-6">
                        Trời Nóng và Ẩm gây mệt mỏi, uể oải. Cần ăn uống thanh đạm, lợi tiểu để loại bỏ thấp khí.
                    </p>
                    <div class="bg-white p-6 rounded-xl border-l-4 border-harvest-gold shadow-sm">
                        <h4 class="font-bold text-lg text-harvest-gold mb-2 font-serif">Nguyên Tắc Ẩm Thực</h4>
                        <p class="text-gray-600 mb-2"><strong>Thanh Đạm:</strong> Giảm dầu mỡ, vị mặn.</p>
                        <p class="text-gray-600"><strong>Tính Mát & Lợi Tiểu:</strong> Mướp đắng, Dưa chuột, Đậu xanh.</p>
                    </div>
                </div>

                <div class="space-y-4 font-sans text-gray-700">
                    <div class="flex items-center gap-4 p-3 bg-white rounded-lg shadow-sm">
                        <div class="w-10 h-10 rounded-full bg-sowing-green/10 flex items-center justify-center text-xl">😴</div>
                        <div>
                            <strong>Ngủ Trưa:</strong> Bắt buộc (30p) để dưỡng Tâm, hồi phục năng lượng.
                        </div>
                    </div>
                    <div class="flex items-center gap-4 p-3 bg-white rounded-lg shadow-sm">
                        <div class="w-10 h-10 rounded-full bg-sowing-green/10 flex items-center justify-center text-xl">🚿</div>
                        <div>
                            <strong>Vệ Sinh:</strong> Tắm rửa thường xuyên để da thông thoáng, tránh nấm.
                        </div>
                    </div>
                </div>
            </div>

            <!-- Right: Interactive Food Filter -->
            <div class="lg:col-span-7">
                <div class="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden flex flex-col h-full">
                    <div class="bg-deep-indigo p-8 text-white">
                        <h4 class="text-2xl font-serif font-bold flex items-center gap-3">
                            <span>🥗</span> Thực Đơn Giải Nhiệt
                        </h4>
                        <p class="opacity-90 mt-2 font-light text-sm">Chọn thực phẩm giúp cơ thể nhẹ nhàng, tỉnh táo.</p>
                    </div>

                    <!-- Filters -->
                    <div class="p-6 border-b border-gray-100 flex gap-3 overflow-x-auto no-scrollbar">
                        <button onclick="filterFood('all')" class="food-btn active px-5 py-2 rounded-full text-sm font-bold bg-gray-100 text-gray-600 hover:bg-gray-200 transition whitespace-nowrap" data-filter="all">Tất Cả</button>
                        <button onclick="filterFood('good')" class="food-btn px-5 py-2 rounded-full text-sm font-bold bg-gray-100 text-gray-600 hover:bg-gray-200 transition whitespace-nowrap" data-filter="good">Nên Dùng (Mát/Lợi Tiểu)</button>
                        <button onclick="filterFood('bad')" class="food-btn px-5 py-2 rounded-full text-sm font-bold bg-gray-100 text-gray-600 hover:bg-gray-200 transition whitespace-nowrap" data-filter="bad">Hạn Chế (Mặn/Béo)</button>
                    </div>

                    <!-- Grid -->
                    <div id="food-grid" class="p-6 grid grid-cols-2 sm:grid-cols-3 gap-4 overflow-y-auto max-h-[500px] bg-rice-white">
                        <!-- JS populated -->
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Section 5: Chiêm Nghiệm (Philosophy) -->
    <section id="chiem-nghiem" class="py-32 bg-earth-brown text-white text-center px-4 relative overflow-hidden">
        <!-- Abstract Background Shape -->
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-harvest-gold/20 rounded-full blur-[100px] pointer-events-none"></div>

        <div class="max-w-3xl mx-auto relative z-10">
            <span class="text-6xl text-gray-400 font-serif opacity-50 block mb-6">❝</span>
            
            <h3 class="text-4xl md:text-5xl font-serif font-bold mb-10 text-white leading-tight">
                Nhân Quả & Sự Tiếp Nối
            </h3>
            
            <p class="text-xl text-gray-300 leading-loose mb-12 font-sans font-light">
                Trong cùng một thời điểm, ta vừa gặt hái thành quả quá khứ, lại vừa gieo hạt giống cho tương lai. Cuộc sống không bao giờ dừng lại. "Gieo nhân nào, gặt quả nấy". Đừng than vãn sự bận rộn, đó là hạnh phúc chân thật của người kiến tạo.
            </p>

            <div class="inline-block border border-gray-500 rounded-2xl p-10 bg-white/5 backdrop-blur-sm hover:bg-white/10 transition duration-500 cursor-default group">
                <p class="font-bold uppercase tracking-[0.2em] text-sm text-harvest-gold mb-6 font-sans group-hover:text-white transition">Lời Chúc Mang Chủng</p>
                <div class="text-3xl md:text-4xl font-script text-sowing-green leading-relaxed group-hover:scale-105 transition duration-500">
                    "Tay gặt niềm vui,<br>Tâm gieo hy vọng."
                </div>
            </div>
            
            <span class="text-6xl text-gray-400 font-serif opacity-50 block mt-12">❞</span>
        </div>
    </section>

    <!-- Footer -->
    <footer class="bg-[#1a1510] text-gray-400 py-12 text-center text-sm font-sans border-t border-gray-800">
        <p class="italic tracking-wide mb-3 text-gray-500">Biên soạn dựa trên nguyên lý 24 Tiết khí & Văn hóa Phương Đông</p>
        <p class="text-gray-400">© Bản quyền thuộc về <span class="font-script text-xl text-harvest-gold ml-1">Tịch Phong Thiên Sơn - 夕风天山</span></p>
    </footer>

    <!-- Javascript Logic -->
    <script>
        // --- Data ---
        const foodData = [
            { name: "Mướp Đắng", type: "good", icon: "🥒", desc: "Thanh tâm hỏa, giải nhiệt" },
            { name: "Dưa Chuột", type: "good", icon: "🥒", desc: "Mát, nhiều nước, lợi tiểu" },
            { name: "Đậu Xanh", type: "good", icon: "🫘", desc: "Giải độc, trừ phiền nhiệt" },
            { name: "Ý Dĩ", type: "good", icon: "🌾", desc: "Trừ thấp, kiện tỳ" },
            { name: "Bí Đao", type: "good", icon: "🍈", desc: "Làm mát, giảm béo" },
            { name: "Nước Mơ", type: "good", icon: "🥃", desc: "Sinh tân, giải khát, bù điện giải" },
            { name: "Đồ Mặn", type: "bad", icon: "🧂", desc: "Giữ nước, gây phù nề" },
            { name: "Dầu Mỡ", type: "bad", icon: "🍟", desc: "Gây đầy bụng, khó tiêu" },
            { name: "Đồ Cay", type: "bad", icon: "🌶️", desc: "Tăng nhiệt, gây bức bối" }
        ];

        // --- Tab Logic ---
        function switchTab(tab) {
            document.getElementById('content-nong-nghiep').classList.add('hidden');
            document.getElementById('content-nong-nghiep').classList.remove('grid');
            document.getElementById('content-phong-tuc').classList.add('hidden');
            document.getElementById('content-phong-tuc').classList.remove('grid');

            document.getElementById('btn-nong-nghiep').classList.remove('active-tab', 'text-white');
            document.getElementById('btn-nong-nghiep').classList.add('text-deep-indigo');
            document.getElementById('btn-phong-tuc').classList.remove('active-tab', 'text-white');
            document.getElementById('btn-phong-tuc').classList.add('text-deep-indigo');

            const content = document.getElementById(\`content-\${tab}\`);
            content.classList.remove('hidden');
            content.classList.add('grid');
            
            const btn = document.getElementById(\`btn-\${tab}\`);
            btn.classList.add('active-tab');
            btn.classList.remove('text-deep-indigo');
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

        // --- Canvas Animation (Falling Grains) ---
        function initGrainCanvas() {
            const canvas = document.getElementById('grainCanvas');
            const ctx = canvas.getContext('2d');
            let width, height;
            let grains = [];

            function resize() {
                width = window.innerWidth;
                height = window.innerHeight;
                canvas.width = width;
                canvas.height = height;
            }
            window.addEventListener('resize', resize);
            resize();

            class Grain {
                constructor() {
                    this.x = Math.random() * width;
                    this.y = Math.random() * height - height;
                    this.size = Math.random() * 3 + 1;
                    this.speed = Math.random() * 2 + 1;
                    this.opacity = Math.random() * 0.5 + 0.1;
                    this.color = \`rgba(244, 162, 97, \${this.opacity})\`; // Harvest Gold
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
                    ctx.ellipse(this.x, this.y, this.size, this.size * 2, 0, 0, Math.PI * 2);
                    ctx.fillStyle = this.color;
                    ctx.fill();
                }
            }

            for(let i=0; i<50; i++) grains.push(new Grain());

            function animate() {
                ctx.clearRect(0, 0, width, height);
                grains.forEach(g => {
                    g.update();
                    g.draw();
                });
                requestAnimationFrame(animate);
            }
            animate();
        }

        // --- Init ---
        document.addEventListener('DOMContentLoaded', () => {
            initGrainCanvas();
            filterFood('all');

            // Chart 1: Solar Term 75 deg
            const ctx1 = document.getElementById('solarChart').getContext('2d');
            new Chart(ctx1, {
                type: 'doughnut',
                data: {
                    labels: ['Mang Chủng', 'Hạ Chí', 'Tiểu Thử', 'Mùa Khác'],
                    datasets: [{
                        data: [15, 15, 15, 315],
                        backgroundColor: ['#2A9D8F', '#F4A261', '#F4A261', '#FEFAE0'],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    rotation: -15, 
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
                        ctx.fillStyle = "#2A9D8F";
                        var text = "75°",
                            textX = Math.round((width - ctx.measureText(text).width) / 2),
                            textY = height / 2;
                        ctx.fillText(text, textX, textY);
                        ctx.save();
                    }
                }]
            });

            // Chart 2: Cycle Chart (Pie)
            const ctx2 = document.getElementById('cycleChart').getContext('2d');
            new Chart(ctx2, {
                type: 'pie',
                data: {
                    labels: ['Thu Hoạch (Kết Thúc)', 'Gieo Trồng (Bắt Đầu)'],
                    datasets: [{
                        data: [50, 50],
                        backgroundColor: ['#F4A261', '#2A9D8F'], // Harvest Gold vs Sowing Green
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
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
