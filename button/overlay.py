import tkinter as tk
import pyautogui
import pygetwindow as gw

def on_click():
    try:
        chrome_windows = [w for w in gw.getAllTitles() if 'Gemini' in w or 'Chrome' in w]
        if chrome_windows:
            window = gw.getWindowsWithTitle(chrome_windows[0])[0]
            if not window.isActive:
                window.activate()
    except Exception as e:
        print(f"Could not focus Chrome: {e}")

    pyautogui.hotkey('ctrl', 'shift', 'y')
    btn.config(bg="#4CAF50", text="SYNCED")
    root.after(1000, lambda: btn.config(bg="#333333", text="SYNC"))

# --- NEW: Quit Function ---
def quit_app(event):
    root.quit()

# UI Setup
root = tk.Tk()
root.title("Bridge")
root.geometry("100x60")
root.attributes('-topmost', True)
root.overrideredirect(True)

# Make it draggable
def start_move(event):
    root.x = event.x
    root.y = event.y
def do_move(event):
    x = root.winfo_x() + (event.x - root.x)
    y = root.winfo_y() + (event.y - root.y)
    root.geometry(f"+{x}+{y}")

root.bind('<Button-1>', start_move)
root.bind('<B1-Motion>', do_move)

# --- NEW: Right-Click to Close ---
root.bind('<Button-3>', quit_app)  # Right-click exits the app

btn = tk.Button(root, text="SYNC", command=on_click, bg="#333333", fg="white", font=("Arial", 12, "bold"))
btn.pack(expand=True, fill='both')

# Add a tooltip instructions
print("Overlay running. Right-click the button to close it.")

root.mainloop()