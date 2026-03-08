export function getLearningBlogHtml(publicShareUrl: string): string {
  return `<!doctype html>
<html lang="vi">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Bug War Room Knowledge Blog</title>
    <style>
      :root {
        color-scheme: dark;
        --bg: #0b1621;
        --panel: #122233;
        --line: #26384c;
        --text: #f3f6fa;
        --muted: #93a8bc;
        --amber: #ffb830;
        --coral: #ff6b4a;
        --sky: #38bdf8;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        color: var(--text);
        background:
          radial-gradient(circle at 0% 0%, rgba(255, 107, 74, 0.1), transparent 38%),
          radial-gradient(circle at 100% 0%, rgba(56, 189, 248, 0.12), transparent 42%),
          var(--bg);
        padding: 18px;
      }
      .layout { max-width: 1020px; margin: 0 auto; display: grid; gap: 12px; }
      .panel { border: 1px solid var(--line); background: var(--panel); padding: 14px; }
      .toc-panel { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; justify-content: space-between; }
      .action-list { display: flex; flex-wrap: wrap; gap: 8px; }
      .action-link {
        text-decoration: none;
        border: 1px solid var(--line);
        background: rgba(11, 22, 33, 0.8);
        color: var(--sky);
        padding: 6px 10px;
        font-size: 12px;
        cursor: pointer;
      }
      .action-link:hover { border-color: var(--sky); }
      .blog-action {
        border: 1px solid var(--line);
        background: rgba(56, 189, 248, 0.12);
        color: var(--text);
        padding: 8px 12px;
        cursor: pointer;
        font-size: 12px;
      }
      .blog-action:hover { border-color: var(--sky); background: rgba(56, 189, 248, 0.2); }
      h1 { margin: 0 0 4px; font-size: 30px; }
      h2 { margin: 0 0 10px; font-size: 18px; }
      h3 { margin: 0 0 8px; }
      .sub { margin: 0; color: var(--muted); font-size: 12px; }
      .hero {
        border: 1px solid var(--line);
        background: rgba(11, 22, 33, 0.84);
        padding: 18px;
      }
      .blog-home-list { display: grid; gap: 10px; }
      .blog-controls { display: grid; gap: 10px; margin-bottom: 12px; }
      .search-input {
        width: 100%;
        border: 1px solid var(--line);
        background: rgba(8, 14, 22, 0.72);
        color: var(--text);
        padding: 10px 12px;
        font-size: 13px;
      }
      .search-input::placeholder { color: var(--muted); }
      .combo-group { display: grid; gap: 6px; }
      .combo-label { color: var(--muted); font-size: 11px; letter-spacing: 0.08em; }
      .combo-input {
        width: 100%;
        border: 1px solid var(--line);
        background: rgba(8, 14, 22, 0.72);
        color: var(--text);
        padding: 9px 12px;
        font-size: 13px;
      }
      .combo-input::placeholder { color: var(--muted); }
      .combo-help { margin: 0; color: var(--muted); font-size: 11px; }
      .combo-actions { display: flex; flex-wrap: wrap; gap: 8px; }
      .combo-action-btn {
        border: 1px solid var(--line);
        background: rgba(11, 22, 33, 0.8);
        color: #b8dff5;
        padding: 6px 10px;
        font-size: 11px;
        cursor: pointer;
      }
      .combo-action-btn:hover { border-color: var(--sky); color: var(--sky); }
      .home-result-count { margin: 0; color: var(--muted); font-size: 12px; }
      .post-card { border: 1px solid var(--line); background: rgba(8, 14, 22, 0.72); padding: 14px; display: grid; gap: 8px; }
      .post-cover {
        width: 100%;
        max-height: 220px;
        object-fit: cover;
        border: 1px solid rgba(38, 56, 76, 0.75);
      }
      .post-title-btn {
        border: 0;
        background: transparent;
        color: var(--text);
        font-size: 22px;
        text-align: left;
        padding: 0;
        cursor: pointer;
      }
      .post-title-btn:hover { color: var(--sky); }
      .post-meta { margin: 0; color: var(--muted); font-size: 12px; }
      .post-excerpt { margin: 0; color: #dce8f5; line-height: 1.6; }
      .blog-post { display: grid; gap: 12px; }
      .post-kicker { margin: 0; color: var(--coral); font-size: 11px; letter-spacing: 0.12em; }
      .tags { display: flex; flex-wrap: wrap; gap: 8px; }
      .tag { border: 1px solid var(--line); background: rgba(8, 14, 22, 0.72); color: var(--amber); padding: 4px 8px; font-size: 11px; }
      .tag-clickable { cursor: pointer; }
      .detail-cover {
        width: 100%;
        max-height: 340px;
        object-fit: cover;
        border: 1px solid rgba(38, 56, 76, 0.75);
      }
      .image-links {
        border: 1px dashed rgba(147, 168, 188, 0.45);
        background: rgba(8, 14, 22, 0.4);
        padding: 10px;
      }
      .image-links p { margin: 0 0 8px; color: var(--muted); font-size: 12px; }
      .image-links ul { margin: 0; padding-left: 18px; display: grid; gap: 6px; }
      .image-links a { color: var(--sky); text-decoration: underline; text-underline-offset: 2px; }
      .home-empty {
        border: 1px dashed rgba(147, 168, 188, 0.45);
        background: rgba(8, 14, 22, 0.4);
        color: var(--muted);
        padding: 16px;
        font-size: 13px;
      }
      .detail-layout { display: grid; gap: 12px; }
      @media (min-width: 1040px) {
        .detail-layout { grid-template-columns: 280px 1fr; }
      }
      .toc-side {
        border: 1px solid var(--line);
        background: rgba(8, 14, 22, 0.82);
        padding: 12px;
      }
      @media (min-width: 1040px) {
        .toc-side { position: sticky; top: 16px; max-height: calc(100vh - 40px); overflow: auto; }
      }
      .toc-side-list { display: grid; gap: 8px; }
      .toc-side-link {
        border: 1px solid rgba(38, 56, 76, 0.75);
        background: rgba(11, 22, 33, 0.8);
        color: #b8dff5;
        text-decoration: none;
        padding: 6px 8px;
        font-size: 12px;
      }
      .toc-side-link.active {
        color: var(--amber);
        border-color: rgba(255, 184, 48, 0.75);
      }
      .blog-reading-note {
        margin: 0;
        border: 1px solid rgba(56, 189, 248, 0.35);
        background: rgba(56, 189, 248, 0.08);
        color: #d6ecff;
        padding: 10px;
        font-size: 12px;
        line-height: 1.6;
      }
      .blog-section {
        border: 1px solid rgba(38, 56, 76, 0.75);
        background: rgba(8, 14, 22, 0.55);
        padding: 12px;
        display: grid;
        gap: 10px;
      }
      .blog-section-heading {
        margin: 0;
        display: flex;
        align-items: center;
        gap: 8px;
        color: var(--sky);
        font-size: 16px;
      }
      .section-index {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 24px;
        height: 24px;
        border: 1px solid rgba(56, 189, 248, 0.5);
        color: var(--amber);
        font-size: 12px;
        background: rgba(11, 22, 33, 0.8);
      }
      .section-points {
        margin: 0;
        padding-left: 20px;
        display: grid;
        gap: 8px;
      }
      .section-points li {
        font-size: 14px;
        line-height: 1.7;
        color: #dce8f5;
      }
      .section-points li::marker {
        color: var(--amber);
      }
      .signal-list { margin: 0; padding-left: 18px; display: grid; gap: 6px; color: #dce8f5; font-size: 13px; }
      .signal-list strong { color: var(--coral); }
      .muted { margin: 0; font-size: 13px; color: var(--muted); }
      .footer { color: var(--sky); font-size: 13px; }
      .hidden { display: none !important; }
      .export-hint { color: var(--muted); font-size: 11px; }
      .back-top {
        position: fixed;
        right: 16px;
        bottom: 16px;
        border: 1px solid var(--line);
        background: rgba(11, 22, 33, 0.9);
        color: var(--text);
        padding: 8px 11px;
        cursor: pointer;
        display: none;
      }
      a { color: var(--sky); }
      @media print {
        .toc-panel,
        .toc-side,
        .back-top { display: none !important; }
        body { background: #fff; color: #111; padding: 0; }
        .panel,
        .hero,
        .post-card,
        .toc-side,
        .blog-post { border-color: #999; background: #fff; color: #111; }
        .blog-section p,
        .section-points li,
        .post-excerpt,
        .signal-list,
        .post-meta,
        .muted,
        .footer { color: #222 !important; }
      }
    </style>
  </head>
  <body>
    <div class="layout">
      <section class="panel toc-panel" id="toc">
        <div class="action-list">
          <button id="blog-home-btn" class="action-link" type="button">Trang Chủ Blog</button>
          <button id="blog-back-list-btn" class="action-link hidden" type="button">Quay Lại Danh Sách</button>
        </div>
        <div>
          <button id="blog-export-pdf-btn" class="blog-action" type="button">Export Blog PDF</button>
          <p class="export-hint">Xuất PDF từ trang đang mở trong blog (Home hoặc Detail).</p>
        </div>
      </section>

      <section class="hero" id="overview">
          <p class="sub">// BUG WAR ROOM KNOWLEDGE BLOG</p>
          <h1>Engineering Notes Từ Bug War Room</h1>
          <p class="sub">Trang chủ hiển thị danh sách bài viết. Chọn bài để mở trang chi tiết và dùng mục lục bên cạnh để nhảy nhanh giữa các đề mục.</p>
      </section>

      <section id="blog-home" class="panel">
        <h2>Bài Viết Mới Nhất</h2>
        <div class="blog-controls">
          <input id="blog-search-input" class="search-input" type="search" placeholder="Tìm theo tiêu đề, mô tả, nội dung, tác giả hoặc tag..." />
          <div class="combo-group">
            <label class="combo-label" for="blog-tag-combobox">FILTER TAG (COMBOBOX - CÓ THỂ GÕ ĐỂ TÌM)</label>
            <input id="blog-tag-combobox" class="combo-input" list="blog-tag-options" placeholder="Ví dụ: rollback, incident, observability..." />
            <datalist id="blog-tag-options"></datalist>
            <div class="combo-actions">
              <button id="blog-clear-tag-filter-btn" type="button" class="combo-action-btn">Xóa Lọc Tag</button>
              <button id="blog-reset-all-filter-btn" type="button" class="combo-action-btn">Reset Tất Cả Lọc</button>
            </div>
            <p class="combo-help">Bấm vào ô để gõ đè tag cũ ngay. Nhấn <strong>Esc</strong> để xóa nhanh lọc tag.</p>
          </div>
          <div class="combo-group">
            <label class="combo-label" for="blog-sort-combobox">SORT (COMBOBOX)</label>
            <input id="blog-sort-combobox" class="combo-input" list="blog-sort-options" placeholder="newest" value="newest" />
            <datalist id="blog-sort-options">
              <option value="newest"></option>
              <option value="oldest"></option>
              <option value="read-long"></option>
              <option value="read-short"></option>
              <option value="title-az"></option>
              <option value="title-za"></option>
            </datalist>
            <p class="combo-help">Giá trị hỗ trợ: <strong>newest</strong>, <strong>oldest</strong>, <strong>read-long</strong>, <strong>read-short</strong>, <strong>title-az</strong>, <strong>title-za</strong>.</p>
          </div>
          <p id="blog-home-result-count" class="home-result-count"></p>
        </div>
        <div id="blog-home-list" class="blog-home-list"></div>
      </section>

      <section id="blog-detail" class="panel hidden">
        <div class="detail-layout">
          <aside class="toc-side">
            <h3>Mục Lục Bài Viết</h3>
            <div id="blog-detail-toc" class="toc-side-list"></div>
          </aside>
          <article id="blog-detail-content" class="blog-post"></article>
        </div>
      </section>

      <section class="panel" id="recent-signals">
        <h2>Recent Signals From Your Run</h2>
        <ul id="blog-signal-list" class="signal-list"></ul>
        <p id="blog-signal-empty" class="muted hidden">Chưa có signal nào từ run hiện tại.</p>
      </section>

      <section class="panel footer" id="play-link">
        Play at <a href="${publicShareUrl}" target="_blank" rel="noopener noreferrer">${publicShareUrl}</a>
      </section>
    </div>
    <button id="blog-back-to-top" class="back-top" type="button">Back to top</button>
  </body>
</html>`
}

export function getAnimationCatalogHtml(cardsHtml: string): string {
  return `<!doctype html>
<html lang="vi">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Bug War Room Animation Catalog</title>
    <style>
      :root {
        color-scheme: dark;
        --bg: #0b1621;
        --panel: #122233;
        --line: #26384c;
        --text: #f3f6fa;
        --muted: #93a8bc;
        --amber: #ffb830;
        --sky: #38bdf8;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        padding: 18px;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        color: var(--text);
        background:
          radial-gradient(circle at 0% 0%, rgba(255, 184, 48, 0.1), transparent 34%),
          radial-gradient(circle at 100% 0%, rgba(56, 189, 248, 0.12), transparent 42%),
          var(--bg);
      }
      .layout { max-width: 1080px; margin: 0 auto; display: grid; gap: 12px; }
      .panel { border: 1px solid var(--line); background: var(--panel); padding: 14px; }
      h1 { margin: 0 0 6px; font-size: 28px; }
      .sub { margin: 0; color: var(--muted); font-size: 12px; line-height: 1.6; }
      .grid { display: grid; gap: 10px; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); }
      .card {
        border: 1px solid var(--line);
        background: rgba(8, 14, 22, 0.76);
        display: grid;
      }
      .card img {
        width: 100%;
        aspect-ratio: 1 / 1;
        object-fit: contain;
        background: radial-gradient(circle at 50% 20%, rgba(56, 189, 248, 0.08), transparent 70%);
        padding: 8px;
      }
      .body { padding: 10px; display: grid; gap: 6px; }
      .kicker { margin: 0; color: var(--amber); font-size: 11px; letter-spacing: 0.08em; }
      .body h3 { margin: 0; font-size: 16px; color: var(--sky); }
      .body p { margin: 0; font-size: 13px; color: #dce8f5; line-height: 1.6; }
      .trigger {
        margin-top: 2px;
        border: 1px solid rgba(56, 189, 248, 0.35);
        background: rgba(56, 189, 248, 0.08);
        padding: 7px 8px;
        color: #d6ecff;
      }
      .hint {
        margin-top: 2px;
        border: 1px dashed rgba(255, 184, 48, 0.45);
        background: rgba(255, 184, 48, 0.07);
        padding: 7px 8px;
        color: #ffe2a6;
      }
      .ownership {
        border: 1px dashed rgba(147, 168, 188, 0.45);
        background: rgba(8, 14, 22, 0.5);
        padding: 12px;
        font-size: 12px;
        color: var(--muted);
      }
      .ownership strong { color: var(--text); }
      .actions { display: flex; justify-content: flex-end; }
      .btn {
        border: 1px solid var(--line);
        background: rgba(11, 22, 33, 0.8);
        color: var(--text);
        padding: 8px 12px;
        cursor: pointer;
      }
      .btn:hover { border-color: var(--sky); color: var(--sky); }
    </style>
  </head>
  <body>
    <div class="layout">
      <section class="panel">
        <h1>Slime Animation Catalog</h1>
        <p class="sub">Tổng hợp toàn bộ animation đã dùng trong Bug War Room, kèm mô tả ngữ cảnh hiển thị.</p>
      </section>
      <section class="panel">
        <div class="grid">
          ${cardsHtml}
        </div>
      </section>
      <section class="panel ownership">
        <p><strong>Ownership:</strong> Bộ Slime animated SVG trong trang Bug War Room thuộc quyền sở hữu tác giả <strong>TranQui004</strong>.</p>
        <p>Vui lòng ghi nguồn đầy đủ nếu tái sử dụng trong project khác.</p>
      </section>
      <section class="panel actions">
        <button id="animation-catalog-close" class="btn" type="button">Close</button>
      </section>
    </div>
  </body>
</html>`
}
