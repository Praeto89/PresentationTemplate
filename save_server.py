#!/usr/bin/env python3
"""
Save Server - Receives HTML updates from browser and saves to index.html
Run alongside the HTTP server on port 8001
"""

from http.server import BaseHTTPRequestHandler, HTTPServer
import json
import os
from pathlib import Path

PORT = 8001
INDEX_FILE = Path(__file__).parent / 'index.html'

class SaveHandler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        """Handle CORS preflight"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def do_POST(self):
        """Receive HTML and save to index.html"""
        if self.path == '/save':
            try:
                # Read the HTML content
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
                    # Remove old backup if exists
                    if backup_file.exists():
                        backup_file.unlink()
                    INDEX_FILE.rename(backup_file)
                    print(f'✓ Backup created: {backup_file.name}')
                
                # Save new content
                INDEX_FILE.write_text(html_content, encoding='utf-8')
                print(f'✓ Saved changes to {INDEX_FILE.name}')
                
                # Send success response
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                response = json.dumps({'status': 'success', 'message': 'File saved successfully'})
                self.wfile.write(response.encode('utf-8'))
                
            except Exception as e:
                print(f'✗ Error saving file: {e}')
                self.send_error(500, f'Error saving file: {str(e)}')
        else:
            self.send_error(404, 'Not found')
    
    def log_message(self, format, *args):
        """Suppress default logging"""
        pass

def run_server():
    server = HTTPServer(('localhost', PORT), SaveHandler)
    print(f'🚀 Save Server running on http://localhost:{PORT}')
    print(f'📝 Ready to save changes to: {INDEX_FILE.name}')
    print('   Press Ctrl+C to stop')
    print()
    
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('\n⏹  Save Server stopped')
        server.shutdown()

if __name__ == '__main__':
    run_server()
