"""
rag_viz.py — phần nhìn thấy được của pipeline.

Ba khung hình, mỗi khung trả lời một câu hỏi khi học:

  PipelineDiagram  pipeline đang chạy tới bước nào?
  ScoreChart       vì sao chunk NÀY được chọn còn chunk kia thì không?
  EmbeddingMap     các chunk nằm đâu trong không gian vector so với câu hỏi?

Không dùng Tk, chỉ trả về PIL.Image, nên test được không cần màn hình.
"""

from __future__ import annotations

import math
import time
from typing import List, Optional, Sequence, Tuple

import numpy as np
from PIL import Image, ImageDraw, ImageFont

BG = (14, 17, 22)
PANEL = (22, 26, 33)
LINE = (44, 54, 68)
TEXT = (139, 148, 158)
TEXT_HI = (201, 209, 217)

ACCENT = (34, 211, 238)      # lam — bước/chunk đang hoạt động
PICKED = (52, 211, 153)      # lục — chunk lọt top-k
DROPPED = (71, 85, 105)      # xám — chunk bị loại
QUERY = (251, 191, 36)       # vàng — câu hỏi
WARN = (248, 113, 113)

STEPS = [
    ("LOAD", "documents → raw text"),
    ("CHUNK", "raw text → chunks"),
    ("EMBED", "chunks → embeddings"),
    ("RETRIEVE", "cosine similarity → top-k"),
    ("GENERATE", "prompt → LLM answer"),
]


def _font(size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    """Nạp font TrueType có hỗ trợ Unicode/tiếng Việt nếu có, fallback về default."""
    candidates = (
        "segoeui.ttf", "arial.ttf", "calibri.ttf",
        "DejaVuSans.ttf", "Arial.ttf", "Helvetica.ttf"
    )
    for name in candidates:
        try:
            return ImageFont.truetype(name, size)
        except Exception:
            continue
    try:
        return ImageFont.load_default(size=size)
    except TypeError:  # Pillow < 10.1
        return ImageFont.load_default()


class _TextCache:
    """Nhãn dựng sẵn thành tile RGBA rồi tái dùng. Vẽ chữ là phần tốn kém nhất
    của mỗi khung, mà nội dung nhãn gần như không đổi giữa các khung."""

    def __init__(self, font: ImageFont.ImageFont, limit: int = 400):
        self.font = font
        self.limit = limit
        self._d: dict = {}

    def tile(self, text: str, col: Tuple[int, int, int]) -> Image.Image:
        key = (text, col)
        t = self._d.get(key)
        if t is None:
            try:
                bbox = self.font.getbbox(text)
                w = max(int(bbox[2] - bbox[0]) + 4, 1)
                h = max(int(bbox[3] - bbox[1]) + 4, 16)
            except Exception:
                w = int(self.font.getlength(text)) + 4
                h = 16
            t = Image.new("RGBA", (w, h), (0, 0, 0, 0))
            ImageDraw.Draw(t).text((0, 0), text, font=self.font, fill=(*col, 255))
            if len(self._d) > self.limit:
                self._d.clear()
            self._d[key] = t
        return t

    def clear(self) -> None:
        self._d.clear()


def _mix(a: Tuple[int, int, int], b: Tuple[int, int, int], t: float) -> Tuple[int, int, int]:
    t = max(0.0, min(1.0, t))
    return tuple(int(x + (y - x) * t) for x, y in zip(a, b))  # type: ignore


# ==========================================================================
# Sơ đồ pipeline
# ==========================================================================


class PipelineDiagram:
    """
    Năm ô nối tiếp nhau. Ô đang chạy sáng lên và có vòng xung, các ô đã xong
    chuyển màu lục. Mục đích: người học luôn biết mình đang ở bước nào.
    """

    def __init__(self, width: int = 900, height: int = 96):
        self.f_name = _font(12)
        self.f_sub = _font(10)
        self.resize(width, height)
        self.active: int = -1      # -1 = chưa chạy gì
        self.done_until: int = -1
        self._t0 = time.monotonic()

    def resize(self, width: int, height: int) -> None:
        self.w = max(420, int(width))
        self.h = max(70, int(height))

    def set_step(self, idx: int, done: bool = False) -> None:
        self.active = idx
        if done:
            self.done_until = max(self.done_until, idx)
            self.active = -1
        self._t0 = time.monotonic()

    def reset(self) -> None:
        self.active = -1
        self.done_until = -1

    def frame(self) -> Image.Image:
        im = Image.new("RGBA", (self.w, self.h), (*BG, 255))
        d = ImageDraw.Draw(im, "RGBA")

        n = len(STEPS)
        gap = 26
        bw = (self.w - 24 - gap * (n - 1)) / n
        y0, y1 = 16, self.h - 18
        pulse = 0.5 + 0.5 * math.sin((time.monotonic() - self._t0) * 5.0)

        for i, (name, sub) in enumerate(STEPS):
            x0 = 12 + i * (bw + gap)
            x1 = x0 + bw

            if i == self.active:
                col = _mix(ACCENT, (255, 255, 255), pulse * 0.35)
                fill = (*_mix(PANEL, ACCENT, 0.18), 255)
                bwid = 2
            elif i <= self.done_until:
                col = PICKED
                fill = (*_mix(PANEL, PICKED, 0.10), 255)
                bwid = 1
            else:
                col = LINE
                fill = (*PANEL, 255)
                bwid = 1

            d.rounded_rectangle([x0, y0, x1, y1], radius=7, fill=fill,
                                outline=(*col, 255), width=bwid)

            label = f"{i + 1}. {name}"
            tw = d.textlength(label, font=self.f_name)
            tc = TEXT_HI if i <= max(self.done_until, self.active) else TEXT
            d.text((x0 + (bw - tw) / 2, y0 + 9), label, font=self.f_name, fill=tc)
            sw = d.textlength(sub, font=self.f_sub)
            d.text((x0 + (bw - sw) / 2, y0 + 27), sub, font=self.f_sub, fill=TEXT)

            if i == self.active:  # vòng xung quanh ô đang chạy
                r = 3 + pulse * 5
                d.rounded_rectangle([x0 - r, y0 - r, x1 + r, y1 + r], radius=10,
                                    outline=(*ACCENT, int(90 * (1 - pulse))), width=2)

            if i < n - 1:  # mũi tên nối
                ax, ay = x1 + 6, (y0 + y1) / 2
                ac = PICKED if i < self.done_until else LINE
                d.line([(ax, ay), (ax + gap - 12, ay)], fill=(*ac, 255), width=2)
                d.polygon([(ax + gap - 12, ay), (ax + gap - 18, ay - 4),
                           (ax + gap - 18, ay + 4)], fill=(*ac, 255))
        return im


# ==========================================================================
# Biểu đồ điểm số
# ==========================================================================


class ScoreChart:
    """
    Xếp mọi chunk theo điểm giảm dần. Thanh lục = lọt top-k, xám = bị loại.

    Đây là khung hình đáng nhìn nhất khi học, vì nó cho thấy ngay hai thứ mà
    con số top-k giấu đi:

      - VÁCH: nếu điểm rơi mạnh sau hạng 1 thì truy hồi dứt khoát; nếu nó thoai
        thoải thì k đoạn đầu chẳng hơn gì đoạn thứ k+1, tức truy hồi mơ hồ.
      - SÀN: khi hỏi câu tài liệu không có, TẤT CẢ thanh đều thấp lè tè. Naive
        RAG vẫn trả về k đoạn như thường — nó không hề biết mình đang trượt.
    """

    def __init__(self, width: int = 560, height: int = 300):
        self.f = _font(10)
        self.f_hi = _font(11)
        self.cache = _TextCache(self.f)
        self.resize(width, height)
        self.scores: np.ndarray = np.array([])
        self.labels: List[str] = []
        self.k: int = 0
        self.min_score: float = 0.0
        self._t0 = time.monotonic()
        self.max_bars = 24

    def resize(self, width: int, height: int) -> None:
        self.w = max(320, int(width))
        self.h = max(180, int(height))

    def set_result(self, result, k: int, min_score: float = 0.0) -> None:
        s = np.asarray(result.all_scores, dtype=np.float32)
        order = np.argsort(-s)[: self.max_bars]
        self.scores = s[order]
        self.labels = [result_chunk_label(result, int(i)) for i in order]
        self.k = k
        self.min_score = min_score
        self.cache.clear()
        self._t0 = time.monotonic()

    def clear(self) -> None:
        self.scores = np.array([])
        self.labels = []

    def frame(self) -> Image.Image:
        im = Image.new("RGBA", (self.w, self.h), (*BG, 255))
        d = ImageDraw.Draw(im, "RGBA")

        if self.scores.size == 0:
            msg = "Đặt câu hỏi để xem score chart"
            d.text(((self.w - d.textlength(msg, font=self.f_hi)) / 2, self.h / 2 - 6),
                   msg, font=self.f_hi, fill=TEXT)
            return im

        pad_l, pad_r, pad_t, pad_b = 34, 12, 26, 22
        gw = self.w - pad_l - pad_r
        gh = self.h - pad_t - pad_b
        n = len(self.scores)
        bh = gh / n
        top = max(float(self.scores.max()), 1e-6)

        # animation: các thanh mọc dần ra, lệch pha theo thứ hạng
        age = time.monotonic() - self._t0
        d.text((pad_l, 8), "Cosine similarity score của từng chunk (giảm dần)",
               font=self.f, fill=TEXT)

        for i, sc in enumerate(self.scores):
            grow = max(0.0, min(1.0, (age - i * 0.022) / 0.28))
            grow = 1 - (1 - grow) ** 3
            y = pad_t + i * bh
            bar_h = max(2.0, bh - 3)
            length = gw * (max(0.0, float(sc)) / top) * grow

            picked = i < self.k and float(sc) >= self.min_score
            col = PICKED if picked else DROPPED
            d.rectangle([pad_l, y, pad_l + max(length, 1.0), y + bar_h],
                        fill=(*col, 235 if picked else 165))

            im.alpha_composite(self.cache.tile(str(i + 1), TEXT_HI if picked else TEXT),
                               (4, int(y + bar_h / 2) - 8))

            if grow > 0.75:  # nhãn chỉ hiện khi thanh đã mọc gần xong
                txt = f"{float(sc):.3f}  {self.labels[i]}"[:52]
                avail = gw - length - 8
                if avail < 120:      # không đủ chỗ bên phải -> viết đè lên thanh
                    tile = self.cache.tile(txt, (10, 14, 18))
                    im.alpha_composite(tile, (int(pad_l) + 6, int(y + bar_h / 2) - 8))
                else:
                    tile = self.cache.tile(txt, TEXT_HI if picked else TEXT)
                    im.alpha_composite(tile, (int(pad_l + length) + 6,
                                              int(y + bar_h / 2) - 8))

        # đường ngưỡng min_score
        if self.min_score > 0:
            x = pad_l + gw * (self.min_score / top)
            if x < self.w - pad_r:
                for yy in range(int(pad_t), int(pad_t + gh), 6):
                    d.line([(x, yy), (x, yy + 3)], fill=(*WARN, 190), width=1)
                d.text((min(x + 3, self.w - 85), self.h - 18),
                       f"Threshold {self.min_score:.2f}", font=self.f, fill=(*WARN, 220))

        # cảnh báo khi mọi điểm đều thấp
        if float(self.scores.max()) < 0.15:
            d.text((pad_l, self.h - 18),
                   "⚠ Mọi scores đều rất thấp — documents có thể không chứa câu trả lời",
                   font=self.f, fill=WARN)
        return im


def result_chunk_label(result, idx: int) -> str:
    """Lấy đoạn xem trước của chunk thứ idx trong kết quả."""
    for h in result.hits:
        if h.chunk.id == idx:
            return h.chunk.preview(46)
    store_chunks = getattr(result, "_chunks", None)
    if store_chunks and 0 <= idx < len(store_chunks):
        return store_chunks[idx].preview(46)
    return f"chunk #{idx}"


# ==========================================================================
# Bản đồ không gian vector
# ==========================================================================


class EmbeddingMap:
    """
    Chiếu vector nhiều chiều xuống 2D bằng PCA để nhìn được bằng mắt.

    Cảnh báo cần nói rõ với người học: PCA vứt bỏ phần lớn số chiều, nên hai
    chấm trông gần nhau trên hình CHƯA CHẮC gần nhau thật. Bảng điểm mới là sự
    thật; hình này chỉ để có cảm giác về hình dạng của không gian.
    """

    def __init__(self, width: int = 560, height: int = 300):
        self.f = _font(10)
        self.resize(width, height)
        self.pts: Optional[np.ndarray] = None
        self.qpt: Optional[np.ndarray] = None
        self.scores: Optional[np.ndarray] = None
        self.top_idx: List[int] = []
        self.var_kept: float = 0.0
        self._t0 = time.monotonic()

    def resize(self, width: int, height: int) -> None:
        self.w = max(300, int(width))
        self.h = max(180, int(height))

    def set_data(self, matrix: np.ndarray, query_vec: Optional[np.ndarray],
                 scores: Optional[np.ndarray], top_idx: Sequence[int]) -> None:
        if matrix is None or matrix.shape[0] < 2:
            self.pts = None
            return

        data = matrix if query_vec is None else np.vstack([matrix, query_vec[None, :]])
        mean = data.mean(axis=0, keepdims=True)
        centered = data - mean
        # PCA qua SVD — lấy 3 thành phần đầu để dựng được khối 3D
        try:
            _, sv, vt = np.linalg.svd(centered, full_matrices=False)
        except np.linalg.LinAlgError:
            self.pts = None
            return
        proj = centered @ vt[:3].T
        # Ít điểm hoặc dữ liệu suy biến thì SVD trả về ít hơn 3 thành phần —
        # đệm cho đủ 3 cột, nếu không mọi phép tính 3D bên dưới sẽ vỡ.
        if proj.shape[1] < 3:
            proj = np.hstack([proj, np.zeros((proj.shape[0], 3 - proj.shape[1]),
                                             dtype=proj.dtype)])
        total = float((sv ** 2).sum())
        self.var_kept = float((sv[:3] ** 2).sum() / total) if total > 0 else 0.0

        if query_vec is not None:
            self.pts, self.qpt = proj[:-1], proj[-1]
        else:
            self.pts, self.qpt = proj, None
        self.scores = scores
        self.top_idx = list(top_idx)
        self._t0 = time.monotonic()

    def clear(self) -> None:
        self.pts = None
        self.qpt = None

    def frame(self) -> Image.Image:
        im = Image.new("RGBA", (self.w, self.h), (*BG, 255))
        d = ImageDraw.Draw(im, "RGBA")

        if self.pts is None or len(self.pts) == 0:
            msg = "Index documents để xem embedding space (3D PCA)"
            d.text(((self.w - d.textlength(msg, font=self.f)) / 2, self.h / 2 - 6),
                   msg, font=self.f, fill=TEXT)
            return im

        allp = self.pts if self.qpt is None else np.vstack([self.pts, self.qpt])
        # Chuẩn hoá vào khối [-1,1] với CÙNG một hệ số cho cả 3 trục — chia
        # riêng từng trục sẽ bóp méo hình dạng đám mây, mà hình dạng mới là thứ
        # người xem cần cảm nhận.
        centre = (allp.max(axis=0) + allp.min(axis=0)) / 2.0
        radius = float(np.max(np.abs(allp - centre))) or 1.0
        norm = (allp - centre) / radius
        pts3 = norm[:-1] if self.qpt is not None else norm
        qp3 = norm[-1] if self.qpt is not None else None

        age = time.monotonic() - self._t0
        ang = age * 0.35                      # xoay chậm quanh trục đứng
        ca, sa = math.cos(ang), math.sin(ang)
        cx, cy = self.w / 2.0, self.h / 2.0 + 6
        scale = min(self.w, self.h) * 0.34
        FOCAL = 3.2                           # càng nhỏ phối cảnh càng mạnh

        def project(p: np.ndarray) -> Tuple[float, float, float]:
            """(x,y,z) -> (px, py, độ sâu). Độ sâu dùng để sắp thứ tự vẽ."""
            x, y, z = float(p[0]), float(p[1]), float(p[2])
            xr = x * ca + z * sa
            zr = -x * sa + z * ca
            k = FOCAL / (FOCAL + zr)          # xa thì co lại, gần thì to ra
            return cx + xr * k * scale, cy - y * k * scale, zr

        d.rectangle([1, 1, self.w - 2, self.h - 2], outline=(*LINE, 160), width=1)
        d.text((8, 6), f"3D PCA · giữ lại {self.var_kept * 100:.0f}% variance",
               font=self.f, fill=TEXT)

        # khung dây của khối, cho mắt bám được hướng xoay
        corners = [np.array([sx, sy, sz], dtype=float)
                   for sx in (-1, 1) for sy in (-1, 1) for sz in (-1, 1)]
        cpx = [project(c) for c in corners]
        for a in range(8):
            for b in range(a + 1, 8):
                # chỉ nối các cạnh (khác nhau đúng 1 toạ độ)
                if int(np.sum(np.abs(corners[a] - corners[b]) > 1e-9)) != 1:
                    continue
                za = (cpx[a][2] + cpx[b][2]) / 2.0
                fade = 30 + int(34 * (1.0 - (za + 1) / 2))
                d.line([(cpx[a][0], cpx[a][1]), (cpx[b][0], cpx[b][1])],
                       fill=(*LINE, fade), width=1)

        qpx = project(qp3) if qp3 is not None else None
        top = set(self.top_idx)

        # đường nối từ câu hỏi tới các chunk được chọn, vẽ lan dần ra
        if qpx is not None:
            for j, i in enumerate(self.top_idx):
                if i >= len(pts3):
                    continue
                grow = max(0.0, min(1.0, (age - j * 0.08) / 0.3))
                px, py, _ = project(pts3[i])
                d.line([(qpx[0], qpx[1]),
                        (qpx[0] + (px - qpx[0]) * grow,
                         qpx[1] + (py - qpx[1]) * grow)],
                       fill=(*PICKED, 150), width=1)

        # Vẽ từ xa tới gần (painter's algorithm) để điểm gần đè lên điểm xa —
        # thiếu bước này thì cảm giác chiều sâu biến mất.
        order = sorted(range(len(pts3)), key=lambda i: project(pts3[i])[2])
        for i in order:
            x, y, z = project(pts3[i])
            near = (1.0 - (z + 1) / 2)        # 0 = xa nhất, 1 = gần nhất
            if i in top:
                r = 3.6 + 2.4 * near
                a = int(150 + 90 * near)
                d.ellipse([x - r, y - r, x + r, y + r], fill=(*PICKED, a))
                halo = r + 3
                d.ellipse([x - halo, y - halo, x + halo, y + halo],
                          outline=(*PICKED, int(60 + 60 * near)), width=1)
            else:
                t = 0.0
                if self.scores is not None and i < len(self.scores):
                    mx = float(np.max(self.scores)) or 1.0
                    t = max(0.0, float(self.scores[i]) / mx)
                col = _mix(DROPPED, ACCENT, t * 0.65)
                r = 1.9 + 1.7 * near
                d.ellipse([x - r, y - r, x + r, y + r],
                          fill=(*col, int(110 + 90 * near)))

        if qpx is not None:  # câu hỏi vẽ thành ngôi sao
            near_q = (1.0 - (qpx[2] + 1) / 2)
            self._star(d, qpx[0], qpx[1], 6.5 + 3.0 * near_q, QUERY)
            d.text((qpx[0] + 11, qpx[1] - 6), "query", font=self.f, fill=(*QUERY, 235))

        d.text((8, self.h - 16),
               "Hình chiếu 3D PCA chỉ để tham khảo trực quan — score chart mới là căn cứ chính xác",
               font=self.f, fill=(90, 100, 115))
        return im

    @staticmethod
    def _star(d: ImageDraw.ImageDraw, cx: float, cy: float, r: float,
              col: Tuple[int, int, int]) -> None:
        pts = []
        for i in range(10):
            ang = -math.pi / 2 + i * math.pi / 5
            rad = r if i % 2 == 0 else r * 0.44
            pts.append((cx + rad * math.cos(ang), cy + rad * math.sin(ang)))
        d.polygon(pts, fill=(*col, 245))


# ==========================================================================
# Bộ chạy animation cho Tk
# ==========================================================================


class VizAnimator:
    """Bơm khung hình lên các canvas bằng after(). FPS thấp vì hình tĩnh phần lớn."""

    FPS_MS = 40

    def __init__(self, widget, renderers: Sequence[Tuple[object, object]]):
        """renderers: [(đối tượng có .frame(), hàm nhận PIL.Image)]"""
        self.widget = widget
        self.renderers = list(renderers)
        self._job = None
        self._running = False

    def start(self) -> None:
        if self._running:
            return
        self._running = True
        self._tick()

    def stop(self) -> None:
        self._running = False
        if self._job is not None:
            try:
                self.widget.after_cancel(self._job)
            except Exception:
                pass
            self._job = None

    def _tick(self) -> None:
        if not self._running:
            return
        for renderer, sink in self.renderers:
            try:
                sink(renderer.frame())
            except Exception:
                pass
        self._job = self.widget.after(self.FPS_MS, self._tick)
