export const HaChi = `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Hạ Chí: Đỉnh Cao Của Dương Khí & Sự Chuyển Mình Thầm Lặng</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    
    <!-- Fonts: Philosopher (Tiêu đề - Uy nghi), Be Vietnam Pro (Nội dung - Mạch lạc), Dancing Script (Thơ - Bay bổng) -->
    <link href="https://fonts.googleapis.com/css2?family=Philosopher:ital,wght@0,400;0,700;1,400;1,700&family=Be+Vietnam+Pro:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400&family=Dancing+Script:wght@400;700&display=swap" rel="stylesheet">
    
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        'blazing-sun': '#FF5400',  // Cam đỏ rực rỡ (Dương cực thịnh)
                        'deep-shade': '#003049',   // Xanh đen (Âm khí nhen nhóm/Bóng râm)
                        'golden-light': '#FFD166', // Vàng kim (Ánh sáng chói lòa)
                        'cool-jade': '#06D6A0',    // Xanh ngọc (Giải nhiệt)
                        'paper-hot': '#FFF8F0',    // Nền trắng ấm
                        'noodle-wheat': '#F4A261'  // Màu mì sợi (Thực phẩm đặc trưng)
                    },
                    fontFamily: {
                        serif: ['"Philosopher"', 'serif'],
                        sans: ['"Be Vietnam Pro"', 'sans-serif'],
                        script: ['"Dancing Script"', 'cursive'],
                    },
                    animation: {
                        'pulse-glow': 'pulseGlow 3s infinite',
                    },
                    keyframes: {
                        pulseGlow: {
                            '0%, 100%': { boxShadow: '0 0 20px #FF5400' },
                            '50%': { boxShadow: '0 0 40px #FFD166' },
                        }
                    }
                }
            }
        }
    </script>
    <style>
        body {
            background-color: #FFF8F0;
            color: #003049;
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
        /* Sun Flare Canvas Layer */
        #sunFlareCanvas {
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
        }
        .card-interaction:hover {
            transform: translateY(-5px);
            border-color: #FF5400;
            box-shadow: 0 10px 30px -10px rgba(255, 84, 0, 0.3);
            background-color: white;
        }
        .active-tab {
            background-color: #FF5400;
            color: white;
            border-color: #FF5400;
        }
        .no-scrollbar::-webkit-scrollbar {
            display: none;
        }
        .no-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
    </style>
    <!-- Chosen Palette: "Zenith of Yang" - Blazing Orange, Deep Shadow Blue, Golden Light -->
    <!-- Application Structure Plan:
        1. Hero: Title with "Sun Zenith" visual cue (Canvas animation).
        2. Thien Tuong (Cosmic): Chart showing 90° & The peak of Yang/Birth of Yin.
        3. Tam Hau (Nature): 3 Micro-seasons (Deer Horns Drop, Cicadas, Ban Ha Herb).
        4. Doi Song (Life): Tabs for Agriculture ("Sun & Rain") & Customs ("Noodles & Earth Worship").
        5. Duong Sinh (Health): "Clear Heat/Replenish Water" - Food Filter (Cool/Sour vs Hot/Cold Shock).
        6. Chiem Nghiem (Philosophy): Peak & Humility (Duong Cuc Sinh Am).
        7. Footer: Copyright Tich Phong Thien Son.
    -->
    <!-- Visualization & Content Choices:
        1. Solar Gauge: Chart.js Doughnut (90°).
        2. Yin Yang Balance: Stacked Bar Chart showing Yang maxing out then Yin appearing.
        3. Food Filter: Logic for Heat-clearing foods (Bitter melon, Mung bean).
        4. Sun Animation: HTML5 Canvas for intense, rotating sun flares.
    -->
    <!-- CONFIRMATION: NO SVG graphics used. NO Mermaid JS used. -->
</head>
<body class="font-sans antialiased leading-relaxed selection:bg-blazing-sun selection:text-white">

    <!-- Background Animation -->
    <canvas id="sunFlareCanvas"></canvas>

    <!-- Navigation -->
    <nav class="sticky top-0 z-50 bg-paper-hot/95 backdrop-blur-md border-b border-blazing-sun/20 shadow-sm transition-all duration-300">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between h-20 items-center">
                <div class="flex-shrink-0 flex items-center gap-3">
                    <span class="text-3xl filter drop-shadow-sm animate-pulse-glow rounded-full">☀️</span>
                    <div class="flex flex-col">
                        <span class="text-2xl font-serif font-bold text-blazing-sun tracking-wide">Hạ Chí</span>
                        <span class="text-xs font-sans text-deep-shade uppercase tracking-widest font-bold">Dương Cực Sinh Âm</span>
                    </div>
                </div>
                <div class="hidden md:flex space-x-10">
                    <button onclick="scrollToSection('y-nghia')" class="text-deep-shade hover:text-blazing-sun transition font-medium tracking-wide text-sm uppercase">Ý Nghĩa</button>
                    <button onclick="scrollToSection('tam-hau')" class="text-deep-shade hover:text-blazing-sun transition font-medium tracking-wide text-sm uppercase">Tam Hậu</button>
                    <button onclick="scrollToSection('doi-song')" class="text-deep-shade hover:text-blazing-sun transition font-medium tracking-wide text-sm uppercase">Đời Sống</button>
                    <button onclick="scrollToSection('duong-sinh')" class="text-deep-shade hover:text-blazing-sun transition font-medium tracking-wide text-sm uppercase">Dưỡng Sinh</button>
                    <button onclick="scrollToSection('chiem-nghiem')" class="text-deep-shade hover:text-blazing-sun transition font-medium tracking-wide text-sm uppercase">Chiêm Nghiệm</button>
                </div>
            </div>
        </div>
    </nav>

    <!-- Hero Section -->
    <header class="relative pt-24 pb-20 px-4 text-center z-10 overflow-hidden">
        <div class="max-w-4xl mx-auto">
            <p class="text-blazing-sun font-bold tracking-[0.3em] uppercase mb-6 text-sm font-sans">Tiết Khí Thứ 10 • 21-22 Tháng 6</p>
            <h1 class="text-6xl md:text-8xl font-serif font-bold text-deep-shade mb-6 leading-tight relative inline-block">
                Hạ Chí
                <span class="absolute -top-4 -right-12 text-4xl animate-bounce text-golden-light">🔥</span>
            </h1>
            <h2 class="text-3xl md:text-5xl font-script text-noodle-wheat mb-10 font-bold transform -rotate-1">
                Đỉnh Cao Của Mùa Hạ
            </h2>
            <div class="w-24 h-1 bg-blazing-sun mx-auto mb-10 rounded-full shadow-[0_0_15px_#FF5400]"></div>
            <p class="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-loose font-light">
                "Ngày dài nhất, bóng ngắn nhất. Khi mặt trời rực rỡ nhất cũng là lúc bóng tối bắt đầu nhen nhóm. Đỉnh cao chói lọi chứa đựng sự chuyển mình thầm lặng."
            </p>
            <div class="mt-14">
                <button onclick="scrollToSection('y-nghia')" class="group relative inline-flex items-center justify-center px-10 py-3 overflow-hidden font-serif italic tracking-wide text-white transition duration-300 ease-out border-2 border-blazing-sun rounded-full shadow-md bg-blazing-sun">
                    <span class="absolute inset-0 flex items-center justify-center w-full h-full text-white duration-300 -translate-x-full bg-deep-shade group-hover:translate-x-0 ease">
                        <span class="text-xl">☯️</span>
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
            <h3 class="text-4xl font-serif font-bold text-deep-shade mb-4 inline-block relative">
                Ngày Dài Nhất - Bóng Ngắn Nhất
                <span class="absolute -bottom-2 left-0 w-full h-1 bg-golden-light"></span>
            </h3>
            <p class="text-gray-600 max-w-2xl mx-auto mt-6 text-lg leading-relaxed">
                Mặt Trời kinh độ 90°. "Hạ" là mùa hè, "Chí" là cực điểm. Bắc bán cầu nhận nhiều ánh sáng nhất, ngày dài nhất trong năm.
            </p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <!-- Charts Column -->
            <div class="space-y-10">
                <div class="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
                    <h4 class="text-xl font-serif font-bold text-blazing-sun mb-2 text-center">Vị Trí Thiên Văn (90°)</h4>
                    <div class="chart-container">
                        <canvas id="solarChart"></canvas>
                    </div>
                </div>
                
                <div class="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                    <h4 class="text-xl font-serif font-bold text-deep-shade mb-2 text-center">Dương Cực Sinh Âm</h4>
                    <div class="chart-container" style="height: 250px;">
                        <canvas id="yinYangChart"></canvas>
                    </div>
                    <p class="text-center text-sm text-gray-400 mt-4 italic">Dương khí đạt đỉnh, Âm khí bắt đầu sinh.</p>
                </div>
            </div>

            <!-- Content Explanation -->
            <div class="space-y-8 text-lg text-gray-600 leading-relaxed font-light">
                <div class="p-6 bg-white rounded-xl border-l-4 border-blazing-sun shadow-sm">
                    <strong class="text-deep-shade font-serif text-xl block mb-2">Quy Luật Tự Nhiên</strong>
                    <p>
                        "Vật cực tất phản". Khi Dương khí thịnh vượng nhất cũng là lúc nó bắt đầu suy thoái, nhường chỗ cho mầm mống của Âm khí từ lòng đất.
                    </p>
                </div>
                <div>
                    <strong class="text-deep-shade font-serif text-xl block mb-2">Đặc Điểm Khí Hậu</strong>
                    <p>
                        Nắng nóng gay gắt, mưa rào thường xuyên và lượng mưa lớn. Thời điểm này vạn vật sinh trưởng cực nhanh nhưng cũng tiềm ẩn sự thay đổi.
                    </p>
                </div>
            </div>
        </div>
    </section>

    <!-- Section 2: Tam Hậu (Nature) -->
    <section id="tam-hau" class="py-24 bg-white relative z-10">
        <div class="max-w-6xl mx-auto px-4">
            <h3 class="text-3xl font-serif font-bold text-cool-jade mb-12 text-center">Tam Hậu: Ba Tín Hiệu Của Sự Chuyển Hóa</h3>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                <!-- Card 1 -->
                <div class="card-interaction bg-paper-hot p-8 rounded-2xl cursor-default group text-center">
                    <div class="w-20 h-20 mx-auto rounded-full bg-blazing-sun/20 flex items-center justify-center text-4xl mb-6 group-hover:scale-110 transition">🦌</div>
                    <h5 class="font-bold text-xl text-deep-shade mb-3 font-serif">1. Lộc Giác Giải</h5>
                    <p class="text-gray-600 font-light">Hươu (thuộc dương) cảm nhận được âm khí mới sinh mà rụng sừng. Dấu hiệu đầu tiên của sự suy giảm dương khí.</p>
                </div>

                <!-- Card 2 -->
                <div class="card-interaction bg-paper-hot p-8 rounded-2xl cursor-default group text-center">
                    <div class="w-20 h-20 mx-auto rounded-full bg-deep-shade/20 flex items-center justify-center text-4xl mb-6 group-hover:scale-110 transition">🦗</div>
                    <h5 class="font-bold text-xl text-deep-shade mb-3 font-serif">2. Tê Qui</h5>
                    <p class="text-gray-600 font-light">Ve sầu (thuộc âm) bắt đầu kêu râm ran. Tiếng ve báo hiệu mùa hè nhưng cũng là tiếng gọi của âm khí.</p>
                </div>

                <!-- Card 3 -->
                <div class="card-interaction bg-paper-hot p-8 rounded-2xl cursor-default group text-center">
                    <div class="w-20 h-20 mx-auto rounded-full bg-cool-jade/20 flex items-center justify-center text-4xl mb-6 group-hover:scale-110 transition">🌿</div>
                    <h5 class="font-bold text-xl text-deep-shade mb-3 font-serif">3. Bán Hạ Sinh</h5>
                    <p class="text-gray-600 font-light">Cây Bán Hạ (vị thuốc ưa âm) bắt đầu mọc lên giữa mùa hè nóng bức, minh chứng cho sự tồn tại của âm trong dương.</p>
                </div>
            </div>
        </div>
    </section>

    <!-- Section 3: Đời Sống (Tabs) -->
    <section id="doi-song" class="py-24 px-4 bg-paper-hot relative z-10">
        <div class="max-w-6xl mx-auto">
            <div class="mb-12 text-center">
                <h3 class="text-4xl font-serif font-bold text-blazing-sun mb-4">Nắng Lửa & Mùa Vụ</h3>
                <p class="text-gray-600 italic">"Hạ Chí không mưa, đợi đến bao giờ"</p>
            </div>

            <!-- Custom Tabs -->
            <div class="flex justify-center mb-10 space-x-4">
                <button onclick="switchTab('nong-nghiep')" id="btn-nong-nghiep" class="active-tab px-8 py-3 rounded-full border border-blazing-sun font-bold transition duration-300 font-serif tracking-wide shadow-sm">Nông Nghiệp</button>
                <button onclick="switchTab('phong-tuc')" id="btn-phong-tuc" class="px-8 py-3 rounded-full border border-blazing-sun text-blazing-sun font-bold hover:bg-blazing-sun hover:text-white transition duration-300 font-serif tracking-wide shadow-sm">Phong Tục</button>
            </div>

            <!-- Content Area -->
            <div class="bg-white p-8 md:p-12 rounded-3xl border border-gray-100 min-h-[400px] flex items-center shadow-sm relative overflow-hidden">
                <div class="absolute top-0 right-0 w-32 h-32 bg-golden-light/10 rounded-bl-full pointer-events-none"></div>

                <!-- Nong Nghiep Content -->
                <div id="content-nong-nghiep" class="grid grid-cols-1 md:grid-cols-2 gap-10 w-full animate-fade-in">
                    <div class="flex flex-col justify-center">
                        <h4 class="text-3xl font-serif font-bold text-cool-jade mb-6">Nước & Cỏ Dại</h4>
                        <p class="text-gray-700 leading-relaxed mb-6">
                            Nhiệt độ cao và mưa nhiều giúp cây trồng lớn nhanh, nhưng cỏ dại và sâu bệnh cũng phát triển mạnh.
                        </p>
                        <ul class="space-y-4 text-gray-600 font-light">
                            <li class="flex items-start gap-3">
                                <span class="text-blazing-sun font-bold">🌱</span>
                                <span><strong>Sinh Trưởng:</strong> Lúa mùa cần nhiều nước để đẻ nhánh.</span>
                            </li>
                            <li class="flex items-start gap-3">
                                <span class="text-deep-shade font-bold">🌿</span>
                                <span><strong>Thách Thức:</strong> Vất vả làm cỏ, phòng trừ sâu bệnh.</span>
                            </li>
                        </ul>
                    </div>
                    <div class="flex items-center justify-center bg-paper-hot rounded-2xl p-6 border border-dashed border-gray-300">
                        <div class="text-center">
                            <div class="text-9xl mb-4 opacity-80 animate-pulse">🌧️</div>
                            <p class="font-script text-2xl text-deep-shade">Mưa rào giải nhiệt</p>
                        </div>
                    </div>
                </div>

                <!-- Phong Tuc Content -->
                <div id="content-phong-tuc" class="hidden grid-cols-1 md:grid-cols-2 gap-10 w-full animate-fade-in">
                    <!-- Card 1 -->
                    <div class="bg-paper-hot p-8 rounded-2xl border-l-4 border-noodle-wheat hover:bg-gray-50 transition group">
                        <div class="text-5xl mb-4 group-hover:scale-110 transition duration-300">🍜</div>
                        <h4 class="text-2xl font-serif font-bold text-deep-shade mb-3">Ăn Mì Hạ Chí</h4>
                        <p class="text-gray-600 leading-relaxed font-light">
                            "Đông chí ăn sủi cảo, Hạ chí ăn mì". Thưởng thức hương vị lúa mì mới thu hoạch, cầu mong sức khỏe dồi dào.
                        </p>
                    </div>
                    <!-- Card 2 -->
                    <div class="bg-paper-hot p-8 rounded-2xl border-l-4 border-deep-shade hover:bg-gray-50 transition group">
                        <div class="text-5xl mb-4 group-hover:scale-110 transition duration-300">🌏</div>
                        <h4 class="text-2xl font-serif font-bold text-deep-shade mb-3">Tế Thần Đất</h4>
                        <p class="text-gray-600 leading-relaxed font-light">
                            Hạ Chí âm khí bắt đầu sinh từ lòng đất. Người xưa làm lễ tạ ơn Thần Đất đã nuôi dưỡng vạn vật sinh sôi.
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
                    <span class="text-cool-jade font-bold tracking-widest uppercase text-sm">Thanh Nhiệt • Giải Thử</span>
                    <h3 class="text-4xl font-serif font-bold text-deep-shade mt-2 mb-6">Tránh Nắng, Bổ Nước</h3>
                    <p class="text-gray-600 text-lg leading-relaxed mb-6">
                        Nhiệt độ cao dễ gây mất nước, say nắng. Dù trời nóng nhưng tỳ vị dễ lạnh do âm khí nội sinh.
                    </p>
                    <div class="bg-white p-6 rounded-xl border-l-4 border-cool-jade shadow-sm">
                        <h4 class="font-bold text-lg text-cool-jade mb-2 font-serif">Nguyên Tắc Ẩm Thực</h4>
                        <p class="text-gray-600 mb-2"><strong>Đồ Mát & Chua:</strong> Thanh nhiệt, thu liễm mồ hôi (Mướp đắng, Canh chua).</p>
                        <p class="text-gray-600"><strong>Tránh Quá Lạnh:</strong> Hạn chế nước đá để bảo vệ dạ dày.</p>
                    </div>
                </div>

                <div class="space-y-4 font-sans text-gray-700">
                    <div class="flex items-center gap-4 p-3 bg-white rounded-lg shadow-sm">
                        <div class="w-10 h-10 rounded-full bg-blazing-sun/10 flex items-center justify-center text-xl">🌞</div>
                        <div>
                            <strong>Tránh Nắng:</strong> Hạn chế ra ngoài giờ Ngọ (11h-13h).
                        </div>
                    </div>
                    <div class="flex items-center gap-4 p-3 bg-white rounded-lg shadow-sm">
                        <div class="w-10 h-10 rounded-full bg-blazing-sun/10 flex items-center justify-center text-xl">😴</div>
                        <div>
                            <strong>Tí Ngọ Giác:</strong> Ngủ trưa để dưỡng Tâm và phục hồi năng lượng.
                        </div>
                    </div>
                </div>
            </div>

            <!-- Right: Interactive Food Filter -->
            <div class="lg:col-span-7">
                <div class="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden flex flex-col h-full">
                    <div class="bg-deep-shade p-8 text-white">
                        <h4 class="text-2xl font-serif font-bold flex items-center gap-3">
                            <span>🍉</span> Thực Đơn Giải Nhiệt
                        </h4>
                        <p class="opacity-90 mt-2 font-light text-sm">Chọn thực phẩm làm mát và bù điện giải.</p>
                    </div>

                    <!-- Filters -->
                    <div class="p-6 border-b border-gray-100 flex gap-3 overflow-x-auto no-scrollbar">
                        <button onclick="filterFood('all')" class="food-btn active px-5 py-2 rounded-full text-sm font-bold bg-gray-100 text-gray-600 hover:bg-gray-200 transition whitespace-nowrap" data-filter="all">Tất Cả</button>
                        <button onclick="filterFood('good')" class="food-btn px-5 py-2 rounded-full text-sm font-bold bg-gray-100 text-gray-600 hover:bg-gray-200 transition whitespace-nowrap" data-filter="good">Nên Dùng (Mát/Chua)</button>
                        <button onclick="filterFood('bad')" class="food-btn px-5 py-2 rounded-full text-sm font-bold bg-gray-100 text-gray-600 hover:bg-gray-200 transition whitespace-nowrap" data-filter="bad">Hạn Chế (Đá Lạnh)</button>
                    </div>

                    <!-- Grid -->
                    <div id="food-grid" class="p-6 grid grid-cols-2 sm:grid-cols-3 gap-4 overflow-y-auto max-h-[500px] bg-paper-hot">
                        <!-- JS populated -->
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Section 5: Chiêm Nghiệm (Philosophy) -->
    <section id="chiem-nghiem" class="py-32 bg-deep-shade text-white text-center px-4 relative overflow-hidden">
        <!-- Abstract Background Shape -->
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blazing-sun/20 rounded-full blur-[100px] pointer-events-none"></div>

        <div class="max-w-3xl mx-auto relative z-10">
            <span class="text-6xl text-gray-500 font-serif opacity-50 block mb-6">❝</span>
            
            <h3 class="text-4xl md:text-5xl font-serif font-bold mb-10 text-white leading-tight">
                Đỉnh Cao & Khiêm Cung
            </h3>
            
            <p class="text-xl text-gray-300 leading-loose mb-12 font-sans font-light">
                Khi ở đỉnh cao danh vọng (như Mặt Trời ngày Hạ Chí), hãy cẩn trọng vì "Dương cực sinh Âm". Đừng vì hào quang mà quên đi sự thay đổi đang âm thầm diễn ra. Hãy biết tìm cho mình những khoảng lặng (bóng râm) để cân bằng cái tôi nóng nảy.
            </p>

            <div class="inline-block border border-gray-600 rounded-2xl p-10 bg-white/5 backdrop-blur-sm hover:bg-white/10 transition duration-500 cursor-default group">
                <p class="font-bold uppercase tracking-[0.2em] text-sm text-golden-light mb-6 font-sans group-hover:text-white transition">Lời Chúc Hạ Chí</p>
                <div class="text-3xl md:text-4xl font-script text-cool-jade leading-relaxed group-hover:scale-105 transition duration-500">
                    "Rực rỡ không chói lóa,<br>Nồng nhiệt vẫn an nhiên."
                </div>
            </div>
            
            <span class="text-6xl text-gray-500 font-serif opacity-50 block mt-12">❞</span>
        </div>
    </section>

    <!-- Footer -->
    <footer class="bg-[#002030] text-gray-500 py-12 text-center text-sm font-sans border-t border-gray-800">
        <p class="italic tracking-wide mb-3 text-gray-400">Biên soạn dựa trên nguyên lý 24 Tiết khí & Văn hóa Phương Đông</p>
        <p class="text-gray-600">© Bản quyền thuộc về <span class="font-script text-xl text-blazing-sun ml-1">Tịch Phong Thiên Sơn - 夕风天山</span></p>
    </footer>

    <!-- Javascript Logic -->
    <script>
        // --- Data ---
        const foodData = [
            { name: "Mướp Đắng", type: "good", icon: "🥒", desc: "Thanh nhiệt, giải độc tốt nhất" },
            { name: "Dưa Hấu", type: "good", icon: "🍉", desc: "Bổ nước, giải say nắng" },
            { name: "Đậu Xanh", type: "good", icon: "🫘", desc: "Làm mát, trừ phiền nhiệt" },
            { name: "Bí Đao", type: "good", icon: "🍈", desc: "Lợi tiểu, thanh nhiệt" },
            { name: "Ngó Sen", type: "good", icon: "🪷", desc: "Mát máu, an thần" },
            { name: "Chanh Muối", type: "good", icon: "🍋", desc: "Bù điện giải, sinh tân dịch" },
            { name: "Nước Đá", type: "bad", icon: "🧊", desc: "Gây lạnh bụng, hại dương khí" },
            { name: "Kem Lạnh", type: "bad", icon: "🍦", desc: "Sốc nhiệt, đau bụng" },
            { name: "Đồ Cay", type: "bad", icon: "🌶️", desc: "Tăng hỏa, gây mất nước" }
        ];

        // --- Tab Logic ---
        function switchTab(tab) {
            document.getElementById('content-nong-nghiep').classList.add('hidden');
            document.getElementById('content-nong-nghiep').classList.remove('grid');
            document.getElementById('content-phong-tuc').classList.add('hidden');
            document.getElementById('content-phong-tuc').classList.remove('grid');

            document.getElementById('btn-nong-nghiep').classList.remove('active-tab', 'text-white');
            document.getElementById('btn-nong-nghiep').classList.add('text-deep-shade');
            document.getElementById('btn-phong-tuc').classList.remove('active-tab', 'text-white');
            document.getElementById('btn-phong-tuc').classList.add('text-deep-shade');

            const content = document.getElementById(\`content-\${tab}\`);
            content.classList.remove('hidden');
            content.classList.add('grid');
            
            const btn = document.getElementById(\`btn-\${tab}\`);
            btn.classList.add('active-tab');
            btn.classList.remove('text-deep-shade');
        }

        // --- Food Filter Logic ---
        function filterFood(filter) {
            const grid = document.getElementById('food-grid');
            grid.innerHTML = ''; 

            document.querySelectorAll('.food-btn').forEach(btn => {
                if(btn.dataset.filter === filter) {
                    btn.classList.add('bg-deep-shade', 'text-white');
                    btn.classList.remove('bg-gray-100', 'text-gray-600');
                } else {
                    btn.classList.remove('bg-deep-shade', 'text-white');
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

        // --- Canvas Animation (Sun Flares) ---
        function initSunFlareCanvas() {
            const canvas = document.getElementById('sunFlareCanvas');
            const ctx = canvas.getContext('2d');
            let width, height;
            let rotation = 0;

            function resize() {
                width = window.innerWidth;
                height = window.innerHeight;
                canvas.width = width;
                canvas.height = height;
            }
            window.addEventListener('resize', resize);
            resize();

            function drawFlare(x, y, radius, rays, color) {
                ctx.save();
                ctx.translate(x, y);
                ctx.rotate(rotation);
                
                ctx.beginPath();
                for (let i = 0; i < rays; i++) {
                    const angle = (Math.PI * 2 / rays) * i;
                    const rayLength = radius * (1 + Math.random() * 0.2); // Jittery rays
                    ctx.lineTo(Math.cos(angle) * rayLength, Math.sin(angle) * rayLength);
                    ctx.lineTo(Math.cos(angle + Math.PI / rays) * (radius * 0.5), Math.sin(angle + Math.PI / rays) * (radius * 0.5));
                }
                ctx.closePath();
                ctx.fillStyle = color;
                ctx.fill();
                ctx.restore();
            }

            function animate() {
                ctx.clearRect(0, 0, width, height);
                // Draw a massive, slow-rotating sun flare in top left corner or center
                const gradient = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, width);
                gradient.addColorStop(0, 'rgba(255, 84, 0, 0.1)');
                gradient.addColorStop(1, 'rgba(255, 209, 102, 0)');

                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, width, height);

                rotation += 0.001;
                requestAnimationFrame(animate);
            }
            animate();
        }

        // --- Init ---
        document.addEventListener('DOMContentLoaded', () => {
            initSunFlareCanvas();
            filterFood('all');

            // Chart 1: Solar Term 90 deg
            const ctx1 = document.getElementById('solarChart').getContext('2d');
            new Chart(ctx1, {
                type: 'doughnut',
                data: {
                    labels: ['Hạ Chí', 'Tiểu Thử', 'Đại Thử', 'Mùa Khác'],
                    datasets: [{
                        data: [15, 15, 15, 315],
                        backgroundColor: ['#FF5400', '#FFD166', '#FFD166', '#FFF8F0'],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    rotation: 0, 
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
                        ctx.fillStyle = "#FF5400";
                        var text = "90°",
                            textX = Math.round((width - ctx.measureText(text).width) / 2),
                            textY = height / 2;
                        ctx.fillText(text, textX, textY);
                        ctx.save();
                    }
                }]
            });

            // Chart 2: Yin Yang Balance (Stacked Bar)
            const ctx2 = document.getElementById('yinYangChart').getContext('2d');
            new Chart(ctx2, {
                type: 'bar',
                data: {
                    labels: ['Lập Hạ', 'Mang Chủng', 'Hạ Chí', 'Tiểu Thử'],
                    datasets: [
                        {
                            label: 'Dương Khí',
                            data: [70, 85, 100, 95],
                            backgroundColor: '#FF5400',
                            borderRadius: 4
                        },
                        {
                            label: 'Âm Khí',
                            data: [30, 15, 5, 10], // Yin starts growing after Ha Chi
                            backgroundColor: '#003049',
                            borderRadius: 4
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: { stacked: true, grid: { display: false }, ticks: { font: { family: "'Be Vietnam Pro'" } } },
                        y: { stacked: true, display: false }
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
