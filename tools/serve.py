#!/usr/bin/env python3
"""Server lokal untuk Fun Learning Adventure."""

import http.server
import os
import re
import socketserver
import sys
import webbrowser
from functools import partial

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HOST = "127.0.0.1"
START_PORT = int(os.environ.get("PORT", "8000"))


class Handler(http.server.SimpleHTTPRequestHandler):
    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        ".vtt": "text/vtt; charset=utf-8",
        ".js": "application/javascript; charset=utf-8",
        ".json": "application/json; charset=utf-8",
        ".mp4": "video/mp4",
        ".webm": "video/webm",
        ".woff2": "font/woff2",
        ".svg": "image/svg+xml",
    }

    # Dukungan HTTP Range: wajib agar video bisa digeser (seek), melompat ke
    # bab, dan mundur 5 detik. Server bawaan Python tidak mendukungnya.
    range_spec = None

    def send_head(self):
        self.range_spec = None
        header = self.headers.get("Range")
        path = self.translate_path(self.path)
        if not header or not os.path.isfile(path):
            return super().send_head()
        match = re.match(r"bytes=(\d*)-(\d*)$", header.strip())
        if not match or not (match.group(1) or match.group(2)):
            return super().send_head()
        size = os.path.getsize(path)
        if match.group(1):
            start = int(match.group(1))
            end = int(match.group(2)) if match.group(2) else size - 1
        else:  # "bytes=-N" = N byte terakhir
            start = max(0, size - int(match.group(2)))
            end = size - 1
        end = min(end, size - 1)
        if start >= size or start > end:
            self.send_response(416)
            self.send_header("Content-Range", "bytes */%d" % size)
            self.send_header("Content-Length", "0")
            self.end_headers()
            return None
        try:
            f = open(path, "rb")
        except OSError:
            self.send_error(404, "File not found")
            return None
        self.send_response(206)
        self.send_header("Content-Type", self.guess_type(path))
        self.send_header("Accept-Ranges", "bytes")
        self.send_header("Content-Range", "bytes %d-%d/%d" % (start, end, size))
        self.send_header("Content-Length", str(end - start + 1))
        self.end_headers()
        f.seek(start)
        self.range_spec = end - start + 1
        return f

    def copyfile(self, source, outputfile):
        try:
            if self.range_spec is None:
                super().copyfile(source, outputfile)
                return
            remaining = self.range_spec
            while remaining > 0:
                chunk = source.read(min(64 * 1024, remaining))
                if not chunk:
                    break
                outputfile.write(chunk)
                remaining -= len(chunk)
        except (BrokenPipeError, ConnectionResetError, ConnectionAbortedError):
            pass  # browser menutup koneksi saat menggeser video

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        if self.range_spec is None:
            self.send_header("Accept-Ranges", "bytes")
        super().end_headers()

    def log_message(self, fmt, *args):
        sys.stdout.write("%s - %s\n" % (self.address_string(), fmt % args))


def main():
    handler = partial(Handler, directory=ROOT)
    port = START_PORT
    httpd = None

    for _ in range(20):
        try:
            httpd = socketserver.ThreadingTCPServer((HOST, port), handler)
            break
        except OSError:
            port += 1

    if httpd is None:
        print("Tidak dapat menemukan port yang tersedia.")
        return

    url = "http://%s:%d/" % (HOST, port)
    print("Fun Learning Adventure berjalan di %s" % url)
    print("Tekan Ctrl+C untuk menghentikan server.")
    try:
        (os.environ.get("NO_BROWSER") or webbrowser.open(url))
    except Exception:
        pass

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServer dihentikan.")
    finally:
        httpd.server_close()


if __name__ == "__main__":
    main()
