export const DongChi = `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Đông Chí: Đỉnh Điểm Âm Khí & Sự Hồi Sinh Của Dương Khí</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    
    <!-- Fonts: Philosopher (Tiêu đề - Trang trọng), Be Vietnam Pro (Nội dung - Ấm áp), Dancing Script (Thơ - Sum vầy) -->
    <link href="https://fonts.googleapis.com/css2?family=Philosopher:ital,wght@0,400;0,700;1,400;1,700&family=Be+Vietnam+Pro:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400&family=Dancing+Script:wght@400;700&display=swap" rel="stylesheet">
    
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        'deep-night-black': '#0B090A', // Đen sâu (Đêm dài nhất/Âm cực thịnh)
                        'plum-red': '#A4161A',         // Đỏ mận (Sự ấm cúng/Lễ tết/Máu huyết)
                        'hope-gold': '#FFB703',        // Vàng hy vọng (Nhất dương sinh)
                        'warm-beige': '#F5F3F4',       // Màu kem ấm (Bánh trôi/Sủi cảo)
                        'charcoal-gray': '#161A1D',    // Xám than (Bóng tối)
                        'earth-root': '#660708'        // Nâu đỏ đậm (Cội nguồn)
                    },
                    fontFamily: {
                        serif: ['"Philosopher"', 'serif'],
                        sans: ['"Be Vietnam Pro"', 'sans-serif'],
                        script: ['"Dancing Script"', 'cursive'],
                    },
                    animation: {
                        'flicker': 'flicker 3s infinite alternate',
                    },
                    keyframes: {
                        flicker: {
                            '0%, 100%': { opacity: '1' },
                            '50%': { opacity: '0.8' },
                        }
                    }
                }
            }
        }
    </script>
    <style>
        body {
            background-color: #0B090A;
            color: #F5F3F4;
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
        /* Candle Light Canvas Layer */
        #lightCanvas {
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
            border: 1px solid rgba(164, 22, 26, 0.3);
            background: rgba(22, 26, 29, 0.8);
            backdrop-filter: blur(5px);
        }
        .card-interaction:hover {
            transform: translateY(-5px);
            border-color: #FFB703;
            box-shadow: 0 10px 40px -10px rgba(255, 183, 3, 0.2);
            background: rgba(22, 26, 29, 0.95);
        }
        .active-tab {
            background-color: #A4161A;
            color: white;
            border-color: #A4161A;
        }
        .no-scrollbar::-webkit-scrollbar {
            display: none;
        }
        .no-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
    </style>
    <!-- Chosen Palette: "Winter Solstice Rebirth" - Deepest Black, Festive Red, Hopeful Gold -->
    <!-- Application Structure Plan:
        1. Hero: Title with "Candle Light/First Ray" visual cue (Canvas animation).
        2. Thien Tuong (Cosmic): Chart showing 270° & Longest Night/Shortest Day.
        3. Tam Hau (Nature): 3 Micro-seasons (Worms curl, Deer horns drop, Spring water warms).
        4. Doi Song (Life): Tabs for Customs ("Dumplings/Tangyuan") & Worship ("Ancestor").
        5. Duong Sinh (Health): "Protect Yang" - Food Filter (Mutton/Nuts vs Cold/Raw).
        6. Chiem Nghiem (Philosophy): Hope in Darkness (Nhat Duong Sinh).
        7. Footer: Copyright Tich Phong Thien Son.
    -->
    <!-- Visualization & Content Choices:
        1. Solar Gauge: Chart.js Doughnut (270°).
        2. Day/Night Extreme: Bar Chart showing Night maxing out.
        3. Food Filter: Logic for Warming/Kidney foods (Mutton, Dumplings).
        4. Light Animation: HTML5 Canvas for warm, flickering light in darkness.
    -->
    <!-- CONFIRMATION: NO SVG graphics used. NO Mermaid JS used. -->
</head>
<body class="font-sans antialiased leading-relaxed selection:bg-plum-red selection:text-white">

    <!-- Background Animation -->
    <canvas id="lightCanvas"></canvas>

    <!-- Navigation -->
    <nav class="sticky top-0 z-50 bg-[#0B090A]/90 backdrop-blur-md border-b border-plum-red/30 shadow-lg transition-all duration-300">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between h-20 items-center">
                <div class="flex-shrink-0 flex items-center gap-3">
                    <span class="text-3xl filter drop-shadow-[0_0_10px_#FFB703] animate-flicker">🕯️</span>
                    <div class="flex flex-col">
                        <span class="text-2xl font-serif font-bold text-plum-red tracking-wide">Đông Chí</span>
                        <span class="text-xs font-sans text-hope-gold uppercase tracking-widest font-bold">Nhất Dương Sinh</span>
                    </div>
                </div>
                <div class="hidden md:flex space-x-10">
                    <button onclick="scrollToSection('y-nghia')" class="text-warm-beige hover:text-hope-gold transition font-medium tracking-wide text-sm uppercase">Ý Nghĩa</button>
                    <button onclick="scrollToSection('tam-hau')" class="text-warm-beige hover:text-hope-gold transition font-medium tracking-wide text-sm uppercase">Tam Hậu</button>
                    <button onclick="scrollToSection('doi-song')" class="text-warm-beige hover:text-hope-gold transition font-medium tracking-wide text-sm uppercase">Đời Sống</button>
                    <button onclick="scrollToSection('duong-sinh')" class="text-warm-beige hover:text-hope-gold transition font-medium tracking-wide text-sm uppercase">Dưỡng Sinh</button>
                    <button onclick="scrollToSection('chiem-nghiem')" class="text-warm-beige hover:text-hope-gold transition font-medium tracking-wide text-sm uppercase">Chiêm Nghiệm</button>
                </div>
            </div>
        </div>
    </nav>

    <!-- Hero Section -->
    <header class="relative pt-24 pb-20 px-4 text-center z-10 overflow-hidden">
        <div class="max-w-4xl mx-auto">
            <p class="text-hope-gold font-bold tracking-[0.3em] uppercase mb-6 text-sm font-sans">Tiết Khí Thứ 22 • 21-22 Tháng 12</p>
            <h1 class="text-6xl md:text-8xl font-serif font-bold text-warm-beige mb-6 leading-tight relative inline-block">
                Đông Chí
                <span class="absolute -top-4 -right-12 text-4xl animate-bounce text-plum-red">🧧</span>
            </h1>
            <h2 class="text-3xl md:text-5xl font-script text-earth-root mb-10 font-bold transform -rotate-1 shadow-black">
                Khởi Đầu Của Sự Hồi Sinh
            </h2>
            <div class="w-24 h-1 bg-plum-red mx-auto mb-10 rounded-full shadow-[0_0_15px_#A4161A]"></div>
            <p class="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto leading-loose font-light">
                "Đêm dài nhất, ngày ngắn nhất. Âm khí cực thịnh, nhưng chính từ tận cùng bóng tối, một tia Dương khí mới mẻ, tinh khôi bắt đầu nảy mầm."
            </p>
            <div class="mt-14">
                <button onclick="scrollToSection('y-nghia')" class="group relative inline-flex items-center justify-center px-10 py-3 overflow-hidden font-serif italic tracking-wide text-white transition duration-300 ease-out border-2 border-plum-red rounded-full shadow-md bg-plum-red">
                    <span class="absolute inset-0 flex items-center justify-center w-full h-full text-white duration-300 -translate-x-full bg-hope-gold group-hover:translate-x-0 ease">
                        <span class="text-xl text-deep-night-black">☀️</span>
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
            <h3 class="text-4xl font-serif font-bold text-hope-gold mb-4 inline-block relative">
                Nhất Dương Sinh
                <span class="absolute -bottom-2 left-0 w-full h-1 bg-plum-red"></span>
            </h3>
            <p class="text-gray-400 max-w-2xl mx-auto mt-6 text-lg leading-relaxed">
                Mặt Trời kinh độ 270°. "Chí" là cực điểm. Mùa đông đạt đỉnh, đêm dài nhất năm. Nhưng "Vật cực tất phản", Dương khí bắt đầu sinh ra.
            </p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <!-- Charts Column -->
            <div class="space-y-10">
                <div class="bg-white/5 p-8 rounded-2xl shadow-lg border border-plum-red/20 relative overflow-hidden backdrop-blur-sm">
                    <h4 class="text-xl font-serif font-bold text-warm-beige mb-2 text-center">Vị Trí Thiên Văn (270°)</h4>
                    <div class="chart-container">
                        <canvas id="solarChart"></canvas>
                    </div>
                </div>
                
                <div class="bg-white/5 p-8 rounded-2xl shadow-lg border border-plum-red/20 backdrop-blur-sm">
                    <h4 class="text-xl font-serif font-bold text-hope-gold mb-2 text-center">Tỷ Lệ Ngày & Đêm</h4>
                    <div class="chart-container" style="height: 250px;">
                        <canvas id="dayNightChart"></canvas>
                    </div>
                    <p class="text-center text-sm text-gray-500 mt-4 italic">Đêm dài nhất, Ngày ngắn nhất.</p>
                </div>
            </div>

            <!-- Content Explanation -->
            <div class="space-y-8 text-lg text-gray-300 leading-relaxed font-light">
                <div class="p-6 bg-plum-red/10 rounded-xl border-l-4 border-plum-red shadow-[0_0_15px_rgba(164,22,26,0.2)]">
                    <strong class="text-hope-gold font-serif text-xl block mb-2">Quy Luật Tuần Hoàn</strong>
                    <p>
                        Đông Chí không phải là sự kết thúc, mà là khởi đầu của sự hồi sinh. Khí Dương non nớt cần được bảo vệ và nuôi dưỡng kỹ lưỡng.
                    </p>
                </div>
                <div>
                    <strong class="text-hope-gold font-serif text-xl block mb-2">Thiên Văn Học</strong>
                    <p>
                        Bắc bán cầu nhận ít ánh sáng mặt trời nhất. Bóng của vạn vật đổ dài nhất vào giữa trưa.
                    </p>
                </div>
            </div>
        </div>
    </section>

    <!-- Section 2: Tam Hậu (Nature) -->
    <section id="tam-hau" class="py-24 relative z-10">
        <div class="max-w-6xl mx-auto px-4">
            <h3 class="text-3xl font-serif font-bold text-earth-root mb-12 text-center">Tam Hậu: Ba Tín Hiệu Hồi Sinh</h3>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                <!-- Card 1 -->
                <div class="card-interaction p-8 rounded-2xl cursor-default group text-center">
                    <div class="w-20 h-20 mx-auto rounded-full bg-charcoal-gray flex items-center justify-center text-4xl mb-6 group-hover:scale-110 transition shadow-[0_0_10px_#A4161A]">🪱</div>
                    <h5 class="font-bold text-xl text-warm-beige mb-3 font-serif">1. Khâu Dần Kết</h5>
                    <p class="text-gray-400 font-light">Giun đất cuộn tròn lại trong hang, kết thành búi để giữ ấm và cảm nhận khí dương từ lòng đất.</p>
                </div>

                <!-- Card 2 -->
                <div class="card-interaction p-8 rounded-2xl cursor-default group text-center">
                    <div class="w-20 h-20 mx-auto rounded-full bg-hope-gold/10 flex items-center justify-center text-4xl mb-6 group-hover:scale-110 transition">🦌</div>
                    <h5 class="font-bold text-xl text-warm-beige mb-3 font-serif">2. Mi Lộc Giải</h5>
                    <p class="text-gray-400 font-light">Hươu nai (thuộc dương) cảm nhận được khí dương mới sinh mà bắt đầu rụng sừng cũ.</p>
                </div>

                <!-- Card 3 -->
                <div class="card-interaction p-8 rounded-2xl cursor-default group text-center">
                    <div class="w-20 h-20 mx-auto rounded-full bg-plum-red/20 flex items-center justify-center text-4xl mb-6 group-hover:scale-110 transition">💧</div>
                    <h5 class="font-bold text-xl text-warm-beige mb-3 font-serif">3. Thủy Tuyền Động</h5>
                    <p class="text-gray-400 font-light">Nước giếng, suối bắt đầu ấm lên do dương khí từ lòng đất bốc lên, dù mặt đất vẫn đóng băng.</p>
                </div>
            </div>
        </div>
    </section>

    <!-- Section 3: Đời Sống (Tabs) -->
    <section id="doi-song" class="py-24 px-4 bg-white/5 relative z-10 backdrop-blur-sm">
        <div class="max-w-6xl mx-auto">
            <div class="mb-12 text-center">
                <h3 class="text-4xl font-serif font-bold text-plum-red mb-4">Đại Lễ & Đoàn Viên</h3>
                <p class="text-gray-400 italic">"Đông Chí lớn như năm mới" (Đông Chí đại như niên)</p>
            </div>

            <!-- Custom Tabs -->
            <div class="flex justify-center mb-10 space-x-4">
                <button onclick="switchTab('phong-tuc')" id="btn-phong-tuc" class="active-tab px-8 py-3 rounded-full border border-plum-red font-bold transition duration-300 font-serif tracking-wide shadow-[0_0_15px_#A4161A]">Phong Tục</button>
                <button onclick="switchTab('nong-nghiep')" id="btn-nong-nghiep" class="px-8 py-3 rounded-full border border-plum-red text-plum-red font-bold hover:bg-plum-red hover:text-white transition duration-300 font-serif tracking-wide shadow-sm">Nông Nghiệp</button>
            </div>

            <!-- Content Area -->
            <div class="bg-[#0f0c0e] p-8 md:p-12 rounded-3xl border border-white/10 min-h-[400px] flex items-center shadow-2xl relative overflow-hidden">
                <div class="absolute top-0 right-0 w-40 h-40 bg-hope-gold/5 rounded-bl-full pointer-events-none blur-3xl"></div>

                <!-- Phong Tuc Content -->
                <div id="content-phong-tuc" class="grid grid-cols-1 md:grid-cols-2 gap-10 w-full animate-fade-in">
                    <div class="grid grid-cols-1 gap-6">
                        <!-- Item 1 -->
                        <div class="flex items-start gap-4">
                            <div class="text-3xl text-plum-red">🥟</div>
                            <div>
                                <h4 class="font-serif font-bold text-warm-beige text-lg">Ăn Sủi Cảo</h4>
                                <p class="text-sm text-gray-400 mt-1">Miền Bắc ăn sủi cảo (hình tai) để giữ ấm tai, chống rét và cầu đoàn viên.</p>
                            </div>
                        </div>
                        <!-- Item 2 -->
                        <div class="flex items-start gap-4">
                            <div class="text-3xl text-white">🥣</div>
                            <div>
                                <h4 class="font-serif font-bold text-warm-beige text-lg">Chè Trôi Nước</h4>
                                <p class="text-sm text-gray-400 mt-1">Miền Nam ăn chè trôi nước (viên tròn). "Ăn một viên, lớn một tuổi", tượng trưng cho sự viên mãn.</p>
                            </div>
                        </div>
                        <!-- Item 3 -->
                        <div class="flex items-start gap-4">
                            <div class="text-3xl text-hope-gold">🙏</div>
                            <div>
                                <h4 class="font-serif font-bold text-warm-beige text-lg">Cúng Tế</h4>
                                <p class="text-sm text-gray-400 mt-1">Ngày lễ trọng đại tế Trời, cúng tổ tiên, cầu mong năm mới an lành.</p>
                            </div>
                        </div>
                    </div>
                    <div class="flex items-center justify-center bg-white/5 rounded-2xl p-6 border border-dashed border-white/20">
                        <div class="text-center">
                            <div class="text-9xl mb-4 opacity-80 animate-pulse">👨‍👩‍👧‍👦</div>
                            <p class="font-script text-2xl text-hope-gold">Gia đạo sum vầy</p>
                        </div>
                    </div>
                </div>

                <!-- Nong Nghiep Content -->
                <div id="content-nong-nghiep" class="hidden grid-cols-1 md:grid-cols-2 gap-10 w-full animate-fade-in">
                    <div class="flex flex-col justify-center">
                        <h4 class="text-3xl font-serif font-bold text-earth-root mb-6">Nghỉ Ngơi & Chuẩn Bị</h4>
                        <p class="text-gray-300 leading-relaxed mb-6">
                            Thời điểm nông nhàn nhất. Đất đai nghỉ ngơi tích tụ dưỡng chất.
                        </p>
                        <ul class="space-y-4 text-gray-400 font-light">
                            <li class="flex items-start gap-3">
                                <span class="text-plum-red font-bold">🏠</span>
                                <span><strong>Tu Sửa:</strong> Sửa sang nhà cửa, chuồng trại.</span>
                            </li>
                            <li class="flex items-start gap-3">
                                <span class="text-hope-gold font-bold">💩</span>
                                <span><strong>Làm Phân:</strong> Ủ phân bón, chuẩn bị cho vụ xuân tới.</span>
                            </li>
                            <li class="flex items-start gap-3">
                                <span class="text-earth-root font-bold">💧</span>
                                <span><strong>Thủy Lợi:</strong> Khơi thông kênh mương.</span>
                            </li>
                        </ul>
                    </div>
                    <div class="flex items-center justify-center bg-white/5 rounded-2xl p-6 border border-dashed border-white/20">
                        <div class="text-center">
                            <div class="text-9xl mb-4 opacity-80">🛌</div>
                            <p class="font-script text-2xl text-warm-beige">Đất nghỉ người nhàn</p>
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
                    <span class="text-hope-gold font-bold tracking-widest uppercase text-sm">Tàng Dương • Bổ Thận</span>
                    <h3 class="text-4xl font-serif font-bold text-warm-beige mt-2 mb-6">Thu Tàng Năng Lượng</h3>
                    <p class="text-gray-400 text-lg leading-relaxed mb-6">
                        Dưỡng sinh then chốt. Cần "Tàng" (giấu) dương khí, bổ Thận (gốc của sự sống) để chuẩn bị cho năm sau.
                    </p>
                    <div class="bg-plum-red/10 p-6 rounded-xl border-l-4 border-plum-red shadow-sm">
                        <h4 class="font-bold text-lg text-plum-red mb-2 font-serif">Nguyên Tắc Ẩm Thực</h4>
                        <p class="text-gray-300 mb-2"><strong>Ôn Bổ:</strong> Thịt dê, hạt dẻ, óc chó để sinh nhiệt.</p>
                        <p class="text-gray-300"><strong>Cân Bằng:</strong> Kết hợp củ cải trắng để tránh bốc hỏa.</p>
                    </div>
                </div>

                <div class="space-y-4 font-sans text-gray-400">
                    <div class="flex items-center gap-4 p-3 bg-white/5 rounded-lg border border-white/10">
                        <div class="w-10 h-10 rounded-full bg-hope-gold/20 flex items-center justify-center text-xl text-white">🛏️</div>
                        <div>
                            <strong>Ngủ Nướng:</strong> Ngủ sớm, dậy muộn đợi mặt trời để dưỡng dương.
                        </div>
                    </div>
                    <div class="flex items-center gap-4 p-3 bg-white/5 rounded-lg border border-white/10">
                        <div class="w-10 h-10 rounded-full bg-hope-gold/20 flex items-center justify-center text-xl text-white">🧣</div>
                        <div>
                            <strong>Giữ Ấm:</strong> Lưng, cổ và chân là nơi hàn khí dễ xâm nhập nhất.
                        </div>
                    </div>
                </div>
            </div>

            <!-- Right: Interactive Food Filter -->
            <div class="lg:col-span-7">
                <div class="bg-white/5 rounded-3xl shadow-lg border border-white/10 overflow-hidden flex flex-col h-full backdrop-blur-sm">
                    <div class="bg-gradient-to-r from-plum-red to-earth-root p-8 text-white">
                        <h4 class="text-2xl font-serif font-bold flex items-center gap-3">
                            <span>🥘</span> Thực Đơn Bổ Thận
                        </h4>
                        <p class="opacity-90 mt-2 font-light text-sm">Chọn thực phẩm màu đen và tính ôn ấm.</p>
                    </div>

                    <!-- Filters -->
                    <div class="p-6 border-b border-white/10 flex gap-3 overflow-x-auto no-scrollbar">
                        <button onclick="filterFood('all')" class="food-btn active px-5 py-2 rounded-full text-sm font-bold bg-white/10 text-gray-300 hover:bg-white/20 transition whitespace-nowrap" data-filter="all">Tất Cả</button>
                        <button onclick="filterFood('good')" class="food-btn px-5 py-2 rounded-full text-sm font-bold bg-white/10 text-gray-300 hover:bg-white/20 transition whitespace-nowrap" data-filter="good">Nên Dùng (Ấm/Đen)</button>
                        <button onclick="filterFood('bad')" class="food-btn px-5 py-2 rounded-full text-sm font-bold bg-white/10 text-gray-300 hover:bg-white/20 transition whitespace-nowrap" data-filter="bad">Hạn Chế (Lạnh/Cay)</button>
                    </div>

                    <!-- Grid -->
                    <div id="food-grid" class="p-6 grid grid-cols-2 sm:grid-cols-3 gap-4 overflow-y-auto max-h-[500px]">
                        <!-- JS populated -->
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Section 5: Chiêm Nghiệm (Philosophy) -->
    <section id="chiem-nghiem" class="py-32 relative overflow-hidden">
        <!-- Abstract Background Shape -->
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-plum-red/10 rounded-full blur-[100px] pointer-events-none"></div>

        <div class="max-w-3xl mx-auto relative z-10 text-center">
            <span class="text-6xl text-hope-gold font-serif opacity-50 block mb-6">❝</span>
            
            <h3 class="text-4xl md:text-5xl font-serif font-bold mb-10 text-warm-beige leading-tight">
                Ánh Sáng Trong<br>Bóng Tối
            </h3>
            
            <p class="text-xl text-gray-300 leading-loose mb-12 font-sans font-light">
                Khi bóng đêm dài nhất bao phủ, đó cũng là lúc mầm mống ánh sáng bắt đầu trỗi dậy. Đừng tuyệt vọng trong nghịch cảnh, bởi "Đông qua Xuân tới" là quy luật bất biến. Hãy kiên nhẫn nuôi dưỡng niềm tin và quay về bên gia đình để sưởi ấm tâm hồn.
            </p>

            <div class="inline-block border border-white/20 rounded-2xl p-10 bg-white/5 backdrop-blur-sm hover:border-hope-gold transition duration-500 cursor-default group">
                <p class="font-bold uppercase tracking-[0.2em] text-sm text-hope-gold mb-6 font-sans group-hover:text-white transition">Lời Chúc Đông Chí</p>
                <div class="text-3xl md:text-4xl font-script text-plum-red leading-relaxed group-hover:scale-105 transition duration-500 shadow-text">
                    "Gia đạo đoàn viên,<br>Vận khí hanh thông."
                </div>
            </div>
            
            <span class="text-6xl text-hope-gold font-serif opacity-50 block mt-12">❞</span>
        </div>
    </section>

    <!-- Footer -->
    <footer class="bg-black text-gray-500 py-12 text-center text-sm font-sans border-t border-white/10">
        <p class="italic tracking-wide mb-3 text-gray-600">Biên soạn dựa trên nguyên lý 24 Tiết khí & Văn hóa Phương Đông</p>
        <p class="text-gray-500">© Bản quyền thuộc về <span class="font-script text-xl text-plum-red ml-1">Tịch Phong Thiên Sơn - 夕风天山</span></p>
    </footer>

    <!-- Javascript Logic -->
    <script>
        // --- Data ---
        const foodData = [
            { name: "Thịt Dê", type: "good", icon: "🥩", desc: "Đại bổ thận dương, trừ hàn" },
            { name: "Sủi Cảo", type: "good", icon: "🥟", desc: "Giữ ấm tai, đoàn viên" },
            { name: "Chè Trôi Nước", type: "good", icon: "⚪", desc: "Viên mãn, ấm áp" },
            { name: "Hạt Dẻ", type: "good", icon: "🌰", desc: "Bổ thận, mạnh gân cốt" },
            { name: "Óc Chó", type: "good", icon: "🧠", desc: "Bổ não, ôn phế, ích thận" },
            { name: "Đỗ Đen", type: "good", icon: "🫘", desc: "Bổ thận thủy, dưỡng huyết" },
            { name: "Thịt Chó", type: "good", icon: "🐕", desc: "Đại nhiệt (theo cổ truyền)" },
            { name: "Ớt Quá Cay", type: "bad", icon: "🌶️", desc: "Gây bốc hỏa, hao tổn khí" },
            { name: "Nước Đá", type: "bad", icon: "🧊", desc: "Dập tắt dương khí mới sinh" }
        ];

        // --- Tab Logic ---
        function switchTab(tab) {
            document.getElementById('content-nong-nghiep').classList.add('hidden');
            document.getElementById('content-nong-nghiep').classList.remove('grid');
            document.getElementById('content-phong-tuc').classList.add('hidden');
            document.getElementById('content-phong-tuc').classList.remove('grid');

            document.getElementById('btn-nong-nghiep').classList.remove('active-tab', 'text-white');
            document.getElementById('btn-nong-nghiep').classList.add('text-warm-beige');
            document.getElementById('btn-phong-tuc').classList.remove('active-tab', 'text-white');
            document.getElementById('btn-phong-tuc').classList.add('text-warm-beige');

            const content = document.getElementById(\`content-\${tab}\`);
            content.classList.remove('hidden');
            content.classList.add('grid');
            
            const btn = document.getElementById(\`btn-\${tab}\`);
            btn.classList.add('active-tab');
            btn.classList.remove('text-warm-beige');
        }

        // --- Food Filter Logic ---
        function filterFood(filter) {
            const grid = document.getElementById('food-grid');
            grid.innerHTML = ''; 

            document.querySelectorAll('.food-btn').forEach(btn => {
                if(btn.dataset.filter === filter) {
                    btn.classList.add('bg-plum-red', 'text-white');
                    btn.classList.remove('bg-white/10', 'text-gray-300');
                } else {
                    btn.classList.remove('bg-plum-red', 'text-white');
                    btn.classList.add('bg-white/10', 'text-gray-300');
                }
            });

            const items = filter === 'all' ? foodData : foodData.filter(i => i.type === filter);

            items.forEach(item => {
                const el = document.createElement('div');
                let colorClass = item.type === 'good' 
                    ? 'bg-red-900/30 border-red-500/30 text-red-200' 
                    : 'bg-blue-900/30 border-blue-500/30 text-blue-300 opacity-70';
                
                if (item.name === "Sủi Cảo" || item.name === "Chè Trôi Nước") {
                     colorClass = 'bg-yellow-600/20 border-yellow-500/40 text-yellow-200';
                }

                el.className = \`\${colorClass} border rounded-xl p-4 flex flex-col items-center text-center transition hover:scale-105 cursor-default group backdrop-blur-md\`;
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

        // --- Canvas Animation (Candle Light) ---
        function initLightCanvas() {
            const canvas = document.getElementById('lightCanvas');
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
                    this.size = Math.random() * 2;
                    this.speedY = Math.random() * -0.5 - 0.1; // Rise up
                    this.opacity = Math.random() * 0.5;
                    this.color = '#FFB703'; // Hope Gold
                }
                update() {
                    this.y += this.speedY;
                    this.opacity -= 0.002;
                    if (this.opacity <= 0) {
                        this.reset();
                    }
                }
                reset() {
                    this.y = height;
                    this.x = Math.random() * width;
                    this.opacity = Math.random() * 0.5;
                }
                draw() {
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                    ctx.fillStyle = \`rgba(255, 183, 3, \${this.opacity})\`;
                    ctx.shadowBlur = 10;
                    ctx.shadowColor = '#FFB703';
                    ctx.fill();
                    ctx.shadowBlur = 0;
                }
            }

            for(let i=0; i<60; i++) particles.push(new Particle());

            function animate() {
                ctx.clearRect(0, 0, width, height);
                // Vignette effect for "Darkness"
                const gradient = ctx.createRadialGradient(width/2, height/2, width/4, width/2, height/2, width);
                gradient.addColorStop(0, 'rgba(11, 9, 10, 0)');
                gradient.addColorStop(1, 'rgba(11, 9, 10, 0.8)');
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, width, height);

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
            initLightCanvas();
            filterFood('all');

            // Chart 1: Solar Term 270 deg
            const ctx1 = document.getElementById('solarChart').getContext('2d');
            new Chart(ctx1, {
                type: 'doughnut',
                data: {
                    labels: ['Đông Chí', 'Tiểu Hàn', 'Đại Hàn', 'Mùa Khác'],
                    datasets: [{
                        data: [15, 15, 15, 315],
                        backgroundColor: ['#A4161A', '#161A1D', '#161A1D', '#F5F3F4'],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    rotation: 180, 
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
                        ctx.fillStyle = "#A4161A";
                        var text = "270°",
                            textX = Math.round((width - ctx.measureText(text).width) / 2),
                            textY = height / 2;
                        ctx.fillText(text, textX, textY);
                        ctx.save();
                    }
                }]
            });

            // Chart 2: Day/Night Extreme (Bar)
            const ctx2 = document.getElementById('dayNightChart').getContext('2d');
            new Chart(ctx2, {
                type: 'bar',
                data: {
                    labels: ['Ban Ngày', 'Ban Đêm'],
                    datasets: [{
                        label: 'Thời Lượng',
                        data: [30, 70], // Symbolic short day long night
                        backgroundColor: ['#FFB703', '#161A1D'],
                        borderRadius: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    indexAxis: 'y',
                    scales: {
                        x: { 
                            display: false,
                            max: 100
                        },
                        y: { 
                            grid: { display: false },
                            ticks: { font: { family: "'Be Vietnam Pro'" }, color: '#F5F3F4' }
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
