import type { SharePayload } from './types'

export const PUBLIC_SHARE_URL = 'https://vibe.j2team.org/bug-war-room'

interface OpenShareCardOptions {
  payload: SharePayload
  message: string
  draftKey: string
  draftAtKey: string
}

export function buildShareText(payload: SharePayload, missionBonus: number): string {
  return [
    `Bug War Room - ${payload.player}`,
    `Mode: ${payload.mode}`,
    `Campaign Score: ${payload.campaignScore}`,
    `Base Score: ${payload.rawScore} (+${missionBonus} contract bonus)`,
    `Best Score: ${payload.bestScore}`,
    `Chaos: ${payload.chaos}`,
    `Time Left: ${payload.timeLeft}m`,
    `Rounds Cleared: ${payload.rounds}`,
    `War State: ${payload.state}`,
    `Verdict: ${payload.verdict}`,
    `Generated At: ${payload.generatedAt}`,
    `Play: ${PUBLIC_SHARE_URL}`,
  ].join('\n')
}

export function openShareCard(options: OpenShareCardOptions): boolean {
  const shareTab = window.open('', '_blank')
  if (!shareTab) {
    return false
  }

  const payloadEncoded = encodeURIComponent(JSON.stringify(options.payload))
  const messageEncoded = encodeURIComponent(options.message)
  const draftKeyEncoded = encodeURIComponent(options.draftKey)
  const draftAtKeyEncoded = encodeURIComponent(options.draftAtKey)

  const html = `<!doctype html>
<html lang="vi">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Bug War Room Share Card</title>
    <style>
      :root {
        color-scheme: dark;
        --bg: #0f1923;
        --panel: #162232;
        --line: #253549;
        --text: #f3f6fa;
        --muted: #95a6b8;
        --coral: #ff6b4a;
        --amber: #ffb830;
        --sky: #38bdf8;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        min-height: 100vh;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        color: var(--text);
        background:
          radial-gradient(circle at 10% 0%, rgba(255, 107, 74, 0.12), transparent 40%),
          radial-gradient(circle at 90% 10%, rgba(56, 189, 248, 0.12), transparent 45%),
          var(--bg);
        padding: 16px;
      }
      .layout { max-width: 940px; margin: 0 auto; display: grid; gap: 12px; }
      .panel { background: var(--panel); border: 1px solid var(--line); padding: 14px; }
      .headline { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
      h1 { margin: 0 0 4px; font-size: 24px; }
      .sub { margin: 0; color: var(--muted); font-size: 13px; }
      .main { display: grid; gap: 12px; grid-template-columns: 1fr; }
      @media (min-width: 980px) {
        .main { grid-template-columns: 1fr 1fr; }
      }
      .grid { display: grid; gap: 10px; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); }
      .cell { background: rgba(15, 25, 35, 0.7); border: 1px solid var(--line); padding: 12px; }
      .k { font-size: 10px; color: var(--muted); letter-spacing: 0.12em; }
      .v { margin-top: 4px; font-size: 20px; font-weight: 700; }
      .actions { display: flex; flex-wrap: wrap; gap: 10px; }
      .card-stage {
        border: 1px solid var(--line);
        background: linear-gradient(160deg, rgba(255, 107, 74, 0.12), rgba(56, 189, 248, 0.08) 52%, rgba(15, 25, 35, 0.8));
        padding: 16px;
      }
      .render-card {
        width: 100%;
        min-height: 240px;
        border: 1px solid rgba(149, 166, 184, 0.25);
        background: rgba(11, 18, 26, 0.88);
        padding: 16px;
      }
      .render-title { margin: 0; font-size: 18px; }
      .render-meta { margin: 6px 0 0; color: var(--muted); font-size: 12px; }
      .render-grid {
        margin-top: 12px;
        display: grid;
        gap: 8px;
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      .render-cell {
        border: 1px solid rgba(149, 166, 184, 0.2);
        background: rgba(22, 34, 50, 0.7);
        padding: 8px 10px;
      }
      .render-k { font-size: 10px; color: var(--muted); letter-spacing: 0.08em; }
      .render-v { margin-top: 3px; font-size: 14px; font-weight: 600; }
      .render-footer {
        margin-top: 14px;
        padding-top: 10px;
        border-top: 1px solid rgba(149, 166, 184, 0.2);
        font-size: 12px;
        color: var(--muted);
      }
      input {
        width: 100%; border: 1px solid var(--line); background: rgba(15, 25, 35, 0.8);
        color: var(--text); padding: 10px 12px; margin-top: 8px;
      }
      button {
        border: 1px solid var(--line); background: rgba(15, 25, 35, 0.8);
        color: var(--text); padding: 10px 14px; cursor: pointer;
      }
      button.primary { border-color: var(--amber); color: var(--amber); }
      button.secondary { border-color: var(--sky); color: var(--sky); }
      #state { color: var(--amber); font-size: 12px; margin-top: 6px; min-height: 16px; }
      .meta { font-size: 12px; color: var(--muted); }
      @media (max-width: 680px) {
        body { padding: 12px; }
        .panel { padding: 12px; }
      }
    </style>
  </head>
  <body data-payload="${payloadEncoded}" data-message="${messageEncoded}" data-draft-key="${draftKeyEncoded}" data-draft-at-key="${draftAtKeyEncoded}">
    <div class="layout">
      <section class="panel">
        <div class="headline">
          <div>
            <p class="sub">// BUG WAR ROOM COMMUNITY SHARE</p>
            <h1>Mission Share Card</h1>
          </div>
          <p class="meta">${PUBLIC_SHARE_URL}</p>
        </div>
        <p class="sub">Nhập tên trước khi share. Dữ liệu chỉ lưu local tạm thời trên trình duyệt.</p>
        <input id="nameInput" placeholder="Tên người chơi" />
      </section>

      <section class="main">
        <div class="panel">
          <section class="grid" id="stats"></section>
          <p class="sub" id="summary" style="margin-top: 10px;"></p>
        </div>

        <section class="panel card-stage">
          <div class="render-card" id="renderCard">
            <h2 class="render-title">Bug War Room - Mission Report</h2>
            <p class="render-meta" id="renderMeta"></p>
            <div class="render-grid" id="renderGrid"></div>
            <div class="render-footer" id="renderVerdict"></div>
          </div>
        </section>
      </section>

      <section class="panel">
        <div class="actions">
          <button class="primary" id="downloadPngBtn">Download PNG</button>
          <button id="closeBtn">Close</button>
        </div>
        <p class="sub" style="margin-top: 8px;">Ảnh PNG sẽ chứa đầy đủ nội dung report để bạn dùng trực tiếp khi chia sẻ.</p>
        <div id="state"></div>
      </section>
    </div>

    <script>
      const decode = (raw) => {
        try {
          return decodeURIComponent(raw || '');
        } catch {
          return '';
        }
      };

      const byId = (id) => {
        const node = document.getElementById(id);
        if (!node) {
          throw new Error('missing_' + id);
        }
        return node;
      };

      try {
        const payloadRaw = decode(document.body.dataset.payload);
        const messageRaw = decode(document.body.dataset.message);
        const draftKey = decode(document.body.dataset.draftKey);
        const draftAtKey = decode(document.body.dataset.draftAtKey);
        const payload = JSON.parse(payloadRaw || '{}');

        const input = byId('nameInput');
        const statsContainer = byId('stats');
        const summary = byId('summary');
        const state = byId('state');
        const renderMeta = byId('renderMeta');
        const renderGrid = byId('renderGrid');
        const renderVerdict = byId('renderVerdict');

        const render = () => {
          const player = (input.value || payload.player || 'Anonymous Commander').trim();
          payload.player = player;

          const cards = [
            ['Player', player],
            ['Mode', String(payload.mode || '-')],
            ['Campaign Score', String(payload.campaignScore ?? '-')],
            ['Base Score', String(payload.rawScore ?? '-')],
            ['Best Score', String(payload.bestScore ?? '-')],
            ['Chaos', String(payload.chaos ?? '-')],
            ['Time Left', String(payload.timeLeft ?? '-') + 'm'],
            ['Rounds', String(payload.rounds || '-')],
            ['State', String(payload.state || '-')],
            ['Generated', String(payload.generatedAt || '-')],
          ];

          statsContainer.innerHTML = cards.map(([k, v]) => '<div class="cell"><div class="k">' + k + '</div><div class="v">' + v + '</div></div>').join('');
          summary.textContent = String(payload.verdict || '');
          renderMeta.textContent = 'Play: ${PUBLIC_SHARE_URL}';
          renderGrid.innerHTML = cards.map(([k, v]) => '<div class="render-cell"><div class="render-k">' + k + '</div><div class="render-v">' + v + '</div></div>').join('');
          renderVerdict.textContent = String(payload.verdict || '');

          try {
            localStorage.setItem(draftKey, JSON.stringify(payload));
            localStorage.setItem(draftAtKey, String(Date.now()));
          } catch {
            // Storage can be disabled in strict privacy modes.
          }
        };

        const toShareText = () => {
          const lines = String(messageRaw || '').split('\\n');
          lines[0] = 'Bug War Room - ' + (payload.player || 'Anonymous Commander');
          const generatedLineIndex = lines.findIndex((line) => line.startsWith('Generated At:'));
          if (generatedLineIndex >= 0) {
            lines[generatedLineIndex] = 'Generated At: ' + String(payload.generatedAt || '-');
          }
          return lines.join('\\n');
        };

        input.value = String(payload.player || '');
        input.addEventListener('input', render);

        byId('downloadPngBtn').addEventListener('click', async () => {
          try {
            const width = 1200;
            const statCards = [
              ['Base Score', String(payload.rawScore ?? '-')],
              ['Best Score', String(payload.bestScore ?? '-')],
              ['Chaos', String(payload.chaos ?? '-')],
              ['Time Left', String(payload.timeLeft ?? '-') + 'm'],
              ['Rounds', String(payload.rounds || '-')],
              ['State', String(payload.state || '-')],
            ];

            const measureCanvas = document.createElement('canvas');
            const measureCtx = measureCanvas.getContext('2d');
            if (!measureCtx) {
              throw new Error('measure_canvas_ctx');
            }

            const wrapTextByContext = (ctx, text, maxWidth) => {
              const words = String(text).split(' ');
              const lines = [];
              let current = '';

              words.forEach((word) => {
                const candidate = current ? current + ' ' + word : word;
                if (ctx.measureText(candidate).width <= maxWidth) {
                  current = candidate;
                } else {
                  if (current) {
                    lines.push(current);
                  }
                  current = word;
                }
              });

              if (current) {
                lines.push(current);
              }

              return lines
            };

            const verdictText = 'Verdict: ' + String(payload.verdict || '');
            measureCtx.font = '600 20px Segoe UI';
            const verdictLines = wrapTextByContext(measureCtx, verdictText, width - 144);

            const shareText = toShareText();
            const shareLinesRaw = shareText.split('\\n').filter(Boolean);
            measureCtx.font = '500 14px Segoe UI';
            const normalizedLines = [];
            shareLinesRaw.forEach((line) => {
              const wrapped = wrapTextByContext(measureCtx, line, width - 188);
              wrapped.forEach((w) => normalizedLines.push(w));
            });

            const headerEndY = 252;
            const statsBlockHeight = (80 * 2) + 14;
            const verdictStartY = headerEndY + statsBlockHeight + 40;
            const verdictBlockHeight = Math.max(44, verdictLines.length * 28);
            const reportTopY = verdictStartY + verdictBlockHeight + 18;
            const reportHeaderHeight = 30;
            const reportLinesHeight = normalizedLines.length * 18;
            const reportBlockHeight = reportHeaderHeight + reportLinesHeight + 22;
            const footerGap = 48;
            const minHeight = 760;
            const height = Math.max(minHeight, reportTopY + reportBlockHeight + footerGap);

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');

            if (!ctx) {
              throw new Error('canvas_ctx');
            }

            const wrapText = (text, maxWidth) => wrapTextByContext(ctx, text, maxWidth)

            const grad = ctx.createLinearGradient(0, 0, width, height);
            grad.addColorStop(0, '#0f1923');
            grad.addColorStop(0.55, '#162232');
            grad.addColorStop(1, '#112033');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, width, height);

            ctx.fillStyle = 'rgba(255, 107, 74, 0.14)';
            ctx.beginPath();
            ctx.arc(180, 90, 170, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = 'rgba(56, 189, 248, 0.14)';
            ctx.beginPath();
            ctx.arc(1040, 120, 180, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = 'rgba(149, 166, 184, 0.4)';
            ctx.lineWidth = 2;
            ctx.strokeRect(40, 40, width - 80, height - 80);

            ctx.fillStyle = '#ffb830';
            ctx.font = '700 20px Segoe UI';
            ctx.fillText('// BUG WAR ROOM MISSION REPORT', 72, 94);

            ctx.fillStyle = '#f3f6fa';
            ctx.font = '700 52px Segoe UI';
            ctx.fillText(String(payload.player || 'Anonymous Commander'), 72, 154);

            ctx.fillStyle = '#95a6b8';
            ctx.font = '500 22px Segoe UI';
            ctx.fillText('Mode: ' + String(payload.mode || '-') + '   |   Campaign Score: ' + String(payload.campaignScore ?? '-'), 72, 198);

            ctx.fillStyle = '#95a6b8';
            ctx.font = '500 18px Segoe UI';
            ctx.fillText('Generated: ' + String(payload.generatedAt || '-'), 72, 224);

            const gridStartX = 72;
            const gridStartY = 252;
            const cellW = 340;
            const cellH = 80;
            const gapX = 24;
            const gapY = 14;

            statCards.forEach(([k, v], i) => {
              const col = i % 3;
              const row = Math.floor(i / 3);
              const x = gridStartX + col * (cellW + gapX);
              const y = gridStartY + row * (cellH + gapY);

              ctx.fillStyle = 'rgba(15, 25, 35, 0.66)';
              ctx.fillRect(x, y, cellW, cellH);
              ctx.strokeStyle = 'rgba(149, 166, 184, 0.28)';
              ctx.strokeRect(x, y, cellW, cellH);

              ctx.fillStyle = '#95a6b8';
              ctx.font = '600 15px Segoe UI';
              ctx.fillText(k, x + 16, y + 30);

              ctx.fillStyle = '#f3f6fa';
              ctx.font = '700 28px Segoe UI';
              ctx.fillText(v, x + 16, y + 66);
            });

            ctx.fillStyle = '#ffb830';
            ctx.font = '600 20px Segoe UI';
            verdictLines.forEach((line, idx) => {
              ctx.fillText(line, 72, verdictStartY + (idx * 28));
            });

            ctx.fillStyle = 'rgba(15, 25, 35, 0.72)';
            ctx.fillRect(72, reportTopY, width - 144, reportBlockHeight);
            ctx.strokeStyle = 'rgba(149, 166, 184, 0.26)';
            ctx.strokeRect(72, reportTopY, width - 144, reportBlockHeight);

            ctx.fillStyle = '#ffb830';
            ctx.font = '700 14px Segoe UI';
            ctx.fillText('FULL SHARE REPORT', 88, reportTopY + 24);

            ctx.fillStyle = '#d6e2ef';
            ctx.font = '500 14px Segoe UI';
            normalizedLines.forEach((line, idx) => {
              ctx.fillText(line, 88, reportTopY + 52 + (idx * 18));
            });

            ctx.fillStyle = '#38bdf8';
            ctx.font = '600 18px Segoe UI';
            ctx.fillText('${PUBLIC_SHARE_URL}', 72, height - 36);

            const link = document.createElement('a');
            const safeName = String(payload.player || 'commander').replace(/[^a-zA-Z0-9-_]/g, '-').slice(0, 30) || 'commander';
            link.href = canvas.toDataURL('image/png');
            link.download = 'bug-war-room-' + safeName + '.png';
            link.click();
            state.textContent = 'Đã tải xuống PNG share card.';
          } catch {
            state.textContent = 'Không thể tạo PNG trên trình duyệt này.';
          }
        });

        byId('closeBtn').addEventListener('click', () => window.close());
        render();
      } catch (error) {
        const state = document.getElementById('state');
        if (state) {
          state.textContent = 'Không thể khởi tạo share card. Hãy đóng tab và thử lại.';
        }
      }
    </script>
  </body>
</html>`

  try {
    shareTab.document.open()
    shareTab.document.write(html)
    shareTab.document.close()
    return true
  } catch {
    shareTab.close()
    return false
  }
}
