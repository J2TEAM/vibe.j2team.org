export const VuThuy = `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Vũ Thủy: Sự Tẩm Nhuận & Dòng Chảy Của Sự Sống</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    
    <!-- Fonts: Philosopher (Tiêu đề - Khí chất), Be Vietnam Pro (Nội dung - Mạch lạc), Dancing Script (Thơ - Bay bổng) -->
    <link href="https://fonts.googleapis.com/css2?family=Philosopher:ital,wght@0,400;0,700;1,400;1,700&family=Be+Vietnam+Pro:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400&family=Dancing+Script:wght@400;700&display=swap" rel="stylesheet">
    
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        'rain-blue': '#6096BA',     // Xanh mưa (Thủy)
                        'deep-ink': '#274C77',      // Xanh mực (Sâu lắng)
                        'sprout-green': '#A3C9A8',  // Xanh chồi non (Sự sống)
                        'earth-sand': '#D4A373',    // Vàng đất (Tỳ vị/Hành Thổ)
                        'paper-mist': '#F3F6F8',    // Trắng sương mù (Nền)
                        'warm-porridge': '#FEFAE0'  // Màu cháo ấm
                    },
                    fontFamily: {
                        serif: ['"Philosopher"', 'serif'],
                        sans: ['"Be Vietnam Pro"', 'sans-serif'],
                        script: ['"Dancing Script"', 'cursive'],
                    },
                    animation: {
                        'float': 'float 6s ease-in-out infinite',
                    },
                    keyframes: {
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
            background-color: #F3F6F8;
            color: #274C77;
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
        /* Rain Canvas Layer */
        #rainCanvas {
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
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            border: 1px solid transparent;
        }
        .card-interaction:hover {
            transform: translateY(-5px);
            border-color: #6096BA;
            box-shadow: 0 10px 30px -10px rgba(96, 150, 186, 0.25);
            background-color: white;
        }
        .active-tab {
            background-color: #274C77;
            color: white;
            border-color: #274C77;
        }
        .no-scrollbar::-webkit-scrollbar {
            display: none;
        }
        .no-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
    </style>
    <!-- Chosen Palette: "Spring Rain & Earth" - Cool Blues, Fresh Greens, Warm Earthy Tones -->
    <!-- Application Structure Plan:
        1. Hero: Title with Rain Animation (Canvas).
        2. Thien Tuong (Cosmic): Chart showing Solar Term 330° & The transition from Snow to Rain.
        3. Tam Hau (Nature): 3 Micro-seasons cards (Otter, Geese, Plants).
        4. Doi Song (Life): Tabs for Agriculture ("Precious as Oil") & Customs ("Visiting Parents").
        5. Duong Sinh (Health): "Nourish Spleen/Remove Dampness" - Food Filter (Sweet/Neutral vs Sour/Cold).
        6. Chiem Nghiem (Philosophy): The Lesson of Water (Humility/Patience).
        7. Footer: Copyright Tich Phong Thien Son.
    -->
    <!-- Visualization & Content Choices:
        1. Solar Gauge: Chart.js Doughnut (330°).
        2. Climate Shift: Bar/Line Chart showing Snow decreasing vs Rain increasing.
        3. Food Filter: Logic for Spleen-friendly foods (Yam, Lotus seed) vs Damp-causing foods.
        4. Rain Animation: HTML5 Canvas for immersion.
    -->
    <!-- CONFIRMATION: NO SVG graphics used. NO Mermaid JS used. -->
</head>
<body class="font-sans antialiased leading-relaxed selection:bg-rain-blue selection:text-white">

    <!-- Rain Background -->
    <canvas id="rainCanvas"></canvas>

    <!-- Navigation -->
    <nav class="sticky top-0 z-50 bg-paper-mist/90 backdrop-blur-md border-b border-rain-blue/10 shadow-sm transition-all duration-300">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between h-20 items-center">
                <div class="flex-shrink-0 flex items-center gap-3">
                    <span class="text-3xl filter drop-shadow-sm animate-float">🌧️</span>
                    <div class="flex flex-col">
                        <span class="text-2xl font-serif font-bold text-deep-ink tracking-wide">Vũ Thủy</span>
                        <span class="text-xs font-sans text-rain-blue uppercase tracking-widest font-bold">Sự Tẩm Nhuận</span>
                    </div>
                </div>
                <div class="hidden md:flex space-x-10">
                    <button onclick="scrollToSection('y-nghia')" class="text-deep-ink hover:text-rain-blue transition font-medium tracking-wide text-sm uppercase">Ý Nghĩa</button>
                    <button onclick="scrollToSection('tam-hau')" class="text-deep-ink hover:text-rain-blue transition font-medium tracking-wide text-sm uppercase">Tam Hậu</button>
                    <button onclick="scrollToSection('doi-song')" class="text-deep-ink hover:text-rain-blue transition font-medium tracking-wide text-sm uppercase">Đời Sống</button>
                    <button onclick="scrollToSection('duong-sinh')" class="text-deep-ink hover:text-rain-blue transition font-medium tracking-wide text-sm uppercase">Dưỡng Sinh</button>
                    <button onclick="scrollToSection('chiem-nghiem')" class="text-deep-ink hover:text-rain-blue transition font-medium tracking-wide text-sm uppercase">Chiêm Nghiệm</button>
                </div>
            </div>
        </div>
    </nav>

    <!-- Hero Section -->
    <header class="relative pt-24 pb-20 px-4 text-center z-10 overflow-hidden">
        <div class="max-w-4xl mx-auto">
            <p class="text-rain-blue font-bold tracking-[0.3em] uppercase mb-6 text-sm font-sans">Tiết Khí Thứ 2 • 18-19 Tháng 2</p>
            <h1 class="text-6xl md:text-8xl font-serif font-bold text-deep-ink mb-6 leading-tight relative inline-block">
                Vũ Thủy
            </h1>
            <h2 class="text-3xl md:text-5xl font-script text-sprout-green mb-10 font-bold transform -rotate-1">
                Dòng Chảy Của Sự Sống
            </h2>
            <div class="w-24 h-1 bg-rain-blue mx-auto mb-10 rounded-full opacity-50"></div>
            <p class="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-loose font-light">
                "Băng tuyết tan chảy thành nước, trời không còn rơi tuyết mà thay bằng những hạt mưa xuân lất phất. Sự tẩm nhuận dịu dàng đánh thức vạn vật."
            </p>
            <div class="mt-14">
                <button onclick="scrollToSection('y-nghia')" class="group relative inline-flex items-center justify-center px-10 py-3 overflow-hidden font-serif italic tracking-wide text-white transition duration-300 ease-out border-2 border-deep-ink rounded-full shadow-md bg-deep-ink">
                    <span class="absolute inset-0 flex items-center justify-center w-full h-full text-white duration-300 -translate-x-full bg-rain-blue group-hover:translate-x-0 ease">
                        <span class="text-xl">💧</span>
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
            <h3 class="text-4xl font-serif font-bold text-deep-ink mb-4 inline-block relative">
                Mưa Sinh Sự Sống
                <span class="absolute -bottom-2 left-0 w-full h-1 bg-rain-blue/50"></span>
            </h3>
            <p class="text-gray-600 max-w-2xl mx-auto mt-6 text-lg leading-relaxed">
                Mặt Trời kinh độ 330°. Khí Dương thăng lên, hơi nước bốc lên gặp lạnh ngưng tụ thành mưa. "Vũ" là mưa, "Thủy" là nước - sự chuyển hóa từ giá lạnh sang ẩm ướt.
            </p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <!-- Charts Column -->
            <div class="space-y-10">
                <div class="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
                    <h4 class="text-xl font-serif font-bold text-deep-ink mb-2 text-center">Vị Trí Thiên Văn (330°)</h4>
                    <div class="chart-container">
                        <canvas id="solarChart"></canvas>
                    </div>
                </div>
                
                <div class="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                    <h4 class="text-xl font-serif font-bold text-rain-blue mb-2 text-center">Sự Chuyển Hóa: Tuyết Tan - Mưa Tới</h4>
                    <div class="chart-container" style="height: 250px;">
                        <canvas id="climateChart"></canvas>
                    </div>
                    <p class="text-center text-sm text-gray-400 mt-4 italic">Băng tuyết giảm dần, nhường chỗ cho mưa xuân.</p>
                </div>
            </div>

            <!-- Content Explanation -->
            <div class="space-y-8 text-lg text-gray-600 leading-relaxed font-light">
                <div class="p-6 bg-white rounded-xl border-l-4 border-rain-blue shadow-sm">
                    <strong class="text-deep-ink font-serif text-xl block mb-2">Giải Nghĩa Tên Gọi</strong>
                    <p>
                        Không chỉ là mưa, Vũ Thủy hàm ý băng tuyết tan chảy. Trời không còn sương giá lạnh buốt, thay vào đó là sự ẩm ướt, tẩm nhuận của mùa xuân.
                    </p>
                </div>
                <div>
                    <strong class="text-deep-ink font-serif text-xl block mb-2">Biến Đổi Thiên Nhiên</strong>
                    <p>
                        Dương khí tiếp tục thăng phát. Hơi nước và độ ẩm tăng lên rõ rệt. Đây là nguồn sống quý giá sau mùa đông khô hạn.
                    </p>
                </div>
            </div>
        </div>
    </section>

    <!-- Section 2: Tam Hậu (Nature) -->
    <section id="tam-hau" class="py-24 bg-white relative z-10">
        <div class="max-w-6xl mx-auto px-4">
            <h3 class="text-3xl font-serif font-bold text-deep-ink mb-12 text-center">Tam Hậu: Ba Tín Hiệu Thiên Nhiên</h3>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                <!-- Card 1 -->
                <div class="card-interaction bg-paper-mist p-8 rounded-2xl cursor-default group text-center">
                    <div class="w-20 h-20 mx-auto rounded-full bg-deep-ink/10 flex items-center justify-center text-4xl mb-6 group-hover:scale-110 transition">🦦</div>
                    <h5 class="font-bold text-xl text-deep-ink mb-3 font-serif">1. Thát Tế Ngư</h5>
                    <p class="text-gray-600 font-light">Rái cá bắt được cá, bày trên bờ như đang cúng tế trời đất trước khi ăn, cảm tạ nguồn nước dồi dào.</p>
                </div>

                <!-- Card 2 -->
                <div class="card-interaction bg-paper-mist p-8 rounded-2xl cursor-default group text-center">
                    <div class="w-20 h-20 mx-auto rounded-full bg-rain-blue/10 flex items-center justify-center text-4xl mb-6 group-hover:scale-110 transition">🪿</div>
                    <h5 class="font-bold text-xl text-deep-ink mb-3 font-serif">2. Hồng Nhạn Lai</h5>
                    <p class="text-gray-600 font-light">Chim nhạn cảm nhận được khí ấm phương Bắc, bắt đầu hành trình bay từ phương Nam trở về.</p>
                </div>

                <!-- Card 3 -->
                <div class="card-interaction bg-paper-mist p-8 rounded-2xl cursor-default group text-center">
                    <div class="w-20 h-20 mx-auto rounded-full bg-sprout-green/20 flex items-center justify-center text-4xl mb-6 group-hover:scale-110 transition">🌱</div>
                    <h5 class="font-bold text-xl text-deep-ink mb-3 font-serif">3. Thảo Mộc Manh Động</h5>
                    <p class="text-gray-600 font-light">Được mưa xuân tưới tắm, cỏ cây hoa lá bắt đầu nảy mầm, đâm chồi mạnh mẽ.</p>
                </div>
            </div>
        </div>
    </section>

    <!-- Section 3: Đời Sống (Tabs) -->
    <section id="doi-song" class="py-24 px-4 bg-paper-mist relative z-10">
        <div class="max-w-6xl mx-auto">
            <div class="mb-12 text-center">
                <h3 class="text-4xl font-serif font-bold text-deep-ink mb-4">Mùa Cày Cấy & Phong Tục</h3>
                <p class="text-gray-600 italic">"Xuân vũ quý như du" - Mưa xuân quý như dầu</p>
            </div>

            <!-- Custom Tabs -->
            <div class="flex justify-center mb-10 space-x-4">
                <button onclick="switchTab('nong-nghiep')" id="btn-nong-nghiep" class="active-tab px-8 py-3 rounded-full border border-deep-ink font-bold transition duration-300 font-serif tracking-wide shadow-sm">Nông Nghiệp</button>
                <button onclick="switchTab('phong-tuc')" id="btn-phong-tuc" class="px-8 py-3 rounded-full border border-deep-ink text-deep-ink font-bold hover:bg-deep-ink hover:text-white transition duration-300 font-serif tracking-wide shadow-sm">Phong Tục</button>
            </div>

            <!-- Content Area -->
            <div class="bg-white p-8 md:p-12 rounded-3xl border border-gray-100 min-h-[400px] flex items-center shadow-sm relative overflow-hidden">
                <div class="absolute top-0 right-0 w-32 h-32 bg-rain-blue/5 rounded-bl-full pointer-events-none"></div>

                <!-- Nong Nghiep Content -->
                <div id="content-nong-nghiep" class="grid grid-cols-1 md:grid-cols-2 gap-10 w-full animate-fade-in">
                    <div class="flex flex-col justify-center">
                        <h4 class="text-3xl font-serif font-bold text-sprout-green mb-6">Hồi Sinh Đất Đai</h4>
                        <p class="text-gray-700 leading-relaxed mb-6">
                            Sau mùa đông khô hạn, mưa Vũ Thủy thấm sâu vào lòng đất, giúp rễ cây hấp thụ dưỡng chất, chuẩn bị cho sự bùng nổ của sự sống.
                        </p>
                        <ul class="space-y-4 text-gray-600 font-light">
                            <li class="flex items-start gap-3">
                                <span class="text-rain-blue font-bold">🌾</span>
                                <span>Thời điểm nông dân bận rộn nhất: Cày bừa, gieo cấy.</span>
                            </li>
                            <li class="flex items-start gap-3">
                                <span class="text-rain-blue font-bold">🌧️</span>
                                <span>Nguồn nước quý giá cho lúa chiêm và hoa màu.</span>
                            </li>
                        </ul>
                    </div>
                    <div class="flex items-center justify-center bg-paper-mist rounded-2xl p-6 border border-dashed border-gray-300">
                        <div class="text-center">
                            <div class="text-9xl mb-4 opacity-80 animate-float">🌱</div>
                            <p class="font-script text-2xl text-deep-ink">Mầm sống vươn lên</p>
                        </div>
                    </div>
                </div>

                <!-- Phong Tuc Content -->
                <div id="content-phong-tuc" class="hidden grid-cols-1 md:grid-cols-2 gap-10 w-full animate-fade-in">
                    <!-- Card 1 -->
                    <div class="bg-paper-mist p-8 rounded-2xl border-l-4 border-rain-blue hover:bg-gray-50 transition group">
                        <div class="text-5xl mb-4 group-hover:scale-110 transition duration-300">🎁</div>
                        <h4 class="text-2xl font-serif font-bold text-deep-ink mb-3">Hồi Nương Gia</h4>
                        <p class="text-gray-600 leading-relaxed font-light">
                            Con gái đã xuất giá mang quà về thăm cha mẹ đẻ. Mang ý nghĩa uống nước nhớ nguồn, biết ơn cội rễ như cây cối biết ơn mưa nguồn.
                        </p>
                    </div>
                    <!-- Card 2 -->
                    <div class="bg-paper-mist p-8 rounded-2xl border-l-4 border-earth-sand hover:bg-gray-50 transition group">
                        <div class="text-5xl mb-4 group-hover:scale-110 transition duration-300">🏮</div>
                        <h4 class="text-2xl font-serif font-bold text-deep-ink mb-3">Lễ Hội Cầu Mưa</h4>
                        <p class="text-gray-600 leading-relaxed font-light">
                            Mùa của các lễ hội xuân, cầu mưa thuận gió hòa, mùa màng bội thu.
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
                    <span class="text-earth-sand font-bold tracking-widest uppercase text-sm">Hành Thổ • Tạng Tỳ</span>
                    <h3 class="text-4xl font-serif font-bold text-deep-ink mt-2 mb-6">Trừ Thấp, Dưỡng Tỳ</h3>
                    <p class="text-gray-600 text-lg leading-relaxed mb-6">
                        Độ ẩm cao sinh "Thấp tà" gây nặng nề, hại Tỳ vị (Tiêu hóa). Nguyên tắc là <strong>"Chống ẩm"</strong> và <strong>"Kiện Tỳ"</strong>.
                    </p>
                    <div class="bg-white p-6 rounded-xl border-l-4 border-earth-sand shadow-sm">
                        <h4 class="font-bold text-lg text-earth-sand mb-2 font-serif">Nguyên Tắc Ẩm Thực</h4>
                        <p class="text-gray-600 mb-2"><strong>Ăn Ngọt, Tính Bình:</strong> Để dưỡng Tỳ, chống mệt mỏi.</p>
                        <p class="text-gray-600"><strong>Tránh Chua, Lạnh:</strong> Để tránh hại dạ dày và ngưng trệ khí huyết.</p>
                    </div>
                </div>

                <div class="space-y-4 font-sans text-gray-700">
                    <div class="flex items-center gap-4 p-3 bg-white rounded-lg shadow-sm">
                        <div class="w-10 h-10 rounded-full bg-rain-blue/10 flex items-center justify-center text-xl">🧣</div>
                        <div>
                            <strong>Xuân Ô (Ủ Ấm):</strong> "Trên mỏng dưới dày". Giữ ấm chân và bụng, đừng vội cất áo ấm.
                        </div>
                    </div>
                    <div class="flex items-center gap-4 p-3 bg-white rounded-lg shadow-sm">
                        <div class="w-10 h-10 rounded-full bg-rain-blue/10 flex items-center justify-center text-xl">🏃</div>
                        <div>
                            <strong>Vận Động:</strong> Nhẹ nhàng để ra mồ hôi, đẩy "thấp khí" ra ngoài.
                        </div>
                    </div>
                </div>
            </div>

            <!-- Right: Interactive Food Filter -->
            <div class="lg:col-span-7">
                <div class="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden flex flex-col h-full">
                    <div class="bg-deep-ink p-8 text-white">
                        <h4 class="text-2xl font-serif font-bold flex items-center gap-3">
                            <span>🥣</span> Thực Đơn Dưỡng Tỳ
                        </h4>
                        <p class="opacity-90 mt-2 font-light text-sm">Chọn thực phẩm giúp kiện Tỳ và trừ thấp.</p>
                    </div>

                    <!-- Filters -->
                    <div class="p-6 border-b border-gray-100 flex gap-3 overflow-x-auto no-scrollbar">
                        <button onclick="filterFood('all')" class="food-btn active px-5 py-2 rounded-full text-sm font-bold bg-gray-100 text-gray-600 hover:bg-gray-200 transition whitespace-nowrap" data-filter="all">Tất Cả</button>
                        <button onclick="filterFood('good')" class="food-btn px-5 py-2 rounded-full text-sm font-bold bg-gray-100 text-gray-600 hover:bg-gray-200 transition whitespace-nowrap" data-filter="good">Nên Dùng (Ngọt/Bình)</button>
                        <button onclick="filterFood('bad')" class="food-btn px-5 py-2 rounded-full text-sm font-bold bg-gray-100 text-gray-600 hover:bg-gray-200 transition whitespace-nowrap" data-filter="bad">Hạn Chế (Chua/Lạnh)</button>
                    </div>

                    <!-- Grid -->
                    <div id="food-grid" class="p-6 grid grid-cols-2 sm:grid-cols-3 gap-4 overflow-y-auto max-h-[500px] bg-paper-mist">
                        <!-- JS populated -->
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Section 5: Chiêm Nghiệm (Philosophy) -->
    <section id="chiem-nghiem" class="py-32 bg-deep-ink text-white text-center px-4 relative overflow-hidden">
        <!-- Abstract Background Shape -->
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-rain-blue/20 rounded-full blur-[100px] pointer-events-none"></div>

        <div class="max-w-3xl mx-auto relative z-10">
            <span class="text-6xl text-gray-500 font-serif opacity-50 block mb-6">❝</span>
            
            <h3 class="text-4xl md:text-5xl font-serif font-bold mb-10 text-white leading-tight">
                Bài Học Của Nước:<br>Khiêm Nhu & Kiên Nhẫn
            </h3>
            
            <p class="text-xl text-gray-300 leading-loose mb-12 font-sans font-light">
                Mưa xuân không ồn ào, rơi lất phất nhưng làm mềm cả đất khô cằn. Đó là sức mạnh của sự mềm mỏng (Nhu thắng Cương). Hãy học như nước: Tĩnh lặng, kiên trì và thẩm thấu. Để những lo toan trôi đi, chỉ giữ lại sự trong trẻo nuôi dưỡng tâm hồn.
            </p>

            <div class="inline-block border border-gray-600 rounded-2xl p-10 bg-white/5 backdrop-blur-sm hover:bg-white/10 transition duration-500 cursor-default group">
                <p class="font-bold uppercase tracking-[0.2em] text-sm text-rain-blue mb-6 font-sans group-hover:text-white transition">Lời Chúc Vũ Thủy</p>
                <div class="text-3xl md:text-4xl font-script text-sprout-green leading-relaxed group-hover:scale-105 transition duration-500">
                    "Mưa thuận gió hòa,<br>Tâm hồn tươi mát."
                </div>
            </div>
            
            <span class="text-6xl text-gray-500 font-serif opacity-50 block mt-12">❞</span>
        </div>
    </section>

    <!-- Footer -->
    <footer class="bg-[#1a2328] text-gray-500 py-12 text-center text-sm font-sans border-t border-gray-800">
        <p class="italic tracking-wide mb-3 text-gray-400">Biên soạn dựa trên nguyên lý 24 Tiết khí & Văn hóa Phương Đông</p>
        <p class="text-gray-600">© Bản quyền thuộc về <span class="font-script text-xl text-rain-blue ml-1">Tịch Phong Thiên Sơn - 夕风天山</span></p>
    </footer>

    <!-- Javascript Logic -->
    <script>
        // --- Data ---
        const foodData = [
            { name: "Khoai Mài", type: "good", icon: "🍠", desc: "Vị ngọt, bổ Tỳ, dưỡng vị" },
            { name: "Táo Đỏ", type: "good", icon: "🍎", desc: "Dưỡng huyết, kiện Tỳ" },
            { name: "Hạt Sen", type: "good", icon: "🪷", desc: "An thần, trừ thấp" },
            { name: "Gạo Nếp", type: "good", icon: "🍚", desc: "Ôn ấm tỳ vị" },
            { name: "Bí Đỏ", type: "good", icon: "🎃", desc: "Ngọt, ấm, dễ tiêu hóa" },
            { name: "Cháo Nóng", type: "good", icon: "🥣", desc: "Ấm bụng buổi sáng" },
            { name: "Đồ Chua", type: "bad", icon: "🍋", desc: "Hại gan, khắc Tỳ" },
            { name: "Đồ Sống", type: "bad", icon: "🥗", desc: "Lạnh bụng, sinh thấp trệ" },
            { name: "Dầu Mỡ", type: "bad", icon: "🍟", desc: "Khó tiêu, gây đầy bụng" }
        ];

        // --- Tab Logic ---
        function switchTab(tab) {
            document.getElementById('content-nong-nghiep').classList.add('hidden');
            document.getElementById('content-nong-nghiep').classList.remove('grid');
            document.getElementById('content-phong-tuc').classList.add('hidden');
            document.getElementById('content-phong-tuc').classList.remove('grid');

            document.getElementById('btn-nong-nghiep').classList.remove('active-tab', 'text-white');
            document.getElementById('btn-nong-nghiep').classList.add('text-deep-ink');
            document.getElementById('btn-phong-tuc').classList.remove('active-tab', 'text-white');
            document.getElementById('btn-phong-tuc').classList.add('text-deep-ink');

            const content = document.getElementById(\`content-\${tab}\`);
            content.classList.remove('hidden');
            content.classList.add('grid');
            
            const btn = document.getElementById(\`btn-\${tab}\`);
            btn.classList.add('active-tab');
            btn.classList.remove('text-deep-ink');
        }

        // --- Food Filter Logic ---
        function filterFood(filter) {
            const grid = document.getElementById('food-grid');
            grid.innerHTML = ''; 

            document.querySelectorAll('.food-btn').forEach(btn => {
                if(btn.dataset.filter === filter) {
                    btn.classList.add('bg-deep-ink', 'text-white');
                    btn.classList.remove('bg-gray-100', 'text-gray-600');
                } else {
                    btn.classList.remove('bg-deep-ink', 'text-white');
                    btn.classList.add('bg-gray-100', 'text-gray-600');
                }
            });

            const items = filter === 'all' ? foodData : foodData.filter(i => i.type === filter);

            items.forEach(item => {
                const el = document.createElement('div');
                let colorClass = item.type === 'good' 
                    ? 'bg-orange-50 border-orange-100 text-orange-900' 
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

        // --- Canvas Animation (Rain) ---
        function initRainCanvas() {
            const canvas = document.getElementById('rainCanvas');
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

            class Drop {
                constructor() {
                    this.x = Math.random() * width;
                    this.y = Math.random() * height - height;
                    this.length = Math.random() * 15 + 10;
                    this.speed = Math.random() * 2 + 3;
                    this.opacity = Math.random() * 0.2 + 0.1;
                    this.color = \`rgba(96, 150, 186, \${this.opacity})\`;
                }
                update() {
                    this.y += this.speed;
                    if (this.y > height) {
                        this.y = -20;
                        this.x = Math.random() * width;
                    }
                }
                draw() {
                    ctx.beginPath();
                    ctx.moveTo(this.x, this.y);
                    ctx.lineTo(this.x, this.y + this.length);
                    ctx.strokeStyle = this.color;
                    ctx.lineWidth = 1;
                    ctx.lineCap = 'round';
                    ctx.stroke();
                }
            }

            for(let i=0; i<100; i++) drops.push(new Drop());

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
            initRainCanvas();
            filterFood('all');

            // Chart 1: Solar Term 330 deg
            const ctx1 = document.getElementById('solarChart').getContext('2d');
            new Chart(ctx1, {
                type: 'doughnut',
                data: {
                    labels: ['Vũ Thủy', 'Kinh Trập', 'Xuân Phân', 'Mùa Khác'],
                    datasets: [{
                        data: [15, 15, 15, 315],
                        backgroundColor: ['#6096BA', '#A3C9A8', '#A3C9A8', '#E7ECEF'],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    rotation: -105, 
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
                        ctx.fillStyle = "#6096BA";
                        var text = "330°",
                            textX = Math.round((width - ctx.measureText(text).width) / 2),
                            textY = height / 2;
                        ctx.fillText(text, textX, textY);
                        ctx.save();
                    }
                }]
            });

            // Chart 2: Climate Shift
            const ctx2 = document.getElementById('climateChart').getContext('2d');
            new Chart(ctx2, {
                type: 'bar',
                data: {
                    labels: ['Lập Xuân', 'Vũ Thủy', 'Kinh Trập'],
                    datasets: [
                        {
                            label: 'Tuyết (Hàn)',
                            data: [50, 10, 5],
                            backgroundColor: '#E7ECEF',
                            borderRadius: 4,
                            barPercentage: 0.6
                        },
                        {
                            label: 'Mưa (Ẩm)',
                            data: [30, 70, 85],
                            backgroundColor: '#6096BA',
                            borderRadius: 4,
                            barPercentage: 0.6
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: { 
                            beginAtZero: true, 
                            display: false 
                        },
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
