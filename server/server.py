import os
import shutil
import winsound
import subprocess
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# --- CONFIGURATION ---
# UPDATE THIS TO YOUR PATH!
PROJECT_ROOT = r"A:\Projects"

@app.route('/sync', methods=['POST'])
def sync_code():
    data = request.json
    files = data.get('files', [])
    commands = data.get('commands', []) # New: Listen for commands
    
    if not files and not commands:
        return jsonify({"status": "error", "message": "Nothing to sync"}), 400

    # 1. PROCESS FILES FIRST
    success_count = 0
    for file_obj in files:
        rel_path = file_obj['path']
        content = file_obj['content']
        
        full_path = os.path.abspath(os.path.join(PROJECT_ROOT, rel_path))
        
        # Security Check
        if not full_path.startswith(os.path.abspath(PROJECT_ROOT)):
            print(f"SECURITY ALERT: Skipped {full_path}")
            continue

        try:
            os.makedirs(os.path.dirname(full_path), exist_ok=True) # Handles nested folders
            
            # Backup
            if os.path.exists(full_path):
                shutil.copy2(full_path, full_path + ".bak")
            
            # Write
            temp_path = full_path + ".tmp"
            with open(temp_path, 'w', encoding='utf-8') as f:
                f.write(content)
            os.replace(temp_path, full_path)
            success_count += 1
            print(f" [FILE] Wrote: {rel_path}")
            
        except Exception as e:
            print(f" [ERROR] {rel_path}: {e}")

    # 2. PROCESS COMMANDS SECOND
    cmd_count = 0
    for cmd in commands:
        print(f" [CMD] Executing: {cmd}")
        # Opens a new visible CMD window, runs the command inside the Project Root, and stays open (/k) so you can read output
        # If you want it to close automatically after success, change /k to /c
        subprocess.Popen(f'start cmd /k "{cmd}"', shell=True, cwd=PROJECT_ROOT)
        cmd_count += 1

    # Feedback
    if success_count > 0 or cmd_count > 0:
        winsound.Beep(1000, 200)
        return jsonify({"status": "success"}), 200
    else:
        winsound.Beep(500, 500)
        return jsonify({"status": "error"}), 500

if __name__ == '__main__':
    print(f"--- HANDS-FREE BRIDGE V2 ACTIVE ---")
    print(f"Targeting: {PROJECT_ROOT}")
    app.run(port=5000)