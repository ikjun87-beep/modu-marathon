#!/usr/bin/env python3
"""Expo static web export용 정적 서버 — 클린 URL(/explore)을 explore.html로 매핑.
파이썬 기본 http.server는 확장자 없는 경로를 못 찾아 404 → 클라이언트 라우터가 Unmatched.
translate_path에서 없는 경로에 .html을 붙여 서빙하되 브라우저 URL은 그대로 둔다.

사용: python3 scripts/serve-web.py [port] [dir]
"""
import http.server
import os
import sys

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8081
ROOT = sys.argv[2] if len(sys.argv) > 2 else "dist"


class Handler(http.server.SimpleHTTPRequestHandler):
    def translate_path(self, path):
        fs = super().translate_path(path)
        if os.path.isdir(fs):
            idx = os.path.join(fs, "index.html")
            if os.path.exists(idx):
                return idx
        if not os.path.exists(fs):
            clean = super().translate_path(path.split("?")[0].rstrip("/"))
            if os.path.exists(clean + ".html"):
                return clean + ".html"
        return fs

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


if __name__ == "__main__":
    os.chdir(os.path.join(os.path.dirname(__file__), "..") if not os.path.isabs(ROOT) else ".")
    handler = lambda *a, **k: Handler(*a, directory=ROOT, **k)
    with http.server.ThreadingHTTPServer(("0.0.0.0", PORT), handler) as httpd:
        print(f"serving {ROOT} at http://localhost:{PORT} (clean URLs)")
        httpd.serve_forever()
