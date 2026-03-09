export const TieuHan = `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tiểu Hàn: Cái Lạnh Thấu Xương & Sự Kiên Cường Của Sự Sống</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    
    <!-- Fonts: Philosopher (Tiêu đề - Uy nghiêm), Be Vietnam Pro (Nội dung - Rõ ràng), Dancing Script (Thơ - Lãng mạn) -->
    <link href="https://fonts.googleapis.com/css2?family=Philosopher:ital,wght@0,400;0,700;1,400;1,700&family=Be+Vietnam+Pro:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400&family=Dancing+Script:wght@400;700&display=swap" rel="stylesheet">
    
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        'ice-core': '#A5F2F3',      // Xanh băng (Lạnh giá nhất)
                        'snow-shadow': '#E0F7FA',   // Trắng bóng tuyết
                        'deep-freeze': '#0077B6',   // Xanh đậm (Hàn khí)
                        'plum-blossom': '#D00000',  // Đỏ mận (Sự sống/Tết)
                        'warm-porridge': '#F4A261', // Cam cháo (Lạp Bát)
                        'night-cold': '#03045E'     // Đêm đông
                    },
                    fontFamily: {
                        serif: ['"Philosopher"', 'serif'],
                        sans: ['"Be Vietnam Pro"', 'sans-serif'],
                        script: ['"Dancing Script"', 'cursive'],
                    },
                    animation: {
                        'shiver': 'shiver 0.5s linear infinite alternate',
                    },
                    keyframes: {
                        shiver: {
                            '0%': { transform: 'translateX(-1px)' },
                            '100%': { transform: 'translateX(1px)' },
                        }
                    }
                }
            }
        }
    </script>
    <style>
        body {
            background-color: #E0F7FA;
            color: #03045E;
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
        /* Blizzard Canvas Layer */
        #blizzardCanvas {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 0;
            opacity: 0.5;
        }
        /* Interactions */
        .card-interaction {
            transition: all 0.3s ease-out;
            border: 1px solid transparent;
            background: rgba(255, 255, 255, 0.85);
            backdrop-filter: blur(5px);
        }
        .card-interaction:hover {
            transform: translateY(-5px);
            border-color: #0077B6;
            box-shadow: 0 10px 30px -10px rgba(0, 119, 182, 0.3);
        }
        .active-tab {
            background-color: #0077B6;
            color: white;
            border-color: #0077B6;
        }
        .no-scrollbar::-webkit-scrollbar {
            display: none;
        }
        .no-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
    </style>
    <!-- Chosen Palette: "Frozen Resilience" - Icy Blues, Deep Navy, Festive Red -->
    <!-- Application Structure Plan:
        1. Hero: Title with "Blizzard" visual cue (Canvas animation).
        2. Thien Tuong (Cosmic): Chart showing 285° & The peak of Coldness ("Tam Cuu").
        3. Tam Hau (Nature): 3 Micro-seasons (Geese return, Magpies nest, Pheasants call).
        4. Doi Song (Life): Tabs for Agriculture ("Protecting Crops") & Customs ("Laba Porridge", "Tet Shopping").
        5. Duong Sinh (Health): "Tonify Qi/Remove Cold" - Food Filter (Mutton/Ginseng vs Cold/Raw).
        6. Chiem Nghiem (Philosophy): Resilience (Kien Cuong) before Dawn.
        7. Footer: Copyright Tich Phong Thien Son.
    -->
    <!-- Visualization & Content Choices:
        1. Solar Gauge: Chart.js Doughnut (285°).
        2. Cold Index: Bar Chart showing perceived temperature vs actual (It feels colder than Da Han).
        3. Food Filter: Logic for High Energy/Warming foods (Laba porridge ingredients).
        4. Blizzard Animation: HTML5 Canvas for fast, wind-blown snow.
    -->
    <!-- CONFIRMATION: NO SVG graphics used. NO Mermaid JS used. -->
</head>
<body class="font-sans antialiased leading-relaxed selection:bg-deep-freeze selection:text-white">

    <!-- Background Animation -->
    <canvas id="blizzardCanvas"></canvas>

    <!-- Navigation -->
    <nav class="sticky top-0 z-50 bg-snow-shadow/90 backdrop-blur-md border-b border-ice-core/50 shadow-sm transition-all duration-300">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between h-20 items-center">
                <div class="flex-shrink-0 flex items-center gap-3">
                    <span class="text-3xl filter drop-shadow-sm animate-shiver">🌬️</span>
                    <div class="flex flex-col">
                        <span class="text-2xl font-serif font-bold text-deep-freeze tracking-wide">Tiểu Hàn</span>
                        <span class="text-xs font-sans text-plum-blossom uppercase tracking-widest font-bold">Lạnh Giá Nhất</span>
                    </div>
                </div>
                <div class="hidden md:flex space-x-10">
                    <button onclick="scrollToSection('y-nghia')" class="text-night-cold hover:text-deep-freeze transition font-medium tracking-wide text-sm uppercase">Ý Nghĩa</button>
                    <button onclick="scrollToSection('tam-hau')" class="text-night-cold hover:text-deep-freeze transition font-medium tracking-wide text-sm uppercase">Tam Hậu</button>
                    <button onclick="scrollToSection('doi-song')" class="text-night-cold hover:text-deep-freeze transition font-medium tracking-wide text-sm uppercase">Đời Sống</button>
                    <button onclick="scrollToSection('duong-sinh')" class="text-night-cold hover:text-deep-freeze transition font-medium tracking-wide text-sm uppercase">Dưỡng Sinh</button>
                    <button onclick="scrollToSection('chiem-nghiem')" class="text-night-cold hover:text-deep-freeze transition font-medium tracking-wide text-sm uppercase">Chiêm Nghiệm</button>
                </div>
            </div>
        </div>
    </nav>

    <!-- Hero Section -->
    <header class="relative pt-24 pb-20 px-4 text-center z-10 overflow-hidden">
        <div class="max-w-4xl mx-auto">
            <p class="text-deep-freeze font-bold tracking-[0.3em] uppercase mb-6 text-sm font-sans">Tiết Khí Thứ 23 • 5-6 Tháng 1</p>
            <h1 class="text-6xl md:text-8xl font-serif font-bold text-night-cold mb-6 leading-tight relative inline-block">
                Tiểu Hàn
                <span class="absolute -top-4 -right-12 text-4xl animate-bounce text-ice-core">❄️</span>
            </h1>
            <h2 class="text-3xl md:text-5xl font-script text-plum-blossom mb-10 font-bold transform -rotate-1 shadow-sm">
                Sự Kiên Cường Trước Bình Minh
            </h2>
            <div class="w-24 h-1 bg-deep-freeze mx-auto mb-10 rounded-full shadow-sm"></div>
            <p class="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-loose font-light">
                "Thời điểm lạnh giá nhất trong năm, thử thách cuối cùng của mùa đông. Nhưng trong cái lạnh cắt da ấy, mầm sống của mùa xuân đang âm thầm chuẩn bị bùng nổ."
            </p>
            <div class="mt-14">
                <button onclick="scrollToSection('y-nghia')" class="group relative inline-flex items-center justify-center px-10 py-3 overflow-hidden font-serif italic tracking-wide text-white transition duration-300 ease-out border-2 border-deep-freeze rounded-full shadow-md bg-deep-freeze">
                    <span class="absolute inset-0 flex items-center justify-center w-full h-full text-deep-freeze duration-300 -translate-x-full bg-ice-core group-hover:translate-x-0 ease">
                        <span class="text-xl">🧊</span>
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
            <h3 class="text-4xl font-serif font-bold text-night-cold mb-4 inline-block relative">
                "Tiểu" Nhưng Không Nhỏ
                <span class="absolute -bottom-2 left-0 w-full h-1 bg-ice-core"></span>
            </h3>
            <p class="text-gray-600 max-w-2xl mx-auto mt-6 text-lg leading-relaxed">
                Mặt Trời kinh độ 285°. Tuy gọi là "Tiểu" (Nhỏ) nhưng thực tế thường lạnh hơn cả Đại Hàn. Nhiệt lượng trong đất đã cạn kiệt, không khí buốt giá.
            </p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <!-- Charts Column -->
            <div class="space-y-10">
                <div class="bg-white p-8 rounded-2xl shadow-sm border border-ice-core relative overflow-hidden">
                    <h4 class="text-xl font-serif font-bold text-deep-freeze mb-2 text-center">Vị Trí Thiên Văn (285°)</h4>
                    <div class="chart-container">
                        <canvas id="solarChart"></canvas>
                    </div>
                </div>
                
                <div class="bg-white p-8 rounded-2xl shadow-sm border border-ice-core">
                    <h4 class="text-xl font-serif font-bold text-plum-blossom mb-2 text-center">Chỉ Số Lạnh (Tam Cửu)</h4>
                    <div class="chart-container" style="height: 250px;">
                        <canvas id="coldIndexChart"></canvas>
                    </div>
                    <p class="text-center text-sm text-gray-500 mt-4 italic">Giai đoạn lạnh nhất trong năm ("Tam Cửu").</p>
                </div>
            </div>

            <!-- Content Explanation -->
            <div class="space-y-8 text-lg text-gray-600 leading-relaxed font-light">
                <div class="p-6 bg-white rounded-xl border-l-4 border-deep-freeze shadow-sm">
                    <strong class="text-night-cold font-serif text-xl block mb-2">Nghịch Lý Tên Gọi</strong>
                    <p>
                        Theo lịch pháp là chớm lạnh, nhưng thực tế khí hậu là đỉnh điểm của mùa đông. Gió bấc thổi mạnh, băng tuyết phủ dày.
                    </p>
                </div>
                <div>
                    <strong class="text-night-cold font-serif text-xl block mb-2">Dương Khí Manh Nha</strong>
                    <p>
                        Dù bên ngoài lạnh giá, nhưng bên trong, dương khí đã bắt đầu lớn mạnh hơn so với Đông Chí, chuẩn bị cho sự hồi sinh.
                    </p>
                </div>
            </div>
        </div>
    </section>

    <!-- Section 2: Tam Hậu (Nature) -->
    <section id="tam-hau" class="py-24 bg-white relative z-10">
        <div class="max-w-6xl mx-auto px-4">
            <h3 class="text-3xl font-serif font-bold text-deep-freeze mb-12 text-center">Tam Hậu: Ba Tín Hiệu Sớm Của Mùa Xuân</h3>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                <!-- Card 1 -->
                <div class="card-interaction p-8 rounded-2xl cursor-default group text-center">
                    <div class="w-20 h-20 mx-auto rounded-full bg-ice-core/30 flex items-center justify-center text-4xl mb-6 group-hover:scale-110 transition">🪿</div>
                    <h5 class="font-bold text-xl text-night-cold mb-3 font-serif">1. Nhạn Bắc Hương</h5>
                    <p class="text-gray-600 font-light">Chim nhạn cảm nhận được dương khí manh nha ở phương Bắc, bắt đầu bay ngược về quê hương.</p>
                </div>

                <!-- Card 2 -->
                <div class="card-interaction p-8 rounded-2xl cursor-default group text-center">
                    <div class="w-20 h-20 mx-auto rounded-full bg-deep-freeze/10 flex items-center justify-center text-4xl mb-6 group-hover:scale-110 transition">🪺</div>
                    <h5 class="font-bold text-xl text-night-cold mb-3 font-serif">2. Thước Thủy Sào</h5>
                    <p class="text-gray-600 font-light">Chim khách (ác là) cảm thấy khí ấm sắp tới, bắt đầu làm tổ sớm để chuẩn bị sinh sản.</p>
                </div>

                <!-- Card 3 -->
                <div class="card-interaction p-8 rounded-2xl cursor-default group text-center">
                    <div class="w-20 h-20 mx-auto rounded-full bg-plum-blossom/10 flex items-center justify-center text-4xl mb-6 group-hover:scale-110 transition">🐦</div>
                    <h5 class="font-bold text-xl text-night-cold mb-3 font-serif">3. Trĩ Thủy Câu</h5>
                    <p class="text-gray-600 font-light">Chim trĩ trống bắt đầu cất tiếng kêu tìm bạn tình, báo hiệu mùa sinh sôi nảy nở đang đến gần.</p>
                </div>
            </div>
        </div>
    </section>

    <!-- Section 3: Đời Sống (Tabs) -->
    <section id="doi-song" class="py-24 px-4 bg-snow-shadow relative z-10">
        <div class="max-w-6xl mx-auto">
            <div class="mb-12 text-center">
                <h3 class="text-4xl font-serif font-bold text-night-cold mb-4">Chợ Tết & Cháo Lạp Bát</h3>
                <p class="text-gray-600 italic">"Qua Lạp Bát là đến Tết"</p>
            </div>

            <!-- Custom Tabs -->
            <div class="flex justify-center mb-10 space-x-4">
                <button onclick="switchTab('phong-tuc')" id="btn-phong-tuc" class="active-tab px-8 py-3 rounded-full border border-deep-freeze font-bold transition duration-300 font-serif tracking-wide shadow-sm">Phong Tục</button>
                <button onclick="switchTab('nong-nghiep')" id="btn-nong-nghiep" class="px-8 py-3 rounded-full border border-deep-freeze text-deep-freeze font-bold hover:bg-deep-freeze hover:text-white transition duration-300 font-serif tracking-wide shadow-sm">Nông Nghiệp</button>
            </div>

            <!-- Content Area -->
            <div class="bg-white p-8 md:p-12 rounded-3xl border border-gray-200 min-h-[400px] flex items-center shadow-sm relative overflow-hidden">
                <div class="absolute top-0 right-0 w-32 h-32 bg-warm-porridge/20 rounded-bl-full pointer-events-none"></div>

                <!-- Phong Tuc Content -->
                <div id="content-phong-tuc" class="grid grid-cols-1 md:grid-cols-2 gap-10 w-full animate-fade-in">
                    <!-- Card 1 -->
                    <div class="bg-snow-shadow p-8 rounded-2xl border-l-4 border-warm-porridge hover:bg-white transition group">
                        <div class="text-5xl mb-4 group-hover:scale-110 transition duration-300">🥣</div>
                        <h4 class="text-2xl font-serif font-bold text-night-cold mb-3">Cháo Lạp Bát</h4>
                        <p class="text-gray-600 leading-relaxed font-light">
                            Ăn cháo ngũ cốc vào mồng 8 tháng Chạp. Tượng trưng cho sự sung túc và giúp giữ ấm cơ thể trong những ngày lạnh giá.
                        </p>
                    </div>
                    <!-- Card 2 -->
                    <div class="bg-snow-shadow p-8 rounded-2xl border-l-4 border-plum-blossom hover:bg-white transition group">
                        <div class="text-5xl mb-4 group-hover:scale-110 transition duration-300">🏮</div>
                        <h4 class="text-2xl font-serif font-bold text-night-cold mb-3">Sắm Tết</h4>
                        <p class="text-gray-600 leading-relaxed font-light">
                            Không khí Tết bắt đầu len lỏi. Người dân đi chợ sắm sửa, viết câu đối, "phá đông" bằng sự nhộn nhịp.
                        </p>
                    </div>
                </div>

                <!-- Nong Nghiep Content -->
                <div id="content-nong-nghiep" class="hidden grid-cols-1 md:grid-cols-2 gap-10 w-full animate-fade-in">
                    <div class="flex flex-col justify-center">
                        <h4 class="text-3xl font-serif font-bold text-deep-freeze mb-6">Phòng Chống Rét Đậm</h4>
                        <p class="text-gray-600 leading-relaxed mb-6">
                            Giai đoạn nông nhàn nhưng đầy lo toan bảo vệ tài sản.
                        </p>
                        <ul class="space-y-4 text-gray-600 font-light">
                            <li class="flex items-start gap-3">
                                <span class="text-ice-core font-bold">❄️</span>
                                <span><strong>Che Chắn:</strong> Ủ ấm gốc cây, che chắn chuồng trại cho gia súc.</span>
                            </li>
                            <li class="flex items-start gap-3">
                                <span class="text-plum-blossom font-bold">🔥</span>
                                <span><strong>Bảo Vệ:</strong> Chống rét hại cho mạ và hoa màu vụ xuân.</span>
                            </li>
                        </ul>
                    </div>
                    <div class="flex items-center justify-center bg-snow-shadow rounded-2xl p-6 border border-dashed border-gray-300">
                        <div class="text-center">
                            <div class="text-9xl mb-4 opacity-80">🐮</div>
                            <p class="font-script text-2xl text-night-cold">Chăm sóc vật nuôi</p>
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
                    <span class="text-plum-blossom font-bold tracking-widest uppercase text-sm">Bổ Khí • Trừ Hàn</span>
                    <h3 class="text-4xl font-serif font-bold text-night-cold mt-2 mb-6">Tam Cửu Bổ Nhất Đông</h3>
                    <p class="text-gray-600 text-lg leading-relaxed mb-6">
                        Tẩm bổ trong những ngày lạnh nhất là tốt nhất. Cần ăn món ấm nóng, giàu năng lượng.
                    </p>
                    <div class="bg-white p-6 rounded-xl border-l-4 border-deep-freeze shadow-sm">
                        <h4 class="font-bold text-lg text-deep-freeze mb-2 font-serif">Nguyên Tắc Ẩm Thực</h4>
                        <p class="text-gray-600 mb-2"><strong>Ôn Bổ:</strong> Thịt dê, gà hầm sâm để sinh nhiệt.</p>
                        <p class="text-gray-600"><strong>Gia Vị:</strong> Tăng cường gừng, tỏi, tiêu để kích thích tiêu hóa.</p>
                    </div>
                </div>

                <div class="space-y-4 font-sans text-gray-700">
                    <div class="flex items-center gap-4 p-3 bg-white rounded-lg shadow-sm">
                        <div class="w-10 h-10 rounded-full bg-ice-core/30 flex items-center justify-center text-xl">🏃</div>
                        <div>
                            <strong>Vận Động:</strong> "Đông luyện tam cửu". Đi bộ nhanh khi có nắng để khí huyết lưu thông.
                        </div>
                    </div>
                    <div class="flex items-center gap-4 p-3 bg-white rounded-lg shadow-sm">
                        <div class="w-10 h-10 rounded-full bg-ice-core/30 flex items-center justify-center text-xl">🦶</div>
                        <div>
                            <strong>Giữ Ấm:</strong> Đầu và chân là trọng yếu. Ngâm chân nước nóng trước khi ngủ.
                        </div>
                    </div>
                </div>
            </div>

            <!-- Right: Interactive Food Filter -->
            <div class="lg:col-span-7">
                <div class="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden flex flex-col h-full">
                    <div class="bg-night-cold p-8 text-white">
                        <h4 class="text-2xl font-serif font-bold flex items-center gap-3">
                            <span>🍲</span> Thực Đơn Tam Cửu
                        </h4>
                        <p class="opacity-80 mt-2 font-light text-sm">Chọn thực phẩm bổ dưỡng, chống rét.</p>
                    </div>

                    <!-- Filters -->
                    <div class="p-6 border-b border-gray-100 flex gap-3 overflow-x-auto no-scrollbar">
                        <button onclick="filterFood('all')" class="food-btn active px-5 py-2 rounded-full text-sm font-bold bg-deep-freeze text-white hover:bg-night-cold transition whitespace-nowrap" data-filter="all">Tất Cả</button>
                        <button onclick="filterFood('good')" class="food-btn px-5 py-2 rounded-full text-sm font-bold bg-gray-100 text-gray-600 hover:bg-gray-200 transition whitespace-nowrap" data-filter="good">Nên Dùng (Ấm/Bổ)</button>
                        <button onclick="filterFood('bad')" class="food-btn px-5 py-2 rounded-full text-sm font-bold bg-gray-100 text-gray-600 hover:bg-gray-200 transition whitespace-nowrap" data-filter="bad">Hạn Chế (Lạnh)</button>
                    </div>

                    <!-- Grid -->
                    <div id="food-grid" class="p-6 grid grid-cols-2 sm:grid-cols-3 gap-4 overflow-y-auto max-h-[500px] bg-snow-shadow">
                        <!-- JS populated -->
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Section 5: Chiêm Nghiệm (Philosophy) -->
    <section id="chiem-nghiem" class="py-32 bg-deep-freeze text-white text-center px-4 relative overflow-hidden">
        <!-- Abstract Background Shape -->
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-ice-core/20 rounded-full blur-[100px] pointer-events-none"></div>

        <div class="max-w-3xl mx-auto relative z-10">
            <span class="text-6xl text-ice-core font-serif opacity-50 block mb-6">❝</span>
            
            <h3 class="text-4xl md:text-5xl font-serif font-bold mb-10 text-white leading-tight">
                Bĩ Cực Thái Lai
            </h3>
            
            <p class="text-xl text-gray-200 leading-loose mb-12 font-sans font-light">
                Đây là thời điểm đen tối nhất trước bình minh. Cái lạnh cắt da là thử thách cuối cùng để tôi luyện sức sống. Đừng sợ hãi sự khắc nghiệt, bởi phía trước chắc chắn là mùa xuân rực rỡ. Hãy giữ ngọn lửa trong tâm hồn luôn cháy sáng.
            </p>

            <div class="inline-block border border-gray-400 rounded-2xl p-10 bg-white/10 backdrop-blur-sm hover:bg-white/20 transition duration-500 cursor-default group">
                <p class="font-bold uppercase tracking-[0.2em] text-sm text-ice-core mb-6 font-sans group-hover:text-white transition">Lời Chúc Tiểu Hàn</p>
                <div class="text-3xl md:text-4xl font-script text-warm-porridge leading-relaxed group-hover:scale-105 transition duration-500 shadow-text">
                    "Vững chí bền gan,<br>Sẵn sàng đón Tết."
                </div>
            </div>
            
            <span class="text-6xl text-ice-core font-serif opacity-50 block mt-12">❞</span>
        </div>
    </section>

    <!-- Footer -->
    <footer class="bg-[#02020a] text-gray-400 py-12 text-center text-sm font-sans border-t border-gray-800">
        <p class="italic tracking-wide mb-3 text-gray-500">Biên soạn dựa trên nguyên lý 24 Tiết khí & Văn hóa Phương Đông</p>
        <p class="text-gray-400">© Bản quyền thuộc về <span class="font-script text-xl text-deep-freeze ml-1">Tịch Phong Thiên Sơn - 夕风天山</span></p>
    </footer>

    <!-- Javascript Logic -->
    <script>
        // --- Data ---
        const foodData = [
            { name: "Cháo Lạp Bát", type: "good", icon: "🥣", desc: "Đủ ngũ cốc, giữ ấm, sung túc" },
            { name: "Thịt Dê", type: "good", icon: "🥩", desc: "Ôn trung, trừ hàn, bổ khí" },
            { name: "Canh Gà Sâm", type: "good", icon: "🐔", desc: "Đại bổ nguyên khí, tăng đề kháng" },
            { name: "Thịt Bò Kho", type: "good", icon: "🐂", desc: "Giàu năng lượng, làm ấm người" },
            { name: "Long Nhãn", type: "good", icon: "👁️", desc: "An thần, bổ tâm tỳ, dưỡng huyết" },
            { name: "Gừng Tỏi", type: "good", icon: "🧄", desc: "Kích thích tiêu hóa, giải cảm lạnh" },
            { name: "Kem Lạnh", type: "bad", icon: "🍦", desc: "Gây lạnh bụng, hại tỳ vị" },
            { name: "Dưa Hấu", type: "bad", icon: "🍉", desc: "Tính hàn, không tốt mùa này" },
            { name: "Đồ Sống", type: "bad", icon: "🍣", desc: "Dễ gây tiêu chảy do lạnh" }
        ];

        // --- Tab Logic ---
        function switchTab(tab) {
            document.getElementById('content-phong-tuc').classList.add('hidden');
            document.getElementById('content-phong-tuc').classList.remove('grid');
            document.getElementById('content-nong-nghiep').classList.add('hidden');
            document.getElementById('content-nong-nghiep').classList.remove('grid');

            document.getElementById('btn-phong-tuc').classList.remove('active-tab', 'text-white');
            document.getElementById('btn-phong-tuc').classList.add('text-night-cold');
            document.getElementById('btn-nong-nghiep').classList.remove('active-tab', 'text-white');
            document.getElementById('btn-nong-nghiep').classList.add('text-night-cold');

            const content = document.getElementById(\`content-\${tab}\`);
            content.classList.remove('hidden');
            content.classList.add('grid');
            
            const btn = document.getElementById(\`btn-\${tab}\`);
            btn.classList.add('active-tab');
            btn.classList.remove('text-night-cold');
        }

        // --- Food Filter Logic ---
        function filterFood(filter) {
            const grid = document.getElementById('food-grid');
            grid.innerHTML = ''; 

            document.querySelectorAll('.food-btn').forEach(btn => {
                if(btn.dataset.filter === filter) {
                    btn.classList.add('bg-night-cold', 'text-white');
                    btn.classList.remove('bg-gray-100', 'text-gray-600');
                } else {
                    btn.classList.remove('bg-night-cold', 'text-white');
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

        // --- Canvas Animation (Blizzard) ---
        function initBlizzardCanvas() {
            const canvas = document.getElementById('blizzardCanvas');
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
                    this.size = Math.random() * 2 + 1;
                    this.speedX = Math.random() * 4 + 2; // Fast wind
                    this.speedY = Math.random() * 2 + 1;
                    this.opacity = Math.random() * 0.6 + 0.2;
                }
                update() {
                    this.x += this.speedX;
                    this.y += this.speedY;
                    if (this.x > width) this.x = -5;
                    if (this.y > height) this.y = -5;
                }
                draw() {
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                    ctx.fillStyle = \`rgba(200, 230, 255, \${this.opacity})\`;
                    ctx.fill();
                }
            }

            for(let i=0; i<150; i++) snowflakes.push(new Snowflake());

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
            initBlizzardCanvas();
            filterFood('all');

            // Chart 1: Solar Term 285 deg
            const ctx1 = document.getElementById('solarChart').getContext('2d');
            new Chart(ctx1, {
                type: 'doughnut',
                data: {
                    labels: ['Đông Chí', 'Tiểu Hàn', 'Đại Hàn', 'Mùa Khác'],
                    datasets: [{
                        data: [15, 15, 15, 315],
                        backgroundColor: ['#03045E', '#0077B6', '#0077B6', '#E0F7FA'],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    rotation: 195, 
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
                        ctx.fillStyle = "#0077B6";
                        var text = "285°",
                            textX = Math.round((width - ctx.measureText(text).width) / 2),
                            textY = height / 2;
                        ctx.fillText(text, textX, textY);
                        ctx.save();
                    }
                }]
            });

            // Chart 2: Cold Index (Bar)
            const ctx2 = document.getElementById('coldIndexChart').getContext('2d');
            new Chart(ctx2, {
                type: 'bar',
                data: {
                    labels: ['Đông Chí', 'Tiểu Hàn', 'Đại Hàn'],
                    datasets: [
                        {
                            label: 'Nhiệt Độ Thực Tế (Thấp)',
                            data: [80, 95, 90], // Tieu Han feels coldest
                            backgroundColor: '#0077B6',
                            borderRadius: 4
                        },
                        {
                            label: 'Nhiệt Lượng Đất (Tích tụ)',
                            data: [30, 10, 5], // Earth heat depleted
                            backgroundColor: '#F4A261',
                            borderRadius: 4,
                            type: 'line',
                            borderColor: '#F4A261'
                        }
                    ]
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
