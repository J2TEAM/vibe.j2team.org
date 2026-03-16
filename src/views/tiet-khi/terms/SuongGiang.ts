export const SuongGiang = `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sương Giáng: Khúc Vĩ Thanh Của Mùa Thu</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    
    <!-- Fonts: Philosopher (Tiêu đề - Hùng vĩ), Be Vietnam Pro (Nội dung - Rõ ràng), Dancing Script (Thơ - Bi tráng) -->
    <link href="https://fonts.googleapis.com/css2?family=Philosopher:ital,wght@0,400;0,700;1,400;1,700&family=Be+Vietnam+Pro:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400&family=Dancing+Script:wght@400;700&display=swap" rel="stylesheet">
    
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        'frost-white': '#F0F8FF',   // Trắng sương giá (Hàn khí ngưng tụ)
                        'maple-red': '#9D0208',     // Đỏ lá phong (Vẻ đẹp cuối thu)
                        'cold-gray': '#6C757D',     // Xám lạnh (Tiêu điều)
                        'deep-soil': '#370617',     // Nâu đất thẫm (Về cội)
                        'persimmon-orange': '#E85D04', // Cam hồng chín (Ngọt ngào)
                        'wolf-gray': '#495057'      // Xám lông sói (Sói tế thú)
                    },
                    fontFamily: {
                        serif: ['"Philosopher"', 'serif'],
                        sans: ['"Be Vietnam Pro"', 'sans-serif'],
                        script: ['"Dancing Script"', 'cursive'],
                    },
                    animation: {
                        'fall-slow': 'fallSlow 6s linear infinite',
                    },
                    keyframes: {
                        fallSlow: {
                            '0%': { transform: 'translateY(-10px) rotate(0deg)', opacity: '0' },
                            '10%': { opacity: '1' },
                            '100%': { transform: 'translateY(100vh) rotate(360deg)', opacity: '0' },
                        }
                    }
                }
            }
        }
    </script>
    <style>
        body {
            background-color: #F0F8FF;
            color: #370617;
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
        /* Frost/Maple Leaf Canvas Layer */
        #frostLeafCanvas {
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
            background: rgba(255, 255, 255, 0.7);
            backdrop-filter: blur(5px);
        }
        .card-interaction:hover {
            transform: translateY(-5px);
            border-color: #9D0208;
            box-shadow: 0 10px 30px -10px rgba(157, 2, 8, 0.2);
        }
        .active-tab {
            background-color: #9D0208;
            color: white;
            border-color: #9D0208;
        }
        .no-scrollbar::-webkit-scrollbar {
            display: none;
        }
        .no-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
    </style>
    <!-- Chosen Palette: "Crimson Frost" - Maple Red, Frost White, Cold Gray -->
    <!-- Application Structure Plan:
        1. Hero: Title with "Frost & Red Leaves" visual cue (Canvas animation).
        2. Thien Tuong (Cosmic): Chart showing 210° & The freezing point approach.
        3. Tam Hau (Nature): 3 Micro-seasons (Wolves sacrifice, Flora withers, Insects hibernation).
        4. Doi Song (Life): Tabs for Agriculture ("Kill Weeds") & Customs ("Eating Persimmon", "Viewing Maples").
        5. Duong Sinh (Health): "Nourish Late Autumn" - Food Filter (Persimmon/Beef vs Cold/Raw).
        6. Chiem Nghiem (Philosophy): Letting Go & The Cycle (Buong Bo).
        7. Footer: Copyright Tich Phong Thien Son.
    -->
    <!-- Visualization & Content Choices:
        1. Solar Gauge: Chart.js Doughnut (210°).
        2. State Change: Bar Chart showing transition from Dew (Liquid) to Frost (Solid).
        3. Food Filter: Logic for Warming/Nourishing foods (Chestnut, Beef).
        4. Frost Leaf Animation: HTML5 Canvas for falling red leaves và frost particles.
    -->
    <!-- CONFIRMATION: NO SVG graphics used. NO Mermaid JS used. -->
</head>
<body class="font-sans antialiased leading-relaxed selection:bg-maple-red selection:text-white">

    <!-- Background Animation -->
    <canvas id="frostLeafCanvas"></canvas>

    <!-- Navigation -->
    <nav class="sticky top-0 z-50 bg-frost-white/90 backdrop-blur-md border-b border-cold-gray/20 shadow-sm transition-all duration-300">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between h-20 items-center">
                <div class="flex-shrink-0 flex items-center gap-3">
                    <span class="text-3xl filter drop-shadow-sm animate-pulse">🍁</span>
                    <div class="flex flex-col">
                        <span class="text-2xl font-serif font-bold text-maple-red tracking-wide">Sương Giáng</span>
                        <span class="text-xs font-sans text-cold-gray uppercase tracking-widest font-bold">Khúc Vĩ Thanh Mùa Thu</span>
                    </div>
                </div>
                <div class="hidden md:flex space-x-10">
                    <button onclick="scrollToSection('y-nghia')" class="text-deep-soil hover:text-maple-red transition font-medium tracking-wide text-sm uppercase">Ý Nghĩa</button>
                    <button onclick="scrollToSection('tam-hau')" class="text-deep-soil hover:text-maple-red transition font-medium tracking-wide text-sm uppercase">Tam Hậu</button>
                    <button onclick="scrollToSection('doi-song')" class="text-deep-soil hover:text-maple-red transition font-medium tracking-wide text-sm uppercase">Đời Sống</button>
                    <button onclick="scrollToSection('duong-sinh')" class="text-deep-soil hover:text-maple-red transition font-medium tracking-wide text-sm uppercase">Dưỡng Sinh</button>
                    <button onclick="scrollToSection('chiem-nghiem')" class="text-deep-soil hover:text-maple-red transition font-medium tracking-wide text-sm uppercase">Chiêm Nghiệm</button>
                </div>
            </div>
        </div>
    </nav>

    <!-- Hero Section -->
    <header class="relative pt-24 pb-20 px-4 text-center z-10 overflow-hidden">
        <div class="max-w-4xl mx-auto">
            <p class="text-maple-red font-bold tracking-[0.3em] uppercase mb-6 text-sm font-sans">Tiết Khí Thứ 18 • 23-24 Tháng 10</p>
            <h1 class="text-6xl md:text-8xl font-serif font-bold text-deep-soil mb-6 leading-tight relative inline-block">
                Sương Giáng
                <span class="absolute -top-4 -right-12 text-4xl animate-bounce text-frost-white drop-shadow-md">❄️</span>
            </h1>
            <h2 class="text-3xl md:text-5xl font-script text-persimmon-orange mb-10 font-bold transform -rotate-1">
                Sương Giá Phủ Trắng
            </h2>
            <div class="w-24 h-1 bg-maple-red mx-auto mb-10 rounded-full shadow-sm"></div>
            <p class="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-loose font-light">
                "Khúc vĩ thanh của mùa thu. Hơi lạnh ngưng kết thành tinh thể trắng xóa. Cây cối trút bỏ xiêm y, trở về với dáng vẻ chân thật nhất để đón đông."
            </p>
            <div class="mt-14">
                <button onclick="scrollToSection('y-nghia')" class="group relative inline-flex items-center justify-center px-10 py-3 overflow-hidden font-serif italic tracking-wide text-white transition duration-300 ease-out border-2 border-maple-red rounded-full shadow-md bg-maple-red">
                    <span class="absolute inset-0 flex items-center justify-center w-full h-full text-white duration-300 -translate-x-full bg-deep-soil group-hover:translate-x-0 ease">
                        <span class="text-xl">🍂</span>
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
            <h3 class="text-4xl font-serif font-bold text-maple-red mb-4 inline-block relative">
                Sự Ngưng Kết Của Khí Hàn
                <span class="absolute -bottom-2 left-0 w-full h-1 bg-cold-gray/50"></span>
            </h3>
            <p class="text-gray-600 max-w-2xl mx-auto mt-6 text-lg leading-relaxed">
                Mặt Trời kinh độ 210°. "Sương" là sương giá (rắn), "Giáng" là rơi xuống. Khác với sương móc (lỏng), sương giá báo hiệu cái lạnh thấu xương.
            </p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <!-- Charts Column -->
            <div class="space-y-10">
                <div class="bg-white p-8 rounded-2xl shadow-sm border border-cold-gray/20 relative overflow-hidden">
                    <h4 class="text-xl font-serif font-bold text-deep-soil mb-2 text-center">Vị Trí Thiên Văn (210°)</h4>
                    <div class="chart-container">
                        <canvas id="solarChart"></canvas>
                    </div>
                </div>
                
                <div class="bg-white p-8 rounded-2xl shadow-sm border border-cold-gray/20">
                    <h4 class="text-xl font-serif font-bold text-maple-red mb-2 text-center">Trạng Thái Nước: Lỏng sang Rắn</h4>
                    <div class="chart-container" style="height: 250px;">
                        <canvas id="waterStateChart"></canvas>
                    </div>
                    <p class="text-center text-sm text-gray-500 mt-4 italic">Bạch Lộ (Lỏng) -> Sương Giáng (Rắn).</p>
                </div>
            </div>

            <!-- Content Explanation -->
            <div class="space-y-8 text-lg text-gray-600 leading-relaxed font-light">
                <div class="p-6 bg-white rounded-xl border-l-4 border-maple-red shadow-sm">
                    <strong class="text-deep-soil font-serif text-xl block mb-2">Chuyển Tiếp Thu - Đông</strong>
                    <p>
                        Giai đoạn chuyển tiếp rõ rệt nhất. Dương khí tàn lui gần như hoàn toàn, Âm khí cực thịnh. Đây là lúc thiên nhiên đi vào trạng thái nghỉ ngơi sâu.
                    </p>
                </div>
                <div>
                    <strong class="text-deep-soil font-serif text-xl block mb-2">Vẻ Đẹp Bi Tráng</strong>
                    <p>
                        Cảnh sắc tiêu điều với lá vàng rụng, cây cỏ héo úa. Nhưng chính trong sự tàn phai đó lại toát lên vẻ đẹp bi tráng và kiên cường của sự sống.
                    </p>
                </div>
            </div>
        </div>
    </section>

    <!-- Section 2: Tam Hậu (Nature) -->
    <section id="tam-hau" class="py-24 bg-white relative z-10">
        <div class="max-w-6xl mx-auto px-4">
            <h3 class="text-3xl font-serif font-bold text-wolf-gray mb-12 text-center">Tam Hậu: Ba Tín Hiệu Kết Thúc</h3>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                <!-- Card 1 -->
                <div class="card-interaction p-8 rounded-2xl cursor-default group text-center">
                    <div class="w-20 h-20 mx-auto rounded-full bg-wolf-gray/20 flex items-center justify-center text-4xl mb-6 group-hover:scale-110 transition">🐺</div>
                    <h5 class="font-bold text-xl text-deep-soil mb-3 font-serif">1. Sài Nãi Tế Thú</h5>
                    <p class="text-gray-600 font-light">Loài sói săn bắt thú nhỏ để tích trữ lương thực qua đông, bày la liệt như đang cúng tế trời đất.</p>
                </div>

                <!-- Card 2 -->
                <div class="card-interaction p-8 rounded-2xl cursor-default group text-center">
                    <div class="w-20 h-20 mx-auto rounded-full bg-maple-red/20 flex items-center justify-center text-4xl mb-6 group-hover:scale-110 transition">🍂</div>
                    <h5 class="font-bold text-xl text-deep-soil mb-3 font-serif">2. Thảo Mộc Hoàng Lạc</h5>
                    <p class="text-gray-600 font-light">Cây cỏ úa vàng và rụng lá hàng loạt. Cảnh sắc tiêu điều nhưng mang vẻ đẹp của sự buông bỏ.</p>
                </div>

                <!-- Card 3 -->
                <div class="card-interaction p-8 rounded-2xl cursor-default group text-center">
                    <div class="w-20 h-20 mx-auto rounded-full bg-frost-white border border-cold-gray flex items-center justify-center text-4xl mb-6 group-hover:scale-110 transition">🦗</div>
                    <h5 class="font-bold text-xl text-deep-soil mb-3 font-serif">3. Trập Trùng Hàm Phủ</h5>
                    <p class="text-gray-600 font-light">Côn trùng chui sâu vào hang, đóng chặt cửa ngủ đông, "cúi đầu im lặng" chờ đợi mùa xuân.</p>
                </div>
            </div>
        </div>
    </section>

    <!-- Section 3: Đời Sống (Tabs) -->
    <section id="doi-song" class="py-24 px-4 bg-frost-white relative z-10">
        <div class="max-w-6xl mx-auto">
            <div class="mb-12 text-center">
                <h3 class="text-4xl font-serif font-bold text-maple-red mb-4">Thu Hoạch & Thưởng Ngoạn</h3>
                <p class="text-gray-600 italic">"Sương Giáng giết cỏ, nhưng làm ngọt quả hồng"</p>
            </div>

            <!-- Custom Tabs -->
            <div class="flex justify-center mb-10 space-x-4">
                <button onclick="switchTab('phong-tuc')" id="btn-phong-tuc" class="active-tab px-8 py-3 rounded-full border border-maple-red font-bold transition duration-300 font-serif tracking-wide shadow-sm">Phong Tục</button>
                <button onclick="switchTab('nong-nghiep')" id="btn-nong-nghiep" class="px-8 py-3 rounded-full border border-maple-red text-maple-red font-bold hover:bg-maple-red hover:text-white transition duration-300 font-serif tracking-wide shadow-sm">Nông Nghiệp</button>
            </div>

            <!-- Content Area -->
            <div class="bg-white p-8 md:p-12 rounded-3xl border border-gray-100 min-h-[400px] flex items-center shadow-sm relative overflow-hidden">
                <div class="absolute top-0 right-0 w-32 h-32 bg-persimmon-orange/10 rounded-bl-full pointer-events-none"></div>

                <!-- Phong Tuc Content -->
                <div id="content-phong-tuc" class="grid grid-cols-1 md:grid-cols-2 gap-10 w-full animate-fade-in">
                    <!-- Card 1 -->
                    <div class="bg-frost-white p-8 rounded-2xl border-l-4 border-persimmon-orange hover:bg-gray-50 transition group">
                        <div class="text-5xl mb-4 group-hover:scale-110 transition duration-300">🍅</div>
                        <h4 class="text-2xl font-serif font-bold text-deep-soil mb-3">Ăn Quả Hồng</h4>
                        <p class="text-gray-600 leading-relaxed font-light">
                            "Sương Giáng ăn hồng, không chảy nước mũi". Quả hồng đỏ mọng giúp giữ ấm, bổ phổi, chống lại cái lạnh.
                        </p>
                    </div>
                    <!-- Card 2 -->
                    <div class="bg-frost-white p-8 rounded-2xl border-l-4 border-maple-red hover:bg-gray-50 transition group">
                        <div class="text-5xl mb-4 group-hover:scale-110 transition duration-300">🍁</div>
                        <h4 class="text-2xl font-serif font-bold text-deep-soil mb-3">Ngắm Lá Đỏ</h4>
                        <p class="text-gray-600 leading-relaxed font-light">
                            Lá phong chuyển màu đỏ rực rỡ nhất trước khi rụng. Thời điểm tuyệt vời để leo núi thưởng ngoạn "Rừng phong thu đã nhuốm màu quan san".
                        </p>
                    </div>
                </div>

                <!-- Nong Nghiep Content -->
                <div id="content-nong-nghiep" class="hidden grid-cols-1 md:grid-cols-2 gap-10 w-full animate-fade-in">
                    <div class="flex flex-col justify-center">
                        <h4 class="text-3xl font-serif font-bold text-cold-gray mb-6">Thu Hoạch Cuối Cùng</h4>
                        <p class="text-gray-600 leading-relaxed mb-6">
                            Sương muối là "sát thủ". Phải thu hoạch triệt để trước khi cây chết.
                        </p>
                        <ul class="space-y-4 text-gray-600 font-light">
                            <li class="flex items-start gap-3">
                                <span class="text-maple-red font-bold">🍠</span>
                                <span><strong>Thu Hoạch:</strong> Khoai lang, lạc, đậu cần thu về kho gấp.</span>
                            </li>
                            <li class="flex items-start gap-3">
                                <span class="text-deep-soil font-bold">🚜</span>
                                <span><strong>Cày Ải:</strong> Cày xới đất để ải qua đông, diệt trừ sâu bệnh.</span>
                            </li>
                        </ul>
                    </div>
                    <div class="flex items-center justify-center bg-frost-white rounded-2xl p-6 border border-dashed border-gray-300">
                        <div class="text-center">
                            <div class="text-9xl mb-4 opacity-80 animate-pulse">❄️</div>
                            <p class="font-script text-2xl text-deep-soil">Sương muối phủ đồng</p>
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
                    <span class="text-persimmon-orange font-bold tracking-widest uppercase text-sm">Bình Bổ • Giữ Ấm</span>
                    <h3 class="text-4xl font-serif font-bold text-deep-soil mt-2 mb-6">Bổ Sương Giáng Hơn Bổ Đông</h3>
                    <p class="text-gray-600 text-lg leading-relaxed mb-6">
                        Thời điểm vàng để củng cố sức khỏe. "Bổ Đông bất như bổ Sương Giáng".
                    </p>
                    <div class="bg-white p-6 rounded-xl border-l-4 border-maple-red shadow-sm">
                        <h4 class="font-bold text-lg text-maple-red mb-2 font-serif">Nguyên Tắc Ẩm Thực</h4>
                        <p class="text-gray-600 mb-2"><strong>Bình Bổ:</strong> Bổ nhẹ nhàng, không quá béo ngậy.</p>
                        <p class="text-gray-600"><strong>Ấm Áp:</strong> Thịt bò, thịt vịt, hạt dẻ để bổ khí huyết.</p>
                    </div>
                </div>

                <div class="space-y-4 font-sans text-gray-700">
                    <div class="flex items-center gap-4 p-3 bg-white rounded-lg shadow-sm">
                        <div class="w-10 h-10 rounded-full bg-cold-gray/20 flex items-center justify-center text-xl">🦵</div>
                        <div>
                            <strong>Bảo Vệ Khớp:</strong> Giữ ấm đầu gối, cổ chân, tránh gió lùa.
                        </div>
                    </div>
                    <div class="flex items-center gap-4 p-3 bg-white rounded-lg shadow-sm">
                        <div class="w-10 h-10 rounded-full bg-cold-gray/20 flex items-center justify-center text-xl">🧴</div>
                        <div>
                            <strong>Dưỡng Da:</strong> Trời khô hanh cực điểm, cần bôi kem dưỡng ẩm.
                        </div>
                    </div>
                </div>
            </div>

            <!-- Right: Interactive Food Filter -->
            <div class="lg:col-span-7">
                <div class="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden flex flex-col h-full">
                    <div class="bg-deep-soil p-8 text-white">
                        <h4 class="text-2xl font-serif font-bold flex items-center gap-3">
                            <span>🌰</span> Thực Đơn Bình Bổ
                        </h4>
                        <p class="opacity-80 mt-2 font-light text-sm">Chọn thực phẩm ấm áp, bổ dưỡng.</p>
                    </div>

                    <!-- Filters -->
                    <div class="p-6 border-b border-gray-100 flex gap-3 overflow-x-auto no-scrollbar">
                        <button onclick="filterFood('all')" class="food-btn active px-5 py-2 rounded-full text-sm font-bold bg-deep-soil text-white hover:bg-gray-800 transition whitespace-nowrap" data-filter="all">Tất Cả</button>
                        <button onclick="filterFood('good')" class="food-btn px-5 py-2 rounded-full text-sm font-bold bg-gray-100 text-gray-600 hover:bg-gray-200 transition whitespace-nowrap" data-filter="good">Nên Dùng (Ấm/Bổ)</button>
                        <button onclick="filterFood('bad')" class="food-btn px-5 py-2 rounded-full text-sm font-bold bg-gray-100 text-gray-600 hover:bg-gray-200 transition whitespace-nowrap" data-filter="bad">Hạn Chế (Lạnh/Béo)</button>
                    </div>

                    <!-- Grid -->
                    <div id="food-grid" class="p-6 grid grid-cols-2 sm:grid-cols-3 gap-4 overflow-y-auto max-h-[500px] bg-frost-white">
                        <!-- JS populated -->
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Section 5: Chiêm Nghiệm (Philosophy) -->
    <section id="chiem-nghiem" class="py-32 bg-maple-red text-white text-center px-4 relative overflow-hidden">
        <!-- Abstract Background Shape -->
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-deep-soil/20 rounded-full blur-[100px] pointer-events-none"></div>

        <div class="max-w-3xl mx-auto relative z-10">
            <span class="text-6xl text-persimmon-orange font-serif opacity-50 block mb-6">❝</span>
            
            <h3 class="text-4xl md:text-5xl font-serif font-bold mb-10 text-white leading-tight">
                Vẻ Đẹp Của Sự<br>Buông Bỏ
            </h3>
            
            <p class="text-xl text-gray-200 leading-loose mb-12 font-sans font-light">
                Nhìn chiếc lá phong đỏ rực lìa cành, ta hiểu sự kết thúc là một khoảnh khắc thăng hoa. Cây cối trút bỏ xiêm y để trở về sự chân thật, dồn nhựa sống vào trong. Con người cũng cần buông bỏ hào quang để nuôi dưỡng nội lực, chờ ngày tái sinh.
            </p>

            <div class="inline-block border border-white/30 rounded-2xl p-10 bg-white/10 backdrop-blur-sm hover:bg-white/20 transition duration-500 cursor-default group">
                <p class="font-bold uppercase tracking-[0.2em] text-sm text-persimmon-orange mb-6 font-sans group-hover:text-white transition">Lời Chúc Sương Giáng</p>
                <div class="text-3xl md:text-4xl font-script text-frost-white leading-relaxed group-hover:scale-105 transition duration-500 shadow-text">
                    "Thân tâm vững chãi,<br>An nhiên tự tại."
                </div>
            </div>
            
            <span class="text-6xl text-persimmon-orange font-serif opacity-50 block mt-12">❞</span>
        </div>
    </section>

    <!-- Footer -->
    <footer class="bg-[#1f0a0e] text-gray-400 py-12 text-center text-sm font-sans border-t border-white/10">
        <p class="italic tracking-wide mb-3 text-gray-500">Biên soạn dựa trên nguyên lý 24 Tiết khí & Văn hóa Phương Đông</p>
        <p class="text-gray-400">© Bản quyền thuộc về <span class="font-script text-xl text-maple-red ml-1">Tịch Phong Thiên Sơn - 夕风天山</span></p>
    </footer>

    <!-- Javascript Logic -->
    <script>
        // --- Data ---
        const foodData = [
            { name: "Quả Hồng", type: "good", icon: "🍅", desc: "Nhuận phế, giữ ấm, chống lạnh" },
            { name: "Hạt Dẻ", type: "good", icon: "🌰", desc: "Bổ thận khí, mạnh gân cốt" },
            { name: "Thịt Bò", type: "good", icon: "🥩", desc: "Bổ khí huyết, làm ấm cơ thể" },
            { name: "Củ Mài", type: "good", icon: "🍠", desc: "Kiện tỳ, bổ phế, ích thận" },
            { name: "Táo Đỏ", type: "good", icon: "🍎", desc: "Dưỡng huyết, an thần" },
            { name: "Thịt Vịt", type: "good", icon: "🦆", desc: "Tư âm, dưỡng vị (hầm gừng)" },
            { name: "Hải Sản Sống", type: "bad", icon: "🍣", desc: "Tính hàn, dễ gây đau bụng" },
            { name: "Đồ Béo", type: "bad", icon: "🥓", desc: "Khó tiêu hóa, gây đầy bụng" },
            { name: "Nước Đá", type: "bad", icon: "🧊", desc: "Tổn thương dương khí" }
        ];

        // --- Tab Logic ---
        function switchTab(tab) {
            document.getElementById('content-phong-tuc').classList.add('hidden');
            document.getElementById('content-phong-tuc').classList.remove('grid');
            document.getElementById('content-nong-nghiep').classList.add('hidden');
            document.getElementById('content-nong-nghiep').classList.remove('grid');

            document.getElementById('btn-phong-tuc').classList.remove('active-tab', 'text-white');
            document.getElementById('btn-phong-tuc').classList.add('text-deep-soil');
            document.getElementById('btn-nong-nghiep').classList.remove('active-tab', 'text-white');
            document.getElementById('btn-nong-nghiep').classList.add('text-deep-soil');

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
                    btn.classList.add('bg-deep-soil', 'text-white');
                    btn.classList.remove('bg-gray-100', 'text-gray-600');
                } else {
                    btn.classList.remove('bg-deep-soil', 'text-white');
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

        // --- Canvas Animation (Frost & Leaves) ---
        function initFrostLeafCanvas() {
            const canvas = document.getElementById('frostLeafCanvas');
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
                    this.y = Math.random() * height - height;
                    this.isLeaf = Math.random() > 0.8; // 20% leaves
                    this.size = this.isLeaf ? Math.random() * 8 + 5 : Math.random() * 2 + 1;
                    this.speedY = Math.random() * 1 + 0.5;
                    this.speedX = Math.random() * 2 - 1;
                    this.angle = Math.random() * 360;
                    this.spin = Math.random() * 2 - 1;
                    this.color = this.isLeaf ? '#9D0208' : '#F0F8FF'; // Red or White
                    this.opacity = this.isLeaf ? 0.8 : 0.5;
                }
                update() {
                    this.y += this.speedY;
                    this.x += Math.sin(this.y * 0.01) + this.speedX * 0.2;
                    if (this.isLeaf) this.angle += this.spin;
                    
                    if (this.y > height) {
                        this.y = -20;
                        this.x = Math.random() * width;
                    }
                }
                draw() {
                    ctx.save();
                    ctx.translate(this.x, this.y);
                    if (this.isLeaf) {
                        ctx.rotate(this.angle * Math.PI / 180);
                        ctx.fillStyle = this.color;
                        ctx.beginPath();
                        ctx.ellipse(0, 0, this.size, this.size/2, 0, 0, Math.PI * 2);
                        ctx.fill();
                    } else {
                        ctx.fillStyle = \`rgba(240, 248, 255, \${this.opacity})\`;
                        ctx.beginPath();
                        ctx.arc(0, 0, this.size, 0, Math.PI * 2);
                        ctx.fill();
                    }
                    ctx.restore();
                }
            }

            for(let i=0; i<60; i++) particles.push(new Particle());

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
            initFrostLeafCanvas();
            filterFood('all');

            // Chart 1: Solar Term 210 deg
            const ctx1 = document.getElementById('solarChart').getContext('2d');
            new Chart(ctx1, {
                type: 'doughnut',
                data: {
                    labels: ['Sương Giáng', 'Lập Đông', 'Tiểu Tuyết', 'Mùa Khác'],
                    datasets: [{
                        data: [15, 15, 15, 315],
                        backgroundColor: ['#9D0208', '#370617', '#370617', '#F0F8FF'],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    rotation: 120, 
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
                        ctx.fillStyle = "#9D0208";
                        var text = "210°",
                            textX = Math.round((width - ctx.measureText(text).width) / 2),
                            textY = height / 2;
                        ctx.fillText(text, textX, textY);
                        ctx.save();
                    }
                }]
            });

            // Chart 2: Water State (Bar)
            const ctx2 = document.getElementById('waterStateChart').getContext('2d');
            new Chart(ctx2, {
                type: 'bar',
                data: {
                    labels: ['Bạch Lộ (Sương Móc)', 'Hàn Lộ (Sương Lạnh)', 'Sương Giáng (Sương Giá)'],
                    datasets: [{
                        label: 'Trạng Thái Nước',
                        data: [30, 60, 90], // Hardness/Coldness increasing
                        backgroundColor: ['#A9D6E5', '#6C757D', '#F0F8FF'],
                        borderRadius: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: { 
                            display: false,
                            max: 100
                        },
                        x: { 
                            grid: { display: false },
                            ticks: { font: { family: "'Be Vietnam Pro'" } }
                        }
                    },
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    if (context.dataIndex === 2) return ' Kết tinh thành băng (Rắn)';
                                    return ' Còn lỏng, nhưng lạnh dần';
                                }
                            }
                        }
                    }
                }
            });
        });
    </script>
</body>
</html>
`
