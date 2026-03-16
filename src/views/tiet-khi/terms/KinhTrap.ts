export const KinhTrap = `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Kinh Trập: Tiếng Sấm Xuân Đánh Thức Vạn Vật</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    
    <!-- Fonts: Philosopher (Tiêu đề - Khí chất), Be Vietnam Pro (Nội dung - Mạch lạc), Dancing Script (Thơ - Bay bổng) -->
    <link href="https://fonts.googleapis.com/css2?family=Philosopher:ital,wght@0,400;0,700;1,400;1,700&family=Be+Vietnam+Pro:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400&family=Dancing+Script:wght@400;700&display=swap" rel="stylesheet">
    
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        'thunder-purple': '#4A4063', // Tím sẫm (Sấm/Khí Dương ẩn tàng bung ra)
                        'energy-yellow': '#F4D35E',  // Vàng (Tia chớp/Hoàng ly)
                        'sprout-green': '#A8C686',   // Xanh non (Sự sống mới)
                        'peach-pink': '#F28FAD',     // Hồng (Hoa đào)
                        'deep-night': '#2D2A32',     // Đêm (Nền tối)
                        'paper-light': '#F7F5FB'     // Nền giấy sáng
                    },
                    fontFamily: {
                        serif: ['"Philosopher"', 'serif'],
                        sans: ['"Be Vietnam Pro"', 'sans-serif'],
                        script: ['"Dancing Script"', 'cursive'],
                    },
                    animation: {
                        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                        'shake': 'shake 0.82s cubic-bezier(.36,.07,.19,.97) both',
                    },
                    keyframes: {
                        shake: {
                            '10%, 90%': { transform: 'translate3d(-1px, 0, 0)' },
                            '20%, 80%': { transform: 'translate3d(2px, 0, 0)' },
                            '30%, 50%, 70%': { transform: 'translate3d(-4px, 0, 0)' },
                            '40%, 60%': { transform: 'translate3d(4px, 0, 0)' }
                        }
                    }
                }
            }
        }
    </script>
    <style>
        body {
            background-color: #F7F5FB;
            color: #2D2A32;
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
        /* Lightning/Pulse Canvas Layer */
        #pulseCanvas {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 0;
            opacity: 0.15;
        }
        /* Interactions */
        .card-interaction {
            transition: all 0.3s ease-out;
            border: 1px solid transparent;
        }
        .card-interaction:hover {
            transform: translateY(-5px);
            border-color: #F4D35E;
            box-shadow: 0 10px 30px -10px rgba(74, 64, 99, 0.2);
        }
        .active-tab {
            background-color: #4A4063;
            color: white;
            border-color: #4A4063;
        }
        .no-scrollbar::-webkit-scrollbar {
            display: none;
        }
        .no-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
    </style>
    <!-- Chosen Palette: "Thunder Awakening" - Deep Purple (Mystery), Electric Yellow (Action), Fresh Green (Life) -->
    <!-- Application Structure Plan:
        1. Hero: Title with "Thunder" visual cue (Canvas pulse).
        2. Thien Tuong (Cosmic): Chart showing 345° & The spike of Yang energy (Thunder).
        3. Tam Hau (Nature): 3 Micro-seasons (Peach, Oriole, Cuckoo).
        4. Doi Song (Life): Tabs for Agriculture (Pest Control) & Customs (Beating Petty People).
        5. Duong Sinh (Health): "Nourish Liver/Moisten Lung" - Food Filter (Pear as key item).
        6. Chiem Nghiem (Philosophy): Call to Action / Breaking the cocoon.
        7. Footer: Copyright Tich Phong Thien Son.
    -->
    <!-- Visualization & Content Choices:
        1. Solar Gauge: Chart.js Doughnut (345°).
        2. Energy Spike: Bar Chart comparing activity level (Static vs Dynamic).
        3. Food Filter: Logic for "Pear/Cooling" vs "Spicy/Heating".
        4. Pulse Animation: HTML5 Canvas for the "Awakening" vibe.
    -->
    <!-- CONFIRMATION: NO SVG graphics used. NO Mermaid JS used. -->
</head>
<body class="font-sans antialiased leading-relaxed selection:bg-thunder-purple selection:text-white">

    <!-- Background Animation -->
    <canvas id="pulseCanvas"></canvas>

    <!-- Navigation -->
    <nav class="sticky top-0 z-50 bg-paper-light/95 backdrop-blur-md border-b border-thunder-purple/10 shadow-sm transition-all duration-300">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between h-20 items-center">
                <div class="flex-shrink-0 flex items-center gap-3">
                    <span class="text-3xl filter drop-shadow-sm">⚡</span>
                    <div class="flex flex-col">
                        <span class="text-2xl font-serif font-bold text-thunder-purple tracking-wide">Kinh Trập</span>
                        <span class="text-xs font-sans text-energy-yellow uppercase tracking-widest font-bold">Vạn Vật Bừng Tỉnh</span>
                    </div>
                </div>
                <div class="hidden md:flex space-x-10">
                    <button onclick="scrollToSection('y-nghia')" class="text-thunder-purple hover:text-energy-yellow transition font-medium tracking-wide text-sm uppercase">Ý Nghĩa</button>
                    <button onclick="scrollToSection('tam-hau')" class="text-thunder-purple hover:text-energy-yellow transition font-medium tracking-wide text-sm uppercase">Tam Hậu</button>
                    <button onclick="scrollToSection('doi-song')" class="text-thunder-purple hover:text-energy-yellow transition font-medium tracking-wide text-sm uppercase">Đời Sống</button>
                    <button onclick="scrollToSection('duong-sinh')" class="text-thunder-purple hover:text-energy-yellow transition font-medium tracking-wide text-sm uppercase">Dưỡng Sinh</button>
                    <button onclick="scrollToSection('chiem-nghiem')" class="text-thunder-purple hover:text-energy-yellow transition font-medium tracking-wide text-sm uppercase">Chiêm Nghiệm</button>
                </div>
            </div>
        </div>
    </nav>

    <!-- Hero Section -->
    <header class="relative pt-24 pb-20 px-4 text-center z-10 overflow-hidden">
        <div class="max-w-4xl mx-auto">
            <p class="text-thunder-purple font-bold tracking-[0.3em] uppercase mb-6 text-sm font-sans">Tiết Khí Thứ 3 • 5-6 Tháng 3</p>
            <h1 class="text-6xl md:text-8xl font-serif font-bold text-deep-night mb-6 leading-tight relative inline-block">
                Kinh Trập
                <span class="absolute -top-6 -right-8 text-4xl animate-pulse">⚡</span>
            </h1>
            <h2 class="text-3xl md:text-5xl font-script text-sprout-green mb-10 font-bold transform -rotate-1">
                Tiếng Sấm Xuân Đánh Thức Vạn Vật
            </h2>
            <div class="w-24 h-1 bg-energy-yellow mx-auto mb-10 rounded-full shadow-[0_0_10px_#F4D35E]"></div>
            <p class="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-loose font-light">
                "Khi cơn mưa bụi Vũ Thủy vừa tan, tiếng sấm đầu mùa rền vang như hồi chuông cảnh tỉnh. Khí Dương bùng nổ, phá tan sự tĩnh lặng của mùa đông."
            </p>
            <div class="mt-14">
                <button onclick="scrollToSection('y-nghia')" class="group relative inline-flex items-center justify-center px-10 py-3 overflow-hidden font-serif italic tracking-wide text-white transition duration-300 ease-out border-2 border-thunder-purple rounded-full shadow-md bg-thunder-purple">
                    <span class="absolute inset-0 flex items-center justify-center w-full h-full text-white duration-300 -translate-x-full bg-energy-yellow group-hover:translate-x-0 ease">
                        <span class="text-xl text-thunder-purple">🐛</span>
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
            <h3 class="text-4xl font-serif font-bold text-thunder-purple mb-4 inline-block relative">
                Sự Bừng Tỉnh Ngoạn Mục
                <span class="absolute -bottom-2 left-0 w-full h-1 bg-energy-yellow"></span>
            </h3>
            <p class="text-gray-600 max-w-2xl mx-auto mt-6 text-lg leading-relaxed">
                Mặt Trời kinh độ 345°. "Kinh" là kinh động, "Trập" là ẩn mình. Tiếng sấm (Chấn) đánh thức côn trùng, vạn vật bứt phá khỏi giấc ngủ đông.
            </p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <!-- Charts Column -->
            <div class="space-y-10">
                <div class="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
                    <h4 class="text-xl font-serif font-bold text-thunder-purple mb-2 text-center">Vị Trí Thiên Văn (345°)</h4>
                    <div class="chart-container">
                        <canvas id="solarChart"></canvas>
                    </div>
                </div>
                
                <div class="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                    <h4 class="text-xl font-serif font-bold text-deep-night mb-2 text-center">Biểu Đồ Sinh Khí: Tĩnh sang Động</h4>
                    <div class="chart-container" style="height: 250px;">
                        <canvas id="energyChart"></canvas>
                    </div>
                    <p class="text-center text-sm text-gray-400 mt-4 italic">Sự bùng nổ của Dương khí so với các tiết trước.</p>
                </div>
            </div>

            <!-- Content Explanation -->
            <div class="space-y-8 text-lg text-gray-600 leading-relaxed font-light">
                <div class="p-6 bg-white rounded-xl border-l-4 border-energy-yellow shadow-sm">
                    <strong class="text-thunder-purple font-serif text-xl block mb-2">Giải Nghĩa Tên Gọi</strong>
                    <p>
                        "Kinh" (驚) là làm cho giật mình. "Trập" (蟄) là côn trùng ngủ đông. Kinh Trập là lúc tiếng sấm rền vang làm kinh động, đánh thức sự sống đang ẩn nấp trong lòng đất.
                    </p>
                </div>
                <div>
                    <strong class="text-thunder-purple font-serif text-xl block mb-2">Biến Đổi Thiên Nhiên</strong>
                    <p>
                        Khí Dương đã lớn mạnh, phá vỡ thế cân bằng tĩnh tại. Sấm sét là kết quả của cuộc giao tranh giữa Âm và Dương, báo hiệu mùa sinh trưởng mạnh mẽ bắt đầu.
                    </p>
                </div>
            </div>
        </div>
    </section>

    <!-- Section 2: Tam Hậu (Nature) -->
    <section id="tam-hau" class="py-24 bg-white relative z-10">
        <div class="max-w-6xl mx-auto px-4">
            <h3 class="text-3xl font-serif font-bold text-thunder-purple mb-12 text-center">Tam Hậu: Ba Tín Hiệu Của Sự Sống</h3>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                <!-- Card 1 -->
                <div class="card-interaction bg-paper-light p-8 rounded-2xl cursor-default group text-center">
                    <div class="w-20 h-20 mx-auto rounded-full bg-peach-pink/20 flex items-center justify-center text-4xl mb-6 group-hover:rotate-12 transition">🌸</div>
                    <h5 class="font-bold text-xl text-deep-night mb-3 font-serif">1. Đào Thủy Hoa</h5>
                    <p class="text-gray-600 font-light">Cây đào cảm nhận được dương khí mạnh mẽ mà bắt đầu trổ bông rực rỡ, tô điểm cho sắc xuân.</p>
                </div>

                <!-- Card 2 -->
                <div class="card-interaction bg-paper-light p-8 rounded-2xl cursor-default group text-center">
                    <div class="w-20 h-20 mx-auto rounded-full bg-energy-yellow/20 flex items-center justify-center text-4xl mb-6 group-hover:scale-110 transition">🐦</div>
                    <h5 class="font-bold text-xl text-deep-night mb-3 font-serif">2. Thương Canh Minh</h5>
                    <p class="text-gray-600 font-light">Chim vàng anh (Hoàng ly) cất tiếng hót lảnh lót. Âm thanh lảnh lót hòa cùng tiếng sấm xuân.</p>
                </div>

                <!-- Card 3 -->
                <div class="card-interaction bg-paper-light p-8 rounded-2xl cursor-default group text-center">
                    <div class="w-20 h-20 mx-auto rounded-full bg-thunder-purple/10 flex items-center justify-center text-4xl mb-6 group-hover:scale-110 transition">🦅</div>
                    <h5 class="font-bold text-xl text-deep-night mb-3 font-serif">3. Ưng Hóa Vi Cưu</h5>
                    <p class="text-gray-600 font-light">Chim ưng biến mất, chim cúc xuất hiện. Người xưa ngỡ chúng hóa thân, tượng trưng cho Sát khí chuyển thành Sinh khí.</p>
                </div>
            </div>
        </div>
    </section>

    <!-- Section 3: Đời Sống (Tabs) -->
    <section id="doi-song" class="py-24 px-4 bg-paper-light relative z-10">
        <div class="max-w-6xl mx-auto">
            <div class="mb-12 text-center">
                <h3 class="text-4xl font-serif font-bold text-thunder-purple mb-4">Vào Vụ & Tín Ngưỡng</h3>
                <p class="text-gray-600 italic">"Qua ngày Kinh Trập, máy cày không nghỉ"</p>
            </div>

            <!-- Custom Tabs -->
            <div class="flex justify-center mb-10 space-x-4">
                <button onclick="switchTab('nong-nghiep')" id="btn-nong-nghiep" class="active-tab px-8 py-3 rounded-full border border-thunder-purple font-bold transition duration-300 font-serif tracking-wide shadow-sm">Nông Nghiệp</button>
                <button onclick="switchTab('phong-tuc')" id="btn-phong-tuc" class="px-8 py-3 rounded-full border border-thunder-purple text-thunder-purple font-bold hover:bg-thunder-purple hover:text-white transition duration-300 font-serif tracking-wide shadow-sm">Phong Tục</button>
            </div>

            <!-- Content Area -->
            <div class="bg-white p-8 md:p-12 rounded-3xl border border-gray-100 min-h-[400px] flex items-center shadow-sm relative overflow-hidden">
                <div class="absolute top-0 right-0 w-32 h-32 bg-energy-yellow/10 rounded-bl-full pointer-events-none"></div>

                <!-- Nong Nghiep Content -->
                <div id="content-nong-nghiep" class="grid grid-cols-1 md:grid-cols-2 gap-10 w-full animate-fade-in">
                    <div class="flex flex-col justify-center">
                        <h4 class="text-3xl font-serif font-bold text-sprout-green mb-6">Vụ Diệt Sâu Bệnh</h4>
                        <p class="text-gray-700 leading-relaxed mb-6">
                            Sâu bọ thức dậy đồng nghĩa với mùa màng bị đe dọa. Đây là lúc nhà nông phải hành động ngay lập tức.
                        </p>
                        <ul class="space-y-4 text-gray-600 font-light">
                            <li class="flex items-start gap-3">
                                <span class="text-thunder-purple font-bold">🚜</span>
                                <span>Cày xới đất đai, làm cỏ tận gốc.</span>
                            </li>
                            <li class="flex items-start gap-3">
                                <span class="text-thunder-purple font-bold">🐛</span>
                                <span>Diệt trừ sâu bệnh ngay khi chúng vừa xuất hiện.</span>
                            </li>
                            <li class="flex items-start gap-3">
                                <span class="text-thunder-purple font-bold">⏳</span>
                                <span>Giai đoạn bận rộn nhất: Máy cày không nghỉ.</span>
                            </li>
                        </ul>
                    </div>
                    <div class="flex items-center justify-center bg-paper-light rounded-2xl p-6 border border-dashed border-gray-300">
                        <div class="text-center">
                            <div class="text-9xl mb-4 opacity-80 hover:animate-shake cursor-pointer">🚜</div>
                            <p class="font-script text-2xl text-thunder-purple">Hành động ngay!</p>
                        </div>
                    </div>
                </div>

                <!-- Phong Tuc Content -->
                <div id="content-phong-tuc" class="hidden grid-cols-1 md:grid-cols-2 gap-10 w-full animate-fade-in">
                    <!-- Card 1 -->
                    <div class="bg-paper-light p-8 rounded-2xl border-l-4 border-thunder-purple hover:bg-gray-50 transition group">
                        <div class="text-5xl mb-4 group-hover:scale-110 transition duration-300">👞</div>
                        <h4 class="text-2xl font-serif font-bold text-deep-night mb-3">Đả Tiểu Nhân</h4>
                        <p class="text-gray-600 leading-relaxed font-light">
                            Tục dùng giày dép đập vào hình nhân giấy. Tiếng đập tượng trưng cho sấm sét, xua đuổi kẻ xấu, thị phi, cầu mong năm mới bình an.
                        </p>
                    </div>
                    <!-- Card 2 -->
                    <div class="bg-paper-light p-8 rounded-2xl border-l-4 border-energy-yellow hover:bg-gray-50 transition group">
                        <div class="text-5xl mb-4 group-hover:scale-110 transition duration-300">🐯</div>
                        <h4 class="text-2xl font-serif font-bold text-deep-night mb-3">Cúng Bạch Hổ</h4>
                        <p class="text-gray-600 leading-relaxed font-light">
                            Cầu mong thần Hổ trấn áp các thế lực xấu và bảo vệ gia đạo khỏi tai ương trong năm mới.
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
                    <span class="text-sprout-green font-bold tracking-widest uppercase text-sm">Hành Mộc • Tạng Can</span>
                    <h3 class="text-4xl font-serif font-bold text-deep-night mt-2 mb-6">Dưỡng Can, Nhuận Phế</h3>
                    <p class="text-gray-600 text-lg leading-relaxed mb-6">
                        Khí Dương bốc lên mạnh dễ gây vượng Can Hỏa (Nóng gan). Khí hậu hanh khô của gió xuân ảnh hưởng đến Phế (Phổi).
                    </p>
                    <div class="bg-white p-6 rounded-xl border-l-4 border-sprout-green shadow-sm">
                        <h4 class="font-bold text-lg text-sprout-green mb-2 font-serif">Bí Quyết: Ăn Lê 🍐</h4>
                        <p class="text-gray-600 mb-2">Lê có tính mát, vị ngọt thanh, giúp nhuận phế, thanh nhiệt, cân bằng hỏa khí và bổ sung nước.</p>
                    </div>
                </div>

                <div class="space-y-4 font-sans text-gray-700">
                    <div class="flex items-center gap-4 p-3 bg-white rounded-lg shadow-sm">
                        <div class="w-10 h-10 rounded-full bg-thunder-purple/10 flex items-center justify-center text-xl">🧘</div>
                        <div>
                            <strong>Vận Động:</strong> Nhẹ nhàng (đi bộ, thái cực) để khí huyết lưu thông. Tránh ra quá nhiều mồ hôi.
                        </div>
                    </div>
                    <div class="flex items-center gap-4 p-3 bg-white rounded-lg shadow-sm">
                        <div class="w-10 h-10 rounded-full bg-thunder-purple/10 flex items-center justify-center text-xl">🥗</div>
                        <div>
                            <strong>Thanh Đạm:</strong> Ăn rau cải, củ sen. Tránh đồ cay nóng, chiên xào hại gan.
                        </div>
                    </div>
                </div>
            </div>

            <!-- Right: Interactive Food Filter -->
            <div class="lg:col-span-7">
                <div class="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden flex flex-col h-full">
                    <div class="bg-thunder-purple p-8 text-white">
                        <h4 class="text-2xl font-serif font-bold flex items-center gap-3">
                            <span>🍐</span> Thực Đơn Giải Hỏa
                        </h4>
                        <p class="opacity-90 mt-2 font-light text-sm">Chọn thực phẩm giúp thanh nhiệt và bảo vệ Gan.</p>
                    </div>

                    <!-- Filters -->
                    <div class="p-6 border-b border-gray-100 flex gap-3 overflow-x-auto no-scrollbar">
                        <button onclick="filterFood('all')" class="food-btn active px-5 py-2 rounded-full text-sm font-bold bg-gray-100 text-gray-600 hover:bg-gray-200 transition whitespace-nowrap" data-filter="all">Tất Cả</button>
                        <button onclick="filterFood('good')" class="food-btn px-5 py-2 rounded-full text-sm font-bold bg-gray-100 text-gray-600 hover:bg-gray-200 transition whitespace-nowrap" data-filter="good">Nên Dùng (Mát/Nhuận)</button>
                        <button onclick="filterFood('bad')" class="food-btn px-5 py-2 rounded-full text-sm font-bold bg-gray-100 text-gray-600 hover:bg-gray-200 transition whitespace-nowrap" data-filter="bad">Hạn Chế (Cay/Nóng)</button>
                    </div>

                    <!-- Grid -->
                    <div id="food-grid" class="p-6 grid grid-cols-2 sm:grid-cols-3 gap-4 overflow-y-auto max-h-[500px] bg-paper-light">
                        <!-- JS populated -->
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Section 5: Chiêm Nghiệm (Philosophy) -->
    <section id="chiem-nghiem" class="py-32 bg-deep-night text-white text-center px-4 relative overflow-hidden">
        <!-- Abstract Background Shape -->
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-thunder-purple/30 rounded-full blur-[100px] pointer-events-none"></div>

        <div class="max-w-3xl mx-auto relative z-10">
            <span class="text-6xl text-gray-500 font-serif opacity-50 block mb-6">❝</span>
            
            <h3 class="text-4xl md:text-5xl font-serif font-bold mb-10 text-white leading-tight">
                Tĩnh Mãi Rồi Cũng<br>Phải Động
            </h3>
            
            <p class="text-xl text-gray-300 leading-loose mb-12 font-sans font-light">
                Tiếng sấm xuân như lời hiệu triệu của Dũng Khí. Đừng sợ hãi những biến động. Chính những cú hích đó sẽ đánh thức tiềm năng đang ngủ quên. Hãy như mầm cây đội đất, mạnh dạn bước ra ánh sáng để đón nhận cơ hội mới.
            </p>

            <div class="inline-block border border-gray-700 rounded-2xl p-10 bg-white/5 backdrop-blur-sm hover:bg-white/10 transition duration-500 hover:border-energy-yellow cursor-default group">
                <p class="font-bold uppercase tracking-[0.2em] text-sm text-energy-yellow mb-6 font-sans group-hover:text-white transition">Lời Chúc Kinh Trập</p>
                <div class="text-3xl md:text-4xl font-script text-sprout-green leading-relaxed group-hover:scale-105 transition duration-500">
                    "Mạnh mẽ vươn mình,<br>Khí thế như rồng."
                </div>
            </div>
            
            <span class="text-6xl text-gray-500 font-serif opacity-50 block mt-12">❞</span>
        </div>
    </section>

    <!-- Footer -->
    <footer class="bg-[#1a181e] text-gray-500 py-12 text-center text-sm font-sans border-t border-gray-800">
        <p class="italic tracking-wide mb-3 text-gray-400">Biên soạn dựa trên nguyên lý 24 Tiết khí & Văn hóa Phương Đông</p>
        <p class="text-gray-600">© Bản quyền thuộc về <span class="font-script text-xl text-thunder-purple ml-1">Tịch Phong Thiên Sơn - 夕风天山</span></p>
    </footer>

    <!-- Javascript Logic -->
    <script>
        // --- Data ---
        const foodData = [
            { name: "Quả Lê", type: "good", icon: "🍐", desc: "Nhuận phế, thanh nhiệt, trừ ho" },
            { name: "Củ Sen", type: "good", icon: "🪷", desc: "Thanh lọc, mát máu" },
            { name: "Ngân Nhĩ", type: "good", icon: "🍄", desc: "Dưỡng âm, bổ phổi" },
            { name: "Trứng Gà", type: "good", icon: "🥚", desc: "Bổ dưỡng, thanh đạm" },
            { name: "Rau Cải", type: "good", icon: "🥬", desc: "Mát gan, dễ tiêu hóa" },
            { name: "Ớt Cay", type: "bad", icon: "🌶️", desc: "Kích thích mạnh, hại gan" },
            { name: "Đồ Chiên", type: "bad", icon: "🍟", desc: "Gây nóng trong, nổi mụn" },
            { name: "Rượu Bia", type: "bad", icon: "🍺", desc: "Tăng gánh nặng cho gan" }
        ];

        // --- Tab Logic ---
        function switchTab(tab) {
            document.getElementById('content-nong-nghiep').classList.add('hidden');
            document.getElementById('content-nong-nghiep').classList.remove('grid');
            document.getElementById('content-phong-tuc').classList.add('hidden');
            document.getElementById('content-phong-tuc').classList.remove('grid');

            document.getElementById('btn-nong-nghiep').classList.remove('active-tab', 'text-white');
            document.getElementById('btn-nong-nghiep').classList.add('text-thunder-purple');
            document.getElementById('btn-phong-tuc').classList.remove('active-tab', 'text-white');
            document.getElementById('btn-phong-tuc').classList.add('text-thunder-purple');

            const content = document.getElementById(\`content-\${tab}\`);
            content.classList.remove('hidden');
            content.classList.add('grid');
            
            const btn = document.getElementById(\`btn-\${tab}\`);
            btn.classList.add('active-tab');
            btn.classList.remove('text-thunder-purple');
        }

        // --- Food Filter Logic ---
        function filterFood(filter) {
            const grid = document.getElementById('food-grid');
            grid.innerHTML = ''; 

            document.querySelectorAll('.food-btn').forEach(btn => {
                if(btn.dataset.filter === filter) {
                    btn.classList.add('bg-thunder-purple', 'text-white');
                    btn.classList.remove('bg-gray-100', 'text-gray-600');
                } else {
                    btn.classList.remove('bg-thunder-purple', 'text-white');
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

        // --- Canvas Animation (Pulse/Lightning) ---
        function initPulseCanvas() {
            const canvas = document.getElementById('pulseCanvas');
            const ctx = canvas.getContext('2d');
            let width, height;
            let pulses = [];

            function resize() {
                width = window.innerWidth;
                height = window.innerHeight;
                canvas.width = width;
                canvas.height = height;
            }
            window.addEventListener('resize', resize);
            resize();

            class Pulse {
                constructor() {
                    this.x = Math.random() * width;
                    this.y = Math.random() * height;
                    this.radius = 0;
                    this.maxRadius = Math.random() * 100 + 50;
                    this.speed = Math.random() * 2 + 1;
                    this.opacity = 0.5;
                    this.color = \`rgba(244, 211, 94, \${this.opacity})\`; // Energy Yellow
                }
                update() {
                    this.radius += this.speed;
                    this.opacity -= 0.01;
                    if (this.opacity <= 0) {
                        this.opacity = 0.5;
                        this.radius = 0;
                        this.x = Math.random() * width;
                        this.y = Math.random() * height;
                    }
                }
                draw() {
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                    ctx.strokeStyle = \`rgba(244, 211, 94, \${this.opacity})\`;
                    ctx.lineWidth = 1;
                    ctx.stroke();
                }
            }

            for(let i=0; i<5; i++) pulses.push(new Pulse());

            function animate() {
                ctx.clearRect(0, 0, width, height);
                pulses.forEach(p => {
                    p.update();
                    p.draw();
                });
                requestAnimationFrame(animate);
            }
            animate();
        }

        // --- Init ---
        document.addEventListener('DOMContentLoaded', () => {
            initPulseCanvas();
            filterFood('all');

            // Chart 1: Solar Term 345 deg
            const ctx1 = document.getElementById('solarChart').getContext('2d');
            new Chart(ctx1, {
                type: 'doughnut',
                data: {
                    labels: ['Kinh Trập', 'Xuân Phân', 'Thanh Minh', 'Mùa Khác'],
                    datasets: [{
                        data: [15, 15, 15, 315],
                        backgroundColor: ['#4A4063', '#A8C686', '#A8C686', '#F7F5FB'],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    rotation: -120, // Adjusted for 345 deg visual
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
                        ctx.fillStyle = "#4A4063";
                        var text = "345°",
                            textX = Math.round((width - ctx.measureText(text).width) / 2),
                            textY = height / 2;
                        ctx.fillText(text, textX, textY);
                        ctx.save();
                    }
                }]
            });

            // Chart 2: Energy Spike
            const ctx2 = document.getElementById('energyChart').getContext('2d');
            new Chart(ctx2, {
                type: 'bar',
                data: {
                    labels: ['Lập Xuân', 'Vũ Thủy', 'Kinh Trập', 'Xuân Phân'],
                    datasets: [
                        {
                            label: 'Mức Độ Sinh Trưởng',
                            data: [30, 50, 90, 85],
                            backgroundColor: ['#A8C686', '#A8C686', '#F4D35E', '#A8C686'],
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
                        legend: { display: false }
                    }
                }
            });
        });
    </script>
</body>
</html>
`
