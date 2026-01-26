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
    response.headers["Access-Control-Allow-Headers"] = "Content-Type"
    response.headers["Access-Control-Allow-Methods"] = "POST, OPTIONS"
    return response

@app.route('/sync', methods=['POST'])
def sync_data():
    data = request.json
    if not data: return jsonify({"status": "error"}), 400

    print("\n--- V3 SYNC REQUEST ---")

    # 1. SAVE FILES
    files = data.get('files', [])
    for file_info in files:
        full_path = os.path.join(PROJECT_ROOT, file_info['path'])
        try:
            os.makedirs(os.path.dirname(full_path), exist_ok=True)
            with open(full_path, 'w', encoding='utf-8') as f:
                f.write(file_info['content'])
            print(f"Saved: {file_info['path']}")
        except Exception as e:
            print(f"Error saving {file_info['path']}: {e}")

    # 2. EXECUTE COMMANDS & CAPTURE OUTPUT
    commands = data.get('commands', [])
    execution_log = ""
    error_detected = False

    for cmd in commands:
        print(f"Running: {cmd}")
        try:
            # V3 CHANGE: capture_output=True lets us read what happened
            result = subprocess.run(
                cmd, shell=True, cwd=PROJECT_ROOT, 
                capture_output=True, text=True, timeout=60
            )
            
            # Combine Standard Output and Error Output
            output = result.stdout + "\n" + result.stderr
            execution_log += f"\n> {cmd}\n{output}\n"
            
            # If the command failed (exit code is not 0), flag it
            if result.returncode != 0:
                error_detected = True
                print(f"Command Failed: {cmd}")
                
        except subprocess.TimeoutExpired:
            msg = f"\n> {cmd}\n[Error: Command timed out (60s limit)]\n"
            execution_log += msg
            error_detected = True
        except Exception as e:
            msg = f"\n> {cmd}\n[Execution Error: {str(e)}]\n"
            execution_log += msg
            error_detected = True

    return jsonify({
        "status": "completed",
        "logs": execution_log,
        "has_error": error_detected
    })

if __name__ == '__main__':
    if not os.path.exists(PROJECT_ROOT):
        os.makedirs(PROJECT_ROOT)
    print(f"Bridge V3 (Auto-Loop) running on port {PORT}")
    app.run(port=PORT)