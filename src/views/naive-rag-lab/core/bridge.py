"""
bridge.py — HTTP Bridge Server kết nối pipeline Python Naive RAG với giao diện Vue 3.

Khởi chạy bằng lệnh:
    python bridge.py
hoặc:
    python bridge.py --port 8000

Server dùng thư viện chuẩn Python (http.server), tự động bật CORS để giao diện
Vue (Vite dev server hoặc Cloudflare deploy) có thể giao tiếp trực tiếp.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
import traceback
from http.server import HTTPServer, BaseHTTPRequestHandler
from typing import Any, Dict, List, Optional, Tuple

import numpy as np

# Đảm bảo UTF-8 cho stdout/stderr trên Windows
if sys.platform.startswith("win"):
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(encoding="utf-8")

import rag_core as R

# Khởi tạo Pipeline toàn cục và tự động lập chỉ mục sẵn sàng dùng ngay
pipeline = R.Pipeline()
current_docs: List[Tuple[str, str]] = R.sample_docs()
cached_index_info: Optional[Dict[str, Any]] = None

try:
    cached_index_info = pipeline.index(current_docs)
    cached_index_info["time_ms"] = 0
except Exception as _exc:
    sys.stderr.write(f"Cảnh báo khởi tạo index ban đầu: {_exc}\n")


def compute_pca_2d(matrix: Optional[np.ndarray], query_vec: Optional[np.ndarray],
                   scores: Optional[np.ndarray], top_ids: List[int]) -> Dict[str, Any]:
    """
    Chiếu ma trận embedding và query vector xuống không gian 2D bằng SVD/PCA.
    Trả về tọa độ đã chuẩn hóa trong khoảng [-1, 1].
    """
    if matrix is None or matrix.shape[0] < 2:
        return {"points": [], "query": None, "var_kept": 0.0}

    try:
        data = matrix if query_vec is None else np.vstack([matrix, query_vec[None, :]])
        mean = data.mean(axis=0, keepdims=True)
        centered = data - mean

        _, sv, vt = np.linalg.svd(centered, full_matrices=False)
        n_comps = min(3, vt.shape[0])
        var_total = float((sv ** 2).sum())
        var_kept = float((sv[:n_comps] ** 2).sum() / var_total) if var_total > 1e-9 else 1.0

        proj = centered @ vt[:n_comps].T

        # Chuẩn hoá tỷ lệ co dãn về khung [-1, 1]
        std = np.std(proj, axis=0)
        std = np.where(std < 1e-6, 1.0, std)
        proj_norm = (proj - np.mean(proj, axis=0)) / (2.5 * std)
        proj_norm = np.clip(proj_norm, -0.9, 0.9)

        chunk_proj = proj_norm[: matrix.shape[0]]
        points = []
        top_set = set(top_ids)

        for i in range(matrix.shape[0]):
            sc = float(scores[i]) if scores is not None and i < len(scores) else 0.0
            points.append({
                "id": i,
                "x": float(chunk_proj[i, 0]),
                "y": float(chunk_proj[i, 1]),
                "z": float(chunk_proj[i, 2]) if n_comps >= 3 else 0.0,
                "score": sc,
                "is_top": i in top_set
            })

        q_point = None
        if query_vec is not None:
            q_point = {
                "x": float(proj_norm[-1, 0]),
                "y": float(proj_norm[-1, 1]),
                "z": float(proj_norm[-1, 2]) if n_comps >= 3 else 0.0
            }

        return {
            "points": points,
            "query": q_point,
            "var_kept": var_kept
        }
    except Exception:
        return {"points": [], "query": None, "var_kept": 0.0}


class RagBridgeHandler(BaseHTTPRequestHandler):
    def _send_cors_headers(self) -> None:
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")

    def do_OPTIONS(self) -> None:
        self.send_response(204)
        self._send_cors_headers()
        self.end_headers()

    def _read_json(self) -> Dict[str, Any]:
        length = int(self.headers.get("Content-Length", 0))
        if length <= 0:
            return {}
        raw = self.rfile.read(length)
        return json.loads(raw.decode("utf-8"))

    def _send_json(self, data: Any, status: int = 200) -> None:
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self._send_cors_headers()
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _send_error(self, message: str, status: int = 400) -> None:
        self._send_json({"error": message}, status=status)

    def do_GET(self) -> None:
        path = self.path.split("?")[0]
        if path == "/api/status" or path == "/":
            has_st = False
            try:
                import sentence_transformers  # noqa: F401
                has_st = True
            except Exception:
                pass

            has_pymupdf = False
            try:
                import pymupdf  # noqa: F401
                has_pymupdf = True
            except Exception:
                try:
                    import fitz  # noqa: F401
                    has_pymupdf = True
                except Exception:
                    pass

            is_ready = pipeline.store is not None and pipeline.store.ready
            chunks_data = [
                {
                    "id": c.id,
                    "text": c.text,
                    "source": c.source,
                    "n_chars": c.n_chars,
                    "n_words": c.n_words,
                    "start": c.start,
                    "end": c.end,
                }
                for c in pipeline.chunks
            ] if is_ready else []

            pca_init = compute_pca_2d(pipeline.store.matrix, None, None, []) if (is_ready and pipeline.store is not None) else None

            self._send_json({
                "status": "ok",
                "engine": "python",
                "mode": "retrieve-only",
                "python_version": sys.version.split()[0],
                "has_sentence_transformers": has_st,
                "has_pymupdf": has_pymupdf,
                "is_indexed": is_ready,
                "n_docs": len(current_docs),
                "n_chunks": len(pipeline.chunks) if is_ready else 0,
                "available_embedders": list(R.EMBEDDERS.keys()),
                "info": cached_index_info if is_ready else None,
                "chunks": chunks_data,
                "pca": pca_init
            })
        else:
            self._send_error(f"Endpoint không tồn tại: {path}", status=404)

    def do_POST(self) -> None:
        global current_docs, pipeline
        path = self.path.split("?")[0]

        try:
            payload = self._read_json()

            if path == "/api/sample":
                current_docs = R.sample_docs()
                self._send_json({
                    "status": "ok",
                    "docs": [{"name": name, "content": content, "length": len(content)}
                             for name, content in current_docs],
                    "total_chars": sum(len(d[1]) for d in current_docs)
                })

            elif path == "/api/upload":
                docs_payload = payload.get("docs", [])
                if not docs_payload:
                    return self._send_error("Thiếu danh sách 'docs'")
                current_docs = [(d.get("name", f"doc_{i+1}.txt"), d.get("content", ""))
                                for i, d in enumerate(docs_payload)]
                self._send_json({
                    "status": "ok",
                    "docs_count": len(current_docs),
                    "total_chars": sum(len(d[1]) for d in current_docs)
                })

            elif path == "/api/parse-pdf":
                filename = payload.get("filename", "tailieu.pdf")
                content_base64 = payload.get("content_base64", "")
                if not content_base64:
                    return self._send_error("Thiếu nội dung 'content_base64' của tệp PDF")

                if "," in content_base64:
                    content_base64 = content_base64.split(",", 1)[1]

                import base64
                try:
                    pdf_bytes = base64.b64decode(content_base64)
                    text, page_count = R.extract_text_from_pdf_bytes(pdf_bytes)

                    if not text:
                        return self._send_json({
                            "status": "warning",
                            "filename": filename,
                            "text": "",
                            "pages": page_count,
                            "message": "Tệp PDF không có lớp ký tự văn bản (có thể là file scan hoặc toàn hình ảnh)."
                        })

                    self._send_json({
                        "status": "ok",
                        "filename": filename,
                        "text": text,
                        "pages": page_count,
                        "length": len(text),
                        "parser": "pymupdf"
                    })
                except Exception as ex:
                    traceback.print_exc()
                    return self._send_error(f"Lỗi khi phân tách PDF bằng PyMuPDF: {str(ex)}")

            elif path == "/api/index":
                if not current_docs:
                    return self._send_error("Chưa có tài liệu nào để lập chỉ mục.")

                strategy = payload.get("strategy", "By Paragraph")
                size = int(payload.get("size", 500))
                overlap = int(payload.get("overlap", 100))
                min_chars = int(payload.get("min_chars", 80))
                embedder_name = payload.get("embedder", "TF-IDF")

                pipeline.chunk_strategy = strategy
                pipeline.chunk_size = size
                pipeline.chunk_overlap = overlap
                pipeline.min_chunk_chars = min_chars
                pipeline.embedder_name = embedder_name

                t0 = time.perf_counter()
                info = pipeline.index(current_docs)
                info["time_ms"] = round((time.perf_counter() - t0) * 1000, 2)

                chunks_data = [
                    {
                        "id": c.id,
                        "text": c.text,
                        "source": c.source,
                        "n_chars": c.n_chars,
                        "n_words": c.n_words,
                        "start": c.start,
                        "end": c.end,
                    }
                    for c in pipeline.chunks
                ]

                # Tính tọa độ ban đầu của các chunk trong không gian PCA
                pca_init = compute_pca_2d(pipeline.store.matrix, None, None, [])

                self._send_json({
                    "status": "ok",
                    "info": info,
                    "chunks": chunks_data,
                    "pca": pca_init
                })

            elif path == "/api/retrieve":
                query = payload.get("query", "").strip()
                if not query:
                    return self._send_error("Query rỗng")
                if pipeline.store is None or not pipeline.store.ready:
                    return self._send_error("Chưa lập chỉ mục (index). Vui lòng BUILD INDEX trước.")

                top_k = int(payload.get("top_k", 4))
                min_score = float(payload.get("min_score", 0.05))
                pipeline.top_k = top_k
                pipeline.min_score = min_score

                res = pipeline.ask(query)

                system_prompt, user_prompt = R.build_prompt(query, res.hits)
                extractive_ans = R.answer_extractive(res)

                top_ids = [h.chunk.id for h in res.hits]
                pca_data = compute_pca_2d(pipeline.store.matrix, res.query_vector,
                                          res.all_scores, top_ids)

                hits_data = [
                    {
                        "rank": h.rank,
                        "id": h.chunk.id,
                        "score": round(float(h.score), 4),
                        "source": h.chunk.source,
                        "text": h.chunk.text,
                        "n_chars": h.chunk.n_chars
                    }
                    for h in res.hits
                ]

                all_scores = [round(float(s), 4) for s in res.all_scores]

                self._send_json({
                    "status": "ok",
                    "query": query,
                    "hits": hits_data,
                    "all_scores": all_scores,
                    "stats": {k: round(v, 4) for k, v in res.stats().items()},
                    "margin": round(res.margin(), 4),
                    "elapsed_ms": round(res.elapsed_ms, 2),
                    "extractive_answer": extractive_ans,
                    "prompt": {
                        "system": system_prompt,
                        "user": user_prompt,
                        "tokens_est": (len(system_prompt) + len(user_prompt)) // 4
                    },
                    "pca": pca_data
                })

            elif path == "/api/compare":
                if not current_docs:
                    return self._send_error("Chưa nạp tài liệu nào để so sánh.")

                queries = [
                    "Cosine similarity đo cái gì?",
                    "Vì sao phải cắt chunk chồng lấn?",
                    "Nên chọn kích thước chunk bao nhiêu?",
                    "Cách nấu phở bò",   # out-of-domain noise floor
                ]

                embs = ["TF-IDF", "Hashing"]
                try:
                    import sentence_transformers  # noqa: F401
                    embs.append("Sentence-Transformers")
                except Exception:
                    pass

                benchmark_rows = []
                report_lines = [
                    "BENCHMARK REPORT — Top-1 score cho từng query",
                    "",
                    "Q4 là query ngoài phạm vi (out-of-domain) — mức NOISE FLOOR.",
                    "Signal/Noise = trung bình Q1–Q3 chia cho Q4.",
                    ""
                ]

                for emb_name in embs:
                    report_lines.append(f"── {emb_name} " + "─" * (46 - len(emb_name)))
                    report_lines.append(f"{'Strategy':<18}{'#chunks':>8}" +
                                        "".join(f"{'Q' + str(i+1):>9}" for i in range(len(queries))) +
                                        f"{'Signal/Noise':>14}")

                    for strat in R.CHUNKERS:
                        p = R.Pipeline(chunk_strategy=strat, chunk_size=500,
                                       chunk_overlap=100, min_chunk_chars=80,
                                       embedder_name=emb_name, top_k=1)
                        info = p.index(current_docs)
                        scores = []
                        for q in queries:
                            r = p.ask(q)
                            sc = float(r.hits[0].score) if r.hits else 0.0
                            scores.append(round(sc, 3))

                        signal = sum(scores[:-1]) / max(1, len(scores) - 1)
                        noise = max(scores[-1], 1e-6)
                        snr = round(signal / noise, 1)

                        benchmark_rows.append({
                            "embedder": emb_name,
                            "strategy": strat,
                            "chunks": info["n_chunks"],
                            "scores": scores,
                            "snr": snr
                        })

                        row_str = f"{strat:<18}{info['n_chunks']:>8}" + "".join(f"{s:>9.3f}" for s in scores) + f"{snr:>14.1f}×"
                        report_lines.append(row_str)
                    report_lines.append("")

                self._send_json({
                    "status": "ok",
                    "queries": queries,
                    "rows": benchmark_rows,
                    "raw_report": "\n".join(report_lines)
                })

            else:
                self._send_error(f"Endpoint không tồn tại: {path}", status=404)

        except Exception as e:
            traceback.print_exc()
            self._send_error(f"Lỗi máy chủ nội bộ: {str(e)}", status=500)

    def log_message(self, format: str, *args: Any) -> None:
        """In log gọn gàng trong terminal."""
        sys.stderr.write(f"[{time.strftime('%H:%M:%S')}] {args[0]} -> {args[1]}\n")


def run_server(port: int = 8000) -> None:
    server_address = ("127.0.0.1", port)
    httpd = HTTPServer(server_address, RagBridgeHandler)
    print("=" * 60)
    print(f"🚀 Naive RAG Lab — Python Bridge Server đang chạy!")
    print(f"📍 Địa chỉ: http://127.0.0.1:{port}")
    print(f"📡 CORS: Cho phép kết nối từ Vite / vibe.j2team.org")
    print(f"🎯 Mode: Retrieve-Only (không cần LLM API key)")
    print("=" * 60)
    print("Nhấn Ctrl+C để dừng server.\n")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nĐang tắt server...")
        httpd.server_close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Naive RAG Lab Python HTTP Bridge")
    parser.add_argument("--port", type=int, default=8000, help="Cổng chạy server (mặc định 8000)")
    args = parser.parse_args()
    run_server(args.port)

