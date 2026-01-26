import tkinter as tk
import pyautogui
import pygetwindow as gw # You might need: pip install pygetwindow

def on_click():
    # 1. Switch focus to Chrome (so the hotkey works there)
    try:
        # Tries to find a window with "Gemini" or "Chrome" in title
        chrome_windows = [w for w in gw.getAllTitles() if 'Gemini' in w or 'Chrome' in w]
        if chrome_windows:
            window = gw.getWindowsWithTitle(chrome_windows[0])[0]
            if not window.isActive:
                window.activate()
    except Exception as e:
        print(f"Could not focus Chrome: {e}")

    # 2. Send the Hotkey (Ctrl+Shift+Y)
    # The Extension listens for this specific combo
    pyautogui.hotkey('ctrl', 'shift', 'y')
    
    # 3. Flash the button green to show it was clicked
    btn.config(bg="#4CAF50", text="SYNCED")
    root.after(1000, lambda: btn.config(bg="#333333", text="SYNC"))

# UI Setup
root = tk.Tk()
root.title("Bridge")
root.geometry("100x60")
root.attributes('-topmost', True) # Keep on top
root.overrideredirect(True) # Remove title bar (clean look)

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

# The Big Button
btn = tk.Button(root, text="SYNC", command=on_click, bg="#333333", fg="white", font=("Arial", 12, "bold"))
btn.pack(expand=True, fill='both')

root.mainloop()