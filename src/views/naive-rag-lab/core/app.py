"""
Chạy:  python app.py
"""

from __future__ import annotations

import os
import queue
import sys
import threading
import traceback
from typing import Any, Dict, List, Optional, Tuple

if sys.platform.startswith("win"):
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(encoding="utf-8")

import customtkinter as ctk
import numpy as np
import tkinter as tk
from PIL import ImageTk
from tkinter import filedialog, messagebox

import rag_core as R
import rag_viz as V

APP = "RAG Lab"
BG = "#0e1116"
PANEL = "#161a21"
SUNK = "#0d1117"
ACCENT = "#22d3ee"
ACCENT_DIM = "#0891b2"
PICKED = "#34d399"
MUTED = "#8b949e"
LINE = "#2c3644"


# Cỡ chữ hai vùng đọc nhiều nhất, gom ra đây cho dễ chỉnh.
FS_CHAT = 14      # khung chat giữa
FS_PANEL = 13     # 5 tab bên phải

# Xếp theo thứ tự ưu tiên: mấy font đầu có chữ dễ đọc hơn và hỗ trợ dấu tiếng
# Việt tốt hơn Consolas. Dò xem máy có cái nào rồi mới lùi dần.
_MONO_PREFS = ("Cascadia Code", "Cascadia Mono", "JetBrains Mono",
               "Fira Code", "Consolas", "Menlo", "DejaVu Sans Mono")
_mono_cached: str = ""


def mono() -> str:
    """Font đơn cách đẹp nhất mà máy đang có. Kết quả được cache."""
    global _mono_cached
    if _mono_cached:
        return _mono_cached
    try:
        import tkinter.font as tkfont
        have = {f.lower() for f in tkfont.families()}
        for name in _MONO_PREFS:
            if name.lower() in have:
                _mono_cached = name
                return _mono_cached
    except Exception:
        pass
    _mono_cached = _mono_fallback()
    return _mono_cached


def _mono_fallback() -> str:
    if sys.platform.startswith("win"):
        return "Consolas"
    if sys.platform == "darwin":
        return "Menlo"
    return "DejaVu Sans Mono"


class RagLab(ctk.CTk):
    def __init__(self) -> None:
        super().__init__()
        self.title(f"{APP} — Naive RAG step-by-step")
        self._fit_to_screen(1460, 920, min_w=980, min_h=640)
        self.configure(fg_color=BG)

        self.pipe = R.Pipeline()
        self.docs: List[Tuple[str, str]] = []
        self.last: Optional[R.RetrievalResult] = None
        self.busy = False
        self.q: "queue.Queue[tuple]" = queue.Queue()
        self._photos: Dict[str, Any] = {}
        self._items: Dict[str, Any] = {}

        self.diagram = V.PipelineDiagram(900, 96)
        self.chart = V.ScoreChart(560, 300)
        self.emap = V.EmbeddingMap(560, 300)

        self._build_ui()
        self.anim = V.VizAnimator(self, [
            (self.diagram, lambda im: self._blit("diagram", im)),
            (self.chart, lambda im: self._blit("chart", im)),
            (self.emap, lambda im: self._blit("map", im)),
        ])
        self.anim.start()
        self.after(60, self._poll)
        self.load_sample()

    # ==================================================================
    # Giao diện
    # ==================================================================

    def _build_ui(self) -> None:
        self.grid_columnconfigure(1, weight=3)
        # Cần minsize chứ không chỉ weight: weight chỉ chia phần DƯ, mà cột giữa
        # (ô chat) có kích thước tối thiểu lớn nên ăn hết chỗ, ép cột phải hẹp
        # lại tới mức 5 nhãn tab bị cắt cụt cả đầu lẫn đuôi.
        #
        # Lưu ý: grid_columnconfigure(minsize=) là API Tk thuần, tính bằng PIXEL
        # THẬT — CustomTkinter không nhân hệ số DPI vào đây như khi nó xử lý
        # geometry() hay width= của widget. Trên màn 150% mà đặt 330 thì vẫn là
        # 330px thật, tức nhỏ hơn cả bề rộng sẵn có, nên không có tác dụng gì.
        self.grid_columnconfigure(2, weight=4, minsize=520)
        self.grid_rowconfigure(1, weight=1)

        # ---------------- sơ đồ pipeline trên cùng ----------------
        top = ctk.CTkFrame(self, fg_color=BG, corner_radius=0, height=110)
        top.grid(row=0, column=0, columnspan=3, sticky="ew")
        top.grid_propagate(False)
        self.cv_diagram = tk.Canvas(top, bg=BG, highlightthickness=0, bd=0, height=100)
        self.cv_diagram.pack(fill="both", expand=True, padx=10, pady=5)
        self.cv_diagram.bind("<Configure>",
                             lambda e: self.diagram.resize(e.width, e.height))

        # ---------------- cột trái: cấu hình ----------------
        # Cột chia hai tầng: bước 1-4 nằm trong vùng cuộn, bước 5 GHIM ĐÁY.
        # Nhét cả 5 bước vào một CTkScrollableFrame thì nội dung cao hơn khung
        # ~170px, và thứ bị đẩy khuất lại đúng là ô chọn chế độ với ô API key —
        # hai thứ người dùng cần bấm, chứ không phải thứ để đọc lướt.
        col = ctk.CTkFrame(self, width=290, fg_color=PANEL, corner_radius=0)
        col.grid(row=1, column=0, sticky="nsew")
        col.grid_propagate(False)
        col.grid_rowconfigure(0, weight=1)
        col.grid_columnconfigure(0, weight=1)

        scroll = ctk.CTkScrollableFrame(
            col, fg_color=PANEL, corner_radius=0,
            # thanh cuộn mặc định chìm nghỉm trong nền tối -> không ai biết còn
            # nội dung phía dưới
            scrollbar_button_color="#39424f",
            scrollbar_button_hover_color=ACCENT_DIM,
        )
        scroll.grid(row=0, column=0, sticky="nsew")

        # Bọc nội dung trong một card có lề. Pack thẳng vào CTkScrollableFrame
        # thì widget dán sát mép trái khung, chữ trông như bị xén — nhất là khi
        # cửa sổ nằm sát cạnh màn hình. `left` vẫn là tên cũ nên toàn bộ phần
        # dựng bước 1-4 bên dưới không phải sửa gì.
        left = ctk.CTkFrame(scroll, fg_color="transparent")
        left.pack(fill="both", expand=True, padx=(14, 10))

        gen = ctk.CTkFrame(col, fg_color=PANEL, corner_radius=0)
        gen.grid(row=1, column=0, sticky="ew", padx=(14, 16), pady=(0, 10))

        ctk.CTkLabel(left, text="◆ " + APP, font=ctk.CTkFont(size=19, weight="bold"),
                     text_color=ACCENT).pack(anchor="w", pady=(6, 0))
        ctk.CTkLabel(left, text="naive RAG · không rerank, không hybrid search",
                     font=ctk.CTkFont(size=10), text_color=MUTED).pack(anchor="w", pady=(0, 8))

        self._sec(left, "1 · DOCUMENTS")
        ctk.CTkButton(left, text="Open files…", height=32, command=self.open_files,
                      fg_color="#243040", hover_color="#2f3d51").pack(fill="x")
        ctk.CTkButton(left, text="Dùng sample documents", height=28, command=self.load_sample,
                      fg_color="transparent", border_width=1, border_color=LINE,
                      text_color=MUTED, hover_color="#1d232c",
                      font=ctk.CTkFont(size=11)).pack(fill="x", pady=(5, 0))
        self.lbl_docs = ctk.CTkLabel(left, text="", font=ctk.CTkFont(size=11),
                                     text_color=MUTED, anchor="w", justify="left")
        self.lbl_docs.pack(fill="x", pady=(6, 0))

        # --- bước 2: chunk ---
        self._sec(left, "2 · CHUNK")
        self.v_strategy = ctk.StringVar(value="By Paragraph")
        ctk.CTkOptionMenu(left, values=list(R.CHUNKERS.keys()), variable=self.v_strategy,
                          height=30, fg_color=SUNK, button_color="#243040",
                          font=ctk.CTkFont(size=12)).pack(fill="x")

        self.v_size = ctk.IntVar(value=500)
        self._slider(left, "Chunk size", self.v_size, 100, 1500, 28, "chars")
        self.v_overlap = ctk.IntVar(value=100)
        self._slider(left, "Chunk overlap", self.v_overlap, 0, 400, 40, "chars")
        self.v_minchunk = ctk.IntVar(value=80)
        self._slider(left, "Merge short chunks", self.v_minchunk, 0, 300, 30, "chars")
        ctk.CTkLabel(left, text="đặt 0 để thấy bẫy “orphan heading”",
                     font=ctk.CTkFont(size=10), text_color="#5a6472",
                     anchor="w").pack(fill="x")

        # --- bước 3: embed ---
        self._sec(left, "3 · EMBED")
        self.v_emb = ctk.StringVar(value="TF-IDF")
        ctk.CTkOptionMenu(left, values=list(R.EMBEDDERS.keys()), variable=self.v_emb,
                          height=30, fg_color=SUNK, button_color="#243040",
                          command=self._on_emb_change,
                          font=ctk.CTkFont(size=12)).pack(fill="x")
        self.lbl_emb = ctk.CTkLabel(left, text=R.TfidfEmbedder.explain,
                                    font=ctk.CTkFont(size=10), text_color="#5a6472",
                                    anchor="w", justify="left", wraplength=250)
        self.lbl_emb.pack(fill="x", pady=(4, 0))

        ctk.CTkButton(left, text="⟳  BUILD INDEX", height=40, command=self.build_index,
                      fg_color=ACCENT_DIM, hover_color=ACCENT, text_color="#02181d",
                      font=ctk.CTkFont(size=14, weight="bold")).pack(fill="x", pady=(10, 0))
        self.prog = ctk.CTkProgressBar(left, height=4, progress_color=ACCENT)
        self.prog.set(0)
        self.prog.pack(fill="x", pady=(6, 0))
        self.lbl_index = ctk.CTkLabel(left, text="", font=ctk.CTkFont(family=mono(), size=10),
                                      text_color=MUTED, anchor="w", justify="left")
        self.lbl_index.pack(fill="x", pady=(6, 0))

        # --- bước 4: retrieve ---
        self._sec(left, "4 · RETRIEVE")
        self.v_k = ctk.IntVar(value=4)
        self._slider(left, "Top-k", self.v_k, 1, 12, 11, "chunks")
        self.v_minscore = ctk.DoubleVar(value=0.05)
        self._slider(left, "Score threshold", self.v_minscore, 0.0, 0.6, 60, "", is_float=True)

        # --- bước 5: generate (ghim đáy, không nằm trong vùng cuộn) ---
        self._sec(gen, "5 · GENERATE")
        self.v_mode = ctk.StringVar(value="Retrieve-only")
        ctk.CTkSegmentedButton(gen, values=["Retrieve-only", "Gemini", "Claude"],
                               variable=self.v_mode, font=ctk.CTkFont(size=11),
                               command=self._on_mode_change,
                               selected_color=ACCENT_DIM, selected_hover_color=ACCENT,
                               unselected_color="#1d232c").pack(fill="x")
        self.v_key = ctk.StringVar(value="")
        self.ent_key = ctk.CTkEntry(gen, textvariable=self.v_key, show="•", height=28,
                                    placeholder_text="không cần key",
                                    fg_color=SUNK, border_color=LINE,
                                    font=ctk.CTkFont(size=11))
        self.ent_key.pack(fill="x", pady=(5, 0))
        self.lbl_gen = ctk.CTkLabel(gen, text="", font=ctk.CTkFont(size=10),
                                    text_color="#5a6472", anchor="w", justify="left",
                                    wraplength=250)
        self.lbl_gen.pack(fill="x", pady=(4, 0))
        self._on_mode_change("Retrieve-only")

        # ---------------- cột giữa: chat ----------------
        mid = ctk.CTkFrame(self, fg_color=BG, corner_radius=0)
        mid.grid(row=1, column=1, sticky="nsew")
        mid.grid_columnconfigure(0, weight=1)
        mid.grid_rowconfigure(0, weight=1)

        chat_wrap = ctk.CTkFrame(mid, fg_color=PANEL, corner_radius=10)
        chat_wrap.grid(row=0, column=0, sticky="nsew", padx=12, pady=(10, 6))
        chat_wrap.grid_columnconfigure(0, weight=1)
        chat_wrap.grid_rowconfigure(0, weight=1)
        self.chat = tk.Text(chat_wrap, bg=SUNK, fg="#d5dde6", font=(mono(), FS_CHAT),
                            relief="flat", wrap="word", padx=14, pady=12,
                            spacing1=2, spacing3=3,
                            borderwidth=0, highlightthickness=0, state="disabled")
        self.chat.grid(row=0, column=0, sticky="nsew", padx=6, pady=6)
        sb = ctk.CTkScrollbar(chat_wrap, command=self.chat.yview, width=12)
        sb.grid(row=0, column=1, sticky="ns", pady=6)
        self.chat.configure(yscrollcommand=sb.set)
        for tag, col, font in (
            ("q", "#fbbf24", (mono(), FS_CHAT, "bold")),
            ("a", "#d5dde6", (mono(), FS_CHAT)),
            ("meta", MUTED, (mono(), 10)),
            ("src", PICKED, (mono(), 10)),
            ("warn", "#f87171", (mono(), 11)),
        ):
            self.chat.tag_config(tag, foreground=col, font=font)

        ask = ctk.CTkFrame(mid, fg_color=PANEL, corner_radius=10)
        ask.grid(row=1, column=0, sticky="ew", padx=12, pady=(6, 10))
        ask.grid_columnconfigure(0, weight=1)
        self.v_query = ctk.StringVar()
        ent = ctk.CTkEntry(ask, textvariable=self.v_query, height=38, fg_color=SUNK,
                           border_color=LINE, placeholder_text="Hỏi về documents (query)…",
                           font=ctk.CTkFont(size=13))
        ent.grid(row=0, column=0, sticky="ew", padx=(10, 6), pady=10)
        ent.bind("<Return>", lambda e: self.ask())
        self.btn_ask = ctk.CTkButton(ask, text="Ask", width=84, height=38, command=self.ask,
                                     fg_color=ACCENT_DIM, hover_color=ACCENT,
                                     text_color="#02181d",
                                     font=ctk.CTkFont(size=14, weight="bold"))
        self.btn_ask.grid(row=0, column=1, padx=(0, 10), pady=10)

        sug = ctk.CTkFrame(mid, fg_color="transparent")
        sug.grid(row=2, column=0, sticky="ew", padx=12, pady=(0, 10))
        for text in ("Cosine similarity đo gì?", "Vì sao cần chunk overlap?",
                     "Cách nấu phở bò (out-of-domain)"):
            ctk.CTkButton(sug, text=text, height=26, font=ctk.CTkFont(size=11),
                          fg_color="transparent", border_width=1, border_color=LINE,
                          text_color=MUTED, hover_color="#1d232c",
                          command=lambda t=text: (self.v_query.set(t), self.ask()),
                          ).pack(side="left", padx=(0, 6))

        # ---------------- cột phải: các tab ----------------
        right = ctk.CTkFrame(self, fg_color=BG, corner_radius=0)
        right.grid(row=1, column=2, sticky="nsew")
        right.grid_columnconfigure(0, weight=1)
        right.grid_rowconfigure(0, weight=1)

        # Nhãn tab để ngắn, gọn gàng, không bị tràn trên màn hình hẹp
        self.tabs = ctk.CTkTabview(right, fg_color=PANEL, corner_radius=10,
                                   segmented_button_selected_color=ACCENT_DIM,
                                   segmented_button_selected_hover_color=ACCENT,
                                   segmented_button_fg_color=PANEL)
        self.tabs.grid(row=0, column=0, sticky="nsew", padx=(0, 12), pady=10)

        t = self.tabs.add("Scores")
        t.grid_columnconfigure(0, weight=1)
        t.grid_rowconfigure(0, weight=1)
        self.cv_chart = tk.Canvas(t, bg=BG, highlightthickness=0, bd=0)
        self.cv_chart.grid(row=0, column=0, sticky="nsew", padx=4, pady=4)
        self.cv_chart.bind("<Configure>", lambda e: self.chart.resize(e.width, e.height))

        t = self.tabs.add("Vectors")
        t.grid_columnconfigure(0, weight=1)
        t.grid_rowconfigure(0, weight=1)
        self.cv_map = tk.Canvas(t, bg=BG, highlightthickness=0, bd=0)
        self.cv_map.grid(row=0, column=0, sticky="nsew", padx=4, pady=4)
        self.cv_map.bind("<Configure>", lambda e: self.emap.resize(e.width, e.height))

        self.txt_chunks = self._textbox(self.tabs.add("Chunks"))
        self.txt_prompt = self._textbox(self.tabs.add("Prompt"))
        self.txt_cmp = self._textbox(self.tabs.add("Compare"))

        cmp_tab = self.tabs.tab("Compare")
        ctk.CTkButton(cmp_tab, text="Benchmark 3 chunking strategies × 2 embedders",
                      height=30, command=self.run_compare,
                      fg_color="#243040", hover_color="#2f3d51",
                      font=ctk.CTkFont(size=12)).grid(row=1, column=0, sticky="ew",
                                                      padx=6, pady=(0, 6))

        self.lbl_status = ctk.CTkLabel(right, text="", text_color=MUTED, anchor="w",
                                       font=ctk.CTkFont(size=11))
        self.lbl_status.grid(row=1, column=0, sticky="ew", padx=(0, 12), pady=(0, 8))

    def _fit_to_screen(self, want_w: int, want_h: int,
                       min_w: int, min_h: int) -> None:
        """
        Đặt kích thước cửa sổ nhưng không cho vượt quá màn hình.

        CustomTkinter NHÂN chuỗi geometry với hệ số DPI: trên màn hình 150%,
        geometry("1460x920") cho ra cửa sổ 2190x1380 px thật. Máy 1707x1067 sẽ
        mất hẳn 361px đáy và 483px mép phải ra ngoài màn hình — trông y như
        giao diện bị thiếu mất một khúc. Nên phải quy ngược về đơn vị logic
        rồi mới kẹp.
        """
        try:
            scaling = float(ctk.ScalingTracker.get_window_scaling(self))
        except Exception:
            scaling = 1.0
        scaling = scaling or 1.0

        # chừa chỗ cho thanh taskbar và viền cửa sổ
        avail_w = (self.winfo_screenwidth() - 80) / scaling
        avail_h = (self.winfo_screenheight() - 120) / scaling

        w = max(min_w, min(want_w, int(avail_w)))
        h = max(min_h, min(want_h, int(avail_h)))
        self.geometry(f"{w}x{h}")
        self.minsize(min(min_w, w), min(min_h, h))

    # Mỗi nhà cung cấp đọc key từ một biến môi trường khác nhau. Ô nhập key chỉ
    # để gõ tay cho tiện; cách nên dùng là đặt biến môi trường rồi không đụng
    # vào ô này — key sẽ không bao giờ nằm trong file nào để lỡ tay commit.
    GEN_MODES = {
        "Retrieve-only": (None, "Không gọi LLM, chỉ trả về retrieved chunks. "
                                "Tách bạch retrieval error khỏi generation error."),
        "Gemini": ("GEMINI_API_KEY", "Google AI Studio có free tier. "
                                     "Key đọc từ biến môi trường GEMINI_API_KEY."),
        "Claude": ("ANTHROPIC_API_KEY", "API Claude tính phí theo usage. "
                                        "Key đọc từ biến môi trường ANTHROPIC_API_KEY."),
    }

    def _on_mode_change(self, mode: str) -> None:
        env_name, hint = self.GEN_MODES.get(mode, (None, ""))
        if env_name is None:
            self.ent_key.configure(state="disabled", placeholder_text="không cần key")
            self.lbl_gen.configure(text=hint)
            return
        self.ent_key.configure(state="normal", placeholder_text=f"{env_name} (optional)")
        if os.environ.get(env_name):
            self.lbl_gen.configure(text=f"{hint}\n✓ đã thấy {env_name} trong môi trường.")
        else:
            self.lbl_gen.configure(text=f"{hint}\n✗ chưa thấy {env_name} — dán key vào ô trên.")

    def _sec(self, parent, text: str) -> None:
        ctk.CTkLabel(parent, text=text, anchor="w", text_color="#5a6472",
                     font=ctk.CTkFont(size=10, weight="bold")).pack(fill="x", pady=(14, 5))

    def _slider(self, parent, label: str, var, lo, hi, steps: int, unit: str,
                is_float: bool = False) -> None:
        row = ctk.CTkFrame(parent, fg_color="transparent")
        row.pack(fill="x", pady=(6, 0))
        ctk.CTkLabel(row, text=label, font=ctk.CTkFont(size=11),
                     text_color=MUTED).pack(side="left")
        val = ctk.CTkLabel(row, text="", font=ctk.CTkFont(family=mono(), size=11),
                           text_color=ACCENT)
        val.pack(side="right")

        def fmt(v) -> str:
            return f"{float(v):.2f}" if is_float else f"{int(float(v))} {unit}".strip()

        val.configure(text=fmt(var.get()))
        ctk.CTkSlider(parent, from_=lo, to=hi, number_of_steps=steps, variable=var,
                      height=14, button_color=ACCENT, progress_color=ACCENT_DIM,
                      command=lambda v: val.configure(text=fmt(v))).pack(fill="x")

    def _textbox(self, parent):
        parent.grid_columnconfigure(0, weight=1)
        parent.grid_rowconfigure(0, weight=1)
        tb = tk.Text(parent, bg=SUNK, fg="#d5dde6", font=(mono(), FS_PANEL),
                     relief="flat", wrap="word", padx=10, pady=8, spacing1=1, spacing3=2,
                     borderwidth=0, highlightthickness=0, state="disabled")
        tb.grid(row=0, column=0, sticky="nsew", padx=4, pady=4)
        sb = ctk.CTkScrollbar(parent, command=tb.yview, width=12)
        sb.grid(row=0, column=1, sticky="ns", pady=4)
        tb.configure(yscrollcommand=sb.set)
        tb.tag_config("hi", foreground=PICKED)
        tb.tag_config("dim", foreground=MUTED)
        tb.tag_config("head", foreground=ACCENT, font=(mono(), FS_PANEL, "bold"))
        return tb

    def _blit(self, key: str, pil_img) -> None:
        canvas = {"diagram": self.cv_diagram, "chart": self.cv_chart,
                  "map": self.cv_map}[key]
        photo = ImageTk.PhotoImage(pil_img)
        self._photos[key] = photo  # giữ tham chiếu, nếu không ảnh sẽ bị thu gom
        item = self._items.get(key)
        if item is None:
            self._items[key] = canvas.create_image(0, 0, anchor="nw", image=photo)
        else:
            canvas.itemconfigure(item, image=photo)

    def _status(self, text: str) -> None:
        self.lbl_status.configure(text=text)

    def _set(self, tb, body: str) -> None:
        tb.configure(state="normal")
        tb.delete("1.0", "end")
        tb.insert("1.0", body)
        tb.configure(state="disabled")

    def _say(self, text: str, tag: str = "a") -> None:
        self.chat.configure(state="normal")
        self.chat.insert("end", text + "\n", tag)
        self.chat.see("end")
        self.chat.configure(state="disabled")

    def _on_emb_change(self, name: str) -> None:
        self.lbl_emb.configure(text=R.EMBEDDERS[name].explain)

    # ==================================================================
    # Tài liệu
    # ==================================================================

    def load_sample(self) -> None:
        self.docs = R.sample_docs()
        self._after_load()
        self._status("Đã nạp tài liệu mẫu. Bấm LẬP CHỈ MỤC.")

    def open_files(self) -> None:
        paths = filedialog.askopenfilenames(
            title="Chọn tài liệu",
            filetypes=[("Văn bản", "*.txt *.md *.rst *.py *.json *.csv *.log"),
                       ("PDF", "*.pdf"), ("Tất cả", "*.*")])
        if not paths:
            return
        docs, errs = [], []
        for p in paths:
            try:
                docs.append((os.path.basename(p), R.load_text(p)))
            except Exception as exc:
                errs.append(f"{os.path.basename(p)}: {exc}")
        if docs:
            self.docs = docs
            self._after_load()
        if errs:
            messagebox.showwarning(APP, "\n".join(errs))

    def _after_load(self) -> None:
        total = sum(len(d[1]) for d in self.docs)
        names = ", ".join(d[0] for d in self.docs[:3])
        if len(self.docs) > 3:
            names += f" (+{len(self.docs) - 3})"
        self.lbl_docs.configure(text=f"{len(self.docs)} tệp · {total:,} ký tự\n{names}")
        self.diagram.reset()
        self.diagram.set_step(0, done=True)
        self.chart.clear()
        self.emap.clear()
        self.pipe.store = None

    # ==================================================================
    # Lập chỉ mục
    # ==================================================================

    def build_index(self) -> None:
        if not self.docs:
            messagebox.showinfo(APP, "Chưa nạp tài liệu nào.")
            return
        if self.busy:
            return

        self.pipe.chunk_strategy = self.v_strategy.get()
        self.pipe.chunk_size = int(self.v_size.get())
        self.pipe.chunk_overlap = int(self.v_overlap.get())
        self.pipe.min_chunk_chars = int(self.v_minchunk.get())
        self.pipe.embedder_name = self.v_emb.get()

        self.busy = True
        self.prog.configure(mode="indeterminate")
        self.prog.start()
        self.diagram.set_step(1)
        self._status("Đang cắt chunk và tính embedding…")
        threading.Thread(target=self._worker_index, daemon=True).start()

    def _worker_index(self) -> None:
        try:
            self.q.put(("step", 1))
            info = self.pipe.index(
                self.docs, progress=lambda a, b: self.q.put(("step", 2)))
            self.q.put(("indexed", info))
        except Exception:
            self.q.put(("error", traceback.format_exc(limit=3)))

    # ==================================================================
    # Hỏi
    # ==================================================================

    def ask(self) -> None:
        query = self.v_query.get().strip()
        if not query:
            return
        if self.pipe.store is None or not self.pipe.store.ready:
            messagebox.showinfo(APP, "Chưa lập chỉ mục. Bấm LẬP CHỈ MỤC trước.")
            return
        if self.busy:
            return

        self.pipe.top_k = int(self.v_k.get())
        self.pipe.min_score = float(self.v_minscore.get())
        # Đọc hết biến Tk NGAY TẠI ĐÂY, trên luồng UI. Biến Tk không an toàn đa
        # luồng: chạm vào từ luồng nền sẽ ném "main thread is not in main loop"
        # — lúc được lúc không, tuỳ thời điểm.
        mode = self.v_mode.get()
        key = self.v_key.get().strip()

        self.busy = True
        self.btn_ask.configure(state="disabled")
        self.v_query.set("")
        self._say(f"\n▸ {query}", "q")
        self.diagram.set_step(3)
        self._status("Đang truy hồi…")
        threading.Thread(target=self._worker_ask, args=(query, mode, key),
                         daemon=True).start()

    def _worker_ask(self, query: str, mode: str, key: str) -> None:
        try:
            result = self.pipe.ask(query)
            result._chunks = self.pipe.chunks  # để biểu đồ lấy được nhãn mọi chunk
            self.q.put(("retrieved", result))

            system, user = R.build_prompt(query, result.hits)
            self.q.put(("prompt", system, user))

            caller = {"Gemini": R.answer_with_gemini,
                      "Claude": R.answer_with_claude}.get(mode)
            if caller is None:
                self.q.put(("answer", R.answer_extractive(result), result))
                return

            self.q.put(("step", 4))
            # key rỗng vẫn thử: SDK còn tự đọc được biến môi trường.
            # Hỏng vì bất cứ lý do gì thì rơi về chế độ truy hồi, không ném
            # traceback vào mặt người dùng.
            try:
                text = caller(system, user, key)
            except RuntimeError as exc:
                text = (f"{exc}\n\nTạm chuyển sang chế độ chỉ truy hồi:\n\n"
                        + R.answer_extractive(result))
            self.q.put(("answer", text, result))
        except Exception:
            self.q.put(("error", traceback.format_exc(limit=3)))

    # ==================================================================
    # So sánh cấu hình
    # ==================================================================

    def run_compare(self) -> None:
        if not self.docs:
            messagebox.showinfo(APP, "Chưa nạp tài liệu nào.")
            return
        if self.busy:
            return
        self.busy = True
        self._status("Đang chạy bảng so sánh…")
        threading.Thread(target=self._worker_compare, daemon=True).start()

    def _worker_compare(self) -> None:
        """Cùng bộ câu hỏi, đổi cách cắt chunk và embedder, xem điểm đổi thế nào."""
        queries = [
            "Cosine similarity đo cái gì?",
            "Vì sao phải cắt chunk chồng lấn?",
            "Nên chọn kích thước chunk bao nhiêu?",
            "Cách nấu phở bò",   # tài liệu KHÔNG có -> xem điểm sàn
        ]
        embs = ["TF-IDF", "Hashing"]
        try:
            from rag_core import SentenceTransformerEmbedder  # noqa: F401
            import sentence_transformers  # type: ignore  # noqa: F401
            embs.append("Sentence-Transformers")
        except Exception:
            pass

        lines = ["BENCHMARK REPORT — Top-1 score cho từng query", ""]
        lines.append("Q4 là query tài liệu KHÔNG trả lời được — nó là mức")
        lines.append("NOISE FLOOR. Cột 'Signal/Noise' = score trung bình của Q1–Q3")
        lines.append("chia cho score Q4. Tỉ lệ SNR càng cao thì càng dễ đặt một")
        lines.append("threshold tách bạch giữa 'retrieved đúng' và 'miss'.")
        lines.append("Score tuyệt đối cao mà tỉ lệ Signal/Noise thấp thì không hiệu quả.")
        lines.append("")

        try:
            for emb_name in embs:
                lines.append(f"── {emb_name} " + "─" * (46 - len(emb_name)))
                lines.append(f"{'Strategy':<18}{'#chunks':>8}" + "".join(
                    f"{'Q' + str(i + 1):>9}" for i in range(len(queries)))
                    + f"{'Signal/Noise':>14}")

                for strat in R.CHUNKERS:
                    p = R.Pipeline(chunk_strategy=strat, chunk_size=500,
                                   chunk_overlap=100, min_chunk_chars=80,
                                   embedder_name=emb_name, top_k=1)
                    info = p.index(self.docs)
                    row = f"{strat:<18}{info['n_chunks']:>8}"
                    got = []
                    for qq in queries:
                        r = p.ask(qq)
                        sc = r.hits[0].score if r.hits else 0.0
                        got.append(sc)
                        row += f"{sc:>9.3f}"
                    # tín hiệu = trung bình câu trả lời được; nhiễu = câu lạc đề
                    signal = sum(got[:-1]) / max(1, len(got) - 1)
                    noise = max(got[-1], 1e-6)
                    row += f"{signal / noise:>14.1f}×"
                    lines.append(row)
                lines.append("")

            lines.append("Queries:")
            for i, qq in enumerate(queries, 1):
                lines.append(f"  Q{i}. {qq}")
            self.q.put(("compare", "\n".join(lines)))
        except Exception:
            self.q.put(("error", traceback.format_exc(limit=3)))

    # ==================================================================
    # Vòng lặp nhận kết quả
    # ==================================================================

    def _poll(self) -> None:
        try:
            while True:
                msg = self.q.get_nowait()
                kind = msg[0]

                if kind == "step":
                    self.diagram.set_step(msg[1])

                elif kind == "indexed":
                    info = msg[1]
                    self.prog.stop()
                    self.prog.set(1)
                    self.busy = False
                    self.diagram.set_step(2, done=True)
                    self.lbl_index.configure(
                        text=f"{info['n_chunks']} chunks · {info['dim']} dimensions\n"
                             f"trung bình {info['avg_chars']:.0f} chars "
                             f"({info['min_chars']}–{info['max_chars']})")
                    self._fill_chunks()
                    self.emap.set_data(self.pipe.store.matrix, None, None, [])
                    self._status(f"Đã build index {info['n_chunks']} chunks "
                                 f"trong {info['dim']} dimensions. Sẵn sàng nhận queries.")

                elif kind == "retrieved":
                    self.last = msg[1]
                    self.chart.set_result(self.last, self.pipe.top_k,
                                          self.pipe.min_score)
                    self.emap.set_data(self.pipe.store.matrix, self.last.query_vector,
                                       self.last.all_scores,
                                       [h.chunk.id for h in self.last.hits])
                    self.diagram.set_step(3, done=True)
                    self._fill_chunks()

                elif kind == "prompt":
                    _, system, user = msg
                    self._set(self.txt_prompt,
                              f"═══ SYSTEM PROMPT ═══\n{system}\n\n"
                              f"═══ USER PROMPT ═══\n{user}\n\n"
                              f"─── Ước lượng ~{(len(system) + len(user)) // 4} tokens ───\n"
                              "Toàn bộ phần 'augmented' của RAG chỉ là nối chuỗi prompt\n"
                              "như bạn đang thấy — không có gì huyền bí.")

                elif kind == "answer":
                    _, text, result = msg
                    self.busy = False
                    self.btn_ask.configure(state="normal")
                    self.diagram.set_step(4, done=True)
                    self._render_answer(text, result)

                elif kind == "compare":
                    self.busy = False
                    self._set(self.txt_cmp, msg[1])
                    self.tabs.set("Compare")
                    self._status("Benchmark so sánh hoàn tất.")

                elif kind == "error":
                    self.prog.stop()
                    self.prog.set(0)
                    self.busy = False
                    self.btn_ask.configure(state="normal")
                    self._status("Lỗi — xem hộp thoại.")
                    messagebox.showerror(APP, msg[1])
        except queue.Empty:
            pass
        self.after(60, self._poll)

    def _render_answer(self, text: str, result: R.RetrievalResult) -> None:
        st = result.stats()
        self._say(text, "a")
        if result.hits:
            srcs = ", ".join(f"[{h.rank}] {h.chunk.source}" for h in result.hits)
            self._say(f"source: {srcs}", "src")
        max_sc = st.get("max", st.get("cao nhất", 0))
        mean_sc = st.get("mean", st.get("trung bình", 0))
        self._say(
            f"retrieval {result.elapsed_ms:.1f}ms · max score {max_sc:.3f} "
            f"· mean score {mean_sc:.3f} "
            f"· margin rank 1–2 {result.margin():.3f}", "meta")

        if not result.hits:
            self._say("Không có chunk nào vượt score threshold. Thử hạ threshold xuống.", "warn")
        elif result.hits[0].score < 0.15:
            self._say("⚠ Max score rất thấp. Naive RAG vẫn trả về top-k chunks dù không "
                      "liên quan — hệ thống không tự biết mình đang miss.", "warn")
        elif result.margin() < 0.03:
            self._say("⚠ Score rank 1 và rank 2 gần bằng nhau (margin thấp) — retrieval đang bị ambiguous.", "warn")
        self._status(f"Xong · {result.elapsed_ms:.1f}ms")

    def _fill_chunks(self) -> None:
        tb = self.txt_chunks
        tb.configure(state="normal")
        tb.delete("1.0", "end")

        picked = {h.chunk.id: h for h in (self.last.hits if self.last else [])}
        scores = self.last.all_scores if self.last is not None else None

        tb.insert("end", f"{len(self.pipe.chunks)} chunks"
                         + (" · chunks được chọn (retrieved) tô xanh\n\n" if picked else "\n\n"), "dim")
        for c in self.pipe.chunks:
            hit = picked.get(c.id)
            sc = float(scores[c.id]) if scores is not None and c.id < len(scores) else None
            head = f"#{c.id:<3} {c.n_chars:>4} chars"
            if sc is not None:
                head += f"  score {sc:.3f}"
            if hit:
                head += f"  ◀ RANK {hit.rank}"
            tb.insert("end", head + "\n", "head" if hit else "dim")
            tb.insert("end", c.text.strip() + "\n\n", "hi" if hit else "")
        tb.configure(state="disabled")

    def destroy(self) -> None:
        self.anim.stop()
        super().destroy()


def main() -> None:
    ctk.set_appearance_mode("dark")
    ctk.set_default_color_theme("dark-blue")
    RagLab().mainloop()


if __name__ == "__main__":
    main()
