(function() {
    console.log("Bridge V2: Universal Listener Loaded");

    function getLastAIMessage() {
        const candidates = document.querySelectorAll("model-response, .model-response-text, .message-content, .markdown, .font-claude-message, [data-message-author='assistant']");
        
        if (candidates.length === 0) {
            console.log("Bridge: No obvious messages found. Trying deep search...");
            return null;
        }

        const lastEl = candidates[candidates.length - 1];
        let text = lastEl.innerText;

        // Shadow DOM fallback (Gemini specific)
        if (!text && lastEl.shadowRoot) {
            text = lastEl.shadowRoot.textContent;
        }

        if (!text) text = lastEl.textContent;

        return text;
    }

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        console.log("Bridge: Signal Received! Action:", request.action);

        // --- THE FIX: Accept BOTH command names ---
        if (request.action === "get_content" || request.action === "scrape_and_send") {
            
            const textToSync = getLastAIMessage();

            if (!textToSync || textToSync.trim().length === 0) {
                console.error("Bridge: Found message element, but it was empty.");
                alert("Bridge: Empty message found. Wait for generation.");
                return;
            }

            console.log("Bridge: Syncing " + textToSync.length + " chars...");

            chrome.runtime.sendMessage({
                action: "sync_data",
                content: textToSync
            });
            
            sendResponse({status: "success"});
        }
    });
})();