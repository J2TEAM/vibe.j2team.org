export const LapDong = `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Lập Đông: Sự Khởi Đầu Của Mùa Tàng Ẩn & Nuôi Dưỡng</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    
    <!-- Fonts: Philosopher (Tiêu đề - Trầm mặc), Be Vietnam Pro (Nội dung - Rõ ràng), Dancing Script (Thơ - Sâu lắng) -->
    <link href="https://fonts.googleapis.com/css2?family=Philosopher:ital,wght@0,400;0,700;1,400;1,700&family=Be+Vietnam+Pro:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400&family=Dancing+Script:wght@400;700&display=swap" rel="stylesheet">
    
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        'winter-navy': '#1D3557',  // Xanh đêm thẫm (Hành Thủy/Tàng ẩn)
                        'ice-blue': '#A8DADC',     // Xanh băng (Hàn khí)
                        'hearth-amber': '#E63946', // Đỏ cam (Lửa ấm/Dương khí ẩn tàng)
                        'snow-white': '#F1FAEE',   // Trắng tuyết (Nền)
                        'earth-hard': '#457B9D',   // Xanh đá (Đất đông cứng)
                        'warm-soup': '#F4A261'     // Màu canh ấm (Tẩm bổ)
                    },
                    fontFamily: {
                        serif: ['"Philosopher"', 'serif'],
                        sans: ['"Be Vietnam Pro"', 'sans-serif'],
                        script: ['"Dancing Script"', 'cursive'],
                    },
                    animation: {
                        'pulse-warmth': 'pulseWarmth 4s infinite',
                    },
                    keyframes: {
                        pulseWarmth: {
                            '0%, 100%': { boxShadow: '0 0 10px #E63946' },
                            '50%': { boxShadow: '0 0 30px #E63946' },
                        }
                    }
                }
            }
        }
    </script>
    <style>
        body {
            background-color: #F1FAEE;
            color: #1D3557;
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
        /* Snow Canvas Layer */
        #snowCanvas {
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
            border-color: #E63946;
            box-shadow: 0 10px 30px -10px rgba(230, 57, 70, 0.2);
        }
        .active-tab {
            background-color: #1D3557;
            color: white;
            border-color: #1D3557;
        }
        .no-scrollbar::-webkit-scrollbar {
            display: none;
        }
        .no-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
    </style>
    <!-- Chosen Palette: "Winter Hearth" - Deep Navy, Ice Blue, Warm Amber/Red -->
    <!-- Application Structure Plan:
        1. Hero: Title with "First Snow" visual cue (Canvas animation).
        2. Thien Tuong (Cosmic): Chart showing 225° & Yin dominating/Yang hiding.
        3. Tam Hau (Nature): 3 Micro-seasons (Water freezes, Earth hardens, Pheasants into Clams).
        4. Doi Song (Life): Tabs for Agriculture ("Storing Grain") & Customs ("Winter Tonic", "Dumplings").
        5. Duong Sinh (Health): "Nourish Kidney" - Food Filter (Black/Warm vs Raw/Cold).
        6. Chiem Nghiem (Philosophy): Hidden Strength (Noi Luc).
        7. Footer: Copyright Tich Phong Thien Son.
    -->
    <!-- Visualization & Content Choices:
        1. Solar Gauge: Chart.js Doughnut (225°).
        2. Energy Flow: Line Chart showing Energy moving Inward (Storage mode).
        3. Food Filter: Logic for Kidney-nourishing foods (Black sesame, Mutton).
        4. Snow Animation: HTML5 Canvas for gentle, first snow.
    -->
    <!-- CONFIRMATION: NO SVG graphics used. NO Mermaid JS used. -->
</head>
<body class="font-sans antialiased leading-relaxed selection:bg-hearth-amber selection:text-white">

    <!-- Background Animation -->
    <canvas id="snowCanvas"></canvas>

    <!-- Navigation -->
    <nav class="sticky top-0 z-50 bg-snow-white/90 backdrop-blur-md border-b border-ice-blue/50 shadow-sm transition-all duration-300">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between h-20 items-center">
                <div class="flex-shrink-0 flex items-center gap-3">
                    <span class="text-3xl filter drop-shadow-sm animate-pulse">❄️</span>
                    <div class="flex flex-col">
                        <span class="text-2xl font-serif font-bold text-winter-navy tracking-wide">Lập Đông</span>
                        <span class="text-xs font-sans text-earth-hard uppercase tracking-widest font-bold">Khởi Đầu Tàng Ẩn</span>
                    </div>
                </div>
                <div class="hidden md:flex space-x-10">
                    <button onclick="scrollToSection('y-nghia')" class="text-winter-navy hover:text-hearth-amber transition font-medium tracking-wide text-sm uppercase">Ý Nghĩa</button>
                    <button onclick="scrollToSection('tam-hau')" class="text-winter-navy hover:text-hearth-amber transition font-medium tracking-wide text-sm uppercase">Tam Hậu</button>
                    <button onclick="scrollToSection('doi-song')" class="text-winter-navy hover:text-hearth-amber transition font-medium tracking-wide text-sm uppercase">Đời Sống</button>
                    <button onclick="scrollToSection('duong-sinh')" class="text-winter-navy hover:text-hearth-amber transition font-medium tracking-wide text-sm uppercase">Dưỡng Sinh</button>
                    <button onclick="scrollToSection('chiem-nghiem')" class="text-winter-navy hover:text-hearth-amber transition font-medium tracking-wide text-sm uppercase">Chiêm Nghiệm</button>
                </div>
            </div>
        </div>
    </nav>

    <!-- Hero Section -->
    <header class="relative pt-24 pb-20 px-4 text-center z-10 overflow-hidden">
        <div class="max-w-4xl mx-auto">
            <p class="text-earth-hard font-bold tracking-[0.3em] uppercase mb-6 text-sm font-sans">Tiết Khí Thứ 19 • 7-8 Tháng 11</p>
            <h1 class="text-6xl md:text-8xl font-serif font-bold text-winter-navy mb-6 leading-tight relative inline-block">
                Lập Đông
                <span class="absolute -top-4 -right-12 text-4xl animate-bounce text-ice-blue">🌨️</span>
            </h1>
            <h2 class="text-3xl md:text-5xl font-script text-hearth-amber mb-10 font-bold transform -rotate-1 shadow-sm">
                Nuôi Dưỡng Nội Lực
            </h2>
            <div class="w-24 h-1 bg-winter-navy mx-auto mb-10 rounded-full shadow-sm"></div>
            <p class="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-loose font-light">
                "Mùa thu vàng rực rỡ khép lại, nhường chỗ cho sự tĩnh lặng. Vạn vật thu mình, không phải để lụi tàn, mà để tích tụ sinh lực cho một vòng tuần hoàn mới."
            </p>
            <div class="mt-14">
                <button onclick="scrollToSection('y-nghia')" class="group relative inline-flex items-center justify-center px-10 py-3 overflow-hidden font-serif italic tracking-wide text-white transition duration-300 ease-out border-2 border-winter-navy rounded-full shadow-md bg-winter-navy">
                    <span class="absolute inset-0 flex items-center justify-center w-full h-full text-winter-navy duration-300 -translate-x-full bg-ice-blue group-hover:translate-x-0 ease">
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
            <h3 class="text-4xl font-serif font-bold text-winter-navy mb-4 inline-block relative">
                Cánh Cửa Mùa Đông
                <span class="absolute -bottom-2 left-0 w-full h-1 bg-ice-blue"></span>
            </h3>
            <p class="text-gray-600 max-w-2xl mx-auto mt-6 text-lg leading-relaxed">
                Mặt Trời kinh độ 225°. "Lập" là bắt đầu, "Đông" là kết thúc và cất giữ (Tàng). Vụ mùa kết thúc, vạn vật nghỉ ngơi.
            </p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <!-- Charts Column -->
            <div class="space-y-10">
                <div class="bg-white p-8 rounded-2xl shadow-sm border border-ice-blue relative overflow-hidden">
                    <h4 class="text-xl font-serif font-bold text-winter-navy mb-2 text-center">Vị Trí Thiên Văn (225°)</h4>
                    <div class="chart-container">
                        <canvas id="solarChart"></canvas>
                    </div>
                </div>
                
                <div class="bg-white p-8 rounded-2xl shadow-sm border border-ice-blue">
                    <h4 class="text-xl font-serif font-bold text-hearth-amber mb-2 text-center">Xu Hướng Năng Lượng</h4>
                    <div class="chart-container" style="height: 250px;">
                        <canvas id="energyChart"></canvas>
                    </div>
                    <p class="text-center text-sm text-gray-500 mt-4 italic">Dương khí lặn sâu, Âm khí thịnh vượng.</p>
                </div>
            </div>

            <!-- Content Explanation -->
            <div class="space-y-8 text-lg text-gray-600 leading-relaxed font-light">
                <div class="p-6 bg-white rounded-xl border-l-4 border-winter-navy shadow-sm">
                    <strong class="text-winter-navy font-serif text-xl block mb-2">Ý Nghĩa Chữ "Đông"</strong>
                    <p>
                        Trong văn hóa cổ, "Đông" không chỉ là mùa lạnh, mà còn mang ý nghĩa là "Chung" (kết thúc) và "Tàng" (cất giữ). Đây là lúc thu hoạch xong và cất vào kho.
                    </p>
                </div>
                <div>
                    <strong class="text-winter-navy font-serif text-xl block mb-2">Biến Đổi Tự Nhiên</strong>
                    <p>
                        Nước bắt đầu lạnh buốt, đất đai cứng lại. Sự sống bên ngoài dường như ngưng trệ, nhưng bên trong lòng đất, sự sống đang được bảo tồn.
                    </p>
                </div>
            </div>
        </div>
    </section>

    <!-- Section 2: Tam Hậu (Nature) -->
    <section id="tam-hau" class="py-24 bg-white relative z-10">
        <div class="max-w-6xl mx-auto px-4">
            <h3 class="text-3xl font-serif font-bold text-earth-hard mb-12 text-center">Tam Hậu: Ba Tín Hiệu Đầu Đông</h3>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                <!-- Card 1 -->
                <div class="card-interaction p-8 rounded-2xl cursor-default group text-center">
                    <div class="w-20 h-20 mx-auto rounded-full bg-ice-blue/20 flex items-center justify-center text-4xl mb-6 group-hover:scale-110 transition">🧊</div>
                    <h5 class="font-bold text-xl text-winter-navy mb-3 font-serif">1. Thủy Thủy Băng</h5>
                    <p class="text-gray-600 font-light">Nước bắt đầu đóng băng (ở phương Bắc). Dòng chảy trở nên chậm chạp và tĩnh lặng.</p>
                </div>

                <!-- Card 2 -->
                <div class="card-interaction p-8 rounded-2xl cursor-default group text-center">
                    <div class="w-20 h-20 mx-auto rounded-full bg-earth-hard/20 flex items-center justify-center text-4xl mb-6 group-hover:scale-110 transition">⛰️</div>
                    <h5 class="font-bold text-xl text-winter-navy mb-3 font-serif">2. Địa Thủy Đống</h5>
                    <p class="text-gray-600 font-light">Đất đai bắt đầu đông cứng lại do khí lạnh, không còn mềm xốp như mùa xuân hè.</p>
                </div>

                <!-- Card 3 -->
                <div class="card-interaction p-8 rounded-2xl cursor-default group text-center">
                    <div class="w-20 h-20 mx-auto rounded-full bg-hearth-amber/10 flex items-center justify-center text-4xl mb-6 group-hover:scale-110 transition">🦪</div>
                    <h5 class="font-bold text-xl text-winter-navy mb-3 font-serif">3. Trĩ Nhập Đại Thủy</h5>
                    <p class="text-gray-600 font-light">Chim trĩ biến mất, nghêu sò xuất hiện. Người xưa ngỡ chim lặn xuống nước hóa sò để tránh rét (Dương khí ẩn mình).</p>
                </div>
            </div>
        </div>
    </section>

    <!-- Section 3: Đời Sống (Tabs) -->
    <section id="doi-song" class="py-24 px-4 bg-ice-blue/10 relative z-10">
        <div class="max-w-6xl mx-auto">
            <div class="mb-12 text-center">
                <h3 class="text-4xl font-serif font-bold text-winter-navy mb-4">Thu Liễm & Tẩm Bổ</h3>
                <p class="text-gray-600 italic">"Lập Đông bổ đông, bổ chủy không"</p>
            </div>

            <!-- Custom Tabs -->
            <div class="flex justify-center mb-10 space-x-4">
                <button onclick="switchTab('phong-tuc')" id="btn-phong-tuc" class="active-tab px-8 py-3 rounded-full border border-winter-navy font-bold transition duration-300 font-serif tracking-wide shadow-sm">Phong Tục</button>
                <button onclick="switchTab('nong-nghiep')" id="btn-nong-nghiep" class="px-8 py-3 rounded-full border border-winter-navy text-winter-navy font-bold hover:bg-winter-navy hover:text-white transition duration-300 font-serif tracking-wide shadow-sm">Nông Nghiệp</button>
            </div>

            <!-- Content Area -->
            <div class="bg-white p-8 md:p-12 rounded-3xl border border-gray-100 min-h-[400px] flex items-center shadow-sm relative overflow-hidden">
                <div class="absolute top-0 right-0 w-32 h-32 bg-hearth-amber/5 rounded-bl-full pointer-events-none"></div>

                <!-- Phong Tuc Content -->
                <div id="content-phong-tuc" class="grid grid-cols-1 md:grid-cols-2 gap-10 w-full animate-fade-in">
                    <!-- Card 1 -->
                    <div class="bg-snow-white p-8 rounded-2xl border-l-4 border-hearth-amber hover:bg-white transition group">
                        <div class="text-5xl mb-4 group-hover:scale-110 transition duration-300">🍲</div>
                        <h4 class="text-2xl font-serif font-bold text-winter-navy mb-3">Bổ Đông (Tẩm Bổ)</h4>
                        <p class="text-gray-600 leading-relaxed font-light">
                            "Không bổ miệng sẽ trống rỗng". Ăn các món bổ dưỡng (thịt dê, gà, sủi cảo) để tích trữ năng lượng chống rét.
                        </p>
                    </div>
                    <!-- Card 2 -->
                    <div class="bg-snow-white p-8 rounded-2xl border-l-4 border-winter-navy hover:bg-white transition group">
                        <div class="text-5xl mb-4 group-hover:scale-110 transition duration-300">🧥</div>
                        <h4 class="text-2xl font-serif font-bold text-winter-navy mb-3">Nghênh Đông</h4>
                        <p class="text-gray-600 leading-relaxed font-light">
                            Xưa kia Thiên tử dẫn bá quan ra ngoại ô đón khí mùa đông, ban thưởng áo ấm, thể hiện sự quan tâm đến muôn dân.
                        </p>
                    </div>
                </div>

                <!-- Nong Nghiep Content -->
                <div id="content-nong-nghiep" class="hidden grid-cols-1 md:grid-cols-2 gap-10 w-full animate-fade-in">
                    <div class="flex flex-col justify-center">
                        <h4 class="text-3xl font-serif font-bold text-earth-hard mb-6">Ngày Tháng Mười Chưa Cười Đã Tối</h4>
                        <p class="text-gray-600 leading-relaxed mb-6">
                            Thời điểm nông nhàn nhưng vẫn cần chuẩn bị kỹ lưỡng cho vụ sau.
                        </p>
                        <ul class="space-y-4 text-gray-600 font-light">
                            <li class="flex items-start gap-3">
                                <span class="text-hearth-amber font-bold">📦</span>
                                <span><strong>Cất Trữ:</strong> Phơi phóng, cất giữ lương thực vào kho.</span>
                            </li>
                            <li class="flex items-start gap-3">
                                <span class="text-winter-navy font-bold">🚜</span>
                                <span><strong>Cày Ải:</strong> Cày lật đất để ải, diệt sâu bệnh, bón lót cho vụ Chiêm Xuân.</span>
                            </li>
                        </ul>
                    </div>
                    <div class="flex items-center justify-center bg-snow-white rounded-2xl p-6 border border-dashed border-gray-300">
                        <div class="text-center">
                            <div class="text-9xl mb-4 opacity-80">🌾</div>
                            <p class="font-script text-2xl text-winter-navy">Kho lúa đầy ắp</p>
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
                    <span class="text-earth-hard font-bold tracking-widest uppercase text-sm">Hành Thủy • Tạng Thận</span>
                    <h3 class="text-4xl font-serif font-bold text-winter-navy mt-2 mb-6">Dưỡng Tàng, Trừ Hàn</h3>
                    <p class="text-gray-600 text-lg leading-relaxed mb-6">
                        Nguyên tắc cốt lõi là "Dưỡng Tàng" (Giấu kín). Cần giữ ấm và bổ sung năng lượng để sinh nhiệt.
                    </p>
                    <div class="bg-white p-6 rounded-xl border-l-4 border-earth-hard shadow-sm">
                        <h4 class="font-bold text-lg text-winter-navy mb-2 font-serif">Nguyên Tắc Ẩm Thực</h4>
                        <p class="text-gray-600 mb-2"><strong>Ôn Bổ:</strong> Ăn thực phẩm giàu protein, tính ấm (Dê, Bò).</p>
                        <p class="text-gray-600"><strong>Màu Đen:</strong> Thực phẩm màu đen bổ Thận (Đỗ đen, Vừng đen).</p>
                    </div>
                </div>

                <div class="space-y-4 font-sans text-gray-700">
                    <div class="flex items-center gap-4 p-3 bg-white rounded-lg shadow-sm">
                        <div class="w-10 h-10 rounded-full bg-ice-blue/20 flex items-center justify-center text-xl">🛌</div>
                        <div>
                            <strong>Ngủ Nghỉ:</strong> Ngủ sớm dưỡng dương, dậy muộn đợi mặt trời lên.
                        </div>
                    </div>
                    <div class="flex items-center gap-4 p-3 bg-white rounded-lg shadow-sm">
                        <div class="w-10 h-10 rounded-full bg-hearth-amber/20 flex items-center justify-center text-xl">🔥</div>
                        <div>
                            <strong>Giữ Ấm:</strong> Chú ý lưng (Dương khí) và bàn chân (Kinh mạch).
                        </div>
                    </div>
                </div>
            </div>

            <!-- Right: Interactive Food Filter -->
            <div class="lg:col-span-7">
                <div class="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden flex flex-col h-full">
                    <div class="bg-winter-navy p-8 text-white">
                        <h4 class="text-2xl font-serif font-bold flex items-center gap-3">
                            <span>🥘</span> Thực Đơn Ôn Bổ
                        </h4>
                        <p class="opacity-80 mt-2 font-light text-sm">Chọn thực phẩm ấm áp, bổ thận dương.</p>
                    </div>

                    <!-- Filters -->
                    <div class="p-6 border-b border-gray-100 flex gap-3 overflow-x-auto no-scrollbar">
                        <button onclick="filterFood('all')" class="food-btn active px-5 py-2 rounded-full text-sm font-bold bg-earth-hard text-white hover:bg-winter-navy transition whitespace-nowrap" data-filter="all">Tất Cả</button>
                        <button onclick="filterFood('good')" class="food-btn px-5 py-2 rounded-full text-sm font-bold bg-gray-100 text-gray-600 hover:bg-gray-200 transition whitespace-nowrap" data-filter="good">Nên Dùng (Ấm/Đen)</button>
                        <button onclick="filterFood('bad')" class="food-btn px-5 py-2 rounded-full text-sm font-bold bg-gray-100 text-gray-600 hover:bg-gray-200 transition whitespace-nowrap" data-filter="bad">Hạn Chế (Lạnh)</button>
                    </div>

                    <!-- Grid -->
                    <div id="food-grid" class="p-6 grid grid-cols-2 sm:grid-cols-3 gap-4 overflow-y-auto max-h-[500px] bg-snow-white">
                        <!-- JS populated -->
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Section 5: Chiêm Nghiệm (Philosophy) -->
    <section id="chiem-nghiem" class="py-32 bg-winter-navy text-white text-center px-4 relative overflow-hidden">
        <!-- Abstract Background Shape -->
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-hearth-amber/10 rounded-full blur-[100px] pointer-events-none"></div>

        <div class="max-w-3xl mx-auto relative z-10">
            <span class="text-6xl text-ice-blue font-serif opacity-50 block mb-6">❝</span>
            
            <h3 class="text-4xl md:text-5xl font-serif font-bold mb-10 text-white leading-tight">
                Sức Mạnh Của<br>Sự Tĩnh Lặng
            </h3>
            
            <p class="text-xl text-gray-300 leading-loose mb-12 font-sans font-light">
                Bên dưới lớp đất lạnh cứng, hạt mầm vẫn âm thầm hút nhựa sống. Con người cũng cần những khoảng lặng "Lập Đông" để nhìn sâu vào bên trong, chữa lành và bồi đắp nội lực. Tĩnh lặng không phải là chết chóc, mà là sự chuẩn bị cho sự tái sinh.
            </p>

            <div class="inline-block border border-gray-600 rounded-2xl p-10 bg-white/5 backdrop-blur-sm hover:bg-white/10 transition duration-500 cursor-default group">
                <p class="font-bold uppercase tracking-[0.2em] text-sm text-ice-blue mb-6 font-sans group-hover:text-white transition">Lời Chúc Lập Đông</p>
                <div class="text-3xl md:text-4xl font-script text-hearth-amber leading-relaxed group-hover:scale-105 transition duration-500 shadow-text">
                    "Thân ấm áp, Tâm an nhiên,<br>Tích tàng phúc khí."
                </div>
            </div>
            
            <span class="text-6xl text-ice-blue font-serif opacity-50 block mt-12">❞</span>
        </div>
    </section>

    <!-- Footer -->
    <footer class="bg-[#0f1c2e] text-gray-500 py-12 text-center text-sm font-sans border-t border-gray-800">
        <p class="italic tracking-wide mb-3 text-gray-600">Biên soạn dựa trên nguyên lý 24 Tiết khí & Văn hóa Phương Đông</p>
        <p class="text-gray-500">© Bản quyền thuộc về <span class="font-script text-xl text-ice-blue ml-1">Tịch Phong Thiên Sơn - 夕风天山</span></p>
    </footer>

    <!-- Javascript Logic -->
    <script>
        // --- Data ---
        const foodData = [
            { name: "Thịt Dê", type: "good", icon: "🥩", desc: "Đại bổ dương khí, làm ấm người" },
            { name: "Củ Cải Trắng", type: "good", icon: "🥕", desc: "Tiêu thực, hóa đờm, hợp với thịt" },
            { name: "Gạo Nếp Cẩm", type: "good", icon: "🍚", desc: "Bổ huyết, ích thận, màu đen quý" },
            { name: "Hạt Dẻ", type: "good", icon: "🌰", desc: "Bổ thận khí, mạnh gân cốt" },
            { name: "Thịt Gà", type: "good", icon: "🍗", desc: "Ôn trung, ích khí, bổ tinh tủy" },
            { name: "Đỗ Đen", type: "good", icon: "🫘", desc: "Bổ thận, giải độc, trừ thấp" },
            { name: "Hải Sản Sống", type: "bad", icon: "🍣", desc: "Tính hàn, dễ gây lạnh bụng" },
            { name: "Dưa Hấu", type: "bad", icon: "🍉", desc: "Hại dương khí mùa đông" },
            { name: "Nước Đá", type: "bad", icon: "🧊", desc: "Đại kỵ, gây tổn thương tạng phủ" }
        ];

        // --- Tab Logic ---
        function switchTab(tab) {
            document.getElementById('content-phong-tuc').classList.add('hidden');
            document.getElementById('content-phong-tuc').classList.remove('grid');
            document.getElementById('content-nong-nghiep').classList.add('hidden');
            document.getElementById('content-nong-nghiep').classList.remove('grid');

            document.getElementById('btn-phong-tuc').classList.remove('active-tab', 'text-white');
            document.getElementById('btn-phong-tuc').classList.add('text-winter-navy');
            document.getElementById('btn-nong-nghiep').classList.remove('active-tab', 'text-white');
            document.getElementById('btn-nong-nghiep').classList.add('text-winter-navy');

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
                    btn.classList.add('bg-earth-hard', 'text-white');
                    btn.classList.remove('bg-gray-100', 'text-gray-600');
                } else {
                    btn.classList.remove('bg-earth-hard', 'text-white');
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

        // --- Canvas Animation (Snow) ---
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
                    this.size = Math.random() * 3 + 1;
                    this.speed = Math.random() * 1 + 0.5;
                    this.opacity = Math.random() * 0.5 + 0.3;
                    this.sway = Math.random() * 0.5 - 0.25;
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
                    ctx.fillStyle = \`rgba(168, 218, 220, \${this.opacity})\`; // Ice Blue
                    ctx.fill();
                }
            }

            for(let i=0; i<100; i++) snowflakes.push(new Snowflake());

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

            // Chart 1: Solar Term 225 deg
            const ctx1 = document.getElementById('solarChart').getContext('2d');
            new Chart(ctx1, {
                type: 'doughnut',
                data: {
                    labels: ['Lập Đông', 'Tiểu Tuyết', 'Đại Tuyết', 'Mùa Khác'],
                    datasets: [{
                        data: [15, 15, 15, 315],
                        backgroundColor: ['#1D3557', '#457B9D', '#457B9D', '#F1FAEE'],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    rotation: 135, 
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
                        ctx.fillStyle = "#1D3557";
                        var text = "225°",
                            textX = Math.round((width - ctx.measureText(text).width) / 2),
                            textY = height / 2;
                        ctx.fillText(text, textX, textY);
                        ctx.save();
                    }
                }]
            });

            // Chart 2: Energy Flow (Line)
            const ctx2 = document.getElementById('energyChart').getContext('2d');
            new Chart(ctx2, {
                type: 'line',
                data: {
                    labels: ['Sương Giáng', 'Lập Đông', 'Tiểu Tuyết'],
                    datasets: [
                        {
                            label: 'Dương Khí (Bề mặt)',
                            data: [40, 20, 10],
                            borderColor: '#E63946', // Fading heat
                            tension: 0.4,
                            borderDash: [5, 5]
                        },
                        {
                            label: 'Âm Khí (Tích tụ)',
                            data: [60, 80, 90],
                            borderColor: '#1D3557', // Strong cold
                            backgroundColor: 'rgba(29, 53, 87, 0.1)',
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
