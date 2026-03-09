<template>
  <div class="danasoul-wrapper antialiased loading">
    <!-- Film Grain Overlay -->
    <div class="grain-overlay" aria-hidden="true"></div>
    <div id="preloader">
      <!-- Ambient particles -->
      <div class="preloader-particle" style="left: 15%; top: 70%; animation-delay: 0s"></div>
      <div class="preloader-particle" style="left: 30%; top: 80%; animation-delay: 0.8s"></div>
      <div class="preloader-particle" style="left: 55%; top: 75%; animation-delay: 1.6s"></div>
      <div class="preloader-particle" style="left: 75%; top: 85%; animation-delay: 0.4s"></div>
      <div class="preloader-particle" style="left: 85%; top: 70%; animation-delay: 1.2s"></div>
      <div class="preloader-particle" style="left: 40%; top: 90%; animation-delay: 2s"></div>
      <div class="preloader-particle" style="left: 65%; top: 65%; animation-delay: 2.4s"></div>
      <div class="preloader-particle" style="left: 20%; top: 60%; animation-delay: 1s"></div>

      <!-- Logo -->
      <div class="preloader-logo-wrap">
        <div class="preloader-logo-ring"></div>
        <div class="preloader-logo-ring-2"></div>
        <img src="/danasoul/DanaSoulLogo.png" alt="DanaSoul" />
      </div>

      <!-- Title -->
      <h1 class="font-logo text-5xl md:text-6xl text-white preloader-title">DanaSoul</h1>
      <p class="preloader-subtitle">Chạm Vào Vẻ Đẹp Đà Nẵng</p>

      <!-- Progress -->
      <div class="preloader-progress">
        <div class="preloader-progress-track">
          <div class="preloader-progress-fill" id="preloader-fill"></div>
        </div>
        <span class="preloader-progress-text" id="preloader-percent">0%</span>
      </div>
    </div>

    <div class="cursor-dot"></div>
    <div class="cursor-outline"></div>

    <!-- Back to Top Button -->
    <button
      id="back-to-top"
      class="fixed bottom-8 right-8 w-14 h-14 bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-secondary)] text-white rounded-full shadow-2xl opacity-0 invisible transition-all duration-300 ease-out hover:scale-110 hover:shadow-[0_0_30px_rgba(170,115,82,0.5)] z-50 flex items-center justify-center group"
      aria-label="Về đầu trang"
    >
      <svg
        class="w-6 h-6 transition-transform duration-300 group-hover:-translate-y-1"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M5 10l7-7m0 0l7 7m-7-7v18"
        />
      </svg>
    </button>

    <header id="main-header" class="fixed top-0 left-0 right-0 z-50 transition-all duration-300">
      <div class="container mx-auto px-6 py-4">
        <div class="flex items-center justify-between">
          <a href="#" class="font-logo text-4xl text-white magnetic-btn" id="logo">DanaSoul</a>
          <nav class="hidden md:flex items-center space-x-8">
            <a href="#about" class="nav-link text-white font-medium" data-lang-key="nav.about"
              >Giới thiệu</a
            >
            <a
              href="#destinations"
              class="nav-link text-white font-medium"
              data-lang-key="nav.destinations"
              >Điểm đến</a
            >
            <a href="#map-section" class="nav-link text-white font-medium" data-lang-key="nav.map"
              >Bản đồ</a
            >
            <a href="#culture" class="nav-link text-white font-medium" data-lang-key="nav.culture"
              >Văn hóa</a
            >
            <a href="#history" class="nav-link text-white font-medium" data-lang-key="nav.history"
              >Lịch sử</a
            >
            <a href="#cuisine" class="nav-link text-white font-medium" data-lang-key="nav.cuisine"
              >Ẩm thực</a
            >
            <a href="#planner" class="nav-link text-white font-medium" data-lang-key="nav.planner"
              >Kế hoạch</a
            >
            <a href="#contact" class="nav-link text-white font-medium" data-lang-key="nav.contact"
              >Liên hệ</a
            >
          </nav>
          <div class="flex items-center space-x-4">
            <RouterLink
              to="/"
              class="hidden md:inline-flex items-center gap-2 rounded-full border border-[var(--brand-primary)]/50 bg-[var(--bg-medium)]/80 px-4 py-2 text-sm font-semibold text-white transition-all duration-300 hover:bg-[var(--brand-primary)] hover:text-[var(--bg-dark)]"
            >
              <i data-lucide="house" class="h-4 w-4"></i>
              <span>Trang chủ</span>
            </RouterLink>
            <div
              class="lang-switcher hidden md:flex items-center text-white text-sm font-semibold space-x-2"
            >
              <button data-lang="vi" class="active magnetic-btn">VN</button>
              <span class="opacity-50">/</span>
              <button data-lang="en" class="magnetic-btn">EN</button>
            </div>
          </div>
          <button id="mobile-menu-button" class="md:hidden text-white">
            <i data-lucide="menu" class="w-6 h-6"></i>
          </button>
        </div>
      </div>
      <div
        id="mobile-menu"
        class="hidden md:hidden"
        style="background-color: rgba(18, 30, 23, 0.9); backdrop-filter: blur(8px)"
      >
        <RouterLink
          to="/"
          class="nav-link-mobile flex items-center gap-2 py-3 px-6 text-white hover:bg-[var(--brand-secondary)]"
        >
          <i data-lucide="house" class="w-5 h-5"></i>
          <span>Trang chủ</span>
        </RouterLink>
        <a
          href="#about"
          class="nav-link-mobile block py-3 px-6 text-white hover:bg-[var(--brand-secondary)]"
          data-lang-key="nav.about"
          >Giới thiệu</a
        >
        <a
          href="#destinations"
          class="nav-link-mobile block py-3 px-6 text-white hover:bg-[var(--brand-secondary)]"
          data-lang-key="nav.destinations"
          >Điểm đến</a
        >
        <a
          href="#map-section"
          class="nav-link-mobile block py-3 px-6 text-white hover:bg-[var(--brand-secondary)]"
          data-lang-key="nav.map"
          >Bản đồ</a
        >
        <a
          href="#culture"
          class="nav-link-mobile block py-3 px-6 text-white hover:bg-[var(--brand-secondary)]"
          data-lang-key="nav.culture"
          >Văn hóa</a
        >
        <a
          href="#history"
          class="nav-link-mobile block py-3 px-6 text-white hover:bg-[var(--brand-secondary)]"
          data-lang-key="nav.history"
          >Lịch sử</a
        >
        <a
          href="#cuisine"
          class="nav-link-mobile block py-3 px-6 text-white hover:bg-[var(--brand-secondary)]"
          data-lang-key="nav.cuisine"
          >Ẩm thực</a
        >
        <a
          href="#planner"
          class="nav-link-mobile block py-3 px-6 text-white hover:bg-[var(--brand-secondary)]"
          data-lang-key="nav.planner"
          >Kế hoạch</a
        >
        <a
          href="#contact"
          class="nav-link-mobile block py-3 px-6 text-white hover:bg-[var(--brand-secondary)]"
          data-lang-key="nav.contact"
          >Liên hệ</a
        >

        <div
          class="lang-switcher flex items-center justify-center text-white text-sm font-semibold space-x-4 py-4 border-t border-[var(--brand-secondary)]"
        >
          <button data-lang="vi" class="active">TIẾNG VIỆT</button>
          <span>|</span>
          <button data-lang="en">ENGLISH</button>
        </div>
      </div>
    </header>

    <main>
      <section
        id="hero"
        class="relative h-screen w-full flex items-center justify-center text-center text-white overflow-hidden"
      >
        <!-- Video Background -->
        <video
          id="hero-video"
          class="absolute inset-0 w-full h-full object-cover z-0"
          autoplay
          muted
          loop
          playsinline
        >
          <source :src="'/danasoul/videos/danang-hero-video.mp4'" type="video/mp4" />
          <!-- Fallback image nếu video không load được -->
          <img
            src="/danasoul/images/Trang chu/binh_minh__1.jpg"
            alt="Da Nang Hero"
            class="w-full h-full object-cover"
          />
        </video>

        <!-- Video Overlay -->
        <div
          class="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/50 z-10"
        ></div>

        <!-- Hero Particles -->
        <div class="hero-particle-layer" id="hero-particles"></div>

        <div class="relative z-20 p-6">
          <h1
            id="hero-title"
            class="font-logo text-5xl sm:text-6xl md:text-8xl lg:text-9xl text-white mb-4 opacity-0 hero-title-glow"
            style="text-shadow: 2px 2px 10px rgba(0, 0, 0, 0.7)"
          >
            DanaSoul
          </h1>
          <p
            id="hero-subtitle"
            class="text-base sm:text-lg md:text-2xl max-w-2xl mx-auto text-[var(--text-light)] opacity-0 px-2"
            data-lang-key="hero.subtitleNew"
          >
            Khám phá vẻ đẹp tiềm ẩn của thành phố đáng sống nhất Việt Nam.
          </p>
          <a href="#about" id="hero-cta" class="hero-cta">
            <span data-lang-key="hero.cta">Khám Phá Ngay</span>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </a>
        </div>
        <div
          id="scroll-down-indicator"
          class="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce z-20"
        >
          <i data-lucide="arrow-down" class="w-8 h-8 text-white"></i>
          <div class="scroll-indicator-line mt-2"></div>
        </div>
      </section>

      <section id="about" class="py-24 bg-transparent relative">
        <div class="container mx-auto px-6">
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <!-- TEXT SIDE -->
            <div class="text-center lg:text-left">
              <div class="about-tagline" id="about-tagline">
                <span id="tagline-text"></span>
                <span class="cursor-blink"></span>
              </div>
              <h2
                class="text-3xl md:text-4xl font-bold text-white mb-6"
                data-lang-key="about.welcomeTitle"
              >
                Chào mừng đến với DanaSoul
                <span class="section-title-accent"></span>
              </h2>
              <p
                class="text-[var(--text-dark)] text-lg leading-relaxed mb-4"
                data-lang-key="about.intro1"
              >
                Khám phá Đà Nẵng – nơi hội tụ vẻ đẹp thiên nhiên, chiều sâu văn hóa và nhịp sống
                hiện đại. DanaSoul dẫn lối bạn về với linh hồn miền Trung: một Việt Nam kiên cường,
                đậm đà bản sắc và luôn vươn mình ra biển lớn.
              </p>
              <p class="text-[var(--text-dark)]" data-lang-key="about.intro2">
                Sau sự kiện sáp nhập lịch sử, Đà Nẵng đã vươn mình trở thành thành phố rộng lớn nhất
                Việt Nam, mở ra một chương mới đầy sôi động. Từ Cầu Rồng phun lửa, Cầu Vàng lơ lửng
                giữa trời, đến bán đảo Sơn Trà hoang sơ hay Di sản Thế giới Mỹ Sơn trầm mặc, Đà Nẵng
                mở ra một hành trình khám phá không giới hạn – nơi bạn không chỉ dừng chân, mà còn
                lưu giữ vẹn nguyên cảm xúc.
              </p>

              <!-- Stats Counter -->
              <div class="about-stats" id="about-stats">
                <div class="about-stat-item">
                  <div class="about-stat-number" data-count="15">0</div>
                  <div class="about-stat-label" data-lang-key="about.stat1">Điểm đến</div>
                </div>
                <div class="about-stat-item">
                  <div class="about-stat-number" data-count="1000" data-suffix="+">0</div>
                  <div class="about-stat-label" data-lang-key="about.stat2">Năm lịch sử</div>
                </div>
                <div class="about-stat-item">
                  <div class="about-stat-number" data-count="10">0</div>
                  <div class="about-stat-label" data-lang-key="about.stat3">Món đặc sản</div>
                </div>
              </div>
            </div>

            <!-- IMAGE SIDE - 3D Tilt + Floating Badges -->
            <div class="about-image-3d" id="about-image-3d">
              <div class="about-image-glow"></div>
              <div class="about-image-corner corner-tl"></div>
              <div class="about-image-corner corner-tr"></div>
              <div class="about-image-corner corner-bl"></div>
              <div class="about-image-corner corner-br"></div>

              <div class="about-image-3d-inner relative h-80 lg:h-[480px]" id="about-parallax-img">
                <img
                  id="about-slide-a"
                  src="/danasoul/images/Gioi thieu/cau-rong-da-nang-saigon-travel.jpg"
                  alt="DanaSoul"
                  class="about-collage-img absolute inset-0 w-full h-full object-cover"
                  style="opacity: 1; transition: opacity 1.2s ease-in-out"
                />
                <img
                  id="about-slide-b"
                  src="/danasoul/images/Gioi thieu/Hang-động-núi-Ngũ-Hành-Sơn-2.jpg"
                  alt="DanaSoul"
                  class="about-collage-img absolute inset-0 w-full h-full object-cover"
                  style="opacity: 0; transition: opacity 1.2s ease-in-out"
                />
                <div class="about-image-overlay"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="destinations" class="py-24 bg-[var(--bg-medium)]">
        <div class="container mx-auto px-6">
          <h2
            class="text-3xl md:text-4xl font-bold text-white mb-6 text-center"
            data-lang-key="destinations.title"
          >
            Điểm Đến Biểu Tượng
            <span class="section-title-accent"></span>
          </h2>
          <div id="filter-buttons" class="flex justify-center flex-wrap gap-2 mb-12"></div>
          <div
            id="destinations-grid"
            class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
          ></div>
        </div>
      </section>

      <section id="map-section" class="py-24 bg-[var(--bg-dark)]">
        <div class="container mx-auto px-6">
          <h2
            class="text-3xl md:text-4xl font-bold text-white mb-4 text-center"
            data-lang-key="map.title"
          >
            Bản Đồ Trực Quan
            <span class="section-title-accent"></span>
          </h2>
          <p
            class="text-[var(--text-dark)] max-w-3xl mx-auto mb-12 text-center"
            data-lang-key="map.desc"
          >
            Khám phá vị trí các điểm đến mang tính biểu tượng của Đà Nẵng. Nhấn vào một điểm trên
            bản đồ hoặc trong danh sách để xem chi tiết.
          </p>

          <div class="text-center mt-6 mb-12">
            <button
              id="show-map-image-btn"
              class="bg-[var(--brand-primary)] text-[var(--bg-dark)] font-bold px-8 py-3 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1 active:scale-95 active:shadow-md inline-flex items-center gap-3"
              data-lang-key="map.planningButton"
            >
              <i data-lucide="map" class="w-5 h-5"></i>
              <span data-lang-key="map.planningButton">Xem bản đồ số thành phố Đà Nẵng</span>
            </button>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div class="lg:col-span-2">
              <div id="map-container"></div>
            </div>
            <div class="lg:col-span-1">
              <div id="map-locations-list"></div>
            </div>
          </div>
        </div>
      </section>

      <section id="culture" class="py-24 bg-[var(--bg-dark)] overflow-hidden">
        <div class="container mx-auto px-6">
          <div class="text-center mb-16">
            <h2
              class="text-3xl md:text-4xl font-bold text-white mb-4"
              data-lang-key="culture.title"
            >
              Bản Sắc Văn Hóa Miền Trung
              <span class="section-title-accent"></span>
            </h2>
            <p class="text-[var(--text-dark)] max-w-3xl mx-auto" data-lang-key="culture.intro">
              Đà Nẵng không chỉ là thành phố của những cây cầu, mà còn là một không gian văn hóa đặc
              sắc, nơi giao hòa giữa truyền thống và hiện đại. Hãy chạm vào la bàn để khám phá.
            </p>
          </div>

          <div
            id="culture-interactive-wrapper"
            class="relative min-h-[600px] flex items-center justify-center"
          >
            <div
              id="culture-content-display"
              class="absolute inset-0 w-full h-full opacity-0 pointer-events-none transform scale-95"
            ></div>

            <div
              id="culture-compass"
              class="w-full h-full flex items-center justify-center transition-all duration-700 ease-in-out"
            >
              <div class="relative w-[500px] h-[500px]">
                <svg
                  class="absolute inset-0 w-full h-full"
                  viewBox="0 0 500 500"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle
                    cx="250"
                    cy="250"
                    r="249"
                    stroke="var(--brand-secondary)"
                    stroke-width="2"
                  />
                  <circle
                    cx="250"
                    cy="250"
                    r="160"
                    stroke="var(--brand-secondary)"
                    stroke-width="1"
                    stroke-dasharray="4 8"
                  />
                  <line
                    x1="250"
                    y1="50"
                    x2="250"
                    y2="450"
                    stroke="var(--brand-secondary)"
                    stroke-width="1"
                    opacity="0.5"
                  />
                  <line
                    x1="50"
                    y1="250"
                    x2="450"
                    y2="250"
                    stroke="var(--brand-secondary)"
                    stroke-width="1"
                    opacity="0.5"
                  />
                </svg>

                <div
                  class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-[var(--bg-medium)] rounded-full flex items-center justify-center text-center shadow-2xl"
                >
                  <div class="font-logo text-3xl text-[var(--brand-primary)]">Soul of Danang</div>
                </div>

                <div id="compass-points" class="absolute inset-0 w-full h-full"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="history" class="bg-[var(--bg-medium)]">
        <div class="container mx-auto px-6 pt-24 pb-8">
          <h2
            class="text-3xl md:text-4xl font-bold text-white mb-4 text-center"
            data-lang-key="history.title"
          >
            Dòng Chảy Lịch Sử
            <span class="section-title-accent"></span>
          </h2>
          <p
            class="text-[var(--text-dark)] max-w-3xl mx-auto mb-12 text-center"
            data-lang-key="history.desc"
          >
            Hành trình ngàn năm từ thuở Chăm Pa cổ đại đến thành phố hiện đại bậc nhất miền Trung –
            mỗi giai đoạn là một dấu ấn không thể phai mờ.
          </p>
        </div>
        <div id="scrolly">
          <div id="scrolly-vis">
            <div id="scrolly-vis-content"></div>
          </div>
          <article id="scrolly-article"></article>
        </div>
      </section>

      <section id="cuisine" class="py-24 bg-[var(--bg-dark)]">
        <div class="container mx-auto px-6">
          <h2
            class="text-3xl md:text-4xl font-bold text-white mb-4 text-center"
            data-lang-key="cuisine.title"
          >
            Hành Trình Ẩm Thực
            <span class="section-title-accent"></span>
          </h2>
          <p
            class="text-[var(--text-dark)] max-w-3xl mx-auto mb-12 text-center"
            data-lang-key="cuisine.desc"
          >
            Khám phá Đà Nẵng qua hương vị là một trải nghiệm không thể thiếu. Mỗi món ăn là một câu
            chuyện về văn hoá, về sản vật địa phương và sự khéo léo của người dân nơi đây.
          </p>

          <!-- Horizontal scroll menu -->
          <div class="mb-8">
            <ul id="cuisine-menu" class="cuisine-scroll-menu"></ul>
          </div>
          <!-- Details container - full width -->
          <div
            id="cuisine-details-container"
            class="bg-[var(--bg-medium)] rounded-lg p-6 md:p-8 shadow-lg max-w-5xl mx-auto"
          ></div>
        </div>
      </section>

      <section id="planner" class="py-24 bg-[var(--bg-medium)]">
        <div class="container mx-auto px-6">
          <h2
            class="text-3xl md:text-4xl font-bold text-white mb-4 text-center"
            data-lang-key="planner.title"
          >
            Lập Kế Hoạch Chuyến Đi
            <span class="section-title-accent"></span>
          </h2>
          <p
            class="text-[var(--text-dark)] max-w-2xl mx-auto mb-12 text-center"
            data-lang-key="planner.desc"
          >
            Chọn các tiêu chí bên dưới, DanaSoul sẽ gợi ý một hành trình được thiết kế dành riêng
            cho bạn.
          </p>

          <div class="max-w-5xl mx-auto bg-[var(--bg-dark)] p-6 md:p-8 rounded-xl shadow-2xl">
            <div class="mb-8">
              <div class="mb-8">
                <label
                  class="block mb-4 text-lg font-medium text-[var(--text-light)] flex items-center gap-2"
                  data-lang-key="planner.daysLabel"
                >
                  <span
                    class="w-8 h-8 rounded-full bg-[var(--brand-primary)] text-[var(--bg-dark)] flex items-center justify-center text-sm font-bold"
                    >1</span
                  >
                  Bạn muốn đi bao nhiêu ngày?
                </label>
                <div id="planner-days-options" class="flex flex-wrap gap-3 items-center"></div>
              </div>
              <div>
                <label
                  class="block mb-4 text-lg font-medium text-[var(--text-light)] flex items-center gap-2"
                  data-lang-key="planner.styleLabel"
                >
                  <span
                    class="w-8 h-8 rounded-full bg-[var(--brand-primary)] text-[var(--bg-dark)] flex items-center justify-center text-sm font-bold"
                    >2</span
                  >
                  Phong cách chuyến đi của bạn là gì?
                </label>
                <div
                  id="planner-style-options"
                  class="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4"
                ></div>
              </div>
            </div>

            <div
              id="planner-result"
              class="mt-8 border-t border-[var(--brand-secondary)] pt-8"
            ></div>
          </div>
        </div>
      </section>

      <section
        id="farewell"
        class="relative min-h-screen flex items-center justify-center text-center text-white overflow-hidden"
      >
        <!-- Ken Burns Background -->
        <div class="farewell-bg"></div>
        <!-- Multi-layer Overlay -->
        <div class="farewell-overlay"></div>
        <!-- Aurora glow at horizon -->
        <div class="farewell-aurora"></div>
        <!-- Horizon glow line -->
        <div class="farewell-horizon-glow"></div>
        <!-- Stars Canvas -->
        <canvas id="farewell-stars-canvas" class="farewell-canvas-layer"></canvas>
        <!-- Main Canvas (lanterns + fireflies + shooting stars) -->
        <canvas id="farewell-canvas" class="farewell-canvas-layer"></canvas>
        <!-- Cinematic Letterbox Bars -->
        <div class="farewell-letterbox farewell-letterbox-top"></div>
        <div class="farewell-letterbox farewell-letterbox-bottom"></div>
        <!-- Floating Memory Cards -->
        <div class="farewell-memories" id="farewell-memories"></div>
        <!-- Content -->
        <div class="relative z-20 p-6 max-w-4xl mx-auto farewell-content">
          <!-- Quote -->
          <p
            class="farewell-quote text-xs md:text-sm tracking-[0.25em] uppercase text-[var(--brand-primary)] mb-6"
            data-lang-key="farewell.quote"
          >
            "Đi để trở về, và mang theo cả linh hồn nơi ấy"
          </p>
          <!-- Divider -->
          <div class="farewell-divider mb-8"></div>
          <!-- Main Title -->
          <h2 class="farewell-title-main mb-6" data-lang-key="farewell.title">Hẹn Gặp Lại</h2>
          <!-- Description -->
          <p
            class="text-lg md:text-xl max-w-2xl mx-auto text-[var(--text-light)] mb-8 farewell-desc opacity-90"
            data-lang-key="farewell.desc"
          >
            Hành trình khám phá có thể kết thúc, nhưng những ký ức về Đà Nẵng sẽ còn mãi. DanaSoul
            hy vọng đã mang đến cho bạn những cảm hứng và hẹn gặp lại bạn ở thành phố xinh đẹp này.
          </p>
          <!-- Stats Counter -->
          <div class="farewell-counter mb-10">
            <div class="farewell-counter-item">
              <div class="farewell-counter-num" data-count="7">0</div>
              <div class="farewell-counter-label" data-lang-key="farewell.counterSections">
                Phần Khám Phá
              </div>
            </div>
            <div class="farewell-counter-item">
              <div class="farewell-counter-num" data-count="15">0</div>
              <div class="farewell-counter-label" data-lang-key="farewell.counterPlaces">
                Điểm Đến
              </div>
            </div>
            <div class="farewell-counter-item">
              <div class="farewell-counter-num" data-count="10">0</div>
              <div class="farewell-counter-label" data-lang-key="farewell.counterDishes">
                Món Ăn
              </div>
            </div>
            <div class="farewell-counter-item">
              <div class="farewell-counter-num" data-count="1">0</div>
              <div class="farewell-counter-label" data-lang-key="farewell.counterCity">
                Thành Phố Tuyệt Vời
              </div>
            </div>
          </div>
          <!-- Release Lantern Button -->
          <button id="release-lantern-btn" class="farewell-lantern-btn">
            <span class="lantern-emoji">🏮</span>
            <span data-lang-key="farewell.lanternBtn">Thả Đèn Trời</span>
          </button>
        </div>
      </section>

      <section id="contact" class="py-24 bg-[var(--bg-medium)]">
        <div class="container mx-auto px-6 text-center">
          <h2 class="text-3xl md:text-4xl font-bold text-white mb-4" data-lang-key="contact.title">
            Liên Hệ Với Chúng Tôi
            <span class="section-title-accent"></span>
          </h2>
          <p class="text-[var(--text-dark)] max-w-2xl mx-auto mb-8" data-lang-key="contact.desc">
            Bạn có câu hỏi hoặc muốn chia sẻ trải nghiệm? Đừng ngần ngại gửi tin nhắn cho DanaSoul.
          </p>
          <button
            id="open-contact-modal-btn"
            class="magnetic-btn bg-[var(--brand-primary)] hover:bg-opacity-80 text-[var(--bg-dark)] font-bold px-8 py-4 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl text-lg"
            data-lang-key="contact.button"
          >
            Gửi Lời Nhắn
          </button>
        </div>
      </section>
    </main>

    <footer class="bg-black text-[var(--text-dark)] relative overflow-hidden">
      <!-- Subtle top border glow -->
      <div
        class="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--brand-primary)] to-transparent opacity-30"
      ></div>

      <div class="container mx-auto px-6 py-12">
        <!-- Logo + Tagline -->
        <div class="flex flex-col items-center mb-10">
          <a href="#">
            <img
              src="/danasoul/DanaSoulLogo.png"
              alt="DanaSoul Logo"
              class="h-24 mb-4 transition-transform duration-300 hover:scale-105"
              loading="lazy"
            />
          </a>
          <p class="font-logo text-2xl text-white mb-1">DanaSoul</p>
          <p class="text-sm text-gray-500 italic" data-lang-key="footer.tagline">
            Chạm vào vẻ đẹp Đà Nẵng
          </p>
        </div>

        <!-- Quick Links -->
        <div class="flex flex-wrap justify-center gap-6 mb-8 text-sm">
          <a
            href="#about"
            class="hover:text-[var(--brand-primary)] transition-colors"
            data-lang-key="nav.about"
            >Giới thiệu</a
          >
          <a
            href="#destinations"
            class="hover:text-[var(--brand-primary)] transition-colors"
            data-lang-key="nav.destinations"
            >Điểm đến</a
          >
          <a
            href="#culture"
            class="hover:text-[var(--brand-primary)] transition-colors"
            data-lang-key="nav.culture"
            >Văn hóa</a
          >
          <a
            href="#cuisine"
            class="hover:text-[var(--brand-primary)] transition-colors"
            data-lang-key="nav.cuisine"
            >Ẩm thực</a
          >
          <a
            href="#planner"
            class="hover:text-[var(--brand-primary)] transition-colors"
            data-lang-key="nav.planner"
            >Kế hoạch</a
          >
          <a
            href="#contact"
            class="hover:text-[var(--brand-primary)] transition-colors"
            data-lang-key="nav.contact"
            >Liên hệ</a
          >
        </div>

        <!-- Divider -->
        <div class="w-16 h-px bg-[var(--brand-secondary)] mx-auto mb-8"></div>

        <!-- Bottom row -->
        <div
          class="flex flex-col md:flex-row justify-between items-center text-center md:text-left"
        >
          <p class="text-sm text-gray-500 mb-4 md:mb-0" data-lang-key="footer.copyright">
            © 2025 DanaSoul. Một sản phẩm dự thi "Hành trình Thống nhất".
          </p>
          <div class="flex space-x-6">
            <a
              href="https://www.facebook.com/profile.php?id=61577256631379"
              target="_blank"
              rel="noopener noreferrer"
              class="text-gray-500 hover:text-[var(--brand-primary)] transition-colors duration-300 hover:-translate-y-1 transform"
            >
              <i data-lucide="facebook" class="w-5 h-5"></i>
            </a>
            <a
              href="https://mail.google.com/mail/?view=cm&fs=1&to=info@danasoul.id.vn"
              target="_blank"
              rel="noopener noreferrer"
              class="text-gray-500 hover:text-[var(--brand-primary)] transition-colors duration-300 hover:-translate-y-1 transform"
            >
              <i data-lucide="mail" class="w-5 h-5"></i>
            </a>
          </div>
        </div>
      </div>
    </footer>

    <div
      id="contact-modal"
      class="fixed inset-0 bg-black bg-opacity-70 z-[60] flex items-center justify-center p-4 hidden"
    >
      <div
        id="contact-modal-content"
        class="bg-[var(--bg-medium)] text-white rounded-lg shadow-2xl max-w-lg w-full relative transform scale-95 opacity-0 transition-all duration-300 p-8"
      >
        <button
          id="contact-modal-close"
          class="absolute top-4 right-4 text-gray-400 hover:text-white text-3xl"
        >
          &times;
        </button>
        <div id="contact-form-container">
          <h3 class="text-2xl font-bold mb-6 text-center" data-lang-key="contact.form.title">
            Gửi Lời Nhắn Của Bạn
          </h3>
          <form id="contact-form" action="https://formspree.io/f/myzjwdeb" method="POST">
            <div class="mb-4">
              <label
                for="name"
                class="block mb-2 text-sm font-medium text-[var(--text-light)]"
                data-lang-key="contact.form.name"
                >Tên của bạn</label
              >
              <input
                type="text"
                id="name"
                name="name"
                class="w-full p-2.5 rounded-lg bg-[var(--bg-dark)] border border-[var(--brand-secondary)] focus:ring-[var(--brand-primary)] focus:border-[var(--brand-primary)]"
                required
              />
            </div>
            <div class="mb-4">
              <label
                for="email"
                class="block mb-2 text-sm font-medium text-[var(--text-light)]"
                data-lang-key="contact.form.email"
                >Email</label
              >
              <input
                type="email"
                id="email"
                name="email"
                class="w-full p-2.5 rounded-lg bg-[var(--bg-dark)] border border-[var(--brand-secondary)] focus:ring-[var(--brand-primary)] focus:border-[var(--brand-primary)]"
                required
              />
            </div>
            <div class="mb-6">
              <label
                for="message"
                class="block mb-2 text-sm font-medium text-[var(--text-light)]"
                data-lang-key="contact.form.message"
                >Lời nhắn</label
              >
              <textarea
                id="message"
                name="message"
                rows="4"
                class="w-full p-2.5 rounded-lg bg-[var(--bg-dark)] border border-[var(--brand-secondary)] focus:ring-[var(--brand-primary)] focus:border-[var(--brand-primary)]"
                required
              ></textarea>
            </div>
            <button
              type="submit"
              class="w-full text-white bg-[var(--brand-secondary)] hover:bg-[var(--brand-primary)] hover:text-[var(--bg-dark)] font-bold rounded-lg text-sm px-5 py-3 text-center transition-colors duration-300"
              data-lang-key="contact.form.send"
            >
              Gửi
            </button>
          </form>
        </div>
        <div id="contact-success-message" class="hidden text-center">
          <i
            data-lucide="check-circle-2"
            class="w-16 h-16 mx-auto text-[var(--brand-primary)] mb-4"
          ></i>
          <h3 class="text-2xl font-bold mb-4" data-lang-key="contact.success.title">Cảm ơn bạn!</h3>
          <p class="text-[var(--text-dark)]" data-lang-key="contact.success.desc">
            Lời nhắn của bạn đã được gửi. Chúng tôi sẽ sớm liên hệ lại với bạn.
          </p>
        </div>
      </div>
      <button id="contact-modal-close-outer" class="absolute inset-0 -z-10"></button>
    </div>

    <div
      id="destination-modal"
      class="fixed inset-0 bg-black bg-opacity-70 z-[60] flex items-center justify-center p-4 hidden"
    >
      <div
        id="modal-content"
        class="bg-[var(--bg-medium)] text-white rounded-lg shadow-2xl max-w-4xl w-full relative transform scale-95 opacity-0 transition-all duration-300 flex flex-col md:flex-row max-h-[90vh]"
      ></div>
      <button
        id="modal-close-outer"
        class="absolute inset-0 -z-10"
        aria-label="Close modal"
      ></button>
    </div>

    <!-- 🗺️ MODAL BẢN ĐỒ SỐ TƯƠNG TÁC -->
    <div
      id="digital-map-modal"
      class="fixed inset-0 bg-black bg-opacity-70 z-[70] hidden items-center justify-center p-4 transition-opacity duration-300"
    >
      <div
        id="digital-map-modal-content"
        class="bg-[var(--bg-dark)] rounded-lg shadow-2xl relative w-[95vw] h-[90vh] overflow-hidden transform scale-95 transition-transform duration-300"
      >
        <button
          id="digital-map-modal-close"
          class="absolute top-2 right-2 text-white hover:text-[var(--brand-primary)] text-3xl z-30 w-10 h-10 flex items-center justify-center rounded-full bg-black/50 hover:bg-black/70 transition-all duration-200"
        >
          &times;
        </button>
        <iframe
          id="digital-map-iframe"
          class="w-full h-full border-0"
          src="about:blank"
          title="Bản đồ số Đà Nẵng"
          allowfullscreen
        >
        </iframe>
        <div
          id="iframe-loader"
          class="absolute inset-0 bg-[var(--bg-dark)] flex items-center justify-center"
        >
          <div class="text-center text-white">
            <div
              class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--brand-primary)] mb-3"
            ></div>
            <p>Đang tải bản đồ số...</p>
          </div>
        </div>
      </div>
    </div>

    <div id="music-player" class="fixed bottom-4 left-4 md:bottom-6 md:left-6 z-[100]">
      <div id="player-wrapper" class="relative flex items-center h-10 md:h-14 group">
        <button
          id="play-pause-btn"
          class="relative flex-shrink-0 w-10 h-10 md:w-14 md:h-14 flex items-center justify-center text-white bg-[var(--brand-secondary)] hover:bg-[var(--brand-primary)] rounded-full transition-all duration-300 shadow-lg z-10"
        >
          <svg
            id="play-icon"
            class="w-7 h-7 ml-1 icon-visible"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polygon points="6 3 20 12 6 21 6 3"></polygon>
          </svg>
          <svg
            id="pause-icon"
            class="w-7 h-7 icon-hidden"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <line x1="6" y1="4" x2="6" y2="20"></line>
            <line x1="18" y1="4" x2="18" y2="20"></line>
          </svg>
        </button>

        <div
          id="player-controls"
          class="absolute left-10 h-14 flex items-center bg-[var(--bg-medium)] bg-opacity-90 backdrop-blur-sm rounded-r-full shadow-lg pl-8 pr-4 space-x-2 transition-all duration-300 ease-in-out opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto w-0 group-hover:w-48"
        >
          <button
            id="next-track-btn"
            class="p-2 text-white hover:text-[var(--brand-primary)] transition-colors"
          >
            <i data-lucide="skip-forward" class="w-5 h-5"></i>
          </button>

          <div class="flex items-center space-x-2 flex-grow">
            <i data-lucide="volume-2" class="w-5 h-5 text-gray-300 flex-shrink-0"></i>
            <input
              type="range"
              id="volume-slider"
              min="0"
              max="1"
              step="0.01"
              value="0.5"
              class="w-full"
            />
          </div>
        </div>
      </div>
    </div>
    <div
      id="map-image-modal"
      class="fixed inset-0 bg-black bg-opacity-80 z-[70] hidden items-center justify-center p-4"
    >
      <div
        id="map-modal-content"
        class="bg-[var(--bg-dark)] rounded-lg shadow-2xl relative w-[95vw] h-[90vh] overflow-auto border-2 border-[var(--brand-secondary)]"
      >
        <button
          id="map-modal-close"
          class="absolute top-3 right-4 text-white hover:text-[var(--brand-primary)] text-4xl z-10"
        >
          &times;
        </button>
        <img
          :src="'/danasoul/images/ban_do_da_nang_moi.png'"
          alt="Bản đồ Đà Nẵng mới sau sáp nhập"
          class="w-full h-auto"
          loading="lazy"
        />
      </div>
    </div>

    <!-- 🚀 PERFORMANCE OPTIMIZATION SCRIPTS -->
  </div>
</template>

<script setup lang="ts">
/* eslint-disable */
// @ts-nocheck
import { onMounted, onUnmounted } from "vue";
import { RouterLink } from "vue-router";

function ensureExternalScript(src) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      if (existing.dataset.loaded === "true") {
        resolve();
        return;
      }
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error(`Failed to load ${src}`)), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.addEventListener(
      "load",
      () => {
        script.dataset.loaded = "true";
        resolve();
      },
      { once: true },
    );
    script.addEventListener("error", () => reject(new Error(`Failed to load ${src}`)), {
      once: true,
    });
    document.head.appendChild(script);
  });
}

function ensureExternalStylesheet(href) {
  if (document.querySelector(`link[href="${href}"]`)) {
    return;
  }
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  document.head.appendChild(link);
}

async function ensureDanaSoulDependencies() {
  ensureExternalStylesheet("https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css");
  ensureExternalStylesheet(
    "https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&display=swap",
  );

  await ensureExternalScript("https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js");
  await ensureExternalScript("https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js");
  await ensureExternalScript(
    "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js",
  );
  await ensureExternalScript("https://cdnjs.cloudflare.com/ajax/libs/tone/14.7.77/Tone.js");
  await ensureExternalScript("https://unpkg.com/lucide@latest");
}

onMounted(async () => {
  try {
    await ensureDanaSoulDependencies();
  } catch (error) {
    console.error(error);
    document.body.classList.remove("loading");
  }

  // Scroll to top
  window.scrollTo(0, 0);
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;

  // Pre-DOMContentLoaded handlers
  window.addEventListener("beforeunload", () => {
    window.scrollTo(0, 0);
  });

  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;

  document.addEventListener(
    "wheel",
    function (e) {
      if (document.body.classList.contains("loading")) {
        e.preventDefault();
      }
    },
    {
      passive: false,
    },
  );

  document.addEventListener(
    "touchmove",
    function (e) {
      if (document.body.classList.contains("loading")) {
        e.preventDefault();
      }
    },
    {
      passive: false,
    },
  );

  document.addEventListener("keydown", function (e) {
    if (document.body.classList.contains("loading")) {
      if ([32, 33, 34, 35, 36, 37, 38, 39, 40].includes(e.keyCode)) {
        e.preventDefault();
      }
    }
  });

  // === Main initialization (originally inside DOMContentLoaded) ===
  window.scrollTo(0, 0);
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;

  gsap.registerPlugin(ScrollTrigger);

  // 🚀 BACK TO TOP BUTTON FUNCTIONALITY 🚀
  const backToTopBtn = document.getElementById("back-to-top");
  let isVisible = false;

  if (!backToTopBtn) {
    console.error("Back to top button not found!");
    return;
  }

  // Show/hide button based on scroll position
  function toggleBackToTopBtn() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const shouldShow = scrollTop > 300; // Show after scrolling 300px

    if (shouldShow && !isVisible) {
      backToTopBtn.classList.add("show");
      isVisible = true;
    } else if (!shouldShow && isVisible) {
      backToTopBtn.classList.remove("show");
      isVisible = false;
    }
  }

  // Smooth scroll to top function
  function scrollToTop() {
    // Try multiple methods to ensure it works
    try {
      // Method 1: GSAP (if available)
      if (typeof gsap !== "undefined" && gsap.scrollTo) {
        gsap.to(window, {
          duration: 1.2,
          scrollTo: {
            y: 0,
            autoKill: true,
          },
          ease: "power2.out",
        });
        return;
      }
    } catch (e) {
      // Fallback to native scroll
    }

    // Method 2: Native smooth scroll
    try {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: "smooth",
      });
    } catch (e) {
      // Method 3: Fallback for older browsers
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }
  }

  // Event listeners
  window.addEventListener("scroll", toggleBackToTopBtn, {
    passive: true,
  });

  backToTopBtn.addEventListener("click", (e) => {
    e.preventDefault();
    scrollToTop();
  });

  // Initial check
  toggleBackToTopBtn();

  const createRevealEffect = (selector, options = {}) => {
    const elements = document.querySelectorAll(selector);
    if (elements.length === 0) {
      console.warn(`No elements found for selector: ${selector}`);
      return;
    }

    gsap.from(selector, {
      scrollTrigger: {
        trigger: selector,
        start: "top 85%",
        toggleActions: "play none none none",
        refreshPriority: 0,
        markers: false,
      },
      opacity: 0,
      y: 60,
      duration: 1.2,
      ease: "power3.out",
      stagger: 0.2,
      clearProps: "opacity,transform",
      ...options,
    });
  };

  setTimeout(() => {
    createRevealEffect("#about .grid > *");
    createRevealEffect("#planner .container > h2, #planner .container > p, #planner .max-w-5xl");
    // Farewell section handles its own GSAP animations
    createRevealEffect("#contact .container > *");

    createRevealEffect("#destinations > .container > h2, #filter-buttons");
    createRevealEffect("#map-section > .container > h2, #map-section > .container > p");
    createRevealEffect("#culture .text-center > *");
    createRevealEffect("#history #scrolly > *", {
      xPercent: -30,
    });
    createRevealEffect("#cuisine .container > h2, #cuisine .container > p");
  }, 500);

  gsap.to("#hero", {
    scrollTrigger: {
      trigger: "#hero",
      start: "top top",
      end: "+=100%",
      scrub: 1,
      pin: true,
      pinSpacing: true,
      anticipatePin: 1,
      refreshPriority: -1,
      invalidateOnRefresh: true,
    },
    scale: 1.2,
    opacity: 0,
    ease: "power1.in",
  });
  // --- LOGIC CHO MODAL BẢN ĐỒ SỐ (IFRAME) ---
  const showMapBtn = document.getElementById("show-map-image-btn");
  const digitalMapModal = document.getElementById("digital-map-modal");
  const digitalMapModalContent = document.getElementById("digital-map-modal-content");
  const digitalMapCloseBtn = document.getElementById("digital-map-modal-close");
  const mapIframe = document.getElementById("digital-map-iframe");
  const iframeLoader = document.getElementById("iframe-loader");
  const mapUrl = "https://bando.danang.gov.vn/";

  let isIframeLoaded = false;

  if (showMapBtn) {
    showMapBtn.addEventListener("click", () => {
      digitalMapModal.classList.remove("hidden");
      digitalMapModal.classList.add("flex");

      setTimeout(() => {
        digitalMapModalContent.classList.remove("scale-95");
      }, 10);

      // Chỉ tải iframe một lần đầu tiên để tiết kiệm tài nguyên
      if (!isIframeLoaded) {
        iframeLoader.style.display = "flex"; // Hiện loader
        mapIframe.src = mapUrl;

        mapIframe.onload = () => {
          iframeLoader.style.display = "none"; // Ẩn loader khi tải xong
          isIframeLoaded = true;
        };
      }
    });
  }

  const closeDigitalMapModal = () => {
    digitalMapModalContent.classList.add("scale-95");
    setTimeout(() => {
      digitalMapModal.classList.add("hidden");
      digitalMapModal.classList.remove("flex");
    }, 300);
  };

  if (digitalMapCloseBtn) {
    digitalMapCloseBtn.addEventListener("click", closeDigitalMapModal);
  }

  // Đóng modal khi bấm ra ngoài khu vực nội dung
  digitalMapModal.addEventListener("click", (event) => {
    if (event.target === digitalMapModal) {
      closeDigitalMapModal();
    }
  });
  // --- KHỞI TẠO ---
  lucide.createIcons();
  const preloader = document.getElementById("preloader");
  const preloaderFill = document.getElementById("preloader-fill");
  const preloaderPercent = document.getElementById("preloader-percent");

  // Animate preloader progress bar
  let preloaderProgress = 0;
  const preloaderInterval = setInterval(() => {
    preloaderProgress += Math.random() * 12 + 3;
    if (preloaderProgress > 90) preloaderProgress = 90;
    if (preloaderFill) preloaderFill.style.width = preloaderProgress + "%";
    if (preloaderPercent) preloaderPercent.textContent = Math.round(preloaderProgress) + "%";
  }, 180);

  const finishPreloader = () => {
    if (!preloader) {
      document.body.classList.remove("loading");
      return;
    }

    // Complete the progress to 100%
    clearInterval(preloaderInterval);
    let finishProgress = preloaderProgress;
    const finishInterval = setInterval(() => {
      finishProgress += 3;
      if (finishProgress >= 100) {
        finishProgress = 100;
        clearInterval(finishInterval);
      }
      if (preloaderFill) preloaderFill.style.width = finishProgress + "%";
      if (preloaderPercent) preloaderPercent.textContent = Math.round(finishProgress) + "%";
    }, 20);

    setTimeout(() => {
      preloader.style.opacity = "0";
      preloader.addEventListener(
        "transitionend",
        () => {
          preloader.style.display = "none";
          document.body.classList.remove("loading");
          window.scrollTo(0, 0);
        },
        { once: true },
      );

      setTimeout(() => {
        if (document.body.classList.contains("loading")) {
          document.body.classList.remove("loading");
          window.scrollTo(0, 0);
        }
      }, 3000);

      // Hero animations
      gsap.to("#hero-title", {
        duration: 1.2,
        y: 0,
        opacity: 1,
        ease: "power3.out",
        delay: 0.2,
      });
      gsap.to("#hero-subtitle", {
        duration: 1.2,
        y: 0,
        opacity: 1,
        ease: "power3.out",
        delay: 0.4,
      });
      gsap.to("#hero-cta", {
        duration: 1,
        opacity: 1,
        y: 0,
        ease: "power3.out",
        delay: 0.7,
      });
    }, 1400);
  };

  // In SPA navigation, `load` may have fired before this view mounts.
  // Fallback to immediate completion when document is already fully loaded.
  if (document.readyState === "complete") {
    finishPreloader();
  } else {
    window.addEventListener("load", finishPreloader, { once: true });
  }

  // --- PARALLAX ABOUT IMAGE ---
  gsap.to("#about-parallax-img", {
    scrollTrigger: {
      trigger: "#about",
      start: "top bottom",
      end: "bottom top",
      scrub: 1,
    },
    y: -40,
    ease: "none",
  });

  // 🌟 ABOUT SECTION - IMMERSIVE EFFECTS

  // 1. 3D Tilt on mouse move
  const aboutImage3D = document.getElementById("about-image-3d");
  if (aboutImage3D) {
    const aboutInner = aboutImage3D.querySelector(".about-image-3d-inner");

    aboutImage3D.addEventListener("mousemove", (e) => {
      const rect = aboutImage3D.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      const rotateX = y * -12;
      const rotateY = x * 12;

      gsap.to(aboutInner, {
        rotateX: rotateX,
        rotateY: rotateY,
        duration: 0.4,
        ease: "power2.out",
        transformPerspective: 1000,
      });
    });

    aboutImage3D.addEventListener("mouseleave", () => {
      gsap.to(aboutInner, {
        rotateX: 0,
        rotateY: 0,
        duration: 0.6,
        ease: "elastic.out(1, 0.5)",
      });
    });
  }

  // 3. Counter animation
  const animateCounters = () => {
    const counters = document.querySelectorAll(".about-stat-number");
    counters.forEach((counter) => {
      const target = parseInt(counter.dataset.count);
      const suffix = counter.dataset.suffix || "";
      const obj = { val: 0 };

      gsap.to(obj, {
        val: target,
        duration: 2,
        ease: "power2.out",
        onUpdate: () => {
          counter.textContent = Math.round(obj.val) + suffix;
        },
      });
    });
  };

  ScrollTrigger.create({
    trigger: "#about-stats",
    start: "top 80%",
    onEnter: animateCounters,
    once: true,
  });

  // 4. Typewriter tagline
  const taglines = {
    vi: "Linh hồn của mảnh đất miền Trung...",
    en: "The soul of Central Vietnam...",
  };

  let typewriterTimeout = null;
  let typewriterInterval = null;

  const typewriterEffect = (text, element, speed = 60, onDone) => {
    if (typewriterTimeout) clearTimeout(typewriterTimeout);
    element.textContent = "";
    let i = 0;

    const type = () => {
      if (i < text.length) {
        element.textContent += text.charAt(i);
        i++;
        typewriterTimeout = setTimeout(type, speed);
      } else if (onDone) {
        onDone();
      }
    };
    type();
  };

  const eraseEffect = (element, speed = 40, onDone) => {
    const erase = () => {
      if (element.textContent.length > 0) {
        element.textContent = element.textContent.slice(0, -1);
        typewriterTimeout = setTimeout(erase, speed);
      } else if (onDone) {
        onDone();
      }
    };
    erase();
  };

  const startTaglineLoop = (element) => {
    const run = () => {
      const text = taglines[currentLanguage];
      typewriterEffect(text, element, 60, () => {
        // Hiển thị đủ chữ → đợi 4 giây → xóa dần
        typewriterTimeout = setTimeout(() => {
          eraseEffect(element, 40, () => {
            // Xóa xong → đợi 1 giây → gõ lại
            typewriterTimeout = setTimeout(run, 1000);
          });
        }, 4000);
      });
    };
    run();
  };

  let typewriterTriggered = false;
  const taglineText = document.getElementById("tagline-text");
  if (taglineText) {
    ScrollTrigger.create({
      trigger: "#about",
      start: "top 70%",
      onEnter: () => {
        if (!typewriterTriggered) {
          typewriterTriggered = true;
          startTaglineLoop(taglineText);
        }
      },
      once: true,
    });
  }

  // --- ABOUT SECTION: RANDOM IMAGE SLIDESHOW ---
  const aboutSlideImages = [
    // Giới thiệu
    "/danasoul/images/Gioi thieu/cau-rong-da-nang-saigon-travel.jpg",
    "/danasoul/images/Gioi thieu/Hang-động-núi-Ngũ-Hành-Sơn-2.jpg",
    "/danasoul/images/Gioi thieu/kien-truc-pho-co-hoi-an-2_1665128843.jpg",
    "/danasoul/images/Gioi thieu/my_khe.jpg",
    // Điểm đến
    "/danasoul/images/Diem den/cau_vang.png",
    "/danasoul/images/Diem den/ban_dao_son_tra.png",
    "/danasoul/images/Diem den/ba_na_hills.png",
    "/danasoul/images/Diem den/chua_linh_ung.png",
    "/danasoul/images/Diem den/ngu_hanh_son.png",
    "/danasoul/images/Diem den/pho_co_hoi_an.png",
    "/danasoul/images/Diem den/thanh_dia_my_son.png",
    "/danasoul/images/Diem den/sun_wheel.png",
    // Văn hóa
    "/danasoul/images/Van hoa/bảo tàng chăm.png",
    "/danasoul/images/Van hoa/con_nguoi_da_nang.jpeg",
    "/danasoul/images/Van hoa/Lễ Cầu Ngư.png",
    "/danasoul/images/Van hoa/Lễ hội Quán Thế Âm.png",
    // Lịch sử
    "/danasoul/images/Lich su/da_nang_hien_dai.jpg",
    "/danasoul/images/Lich su/Champa.png",
    // Trang chủ
    "/danasoul/images/Trang chu/2.png",
    "/danasoul/images/Trang chu/3.png",
    "/danasoul/images/Trang chu/4.png",
    "/danasoul/images/Trang chu/5.png",
    // Hẹn gặp lại
    "/danasoul/images/Hen gap lai/da_nang_ve_dem.jpg",
  ];

  (() => {
    const slideA = document.getElementById("about-slide-a");
    const slideB = document.getElementById("about-slide-b");
    if (!slideA || !slideB) return;

    let currentFront = "a"; // track which slide is visible
    let lastIndex = 0;

    const getRandomIndex = () => {
      let idx;
      do {
        idx = Math.floor(Math.random() * aboutSlideImages.length);
      } while (idx === lastIndex && aboutSlideImages.length > 1);
      lastIndex = idx;
      return idx;
    };

    // Preload first few images
    aboutSlideImages.slice(0, 6).forEach((src) => {
      const img = new Image();
      img.src = src;
    });

    const swapSlide = () => {
      const nextSrc = aboutSlideImages[getRandomIndex()];
      const isDestImage = nextSrc.includes("/danasoul/images/Diem den/");
      if (currentFront === "a") {
        slideB.src = nextSrc;
        slideB.style.objectPosition = isDestImage ? "left bottom" : "center";
        slideB.style.opacity = "1";
        slideA.style.opacity = "0";
        currentFront = "b";
      } else {
        slideA.src = nextSrc;
        slideA.style.objectPosition = isDestImage ? "left bottom" : "center";
        slideA.style.opacity = "1";
        slideB.style.opacity = "0";
        currentFront = "a";
      }
    };

    setInterval(swapSlide, 4000);
  })();

  // --- ĐA NGÔN NGỮ (i18n) & DỮ LIỆU ---
  const languageContent = {
    vi: {
      nav: {
        about: "Giới thiệu",
        destinations: "Điểm đến",
        culture: "Văn hóa",
        history: "Lịch sử",
        cuisine: "Ẩm thực",
        map: "Bản đồ",
        planner: "Kế hoạch",
        contact: "Liên hệ",
      },
      hero: {
        subtitleNew: "Khám phá vẻ đẹp tiềm ẩn của thành phố đáng sống nhất Việt Nam.",
        cta: "Khám Phá Ngay",
      },
      about: {
        welcomeTitle: "Chào mừng đến với DanaSoul",
        intro1:
          "Khám phá Đà Nẵng – nơi hội tụ vẻ đẹp thiên nhiên, chiều sâu văn hóa và nhịp sống hiện đại. DanaSoul dẫn lối bạn về với linh hồn miền Trung: một Việt Nam kiên cường, đậm đà bản sắc và luôn vươn mình ra biển lớn.",
        intro2:
          "Sau sự kiện sáp nhập lịch sử, Đà Nẵng đã vươn mình trở thành thành phố rộng lớn nhất Việt Nam, mở ra một chương mới đầy sôi động. Từ Cầu Rồng phun lửa, Cầu Vàng lơ lửng giữa trời, đến bán đảo Sơn Trà hoang sơ hay Di sản Thế giới Mỹ Sơn trầm mặc, Đà Nẵng mở ra một hành trình khám phá không giới hạn – nơi bạn không chỉ dừng chân, mà còn lưu giữ vẹn nguyên cảm xúc.",
        stat1: "Điểm đến",
        stat2: "Năm lịch sử",
        stat3: "Món đặc sản",
      },
      destinations: {
        title: "Điểm Đến Biểu Tượng",
        filter: {
          all: "Tất cả",
          architecture: "Kiến trúc",
          nature: "Thiên nhiên",
          culture: "Văn hoá",
        },
      },
      culture: {
        title: "Bản Sắc Văn Hóa Miền Trung",
        intro:
          "Đà Nẵng không chỉ là thành phố của những cây cầu, mà còn là một không gian văn hóa đặc sắc, nơi giao hòa giữa truyền thống và hiện đại, giữa bản sắc địa phương và tinh thần hội nhập.",
        people: {
          title: "Con Người Đà Nẵng",
          desc: "Con người Đà Nẵng nổi bật bởi sự hiền hòa, thật thà, thân thiện và trọng nghĩa tình. Trong cách giao tiếp, cư xử, người Đà Nẵng luôn toát lên sự chân thành, mến khách. Chính điều này đã khiến du khách đến Đà Nẵng không chỉ 'xem cảnh mà còn “gặp người'. Tinh thần sống kỷ cương, văn minh, ý thức bảo vệ môi trường, ứng xử cộng đồng tốt là những giá trị văn hóa hiện đại đáng học hỏi.",
        },
        festivals: {
          title: "Lễ Hội Sôi Động",
        },
        heritage: {
          title: "Di Sản Trăm Năm",
        },
      },
      history: {
        title: "Dòng Chảy Lịch Sử",
        desc: "Hành trình ngàn năm từ thuở Chăm Pa cổ đại đến thành phố hiện đại bậc nhất miền Trung – mỗi giai đoạn là một dấu ấn không thể phai mờ.",
      },
      cuisine: {
        title: "Hành Trình Ẩm Thực",
        desc: "Khám phá Đà Nẵng qua hương vị là một trải nghiệm không thể thiếu. Mỗi món ăn là một câu chuyện về văn hoá, về sản vật địa phương và sự khéo léo của người dân nơi đây.",
        flavorTitle: "Hương Vị",
        locationTitle: "Gợi Ý Điểm Bán",
      },
      planner: {
        title: "Lập Kế Hoạch Chuyến Đi",
        desc: "Chọn các tiêu chí bên dưới, DanaSoul sẽ gợi ý một hành trình được thiết kế dành riêng cho bạn.",
        daysLabel: "1. Bạn muốn đi bao nhiêu ngày?",
        styleLabel: "2. Phong cách chuyến đi của bạn là gì?",
        styles: {
          discovery: "Khám Phá",
          relax: "Nghỉ Dưỡng",
          culture: "Văn Hóa",
        },
        resultTitle: "Lịch trình gợi ý cho bạn:",
        noResult: "Vui lòng chọn số ngày và ít nhất một phong cách để tạo lịch trình.",
        day: "Ngày",
        day_unit: "ngày",
        morning: "Sáng",
        afternoon: "Chiều",
        evening: "Tối",
      },
      farewell: {
        title: "Hẹn Gặp Lại",
        quote: '"Đi để trở về, và mang theo cả linh hồn nơi ấy"',
        desc: "Hành trình khám phá có thể kết thúc, nhưng những ký ức về Đà Nẵng sẽ còn mãi. DanaSoul hy vọng đã mang đến cho bạn những cảm hứng và hẹn gặp lại bạn ở thành phố xinh đẹp này.",
        lanternBtn: "Thả Đèn Trời",
        counterSections: "Phần Khám Phá",
        counterPlaces: "Điểm Đến",
        counterDishes: "Món Ăn",
        counterCity: "Thành Phố Tuyệt Vời",
      },
      contact: {
        title: "Liên Hệ Với Chúng Tôi",
        desc: "Bạn có câu hỏi hoặc muốn chia sẻ trải nghiệm? Đừng ngần ngại gửi tin nhắn cho DanaSoul.",
        button: "Gửi Lời Nhắn",
        form: {
          title: "Gửi Lời Nhắn Của Bạn",
          name: "Tên của bạn",
          email: "Email",
          message: "Lời nhắn",
          send: "Gửi",
        },
        success: {
          title: "Cảm ơn bạn!",
          desc: "Lời nhắn của bạn đã được gửi. Chúng tôi sẽ sớm liên hệ lại với bạn.",
        },
      },
      footer: {
        copyright: '© 2025 DanaSoul. Một sản phẩm dự thi "Hành trình Thống nhất".',
        tagline: "Chạm vào vẻ đẹp Đà Nẵng",
      },
      modal: {
        tabs: {
          overview: "Tổng quan",
          history: "Lịch sử",
          tips: "Mẹo",
        },
        no_history: "Chưa có thông tin lịch sử.",
        no_tips: "Chưa có mẹo nào.",
      },
    },
    en: {
      nav: {
        about: "About",
        destinations: "Destinations",
        culture: "Culture",
        history: "History",
        cuisine: "Cuisine",
        map: "Map",
        planner: "Planner",
        contact: "Contact",
      },
      hero: {
        subtitleNew: "Discover the hidden beauty of Vietnam's most livable city.",
        cta: "Explore Now",
      },
      about: {
        welcomeTitle: "Welcome to DanaSoul",
        intro1:
          "Explore Da Nang – a convergence of natural beauty, cultural depth, and modern vitality. DanaSoul guides you to the soul of the Central Region: a resilient Vietnam, rich in identity, and always reaching for the great sea.",
        intro2:
          "After a historic merger, Da Nang has become the largest city in Vietnam, opening a vibrant new chapter. From the fire-breathing Dragon Bridge and the sky-high Golden Bridge to the pristine Son Tra Peninsula or the contemplative My Son World Heritage site, Da Nang offers a limitless journey – a place not just to visit, but to cherish unforgettable emotions.",
        stat1: "Destinations",
        stat2: "Years of history",
        stat3: "Specialties",
      },
      destinations: {
        title: "Iconic Destinations",
        filter: {
          all: "All",
          architecture: "Architecture",
          nature: "Nature",
          culture: "Culture",
        },
      },
      culture: {
        title: "The Cultural Identity of Central Vietnam",
        intro:
          "Da Nang is not only a city of bridges but also a unique cultural space, where tradition and modernity, local identity and a spirit of integration harmonize.",
        people: {
          title: "The People of Da Nang",
          desc: "The people of Da Nang are known for being gentle, honest, friendly, and loyal. In communication and behavior, they always exude sincerity and hospitality. This is what makes visitors to Da Nang not only 'see the sights' but also 'meet the people'. The spirit of disciplined, civilized living, environmental awareness, and good community conduct are admirable modern cultural values.",
        },
        festivals: {
          title: "Vibrant Festivals",
        },
        heritage: {
          title: "Centuries of Heritage",
        },
      },
      history: {
        title: "The Flow of History",
        desc: "A thousand-year journey from the ancient Champa era to the most modern city in Central Vietnam – each chapter leaves an indelible mark.",
      },
      cuisine: {
        title: "A Culinary Journey",
        desc: "Exploring Da Nang through its flavors is an essential experience. Each dish tells a story of culture, local produce, and the skill of its people.",
        flavorTitle: "Flavor",
        locationTitle: "Where to Try",
      },
      planner: {
        title: "Plan Your Trip",
        desc: "Select the criteria below, and DanaSoul will suggest a tailor-made itinerary for you.",
        daysLabel: "1. How many days is your trip?",
        styleLabel: "2. What is your travel style?",
        styles: {
          discovery: "Discovery",
          relax: "Relaxation",
          culture: "Cultural",
        },
        resultTitle: "Your Suggested Itinerary:",
        noResult:
          "Please select the number of days and at least one travel style to generate an itinerary.",
        day: "Day",
        day_unit: "days",
        morning: "Morning",
        afternoon: "Afternoon",
        evening: "Evening",
      },
      farewell: {
        title: "See You Again",
        quote: '"Travel to return, carrying the soul of each place"',
        desc: "The journey of discovery may end, but the memories of Da Nang will last forever. DanaSoul hopes to have inspired you and looks forward to seeing you again in this beautiful city.",
        lanternBtn: "Release Sky Lanterns",
        counterSections: "Sections Explored",
        counterPlaces: "Destinations",
        counterDishes: "Local Dishes",
        counterCity: "Amazing City",
      },
      contact: {
        title: "Contact Us",
        desc: "Have a question or want to share your experience? Feel free to send a message to DanaSoul.",
        button: "Send a Message",
        form: {
          title: "Send Your Message",
          name: "Your Name",
          email: "Email",
          message: "Message",
          send: "Send",
        },
        success: {
          title: "Thank You!",
          desc: "Your message has been sent. We will get back to you soon.",
        },
      },
      footer: {
        copyright: '© 2025 DanaSoul. An entry for the "Unification Journey" contest.',
        tagline: "Touch the beauty of Da Nang",
      },
      modal: {
        tabs: {
          overview: "Overview",
          history: "History",
          tips: "Tips",
        },
        no_history: "No history information available.",
        no_tips: "No tips available.",
      },
    },
  };

  const data = {
    vi: {
      destinations: [
        {
          id: "cau-vang",
          title: "Cầu Vàng",
          category: "architecture",
          image: "/danasoul/images/Diem den/cau_vang.png",
          shortDesc: "Kiệt tác kiến trúc giữa mây ngàn Bà Nà.",
          fullDesc:
            "Nằm ở độ cao hơn 1.400 mét, Cầu Vàng là một điểm nhấn kiến trúc ấn tượng tại Sun World Bà Nà Hills. Cây cầu dài gần 150 mét, uốn lượn mềm mại như một dải lụa vàng được nâng đỡ bởi đôi bàn tay khổng lồ, rêu phong. Công trình tạo ra một lối đi bộ giữa không trung, giữa khung cảnh mờ ảo của mây và núi rừng, mang lại một trải nghiệm siêu thực cho du khách.",
          history:
            "Được khánh thành vào tháng 6 năm 2018, Cầu Vàng nhanh chóng gây tiếng vang toàn cầu. Tạp chí TIME đã vinh danh nó trong top 100 điểm đến tuyệt vời nhất thế giới, góp phần quan trọng đưa du lịch Đà Nẵng lên một tầm cao mới.",
          tips: "Nên đi vào buổi sáng sớm (trước 9h) hoặc chiều muộn (sau 16h) để tránh đông người và có cơ hội chụp ảnh với mây. Mặc thêm áo khoác vì thời tiết trên Bà Nà khá lạnh, kể cả vào mùa hè.",
        },
        {
          id: "cau-rong",
          title: "Cầu Rồng",
          category: "architecture",
          image: "/danasoul/images/Diem den/cau_rong.png",
          shortDesc: "Biểu tượng của Đà Nẵng với màn trình diễn phun lửa, phun nước.",
          fullDesc:
            "Với chiều dài 666 mét và 6 làn xe, Cầu Rồng không chỉ là một công trình giao thông trọng yếu bắc qua sông Hàn mà còn là biểu tượng cho khát vọng vươn xa của Đà Nẵng. Cầu được thiết kế theo hình dáng một con rồng thời Lý đang uốn lượn bay ra biển lớn, thể hiện sự mạnh mẽ và phát triển.",
          history:
            "Cầu được khởi công xây dựng vào ngày 19/07/2009 và chính thức khánh thành vào ngày 29/03/2013, nhân kỷ niệm 38 năm ngày giải phóng thành phố Đà Nẵng. Công trình đã nhận được nhiều giải thưởng kiến trúc quốc tế danh giá.",
          tips: "Màn trình diễn phun lửa (9 lượt) và phun nước (3 lượt) diễn ra vào 21:00 mỗi tối thứ Sáu, thứ Bảy và Chủ Nhật. Vị trí đẹp nhất để xem là đường Trần Hưng Đạo, các quán cà phê tầng thượng gần đó, hoặc ngay trên du thuyền sông Hàn.",
        },
        {
          id: "ba-na-hills",
          title: "Bà Nà Hills",
          category: "nature",
          image: "/danasoul/images/Diem den/ba_na_hills.png",
          shortDesc: "“Châu Âu thu nhỏ” trên đỉnh núi Chúa.",
          fullDesc:
            "Nằm trên đỉnh núi Chúa ở độ cao 1.487m, Bà Nà Hills là một khu du lịch phức hợp hàng đầu Việt Nam. Nơi đây sở hữu khí hậu mát mẻ quanh năm, được ví như “Đà Lạt của miền Trung”. Du khách sẽ được trải nghiệm bốn mùa trong một ngày và chiêm ngưỡng các công trình kiến trúc độc đáo như Làng Pháp, Hầm rượu Debay, Vườn hoa Le Jardin D'Amour và Cầu Vàng.",
          history:
            "Bà Nà được người Pháp phát hiện vào năm 1901 và xây dựng thành khu nghỉ dưỡng cho các quan chức Pháp vào đầu thế kỷ 20. Sau thời gian bị lãng quên, Sun Group đã đầu tư và tái thiết Bà Nà Hills thành một khu du lịch đẳng cấp quốc tế từ năm 2007.",
          tips: "Nên mua vé online để tránh xếp hàng. Hãy thử trải nghiệm Tàu hỏa leo núi số 2 để di chuyển giữa các khu vực. Đừng quên mang theo bản đồ khu du lịch để không bỏ lỡ các điểm tham quan và các show diễn nghệ thuật.",
        },
        {
          id: "my-khe",
          title: "Bãi biển Mỹ Khê",
          category: "nature",
          image: "/danasoul/images/Diem den/bai_bien_my_khe.png",
          shortDesc: "Một trong những bãi biển quyến rũ nhất hành tinh.",
          fullDesc:
            "Với đường bờ biển dài, bãi cát trắng mịn và làn nước trong xanh, ấm áp, Mỹ Khê là điểm đến lý tưởng cho các hoạt động nghỉ dưỡng và thể thao biển. Bãi biển được bao quanh bởi hàng dừa thơ mộng, sóng biển ôn hòa, rất an toàn cho cả trẻ em và người lớn.",
          history:
            "Trong thời kỳ chiến tranh Việt Nam, Mỹ Khê là một địa điểm quen thuộc với các binh sĩ Mỹ. Sau này, với tiềm năng du lịch vượt trội, bãi biển được đầu tư phát triển và trở nên nổi tiếng toàn cầu khi được Tạp chí Forbes vinh danh năm 2005.",
          tips: "Thời điểm lý tưởng để tắm biển là buổi sáng sớm hoặc chiều muộn. Dọc bờ biển có rất nhiều nhà hàng hải sản tươi ngon với giá cả phải chăng. Bạn cũng có thể thử các môn thể thao dưới nước như lướt ván, dù lượn.",
        },
        {
          id: "ngu-hanh-son",
          title: "Ngũ Hành Sơn",
          category: "nature",
          image: "/danasoul/images/Diem den/ngu_hanh_son.png",
          shortDesc: "Quần thể 5 ngọn núi đá vôi mang vẻ đẹp tâm linh huyền bí.",
          fullDesc:
            "Ngũ Hành Sơn là một kiệt tác của thiên nhiên với 5 ngọn núi (Kim, Mộc, Thủy, Hỏa, Thổ) tượng trưng cho năm yếu tố của vũ trụ. Nơi đây là sự kết hợp hài hòa giữa cảnh quan thiên nhiên và các công trình văn hóa tâm linh, với hệ thống hang động, chùa chiền cổ kính. Ngọn Thủy Sơn là ngọn núi lớn và đẹp nhất, thường được du khách lựa chọn để khám phá.",
          history:
            "Theo truyền thuyết Chăm Pa, 5 ngọn núi được tạo ra từ 5 mảnh vỡ của quả trứng rồng. Nơi đây đã từng là một địa điểm tâm linh quan trọng của người Chăm và sau này là của người Việt, đồng thời là căn cứ cách mạng trong các cuộc kháng chiến.",
          tips: "Nên mang giày thể thao thoải mái để tiện leo trèo. Có thang máy với giá vé 15.000 VNĐ/chiều cho những ai không muốn leo bộ lên Thủy Sơn. Đừng quên ghé thăm Làng nghề đá mỹ nghệ Non Nước dưới chân núi.",
        },
        {
          id: "sun-wheel",
          title: "Sun Wheel",
          category: "architecture",
          image: "/danasoul/images/Diem den/sun_wheel.png",
          shortDesc: "Trải nghiệm ngắm toàn cảnh Đà Nẵng từ độ cao 115m.",
          fullDesc:
            "Tọa lạc tại Công viên Châu Á (Asia Park), Sun Wheel là một trong 10 vòng quay cao nhất thế giới. Với 64 cabin, mỗi cabin chở được 6 người, một vòng quay kéo dài 15 phút, đủ thời gian để bạn chiêm ngưỡng toàn cảnh Đà Nẵng rực rỡ về đêm, từ những cây cầu lung linh đến thành phố sôi động.",
          history:
            "Được khánh thành vào năm 2014, Sun Wheel nhanh chóng trở thành một biểu tượng giải trí hiện đại của thành phố, là điểm nhấn quan trọng trong dự án Công viên Châu Á, một công viên văn hóa kết hợp nhiều nét đặc trưng của các quốc gia châu Á.",
          tips: "Thời điểm lý tưởng nhất để trải nghiệm Sun Wheel là vào buổi tối khi thành phố đã lên đèn. Vé vào cổng Asia Park đã bao gồm vé Sun Wheel và nhiều trò chơi khác. Hãy kết hợp tham quan các khu vực văn hóa trong công viên.",
        },
        {
          id: "ban-dao-son-tra",
          title: "Bán đảo Sơn Trà",
          category: "nature",
          image: "/danasoul/images/Diem den/ban_dao_son_tra.png",
          shortDesc: "“Lá phổi xanh” của thành phố và là nhà của Voọc chà vá chân nâu.",
          fullDesc:
            "Bán đảo Sơn Trà là một khu bảo tồn thiên nhiên đa dạng sinh học, nơi có khu rừng nguyên sinh với hệ động thực vật phong phú, đặc biệt là loài Voọc chà vá chân nâu quý hiếm. Những con đường uốn lượn quanh bán đảo sẽ đưa bạn đến với những cảnh quan tuyệt đẹp, từ núi cao hùng vĩ đến biển xanh bao la.",
          history:
            "Trong lịch sử, Sơn Trà có vị trí quân sự chiến lược, từng được mệnh danh là “Mắt thần Đông Dương”. Ngày nay, nơi đây được bảo tồn và phát triển du lịch sinh thái bền vững, trở thành điểm đến không thể bỏ lỡ của Đà Nẵng.",
          tips: "Bạn có thể thuê xe máy để khám phá trọn vẹn vẻ đẹp của bán đảo. Các điểm nên ghé thăm bao gồm Chùa Linh Ứng, Đỉnh Bàn Cờ, Cây Đa Ngàn Năm. Hãy lái xe cẩn thận vì đường khá dốc và cua gấp.",
        },
        {
          id: "chua-linh-ung",
          title: "Chùa Linh Ứng",
          category: "culture",
          image: "/danasoul/images/Diem den/chua_linh_ung.png",
          shortDesc: "Ngôi chùa trên bán đảo Sơn Trà với tượng Quán Thế Âm cao nhất Việt Nam.",
          fullDesc:
            "Chùa Linh Ứng Bãi Bụt - Sơn Trà là ngôi chùa lớn và mới nhất trong 3 ngôi “Linh Ứng Tự” của Đà Nẵng. Chùa tọa lạc trên một ngọn đồi, với lưng tựa núi, mặt hướng ra biển, tạo nên một khung cảnh uy nghiêm và thanh tịnh. Điểm nhấn chính là tượng Quán Thế Âm Bồ Tát cao 67m, đứng trên đài sen đường kính 35m.",
          history:
            "Chùa được khởi công xây dựng vào năm 2004 và khánh thành vào năm 2010. Tương truyền, vào thời vua Minh Mạng, có một pho tượng Phật từ biển trôi vào đây, người dân đã lập am thờ tự và từ đó sóng yên biển lặng. Đây cũng là lý do chùa được xây dựng tại vị trí này.",
          tips: "Mặc trang phục lịch sự, kín đáo khi vào chùa. Giữ im lặng và không gây ồn ào. Từ sân chùa, bạn có thể ngắm nhìn toàn cảnh thành phố và bãi biển Mỹ Khê.",
        },
        {
          id: "hoi-an",
          title: "Phố cổ Hội An",
          category: "culture",
          image: "/danasoul/images/Diem den/pho_co_hoi_an.png",
          shortDesc: "Di sản văn hóa thế giới với vẻ đẹp vượt thời gian.",
          fullDesc:
            "Hội An là một bức tranh sống động về một thương cảng quốc tế sầm uất thế kỷ 16-17. Đô thị cổ này quyến rũ du khách bởi những ngôi nhà tường vàng, mái ngói âm dương rêu phong, những con hẻm nhỏ và những chiếc đèn lồng rực rỡ về đêm. Không gian hoài cổ, yên bình nơi đây mang lại cảm giác thư thái lạ thường.",
          history:
            "Là một Di sản Văn hóa Thế giới được UNESCO công nhận năm 1999, Hội An là một ví dụ điển hình được bảo tồn đặc biệt tốt về một thương cảng Đông Nam Á. Kiến trúc và quy hoạch đường phố của nó phản ánh sự giao thoa của các nền văn hóa bản địa và nước ngoài.",
          tips: "Hãy thử đi thuyền trên sông Hoài và thả đèn hoa đăng để cầu may mắn. Đừng bỏ lỡ các món ăn đặc sản như Cao Lầu, Mì Quảng, Cơm Gà. Vé tham quan phố cổ có giá trị trong suốt thời gian lưu trú.",
        },
        {
          id: "nui-than-tai",
          title: "Công viên núi Thần Tài",
          category: "nature",
          image: "/danasoul/images/Diem den/nui_than_tai.png",
          shortDesc: "Khu du lịch sinh thái kết hợp nghỉ dưỡng và tắm khoáng nóng.",
          fullDesc:
            "Nằm giữa khu bảo tồn Bà Nà Núi Chúa, công viên suối khoáng nóng Núi Thần Tài là điểm đến lý tưởng để thư giãn và phục hồi sức khỏe. Nơi đây cung cấp các dịch vụ đa dạng như tắm khoáng nóng, tắm bùn, tắm Onsen theo phong cách Nhật Bản, spa, và một công viên nước quy mô lớn.",
          history:
            "Phát triển trên một mỏ nước khoáng nóng tự nhiên được phát hiện trong lòng núi, khu du lịch này được xây dựng với mục tiêu trở thành một điểm đến du lịch sức khỏe và giải trí đẳng cấp, kết hợp hài hòa với thiên nhiên.",
          tips: "Nên mang theo đồ bơi, khăn tắm và các vật dụng cá nhân. Gói dịch vụ thường bao gồm nhiều hoạt động, hãy xem kỹ để chọn gói phù hợp. Trải nghiệm luộc trứng trong dòng suối khoáng nóng là một hoạt động thú vị.",
        },
        {
          id: "my-son",
          title: "Thánh địa Mỹ Sơn",
          category: "culture",
          image: "/danasoul/images/Diem den/thanh_dia_my_son.png",
          shortDesc: "Di sản văn hóa thế giới nằm trong lòng thung lũng.",
          fullDesc:
            "Là một tổ hợp bao gồm nhiều đền đài Chăm Pa, trong một thung lũng được bao quanh bởi đồi núi. Nơi đây từng là trung tâm tôn giáo và chính trị của Vương quốc Chăm Pa. Những ngọn tháp rêu phong, cổ kính mang trong mình vẻ đẹp huyền bí và giá trị lịch sử to lớn.",
          history:
            "Được xây dựng từ thế kỷ thứ 4, Mỹ Sơn là thánh địa Ấn Độ giáo của Vương quốc Chămpa. Nơi đây được UNESCO công nhận là Di sản thế giới vào năm 1999. Kiến trúc độc đáo với kỹ thuật xây dựng bằng gạch nung không dùng vữa đã trở thành một bí ẩn hấp dẫn.",
          tips: "Nên đến thăm vào buổi sáng để có thời tiết mát mẻ và ánh sáng đẹp. Đừng bỏ lỡ các buổi biểu diễn nghệ thuật Apsara tại khu du lịch. Có xe điện đưa khách từ cổng vào khu di tích chính.",
        },
        {
          id: "cu-lao-cham",
          title: "Cù Lao Chàm",
          category: "nature",
          image: "/danasoul/images/Diem den/cu_lao_cham.jpg",
          shortDesc: "Khu dự trữ sinh quyển thế giới với biển xanh và san hô.",
          fullDesc:
            "Cù Lao Chàm là một cụm gồm 8 hòn đảo hoang sơ được UNESCO công nhận là Khu dự trữ sinh quyển thế giới. Nơi đây sở hữu hệ sinh thái biển vô cùng phong phú, là thiên đường cho những ai yêu thích lặn biển ngắm san hô, tắm biển và khám phá cuộc sống của các làng chài yên bình.",
          history:
            "Là một thương cảng cổ và là nơi cư trú của người Chăm Pa, Cù Lao Chàm có một lịch sử giao thương lâu đời. Các di tích như chùa Hải Tạng cổ (xây dựng năm 1758) cho thấy một đời sống tâm linh phong phú và vai trò quan trọng của hòn đảo này từ nhiều thế kỷ trước.",
          tips: "Thời điểm lý tưởng nhất là từ tháng 3 đến tháng 8. Bạn nên đặt tour cano trong ngày từ Đà Nẵng hoặc Hội An để có trải nghiệm trọn vẹn. Đừng quên thử món cua đá đặc sản.",
        },
        {
          id: "lang-bich-hoa-tam-thanh",
          title: "Làng bích họa Tam Thanh",
          category: "culture",
          image: "/danasoul/images/Diem den/lang_bich_hoa_tam_thanh.webp", // Cập nhật đường dẫn ảnh của bạn
          shortDesc: "Ngôi làng chài được khoác lên mình tấm áo nghệ thuật đầy màu sắc.",
          fullDesc:
            "Làng bích họa Tam Thanh là dự án giao lưu nghệ thuật cộng đồng giữa Hàn Quốc và Việt Nam, biến những bức tường cũ kỹ của một làng chài ven biển thành một bảo tàng nghệ thuật ngoài trời sống động. Mỗi bức tranh là một câu chuyện về cuộc sống, con người và văn hóa miền biển, mang lại một sức sống mới cho ngôi làng và tạo nên một điểm đến độc đáo.",
          history:
            "Dự án được khởi xướng vào năm 2016 và nhanh chóng trở thành một hiện tượng, thu hút đông đảo khách du lịch. Nó không chỉ cải thiện cảnh quan mà còn góp phần phát triển kinh tế địa phương, là một hình mẫu thành công về du lịch cộng đồng.",
          tips: "Thời điểm lý tưởng để tham quan và chụp ảnh là vào buổi sáng sớm hoặc chiều mát. Hãy đi bộ thong thả qua các con hẻm để không bỏ lỡ những bức tranh ẩn mình. Đừng quên giữ gìn vệ sinh và tôn trọng không gian sống của người dân địa phương.",
        },
        {
          id: "bien-an-bang",
          title: "Bãi biển An Bàng",
          category: "nature",
          image: "/danasoul/images/Diem den/bien_an_bang.webp",
          shortDesc: "Top bãi biển đẹp nhất châu Á với bờ cát trắng và vẻ đẹp yên bình.",
          fullDesc:
            "Biển An Bàng chinh phục du khách bởi vẻ đẹp hoang sơ, yên tĩnh với bờ cát trắng mịn trải dài và làn nước biển trong xanh. Nơi đây là điểm đến lý tưởng để thư giãn, tắm nắng và tận hưởng không khí trong lành, tách biệt với sự ồn ào của thành phố.",
          history:
            "Khác với các bãi biển sầm uất khác, An Bàng giữ được nét đẹp tự nhiên vốn có. Nơi đây bắt đầu được du khách quốc tế biết đến rộng rãi và được vinh danh trên các trang du lịch uy tín như Tripadvisor, trở thành một 'viên ngọc ẩn' của Hội An.",
          tips: "Dọc bãi biển có nhiều quán bar, nhà hàng với phong cách mộc mạc, gần gũi. Thời điểm đẹp nhất để đến đây là lúc bình minh hoặc hoàng hôn. Bạn có thể thuê ghế dài để nằm thư giãn cả ngày.",
        },
        {
          id: "rung-dua-bay-mau",
          title: "Rừng dừa Bảy Mẫu",
          category: "nature",
          image: "/danasoul/images/Diem den/rung_dua_bay_mau.jpg", // Cập nhật đường dẫn ảnh của bạn
          shortDesc: "Trải nghiệm “Miền Tây thu nhỏ” giữa lòng Hội An.",
          fullDesc:
            "Rừng dừa Bảy Mẫu là một khu du lịch sinh thái rộng lớn với những rặng dừa nước xanh bạt ngàn. Du khách sẽ được trải nghiệm ngồi thuyền thúng len lỏi qua các con rạch nhỏ, xem biểu diễn múa thúng, và tham gia các trò chơi dân gian như câu cua. Đây là một điểm đến lý tưởng để hòa mình vào thiên nhiên và tìm hiểu về đời sống sông nước của người dân địa phương.",
          history:
            "Nơi đây từng là một căn cứ địa cách mạng quan trọng trong thời kỳ kháng chiến. Ngày nay, Rừng dừa Bảy Mẫu đã trở thành một điểm du lịch sinh thái nổi tiếng, góp phần đa dạng hóa trải nghiệm du lịch khi đến với vùng đất Quảng Nam - Đà Nẵng.",
          tips: "Nên đi theo tour để có trải nghiệm trọn vẹn và giá cả tốt nhất. Hãy mang theo mũ, nón và kem chống nắng. Bạn có thể thưởng thức các món ăn dân dã được chế biến từ dừa ngay tại đây.",
        },
      ],
      culture: {
        // Thay thế toàn bộ mục culture cũ bằng mục này
        title: "Bản Sắc Văn Hóa Miền Trung",
        intro:
          "Đà Nẵng không chỉ là thành phố của những cây cầu, mà còn là một không gian văn hóa đặc sắc, nơi giao hòa giữa truyền thống và hiện đại. Hãy chạm vào la bàn để khám phá.",
        categories: {
          people: {
            id: "people",
            label: "Con Người",
            icon: "users",
            title: "Con Người Đà Nẵng",
            desc: "Con người Đà Nẵng nổi bật bởi sự hiền hòa, thật thà, thân thiện và trọng nghĩa tình. Trong cách giao tiếp, cư xử, người Đà Nẵng luôn toát lên sự chân thành, mến khách. Chính điều này đã khiến du khách đến Đà Nẵng không chỉ 'xem cảnh mà còn “gặp người'. Tinh thần sống kỷ cương, văn minh, ý thức bảo vệ môi trường, ứng xử cộng đồng tốt là những giá trị văn hóa hiện đại đáng học hỏi.",
            image: "/danasoul/images/Van hoa/con_nguoi_da_nang.jpeg",
          },
          festivals: {
            id: "festivals",
            label: "Lễ Hội",
            icon: "calendar-heart",
            items: [
              {
                id: "diff",
                title: "Pháo hoa Quốc tế (DIFF)",
                desc: "Sự kiện thường niên vào tháng 6-7, nơi các quốc gia trình diễn pháo hoa nghệ thuật rực rỡ trên bầu trời sông Hàn, một bữa tiệc của âm thanh và ánh sáng.",
                image: "/danasoul/images/Van hoa/DIFF.jpg",
              },
              {
                id: "quan-the-am",
                title: "Lễ hội Quán Thế Âm",
                desc: "Diễn ra vào ngày 19/2 Âm lịch tại Ngũ Hành Sơn, là một trong những lễ hội Phật giáo lớn nhất, cầu quốc thái dân an và là dịp để tìm về sự thanh tịnh.",
                image: "/danasoul/images/Van hoa/Lễ hội Quán Thế Âm.png",
              },
              {
                id: "cau-ngu",
                title: "Lễ hội Cầu Ngư",
                desc: "Tổ chức vào tháng 2-4 Âm lịch tại các làng chài ven biển. Lễ hội mang đậm tín ngưỡng dân gian, cầu mong một mùa biển bội thu và bình an cho ngư dân.",
                image: "/danasoul/images/Van hoa/Lễ Cầu Ngư.png",
              },
              {
                id: "bai-choi",
                title: "Hát Bài Chòi",
                desc: "Di sản văn hóa phi vật thể của UNESCO, là một loại hình nghệ thuật hát đối và trò chơi dân gian độc đáo, thường diễn ra vào dịp lễ Tết bên sông Hàn.",
                image: "/danasoul/images/Van hoa/bài chòi.png",
              },
            ],
          },
          heritage: {
            id: "heritage",
            label: "Di Sản",
            icon: "gem",
            items: [
              {
                id: "cham-museum",
                title: "Bảo tàng Điêu khắc Chăm",
                desc: "Là bảo tàng duy nhất trên thế giới về nghệ thuật Chăm, lưu giữ hơn 2.000 hiện vật vô giá. Đây là kho báu giúp khám phá một nền văn minh rực rỡ từng tồn tại ở miền Trung Việt Nam.",
                image: "/danasoul/images/Van hoa/bảo tàng chăm.png",
              },
              {
                id: "non-nuoc",
                title: "Làng đá Non Nước",
                desc: "Với hơn 400 năm lịch sử, làng nghề dưới chân Ngũ Hành Sơn là nơi kết tinh kỹ thuật điêu khắc dân gian và tinh thần lao động cần mẫn, tạo ra những sản phẩm đá mỹ nghệ tinh xảo.",
                image: "/danasoul/images/Van hoa/làng đá mỹ nghệ non nước.png",
              },
            ],
          },
          crafts: {
            id: "crafts",
            label: "Làng Nghề",
            icon: "palette",
            items: [
              {
                id: "thanh-ha",
                title: "Làng gốm Thanh Hà",
                desc: "Nằm bên sông Thu Bồn, làng gốm hơn 500 năm tuổi này nổi tiếng với các sản phẩm gốm đất nung không tráng men, được tạo tác hoàn toàn bằng tay và nung bằng lò củi truyền thống, tạo ra màu sắc và âm thanh độc đáo.",
                image: "/danasoul/images/Van hoa/lang_gom_thanh_ha.jpg",
              },
              {
                id: "kim-bong",
                title: "Làng mộc Kim Bồng",
                desc: "Là cái nôi của nghề mộc xứ Quảng, những người thợ Kim Bồng đã góp phần tạo nên kiến trúc cổ kính của Hội An. Sản phẩm của làng nổi tiếng với kỹ thuật chạm trổ tinh xảo trên các sản phẩm từ đồ gia dụng đến thuyền bè.",
                image: "/danasoul/images/Van hoa/lang_moc_kim_bong.jpg",
              },
              {
                id: "cam-ne",
                title: "Làng chiếu Cẩm Nê",
                desc: "Từng là sản phẩm tiến vua triều Nguyễn, chiếu hoa Cẩm Nê nổi tiếng vì sợi cói nhỏ, bền, và hoa văn tinh xảo. Tiếng đập chiếu lách cách đã trở thành một nét âm thanh đặc trưng của làng quê Đà Nẵng.",
                image: "/danasoul/images/Van hoa/lang_chieu_cam_ne.jpg",
              },
            ],
          },
        },
      },
      cuisine: [
        {
          id: "my-quang",
          title: "Mì Quảng",
          image: "/danasoul/images/Am thuc/my_quang.png",
          desc: "Mì Quảng là món ăn đặc trưng của Đà Nẵng - Quảng Nam, gồm sợi mì to bản, nước dùng sền sệt ít nhưng đậm đà, ăn kèm thịt, tôm, trứng, rau sống và bánh tráng mè nướng.",
          flavor: "Đậm vị, hơi béo, cay nhẹ, hài hòa giữa các nguyên liệu, ăn no mà không ngán.",
          locations: [
            "Mì Quảng Bà Mua - 19 Trần Bình Trọng",
            "Mì Quảng 1A - 1A Hải Phòng",
            "Mì Quảng Thi – 251 Hoàng Diệu",
            "Mì Quảng Bà Vị – 166 Lê Đình Dương",
            "Mì Quảng Dung - 121 Đống Đa",
          ],
        },
        {
          id: "banh-trang-thit-heo",
          title: "Bánh tráng cuốn thịt heo",
          image: "/danasoul/images/Am thuc/banh_trang_cuon_thit_heo.png",
          desc: "Thịt heo hai đầu da thái mỏng, cuốn cùng bánh tráng, rau sống và chấm với mắm nêm đậm đà.",
          flavor: "Tươi mát, thanh nhẹ, nổi bật bởi vị mắm nêm đặc trưng và rau sống đa dạng.",
          locations: [
            "Quán Trần - 4 Lê Duẩn",
            "Quán Mậu – 35 Đỗ Thúc Tịnh",
            "Quán Bà Hường - 364 Hoàng Diệu",
            "Quán Đại Lộc – 277 Đống Đa",
            "Bánh tráng cuốn thịt heo Quê Xưa - 176 Nguyễn Hoàng",
          ],
        },
        {
          id: "bun-mam-nem",
          title: "Bún mắm nêm",
          image: "/danasoul/images/Am thuc/bun_mam_nem.png",
          desc: "Bún tươi, thịt luộc, nem chua, rau sống và mắm nêm pha tỏi ớt - món ăn đường phố nổi tiếng Đà Nẵng.",
          flavor: "Mặn, ngọt, chua, cay, nồng - mắm nêm là linh hồn của món ăn, rất đặc trưng.",
          locations: [
            "Bún mắm Bà Đông - K23/14 Trần Kế Xương",
            "Bún mắm Vân - 23/14 Trần Kế Xương",
            "Bún mắm nêm Ngọc - 20 Đoàn Thị Điểm",
            "Bún mắm Dì Liên - 52 Trần Bình Trọng",
            "Bún mắm Bà Thuyên - 424 Trưng Nữ Vương",
          ],
        },
        {
          id: "banh-xeo-nem-lui",
          title: "Bánh xèo - Nem lụi",
          image: "/danasoul/images/Am thuc/banh_xeo_nem_lui.png",
          desc: "Bánh xèo vàng giòn nhân tôm thịt giá, ăn kèm rau sống, bánh tráng và nem lụi nướng chấm nước lèo.",
          flavor: "Giòn rụm, béo, thơm mùi nghệ, hòa quyện cùng rau sống và nước chấm đặc trưng.",
          locations: [
            "Bánh xèo Bà Dưỡng - K280/23 Hoàng Diệu",
            "Bánh xèo Tôm Nhảy - 140 Nguyễn Đức Trung",
            "Bánh xèo Cô Ba - 248 Trưng Nữ Vương",
            "Quán Xuân - 469 Hải Phòng",
            "Bánh xèo miền Trung - 7 Hải Phòng",
          ],
        },
        {
          id: "che-thai-lien",
          title: "Chè Thái Liên",
          image: "/danasoul/images/Am thuc/che_thai_lien.png",
          desc: "Món chè mát lạnh gồm sầu riêng, thạch, trái cây, hạt é, nước cốt dừa - đặc sản giải nhiệt trứ danh.",
          flavor: "Ngọt, béo, thơm mùi sầu riêng, giòn mát từ topping và thạch.",
          locations: [
            "Chè Liên – 189 Hoàng Diệu",
            "Chè Liên - 175 Hải Phòng",
            "Chè Liên - 320 Điện Biên Phủ",
            "Chè Thái Mỹ – 28 Pasteur",
            "Chè Thái Tâm - 147 Lê Duẩn",
          ],
        },
        {
          id: "cao-lau",
          title: "Cao lầu",
          image: "/danasoul/images/Am thuc/cao_lau.png",
          desc: "Món mì đặc sản xứ Quảng với sợi cao lầu vàng dai, thịt xá xíu, rau sống Trà Quế và tóp mỡ, chan ít nước dùng.",
          flavor: "Mặn nhẹ, thơm mùi tro củi, sợi mì dai lạ, không giống mì Quảng hay bún.",
          locations: [
            "Cao lầu Hoài Phố - 255 Nguyễn Chí Thanh",
            "Quán Thanh - 39 Phạm Hồng Thái",
            "Cao lầu Bé Hội An – 44 Lê Lợi",
            "Cao lầu Hội An – 128 Nguyễn Tri Phương",
            "Chợ Bắc Mỹ An (gian hàng phía trong)",
          ],
        },
        {
          id: "goi-ca-nam-o",
          title: "Gỏi cá Nam Ô",
          image: "/danasoul/images/Am thuc/goi_ca_nam_o.png",
          desc: "Gỏi cá sống từ cá trích/cá mai, trộn thính và rau thơm, ăn kèm bánh tráng cuốn và mắm nêm gừng.",
          flavor: "Tươi, bùi, cay nồng - ăn kèm rau sống rất đậm đà.",
          locations: [
            "Gỏi cá Sáu Hào - 130 Nguyễn Tất Thành",
            "Gỏi cá Thanh Hương - 102 Lê Độ",
            "Gỏi cá Nam Ô – 972 Nguyễn Lương Bằng",
            "Quán Hải sản Bé Anh – 2 Phạm Văn Đồng",
            "Quán Bà Lý - 41 Ngô Thì Nhậm",
          ],
        },
        {
          id: "bun-cha-ca",
          title: "Bún chả cá",
          image: "/danasoul/images/Am thuc/bun_cha_ca.png",
          desc: "Bún tươi với chả cá chiên, hấp, nước lèo nấu từ xương cá, cà chua, thơm.",
          flavor: "Ngọt thanh, thơm, cay nhẹ, chả cá dai ngon - món ăn sáng phổ biến tại Đà Nẵng.",
          locations: [
            "Bún chả cá Bà Lữ - 319 Hùng Vương",
            "Bún chả cá Ông Tạ - 113A Nguyễn Chí Thanh",
            "Bún chả cá Hờn - 113/3 Nguyễn Chí Thanh",
            "Bún chả cá Bà Phiến – 63 Lê Hồng Phong",
            "Bún chả cá Nguyễn Chí Thanh - 109 Nguyễn Chí Thanh",
          ],
        },
        {
          id: "hai-san",
          title: "Hải sản Đà Nẵng",
          image: "/danasoul/images/Am thuc/hai_san_da_nang.png",
          desc: "Tươi sống, chế biến tại chỗ: tôm hùm, ghẹ, mực, hàu, nghêu, sò - chế biến hấp, nướng, rang me, cháy tỏi.",
          flavor: "Tươi, ngọt, đậm đà - gia vị vừa phải để giữ vị nguyên bản hải sản.",
          locations: [
            "Hải sản Bé Mặn - Lô 14 Võ Nguyên Giáp",
            "Hải sản Năm Đảnh – K139/H59/38 Trần Quang Khải",
            "Hải sản Bà Thôi – 96 Lê Đình Dương",
            "Hải sản Bé Anh – 2 Phạm Văn Đồng",
            "Quán Biển Rạng - 51 Võ Nguyên Giáp",
          ],
        },
        {
          id: "kem-bo",
          title: "Kem bơ",
          image: "/danasoul/images/Am thuc/kem_bo.png",
          desc: "Sinh tố bơ xay mịn, ăn cùng kem dừa, đậu phộng – món tráng miệng mát lạnh 'gây nghiện' ở Đà Nẵng.",
          flavor: "Béo ngậy, mát lạnh, thơm đặc trưng của bơ chín và kem sữa.",
          locations: [
            "Kem bơ Cô Vân – Chợ Bắc Mỹ An",
            "Kem bơ Phạm Tứ – 195 Phạm Tứ",
            "Kem bơ Thanh – 47 Lê Duẩn",
            "Kem bơ Bảo – 41 Lê Hữu Trác",
            "Kem bơ Nguyễn Văn Linh – số 17 Nguyễn Văn Linh",
          ],
        },
      ],
      history: [
        {
          id: "history-champa",
          title: "Thế kỷ IV - XV: Vương quốc Champa",
          text: "Đà Nẵng nguyên là lãnh thổ phía Bắc Champa, được biết đến với tên gọi trong tiếng Chăm có nghĩa là 'sông lớn'. Nơi đây từng là trung tâm tín ngưỡng Hindu, minh chứng qua các hiện vật trưng bày tại Bảo tàng Điêu khắc Chăm.",
          imageId: "champa",
        },
        {
          id: "history-port",
          title: "Thế kỷ XVI - XIX: Thương cảng quốc tế",
          text: "Trở thành đầu mối giao thương quan trọng, Đà Nẵng là 'tiền cảng' của Hội An, dần thay thế nơi này nhờ khả năng đón tàu lớn dễ dàng.",
          imageId: "port",
        },
        {
          id: "history-french",
          title: "Năm 1858: Liên quân Pháp - Tây Ban Nha nổ súng",
          text: "Đà Nẵng là nơi liên quân Pháp - Tây Ban Nha nổ súng mở đầu cuộc xâm lược Việt Nam, đánh dấu mốc khởi đầu cuộc kháng chiến chống thực dân của dân tộc.",
          imageId: "french",
        },
        {
          id: "history-war",
          title: "Thế kỷ XX: Kháng chiến chống Mỹ và Giải phóng",
          text: "Đà Nẵng trở thành căn cứ quân sự chiến lược lớn thứ hai của Mỹ tại miền Nam. Ngày 29/3/1975, thành phố được hoàn toàn giải phóng, kết thúc 117 năm đô hộ và chiến tranh.",
          imageId: "war",
        },
        {
          id: "history-modern",
          title: "1997 - 2025: Thành phố trực thuộc Trung ương",
          text: "Ngày 1/1/1997, Đà Nẵng chính thức được tách khỏi tỉnh Quảng Nam - Đà Nẵng, trở thành một trong năm thành phố trực thuộc Trung ương. Đây là bước ngoặt lịch sử, đánh dấu sự chuyển mình mạnh mẽ về mọi mặt.",
          imageId: "modern",
        },
        {
          id: "history-reunification",
          title: "Năm 2025: Tái hợp lịch sử - Vươn ra biển lớn",
          text: "Ngày 1/7/2025, sau 28 năm chia tách, Đà Nẵng và tỉnh Quảng Nam chính thức sáp nhập trở lại thành một đơn vị hành chính mang tên thành phố Đà Nẵng trực thuộc Trung ương. Sự kiện lịch sử này mở ra chương mới, kiến tạo động lực phát triển vượt bậc cho cả vùng Quảng Đà.",
          imageId: "reunification",
        },
      ],
    },
    en: {
      destinations: [
        {
          id: "cau-vang",
          title: "Golden Bridge",
          category: "architecture",
          image: "/danasoul/images/Diem den/ENG/golden_bridge.png", // <-- ĐÃ CẬP NHẬT
          shortDesc: "A masterpiece of architecture amidst the clouds of Ba Na.",
          fullDesc:
            "Located at an altitude of over 1,400 meters, the Golden Bridge is an impressive architectural highlight at Sun World Ba Na Hills. The bridge is nearly 150 meters long, winding gracefully like a golden silk ribbon supported by two giant, mossy hands. The structure creates a walkway in mid-air, amidst the misty scenery of clouds and mountains, offering a surreal experience for visitors.",
          history:
            "Inaugurated in June 2018, the Golden Bridge quickly gained global recognition. TIME magazine honored it in the top 100 greatest places in the world, significantly contributing to elevating Da Nang's tourism to a new level.",
          tips: "You should go early in the morning (before 9 AM) or late in the afternoon (after 4 PM) to avoid crowds and have a chance to take photos with the clouds. Bring an extra jacket as the weather on Ba Na is quite cold, even in summer.",
        },
        {
          id: "cau-rong",
          title: "Dragon Bridge",
          category: "architecture",
          image: "/danasoul/images/Diem den/ENG/dragon_bridge.png", // <-- ĐÃ CẬP NHẬT
          shortDesc: "A symbol of Da Nang with a fire and water breathing show.",
          fullDesc:
            "With a length of 666 meters and 6 lanes, the Dragon Bridge is not only a key traffic artery across the Han River but also a symbol of Da Nang's aspiration for growth. The bridge is designed in the shape of a Ly Dynasty dragon, powerfully winding its way to the sea, representing strength and development.",
          history:
            "Construction of the bridge began on July 19, 2009, and it was officially inaugurated on March 29, 2013, on the 38th anniversary of the liberation of Da Nang. The project has received numerous prestigious international architectural awards.",
          tips: "The fire (9 times) and water (3 times) breathing show takes place at 9:00 PM every Friday, Saturday, and Sunday. The best viewing spots are on Tran Hung Dao Street, nearby rooftop cafes, or right on a Han River cruise.",
        },
        {
          id: "ba-na-hills",
          title: "Ba Na Hills",
          category: "nature",
          image: "/danasoul/images/Diem den/ENG/ba_na_hills.png", // <-- ĐÃ CẬP NHẬT
          shortDesc: "A 'miniature Europe' on the peak of Chua Mountain.",
          fullDesc:
            "Located on the peak of Chua Mountain at an altitude of 1,487m, Ba Na Hills is a leading resort complex in Vietnam. It boasts a year-round cool climate, likened to a 'Da Lat of the Central Region'. Visitors can experience four seasons in one day and admire unique architectural works such as the French Village, Debay Wine Cellar, Le Jardin D'Amour Flower Garden, and the Golden Bridge.",
          history:
            "Ba Na was discovered by the French in 1901 and developed into a resort for French officials in the early 20th century. After a period of neglect, Sun Group invested and rebuilt Ba Na Hills into a world-class tourist destination starting in 2007.",
          tips: "You should buy tickets online to avoid queuing. Try the No. 2 funicular to move between areas. Don't forget to bring a map of the resort to not miss any attractions and art shows.",
        },
        {
          id: "my-khe",
          title: "My Khe Beach",
          category: "nature",
          image: "/danasoul/images/Diem den/ENG/my_khe_beach.png", // <-- ĐÃ CẬP NHẬT
          shortDesc: "One of the most charming beaches on the planet.",
          fullDesc:
            "With a long coastline, fine white sand, and warm, clear blue water, My Khe is an ideal destination for beach relaxation and sports. The beach is fringed with poetic coconut trees and has gentle waves, making it very safe for both children and adults.",
          history:
            "During the Vietnam War, My Khe was a familiar spot for American soldiers. Later, with its outstanding tourism potential, the beach was developed and gained global fame when it was honored by Forbes Magazine in 2005.",
          tips: "The ideal time for swimming is early morning or late afternoon. There are many fresh seafood restaurants along the coast with reasonable prices. You can also try water sports like surfing and parasailing.",
        },
        {
          id: "ngu-hanh-son",
          title: "Marble Mountains",
          category: "nature",
          image: "/danasoul/images/Diem den/ENG/marble_mountains.png", // <-- ĐÃ CẬP NHẬT
          shortDesc: "A cluster of 5 limestone mountains with a mysterious spiritual beauty.",
          fullDesc:
            "The Marble Mountains are a masterpiece of nature with 5 mountains (Metal, Wood, Water, Fire, Earth) symbolizing the five elements of the universe. It is a harmonious combination of natural landscapes and spiritual cultural works, with a system of caves and ancient pagodas. Thuy Son (Water Mountain) is the largest and most beautiful mountain, often chosen by tourists for exploration.",
          history:
            "According to Champa legend, the 5 mountains were created from the 5 fragments of a dragon's egg. This place was once an important spiritual site for the Cham people and later for the Vietnamese, and also served as a revolutionary base during the resistance wars.",
          tips: "Wear comfortable sports shoes for easy climbing. There is an elevator with a ticket price of 15,000 VND/way for those who do not want to climb Thuy Son. Don't forget to visit the Non Nuoc Stone Carving Village at the foot of the mountain.",
        },
        {
          id: "sun-wheel",
          title: "Sun Wheel",
          category: "architecture",
          image: "/danasoul/images/Diem den/ENG/sun_wheel.png", // <-- ĐÃ CẬP NHẬT
          shortDesc: "Experience a panoramic view of Da Nang from a height of 115m.",
          fullDesc:
            "Located at Asia Park, the Sun Wheel is one of the ten tallest Ferris wheels in the world. With 64 cabins, each carrying 6 people, a single rotation takes 15 minutes, enough time for you to admire the panoramic view of a sparkling Da Nang at night, from the glittering bridges to the vibrant city.",
          history:
            "Inaugurated in 2014, the Sun Wheel quickly became a modern entertainment symbol of the city, an important highlight of the Asia Park project, a cultural park that combines many characteristic features of Asian countries.",
          tips: "The best time to experience the Sun Wheel is in the evening when the city is lit up. The entrance ticket to Asia Park includes the Sun Wheel and many other games. Combine it with a visit to the cultural areas in the park.",
        },
        {
          id: "ban-dao-son-tra",
          title: "Son Tra Peninsula",
          category: "nature",
          image: "/danasoul/images/Diem den/ENG/son_tra_peninsula.png", // <-- ĐÃ CẬP NHẬT
          shortDesc: "The 'green lung' of the city and home to the Red-shanked Douc.",
          fullDesc:
            "The Son Tra Peninsula is a biodiverse nature reserve, home to a primary forest with a rich ecosystem of flora and fauna, especially the rare Red-shanked Douc langur. The winding roads around the peninsula will lead you to beautiful landscapes, from majestic high mountains to the vast blue sea.",
          history:
            "Historically, Son Tra held a strategic military position, once known as the 'Indochina's Eye'. Today, it is preserved and developed for sustainable ecotourism, becoming an unmissable destination in Da Nang.",
          tips: "You can rent a motorbike to fully explore the beauty of the peninsula. Recommended spots to visit include Linh Ung Pagoda, Ban Co Peak, and the Thousand-Year-Old Banyan Tree. Drive carefully as the roads are quite steep and have sharp turns.",
        },
        {
          id: "chua-linh-ung",
          title: "Linh Ung Pagoda",
          category: "culture",
          image: "/danasoul/images/Diem den/ENG/linh_ung_pagoda.png", // <-- ĐÃ CẬP NHẬT
          shortDesc:
            "The pagoda on Son Tra Peninsula with the tallest Lady Buddha statue in Vietnam.",
          fullDesc:
            "Linh Ung Pagoda Bai But - Son Tra is the largest and newest of the three 'Linh Ung Tu' pagodas in Da Nang. The pagoda is situated on a hill, leaning against the mountain and facing the sea, creating a majestic and serene setting. The main highlight is the 67m high statue of the Bodhisattva of Mercy, standing on a 35m diameter lotus.",
          history:
            "The pagoda's construction began in 2004 and was inaugurated in 2010. Legend has it that during the reign of King Minh Mang, a Buddha statue washed ashore here. The locals built a shrine to worship it, and from then on, the sea has been calm. This is also the reason the pagoda was built at this location.",
          tips: "Wear respectful, modest clothing when visiting the pagoda. Keep quiet and do not make noise. From the temple courtyard, you can enjoy a panoramic view of the city and My Khe beach.",
        },
        {
          id: "hoi-an",
          title: "Hoi An Ancient Town",
          category: "culture",
          image: "/danasoul/images/Diem den/ENG/hoi_an_ancient_town.png", // <-- ĐÃ CẬP NHẬT
          shortDesc: "A World Cultural Heritage site with timeless beauty.",
          fullDesc:
            "Hoi An is a vivid picture of a bustling international trading port from the 16th-17th centuries. This ancient town charms visitors with its yellow-walled houses, mossy yin-yang tiled roofs, small alleys, and brilliant lanterns at night. The nostalgic, peaceful atmosphere here brings a strange sense of relaxation.",
          history:
            "Recognized as a World Cultural Heritage site by UNESCO in 1999, Hoi An is an exceptionally well-preserved example of a Southeast Asian trading port. Its architecture and street plan reflect the fusion of indigenous and foreign cultures.",
          tips: "Try taking a boat trip on the Hoai River and releasing a paper lantern for good luck. Don't miss out on specialty dishes like Cao Lau, Mi Quang, and Com Ga. The entrance ticket is valid for the duration of your stay.",
        },
        {
          id: "nui-than-tai",
          title: "Than Tai Mountain Park",
          category: "nature",
          image: "/danasoul/images/Diem den/ENG/nui_than_tai_hot_spring_park.png", // <-- ĐÃ CẬP NHẬT
          shortDesc: "An eco-tourism resort combined with hot spring bathing.",
          fullDesc:
            "Nestled within the Ba Na Nui Chua nature reserve, Than Tai Hot Springs Park is an ideal destination for relaxation and health recovery. It offers a variety of services such as hot mineral baths, mud baths, Japanese-style Onsen, a spa, and a large water park.",
          history:
            "Developed on a natural hot mineral spring discovered deep within the mountains, this tourist area was built with the goal of becoming a high-class health and entertainment destination, harmoniously combined with nature.",
          tips: "You should bring swimwear, a towel, and personal items. Service packages often include many activities, so check carefully to choose a suitable one. Experiencing boiling eggs in the hot mineral stream is a fun activity.",
        },
        {
          id: "my-son",
          title: "My Son Sanctuary",
          category: "culture",
          image: "/danasoul/images/Diem den/thanh_dia_my_son.png",
          shortDesc: "A world cultural heritage site nestled in a valley.",
          fullDesc:
            "It is a complex of many Champa temples and towers, in a valley surrounded by hills and mountains. This was once the religious and political center of the Champa Kingdom. The ancient, moss-covered towers possess a mysterious beauty and great historical value.",
          history:
            "Built from the 4th century, My Son was the Hindu sanctuary of the Champa Kingdom. It was recognized by UNESCO as a World Heritage site in 1999. The unique architecture with its technique of building with baked bricks without mortar has become a fascinating mystery.",
          tips: "It is best to visit in the morning for cooler weather and beautiful light. Don't miss the Apsara dance performances at the tourist area. Electric cars are available to take visitors from the gate to the main relic site.",
        },
        {
          id: "cu-lao-cham",
          title: "Cham Islands",
          category: "nature",
          image: "/danasoul/images/Diem den/cu_lao_cham.jpg",
          shortDesc: "A world biosphere reserve with blue sea and coral reefs.",
          fullDesc:
            "Cham Islands is an archipelago of 8 pristine islands recognized by UNESCO as a World Biosphere Reserve. It boasts an incredibly rich marine ecosystem, making it a paradise for those who love snorkeling, swimming, and exploring the life of peaceful fishing villages.",
          history:
            "As an ancient trading port and a settlement of the Cham people, Cham Islands has a long history of maritime trade. Relics like the ancient Hai Tang Pagoda (built in 1758) reveal a rich spiritual life and the island's important role for centuries.",
          tips: "The ideal time to visit is from March to August. You should book a day tour by speedboat from Da Nang or Hoi An for a complete experience. Don't forget to try the specialty stone crab.",
        },
        {
          id: "lang-bich-hoa-tam-thanh",
          title: "Tam Thanh Mural Village",
          category: "culture",
          image: "/danasoul/images/Diem den/lang_bich_hoa_tam_thanh.webp", // Update your image path
          shortDesc: "A fishing village dressed in a colorful coat of art.",
          fullDesc:
            "Tam Thanh Mural Village is a community art exchange project between South Korea and Vietnam, turning the old walls of a coastal fishing village into a vibrant outdoor art museum. Each painting tells a story of the life, people, and culture of the coastal region, bringing new vitality to the village and creating a unique destination.",
          history:
            "The project was initiated in 2016 and quickly became a phenomenon, attracting numerous tourists. It not only improved the landscape but also contributed to local economic development, serving as a successful model for community-based tourism.",
          tips: "The ideal time for visiting and taking photos is early morning or late afternoon. Stroll leisurely through the alleys to not miss any hidden paintings. Remember to maintain cleanliness and respect the living space of the local residents.",
        },
        {
          id: "bien-an-bang",
          title: "An Bang Beach",
          category: "nature",
          image: "/danasoul/images/Diem den/bien_an_bang.webp",
          shortDesc: "Top beach in Asia with white sand and a peaceful atmosphere.",
          fullDesc:
            "An Bang Beach captivates visitors with its pristine, tranquil beauty, featuring a long stretch of fine white sand and clear blue water. It's an ideal destination for relaxation, sunbathing, and enjoying the fresh air, away from the city's hustle and bustle.",
          history:
            "Unlike other bustling beaches, An Bang has retained its natural charm. It gained international recognition and was honored by prestigious travel sites like Tripadvisor, becoming a 'hidden gem' of Hoi An.",
          tips: "There are many rustic-style bars and restaurants along the beach. The best time to visit is at sunrise or sunset. You can rent a lounger and relax all day.",
        },
        {
          id: "rung-dua-bay-mau",
          title: "Bay Mau Coconut Forest",
          category: "nature",
          image: "/danasoul/images/Diem den/rung_dua_bay_mau.jpg", // Update your image path
          shortDesc: "Experience a “miniature Mekong Delta” in the heart of Hoi An.",
          fullDesc:
            "Bay Mau Coconut Forest is a large ecological area with vast green coconut palm groves. Visitors can enjoy a basket boat ride through small canals, watch a basket boat dance performance, and participate in folk games like crab fishing. It is an ideal destination to immerse yourself in nature and learn about the river life of the local people.",
          history:
            "This area was once an important revolutionary base during the resistance wars. Today, Bay Mau Coconut Forest has become a famous ecotourism spot, helping to diversify the travel experience when visiting the Quang Nam - Da Nang region.",
          tips: "It's recommended to book a tour for the best experience and pricing. Bring hats and sunscreen. You can enjoy rustic dishes made from coconut right on site.",
        },
      ],
      culture: {
        // Replace the old culture object with this one
        title: "The Cultural Identity of Central Vietnam",
        intro:
          "Da Nang is not only a city of bridges but also a unique cultural space, where tradition and modernity harmonize. Touch the compass to explore.",
        categories: {
          people: {
            id: "people",
            label: "The People",
            icon: "users",
            title: "The People of Da Nang",
            desc: "The people of Da Nang are known for being gentle, honest, friendly, and loyal. In communication and behavior, they always exude sincerity and hospitality. This makes visitors not only 'see the sights' but also 'meet the people'. The spirit of disciplined living, environmental awareness, and good community conduct are admirable modern cultural values.",
            image: "/danasoul/images/Van hoa/con_nguoi_da_nang.jpeg",
          },
          festivals: {
            id: "festivals",
            label: "Festivals",
            icon: "calendar-heart",
            items: [
              {
                id: "diff",
                title: "Int'l Fireworks Festival (DIFF)",
                desc: "An annual event in June-July where countries perform spectacular artistic fireworks displays over the Han River, a feast of sound and light.",
                image: "/danasoul/images/Van hoa/DIFF.jpg",
              },
              {
                id: "quan-the-am",
                title: "Avalokiteshvara Festival",
                desc: "Held on the 19th day of the 2nd lunar month at Marble Mountains, it's one of the largest Buddhist festivals, praying for peace and offering a moment of tranquility.",
                image: "/danasoul/images/Van hoa/Lễ hội Quán Thế Âm.png",
              },
              {
                id: "cau-ngu",
                title: "Cau Ngu Festival (Whale Worship)",
                desc: "Organized in the 2nd-4th lunar months in coastal fishing villages. The festival is rich in folk beliefs, praying for a bountiful fishing season and safety for fishermen.",
                image: "/danasoul/images/Van hoa/Lễ Cầu Ngư.png",
              },
              {
                id: "bai-choi",
                title: "Bai Choi Singing",
                desc: "A UNESCO Intangible Cultural Heritage, this is a unique art form of call-and-response singing and a folk game, often held during Tet holidays by the Han River.",
                image: "/danasoul/images/Van hoa/bài chòi.png",
              },
            ],
          },
          heritage: {
            id: "heritage",
            label: "Heritage",
            icon: "gem",
            items: [
              {
                id: "cham-museum",
                title: "Cham Sculpture Museum",
                desc: "The world's only museum dedicated to Cham art, housing over 2,000 priceless artifacts. It's a treasure trove for exploring a brilliant civilization that once flourished in Central Vietnam.",
                image: "/danasoul/images/Van hoa/bảo tàng chăm.png",
              },
              {
                id: "non-nuoc",
                title: "Non Nuoc Stone Village",
                desc: "With over 400 years of history, this craft village at the foot of the Marble Mountains crystallizes folk carving techniques and diligent labor, creating exquisite stone art products.",
                image: "/danasoul/images/Van hoa/làng đá mỹ nghệ non nước.png",
              },
            ],
          },
          crafts: {
            id: "crafts",
            label: "Craft Villages",
            icon: "palette",
            items: [
              {
                id: "thanh-ha",
                title: "Thanh Ha Pottery Village",
                desc: "Located by the Thu Bon River, this 500-year-old pottery village is famous for its unglazed terracotta products, entirely handmade and fired in traditional wood kilns, creating unique colors and sounds.",
                image: "/danasoul/images/Van hoa/lang_gom_thanh_ha.jpg",
              },
              {
                id: "kim-bong",
                title: "Kim Bong Carpentry Village",
                desc: "As the cradle of Quang Nam carpentry, Kim Bong's artisans contributed to the ancient architecture of Hoi An. The village's products are renowned for their sophisticated carving techniques on items from furniture to boats.",
                image: "/danasoul/images/Van hoa/lang_moc_kim_bong.jpg",
              },
              {
                id: "cam-ne",
                title: "Cam Ne Mat Weaving Village",
                desc: "Once a product presented to the Nguyen emperors, Cam Ne mats are famous for their durable, small sedge fibers and intricate patterns. The rhythmic sound of the looms has become a characteristic feature of this Da Nang village.",
                image: "/danasoul/images/Van hoa/lang_chieu_cam_ne.jpg",
              },
            ],
          },
        },
      },
      cuisine: [
        {
          id: "my-quang",
          title: "Mi Quang",
          image: "/danasoul/images/Am thuc/my_quang.png",
          desc: "Mi Quang is the signature dish of Da Nang - Quang Nam, featuring broad rice noodles, a rich but sparse broth, served with pork, shrimp, egg, fresh herbs, and a crispy sesame rice cracker.",
          flavor:
            "Bold, slightly rich, mildly spicy, with a harmonious balance of ingredients, filling without being heavy.",
          locations: [
            "Ba Mua - 19 Tran Binh Trong",
            "Mi Quang 1A - 1A Hai Phong",
            "Mi Quang Thi – 251 Hoang Dieu",
            "Ba Vi – 166 Le Dinh Duong",
            "Dung - 121 Dong Da",
          ],
        },
        {
          id: "banh-trang-thit-heo",
          title: "Pork Rolls with Rice Paper",
          image: "/danasoul/images/Am thuc/banh_trang_cuon_thit_heo.png",
          desc: "Thinly sliced boiled pork, wrapped with rice paper, fresh herbs, and dipped in a pungent fermented fish sauce (mam nem).",
          flavor: "Fresh, light, with the distinctive taste of mam nem and a variety of herbs.",
          locations: [
            "Tran Restaurant - 4 Le Duan",
            "Mau Restaurant – 35 Do Thuc Tinh",
            "Ba Huong - 364 Hoang Dieu",
            "Dai Loc – 277 Dong Da",
            "Que Xua - 176 Nguyen Hoang",
          ],
        },
        {
          id: "bun-mam-nem",
          title: "Vermicelli with Fermented Fish Sauce",
          image: "/danasoul/images/Am thuc/bun_mam_nem.png",
          desc: "Rice vermicelli, boiled pork, fermented pork roll, fresh herbs, and mam nem mixed with garlic and chili - a famous street food in Da Nang.",
          flavor:
            "Salty, sweet, sour, spicy, pungent - mam nem is the soul of the dish, very characteristic.",
          locations: [
            "Ba Dong - K23/14 Tran Ke Xuong",
            "Van - 23/14 Tran Ke Xuong",
            "Ngoc - 20 Doan Thi Diem",
            "Di Lien - 52 Tran Binh Trong",
            "Ba Thuyen - 424 Trung Nu Vuong",
          ],
        },
        {
          id: "banh-xeo-nem-lui",
          title: "Banh Xeo - Nem Lui",
          image: "/danasoul/images/Am thuc/banh_xeo_nem_lui.png",
          desc: "Crispy yellow pancake filled with shrimp, pork, and bean sprouts, served with fresh herbs, rice paper, and grilled pork skewers dipped in a special sauce.",
          flavor:
            "Crispy, savory, aromatic with turmeric, balanced by fresh herbs and the rich dipping sauce.",
          locations: [
            "Ba Duong - K280/23 Hoang Dieu",
            "Tom Nhay - 140 Nguyen Duc Trung",
            "Co Ba - 248 Trung Nu Vuong",
            "Xuan - 469 Hai Phong",
            "Mien Trung - 7 Hai Phong",
          ],
        },
        {
          id: "che-thai-lien",
          title: "Lien's Thai Sweet Soup",
          image: "/danasoul/images/Am thuc/che_thai_lien.png",
          desc: "A refreshing dessert with durian, jellies, tropical fruits, basil seeds, and coconut milk - a famous cooling treat.",
          flavor: "Sweet, creamy, fragrant with durian, with chewy and cool toppings.",
          locations: [
            "Lien – 189 Hoang Dieu",
            "Lien - 175 Hai Phong",
            "Lien - 320 Dien Bien Phu",
            "My Thai – 28 Pasteur",
            "Tam Thai - 147 Le Duan",
          ],
        },
        {
          id: "cao-lau",
          title: "Cao Lau",
          image: "/danasoul/images/Am thuc/cao_lau.png",
          desc: "A specialty noodle from Quang Nam with thick yellow noodles, char siu pork, Tra Que herbs, and crispy pork cracklings, served with a small amount of broth.",
          flavor:
            "Mildly salty, with the aroma of wood ash, and a unique chewy texture unlike other noodles.",
          locations: [
            "Hoai Pho - 255 Nguyen Chi Thanh",
            "Thanh - 39 Pham Hồng Thái",
            "Be Hoi An – 44 Le Loi",
            "Hoi An Noodles – 128 Nguyen Tri Phuong",
            "Bac My An Market (inside food court)",
          ],
        },
        {
          id: "goi-ca-nam-o",
          title: "Nam O Fish Salad",
          image: "/danasoul/images/Am thuc/goi_ca_nam_o.png",
          desc: "Raw fish salad made from herring or sardine, mixed with roasted rice powder and herbs, served with rice paper and ginger fish sauce.",
          flavor: "Fresh, nutty, and spicy - very flavorful when eaten with fresh herbs.",
          locations: [
            "Sau Hao - 130 Nguyen Tat Thanh",
            "Thanh Huong - 102 Le Do",
            "Nam O – 972 Nguyen Luong Bang",
            "Be Anh Seafood – 2 Pham Van Dong",
            "Ba Ly - 41 Ngo Thi Nham",
          ],
        },
        {
          id: "bun-cha-ca",
          title: "Fish Cake Noodle Soup",
          image: "/danasoul/images/Am thuc/bun_cha_ca.png",
          desc: "Rice vermicelli with fried and steamed fish cakes, in a broth made from fish bones, pineapple, and tomato.",
          flavor:
            "Lightly sweet and savory, fragrant, mildly spicy, with chewy fish cakes - a popular breakfast dish.",
          locations: [
            "Ba Lu - 319 Hung Vuong",
            "Ong Ta - 113A Nguyen Chi Thanh",
            "Hon - 113/3 Nguyen Chi Thanh",
            "Ba Phien – 63 Le Hong Phong",
            "109 Nguyen Chi Thanh",
          ],
        },
        {
          id: "hai-san",
          title: "Da Nang Seafood",
          image: "/danasoul/images/Am thuc/hai_san_da_nang.png",
          desc: "Fresh and cooked on the spot: lobster, crab, squid, oysters, clams, scallops - prepared steamed, grilled, tamarind-roasted, or garlic-fried.",
          flavor:
            "Fresh, sweet, and rich - moderately seasoned to preserve the original taste of the seafood.",
          locations: [
            "Be Man - Lot 14 Vo Nguyen Giap",
            "Nam Danh – K139/H59/38 Tran Quang Khai",
            "Ba Thoi – 96 Lê Đình Dương",
            "Be Anh – 2 Pham Van Dong",
            "Bien Rang - 51 Vo Nguyen Giap",
          ],
        },
        {
          id: "kem-bo",
          title: "Avocado Ice Cream",
          image: "/danasoul/images/Am thuc/kem_bo.png",
          desc: "A smooth avocado smoothie served with coconut ice cream and peanuts - an 'addictive' cool dessert in Da Nang.",
          flavor:
            "Creamy, rich, cool, with the characteristic aroma of ripe avocado and creamy ice cream.",
          locations: [
            "Co Van – Bac My An Market",
            "Pham Tu – 195 Pham Tu",
            "Thanh – 47 Le Duan",
            "Bao – 41 Le Huu Trac",
            "17 Nguyen Van Linh",
          ],
        },
      ],
      history: [
        {
          id: "history-champa",
          title: "IV-XV Century: Champa Kingdom",
          text: "Da Nang was originally the northern territory of Champa, known since the 16th century by a Cham name meaning 'great river' or 'great river mouth'. It was a center of Hindu worship, evidenced by artifacts in the Cham Sculpture Museum.",
          imageId: "champa",
        },
        {
          id: "history-port",
          title: "XVI-XIX Century: International Port",
          text: "Becoming a major trading hub, Da Nang was the 'fore-port' of Hoi An, gradually replacing it due to its ability to accommodate large ships easily.",
          imageId: "port",
        },
        {
          id: "history-french",
          title: "1858: French-Spanish Coalition Attacks",
          text: "In 1858, Da Nang was where the French-Spanish coalition opened fire to begin the invasion of Vietnam, marking the start of the anti-colonial resistance.",
          imageId: "french",
        },
        {
          id: "history-war",
          title: "XX Century: Resistance and Liberation",
          text: "Da Nang became the second-largest strategic military base for the U.S. in South Vietnam. On March 29, 1975, the city was completely liberated, ending 117 years of occupation and war.",
          imageId: "war",
        },
        {
          id: "history-modern",
          title: "1997 - 2025: Centrally-Governed City",
          text: "On January 1, 1997, Da Nang was officially separated from Quang Nam - Da Nang province to become one of Vietnam's five centrally-governed cities. This was a historic turning point, marking a strong transformation in all aspects.",
          imageId: "modern",
        },
        {
          id: "history-reunification",
          title: "2025: Historic Reunification - Reaching for the Great Sea",
          text: "On July 1, 2025, after 28 years of separation, Da Nang and Quang Nam province officially merged back into a single centrally-governed administrative unit named Da Nang City. This historic event opens a new chapter, creating outstanding development momentum for the entire Quang Da region.",
          imageId: "reunification",
        },
      ],
    },
  };

  const historyImages = {
    champa:
      "/danasoul/images/Lich su/than-ho-phap-bao-tang-dieu-khac-cham-danang-fantasticity-com-04.jpg",
    port: "/danasoul/images/Lich su/images1682966__Thuongcang2.jpg",
    french: "/danasoul/images/Lich su/tran-da-nang-1858-4.jpg",
    war: "/danasoul/images/Lich su/c01_BALM.jpg",
    modern: "/danasoul/images/Lich su/da_nang_hien_dai.jpg",
    reunification: "/danasoul/images/Lich su/sap_nhap_da_nang.png", // Ảnh riêng cho sự kiện tái hợp 2025
  };
  let currentLanguage = "vi";

  // --- HERO SLIDESHOW ---
  const initHeroSlideshow = () => {
    // 🎬 HERO VIDEO SETUP 🎬
    const heroVideo = document.getElementById("hero-video");

    // Handle video loading errors - fallback to image slideshow
    if (heroVideo) {
      heroVideo.addEventListener("error", () => {
        heroVideo.style.display = "none";

        // Create fallback slideshow
        const heroImages = [
          "/danasoul/images/Trang chu/2.png",
          "/danasoul/images/Trang chu/3.png",
          "/danasoul/images/Trang chu/4.png",
          "/danasoul/images/Trang chu/5.png",
          "/danasoul/images/Trang chu/binh_minh__1.jpg",
        ];

        const slideshowContainer = document.createElement("div");
        slideshowContainer.className = "absolute inset-0 w-full h-full";
        heroVideo.parentNode.insertBefore(slideshowContainer, heroVideo.nextSibling);

        heroImages.forEach((src, index) => {
          const img = document.createElement("img");
          img.src = src;
          img.alt = `Cảnh đẹp Đà Nẵng ${index + 1}`;
          img.className = "absolute inset-0 w-full h-full object-cover";
          img.style.opacity = index === 0 ? 1 : 0;
          slideshowContainer.appendChild(img);
        });

        let currentSlide = 0;
        const slides = slideshowContainer.children;
        setInterval(() => {
          const nextSlide = (currentSlide + 1) % slides.length;
          gsap.to(slides[currentSlide], {
            duration: 2,
            opacity: 0,
            ease: "power2.inOut",
          });
          gsap.to(slides[nextSlide], {
            duration: 2,
            opacity: 1,
            ease: "power2.inOut",
          });
          currentSlide = nextSlide;
        }, 5000);
      });
    }
  };
  initHeroSlideshow();

  // 🎬 HERO PARTICLES
  const heroParticlesContainer = document.getElementById("hero-particles");
  if (heroParticlesContainer) {
    for (let i = 0; i < 30; i++) {
      const particle = document.createElement("div");
      particle.className = "hero-particle";
      particle.style.left = Math.random() * 100 + "%";
      particle.style.animationDuration = Math.random() * 6 + 4 + "s";
      particle.style.animationDelay = Math.random() * 5 + "s";
      particle.style.width = Math.random() * 2 + 1 + "px";
      particle.style.height = particle.style.width;
      heroParticlesContainer.appendChild(particle);
    }
  }

  // --- BỘ CHUYỂN NGÔN NGỮ ---
  let switchLanguage = (lang, force = false) => {
    if (lang === currentLanguage && !force) return;
    currentLanguage = lang;
    document.documentElement.lang = lang;
    document.querySelectorAll("[data-lang-key]").forEach((el) => {
      const key = el.dataset.langKey;
      const keys = key.split(".");
      let text = languageContent[lang];
      keys.forEach((k) => {
        text = text ? text[k] : `[${key}]`;
      });
      // Preserve accent line inside section titles
      const hasAccent = el.querySelector(".section-title-accent");
      el.innerHTML = text;
      if (hasAccent) {
        el.appendChild(document.createElement("span")).className = "section-title-accent";
      }
    });
    document.querySelectorAll(".lang-switcher button").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.lang === lang);
    });
    renderFilterButtons();
    renderDestinations(document.querySelector(".filter-btn.active")?.dataset.filter || "all");
    renderCulture();
    renderCuisine();
    renderHistory();
    renderPlannerOptions();

    // Update typewriter tagline on language change
    const tText = document.getElementById("tagline-text");
    if (tText) {
      typewriterEffect(taglines[lang] || taglines.vi, tText);
    }

    // Sau khi chuyển ngữ, refresh ScrollTrigger để cập nhật lại vị trí
    // và đảm bảo các hiệu ứng reveal hoạt động đúng
    ScrollTrigger.refresh();
  };

  document.querySelectorAll(".lang-switcher button").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (window.Tone && Tone.context.state !== "running") Tone.start();
      clickSound.triggerAttackRelease("C5", "8n");
      switchLanguage(btn.dataset.lang);
    });
  });

  // --- CẢI TIẾN UI/UX ---
  const cursorDot = document.querySelector(".cursor-dot");
  const cursorOutline = document.querySelector(".cursor-outline");
  window.addEventListener("mousemove", (e) => {
    const { clientX, clientY } = e;
    cursorDot.style.left = `${clientX}px`;
    cursorDot.style.top = `${clientY}px`;
    cursorOutline.animate(
      {
        left: `${clientX}px`,
        top: `${clientY}px`,
      },
      {
        duration: 500,
        fill: "forwards",
      },
    );
  });
  const hoverSound = new Tone.PolySynth(Tone.Synth, {
    oscillator: {
      type: "sine",
    },
    envelope: {
      attack: 0.005,
      decay: 0.1,
      sustain: 0.3,
      release: 0.2,
    },
    volume: -20,
  }).toDestination();
  const clickSound = new Tone.PolySynth(Tone.MembraneSynth, {
    pitchDecay: 0.01,
    octaves: 10,
    oscillator: {
      type: "sine",
    },
    envelope: {
      attack: 0.001,
      decay: 0.4,
      sustain: 0.01,
      release: 0.4,
      attackCurve: "exponential",
    },
    volume: -10,
  }).toDestination();
  document
    .querySelectorAll(
      "a, button, .magnetic-btn, .destination-card, .culture-card, .cuisine-card, .gallery-item",
    )
    .forEach((el) => {
      el.addEventListener("mouseenter", () => {
        if (window.Tone && Tone.context.state !== "running") Tone.start();
        hoverSound.triggerAttackRelease("C6", "16n");
        cursorOutline.classList.add("hover");
      });
      el.addEventListener("mouseleave", () => cursorOutline.classList.remove("hover"));
      el.addEventListener("click", () => {
        if (window.Tone && Tone.context.state !== "running") Tone.start();
        clickSound.triggerAttackRelease("C4", "8n");
      });
    });

  // --- SCROLL & ANIMATION ---
  document.getElementById("scroll-down-indicator").addEventListener("click", () => {
    document.getElementById("about").scrollIntoView({
      behavior: "smooth",
    });
  });
  window.addEventListener("scroll", () => {
    document.getElementById("main-header").classList.toggle("header-scrolled", window.scrollY > 50);
  });

  // --- MENU DI ĐỘNG ---
  const mobileMenu = document.getElementById("mobile-menu");
  document
    .getElementById("mobile-menu-button")
    .addEventListener("click", () => mobileMenu.classList.toggle("hidden"));
  document.querySelectorAll(".nav-link-mobile").forEach((link) => {
    link.addEventListener("click", () => mobileMenu.classList.add("hidden"));
  });

  // --- HIỂN THỊ & LỌC ĐIỂM ĐẾN ---
  const destinationsGrid = document.getElementById("destinations-grid");
  const filterButtonsContainer = document.getElementById("filter-buttons");

  const renderFilterButtons = () => {
    const filters = languageContent[currentLanguage].destinations.filter;
    filterButtonsContainer.innerHTML = Object.entries(filters)
      .map(
        ([key, value]) => `
                <button class="filter-btn ${
                  key === "all" ? "active" : ""
                }" data-filter="${key}">${value}</button>
            `,
      )
      .join("");

    document.querySelectorAll(".filter-btn").forEach((button) => {
      button.addEventListener("click", () => {
        document.querySelectorAll(".filter-btn").forEach((btn) => btn.classList.remove("active"));
        button.classList.add("active");
        renderDestinations(button.dataset.filter);
      });
    });
  };

  const renderDestinations = (filter = "all") => {
    gsap.killTweensOf(".destination-card");

    destinationsGrid.innerHTML = "";
    const currentDestinations = data[currentLanguage].destinations;
    currentDestinations
      .filter((d) => filter === "all" || d.category === filter)
      .forEach((dest) => {
        const card = document.createElement("div");
        card.className =
          "destination-card bg-[var(--bg-medium)] rounded-lg shadow-lg hover:shadow-green-900/20 transition-all duration-300 transform hover:-translate-y-2 cursor-pointer";
        card.dataset.id = dest.id;
        const categoryLabel =
          languageContent[currentLanguage].destinations.filter[dest.category] || dest.category;
        card.innerHTML = `
                <div class="destination-card-img-wrapper relative rounded-lg overflow-hidden h-80">
                  <img src="${dest.image}"
                       onerror="this.onerror=null;this.src='https://placehold.co/600x400/1A2B22/EAE7D5?text=DanaSoul';"
                       alt="${dest.title}"
                       class="w-full h-full object-cover"
                       loading="lazy">

                  <!-- Overlay gradient -->
                  <div class="dest-card-overlay"></div>

                  <!-- Category badge -->
                  <span class="dest-card-category">${categoryLabel}</span>

                  <!-- Action icon -->
                  <div class="dest-card-action">
                    <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                  </div>

                  <!-- Title and Description positioned at bottom -->
                  <div class="absolute bottom-0 left-0 right-0 p-6 text-white">
                    <h3 class="text-2xl font-bold mb-2 drop-shadow-lg">${dest.title}</h3>
                    <p class="text-gray-200 text-sm drop-shadow-md leading-relaxed">${dest.shortDesc}</p>
                  </div>
                </div>
              `;
        card.addEventListener("click", () => openModal(dest.id));
        destinationsGrid.appendChild(card);
      });

    // Cải thiện hiệu ứng entrance để tránh xung đột
    gsap.set(".destination-card", {
      opacity: 1,
    }); // Đảm bảo opacity luôn là 1
    gsap.from(".destination-card", {
      duration: 0.8,
      opacity: 0,
      y: 50,
      stagger: 0.1,
      ease: "power3.out",
      clearProps: "opacity,transform", // Xóa các thuộc tính sau khi animation hoàn thành
    });
  };

  // --- LOGIC MODAL ---
  const modal = document.getElementById("destination-modal");
  const openModal = (id) => {
    const dest = data[currentLanguage].destinations.find((d) => d.id === id);
    if (!dest) return;
    const modalContent = document.getElementById("modal-content");
    modalContent.innerHTML = `
            <div class="w-full md:w-1/2 flex-shrink-0 relative overflow-hidden md:rounded-l-lg rounded-t-lg md:rounded-t-none modern-gallery-container" style="background-image: url('${
              dest.image
            }'); background-size: cover; background-position: left bottom; min-height: 400px;">

              <!-- Modern Glass Morphism Overlay -->
              <div class="absolute inset-0 backdrop-blur-md bg-gradient-to-br from-white/10 via-black/20 to-black/40 glass-overlay"></div>

              <!-- Subtle Grid Pattern -->
              <div class="absolute inset-0 opacity-5" style="background-image: radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0); background-size: 20px 20px;"></div>

              <!-- Premium Image Container -->
              <div class="absolute inset-0 flex items-center justify-center p-6">
                <div class="relative group">
                  <img src="${
                    dest.image
                  }" onerror="this.onerror=null;this.src='https://placehold.co/600x600/1A2B22/EAE7D5?text=DanaSoul';" alt="${
                    dest.title
                  }" class="max-w-full max-h-full object-contain transition-all duration-700 ease-out group-hover:scale-105 premium-image" loading="lazy">

                  <!-- Minimal Glow Effect -->
                  <div class="absolute inset-0 rounded-lg bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 minimal-glow"></div>

                  <!-- Sophisticated Border -->
                  <div class="absolute -inset-1 rounded-lg bg-gradient-to-br from-white/20 via-transparent to-white/10 opacity-60 sophisticated-border"></div>
                </div>
              </div>

              <!-- Ambient Light Beams -->
              <div class="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-white/20 to-transparent ambient-beam"></div>
              <div class="absolute top-0 right-1/3 w-px h-full bg-gradient-to-b from-transparent via-white/15 to-transparent ambient-beam-2"></div>
            </div>
            <div class="w-full md:w-1/2 p-6 flex flex-col overflow-y-auto">
                 <button id="modal-close-inner" class="absolute top-3 right-4 text-gray-400 hover:text-white z-10 text-3xl">&times;</button>
                <h2 class="text-3xl font-bold mb-4">${dest.title}</h2>
                <div id="modal-tabs" class="flex border-b border-[var(--brand-secondary)] mb-4">
                    <button class="modal-tab active" data-tab="overview">${
                      languageContent[currentLanguage].modal.tabs.overview
                    }</button>
                    <button class="modal-tab" data-tab="history">${
                      languageContent[currentLanguage].modal.tabs.history
                    }</button>
                    <button class="modal-tab" data-tab="tips">${
                      languageContent[currentLanguage].modal.tabs.tips
                    }</button>
                </div>
                <div id="modal-tab-content" class="flex-grow">
                    <div class="tab-pane active" data-pane="overview"><p class="text-[var(--text-dark)] leading-relaxed">${
                      dest.fullDesc
                    }</p></div>
                    <div class="tab-pane hidden" data-pane="history"><p class="text-[var(--text-dark)] leading-relaxed">${
                      dest.history || languageContent[currentLanguage].modal.no_history
                    }</p></div>
                    <div class="tab-pane hidden" data-pane="tips"><p class="text-[var(--text-dark)] leading-relaxed">${
                      dest.tips || languageContent[currentLanguage].modal.no_tips
                    }</p></div>
                </div>
            </div>`;
    modal.classList.remove("hidden");
    setTimeout(() => modalContent.classList.remove("scale-95", "opacity-0"), 10);
    document.getElementById("modal-close-inner").addEventListener("click", closeModal);
    document.getElementById("modal-close-outer").addEventListener("click", closeModal);
    document.querySelectorAll(".modal-tab").forEach((tab) =>
      tab.addEventListener("click", (e) => {
        const targetTab = e.target.dataset.tab;
        document.querySelectorAll(".modal-tab").forEach((t) => t.classList.remove("active"));
        e.target.classList.add("active");
        document.querySelectorAll(".tab-pane").forEach((p) => p.classList.add("hidden"));
        document.querySelector(`.tab-pane[data-pane="${targetTab}"]`).classList.remove("hidden");
      }),
    );
  };
  const closeModal = () => {
    document.getElementById("modal-content").classList.add("scale-95", "opacity-0");
    setTimeout(() => modal.classList.add("hidden"), 300);
  };

  // ====================================================================================
  // BẮT ĐẦU: JS LA BÀN VĂN HÓA - PHIÊN BẢN BẤM ĐỂ HIỆN, BẤM NGOÀI ĐỂ ẨN
  // ====================================================================================
  let isCultureContentVisible = false; // Biến để theo dõi trạng thái hiển thị

  const renderCulture = () => {
    const compassPointsContainer = document.getElementById("compass-points");
    if (!compassPointsContainer) return;

    // Tạm dừng animation để tránh lỗi góc xoay khi chuyển ngữ
    const oldAnimation = compassPointsContainer.style.animation;
    compassPointsContainer.style.animation = "none";
    void compassPointsContainer.offsetHeight;

    // Bắt đầu vẽ lại la bàn
    const cultureData = data[currentLanguage].culture;
    const categories = cultureData.categories;
    const positions = [
      {
        top: "12%",
        left: "50%",
      },
      {
        top: "50%",
        left: "88%",
      },
      {
        top: "88%",
        left: "50%",
      },
      {
        top: "50%",
        left: "12%",
      },
    ];
    const categoryKeys = ["people", "festivals", "heritage", "crafts"];

    compassPointsContainer.innerHTML = "";

    categoryKeys.forEach((key, index) => {
      const category = categories[key];
      const pos = positions[index];
      const point = document.createElement("div");
      point.className = "compass-point";
      point.style.top = pos.top;
      point.style.left = pos.left;
      point.dataset.category = key;
      point.innerHTML = `
      <div class="icon-wrapper">
        <i data-lucide="${category.icon}" class="w-10 h-10"></i>
      </div>
      <div class="point-label">${category.label}</div>
    `;

      // SỰ KIỆN KHI BẤM VÀO ĐIỂM "CON NGƯỜI"
      if (key === "people") {
        point.addEventListener("click", () => showCultureContent(key));
      }

      const subItemsContainer = document.createElement("div");
      subItemsContainer.className = "sub-item-container";
      point.appendChild(subItemsContainer);

      // SỰ KIỆN KHI HOVER VÀO CÁC ĐIỂM CÓ MỤC CON
      point.addEventListener("mouseenter", () => {
        if (key === "people") return;
        const currentSubItems = subItemsContainer.querySelectorAll(".sub-item");
        currentSubItems.forEach((si, i) => {
          si.style.transform = "translate(-50%, -50%) scale(1)";
          si.style.opacity = "1";
        });
      });
      point.addEventListener("mouseleave", () => {
        if (key === "people") return;
        const currentSubItems = subItemsContainer.querySelectorAll(".sub-item");
        currentSubItems.forEach((si) => {
          si.style.transform = "translate(-50%, -50%) scale(0)";
          si.style.opacity = "0";
        });
      });

      if (key !== "people") {
        // --- BẮT ĐẦU THAY ĐỔI ---
        // Dàn đều các góc ra một cung rộng hơn (180 độ cho Lễ hội và Làng nghề)
        const subItemAngles = {
          festivals: [-90, -30, 30, 90],
          heritage: [-60, 60],
          crafts: [-90, 0, 90],
        };

        category.items.forEach((item, itemIndex) => {
          const angle = subItemAngles[key][itemIndex];
          // TĂNG MẠNH KHOẢNG CÁCH để không chồng chéo
          const distance = 200;
          const subItem = document.createElement("div");
          subItem.className = "sub-item";
          subItem.style.opacity = "0"; // Ban đầu ẩn đi
          subItem.style.transform = "translate(-50%, -50%) scale(0)";

          subItem.innerHTML = `
          <div class="sub-item-icon" style="background-image: url('${item.image}')"></div>
          <div class="sub-item-tooltip">${item.title}</div>
        `;

          const angleRad = (angle * Math.PI) / 180;
          const containerRect = compassPointsContainer.getBoundingClientRect();
          let x, y;

          if (key === "festivals") {
            x =
              parseFloat(pos.left) +
              (distance / containerRect.width) * 100 * Math.cos(angleRad + Math.PI);
            y =
              parseFloat(pos.top) +
              (distance / containerRect.height) * 100 * Math.sin(angleRad + Math.PI);
          } else if (key === "crafts") {
            x = parseFloat(pos.left) + (distance / containerRect.width) * 100 * Math.cos(angleRad);
            y = parseFloat(pos.top) + (distance / containerRect.height) * 100 * Math.sin(angleRad);
          } else {
            x =
              parseFloat(pos.left) +
              (distance / containerRect.width) * 100 * Math.cos(angleRad - Math.PI / 2);
            y =
              parseFloat(pos.top) +
              (distance / containerRect.height) * 100 * Math.sin(angleRad - Math.PI / 2);
          }

          subItem.style.left = `${x}%`;
          subItem.style.top = `${y}%`;

          // SỰ KIỆN KHI BẤM VÀO MỤC CON
          subItem.addEventListener("click", (e) => {
            e.stopPropagation(); // Ngăn sự kiện click lan ra ngoài
            showCultureContent(key, item.id);
          });

          subItemsContainer.appendChild(subItem);
        });
      }

      compassPointsContainer.appendChild(point);
    });

    lucide.createIcons();
    gsap.from(".compass-point", {
      duration: 1.5,
      scale: 0,
      opacity: 0,
      stagger: 0.2,
      ease: "elastic.out(1, 0.5)",
    });
    // Khôi phục lại animation
    setTimeout(() => {
      compassPointsContainer.style.animation = oldAnimation;
    }, 0);
  };

  const showCultureContent = (categoryKey, itemId = null) => {
    const cultureData = data[currentLanguage].culture.categories;
    const contentDisplay = document.getElementById("culture-content-display");
    const compass = document.getElementById("culture-compass");
    let itemData;
    let categoryLabel;

    if (itemId) {
      itemData = cultureData[categoryKey].items.find((i) => i.id === itemId);
      categoryLabel = cultureData[categoryKey].label;
    } else {
      itemData = cultureData[categoryKey];
      categoryLabel = "";
    }

    if (!itemData) return;

    contentDisplay.innerHTML = `
    <div class="culture-content-card">
      <div class="image-container">
        <img src="${
          itemData.image
        }" onerror="this.onerror=null;this.src='https://placehold.co/600x800/1A2B22/EAE7D5?text=DanaSoul';" alt="${
          itemData.title
        }" loading="lazy">
      </div>
      <div class="text-container">
        ${categoryLabel ? `<div class="content-category">${categoryLabel}</div>` : ""}
        <h3 class="content-title">${itemData.title}</h3>
        <p class="content-desc">${itemData.desc}</p>
      </div>
    </div>
  `;

    isCultureContentVisible = true; // Đánh dấu là nội dung đang hiển thị

    gsap
      .timeline()
      .to(compass, {
        opacity: 0,
        scale: 0.9,
        duration: 0.5,
        ease: "power2.inOut",
      })
      .set(compass, {
        pointerEvents: "none",
      })
      .set(
        contentDisplay,
        {
          pointerEvents: "auto",
        },
        "<",
      )
      .to(
        contentDisplay,
        {
          opacity: 1,
          scale: 1,
          duration: 0.5,
          ease: "power2.inOut",
        },
        "-=0.3",
      );
  };

  const hideCultureContent = () => {
    if (!isCultureContentVisible) return; // Không làm gì nếu nội dung đang ẩn

    const contentDisplay = document.getElementById("culture-content-display");
    const compass = document.getElementById("culture-compass");

    isCultureContentVisible = false; // Đánh dấu là nội dung đã ẩn

    gsap
      .timeline()
      .to(contentDisplay, {
        opacity: 0,
        scale: 0.95,
        duration: 0.5,
        ease: "power2.inOut",
      })
      .set(contentDisplay, {
        pointerEvents: "none",
      })
      .set(
        compass,
        {
          pointerEvents: "auto",
        },
        "<",
      )
      .to(
        compass,
        {
          opacity: 1,
          scale: 1,
          duration: 0.5,
          ease: "power2.inOut",
        },
        "-=0.3",
      );
  };

  // Lắng nghe sự kiện click trên toàn bộ trang
  document.addEventListener("click", function (event) {
    if (!isCultureContentVisible) return;

    const contentCard = document.querySelector(".culture-content-card");
    const compassPoints = document.getElementById("compass-points");

    // Kiểm tra xem có phải bấm vào chính la bàn hay thẻ nội dung không
    const isClickInsideCard = contentCard && contentCard.contains(event.target);
    const isClickOnCompass = compassPoints && compassPoints.contains(event.target);

    // Nếu bấm ra ngoài cả 2, thì ẩn đi
    if (!isClickInsideCard && !isClickOnCompass) {
      hideCultureContent();
    }
  });
  // ====================================================================================
  // KẾT THÚC: JS LA BÀN VĂN HÓA - PHIÊN BẢN MỚI
  // ====================================================================================
  // --- SCROLLYTELLING ---
  let historyScrollTriggers = []; // Lưu riêng ScrollTrigger của lịch sử
  const renderHistory = () => {
    // Chỉ kill ScrollTrigger của phần lịch sử, không kill toàn bộ
    historyScrollTriggers.forEach((t) => t.kill());
    historyScrollTriggers = [];

    const scrollyVis = document.getElementById("scrolly-vis-content");
    const scrollyArticle = document.getElementById("scrolly-article");
    scrollyVis.innerHTML = "";
    scrollyArticle.innerHTML = "";

    data[currentLanguage].history.forEach((stepData) => {
      const img = document.createElement("img");
      img.src = historyImages[stepData.imageId];
      img.id = stepData.id;
      img.className = "scrolly-img";
      img.onerror =
        "this.onerror=null;this.src='https://placehold.co/500x700/121E17/EAE7D5?text=Lịch+Sử';";
      scrollyVis.appendChild(img);

      const stepEl = document.createElement("div");
      stepEl.className = "step";
      stepEl.dataset.img = stepData.id;
      stepEl.innerHTML = `<p><strong>${stepData.title}</strong><br>${stepData.text}</p>`;
      scrollyArticle.appendChild(stepEl);
    });

    gsap.registerPlugin(ScrollTrigger);

    gsap.utils.toArray(".step").forEach((step) => {
      const st = ScrollTrigger.create({
        trigger: step,
        start: "top center",
        end: "bottom center",
        onEnter: () => {
          document
            .querySelectorAll(".scrolly-img")
            .forEach((img) => img.classList.remove("active"));
          document.getElementById(step.dataset.img).classList.add("active");
        },
        onEnterBack: () => {
          document
            .querySelectorAll(".scrolly-img")
            .forEach((img) => img.classList.remove("active"));
          document.getElementById(step.dataset.img).classList.add("active");
        },
      });
      historyScrollTriggers.push(st);
    });

    if (document.querySelector(".scrolly-img")) {
      document.querySelector(".scrolly-img").classList.add("active");
    }
  }; // --- HIỂN THỊ ẨM THỰC ---
  const cuisineMenu = document.getElementById("cuisine-menu");
  const cuisineDetailsContainer = document.getElementById("cuisine-details-container");

  const renderCuisine = () => {
    cuisineMenu.innerHTML = "";
    cuisineMenu.className = "cuisine-scroll-menu";
    const cuisineData = data[currentLanguage].cuisine;

    cuisineData.forEach((item, index) => {
      const menuCard = document.createElement("div");
      menuCard.className = `cuisine-menu-card ${index === 0 ? "active" : ""}`;
      menuCard.dataset.index = index;
      menuCard.innerHTML = `
              <img src="${item.image}" alt="${item.title}" loading="lazy"
                   onerror="this.onerror=null;this.src='https://placehold.co/130x130/1A2B22/EAE7D5?text=🍜';">
              <div class="cuisine-menu-card-label">${item.title}</div>
            `;
      cuisineMenu.appendChild(menuCard);
    });

    displayCuisineDetails(0);

    cuisineMenu.addEventListener("click", (e) => {
      const card = e.target.closest(".cuisine-menu-card");
      if (card) {
        const index = card.dataset.index;
        document
          .querySelectorAll(".cuisine-menu-card")
          .forEach((c) => c.classList.remove("active"));
        card.classList.add("active");
        displayCuisineDetails(index);
      }
    });
  };

  const displayCuisineDetails = (index) => {
    const item = data[currentLanguage].cuisine[index];
    const lang = languageContent[currentLanguage];

    cuisineDetailsContainer.innerHTML = `
              <div class="relative w-full h-80 md:h-96 rounded-lg overflow-hidden mb-6">
                  <img src="${item.image}" onerror="this.onerror=null;this.src='https://placehold.co/800x600/1A2B22/EAE7D5?text=Món+Ăn';" alt="${item.title}" class="w-full h-full object-cover" loading="lazy">
                  <div class="cuisine-steam">
                    <div class="steam-particle"></div>
                    <div class="steam-particle"></div>
                    <div class="steam-particle"></div>
                    <div class="steam-particle"></div>
                    <div class="steam-particle"></div>
                    <div class="steam-particle"></div>
                    <div class="steam-particle"></div>
                  </div>
              </div>
              <div>
                  <h4 class="text-2xl font-bold text-white mb-2">${item.title}</h4>
                  <p class="text-[var(--text-dark)] mb-4">${item.desc}</p>
                  <div class="border-t border-[var(--brand-secondary)] pt-4">
                      <h5 class="font-semibold text-white mb-3 flex items-center gap-2">
                        <i data-lucide="flame" class="w-4 h-4 text-[var(--brand-primary)]"></i>
                        ${lang.cuisine.flavorTitle}:
                      </h5>
                      <p class="text-[var(--text-dark)] italic mb-4 pl-6 border-l-2 border-[var(--brand-primary)]">${item.flavor}</p>
                      <h5 class="font-semibold text-white mb-3 flex items-center gap-2">
                        <i data-lucide="map-pin" class="w-4 h-4 text-[var(--brand-primary)]"></i>
                        ${lang.cuisine.locationTitle}:
                      </h5>
                      <div class="space-y-0">
                          ${item.locations
                            .map(
                              (loc) => `
                            <div class="cuisine-location-item">
                              <div class="cuisine-location-pin"></div>
                              <span class="text-[var(--text-dark)] text-sm">${loc}</span>
                            </div>`,
                            )
                            .join("")}
                      </div>
                  </div>
              </div>
            `;
    // Tạo icons Lucide cho các icon mới
    if (typeof lucide !== "undefined") lucide.createIcons();
    // Animation hiển thị nội dung mới khi click vào món ăn
    gsap.fromTo(
      cuisineDetailsContainer,
      { opacity: 0, y: 30, scale: 0.98 },
      { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: "power3.out" },
    );
  };

  // --- KẾ HOẠCH CHUYẾN ĐI (PHIÊN BẢN SỬA LỖI HOÀN CHỈNH) ---

  const plannerResult = document.getElementById("planner-result");
  const daysOptionsContainer = document.getElementById("planner-days-options");
  const styleOptionsContainer = document.getElementById("planner-style-options");

  /**
   * Hàm khởi tạo và hiển thị các nút lựa chọn cho việc lập kế hoạch.
   */
  const renderPlannerOptions = () => {
    const days = [2, 3, 4, 5];
    const uiText = languageContent[currentLanguage].planner;

    // Day selector - pill tabs with sliding indicator
    daysOptionsContainer.innerHTML = `
            <div class="planner-day-tabs w-full max-w-md">
              <div class="planner-day-indicator" id="day-indicator"></div>
              ${days
                .map(
                  (day, i) => `
                <div class="planner-day-tab ${day === 2 ? "active" : ""}" data-day="${day}" data-index="${i}">
                  ${day} ${uiText.day_unit || "ngày"}
                </div>
              `,
                )
                .join("")}
            </div>
          `;

    // Style selector - illustrated cards with icons
    const styleIcons = {
      discovery: "compass",
      relax: "palmtree",
      culture: "landmark",
    };
    const styleDescs = {
      vi: {
        discovery: "Phiêu lưu, check-in, trải nghiệm",
        relax: "Biển, spa, thư giãn",
        culture: "Di sản, lịch sử, nghệ thuật",
      },
      en: {
        discovery: "Adventure, check-in, experience",
        relax: "Beach, spa, relaxation",
        culture: "Heritage, history, art",
      },
    };

    const styles = uiText.styles;
    styleOptionsContainer.innerHTML = `
              ${Object.keys(styles)
                .map(
                  (key) => `
                <div class="planner-style-card" data-style="${key}">
                  <div class="style-icon">
                    <i data-lucide="${styleIcons[key]}" class="w-6 h-6"></i>
                  </div>
                  <div class="style-name">${styles[key]}</div>
                  <div class="style-desc">${styleDescs[currentLanguage]?.[key] || ""}</div>
                </div>
              `,
                )
                .join("")}
          `;

    if (typeof lucide !== "undefined") lucide.createIcons();
    attachPlannerEventListeners();
    // Update indicator after DOM renders
    requestAnimationFrame(() => updateDayIndicator());
    generateAndRenderItinerary();
  };

  /**
   * Cập nhật vị trí indicator cho day tabs
   */
  const updateDayIndicator = () => {
    const activeTab = daysOptionsContainer.querySelector(".planner-day-tab.active");
    const indicator = document.getElementById("day-indicator");
    if (activeTab && indicator) {
      const tabWidth = activeTab.offsetWidth;
      const tabLeft = activeTab.offsetLeft;
      indicator.style.width = `${tabWidth}px`;
      indicator.style.left = `${tabLeft}px`;
    }
  };

  /**
   * Hàm gắn các sự kiện click cho các nút lựa chọn.
   */
  const attachPlannerEventListeners = () => {
    // Sự kiện cho nút chọn ngày (pill tabs)
    daysOptionsContainer.querySelectorAll(".planner-day-tab").forEach((btn) => {
      btn.addEventListener("click", () => {
        daysOptionsContainer
          .querySelectorAll(".planner-day-tab")
          .forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        updateDayIndicator();
        generateAndRenderItinerary();
      });
    });

    // Sự kiện cho style cards
    styleOptionsContainer.querySelectorAll(".planner-style-card").forEach((btn) => {
      btn.addEventListener("click", () => {
        const isActive = btn.classList.contains("active");
        styleOptionsContainer
          .querySelectorAll(".planner-style-card")
          .forEach((b) => b.classList.remove("active"));
        if (!isActive) {
          btn.classList.add("active");
        }
        generateAndRenderItinerary();
      });
    });
  };

  /**
   * Hàm điều phối: Lấy lựa chọn của người dùng, gọi hàm tạo lịch trình và hiển thị kết quả.
   */
  const generateAndRenderItinerary = () => {
    const selectedDaysEl = document.querySelector(".planner-day-tab.active");
    if (!selectedDaysEl) return;

    const selectedDays = parseInt(selectedDaysEl.dataset.day);
    const selectedStyles = Array.from(document.querySelectorAll(".planner-style-card.active")).map(
      (btn) => btn.dataset.style,
    );

    // Nếu không có phong cách nào được chọn, hiển thị thông báo
    if (selectedStyles.length === 0) {
      plannerResult.innerHTML = `<p class="text-center text-[var(--text-dark)]">${languageContent[currentLanguage].planner.noResult}</p>`;
      return;
    }

    const itinerary = generateDetailedItineraryV4(selectedDays, selectedStyles);
    renderItinerary(itinerary);
  };

  /**
   * Hàm hiển thị lịch trình dạng Timeline
   * @param {Array<Array<Object>>} plan - Mảng các ngày, mỗi ngày là một mảng các hoạt động.
   */
  const renderItinerary = (plan) => {
    if (!plan || plan.length === 0) {
      plannerResult.innerHTML = `<p class="text-center text-[var(--text-dark)]">${languageContent[currentLanguage].planner.noResult}</p>`;
      return;
    }
    const uiText = languageContent[currentLanguage].planner;

    // Hàm chọn icon theo thời gian
    const getTimeIcon = (timeStr) => {
      if (!timeStr) return "clock";
      const t = timeStr.toLowerCase();
      if (t.includes("sáng") || t.includes("morning")) return "sunrise";
      if (t.includes("trưa") || t.includes("lunch") || t.includes("noon")) return "utensils";
      if (t.includes("chiều") || t.includes("afternoon")) return "sunset";
      if (t.includes("tối") || t.includes("evening") || t.includes("night")) return "moon";
      return "clock";
    };

    plannerResult.innerHTML = `
    <h3 class="text-2xl font-bold text-white mb-8 text-center">${uiText.resultTitle}</h3>
    <div class="planner-timeline">
      ${plan
        .map(
          (dayPlan, index) => `
        <div class="planner-timeline-day">
          <div class="planner-timeline-day-header">
            ${uiText.day} ${index + 1}
          </div>
          ${dayPlan
            .map((activity) => {
              const time = currentLanguage === "vi" ? activity.time_vi : activity.time_en;
              const title = currentLanguage === "vi" ? activity.activity_vi : activity.activity_en;
              const desc =
                currentLanguage === "vi" ? activity.description_vi : activity.description_en;
              const tip = currentLanguage === "vi" ? activity.tip_vi : activity.tip_en;
              const timeIcon = getTimeIcon(time);

              return `
              <div class="planner-timeline-item">
                <div class="planner-timeline-time">
                  <i data-lucide="${timeIcon}"></i>
                  ${time}
                </div>
                <div class="planner-timeline-activity">${title}</div>
                ${desc ? `<p class="planner-timeline-desc">${desc}</p>` : ""}
                ${
                  tip
                    ? `
                  <div class="planner-timeline-tip">
                    <i data-lucide="lightbulb"></i>
                    <span>${tip}</span>
                  </div>
                `
                    : ""
                }
              </div>`;
            })
            .join("")}
        </div>`,
        )
        .join("")}
    </div>`;

    if (typeof lucide !== "undefined") lucide.createIcons();

    // Stagger reveal animation for timeline items
    const items = plannerResult.querySelectorAll(".planner-timeline-item");
    items.forEach((item, i) => {
      setTimeout(
        () => {
          item.classList.add("revealed");
        },
        100 + i * 80,
      );
    });

    gsap.fromTo(
      plannerResult,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" },
    );
  };

  // CƠ SỞ DỮ LIỆU HOẠT ĐỘNG CHI TIẾT CHO TỪNG NGÀY - PHIÊN BẢN HOÀN CHỈNH
  const DETAILED_DAILY_ACTIVITIES = {
    // ===== NGÀY 1: HỘI AN & GIỚI THIỆU =====
    day1: {
      morning: {
        time_vi: "Sáng (9:00 - 11:00)",
        activity_vi: "Tham quan Bảo tàng Điêu khắc Chăm",
        description_vi:
          "Khám phá kho báu nghệ thuật của Vương quốc Champa xưa, hiểu thêm về lịch sử văn hóa miền Trung.",
        tip_vi: "Nên thuê hướng dẫn viên để hiểu sâu hơn về lịch sử.",
        time_en: "Morning (9:00 AM - 11:00 AM)",
        activity_en: "Visit Cham Sculpture Museum",
        description_en:
          "Discover artistic treasures of ancient Champa Kingdom, learn about Central Vietnam's cultural history.",
        tip_en: "Consider hiring a guide for deeper historical understanding.",
      },
      lunch: {
        time_vi: "Trưa (12:00 - 13:30)",
        activity_vi: "Thưởng thức Mì Quảng đặc sản",
        description_vi:
          "Khám phá món ăn biểu tượng của Đà Nẵng với nước dùng đậm đà và topping phong phú.",
        tip_vi: "Mì Quảng Bà Mua (19 Trần Bình Trọng) là lựa chọn tuyệt vời.",
        time_en: "Lunch (12:00 PM - 1:30 PM)",
        activity_en: "Enjoy Mi Quang specialty",
        description_en:
          "Discover Da Nang's iconic noodle dish with rich broth and diverse toppings.",
        tip_en: "Mi Quang Ba Mua (19 Tran Binh Trong) is excellent choice.",
      },
      afternoon_evening: {
        time_vi: "Chiều - Tối (15:00 - 21:00)",
        activity_vi: "Dạo chơi Phố cổ Hội An",
        description_vi:
          "Khám phá Chùa Cầu, các hội quán cổ. Ăn tối và đi thuyền thả hoa đăng trên sông Hoài.",
        tip_vi: "Đặc sản phải thử: Cao Lầu, Cơm gà. Đặt tour thuyền trước để có giá tốt.",
        time_en: "Afternoon - Evening (3:00 PM - 9:00 PM)",
        activity_en: "Explore Hoi An Ancient Town",
        description_en:
          "Visit Japanese Bridge, ancient assembly halls. Dinner and lantern boat trip on Hoai River.",
        tip_en: "Must-try: Cao Lau, Chicken Rice. Book boat tour in advance for better price.",
      },
    },

    // ===== NGÀY 2: THIÊN NHIÊN & TÂM LINH =====
    day2: {
      morning: {
        time_vi: "Sáng (8:00 - 11:30)",
        activity_vi: "Tham quan Ngũ Hành Sơn & Làng đá Non Nước",
        description_vi:
          "Khám phá các hang động huyền bí, chùa cổ trên Thủy Sơn và nghề điêu khắc đá truyền thống.",
        tip_vi: "Mang giày thể thao thoải mái. Có thang máy để tiết kiệm sức.",
        time_en: "Morning (8:00 AM - 11:30 AM)",
        activity_en: "Visit Marble Mountains & Non Nuoc Stone Village",
        description_en:
          "Explore mysterious caves, ancient pagodas on Water Mountain and traditional stone carving craft.",
        tip_en: "Wear comfortable sneakers. Elevator available to save energy.",
      },
      lunch: {
        time_vi: "Trưa (12:00 - 13:00)",
        activity_vi: "Ăn trưa tại quán ven biển",
        description_vi: "Thưởng thức hải sản tươi sống với view biển Mỹ Khê tuyệt đẹp.",
        tip_vi: "Quán Bà Thoa (gần bãi biển Mỹ Khê) có hải sản tươi và giá hợp lý.",
        time_en: "Lunch (12:00 PM - 1:00 PM)",
        activity_en: "Beachside lunch",
        description_en: "Enjoy fresh seafood with beautiful My Khe beach view.",
        tip_en: "Ba Thoa Restaurant (near My Khe beach) offers fresh seafood at reasonable prices.",
      },
      afternoon: {
        time_vi: "Chiều (14:00 - 17:00)",
        activity_vi: "Khám phá Bán đảo Sơn Trà",
        description_vi:
          "Lên chùa Linh Ứng, ghé Đỉnh Bàn Cờ, ngắm Cây Đa Ngàn Năm và toàn cảnh thành phố.",
        tip_vi: "Nên đi xe số hoặc xe tay ga mạnh. Lái xe cẩn thận vì đường dốc.",
        time_en: "Afternoon (2:00 PM - 5:00 PM)",
        activity_en: "Explore Son Tra Peninsula",
        description_en:
          "Visit Linh Ung Pagoda, Ban Co Peak, Thousand-Year Banyan Tree and city panorama.",
        tip_en: "Motorbike recommended. Drive carefully on steep roads.",
      },
      evening: {
        time_vi: "Tối (19:00 - 21:00)",
        activity_vi: "Du thuyền sông Hàn & ngắm Cầu Rồng phun lửa",
        description_vi:
          "Ngắm các cây cầu biểu tượng về đêm và xem trình diễn phun lửa/nước Cầu Rồng (cuối tuần).",
        tip_vi:
          "Đặt vé trước, đặc biệt vào cuối tuần. Cầu Rồng phun lửa 21h thứ 7, phun nước 21h Chủ nhật.",
        time_en: "Evening (7:00 PM - 9:00 PM)",
        activity_en: "Han River cruise & Dragon Bridge fire show",
        description_en:
          "View iconic bridges at night and watch Dragon Bridge fire/water show (weekends).",
        tip_en:
          "Book in advance, especially weekends. Dragon Bridge fires at 9PM Saturday, water at 9PM Sunday.",
      },
    },

    // ===== NGÀY 3: VĂN HÓA & NGHỈ DƯỠNG =====
    day3: {
      morning: {
        time_vi: "Sáng (8:30 - 11:30)",
        activity_vi: "Tham quan Di sản Thế giới Mỹ Sơn",
        description_vi:
          "Khám phá quần thể tháp Chăm cổ kính, di sản văn hóa thế giới UNESCO với lịch sử hơn 1000 năm.",
        tip_vi:
          "Khởi hành sớm để tránh nắng gắt. Thuê hướng dẫn viên địa phương để hiểu rõ lịch sử.",
        time_en: "Morning (8:30 AM - 11:30 AM)",
        activity_en: "Visit My Son World Heritage Site",
        description_en:
          "Explore ancient Cham temple complex, UNESCO World Heritage site with over 1000 years history.",
        tip_en: "Start early to avoid heat. Hire local guide for better historical understanding.",
      },
      lunch: {
        time_vi: "Trưa (12:30 - 13:30)",
        activity_vi: "Thưởng thức Bún chả cá đặc sản",
        description_vi:
          "Món ăn truyền thống với cá thu tươi, bún tươi và nước mắm pha chua ngọt đặc trưng.",
        tip_vi: "Bún chả cá Hàng Dày (số 110 Hàng Dày) nổi tiếng với hương vị đậm đà.",
        time_en: "Lunch (12:30 PM - 1:30 PM)",
        activity_en: "Enjoy Fish Cake Noodle Soup specialty",
        description_en:
          "Traditional dish with fresh mackerel, fresh noodles and characteristic sweet-sour fish sauce.",
        tip_en: "Hang Day Fish Cake Noodles (110 Hang Day) famous for rich flavor.",
      },
      afternoon: {
        time_vi: "Chiều (15:00 - 17:00)",
        activity_vi: "Thư giãn tại bãi biển Mỹ Khê",
        description_vi:
          "Tắm biển, tham gia các hoạt động thể thao nước hoặc đơn giản là thư giãn trên bãi cát trắng.",
        tip_vi:
          "Chiều là thời điểm lý tưởng với ánh nắng dịu và gió mát. Có nhiều quán nước mát ven biển.",
        time_en: "Afternoon (3:00 PM - 5:00 PM)",
        activity_en: "Relax at My Khe Beach",
        description_en: "Swimming, water sports or simply relaxing on the white sandy beach.",
        tip_en:
          "Afternoon is ideal with gentle sunlight and cool breeze. Many refreshment stands available.",
      },
      evening: {
        time_vi: "Tối (18:30 - 21:00)",
        activity_vi: "Thưởng thức cà phê muối & khám phá chợ đêm",
        description_vi: "Trải nghiệm cà phê muối đặc sản Đà Nẵng và mua sắm tại chợ đêm Helio.",
        tip_vi: "43 Factory Coffee Roaster có cà phê muối ngon nhất. Chợ đêm Helio mở từ 17h-23h.",
        time_en: "Evening (6:30 PM - 9:00 PM)",
        activity_en: "Enjoy salt coffee & explore night market",
        description_en:
          "Experience Da Nang's specialty salt coffee and shopping at Helio night market.",
        tip_en:
          "43 Factory Coffee Roaster has the best salt coffee. Helio night market opens 5PM-11PM.",
      },
    },

    // ===== NGÀY 4: PHIÊU LƯU & ẨM THỰC =====
    day4: {
      morning: {
        time_vi: "Sáng (8:00 - 12:00)",
        activity_vi: "Khám phá Sun World Bà Nà Hills & Cầu Vàng",
        description_vi:
          "Tham quan Cầu Vàng nổi tiếng, Làng Pháp cổ kính và vườn hoa Le Jardin d'Amour.",
        tip_vi: "Mua vé online để tránh xếp hàng. Đi cáp treo sớm để chụp ảnh đẹp nhất.",
        time_en: "Morning (8:00 AM - 12:00 PM)",
        activity_en: "Explore Sun World Ba Na Hills & Golden Bridge",
        description_en:
          "Visit famous Golden Bridge, ancient French Village and Le Jardin d'Amour flower garden.",
        tip_en: "Buy online tickets to avoid queues. Take cable car early for best photos.",
      },
      lunch: {
        time_vi: "Trưa (12:00 - 13:30)",
        activity_vi: "Ăn trưa tại Bà Nà Hills",
        description_vi:
          "Thưởng thức buffet đa dạng tại nhà hàng Le Jardin hoặc các quán ăn trong khu resort.",
        tip_vi: "Buffet Le Jardin có view đẹp và đa dạng món ăn Á-Âu. Giá khoảng 400k/người.",
        time_en: "Lunch (12:00 PM - 1:30 PM)",
        activity_en: "Lunch at Ba Na Hills",
        description_en:
          "Enjoy diverse buffet at Le Jardin restaurant or eateries in the resort area.",
        tip_en:
          "Le Jardin buffet has great view and diverse Asian-European dishes. About 400k VND/person.",
      },
      afternoon: {
        time_vi: "Chiều (14:00 - 17:00)",
        activity_vi: "Vui chơi tại Fantasy Park & Alpaca Farm",
        description_vi:
          "Trải nghiệm các trò chơi cảm giác mạnh và gặp gỡ những chú alpaca đáng yêu.",
        tip_vi:
          "Fantasy Park miễn phí với vé Bà Nà. Alpaca Farm có phí riêng 50k, rất thích hợp chụp ảnh.",
        time_en: "Afternoon (2:00 PM - 5:00 PM)",
        activity_en: "Fun at Fantasy Park & Alpaca Farm",
        description_en: "Experience thrilling games and meet cute alpacas.",
        tip_en:
          "Fantasy Park free with Ba Na ticket. Alpaca Farm separate fee 50k VND, great for photos.",
      },
      evening: {
        time_vi: "Tối (19:00 - 21:30)",
        activity_vi: "Thưởng thức ẩm thực đường phố Đà Nẵng",
        description_vi:
          "Tour ẩm thực: Bánh xèo, Nem lụi, Bánh tráng cuốn thịt heo tại khu vực Cồn Thành.",
        tip_vi: "Khu Cồn Thành có nhiều quán ngon: Bánh xèo bà Dưỡng, Nem lụi Hương Việt.",
        time_en: "Evening (7:00 PM - 9:30 PM)",
        activity_en: "Da Nang street food tour",
        description_en: "Food tour: Banh Xeo, Nem Lui, Pork rolls at Con Thanh area.",
        tip_en: "Con Thanh area has many good spots: Ba Duong Banh Xeo, Huong Viet Nem Lui.",
      },
    },

    // ===== NGÀY 5: THIÊN NHIÊN & TÂM LINH =====
    day5: {
      morning: {
        time_vi: "Sáng (7:30 - 11:30)",
        activity_vi: "Thư giãn tại Núi Thần Tài Hot Springs",
        description_vi:
          "Tắm khoáng nóng, tắm bùn, trải nghiệm Onsen kiểu Nhật và vui chơi tại công viên nước.",
        tip_vi:
          "Đặt combo trước để tiết kiệm. Trải nghiệm luộc trứng trong suối khoáng rất thú vị.",
        time_en: "Morning (7:30 AM - 11:30 AM)",
        activity_en: "Relax at Than Tai Hot Springs",
        description_en:
          "Hot mineral baths, mud baths, Japanese-style Onsen and water park activities.",
        tip_en:
          "Book combo in advance to save money. Boiling eggs in hot springs is very interesting.",
      },
      lunch: {
        time_vi: "Trưa (12:00 - 13:00)",
        activity_vi: "Ăn trưa tại Núi Thần Tài",
        description_vi:
          "Thưởng thức các món ăn làm từ nguyên liệu địa phương tại nhà hàng trong khu du lịch.",
        tip_vi: "Món gà nướng lá chuối và cơm lam rất đặc sắc. Giá cả hợp lý.",
        time_en: "Lunch (12:00 PM - 1:00 PM)",
        activity_en: "Lunch at Than Tai",
        description_en: "Enjoy dishes made from local ingredients at the resort restaurant.",
        tip_en: "Banana leaf grilled chicken and bamboo rice are very special. Reasonable prices.",
      },
      afternoon: {
        time_vi: "Chiều (14:30 - 17:00)",
        activity_vi: "Khám phá làng rau Trà Quế",
        description_vi:
          "Tham quan làng trồng rau sạch, trải nghiệm làm nông và thưởng thức món ăn organic.",
        tip_vi: "Có thể thuê xe đạp để di chuyển trong làng. Trải nghiệm nấu ăn rất thú vị.",
        time_en: "Afternoon (2:30 PM - 5:00 PM)",
        activity_en: "Explore Tra Que Vegetable Village",
        description_en:
          "Visit organic vegetable village, farming experience and enjoy organic food.",
        tip_en:
          "Can rent bicycles to move around the village. Cooking experience is very interesting.",
      },
      evening: {
        time_vi: "Tối (18:30 - 21:00)",
        activity_vi: "Tận hưởng bữa tối farewell & Asian Park",
        description_vi:
          "Bữa tối đặc biệt tại nhà hàng cao cấp và trải nghiệm vòng quay Sun Wheel về đêm.",
        tip_vi: "Nhà hàng Madame Lân có view sông Hàn đẹp. Sun Wheel đẹp nhất vào buổi tối.",
        time_en: "Evening (6:30 PM - 9:00 PM)",
        activity_en: "Farewell dinner & Asian Park",
        description_en: "Special dinner at upscale restaurant and night experience at Sun Wheel.",
        tip_en:
          "Madame Lan restaurant has beautiful Han River view. Sun Wheel is most beautiful at night.",
      },
    },
  };

  /**
   * Thuật toán tạo lịch trình hoàn chỉnh - TỪNG NGÀY ĐẦY ĐỦ VÀ THEO PHONG CÁCH
   * @param {number} days - Số ngày đi (2-5)
   * @param {Array<string>} styles - Phong cách chuyến đi
   * @returns {Array<Array<Object>>} - Lịch trình đầy đủ từng ngày theo phong cách
   */
  const generateDetailedItineraryV4 = (days, styles) => {
    if (days < 2 || days > 5 || styles.length === 0) return [];

    const activities = DETAILED_DAILY_ACTIVITIES;
    const selectedStyle = styles[0]; // Lấy phong cách được chọn
    let plan = [];

    // ===== PHONG CÁCH KHÁM PHÁ (DISCOVERY) =====
    if (selectedStyle === "discovery") {
      for (let i = 1; i <= days; i++) {
        if (i === 1) {
          // Ngày 1: Bà Nà Hills (phiêu lưu)
          plan.push([
            activities.day4.morning, // Sun World Bà Nà Hills & Cầu Vàng
            activities.day4.lunch, // Ăn trưa tại Bà Nà Hills
            activities.day4.afternoon, // Fantasy Park & Alpaca Farm
            activities.day4.evening, // Ẩm thực đường phố
          ]);
        } else if (i === 2) {
          // Ngày 2: Khám phá thiên nhiên
          plan.push([
            activities.day2.morning, // Ngũ Hành Sơn
            activities.day2.lunch, // Ăn trưa ven biển
            activities.day2.afternoon, // Bán đảo Sơn Trà
            activities.day2.evening, // Du thuyền sông Hàn
          ]);
        } else if (i === 3) {
          // Ngày 3: Di sản và phiêu lưu
          plan.push([
            activities.day3.morning, // Mỹ Sơn World Heritage
            activities.day3.lunch, // Bún chả cá
            activities.day5.afternoon, // Làng rau Trà Quế (khám phá)
            activities.day3.evening, // Cà phê muối & chợ đêm
          ]);
        } else if (i === 4) {
          // Ngày 4: Thư giãn tại suối nóng
          plan.push([
            activities.day5.morning, // Núi Thần Tài Hot Springs
            activities.day5.lunch, // Ăn trưa tại Núi Thần Tài
            activities.day3.afternoon, // Biển Mỹ Khê
            activities.day1.afternoon_evening, // Hội An về tối
          ]);
        } else if (i === 5) {
          // Ngày 5: Kết thúc tại Hội An
          plan.push([
            activities.day1.morning, // Bảo tàng Chăm
            activities.day1.lunch, // Mì Quảng
            activities.day1.afternoon_evening, // Hội An đầy đủ
            activities.day5.evening, // Farewell dinner
          ]);
        }
      }
    }

    // ===== PHONG CÁCH NGHỈ DƯỠNG (RELAX) =====
    else if (selectedStyle === "relax") {
      for (let i = 1; i <= days; i++) {
        if (i === 1) {
          // Ngày 1: Thư giãn bằng suối nóng
          plan.push([
            activities.day5.morning, // Núi Thần Tài Hot Springs
            activities.day5.lunch, // Ăn trưa tại Núi Thần Tài
            activities.day3.afternoon, // Thư giãn biển Mỹ Khê
            activities.day3.evening, // Cà phê muối thư giãn
          ]);
        } else if (i === 2) {
          // Ngày 2: Hội An nhẹ nhàng
          plan.push([
            activities.day1.morning, // Bảo tàng Chăm (không vội)
            activities.day1.lunch, // Mì Quảng thưởng thức
            activities.day1.afternoon_evening, // Hội An thả hoa đăng
            {
              time_vi: "Tối (21:30 - 22:30)",
              activity_vi: "Massage thư giãn",
              description_vi: "Massage truyền thống hoặc foot massage để thư giãn sau ngày dài.",
              tip_vi: "Nhiều spa gần phố cổ Hội An, giá từ 200-500k tùy loại hình.",
              time_en: "Night (9:30 PM - 10:30 PM)",
              activity_en: "Relaxing massage",
              description_en: "Traditional massage or foot massage to relax after a long day.",
              tip_en:
                "Many spas near Hoi An ancient town, prices from 200-500k VND depending on type.",
            },
          ]);
        } else if (i === 3) {
          // Ngày 3: Du thuyền và thư giãn
          plan.push([
            {
              time_vi: "Sáng (9:00 - 11:00)",
              activity_vi: "Yoga/Meditation ven biển",
              description_vi: "Tham gia lớp yoga buổi sáng hoặc thiền định trên bãi biển Mỹ Khê.",
              tip_vi: "Một số resort có lớp yoga miễn phí, hoặc tự thực hành trên bãi biển.",
              time_en: "Morning (9:00 AM - 11:00 AM)",
              activity_en: "Beachside Yoga/Meditation",
              description_en: "Join morning yoga class or meditation on My Khe beach.",
              tip_en: "Some resorts offer free yoga classes, or practice yourself on the beach.",
            },
            activities.day2.lunch, // Ăn trưa ven biển view đẹp
            activities.day3.afternoon, // Biển Mỹ Khê thư giãn
            activities.day2.evening, // Du thuyền sông Hàn romantic
          ]);
        } else if (i === 4) {
          // Ngày 4: Làng rau organic và spa
          plan.push([
            activities.day5.afternoon, // Làng rau Trà Quế peaceful
            activities.day3.lunch, // Bún chả cá nhẹ nhàng
            {
              time_vi: "Chiều (15:00 - 18:00)",
              activity_vi: "Spa & wellness trọn gói",
              description_vi: "Trải nghiệm gói spa cao cấp với massage, sauna, và chăm sóc da.",
              tip_vi: "Fusion Maia Resort hoặc Anantara Hoi An có gói spa excellent.",
              time_en: "Afternoon (3:00 PM - 6:00 PM)",
              activity_en: "Full spa & wellness package",
              description_en: "Experience premium spa package with massage, sauna, and skincare.",
              tip_en: "Fusion Maia Resort or Anantara Hoi An have excellent spa packages.",
            },
            activities.day5.evening, // Farewell dinner thư thái
          ]);
        } else if (i === 5) {
          // Ngày 5: Kết thúc nhẹ nhàng
          plan.push([
            {
              time_vi: "Sáng (8:00 - 10:00)",
              activity_vi: "Thư giãn cuối cùng tại resort/hotel",
              description_vi: "Tận hưởng bữa sáng chậm rãi và các tiện ích cuối cùng của nơi nghỉ.",
              tip_vi: "Check-out muộn nếu có thể để không vội vã.",
              time_en: "Morning (8:00 AM - 10:00 AM)",
              activity_en: "Final relaxation at resort/hotel",
              description_en:
                "Enjoy leisurely breakfast and final amenities of your accommodation.",
              tip_en: "Late check-out if possible to avoid rushing.",
            },
            activities.day1.lunch, // Mì Quảng cuối
            activities.day3.afternoon, // Biển cuối
            activities.day3.evening, // Cà phê muối farewell
          ]);
        }
      }
    }

    // ===== PHONG CÁCH VĂN HÓA (CULTURE) =====
    else if (selectedStyle === "culture") {
      for (let i = 1; i <= days; i++) {
        if (i === 1) {
          // Ngày 1: Khởi đầu với văn hóa Chăm
          plan.push([
            activities.day1.morning, // Bảo tàng Điêu khắc Chăm
            activities.day1.lunch, // Mì Quảng truyền thống
            activities.day1.afternoon_evening, // Hội An phố cổ đầy đủ
            {
              time_vi: "Tối (21:00 - 22:00)",
              activity_vi: "Xem múa Apsara hoặc biểu diễn văn hóa",
              description_vi:
                "Thưởng thức các màn biểu diễn văn hóa truyền thống tại nhà hàng hoặc theater.",
              tip_vi: "Hoi An Impression show hoặc các nhà hàng có cultural performance.",
              time_en: "Night (9:00 PM - 10:00 PM)",
              activity_en: "Watch Apsara dance or cultural performance",
              description_en: "Enjoy traditional cultural performances at restaurants or theaters.",
              tip_en: "Hoi An Impression show or restaurants with cultural performances.",
            },
          ]);
        } else if (i === 2) {
          // Ngày 2: Di sản thế giới Mỹ Sơn
          plan.push([
            activities.day3.morning, // Mỹ Sơn World Heritage
            {
              time_vi: "Trưa (12:30 - 13:30)",
              activity_vi: "Ăn trưa với gia đình địa phương",
              description_vi: "Trải nghiệm bữa cơm gia đình để hiểu văn hóa ẩm thực miền Trung.",
              tip_vi: "Một số tour có thể sắp xếp homestay lunch experience.",
              time_en: "Lunch (12:30 PM - 1:30 PM)",
              activity_en: "Lunch with local family",
              description_en:
                "Experience family meal to understand Central Vietnamese food culture.",
              tip_en: "Some tours can arrange homestay lunch experiences.",
            },
            {
              time_vi: "Chiều (15:00 - 17:00)",
              activity_vi: "Thăm làng nghề truyền thống",
              description_vi:
                "Khám phá làng gốm Thanh Hà hoặc làng mộc Kim Bông để hiểu nghề thủ công.",
              tip_vi: "Có thể tham gia workshop làm gốm hoặc đồ gỗ, giá 100-200k.",
              time_en: "Afternoon (3:00 PM - 5:00 PM)",
              activity_en: "Visit traditional craft villages",
              description_en:
                "Explore Thanh Ha pottery village or Kim Bong carpentry village to understand handicrafts.",
              tip_en: "Can join pottery or woodworking workshops, 100-200k VND.",
            },
            activities.day3.evening, // Cà phê muối & thưởng thức không khí
          ]);
        } else if (i === 3) {
          // Ngày 3: Tâm linh và kiến trúc
          plan.push([
            activities.day2.morning, // Ngũ Hành Sơn - tâm linh
            activities.day3.lunch, // Bún chả cá truyền thống
            activities.day2.afternoon, // Bán đảo Sơn Trà - chùa Linh Ứng
            {
              time_vi: "Tối (19:00 - 21:00)",
              activity_vi: "Khám phá kiến trúc cầu Đà Nẵng về đêm",
              description_vi: "Tour ngắm kiến trúc các cây cầu và hiểu ý nghĩa văn hóa của chúng.",
              tip_vi: "Cầu Rồng, Cầu Tình Yêu, Cầu Sông Hàn - mỗi cầu có câu chuyện riêng.",
              time_en: "Evening (7:00 PM - 9:00 PM)",
              activity_en: "Explore Da Nang bridge architecture at night",
              description_en:
                "Tour to admire bridge architecture and understand their cultural significance.",
              tip_en: "Dragon Bridge, Love Bridge, Han River Bridge - each has its own story.",
            },
          ]);
        } else if (i === 4) {
          // Ngày 4: Văn hóa ẩm thực sâu
          plan.push([
            {
              time_vi: "Sáng (8:00 - 11:00)",
              activity_vi: "Cooking class với gia đình địa phương",
              description_vi:
                "Học nấu các món đặc sản như Mì Quảng, Bánh xèo với người dân địa phương.",
              tip_vi: "Red Bridge Cooking School hoặc Green Bamboo có tour từ 800k.",
              time_en: "Morning (8:00 AM - 11:00 AM)",
              activity_en: "Cooking class with local family",
              description_en: "Learn to cook specialties like Mi Quang, Banh Xeo with locals.",
              tip_en: "Red Bridge Cooking School or Green Bamboo have tours from 800k VND.",
            },
            activities.day4.lunch, // Thưởng thức thành quả nấu ăn
            activities.day5.afternoon, // Làng rau Trà Quế - văn hóa nông nghiệp
            {
              time_vi: "Tối (19:00 - 21:30)",
              activity_vi: "Trải nghiệm chợ đêm và ẩm thực đường phố",
              description_vi: "Khám phá văn hóa ăn uống đường phố authentic của người Đà Nẵng.",
              tip_vi: "Chợ Cồn, Chợ Hàn buổi tối có nhiều món ăn dân dã.",
              time_en: "Evening (7:00 PM - 9:30 PM)",
              activity_en: "Night market and street food experience",
              description_en: "Discover authentic street food culture of Da Nang people.",
              tip_en: "Con Market, Han Market at night have many local dishes.",
            },
          ]);
        } else if (i === 5) {
          // Ngày 5: Kết thúc với hiểu biết sâu sắc
          plan.push([
            {
              time_vi: "Sáng (8:30 - 11:00)",
              activity_vi: "Tham quan chùa và tìm hiểu tín ngưỡng",
              description_vi:
                "Thăm các ngôi chùa địa phương để hiểu tín ngưỡng và văn hóa tâm linh.",
              tip_vi: "Chùa Phước Hải, Chùa Tam Bảo có kiến trúc đẹp và ý nghĩa sâu sắc.",
              time_en: "Morning (8:30 AM - 11:00 AM)",
              activity_en: "Visit pagodas and learn about beliefs",
              description_en: "Visit local pagodas to understand beliefs and spiritual culture.",
              tip_en:
                "Phuoc Hai Pagoda, Tam Bao Pagoda have beautiful architecture and deep meaning.",
            },
            activities.day1.lunch, // Mì Quảng cuối cùng
            {
              time_vi: "Chiều (14:00 - 17:00)",
              activity_vi: "Workshop thủ công mỹ nghệ",
              description_vi:
                "Tham gia làm tranh cát, thêu, hoặc các sản phẩm thủ công truyền thống.",
              tip_vi: "Mang về làm quà lưu niệm ý nghĩa sau chuyến đi văn hóa.",
              time_en: "Afternoon (2:00 PM - 5:00 PM)",
              activity_en: "Traditional handicraft workshop",
              description_en: "Join sand painting, embroidery, or traditional handicraft making.",
              tip_en: "Take home as meaningful souvenirs after your cultural trip.",
            },
            activities.day5.evening, // Farewell dinner with cultural reflection
          ]);
        }
      }
    }

    // ===== DEFAULT: Nếu không có phong cách được chọn =====
    else {
      // Sử dụng kế hoạch cơ bản như trước
      for (let i = 1; i <= days; i++) {
        const dayKey = `day${i}`;
        const dayActivities = activities[dayKey];

        if (!dayActivities) {
          const lastDayKey = `day${Math.min(i - 1, 5)}`;
          const fallbackActivities = activities[lastDayKey];
          if (fallbackActivities) {
            plan.push(Object.values(fallbackActivities));
          }
          continue;
        }

        plan.push(Object.values(dayActivities));
      }
    }

    return plan;
  };
  // --- CONTACT MODAL LOGIC ---
  const contactModal = document.getElementById("contact-modal");
  const openContactBtn = document.getElementById("open-contact-modal-btn");
  const closeContactBtn = document.getElementById("contact-modal-close");
  const closeContactOuter = document.getElementById("contact-modal-close-outer");
  const contactForm = document.getElementById("contact-form");
  const contactFormContainer = document.getElementById("contact-form-container");
  const successMessage = document.getElementById("contact-success-message");
  const contactModalContent = document.getElementById("contact-modal-content");

  const openContactModal = () => {
    contactModal.classList.remove("hidden");
    setTimeout(() => contactModalContent.classList.remove("scale-95", "opacity-0"), 10);
  };
  const closeContactModal = () => {
    contactModalContent.classList.add("scale-95", "opacity-0");
    setTimeout(() => {
      contactModal.classList.add("hidden");
      contactFormContainer.classList.remove("hidden");
      successMessage.classList.add("hidden");
    }, 300);
  };

  openContactBtn.addEventListener("click", openContactModal);
  closeContactBtn.addEventListener("click", closeContactModal);
  closeContactOuter.addEventListener("click", closeContactModal);

  contactForm.addEventListener("submit", (e) => {
    e.preventDefault(); // Ngăn form gửi theo cách truyền thống

    const form = e.target;
    const data = new FormData(form);
    const submitButton = form.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.innerHTML;
    submitButton.disabled = true;
    submitButton.innerHTML = "Đang gửi...";

    fetch(form.action, {
      method: form.method,
      body: data,
      headers: {
        Accept: "application/json",
      },
    })
      .then((response) => {
        if (response.ok) {
          // Gửi thành công
          contactFormContainer.classList.add("hidden");
          successMessage.classList.remove("hidden");
          lucide.createIcons();
          form.reset();
        } else {
          // Gửi thất bại, có thể do lỗi mạng hoặc Formspree
          response.json().then((data) => {
            if (Object.hasOwn(data, "errors")) {
              alert(data["errors"].map((error) => error["message"]).join(", "));
            } else {
              alert("Đã có lỗi xảy ra, vui lòng thử lại.");
            }
          });
        }
      })
      .catch((error) => {
        // Lỗi kết nối
        alert("Đã có lỗi xảy ra, vui lòng thử lại.");
      })
      .finally(() => {
        // Khôi phục lại nút bấm
        submitButton.disabled = false;
        submitButton.innerHTML = originalButtonText;
      });
  });

  // --- EPIC FAREWELL SECTION - WORLD-CLASS EXPERIENCE ---
  (function () {
    const farewellSection = document.getElementById("farewell");
    const mainCanvas = document.getElementById("farewell-canvas");
    const starsCanvas = document.getElementById("farewell-stars-canvas");
    const mainCtx = mainCanvas.getContext("2d");
    const starsCtx = starsCanvas.getContext("2d");

    let isActive = false;
    let animId = null;
    let mouseX = -1,
      mouseY = -1;
    let lanterns = [];
    let fireflies = [];
    let stars = [];
    let shootingStars = [];
    let lastLanternTime = 0;
    let lastShootingStarTime = 0;
    let counterAnimated = false;

    // ---- Resize ----
    function resize() {
      mainCanvas.width = mainCanvas.offsetWidth;
      mainCanvas.height = mainCanvas.offsetHeight;
      starsCanvas.width = starsCanvas.offsetWidth;
      starsCanvas.height = starsCanvas.offsetHeight;
      initStars();
    }

    // ---- Stars (twinkling night sky) ----
    function initStars() {
      stars = [];
      const count = Math.min(250, Math.floor((starsCanvas.width * starsCanvas.height) / 4000));
      for (let i = 0; i < count; i++) {
        stars.push({
          x: Math.random() * starsCanvas.width,
          y: Math.random() * starsCanvas.height * 0.75,
          size: Math.random() * 2.2,
          twinkleSpeed: Math.random() * 0.025 + 0.005,
          twinklePhase: Math.random() * Math.PI * 2,
          brightness: Math.random() * 0.5 + 0.5,
        });
      }
    }

    function drawStars(time) {
      starsCtx.clearRect(0, 0, starsCanvas.width, starsCanvas.height);
      stars.forEach(function (star) {
        var twinkle = Math.sin(time * star.twinkleSpeed + star.twinklePhase) * 0.5 + 0.5;
        var alpha = star.brightness * twinkle;
        starsCtx.beginPath();
        starsCtx.fillStyle = "rgba(255, 255, 245, " + alpha + ")";
        starsCtx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        starsCtx.fill();
        // Cross flare for bigger stars
        if (star.size > 1.6) {
          starsCtx.strokeStyle = "rgba(255, 255, 245, " + alpha * 0.25 + ")";
          starsCtx.lineWidth = 0.5;
          starsCtx.beginPath();
          starsCtx.moveTo(star.x - star.size * 4, star.y);
          starsCtx.lineTo(star.x + star.size * 4, star.y);
          starsCtx.moveTo(star.x, star.y - star.size * 4);
          starsCtx.lineTo(star.x, star.y + star.size * 4);
          starsCtx.stroke();
        }
      });
    }

    // ---- Lanterns (realistic sky lanterns) ----
    function LanternObj(x, y, burst) {
      this.x = x !== undefined ? x : Math.random() * mainCanvas.width;
      this.y = y !== undefined ? y : mainCanvas.height + 20;
      this.size = Math.random() * 6 + 8;
      this.speedY = burst ? Math.random() * 1.8 + 1.2 : Math.random() * 0.4 + 0.15;
      this.speedX = burst ? (Math.random() - 0.5) * 2.5 : 0;
      var hue = Math.random() * 40 + 15;
      this.colorBase = "hsla(" + hue + ", 100%, 65%, ";
      this.sway = Math.random() * Math.PI * 2;
      this.swaySpeed = Math.random() * 0.015 + 0.005;
      this.swayAmount = Math.random() * 1.2 + 0.5;
      this.life = 1;
      this.decay = burst ? 0.0018 : 0.0006;
      this.flicker = Math.random() * Math.PI * 2;
      this.flickerSpeed = Math.random() * 0.1 + 0.05;
    }
    LanternObj.prototype.update = function () {
      this.y -= this.speedY;
      this.x += this.speedX;
      this.sway += this.swaySpeed;
      this.x += Math.sin(this.sway) * this.swayAmount;
      this.speedX *= 0.995;
      this.life -= this.decay;
      this.flicker += this.flickerSpeed;
    };
    LanternObj.prototype.draw = function (ctx) {
      if (this.life <= 0) return;
      var flickerAlpha = Math.sin(this.flicker) * 0.1 + 0.9;
      var alpha = this.life * flickerAlpha;
      // Outer glow
      var outerGlow = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size * 5);
      outerGlow.addColorStop(0, this.colorBase + alpha * 0.25 + ")");
      outerGlow.addColorStop(1, this.colorBase + "0)");
      ctx.fillStyle = outerGlow;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size * 5, 0, Math.PI * 2);
      ctx.fill();
      // Mid glow
      var midGlow = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size * 2);
      midGlow.addColorStop(0, "rgba(255, 240, 200, " + alpha + ")");
      midGlow.addColorStop(0.4, this.colorBase + alpha * 0.7 + ")");
      midGlow.addColorStop(1, this.colorBase + "0)");
      ctx.fillStyle = midGlow;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size * 2, 0, Math.PI * 2);
      ctx.fill();
      // Lantern body (trapezoid shape)
      ctx.fillStyle = this.colorBase + alpha * 0.6 + ")";
      ctx.beginPath();
      ctx.moveTo(this.x - this.size * 0.35, this.y - this.size * 0.4);
      ctx.lineTo(this.x + this.size * 0.35, this.y - this.size * 0.4);
      ctx.lineTo(this.x + this.size * 0.55, this.y + this.size * 0.5);
      ctx.lineTo(this.x - this.size * 0.55, this.y + this.size * 0.5);
      ctx.closePath();
      ctx.fill();
      // Bright core flame
      ctx.fillStyle = "rgba(255, 255, 220, " + alpha * 0.8 + ")";
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size * 0.3, 0, Math.PI * 2);
      ctx.fill();
    };
    LanternObj.prototype.isDead = function () {
      return this.life <= 0 || this.y < -this.size * 5;
    };

    // ---- Fireflies (interactive particles) ----
    function FireflyObj() {
      this.x = Math.random() * mainCanvas.width;
      this.y = Math.random() * mainCanvas.height;
      this.size = Math.random() * 1.8 + 0.8;
      this.vx = (Math.random() - 0.5) * 0.4;
      this.vy = (Math.random() - 0.5) * 0.4;
      this.phase = Math.random() * Math.PI * 2;
      this.speed = Math.random() * 0.03 + 0.01;
      this.brightness = 0;
      this.maxBrightness = Math.random() * 0.6 + 0.3;
    }
    FireflyObj.prototype.update = function (mx, my) {
      this.x += this.vx + Math.sin(this.phase) * 0.25;
      this.y += this.vy + Math.cos(this.phase * 0.7) * 0.2;
      this.phase += this.speed;
      // Mouse attraction
      if (mx >= 0 && my >= 0) {
        var dx = mx - this.x;
        var dy = my - this.y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 250 && dist > 0) {
          this.vx += (dx / dist) * 0.015;
          this.vy += (dy / dist) * 0.015;
        }
      }
      this.vx *= 0.98;
      this.vy *= 0.98;
      this.brightness = (Math.sin(this.phase * 2) * 0.5 + 0.5) * this.maxBrightness;
      if (this.x < 0) this.x = mainCanvas.width;
      if (this.x > mainCanvas.width) this.x = 0;
      if (this.y < 0) this.y = mainCanvas.height;
      if (this.y > mainCanvas.height) this.y = 0;
    };
    FireflyObj.prototype.draw = function (ctx) {
      var glow = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size * 8);
      glow.addColorStop(0, "rgba(180, 255, 200, " + this.brightness + ")");
      glow.addColorStop(0.3, "rgba(138, 176, 151, " + this.brightness * 0.4 + ")");
      glow.addColorStop(1, "rgba(138, 176, 151, 0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size * 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(220, 255, 230, " + this.brightness + ")";
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
    };

    // ---- Shooting Stars ----
    function ShootingStarObj() {
      this.x = Math.random() * mainCanvas.width * 0.8;
      this.y = Math.random() * mainCanvas.height * 0.25;
      this.length = Math.random() * 100 + 50;
      this.speed = Math.random() * 10 + 5;
      this.angle = Math.PI / 4 + (Math.random() - 0.5) * 0.4;
      this.life = 1;
      this.decay = 0.012 + Math.random() * 0.008;
    }
    ShootingStarObj.prototype.update = function () {
      this.x += Math.cos(this.angle) * this.speed;
      this.y += Math.sin(this.angle) * this.speed;
      this.life -= this.decay;
    };
    ShootingStarObj.prototype.draw = function (ctx) {
      if (this.life <= 0) return;
      var tailX = this.x - Math.cos(this.angle) * this.length;
      var tailY = this.y - Math.sin(this.angle) * this.length;
      var gradient = ctx.createLinearGradient(tailX, tailY, this.x, this.y);
      gradient.addColorStop(0, "rgba(255, 255, 255, 0)");
      gradient.addColorStop(0.6, "rgba(200, 220, 255, " + this.life * 0.4 + ")");
      gradient.addColorStop(1, "rgba(255, 255, 255, " + this.life + ")");
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 2.5;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(this.x, this.y);
      ctx.stroke();
      // Bright head
      ctx.fillStyle = "rgba(255, 255, 255, " + this.life + ")";
      ctx.beginPath();
      ctx.arc(this.x, this.y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    };
    ShootingStarObj.prototype.isDead = function () {
      return this.life <= 0;
    };

    // ---- Init fireflies ----
    function initFireflies() {
      fireflies = [];
      var count = Math.min(35, Math.floor(mainCanvas.width / 45));
      for (var i = 0; i < count; i++) {
        fireflies.push(new FireflyObj());
      }
    }

    // ---- Spawners ----
    function spawnNaturalLantern(time) {
      if (time - lastLanternTime > 2500 && lanterns.length < 20) {
        lanterns.push(new LanternObj());
        lastLanternTime = time;
      }
    }
    function spawnShootingStar(time) {
      if (time - lastShootingStarTime > 6000 + Math.random() * 10000) {
        shootingStars.push(new ShootingStarObj());
        lastShootingStarTime = time;
      }
    }

    // ---- Release burst of lanterns (button interaction) ----
    function releaseLanternBurst() {
      var centerX = mainCanvas.width / 2;
      var centerY = mainCanvas.height * 0.65;
      for (var i = 0; i < 20; i++) {
        (function (idx) {
          setTimeout(function () {
            var x = centerX + (Math.random() - 0.5) * 300;
            var y = centerY + (Math.random() - 0.5) * 120;
            lanterns.push(new LanternObj(x, y, true));
          }, idx * 80);
        })(i);
      }
      // Also trigger 2 shooting stars for extra drama
      setTimeout(function () {
        shootingStars.push(new ShootingStarObj());
      }, 500);
      setTimeout(function () {
        shootingStars.push(new ShootingStarObj());
      }, 1200);
    }

    // ---- Main Animation Loop ----
    function animateLoop(time) {
      if (!isActive) return;
      mainCtx.clearRect(0, 0, mainCanvas.width, mainCanvas.height);
      drawStars(time);
      spawnNaturalLantern(time);
      spawnShootingStar(time);
      // Lanterns
      for (var i = lanterns.length - 1; i >= 0; i--) {
        lanterns[i].update();
        lanterns[i].draw(mainCtx);
        if (lanterns[i].isDead()) lanterns.splice(i, 1);
      }
      // Fireflies
      for (var j = 0; j < fireflies.length; j++) {
        fireflies[j].update(mouseX, mouseY);
        fireflies[j].draw(mainCtx);
      }
      // Shooting stars
      for (var k = shootingStars.length - 1; k >= 0; k--) {
        shootingStars[k].update();
        shootingStars[k].draw(mainCtx);
        if (shootingStars[k].isDead()) shootingStars.splice(k, 1);
      }
      animId = requestAnimationFrame(animateLoop);
    }

    function startFarewell() {
      if (isActive) return;
      isActive = true;
      resize();
      initFireflies();
      animateLoop(0);
    }
    function stopFarewell() {
      isActive = false;
      if (animId) {
        cancelAnimationFrame(animId);
        animId = null;
      }
      mainCtx.clearRect(0, 0, mainCanvas.width, mainCanvas.height);
      starsCtx.clearRect(0, 0, starsCanvas.width, starsCanvas.height);
      lanterns = [];
      fireflies = [];
      shootingStars = [];
    }

    // ---- Observer ----
    var farewellObs = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) startFarewell();
          else stopFarewell();
        });
      },
      { threshold: 0.1 },
    );
    farewellObs.observe(farewellSection);

    // ---- Mouse tracking ----
    farewellSection.addEventListener("mousemove", function (e) {
      var rect = farewellSection.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    });
    farewellSection.addEventListener("mouseleave", function () {
      mouseX = -1;
      mouseY = -1;
    });

    // ---- Release button with ripple ----
    var releaseBtn = document.getElementById("release-lantern-btn");
    if (releaseBtn) {
      releaseBtn.addEventListener("click", function (e) {
        releaseLanternBurst();
        // Ripple effect
        var ripple = document.createElement("span");
        ripple.className = "btn-ripple";
        var rect = releaseBtn.getBoundingClientRect();
        ripple.style.left = e.clientX - rect.left + "px";
        ripple.style.top = e.clientY - rect.top + "px";
        ripple.style.width = ripple.style.height = Math.max(rect.width, rect.height) + "px";
        releaseBtn.appendChild(ripple);
        setTimeout(function () {
          ripple.remove();
        }, 600);
      });
    }

    window.addEventListener("resize", resize);

    // ---- GSAP ScrollTrigger Animations ----
    // Letterbox cinematic bars
    ScrollTrigger.create({
      trigger: "#farewell",
      start: "top 80%",
      end: "bottom 20%",
      onEnter: function () {
        document.querySelectorAll(".farewell-letterbox").forEach(function (el) {
          el.classList.add("active");
        });
      },
      onLeave: function () {
        document.querySelectorAll(".farewell-letterbox").forEach(function (el) {
          el.classList.remove("active");
        });
      },
      onEnterBack: function () {
        document.querySelectorAll(".farewell-letterbox").forEach(function (el) {
          el.classList.add("active");
        });
      },
      onLeaveBack: function () {
        document.querySelectorAll(".farewell-letterbox").forEach(function (el) {
          el.classList.remove("active");
        });
      },
    });

    // Staggered content reveal
    var farewellTL = gsap.timeline({
      scrollTrigger: {
        trigger: "#farewell",
        start: "top 55%",
        end: "center center",
        toggleActions: "play none none reverse",
      },
    });
    farewellTL
      .fromTo(
        ".farewell-quote",
        { opacity: 0, y: 30, letterSpacing: "0.5em" },
        {
          opacity: 1,
          y: 0,
          letterSpacing: "0.2em",
          duration: 1.2,
          ease: "power3.out",
        },
      )
      .fromTo(
        ".farewell-divider",
        { scaleX: 0 },
        { scaleX: 1, duration: 0.8, ease: "power2.inOut" },
        "-=0.6",
      )
      .fromTo(
        ".farewell-title-main",
        { opacity: 0, scale: 0.7, y: 30 },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 1.4,
          ease: "back.out(1.4)",
        },
        "-=0.5",
      )
      .fromTo(
        ".farewell-desc",
        { opacity: 0, y: 25 },
        { opacity: 1, y: 0, duration: 1, ease: "power2.out" },
        "-=0.7",
      )
      .fromTo(
        ".farewell-counter",
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power2.out",
          onComplete: function () {
            if (!counterAnimated) {
              counterAnimated = true;
              animateCounters();
            }
          },
        },
        "-=0.5",
      )
      .fromTo(
        ".farewell-lantern-btn",
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" },
        "-=0.4",
      );

    // ---- Counter animation ----
    function animateCounters() {
      document.querySelectorAll(".farewell-counter-num").forEach(function (el) {
        var target = parseInt(el.getAttribute("data-count"));
        var obj = { val: 0 };
        gsap.to(obj, {
          val: target,
          duration: 2,
          ease: "power2.out",
          onUpdate: function () {
            el.textContent = Math.round(obj.val);
          },
        });
      });
    }

    // ---- Floating Memory Cards ----
    var memoryImages = [
      {
        src: "/danasoul/images/Diem den/cau_vang.png",
        label: "C\u1ea7u V\u00e0ng",
      },
      {
        src: "/danasoul/images/Van hoa/l\u1ec5 h\u1ed9i \u0111\u00e8n l\u1ed3ng.png",
        label: "\u0110\u00e8n L\u1ed3ng",
      },
      { src: "/danasoul/images/Am thuc/my_quang.png", label: "M\u00ec Qu\u1ea3ng" },
      {
        src: "/danasoul/images/Diem den/ngu_hanh_son.png",
        label: "Ng\u0169 H\u00e0nh S\u01a1n",
      },
      {
        src: "/danasoul/images/Trang chu/binh_minh__1.jpg",
        label: "B\u00ecnh Minh",
      },
      {
        src: "/danasoul/images/Van hoa/con_nguoi_da_nang.jpeg",
        label: "Con Ng\u01b0\u1eddi",
      },
    ];
    var memPositions = [
      { left: "2%", top: "12%", rot: -7 },
      { right: "3%", top: "18%", rot: 5 },
      { left: "5%", bottom: "18%", rot: -4 },
      { right: "6%", bottom: "22%", rot: 8 },
      { left: "12%", top: "55%", rot: -6 },
      { right: "10%", top: "50%", rot: 4 },
    ];
    var memoriesContainer = document.getElementById("farewell-memories");
    if (memoriesContainer) {
      memoryImages.forEach(function (img, i) {
        var pos = memPositions[i];
        var card = document.createElement("div");
        card.className = "farewell-memory-card";
        if (pos.left) card.style.left = pos.left;
        if (pos.right) card.style.right = pos.right;
        if (pos.top) card.style.top = pos.top;
        if (pos.bottom) card.style.bottom = pos.bottom;
        card.style.setProperty("--rot", pos.rot + "deg");
        card.style.animation =
          "farewellMemoryFloat " +
          (10 + Math.random() * 6) +
          "s ease-in-out " +
          i * 0.5 +
          "s infinite";
        card.innerHTML =
          '<img src="' +
          img.src +
          '" alt="' +
          img.label +
          '" loading="lazy"><div class="memory-label">' +
          img.label +
          " \u2661</div>";
        memoriesContainer.appendChild(card);

        ScrollTrigger.create({
          trigger: "#farewell",
          start: "top 40%",
          onEnter: function () {
            setTimeout(function () {
              card.classList.add("visible");
            }, i * 300);
          },
          onLeaveBack: function () {
            card.classList.remove("visible");
          },
        });
      });
    }
  })();

  // --- MUSIC PLAYER LOGIC V7 (COMPACT & STABLE) ---
  const musicPlayerContainer = document.getElementById("music-player");
  const playPauseBtn = document.getElementById("play-pause-btn");
  const nextTrackBtn = document.getElementById("next-track-btn");
  const volumeSlider = document.getElementById("volume-slider");

  const playlist = [
    {
      title: "Hello Viet Nam",
      path: "/danasoul/music/xin_chao_viet_nam.mp3",
    },
    {
      title: "Một vòng Việt Nam",
      path: "/danasoul/music/mot_vong_viet_nam.mp3",
    },
    {
      title: "Khát vọng tuổi trẻ",
      path: "/danasoul/music/khat_vong_tuoi_tre.mp3",
    },
    {
      title: "Để mị nói cho mà nghe",
      path: "/danasoul/music/de_mi_noi_cho_ma_nghe.mp3",
    },
    {
      title: "Bay cùng tôi lên bầu trời Việt Nam",
      path: "/danasoul/music/bay_cung_toi_len_bau_troi_VN.mp3",
    },
    {
      title: "Múa xạp xòe hoa",
      path: "/danasoul/music/mua_xap_xoe_hoa.mp3",
    },
    {
      title: "Sài Gòn Ơi",
      path: "/danasoul/music/sai_gon_oi.mp3",
    },
    {
      title: "Việt Nam MyHome",
      path: "/danasoul/music/VIETNAM  My Home.mp3",
    },
  ];

  let currentTrackIndex = 0;
  let player;
  let meter; // Để đo cường độ âm thanh cho hiệu ứng thở
  let isPlayerReady = false;
  let isAutoNextPending = false; // Cờ chống gọi auto-next nhiều lần

  // Cập nhật giao diện (chỉ icon) với smooth animation
  const updateUI = (state) => {
    const isPlaying = state === "started";

    // Thêm transformation mượt cho nút play/pause
    playPauseBtn.style.transform = isPlaying ? "scale(1.1)" : "scale(1)";

    // Lấy icon trực tiếp từ DOM mỗi lần gọi (tránh stale reference)
    const pIcon = document.getElementById("play-icon");
    const sIcon = document.getElementById("pause-icon");
    if (pIcon && sIcon) {
      if (isPlaying) {
        pIcon.classList.add("icon-hidden");
        pIcon.classList.remove("icon-visible");
        sIcon.classList.add("icon-visible");
        sIcon.classList.remove("icon-hidden");
      } else {
        pIcon.classList.add("icon-visible");
        pIcon.classList.remove("icon-hidden");
        sIcon.classList.add("icon-hidden");
        sIcon.classList.remove("icon-visible");
      }
    }
  };

  // Tải bài hát (phiên bản ổn định)
  const loadTrack = (trackIndex, shouldPlay) => {
    isPlayerReady = false;
    isAutoNextPending = false;

    if (player) {
      // Dừng và giải phóng tài nguyên một cách an toàn
      try {
        player.stop();
      } catch (e) {}
      Tone.Transport.stop();
      Tone.Transport.cancel(); // Xóa mọi sự kiện đã lên lịch
      player.unsync();
      player.dispose();
    }
    if (meter) {
      meter.dispose();
    }

    // Reset Transport position về 0 (quan trọng khi loop playlist)
    Tone.Transport.position = 0;
    Tone.Transport.seconds = 0;

    currentTrackIndex = trackIndex;

    player = new Tone.Player({
      url: playlist[trackIndex].path,
      loop: false,
      volume: Tone.gainToDb(volumeSlider.value),
      onload: () => {
        isPlayerReady = true;
        isAutoNextPending = false;
        if (shouldPlay) {
          // Đảm bảo Transport reset trước khi start
          Tone.Transport.position = 0;
          Tone.Transport.start();
        }
        updateUI(Tone.Transport.state);
      },
    }).toDestination();

    meter = new Tone.Meter();
    player.connect(meter);
    player.sync().start(0);
  };

  // Chơi bài tiếp theo
  const playNextTrack = () => {
    const wasPlaying = Tone.Transport.state === "started";
    const nextIndex = (currentTrackIndex + 1) % playlist.length;
    loadTrack(nextIndex, wasPlaying || true); // Luôn phát nhạc khi nhấn Next
  };

  // Sự kiện cho nút Play/Pause
  playPauseBtn.addEventListener("click", async () => {
    if (Tone.context.state !== "running") await Tone.start();
    if (!isPlayerReady) return;

    if (Tone.Transport.state === "started") {
      Tone.Transport.pause();
    } else {
      Tone.Transport.start();
    }
    updateUI(Tone.Transport.state);
  });

  // Sự kiện nút Next
  nextTrackBtn.addEventListener("click", () => {
    if (!isPlayerReady) return;
    playNextTrack();
  });

  // Sự kiện cho thanh Volume
  volumeSlider.addEventListener("input", (e) => {
    if (player) {
      player.volume.value = Tone.gainToDb(e.target.value);
    }
  });

  // Vòng lặp cập nhật hiệu ứng + phát hiện bài hát kết thúc
  function updateLoop() {
    requestAnimationFrame(updateLoop);
    if (!isPlayerReady || !player) return;

    if (Tone.Transport.state === "started") {
      // Kiểm tra bài hát đã kết thúc chưa (dùng seconds thay vì progress)
      const duration = player.buffer ? player.buffer.duration : 0;
      if (duration > 0 && Tone.Transport.seconds >= duration - 0.15) {
        if (!isAutoNextPending) {
          isAutoNextPending = true;
          // Tự động chuyển bài tiếp theo sau delay ngắn
          setTimeout(() => {
            playNextTrack();
          }, 300);
        }
        return;
      }

      // Hiệu ứng "thở" bằng box-shadow
      try {
        const level = Tone.dbToGain(meter.getValue());
        const breathSize = level * 12 + 4;
        const breathOpacity = level * 0.5 + 0.2;
        playPauseBtn.style.boxShadow = `0 0 ${breathSize}px rgba(138, 176, 151, ${breathOpacity})`;
      } catch (e) {}
    } else {
      playPauseBtn.style.boxShadow = "none";
    }
  }

  // Khởi tạo
  loadTrack(0, false);
  updateLoop();

  // Đảm bảo icon khởi tạo đúng trạng thái ban đầu
  setTimeout(() => {
    updateUI("stopped");
  }, 100);

  // --- KẾT THÚC TRÌNH PHÁT NHẠC ---

  // --- BẢN ĐỒ TƯƠNG TÁC (MAPBOX) ---
  const mapLocations = [
    // Tọa độ đã được kiểm tra và cập nhật ngày 18/06/2025
    {
      id: "cau-vang",
      coords: [107.99625, 15.99486],
      zoom: 16,
    }, // Cập nhật: Tọa độ chính xác của cây cầu
    {
      id: "cau-rong",
      coords: [108.2267, 16.0611],
      zoom: 15,
    }, // Cập nhật: Tọa độ chính xác của cây cầu
    {
      id: "ba-na-hills",
      coords: [107.998, 15.999],
      zoom: 14,
    }, // Cập nhật: Tọa độ trung tâm khu du lịch
    {
      id: "my-khe",
      coords: [108.25, 16.055],
      zoom: 14,
    }, // Cập nhật: Tọa độ trung tâm bãi biển
    {
      id: "ngu-hanh-son",
      coords: [108.2625, 16.0045],
      zoom: 15,
    }, // Cập nhật: Tọa độ tại cổng chính khu di tích
    {
      id: "sun-wheel",
      coords: [108.2183, 16.0409],
      zoom: 16,
    }, // Cập nhật: Tọa độ chính xác của vòng quay
    {
      id: "ban-dao-son-tra",
      coords: [108.291, 16.125],
      zoom: 12,
    }, // Cập nhật: Tọa độ đỉnh Bàn Cờ, trung tâm bán đảo
    {
      id: "chua-linh-ung",
      coords: [108.293, 16.1],
      zoom: 15,
    }, // Cập nhật: Tọa độ chính xác của chùa
    {
      id: "hoi-an",
      coords: [108.3319, 15.8797],
      zoom: 15,
    }, // Cập nhật: Tọa độ trung tâm phố cổ
    {
      id: "nui-than-tai",
      coords: [108.0198, 15.9678],
      zoom: 14,
    }, // Cập nhật: Tọa độ chính xác của công viên
    {
      id: "my-son",
      coords: [108.118, 15.764],
      zoom: 14.5,
    }, // Cập nhật: Tọa độ trung tâm khu di tích
    {
      id: "cu-lao-cham",
      coords: [108.52, 15.9496],
      zoom: 12.5,
    }, // Cập nhật: Tọa độ trung tâm đảo chính
    {
      id: "lang-bich-hoa-tam-thanh",
      coords: [108.517, 15.589],
      zoom: 15,
    }, // Giữ nguyên tọa độ chính xác
    {
      id: "bien-an-bang",
      coords: [108.345, 15.905],
      zoom: 14,
    }, // Giữ nguyên tọa độ chính xác
    {
      id: "rung-dua-bay-mau",
      coords: [108.366, 15.867],
      zoom: 14.5,
    }, // Giữ nguyên tọa độ chính xác
  ];

  let map = null;
  let markers = [];
  let activePopup = null; // MỚI: Di chuyển biến ra đây

  const initMap = () => {
    // BẠN CẦN CUNG CẤP API KEY CỦA MÌNH TẠI ĐÂY
    mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || "";
    map = new mapboxgl.Map({
      container: "map-container",
      style: "mapbox://styles/mapbox/dark-v11", // Phong cách nền tối từ Mapbox
      center: [108.2208, 16.0678], // Trung tâm Đà Nẵng
      zoom: 11.5,
    });

    map.on("load", renderMapContent);
  };

  // Thay thế TOÀN BỘ hàm renderMapContent cũ của bạn bằng hàm này

  const renderMapContent = () => {
    // MỚI: Luôn đóng popup đang mở trước khi vẽ lại bất cứ thứ gì
    if (activePopup) {
      activePopup.remove();
      activePopup = null;
    }

    // Xóa các marker cũ nếu có
    markers.forEach((marker) => marker.remove());
    markers = [];

    const lang = currentLanguage;
    const destinations = data[lang].destinations;
    const listContainer = document.getElementById("map-locations-list");
    listContainer.innerHTML = "";

    mapLocations.forEach((loc) => {
      const destInfo = destinations.find((d) => d.id === loc.id);
      if (!destInfo) return;

      const el = document.createElement("div");
      el.className = "custom-marker";
      el.dataset.id = loc.id;

      const listItem = document.createElement("div");
      listItem.className = "location-item";
      listItem.textContent = destInfo.title; // Tiêu đề danh sách được dịch
      listItem.dataset.id = loc.id;
      listContainer.appendChild(listItem);

      const flyToLocation = () => {
        if (activePopup) {
          activePopup.remove();
          activePopup = null;
        }
        document
          .querySelectorAll(".custom-marker, .location-item")
          .forEach((item) => item.classList.remove("active"));

        map.flyTo({
          center: loc.coords,
          zoom: loc.zoom,
          essential: true,
          speed: 1.2,
          curve: 1.4,
          easing: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
        });

        setTimeout(() => {
          // Nội dung popup giờ sẽ lấy từ dữ liệu đã được dịch
          const popupContent = `
          <div>
            <img src="${destInfo.image}" alt="${destInfo.title}" style="width: 100%; height: 140px; object-fit: cover;" loading="lazy">
            <div style="padding: 15px;">
              <h4 style="font-weight: 700; color: var(--brand-primary); margin-bottom: 5px;">${destInfo.title}</h4>
              <p style="font-size: 13px; line-height: 1.4;">${destInfo.shortDesc}</p>
            </div>
          </div>
        `;
          activePopup = new mapboxgl.Popup({
            offset: 14,
            closeOnClick: false,
            anchor: "bottom",
          })
            .setLngLat(loc.coords)
            .setHTML(popupContent)
            .addTo(map);

          activePopup.on("close", () => {
            el.classList.remove("active");
            el.closest(".mapboxgl-marker")?.classList.remove("active-marker");
            listItem.classList.remove("active");
            activePopup = null;
          });
        }, 300);

        el.classList.add("active");
        el.closest(".mapboxgl-marker")?.classList.add("active-marker");
        listItem.classList.add("active");
      };

      const marker = new mapboxgl.Marker(el).setLngLat(loc.coords).addTo(map);
      markers.push(marker);

      el.addEventListener("click", (e) => {
        e.stopPropagation();
        flyToLocation();
      });
      listItem.addEventListener("click", flyToLocation);
    });

    map.on("click", () => {
      if (activePopup) {
        activePopup.remove();
        activePopup = null;
        document
          .querySelectorAll(".custom-marker, .location-item")
          .forEach((item) => item.classList.remove("active"));
        document
          .querySelectorAll(".mapboxgl-marker.active-marker")
          .forEach((item) => item.classList.remove("active-marker"));
      }
    });
    gsap.from("#show-map-image-btn, #map-container, #map-locations-list", {
      duration: 1,
      opacity: 0,
      y: 50,
      ease: "power3.out",
      stagger: 0.2,
    });
  };

  // Thêm các key ngôn ngữ mới cho phần bản đồ
  languageContent.vi.map = {
    planningButton: "Xem bản đồ số thành phố Đà Nẵng",
    title: "Bản Đồ Trực Quan",
    desc: "Khám phá vị trí các điểm đến mang tính biểu tượng của Đà Nẵng. Nhấn vào một điểm trên bản đồ hoặc trong danh sách để xem chi tiết.",
    digitalMapTitle: "Bản đồ số Thành phố Đà Nẵng",
  };
  languageContent.en.map = {
    planningButton: "View Da Nang Digital City Map",
    title: "Interactive Map",
    desc: "Explore the locations of Da Nang's iconic destinations. Click on a point on the map or in the list to see details.",
    digitalMapTitle: "Digital Map of Da Nang City",
  };

  // Khởi tạo bản đồ
  initMap();

  // Ghi đè hàm switchLanguage để render lại nội dung bản đồ khi đổi ngôn ngữ
  const originalSwitchLanguage = switchLanguage;
  switchLanguage = (lang, force = false) => {
    originalSwitchLanguage(lang, force);
    if (map && map.loaded()) {
      renderMapContent();
    }
  };

  // --- GỌI HÀM KHỞI TẠO ---
  switchLanguage("vi", true); // Mặc định là tiếng Việt, ép buộc chạy lần đầu

  // --- REFRESH SCROLL ANIMATIONS SAU KHI CONTENT LOADED ---

  // --- FIX: Đảm bảo destination cards luôn hiển thị ---
  // Thêm observer để theo dõi và sửa lỗi mờ dần của destination cards
  const observeDestinationCards = () => {
    const observer = new MutationObserver(() => {
      const cards = document.querySelectorAll(".destination-card");
      cards.forEach((card) => {
        // Đảm bảo opacity luôn là 1 và transform không bị ảnh hưởng
        if (card.style.opacity !== "1" && card.style.opacity !== "") {
          card.style.opacity = "1";
        }
      });
    });

    observer.observe(document.getElementById("destinations-grid"), {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["style"],
    });
  };

  // Khởi động observer sau một khoảng thời gian ngắn
  setTimeout(observeDestinationCards, 1000);

  // --- SCROLL-SPY: Active Nav Indicator ---
  const spySections = document.querySelectorAll("section[id]");
  const navLinks = document.querySelectorAll(".nav-link");
  const mobileNavLinks = document.querySelectorAll(".nav-link-mobile");

  const activateNav = () => {
    const scrollY = window.scrollY + window.innerHeight / 3;
    let currentId = "";

    spySections.forEach((section) => {
      const top = section.offsetTop;
      const height = section.offsetHeight;
      if (scrollY >= top && scrollY < top + height) {
        currentId = section.getAttribute("id");
      }
    });

    navLinks.forEach((link) => {
      link.classList.remove("active");
      if (link.getAttribute("href") === "#" + currentId) {
        link.classList.add("active");
      }
    });

    mobileNavLinks.forEach((link) => {
      link.classList.remove("active");
      if (link.getAttribute("href") === "#" + currentId) {
        link.classList.add("active");
      }
    });
  };

  window.addEventListener("scroll", activateNav, { passive: true });
  activateNav(); // Run once on load

  // === Performance optimization ===
  (function () {
    // 🖼️ WebP Support Detection & Optimization
    (function () {
      // Detect WebP support
      function supportsWebp() {
        return new Promise((resolve) => {
          const webp = new Image();
          webp.onload = webp.onerror = () => resolve(webp.height === 2);
          webp.src =
            "data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA";
        });
      }

      // Image optimization function
      function optimizeImages() {
        const images = document.querySelectorAll("img[src]");

        supportsWebp().then((hasWebpSupport) => {
          images.forEach((img) => {
            // Skip if already processed or external image
            if (
              img.dataset.optimized ||
              img.src.startsWith("http") ||
              img.src.startsWith("data:")
            ) {
              return;
            }

            const originalSrc = img.src;

            // Try WebP version if supported
            if (hasWebpSupport && !originalSrc.endsWith(".webp")) {
              const webpSrc = originalSrc.replace(/\.(jpg|jpeg|png)$/i, ".webp");

              // Test if WebP version exists
              const testImg = new Image();
              testImg.onload = () => {
                img.src = webpSrc;
                img.dataset.optimized = "true";
              };
              testImg.onerror = () => {
                img.dataset.optimized = "true";
              };
              testImg.src = webpSrc;
            } else {
              img.dataset.optimized = "true";
            }
          });
        });
      }

      // Run optimization after DOM is loaded
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", optimizeImages);
      } else {
        optimizeImages();
      }

      // Re-optimize when new images are added dynamically
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1) {
              const newImages = node.querySelectorAll ? node.querySelectorAll("img[src]") : [];
              if (newImages.length > 0) {
                setTimeout(optimizeImages, 100);
              }
            }
          });
        });
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });
    })();

    // 📱 Responsive Image Loading
    function loadAppropriateImage(img) {
      const devicePixelRatio = window.devicePixelRatio || 1;
      const imgWidth = img.clientWidth;
      const targetWidth = Math.round(imgWidth * devicePixelRatio);

      // Only for placeholder images - adjust size based on device
      if (img.src.includes("placehold.co")) {
        const newSrc = img.src.replace(
          /\/\d+x\d+\//,
          `/${targetWidth}x${Math.round(targetWidth * 0.75)}/`,
        );
        img.src = newSrc;
      }
    }

    // 🔧 Additional Performance Enhancements
    // Intersection Observer for lazy loading fallback
    if ("IntersectionObserver" in window) {
      const lazyImageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target;
            if (img.dataset.src) {
              img.src = img.dataset.src;
              img.removeAttribute("data-src");
            }
            loadAppropriateImage(img);
            observer.unobserve(img);
          }
        });
      });

      // Observe images with data-src (for manual lazy loading)
      document.querySelectorAll("img[data-src]").forEach((img) => {
        lazyImageObserver.observe(img);
      });
    }
  })();

  // Initialize lucide icons
  if (typeof lucide !== "undefined") {
    lucide.createIcons();
  }
});

onUnmounted(() => {
  // Cleanup GSAP ScrollTrigger
  if (typeof ScrollTrigger !== "undefined") {
    ScrollTrigger.getAll().forEach((t) => t.kill());
  }
  // Cleanup Tone.js
  if (typeof Tone !== "undefined" && Tone.context && Tone.context.state === "running") {
    Tone.Transport.stop();
  }
});
</script>

<style>
/* ===== EPIC FAREWELL SECTION ===== */
.farewell-bg {
  position: absolute;
  inset: -10%;
  background-image: url("/danasoul/images/Hen gap lai/da_nang_ve_dem.jpg");
  background-size: cover;
  background-position: center;
  animation: farewellKenBurns 30s ease-in-out infinite alternate;
  will-change: transform;
}
@keyframes farewellKenBurns {
  0% {
    transform: scale(1.05) translate(0, 0);
  }
  100% {
    transform: scale(1.2) translate(-2%, -1%);
  }
}
.farewell-overlay {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse at 50% 100%, rgba(138, 176, 151, 0.1) 0%, transparent 50%),
    linear-gradient(
      to bottom,
      rgba(0, 0, 0, 0.9) 0%,
      rgba(0, 0, 0, 0.35) 30%,
      rgba(0, 0, 0, 0.35) 65%,
      rgba(0, 0, 0, 0.92) 100%
    );
  z-index: 5;
}
.farewell-aurora {
  position: absolute;
  bottom: 0;
  left: -20%;
  right: -20%;
  height: 50%;
  background:
    linear-gradient(120deg, transparent 20%, rgba(138, 176, 151, 0.07) 40%, transparent 55%),
    linear-gradient(240deg, transparent 25%, rgba(58, 95, 75, 0.05) 42%, transparent 58%);
  animation: auroraWave 10s ease-in-out infinite alternate;
  z-index: 6;
  pointer-events: none;
}
@keyframes auroraWave {
  0% {
    transform: translateX(-5%) scaleY(0.8);
    opacity: 0.3;
  }
  100% {
    transform: translateX(5%) scaleY(1.2);
    opacity: 0.7;
  }
}
.farewell-canvas-layer {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
#farewell-stars-canvas {
  z-index: 8;
}
#farewell-canvas {
  z-index: 15;
}
.farewell-letterbox {
  position: absolute;
  left: 0;
  right: 0;
  background: #000;
  z-index: 22;
  transition: height 1.5s cubic-bezier(0.4, 0, 0.2, 1);
}
.farewell-letterbox-top {
  top: 0;
  height: 0;
}
.farewell-letterbox-bottom {
  bottom: 0;
  height: 0;
}
.farewell-letterbox.active {
  height: 6vh;
}
.farewell-title-main {
  font-family: "Dancing Script", cursive;
  font-size: clamp(3.5rem, 10vw, 8rem);
  font-weight: 700;
  color: #fff;
  line-height: 1.1;
  text-shadow:
    0 0 10px rgba(138, 176, 151, 0.5),
    0 0 30px rgba(138, 176, 151, 0.3),
    0 0 60px rgba(138, 176, 151, 0.2),
    0 0 100px rgba(138, 176, 151, 0.1);
  animation: farewellTitleGlow 4s ease-in-out infinite alternate;
  will-change: text-shadow, filter;
}
@keyframes farewellTitleGlow {
  0% {
    text-shadow:
      0 0 10px rgba(138, 176, 151, 0.5),
      0 0 30px rgba(138, 176, 151, 0.3),
      0 0 60px rgba(138, 176, 151, 0.2);
    filter: brightness(1);
  }
  100% {
    text-shadow:
      0 0 20px rgba(138, 176, 151, 0.7),
      0 0 50px rgba(138, 176, 151, 0.5),
      0 0 80px rgba(138, 176, 151, 0.3),
      0 0 130px rgba(138, 176, 151, 0.15);
    filter: brightness(1.1);
  }
}
.farewell-divider {
  width: 140px;
  height: 1px;
  margin: 0 auto;
  background: linear-gradient(90deg, transparent, var(--brand-primary), transparent);
  position: relative;
  overflow: visible;
}
.farewell-divider::after {
  content: "✦";
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: var(--brand-primary);
  font-size: 14px;
  animation: farewellDividerStar 3s ease-in-out infinite;
}
@keyframes farewellDividerStar {
  0%,
  100% {
    opacity: 0.5;
    transform: translate(-50%, -50%) scale(0.8) rotate(0deg);
  }
  50% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1.2) rotate(180deg);
  }
}
.farewell-quote {
  font-family: "Be Vietnam Pro", sans-serif;
  letter-spacing: 0.2em;
  font-style: italic;
  opacity: 0;
}
.farewell-desc {
  opacity: 0;
  line-height: 1.9;
}
.farewell-lantern-btn {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 14px 40px;
  background: transparent;
  border: 1px solid rgba(138, 176, 151, 0.4);
  color: var(--brand-primary);
  font-family: "Be Vietnam Pro", sans-serif;
  font-size: 1rem;
  font-weight: 500;
  letter-spacing: 0.15em;
  border-radius: 50px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  opacity: 0;
  text-transform: uppercase;
}
.farewell-lantern-btn:hover {
  border-color: var(--brand-primary);
  background: rgba(138, 176, 151, 0.1);
  transform: translateY(-3px);
  box-shadow:
    0 0 25px rgba(138, 176, 151, 0.3),
    0 0 50px rgba(138, 176, 151, 0.15),
    0 10px 30px rgba(0, 0, 0, 0.3);
}
.farewell-lantern-btn:active {
  transform: scale(0.95) translateY(0);
}
.farewell-lantern-btn .lantern-emoji {
  font-size: 1.4em;
  animation: lanternSwing 2.5s ease-in-out infinite;
  display: inline-block;
}
@keyframes lanternSwing {
  0%,
  100% {
    transform: rotate(-8deg);
  }
  50% {
    transform: rotate(8deg);
  }
}
.farewell-lantern-btn .btn-ripple {
  position: absolute;
  border-radius: 50%;
  background: rgba(138, 176, 151, 0.3);
  transform: scale(0);
  animation: farewellRipple 0.6s ease-out;
  pointer-events: none;
}
@keyframes farewellRipple {
  to {
    transform: scale(4);
    opacity: 0;
  }
}
/* Floating memories */
.farewell-memories {
  position: absolute;
  inset: 0;
  z-index: 18;
  pointer-events: none;
  overflow: hidden;
}
.farewell-memory-card {
  position: absolute;
  width: 110px;
  height: 140px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  padding: 5px;
  backdrop-filter: blur(3px);
  opacity: 0;
  transition: opacity 2s ease;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}
.farewell-memory-card.visible {
  opacity: 0.55;
}
.farewell-memory-card img {
  width: 100%;
  height: 105px;
  object-fit: cover;
  object-position: left bottom;
  border-radius: 3px;
}
.farewell-memory-card .memory-label {
  font-size: 9px;
  color: rgba(255, 255, 255, 0.5);
  text-align: center;
  margin-top: 4px;
  font-family: "Dancing Script", cursive;
}
@keyframes farewellMemoryFloat {
  0%,
  100% {
    transform: translateY(0) rotate(var(--rot));
  }
  50% {
    transform: translateY(-15px) rotate(calc(var(--rot) * -1));
  }
}
/* Horizon glow line */
.farewell-horizon-glow {
  position: absolute;
  bottom: 15%;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(
    90deg,
    transparent 5%,
    rgba(138, 176, 151, 0.15) 20%,
    rgba(138, 176, 151, 0.35) 50%,
    rgba(138, 176, 151, 0.15) 80%,
    transparent 95%
  );
  z-index: 7;
  filter: blur(3px);
  animation: horizonPulse 5s ease-in-out infinite alternate;
}
@keyframes horizonPulse {
  0% {
    opacity: 0.4;
    filter: blur(3px);
  }
  100% {
    opacity: 0.8;
    filter: blur(6px);
  }
}
/* Farewell counter */
.farewell-counter {
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin-top: 1.5rem;
  opacity: 0;
}
.farewell-counter-item {
  text-align: center;
}
.farewell-counter-num {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--brand-primary);
  line-height: 1;
  text-shadow: 0 0 20px rgba(138, 176, 151, 0.3);
}
.farewell-counter-label {
  font-size: 0.7rem;
  color: var(--text-dark);
  letter-spacing: 0.15em;
  text-transform: uppercase;
  margin-top: 4px;
}

/* --- Kiểu cho Bản đồ Tương tác --- */
#map-section {
  position: relative;
  background-color: var(--bg-dark);
}

#map-container {
  position: relative;
  width: 100%;
  height: 600px;
  border-radius: 1rem;
  overflow: hidden;
  border: 2px solid var(--brand-secondary);
}

.mapboxgl-popup-content {
  background-color: rgba(18, 30, 23, 0.9) !important;
  backdrop-filter: blur(5px);
  color: var(--text-light) !important;
  border-radius: 8px !important;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.4) !important;
  font-family: "Be Vietnam Pro", sans-serif !important;
  max-width: 280px !important;
  border: 1px solid var(--brand-secondary);
  padding: 0 !important;
  overflow: hidden;
}

.mapboxgl-popup-close-button {
  color: var(--text-light) !important;
  font-size: 20px;
}

.mapboxgl-popup-anchor-bottom .mapboxgl-popup-tip {
  border-top-color: var(--brand-secondary) !important;
}

.mapboxgl-popup-anchor-top .mapboxgl-popup-tip {
  border-bottom-color: var(--brand-secondary) !important;
}

.mapboxgl-popup-anchor-left .mapboxgl-popup-tip {
  border-right-color: var(--brand-secondary) !important;
}

.mapboxgl-popup-anchor-right .mapboxgl-popup-tip {
  border-left-color: var(--brand-secondary) !important;
}

/* Force GPU compositing for smooth map panning */
.mapboxgl-marker {
  will-change: transform;
  backface-visibility: hidden;
  z-index: 2 !important;
}

.mapboxgl-marker.active-marker {
  z-index: 4 !important;
}

.mapboxgl-popup {
  z-index: 3 !important;
}

.custom-marker {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: var(--brand-primary);
  border: 2px solid var(--text-light);
  cursor: pointer;
  box-shadow: 0 0 10px var(--brand-primary);
  transition:
    background-color 0.3s ease,
    box-shadow 0.3s ease,
    border-color 0.3s ease;
}

.custom-marker:hover {
  box-shadow:
    0 0 18px var(--brand-primary),
    0 0 6px rgba(255, 255, 255, 0.4);
  border-color: var(--brand-primary);
}

.custom-marker.active {
  background-color: #fff;
  box-shadow: 0 0 18px var(--brand-primary);
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(138, 176, 151, 0.7);
  }

  70% {
    box-shadow: 0 0 0 15px rgba(138, 176, 151, 0);
  }

  100% {
    box-shadow: 0 0 0 0 rgba(138, 176, 151, 0);
  }
}

.mapboxgl-ctrl-attrib {
  display: none;
}

#map-locations-list {
  background-color: var(--bg-medium);
  border-radius: 1rem;
  padding: 1.5rem;
  max-height: 600px;
  overflow-y: auto;
}

#map-locations-list .location-item {
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  cursor: pointer;
  transition:
    background-color 0.3s,
    color 0.3s;
  border-left: 4px solid transparent;
}

#map-locations-list .location-item:hover,
#map-locations-list .location-item.active {
  background-color: var(--bg-dark);
  color: var(--brand-primary);
  border-left-color: var(--brand-primary);
  font-weight: 600;
}

:root {
  --brand-primary: #8ab097;
  /* Light Green for accents */
  --brand-secondary: #3a5f4b;
  /* Medium Green for buttons/hovers */
  --bg-dark: #121e17;
  /* Very Dark Green for main background */
  --bg-medium: #1a2b22;
  /* Dark Green for cards/sections */
  --text-light: #eae7d5;
  /* Beige for primary text */
  --text-dark: #cfccc0;
  /* Darker Beige for secondary text */
}

@font-face {
  font-family: "Rebel";
  src:
    url("/danasoul/Rebel/Web Fonts/Rebel.woff2") format("woff2"),
    url("/danasoul/Rebel/Web Fonts/Rebel.woff") format("woff"),
    url("/danasoul/Rebel/Web Fonts/Rebel.ttf") format("truetype");
  font-weight: normal;
  font-style: normal;
  font-display: block;
  /* Ẩn text cho đến khi font load xong */
}

body {
  font-family: "Be Vietnam Pro", sans-serif;
  background-color: var(--bg-dark);
  color: var(--text-light);
  overflow-x: hidden;
}

.font-logo {
  font-family: "Rebel", cursive;
  font-display: block;
}

.header-scrolled {
  background-color: rgba(18, 30, 23, 0.7);
  backdrop-filter: blur(10px);
}

.nav-link {
  position: relative;
  padding-bottom: 4px;
  transition: color 0.3s ease;
}

.nav-link::after {
  content: "";
  position: absolute;
  bottom: 0;
  left: 50%;
  width: 100%;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--brand-primary), transparent);
  transform: scaleX(0) translateX(-50%);
  transform-origin: center;
  transition: transform 0.4s cubic-bezier(0.22, 1, 0.36, 1);
}

.nav-link:hover::after {
  transform: scaleX(0.8) translateX(-50%);
}

.nav-link.active {
  color: var(--brand-primary) !important;
}

.nav-link.active::after {
  transform: scaleX(1) translateX(-50%);
  background: var(--brand-primary);
}

/* Mobile nav active state */
.nav-link-mobile.active {
  background-color: var(--brand-secondary) !important;
  border-left: 3px solid var(--brand-primary);
}

.destination-card-img-wrapper,
.culture-card-img-wrapper {
  overflow: hidden;
}

.destination-card-img-wrapper img,
.culture-card-img-wrapper img {
  transition: transform 0.4s ease;
}

.destination-card-img-wrapper img {
  object-position: left bottom;
}

.destination-card:hover .destination-card-img-wrapper img,
.culture-card:hover .culture-card-img-wrapper img {
  transform: scale(1.08);
}

.destination-card {
  opacity: 1 !important;
  visibility: visible !important;
}

.cursor-dot,
.cursor-outline {
  pointer-events: none;
  position: fixed;
  top: 50%;
  left: 50%;
  border-radius: 50%;
  z-index: 9999;
  transform: translate(-50%, -50%);
  display: none;
}

@media (min-width: 1024px) {
  .cursor-dot,
  .cursor-outline {
    display: block;
  }
}

.cursor-dot {
  width: 8px;
  height: 8px;
  background-color: var(--brand-primary);
}

.cursor-outline {
  width: 40px;
  height: 40px;
  background-color: rgba(138, 176, 151, 0.2);
  transition:
    transform 0.15s ease-out,
    width 0.2s,
    height 0.2s;
}

.cursor-outline.hover {
  transform: scale(1.5);
}

#scrolly {
  position: relative;
}

#scrolly-vis {
  position: sticky;
  top: 0;
  width: 100%;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

#scrolly-vis-content {
  position: relative;
  width: 45%;
  height: 70vh;
  max-width: 500px;
}

#scrolly-vis .scrolly-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 1rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  opacity: 0;
  transform: scale(0.95);
  transition:
    opacity 0.6s ease,
    transform 0.6s ease;
}

#scrolly-vis .scrolly-img.active {
  opacity: 1;
  transform: scale(1);
}

#scrolly article {
  position: relative;
  padding: 0 1rem;
  max-width: 32rem;
  margin: 0 auto;
}

.step {
  min-height: 100vh;
  display: flex;
  align-items: center;
}

.step p {
  background-color: rgba(26, 43, 34, 0.6);
  backdrop-filter: blur(8px);
  padding: 1.5rem;
  border-radius: 0.75rem;
  border: 1px solid rgba(234, 231, 213, 0.1);
  color: var(--text-light);
}

.lang-switcher button.active {
  color: var(--brand-primary);
  font-weight: 800;
}

/* ===== PREMIUM PRELOADER ===== */
#preloader {
  position: fixed;
  inset: 0;
  background-color: var(--bg-dark);
  z-index: 10000;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transition: opacity 0.8s ease-out 0.3s;
  overflow: hidden;
  pointer-events: all;
}

#preloader.hidden {
  opacity: 0;
  pointer-events: none;
}

body.loading {
  overflow: hidden;
  height: 100vh;
  position: fixed;
  width: 100%;
}

/* Logo container */
.preloader-logo-wrap {
  position: relative;
  margin-bottom: 48px;
}

.preloader-logo-wrap img {
  width: 120px;
  height: 120px;
  object-fit: contain;
  animation: preloaderLogoFloat 3s ease-in-out infinite;
  filter: drop-shadow(0 0 30px rgba(138, 176, 151, 0.4));
}

/* Glow ring around logo */
.preloader-logo-ring {
  position: absolute;
  inset: -18px;
  border-radius: 50%;
  border: 2px solid transparent;
  border-top-color: var(--brand-primary);
  border-right-color: var(--brand-secondary);
  animation: preloaderRingSpin 2s linear infinite;
}

.preloader-logo-ring-2 {
  position: absolute;
  inset: -10px;
  border-radius: 50%;
  border: 1px solid transparent;
  border-bottom-color: var(--brand-primary);
  border-left-color: rgba(138, 176, 151, 0.3);
  animation: preloaderRingSpin 3s linear infinite reverse;
}

@keyframes preloaderRingSpin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes preloaderLogoFloat {
  0%,
  100% {
    transform: translateY(0) scale(1);
  }
  50% {
    transform: translateY(-8px) scale(1.03);
  }
}

/* Title */
.preloader-title {
  opacity: 0;
  transform: translateY(10px);
  animation: preloaderFadeUp 0.8s 0.3s ease-out forwards;
}

.preloader-subtitle {
  opacity: 0;
  transform: translateY(8px);
  animation: preloaderFadeUp 0.8s 0.6s ease-out forwards;
  font-size: 0.85rem;
  letter-spacing: 4px;
  text-transform: uppercase;
  color: var(--text-dark);
  margin-top: 8px;
}

@keyframes preloaderFadeUp {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Progress bar */
.preloader-progress {
  position: absolute;
  bottom: 60px;
  left: 50%;
  transform: translateX(-50%);
  width: 180px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.preloader-progress-track {
  width: 100%;
  height: 2px;
  background: rgba(138, 176, 151, 0.15);
  border-radius: 2px;
  overflow: hidden;
}

.preloader-progress-fill {
  height: 100%;
  width: 0%;
  background: linear-gradient(90deg, var(--brand-secondary), var(--brand-primary));
  border-radius: 2px;
  transition: width 0.3s ease-out;
  box-shadow: 0 0 8px rgba(138, 176, 151, 0.5);
}

.preloader-progress-text {
  font-size: 0.7rem;
  letter-spacing: 3px;
  color: var(--text-dark);
  opacity: 0;
  animation: preloaderFadeUp 0.6s 0.8s ease-out forwards;
}

/* Ambient particles in preloader */
.preloader-particle {
  position: absolute;
  width: 2px;
  height: 2px;
  background: var(--brand-primary);
  border-radius: 50%;
  opacity: 0;
  animation: preloaderParticleFloat 4s ease-in-out infinite;
}

@keyframes preloaderParticleFloat {
  0% {
    opacity: 0;
    transform: translateY(0) scale(0);
  }
  20% {
    opacity: 0.6;
  }
  80% {
    opacity: 0.3;
  }
  100% {
    opacity: 0;
    transform: translateY(-100px) scale(1);
  }
}

/* ===== SECTION GRADIENT TRANSITIONS ===== */
/* Dark → Medium: sections going from --bg-dark to --bg-medium */
#about::before,
#destinations::before,
#history::before,
#planner::before,
#contact::before,
#map-section::before,
#cuisine::before,
#farewell::before,
#culture::before {
  content: "";
  position: absolute;
  top: -60px;
  left: 0;
  right: 0;
  height: 120px;
  z-index: 0;
  pointer-events: none;
}

#about,
#destinations,
#map-section,
#culture,
#history,
#cuisine,
#planner,
#farewell,
#contact {
  position: relative;
}

/* —— dark → dark (hero → about): no visible gradient needed —— */
#about::before {
  background: linear-gradient(to bottom, var(--bg-dark), transparent);
}

/* —— dark → medium (about → destinations) —— */
#destinations::before {
  background: linear-gradient(
    to bottom,
    var(--bg-dark) 0%,
    rgba(138, 176, 151, 0.06) 40%,
    var(--bg-medium) 100%
  );
}

/* —— medium → dark (destinations → map) —— */
#map-section::before {
  background: linear-gradient(
    to bottom,
    var(--bg-medium) 0%,
    rgba(138, 176, 151, 0.06) 40%,
    var(--bg-dark) 100%
  );
}

/* —— dark → dark (map → culture): same color, subtle glow —— */
#culture::before {
  background: linear-gradient(
    to bottom,
    var(--bg-dark) 0%,
    rgba(138, 176, 151, 0.04) 50%,
    var(--bg-dark) 100%
  );
}

/* —— dark → medium (culture → history) —— */
#history::before {
  background: linear-gradient(
    to bottom,
    var(--bg-dark) 0%,
    rgba(138, 176, 151, 0.06) 40%,
    var(--bg-medium) 100%
  );
}

/* —— medium → dark (history → cuisine) —— */
#cuisine::before {
  background: linear-gradient(
    to bottom,
    var(--bg-medium) 0%,
    rgba(138, 176, 151, 0.06) 40%,
    var(--bg-dark) 100%
  );
}

/* —— dark → medium (cuisine → planner) —— */
#planner::before {
  background: linear-gradient(
    to bottom,
    var(--bg-dark) 0%,
    rgba(138, 176, 151, 0.06) 40%,
    var(--bg-medium) 100%
  );
}

/* —— medium → black (planner → farewell) —— */
#farewell::before {
  background: linear-gradient(
    to bottom,
    var(--bg-medium) 0%,
    rgba(58, 95, 75, 0.08) 40%,
    transparent 100%
  );
  z-index: 11;
}

/* —— black/image → medium (farewell → contact) —— */
#contact::before {
  background: linear-gradient(
    to bottom,
    #000000 0%,
    rgba(138, 176, 151, 0.05) 40%,
    var(--bg-medium) 100%
  );
}

/* ===== SECTION TITLE ACCENT LINE ===== */
.section-title-accent {
  display: block;
  width: 60px;
  height: 3px;
  margin: 16px auto 0;
  border-radius: 3px;
  background: linear-gradient(
    90deg,
    var(--brand-secondary),
    var(--brand-primary),
    var(--brand-secondary)
  );
  background-size: 200% 100%;
  animation: accentShimmer 3s ease-in-out infinite;
}

@keyframes accentShimmer {
  0%,
  100% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
}

/* ===== PARALLAX ABOUT IMAGE ===== */
.about-parallax-wrapper {
  will-change: transform;
}

/* 🌟 ABOUT SECTION - IMMERSIVE UPGRADE */
.about-image-3d {
  perspective: 1000px;
  position: relative;
}

.about-image-3d-inner {
  transform-style: preserve-3d;
  transition: transform 0.4s ease;
  position: relative;
  border-radius: 1rem;
  overflow: hidden;
}

.about-image-3d:hover .about-image-3d-inner {
  box-shadow: 0 30px 60px rgba(0, 0, 0, 0.5);
}

/* Corner decorations */
.about-image-corner {
  position: absolute;
  width: 40px;
  height: 40px;
  border-color: var(--brand-primary);
  z-index: 10;
  opacity: 0;
  transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.about-image-3d:hover .about-image-corner {
  opacity: 1;
}

.corner-tl {
  top: -6px;
  left: -6px;
  border-top: 2px solid;
  border-left: 2px solid;
}
.corner-tr {
  top: -6px;
  right: -6px;
  border-top: 2px solid;
  border-right: 2px solid;
}
.corner-bl {
  bottom: -6px;
  left: -6px;
  border-bottom: 2px solid;
  border-left: 2px solid;
}
.corner-br {
  bottom: -6px;
  right: -6px;
  border-bottom: 2px solid;
  border-right: 2px solid;
}

.about-image-3d:hover .corner-tl {
  transform: translate(-4px, -4px);
}
.about-image-3d:hover .corner-tr {
  transform: translate(4px, -4px);
}
.about-image-3d:hover .corner-bl {
  transform: translate(-4px, 4px);
}
.about-image-3d:hover .corner-br {
  transform: translate(4px, 4px);
}

/* Floating location badge */
.about-floating-badge {
  position: absolute;
  padding: 8px 16px;
  background: rgba(18, 30, 23, 0.85);
  backdrop-filter: blur(10px);
  border: 1px solid var(--brand-secondary);
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--brand-primary);
  z-index: 15;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 6px;
  opacity: 0;
  transform: translateY(10px);
}

.about-floating-badge.visible {
  opacity: 1;
  transform: translateY(0);
  transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  animation: badgeFloat 4s ease-in-out infinite;
}

.about-floating-badge:nth-child(2) {
  animation-delay: 1s;
}
.about-floating-badge:nth-child(3) {
  animation-delay: 2s;
}

@keyframes badgeFloat {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-8px);
  }
}

.about-floating-badge .badge-dot {
  width: 6px;
  height: 6px;
  background: var(--brand-primary);
  border-radius: 50%;
  animation: badgeDotPulse 2s ease-in-out infinite;
}

@keyframes badgeDotPulse {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(1.3);
  }
}

/* Stats counter */
.about-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid rgba(138, 176, 151, 0.15);
}

.about-stat-item {
  text-align: center;
  position: relative;
}

.about-stat-number {
  font-size: 2rem;
  font-weight: 800;
  color: var(--brand-primary);
  line-height: 1;
  margin-bottom: 0.25rem;
  font-variant-numeric: tabular-nums;
}

.about-stat-label {
  font-size: 0.75rem;
  color: var(--text-dark);
  text-transform: uppercase;
  letter-spacing: 1.5px;
  font-weight: 600;
}

.about-stat-item::after {
  content: "";
  position: absolute;
  right: 0;
  top: 10%;
  height: 80%;
  width: 1px;
  background: linear-gradient(to bottom, transparent, rgba(138, 176, 151, 0.2), transparent);
}

.about-stat-item:last-child::after {
  display: none;
}

/* Tagline typewriter */
.about-tagline {
  font-family: "Dancing Script", cursive;
  font-size: 1.5rem;
  color: var(--brand-primary);
  margin-bottom: 1.5rem;
  min-height: 2rem;
  position: relative;
  display: inline-block;
}

.about-tagline .cursor-blink {
  display: inline-block;
  width: 2px;
  height: 1.3em;
  background: var(--brand-primary);
  margin-left: 2px;
  vertical-align: text-bottom;
  animation: cursorBlink 1s step-end infinite;
}

@keyframes cursorBlink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
}

/* Image overlay on hover */
.about-image-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    135deg,
    rgba(138, 176, 151, 0.1) 0%,
    transparent 50%,
    rgba(138, 176, 151, 0.05) 100%
  );
  opacity: 0;
  transition: opacity 0.5s ease;
  border-radius: 1rem;
  z-index: 5;
}

.about-image-3d:hover .about-image-overlay {
  opacity: 1;
}

/* Glow ring */
.about-image-glow {
  position: absolute;
  inset: -15px;
  border-radius: 1.5rem;
  background: radial-gradient(ellipse at center, rgba(138, 176, 151, 0.08) 0%, transparent 70%);
  z-index: -1;
  opacity: 0;
  transition: opacity 0.5s ease;
}

.about-image-3d:hover .about-image-glow {
  opacity: 1;
}

/* 🎬 HERO PARTICLES */
.hero-particle-layer {
  position: absolute;
  inset: 0;
  z-index: 15;
  pointer-events: none;
  overflow: hidden;
}

.hero-particle {
  position: absolute;
  width: 2px;
  height: 2px;
  background: rgba(138, 176, 151, 0.6);
  border-radius: 50%;
  animation: heroParticleFall linear infinite;
}

@keyframes heroParticleFall {
  0% {
    transform: translateY(-10vh) translateX(0);
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  90% {
    opacity: 0.5;
  }
  100% {
    transform: translateY(110vh) translateX(50px);
    opacity: 0;
  }
}

.hero-title-glow {
  text-shadow:
    0 0 20px rgba(138, 176, 151, 0.3),
    0 0 60px rgba(138, 176, 151, 0.1),
    2px 2px 10px rgba(0, 0, 0, 0.7) !important;
}

/* Scroll indicator enhanced */
.scroll-indicator-line {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 1px;
  height: 60px;
  overflow: hidden;
}

.scroll-indicator-line::after {
  content: "";
  position: absolute;
  top: -100%;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(to bottom, transparent, var(--brand-primary));
  animation: scrollLineDown 2s ease-in-out infinite;
}

@keyframes scrollLineDown {
  0% {
    top: -100%;
  }
  100% {
    top: 100%;
  }
}

@media (max-width: 768px) {
  /* ===== HERO MOBILE ===== */
  .hero-title-glow {
    text-shadow: 0 0 20px rgba(138, 176, 151, 0.15) !important;
  }
  .hero-particle-layer {
    display: none;
  }
  .scroll-indicator-line {
    display: none;
  }

  /* ===== ABOUT MOBILE ===== */
  .about-floating-badge {
    display: none;
  }
  .about-stats {
    grid-template-columns: repeat(3, 1fr);
    gap: 0.75rem;
  }
  .about-stat-number {
    font-size: 1.3rem;
  }
  .about-stat-label {
    font-size: 0.6rem;
    letter-spacing: 1px;
  }
  .about-stat-item::after {
    height: 24px;
  }
  .about-tagline {
    font-size: 0.8rem;
    letter-spacing: 2px;
    margin-bottom: 1rem;
  }
  .about-image-3d {
    margin-top: 2rem;
  }
  .about-image-3d-inner {
    height: 260px !important;
  }
  .about-image-corner {
    width: 16px;
    height: 16px;
  }
  .about-image-glow {
    display: none;
  }

  /* ===== CUISINE MOBILE ===== */
  .cuisine-scroll-menu .cuisine-menu-card {
    flex: 0 0 100px;
    height: 100px;
  }
  .cuisine-menu-card-label {
    font-size: 0.6rem;
    padding: 4px 6px;
  }
  .cuisine-location-item {
    padding: 0.4rem 0;
  }
  .cuisine-location-pin {
    width: 16px;
    height: 16px;
  }
  .cuisine-steam {
    display: none;
  }

  /* ===== PLANNER MOBILE ===== */
  .planner-style-card {
    min-width: 100%;
    padding: 1.2rem;
  }
  .planner-style-card .style-icon {
    width: 40px;
    height: 40px;
    margin-bottom: 0.5rem;
  }
  .planner-style-card .style-icon svg {
    width: 18px;
    height: 18px;
  }
  .planner-style-card .style-name {
    font-size: 0.85rem;
  }
  .planner-style-card .style-desc {
    font-size: 0.7rem;
  }
  .planner-day-tabs {
    gap: 2px;
  }
  .planner-day-tab {
    padding: 0.5rem 0.4rem;
    font-size: 0.75rem;
  }
  .planner-timeline::before {
    left: 14px;
  }
  .planner-timeline-item {
    padding-left: 40px;
    padding-right: 0.5rem;
  }
  .planner-timeline-item::before {
    width: 10px;
    height: 10px;
    left: 10px;
  }
  .planner-timeline-day-header {
    padding-left: 40px;
    font-size: 1rem;
  }
  .planner-timeline-day-header::before {
    width: 14px;
    height: 14px;
    left: 8px;
  }
  .planner-timeline-time {
    font-size: 0.7rem;
  }
  .planner-timeline-activity {
    font-size: 0.9rem;
  }
  .planner-timeline-desc {
    font-size: 0.75rem;
  }
  .planner-timeline-tip {
    font-size: 0.7rem;
    padding: 0.5rem 0.75rem;
  }

  /* ===== CULTURE COMPASS MOBILE ===== */
  #culture-interactive-wrapper {
    min-height: 400px !important;
  }
  #culture-compass .relative {
    width: 320px !important;
    height: 320px !important;
  }
  .compass-point .icon-wrapper {
    width: 36px;
    height: 36px;
  }
  .compass-point .icon-wrapper svg {
    width: 16px;
    height: 16px;
  }
  .compass-point .point-label {
    font-size: 0.55rem;
  }
  .sub-item {
    width: 28px;
    height: 28px;
  }
  .culture-content-card {
    padding: 1rem !important;
  }
  .culture-content-card .image-container {
    min-height: 200px;
  }
  .culture-content-card .content-title {
    font-size: 1.1rem;
  }
  .culture-content-card .content-desc {
    font-size: 0.8rem;
  }

  /* ===== FAREWELL MOBILE ===== */
  .farewell-title-main {
    font-size: clamp(2.5rem, 12vw, 4rem) !important;
  }
  .farewell-letterbox.active {
    height: 3vh;
  }
  .farewell-memory-card {
    display: none;
  }
  .farewell-quote {
    font-size: 0.7rem !important;
    letter-spacing: 0.12em !important;
  }
  .farewell-counter {
    gap: 1rem;
  }
  .farewell-counter-num {
    font-size: 1.8rem;
  }

  /* ===== FOOTER MOBILE ===== */
  footer .container {
    padding-top: 2rem;
    padding-bottom: 2rem;
  }
  footer .flex-wrap.gap-6 {
    gap: 1rem 1.5rem;
    font-size: 0.8rem;
  }
  footer img.h-24 {
    height: 4rem;
  }
  footer .font-logo.text-2xl {
    font-size: 1.25rem;
  }

  /* ===== MODAL MOBILE ===== */
  #destination-modal .max-w-4xl,
  #contact-modal .max-w-lg {
    max-height: 90vh;
    overflow-y: auto;
    margin: 0.5rem;
  }

  /* ===== MAP SECTION MOBILE ===== */
  #map-container {
    height: 300px !important;
  }
  #map-locations-list {
    max-height: 200px !important;
  }

  /* ===== PERFORMANCE: disable grain on mobile ===== */
  .grain-overlay {
    display: none;
  }

  /* ===== HERO CTA MOBILE ===== */
  .hero-cta {
    padding: 0.75rem 1.75rem;
    font-size: 0.85rem;
  }

  /* ===== MUSIC PLAYER MOBILE ===== */
  #play-pause-btn svg {
    width: 1.25rem;
    height: 1.25rem;
  }
  #volume-slider {
    width: 60px;
  }
}

/* ===== EXTRA SMALL SCREENS (< 480px) ===== */
@media (max-width: 480px) {
  .about-stats {
    gap: 0.5rem;
  }
  .about-stat-number {
    font-size: 1.1rem;
  }
  .about-stat-label {
    font-size: 0.55rem;
    letter-spacing: 0.5px;
  }
  .about-stat-item::after {
    height: 20px;
  }
  .about-image-3d-inner {
    height: 220px !important;
  }
  .cuisine-scroll-menu .cuisine-menu-card {
    flex: 0 0 85px;
    height: 85px;
  }
  .planner-style-card .style-name {
    font-size: 0.8rem;
  }
  .planner-style-card .style-desc {
    display: none;
  }
  #culture-compass .relative {
    width: 270px !important;
    height: 270px !important;
  }
  .compass-point .point-label {
    display: none;
  }
  footer .flex-wrap.gap-6 {
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }
}

/* ===== HERO CTA BUTTON ===== */
.hero-cta {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  margin-top: 32px;
  padding: 14px 36px;
  border: 2px solid rgba(138, 176, 151, 0.6);
  border-radius: 9999px;
  color: white;
  font-weight: 600;
  font-size: 1rem;
  backdrop-filter: blur(6px);
  background: rgba(138, 176, 151, 0.1);
  transition: all 0.4s ease;
  opacity: 0;
  cursor: pointer;
}

.hero-cta:hover {
  background: var(--brand-primary);
  color: var(--bg-dark);
  border-color: var(--brand-primary);
  transform: translateY(-2px);
  box-shadow: 0 12px 30px rgba(138, 176, 151, 0.35);
}

.hero-cta svg {
  transition: transform 0.3s ease;
}

.hero-cta:hover svg {
  transform: translateX(4px);
}

/* ===== DESTINATION CARD OVERLAY ENHANCEMENT ===== */
.dest-card-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to top,
    rgba(0, 0, 0, 0.8) 0%,
    rgba(0, 0, 0, 0.2) 40%,
    transparent 60%
  );
  transition: all 0.4s ease;
}

.destination-card:hover .dest-card-overlay {
  background: linear-gradient(
    to top,
    rgba(0, 0, 0, 0.9) 0%,
    rgba(0, 0, 0, 0.4) 50%,
    rgba(0, 0, 0, 0.1) 100%
  );
}

.dest-card-action {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(138, 176, 151, 0.2);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(138, 176, 151, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transform: translateY(-8px);
  transition: all 0.3s ease;
}

.destination-card:hover .dest-card-action {
  opacity: 1;
  transform: translateY(0);
}

.dest-card-action svg {
  width: 18px;
  height: 18px;
  stroke: white;
}

.dest-card-category {
  position: absolute;
  top: 16px;
  left: 16px;
  padding: 5px 14px;
  border-radius: 9999px;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 1px;
  text-transform: uppercase;
  background: rgba(18, 30, 23, 0.75);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(138, 176, 151, 0.5);
  color: #b8d8c4;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
}

@keyframes pulse-fade {
  0%,
  100% {
    opacity: 0.2;
    transform: scale(0.98);
  }

  50% {
    opacity: 1;
    transform: scale(1);
  }
}

.filter-btn {
  padding: 0.5rem 1.25rem;
  border-radius: 9999px;
  font-weight: 600;
  transition: all 0.3s ease;
  border: 2px solid transparent;
  background-color: var(--bg-medium);
  color: var(--text-dark);
}

.filter-btn:hover {
  background-color: var(--brand-secondary);
  color: var(--text-light);
}

.filter-btn.active {
  background-color: var(--brand-primary);
  color: var(--bg-dark);
  border-color: var(--brand-primary);
}

.modal-tab {
  padding: 8px 16px;
  border-bottom: 3px solid transparent;
  transition: all 0.3s ease;
  color: var(--text-dark);
  font-weight: 600;
}

.modal-tab.active {
  color: var(--brand-primary);
  border-bottom-color: var(--brand-primary);
}

.about-collage-img {
  will-change: opacity;
}

.cuisine-menu-item {
  transition:
    background-color 0.3s,
    color 0.3s,
    border-left-color 0.3s;
  border-left: 4px solid transparent;
}

.cuisine-menu-item.active,
.cuisine-menu-item:hover {
  background-color: var(--bg-medium);
  color: var(--text-light);
  border-left-color: var(--brand-primary);
}

/* 🍜 CUISINE STEAM EFFECT */
.cuisine-steam {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  overflow: hidden;
  border-radius: 0.5rem;
}

.steam-particle {
  position: absolute;
  bottom: 0;
  width: 8px;
  height: 8px;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.6), transparent);
  border-radius: 50%;
  filter: blur(4px);
  animation: steamRise 3s ease-out infinite;
}

.steam-particle:nth-child(1) {
  left: 20%;
  animation-delay: 0s;
}
.steam-particle:nth-child(2) {
  left: 35%;
  animation-delay: 0.5s;
}
.steam-particle:nth-child(3) {
  left: 50%;
  animation-delay: 1s;
}
.steam-particle:nth-child(4) {
  left: 65%;
  animation-delay: 1.5s;
}
.steam-particle:nth-child(5) {
  left: 80%;
  animation-delay: 0.3s;
}
.steam-particle:nth-child(6) {
  left: 25%;
  animation-delay: 2s;
}
.steam-particle:nth-child(7) {
  left: 70%;
  animation-delay: 0.8s;
}

@keyframes steamRise {
  0% {
    opacity: 0;
    transform: translateY(0) scale(1) translateX(0);
  }
  15% {
    opacity: 0.8;
  }
  50% {
    opacity: 0.4;
    transform: translateY(-60px) scale(2) translateX(10px);
  }
  100% {
    opacity: 0;
    transform: translateY(-120px) scale(3) translateX(-5px);
  }
}

/* 🍜 CUISINE HORIZONTAL SCROLL MENU */
.cuisine-scroll-menu {
  display: flex;
  gap: 1rem;
  overflow-x: auto;
  padding: 1rem 0 1.5rem;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
  -ms-overflow-style: none;
  list-style: none;
}

.cuisine-scroll-menu::-webkit-scrollbar {
  display: none;
}

.cuisine-scroll-menu .cuisine-menu-card {
  flex: 0 0 130px;
  scroll-snap-align: start;
  height: 130px;
  border-radius: 1rem;
  position: relative;
  overflow: hidden;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.3s ease;
}

.cuisine-scroll-menu .cuisine-menu-card.active {
  border-color: var(--brand-primary);
  box-shadow: 0 0 20px rgba(138, 176, 151, 0.4);
  transform: scale(1.05);
}

.cuisine-scroll-menu .cuisine-menu-card img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s ease;
}

.cuisine-scroll-menu .cuisine-menu-card:hover img {
  transform: scale(1.1);
}

.cuisine-menu-card-label {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 6px 8px;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.8), transparent);
  font-size: 0.7rem;
  font-weight: 700;
  color: white;
  text-align: center;
}

/* 🍜 CUISINE LOCATION PINS */
.cuisine-location-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.6rem 0;
  border-bottom: 1px solid rgba(138, 176, 151, 0.1);
  transition: all 0.2s ease;
}

.cuisine-location-item:hover {
  padding-left: 0.5rem;
  color: var(--brand-primary);
}

.cuisine-location-pin {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  background: var(--brand-primary);
  border-radius: 50% 50% 50% 0;
  transform: rotate(-45deg);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 2px;
}

.cuisine-location-pin::after {
  content: "";
  width: 6px;
  height: 6px;
  background: var(--bg-dark);
  border-radius: 50%;
  transform: rotate(45deg);
}

/* 🗓️ PLANNER STYLE CARDS */
.planner-style-card {
  position: relative;
  padding: 1.5rem;
  border-radius: 1rem;
  background: var(--bg-dark);
  border: 2px solid var(--brand-secondary);
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  text-align: center;
}

.planner-style-card::before {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(138, 176, 151, 0.1), transparent);
  opacity: 0;
  transition: opacity 0.4s ease;
}

.planner-style-card:hover::before {
  opacity: 1;
}

.planner-style-card:hover {
  border-color: var(--brand-primary);
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(138, 176, 151, 0.2);
}

.planner-style-card.active {
  border-color: var(--brand-primary);
  background: linear-gradient(135deg, rgba(138, 176, 151, 0.15), var(--bg-dark));
  box-shadow: 0 0 30px rgba(138, 176, 151, 0.3);
}

.planner-style-card .style-icon {
  width: 48px;
  height: 48px;
  margin: 0 auto 0.75rem;
  background: var(--bg-medium);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.planner-style-card.active .style-icon {
  background: var(--brand-primary);
}

.planner-style-card .style-icon svg {
  color: var(--brand-primary);
  transition: color 0.3s ease;
}

.planner-style-card.active .style-icon svg {
  color: var(--bg-dark);
}

.planner-style-card .style-name {
  font-weight: 700;
  font-size: 1rem;
  color: var(--text-light);
  margin-bottom: 0.25rem;
}

.planner-style-card .style-desc {
  font-size: 0.75rem;
  color: var(--text-dark);
  line-height: 1.4;
}

/* 🗓️ PLANNER DAY TABS */
.planner-day-tabs {
  display: flex;
  background: var(--bg-medium);
  border-radius: 9999px;
  padding: 4px;
  position: relative;
  overflow: hidden;
}

.planner-day-tab {
  flex: 1;
  padding: 0.75rem 1rem;
  text-align: center;
  font-weight: 700;
  color: var(--text-dark);
  border-radius: 9999px;
  cursor: pointer;
  transition: all 0.3s ease;
  z-index: 1;
  position: relative;
}

.planner-day-tab.active {
  color: var(--bg-dark);
}

.planner-day-indicator {
  position: absolute;
  top: 4px;
  bottom: 4px;
  border-radius: 9999px;
  background: var(--brand-primary);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 0;
}

/* 🗓️ PLANNER TIMELINE */
.planner-timeline {
  position: relative;
  padding-left: 2rem;
}

.planner-timeline::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 2px;
  background: linear-gradient(
    to bottom,
    var(--brand-secondary),
    var(--brand-primary),
    var(--brand-secondary)
  );
}

.planner-timeline-day {
  margin-bottom: 2rem;
}

.planner-timeline-day-header {
  position: relative;
  padding: 0.75rem 1.25rem;
  background: var(--brand-primary);
  color: var(--bg-dark);
  font-weight: 800;
  border-radius: 0.5rem;
  margin-bottom: 1.5rem;
  margin-left: 1rem;
  display: inline-block;
}

.planner-timeline-day-header::before {
  content: "";
  position: absolute;
  left: -2.1rem;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  background: var(--brand-primary);
  border: 3px solid var(--bg-dark);
  border-radius: 50%;
  box-shadow: 0 0 10px rgba(138, 176, 151, 0.5);
}

.planner-timeline-item {
  position: relative;
  margin-left: 1rem;
  margin-bottom: 1rem;
  padding: 1.25rem 1.5rem;
  background: var(--bg-medium);
  border-radius: 0.75rem;
  border-left: 3px solid var(--brand-secondary);
  transition: all 0.3s ease;
  opacity: 0;
  transform: translateX(-20px);
}

.planner-timeline-item.revealed {
  opacity: 1;
  transform: translateX(0);
}

.planner-timeline-item::before {
  content: "";
  position: absolute;
  left: -1.85rem;
  top: 1.5rem;
  width: 10px;
  height: 10px;
  background: var(--bg-dark);
  border: 2px solid var(--brand-secondary);
  border-radius: 50%;
}

.planner-timeline-item:hover {
  border-left-color: var(--brand-primary);
  transform: translateX(4px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.planner-timeline-item:hover::before {
  border-color: var(--brand-primary);
  background: var(--brand-primary);
}

.planner-timeline-time {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 700;
  color: var(--brand-primary);
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
}

.planner-timeline-time svg {
  width: 16px;
  height: 16px;
}

.planner-timeline-activity {
  font-weight: 700;
  color: var(--text-light);
  font-size: 1.1rem;
  margin-bottom: 0.35rem;
}

.planner-timeline-desc {
  color: var(--text-dark);
  font-size: 0.9rem;
  line-height: 1.6;
}

.planner-timeline-tip {
  margin-top: 0.75rem;
  padding: 0.6rem 0.75rem;
  background: rgba(138, 176, 151, 0.08);
  border-radius: 0.5rem;
  font-size: 0.8rem;
  color: var(--brand-primary);
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
}

.planner-timeline-tip svg {
  flex-shrink: 0;
  width: 14px;
  height: 14px;
  margin-top: 2px;
}

.planner-option-btn {
  background-color: var(--bg-medium);
  color: var(--text-dark);
  border: 2px solid var(--brand-secondary);
  transition: all 0.3s ease;
}

.planner-option-btn.active {
  background-color: var(--brand-primary);
  border-color: var(--brand-primary);
  color: var(--bg-dark);
  font-weight: 700;
}

input[type="range"] {
  -webkit-appearance: none;
  appearance: none;
  background: transparent;
}

input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  height: 16px;
  width: 16px;
  border-radius: 50%;
  background: var(--brand-primary);
  cursor: pointer;
  margin-top: -6px;
}

input[type="range"]::-moz-range-thumb {
  height: 16px;
  width: 16px;
  border-radius: 50%;
  background: var(--brand-primary);
  cursor: pointer;
}

input[type="range"]::-webkit-slider-runnable-track {
  width: 100%;
  height: 4px;
  cursor: pointer;
  background: var(--brand-secondary);
  border-radius: 5px;
}

input[type="range"]::-moz-range-track {
  width: 100%;
  height: 4px;
  cursor: pointer;
  background: var(--brand-secondary);
  border-radius: 5px;
}

/* farewell canvas styling moved to epic farewell block above */

#play-pause-btn {
  transition:
    box-shadow 0.2s linear,
    background-color 0.3s ease,
    transform 0.3s ease;
}

#play-pause-btn svg {
  position: absolute;
  transition:
    opacity 0.25s ease,
    transform 0.25s ease;
}

#play-pause-btn svg.icon-hidden {
  opacity: 0;
  transform: scale(0.5);
  pointer-events: none;
}

#play-pause-btn svg.icon-visible {
  opacity: 1;
  transform: scale(1);
}

#volume-slider {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 4px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 5px;
  outline: none;
  transition: opacity 0.2s;
}

#volume-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 14px;
  height: 14px;
  background: var(--text-light);
  cursor: pointer;
  border-radius: 50%;
  border: 2px solid var(--brand-secondary);
}

#volume-slider::-moz-range-thumb {
  width: 14px;
  height: 14px;
  background: var(--text-light);
  cursor: pointer;
  border-radius: 50%;
  border: 2px solid var(--brand-secondary);
}

/* =========================================================== */
/* BẮT ĐẦU: CSS CHO LA BÀN VĂN HÓA (CULTURE COMPASS)       */
/* =========================================================== */
.compass-point {
  position: absolute;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transition: transform 0.3s ease;
}

.compass-point:hover {
  transform: translate(-50%, -50%) scale(1.1);
}

.compass-point .icon-wrapper {
  width: 80px;
  height: 80px;
  background-color: var(--bg-medium);
  border: 2px solid var(--brand-secondary);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.4);
}

.compass-point:hover .icon-wrapper {
  background-color: var(--brand-primary);
  border-color: var(--text-light);
}

.compass-point .icon-wrapper svg {
  width: 40px;
  height: 40px;
  color: var(--brand-primary);
  transition: color 0.3s ease;
}

.compass-point:hover .icon-wrapper svg {
  color: var(--bg-dark);
}

.compass-point .point-label {
  margin-top: 12px;
  font-weight: 700;
  font-size: 1.1rem;
  color: var(--text-light);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.sub-item-container {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.sub-item {
  position: absolute;
  transform: translate(-50%, -50%);
  cursor: pointer;
  opacity: 0;
  transition:
    opacity 0.4s ease,
    transform 0.4s ease;
  pointer-events: auto;
}

.sub-item .sub-item-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background-size: cover;
  background-position: center;
  border: 2px solid var(--brand-secondary);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.5);
  transition: all 0.3s ease;
}

.sub-item:hover .sub-item-icon {
  transform: scale(1.15);
  border-color: var(--brand-primary);
  box-shadow: 0 0 20px var(--brand-primary);
}

.sub-item .sub-item-tooltip {
  position: absolute;
  bottom: 110%;
  left: 50%;
  transform: translateX(-50%);
  background-color: var(--bg-dark);
  color: var(--text-light);
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 0.8rem;
  white-space: nowrap;
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
  border: 1px solid var(--brand-secondary);
}

.sub-item:hover .sub-item-tooltip {
  opacity: 1;
}

#culture-content-display.visible {
  opacity: 1;
  pointer-events: auto;
  transform: scale(1);
}

#culture-compass.hidden {
  opacity: 0;
  pointer-events: none;
  transform: scale(0.9);
}

.culture-content-card {
  background-color: var(--bg-medium);
  border-radius: 1rem;
  padding: 2rem;
  max-width: 900px;
  margin: auto;
  height: 100%;
  overflow-y: auto;
  border: 1px solid var(--brand-secondary);
  display: flex;
  gap: 2rem;
}

@media (max-width: 768px) {
  .culture-content-card {
    flex-direction: column;
    padding: 1.5rem;
  }
}

.culture-content-card .image-container {
  flex: 0 0 40%;
  min-height: 300px;
}

.culture-content-card .image-container img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 0.75rem;
}

.culture-content-card .text-container {
  flex: 1 1 60%;
}

.culture-content-card .content-category {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--brand-primary);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.culture-content-card .content-title {
  font-size: 2rem;
  font-weight: 800;
  color: var(--text-light);
  margin-top: 0.5rem;
  margin-bottom: 1rem;
}

.culture-content-card .content-desc {
  font-size: 1rem;
  line-height: 1.7;
  color: var(--text-dark);
}

.culture-back-button {
  background-color: var(--brand-secondary);
  color: var(--text-light);
  font-weight: 600;
  padding: 0.75rem 1.5rem;
  border-radius: 9999px;
  transition: all 0.3s ease;
  margin-top: 1.5rem;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.culture-back-button:hover {
  background-color: var(--brand-primary);
  color: var(--bg-dark);
}

/* =========================================================== */
/* KẾT THÚC: CSS CHO LA BÀN VĂN HÓA                           */
/* =========================================================== */
@keyframes rotate-compass {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

@keyframes counter-rotate-compass {
  from {
    transform: translate(-50%, -50%) rotate(0deg);
  }

  to {
    transform: translate(-50%, -50%) rotate(-360deg);
  }
}

#compass-points {
  animation: rotate-compass 45s linear infinite;
}

.compass-point {
  animation: counter-rotate-compass 45s linear infinite;
}

::-webkit-scrollbar {
  width: 12px;
  height: 12px;
}

::-webkit-scrollbar-track {
  background: var(--bg-dark);
}

::-webkit-scrollbar-thumb {
  background-color: var(--brand-secondary);
  border-radius: 20px;
  border: 3px solid var(--bg-dark);
  transition: background-color 0.2s ease-in-out;
}

::-webkit-scrollbar-thumb:hover {
  background-color: var(--brand-primary);
}

html,
#map-locations-list,
#map-modal-content,
#cuisine-details-container {
  scrollbar-width: thin;
  scrollbar-color: var(--brand-primary) var(--bg-dark);
}

/* 🎨 MODERN PREMIUM GALLERY EFFECTS 🎨 */
.modern-gallery-container {
  transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Glass Morphism Overlay */
.glass-overlay {
  transition: backdrop-filter 0.5s ease;
}

.modern-gallery-container:hover .glass-overlay {
  backdrop-filter: blur(20px);
}

/* Premium Image Effects */
.premium-image {
  filter: contrast(1.1) saturate(1.1);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.4);
}

/* Minimal Glow - Subtle and Sophisticated */
.minimal-glow {
  backdrop-filter: blur(1px);
}

/* Sophisticated Border - Clean and Modern */
.sophisticated-border {
  transition: opacity 0.4s ease;
}

.modern-gallery-container:hover .sophisticated-border {
  opacity: 0.8;
}

/* Ambient Light Beams - Very Subtle */
.ambient-beam {
  animation: subtleGlow 4s ease-in-out infinite alternate;
}

.ambient-beam-2 {
  animation: subtleGlow 5s ease-in-out infinite alternate;
  animation-delay: 2s;
}

@keyframes subtleGlow {
  0% {
    opacity: 0.1;
  }

  100% {
    opacity: 0.3;
  }
}

/* 🌟 PREMIUM SPACING & TYPOGRAPHY 🌟 */
section {
  padding: 6rem 0 !important;
}

.container {
  padding-left: 3rem !important;
  padding-right: 3rem !important;
}

/* Enhanced spacing for text blocks */
h1,
h2,
h3,
h4,
h5,
h6 {
  margin-bottom: 2rem !important;
  line-height: 1.3 !important;
  letter-spacing: -0.02em !important;
}

p {
  margin-bottom: 1.5rem !important;
  line-height: 1.8 !important;
  /* Increased from 1.7 for better readability */
  max-width: 65ch;
}

/* Enhanced typography for specific content */
.modal-content p,
.tab-pane p,
#modal-content p {
  line-height: 1.8 !important;
  font-size: 1rem !important;
  color: rgba(255, 255, 255, 0.9) !important;
}

/* Description text in cards */
.destination-card p,
.culture-card p {
  line-height: 1.7 !important;
}

/* Long form content */
.content-section p,
.about-text p,
.description-text p {
  line-height: 1.9 !important;
  font-size: 1.1rem !important;
  margin-bottom: 1.75rem !important;
}

/* Card spacing improvements */
.destination-card,
.culture-card {
  margin-bottom: 3rem !important;
  padding: 0 !important;
  /* Remove padding for overlay design */
}

/* Specific styling for destination cards with overlay */
.destination-card {
  border-radius: 12px !important;
  overflow: hidden !important;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3) !important;
  transition: all 0.3s ease !important;
}

.destination-card:hover {
  transform: translateY(-8px) !important;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4) !important;
}

/* Culture cards keep padding for different layout */
.culture-card {
  padding: 2rem !important;
}

/* Modal text content spacing */
#modal-content p {
  margin-bottom: 1.5rem !important;
  line-height: 1.8 !important;
}

#modal-content .p-6 {
  padding: 3rem !important;
}

/* Grid improvements */
.grid {
  gap: 3rem !important;
}

/* List spacing */
ul,
ol {
  margin-bottom: 2rem !important;
}

li {
  margin-bottom: 0.75rem !important;
}

/* Mobile responsive spacing */
@media (max-width: 768px) {
  section {
    padding: 4rem 0 !important;
  }

  .container {
    padding-left: 1.5rem !important;
    padding-right: 1.5rem !important;
  }

  h1,
  h2,
  h3 {
    margin-bottom: 1.5rem !important;
  }

  .destination-card,
  .culture-card {
    margin-bottom: 2rem !important;
    padding: 0 !important;
  }

  .culture-card {
    padding: 1.5rem !important;
  }

  .destination-card .absolute.bottom-0 {
    padding: 1.5rem !important;
  }

  #modal-content .p-6 {
    padding: 2rem !important;
  }
}

/* 🚀 BACK TO TOP BUTTON 🚀 */
#back-to-top {
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  transform: translateY(0);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

#back-to-top.show {
  opacity: 1 !important;
  visibility: visible !important;
  transform: translateY(0) !important;
}

#back-to-top:hover {
  background: linear-gradient(135deg, var(--brand-secondary), var(--brand-primary));
  transform: translateY(-2px) scale(1.1);
}

#back-to-top:active {
  transform: translateY(0) scale(1.05);
}

/* Floating animation */
#back-to-top.show {
  animation: floatButton 3s ease-in-out infinite;
}

@keyframes floatButton {
  0%,
  100% {
    transform: translateY(0px);
  }

  50% {
    transform: translateY(-5px);
  }
}

/* Mobile responsive */
@media (max-width: 768px) {
  #back-to-top {
    bottom: 1rem;
    right: 1rem;
    width: 3rem;
    height: 3rem;
  }

  #back-to-top svg {
    width: 1.25rem;
    height: 1.25rem;
  }
}

/* 🎬 HERO VIDEO STYLING 🎬 */
#hero-video {
  filter: brightness(0.8) contrast(1.1) saturate(1.1);
  transition: filter 0.3s ease;
}

#hero-video:hover {
  filter: brightness(0.9) contrast(1.2) saturate(1.2);
}

/* Video loading state */
#hero-video:not([src]):not([srcset]) {
  background: linear-gradient(45deg, var(--bg-dark), var(--bg-medium));
}

/* ===== FILM GRAIN OVERLAY ===== */
.grain-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 9999;
  opacity: 0.04;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
  background-repeat: repeat;
  background-size: 200px 200px;
}
</style>
