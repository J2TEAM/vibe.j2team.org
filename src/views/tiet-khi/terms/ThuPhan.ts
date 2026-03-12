export const ThuPhan = `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Thu Phân: Điểm Cân Bằng Của Sự Tĩnh Lặng</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    
    <!-- Fonts: Philosopher (Tiêu đề - Sâu sắc), Be Vietnam Pro (Nội dung - Minh bạch), Dancing Script (Thơ - Lãng mạn) -->
    <link href="https://fonts.googleapis.com/css2?family=Philosopher:ital,wght@0,400;0,700;1,400;1,700&family=Be+Vietnam+Pro:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400&family=Dancing+Script:wght@400;700&display=swap" rel="stylesheet">
    
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        'night-indigo': '#14213D',  // Xanh đêm thẫm (Âm khí/Tĩnh lặng)
                        'moon-gold': '#FCA311',     // Vàng trăng (Tế Nguyệt/Mùa gặt)
                        'balance-gray': '#E5E5E5',  // Xám cân bằng (Trung đạo)
                        'rice-beige': '#F4F1DE',    // Màu lúa chín/Giấy cũ
                        'deep-rust': '#9D0208',     // Đỏ trầm (Lá thu)
                        'cool-text': '#FFFFFF'      // Chữ trắng
                    },
                    fontFamily: {
                        serif: ['"Philosopher"', 'serif'],
                        sans: ['"Be Vietnam Pro"', 'sans-serif'],
                        script: ['"Dancing Script"', 'cursive'],
                    },
                    animation: {
                        'pulse-moon': 'pulseMoon 4s infinite',
                    },
                    keyframes: {
                        pulseMoon: {
                            '0%, 100%': { boxShadow: '0 0 20px #FCA311' },
                            '50%': { boxShadow: '0 0 50px #FCA311' },
                        }
                    }
                }
            }
        }
    </script>
    <style>
        body {
            background-color: #14213D;
            color: #E5E5E5;
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
        /* Moon & Stars Canvas Layer */
        #nightCanvas {
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
            border: 1px solid rgba(252, 163, 17, 0.2);
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(10px);
        }
        .card-interaction:hover {
            transform: translateY(-5px);
            border-color: #FCA311;
            box-shadow: 0 10px 30px -10px rgba(252, 163, 17, 0.3);
            background: rgba(255, 255, 255, 0.1);
        }
        .active-tab {
            background-color: #FCA311;
            color: #14213D;
            border-color: #FCA311;
        }
        .no-scrollbar::-webkit-scrollbar {
            display: none;
        }
        .no-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
    </style>
    <!-- Chosen Palette: "Autumn Night" - Indigo, Moon Gold, Beige -->
    <!-- Application Structure Plan:
        1. Hero: Title with "Full Moon" visual cue (Canvas animation).
        2. Thien Tuong (Cosmic): Chart showing 180° & Equal Day/Night split.
        3. Tam Hau (Nature): 3 Micro-seasons (Thunder stops, Insects hibernate, Water dries).
        4. Doi Song (Life): Tabs for Agriculture ("Rice Heading") & Customs ("Moon Worship").
        5. Duong Sinh (Health): "Balance Yin/Yang" - Food Filter (Moist/Neutral vs Spicy/Hot).
        6. Chiem Nghiem (Philosophy): The Middle Way (Trung Dao) & Calmness.
        7. Footer: Copyright Tich Phong Thien Son.
    -->
    <!-- Visualization & Content Choices:
        1. Solar Gauge: Chart.js Doughnut (180°).
        2. Day/Night Equality: Pie Chart showing exact 50/50 split.
        3. Food Filter: Logic for Lung-moistening foods (Sesame, Honey, Crab with Ginger).
        4. Night Animation: HTML5 Canvas for twinkling stars.
    -->
    <!-- CONFIRMATION: NO SVG graphics used. NO Mermaid JS used. -->
</head>
<body class="font-sans antialiased leading-relaxed selection:bg-moon-gold selection:text-night-indigo">

    <!-- Background Animation -->
    <canvas id="nightCanvas"></canvas>

    <!-- Navigation -->
    <nav class="sticky top-0 z-50 bg-[#14213D]/90 backdrop-blur-md border-b border-moon-gold/20 shadow-lg transition-all duration-300">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between h-20 items-center">
                <div class="flex-shrink-0 flex items-center gap-3">
                    <span class="text-3xl filter drop-shadow-sm animate-pulse-moon rounded-full">🌕</span>
                    <div class="flex flex-col">
                        <span class="text-2xl font-serif font-bold text-moon-gold tracking-wide">Thu Phân</span>
                        <span class="text-xs font-sans text-balance-gray uppercase tracking-widest font-bold">Điểm Cân Bằng</span>
                    </div>
                </div>
                <div class="hidden md:flex space-x-10">
                    <button onclick="scrollToSection('y-nghia')" class="text-balance-gray hover:text-moon-gold transition font-medium tracking-wide text-sm uppercase">Ý Nghĩa</button>
                    <button onclick="scrollToSection('tam-hau')" class="text-balance-gray hover:text-moon-gold transition font-medium tracking-wide text-sm uppercase">Tam Hậu</button>
                    <button onclick="scrollToSection('doi-song')" class="text-balance-gray hover:text-moon-gold transition font-medium tracking-wide text-sm uppercase">Đời Sống</button>
                    <button onclick="scrollToSection('duong-sinh')" class="text-balance-gray hover:text-moon-gold transition font-medium tracking-wide text-sm uppercase">Dưỡng Sinh</button>
                    <button onclick="scrollToSection('chiem-nghiem')" class="text-balance-gray hover:text-moon-gold transition font-medium tracking-wide text-sm uppercase">Chiêm Nghiệm</button>
                </div>
            </div>
        </div>
    </nav>

    <!-- Hero Section -->
    <header class="relative pt-24 pb-20 px-4 text-center z-10 overflow-hidden">
        <div class="max-w-4xl mx-auto">
            <p class="text-moon-gold font-bold tracking-[0.3em] uppercase mb-6 text-sm font-sans">Tiết Khí Thứ 16 • 22-23 Tháng 9</p>
            <h1 class="text-6xl md:text-8xl font-serif font-bold text-rice-beige mb-6 leading-tight relative inline-block">
                Thu Phân
                <span class="absolute -top-4 -right-12 text-4xl animate-bounce text-moon-gold">⚖️</span>
            </h1>
            <h2 class="text-3xl md:text-5xl font-script text-balance-gray mb-10 font-bold transform -rotate-1">
                Bình Thản & Quân Bình
            </h2>
            <div class="w-32 h-1 bg-gradient-to-r from-moon-gold to-deep-rust mx-auto mb-10 rounded-full shadow-[0_0_15px_#FCA311]"></div>
            <p class="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto leading-loose font-light">
                "Ngày và đêm dài bằng nhau. Âm Dương giao hòa. Đất trời đi vào thế ổn định tuyệt đối, mời gọi con người tìm về sự cân bằng trong tâm hồn."
            </p>
            <div class="mt-14">
                <button onclick="scrollToSection('y-nghia')" class="group relative inline-flex items-center justify-center px-10 py-3 overflow-hidden font-serif italic tracking-wide text-night-indigo transition duration-300 ease-out border-2 border-moon-gold rounded-full shadow-[0_0_20px_#FCA311] bg-moon-gold">
                    <span class="absolute inset-0 flex items-center justify-center w-full h-full text-moon-gold duration-300 -translate-x-full bg-night-indigo group-hover:translate-x-0 ease">
                        <span class="text-xl">☯️</span>
                    </span>
                    <span class="absolute flex items-center justify-center w-full h-full text-night-indigo transition-all duration-300 transform group-hover:translate-x-full ease">Khám Phá</span>
                    <span class="relative invisible">Khám Phá</span>
                </button>
            </div>
        </div>
    </header>

    <!-- Section 1: Ý Nghĩa & Thiên Tượng -->
    <section id="y-nghia" class="py-24 px-4 max-w-6xl mx-auto relative z-10">
        <div class="mb-16 text-center">
            <h3 class="text-4xl font-serif font-bold text-rice-beige mb-4 inline-block relative">
                Chia Đôi Mùa Thu
                <span class="absolute -bottom-2 left-0 w-full h-1 bg-moon-gold"></span>
            </h3>
            <p class="text-gray-400 max-w-2xl mx-auto mt-6 text-lg leading-relaxed">
                Mặt Trời kinh độ 180°. Thời khắc chính giữa của 90 ngày mùa thu. Ngày và đêm cân bằng nhau trên khắp hành tinh.
            </p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <!-- Charts Column -->
            <div class="space-y-10">
                <div class="bg-white/5 p-8 rounded-2xl shadow-lg border border-white/10 relative overflow-hidden backdrop-blur-sm">
                    <h4 class="text-xl font-serif font-bold text-moon-gold mb-2 text-center">Vị Trí Thiên Văn (180°)</h4>
                    <div class="chart-container">
                        <canvas id="solarChart"></canvas>
                    </div>
                </div>
                
                <div class="bg-white/5 p-8 rounded-2xl shadow-lg border border-white/10 backdrop-blur-sm">
                    <h4 class="text-xl font-serif font-bold text-rice-beige mb-2 text-center">Cân Bằng Ngày & Đêm</h4>
                    <div class="chart-container" style="height: 250px;">
                        <canvas id="dayNightChart"></canvas>
                    </div>
                    <p class="text-center text-sm text-gray-400 mt-4 italic">Sự cân bằng hoàn hảo 50/50.</p>
                </div>
            </div>

            <!-- Content Explanation -->
            <div class="space-y-8 text-lg text-gray-300 leading-relaxed font-light">
                <div class="p-6 bg-moon-gold/10 rounded-xl border-l-4 border-moon-gold shadow-[0_0_15px_rgba(252,163,17,0.2)]">
                    <strong class="text-moon-gold font-serif text-xl block mb-2">Quy Luật Tự Nhiên</strong>
                    <p>
                        Dương khí suy giảm, Âm khí chiếm ưu thế. Sau ngày này, đêm sẽ dài hơn ngày (ở Bắc bán cầu), khí lạnh sẽ ngày càng sâu sắc hơn.
                    </p>
                </div>
                <div>
                    <strong class="text-moon-gold font-serif text-xl block mb-2">Ý Nghĩa Tên Gọi</strong>
                    <p>
                        "Thu" là mùa thu, "Phân" là chia đều. Đây là cột mốc chia đôi mùa thu, cũng là lúc chia đều ánh sáng và bóng tối cho nhân gian.
                    </p>
                </div>
            </div>
        </div>
    </section>

    <!-- Section 2: Tam Hậu (Nature) -->
    <section id="tam-hau" class="py-24 relative z-10">
        <div class="max-w-6xl mx-auto px-4">
            <h3 class="text-3xl font-serif font-bold text-balance-gray mb-12 text-center">Tam Hậu: Ba Tín Hiệu Tĩnh Lặng</h3>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                <!-- Card 1 -->
                <div class="card-interaction p-8 rounded-2xl cursor-default group text-center">
                    <div class="w-20 h-20 mx-auto rounded-full bg-moon-gold/20 flex items-center justify-center text-4xl mb-6 group-hover:scale-110 transition shadow-[0_0_15px_#FCA311]">🔇</div>
                    <h5 class="font-bold text-xl text-rice-beige mb-3 font-serif">1. Lôi Thủy Thu Thanh</h5>
                    <p class="text-gray-400 font-light">Sấm bắt đầu thu tiếng. Dương khí suy nên sấm không còn rền vang, nhường chỗ cho sự tĩnh mịch.</p>
                </div>

                <!-- Card 2 -->
                <div class="card-interaction p-8 rounded-2xl cursor-default group text-center">
                    <div class="w-20 h-20 mx-auto rounded-full bg-deep-rust/20 flex items-center justify-center text-4xl mb-6 group-hover:scale-110 transition">🦗</div>
                    <h5 class="font-bold text-xl text-rice-beige mb-3 font-serif">2. Trập Trùng Phôi Hộ</h5>
                    <p class="text-gray-400 font-light">Côn trùng nhỏ vùi mình vào đất, đắp kín cửa hang để chuẩn bị ngủ đông tránh rét.</p>
                </div>

                <!-- Card 3 -->
                <div class="card-interaction p-8 rounded-2xl cursor-default group text-center">
                    <div class="w-20 h-20 mx-auto rounded-full bg-balance-gray/20 flex items-center justify-center text-4xl mb-6 group-hover:scale-110 transition">💧</div>
                    <h5 class="font-bold text-xl text-rice-beige mb-3 font-serif">3. Thủy Thủy Hạc</h5>
                    <p class="text-gray-400 font-light">Nước ao hồ sông suối bắt đầu cạn dần, không khí trở nên hanh khô rõ rệt (Thu táo).</p>
                </div>
            </div>
        </div>
    </section>

    <!-- Section 3: Đời Sống (Tabs) -->
    <section id="doi-song" class="py-24 px-4 bg-white/5 relative z-10 backdrop-blur-sm">
        <div class="max-w-6xl mx-auto">
            <div class="mb-12 text-center">
                <h3 class="text-4xl font-serif font-bold text-moon-gold mb-4">Mùa Gặt & Tế Trăng</h3>
                <p class="text-gray-400 italic">"Thu Phân lúa trổ, cúng trăng rằm"</p>
            </div>

            <!-- Custom Tabs -->
            <div class="flex justify-center mb-10 space-x-4">
                <button onclick="switchTab('phong-tuc')" id="btn-phong-tuc" class="active-tab px-8 py-3 rounded-full border border-moon-gold font-bold transition duration-300 font-serif tracking-wide shadow-[0_0_15px_#FCA311]">Phong Tục</button>
                <button onclick="switchTab('nong-nghiep')" id="btn-nong-nghiep" class="px-8 py-3 rounded-full border border-moon-gold text-moon-gold font-bold hover:bg-moon-gold hover:text-night-indigo transition duration-300 font-serif tracking-wide shadow-sm">Nông Nghiệp</button>
            </div>

            <!-- Content Area -->
            <div class="bg-[#0f172a] p-8 md:p-12 rounded-3xl border border-white/10 min-h-[400px] flex items-center shadow-2xl relative overflow-hidden">
                <div class="absolute top-0 right-0 w-40 h-40 bg-moon-gold/10 rounded-bl-full pointer-events-none blur-3xl"></div>

                <!-- Phong Tuc Content -->
                <div id="content-phong-tuc" class="grid grid-cols-1 md:grid-cols-2 gap-10 w-full animate-fade-in">
                    <div class="flex flex-col justify-center">
                        <h4 class="text-3xl font-serif font-bold text-rice-beige mb-6">Tế Nguyệt & Trung Thu</h4>
                        <p class="text-gray-300 leading-relaxed mb-6">
                            Gốc rễ của Tết Trung Thu. Lễ tế Mặt Trăng cầu mong đoàn viên và mùa màng bội thu.
                        </p>
                        <ul class="space-y-4 text-gray-400 font-light">
                            <li class="flex items-start gap-3">
                                <span class="text-moon-gold font-bold">🌕</span>
                                <span><strong>Tế Trăng:</strong> Cúng trăng rằm, ăn bánh trung thu.</span>
                            </li>
                            <li class="flex items-start gap-3">
                                <span class="text-balance-gray font-bold">🥚</span>
                                <span><strong>Dựng Trứng:</strong> Tục lệ dựng trứng đứng để cầu may mắn.</span>
                            </li>
                            <li class="flex items-start gap-3">
                                <span class="text-deep-rust font-bold">🥬</span>
                                <span><strong>Ăn Rau Thu:</strong> Hái rau dền cơm để bồi bổ sức khỏe.</span>
                            </li>
                        </ul>
                    </div>
                    <div class="flex items-center justify-center bg-white/5 rounded-2xl p-6 border border-dashed border-white/20">
                        <div class="text-center">
                            <div class="text-9xl mb-4 opacity-80 animate-pulse">🥮</div>
                            <p class="font-script text-2xl text-moon-gold">Đoàn viên dưới trăng</p>
                        </div>
                    </div>
                </div>

                <!-- Nong Nghiep Content -->
                <div id="content-nong-nghiep" class="hidden grid-cols-1 md:grid-cols-2 gap-10 w-full animate-fade-in">
                    <!-- Card 1 -->
                    <div class="bg-white/5 p-8 rounded-2xl border-l-4 border-moon-gold hover:bg-white/10 transition group">
                        <div class="text-5xl mb-4 group-hover:scale-110 transition duration-300">🌾</div>
                        <h4 class="text-2xl font-serif font-bold text-rice-beige mb-3">Lúa Mùa Trổ Bông</h4>
                        <p class="text-gray-400 leading-relaxed font-light">
                            Lúa chín vàng đồng. Tranh thủ gặt hái, phơi phóng trước khi mưa lạnh ập đến. "Thu Phân cày cấy, Bạch Lộ gặt".
                        </p>
                    </div>
                    <!-- Card 2 -->
                    <div class="bg-white/5 p-8 rounded-2xl border-l-4 border-deep-rust hover:bg-white/10 transition group">
                        <div class="text-5xl mb-4 group-hover:scale-110 transition duration-300">🚜</div>
                        <h4 class="text-2xl font-serif font-bold text-rice-beige mb-3">Vụ Đông Sắp Tới</h4>
                        <p class="text-gray-400 leading-relaxed font-light">
                            Chuẩn bị đất đai cho vụ đông. Sự xoay vần của các vụ mùa gối nhau không nghỉ.
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
                    <span class="text-moon-gold font-bold tracking-widest uppercase text-sm">Cân Bằng • Thu Liễm</span>
                    <h3 class="text-4xl font-serif font-bold text-rice-beige mt-2 mb-6">Dưỡng Âm, Nhuận Táo</h3>
                    <p class="text-gray-400 text-lg leading-relaxed mb-6">
                        Khí trời hanh khô (Thu táo) hại tân dịch. Cần ăn uống để giữ nước, cân bằng Âm Dương.
                    </p>
                    <div class="bg-white/5 p-6 rounded-xl border-l-4 border-balance-gray shadow-sm">
                        <h4 class="font-bold text-lg text-balance-gray mb-2 font-serif">Nguyên Tắc Ẩm Thực</h4>
                        <p class="text-gray-300 mb-2"><strong>Đồ Nhuận:</strong> Vừng, hạt dẻ, mật ong giúp sinh tân dịch.</p>
                        <p class="text-gray-300"><strong>Tránh Cay:</strong> Hành, tỏi, ớt làm hao tổn khí âm.</p>
                    </div>
                </div>

                <div class="space-y-4 font-sans text-gray-400">
                    <div class="flex items-center gap-4 p-3 bg-white/5 rounded-lg border border-white/10">
                        <div class="w-10 h-10 rounded-full bg-moon-gold/20 flex items-center justify-center text-xl text-white">🦀</div>
                        <div>
                            <strong>Cua Đồng:</strong> Ngon nhưng hàn. Ăn kèm gừng, tía tô để cân bằng.
                        </div>
                    </div>
                    <div class="flex items-center gap-4 p-3 bg-white/5 rounded-lg border border-white/10">
                        <div class="w-10 h-10 rounded-full bg-moon-gold/20 flex items-center justify-center text-xl text-white">🧥</div>
                        <div>
                            <strong>Giữ Ấm:</strong> "Xuân ô thu đống". Giữ ấm rốn và chân khi gió lạnh về.
                        </div>
                    </div>
                </div>
            </div>

            <!-- Right: Interactive Food Filter -->
            <div class="lg:col-span-7">
                <div class="bg-white/5 rounded-3xl shadow-lg border border-white/10 overflow-hidden flex flex-col h-full backdrop-blur-sm">
                    <div class="bg-gradient-to-r from-night-indigo to-[#243B55] p-8 text-white border-b border-white/10">
                        <h4 class="text-2xl font-serif font-bold flex items-center gap-3">
                            <span>🍵</span> Thực Đơn Cân Bằng
                        </h4>
                        <p class="opacity-90 mt-2 font-light text-sm">Chọn thực phẩm dưỡng âm, trị khô.</p>
                    </div>

                    <!-- Filters -->
                    <div class="p-6 border-b border-white/10 flex gap-3 overflow-x-auto no-scrollbar">
                        <button onclick="filterFood('all')" class="food-btn active px-5 py-2 rounded-full text-sm font-bold bg-white/10 text-gray-300 hover:bg-white/20 transition whitespace-nowrap" data-filter="all">Tất Cả</button>
                        <button onclick="filterFood('good')" class="food-btn px-5 py-2 rounded-full text-sm font-bold bg-white/10 text-gray-300 hover:bg-white/20 transition whitespace-nowrap" data-filter="good">Nên Dùng (Nhuận/Hạt)</button>
                        <button onclick="filterFood('bad')" class="food-btn px-5 py-2 rounded-full text-sm font-bold bg-white/10 text-gray-300 hover:bg-white/20 transition whitespace-nowrap" data-filter="bad">Hạn Chế (Cay/Nóng)</button>
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
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-moon-gold/10 rounded-full blur-[100px] pointer-events-none"></div>

        <div class="max-w-3xl mx-auto relative z-10 text-center">
            <span class="text-6xl text-moon-gold font-serif opacity-50 block mb-6">❝</span>
            
            <h3 class="text-4xl md:text-5xl font-serif font-bold mb-10 text-rice-beige leading-tight">
                Đạo Của Sự Cân Bằng:<br>Trung Đạo
            </h3>
            
            <p class="text-xl text-gray-300 leading-loose mb-12 font-sans font-light">
                Hạnh phúc bền vững nằm ở sự cân bằng. Khi lòng ta tĩnh tại, không nghiêng về bên nào, ta mới nhìn thấy vẻ đẹp chân thực của vạn vật. Hãy nhẹ nhàng điều chỉnh lại cán cân cuộc sống để tâm hồn được "Thu Phân" - sáng rõ và an nhiên.
            </p>

            <div class="inline-block border border-white/20 rounded-2xl p-10 bg-white/5 backdrop-blur-sm hover:border-moon-gold transition duration-500 cursor-default group">
                <p class="font-bold uppercase tracking-[0.2em] text-sm text-balance-gray mb-6 font-sans group-hover:text-white transition">Lời Chúc Thu Phân</p>
                <div class="text-3xl md:text-4xl font-script text-moon-gold leading-relaxed group-hover:scale-105 transition duration-500 shadow-text">
                    "Tâm bình khí hòa,<br>An nhiên tự tại."
                </div>
            </div>
            
            <span class="text-6xl text-moon-gold font-serif opacity-50 block mt-12">❞</span>
        </div>
    </section>

    <!-- Footer -->
    <footer class="bg-black text-gray-500 py-12 text-center text-sm font-sans border-t border-white/10">
        <p class="italic tracking-wide mb-3 text-gray-600">Biên soạn dựa trên nguyên lý 24 Tiết khí & Văn hóa Phương Đông</p>
        <p class="text-gray-500">© Bản quyền thuộc về <span class="font-script text-xl text-moon-gold ml-1">Tịch Phong Thiên Sơn - 夕风天山</span></p>
    </footer>

    <!-- Javascript Logic -->
    <script>
        // --- Data ---
        const foodData = [
            { name: "Vừng (Mè)", type: "good", icon: "🌾", desc: "Nhuận tràng, dưỡng huyết, đen tóc" },
            { name: "Hạt Dẻ", type: "good", icon: "🌰", desc: "Bổ thận khí, mạnh gân cốt" },
            { name: "Mật Ong", type: "good", icon: "🍯", desc: "Sinh tân dịch, nhuận phế" },
            { name: "Cua Đồng", type: "good", icon: "🦀", desc: "Béo ngậy, nhưng cần ăn với gừng" },
            { name: "Lê/Mía", type: "good", icon: "🍐", desc: "Trừ khô, mát họng" },
            { name: "Nấm Tuyết", type: "good", icon: "🍄", desc: "Dưỡng âm, làm đẹp da" },
            { name: "Ớt", type: "bad", icon: "🌶️", desc: "Quá cay, hại khí âm" },
            { name: "Hành Tỏi", type: "bad", icon: "🧄", desc: "Tính phát tán, đi ngược sự thu liễm" },
            { name: "Gừng", type: "bad", icon: "🫚", desc: "Ăn ít vào buổi tối mùa thu" }
        ];

        // --- Tab Logic ---
        function switchTab(tab) {
            document.getElementById('content-nong-nghiep').classList.add('hidden');
            document.getElementById('content-nong-nghiep').classList.remove('grid');
            document.getElementById('content-phong-tuc').classList.add('hidden');
            document.getElementById('content-phong-tuc').classList.remove('grid');

            document.getElementById('btn-nong-nghiep').classList.remove('active-tab', 'text-night-indigo');
            document.getElementById('btn-nong-nghiep').classList.add('text-rice-beige');
            document.getElementById('btn-phong-tuc').classList.remove('active-tab', 'text-night-indigo');
            document.getElementById('btn-phong-tuc').classList.add('text-rice-beige');

            const content = document.getElementById(\`content-\${tab}\`);
            content.classList.remove('hidden');
            content.classList.add('grid');
            
            const btn = document.getElementById(\`btn-\${tab}\`);
            btn.classList.add('active-tab');
            btn.classList.remove('text-rice-beige');
        }

        // --- Food Filter Logic ---
        function filterFood(filter) {
            const grid = document.getElementById('food-grid');
            grid.innerHTML = ''; 

            document.querySelectorAll('.food-btn').forEach(btn => {
                if(btn.dataset.filter === filter) {
                    btn.classList.add('bg-moon-gold', 'text-night-indigo');
                    btn.classList.remove('bg-white/10', 'text-gray-300');
                } else {
                    btn.classList.remove('bg-moon-gold', 'text-night-indigo');
                    btn.classList.add('bg-white/10', 'text-gray-300');
                }
            });

            const items = filter === 'all' ? foodData : foodData.filter(i => i.type === filter);

            items.forEach(item => {
                const el = document.createElement('div');
                let colorClass = item.type === 'good' 
                    ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500' 
                    : 'bg-red-500/10 border-red-500/30 text-red-400 opacity-70';

                el.className = \`\${colorClass} border rounded-xl p-4 flex flex-col items-center text-center transition hover:scale-105 cursor-default group backdrop-blur-md\`;
                el.innerHTML = \`
    <div class="text-4xl mb-3 transform group-hover:scale-110 transition shadow-text">\${item.icon} </div>
        <div class="font-serif font-bold text-base mb-1 tracking-wide shadow-text">\${item.name} </div>
            <div class="text-xs font-sans shadow-text">\${item.desc} </div>
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

        // --- Canvas Animation (Stars) ---
        function initNightCanvas() {
            const canvas = document.getElementById('nightCanvas');
            const ctx = canvas.getContext('2d');
            let width, height;
            let stars = [];

            function resize() {
                width = window.innerWidth;
                height = window.innerHeight;
                canvas.width = width;
                canvas.height = height;
            }
            window.addEventListener('resize', resize);
            resize();

            class Star {
                constructor() {
                    this.x = Math.random() * width;
                    this.y = Math.random() * height;
                    this.radius = Math.random() * 1.5;
                    this.alpha = Math.random();
                    this.twinkleSpeed = Math.random() * 0.02 + 0.005;
                }
                update() {
                    this.alpha += this.twinkleSpeed;
                    if (this.alpha >= 1 || this.alpha <= 0) {
                        this.twinkleSpeed = -this.twinkleSpeed;
                    }
                }
                draw() {
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                    ctx.fillStyle = \`rgba(255, 255, 255, \${Math.abs(this.alpha)})\`;
                    ctx.fill();
                }
            }

            for(let i=0; i<150; i++) stars.push(new Star());

            function animate() {
                ctx.clearRect(0, 0, width, height);
                stars.forEach(s => {
                    s.update();
                    s.draw();
                });
                requestAnimationFrame(animate);
            }
            animate();
        }

        // --- Init ---
        document.addEventListener('DOMContentLoaded', () => {
            initNightCanvas();
            filterFood('all');

            // Chart 1: Solar Term 180 deg
            const ctx1 = document.getElementById('solarChart').getContext('2d');
            new Chart(ctx1, {
                type: 'doughnut',
                data: {
                    labels: ['Thu Phân', 'Hàn Lộ', 'Sương Giáng', 'Mùa Khác'],
                    datasets: [{
                        data: [15, 15, 15, 315],
                        backgroundColor: ['#FCA311', '#E5E5E5', '#9D0208', '#14213D'],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    rotation: 90, 
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
                        ctx.fillStyle = "#FCA311";
                        var text = "180°",
                            textX = Math.round((width - ctx.measureText(text).width) / 2),
                            textY = height / 2;
                        ctx.fillText(text, textX, textY);
                        ctx.save();
                    }
                }]
            });

            // Chart 2: Day/Night Equality (Pie)
            const ctx2 = document.getElementById('dayNightChart').getContext('2d');
            new Chart(ctx2, {
                type: 'pie',
                data: {
                    labels: ['Ban Ngày', 'Ban Đêm'],
                    datasets: [
                        {
                            data: [50, 50],
                            backgroundColor: ['#FCA311', '#14213D'], // Moon Gold vs Night Blue
                            borderWidth: 0
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { 
                            position: 'bottom',
                            labels: { font: { family: "'Be Vietnam Pro'" }, color: '#E5E5E5' }
                        }
                    }
                }
            });
        });
    </script>
</body>
</html>
`
