"""
rag_core.py — lõi của một pipeline NAIVE RAG.

Naive RAG chỉ có đúng 5 bước, không hơn:

    1. LOAD    tài liệu -> văn bản thuần
    2. CHUNK   văn bản  -> các đoạn nhỏ
    3. EMBED   mỗi đoạn -> một vector
    4. RETRIEVE  câu hỏi -> vector -> lấy k đoạn gần nhất (cosine)
    5. GENERATE  nhét k đoạn vào prompt -> hỏi LLM

KHÔNG có: viết lại câu hỏi, reranking, hybrid search, HyDE, parent-document,
truy hồi nhiều vòng, nén ngữ cảnh. Đó là advanced RAG, cố tình để ngoài.

Mọi hàm ở đây đều trả về CẢ dữ liệu trung gian (điểm của mọi chunk, chứ không
riêng top-k), vì mục đích của tool là để nhìn thấy pipeline chứ không phải giấu nó.
"""

from __future__ import annotations

import json
import math
import os
import re
import unicodedata
from dataclasses import dataclass, field
from typing import Any, Callable, Dict, List, Optional, Sequence, Tuple

import numpy as np

# ==========================================================================
# 1. LOAD
# ==========================================================================

TEXT_EXT = {".txt", ".md", ".markdown", ".rst", ".py", ".json", ".csv", ".log"}


def load_text(path: str) -> str:
    """Đọc một tệp thành văn bản thuần. PDF cần pymupdf."""
    ext = os.path.splitext(path)[1].lower()

    if ext == ".pdf":
        try:
            import pymupdf as fitz
        except ImportError:
            try:
                import fitz
            except ImportError as exc:
                raise RuntimeError("Đọc PDF cần: pip install pymupdf") from exc
        with fitz.open(path) as doc:
            return "\n\n".join(pg.get_text() for pg in doc)

    if ext in TEXT_EXT or ext == "":
        for enc in ("utf-8", "utf-8-sig", "latin-1"):
            try:
                with open(path, encoding=enc) as f:
                    return f.read()
            except UnicodeDecodeError:
                continue
        raise RuntimeError(f"Không giải mã được: {path}")

    raise RuntimeError(f"Định dạng không hỗ trợ: {ext}")


def extract_text_from_pdf_bytes(pdf_bytes: bytes) -> Tuple[str, int]:
    """Phân tách nội dung văn bản thuần và số trang từ byte data của tệp PDF bằng PyMuPDF."""
    try:
        import pymupdf as fitz
    except ImportError:
        try:
            import fitz
        except ImportError as exc:
            raise RuntimeError("Đọc PDF cần: pip install pymupdf") from exc

    with fitz.open(stream=pdf_bytes, filetype="pdf") as doc:
        pages_text: List[str] = []
        for i, page in enumerate(doc):
            t = page.get_text().strip()
            if t:
                pages_text.append(f"--- [Trang {i + 1}] ---\n" + t)
        full_text = "\n\n".join(pages_text) if pages_text else ""
        return normalize(full_text), len(doc)


def normalize(text: str) -> str:
    """Chuẩn hoá nhẹ: gộp khoảng trắng thừa, bỏ dòng trống lặp."""
    text = unicodedata.normalize("NFC", text)
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


# ==========================================================================
# 2. CHUNK
# ==========================================================================


@dataclass
class Chunk:
    id: int
    text: str
    source: str
    start: int = 0          # vị trí ký tự trong tài liệu gốc
    end: int = 0

    @property
    def n_chars(self) -> int:
        return len(self.text)

    @property
    def n_words(self) -> int:
        return len(self.text.split())

    def preview(self, n: int = 90) -> str:
        t = " ".join(self.text.split())
        return t if len(t) <= n else t[: n - 1] + "…"


_SENT_END = re.compile(r"(?<=[.!?。？！])\s+|\n\n+")


def split_sentences(text: str) -> List[str]:
    parts = [p.strip() for p in _SENT_END.split(text) if p and p.strip()]
    return parts or ([text.strip()] if text.strip() else [])


def chunk_fixed(text: str, size: int = 500, overlap: int = 100,
                source: str = "") -> List[Chunk]:
    """
    Cắt theo cửa sổ ký tự cố định, có phần chồng lấn.

    Đây là cách naive nhất và cũng là cách hay gặp nhất. Nhược điểm thấy rõ:
    nó cắt ngang câu, thậm chí ngang từ. `overlap` sinh ra để giảm bớt việc
    một ý bị chặt đôi mà không nửa nào còn đủ nghĩa.
    """
    if size <= 0:
        raise ValueError("size phải > 0")
    overlap = max(0, min(overlap, size - 1))
    step = size - overlap

    out: List[Chunk] = []
    i = 0
    while i < len(text):
        piece = text[i: i + size]
        if piece.strip():
            out.append(Chunk(len(out), piece.strip(), source, i, min(i + size, len(text))))
        if i + size >= len(text):
            break
        i += step
    return out


def chunk_sentence(text: str, size: int = 500, overlap: int = 100,
                   source: str = "") -> List[Chunk]:
    """
    Gom câu cho tới khi đầy `size`, chồng lấn tính theo câu.

    Tôn trọng ranh giới câu nên chunk đọc được, nhưng độ dài không đều —
    một câu dài hơn `size` vẫn phải đứng riêng thành một chunk.
    """
    sents = split_sentences(text)
    if not sents:
        return []

    out: List[Chunk] = []
    cur: List[str] = []
    cur_len = 0
    pos = 0

    def flush() -> None:
        nonlocal cur, cur_len
        if not cur:
            return
        body = " ".join(cur).strip()
        if body:
            start = text.find(cur[0][:40], pos)
            start = start if start >= 0 else pos
            out.append(Chunk(len(out), body, source, start, start + len(body)))
        cur, cur_len = [], 0

    for s in sents:
        if cur and cur_len + len(s) > size:
            flush()
            # giữ lại vài câu cuối làm phần chồng lấn
            if overlap > 0 and out:
                tail: List[str] = []
                tlen = 0
                for prev in reversed(out[-1].text.split(". ")):
                    if tlen + len(prev) > overlap:
                        break
                    tail.insert(0, prev)
                    tlen += len(prev)
                cur, cur_len = list(tail), tlen
        cur.append(s)
        cur_len += len(s)
    flush()
    return out


def chunk_paragraph(text: str, size: int = 500, overlap: int = 0,
                    source: str = "") -> List[Chunk]:
    """Cắt theo dòng trống. Rất hợp tài liệu có cấu trúc; đoạn quá dài bị cắt tiếp."""
    out: List[Chunk] = []
    pos = 0
    for para in re.split(r"\n\s*\n", text):
        para = para.strip()
        if not para:
            continue
        start = text.find(para[:40], pos)
        start = start if start >= 0 else pos
        if len(para) <= size * 1.5:
            out.append(Chunk(len(out), para, source, start, start + len(para)))
        else:
            for sub in chunk_fixed(para, size, overlap, source):
                out.append(Chunk(len(out), sub.text, source,
                                 start + sub.start, start + sub.end))
        pos = start + len(para)
    return out


CHUNKERS: Dict[str, Callable[..., List[Chunk]]] = {
    "By Paragraph": chunk_paragraph,
    "Fixed Character": chunk_fixed,
    "By Sentence": chunk_sentence,
}

_CHUNKER_ALIASES = {
    "Theo đoạn": "By Paragraph",
    "Ký tự cố định": "Fixed Character",
    "Theo câu": "By Sentence",
}


def merge_short(chunks: Sequence[Chunk], min_chars: int = 80) -> List[Chunk]:
    """
    Gộp chunk quá ngắn vào chunk kế tiếp.

    Sinh ra để trị một cái bẫy rất hay gặp: ORPHAN HEADING (tiêu đề mồ côi). Cắt theo paragraph
    thì dòng tiêu đề "RAG là gì" thành một chunk 9 ký tự. Khi query "RAG là gì?", đúng
    chunk rỗng nghĩa đó lại đứng rank 1 với cosine score gần 0.85, cao hơn hẳn chunk
    chứa nội dung trả lời thực sự.

    Đây không phải lỗi của cosine similarity, mà là hệ quả của L2 normalization: chunk càng ít
    tokens thì mỗi token trùng khớp chiếm tỉ trọng càng lớn trong vector, khiến score bị thổi phồng.
    Đặt min_chars = 0 để quan sát hiện tượng này, sau đó bật lại để xem cơ chế merge xử lý triệt để.
    """
    if min_chars <= 0 or not chunks:
        return list(chunks)

    out: List[Chunk] = []
    carry: Optional[Chunk] = None
    for c in chunks:
        if carry is not None:
            c = Chunk(0, carry.text + "\n" + c.text, c.source, carry.start, c.end)
            carry = None
        if len(c.text) < min_chars:
            carry = c
            continue
        out.append(Chunk(len(out), c.text, c.source, c.start, c.end))

    if carry is not None:  # chunk ngắn cuối cùng: nối vào chunk trước đó
        if out:
            last = out[-1]
            out[-1] = Chunk(last.id, last.text + "\n" + carry.text,
                            last.source, last.start, carry.end)
        else:
            out.append(Chunk(0, carry.text, carry.source, carry.start, carry.end))
    return out


def chunk_documents(docs: Sequence[Tuple[str, str]], strategy: str = "By Paragraph",
                    size: int = 500, overlap: int = 100,
                    min_chars: int = 0) -> List[Chunk]:
    """docs: [(source_name, content)] -> danh sách chunks đã re-index ID toàn cục."""
    strat_key = _CHUNKER_ALIASES.get(strategy, strategy)
    fn = CHUNKERS.get(strat_key, chunk_paragraph)
    out: List[Chunk] = []
    for name, body in docs:
        got = fn(normalize(body), size=size, overlap=overlap, source=name)
        for c in merge_short(got, min_chars):
            out.append(Chunk(len(out), c.text, name, c.start, c.end))
    return out


# ==========================================================================
# 3. EMBED
# ==========================================================================


def l2_normalize(m: np.ndarray) -> np.ndarray:
    """Chuẩn hoá về độ dài 1 -> tích vô hướng CHÍNH LÀ cosine similarity."""
    n = np.linalg.norm(m, axis=-1, keepdims=True)
    return m / np.maximum(n, 1e-10)


_TOKEN = re.compile(r"\w+", re.UNICODE)


def tokenize(text: str) -> List[str]:
    return _TOKEN.findall(text.lower())


class BaseEmbedder:
    name = "base"
    explain = ""

    def fit(self, texts: Sequence[str]) -> None:
        """Chỉ các mô hình thống kê (TF-IDF) mới cần học từ corpus."""

    def encode(self, texts: Sequence[str]) -> np.ndarray:
        raise NotImplementedError

    @property
    def dim(self) -> int:
        return 0


class TfidfEmbedder(BaseEmbedder):
    """
    TF-IDF: mỗi chiều là một từ trong từ điển, giá trị = tần suất × độ hiếm.

    Ưu: không cần tải model, không cần mạng, và MINH BẠCH — xem được chính xác
    từ nào đẩy điểm lên (dùng `top_terms`).
    Nhược: chỉ khớp ĐÚNG mặt chữ. "xe hơi" và "ô tô" là hai chiều khác hẳn nhau,
    cosine giữa chúng bằng 0. Đây là giới hạn cốt lõi của naive keyword matching.
    """

    name = "TF-IDF"
    explain = ("Exact keyword matching. Không cần tải model. "
               "Synonyms khác mặt chữ sẽ KHÔNG match được.")

    def __init__(self, max_features: int = 4096):
        self.max_features = max_features
        self.vocab: Dict[str, int] = {}
        self.idf: Optional[np.ndarray] = None

    def fit(self, texts: Sequence[str]) -> None:
        df: Dict[str, int] = {}
        for t in texts:
            for w in set(tokenize(t)):
                df[w] = df.get(w, 0) + 1
        # giữ lại các từ phổ biến nhất theo document frequency
        common = sorted(df.items(), key=lambda kv: -kv[1])[: self.max_features]
        self.vocab = {w: i for i, w in enumerate(sorted(w for w, _ in common))}
        n = max(1, len(texts))
        idf = np.zeros(len(self.vocab), dtype=np.float32)
        for w, i in self.vocab.items():
            idf[i] = math.log((1 + n) / (1 + df.get(w, 0))) + 1.0  # idf mượt
        self.idf = idf

    def encode(self, texts: Sequence[str]) -> np.ndarray:
        if self.idf is None:
            raise RuntimeError("Phải gọi fit() trước khi encode với TF-IDF.")
        m = np.zeros((len(texts), len(self.vocab)), dtype=np.float32)
        for r, t in enumerate(texts):
            toks = tokenize(t)
            if not toks:
                continue
            for w in toks:
                j = self.vocab.get(w)
                if j is not None:
                    m[r, j] += 1.0
            m[r] /= len(toks)          # term frequency
        m *= self.idf                   # × inverse document frequency
        return l2_normalize(m)

    @property
    def dim(self) -> int:
        return len(self.vocab)

    def top_terms(self, text: str, k: int = 6) -> List[Tuple[str, float]]:
        """Những từ đóng góp nhiều nhất vào vector — dùng để giải thích điểm số."""
        if self.idf is None:
            return []
        v = self.encode([text])[0]
        inv = {i: w for w, i in self.vocab.items()}
        idx = np.argsort(-v)[:k]
        return [(inv[int(i)], float(v[int(i)])) for i in idx if v[int(i)] > 0]


class HashEmbedder(BaseEmbedder):
    """
    Hashing trick: băm từ vào `dim` ô cố định, không cần từ điển, không cần fit.

    Để đây làm mốc so sánh: nó cho thấy embedding không nhất thiết phải "thông
    minh". Va chạm băm (hash collision) là nhiễu có thật, và chính điều đó làm nó kém TF-IDF.
    """

    name = "Hashing"
    explain = "Hash tokens vào số dimensions cố định (hashing trick). Không cần fit. Có thể bị hash collision."

    def __init__(self, dim: int = 512):
        self._dim = dim

    def encode(self, texts: Sequence[str]) -> np.ndarray:
        m = np.zeros((len(texts), self._dim), dtype=np.float32)
        for r, t in enumerate(texts):
            for w in tokenize(t):
                h = hash(w)
                m[r, h % self._dim] += 1.0 if h >= 0 else -1.0  # dấu giảm va chạm
        return l2_normalize(m)

    @property
    def dim(self) -> int:
        return self._dim


class SentenceTransformerEmbedder(BaseEmbedder):
    """
    Embedding ngữ nghĩa thật (Semantic embedding). Cần `pip install sentence-transformers` và lần đầu
    phải có mạng để tải model.

    Đây mới là thứ làm "xe hơi" gần "ô tô". Nếu chạy được, hãy hỏi cùng một câu
    ở cả hai embedder rồi so bảng điểm — khác biệt rất rõ.
    """

    name = "Sentence-Transformers"
    explain = "Semantic embedding đa ngôn ngữ. Hiểu synonyms. Tự động tải model ở lần chạy đầu."

    def __init__(self, model_name: str = "paraphrase-multilingual-MiniLM-L12-v2"):
        try:
            from sentence_transformers import SentenceTransformer  # type: ignore
        except ImportError as exc:
            raise RuntimeError(
                "Cần:  pip install sentence-transformers\n"
                "(lần chạy đầu sẽ tải model, cần mạng)"
            ) from exc
        self.model = SentenceTransformer(model_name)
        self.model_name = model_name

    def encode(self, texts: Sequence[str]) -> np.ndarray:
        v = self.model.encode(list(texts), convert_to_numpy=True,
                              show_progress_bar=False)
        return l2_normalize(np.asarray(v, dtype=np.float32))

    @property
    def dim(self) -> int:
        return int(self.model.get_sentence_embedding_dimension())


EMBEDDERS = {
    "TF-IDF": TfidfEmbedder,
    "Hashing": HashEmbedder,
    "Sentence-Transformers": SentenceTransformerEmbedder,
}


# ==========================================================================
# 4. RETRIEVE
# ==========================================================================


@dataclass
class Hit:
    chunk: Chunk
    score: float
    rank: int


@dataclass
class RetrievalResult:
    query: str
    hits: List[Hit]                       # top-k
    all_scores: np.ndarray                # điểm của MỌI chunk — để vẽ phân bố
    query_vector: Optional[np.ndarray] = None
    elapsed_ms: float = 0.0

    def stats(self) -> Dict[str, float]:
        s = self.all_scores
        if s.size == 0:
            return {}
        max_v = float(s.max())
        mean_v = float(s.mean())
        median_v = float(np.median(s))
        min_v = float(s.min())
        std_v = float(s.std())
        return {
            "max": max_v,
            "mean": mean_v,
            "median": median_v,
            "min": min_v,
            "std": std_v,
            # Giữ alias tiếng Việt để tương thích các code/test cũ nếu có
            "cao nhất": max_v,
            "trung bình": mean_v,
            "trung vị": median_v,
            "thấp nhất": min_v,
            "độ lệch chuẩn": std_v,
        }

    def margin(self) -> float:
        """Khoảng cách giữa hạng 1 và hạng 2. Nhỏ = truy hồi mơ hồ."""
        s = np.sort(self.all_scores)[::-1]
        return float(s[0] - s[1]) if s.size >= 2 else 0.0


class VectorStore:
    """
    Kho vector phẳng, quét toàn bộ bằng một phép nhân ma trận.

    Naive đúng nghĩa: không HNSW, không IVF, không index gì cả. Với vài nghìn
    chunk thì numpy nhanh hơn ta tưởng, và nó cho ra điểm CHÍNH XÁC — hợp cho
    việc học, vì không lẫn sai số của thuật toán xấp xỉ vào bài toán.
    """

    def __init__(self, embedder: BaseEmbedder):
        self.embedder = embedder
        self.chunks: List[Chunk] = []
        self.matrix: Optional[np.ndarray] = None

    def build(self, chunks: Sequence[Chunk],
              progress: Optional[Callable[[int, int], None]] = None) -> None:
        self.chunks = list(chunks)
        texts = [c.text for c in self.chunks]
        if not texts:
            self.matrix = None
            return

        self.embedder.fit(texts)
        batch = 64
        out: List[np.ndarray] = []
        for i in range(0, len(texts), batch):
            out.append(self.embedder.encode(texts[i: i + batch]))
            if progress:
                progress(min(i + batch, len(texts)), len(texts))
        self.matrix = np.vstack(out)

    def search(self, query: str, k: int = 4,
               min_score: float = 0.0) -> RetrievalResult:
        import time

        t0 = time.perf_counter()
        if self.matrix is None or not self.chunks:
            return RetrievalResult(query, [], np.array([]))

        qv = self.embedder.encode([query])[0]
        # Cả hai vế đã chuẩn hoá L2 nên tích vô hướng chính là cosine similarity.
        scores = self.matrix @ qv

        order = np.argsort(-scores)[:k]
        hits = [Hit(self.chunks[int(i)], float(scores[int(i)]), r)
                for r, i in enumerate(order, 1)
                if float(scores[int(i)]) >= min_score]

        return RetrievalResult(query, hits, scores, qv,
                               (time.perf_counter() - t0) * 1000)

    @property
    def ready(self) -> bool:
        return self.matrix is not None and len(self.chunks) > 0


# ==========================================================================
# 5. GENERATE
# ==========================================================================

DEFAULT_SYSTEM = (
    "Bạn trả lời câu hỏi CHỈ dựa trên phần ngữ cảnh (context) được cung cấp. "
    "Nếu context không chứa thông tin cần thiết, hãy nói thẳng là không tìm thấy "
    "trong documents — tuyệt đối không hallucinate hay suy đoán ngoài tài liệu. "
    "Khi dùng thông tin từ một chunk, ghi kèm citations dạng [1], [2]."
)


def build_prompt(query: str, hits: Sequence[Hit],
                 system: str = DEFAULT_SYSTEM) -> Tuple[str, str]:
    """
    Ghép context + câu hỏi (query) thành prompt. Trả về (system, user).

    Đây là toàn bộ phần "augmented" trong Retrieval-Augmented Generation:
    chỉ là nối chuỗi prompt. Không có gì huyền bí ở bước này.
    """
    if not hits:
        ctx = "(không retrieve được chunk nào / không truy hồi được đoạn nào)"
    else:
        ctx = "\n\n".join(
            f"[{h.rank}] (source: {h.chunk.source}, score: {h.score:.3f})\n{h.chunk.text}"
            for h in hits
        )
    user = f"CONTEXT (NGỮ CẢNH):\n{ctx}\n\n---\n\nQUESTION (CÂU HỎI): {query}"
    return system, user


def answer_extractive(result: RetrievalResult) -> str:
    """
    Trả lời không cần LLM (retrieve-only mode): chỉ trích xuất các chunks lấy được.

    Có chủ đích: nó tách bạch chất lượng RETRIEVAL khỏi chất lượng GENERATION. Khi câu
    trả lời sai, câu hỏi đầu tiên luôn là "chunks lấy về có đúng không?" — chế độ
    này trả lời câu đó ngay lập tức.
    """
    if not result.hits:
        return "Không retrieve được chunk nào vượt score threshold."
    lines = [f"Tìm được {len(result.hits)} chunks ({len(result.hits)} đoạn) liên quan "
             f"(max score {result.hits[0].score:.3f}):\n"]
    for h in result.hits:
        lines.append(f"[{h.rank}] {h.chunk.source} · score {h.score:.3f}")
        lines.append(h.chunk.text.strip())
        lines.append("")
    if result.hits[0].score < 0.15:
        lines.append("⚠ Max score vẫn rất thấp — nhiều khả năng documents "
                     "không chứa câu trả lời.")
    return "\n".join(lines)


def answer_with_gemini(system: str, user: str, api_key: str = "",
                       model: str = "gemini-3.6-flash") -> str:
    """
    Gọi Gemini (Google AI Studio). Có mức miễn phí nên hợp để học.

    Key đọc từ biến môi trường GEMINI_API_KEY — ĐỪNG viết thẳng key vào file
    rồi commit. api_key truyền vào chỉ để tiện gõ tay trong app, để trống thì
    SDK tự đọc biến môi trường.

    Cài:  python -m pip install -U google-genai
    """
    try:
        from google import genai  # type: ignore
    except ImportError as exc:
        raise RuntimeError(
            "Cần:  python -m pip install -U google-genai"
        ) from exc

    key = api_key or os.environ.get("GEMINI_API_KEY", "")
    if not key:
        raise RuntimeError(
            "Chưa có GEMINI_API_KEY. Lấy key miễn phí ở aistudio.google.com, "
            "rồi đặt vào biến môi trường hoặc dán vào ô bên trái."
        )

    # Tên tham số api_key chưa được tài liệu hoá chắc chắn — thử rồi lùi về
    # đường biến môi trường thay vì đoán bừa.
    try:
        client = genai.Client(api_key=key)
    except TypeError:
        os.environ["GEMINI_API_KEY"] = key
        client = genai.Client()

    try:
        interaction = client.interactions.create(
            model=model, system_instruction=system, input=user,
        )
    except Exception as exc:
        raise RuntimeError(f"Gemini gọi hỏng: {type(exc).__name__}: {exc}") from exc

    text = getattr(interaction, "output_text", "") or ""
    if not text.strip():
        raise RuntimeError("Gemini trả về rỗng.")
    return text


def answer_with_claude(system: str, user: str, api_key: str = "",
                       model: str = "claude-opus-5",
                       max_tokens: int = 4096) -> str:
    """
    Gọi Anthropic API. Tuỳ chọn — tool chạy đầy đủ mà không cần bước này.

    api_key rỗng thì dựng client không tham số, để SDK tự tìm thông tin đăng
    nhập theo thứ tự của nó: ANTHROPIC_API_KEY, ANTHROPIC_AUTH_TOKEN, rồi tới
    profile do `ant auth login` tạo. Truyền api_key="" thẳng vào constructor sẽ
    ghi đè cả ba và làm hỏng xác thực.

    max_tokens để rộng vì nó chặn TỔNG của phần suy nghĩ lẫn phần trả lời:
    claude-opus-5 bật suy nghĩ mặc định, đặt sát quá thì câu trả lời bị cụt.
    """
    try:
        import anthropic  # type: ignore
    except ImportError as exc:
        raise RuntimeError("Cần:  pip install anthropic") from exc

    client = anthropic.Anthropic(api_key=api_key) if api_key else anthropic.Anthropic()
    try:
        msg = client.messages.create(
            model=model, max_tokens=max_tokens, system=system,
            messages=[{"role": "user", "content": user}],
        )
    except anthropic.AuthenticationError as exc:
        raise RuntimeError(
            "Xác thực thất bại. Đặt biến môi trường ANTHROPIC_API_KEY, dán key "
            "vào ô bên trái, hoặc đăng nhập bằng `ant auth login`."
        ) from exc
    except anthropic.NotFoundError as exc:
        raise RuntimeError(f"Không có model {model!r} trên tài khoản này.") from exc
    except anthropic.RateLimitError as exc:
        raise RuntimeError("Bị giới hạn tốc độ — đợi một lát rồi thử lại.") from exc
    except anthropic.APIConnectionError as exc:
        raise RuntimeError("Không nối được tới API — kiểm tra mạng.") from exc

    if msg.stop_reason == "refusal":
        raise RuntimeError("Mô hình từ chối trả lời yêu cầu này.")

    text = "".join(b.text for b in msg.content if getattr(b, "type", "") == "text")
    if msg.stop_reason == "max_tokens":
        text += (f"\n\n⚠ Câu trả lời bị cắt vì chạm trần {max_tokens} token "
                 "(trần này tính cả phần suy nghĩ của mô hình).")
    return text


# ==========================================================================
# Pipeline gộp
# ==========================================================================


@dataclass
class Pipeline:
    """Gói cả 5 bước lại cho tiện dùng ngoài GUI."""

    chunk_strategy: str = "By Paragraph"
    chunk_size: int = 500
    chunk_overlap: int = 100
    min_chunk_chars: int = 0
    embedder_name: str = "TF-IDF"
    top_k: int = 4
    min_score: float = 0.0

    store: Optional[VectorStore] = None
    docs: List[Tuple[str, str]] = field(default_factory=list)
    chunks: List[Chunk] = field(default_factory=list)

    def index(self, docs: Sequence[Tuple[str, str]],
              progress: Optional[Callable[[int, int], None]] = None) -> Dict[str, Any]:
        self.docs = list(docs)
        strat = _CHUNKER_ALIASES.get(self.chunk_strategy, self.chunk_strategy)
        self.chunks = chunk_documents(self.docs, strat,
                                      self.chunk_size, self.chunk_overlap,
                                      self.min_chunk_chars)
        emb = EMBEDDERS[self.embedder_name]()
        self.store = VectorStore(emb)
        self.store.build(self.chunks, progress)
        sizes = [c.n_chars for c in self.chunks] or [0]
        return {
            "n_docs": len(self.docs),
            "n_chunks": len(self.chunks),
            "dim": emb.dim,
            "avg_chars": float(np.mean(sizes)),
            "min_chars": int(np.min(sizes)),
            "max_chars": int(np.max(sizes)),
            "total_chars": sum(len(d[1]) for d in self.docs),
        }

    def ask(self, query: str) -> RetrievalResult:
        if self.store is None or not self.store.ready:
            raise RuntimeError("Chưa lập chỉ mục tài liệu nào.")
        return self.store.search(query, self.top_k, self.min_score)


# --------------------------------------------------------------------------
# Tài liệu mẫu — để mở tool lên là nghịch được ngay
# --------------------------------------------------------------------------

SAMPLE_DOC = """RAG là gì

RAG viết tắt của Retrieval-Augmented Generation, tức sinh văn bản có tăng cường
truy hồi. Ý tưởng rất đơn giản: thay vì bắt mô hình ngôn ngữ nhớ mọi thứ, ta tìm
sẵn những đoạn tài liệu liên quan rồi đưa kèm vào prompt.

Naive RAG gồm những bước nào

Một pipeline naive RAG có năm bước. Bước một là nạp tài liệu và chuyển về văn bản
thuần. Bước hai là cắt văn bản thành các đoạn nhỏ gọi là chunk. Bước ba là biến
mỗi chunk thành một vector số học, gọi là embedding. Bước bốn là khi có câu hỏi
thì cũng biến câu hỏi thành vector rồi tìm các chunk có vector gần nhất. Bước năm
là nhét những chunk đó vào prompt và để mô hình ngôn ngữ viết câu trả lời.

Cosine similarity đo cái gì

Cosine similarity đo góc giữa hai vector chứ không đo khoảng cách. Giá trị chạy
từ âm một tới một. Bằng một nghĩa là hai vector cùng hướng hoàn toàn, bằng không
nghĩa là chúng vuông góc và không liên quan gì nhau. Nếu ta đã chuẩn hoá vector về
độ dài bằng một thì tích vô hướng của chúng chính là cosine similarity, nên chỉ
cần một phép nhân ma trận là tính xong điểm cho toàn bộ kho.

Vì sao phải cắt chunk chồng lấn

Khi cắt văn bản theo cửa sổ cố định, ranh giới cắt có thể rơi đúng giữa một câu
hoặc giữa một ý. Khi đó cả hai nửa đều mất nghĩa và không nửa nào truy hồi được.
Phần chồng lấn giữa các chunk liền kề giúp giảm rủi ro này, đổi lại kho vector
phình to hơn vì cùng một đoạn văn bị lưu nhiều lần.

Chọn kích thước chunk thế nào

Chunk quá nhỏ thì thiếu ngữ cảnh, mô hình đọc xong vẫn không đủ thông tin trả
lời. Chunk quá lớn thì embedding bị loãng vì một vector phải gánh quá nhiều ý
khác nhau, và điểm cosine trở nên kém phân biệt. Khoảng ba trăm tới tám trăm ký
tự thường là điểm khởi đầu hợp lý, nhưng không có con số đúng cho mọi tài liệu.

Hạn chế của naive RAG

Naive RAG khớp câu hỏi với chunk chỉ bằng một phép so vector duy nhất. Nếu người
dùng hỏi bằng từ ngữ khác hẳn tài liệu thì truy hồi sẽ trượt. Nếu câu trả lời nằm
rải rác ở nhiều chunk thì lấy top-k cũng khó gom đủ. Nếu câu hỏi cần suy luận
nhiều bước thì một vòng truy hồi là không đủ. Đó là lý do người ta phát triển
advanced RAG với các kỹ thuật như viết lại câu hỏi, tìm kiếm lai, và rerank.

Advanced RAG khác gì

Advanced RAG thêm các bước xung quanh lõi naive. Trước khi truy hồi có thể viết
lại hoặc tách nhỏ câu hỏi. Khi truy hồi có thể kết hợp tìm theo từ khoá và tìm
theo vector. Sau khi truy hồi có thể dùng một mô hình rerank để chấm lại thứ tự
các đoạn, hoặc nén ngữ cảnh cho gọn trước khi đưa vào prompt.
"""


def sample_docs() -> List[Tuple[str, str]]:
    return [("tai-lieu-mau-rag.txt", SAMPLE_DOC)]
