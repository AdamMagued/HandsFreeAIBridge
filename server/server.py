import os
import sys
import subprocess
import json
from flask import Flask, request, jsonify

# --- CONFIGURATION ---
PROJECT_ROOT = r"A:\Projects"
PORT = 5000

app = Flask(__name__)

# --- CORS HEADERS ---
@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    response.headers["Access-Control-Allow-Methods"] = "POST, OPTIONS"
    return response

def spawn_visible_console(command):
    """Spawns a new, visible CMD window to run the command."""
    print(f"Executing: {command}")
    try:
        if sys.platform == "win32":
            # cwd=PROJECT_ROOT ensures the window opens in your A:\Projects folder
            subprocess.Popen(
                f'cmd /k "{command}"', 
                cwd=PROJECT_ROOT, 
                creationflags=subprocess.CREATE_NEW_CONSOLE
            )
        else:
            subprocess.Popen(f"x-terminal-emulator -e '{command}'", shell=True, cwd=PROJECT_ROOT)
    except Exception as e:
        print(f"Error spawning command: {e}")

@app.route('/sync', methods=['POST', 'OPTIONS'])
def sync_data():
    if request.method == 'OPTIONS':
        return jsonify({"status": "ok"}), 200

    data = request.json
    if not data:
        return jsonify({"status": "error", "message": "No data received"}), 400

    print("\n--- NEW SYNC REQUEST ---")

    # 1. Handle Files
    files = data.get('files', [])
    for file_info in files:
        rel_path = file_info.get('path')
        content = file_info.get('content')
        
        if rel_path and content:
            full_path = os.path.join(PROJECT_ROOT, rel_path)
            folder_path = os.path.dirname(full_path)
            
            try:
                os.makedirs(folder_path, exist_ok=True)
                with open(full_path, 'w', encoding='utf-8') as f:
                    f.write(content)
                print(f"Saved: {rel_path}")
            except Exception as e:
                print(f"Failed to save {rel_path}: {e}")

    # 2. Handle Commands (With Deduplication)
    raw_commands = data.get('commands', [])
    unique_commands = []
    seen_commands = set()

    for cmd in raw_commands:
        cmd = cmd.strip()
        # Filter out empty commands and duplicates
        if cmd and cmd not in seen_commands:
            unique_commands.append(cmd)
            seen_commands.add(cmd)

    for cmd in unique_commands:
        spawn_visible_console(cmd)

    return jsonify({"status": "success"}), 200

if __name__ == '__main__':
    # Startup Check
    if not os.path.exists(PROJECT_ROOT):
        print(f"Creating project root: {PROJECT_ROOT}")
        os.makedirs(PROJECT_ROOT, exist_ok=True)

    print(f"Bridge V2 running on port {PORT}")
    print(f"Targeting: {PROJECT_ROOT}")
    app.run(port=PORT, debug=True)