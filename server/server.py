import os
import shutil
import winsound
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Allows the Chrome Extension to talk to this server

# --- CONFIGURATION (CHANGE THIS TO YOUR PROJECT FOLDER) ---
# This is where your actual code will be written.
PROJECT_ROOT = r"A:\Projects" 

@app.route('/sync', methods=['POST'])
def sync_code():
    data = request.json
    files = data.get('files', [])
    
    if not files:
        return jsonify({"status": "error", "message": "No files found"}), 400

    success_count = 0
    
    for file_obj in files:
        rel_path = file_obj['path']
        content = file_obj['content']
        
        # Security: Prevent writing outside the project folder
        full_path = os.path.abspath(os.path.join(PROJECT_ROOT, rel_path))
        if not full_path.startswith(os.path.abspath(PROJECT_ROOT)):
            print(f"SECURITY ALERT: Attempted to write to {full_path}")
            continue

        try:
            # 1. Ensure directory exists
            os.makedirs(os.path.dirname(full_path), exist_ok=True)
            
            # 2. Create Backup (if file exists)
            if os.path.exists(full_path):
                shutil.copy2(full_path, full_path + ".bak")
            
            # 3. Atomic Write (Write to temp, then rename)
            temp_path = full_path + ".tmp"
            with open(temp_path, 'w', encoding='utf-8') as f:
                f.write(content)
            
            os.replace(temp_path, full_path)
            success_count += 1
            print(f" [SUCCESS] Wrote: {rel_path}")
            
        except Exception as e:
            print(f" [ERROR] Failed to write {rel_path}: {e}")

    # Audio Feedback (Beep)
    if success_count > 0:
        winsound.Beep(1000, 200) # High pitch = success
        return jsonify({"status": "success", "written": success_count}), 200
    else:
        winsound.Beep(500, 500) # Low pitch = fail
        return jsonify({"status": "error", "message": "Write failed"}), 500

if __name__ == '__main__':
    print(f"--- HANDS-FREE BRIDGE ACTIVE ---")
    print(f"Targeting Project: {PROJECT_ROOT}")
    app.run(port=5000)