import type { SharePayload } from './types'
import defeatSvg from './svg-animation/defeat.svg'
import slimeIdleSvg from './svg-animation/slime-idle.svg'
import victorySvg from './svg-animation/victory.svg'
import warningSvg from './svg-animation/warning.svg'

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

  const escapeHtml = (value: unknown): string => {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
  }

  const initialPlayer = options.payload.player || 'Anonymous Commander'
  const initialCards: Array<[string, string]> = [
    ['Player', initialPlayer],
    ['Mode', String(options.payload.mode || '-')],
    ['Rank', String(options.payload.rank || '-')],
    ['Daily Seed', String(options.payload.dailySeed || '-')],
    ['Campaign Score', String(options.payload.campaignScore ?? '-')],
    ['Base Score', String(options.payload.rawScore ?? '-')],
    ['Best Score', String(options.payload.bestScore ?? '-')],
    ['Daily Best', String(options.payload.dailyBestScore ?? '-')],
    ['Chaos', String(options.payload.chaos ?? '-')],
    ['Time Left', `${String(options.payload.timeLeft ?? '-')}m`],
    ['Rounds', String(options.payload.rounds || '-')],
    ['State', String(options.payload.state || '-')],
    ['Generated', String(options.payload.generatedAt || '-')],
  ]

  const initialStatsHtml = initialCards.map(([k, v]) => {
    return `<div class="cell"><div class="k">${escapeHtml(k)}</div><div class="v">${escapeHtml(v)}</div></div>`
  }).join('')

  const initialRenderGridHtml = initialCards.map(([k, v]) => {
    return `<div class="render-cell"><div class="render-k">${escapeHtml(k)}</div><div class="render-v">${escapeHtml(v)}</div></div>`
  }).join('')

  const initialBadgesHtml = [
    `RANK: ${String(options.payload.rank || '-')}`,
    `SEED: ${String(options.payload.dailySeed || '-')}`,
    `MODE: ${String(options.payload.mode || '-')}`,
  ].map((item) => `<span class="render-badge">${escapeHtml(item)}</span>`).join('')

  const initialChaos = Number(options.payload.chaos ?? 0)
  const initialCampaignScore = Number(options.payload.campaignScore ?? 0)
  const initialSlimeSrc = initialChaos >= 85 ? defeatSvg
    : initialCampaignScore >= 80 ? victorySvg
    : initialChaos >= 65 ? warningSvg
    : slimeIdleSvg

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
      .slime-box {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 10px;
        padding: 8px 10px;
        border: 1px solid var(--line);
        background: rgba(11, 19, 28, 0.8);
      }
      .slime-box img { width: 72px; height: 72px; flex-shrink: 0; display: block; }
      .slime-lbl { font-size: 10px; color: var(--muted); letter-spacing: 0.1em; }
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
        <input id="nameInput" placeholder="Tên người chơi" value="${escapeHtml(initialPlayer)}" />
      </section>

      <section class="main">
        <div class="panel">
          <section class="grid" id="stats">${initialStatsHtml}</section>
          <p class="sub" id="summary" style="margin-top: 10px;">${escapeHtml(options.payload.verdict || '')}</p>
        </div>

        <section class="panel card-stage">
          <div class="slime-box">
            <img id="slimeImg" src="${initialSlimeSrc}" width="72" height="72" alt="Slime Status" />
            <span class="slime-lbl">SLIME STATUS</span>
          </div>
          <div class="render-card" id="renderCard">
            <h2 class="render-title">Bug War Room - Mission Report</h2>
            <p class="render-meta" id="renderMeta">Play: ${PUBLIC_SHARE_URL}</p>
            <div class="render-badges" id="renderBadges">${initialBadgesHtml}</div>
            <div class="render-grid" id="renderGrid">${initialRenderGridHtml}</div>
            <div class="render-footer" id="renderVerdict">${escapeHtml(options.payload.verdict || '')}</div>
          </div>
        </section>
      </section>

      <section class="panel">
        <div class="actions">
          <button class="primary" id="downloadPngBtn">Download Full PNG</button>
          <button id="closeBtn">Close</button>
        </div>
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
        const parsedPayload = JSON.parse(payloadRaw || '{}');
        const payload = parsedPayload && typeof parsedPayload === 'object' ? parsedPayload : {};
        const coalesce = (value, fallback) => (value === undefined || value === null ? fallback : value);

        // Fallback parser: if payload is missing, recover fields from plain share message.
        if ((!payload || typeof payload !== 'object' || !payload.mode) && messageRaw) {
          const lines = String(messageRaw).split('\\n').map((line) => line.trim()).filter(Boolean);
          const readValue = (prefix) => {
            const found = lines.find((line) => line.startsWith(prefix));
            return found ? found.slice(prefix.length).trim() : '';
          };

          const titleLine = lines.find((line) => line.startsWith('Bug War Room - ')) || '';
          payload.player = titleLine ? titleLine.replace('Bug War Room - ', '').trim() : (payload.player || 'Anonymous Commander');
          payload.mode = payload.mode || readValue('Mode:');
          payload.rank = payload.rank || readValue('Rank:');
          payload.dailySeed = payload.dailySeed || readValue('Daily Seed:');
          payload.campaignScore = Number(coalesce(payload.campaignScore, readValue('Campaign Score:') || '0'));
          payload.rawScore = Number(coalesce(payload.rawScore, readValue('Base Score:').split(' ')[0] || '0'));
          payload.bestScore = Number(coalesce(payload.bestScore, readValue('Best Score:') || '0'));
          payload.dailyBestScore = Number(coalesce(payload.dailyBestScore, readValue('Daily Best Score:') || '0'));
          payload.chaos = Number(coalesce(payload.chaos, readValue('Chaos:') || '0'));
          payload.timeLeft = Number(coalesce(payload.timeLeft, readValue('Time Left:').replace('m', '') || '0'));
          payload.rounds = payload.rounds || readValue('Rounds Cleared:');
          payload.state = payload.state || readValue('War State:');
          payload.verdict = payload.verdict || readValue('Verdict:');
          payload.generatedAt = payload.generatedAt || readValue('Generated At:');
        }

        const input = byId('nameInput');
        const statsContainer = byId('stats');
        const summary = byId('summary');
        const state = byId('state');
        const renderMeta = byId('renderMeta');
        const renderBadges = byId('renderBadges');
        const renderGrid = byId('renderGrid');
        const renderVerdict = byId('renderVerdict');

        const pickSlimeAsset = () => {
          const chaos = Number(coalesce(payload.chaos, 0));
          const campaignScore = Number(coalesce(payload.campaignScore, 0));
          if (chaos >= 85) { return ${JSON.stringify(defeatSvg)}; }
          if (campaignScore >= 80) { return ${JSON.stringify(victorySvg)}; }
          if (chaos >= 65) { return ${JSON.stringify(warningSvg)}; }
          return ${JSON.stringify(slimeIdleSvg)};
        };

        const render = () => {
          const player = (input.value || payload.player || 'Anonymous Commander').trim();
          payload.player = player;

          const cards = [
            ['Player', player],
            ['Mode', String(payload.mode || '-')],
            ['Rank', String(payload.rank || '-')],
            ['Daily Seed', String(payload.dailySeed || '-')],
            ['Campaign Score', String(coalesce(payload.campaignScore, '-'))],
            ['Base Score', String(coalesce(payload.rawScore, '-'))],
            ['Best Score', String(coalesce(payload.bestScore, '-'))],
            ['Daily Best', String(coalesce(payload.dailyBestScore, '-'))],
            ['Chaos', String(coalesce(payload.chaos, '-'))],
            ['Time Left', String(coalesce(payload.timeLeft, '-')) + 'm'],
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

          const slimeImgEl = document.getElementById('slimeImg');
          if (slimeImgEl) { slimeImgEl.src = pickSlimeAsset(); }

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
            state.textContent = 'Đang tạo PNG...';
            const width = 1600;
            const padding = 64;
            const contentWidth = width - (padding * 2);
            const sectionGap = 22;
            const fontFamily = '"Segoe UI", Arial, sans-serif';

            const stats = [
              ['Campaign Score', String(coalesce(payload.campaignScore, '-'))],
              ['Base Score', String(coalesce(payload.rawScore, '-'))],
              ['Best Score', String(coalesce(payload.bestScore, '-'))],
              ['Daily Best', String(coalesce(payload.dailyBestScore, '-'))],
              ['Chaos', String(coalesce(payload.chaos, '-'))],
              ['Time Left', String(coalesce(payload.timeLeft, '-')) + 'm'],
              ['Rounds', String(payload.rounds || '-')],
              ['State', String(payload.state || '-')],
            ];

            const measureCanvas = document.createElement('canvas');
            const measureCtx = measureCanvas.getContext('2d');
            if (!measureCtx) {
              throw new Error('measure_canvas_ctx');
            }

            const wrapTextByContext = (ctx, text, maxWidth, maxLines = Infinity) => {
              const words = String(text || '').trim().split(/\\s+/).filter(Boolean);
              if (words.length === 0) {
                return ['-'];
              }

              const lines = [];
              let current = '';
              for (const word of words) {
                const candidate = current ? current + ' ' + word : word;
                if (ctx.measureText(candidate).width <= maxWidth) {
                  current = candidate;
                } else {
                  if (current) {
                    lines.push(current);
                    if (lines.length >= maxLines) {
                      return lines;
                    }
                  }
                  current = word;
                }
              }

              if (current && lines.length < maxLines) {
                lines.push(current);
              }

              return lines;
            };

            // pickSlimeAsset is defined in outer scope

            const loadImage = (src, timeoutMs = 1200) => {
              return new Promise((resolve, reject) => {
                const image = new Image();
                const timer = setTimeout(() => reject(new Error('image_load_timeout')), timeoutMs);
                image.onload = () => {
                  clearTimeout(timer);
                  resolve(image);
                };
                image.onerror = () => {
                  clearTimeout(timer);
                  reject(new Error('image_load_failed'));
                };
                image.src = src;
              });
            };

            const triggerPngDownload = (canvas, fileName) => {
              if (typeof canvas.toBlob === 'function') {
                canvas.toBlob((blob) => {
                  if (!blob) {
                    state.textContent = 'Không thể tạo dữ liệu PNG.';
                    return;
                  }

                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = fileName;
                  document.body.appendChild(link);
                  link.click();
                  link.remove();
                  setTimeout(() => URL.revokeObjectURL(url), 1200);
                  state.textContent = 'Đã tải xuống PNG Report (clear layout).';
                }, 'image/png');
                return;
              }

              const link = document.createElement('a');
              link.href = canvas.toDataURL('image/png');
              link.download = fileName;
              document.body.appendChild(link);
              link.click();
              link.remove();
              state.textContent = 'Đã tải xuống PNG Report (clear layout).';
            };

            const reportLines = [
              'Player: ' + String(payload.player || 'Anonymous Commander'),
              'Rank: ' + String(payload.rank || '-'),
              'Mode: ' + String(payload.mode || '-'),
              'Daily Seed: ' + String(payload.dailySeed || '-'),
              'Campaign Score: ' + String(coalesce(payload.campaignScore, '-')),
              'Base Score: ' + String(coalesce(payload.rawScore, '-')),
              'Best Score: ' + String(coalesce(payload.bestScore, '-')),
              'Daily Best: ' + String(coalesce(payload.dailyBestScore, '-')),
              'Chaos: ' + String(coalesce(payload.chaos, '-')),
              'Time Left: ' + String(coalesce(payload.timeLeft, '-')) + 'm',
              'Rounds: ' + String(payload.rounds || '-'),
              'State: ' + String(payload.state || '-'),
              'Generated: ' + String(payload.generatedAt || '-'),
            ];

            measureCtx.font = '600 30px ' + fontFamily;
            const playerLines = wrapTextByContext(measureCtx, String(payload.player || 'Anonymous Commander'), contentWidth - 460, 2);
            measureCtx.font = '500 22px ' + fontFamily;
            const verdictLines = wrapTextByContext(measureCtx, String(payload.verdict || '-'), contentWidth - 64, 4);

            measureCtx.font = '500 18px ' + fontFamily;
            const transcriptLines = [];
            for (const line of reportLines) {
              const wrapped = wrapTextByContext(measureCtx, line, contentWidth - 64, 2);
              for (const wrappedLine of wrapped) {
                if (transcriptLines.length >= 16) {
                  break;
                }
                transcriptLines.push(wrappedLine);
              }
              if (transcriptLines.length >= 16) {
                break;
              }
            }

            const headerHeight = 220;
            const metricsHeight = 284;
            const verdictHeight = Math.max(150, 82 + (verdictLines.length * 34));
            const transcriptHeight = Math.max(220, 88 + (transcriptLines.length * 28));
            const footerHeight = 76;
            const height = padding
              + headerHeight
              + sectionGap
              + metricsHeight
              + sectionGap
              + verdictHeight
              + sectionGap
              + transcriptHeight
              + sectionGap
              + footerHeight
              + padding;

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              throw new Error('canvas_ctx');
            }

            let slimeImage = null;
            try {
              slimeImage = await loadImage(pickSlimeAsset());
            } catch {
              slimeImage = null;
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

            const bgGrad = ctx.createLinearGradient(0, 0, width, height);
            bgGrad.addColorStop(0, '#0b1621');
            bgGrad.addColorStop(0.45, '#102234');
            bgGrad.addColorStop(1, '#09131d');
            ctx.fillStyle = bgGrad;
            ctx.fillRect(0, 0, width, height);

            ctx.fillStyle = 'rgba(255, 107, 74, 0.11)';
            ctx.beginPath();
            ctx.arc(220, 140, 240, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = 'rgba(56, 189, 248, 0.1)';
            ctx.beginPath();
            ctx.arc(width - 180, 180, 260, 0, Math.PI * 2);
            ctx.fill();

            drawRect(28, 28, width - 56, height - 56, 'rgba(7, 12, 18, 0.12)', 'rgba(149, 166, 184, 0.32)', 2);

            let y = padding;

            drawRect(padding, y, contentWidth, headerHeight, 'rgba(11, 20, 30, 0.82)', 'rgba(149, 166, 184, 0.24)', 1.5);
            ctx.fillStyle = '#ffb830';
            ctx.font = '700 22px ' + fontFamily;
            ctx.fillText('// BUG WAR ROOM / CAMPAIGN REPORT', padding + 24, y + 40);

            ctx.fillStyle = '#f3f6fa';
            ctx.font = '700 52px ' + fontFamily;
            playerLines.forEach((line, index) => {
              ctx.fillText(line, padding + 24, y + 106 + (index * 58));
            });

            const badgeBaseX = padding + 24;
            const badgeY = y + 156;
            const badges = [
              'RANK ' + String(payload.rank || '-'),
              'MODE ' + String(payload.mode || '-'),
              'SEED ' + String(payload.dailySeed || '-'),
            ];
            let badgeX = badgeBaseX;
            badges.forEach((badge) => {
              const badgeWidth = Math.max(170, (badge.length * 10) + 28);
              drawRect(badgeX, badgeY, badgeWidth, 34, 'rgba(19, 32, 46, 0.82)', 'rgba(149, 166, 184, 0.28)', 1);
              ctx.fillStyle = '#d6e2ef';
              ctx.font = '600 14px ' + fontFamily;
              ctx.fillText(badge, badgeX + 12, badgeY + 22);
              badgeX += badgeWidth + 10;
            });

            if (slimeImage) {
              const slimeBoxWidth = 120;
              const slimeBoxHeight = 120;
              const slimeX = padding + contentWidth - 580;
              const slimeY = y + 24;
              drawRect(slimeX, slimeY, slimeBoxWidth, slimeBoxHeight, 'rgba(16, 28, 41, 0.72)', 'rgba(149, 166, 184, 0.26)', 1);
              const labelH = 20;
              const imgSize = slimeBoxWidth - 20;
              const imgX = slimeX + Math.floor((slimeBoxWidth - imgSize) / 2);
              const imgY = slimeY + 6;
              ctx.drawImage(slimeImage, imgX, imgY, imgSize, imgSize - labelH);
              ctx.fillStyle = '#95a6b8';
              ctx.font = '600 11px ' + fontFamily;
              ctx.textAlign = 'center';
              ctx.fillText('SLIME STATUS', slimeX + Math.floor(slimeBoxWidth / 2), slimeY + slimeBoxHeight - 6);
              ctx.textAlign = 'left';
            }

            const metaX = padding + contentWidth - 440;
            drawRect(metaX, y + 24, 416, 172, 'rgba(13, 23, 34, 0.86)', 'rgba(149, 166, 184, 0.26)', 1);
            ctx.fillStyle = '#95a6b8';
            ctx.font = '600 13px ' + fontFamily;
            const headerMetaLines = [
              'Generated: ' + String(payload.generatedAt || '-'),
              'Chaos: ' + String(coalesce(payload.chaos, '-')),
              'Time Left: ' + String(coalesce(payload.timeLeft, '-')) + 'm',
              'Rounds: ' + String(payload.rounds || '-'),
              'Play: ${PUBLIC_SHARE_URL}',
            ];
            headerMetaLines.forEach((line, index) => {
              ctx.fillText(line, metaX + 18, y + 56 + (index * 28));
            });

            y += headerHeight + sectionGap;

            drawRect(padding, y, contentWidth, metricsHeight, 'rgba(11, 20, 30, 0.82)', 'rgba(149, 166, 184, 0.24)', 1.5);
            ctx.fillStyle = '#38bdf8';
            ctx.font = '700 20px ' + fontFamily;
            ctx.fillText('TACTICAL METRICS', padding + 24, y + 36);

            const gridTop = y + 58;
            const cols = 4;
            const rows = 2;
            const cardGapX = 14;
            const cardGapY = 14;
            const cardW = Math.floor((contentWidth - 40 - (cardGapX * (cols - 1))) / cols);
            const cardH = Math.floor((metricsHeight - 78 - (cardGapY * (rows - 1))) / rows);

            stats.forEach(([label, value], index) => {
              const col = index % cols;
              const row = Math.floor(index / cols);
              const cardX = padding + 20 + (col * (cardW + cardGapX));
              const cardY = gridTop + (row * (cardH + cardGapY));
              drawRect(cardX, cardY, cardW, cardH, 'rgba(16, 28, 41, 0.78)', 'rgba(149, 166, 184, 0.24)', 1);
              ctx.fillStyle = '#95a6b8';
              ctx.font = '600 13px ' + fontFamily;
              ctx.fillText(label, cardX + 14, cardY + 24);
              ctx.fillStyle = '#f3f6fa';
              ctx.font = '700 34px ' + fontFamily;
              ctx.fillText(value, cardX + 14, cardY + 66);
            });

            y += metricsHeight + sectionGap;

            drawRect(padding, y, contentWidth, verdictHeight, 'rgba(23, 32, 46, 0.84)', 'rgba(255, 184, 48, 0.36)', 1.5);
            ctx.fillStyle = '#ffb830';
            ctx.font = '700 17px ' + fontFamily;
            ctx.fillText('MISSION VERDICT', padding + 24, y + 34);
            ctx.fillStyle = '#f3f6fa';
            ctx.font = '600 28px ' + fontFamily;
            verdictLines.forEach((line, index) => {
              ctx.fillText(line, padding + 24, y + 76 + (index * 34));
            });

            y += verdictHeight + sectionGap;

            drawRect(padding, y, contentWidth, transcriptHeight, 'rgba(11, 20, 30, 0.84)', 'rgba(149, 166, 184, 0.24)', 1.5);
            ctx.fillStyle = '#38bdf8';
            ctx.font = '700 16px ' + fontFamily;
            ctx.fillText('REPORT SNAPSHOT', padding + 24, y + 30);
            ctx.fillStyle = '#d6e2ef';
            ctx.font = '500 18px ' + fontFamily;
            transcriptLines.forEach((line, index) => {
              ctx.fillText(line, padding + 24, y + 68 + (index * 28));
            });

            y += transcriptHeight + sectionGap;

            drawRect(padding, y, contentWidth, footerHeight, 'rgba(10, 17, 24, 0.86)', 'rgba(149, 166, 184, 0.24)', 1.5);
            ctx.fillStyle = '#38bdf8';
            ctx.font = '600 20px ' + fontFamily;
            ctx.fillText('${PUBLIC_SHARE_URL}', padding + 24, y + 44);
            ctx.fillStyle = '#95a6b8';
            ctx.font = '600 14px ' + fontFamily;
            ctx.fillText('Rendered for community sharing - clear layout edition', padding + 24, y + 64);

            const safeName = String(payload.player || 'commander').replace(/[^a-zA-Z0-9-_]/g, '-').slice(0, 30) || 'commander';
            triggerPngDownload(canvas, 'bug-war-room-report-' + safeName + '.png');
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
