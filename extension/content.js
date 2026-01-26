(function() {
    console.log("Bridge V3.1: Loaded (Auto-Loop Defaults to OFF)");

    // STATE: Only sync automatically if this is true
    let autoLoopActive = false;
    let lastProcessedMessage = "";

    // 1. HELPER: Get the latest AI response text
    function getLastAIMessage() {
        const candidates = document.querySelectorAll("model-response, .model-response-text, .message-content, [data-message-author='assistant']");
        if (candidates.length === 0) return null;
        const lastEl = candidates[candidates.length - 1];
        return lastEl.innerText || lastEl.textContent;
    }

    // 2. HELPER: Type Error into Chat & Send
    function sendErrorToGemini(errorLog) {
        if (!autoLoopActive) return; // Safety check

        console.log("Bridge: Feeding error back to Gemini...");
        const inputBox = document.querySelector("rich-textarea > div[contenteditable='true']") || 
                         document.querySelector("div[contenteditable='true']");

        if (inputBox) {
            inputBox.focus();
            // Use execCommand to insert text naturally
            document.execCommand("insertText", false, 
                "The code failed with this error:\n\n" + errorLog + "\n\nPlease fix the code and try again.");
            
            // Wait a moment then click Send
            setTimeout(() => {
                const sendBtn = document.querySelector("button[aria-label*='Send']");
                if (sendBtn) sendBtn.click();
            }, 1000);
        }
    }

    // 3. LOGIC: Watch for "Generation Complete"
    // We observe the "Send" button. When it goes from disabled -> enabled, Gemini is done.
    const observer = new MutationObserver((mutations) => {
        if (!autoLoopActive) return; // Ignore everything if switch is OFF

        const sendBtn = document.querySelector("button[aria-label*='Send']");
        
        // If Send button is present and clickable (not disabled)
        if (sendBtn && !sendBtn.disabled) {
            const currentMsg = getLastAIMessage();
            
            // If this is a NEW message we haven't processed yet
            if (currentMsg && currentMsg !== lastProcessedMessage) {
                console.log("Bridge: New message detected. Auto-Syncing...");
                lastProcessedMessage = currentMsg; // Mark as done
                
                // Trigger the Sync
                chrome.runtime.sendMessage({ action: "sync_data", content: currentMsg });
            }
        }
    });

    // Start Watching the DOM
    observer.observe(document.body, { childList: true, subtree: true });

    // 4. LISTENER: Handle commands from Popup/Background
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        
        // Command: Manual Sync (Ctrl+Shift+Y)
        if (request.action === "get_content") {
            const text = getLastAIMessage();
            if (text) {
                lastProcessedMessage = text;
                chrome.runtime.sendMessage({ action: "sync_data", content: text });
                sendResponse({status: "Manual Sync Sent"});
            }
        }

        // Command: Toggle Auto-Loop (From Popup)
        if (request.action === "toggle_loop") {
            autoLoopActive = request.state;
            console.log(`Bridge: Auto-Loop is now ${autoLoopActive ? 'ON' : 'OFF'}`);
            sendResponse({status: "Updated", state: autoLoopActive});
        }

        // Command: Receive Error (From Python)
        if (request.action === "feed_error") {
            sendErrorToGemini(request.logs);
        }
    });
})();