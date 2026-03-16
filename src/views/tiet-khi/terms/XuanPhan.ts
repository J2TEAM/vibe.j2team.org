export const XuanPhan = `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Xuân Phân: Điểm Cân Bằng Của Vũ Trụ & Sự Hồi Sinh Diệu Kỳ</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    
    <!-- Fonts: Philosopher (Tiêu đề - Cân bằng), Be Vietnam Pro (Nội dung - Minh bạch), Dancing Script (Thơ - Bay bổng) -->
    <link href="https://fonts.googleapis.com/css2?family=Philosopher:ital,wght@0,400;0,700;1,400;1,700&family=Be+Vietnam+Pro:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400&family=Dancing+Script:wght@400;700&display=swap" rel="stylesheet">
    
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        'balance-teal': '#2A9D8F',  // Xanh ngọc (Sự cân bằng/Mộc)
                        'sun-gold': '#E9C46A',    // Vàng nắng (Dương khí rực rỡ)
                        'night-blue': '#264653',    // Xanh đêm (Âm khí tĩnh lặng)
                        'spring-green': '#A8E6CF',  // Xanh lộc non
                        'harmony-white': '#F4F1DE', // Trắng ngà (Trung dung)
                        'earth-orange': '#E76F51'   // Cam đất (Sự sống)
                    },
                    fontFamily: {
                        serif: ['"Philosopher"', 'serif'],
                        sans: ['"Be Vietnam Pro"', 'sans-serif'],
                        script: ['"Dancing Script"', 'cursive'],
                    },
                    animation: {
                        'float': 'float 6s ease-in-out infinite',
                        'sway': 'sway 4s ease-in-out infinite',
                    },
                    keyframes: {
                        float: {
                            '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
                            '50%': { transform: 'translateY(-20px) rotate(5deg)' },
                        },
                        sway: {
                            '0%, 100%': { transform: 'rotate(-2deg)' },
                            '50%': { transform: 'rotate(2deg)' },
                        }
                    }
                }
            }
        }
    </script>
    <style>
        body {
            background-color: #F4F1DE;
            color: #264653;
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
        /* Balance Canvas Layer */
        #balanceCanvas {
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
            background: rgba(255, 255, 255, 0.6);
            backdrop-filter: blur(10px);
        }
        .card-interaction:hover {
            transform: translateY(-5px);
            border-color: #2A9D8F;
            box-shadow: 0 10px 30px -10px rgba(42, 157, 147, 0.3);
        }
        .active-tab {
            background-color: #2A9D8F;
            color: white;
            border-color: #2A9D8F;
        }
        .no-scrollbar::-webkit-scrollbar {
            display: none;
        }
        .no-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
    </style>
    <!-- Chosen Palette: "Equinox Equilibrium" - Balance Teal, Sun Gold, Night Blue, Earth Orange -->
    <!-- Application Structure Plan:
        4. Doi Song (Life): Tabs for Agriculture ("Golden Moment") & Customs ("Egg Balancing").
        5. Duong Sinh (Health): "Harmony/Balance" - Food Filter (Neutral/Balanced foods).
        6. Chiem Nghiem (Philosophy): The Middle Way (Trung Dao).
        7. Footer: Copyright Tich Phong Thien Son.
    -->
    <!-- Visualization & Content Choices:
        1. Solar Gauge: Chart.js Doughnut (0°).
        2. Day/Night Balance: Pie Chart showing 50/50 split.
        3. Food Filter: Logic for "Neutral/Balanced" foods.
        4. Balance Animation: HTML5 Canvas rotating Yin Yang symbol.
    -->
    <!-- CONFIRMATION: NO SVG graphics used. NO Mermaid JS used. -->
</head>
<body class="font-sans antialiased leading-relaxed selection:bg-balance-teal selection:text-white">

    <!-- Background Animation -->
    <canvas id="balanceCanvas"></canvas>

    <!-- Navigation -->
    <nav class="sticky top-0 z-50 bg-pure-white/95 backdrop-blur-md border-b border-balance-teal/10 shadow-sm transition-all duration-300">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between h-20 items-center">
                <div class="flex-shrink-0 flex items-center gap-3">
                    <span class="text-3xl filter drop-shadow-sm animate-spin-slow">☯️</span>
                    <div class="flex flex-col">
                        <span class="text-2xl font-serif font-bold text-balance-teal tracking-wide">Xuân Phân</span>
                        <span class="text-xs font-sans text-sun-gold uppercase tracking-widest font-bold">Cân Bằng Tuyệt Đối</span>
                    </div>
                </div>
                <div class="hidden md:flex space-x-10">
                    <button onclick="scrollToSection('y-nghia')" class="text-night-blue hover:text-balance-teal transition font-medium tracking-wide text-sm uppercase">Ý Nghĩa</button>
                    <button onclick="scrollToSection('tam-hau')" class="text-night-blue hover:text-balance-teal transition font-medium tracking-wide text-sm uppercase">Tam Hậu</button>
                    <button onclick="scrollToSection('doi-song')" class="text-night-blue hover:text-balance-teal transition font-medium tracking-wide text-sm uppercase">Đời Sống</button>
                    <button onclick="scrollToSection('duong-sinh')" class="text-night-blue hover:text-balance-teal transition font-medium tracking-wide text-sm uppercase">Dưỡng Sinh</button>
                    <button onclick="scrollToSection('chiem-nghiem')" class="text-night-blue hover:text-balance-teal transition font-medium tracking-wide text-sm uppercase">Chiêm Nghiệm</button>
                </div>
            </div>
        </div>
    </nav>

    <!-- Hero Section -->
    <header class="relative pt-24 pb-20 px-4 text-center z-10 overflow-hidden">
        <div class="max-w-4xl mx-auto">
            <p class="text-balance-teal font-bold tracking-[0.3em] uppercase mb-6 text-sm font-sans">Tiết Khí Thứ 4 • 20-21 Tháng 3</p>
            <h1 class="text-6xl md:text-8xl font-serif font-bold text-night-blue mb-6 leading-tight relative inline-block">
                Xuân Phân
                <span class="absolute -top-4 -right-12 text-4xl animate-float">⚖️</span>
            </h1>
            <h2 class="text-3xl md:text-5xl font-script text-sun-gold mb-10 font-bold transform -rotate-1">
                Điểm Cân Bằng Của Vũ Trụ
            </h2>
            <div class="w-24 h-1 bg-balance-teal mx-auto mb-10 rounded-full"></div>
            <p class="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-loose font-light">
                "Thời khắc chia đều mùa xuân, chia đều ánh sáng và bóng tối. Âm Dương giao hòa, vạn vật sinh trưởng trong sự ổn định và an nhiên."
            </p>
            <div class="mt-14">
                <button onclick="scrollToSection('y-nghia')" class="group relative inline-flex items-center justify-center px-10 py-3 overflow-hidden font-serif italic tracking-wide text-white transition duration-300 ease-out border-2 border-balance-teal rounded-full shadow-md bg-balance-teal">
                    <span class="absolute inset-0 flex items-center justify-center w-full h-full text-white duration-300 -translate-x-full bg-sun-gold group-hover:translate-x-0 ease">
                        <span class="text-xl text-night-blue">☀️</span>
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
            <h3 class="text-4xl font-serif font-bold text-balance-teal mb-4 inline-block relative">
                Chia Đôi Mùa Xuân
                <span class="absolute -bottom-2 left-0 w-full h-1 bg-sun-gold/50"></span>
            </h3>
            <p class="text-gray-600 max-w-2xl mx-auto mt-6 text-lg leading-relaxed">
                Mặt Trời kinh độ 0°. Ngày và đêm dài bằng nhau. Đây là điểm giữa của 90 ngày mùa xuân, đánh dấu sự hài hòa tuyệt đối của đất trời.
            </p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <!-- Charts Column -->
            <div class="space-y-10">
                <div class="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
                    <h4 class="text-xl font-serif font-bold text-balance-teal mb-2 text-center">Vị Trí Thiên Văn (0°)</h4>
                    <div class="chart-container">
                        <canvas id="solarChart"></canvas>
                    </div>
                </div>
                
                <div class="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                    <h4 class="text-xl font-serif font-bold text-night-blue mb-2 text-center">Tỷ Lệ Ngày & Đêm</h4>
                    <div class="chart-container" style="height: 250px;">
                        <canvas id="dayNightChart"></canvas>
                    </div>
                    <p class="text-center text-sm text-gray-400 mt-4 italic">Cân bằng hoàn hảo 50/50.</p>
                </div>
            </div>

            <!-- Content Explanation -->
            <div class="space-y-8 text-lg text-gray-600 leading-relaxed font-light">
                <div class="p-6 bg-white rounded-xl border-l-4 border-sun-gold shadow-sm">
                    <strong class="text-balance-teal font-serif text-xl block mb-2">Giải Nghĩa Tên Gọi</strong>
                    <p>
                        "Xuân" là mùa xuân, "Phân" là chia đều. Xuân Phân vừa là thời điểm giữa mùa xuân, vừa là thời điểm ngày và đêm cân bằng nhau trên khắp hành tinh.
                    </p>
                </div>
                <div>
                    <strong class="text-balance-teal font-serif text-xl block mb-2">Hài Hòa Âm Dương</strong>
                    <p>
                        Không còn sự lấn át của Âm hay Dương. Khí trời ấm áp, gió xuân nhẹ nhàng. Đây là thời điểm lý tưởng nhất để vạn vật sinh sôi nảy nở trong sự bình yên.
                    </p>
                </div>
            </div>
        </div>
    </section>

    <!-- Section 2: Tam Hậu (Nature) -->
    <section id="tam-hau" class="py-24 bg-white relative z-10">
        <div class="max-w-6xl mx-auto px-4">
            <h3 class="text-3xl font-serif font-bold text-balance-teal mb-12 text-center">Tam Hậu: Ba Tín Hiệu Cân Bằng</h3>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                <!-- Card 1 -->
                <div class="card-interaction bg-pure-white p-8 rounded-2xl cursor-default group text-center">
                    <div class="w-20 h-20 mx-auto rounded-full bg-night-blue/10 flex items-center justify-center text-4xl mb-6 group-hover:scale-110 transition">🐦</div>
                    <h5 class="font-bold text-xl text-night-blue mb-3 font-serif">1. Huyền Điểu Chí</h5>
                    <p class="text-gray-600 font-light">Chim én từ phương Nam bay về phương Bắc làm tổ. Hơi ấm đã lan tỏa khắp nơi, gọi bầy chim trở về.</p>
                </div>

                <!-- Card 2 -->
                <div class="card-interaction bg-pure-white p-8 rounded-2xl cursor-default group text-center">
                    <div class="w-20 h-20 mx-auto rounded-full bg-balance-teal/10 flex items-center justify-center text-4xl mb-6 group-hover:scale-110 transition">⚡</div>
                    <h5 class="font-bold text-xl text-night-blue mb-3 font-serif">2. Lôi Nãi Phát Thanh</h5>
                    <p class="text-gray-600 font-light">Sấm mùa xuân rền vang nhưng âm thanh đã dịu hơn, mang tính chất thúc giục sự sinh trưởng thay vì kinh động.</p>
                </div>

                <!-- Card 3 -->
                <div class="card-interaction bg-pure-white p-8 rounded-2xl cursor-default group text-center">
                    <div class="w-20 h-20 mx-auto rounded-full bg-sun-gold/20 flex items-center justify-center text-4xl mb-6 group-hover:scale-110 transition">⛈️</div>
                    <h5 class="font-bold text-xl text-night-blue mb-3 font-serif">3. Thủy Điện</h5>
                    <p class="text-gray-600 font-light">Tia chớp bắt đầu xuất hiện cùng những cơn mưa rào, mang lại nguồn nước dồi dào cho ruộng đồng.</p>
                </div>
            </div>
        </div>
    </section>

    <!-- Section 3: Đời Sống (Tabs) -->
    <section id="doi-song" class="py-24 px-4 bg-pure-white relative z-10">
        <div class="max-w-6xl mx-auto">
            <div class="mb-12 text-center">
                <h3 class="text-4xl font-serif font-bold text-balance-teal mb-4">Thời Khắc Vàng & Phong Tục</h3>
                <p class="text-gray-600 italic">"Xuân Phân mạch khởi thân, nhất khắc trị thiên kim"</p>
            </div>

            <!-- Custom Tabs -->
            <div class="flex justify-center mb-10 space-x-4">
                <button onclick="switchTab('nong-nghiep')" id="btn-nong-nghiep" class="active-tab px-8 py-3 rounded-full border border-balance-teal font-bold transition duration-300 font-serif tracking-wide shadow-sm">Nông Nghiệp</button>
                <button onclick="switchTab('phong-tuc')" id="btn-phong-tuc" class="px-8 py-3 rounded-full border border-balance-teal text-balance-teal font-bold hover:bg-balance-teal hover:text-white transition duration-300 font-serif tracking-wide shadow-sm">Phong Tục</button>
            </div>

            <!-- Content Area -->
            <div class="bg-white p-8 md:p-12 rounded-3xl border border-gray-100 min-h-[400px] flex items-center shadow-sm relative overflow-hidden">
                <div class="absolute top-0 right-0 w-32 h-32 bg-sun-gold/10 rounded-bl-full pointer-events-none"></div>

                <!-- Nong Nghiep Content -->
                <div id="content-nong-nghiep" class="grid grid-cols-1 md:grid-cols-2 gap-10 w-full animate-fade-in">
                    <div class="flex flex-col justify-center">
                        <h4 class="text-3xl font-serif font-bold text-balance-teal mb-6">Sinh Trưởng Mạnh Mẽ</h4>
                        <p class="text-gray-700 leading-relaxed mb-6">
                            Lúa chiêm đang thì con gái, cây cối đâm chồi nảy lộc. Đây là thời điểm "nhất khắc trị thiên kim" (một khắc đáng ngàn vàng).
                        </p>
                        <ul class="space-y-4 text-gray-600 font-light">
                            <li class="flex items-start gap-3">
                                <span class="text-balance-teal font-bold">🌾</span>
                                <span>Tập trung bón phân, làm cỏ cho lúa và hoa màu.</span>
                            </li>
                            <li class="flex items-start gap-3">
                                <span class="text-balance-teal font-bold">🌱</span>
                                <span>Gieo trồng các loại cây ưa ấm, tận dụng khí trời ôn hòa.</span>
                            </li>
                        </ul>
                    </div>
                    <div class="flex items-center justify-center bg-pure-white rounded-2xl p-6 border border-dashed border-gray-300">
                        <div class="text-center">
                            <div class="text-9xl mb-4 opacity-80 animate-float">🌿</div>
                            <p class="font-script text-2xl text-night-blue">Mùa màng tốt tươi</p>
                        </div>
                    </div>
                </div>

                <!-- Phong Tuc Content -->
                <div id="content-phong-tuc" class="hidden grid-cols-1 md:grid-cols-2 gap-10 w-full animate-fade-in">
                    <!-- Card 1 -->
                    <div class="bg-pure-white p-8 rounded-2xl border-l-4 border-sun-gold hover:bg-gray-50 transition group">
                        <div class="text-5xl mb-4 group-hover:scale-110 transition duration-300">🥚</div>
                        <h4 class="text-2xl font-serif font-bold text-night-blue mb-3">Dựng Trứng (Lập Đản)</h4>
                        <p class="text-gray-600 leading-relaxed font-light">
                            Tục lệ thú vị: Dựng đứng trứng gà vào ngày Xuân Phân. Tin rằng lực hấp dẫn cân bằng giúp trứng dễ đứng, mang lại may mắn.
                        </p>
                    </div>
                    <!-- Card 2 -->
                    <div class="bg-pure-white p-8 rounded-2xl border-l-4 border-balance-teal hover:bg-gray-50 transition group">
                        <div class="text-5xl mb-4 group-hover:scale-110 transition duration-300">🌞</div>
                        <h4 class="text-2xl font-serif font-bold text-night-blue mb-3">Tế Mặt Trời & Ăn Rau</h4>
                        <p class="text-gray-600 leading-relaxed font-light">
                            Vua chúa tế lễ Mặt Trời cầu mưa thuận gió hòa. Dân gian đi hái rau xuân (rau tề thái) để hưởng sinh khí đất trời.
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
                    <span class="text-balance-teal font-bold tracking-widest uppercase text-sm">Cân Bằng Âm Dương</span>
                    <h3 class="text-4xl font-serif font-bold text-night-blue mt-2 mb-6">Trọng Ở Chữ "Hòa"</h3>
                    <p class="text-gray-600 text-lg leading-relaxed mb-6">
                        Xuân Phân là lúc Âm Dương cân bằng. Nguyên tắc dưỡng sinh là <strong>"Giữ Cân Bằng"</strong>, không thái quá, không bất cập.
                    </p>
                    <div class="bg-white p-6 rounded-xl border-l-4 border-balance-teal shadow-sm">
                        <h4 class="font-bold text-lg text-balance-teal mb-2 font-serif">Nguyên Tắc Ẩm Thực</h4>
                        <p class="text-gray-600 mb-2"><strong>Hàn Nhiệt Điều Hòa:</strong> Không ăn quá nóng, không ăn quá lạnh.</p>
                        <p class="text-gray-600"><strong>Tính Bình:</strong> Ưu tiên thực phẩm giúp điều hòa cơ thể.</p>
                    </div>
                </div>

                <div class="space-y-4 font-sans text-gray-700">
                    <div class="flex items-center gap-4 p-3 bg-white rounded-lg shadow-sm">
                        <div class="w-10 h-10 rounded-full bg-balance-teal/10 flex items-center justify-center text-xl">🛌</div>
                        <div>
                            <strong>Ngủ Nghỉ:</strong> Điều độ. Tránh ngủ quá nhiều (hại khí) hoặc thức quá khuya (hại huyết).
                        </div>
                    </div>
                    <div class="flex items-center gap-4 p-3 bg-white rounded-lg shadow-sm">
                        <div class="w-10 h-10 rounded-full bg-balance-teal/10 flex items-center justify-center text-xl">👕</div>
                        <div>
                            <strong>Trang Phục:</strong> Mặc thoải mái, nới lỏng thắt lưng. Giữ ấm nhẹ khi trời còn se lạnh.
                        </div>
                    </div>
                </div>
            </div>

            <!-- Right: Interactive Food Filter -->
            <div class="lg:col-span-7">
                <div class="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden flex flex-col h-full">
                    <div class="bg-balance-teal p-8 text-white">
                        <h4 class="text-2xl font-serif font-bold flex items-center gap-3">
                            <span>🥗</span> Thực Đơn Cân Bằng
                        </h4>
                        <p class="opacity-90 mt-2 font-light text-sm">Chọn thực phẩm tính bình, điều hòa cơ thể.</p>
                    </div>

                    <!-- Filters -->
                    <div class="p-6 border-b border-gray-100 flex gap-3 overflow-x-auto no-scrollbar">
                        <button onclick="filterFood('all')" class="food-btn active px-5 py-2 rounded-full text-sm font-bold bg-gray-100 text-gray-600 hover:bg-gray-200 transition whitespace-nowrap" data-filter="all">Tất Cả</button>
                        <button onclick="filterFood('good')" class="food-btn px-5 py-2 rounded-full text-sm font-bold bg-gray-100 text-gray-600 hover:bg-gray-200 transition whitespace-nowrap" data-filter="good">Nên Dùng (Tính Bình)</button>
                        <button onclick="filterFood('bad')" class="food-btn px-5 py-2 rounded-full text-sm font-bold bg-gray-100 text-gray-600 hover:bg-gray-200 transition whitespace-nowrap" data-filter="bad">Hạn Chế (Đại Hàn/Nhiệt)</button>
                    </div>

                    <!-- Grid -->
                    <div id="food-grid" class="p-6 grid grid-cols-2 sm:grid-cols-3 gap-4 overflow-y-auto max-h-[500px] bg-pure-white">
                        <!-- JS populated -->
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Section 5: Chiêm Nghiệm (Philosophy) -->
    <section id="chiem-nghiem" class="py-32 bg-night-blue text-white text-center px-4 relative overflow-hidden">
        <!-- Abstract Background Shape -->
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-balance-teal/20 rounded-full blur-[100px] pointer-events-none"></div>

        <div class="max-w-3xl mx-auto relative z-10">
            <span class="text-6xl text-gray-500 font-serif opacity-50 block mb-6">❝</span>
            
            <h3 class="text-4xl md:text-5xl font-serif font-bold mb-10 text-white leading-tight">
                Đạo Của Sự Cân Bằng:<br>Trung Đạo
            </h3>
            
            <p class="text-xl text-gray-300 leading-loose mb-12 font-sans font-light">
                Hạnh phúc bền vững không nằm ở cực đoan, mà ở sự cân bằng. Khi lòng ta tĩnh tại, không nghiêng về bên nào, ta sẽ thấy vẻ đẹp chân thực của vạn vật. Hãy nhẹ nhàng điều chỉnh lại cán cân cuộc sống, để tâm hồn trở về trạng thái "Xuân Phân".
            </p>

            <div class="inline-block border border-gray-600 rounded-2xl p-10 bg-white/5 backdrop-blur-sm hover:bg-white/10 transition duration-500 cursor-default group">
                <p class="font-bold uppercase tracking-[0.2em] text-sm text-sun-gold mb-6 font-sans group-hover:text-white transition">Lời Chúc Xuân Phân</p>
                <div class="text-3xl md:text-4xl font-script text-balance-teal leading-relaxed group-hover:scale-105 transition duration-500">
                    "Trong ngoài tương hợp,<br>Thân tâm an hòa."
                </div>
            </div>
            
            <span class="text-6xl text-gray-500 font-serif opacity-50 block mt-12">❞</span>
        </div>
    </section>

    <!-- Footer -->
    <footer class="bg-[#1d353f] text-gray-500 py-12 text-center text-sm font-sans border-t border-gray-800">
        <p class="italic tracking-wide mb-3 text-gray-400">Biên soạn dựa trên nguyên lý 24 Tiết khí & Văn hóa Phương Đông</p>
        <p class="text-gray-600">© Bản quyền thuộc về <span class="font-script text-xl text-balance-teal ml-1">Tịch Phong Thiên Sơn - 夕风天山</span></p>
    </footer>

    <!-- Javascript Logic -->
    <script>
        // --- Data ---
        const foodData = [
            { name: "Mật Ong", type: "good", icon: "🍯", desc: "Tính bình, bổ trung ích khí" },
            { name: "Hạt Sen", type: "good", icon: "🪷", desc: "Dưỡng tâm, an thần" },
            { name: "Cam Thảo", type: "good", icon: "🌿", desc: "Điều hòa các vị thuốc" },
            { name: "Củ Mài", type: "good", icon: "🍠", desc: "Bổ tỳ vị, tính bình" },
            { name: "Rau Xanh", type: "good", icon: "🥬", desc: "Thanh đạm, cân bằng" },
            { name: "Trứng Gà", type: "good", icon: "🥚", desc: "Dinh dưỡng cân bằng" },
            { name: "Ớt Cay", type: "bad", icon: "🌶️", desc: "Đại nhiệt, gây nóng trong" },
            { name: "Kem Lạnh", type: "bad", icon: "🍦", desc: "Đại hàn, hại tỳ vị" },
            { name: "Đồ Chiên", type: "bad", icon: "🍟", desc: "Quá bổ béo, gây ngưng trệ" }
        ];

        // --- Tab Logic ---
        function switchTab(tab) {
            document.getElementById('content-nong-nghiep').classList.add('hidden');
            document.getElementById('content-nong-nghiep').classList.remove('grid');
            document.getElementById('content-phong-tuc').classList.add('hidden');
            document.getElementById('content-phong-tuc').classList.remove('grid');

            document.getElementById('btn-nong-nghiep').classList.remove('active-tab', 'text-white');
            document.getElementById('btn-nong-nghiep').classList.add('text-balance-teal');
            document.getElementById('btn-phong-tuc').classList.remove('active-tab', 'text-white');
            document.getElementById('btn-phong-tuc').classList.add('text-balance-teal');

            const content = document.getElementById(\`content-\${tab}\`);
            content.classList.remove('hidden');
            content.classList.add('grid');
            
            const btn = document.getElementById(\`btn-\${tab}\`);
            btn.classList.add('active-tab');
            btn.classList.remove('text-balance-teal');
        }

        // --- Food Filter Logic ---
        function filterFood(filter) {
            const grid = document.getElementById('food-grid');
            grid.innerHTML = ''; 

            document.querySelectorAll('.food-btn').forEach(btn => {
                if(btn.dataset.filter === filter) {
                    btn.classList.add('bg-balance-teal', 'text-white');
                    btn.classList.remove('bg-gray-100', 'text-gray-600');
                } else {
                    btn.classList.remove('bg-balance-teal', 'text-white');
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

        // --- Canvas Animation (Balance/Rotation) ---
        function initBalanceCanvas() {
            const canvas = document.getElementById('balanceCanvas');
            const ctx = canvas.getContext('2d');
            let width, height;
            let angle = 0;

            function resize() {
                width = window.innerWidth;
                height = window.innerHeight;
                canvas.width = width;
                canvas.height = height;
            }
            window.addEventListener('resize', resize);
            resize();

            function drawYinYang(x, y, radius, angle) {
                ctx.save();
                ctx.translate(x, y);
                ctx.rotate(angle);
                
                // Draw border
                ctx.beginPath();
                ctx.arc(0, 0, radius, 0, Math.PI * 2);
                ctx.strokeStyle = '#2A9D8F';
                ctx.lineWidth = 2;
                ctx.stroke();

                // Draw S-curve
                ctx.beginPath();
                ctx.arc(0, -radius/2, radius/2, Math.PI/2, Math.PI*1.5);
                ctx.arc(0, radius/2, radius/2, Math.PI*1.5, Math.PI/2, true);
                ctx.arc(0, 0, radius, Math.PI/2, Math.PI*1.5, true);
                ctx.fillStyle = 'rgba(42, 157, 143, 0.1)'; // Teal half
                ctx.fill();

                // Draw other half
                ctx.beginPath();
                ctx.arc(0, -radius/2, radius/2, Math.PI/2, Math.PI*1.5);
                ctx.arc(0, radius/2, radius/2, Math.PI*1.5, Math.PI/2, true);
                ctx.arc(0, 0, radius, Math.PI/2, Math.PI*1.5);
                ctx.fillStyle = 'rgba(233, 196, 106, 0.1)'; // Gold half
                ctx.fill();

                ctx.restore();
            }

            function animate() {
                ctx.clearRect(0, 0, width, height);
                // Draw a large rotating Yin Yang in background
                drawYinYang(width / 2, height / 2, Math.min(width, height) * 0.4, angle);
                angle += 0.002;
                requestAnimationFrame(animate);
            }
            animate();
        }

        // --- Init ---
        document.addEventListener('DOMContentLoaded', () => {
            initBalanceCanvas();
            filterFood('all');

            // Chart 1: Solar Term 0 deg
            const ctx1 = document.getElementById('solarChart').getContext('2d');
            new Chart(ctx1, {
                type: 'doughnut',
                data: {
                    labels: ['Xuân Phân', 'Thanh Minh', 'Cốc Vũ', 'Mùa Khác'],
                    datasets: [{
                        data: [15, 15, 15, 315],
                        backgroundColor: ['#2A9D8F', '#E9C46A', '#E9C46A', '#F4F1DE'],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    rotation: -90, 
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
                        ctx.fillStyle = "#2A9D8F";
                        var text = "0°",
                            textX = Math.round((width - ctx.measureText(text).width) / 2),
                            textY = height / 2;
                        ctx.fillText(text, textX, textY);
                        ctx.save();
                    }
                }]
            });

            // Chart 2: Day/Night Balance (Pie)
            const ctx2 = document.getElementById('dayNightChart').getContext('2d');
            new Chart(ctx2, {
                type: 'pie',
                data: {
                    labels: ['Ban Ngày', 'Ban Đêm'],
                    datasets: [
                        {
                            data: [50, 50],
                            backgroundColor: ['#E9C46A', '#264653'], // Gold vs Dark Blue
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
