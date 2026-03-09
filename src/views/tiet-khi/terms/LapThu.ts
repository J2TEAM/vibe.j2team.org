export const LapThu = `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Lập Thu: Khúc Giao Mùa Dịu Dàng & Sự Thu Liễm</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    
    <!-- Fonts: Philosopher (Tiêu đề - Trầm lắng), Be Vietnam Pro (Nội dung - Rõ ràng), Dancing Script (Thơ - Lãng mạn) -->
    <link href="https://fonts.googleapis.com/css2?family=Philosopher:ital,wght@0,400;0,700;1,400;1,700&family=Be+Vietnam+Pro:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400&family=Dancing+Script:wght@400;700&display=swap" rel="stylesheet">
    
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        'autumn-gold': '#D4AF37',   // Vàng kim (Hành Kim/Mùa Thu)
                        'mist-blue': '#B0C4DE',     // Xanh sương (Gió heo may/Bạch lộ)
                        'harvest-orange': '#CC5500', // Cam đất (Mùa gặt/Lá đỏ)
                        'fading-green': '#556B2F',  // Xanh úa (Cây cối chuyển mùa)
                        'paper-cool': '#F5F5F5',    // Nền trắng mát (Sương)
                        'wood-brown': '#8B4513'     // Nâu gỗ (Cành khô)
                    },
                    fontFamily: {
                        serif: ['"Philosopher"', 'serif'],
                        sans: ['"Be Vietnam Pro"', 'sans-serif'],
                        script: ['"Dancing Script"', 'cursive'],
                    },
                    animation: {
                        'sway-leaf': 'swayLeaf 3s ease-in-out infinite',
                    },
                    keyframes: {
                        swayLeaf: {
                            '0%, 100%': { transform: 'rotate(-5deg)' },
                            '50%': { transform: 'rotate(5deg)' },
                        }
                    }
                }
            }
        }
    </script>
    <style>
        body {
            background-color: #F5F5F5;
            color: #556B2F;
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
        /* Falling Leaves Canvas Layer */
        #leafCanvas {
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
            border-color: #D4AF37;
            box-shadow: 0 10px 30px -10px rgba(212, 175, 55, 0.25);
            background-color: white;
        }
        .active-tab {
            background-color: #CC5500;
            color: white;
            border-color: #CC5500;
        }
        .no-scrollbar::-webkit-scrollbar {
            display: none;
        }
        .no-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
    </style>
    <!-- Chosen Palette: "Autumn Gold & Mist" - Elegant Gold, Cool Mist Blue, Harvest Orange -->
    <!-- Application Structure Plan:
        1. Hero: Title with "Falling Leaf" visual cue (Canvas animation).
        2. Thien Tuong (Cosmic): Chart showing 135° & Yang declining/Yin rising.
        3. Tam Hau (Nature): 3 Micro-seasons (Cool Wind, White Dew, Winter Cicada).
        4. Doi Song (Life): Tabs for Agriculture ("Harvest Time") & Customs ("Fattening up", "Biting Autumn").
        5. Duong Sinh (Health): "Nourish Lungs" - Food Filter (White/Sour vs Spicy/Dry).
        6. Chiem Nghiem (Philosophy): Letting Go (Buong Bo).
        7. Footer: Copyright Tich Phong Thien Son.
    -->
    <!-- Visualization & Content Choices:
        1. Solar Gauge: Chart.js Doughnut (135°).
        2. Energy Shift: Line Chart showing Yang energy dropping và "Dryness" (Táo) rising.
        3. Food Filter: Logic for Lung-moistening foods (Pear, Lotus root).
        4. Leaf Animation: HTML5 Canvas for gently falling leaves.
    -->
    <!-- CONFIRMATION: NO SVG graphics used. NO Mermaid JS used. -->
</head>
<body class="font-sans antialiased leading-relaxed selection:bg-autumn-gold selection:text-white">

    <!-- Background Animation -->
    <canvas id="leafCanvas"></canvas>

    <!-- Navigation -->
    <nav class="sticky top-0 z-50 bg-paper-cool/95 backdrop-blur-md border-b border-mist-blue/30 shadow-sm transition-all duration-300">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between h-20 items-center">
                <div class="flex-shrink-0 flex items-center gap-3">
                    <span class="text-3xl filter drop-shadow-sm animate-sway-leaf">🍂</span>
                    <div class="flex flex-col">
                        <span class="text-2xl font-serif font-bold text-harvest-orange tracking-wide">Lập Thu</span>
                        <span class="text-xs font-sans text-fading-green uppercase tracking-widest font-bold">Thu Liễm & Buông Bỏ</span>
                    </div>
                </div>
                <div class="hidden md:flex space-x-10">
                    <button onclick="scrollToSection('y-nghia')" class="text-fading-green hover:text-harvest-orange transition font-medium tracking-wide text-sm uppercase">Ý Nghĩa</button>
                    <button onclick="scrollToSection('tam-hau')" class="text-fading-green hover:text-harvest-orange transition font-medium tracking-wide text-sm uppercase">Tam Hậu</button>
                    <button onclick="scrollToSection('doi-song')" class="text-fading-green hover:text-harvest-orange transition font-medium tracking-wide text-sm uppercase">Đời Sống</button>
                    <button onclick="scrollToSection('duong-sinh')" class="text-fading-green hover:text-harvest-orange transition font-medium tracking-wide text-sm uppercase">Dưỡng Sinh</button>
                    <button onclick="scrollToSection('chiem-nghiem')" class="text-fading-green hover:text-harvest-orange transition font-medium tracking-wide text-sm uppercase">Chiêm Nghiệm</button>
                </div>
            </div>
        </div>
    </nav>

    <!-- Hero Section -->
    <header class="relative pt-24 pb-20 px-4 text-center z-10 overflow-hidden">
        <div class="max-w-4xl mx-auto">
            <p class="text-autumn-gold font-bold tracking-[0.3em] uppercase mb-6 text-sm font-sans">Tiết Khí Thứ 13 • 7-8 Tháng 8</p>
            <h1 class="text-6xl md:text-8xl font-serif font-bold text-wood-brown mb-6 leading-tight relative inline-block">
                Lập Thu
                <span class="absolute -top-4 -right-12 text-4xl animate-bounce text-mist-blue">🎐</span>
            </h1>
            <h2 class="text-3xl md:text-5xl font-script text-harvest-orange mb-10 font-bold transform -rotate-1">
                Khúc Giao Mùa Dịu Dàng
            </h2>
            <div class="w-24 h-1 bg-autumn-gold mx-auto mb-10 rounded-full shadow-sm"></div>
            <p class="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-loose font-light">
                "Nốt lặng trầm lắng sau mùa hạ ồn ào. Gió heo may mang theo chút se lạnh, vạn vật bắt đầu thu mình, chững lại để chuẩn bị cho mùa gặt hái."
            </p>
            <div class="mt-14">
                <button onclick="scrollToSection('y-nghia')" class="group relative inline-flex items-center justify-center px-10 py-3 overflow-hidden font-serif italic tracking-wide text-white transition duration-300 ease-out border-2 border-harvest-orange rounded-full shadow-md bg-harvest-orange">
                    <span class="absolute inset-0 flex items-center justify-center w-full h-full text-white duration-300 -translate-x-full bg-autumn-gold group-hover:translate-x-0 ease">
                        <span class="text-xl">🌾</span>
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
            <h3 class="text-4xl font-serif font-bold text-fading-green mb-4 inline-block relative">
                Chớm Thu Se Lạnh
                <span class="absolute -bottom-2 left-0 w-full h-1 bg-autumn-gold/50"></span>
            </h3>
            <p class="text-gray-600 max-w-2xl mx-auto mt-6 text-lg leading-relaxed">
                Mặt Trời kinh độ 135°. "Lập" là bắt đầu, "Thu" là mùa thu. Hành Kim, chủ về sự thu liễm (thu vào), mát mẻ và khô ráo.
            </p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <!-- Charts Column -->
            <div class="space-y-10">
                <div class="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
                    <h4 class="text-xl font-serif font-bold text-autumn-gold mb-2 text-center">Vị Trí Thiên Văn (135°)</h4>
                    <div class="chart-container">
                        <canvas id="solarChart"></canvas>
                    </div>
                </div>
                
                <div class="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                    <h4 class="text-xl font-serif font-bold text-mist-blue mb-2 text-center">Sự Chuyển Dịch Năng Lượng</h4>
                    <div class="chart-container" style="height: 250px;">
                        <canvas id="energyLine"></canvas>
                    </div>
                    <p class="text-center text-sm text-gray-400 mt-4 italic">Dương khí giảm dần, Khí Táo (Khô) tăng lên.</p>
                </div>
            </div>

            <!-- Content Explanation -->
            <div class="space-y-8 text-lg text-gray-600 leading-relaxed font-light">
                <div class="p-6 bg-white rounded-xl border-l-4 border-autumn-gold shadow-sm">
                    <strong class="text-wood-brown font-serif text-xl block mb-2">Thu Lão Hổ</strong>
                    <p>
                        Dù đã sang thu nhưng "nắng quái" (hổ mùa thu) vẫn còn dữ dội vào ban ngày. Tuy nhiên, đêm và sáng sớm đã có gió mát.
                    </p>
                </div>
                <div>
                    <strong class="text-wood-brown font-serif text-xl block mb-2">Tính Chất Hành Kim</strong>
                    <p>
                        Mùa thu khí trời hanh khô (Táo khí). Vạn vật chuyển từ trạng thái sinh trưởng (Mùa Hạ) sang trạng thái thu hoạch và tàng trữ.
                    </p>
                </div>
            </div>
        </div>
    </section>

    <!-- Section 2: Tam Hậu (Nature) -->
    <section id="tam-hau" class="py-24 bg-white relative z-10">
        <div class="max-w-6xl mx-auto px-4">
            <h3 class="text-3xl font-serif font-bold text-harvest-orange mb-12 text-center">Tam Hậu: Ba Tín Hiệu Đầu Thu</h3>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                <!-- Card 1 -->
                <div class="card-interaction bg-paper-cool p-8 rounded-2xl cursor-default group text-center">
                    <div class="w-20 h-20 mx-auto rounded-full bg-mist-blue/20 flex items-center justify-center text-4xl mb-6 group-hover:scale-110 transition">🌬️</div>
                    <h5 class="font-bold text-xl text-fading-green mb-3 font-serif">1. Lương Phong Chí</h5>
                    <p class="text-gray-600 font-light">Gió mát bắt đầu thổi. Không còn hơi nóng hầm hập, gió heo may mang theo sự dễ chịu, sảng khoái.</p>
                </div>

                <!-- Card 2 -->
                <div class="card-interaction bg-paper-cool p-8 rounded-2xl cursor-default group text-center">
                    <div class="w-20 h-20 mx-auto rounded-full bg-white flex items-center justify-center text-4xl mb-6 border border-mist-blue group-hover:scale-110 transition">💧</div>
                    <h5 class="font-bold text-xl text-fading-green mb-3 font-serif">2. Bạch Lộ Giáng</h5>
                    <p class="text-gray-600 font-light">Sương trắng xuất hiện buổi sớm. Chênh lệch nhiệt độ ngày đêm tăng, hơi nước ngưng tụ thành sương.</p>
                </div>

                <!-- Card 3 -->
                <div class="card-interaction bg-paper-cool p-8 rounded-2xl cursor-default group text-center">
                    <div class="w-20 h-20 mx-auto rounded-full bg-wood-brown/20 flex items-center justify-center text-4xl mb-6 group-hover:scale-110 transition">🦗</div>
                    <h5 class="font-bold text-xl text-fading-green mb-3 font-serif">3. Hàn Thiền Minh</h5>
                    <p class="text-gray-600 font-light">Ve sầu mùa thu (Hàn thiền) bắt đầu kêu. Tiếng kêu trầm và buồn hơn, báo hiệu sự kết thúc của mùa hạ.</p>
                </div>
            </div>
        </div>
    </section>

    <!-- Section 3: Đời Sống (Tabs) -->
    <section id="doi-song" class="py-24 px-4 bg-paper-cool relative z-10">
        <div class="max-w-6xl mx-auto">
            <div class="mb-12 text-center">
                <h3 class="text-4xl font-serif font-bold text-wood-brown mb-4">Mùa Gặt & Tẩm Bổ</h3>
                <p class="text-gray-600 italic">"Lập Thu trồng rau, ăn Tết vừa giàu"</p>
            </div>

            <!-- Custom Tabs -->
            <div class="flex justify-center mb-10 space-x-4">
                <button onclick="switchTab('nong-nghiep')" id="btn-nong-nghiep" class="active-tab px-8 py-3 rounded-full border border-harvest-orange font-bold transition duration-300 font-serif tracking-wide shadow-sm">Nông Nghiệp</button>
                <button onclick="switchTab('phong-tuc')" id="btn-phong-tuc" class="px-8 py-3 rounded-full border border-harvest-orange text-harvest-orange font-bold hover:bg-harvest-orange hover:text-white transition duration-300 font-serif tracking-wide shadow-sm">Phong Tục</button>
            </div>

            <!-- Content Area -->
            <div class="bg-white p-8 md:p-12 rounded-3xl border border-gray-100 min-h-[400px] flex items-center shadow-sm relative overflow-hidden">
                <div class="absolute top-0 right-0 w-32 h-32 bg-autumn-gold/10 rounded-bl-full pointer-events-none"></div>

                <!-- Nong Nghiep Content -->
                <div id="content-nong-nghiep" class="grid grid-cols-1 md:grid-cols-2 gap-10 w-full animate-fade-in">
                    <div class="flex flex-col justify-center">
                        <h4 class="text-3xl font-serif font-bold text-harvest-orange mb-6">Mùa Vàng Bội Thu</h4>
                        <p class="text-gray-700 leading-relaxed mb-6">
                            Nắng thu vàng óng là thời điểm lý tưởng để thu hoạch và phơi phóng.
                        </p>
                        <ul class="space-y-4 text-gray-600 font-light">
                            <li class="flex items-start gap-3">
                                <span class="text-autumn-gold font-bold">🌽</span>
                                <span><strong>Thu Hoạch:</strong> Lúa sớm, ngô, khoai được gặt hái về kho.</span>
                            </li>
                            <li class="flex items-start gap-3">
                                <span class="text-fading-green font-bold">🥬</span>
                                <span><strong>Gieo Trồng:</strong> Trồng rau vụ đông (cải bắp, su hào) đón Tết.</span>
                            </li>
                        </ul>
                    </div>
                    <div class="flex items-center justify-center bg-paper-cool rounded-2xl p-6 border border-dashed border-gray-300">
                        <div class="text-center">
                            <div class="text-9xl mb-4 opacity-80 animate-pulse">🚜</div>
                            <p class="font-script text-2xl text-wood-brown">Thu hoạch & Gieo hy vọng</p>
                        </div>
                    </div>
                </div>

                <!-- Phong Tuc Content -->
                <div id="content-phong-tuc" class="hidden grid-cols-1 md:grid-cols-2 gap-10 w-full animate-fade-in">
                    <!-- Card 1 -->
                    <div class="bg-paper-cool p-8 rounded-2xl border-l-4 border-wood-brown hover:bg-gray-100 transition group">
                        <div class="text-5xl mb-4 group-hover:scale-110 transition duration-300">🍖</div>
                        <h4 class="text-2xl font-serif font-bold text-fading-green mb-3">Thiếp Thu Phiêu</h4>
                        <p class="text-gray-600 leading-relaxed font-light">
                            "Dán thêm mỡ mùa thu". Sau mùa hè sụt cân ("khổ hạ"), trời mát ăn ngon miệng hơn, người xưa ăn thịt kho, đồ bổ để lấy lại sức.
                        </p>
                    </div>
                    <!-- Card 2 -->
                    <div class="bg-paper-cool p-8 rounded-2xl border-l-4 border-mist-blue hover:bg-gray-100 transition group">
                        <div class="text-5xl mb-4 group-hover:scale-110 transition duration-300">🍉</div>
                        <h4 class="text-2xl font-serif font-bold text-fading-green mb-3">Cắn Thu (Giảo Thu)</h4>
                        <p class="text-gray-600 leading-relaxed font-light">
                            Ăn dưa hấu vào ngày Lập Thu để "cắn" lại cái nóng cuối cùng, cầu mong không bị bệnh tật mùa đông.
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
                    <span class="text-mist-blue font-bold tracking-widest uppercase text-sm">Hành Kim • Tạng Phế</span>
                    <h3 class="text-4xl font-serif font-bold text-fading-green mt-2 mb-6">Dưỡng Phế, Tránh Hanh Khô</h3>
                    <p class="text-gray-600 text-lg leading-relaxed mb-6">
                        Khí thu khô (Táo) dễ hại Phổi, gây ho khan, nẻ da. Cần làm mát và giữ ẩm cho Phế.
                    </p>
                    <div class="bg-white p-6 rounded-xl border-l-4 border-mist-blue shadow-sm">
                        <h4 class="font-bold text-lg text-mist-blue mb-2 font-serif">Nguyên Tắc Ẩm Thực</h4>
                        <p class="text-gray-600 mb-2"><strong>Thiểu Tân Tăng Toan:</strong> Bớt cay (hại Phế), thêm chua (giữ nước).</p>
                        <p class="text-gray-600"><strong>Màu Trắng:</strong> Thực phẩm màu trắng đi vào Phế (Lê, Củ sen).</p>
                    </div>
                </div>

                <div class="space-y-4 font-sans text-gray-700">
                    <div class="flex items-center gap-4 p-3 bg-white rounded-lg shadow-sm">
                        <div class="w-10 h-10 rounded-full bg-autumn-gold/10 flex items-center justify-center text-xl">🧘</div>
                        <div>
                            <strong>Thu Liễm:</strong> Ngủ sớm để dưỡng âm, dậy sớm để hít thở không khí trong lành.
                        </div>
                    </div>
                    <div class="flex items-center gap-4 p-3 bg-white rounded-lg shadow-sm">
                        <div class="w-10 h-10 rounded-full bg-autumn-gold/10 flex items-center justify-center text-xl">🧣</div>
                        <div>
                            <strong>Tránh Lạnh:</strong> Đêm thu lạnh, cần đắp chăn mỏng, tránh gió lùa.
                        </div>
                    </div>
                </div>
            </div>

            <!-- Right: Interactive Food Filter -->
            <div class="lg:col-span-7">
                <div class="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden flex flex-col h-full">
                    <div class="bg-fading-green p-8 text-white">
                        <h4 class="text-2xl font-serif font-bold flex items-center gap-3">
                            <span>🍐</span> Thực Đơn Nhuận Phế
                        </h4>
                        <p class="opacity-90 mt-2 font-light text-sm">Chọn thực phẩm màu trắng, vị chua ngọt để sinh tân dịch.</p>
                    </div>

                    <!-- Filters -->
                    <div class="p-6 border-b border-gray-100 flex gap-3 overflow-x-auto no-scrollbar">
                        <button onclick="filterFood('all')" class="food-btn active px-5 py-2 rounded-full text-sm font-bold bg-gray-100 text-gray-600 hover:bg-gray-200 transition whitespace-nowrap" data-filter="all">Tất Cả</button>
                        <button onclick="filterFood('good')" class="food-btn px-5 py-2 rounded-full text-sm font-bold bg-gray-100 text-gray-600 hover:bg-gray-200 transition whitespace-nowrap" data-filter="good">Nên Dùng (Nhuận/Chua)</button>
                        <button onclick="filterFood('bad')" class="food-btn px-5 py-2 rounded-full text-sm font-bold bg-gray-100 text-gray-600 hover:bg-gray-200 transition whitespace-nowrap" data-filter="bad">Hạn Chế (Cay/Khô)</button>
                    </div>

                    <!-- Grid -->
                    <div id="food-grid" class="p-6 grid grid-cols-2 sm:grid-cols-3 gap-4 overflow-y-auto max-h-[500px] bg-paper-cool">
                        <!-- JS populated -->
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Section 5: Chiêm Nghiệm (Philosophy) -->
    <section id="chiem-nghiem" class="py-32 bg-wood-brown text-white text-center px-4 relative overflow-hidden">
        <!-- Abstract Background Shape -->
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-autumn-gold/10 rounded-full blur-[100px] pointer-events-none"></div>

        <div class="max-w-3xl mx-auto relative z-10">
            <span class="text-6xl text-autumn-gold font-serif opacity-50 block mb-6">❝</span>
            
            <h3 class="text-4xl md:text-5xl font-serif font-bold mb-10 text-white leading-tight">
                Buông Bỏ & Trở Về
            </h3>
            
            <p class="text-xl text-gray-300 leading-loose mb-12 font-sans font-light">
                Mùa thu là lúc cây cối trút bỏ lá già để nuôi rễ. Con người cũng cần học cách buông bỏ phiền muộn, chấp niệm. Đừng luyến tiếc quá khứ rực rỡ, hãy trân trọng sự tĩnh lặng và sâu sắc của hiện tại để tâm hồn được bình yên.
            </p>

            <div class="inline-block border border-gray-500 rounded-2xl p-10 bg-white/5 backdrop-blur-sm hover:bg-white/10 transition duration-500 cursor-default group">
                <p class="font-bold uppercase tracking-[0.2em] text-sm text-autumn-gold mb-6 font-sans group-hover:text-white transition">Lời Chúc Lập Thu</p>
                <div class="text-3xl md:text-4xl font-script text-mist-blue leading-relaxed group-hover:scale-105 transition duration-500">
                    "Phổi khỏe, Tâm an,<br>Đời thanh thản."
                </div>
            </div>
            
            <span class="text-6xl text-autumn-gold font-serif opacity-50 block mt-12">❞</span>
        </div>
    </section>

    <!-- Footer -->
    <footer class="bg-[#3e2723] text-gray-400 py-12 text-center text-sm font-sans border-t border-gray-700">
        <p class="italic tracking-wide mb-3 text-gray-500">Biên soạn dựa trên nguyên lý 24 Tiết khí & Văn hóa Phương Đông</p>
        <p class="text-gray-400">© Bản quyền thuộc về <span class="font-script text-xl text-autumn-gold ml-1">Tịch Phong Thiên Sơn - 夕风天山</span></p>
    </footer>

    <!-- Javascript Logic -->
    <script>
        // --- Data ---
        const foodData = [
            { name: "Quả Lê", type: "good", icon: "🍐", desc: "Thanh nhiệt, nhuận phế, giảm ho" },
            { name: "Ngân Nhĩ", type: "good", icon: "🍄", desc: "Dưỡng âm, bổ phổi (Nấm tuyết)" },
            { name: "Củ Sen", type: "good", icon: "🪷", desc: "Mát máu, sinh tân dịch" },
            { name: "Mật Ong", type: "good", icon: "🍯", desc: "Nhuận tràng, bổ tỳ vị" },
            { name: "Đậu Phụ", type: "good", icon: "⬜", desc: "Thanh đạm, mát bổ" },
            { name: "Củ Cải Trắng", type: "good", icon: "🥕", desc: "Tiêu thực, hóa đờm" },
            { name: "Ớt Cay", type: "bad", icon: "🌶️", desc: "Phát tán khí, làm khô phổi" },
            { name: "Đồ Nướng", type: "bad", icon: "🥩", desc: "Gây nóng trong, háo nước" },
            { name: "Hành Tỏi", type: "bad", icon: "🧄", desc: "Tính kích thích, hạn chế dùng nhiều" }
        ];

        // --- Tab Logic ---
        function switchTab(tab) {
            document.getElementById('content-nong-nghiep').classList.add('hidden');
            document.getElementById('content-nong-nghiep').classList.remove('grid');
            document.getElementById('content-phong-tuc').classList.add('hidden');
            document.getElementById('content-phong-tuc').classList.remove('grid');

            document.getElementById('btn-nong-nghiep').classList.remove('active-tab', 'text-white');
            document.getElementById('btn-nong-nghiep').classList.add('text-harvest-orange');
            document.getElementById('btn-phong-tuc').classList.remove('active-tab', 'text-white');
            document.getElementById('btn-phong-tuc').classList.add('text-harvest-orange');

            const content = document.getElementById(\`content-\${tab}\`);
            content.classList.remove('hidden');
            content.classList.add('grid');
            
            const btn = document.getElementById(\`btn-\${tab}\`);
            btn.classList.add('active-tab');
            btn.classList.remove('text-harvest-orange');
        }

        // --- Food Filter Logic ---
        function filterFood(filter) {
            const grid = document.getElementById('food-grid');
            grid.innerHTML = ''; 

            document.querySelectorAll('.food-btn').forEach(btn => {
                if(btn.dataset.filter === filter) {
                    btn.classList.add('bg-fading-green', 'text-white');
                    btn.classList.remove('bg-gray-100', 'text-gray-600');
                } else {
                    btn.classList.remove('bg-fading-green', 'text-white');
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

        // --- Canvas Animation (Falling Leaves) ---
        function initLeafCanvas() {
            const canvas = document.getElementById('leafCanvas');
            const ctx = canvas.getContext('2d');
            let width, height;
            let leaves = [];

            function resize() {
                width = window.innerWidth;
                height = window.innerHeight;
                canvas.width = width;
                canvas.height = height;
            }
            window.addEventListener('resize', resize);
            resize();

            class Leaf {
                constructor() {
                    this.x = Math.random() * width;
                    this.y = Math.random() * height - height;
                    this.size = Math.random() * 8 + 5;
                    this.speedY = Math.random() * 1 + 0.5;
                    this.speedX = Math.random() * 2 - 1;
                    this.angle = Math.random() * 360;
                    this.spin = Math.random() * 2 - 1;
                    this.color = Math.random() > 0.5 ? '#D4AF37' : '#CC5500'; // Gold or Orange
                }
                update() {
                    this.y += this.speedY;
                    this.x += Math.sin(this.y * 0.01) + this.speedX * 0.5;
                    this.angle += this.spin;
                    if (this.y > height) {
                        this.y = -20;
                        this.x = Math.random() * width;
                    }
                }
                draw() {
                    ctx.save();
                    ctx.translate(this.x, this.y);
                    ctx.rotate(this.angle * Math.PI / 180);
                    ctx.fillStyle = this.color;
                    ctx.beginPath();
                    // Simple leaf shape
                    ctx.ellipse(0, 0, this.size, this.size/2, 0, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                }
            }

            for(let i=0; i<40; i++) leaves.push(new Leaf());

            function animate() {
                ctx.clearRect(0, 0, width, height);
                leaves.forEach(l => {
                    l.update();
                    l.draw();
                });
                requestAnimationFrame(animate);
            }
            animate();
        }

        // --- Init ---
        document.addEventListener('DOMContentLoaded', () => {
            initLeafCanvas();
            filterFood('all');

            // Chart 1: Solar Term 135 deg
            const ctx1 = document.getElementById('solarChart').getContext('2d');
            new Chart(ctx1, {
                type: 'doughnut',
                data: {
                    labels: ['Lập Thu', 'Xử Thử', 'Bạch Lộ', 'Mùa Khác'],
                    datasets: [{
                        data: [15, 15, 15, 315],
                        backgroundColor: ['#CC5500', '#D4AF37', '#B0C4DE', '#F5F5F5'],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    rotation: 45, 
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
                        ctx.fillStyle = "#CC5500";
                        var text = "135°",
                            textX = Math.round((width - ctx.measureText(text).width) / 2),
                            textY = height / 2;
                        ctx.fillText(text, textX, textY);
                        ctx.save();
                    }
                }]
            });

            // Chart 2: Energy Shift (Line)
            const ctx2 = document.getElementById('energyLine').getContext('2d');
            new Chart(ctx2, {
                type: 'line',
                data: {
                    labels: ['Đại Thử', 'Lập Thu', 'Xử Thử', 'Bạch Lộ'],
                    datasets: [
                        {
                            label: 'Dương Khí (Nhiệt)',
                            data: [95, 80, 65, 50],
                            borderColor: '#CC5500',
                            backgroundColor: 'rgba(204, 85, 0, 0.1)',
                            fill: true,
                            tension: 0.4,
                            yAxisID: 'y'
                        },
                        {
                            label: 'Táo Khí (Khô)',
                            data: [40, 60, 75, 85],
                            borderColor: '#B0C4DE',
                            borderDash: [5, 5],
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
