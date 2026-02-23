#!/usr/bin/env python3
"""
Unified Presentation Server
============================
Serves static files AND handles save requests on a SINGLE port.

  python server.py          → starts on http://localhost:8000
  python server.py 9000     → starts on http://localhost:9000

Endpoints:
  GET  /*       → serves static files from the project directory
  POST /save    → saves HTML content to index.html (with backup)
  GET  /health  → returns server status (used by edit-mode health check)
"""

from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import json
import os
import sys
from pathlib import Path

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
ROOT = Path(__file__).parent
INDEX_FILE = ROOT / 'index.html'


class UnifiedHandler(SimpleHTTPRequestHandler):
    """Serves static files + handles /save and /health endpoints."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    # ── CORS headers (keep it simple – localhost only) ──────────────────
    def _cors_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')

    # ── OPTIONS (preflight) ─────────────────────────────────────────────
    def do_OPTIONS(self):
        self.send_response(200)
        self._cors_headers()
        self.end_headers()

    # ── GET ──────────────────────────────────────────────────────────────
    def do_GET(self):
        # Strip query string for route matching
        path = self.path.split('?')[0].split('#')[0]
        if path == '/health':
            self._handle_health()
        else:
            super().do_GET()

    # ── POST ─────────────────────────────────────────────────────────────
    def do_POST(self):
        if self.path == '/save':
            self._handle_save()
        else:
            self.send_error(404, 'Not found')

    # ── /health ─────────────────────────────────────────────────────────
    def _handle_health(self):
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self._cors_headers()
        self.end_headers()
        response = json.dumps({
            'status': 'ok',
            'saveEnabled': True,
            'message': 'Unified server running – save endpoint available',
        })
        self.wfile.write(response.encode('utf-8'))

    # ── /save ───────────────────────────────────────────────────────────
    def _handle_save(self):
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            html_content = data.get('html', '')

            if not html_content:
                self.send_error(400, 'No HTML content provided')
                return

            # Backup existing file
            if INDEX_FILE.exists():
                backup_file = INDEX_FILE.with_suffix('.html.backup')
                if backup_file.exists():
                    backup_file.unlink()
                INDEX_FILE.rename(backup_file)
                print(f'  ✓ Backup created: {backup_file.name}')

            # Save new content
            INDEX_FILE.write_text(html_content, encoding='utf-8')
            print(f'  ✓ Saved changes to {INDEX_FILE.name}')

            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self._cors_headers()
            self.end_headers()
            response = json.dumps({
                'status': 'success',
                'message': 'File saved successfully',
            })
            self.wfile.write(response.encode('utf-8'))

        except Exception as e:
            print(f'  ✗ Error saving file: {e}')
            self.send_error(500, f'Error saving file: {str(e)}')

    # ── Suppress noisy per-request logging ──────────────────────────────
    def log_message(self, format, *args):
        # Keep error messages, suppress routine GET 200s
        try:
            if args and isinstance(args[0], str) and ' ' in args[0]:
                method = args[0].split()[0]
                status = str(args[1]) if len(args) > 1 else ''
                if method == 'GET' and status.startswith('2'):
                    return  # suppress successful GET noise
            # Print everything else (errors, POST, etc.)
            print(f'  {format % args}')
        except Exception:
            print(f'  {format % args}')


def run():
    server = ThreadingHTTPServer(('localhost', PORT), UnifiedHandler)
    print()
    print('  ╔══════════════════════════════════════════════════════╗')
    print(f'  ║  🚀  Presentation Server running                    ║')
    print(f'  ║      http://localhost:{PORT}                         ║')
    print('  ║                                                      ║')
    print('  ║  📄  Static files:  ✓                                ║')
    print('  ║  💾  Save endpoint: ✓  (POST /save)                  ║')
    print('  ║  ✏️   Edit mode:     Ctrl+E or click ✏️ button        ║')
    print('  ║                                                      ║')
    print('  ║  Press Ctrl+C to stop                                ║')
    print('  ╚══════════════════════════════════════════════════════╝')
    print()

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('\n  ⏹  Server stopped')
        server.shutdown()


if __name__ == '__main__':
    run()
