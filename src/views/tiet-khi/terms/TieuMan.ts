export const TieuMan = `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tiểu Mãn: Sự Viên Mãn Nhỏ Nhoi & Triết Lý Vừa Đủ</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    
    <!-- Fonts: Philosopher (Tiêu đề - Sâu sắc), Be Vietnam Pro (Nội dung - Chân phương), Dancing Script (Thơ - Bay bổng) -->
    <link href="https://fonts.googleapis.com/css2?family=Philosopher:ital,wght@0,400;0,700;1,400;1,700&family=Be+Vietnam+Pro:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400&family=Dancing+Script:wght@400;700&display=swap" rel="stylesheet">
    
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        'grain-yellow': '#E9C46A', // Vàng lúa non (Sung túc chớm nở)
                        'water-jade': '#2A9D8F',   // Xanh ngọc (Nước đầy/Mát mẻ)
                        'earth-clay': '#BC6C25',   // Nâu đất nung (Vững chãi)
                        'silk-white': '#FEFAE0',   // Trắng lụa (Tơ tằm)
                        'deep-green': '#264653',   // Xanh đậm (Cây cối tốt tươi)
                        'bitter-green': '#606C38'  // Xanh rau đắng
                    },
                    fontFamily: {
                        serif: ['"Philosopher"', 'serif'],
                        sans: ['"Be Vietnam Pro"', 'sans-serif'],
                        script: ['"Dancing Script"', 'cursive'],
                    },
                    animation: {
                        'sway': 'sway 4s ease-in-out infinite',
                    },
                    keyframes: {
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
            background-color: #FEFAE0;
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
        /* Water Ripple Canvas Layer */
        #waterCanvas {
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
            border-color: #E9C46A;
            box-shadow: 0 10px 30px -10px rgba(233, 196, 106, 0.3);
            background-color: white;
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
    <!-- Chosen Palette: "Modest Abundance" - Soft Yellow, Jade Green, Clay Earth -->
    <!-- Application Structure Plan:
        1. Hero: Title with "Ripple/Grain" visual cue (Canvas animation).
        2. Thien Tuong (Cosmic): Chart showing 60° & Water Level rising.
        3. Tam Hau (Nature): 3 Micro-seasons (Bitter Herbs, Grass Wither, Mild Heat).
        4. Doi Song (Life): Tabs for Agriculture ("Water Wheels") & Customs ("Silk God").
        5. Duong Sinh (Health): "Clear Damp-Heat" - Food Filter (Bitter/Cooling vs Greasy/Hot).
        6. Chiem Nghiem (Philosophy): The philosophy of "Just Enough" (Tieu Man vs Dai Man).
        7. Footer: Copyright Tich Phong Thien Son.
    -->
    <!-- Visualization & Content Choices:
        1. Solar Gauge: Chart.js Doughnut (60°).
        2. Fulfillment Scale: Bar Chart comparing "Little Full" (Ideal) vs "Full" (Overflowing).
        3. Food Filter: Logic for Damp-Heat clearing foods (Bitter greens, Red beans).
        4. Water Animation: HTML5 Canvas for gentle ripples.
    -->
    <!-- CONFIRMATION: NO SVG graphics used. NO Mermaid JS used. -->
</head>
<body class="font-sans antialiased leading-relaxed selection:bg-grain-yellow selection:text-deep-green">

    <!-- Background Animation -->
    <canvas id="waterCanvas"></canvas>

    <!-- Navigation -->
    <nav class="sticky top-0 z-50 bg-silk-white/95 backdrop-blur-md border-b border-grain-yellow/20 shadow-sm transition-all duration-300">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between h-20 items-center">
                <div class="flex-shrink-0 flex items-center gap-3">
                    <span class="text-3xl filter drop-shadow-sm animate-sway">🌾</span>
                    <div class="flex flex-col">
                        <span class="text-2xl font-serif font-bold text-earth-clay tracking-wide">Tiểu Mãn</span>
                        <span class="text-xs font-sans text-water-jade uppercase tracking-widest font-bold">Viên Mãn Vừa Đủ</span>
                    </div>
                </div>
                <div class="hidden md:flex space-x-10">
                    <button onclick="scrollToSection('y-nghia')" class="text-deep-green hover:text-earth-clay transition font-medium tracking-wide text-sm uppercase">Ý Nghĩa</button>
                    <button onclick="scrollToSection('tam-hau')" class="text-deep-green hover:text-earth-clay transition font-medium tracking-wide text-sm uppercase">Tam Hậu</button>
                    <button onclick="scrollToSection('doi-song')" class="text-deep-green hover:text-earth-clay transition font-medium tracking-wide text-sm uppercase">Đời Sống</button>
                    <button onclick="scrollToSection('duong-sinh')" class="text-deep-green hover:text-earth-clay transition font-medium tracking-wide text-sm uppercase">Dưỡng Sinh</button>
                    <button onclick="scrollToSection('chiem-nghiem')" class="text-deep-green hover:text-earth-clay transition font-medium tracking-wide text-sm uppercase">Chiêm Nghiệm</button>
                </div>
            </div>
        </div>
    </nav>

    <!-- Hero Section -->
    <header class="relative pt-24 pb-20 px-4 text-center z-10 overflow-hidden">
        <div class="max-w-4xl mx-auto">
            <p class="text-earth-clay font-bold tracking-[0.3em] uppercase mb-6 text-sm font-sans">Tiết Khí Thứ 8 • 20-21 Tháng 5</p>
            <h1 class="text-6xl md:text-8xl font-serif font-bold text-deep-green mb-6 leading-tight relative inline-block">
                Tiểu Mãn
                <span class="absolute -top-4 -right-12 text-4xl animate-pulse">💧</span>
            </h1>
            <h2 class="text-3xl md:text-5xl font-script text-grain-yellow mb-10 font-bold transform -rotate-1">
                Triết Lý Của Sự Vừa Đủ
            </h2>
            <div class="w-24 h-1 bg-water-jade mx-auto mb-10 rounded-full"></div>
            <p class="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-loose font-light">
                "Hạt lúa mới chỉ ngậm sữa, nước sông mới chỉ dâng đầy. Chưa hoàn toàn tròn đầy, nhưng chính sự 'tiểu mãn' ấy mới là trạng thái viên mãn nhất của cuộc đời."
            </p>
            <div class="mt-14">
                <button onclick="scrollToSection('y-nghia')" class="group relative inline-flex items-center justify-center px-10 py-3 overflow-hidden font-serif italic tracking-wide text-white transition duration-300 ease-out border-2 border-water-jade rounded-full shadow-md bg-water-jade">
                    <span class="absolute inset-0 flex items-center justify-center w-full h-full text-white duration-300 -translate-x-full bg-earth-clay group-hover:translate-x-0 ease">
                        <span class="text-xl">🌊</span>
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
            <h3 class="text-4xl font-serif font-bold text-deep-green mb-4 inline-block relative">
                Khi Hạt Lúa Ngậm Sữa
                <span class="absolute -bottom-2 left-0 w-full h-1 bg-grain-yellow"></span>
            </h3>
            <p class="text-gray-600 max-w-2xl mx-auto mt-6 text-lg leading-relaxed">
                Mặt Trời kinh độ 60°. "Tiểu" là nhỏ, "Mãn" là đầy. Lúa mạch bắt đầu chắc hạt nhưng chưa chín hẳn. Nước sông ngòi dâng lên làm đầy ruộng đồng.
            </p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <!-- Charts Column -->
            <div class="space-y-10">
                <div class="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
                    <h4 class="text-xl font-serif font-bold text-earth-clay mb-2 text-center">Vị Trí Thiên Văn (60°)</h4>
                    <div class="chart-container">
                        <canvas id="solarChart"></canvas>
                    </div>
                </div>
                
                <div class="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                    <h4 class="text-xl font-serif font-bold text-water-jade mb-2 text-center">Biểu Đồ "Vừa Đủ" (Tiểu Mãn vs Đại Mãn)</h4>
                    <div class="chart-container" style="height: 250px;">
                        <canvas id="balanceChart"></canvas>
                    </div>
                    <p class="text-center text-sm text-gray-400 mt-4 italic">Trạng thái lý tưởng: Gần đầy (80%) để còn dư địa phát triển.</p>
                </div>
            </div>

            <!-- Content Explanation -->
            <div class="space-y-8 text-lg text-gray-600 leading-relaxed font-light">
                <div class="p-6 bg-white rounded-xl border-l-4 border-grain-yellow shadow-sm">
                    <strong class="text-deep-green font-serif text-xl block mb-2">Ý Nghĩa Mùa Màng</strong>
                    <p>
                        Ngũ cốc vụ hè đã bắt đầu mẩy hạt, hứa hẹn mùa thu hoạch, nhưng vẫn cần thời gian để chín vàng hoàn toàn.
                    </p>
                </div>
                <div>
                    <strong class="text-deep-green font-serif text-xl block mb-2">Ý Nghĩa Khí Hậu</strong>
                    <p>
                        Nắng nóng bắt đầu nhen nhóm nhưng chưa gay gắt. Độ ẩm tăng cao kết hợp nhiệt độ tạo nên kiểu thời tiết "Thấp Nhiệt" đặc trưng.
                    </p>
                </div>
            </div>
        </div>
    </section>

    <!-- Section 2: Tam Hậu (Nature) -->
    <section id="tam-hau" class="py-24 bg-white relative z-10">
        <div class="max-w-6xl mx-auto px-4">
            <h3 class="text-3xl font-serif font-bold text-bitter-green mb-12 text-center">Tam Hậu: Ba Tín Hiệu Thiên Nhiên</h3>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                <!-- Card 1 -->
                <div class="card-interaction bg-silk-white p-8 rounded-2xl cursor-default group text-center">
                    <div class="w-20 h-20 mx-auto rounded-full bg-bitter-green/20 flex items-center justify-center text-4xl mb-6 group-hover:scale-110 transition">🥬</div>
                    <h5 class="font-bold text-xl text-deep-green mb-3 font-serif">1. Khổ Thái Tú</h5>
                    <p class="text-gray-600 font-light">Các loại rau đắng (như rau diếp đắng) phát triển mạnh mẽ, tốt tươi, sẵn sàng làm thuốc và thức ăn.</p>
                </div>

                <!-- Card 2 -->
                <div class="card-interaction bg-silk-white p-8 rounded-2xl cursor-default group text-center">
                    <div class="w-20 h-20 mx-auto rounded-full bg-grain-yellow/20 flex items-center justify-center text-4xl mb-6 group-hover:scale-110 transition">🥀</div>
                    <h5 class="font-bold text-xl text-deep-green mb-3 font-serif">2. Mĩ Thảo Tử</h5>
                    <p class="text-gray-600 font-light">Các loại cỏ mềm ưa mát của mùa xuân bắt đầu tàn lụi do không chịu được cái nắng nóng đầu hè.</p>
                </div>

                <!-- Card 3 -->
                <div class="card-interaction bg-silk-white p-8 rounded-2xl cursor-default group text-center">
                    <div class="w-20 h-20 mx-auto rounded-full bg-earth-clay/20 flex items-center justify-center text-4xl mb-6 group-hover:scale-110 transition">☀️</div>
                    <h5 class="font-bold text-xl text-deep-green mb-3 font-serif">3. Tiểu Thử Chí</h5>
                    <p class="text-gray-600 font-light">Nắng nóng bắt đầu nhen nhóm (Tiểu thử nghĩa là nắng nhỏ), báo hiệu mùa hè thực sự đã đến.</p>
                </div>
            </div>
        </div>
    </section>

    <!-- Section 3: Đời Sống (Tabs) -->
    <section id="doi-song" class="py-24 px-4 bg-silk-white relative z-10">
        <div class="max-w-6xl mx-auto">
            <div class="mb-12 text-center">
                <h3 class="text-4xl font-serif font-bold text-earth-clay mb-4">Mùa Nước & Mùa Tơ</h3>
                <p class="text-gray-600 italic">"Tiểu Mãn bất mãn, Mang Chủng bất quản"</p>
            </div>

            <!-- Custom Tabs -->
            <div class="flex justify-center mb-10 space-x-4">
                <button onclick="switchTab('nong-nghiep')" id="btn-nong-nghiep" class="active-tab px-8 py-3 rounded-full border border-water-jade font-bold transition duration-300 font-serif tracking-wide shadow-sm">Nông Nghiệp</button>
                <button onclick="switchTab('phong-tuc')" id="btn-phong-tuc" class="px-8 py-3 rounded-full border border-water-jade text-water-jade font-bold hover:bg-water-jade hover:text-white transition duration-300 font-serif tracking-wide shadow-sm">Phong Tục</button>
            </div>

            <!-- Content Area -->
            <div class="bg-white p-8 md:p-12 rounded-3xl border border-gray-100 min-h-[400px] flex items-center shadow-sm relative overflow-hidden">
                <div class="absolute top-0 right-0 w-32 h-32 bg-water-jade/10 rounded-bl-full pointer-events-none"></div>

                <!-- Nong Nghiep Content -->
                <div id="content-nong-nghiep" class="grid grid-cols-1 md:grid-cols-2 gap-10 w-full animate-fade-in">
                    <div class="flex flex-col justify-center">
                        <h4 class="text-3xl font-serif font-bold text-water-jade mb-6">Mùa Nước Về Đồng</h4>
                        <p class="text-gray-700 leading-relaxed mb-6">
                            Nếu nước sông không đầy ("bất mãn"), vụ mùa sau sẽ gặp khó khăn. Nông dân hối hả tát nước, giữ nước.
                        </p>
                        <ul class="space-y-4 text-gray-600 font-light">
                            <li class="flex items-start gap-3">
                                <span class="text-earth-clay font-bold">🌊</span>
                                <span>Tiếng guồng nước quay ngày đêm là âm thanh đặc trưng.</span>
                            </li>
                            <li class="flex items-start gap-3">
                                <span class="text-earth-clay font-bold">🌾</span>
                                <span>Giữ nước để dưỡng lúa làm đòng và chuẩn bị gieo cấy.</span>
                            </li>
                        </ul>
                    </div>
                    <div class="flex items-center justify-center bg-silk-white rounded-2xl p-6 border border-dashed border-gray-300">
                        <div class="text-center">
                            <div class="text-9xl mb-4 opacity-80 animate-spin-slow">🎡</div>
                            <p class="font-script text-2xl text-deep-green">Guồng nước quay đều</p>
                        </div>
                    </div>
                </div>

                <!-- Phong Tuc Content -->
                <div id="content-phong-tuc" class="hidden grid-cols-1 md:grid-cols-2 gap-10 w-full animate-fade-in">
                    <!-- Card 1 -->
                    <div class="bg-silk-white p-8 rounded-2xl border-l-4 border-grain-yellow hover:bg-gray-50 transition group">
                        <div class="text-5xl mb-4 group-hover:scale-110 transition duration-300">🐛</div>
                        <h4 class="text-2xl font-serif font-bold text-deep-green mb-3">Tế Thần Tơ Tằm</h4>
                        <p class="text-gray-600 leading-relaxed font-light">
                            Mùa bận rộn nhất của nghề ươm tơ. Lễ tế cầu mong kén dày, tơ óng, việc dệt lụa thuận lợi.
                        </p>
                    </div>
                    <!-- Card 2 -->
                    <div class="bg-silk-white p-8 rounded-2xl border-l-4 border-bitter-green hover:bg-gray-50 transition group">
                        <div class="text-5xl mb-4 group-hover:scale-110 transition duration-300">🥬</div>
                        <h4 class="text-2xl font-serif font-bold text-deep-green mb-3">Ăn Rau Đắng</h4>
                        <p class="text-gray-600 leading-relaxed font-light">
                            "Xuân ăn mầm, Hạ ăn lá". Ăn rau dại vị đắng (Khổ thái) để thanh nhiệt, giải độc cơ thể.
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
                    <span class="text-earth-clay font-bold tracking-widest uppercase text-sm">Trừ Thấp Nhiệt</span>
                    <h3 class="text-4xl font-serif font-bold text-deep-green mt-2 mb-6">Kiện Tỳ, Lợi Thấp</h3>
                    <p class="text-gray-600 text-lg leading-relaxed mb-6">
                        Khí hậu Nóng Ẩm (Thấp nhiệt) dễ gây mệt mỏi, bệnh ngoài da. Cần ăn uống thanh đạm, làm mát.
                    </p>
                    <div class="bg-white p-6 rounded-xl border-l-4 border-bitter-green shadow-sm">
                        <h4 class="font-bold text-lg text-bitter-green mb-2 font-serif">Nguyên Tắc Ẩm Thực</h4>
                        <p class="text-gray-600 mb-2"><strong>Vị Đắng & Mát:</strong> Thanh nhiệt, giải độc (Mướp đắng, Rau đắng).</p>
                        <p class="text-gray-600"><strong>Lợi Thủy:</strong> Loại bỏ độ ẩm thừa (Đậu đỏ, Ý dĩ, Bí đao).</p>
                    </div>
                </div>

                <div class="space-y-4 font-sans text-gray-700">
                    <div class="flex items-center gap-4 p-3 bg-white rounded-lg shadow-sm">
                        <div class="w-10 h-10 rounded-full bg-water-jade/10 flex items-center justify-center text-xl">🧴</div>
                        <div>
                            <strong>Bảo Vệ Da:</strong> Giữ da khô thoáng, tránh nấm mốc, rôm sảy do thấp nhiệt.
                        </div>
                    </div>
                    <div class="flex items-center gap-4 p-3 bg-white rounded-lg shadow-sm">
                        <div class="w-10 h-10 rounded-full bg-water-jade/10 flex items-center justify-center text-xl">👕</div>
                        <div>
                            <strong>Trang Phục:</strong> Mặc đồ cotton, lanh thấm hút mồ hôi.
                        </div>
                    </div>
                </div>
            </div>

            <!-- Right: Interactive Food Filter -->
            <div class="lg:col-span-7">
                <div class="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden flex flex-col h-full">
                    <div class="bg-earth-clay p-8 text-white">
                        <h4 class="text-2xl font-serif font-bold flex items-center gap-3">
                            <span>🥗</span> Thực Đơn Giải Nhiệt
                        </h4>
                        <p class="opacity-90 mt-2 font-light text-sm">Chọn thực phẩm giúp cơ thể nhẹ nhàng, mát mẻ.</p>
                    </div>

                    <!-- Filters -->
                    <div class="p-6 border-b border-gray-100 flex gap-3 overflow-x-auto no-scrollbar">
                        <button onclick="filterFood('all')" class="food-btn active px-5 py-2 rounded-full text-sm font-bold bg-gray-100 text-gray-600 hover:bg-gray-200 transition whitespace-nowrap" data-filter="all">Tất Cả</button>
                        <button onclick="filterFood('good')" class="food-btn px-5 py-2 rounded-full text-sm font-bold bg-gray-100 text-gray-600 hover:bg-gray-200 transition whitespace-nowrap" data-filter="good">Nên Dùng (Đắng/Mát)</button>
                        <button onclick="filterFood('bad')" class="food-btn px-5 py-2 rounded-full text-sm font-bold bg-gray-100 text-gray-600 hover:bg-gray-200 transition whitespace-nowrap" data-filter="bad">Hạn Chế (Béo/Nóng/Lạnh)</button>
                    </div>

                    <!-- Grid -->
                    <div id="food-grid" class="p-6 grid grid-cols-2 sm:grid-cols-3 gap-4 overflow-y-auto max-h-[500px] bg-silk-white">
                        <!-- JS populated -->
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Section 5: Chiêm Nghiệm (Philosophy) -->
    <section id="chiem-nghiem" class="py-32 bg-deep-green text-white text-center px-4 relative overflow-hidden">
        <!-- Abstract Background Shape -->
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-water-jade/20 rounded-full blur-[100px] pointer-events-none"></div>

        <div class="max-w-3xl mx-auto relative z-10">
            <span class="text-6xl text-gray-400 font-serif opacity-50 block mb-6">❝</span>
            
            <h3 class="text-4xl md:text-5xl font-serif font-bold mb-10 text-white leading-tight">
                Hạnh Phúc Là<br>Biết Đủ
            </h3>
            
            <p class="text-xl text-gray-300 leading-loose mb-12 font-sans font-light">
                "Thủy mãn tắc dật, Nguyệt mãn tắc khuy". Sự tròn đầy tuyệt đối thường là khởi đầu của suy tàn. Tiểu Mãn - sự viên mãn nhỏ nhoi, sự hài lòng vừa đủ - mới là trạng thái tốt đẹp nhất. Hãy chừa lại một chút dư địa để phấn đấu và hy vọng.
            </p>

            <div class="inline-block border border-gray-600 rounded-2xl p-10 bg-white/5 backdrop-blur-sm hover:bg-white/10 transition duration-500 cursor-default group">
                <p class="font-bold uppercase tracking-[0.2em] text-sm text-grain-yellow mb-6 font-sans group-hover:text-white transition">Lời Chúc Tiểu Mãn</p>
                <div class="text-3xl md:text-4xl font-script text-water-jade leading-relaxed group-hover:scale-105 transition duration-500">
                    "Hạt chắc, Tình đầy,<br>Tâm an."
                </div>
            </div>
            
            <span class="text-6xl text-gray-400 font-serif opacity-50 block mt-12">❞</span>
        </div>
    </section>

    <!-- Footer -->
    <footer class="bg-[#1a3540] text-gray-400 py-12 text-center text-sm font-sans border-t border-gray-800">
        <p class="italic tracking-wide mb-3 text-gray-500">Biên soạn dựa trên nguyên lý 24 Tiết khí & Văn hóa Phương Đông</p>
        <p class="text-gray-400">© Bản quyền thuộc về <span class="font-script text-xl text-water-jade ml-1">Tịch Phong Thiên Sơn - 夕风天山</span></p>
    </footer>

    <!-- Javascript Logic -->
    <script>
        // --- Data ---
        const foodData = [
            { name: "Đậu Đỏ", type: "good", icon: "🫘", desc: "Lợi tiểu, trừ thấp, dưỡng tim" },
            { name: "Mướp Đắng", type: "good", icon: "🥒", desc: "Thanh nhiệt, giải độc, mát gan" },
            { name: "Bí Đao", type: "good", icon: "🍈", desc: "Lợi thủy, tiêu thũng, làm mát" },
            { name: "Ý Dĩ", type: "good", icon: "🌾", desc: "Kiện tỳ, trừ thấp nhiệt, đẹp da" },
            { name: "Dưa Chuột", type: "good", icon: "🥒", desc: "Sinh tân dịch, giải khát" },
            { name: "Ngó Sen", type: "good", icon: "🪷", desc: "Mát máu, an thần" },
            { name: "Đồ Chiên", type: "bad", icon: "🍟", desc: "Sinh nhiệt, gây nổi mụn" },
            { name: "Đồ Béo Ngọt", type: "bad", icon: "🍰", desc: "Sinh đờm, sinh thấp, nặng nề" },
            { name: "Nước Đá", type: "bad", icon: "🧊", desc: "Hại tỳ vị, gây lạnh bụng" }
        ];

        // --- Tab Logic ---
        function switchTab(tab) {
            document.getElementById('content-nong-nghiep').classList.add('hidden');
            document.getElementById('content-nong-nghiep').classList.remove('grid');
            document.getElementById('content-phong-tuc').classList.add('hidden');
            document.getElementById('content-phong-tuc').classList.remove('grid');

            document.getElementById('btn-nong-nghiep').classList.remove('active-tab', 'text-white');
            document.getElementById('btn-nong-nghiep').classList.add('text-deep-green');
            document.getElementById('btn-phong-tuc').classList.remove('active-tab', 'text-white');
            document.getElementById('btn-phong-tuc').classList.add('text-deep-green');

            const content = document.getElementById(\`content-\${tab}\`);
            content.classList.remove('hidden');
            content.classList.add('grid');
            
            const btn = document.getElementById(\`btn-\${tab}\`);
            btn.classList.add('active-tab');
            btn.classList.remove('text-deep-green');
        }

        // --- Food Filter Logic ---
        function filterFood(filter) {
            const grid = document.getElementById('food-grid');
            grid.innerHTML = ''; 

            document.querySelectorAll('.food-btn').forEach(btn => {
                if(btn.dataset.filter === filter) {
                    btn.classList.add('bg-earth-clay', 'text-white');
                    btn.classList.remove('bg-gray-100', 'text-gray-600');
                } else {
                    btn.classList.remove('bg-earth-clay', 'text-white');
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

        // --- Canvas Animation (Gentle Ripples) ---
        function initWaterCanvas() {
            const canvas = document.getElementById('waterCanvas');
            const ctx = canvas.getContext('2d');
            let width, height;
            let ripples = [];

            function resize() {
                width = window.innerWidth;
                height = window.innerHeight;
                canvas.width = width;
                canvas.height = height;
            }
            window.addEventListener('resize', resize);
            resize();

            class Ripple {
                constructor() {
                    this.x = Math.random() * width;
                    this.y = Math.random() * height;
                    this.radius = 0;
                    this.maxRadius = Math.random() * 50 + 20;
                    this.speed = Math.random() * 0.5 + 0.2;
                    this.opacity = 0.4;
                }
                update() {
                    this.radius += this.speed;
                    this.opacity -= 0.005;
                    if (this.opacity <= 0) {
                        this.reset();
                    }
                }
                reset() {
                    this.x = Math.random() * width;
                    this.y = Math.random() * height;
                    this.radius = 0;
                    this.opacity = 0.4;
                }
                draw() {
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                    ctx.strokeStyle = \`rgba(42, 157, 143, \${this.opacity})\`; // Water Jade color
                    ctx.lineWidth = 1;
                    ctx.stroke();
                }
            }

            for(let i=0; i<8; i++) ripples.push(new Ripple());

            function animate() {
                ctx.clearRect(0, 0, width, height);
                ripples.forEach(r => {
                    r.update();
                    r.draw();
                });
                requestAnimationFrame(animate);
            }
            animate();
        }

        // --- Init ---
        document.addEventListener('DOMContentLoaded', () => {
            initWaterCanvas();
            filterFood('all');

            // Chart 1: Solar Term 60 deg
            const ctx1 = document.getElementById('solarChart').getContext('2d');
            new Chart(ctx1, {
                type: 'doughnut',
                data: {
                    labels: ['Tiểu Mãn', 'Mang Chủng', 'Hạ Chí', 'Mùa Khác'],
                    datasets: [{
                        data: [15, 15, 15, 315],
                        backgroundColor: ['#E9C46A', '#BC6C25', '#BC6C25', '#FEFAE0'],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    rotation: -30, 
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
                        ctx.fillStyle = "#E9C46A";
                        var text = "60°",
                            textX = Math.round((width - ctx.measureText(text).width) / 2),
                            textY = height / 2;
                        ctx.fillText(text, textX, textY);
                        ctx.save();
                    }
                }]
            });

            // Chart 2: Balance "Just Enough"
            const ctx2 = document.getElementById('balanceChart').getContext('2d');
            new Chart(ctx2, {
                type: 'bar',
                data: {
                    labels: ['Thiếu Hụt', 'Tiểu Mãn (Lý Tưởng)', 'Đại Mãn (Thái Quá)'],
                    datasets: [{
                        label: 'Mức Độ Viên Mãn',
                        data: [30, 80, 100],
                        backgroundColor: ['#A0A0A0', '#2A9D8F', '#BC6C25'], // Grey, Ideal Green, Warning Brown
                        borderRadius: 5,
                        barPercentage: 0.6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    indexAxis: 'y',
                    scales: {
                        x: { 
                            beginAtZero: true, 
                            max: 100,
                            grid: { display: false },
                            ticks: { display: false }
                        },
                        y: { 
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
