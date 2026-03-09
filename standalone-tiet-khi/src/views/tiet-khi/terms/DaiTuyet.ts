export const DaiTuyet = `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Đại Tuyết: Tuyết Phủ Trắng Trời & Sự Tích Lũy Vĩ Đại</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    
    <!-- Fonts: Philosopher (Tiêu đề - Hùng vĩ), Be Vietnam Pro (Nội dung - Rõ ràng), Dancing Script (Thơ - Sâu lắng) -->
    <link href="https://fonts.googleapis.com/css2?family=Philosopher:ital,wght@0,400;0,700;1,400;1,700&family=Be+Vietnam+Pro:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400&family=Dancing+Script:wght@400;700&display=swap" rel="stylesheet">
    
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        'snow-white': '#F8FAFC',    // Trắng tuyết (Chủ đạo)
                        'deep-winter': '#0F172A',   // Xanh đêm thẫm (Âm khí cực thịnh)
                        'warm-fire': '#DC2626',     // Đỏ lửa (Tẩm bổ/Sự sống tiềm tàng)
                        'pine-green': '#335C67',    // Xanh tùng bách (Kiên cường)
                        'meat-red': '#9B2226',      // Màu thịt muối (Phong tục)
                        'cold-blue': '#A8DADC'      // Xanh băng (Lạnh giá)
                    },
                    fontFamily: {
                        serif: ['"Philosopher"', 'serif'],
                        sans: ['"Be Vietnam Pro"', 'sans-serif'],
                        script: ['"Dancing Script"', 'cursive'],
                    },
                    animation: {
                        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                    }
                }
            }
        }
    </script>
    <style>
        body {
            background-color: #F8FAFC;
            color: #0F172A;
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
        /* Heavy Snow Canvas Layer */
        #heavySnowCanvas {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 0;
            opacity: 0.8;
        }
        /* Interactions */
        .card-interaction {
            transition: all 0.3s ease-out;
            border: 1px solid transparent;
            background: rgba(255, 255, 255, 0.95);
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        .card-interaction:hover {
            transform: translateY(-5px);
            border-color: #DC2626;
            box-shadow: 0 20px 25px -5px rgba(220, 38, 38, 0.1);
        }
        .active-tab {
            background-color: #0F172A;
            color: white;
            border-color: #0F172A;
        }
        .no-scrollbar::-webkit-scrollbar {
            display: none;
        }
        .no-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
    </style>
    <!-- Chosen Palette: "Winter Solitude" - Dominant White, Deep Navy, Accents of Warm Red -->
    <!-- Application Structure Plan:
        1. Hero: Title with "Heavy Snow" visual cue (Canvas animation).
        2. Thien Tuong (Cosmic): Chart showing 255° & Yin at peak levels.
        3. Tam Hau (Nature): 3 Micro-seasons (Bird stops singing, Tiger mates, Li plant sprouts).
        4. Doi Song (Life): Tabs for Agriculture ("Fallow Fields") & Customs ("Cured Meat", "Red Bean Porridge").
        5. Duong Sinh (Health): "Remove Cold/Seek Warmth" - Food Filter (High Protein/Warm vs Cold).
        6. Chiem Nghiem (Philosophy): Accumulation & Patience (Tich Luy).
        7. Footer: Copyright Tich Phong Thien Son.
    -->
    <!-- Visualization & Content Choices:
        1. Solar Gauge: Chart.js Doughnut (255°).
        2. Yin Yang Status: Stacked Bar showing Yin dominating but Yang seed appearing.
        3. Food Filter: Logic for Warming/Tonic foods (Lamb, Beef, Red Bean).
        4. Snow Animation: HTML5 Canvas for heavy, accumulating snow.
    -->
    <!-- CONFIRMATION: NO SVG graphics used. NO Mermaid JS used. -->
</head>
<body class="font-sans antialiased leading-relaxed selection:bg-warm-fire selection:text-white">

    <!-- Background Animation -->
    <canvas id="heavySnowCanvas"></canvas>

    <!-- Navigation -->
    <nav class="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200 shadow-sm transition-all duration-300">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between h-20 items-center">
                <div class="flex-shrink-0 flex items-center gap-3">
                    <span class="text-3xl filter drop-shadow-sm animate-pulse">🏔️</span>
                    <div class="flex flex-col">
                        <span class="text-2xl font-serif font-bold text-deep-winter tracking-wide">Đại Tuyết</span>
                        <span class="text-xs font-sans text-warm-fire uppercase tracking-widest font-bold">Tích Lũy Vĩ Đại</span>
                    </div>
                </div>
                <div class="hidden md:flex space-x-10">
                    <button onclick="scrollToSection('y-nghia')" class="text-deep-winter hover:text-warm-fire transition font-medium tracking-wide text-sm uppercase">Ý Nghĩa</button>
                    <button onclick="scrollToSection('tam-hau')" class="text-deep-winter hover:text-warm-fire transition font-medium tracking-wide text-sm uppercase">Tam Hậu</button>
                    <button onclick="scrollToSection('doi-song')" class="text-deep-winter hover:text-warm-fire transition font-medium tracking-wide text-sm uppercase">Đời Sống</button>
                    <button onclick="scrollToSection('duong-sinh')" class="text-deep-winter hover:text-warm-fire transition font-medium tracking-wide text-sm uppercase">Dưỡng Sinh</button>
                    <button onclick="scrollToSection('chiem-nghiem')" class="text-deep-winter hover:text-warm-fire transition font-medium tracking-wide text-sm uppercase">Chiêm Nghiệm</button>
                </div>
            </div>
        </div>
    </nav>

    <!-- Hero Section -->
    <header class="relative pt-24 pb-20 px-4 text-center z-10 overflow-hidden">
        <div class="max-w-4xl mx-auto">
            <p class="text-pine-green font-bold tracking-[0.3em] uppercase mb-6 text-sm font-sans">Tiết Khí Thứ 21 • 7-8 Tháng 12</p>
            <h1 class="text-6xl md:text-8xl font-serif font-bold text-deep-winter mb-6 leading-tight relative inline-block">
                Đại Tuyết
                <span class="absolute -top-4 -right-12 text-4xl animate-bounce text-cold-blue">❄️</span>
            </h1>
            <h2 class="text-3xl md:text-5xl font-script text-warm-fire mb-10 font-bold transform -rotate-1">
                Tuyết Phủ Trắng Trời
            </h2>
            <div class="w-24 h-1 bg-deep-winter mx-auto mb-10 rounded-full shadow-sm"></div>
            <p class="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-loose font-light">
                "Khi tuyết không còn rơi lất phất mà phủ dày mặt đất. Vạn vật chìm sâu vào giấc ngủ đông miên man để ấp ủ cho sự bùng nổ của mùa xuân."
            </p>
            <div class="mt-14">
                <button onclick="scrollToSection('y-nghia')" class="group relative inline-flex items-center justify-center px-10 py-3 overflow-hidden font-serif italic tracking-wide text-white transition duration-300 ease-out border-2 border-deep-winter rounded-full shadow-md bg-deep-winter">
                    <span class="absolute inset-0 flex items-center justify-center w-full h-full text-deep-winter duration-300 -translate-x-full bg-white group-hover:translate-x-0 ease">
                        <span class="text-xl">🕯️</span>
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
            <h3 class="text-4xl font-serif font-bold text-deep-winter mb-4 inline-block relative">
                Sự Chuyển Hóa Của Âm Dương
                <span class="absolute -bottom-2 left-0 w-full h-1 bg-warm-fire"></span>
            </h3>
            <p class="text-gray-600 max-w-2xl mx-auto mt-6 text-lg leading-relaxed">
                Mặt Trời kinh độ 255°. "Đại" là lớn. Tuyết rơi dày đặc. Âm khí cực thịnh đẩy Dương khí lặn sâu, nhưng mầm sống đã bắt đầu nhen nhóm.
            </p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <!-- Charts Column -->
            <div class="space-y-10">
                <div class="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 relative overflow-hidden">
                    <h4 class="text-xl font-serif font-bold text-deep-winter mb-2 text-center">Vị Trí Thiên Văn (255°)</h4>
                    <div class="chart-container">
                        <canvas id="solarChart"></canvas>
                    </div>
                </div>
                
                <div class="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
                    <h4 class="text-xl font-serif font-bold text-pine-green mb-2 text-center">Cán Cân Âm Dương</h4>
                    <div class="chart-container" style="height: 250px;">
                        <canvas id="yinYangChart"></canvas>
                    </div>
                    <p class="text-center text-sm text-gray-500 mt-4 italic">Âm cực thịnh, Dương ẩn tàng.</p>
                </div>
            </div>

            <!-- Content Explanation -->
            <div class="space-y-8 text-lg text-gray-600 leading-relaxed font-light">
                <div class="p-6 bg-white rounded-xl border-l-4 border-deep-winter shadow-sm">
                    <strong class="text-deep-winter font-serif text-xl block mb-2">Tuyết Lành Báo Hiệu</strong>
                    <p>
                        "Thụy tuyết triệu phong niên". Lớp tuyết dày như tấm chăn giữ ấm cho đất, diệt trừ sâu bệnh, hứa hẹn một năm mới được mùa.
                    </p>
                </div>
                <div>
                    <strong class="text-deep-winter font-serif text-xl block mb-2">Quy Luật Cực Âm</strong>
                    <p>
                        Khi lạnh giá đến cùng cực cũng là lúc sự sống bắt đầu cựa quậy. Trong cái tĩnh lặng tuyệt đối của Đại Tuyết chứa đựng sức mạnh vô song của sự hồi sinh.
                    </p>
                </div>
            </div>
        </div>
    </section>

    <!-- Section 2: Tam Hậu (Nature) -->
    <section id="tam-hau" class="py-24 bg-white relative z-10">
        <div class="max-w-6xl mx-auto px-4">
            <h3 class="text-3xl font-serif font-bold text-pine-green mb-12 text-center">Tam Hậu: Ba Tín Hiệu Tiềm Tàng</h3>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                <!-- Card 1 -->
                <div class="card-interaction p-8 rounded-2xl cursor-default group text-center">
                    <div class="w-20 h-20 mx-auto rounded-full bg-gray-100 flex items-center justify-center text-4xl mb-6 group-hover:scale-110 transition">🐦</div>
                    <h5 class="font-bold text-xl text-deep-winter mb-3 font-serif">1. Hạt Đán Bất Minh</h5>
                    <p class="text-gray-600 font-light">Chim Hạt đán (ưa lạnh) cũng ngừng kêu. Trời quá lạnh khiến ngay cả loài chịu rét cũng phải im tiếng.</p>
                </div>

                <!-- Card 2 -->
                <div class="card-interaction p-8 rounded-2xl cursor-default group text-center">
                    <div class="w-20 h-20 mx-auto rounded-full bg-warm-fire/10 flex items-center justify-center text-4xl mb-6 group-hover:scale-110 transition">🐅</div>
                    <h5 class="font-bold text-xl text-deep-winter mb-3 font-serif">2. Hổ Thủy Giao</h5>
                    <p class="text-gray-600 font-light">Hổ (cực dương) bắt đầu giao phối. Cảm nhận được khí dương mới sinh trong lòng đất lạnh.</p>
                </div>

                <!-- Card 3 -->
                <div class="card-interaction p-8 rounded-2xl cursor-default group text-center">
                    <div class="w-20 h-20 mx-auto rounded-full bg-pine-green/20 flex items-center justify-center text-4xl mb-6 group-hover:scale-110 transition">🌱</div>
                    <h5 class="font-bold text-xl text-deep-winter mb-3 font-serif">3. Lệ Đĩnh Xuất</h5>
                    <p class="text-gray-600 font-light">Cây Lệ (cỏ Lan) nảy mầm. Giữa tuyết trắng, mầm xanh vươn lên báo hiệu sức sống bất diệt.</p>
                </div>
            </div>
        </div>
    </section>

    <!-- Section 3: Đời Sống (Tabs) -->
    <section id="doi-song" class="py-24 px-4 bg-gray-50 relative z-10">
        <div class="max-w-6xl mx-auto">
            <div class="mb-12 text-center">
                <h3 class="text-4xl font-serif font-bold text-deep-winter mb-4">Mùa Nhàn & Chuẩn Bị Tết</h3>
                <p class="text-gray-600 italic">"Tiểu Tuyết muối rau, Đại Tuyết muối thịt"</p>
            </div>

            <!-- Custom Tabs -->
            <div class="flex justify-center mb-10 space-x-4">
                <button onclick="switchTab('phong-tuc')" id="btn-phong-tuc" class="active-tab px-8 py-3 rounded-full border border-deep-winter font-bold transition duration-300 font-serif tracking-wide shadow-sm">Phong Tục</button>
                <button onclick="switchTab('nong-nghiep')" id="btn-nong-nghiep" class="px-8 py-3 rounded-full border border-deep-winter text-deep-winter font-bold hover:bg-deep-winter hover:text-white transition duration-300 font-serif tracking-wide shadow-sm">Nông Nghiệp</button>
            </div>

            <!-- Content Area -->
            <div class="bg-white p-8 md:p-12 rounded-3xl border border-gray-200 min-h-[400px] flex items-center shadow-sm relative overflow-hidden">
                <div class="absolute top-0 right-0 w-32 h-32 bg-meat-red/10 rounded-bl-full pointer-events-none"></div>

                <!-- Phong Tuc Content -->
                <div id="content-phong-tuc" class="grid grid-cols-1 md:grid-cols-2 gap-10 w-full animate-fade-in">
                    <!-- Card 1 -->
                    <div class="bg-gray-50 p-8 rounded-2xl border-l-4 border-meat-red hover:bg-white transition group">
                        <div class="text-5xl mb-4 group-hover:scale-110 transition duration-300">🥓</div>
                        <h4 class="text-2xl font-serif font-bold text-deep-winter mb-3">Làm Thịt (Yêm Nhục)</h4>
                        <p class="text-gray-600 leading-relaxed font-light">
                            Thời điểm tốt nhất để làm thịt xông khói, lạp xưởng. Chuẩn bị thực phẩm dự trữ cho dịp Tết Nguyên Đán sắp tới.
                        </p>
                    </div>
                    <!-- Card 2 -->
                    <div class="bg-gray-50 p-8 rounded-2xl border-l-4 border-warm-fire hover:bg-white transition group">
                        <div class="text-5xl mb-4 group-hover:scale-110 transition duration-300">🥣</div>
                        <h4 class="text-2xl font-serif font-bold text-deep-winter mb-3">Cháo Đậu Đỏ</h4>
                        <p class="text-gray-600 leading-relaxed font-light">
                            Ăn cháo đậu đỏ nấu gạo nếp để xua tan hàn khí, làm ấm bụng và cầu mong sự bình an.
                        </p>
                    </div>
                </div>

                <!-- Nong Nghiep Content -->
                <div id="content-nong-nghiep" class="hidden grid-cols-1 md:grid-cols-2 gap-10 w-full animate-fade-in">
                    <div class="flex flex-col justify-center">
                        <h4 class="text-3xl font-serif font-bold text-pine-green mb-6">Nông Nhàn Thực Sự</h4>
                        <p class="text-gray-700 leading-relaxed mb-6">
                            Đồng ruộng nghỉ ngơi dưới lớp tuyết (hoặc sương giá).
                        </p>
                        <ul class="space-y-4 text-gray-600 font-light">
                            <li class="flex items-start gap-3">
                                <span class="text-deep-winter font-bold">❄️</span>
                                <span><strong>Ủ Ấm Đất:</strong> Tuyết diệt sâu bệnh, giữ ẩm cho đất.</span>
                            </li>
                            <li class="flex items-start gap-3">
                                <span class="text-warm-fire font-bold">🛠️</span>
                                <span><strong>Tu Sửa:</strong> Nông dân sửa sang nông cụ, làm nghề thủ công.</span>
                            </li>
                        </ul>
                    </div>
                    <div class="flex items-center justify-center bg-gray-50 rounded-2xl p-6 border border-dashed border-gray-300">
                        <div class="text-center">
                            <div class="text-9xl mb-4 opacity-80 animate-pulse">⛄</div>
                            <p class="font-script text-2xl text-deep-winter">Đất trời nghỉ ngơi</p>
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
                    <span class="text-warm-fire font-bold tracking-widest uppercase text-sm">Trừ Hàn • Tựu Ôn</span>
                    <h3 class="text-4xl font-serif font-bold text-deep-winter mt-2 mb-6">Tiến Bổ - Tẩm Bổ Mạnh</h3>
                    <p class="text-gray-600 text-lg leading-relaxed mb-6">
                        Cơ thể cần năng lượng lớn để chống rét. Đây là lúc thích hợp nhất để ăn các món bổ dưỡng (Tiến bổ).
                    </p>
                    <div class="bg-white p-6 rounded-xl border-l-4 border-meat-red shadow-sm">
                        <h4 class="font-bold text-lg text-meat-red mb-2 font-serif">Nguyên Tắc Ẩm Thực</h4>
                        <p class="text-gray-600 mb-2"><strong>Đạm & Béo:</strong> Thịt dê, bò, gà ác để sinh nhiệt.</p>
                        <p class="text-gray-600"><strong>Cân Bằng:</strong> Ăn kèm củ cải trắng để tránh nóng trong (sinh nội nhiệt).</p>
                    </div>
                </div>

                <div class="space-y-4 font-sans text-gray-700">
                    <div class="flex items-center gap-4 p-3 bg-white rounded-lg shadow-sm">
                        <div class="w-10 h-10 rounded-full bg-deep-winter/10 flex items-center justify-center text-xl">🧢</div>
                        <div>
                            <strong>Giữ Ấm Đầu:</strong> Nơi hội tụ dương khí, cần đội mũ khi ra ngoài.
                        </div>
                    </div>
                    <div class="flex items-center gap-4 p-3 bg-white rounded-lg shadow-sm">
                        <div class="w-10 h-10 rounded-full bg-deep-winter/10 flex items-center justify-center text-xl">🦶</div>
                        <div>
                            <strong>Giữ Ấm Chân:</strong> Đi tất dày, tránh khí lạnh xâm nhập từ dưới lên.
                        </div>
                    </div>
                </div>
            </div>

            <!-- Right: Interactive Food Filter -->
            <div class="lg:col-span-7">
                <div class="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden flex flex-col h-full">
                    <div class="bg-deep-winter p-8 text-white">
                        <h4 class="text-2xl font-serif font-bold flex items-center gap-3">
                            <span>🥩</span> Thực Đơn Tiến Bổ
                        </h4>
                        <p class="opacity-80 mt-2 font-light text-sm">Chọn thực phẩm giàu năng lượng và ấm áp.</p>
                    </div>

                    <!-- Filters -->
                    <div class="p-6 border-b border-gray-100 flex gap-3 overflow-x-auto no-scrollbar">
                        <button onclick="filterFood('all')" class="food-btn active px-5 py-2 rounded-full text-sm font-bold bg-deep-winter text-white hover:bg-gray-800 transition whitespace-nowrap" data-filter="all">Tất Cả</button>
                        <button onclick="filterFood('good')" class="food-btn px-5 py-2 rounded-full text-sm font-bold bg-gray-100 text-gray-600 hover:bg-gray-200 transition whitespace-nowrap" data-filter="good">Nên Dùng (Bổ/Ấm)</button>
                        <button onclick="filterFood('bad')" class="food-btn px-5 py-2 rounded-full text-sm font-bold bg-gray-100 text-gray-600 hover:bg-gray-200 transition whitespace-nowrap" data-filter="bad">Hạn Chế (Lạnh/Béo)</button>
                    </div>

                    <!-- Grid -->
                    <div id="food-grid" class="p-6 grid grid-cols-2 sm:grid-cols-3 gap-4 overflow-y-auto max-h-[500px] bg-gray-50">
                        <!-- JS populated -->
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Section 5: Chiêm Nghiệm (Philosophy) -->
    <section id="chiem-nghiem" class="py-32 bg-deep-winter text-white text-center px-4 relative overflow-hidden">
        <!-- Abstract Background Shape -->
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-warm-fire/10 rounded-full blur-[100px] pointer-events-none"></div>

        <div class="max-w-3xl mx-auto relative z-10">
            <span class="text-6xl text-cold-blue font-serif opacity-50 block mb-6">❝</span>
            
            <h3 class="text-4xl md:text-5xl font-serif font-bold mb-10 text-white leading-tight">
                Sức Mạnh Của<br>Sự Tích Lũy
            </h3>
            
            <p class="text-xl text-gray-300 leading-loose mb-12 font-sans font-light">
                Tuyết dày không phải là sự chết chóc, mà là tấm chăn ủ ấm cho mầm sống. Những giai đoạn "đóng băng" trong cuộc đời chính là lúc ta tích lũy nội lực. Hãy kiên nhẫn chờ đợi, vì "Đông qua Xuân sẽ tới".
            </p>

            <div class="inline-block border border-gray-600 rounded-2xl p-10 bg-white/5 backdrop-blur-sm hover:bg-white/10 transition duration-500 cursor-default group">
                <p class="font-bold uppercase tracking-[0.2em] text-sm text-warm-fire mb-6 font-sans group-hover:text-white transition">Lời Chúc Đại Tuyết</p>
                <div class="text-3xl md:text-4xl font-script text-cold-blue leading-relaxed group-hover:scale-105 transition duration-500 shadow-text">
                    "Trong ấm ngoài êm,<br>Tích đầy phúc lộc."
                </div>
            </div>
            
            <span class="text-6xl text-cold-blue font-serif opacity-50 block mt-12">❞</span>
        </div>
    </section>

    <!-- Footer -->
    <footer class="bg-[#0a0f1d] text-gray-500 py-12 text-center text-sm font-sans border-t border-gray-800">
        <p class="italic tracking-wide mb-3 text-gray-600">Biên soạn dựa trên nguyên lý 24 Tiết khí & Văn hóa Phương Đông</p>
        <p class="text-gray-500">© Bản quyền thuộc về <span class="font-script text-xl text-warm-fire ml-1">Tịch Phong Thiên Sơn - 夕风天山</span></p>
    </footer>

    <!-- Javascript Logic -->
    <script>
        // --- Data ---
        const foodData = [
            { name: "Thịt Dê", type: "good", icon: "🥩", desc: "Bổ dương, giữ ấm cơ thể tốt nhất" },
            { name: "Củ Cải Trắng", type: "good", icon: "🥕", desc: "Tiêu thực, cân bằng vị béo của thịt" },
            { name: "Hạt Dẻ", type: "good", icon: "🌰", desc: "Bổ thận, mạnh gân cốt, ấm bụng" },
            { name: "Thịt Bò", type: "good", icon: "🐂", desc: "Tăng cường cơ bắp, bổ khí huyết" },
            { name: "Gà Ác", type: "good", icon: "🐓", desc: "Bổ can thận, ích khí, dưỡng huyết" },
            { name: "Kỷ Tử", type: "good", icon: "🍒", desc: "Bổ gan thận, sáng mắt" },
            { name: "Đồ Quá Béo", type: "bad", icon: "🥓", desc: "Gây khó tiêu, sinh nội nhiệt" },
            { name: "Hải Sản Sống", type: "bad", icon: "🍣", desc: "Quá lạnh, hại tỳ vị mùa đông" },
            { name: "Đồ Cay Nóng", type: "bad", icon: "🌶️", desc: "Gây ra mồ hôi, thoát dương khí" }
        ];

        // --- Tab Logic ---
        function switchTab(tab) {
            document.getElementById('content-phong-tuc').classList.add('hidden');
            document.getElementById('content-phong-tuc').classList.remove('grid');
            document.getElementById('content-nong-nghiep').classList.add('hidden');
            document.getElementById('content-nong-nghiep').classList.remove('grid');

            document.getElementById('btn-phong-tuc').classList.remove('active-tab', 'text-white');
            document.getElementById('btn-phong-tuc').classList.add('text-deep-winter');
            document.getElementById('btn-nong-nghiep').classList.remove('active-tab', 'text-white');
            document.getElementById('btn-nong-nghiep').classList.add('text-deep-winter');

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
                    btn.classList.add('bg-deep-winter', 'text-white');
                    btn.classList.remove('bg-gray-100', 'text-gray-600');
                } else {
                    btn.classList.remove('bg-deep-winter', 'text-white');
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

        // --- Canvas Animation (Heavy Snow) ---
        function initHeavySnowCanvas() {
            const canvas = document.getElementById('heavySnowCanvas');
            const ctx = canvas.getContext('2d');
            let width, height;
            let snowflakes = [];

            function resize() {
                width = window.innerWidth;
                height = window.innerHeight;
                canvas.width = width;
                canvas.height = height;
            }
            window.addEventListener('resize', resize);
            resize();

            class Snowflake {
                constructor() {
                    this.x = Math.random() * width;
                    this.y = Math.random() * height;
                    this.size = Math.random() * 4 + 2; // Larger flakes
                    this.speed = Math.random() * 2 + 1; // Faster
                    this.opacity = Math.random() * 0.5 + 0.4;
                    this.sway = Math.random() * 1 - 0.5;
                }
                update() {
                    this.y += this.speed;
                    this.x += this.sway;
                    if (this.y > height) {
                        this.y = -10;
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

            for(let i=0; i<150; i++) snowflakes.push(new Snowflake()); // More dense

            function animate() {
                ctx.clearRect(0, 0, width, height);
                snowflakes.forEach(s => {
                    s.update();
                    s.draw();
                });
                requestAnimationFrame(animate);
            }
            animate();
        }

        // --- Init ---
        document.addEventListener('DOMContentLoaded', () => {
            initHeavySnowCanvas();
            filterFood('all');

            // Chart 1: Solar Term 255 deg
            const ctx1 = document.getElementById('solarChart').getContext('2d');
            new Chart(ctx1, {
                type: 'doughnut',
                data: {
                    labels: ['Tiểu Tuyết', 'Đại Tuyết', 'Đông Chí', 'Mùa Khác'],
                    datasets: [{
                        data: [15, 15, 15, 315],
                        backgroundColor: ['#0F172A', '#0F172A', '#0F172A', '#F1FAEE'],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    rotation: 165, 
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
                        ctx.fillStyle = "#0F172A";
                        var text = "255°",
                            textX = Math.round((width - ctx.measureText(text).width) / 2),
                            textY = height / 2;
                        ctx.fillText(text, textX, textY);
                        ctx.save();
                    }
                }]
            });

            // Chart 2: Yin Yang Status (Stacked Bar)
            const ctx2 = document.getElementById('yinYangChart').getContext('2d');
            new Chart(ctx2, {
                type: 'bar',
                data: {
                    labels: ['Tiểu Tuyết', 'Đại Tuyết'],
                    datasets: [
                        {
                            label: 'Âm Khí (Tuyết/Lạnh)',
                            data: [70, 90],
                            backgroundColor: '#0F172A',
                            borderRadius: 4
                        },
                        {
                            label: 'Dương Khí (Mầm sống)',
                            data: [5, 10], // Small but starting to appear
                            backgroundColor: '#DC2626',
                            borderRadius: 4
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: { 
                            stacked: true,
                            grid: { display: false },
                            ticks: { font: { family: "'Be Vietnam Pro'" } }
                        },
                        y: { stacked: true, display: false }
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
