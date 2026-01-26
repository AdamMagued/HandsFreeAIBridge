import os
import sys
import subprocess
import json
from flask import Flask, request, jsonify

# --- CONFIGURATION ---
PROJECT_ROOT = r"A:\Projects"
PORT = 5000

app = Flask(__name__)

def spawn_visible_console(command):
    """Spawns a new, visible CMD window to run the command."""
    print(f"Executing: {command}")
    try:
        if sys.platform == "win32":
            # CREATE_NEW_CONSOLE (16) forces a new window
            subprocess.Popen(f'cmd /k "{command}"', creationflags=subprocess.CREATE_NEW_CONSOLE)
        else:
            # Fallback for Mac/Linux (Terminal)
            subprocess.Popen(f"x-terminal-emulator -e '{command}'", shell=True)
    except Exception as e:
        print(f"Error spawning command: {e}")

@app.route('/sync', methods=['POST'])
def sync_data():
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
            # Construct full path safely
            full_path = os.path.join(PROJECT_ROOT, rel_path)
            folder_path = os.path.dirname(full_path)
            
            # Auto-create nested folders (Fixes silent fail on missing dirs)
            try:
                os.makedirs(folder_path, exist_ok=True)
                with open(full_path, 'w', encoding='utf-8') as f:
                    f.write(content)
                print(f"Saved: {rel_path}")
            except Exception as e:
                print(f"Failed to save {rel_path}: {e}")

    # 2. Handle Commands
    commands = data.get('commands', [])
    for cmd in commands:
        spawn_visible_console(cmd)

    return jsonify({"status": "success"}), 200

if __name__ == '__main__':
    # Startup Check
    if not os.path.exists(PROJECT_ROOT):
        print(f"WARNING: The path {PROJECT_ROOT} does not exist.")
        print("Creating it now...")
        os.makedirs(PROJECT_ROOT, exist_ok=True)

    print(f"Bridge V2 running on port {PORT}")
    print(f"Targeting: {PROJECT_ROOT}")
    app.run(port=PORT, debug=True)