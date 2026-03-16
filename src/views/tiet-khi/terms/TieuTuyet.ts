export const TieuTuyet = `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tiểu Tuyết: Khúc Dạo Đầu Của Mùa Đông Tĩnh Lặng</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    
    <!-- Fonts: Philosopher (Tiêu đề - Sâu sắc), Be Vietnam Pro (Nội dung - Rõ ràng), Dancing Script (Thơ - Lắng đọng) -->
    <link href="https://fonts.googleapis.com/css2?family=Philosopher:ital,wght@0,400;0,700;1,400;1,700&family=Be+Vietnam+Pro:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400&family=Dancing+Script:wght@400;700&display=swap" rel="stylesheet">
    
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        'cold-gray': '#E5E7EB',     // Xám tuyết (Hàn khí nhẹ)
                        'deep-slate': '#334155',    // Chàm sâu (Tĩnh lặng/Âm khí)
                        'hidden-ember': '#D97706',  // Cam hổ phách (Dương khí ẩn tàng)
                        'winter-sky': '#F3F4F6',    // Bầu trời mùa đông
                        'dried-meat': '#9F1239',    // Màu thịt gác bếp (Phong tục)
                        'dark-ink': '#0F172A'       // Đen mực (Màn đêm dài)
                    },
                    fontFamily: {
                        serif: ['"Philosopher"', 'serif'],
                        sans: ['"Be Vietnam Pro"', 'sans-serif'],
                        script: ['"Dancing Script"', 'cursive'],
                    },
                    animation: {
                        'fade-up': 'fadeUp 2s ease-out',
                    },
                    keyframes: {
                        fadeUp: {
                            '0%': { opacity: '0', transform: 'translateY(20px)' },
                            '100%': { opacity: '1', transform: 'translateY(0)' },
                        }
                    }
                }
            }
        }
    </script>
    <style>
        body {
            background-color: #F3F4F6;
            color: #334155;
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
        /* Light Snow Canvas Layer */
        #snowCanvas {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 0;
            opacity: 0.7;
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
            border-color: #D97706;
            box-shadow: 0 10px 30px -10px rgba(217, 119, 6, 0.2);
        }
        .active-tab {
            background-color: #334155;
            color: white;
            border-color: #334155;
        }
        .no-scrollbar::-webkit-scrollbar {
            display: none;
        }
        .no-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
    </style>
    <!-- Chosen Palette: "Hidden Warmth" - Cold Gray background, Deep Slate text, Amber accents for hidden Yang -->
    <!-- Application Structure Plan:
        1. Hero: Title with "Light Snow" visual cue (Canvas animation).
        2. Thien Tuong (Cosmic): Chart showing 240° & Yin overtaking Yang.
        3. Tam Hau (Nature): 3 Micro-seasons (Rainbow hides, Heaven rises/Earth sinks, Winter blockage).
        4. Doi Song (Life): Tabs for Preparation ("Pickling") & Customs ("Cured Meat").
        5. Duong Sinh (Health): "Nourish Kidney/Hide Yang" - Food Filter (Black/Warm vs Cold).
        6. Chiem Nghiem (Philosophy): Inner Silence (Tinh Lang).
        7. Footer: Copyright Tich Phong Thien Son.
    -->
    <!-- Visualization & Content Choices:
        1. Solar Gauge: Chart.js Doughnut (240°).
        2. Yin Yang Separation: Bar Chart showing Heaven Qi rising và Earth Qi sinking (separation).
        3. Food Filter: Logic for Kidney-nourishing (Black foods) và Warming foods.
        4. Snow Animation: HTML5 Canvas for sparse, light snowflakes.
    -->
    <!-- CONFIRMATION: NO SVG graphics used. NO Mermaid JS used. -->
</head>
<body class="font-sans antialiased leading-relaxed selection:bg-hidden-ember selection:text-white">

    <!-- Background Animation -->
    <canvas id="snowCanvas"></canvas>

    <!-- Navigation -->
    <nav class="sticky top-0 z-50 bg-winter-sky/90 backdrop-blur-md border-b border-cold-gray/30 shadow-sm transition-all duration-300">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between h-20 items-center">
                <div class="flex-shrink-0 flex items-center gap-3">
                    <span class="text-3xl filter drop-shadow-sm animate-fade-up">🌨️</span>
                    <div class="flex flex-col">
                        <span class="text-2xl font-serif font-bold text-deep-slate tracking-wide">Tiểu Tuyết</span>
                        <span class="text-xs font-sans text-hidden-ember uppercase tracking-widest font-bold">Dương Khí Ẩn Tàng</span>
                    </div>
                </div>
                <div class="hidden md:flex space-x-10">
                    <button onclick="scrollToSection('y-nghia')" class="text-deep-slate hover:text-hidden-ember transition font-medium tracking-wide text-sm uppercase">Ý Nghĩa</button>
                    <button onclick="scrollToSection('tam-hau')" class="text-deep-slate hover:text-hidden-ember transition font-medium tracking-wide text-sm uppercase">Tam Hậu</button>
                    <button onclick="scrollToSection('doi-song')" class="text-deep-slate hover:text-hidden-ember transition font-medium tracking-wide text-sm uppercase">Đời Sống</button>
                    <button onclick="scrollToSection('duong-sinh')" class="text-deep-slate hover:text-hidden-ember transition font-medium tracking-wide text-sm uppercase">Dưỡng Sinh</button>
                    <button onclick="scrollToSection('chiem-nghiem')" class="text-deep-slate hover:text-hidden-ember transition font-medium tracking-wide text-sm uppercase">Chiêm Nghiệm</button>
                </div>
            </div>
        </div>
    </nav>

    <!-- Hero Section -->
    <header class="relative pt-24 pb-20 px-4 text-center z-10 overflow-hidden">
        <div class="max-w-4xl mx-auto">
            <p class="text-hidden-ember font-bold tracking-[0.3em] uppercase mb-6 text-sm font-sans">Tiết Khí Thứ 20 • 22-23 Tháng 11</p>
            <h1 class="text-6xl md:text-8xl font-serif font-bold text-deep-slate mb-6 leading-tight relative inline-block">
                Tiểu Tuyết
                <span class="absolute -top-4 -right-12 text-4xl animate-bounce text-cold-gray">❄️</span>
            </h1>
            <h2 class="text-3xl md:text-5xl font-script text-dried-meat mb-10 font-bold transform -rotate-1">
                Khúc Dạo Đầu Mùa Đông Tĩnh Lặng
            </h2>
            <div class="w-24 h-1 bg-hidden-ember mx-auto mb-10 rounded-full shadow-sm"></div>
            <p class="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-loose font-light">
                "Trời đã đủ lạnh để tuyết bắt đầu rơi. Vạn vật thu mình lại, tích trữ năng lượng vào bên trong. Một khoảng lặng cần thiết để chuẩn bị cho sự tái sinh."
            </p>
            <div class="mt-14">
                <button onclick="scrollToSection('y-nghia')" class="group relative inline-flex items-center justify-center px-10 py-3 overflow-hidden font-serif italic tracking-wide text-white transition duration-300 ease-out border-2 border-deep-slate rounded-full shadow-md bg-deep-slate">
                    <span class="absolute inset-0 flex items-center justify-center w-full h-full text-white duration-300 -translate-x-full bg-hidden-ember group-hover:translate-x-0 ease">
                        <span class="text-xl">🔥</span>
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
            <h3 class="text-4xl font-serif font-bold text-deep-slate mb-4 inline-block relative">
                Khi Dương Khí Ẩn Tàng
                <span class="absolute -bottom-2 left-0 w-full h-1 bg-cold-gray/50"></span>
            </h3>
            <p class="text-gray-600 max-w-2xl mx-auto mt-6 text-lg leading-relaxed">
                Mặt Trời kinh độ 240°. "Tiểu" là nhỏ, "Tuyết" là mưa tuyết. Khí lạnh chưa cực đại nhưng đã đủ để tuyết rơi. Âm khí thịnh, Dương khí phải "Tàng" (giấu) đi.
            </p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <!-- Charts Column -->
            <div class="space-y-10">
                <div class="bg-white p-8 rounded-2xl shadow-sm border border-cold-gray/20 relative overflow-hidden">
                    <h4 class="text-xl font-serif font-bold text-deep-slate mb-2 text-center">Vị Trí Thiên Văn (240°)</h4>
                    <div class="chart-container">
                        <canvas id="solarChart"></canvas>
                    </div>
                </div>
                
                <div class="bg-white p-8 rounded-2xl shadow-sm border border-cold-gray/20">
                    <h4 class="text-xl font-serif font-bold text-hidden-ember mb-2 text-center">Sự Phân Tách Âm Dương</h4>
                    <div class="chart-container" style="height: 250px;">
                        <canvas id="yinYangChart"></canvas>
                    </div>
                    <p class="text-center text-sm text-gray-400 mt-4 italic">Trời (Dương) thăng lên, Đất (Âm) giáng xuống -> Bế tắc.</p>
                </div>
            </div>

            <!-- Content Explanation -->
            <div class="space-y-8 text-lg text-gray-600 leading-relaxed font-light">
                <div class="p-6 bg-white rounded-xl border-l-4 border-deep-slate shadow-sm">
                    <strong class="text-deep-slate font-serif text-xl block mb-2">Trạng Thái "Bế Tàng"</strong>
                    <p>
                        Thiên khí bay lên, Địa khí chìm xuống, không còn giao hòa. Vạn vật bước vào trạng thái đóng kín (bế tàng) để bảo vệ chút dương khí còn sót lại.
                    </p>
                </div>
                <div>
                    <strong class="text-deep-slate font-serif text-xl block mb-2">Khí Hậu Đặc Trưng</strong>
                    <p>
                        Hanh hao và khô lạnh. Gió Bấc thổi mạnh xua tan hơi ẩm của mùa thu. Tuyết bắt đầu rơi nhẹ ở phương Bắc.
                    </p>
                </div>
            </div>
        </div>
    </section>

    <!-- Section 2: Tam Hậu (Nature) -->
    <section id="tam-hau" class="py-24 bg-white relative z-10">
        <div class="max-w-6xl mx-auto px-4">
            <h3 class="text-3xl font-serif font-bold text-dried-meat mb-12 text-center">Tam Hậu: Ba Tín Hiệu Của Sự Tĩnh Lặng</h3>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                <!-- Card 1 -->
                <div class="card-interaction p-8 rounded-2xl cursor-default group text-center">
                    <div class="w-20 h-20 mx-auto rounded-full bg-cold-gray/20 flex items-center justify-center text-4xl mb-6 group-hover:scale-110 transition">🌈</div>
                    <h5 class="font-bold text-xl text-deep-slate mb-3 font-serif">1. Hồng Tàng Bất Kiến</h5>
                    <p class="text-gray-500 font-light">Cầu vồng biến mất. Do Âm Dương không còn giao hòa (không có nắng mưa đan xen) nên cầu vồng không hiện ra.</p>
                </div>

                <!-- Card 2 -->
                <div class="card-interaction p-8 rounded-2xl cursor-default group text-center">
                    <div class="w-20 h-20 mx-auto rounded-full bg-deep-slate/10 flex items-center justify-center text-4xl mb-6 group-hover:scale-110 transition">⬆️⬇️</div>
                    <h5 class="font-bold text-xl text-deep-slate mb-3 font-serif">2. Thiên Thăng Địa Giáng</h5>
                    <p class="text-gray-500 font-light">Khí trời bay lên cao, khí đất chìm xuống thấp. Sự tách biệt hoàn toàn giữa hai luồng khí.</p>
                </div>

                <!-- Card 3 -->
                <div class="card-interaction p-8 rounded-2xl cursor-default group text-center">
                    <div class="w-20 h-20 mx-auto rounded-full bg-hidden-ember/20 flex items-center justify-center text-4xl mb-6 group-hover:scale-110 transition">🔒</div>
                    <h5 class="font-bold text-xl text-deep-slate mb-3 font-serif">3. Bế Tắc Nhi Thành Đông</h5>
                    <p class="text-gray-500 font-light">Sự không giao thông tạo nên cái rét buốt, ngưng trệ. Mùa đông thực sự được hình thành từ sự bế tắc này.</p>
                </div>
            </div>
        </div>
    </section>

    <!-- Section 3: Đời Sống (Tabs) -->
    <section id="doi-song" class="py-24 px-4 bg-winter-sky relative z-10">
        <div class="max-w-6xl mx-auto">
            <div class="mb-12 text-center">
                <h3 class="text-4xl font-serif font-bold text-deep-slate mb-4">Mùa Tích Trữ & Chế Biến</h3>
                <p class="text-gray-500 italic">"Tiểu Tuyết yêm thái, Đại Tuyết yêm nhục"</p>
            </div>

            <!-- Custom Tabs -->
            <div class="flex justify-center mb-10 space-x-4">
                <button onclick="switchTab('phong-tuc')" id="btn-phong-tuc" class="active-tab px-8 py-3 rounded-full border border-deep-slate font-bold transition duration-300 font-serif tracking-wide shadow-sm">Phong Tục</button>
                <button onclick="switchTab('nong-nghiep')" id="btn-nong-nghiep" class="px-8 py-3 rounded-full border border-deep-slate text-deep-slate font-bold hover:bg-deep-slate hover:text-white transition duration-300 font-serif tracking-wide shadow-sm">Nông Nghiệp</button>
            </div>

            <!-- Content Area -->
            <div class="bg-white p-8 md:p-12 rounded-3xl border border-gray-100 min-h-[400px] flex items-center shadow-sm relative overflow-hidden">
                <div class="absolute top-0 right-0 w-32 h-32 bg-dried-meat/10 rounded-bl-full pointer-events-none"></div>

                <!-- Phong Tuc Content -->
                <div id="content-phong-tuc" class="grid grid-cols-1 md:grid-cols-2 gap-10 w-full animate-fade-in">
                    <!-- Card 1 -->
                    <div class="bg-winter-sky p-8 rounded-2xl border-l-4 border-dried-meat hover:bg-white transition group">
                        <div class="text-5xl mb-4 group-hover:scale-110 transition duration-300">🥓</div>
                        <h4 class="text-2xl font-serif font-bold text-deep-slate mb-3">Làm Thịt Khô (Lạp Nhục)</h4>
                        <p class="text-gray-600 leading-relaxed font-light">
                            Khí hậu khô lạnh là điều kiện vàng để làm lạp xưởng, thịt gác bếp. Thịt chín ngấu từ từ, hương vị đậm đà cho ngày Tết.
                        </p>
                    </div>
                    <!-- Card 2 -->
                    <div class="bg-winter-sky p-8 rounded-2xl border-l-4 border-hidden-ember hover:bg-white transition group">
                        <div class="text-5xl mb-4 group-hover:scale-110 transition duration-300">🥬</div>
                        <h4 class="text-2xl font-serif font-bold text-deep-slate mb-3">Muối Dưa (Yêm Thái)</h4>
                        <p class="text-gray-600 leading-relaxed font-light">
                            Muối rau củ cuối thu để dự trữ. Vị chua giòn kích thích vị giác trong những bữa cơm đông lạnh giá.
                        </p>
                    </div>
                </div>

                <!-- Nong Nghiep Content -->
                <div id="content-nong-nghiep" class="hidden grid-cols-1 md:grid-cols-2 gap-10 w-full animate-fade-in">
                    <div class="flex flex-col justify-center">
                        <h4 class="text-3xl font-serif font-bold text-hidden-ember mb-6">Thanh Nhàn & Dự Trữ</h4>
                        <p class="text-gray-600 leading-relaxed mb-6">
                            Việc đồng áng vơi bớt, chuyển sang chăm sóc và bảo vệ.
                        </p>
                        <ul class="space-y-4 text-gray-500 font-light">
                            <li class="flex items-start gap-3">
                                <span class="text-deep-slate font-bold">🌱</span>
                                <span><strong>Chăm Sóc:</strong> Rau vụ đông cần được ủ ấm.</span>
                            </li>
                            <li class="flex items-start gap-3">
                                <span class="text-dried-meat font-bold">🔒</span>
                                <span><strong>Dự Trữ:</strong> Kiểm kê kho lương thực, chuẩn bị cho ngày đông tháng giá.</span>
                            </li>
                        </ul>
                    </div>
                    <div class="flex items-center justify-center bg-winter-sky rounded-2xl p-6 border border-dashed border-gray-300">
                        <div class="text-center">
                            <div class="text-9xl mb-4 opacity-80 animate-pulse">🏡</div>
                            <p class="font-script text-2xl text-deep-slate">Nhà kho đầy đủ</p>
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
                    <span class="text-cold-gray font-bold tracking-widest uppercase text-sm">Hành Thủy • Tạng Thận</span>
                    <h3 class="text-4xl font-serif font-bold text-deep-slate mt-2 mb-6">Ôn Bổ & Dưỡng Tàng</h3>
                    <p class="text-gray-600 text-lg leading-relaxed mb-6">
                        Màu Đen đi vào Thận. Cần ăn thực phẩm màu đen để bổ thận khí và thực phẩm tính ôn để giữ ấm.
                    </p>
                    <div class="bg-white p-6 rounded-xl border-l-4 border-dark-ink shadow-sm">
                        <h4 class="font-bold text-lg text-dark-ink mb-2 font-serif">Nguyên Tắc Ẩm Thực</h4>
                        <p class="text-gray-600 mb-2"><strong>Hắc Thực:</strong> Gạo nếp cẩm, vừng đen, đỗ đen bổ thận.</p>
                        <p class="text-gray-600"><strong>Tính Ôn:</strong> Thịt dê, gừng, tỏi để trợ dương.</p>
                    </div>
                </div>

                <div class="space-y-4 font-sans text-gray-700">
                    <div class="flex items-center gap-4 p-3 bg-white rounded-lg shadow-sm">
                        <div class="w-10 h-10 rounded-full bg-hidden-ember/20 flex items-center justify-center text-xl">☀️</div>
                        <div>
                            <strong>Tắm Nắng:</strong> Phơi lưng khi có nắng để bổ sung dương khí.
                        </div>
                    </div>
                    <div class="flex items-center gap-4 p-3 bg-white rounded-lg shadow-sm">
                        <div class="w-10 h-10 rounded-full bg-hidden-ember/20 flex items-center justify-center text-xl">🦶</div>
                        <div>
                            <strong>Ngâm Chân:</strong> Dẫn hỏa quy nguyên, giúp ngủ ngon và ấm thận.
                        </div>
                    </div>
                </div>
            </div>

            <!-- Right: Interactive Food Filter -->
            <div class="lg:col-span-7">
                <div class="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden flex flex-col h-full">
                    <div class="bg-deep-slate p-8 text-white">
                        <h4 class="text-2xl font-serif font-bold flex items-center gap-3">
                            <span>🍲</span> Thực Đơn Ôn Bổ Hắc Thực
                        </h4>
                        <p class="opacity-80 mt-2 font-light text-sm">Chọn thực phẩm màu đen và tính ấm.</p>
                    </div>

                    <!-- Filters -->
                    <div class="p-6 border-b border-gray-100 flex gap-3 overflow-x-auto no-scrollbar">
                        <button onclick="filterFood('all')" class="food-btn active px-5 py-2 rounded-full text-sm font-bold bg-deep-slate text-white hover:bg-gray-800 transition whitespace-nowrap" data-filter="all">Tất Cả</button>
                        <button onclick="filterFood('good')" class="food-btn px-5 py-2 rounded-full text-sm font-bold bg-gray-100 text-gray-600 hover:bg-gray-200 transition whitespace-nowrap" data-filter="good">Nên Dùng (Đen/Ấm)</button>
                        <button onclick="filterFood('bad')" class="food-btn px-5 py-2 rounded-full text-sm font-bold bg-gray-100 text-gray-600 hover:bg-gray-200 transition whitespace-nowrap" data-filter="bad">Hạn Chế (Lạnh)</button>
                    </div>

                    <!-- Grid -->
                    <div id="food-grid" class="p-6 grid grid-cols-2 sm:grid-cols-3 gap-4 overflow-y-auto max-h-[500px] bg-winter-sky">
                        <!-- JS populated -->
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Section 5: Chiêm Nghiệm (Philosophy) -->
    <section id="chiem-nghiem" class="py-32 bg-dark-ink text-white text-center px-4 relative overflow-hidden">
        <!-- Abstract Background Shape -->
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-hidden-ember/10 rounded-full blur-[100px] pointer-events-none"></div>

        <div class="max-w-3xl mx-auto relative z-10">
            <span class="text-6xl text-cold-gray font-serif opacity-50 block mb-6">❝</span>
            
            <h3 class="text-4xl md:text-5xl font-serif font-bold mb-10 text-white leading-tight">
                Vẻ Đẹp Của Sự<br>Tĩnh Lặng
            </h3>
            
            <p class="text-xl text-gray-300 leading-loose mb-12 font-sans font-light">
                "Tĩnh cực tất động". Sự tiêu điều bên ngoài không phải là kết thúc, mà là sự chuẩn bị âm thầm. Hãy trân trọng những khoảng lặng để soi rọi tâm hồn, vun bồi nội lực, chờ đợi thời cơ vươn lên rực rỡ.
            </p>

            <div class="inline-block border border-gray-600 rounded-2xl p-10 bg-white/5 backdrop-blur-sm hover:bg-white/10 transition duration-500 cursor-default group">
                <p class="font-bold uppercase tracking-[0.2em] text-sm text-hidden-ember mb-6 font-sans group-hover:text-white transition">Lời Chúc Tiểu Tuyết</p>
                <div class="text-3xl md:text-4xl font-script text-cold-gray leading-relaxed group-hover:scale-105 transition duration-500 shadow-text">
                    "Thân ấm, Tâm an,<br>Trí sáng."
                </div>
            </div>
            
            <span class="text-6xl text-cold-gray font-serif opacity-50 block mt-12">❞</span>
        </div>
    </section>

    <!-- Footer -->
    <footer class="bg-[#0B1120] text-gray-500 py-12 text-center text-sm font-sans border-t border-gray-800">
        <p class="italic tracking-wide mb-3 text-gray-600">Biên soạn dựa trên nguyên lý 24 Tiết khí & Văn hóa Phương Đông</p>
        <p class="text-gray-500">© Bản quyền thuộc về <span class="font-script text-xl text-hidden-ember ml-1">Tịch Phong Thiên Sơn - 夕风天山</span></p>
    </footer>

    <!-- Javascript Logic -->
    <script>
        // --- Data ---
        const foodData = [
            { name: "Gạo Nếp Cẩm", type: "good", icon: "🍚", desc: "Bổ huyết, ích thận, ấm bụng" },
            { name: "Vừng Đen", type: "good", icon: "⚫", desc: "Đen tóc, đẹp da, bổ ngũ tạng" },
            { name: "Thịt Dê", type: "good", icon: "🥩", desc: "Đại bổ dương khí, trừ hàn" },
            { name: "Đậu Đen", type: "good", icon: "🫘", desc: "Bổ thận thủy, giải độc" },
            { name: "Gà Ác", type: "good", icon: "🐓", desc: "Bổ can thận, ích khí huyết" },
            { name: "Gừng", type: "good", icon: "🫚", desc: "Ấm tỳ vị, giải cảm lạnh" },
            { name: "Nước Đá", type: "bad", icon: "🧊", desc: "Làm tắt nghẽn dương khí" },
            { name: "Hải Sản Sống", type: "bad", icon: "🍣", desc: "Tính hàn, dễ gây đau bụng" },
            { name: "Kem", type: "bad", icon: "🍦", desc: "Hại tỳ vị mùa đông" }
        ];

        // --- Tab Logic ---
        function switchTab(tab) {
            document.getElementById('content-phong-tuc').classList.add('hidden');
            document.getElementById('content-phong-tuc').classList.remove('grid');
            document.getElementById('content-nong-nghiep').classList.add('hidden');
            document.getElementById('content-nong-nghiep').classList.remove('grid');

            document.getElementById('btn-phong-tuc').classList.remove('active-tab', 'text-white');
            document.getElementById('btn-phong-tuc').classList.add('text-deep-slate');
            document.getElementById('btn-nong-nghiep').classList.remove('active-tab', 'text-white');
            document.getElementById('btn-nong-nghiep').classList.add('text-deep-slate');

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
                    btn.classList.add('bg-deep-slate', 'text-white');
                    btn.classList.remove('bg-gray-100', 'text-gray-600');
                } else {
                    btn.classList.remove('bg-deep-slate', 'text-white');
                    btn.classList.add('bg-gray-100', 'text-gray-600');
                }
            });

            const items = filter === 'all' ? foodData : foodData.filter(i => i.type === filter);

            items.forEach(item => {
                const el = document.createElement('div');
                let colorClass = item.type === 'good' 
                    ? 'bg-slate-800 border-slate-700 text-white' 
                    : 'bg-red-50 border-red-100 text-red-900 opacity-70';
                
                // Specific styling for "Black foods" to look appealing
                if (item.type === 'good') {
                     colorClass = 'bg-slate-800 text-gray-200 border border-slate-600 shadow-md';
                }

                el.className = \`\${colorClass} border rounded-xl p-4 flex flex-col items-center text-center transition hover:scale-105 cursor-default group\`;
                el.innerHTML = \`
    <div class="text-4xl mb-3 transform group-hover:scale-110 transition shadow-text">\${item.icon} </div>
        <div class="font-serif font-bold text-base mb-1 tracking-wide shadow-text">\${item.name} </div>
            <div class="text-xs font-sans opacity-80 shadow-text">\${item.desc} </div>
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

        // --- Canvas Animation (Light Snow) ---
        function initSnowCanvas() {
            const canvas = document.getElementById('snowCanvas');
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
                    this.size = Math.random() * 2 + 0.5; // Smaller snow
                    this.speed = Math.random() * 0.5 + 0.2; // Slower
                    this.opacity = Math.random() * 0.5 + 0.2;
                    this.sway = Math.random() * 0.2 - 0.1;
                }
                update() {
                    this.y += this.speed;
                    this.x += this.sway;
                    if (this.y > height) {
                        this.y = -5;
                        this.x = Math.random() * width;
                    }
                }
                draw() {
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                    ctx.fillStyle = \`rgba(229, 231, 235, \${this.opacity})\`; // Cold Gray Snow
                    ctx.fill();
                }
            }

            for(let i=0; i<60; i++) snowflakes.push(new Snowflake()); // Less density

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
            initSnowCanvas();
            filterFood('all');

            // Chart 1: Solar Term 240 deg
            const ctx1 = document.getElementById('solarChart').getContext('2d');
            new Chart(ctx1, {
                type: 'doughnut',
                data: {
                    labels: ['Tiểu Tuyết', 'Đại Tuyết', 'Đông Chí', 'Mùa Khác'],
                    datasets: [{
                        data: [15, 15, 15, 315],
                        backgroundColor: ['#334155', '#0F172A', '#0F172A', '#F3F4F6'],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    rotation: 150, 
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
                        ctx.fillStyle = "#334155";
                        var text = "240°",
                            textX = Math.round((width - ctx.measureText(text).width) / 2),
                            textY = height / 2;
                        ctx.fillText(text, textX, textY);
                        ctx.save();
                    }
                }]
            });

            // Chart 2: Yin Yang Separation (Bar)
            const ctx2 = document.getElementById('yinYangChart').getContext('2d');
            new Chart(ctx2, {
                type: 'bar',
                data: {
                    labels: ['Khí Trời (Dương)', 'Khí Đất (Âm)'],
                    datasets: [
                        {
                            label: 'Xu Hướng Di Chuyển',
                            data: [10, -10], // Diverging
                            backgroundColor: ['#D97706', '#334155'],
                            borderRadius: 4
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    indexAxis: 'y',
                    scales: {
                        x: { 
                            grid: { display: false },
                            ticks: { display: false },
                            min: -15,
                            max: 15
                        },
                        y: { 
                            grid: { display: false },
                            ticks: { font: { family: "'Be Vietnam Pro'" } }
                        }
                    },
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return context.raw > 0 ? "Bay lên (Thăng)" : "Chìm xuống (Giáng)";
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
