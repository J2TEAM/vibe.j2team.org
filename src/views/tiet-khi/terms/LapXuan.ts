export const LapXuan = `
<!DOCTYPE html>
<html lang="vi">
<head> 
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Lập Xuân: Khởi Nguyên Của Sự Sống & Vòng Quay Luân Hồi</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    
    <!-- Fonts: Philosopher (Tiêu đề - Trang nhã), Be Vietnam Pro (Nội dung - Tươi mới), Dancing Script (Thơ - Bay bổng) -->
    <link href="https://fonts.googleapis.com/css2?family=Philosopher:ital,wght@0,400;0,700;1,400;1,700&family=Be+Vietnam+Pro:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400&family=Dancing+Script:wght@400;700&display=swap" rel="stylesheet">
    
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        'spring-green': '#70E000',  // Xanh chồi non (Sự sống mới/Hành Mộc)
                        'peach-pink': '#FF99C8',    // Hồng phấn (Hoa đào/Mùa xuân)
                        'sun-yellow': '#FFD60A',    // Vàng nắng (Dương khí thăng)
                        'sky-blue': '#4CC9F0',      // Xanh trời (Hy vọng)
                        'fresh-white': '#F0FFF1',   // Trắng tinh khôi (Nền)
                        'wood-brown': '#582F0E'     // Nâu gỗ (Cội nguồn)
                    },
                    fontFamily: {
                        serif: ['"Philosopher"', 'serif'],
                        sans: ['"Be Vietnam Pro"', 'sans-serif'],
                        script: ['"Dancing Script"', 'cursive'],
                    },
                    animation: {
                        'bounce-slow': 'bounceSlow 3s infinite',
                    },
                    keyframes: {
                        bounceSlow: {
                            '0%, 100%': { transform: 'translateY(-5px)' },
                            '50%': { transform: 'translateY(5px)' },
                        }
                    }
                }
            }
        }
    </script>
    <style>
        body {
            background-color: #F0FFF1;
            color: #582F0E;
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
        /* Petal Canvas Layer */
        #petalCanvas {
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
            border: 1px solid transparent;
            background: rgba(255, 255, 255, 0.9);
            backdrop-filter: blur(5px);
        }
        .card-interaction:hover {
            transform: translateY(-5px);
            border-color: #70E000;
            box-shadow: 0 10px 30px -10px rgba(112, 224, 0, 0.3);
        }
        .active-tab {
            background-color: #70E000;
            color: white;
            border-color: #70E000;
        }
        .no-scrollbar::-webkit-scrollbar {
            display: none;
        }
        .no-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
    </style>
    <!-- Chosen Palette: "Spring Awakening" - Fresh Green, Soft Pink, Sunny Yellow -->
    <!-- Application Structure Plan:
        1. Hero: Title with "Falling Petals" visual cue (Canvas animation).
        2. Thien Tuong (Cosmic): Chart showing 315° & Yang rising/Yin retreating.
        3. Tam Hau (Nature): 3 Micro-seasons (East wind thaws, Insects wake, Fish swim up).
        4. Doi Song (Life): Tabs for Agriculture ("Planting Trees") & Customs ("Whipping Spring Ox", "Biting Spring").
        5. Duong Sinh (Health): "Nourish Yang/Liver" - Food Filter (Spicy/Sweet vs Sour).
        6. Chiem Nghiem (Philosophy): Hope & Rebirth (Khoi Nguyen).
        7. Footer: Copyright Tich Phong Thien Son.
    -->
    <!-- Visualization & Content Choices:
        1. Solar Gauge: Chart.js Doughnut (315°).
        2. Energy Shift: Line Chart showing rapid rise of Yang energy.
        3. Food Filter: Logic for Liver-soothing/Yang-boosting foods (Leeks, Ginger).
        4. Petal Animation: HTML5 Canvas for falling cherry blossom petals.
    -->
    <!-- CONFIRMATION: NO SVG graphics used. NO Mermaid JS used. -->
</head>
<body class="font-sans antialiased leading-relaxed selection:bg-spring-green selection:text-white">

    <!-- Background Animation -->
    <canvas id="petalCanvas"></canvas>

    <!-- Navigation -->
    <nav class="sticky top-0 z-50 bg-fresh-white/90 backdrop-blur-md border-b border-spring-green/30 shadow-sm transition-all duration-300">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between h-20 items-center">
                <div class="flex-shrink-0 flex items-center gap-3">
                    <span class="text-3xl filter drop-shadow-sm animate-bounce-slow">🌱</span>
                    <div class="flex flex-col">
                        <span class="text-2xl font-serif font-bold text-spring-green tracking-wide">Lập Xuân</span>
                        <span class="text-xs font-sans text-peach-pink uppercase tracking-widest font-bold">Khởi Nguyên Sự Sống</span>
                    </div>
                </div>
                <div class="hidden md:flex space-x-10">
                    <button onclick="scrollToSection('y-nghia')" class="text-wood-brown hover:text-spring-green transition font-medium tracking-wide text-sm uppercase">Ý Nghĩa</button>
                    <button onclick="scrollToSection('tam-hau')" class="text-wood-brown hover:text-spring-green transition font-medium tracking-wide text-sm uppercase">Tam Hậu</button>
                    <button onclick="scrollToSection('doi-song')" class="text-wood-brown hover:text-spring-green transition font-medium tracking-wide text-sm uppercase">Đời Sống</button>
                    <button onclick="scrollToSection('duong-sinh')" class="text-wood-brown hover:text-spring-green transition font-medium tracking-wide text-sm uppercase">Dưỡng Sinh</button>
                    <button onclick="scrollToSection('chiem-nghiem')" class="text-wood-brown hover:text-spring-green transition font-medium tracking-wide text-sm uppercase">Chiêm Nghiệm</button>
                </div>
            </div>
        </div>
    </nav>

    <!-- Hero Section -->
    <header class="relative pt-24 pb-20 px-4 text-center z-10 overflow-hidden">
        <div class="max-w-4xl mx-auto">
            <p class="text-peach-pink font-bold tracking-[0.3em] uppercase mb-6 text-sm font-sans">Tiết Khí Thứ 1 • 4-5 Tháng 2</p>
            <h1 class="text-6xl md:text-8xl font-serif font-bold text-wood-brown mb-6 leading-tight relative inline-block">
                Lập Xuân
                <span class="absolute -top-4 -right-12 text-4xl animate-spin-slow text-sun-yellow">☀️</span>
            </h1>
            <h2 class="text-3xl md:text-5xl font-script text-spring-green mb-10 font-bold transform -rotate-1 shadow-sm">
                Khúc Dạo Đầu Của Hy Vọng
            </h2>
            <div class="w-24 h-1 bg-spring-green mx-auto mb-10 rounded-full shadow-sm"></div>
            <p class="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-loose font-light">
                "Đại Hàn khép lại, Lập Xuân mở ra. Dương khí thăng hoa, xua tan băng giá. Đây là lúc gieo xuống những hạt giống thiện lành cho một năm mới an khang."
            </p>
            <div class="mt-14">
                <button onclick="scrollToSection('y-nghia')" class="group relative inline-flex items-center justify-center px-10 py-3 overflow-hidden font-serif italic tracking-wide text-white transition duration-300 ease-out border-2 border-spring-green rounded-full shadow-md bg-spring-green">
                    <span class="absolute inset-0 flex items-center justify-center w-full h-full text-spring-green duration-300 -translate-x-full bg-white group-hover:translate-x-0 ease">
                        <span class="text-xl">🎍</span>
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
            <h3 class="text-4xl font-serif font-bold text-spring-green mb-4 inline-block relative">
                Sự Giao Thoa Âm Dương
                <span class="absolute -bottom-2 left-0 w-full h-1 bg-peach-pink"></span>
            </h3>
            <p class="text-gray-600 max-w-2xl mx-auto mt-6 text-lg leading-relaxed">
                Mặt Trời kinh độ 315°. "Lập" là bắt đầu, "Xuân" là sinh sôi. Giao hội của Đất Trời, đánh dấu chu kỳ vận hành mới.
            </p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <!-- Charts Column -->
            <div class="space-y-10">
                <div class="bg-white p-8 rounded-2xl shadow-sm border border-peach-pink/20 relative overflow-hidden">
                    <h4 class="text-xl font-serif font-bold text-wood-brown mb-2 text-center">Vị Trí Thiên Văn (315°)</h4>
                    <div class="chart-container">
                        <canvas id="solarChart"></canvas>
                    </div>
                </div>
                
                <div class="bg-white p-8 rounded-2xl shadow-sm border border-peach-pink/20">
                    <h4 class="text-xl font-serif font-bold text-spring-green mb-2 text-center">Sự Thăng Hoa Của Dương Khí</h4>
                    <div class="chart-container" style="height: 250px;">
                        <canvas id="energyChart"></canvas>
                    </div>
                    <p class="text-center text-sm text-gray-500 mt-4 italic">Dương khí bứt phá, Âm khí lùi dần.</p>
                </div>
            </div>

            <!-- Content Explanation -->
            <div class="space-y-8 text-lg text-gray-600 leading-relaxed font-light">
                <div class="p-6 bg-white rounded-xl border-l-4 border-spring-green shadow-sm">
                    <strong class="text-wood-brown font-serif text-xl block mb-2">Hành Mộc Chủ Xuân</strong>
                    <p>
                        Mùa Xuân thuộc hành Mộc, tượng trưng cho sự vươn lên, phát triển. Cây cối đâm chồi nảy lộc, vạn vật bừng tỉnh sau giấc ngủ đông.
                    </p>
                </div>
                <div>
                    <strong class="text-wood-brown font-serif text-xl block mb-2">Thiên Nhiên Biến Đổi</strong>
                    <p>
                        Gió đông ấm áp thổi về, băng giá tan chảy. Các loài côn trùng cựa mình thức giấc. Cá bơi lên mặt nước để thở. Sự sống bắt đầu rộn ràng.
                    </p>
                </div>
            </div>
        </div>
    </section>

    <!-- Section 2: Tam Hậu (Nature) -->
    <section id="tam-hau" class="py-24 bg-white relative z-10">
        <div class="max-w-6xl mx-auto px-4">
            <h3 class="text-3xl font-serif font-bold text-wood-brown mb-12 text-center">Tam Hậu: Ba Tín Hiệu Hồi Sinh</h3>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                <!-- Card 1 -->
                <div class="card-interaction p-8 rounded-2xl cursor-default group text-center">
                    <div class="w-20 h-20 mx-auto rounded-full bg-sun-yellow/20 flex items-center justify-center text-4xl mb-6 group-hover:scale-110 transition">🌬️</div>
                    <h5 class="font-bold text-xl text-spring-green mb-3 font-serif">1. Đông Phong Giải Đống</h5>
                    <p class="text-gray-600 font-light">Gió đông ấm áp thổi về làm tan băng giá. Hơi ấm lan tỏa khắp nơi, xua tan cái lạnh cắt da.</p>
                </div>

                <!-- Card 2 -->
                <div class="card-interaction p-8 rounded-2xl cursor-default group text-center">
                    <div class="w-20 h-20 mx-auto rounded-full bg-peach-pink/20 flex items-center justify-center text-4xl mb-6 group-hover:scale-110 transition">🐛</div>
                    <h5 class="font-bold text-xl text-spring-green mb-3 font-serif">2. Trập Trùng Thủy Chấn</h5>
                    <p class="text-gray-600 font-light">Sâu bọ, côn trùng ngủ đông cảm nhận được dương khí mà tỉnh giấc, bắt đầu cựa mình hoạt động.</p>
                </div>

                <!-- Card 3 -->
                <div class="card-interaction p-8 rounded-2xl cursor-default group text-center">
                    <div class="w-20 h-20 mx-auto rounded-full bg-sky-blue/20 flex items-center justify-center text-4xl mb-6 group-hover:scale-110 transition">🐟</div>
                    <h5 class="font-bold text-xl text-spring-green mb-3 font-serif">3. Ngư Thượng Băng</h5>
                    <p class="text-gray-600 font-light">Cá dưới nước cảm nhận được hơi ấm, bơi lên gần mặt nước (hoặc lớp băng đang tan) để thở.</p>
                </div>
            </div>
        </div>
    </section>

    <!-- Section 3: Đời Sống (Tabs) -->
    <section id="doi-song" class="py-24 px-4 bg-fresh-white relative z-10">
        <div class="max-w-6xl mx-auto">
            <div class="mb-12 text-center">
                <h3 class="text-4xl font-serif font-bold text-wood-brown mb-4">Nghênh Xuân & Gieo Trồng</h3>
                <p class="text-gray-600 italic">"Một năm bắt đầu từ mùa xuân"</p>
            </div>

            <!-- Custom Tabs -->
            <div class="flex justify-center mb-10 space-x-4">
                <button onclick="switchTab('phong-tuc')" id="btn-phong-tuc" class="active-tab px-8 py-3 rounded-full border border-spring-green font-bold transition duration-300 font-serif tracking-wide shadow-sm">Phong Tục</button>
                <button onclick="switchTab('nong-nghiep')" id="btn-nong-nghiep" class="px-8 py-3 rounded-full border border-spring-green text-spring-green font-bold hover:bg-spring-green hover:text-white transition duration-300 font-serif tracking-wide shadow-sm">Nông Nghiệp</button>
            </div>

            <!-- Content Area -->
            <div class="bg-white p-8 md:p-12 rounded-3xl border border-peach-pink/30 min-h-[400px] flex items-center shadow-sm relative overflow-hidden">
                <div class="absolute top-0 right-0 w-32 h-32 bg-spring-green/10 rounded-bl-full pointer-events-none"></div>

                <!-- Phong Tuc Content -->
                <div id="content-phong-tuc" class="grid grid-cols-1 md:grid-cols-2 gap-10 w-full animate-fade-in">
                    <!-- Card 1 -->
                    <div class="bg-fresh-white p-8 rounded-2xl border-l-4 border-wood-brown hover:bg-white transition group">
                        <div class="text-5xl mb-4 group-hover:scale-110 transition duration-300">🐂</div>
                        <h4 class="text-2xl font-serif font-bold text-spring-green mb-3">Đả Xuân Ngưu</h4>
                        <p class="text-gray-600 leading-relaxed font-light">
                            Đánh trâu xuân (làm bằng đất/giấy) để đánh thức sức lao động, xua đi sự lười biếng của mùa đông, cầu mong mùa màng bội thu.
                        </p>
                    </div>
                    <!-- Card 2 -->
                    <div class="bg-fresh-white p-8 rounded-2xl border-l-4 border-peach-pink hover:bg-white transition group">
                        <div class="text-5xl mb-4 group-hover:scale-110 transition duration-300">🥗</div>
                        <h4 class="text-2xl font-serif font-bold text-spring-green mb-3">Cắn Xuân (Giảo Xuân)</h4>
                        <p class="text-gray-600 leading-relaxed font-light">
                            Ăn củ cải sống hoặc bánh cuốn rau củ. Vị cay giúp giải trừ "xuân khốn" (buồn ngủ), thông khí và cầu sức khỏe.
                        </p>
                    </div>
                </div>

                <!-- Nong Nghiep Content -->
                <div id="content-nong-nghiep" class="hidden grid-cols-1 md:grid-cols-2 gap-10 w-full animate-fade-in">
                    <div class="flex flex-col justify-center">
                        <h4 class="text-3xl font-serif font-bold text-sun-yellow mb-6">Thời Điểm Vàng Ngọc</h4>
                        <p class="text-gray-600 leading-relaxed mb-6">
                            Đất đai hồi sinh, mưa xuân lất phất. Điều kiện lý tưởng nhất để bắt đầu vụ mùa mới.
                        </p>
                        <ul class="space-y-4 text-gray-600 font-light">
                            <li class="flex items-start gap-3">
                                <span class="text-spring-green font-bold">🌱</span>
                                <span><strong>Tết Trồng Cây:</strong> Gieo mầm xanh, gửi gắm ước vọng sinh sôi.</span>
                            </li>
                            <li class="flex items-start gap-3">
                                <span class="text-wood-brown font-bold">🚜</span>
                                <span><strong>Cày Xới:</strong> Đánh thức đất đai sau kỳ nghỉ đông.</span>
                            </li>
                        </ul>
                    </div>
                    <div class="flex items-center justify-center bg-fresh-white rounded-2xl p-6 border border-dashed border-gray-300">
                        <div class="text-center">
                            <div class="text-9xl mb-4 opacity-80 animate-pulse">🌾</div>
                            <p class="font-script text-2xl text-spring-green">Mùa màng khởi sắc</p>
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
                    <span class="text-peach-pink font-bold tracking-widest uppercase text-sm">Hành Mộc • Tạng Can</span>
                    <h3 class="text-4xl font-serif font-bold text-spring-green mt-2 mb-6">Dưỡng Dương, Sơ Can</h3>
                    <p class="text-gray-600 text-lg leading-relaxed mb-6">
                        Dương khí thăng phát, cần nuôi dưỡng khí non nớt này. Tạng Can (Gan) chủ mùa xuân, cần giữ cho khí huyết thông thoáng.
                    </p>
                    <div class="bg-white p-6 rounded-xl border-l-4 border-sun-yellow shadow-sm">
                        <h4 class="font-bold text-lg text-sun-yellow mb-2 font-serif">Nguyên Tắc Ẩm Thực</h4>
                        <p class="text-gray-600 mb-2"><strong>Cay & Ngọt:</strong> Hành, hẹ, táo đỏ để phát tán lạnh, dưỡng Tỳ.</p>
                        <p class="text-gray-600"><strong>Bớt Chua:</strong> Vị chua vào Can, ăn nhiều làm Can quá vượng khắc Tỳ.</p>
                    </div>
                </div>

                <div class="space-y-4 font-sans text-gray-700">
                    <div class="flex items-center gap-4 p-3 bg-white rounded-lg shadow-sm">
                        <div class="w-10 h-10 rounded-full bg-spring-green/20 flex items-center justify-center text-xl">🚶</div>
                        <div>
                            <strong>Vận Động:</strong> Đi bách bộ, xõa tóc, nới lỏng quần áo để khí huyết lưu thông.
                        </div>
                    </div>
                    <div class="flex items-center gap-4 p-3 bg-white rounded-lg shadow-sm">
                        <div class="w-10 h-10 rounded-full bg-spring-green/20 flex items-center justify-center text-xl">😌</div>
                        <div>
                            <strong>Tinh Thần:</strong> Tránh giận dữ (hại Gan). Giữ tâm thái vui vẻ, bao dung.
                        </div>
                    </div>
                </div>
            </div>

            <!-- Right: Interactive Food Filter -->
            <div class="lg:col-span-7">
                <div class="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden flex flex-col h-full">
                    <div class="bg-spring-green p-8 text-white">
                        <h4 class="text-2xl font-serif font-bold flex items-center gap-3">
                            <span>🥗</span> Thực Đơn Dưỡng Xuân
                        </h4>
                        <p class="opacity-90 mt-2 font-light text-sm">Chọn thực phẩm giúp phát tán hàn khí và dưỡng Tỳ vị.</p>
                    </div>

                    <!-- Filters -->
                    <div class="p-6 border-b border-gray-100 flex gap-3 overflow-x-auto no-scrollbar">
                        <button onclick="filterFood('all')" class="food-btn active px-5 py-2 rounded-full text-sm font-bold bg-wood-brown text-white hover:bg-spring-green transition whitespace-nowrap" data-filter="all">Tất Cả</button>
                        <button onclick="filterFood('good')" class="food-btn px-5 py-2 rounded-full text-sm font-bold bg-gray-100 text-gray-600 hover:bg-gray-200 transition whitespace-nowrap" data-filter="good">Nên Dùng (Cay/Ngọt)</button>
                        <button onclick="filterFood('bad')" class="food-btn px-5 py-2 rounded-full text-sm font-bold bg-gray-100 text-gray-600 hover:bg-gray-200 transition whitespace-nowrap" data-filter="bad">Hạn Chế (Chua)</button>
                    </div>

                    <!-- Grid -->
                    <div id="food-grid" class="p-6 grid grid-cols-2 sm:grid-cols-3 gap-4 overflow-y-auto max-h-[500px] bg-fresh-white">
                        <!-- JS populated -->
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Section 5: Chiêm Nghiệm (Philosophy) -->
    <section id="chiem-nghiem" class="py-32 bg-wood-brown text-white text-center px-4 relative overflow-hidden">
        <!-- Abstract Background Shape -->
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-spring-green/10 rounded-full blur-[100px] pointer-events-none"></div>

        <div class="max-w-3xl mx-auto relative z-10">
            <span class="text-6xl text-peach-pink font-serif opacity-50 block mb-6">❝</span>
            
            <h3 class="text-4xl md:text-5xl font-serif font-bold mb-10 text-white leading-tight">
                Hy Vọng & Tái Sinh
            </h3>
            
            <p class="text-xl text-gray-300 leading-loose mb-12 font-sans font-light">
                Dù mùa đông có lạnh lẽo đến đâu, gió đông vẫn sẽ về, mầm xanh vẫn sẽ mọc. Không có sự bế tắc vĩnh cửu. Hãy buông bỏ lớp vỏ cũ kỹ của năm cũ để đón nhận sự khởi đầu mới mẻ, tràn đầy hy vọng.
            </p>

            <div class="inline-block border border-gray-500 rounded-2xl p-10 bg-white/10 backdrop-blur-sm hover:bg-white/20 transition duration-500 cursor-default group">
                <p class="font-bold uppercase tracking-[0.2em] text-sm text-sun-yellow mb-6 font-sans group-hover:text-white transition">Lời Chúc Lập Xuân</p>
                <div class="text-3xl md:text-4xl font-script text-peach-pink leading-relaxed group-hover:scale-105 transition duration-500 shadow-text">
                    "Thân khỏe tùng bách,<br>Vận khí bừng sáng."
                </div>
            </div>
            
            <span class="text-6xl text-peach-pink font-serif opacity-50 block mt-12">❞</span>
        </div>
    </section>

    <!-- Footer -->
    <footer class="bg-[#3E200A] text-gray-400 py-12 text-center text-sm font-sans border-t border-gray-700">
        <p class="italic tracking-wide mb-3 text-gray-500">Biên soạn dựa trên nguyên lý 24 Tiết khí & Văn hóa Phương Đông</p>
        <p class="text-gray-400">© Bản quyền thuộc về <span class="font-script text-xl text-spring-green ml-1">Tịch Phong Thiên Sơn - 夕风天山</span></p>
    </footer>

    <!-- Javascript Logic -->
    <script>
        // --- Data ---
        const foodData = [
            { name: "Rau Hẹ", type: "good", icon: "🌿", desc: "Đệ nhất sơ thái, trợ dương, ôn trung" },
            { name: "Hành Tây", type: "good", icon: "🧅", desc: "Vị cay, tính ôn, phát tán hàn" },
            { name: "Táo Đỏ", type: "good", icon: "🍎", desc: "Vị ngọt, bổ tỳ vị, dưỡng huyết" },
            { name: "Gừng", type: "good", icon: "🫚", desc: "Giải cảm lạnh, ấm bụng" },
            { name: "Hạt Sen", type: "good", icon: "🪷", desc: "Dưỡng tâm, kiện tỳ" },
            { name: "Củ Cải (Sống)", type: "good", icon: "🥕", desc: "Vị cay, tiêu thực, giải xuân khốn" },
            { name: "Dưa Muối", type: "bad", icon: "🥒", desc: "Quá chua, hại gan đầu xuân" },
            { name: "Cam Chanh", type: "bad", icon: "🍋", desc: "Vị chua thu liễm, không tốt cho sự sinh phát" },
            { name: "Măng", type: "bad", icon: "🎍", desc: "Tính hàn, khó tiêu" }
        ];

        // --- Tab Logic ---
        function switchTab(tab) {
            document.getElementById('content-phong-tuc').classList.add('hidden');
            document.getElementById('content-phong-tuc').classList.remove('grid');
            document.getElementById('content-nong-nghiep').classList.add('hidden');
            document.getElementById('content-nong-nghiep').classList.remove('grid');

            document.getElementById('btn-phong-tuc').classList.remove('active-tab', 'text-white');
            document.getElementById('btn-phong-tuc').classList.add('text-wood-brown');
            document.getElementById('btn-nong-nghiep').classList.remove('active-tab', 'text-white');
            document.getElementById('btn-nong-nghiep').classList.add('text-wood-brown');

            const content = document.getElementById(\`content-\${tab}\`);
            content.classList.remove('hidden');
            content.classList.add('grid');
            
            const btn = document.getElementById(\`btn-\${tab}\`);
            btn.classList.add('active-tab');
            btn.classList.remove('text-wood-brown');
        }

        // --- Food Filter Logic ---
        function filterFood(filter) {
            const grid = document.getElementById('food-grid');
            grid.innerHTML = ''; 

            document.querySelectorAll('.food-btn').forEach(btn => {
                if(btn.dataset.filter === filter) {
                    btn.classList.add('bg-wood-brown', 'text-white');
                    btn.classList.remove('bg-gray-100', 'text-gray-600');
                } else {
                    btn.classList.remove('bg-wood-brown', 'text-white');
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

        // --- Canvas Animation (Falling Petals) ---
        function initPetalCanvas() {
            const canvas = document.getElementById('petalCanvas');
            const ctx = canvas.getContext('2d');
            let width, height;
            let petals = [];

            function resize() {
                width = window.innerWidth;
                height = window.innerHeight;
                canvas.width = width;
                canvas.height = height;
            }
            window.addEventListener('resize', resize);
            resize();

            class Petal {
                constructor() {
                    this.x = Math.random() * width;
                    this.y = Math.random() * height - height;
                    this.size = Math.random() * 5 + 5;
                    this.speedY = Math.random() * 1 + 0.5;
                    this.speedX = Math.random() * 2 - 1;
                    this.angle = Math.random() * 360;
                    this.spin = Math.random() * 2 - 1;
                    this.color = '#FF99C8'; // Peach Pink
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
                    // Simple petal shape
                    ctx.ellipse(0, 0, this.size, this.size/1.5, 0, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                }
            }

            for(let i=0; i<40; i++) petals.push(new Petal());

            function animate() {
                ctx.clearRect(0, 0, width, height);
                petals.forEach(p => {
                    p.update();
                    p.draw();
                });
                requestAnimationFrame(animate);
            }
            animate();
        }

        // --- Init ---
        document.addEventListener('DOMContentLoaded', () => {
            initPetalCanvas();
            filterFood('all');

            // Chart 1: Solar Term 315 deg
            const ctx1 = document.getElementById('solarChart').getContext('2d');
            new Chart(ctx1, {
                type: 'doughnut',
                data: {
                    labels: ['Lập Xuân', 'Vũ Thủy', 'Kinh Trập', 'Mùa Khác'],
                    datasets: [{
                        data: [15, 15, 15, 315],
                        backgroundColor: ['#70E000', '#4CC9F0', '#70E000', '#F0FFF1'],
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
                        ctx.fillStyle = "#70E000";
                        var text = "315°",
                            textX = Math.round((width - ctx.measureText(text).width) / 2),
                            textY = height / 2;
                        ctx.fillText(text, textX, textY);
                        ctx.save();
                    }
                }]
            });

            // Chart 2: Energy Shift (Line)
            const ctx2 = document.getElementById('energyChart').getContext('2d');
            new Chart(ctx2, {
                type: 'line',
                data: {
                    labels: ['Đại Hàn', 'Lập Xuân', 'Vũ Thủy'],
                    datasets: [
                        {
                            label: 'Dương Khí (Sinh trưởng)',
                            data: [10, 30, 50], // Rising
                            borderColor: '#FFD60A', // Sun Yellow
                            tension: 0.4,
                            borderWidth: 3
                        },
                        {
                            label: 'Âm Khí (Hàn lạnh)',
                            data: [90, 70, 50], // Falling
                            borderColor: '#582F0E', // Wood Brown
                            backgroundColor: 'rgba(88, 47, 14, 0.1)',
                            fill: true,
                            tension: 0.4
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
