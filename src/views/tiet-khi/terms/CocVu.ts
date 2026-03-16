export const CocVu = `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cốc Vũ: Mưa Sinh Trăm Hạt & Sự Trưởng Thành Của Vạn Vật</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    
    <!-- Fonts: Philosopher (Tiêu đề - Trầm mặc), Be Vietnam Pro (Nội dung - Rõ ràng), Dancing Script (Thơ - Bay bổng) -->
    <link href="https://fonts.googleapis.com/css2?family=Philosopher:ital,wght@0,400;0,700;1,400;1,700&family=Be+Vietnam+Pro:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400&family=Dancing+Script:wght@400;700&display=swap" rel="stylesheet">
    
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        'grain-gold': '#D4A017',    // Vàng lúa chín/Ngũ cốc (Cốc)
                        'rain-storm': '#2C5F2D',    // Xanh lá đậm (Cây cối sau mưa)
                        'deep-water': '#1F4068',    // Xanh nước thẫm (Vũ/Thủy)
                        'peony-red': '#B22222',     // Đỏ mẫu đơn (Sự thịnh vượng)
                        'rice-paper': '#FFF8E7',    // Giấy dó vàng (Nền)
                        'soil-brown': '#5D4037'     // Nâu đất (Thổ nhưỡng)
                    },
                    fontFamily: {
                        serif: ['"Philosopher"', 'serif'],
                        sans: ['"Be Vietnam Pro"', 'sans-serif'],
                        script: ['"Dancing Script"', 'cursive'],
                    },
                    animation: {
                        'grow': 'grow 3s ease-out forwards',
                    },
                    keyframes: {
                        grow: {
                            '0%': { transform: 'scaleY(0)', transformOrigin: 'bottom' },
                            '100%': { transform: 'scaleY(1)', transformOrigin: 'bottom' },
                        }
                    }
                }
            }
        }
    </script>
    <style>
        body {
            background-color: #FFF8E7;
            color: #5D4037;
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
        /* Heavy Rain Canvas Layer */
        #heavyRainCanvas {
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
            border-color: #D4A017;
            box-shadow: 0 10px 30px -10px rgba(212, 160, 23, 0.3);
            background-color: white;
        }
        .active-tab {
            background-color: #2C5F2D;
            color: white;
            border-color: #2C5F2D;
        }
        .no-scrollbar::-webkit-scrollbar {
            display: none;
        }
        .no-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
    </style>
    <!-- Chosen Palette: "Grain Rain Harvest" - Golden Yellow, Deep Green, Dark Blue, Peony Red -->
    <!-- Application Structure Plan:
        1. Hero: Title with "Heavy Rain/Growth" visual cue (Canvas animation).
        2. Thien Tuong (Cosmic): Chart showing 30° & Humidity/Temp rise.
        3. Tam Hau (Nature): 3 Micro-seasons (Duckweed, Cuckoo, Hoopoe).
        4. Doi Song (Life): Tabs for Agriculture ("Golden Time") & Customs ("Tea & Peony").
        5. Duong Sinh (Health): "Dampness Removal" - Food Filter (Bitter/Sweet vs Cold/Raw).
        6. Chiem Nghiem (Philosophy): Maturity & Achievement.
        7. Footer: Copyright Tich Phong Thien Son.
    -->
    <!-- Visualization & Content Choices:
        1. Solar Gauge: Chart.js Doughnut (30°).
        2. Growth Cycle: Line Chart showing Temp/Humidity rising sharply.
        3. Food Filter: Logic for Damp-removing foods (Adzuki bean, Coix seed).
        4. Rain Animation: HTML5 Canvas for heavier, vertical rain.
    -->
    <!-- CONFIRMATION: NO SVG graphics used. NO Mermaid JS used. -->
</head>
<body class="font-sans antialiased leading-relaxed selection:bg-grain-gold selection:text-white">

    <!-- Background Animation -->
    <canvas id="heavyRainCanvas"></canvas>

    <!-- Navigation -->
    <nav class="sticky top-0 z-50 bg-rice-paper/95 backdrop-blur-md border-b border-grain-gold/20 shadow-sm transition-all duration-300">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between h-20 items-center">
                <div class="flex-shrink-0 flex items-center gap-3">
                    <span class="text-3xl filter drop-shadow-sm animate-pulse">🌾</span>
                    <div class="flex flex-col">
                        <span class="text-2xl font-serif font-bold text-rain-storm tracking-wide">Cốc Vũ</span>
                        <span class="text-xs font-sans text-grain-gold uppercase tracking-widest font-bold">Mưa Sinh Trăm Hạt</span>
                    </div>
                </div>
                <div class="hidden md:flex space-x-10">
                    <button onclick="scrollToSection('y-nghia')" class="text-soil-brown hover:text-grain-gold transition font-medium tracking-wide text-sm uppercase">Ý Nghĩa</button>
                    <button onclick="scrollToSection('tam-hau')" class="text-soil-brown hover:text-grain-gold transition font-medium tracking-wide text-sm uppercase">Tam Hậu</button>
                    <button onclick="scrollToSection('doi-song')" class="text-soil-brown hover:text-grain-gold transition font-medium tracking-wide text-sm uppercase">Đời Sống</button>
                    <button onclick="scrollToSection('duong-sinh')" class="text-soil-brown hover:text-grain-gold transition font-medium tracking-wide text-sm uppercase">Dưỡng Sinh</button>
                    <button onclick="scrollToSection('chiem-nghiem')" class="text-soil-brown hover:text-grain-gold transition font-medium tracking-wide text-sm uppercase">Chiêm Nghiệm</button>
                </div>
            </div>
        </div>
    </nav>

    <!-- Hero Section -->
    <header class="relative pt-24 pb-20 px-4 text-center z-10 overflow-hidden">
        <div class="max-w-4xl mx-auto">
            <p class="text-grain-gold font-bold tracking-[0.3em] uppercase mb-6 text-sm font-sans">Tiết Khí Thứ 6 • 19-20 Tháng 4</p>
            <h1 class="text-6xl md:text-8xl font-serif font-bold text-deep-water mb-6 leading-tight relative inline-block">
                Cốc Vũ
                <span class="absolute -top-4 -right-12 text-4xl animate-bounce">🌧️</span>
            </h1>
            <h2 class="text-3xl md:text-5xl font-script text-peony-red mb-10 font-bold transform -rotate-1">
                Sự Trưởng Thành Của Vạn Vật
            </h2>
            <div class="w-24 h-1 bg-grain-gold mx-auto mb-10 rounded-full shadow-lg"></div>
            <p class="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-loose font-light">
                "Những cơn mưa rào cuối xuân dày hạt và ấm áp, thấm sâu vào lòng đất mẹ. Hạt giống nảy mầm, lúa chiêm trổ đòng, hứa hẹn mùa màng no đủ."
            </p>
            <div class="mt-14">
                <button onclick="scrollToSection('y-nghia')" class="group relative inline-flex items-center justify-center px-10 py-3 overflow-hidden font-serif italic tracking-wide text-white transition duration-300 ease-out border-2 border-rain-storm rounded-full shadow-md bg-rain-storm">
                    <span class="absolute inset-0 flex items-center justify-center w-full h-full text-white duration-300 -translate-x-full bg-grain-gold group-hover:translate-x-0 ease">
                        <span class="text-xl text-soil-brown">🌱</span>
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
            <h3 class="text-4xl font-serif font-bold text-deep-water mb-4 inline-block relative">
                Dòng Sữa Mẹ Của Đất Đai
                <span class="absolute -bottom-2 left-0 w-full h-1 bg-grain-gold"></span>
            </h3>
            <p class="text-gray-600 max-w-2xl mx-auto mt-6 text-lg leading-relaxed">
                Mặt Trời kinh độ 30°. "Vũ sinh bách cốc" - Mưa nuôi dưỡng trăm loại ngũ cốc. Đây là giai đoạn chuyển tiếp quan trọng từ Xuân sang Hạ.
            </p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <!-- Charts Column -->
            <div class="space-y-10">
                <div class="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
                    <h4 class="text-xl font-serif font-bold text-rain-storm mb-2 text-center">Vị Trí Thiên Văn (30°)</h4>
                    <div class="chart-container">
                        <canvas id="solarChart"></canvas>
                    </div>
                </div>
                
                <div class="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                    <h4 class="text-xl font-serif font-bold text-peony-red mb-2 text-center">Sự Chuyển Giao Mùa</h4>
                    <div class="chart-container" style="height: 250px;">
                        <canvas id="climateLine"></canvas>
                    </div>
                    <p class="text-center text-sm text-gray-400 mt-4 italic">Nhiệt độ & Độ ẩm tăng mạnh.</p>
                </div>
            </div>

            <!-- Content Explanation -->
            <div class="space-y-8 text-lg text-gray-600 leading-relaxed font-light">
                <div class="p-6 bg-white rounded-xl border-l-4 border-grain-gold shadow-sm">
                    <strong class="text-deep-water font-serif text-xl block mb-2">Giải Nghĩa Tên Gọi</strong>
                    <p>
                        "Cốc" là ngũ cốc, "Vũ" là mưa. Không còn là mưa bụi lất phất, mưa Cốc Vũ nặng hạt, thực tế và mang tính nuôi dưỡng sâu sắc cho sự sinh trưởng.
                    </p>
                </div>
                <div>
                    <strong class="text-deep-water font-serif text-xl block mb-2">Đặc Điểm Khí Hậu</strong>
                    <p>
                        Nhiệt độ tăng nhanh, không khí ấm áp. Độ ẩm cao tạo điều kiện thuận lợi cho cây trồng nhưng cũng dễ sinh sâu bệnh và "thấp tà".
                    </p>
                </div>
            </div>
        </div>
    </section>

    <!-- Section 2: Tam Hậu (Nature) -->
    <section id="tam-hau" class="py-24 bg-white relative z-10">
        <div class="max-w-6xl mx-auto px-4">
            <h3 class="text-3xl font-serif font-bold text-rain-storm mb-12 text-center">Tam Hậu: Ba Tín Hiệu Cuối Xuân</h3>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                <!-- Card 1 -->
                <div class="card-interaction bg-rice-paper p-8 rounded-2xl cursor-default group text-center">
                    <div class="w-20 h-20 mx-auto rounded-full bg-deep-water/10 flex items-center justify-center text-4xl mb-6 group-hover:scale-110 transition">🌿</div>
                    <h5 class="font-bold text-xl text-soil-brown mb-3 font-serif">1. Bèo Tấm Sinh Sôi</h5>
                    <p class="text-gray-600 font-light">Trên mặt nước ao hồ, bèo tấm bắt đầu phát triển mạnh mẽ do nhiệt độ nước ấm lên.</p>
                </div>

                <!-- Card 2 -->
                <div class="card-interaction bg-rice-paper p-8 rounded-2xl cursor-default group text-center">
                    <div class="w-20 h-20 mx-auto rounded-full bg-peony-red/10 flex items-center justify-center text-4xl mb-6 group-hover:scale-110 transition">🕊️</div>
                    <h5 class="font-bold text-xl text-soil-brown mb-3 font-serif">2. Chim Quyên Kêu</h5>
                    <p class="text-gray-600 font-light">Tiếng chim Đỗ Quyên (Cuốc) kêu khắc khoải, nhắc nhở người nông dân: "Cốc cốc cốc vũ" (Gieo hạt đi thôi).</p>
                </div>

                <!-- Card 3 -->
                <div class="card-interaction bg-rice-paper p-8 rounded-2xl cursor-default group text-center">
                    <div class="w-20 h-20 mx-auto rounded-full bg-grain-gold/20 flex items-center justify-center text-4xl mb-6 group-hover:scale-110 transition">🐦</div>
                    <h5 class="font-bold text-xl text-soil-brown mb-3 font-serif">3. Đeo Thắng Giáng</h5>
                    <p class="text-gray-600 font-light">Chim đầu rìu xuất hiện trên những cành dâu tằm, báo hiệu mùa tơ tằm đã đến.</p>
                </div>
            </div>
        </div>
    </section>

    <!-- Section 3: Đời Sống (Tabs) -->
    <section id="doi-song" class="py-24 px-4 bg-rice-paper relative z-10">
        <div class="max-w-6xl mx-auto">
            <div class="mb-12 text-center">
                <h3 class="text-4xl font-serif font-bold text-rain-storm mb-4">Mùa Vụ & Thưởng Ngoạn</h3>
                <p class="text-gray-600 italic">"Cốc Vũ trước và sau, trồng dưa trồng đậu"</p>
            </div>

            <!-- Custom Tabs -->
            <div class="flex justify-center mb-10 space-x-4">
                <button onclick="switchTab('nong-nghiep')" id="btn-nong-nghiep" class="active-tab px-8 py-3 rounded-full border border-rain-storm font-bold transition duration-300 font-serif tracking-wide shadow-sm">Nông Nghiệp</button>
                <button onclick="switchTab('phong-tuc')" id="btn-phong-tuc" class="px-8 py-3 rounded-full border border-rain-storm text-rain-storm font-bold hover:bg-rain-storm hover:text-white transition duration-300 font-serif tracking-wide shadow-sm">Phong Tục</button>
            </div>

            <!-- Content Area -->
            <div class="bg-white p-8 md:p-12 rounded-3xl border border-gray-100 min-h-[400px] flex items-center shadow-sm relative overflow-hidden">
                <div class="absolute top-0 right-0 w-32 h-32 bg-peony-red/5 rounded-bl-full pointer-events-none"></div>

                <!-- Nong Nghiep Content -->
                <div id="content-nong-nghiep" class="grid grid-cols-1 md:grid-cols-2 gap-10 w-full animate-fade-in">
                    <div class="flex flex-col justify-center">
                        <h4 class="text-3xl font-serif font-bold text-grain-gold mb-6">Thời Điểm Vàng</h4>
                        <p class="text-gray-700 leading-relaxed mb-6">
                            Mưa Cốc Vũ quyết định sự thành bại của vụ mùa. Nông dân bận rộn gieo trồng và chăm sóc.
                        </p>
                        <ul class="space-y-4 text-gray-600 font-light">
                            <li class="flex items-start gap-3">
                                <span class="text-rain-storm font-bold">🌾</span>
                                <span>Gieo trồng các loại cây vụ hè thu (dưa, đậu, bông).</span>
                            </li>
                            <li class="flex items-start gap-3">
                                <span class="text-rain-storm font-bold">💧</span>
                                <span>Chăm sóc lúa chiêm đang thì con gái, cần nhiều nước.</span>
                            </li>
                            <li class="flex items-start gap-3">
                                <span class="text-rain-storm font-bold">🐛</span>
                                <span>Diệt trừ sâu bệnh sinh sôi do độ ẩm cao.</span>
                            </li>
                        </ul>
                    </div>
                    <div class="flex items-center justify-center bg-rice-paper rounded-2xl p-6 border border-dashed border-gray-300">
                        <div class="text-center">
                            <div class="text-9xl mb-4 opacity-80 animate-pulse">🚜</div>
                            <p class="font-script text-2xl text-deep-water">Vụ mùa hối hả</p>
                        </div>
                    </div>
                </div>

                <!-- Phong Tuc Content -->
                <div id="content-phong-tuc" class="hidden grid-cols-1 md:grid-cols-2 gap-10 w-full animate-fade-in">
                    <!-- Card 1 -->
                    <div class="bg-rice-paper p-8 rounded-2xl border-l-4 border-rain-storm hover:bg-gray-50 transition group">
                        <div class="text-5xl mb-4 group-hover:scale-110 transition duration-300">🍵</div>
                        <h4 class="text-2xl font-serif font-bold text-deep-water mb-3">Hái Trà Cốc Vũ</h4>
                        <p class="text-gray-600 leading-relaxed font-light">
                            "Vũ Tiền Trà" - trà hái vào tiết này lá mập mạp, giàu dưỡng chất, hương nồng nàn, giúp thanh nhiệt sáng mắt.
                        </p>
                    </div>
                    <!-- Card 2 -->
                    <div class="bg-rice-paper p-8 rounded-2xl border-l-4 border-peony-red hover:bg-gray-50 transition group">
                        <div class="text-5xl mb-4 group-hover:scale-110 transition duration-300">🌺</div>
                        <h4 class="text-2xl font-serif font-bold text-deep-water mb-3">Ngắm Hoa Mẫu Đơn</h4>
                        <p class="text-gray-600 leading-relaxed font-light">
                            "Tiết Hoa Mẫu Đơn". Loài hoa vương giả nở rộ đẹp nhất, tượng trưng cho sự phú quý, thịnh vượng.
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
                    <span class="text-peony-red font-bold tracking-widest uppercase text-sm">Trừ Thấp • Kiện Tỳ</span>
                    <h3 class="text-4xl font-serif font-bold text-deep-water mt-2 mb-6">Tránh Gió Lạnh Cuối Mùa</h3>
                    <p class="text-gray-600 text-lg leading-relaxed mb-6">
                        Độ ẩm cao sinh "Thấp tà". Cần ăn uống để loại bỏ độ ẩm, bảo vệ Tỳ vị và đề phòng gió lạnh.
                    </p>
                    <div class="bg-white p-6 rounded-xl border-l-4 border-peony-red shadow-sm">
                        <h4 class="font-bold text-lg text-peony-red mb-2 font-serif">Nguyên Tắc Ẩm Thực</h4>
                        <p class="text-gray-600 mb-2"><strong>Ưu Tiên:</strong> Vị ngọt, đắng để kiện tỳ, trừ thấp (Hương Xuân, Đậu đỏ).</p>
                        <p class="text-gray-600"><strong>Hạn Chế:</strong> Đồ sống lạnh (Kem, dưa hấu) gây hại dương khí.</p>
                    </div>
                </div>

                <div class="space-y-4 font-sans text-gray-700">
                    <div class="flex items-center gap-4 p-3 bg-white rounded-lg shadow-sm">
                        <div class="w-10 h-10 rounded-full bg-rain-storm/10 flex items-center justify-center text-xl">🌬️</div>
                        <div>
                            <strong>Tránh Gió:</strong> Đề phòng gió lạnh buổi sớm và đêm muộn dù trời đã ấm.
                        </div>
                    </div>
                    <div class="flex items-center gap-4 p-3 bg-white rounded-lg shadow-sm">
                        <div class="w-10 h-10 rounded-full bg-rain-storm/10 flex items-center justify-center text-xl">🏃</div>
                        <div>
                            <strong>Vận Động:</strong> Ra mồ hôi để đẩy "thấp khí", nhưng không quá sức.
                        </div>
                    </div>
                </div>
            </div>

            <!-- Right: Interactive Food Filter -->
            <div class="lg:col-span-7">
                <div class="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden flex flex-col h-full">
                    <div class="bg-deep-water p-8 text-white">
                        <h4 class="text-2xl font-serif font-bold flex items-center gap-3">
                            <span>🥗</span> Thực Đơn Trừ Thấp
                        </h4>
                        <p class="opacity-90 mt-2 font-light text-sm">Chọn thực phẩm giúp kiện Tỳ và loại bỏ độ ẩm.</p>
                    </div>

                    <!-- Filters -->
                    <div class="p-6 border-b border-gray-100 flex gap-3 overflow-x-auto no-scrollbar">
                        <button onclick="filterFood('all')" class="food-btn active px-5 py-2 rounded-full text-sm font-bold bg-gray-100 text-gray-600 hover:bg-gray-200 transition whitespace-nowrap" data-filter="all">Tất Cả</button>
                        <button onclick="filterFood('good')" class="food-btn px-5 py-2 rounded-full text-sm font-bold bg-gray-100 text-gray-600 hover:bg-gray-200 transition whitespace-nowrap" data-filter="good">Nên Dùng (Trừ Thấp/Kiện Tỳ)</button>
                        <button onclick="filterFood('bad')" class="food-btn px-5 py-2 rounded-full text-sm font-bold bg-gray-100 text-gray-600 hover:bg-gray-200 transition whitespace-nowrap" data-filter="bad">Hạn Chế (Lạnh/Sống)</button>
                    </div>

                    <!-- Grid -->
                    <div id="food-grid" class="p-6 grid grid-cols-2 sm:grid-cols-3 gap-4 overflow-y-auto max-h-[500px] bg-rice-paper">
                        <!-- JS populated -->
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Section 5: Chiêm Nghiệm (Philosophy) -->
    <section id="chiem-nghiem" class="py-32 bg-deep-water text-white text-center px-4 relative overflow-hidden">
        <!-- Abstract Background Shape -->
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-grain-gold/20 rounded-full blur-[100px] pointer-events-none"></div>

        <div class="max-w-3xl mx-auto relative z-10">
            <span class="text-6xl text-gray-500 font-serif opacity-50 block mb-6">❝</span>
            
            <h3 class="text-4xl md:text-5xl font-serif font-bold mb-10 text-white leading-tight">
                Sự Trưởng Thành:<br>Thực Tế & Sâu Sắc
            </h3>
            
            <p class="text-xl text-gray-300 leading-loose mb-12 font-sans font-light">
                Cốc Vũ khép lại mùa xuân mộng mơ. Những cơn mưa rào thực tế giúp ta trưởng thành, bản lĩnh hơn. Đừng ngại những cơn mưa, bởi nhờ chúng, hạt giống tâm hồn mới vươn mình mạnh mẽ, hứa hẹn một mùa hè rực rỡ.
            </p>

            <div class="inline-block border border-gray-600 rounded-2xl p-10 bg-white/5 backdrop-blur-sm hover:bg-white/10 transition duration-500 cursor-default group">
                <p class="font-bold uppercase tracking-[0.2em] text-sm text-grain-gold mb-6 font-sans group-hover:text-white transition">Lời Chúc Cốc Vũ</p>
                <div class="text-3xl md:text-4xl font-script text-peony-red leading-relaxed group-hover:scale-105 transition duration-500">
                    "Thân tâm an lạc,<br>Vạn sự hanh thông."
                </div>
            </div>
            
            <span class="text-6xl text-gray-500 font-serif opacity-50 block mt-12">❞</span>
        </div>
    </section>

    <!-- Footer -->
    <footer class="bg-[#152a45] text-gray-500 py-12 text-center text-sm font-sans border-t border-gray-800">
        <p class="italic tracking-wide mb-3 text-gray-400">Biên soạn dựa trên nguyên lý 24 Tiết khí & Văn hóa Phương Đông</p>
        <p class="text-gray-600">© Bản quyền thuộc về <span class="font-script text-xl text-grain-gold ml-1">Tịch Phong Thiên Sơn - 夕风天山</span></p>
    </footer>

    <!-- Javascript Logic -->
    <script>
        // --- Data ---
        const foodData = [
            { name: "Hương Xuân", type: "good", icon: "🌿", desc: "Tăng dương khí, khai vị" },
            { name: "Đậu Đỏ", type: "good", icon: "🫘", desc: "Lợi tiểu, trừ thấp hiệu quả" },
            { name: "Ý Dĩ", type: "good", icon: "🌾", desc: "Kiện tỳ, trừ thấp nhiệt" },
            { name: "Bí Đao", type: "good", icon: "🍈", desc: "Thanh nhiệt, lợi thủy" },
            { name: "Củ Mài", type: "good", icon: "🍠", desc: "Bổ tỳ vị, dưỡng khí" },
            { name: "Cháo Đậu", type: "good", icon: "🥣", desc: "Dễ tiêu hóa, bổ dưỡng" },
            { name: "Dưa Hấu", type: "bad", icon: "🍉", desc: "Quá lạnh, hại tỳ vị" },
            { name: "Kem Lạnh", type: "bad", icon: "🍦", desc: "Gây ngưng trệ khí huyết" },
            { name: "Đồ Chua", type: "bad", icon: "🍋", desc: "Khắc tỳ, hạn chế dùng" }
        ];

        // --- Tab Logic ---
        function switchTab(tab) {
            document.getElementById('content-nong-nghiep').classList.add('hidden');
            document.getElementById('content-nong-nghiep').classList.remove('grid');
            document.getElementById('content-phong-tuc').classList.add('hidden');
            document.getElementById('content-phong-tuc').classList.remove('grid');

            document.getElementById('btn-nong-nghiep').classList.remove('active-tab', 'text-white');
            document.getElementById('btn-nong-nghiep').classList.add('text-rain-storm');
            document.getElementById('btn-phong-tuc').classList.remove('active-tab', 'text-white');
            document.getElementById('btn-phong-tuc').classList.add('text-rain-storm');

            const content = document.getElementById(\`content-\${tab}\`);
            content.classList.remove('hidden');
            content.classList.add('grid');
            
            const btn = document.getElementById(\`btn-\${tab}\`);
            btn.classList.add('active-tab');
            btn.classList.remove('text-rain-storm');
        }

        // --- Food Filter Logic ---
        function filterFood(filter) {
            const grid = document.getElementById('food-grid');
            grid.innerHTML = ''; 

            document.querySelectorAll('.food-btn').forEach(btn => {
                if(btn.dataset.filter === filter) {
                    btn.classList.add('bg-deep-water', 'text-white');
                    btn.classList.remove('bg-gray-100', 'text-gray-600');
                } else {
                    btn.classList.remove('bg-deep-water', 'text-white');
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

        // --- Canvas Animation (Heavy Rain) ---
        function initRainCanvas() {
            const canvas = document.getElementById('heavyRainCanvas');
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
                    this.length = Math.random() * 20 + 15; // Longer for heavy rain
                    this.speed = Math.random() * 5 + 5; // Faster
                    this.opacity = Math.random() * 0.3 + 0.1;
                    this.color = \`rgba(31, 64, 104, \${this.opacity})\`;
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
                    ctx.lineWidth = 1.5; // Thicker
                    ctx.lineCap = 'round';
                    ctx.stroke();
                }
            }

            for(let i=0; i<150; i++) drops.push(new Drop()); // More drops

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

            // Chart 1: Solar Term 30 deg
            const ctx1 = document.getElementById('solarChart').getContext('2d');
            new Chart(ctx1, {
                type: 'doughnut',
                data: {
                    labels: ['Cốc Vũ', 'Lập Hạ', 'Tiểu Mãn', 'Mùa Khác'],
                    datasets: [{
                        data: [15, 15, 15, 315],
                        backgroundColor: ['#2C5F2D', '#B22222', '#B22222', '#FFF8E7'],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    rotation: -60, 
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
                        ctx.fillStyle = "#2C5F2D";
                        var text = "30°",
                            textX = Math.round((width - ctx.measureText(text).width) / 2),
                            textY = height / 2;
                        ctx.fillText(text, textX, textY);
                        ctx.save();
                    }
                }]
            });

            // Chart 2: Climate Line
            const ctx2 = document.getElementById('climateLine').getContext('2d');
            new Chart(ctx2, {
                type: 'line',
                data: {
                    labels: ['Thanh Minh', 'Cốc Vũ (Đầu)', 'Cốc Vũ (Giữa)', 'Lập Hạ'],
                    datasets: [
                        {
                            label: 'Nhiệt Độ',
                            data: [20, 25, 28, 32],
                            borderColor: '#B22222',
                            tension: 0.4,
                            yAxisID: 'y'
                        },
                        {
                            label: 'Độ Ẩm',
                            data: [60, 75, 85, 80],
                            borderColor: '#1F4068',
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
                            grid: { display: false }
                        },
                        y1: {
                            position: 'right',
                            grid: { display: false }
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
