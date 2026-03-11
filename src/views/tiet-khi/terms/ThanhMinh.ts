export const ThanhMinh = `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Thanh Minh: Bầu Trời Trong Sáng & Lễ Tảo Mộ Tri Ân</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    
    <!-- Fonts: Philosopher (Tiêu đề - Trang nhã), Be Vietnam Pro (Nội dung - Mạch lạc), Dancing Script (Thơ - Bay bổng) -->
    <link href="https://fonts.googleapis.com/css2?family=Philosopher:ital,wght@0,400;0,700;1,400;1,700&family=Be+Vietnam+Pro:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400&family=Dancing+Script:wght@400;700&display=swap" rel="stylesheet">
    
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        'pure-sky': '#A7C7E7',      // Xanh trời trong (Thanh)
                        'emerald-green': '#50C878', // Xanh cỏ non (Minh/Sinh khí)
                        'sacred-earth': '#8D6E63',  // Nâu đất (Tảo mộ/Thổ)
                        'incense-smoke': '#F5F5F5', // Trắng khói hương (Tĩnh tại)
                        'deep-text': '#2C3E50',     // Xanh đen (Trang nghiêm)
                        'warm-sun': '#FFD700'       // Vàng nắng (Dương khí)
                    },
                    fontFamily: {
                        serif: ['"Philosopher"', 'serif'],
                        sans: ['"Be Vietnam Pro"', 'sans-serif'],
                        script: ['"Dancing Script"', 'cursive'],
                    },
                    animation: {
                        'float-kite': 'floatKite 8s ease-in-out infinite',
                    },
                    keyframes: {
                        floatKite: {
                            '0%, 100%': { transform: 'translateY(0) rotate(5deg)' },
                            '50%': { transform: 'translateY(-20px) rotate(-5deg)' },
                        }
                    }
                }
            }
        }
    </script>
    <style>
        body {
            background-color: #F5F5F5;
            color: #2C3E50;
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
        /* Kite/Cloud Canvas Layer */
        #kiteCanvas {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 0;
            opacity: 0.3;
        }
        /* Interactions */
        .card-interaction {
            transition: all 0.3s ease-out;
            border: 1px solid transparent;
        }
        .card-interaction:hover {
            transform: translateY(-5px);
            border-color: #50C878;
            box-shadow: 0 10px 30px -10px rgba(80, 200, 120, 0.2);
            background-color: white;
        }
        .active-tab {
            background-color: #50C878;
            color: white;
            border-color: #50C878;
        }
        .no-scrollbar::-webkit-scrollbar {
            display: none;
        }
        .no-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
    </style>
    <!-- Chosen Palette: "Pure Clarity" - Sky Blue, Fresh Green, Earth Brown, Soft White -->
    <!-- Application Structure Plan:
        1. Hero: Title with "Kite Flying" visual cue (Canvas animation).
        2. Thien Tuong (Cosmic): Chart showing 15° & Brightness/Clearness Index.
        3. Tam Hau (Nature): 3 Micro-seasons (Paulownia, Field Mouse/Quail, Rainbow).
        4. Doi Song (Life): Tabs for Rituals ("Tomb Sweeping") & Agriculture ("Planting Melons").
        5. Duong Sinh (Health): "Calm Liver" - Food Filter (Bland/Cool vs Spicy/Hot).
        6. Chiem Nghiem (Philosophy): Cycle of Life & Death (Gratitude).
        7. Footer: Copyright Tich Phong Thien Son.
    -->
    <!-- Visualization & Content Choices:
        1. Solar Gauge: Chart.js Doughnut (15°).
        2. Clearness Index: Radar Chart (Brightness, Freshness, Growth).
        3. Food Filter: Logic for Liver-calming foods.
        4. Kite Animation: HTML5 Canvas for the "Release" concept.
    -->
    <!-- CONFIRMATION: NO SVG graphics used. NO Mermaid JS used. -->
</head>
<body class="font-sans antialiased leading-relaxed selection:bg-emerald-green selection:text-white">

    <!-- Background Animation -->
    <canvas id="kiteCanvas"></canvas>

    <!-- Navigation -->
    <nav class="sticky top-0 z-50 bg-incense-smoke/95 backdrop-blur-md border-b border-pure-sky/20 shadow-sm transition-all duration-300">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between h-20 items-center">
                <div class="flex-shrink-0 flex items-center gap-3">
                    <span class="text-3xl filter drop-shadow-sm animate-float-kite">🪁</span>
                    <div class="flex flex-col">
                        <span class="text-2xl font-serif font-bold text-deep-text tracking-wide">Thanh Minh</span>
                        <span class="text-xs font-sans text-emerald-green uppercase tracking-widest font-bold">Trong Sáng & Tri Ân</span>
                    </div>
                </div>
                <div class="hidden md:flex space-x-10">
                    <button onclick="scrollToSection('y-nghia')" class="text-deep-text hover:text-emerald-green transition font-medium tracking-wide text-sm uppercase">Ý Nghĩa</button>
                    <button onclick="scrollToSection('tam-hau')" class="text-deep-text hover:text-emerald-green transition font-medium tracking-wide text-sm uppercase">Tam Hậu</button>
                    <button onclick="scrollToSection('doi-song')" class="text-deep-text hover:text-emerald-green transition font-medium tracking-wide text-sm uppercase">Đời Sống</button>
                    <button onclick="scrollToSection('duong-sinh')" class="text-deep-text hover:text-emerald-green transition font-medium tracking-wide text-sm uppercase">Dưỡng Sinh</button>
                    <button onclick="scrollToSection('chiem-nghiem')" class="text-deep-text hover:text-emerald-green transition font-medium tracking-wide text-sm uppercase">Chiêm Nghiệm</button>
                </div>
            </div>
        </div>
    </nav>

    <!-- Hero Section -->
    <header class="relative pt-24 pb-20 px-4 text-center z-10 overflow-hidden">
        <div class="max-w-4xl mx-auto">
            <p class="text-emerald-green font-bold tracking-[0.3em] uppercase mb-6 text-sm font-sans">Tiết Khí Thứ 5 • 4-5 Tháng 4</p>
            <h1 class="text-6xl md:text-8xl font-serif font-bold text-deep-text mb-6 leading-tight relative inline-block">
                Thanh Minh
                <span class="absolute -top-4 -right-12 text-4xl animate-pulse text-warm-sun">✨</span>
            </h1>
            <h2 class="text-3xl md:text-5xl font-script text-sacred-earth mb-10 font-bold transform -rotate-1">
                Bầu Trời Trong Sáng - Lễ Tảo Mộ Tri Ân
            </h2>
            <div class="w-24 h-1 bg-pure-sky mx-auto mb-10 rounded-full"></div>
            <p class="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-loose font-light">
                "Không còn mưa bụi, không còn sấm rền. Bầu trời quang đãng, vạn vật tinh khôi. Là lúc con người tìm về cội nguồn, gửi lòng tri ân đến người xưa."
            </p>
            <div class="mt-14">
                <button onclick="scrollToSection('y-nghia')" class="group relative inline-flex items-center justify-center px-10 py-3 overflow-hidden font-serif italic tracking-wide text-white transition duration-300 ease-out border-2 border-emerald-green rounded-full shadow-md bg-emerald-green">
                    <span class="absolute inset-0 flex items-center justify-center w-full h-full text-white duration-300 -translate-x-full bg-sacred-earth group-hover:translate-x-0 ease">
                        <span class="text-xl">🌿</span>
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
            <h3 class="text-4xl font-serif font-bold text-deep-text mb-4 inline-block relative">
                Sự Tinh Khôi Của Đất Trời
                <span class="absolute -bottom-2 left-0 w-full h-1 bg-pure-sky/50"></span>
            </h3>
            <p class="text-gray-600 max-w-2xl mx-auto mt-6 text-lg leading-relaxed">
                Mặt Trời kinh độ 15°. "Thanh" là trong, "Minh" là sáng. Gió Đông Nam thổi mạnh, xua tan mây mù, để lại bầu trời xanh ngắt và không khí trong lành.
            </p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <!-- Charts Column -->
            <div class="space-y-10">
                <div class="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
                    <h4 class="text-xl font-serif font-bold text-emerald-green mb-2 text-center">Vị Trí Thiên Văn (15°)</h4>
                    <div class="chart-container">
                        <canvas id="solarChart"></canvas>
                    </div>
                </div>
                
                <div class="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                    <h4 class="text-xl font-serif font-bold text-deep-text mb-2 text-center">Chỉ Số Khí Hậu</h4>
                    <div class="chart-container" style="height: 300px;">
                        <canvas id="climateRadar"></canvas>
                    </div>
                    <p class="text-center text-sm text-gray-400 mt-4 italic">Đặc trưng: Trong trẻo, Sáng sủa, Tươi mới.</p>
                </div>
            </div>

            <!-- Content Explanation -->
            <div class="space-y-8 text-lg text-gray-600 leading-relaxed font-light">
                <div class="p-6 bg-white rounded-xl border-l-4 border-pure-sky shadow-sm">
                    <strong class="text-deep-text font-serif text-xl block mb-2">Giải Nghĩa Tên Gọi</strong>
                    <p>
                        Không chỉ là một tiết khí, Thanh Minh mô tả trạng thái lý tưởng của bầu trời: Quang đãng, tinh khiết.
                    </p>
                </div>
                <div>
                    <strong class="text-deep-text font-serif text-xl block mb-2">Chuyển Mình Của Thiên Nhiên</strong>
                    <p>
                        Nhiệt độ ấm lên rõ rệt. Những cơn mưa rào nhanh đến nhanh đi thay thế cho mưa phùn dầm dề, gột rửa vạn vật sạch sẽ. Cầu vồng thường xuyên xuất hiện.
                    </p>
                </div>
            </div>
        </div>
    </section>

    <!-- Section 2: Tam Hậu (Nature) -->
    <section id="tam-hau" class="py-24 bg-white relative z-10">
        <div class="max-w-6xl mx-auto px-4">
            <h3 class="text-3xl font-serif font-bold text-emerald-green mb-12 text-center">Tam Hậu: Ba Tín Hiệu Tinh Khôi</h3>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                <!-- Card 1 -->
                <div class="card-interaction bg-incense-smoke p-8 rounded-2xl cursor-default group text-center">
                    <div class="w-20 h-20 mx-auto rounded-full bg-pure-sky/20 flex items-center justify-center text-4xl mb-6 group-hover:scale-110 transition">🌸</div>
                    <h5 class="font-bold text-xl text-deep-text mb-3 font-serif">1. Đồng Thủy Hoa</h5>
                    <p class="text-gray-600 font-light">Cây ngô đồng nở hoa trắng hoặc tím nhạt. Sắc hoa báo hiệu mùa xuân đã đi vào độ chín muồi nhất.</p>
                </div>

                <!-- Card 2 -->
                <div class="card-interaction bg-incense-smoke p-8 rounded-2xl cursor-default group text-center">
                    <div class="w-20 h-20 mx-auto rounded-full bg-sacred-earth/20 flex items-center justify-center text-4xl mb-6 group-hover:scale-110 transition">🐦</div>
                    <h5 class="font-bold text-xl text-deep-text mb-3 font-serif">2. Điền Thử Hóa Vi An</h5>
                    <p class="text-gray-600 font-light">Chuột đồng (ưa tối/âm) biến mất, chim cút (ưa sáng/dương) xuất hiện. Dương khí đã thịnh vượng.</p>
                </div>

                <!-- Card 3 -->
                <div class="card-interaction bg-incense-smoke p-8 rounded-2xl cursor-default group text-center">
                    <div class="w-20 h-20 mx-auto rounded-full bg-warm-sun/20 flex items-center justify-center text-4xl mb-6 group-hover:scale-110 transition">🌈</div>
                    <h5 class="font-bold text-xl text-deep-text mb-3 font-serif">3. Hồng Thủy Kiến</h5>
                    <p class="text-gray-600 font-light">Cầu vồng xuất hiện sau cơn mưa. Biểu tượng tuyệt đẹp của sự giao hòa giữa Nắng và Mưa, Trời và Đất.</p>
                </div>
            </div>
        </div>
    </section>

    <!-- Section 3: Đời Sống (Tabs) -->
    <section id="doi-song" class="py-24 px-4 bg-incense-smoke relative z-10">
        <div class="max-w-6xl mx-auto">
            <div class="mb-12 text-center">
                <h3 class="text-4xl font-serif font-bold text-deep-text mb-4">Giao Cảm Người & Đất</h3>
                <p class="text-gray-600 italic">"Lễ là tảo mộ, hội là đạp thanh"</p>
            </div>

            <!-- Custom Tabs -->
            <div class="flex justify-center mb-10 space-x-4">
                <button onclick="switchTab('phong-tuc')" id="btn-phong-tuc" class="active-tab px-8 py-3 rounded-full border border-emerald-green font-bold transition duration-300 font-serif tracking-wide shadow-sm">Phong Tục</button>
                <button onclick="switchTab('nong-nghiep')" id="btn-nong-nghiep" class="px-8 py-3 rounded-full border border-emerald-green text-emerald-green font-bold hover:bg-emerald-green hover:text-white transition duration-300 font-serif tracking-wide shadow-sm">Nông Nghiệp</button>
            </div>

            <!-- Content Area -->
            <div class="bg-white p-8 md:p-12 rounded-3xl border border-gray-100 min-h-[400px] flex items-center shadow-sm relative overflow-hidden">
                <div class="absolute top-0 right-0 w-32 h-32 bg-pure-sky/10 rounded-bl-full pointer-events-none"></div>

                <!-- Phong Tuc Content -->
                <div id="content-phong-tuc" class="grid grid-cols-1 md:grid-cols-2 gap-10 w-full animate-fade-in">
                    <div class="flex flex-col justify-center">
                        <h4 class="text-3xl font-serif font-bold text-sacred-earth mb-6">Tảo Mộ & Đạp Thanh</h4>
                        <p class="text-gray-700 leading-relaxed mb-6">
                            Sự kết nối thiêng liêng giữa người sống và tổ tiên, giữa con người và thiên nhiên.
                        </p>
                        <ul class="space-y-4 text-gray-600 font-light">
                            <li class="flex items-start gap-3">
                                <span class="text-emerald-green font-bold">🕯️</span>
                                <span><strong>Tảo Mộ:</strong> Dọn dẹp phần mộ, thắp hương tri ân nguồn cội.</span>
                            </li>
                            <li class="flex items-start gap-3">
                                <span class="text-emerald-green font-bold">🌱</span>
                                <span><strong>Đạp Thanh:</strong> Du xuân trên cỏ xanh, hòa mình vào sinh khí.</span>
                            </li>
                            <li class="flex items-start gap-3">
                                <span class="text-emerald-green font-bold">🪁</span>
                                <span><strong>Thả Diều:</strong> Xả bỏ xui xẻo, bệnh tật bay lên trời cao.</span>
                            </li>
                        </ul>
                    </div>
                    <div class="flex items-center justify-center bg-incense-smoke rounded-2xl p-6 border border-dashed border-gray-300">
                        <div class="text-center">
                            <div class="text-9xl mb-4 opacity-80 animate-pulse">🙏</div>
                            <p class="font-script text-2xl text-deep-text">Uống nước nhớ nguồn</p>
                        </div>
                    </div>
                </div>

                <!-- Nong Nghiep Content -->
                <div id="content-nong-nghiep" class="hidden grid-cols-1 md:grid-cols-2 gap-10 w-full animate-fade-in">
                    <!-- Card 1 -->
                    <div class="bg-incense-smoke p-8 rounded-2xl border-l-4 border-emerald-green hover:bg-gray-50 transition group">
                        <div class="text-5xl mb-4 group-hover:scale-110 transition duration-300">🍈</div>
                        <h4 class="text-2xl font-serif font-bold text-deep-text mb-3">Trồng Dưa Trỉa Đậu</h4>
                        <p class="text-gray-600 leading-relaxed font-light">
                            "Thanh Minh xuống mạ, Cốc Vũ trồng bông". Thời tiết ấm áp là điều kiện vàng để gieo trồng các loại hoa màu vụ Nam.
                        </p>
                    </div>
                    <!-- Card 2 -->
                    <div class="bg-incense-smoke p-8 rounded-2xl border-l-4 border-pure-sky hover:bg-gray-50 transition group">
                        <div class="text-5xl mb-4 group-hover:scale-110 transition duration-300">🌾</div>
                        <h4 class="text-2xl font-serif font-bold text-deep-text mb-3">Chăm Sóc Lúa Chiêm</h4>
                        <p class="text-gray-600 leading-relaxed font-light">
                            Lúa chiêm đang thì con gái, cần được chăm sóc kỹ lưỡng để đón đòng, hứa hẹn một mùa vụ bội thu.
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
                    <span class="text-emerald-green font-bold tracking-widest uppercase text-sm">Hành Mộc • Tạng Can</span>
                    <h3 class="text-4xl font-serif font-bold text-deep-text mt-2 mb-6">Điều Hòa Can Khí</h3>
                    <p class="text-gray-600 text-lg leading-relaxed mb-6">
                        Gan hoạt động mạnh nhất (Vượng). Cần tránh Can hỏa bốc lên gây chóng mặt, cáu gắt.
                    </p>
                    <div class="bg-white p-6 rounded-xl border-l-4 border-emerald-green shadow-sm">
                        <h4 class="font-bold text-lg text-emerald-green mb-2 font-serif">Nguyên Tắc Ẩm Thực</h4>
                        <p class="text-gray-600 mb-2"><strong>Thanh Đạm:</strong> Ưu tiên rau củ mát gan, giải nhiệt.</p>
                        <p class="text-gray-600"><strong>Hạn Chế Bổ Béo:</strong> Tránh đồ cay nóng, quá nhiều đạm gây gánh nặng cho gan.</p>
                    </div>
                </div>

                <div class="space-y-4 font-sans text-gray-700">
                    <div class="flex items-center gap-4 p-3 bg-white rounded-lg shadow-sm">
                        <div class="w-10 h-10 rounded-full bg-pure-sky/10 flex items-center justify-center text-xl">🚶</div>
                        <div>
                            <strong>Vận Động:</strong> Đi bộ ngoài trời, hít thở "thanh khí", thải trừ "trược khí".
                        </div>
                    </div>
                    <div class="flex items-center gap-4 p-3 bg-white rounded-lg shadow-sm">
                        <div class="w-10 h-10 rounded-full bg-pure-sky/10 flex items-center justify-center text-xl">😌</div>
                        <div>
                            <strong>Tinh Thần:</strong> Biến nỗi buồn tảo mộ thành lòng biết ơn nhẹ nhàng. Giữ tâm khoáng đạt.
                        </div>
                    </div>
                </div>
            </div>

            <!-- Right: Interactive Food Filter -->
            <div class="lg:col-span-7">
                <div class="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden flex flex-col h-full">
                    <div class="bg-deep-text p-8 text-white">
                        <h4 class="text-2xl font-serif font-bold flex items-center gap-3">
                            <span>🍵</span> Thực Đơn Thanh Nhiệt
                        </h4>
                        <p class="opacity-90 mt-2 font-light text-sm">Chọn thực phẩm giúp mát gan, sáng mắt.</p>
                    </div>

                    <!-- Filters -->
                    <div class="p-6 border-b border-gray-100 flex gap-3 overflow-x-auto no-scrollbar">
                        <button onclick="filterFood('all')" class="food-btn active px-5 py-2 rounded-full text-sm font-bold bg-gray-100 text-gray-600 hover:bg-gray-200 transition whitespace-nowrap" data-filter="all">Tất Cả</button>
                        <button onclick="filterFood('good')" class="food-btn px-5 py-2 rounded-full text-sm font-bold bg-gray-100 text-gray-600 hover:bg-gray-200 transition whitespace-nowrap" data-filter="good">Nên Dùng (Mát/Thanh)</button>
                        <button onclick="filterFood('bad')" class="food-btn px-5 py-2 rounded-full text-sm font-bold bg-gray-100 text-gray-600 hover:bg-gray-200 transition whitespace-nowrap" data-filter="bad">Hạn Chế (Nóng/Dị Ứng)</button>
                    </div>

                    <!-- Grid -->
                    <div id="food-grid" class="p-6 grid grid-cols-2 sm:grid-cols-3 gap-4 overflow-y-auto max-h-[500px] bg-incense-smoke">
                        <!-- JS populated -->
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Section 5: Chiêm Nghiệm (Philosophy) -->
    <section id="chiem-nghiem" class="py-32 bg-deep-text text-white text-center px-4 relative overflow-hidden">
        <!-- Abstract Background Shape -->
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-pure-sky/20 rounded-full blur-[100px] pointer-events-none"></div>

        <div class="max-w-3xl mx-auto relative z-10">
            <span class="text-6xl text-gray-500 font-serif opacity-50 block mb-6">❝</span>
            
            <h3 class="text-4xl md:text-5xl font-serif font-bold mb-10 text-white leading-tight">
                Sự Sống & Cái Chết:<br>Vòng Luân Hồi
            </h3>
            
            <p class="text-xl text-gray-300 leading-loose mb-12 font-sans font-light">
                Thanh Minh là lúc ta nhận ra cái chết không phải là kết thúc, mà là sự tiếp nối. Cây cỏ xanh tươi mọc lên từ đất, con cháu trưởng thành nhờ phúc đức tổ tiên. "Thanh Minh" cũng là Tâm Trong - gột rửa vẩn đục, sống trọn vẹn từng khoảnh khắc.
            </p>

            <div class="inline-block border border-gray-600 rounded-2xl p-10 bg-white/5 backdrop-blur-sm hover:bg-white/10 transition duration-500 cursor-default group">
                <p class="font-bold uppercase tracking-[0.2em] text-sm text-pure-sky mb-6 font-sans group-hover:text-white transition">Lời Chúc Thanh Minh</p>
                <div class="text-3xl md:text-4xl font-script text-emerald-green leading-relaxed group-hover:scale-105 transition duration-500">
                    "Tâm sáng như gương,<br>Lòng an như đất."
                </div>
            </div>
            
            <span class="text-6xl text-gray-500 font-serif opacity-50 block mt-12">❞</span>
        </div>
    </section>

    <!-- Footer -->
    <footer class="bg-[#1a252f] text-gray-500 py-12 text-center text-sm font-sans border-t border-gray-800">
        <p class="italic tracking-wide mb-3 text-gray-400">Biên soạn dựa trên nguyên lý 24 Tiết khí & Văn hóa Phương Đông</p>
        <p class="text-gray-600">© Bản quyền thuộc về <span class="font-script text-xl text-pure-sky ml-1">Tịch Phong Thiên Sơn - 夕风天山</span></p>
    </footer>

    <!-- Javascript Logic -->
    <script>
        // --- Data ---
        const foodData = [
            { name: "Cải Bó Xôi", type: "good", icon: "🥬", desc: "Dưỡng huyết, mát gan" },
            { name: "Ngải Cứu", type: "good", icon: "🌿", desc: "Ôn kinh, trừ hàn thấp" },
            { name: "Rau Tề Thái", type: "good", icon: "🌱", desc: "Thanh nhiệt, sáng mắt" },
            { name: "Măng Tre", type: "good", icon: "🎍", desc: "Hóa đờm, tiêu thực (ăn vừa)" },
            { name: "Trà Hoa Cúc", type: "good", icon: "🌼", desc: "Thanh can, giáng hỏa" },
            { name: "Kỷ Tử", type: "good", icon: "🍒", desc: "Bổ gan thận, sáng mắt" },
            { name: "Tôm Cua", type: "bad", icon: "🦐", desc: "Dễ gây dị ứng mùa này" },
            { name: "Đồ Cay Nóng", type: "bad", icon: "🌶️", desc: "Làm Can hỏa bốc lên" },
            { name: "Măng (Đau Dạ Dày)", type: "bad", icon: "🚫", desc: "Người đau dạ dày nên tránh" }
        ];

        // --- Tab Logic ---
        function switchTab(tab) {
            document.getElementById('content-phong-tuc').classList.add('hidden');
            document.getElementById('content-phong-tuc').classList.remove('grid');
            document.getElementById('content-nong-nghiep').classList.add('hidden');
            document.getElementById('content-nong-nghiep').classList.remove('grid');

            document.getElementById('btn-phong-tuc').classList.remove('active-tab', 'text-white');
            document.getElementById('btn-phong-tuc').classList.add('text-emerald-green');
            document.getElementById('btn-nong-nghiep').classList.remove('active-tab', 'text-white');
            document.getElementById('btn-nong-nghiep').classList.add('text-emerald-green');

            const content = document.getElementById(\`content-\${tab}\`);
            content.classList.remove('hidden');
            content.classList.add('grid');
            
            const btn = document.getElementById(\`btn-\${tab}\`);
            btn.classList.add('active-tab');
            btn.classList.remove('text-emerald-green');
        }

        // --- Food Filter Logic ---
        function filterFood(filter) {
            const grid = document.getElementById('food-grid');
            grid.innerHTML = ''; 

            document.querySelectorAll('.food-btn').forEach(btn => {
                if(btn.dataset.filter === filter) {
                    btn.classList.add('bg-deep-text', 'text-white');
                    btn.classList.remove('bg-gray-100', 'text-gray-600');
                } else {
                    btn.classList.remove('bg-deep-text', 'text-white');
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

        // --- Canvas Animation (Kite) ---
        function initKiteCanvas() {
            const canvas = document.getElementById('kiteCanvas');
            const ctx = canvas.getContext('2d');
            let width, height;
            let kites = [];

            function resize() {
                width = window.innerWidth;
                height = window.innerHeight;
                canvas.width = width;
                canvas.height = height;
            }
            window.addEventListener('resize', resize);
            resize();

            class Kite {
                constructor() {
                    this.x = Math.random() * width;
                    this.y = Math.random() * height + height; // Start below screen
                    this.size = Math.random() * 20 + 10;
                    this.speed = Math.random() * 1 + 0.5;
                    this.sway = Math.random() * 2;
                    this.color = \`rgba(80, 200, 120, \${Math.random() * 0.3 + 0.1})\`; // Emerald tint
                }
                update() {
                    this.y -= this.speed;
                    this.x += Math.sin(this.y * 0.01) * this.sway;
                    if (this.y < -50) {
                        this.y = height + 50;
                        this.x = Math.random() * width;
                    }
                }
                draw() {
                    ctx.save();
                    ctx.translate(this.x, this.y);
                    ctx.rotate(Math.sin(this.y * 0.02) * 0.2); // Gentle rotation
                    
                    ctx.beginPath();
                    ctx.moveTo(0, -this.size);
                    ctx.lineTo(this.size/1.5, 0);
                    ctx.lineTo(0, this.size);
                    ctx.lineTo(-this.size/1.5, 0);
                    ctx.closePath();
                    
                    ctx.fillStyle = this.color;
                    ctx.fill();
                    
                    // Tail
                    ctx.beginPath();
                    ctx.moveTo(0, this.size);
                    ctx.quadraticCurveTo(10, this.size + 20, 0, this.size + 40);
                    ctx.strokeStyle = this.color;
                    ctx.stroke();
                    
                    ctx.restore();
                }
            }

            for(let i=0; i<15; i++) kites.push(new Kite());

            function animate() {
                ctx.clearRect(0, 0, width, height);
                kites.forEach(k => {
                    k.update();
                    k.draw();
                });
                requestAnimationFrame(animate);
            }
            animate();
        }

        // --- Init ---
        document.addEventListener('DOMContentLoaded', () => {
            initKiteCanvas();
            filterFood('all');

            // Chart 1: Solar Term 15 deg
            const ctx1 = document.getElementById('solarChart').getContext('2d');
            new Chart(ctx1, {
                type: 'doughnut',
                data: {
                    labels: ['Thanh Minh', 'Cốc Vũ', 'Lập Hạ', 'Mùa Khác'],
                    datasets: [{
                        data: [15, 15, 15, 315],
                        backgroundColor: ['#50C878', '#A7C7E7', '#FFD700', '#F5F5F5'],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    rotation: -75, 
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
                        ctx.fillStyle = "#50C878";
                        var text = "15°",
                            textX = Math.round((width - ctx.measureText(text).width) / 2),
                            textY = height / 2;
                        ctx.fillText(text, textX, textY);
                        ctx.save();
                    }
                }]
            });

            // Chart 2: Climate Radar
            const ctx2 = document.getElementById('climateRadar').getContext('2d');
            new Chart(ctx2, {
                type: 'radar',
                data: {
                    labels: ['Độ Trong (Thanh)', 'Ánh Sáng (Minh)', 'Nhiệt Độ', 'Mưa Rào', 'Gió Đông Nam'],
                    datasets: [{
                        label: 'Chỉ Số',
                        data: [95, 90, 75, 60, 80],
                        backgroundColor: 'rgba(80, 200, 120, 0.2)',
                        borderColor: '#50C878',
                        pointBackgroundColor: '#50C878',
                        pointBorderColor: '#fff',
                        pointHoverBackgroundColor: '#fff',
                        pointHoverBorderColor: '#50C878'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        r: {
                            angleLines: { color: '#E0E0E0' },
                            grid: { color: '#E0E0E0' },
                            pointLabels: { color: '#2C3E50', font: { family: "'Be Vietnam Pro'", size: 12 } },
                            ticks: { display: false, backdropColor: 'transparent' }
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
