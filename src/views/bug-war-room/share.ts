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
    `Rank: ${payload.rank}`,
    `Daily Seed: ${payload.dailySeed}`,
    `Campaign Score: ${payload.campaignScore}`,
    `Base Score: ${payload.rawScore} (+${missionBonus} contract bonus)`,
    `Best Score: ${payload.bestScore}`,
    `Daily Best Score: ${payload.dailyBestScore}`,
    `Chaos: ${payload.chaos}`,
    `Time Left: ${payload.timeLeft}m`,
    `Rounds Cleared: ${payload.rounds}`,
    `War State: ${payload.state}`,
    `Verdict: ${payload.verdict}`,
    `Generated At: ${payload.generatedAt}`,
    `Play: ${PUBLIC_SHARE_URL}`,
  ].join('\n')
}

export function openShareCard(options: OpenShareCardOptions, targetTab?: Window): boolean {
  const shareTab = targetTab ?? window.open('', '_blank')
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
      .controls { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; margin-bottom: 10px; }
      select {
        border: 1px solid var(--line);
        background: rgba(15, 25, 35, 0.8);
        color: var(--text);
        padding: 9px 12px;
      }
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
      .render-badges { margin-top: 10px; display: flex; flex-wrap: wrap; gap: 6px; }
      .render-badge {
        border: 1px solid rgba(149, 166, 184, 0.3);
        background: rgba(22, 34, 50, 0.78);
        padding: 4px 8px;
        font-size: 10px;
        color: #d6e2ef;
        letter-spacing: 0.08em;
      }
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
            <div class="render-badges" id="renderBadges"></div>
            <div class="render-grid" id="renderGrid"></div>
            <div class="render-footer" id="renderVerdict"></div>
          </div>
        </section>
      </section>

      <section class="panel">
        <div class="actions">
          <button class="primary" id="downloadPngBtn">Download Full PNG</button>
          <button id="closeBtn">Close</button>
        </div>
        <p class="sub" style="margin-top: 8px;">Ảnh PNG full sẽ dùng bố cục report mới để đăng trực tiếp mà không cần chỉnh sửa thêm.</p>
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
        const renderBadges = byId('renderBadges');
        const renderGrid = byId('renderGrid');
        const renderVerdict = byId('renderVerdict');

        const render = () => {
          const player = (input.value || payload.player || 'Anonymous Commander').trim();
          payload.player = player;

          const cards = [
            ['Player', player],
            ['Mode', String(payload.mode || '-')],
            ['Rank', String(payload.rank || '-')],
            ['Daily Seed', String(payload.dailySeed || '-')],
            ['Campaign Score', String(payload.campaignScore ?? '-')],
            ['Base Score', String(payload.rawScore ?? '-')],
            ['Best Score', String(payload.bestScore ?? '-')],
            ['Daily Best', String(payload.dailyBestScore ?? '-')],
            ['Chaos', String(payload.chaos ?? '-')],
            ['Time Left', String(payload.timeLeft ?? '-') + 'm'],
            ['Rounds', String(payload.rounds || '-')],
            ['State', String(payload.state || '-')],
            ['Generated', String(payload.generatedAt || '-')],
          ];

          statsContainer.innerHTML = cards.map(([k, v]) => '<div class="cell"><div class="k">' + k + '</div><div class="v">' + v + '</div></div>').join('');
          summary.textContent = String(payload.verdict || '');
          renderMeta.textContent = 'Play: ${PUBLIC_SHARE_URL}';
          renderBadges.innerHTML = [
            '<span class="render-badge">RANK: ' + String(payload.rank || '-') + '</span>',
            '<span class="render-badge">SEED: ' + String(payload.dailySeed || '-') + '</span>',
            '<span class="render-badge">MODE: ' + String(payload.mode || '-') + '</span>',
          ].join('');
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
            const width = 1400;
            const statCards = [
              ['Campaign Score', String(payload.campaignScore ?? '-')],
              ['Base Score', String(payload.rawScore ?? '-')],
              ['Best Score', String(payload.bestScore ?? '-')],
              ['Daily Best', String(payload.dailyBestScore ?? '-')],
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

              return lines;
            };

            const shareText = toShareText();
            const shareLinesRaw = shareText.split('\\n').filter(Boolean);
            measureCtx.font = '500 14px Segoe UI';
            const normalizedLines = [];
            shareLinesRaw.forEach((line) => {
              const wrapped = wrapTextByContext(measureCtx, line, width - 188);
              wrapped.forEach((w) => normalizedLines.push(w));
            });

            const missionSummary = [
              'Rank: ' + String(payload.rank || '-'),
              'Mode: ' + String(payload.mode || '-'),
              'Seed: ' + String(payload.dailySeed || '-'),
              'Generated: ' + String(payload.generatedAt || '-'),
            ];

            const framePadding = 52;
            const innerWidth = width - (framePadding * 2);
            const heroHeight = 326;
            const reportTopGap = 26;
            const reportHeaderHeight = 42;
            const reportLineHeight = 22;
            const reportBottomPadding = 34;
            const reportBlockHeight = Math.max(240, reportHeaderHeight + (normalizedLines.length * reportLineHeight) + reportBottomPadding);
            const footerHeight = 68;
            const height = framePadding + heroHeight + reportTopGap + reportBlockHeight + footerHeight + 28;

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');

            if (!ctx) {
              throw new Error('canvas_ctx');
            }

            const drawRect = (x, y, w, h, fill, stroke, lineWidth = 1) => {
              ctx.fillStyle = fill;
              ctx.fillRect(x, y, w, h);
              if (stroke) {
                ctx.strokeStyle = stroke;
                ctx.lineWidth = lineWidth;
                ctx.strokeRect(x, y, w, h);
              }
            };

            const grad = ctx.createLinearGradient(0, 0, width, height);
            grad.addColorStop(0, '#0b1621');
            grad.addColorStop(0.55, '#122537');
            grad.addColorStop(1, '#0a141e');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, width, height);

            ctx.fillStyle = 'rgba(255, 107, 74, 0.13)';
            ctx.beginPath();
            ctx.arc(220, 130, 230, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = 'rgba(56, 189, 248, 0.12)';
            ctx.beginPath();
            ctx.arc(1220, 180, 280, 0, Math.PI * 2);
            ctx.fill();

            drawRect(28, 28, width - 56, height - 56, 'rgba(8, 14, 21, 0.15)', 'rgba(149, 166, 184, 0.36)', 2);

            const heroX = framePadding;
            const heroY = framePadding;
            const heroW = innerWidth;
            const heroH = heroHeight;
            const heroLeftW = Math.floor(heroW * 0.58);
            const heroGap = 24;
            const heroRightW = heroW - heroLeftW - heroGap;
            const heroRightX = heroX + heroLeftW + heroGap;

            drawRect(heroX, heroY, heroLeftW, heroH, 'rgba(11, 20, 30, 0.76)', 'rgba(149, 166, 184, 0.26)', 1.5);
            drawRect(heroRightX, heroY, heroRightW, heroH, 'rgba(11, 20, 30, 0.82)', 'rgba(149, 166, 184, 0.26)', 1.5);

            ctx.fillStyle = '#ffb830';
            ctx.font = '700 22px Segoe UI';
            ctx.fillText('// BUG WAR ROOM / MISSION DOSSIER', heroX + 24, heroY + 40);

            const playerName = String(payload.player || 'Anonymous Commander');
            measureCtx.font = '700 56px Segoe UI';
            const playerLines = wrapTextByContext(measureCtx, playerName, heroLeftW - 48);
            ctx.fillStyle = '#f3f6fa';
            ctx.font = '700 56px Segoe UI';
            playerLines.slice(0, 2).forEach((line, idx) => {
              ctx.fillText(line, heroX + 24, heroY + 108 + (idx * 62));
            });

            const badges = [
              'RANK ' + String(payload.rank || '-'),
              'SEED ' + String(payload.dailySeed || '-'),
              'MODE ' + String(payload.mode || '-'),
            ];

            let badgeX = heroX + 24;
            let badgeY = heroY + 206;
            const badgeRightLimit = heroX + heroLeftW - 24;
            badges.forEach((badge) => {
              const badgeWidth = Math.max(120, (badge.length * 9) + 24);
              if (badgeX + badgeWidth > badgeRightLimit) {
                badgeX = heroX + 24;
                badgeY += 42;
              }
              ctx.fillStyle = 'rgba(22, 34, 50, 0.86)';
              ctx.fillRect(badgeX, badgeY, badgeWidth, 30);
              ctx.strokeStyle = 'rgba(149, 166, 184, 0.32)';
              ctx.strokeRect(badgeX, badgeY, badgeWidth, 30);
              ctx.fillStyle = '#d6e2ef';
              ctx.font = '600 13px Segoe UI';
              ctx.fillText(badge, badgeX + 10, badgeY + 20);
              badgeX += badgeWidth + 10;
            });

            measureCtx.font = '600 23px Segoe UI';
            const verdictLines = wrapTextByContext(measureCtx, String(payload.verdict || '-'), heroLeftW - 56);
            ctx.fillStyle = '#95a6b8';
            ctx.font = '500 18px Segoe UI';
            missionSummary.forEach((line, idx) => {
              ctx.fillText(line, heroX + 24, heroY + 262 + (idx * 24));
            });

            const verdictBoxY = heroY + heroH - 92;
            drawRect(heroX + 18, verdictBoxY, heroLeftW - 36, 62, 'rgba(255, 184, 48, 0.1)', 'rgba(255, 184, 48, 0.4)', 1);
            ctx.fillStyle = '#ffb830';
            ctx.font = '700 12px Segoe UI';
            ctx.fillText('MISSION VERDICT', heroX + 34, verdictBoxY + 18);
            ctx.fillStyle = '#f3f6fa';
            ctx.font = '600 20px Segoe UI';
            verdictLines.slice(0, 1).forEach((line, idx) => {
              ctx.fillText(line, heroX + 34, verdictBoxY + 46 + (idx * 24));
            });

            const rightTitleY = heroY + 40;
            ctx.fillStyle = '#38bdf8';
            ctx.font = '700 22px Segoe UI';
            ctx.fillText('TACTICAL METRICS', heroRightX + 20, rightTitleY);

            const rightGridY = heroY + 64;
            const rightGridGap = 14;
            const rightCardW = Math.floor((heroRightW - 20 - 20 - rightGridGap) / 2);
            const rightCardH = 58;
            statCards.forEach(([k, v], i) => {
              const col = i % 2;
              const row = Math.floor(i / 2);
              const cardX = heroRightX + 20 + (col * (rightCardW + rightGridGap));
              const cardY = rightGridY + (row * (rightCardH + 12));
              drawRect(cardX, cardY, rightCardW, rightCardH, 'rgba(15, 25, 35, 0.7)', 'rgba(149, 166, 184, 0.26)', 1);
              ctx.fillStyle = '#95a6b8';
              ctx.font = '600 12px Segoe UI';
              ctx.fillText(k, cardX + 12, cardY + 20);
              ctx.fillStyle = '#f3f6fa';
              ctx.font = '700 22px Segoe UI';
              ctx.fillText(v, cardX + 12, cardY + 46);
            });

            const reportTopY = heroY + heroH + reportTopGap;
            drawRect(heroX, reportTopY, innerWidth, reportBlockHeight, 'rgba(11, 20, 30, 0.82)', 'rgba(149, 166, 184, 0.25)', 1.5);
            ctx.fillStyle = '#ffb830';
            ctx.font = '700 16px Segoe UI';
            ctx.fillText('FULL INCIDENT TRANSCRIPT', heroX + 20, reportTopY + 28);

            ctx.fillStyle = '#d6e2ef';
            ctx.font = '500 15px Segoe UI';
            normalizedLines.forEach((line, idx) => {
              ctx.fillText(line, heroX + 20, reportTopY + 58 + (idx * reportLineHeight));
            });

            ctx.fillStyle = '#38bdf8';
            ctx.font = '600 18px Segoe UI';
            ctx.fillText('${PUBLIC_SHARE_URL}', 72, height - 36);

            const link = document.createElement('a');
            const safeName = String(payload.player || 'commander').replace(/[^a-zA-Z0-9-_]/g, '-').slice(0, 30) || 'commander';
            link.href = canvas.toDataURL('image/png');
            link.download = 'bug-war-room-full-' + safeName + '.png';
            link.click();
            state.textContent = 'Đã tải xuống PNG Full Report (layout mới).';
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
    if (!targetTab) {
      shareTab.close()
    }
    return false
  }
}
