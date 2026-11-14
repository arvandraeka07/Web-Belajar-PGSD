#!/usr/bin/env python3
"""Server lokal untuk Fun Learning Adventure."""

import http.server
import os
import socketserver
import sys
import webbrowser
from functools import partial

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HOST = "127.0.0.1"
START_PORT = 8000


class Handler(http.server.SimpleHTTPRequestHandler):
    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        ".vtt": "text/vtt; charset=utf-8",
        ".mp4": "video/mp4",
        ".webm": "video/webm",
        ".woff2": "font/woff2",
        ".svg": "image/svg+xml",
    }

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
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
        webbrowser.open(url)
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
