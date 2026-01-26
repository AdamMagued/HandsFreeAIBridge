// background.js - The Brain
// Handles parsing, communicating with Python, AND listening for Hotkeys

console.log("Bridge V2: Background Service Worker Loaded");

// 1. Listen for the Hotkey (Ctrl+Shift+Y) or Overlay Button
chrome.commands.onCommand.addListener((command) => {
    if (command === "sync-code") {
        console.log("Background: Hotkey/Command detected!");
        
        // Find the active tab and tell it to scrape
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            if (tabs.length === 0) return;
            
            const activeTab = tabs[0];
            
            // Send the "get_content" signal (Same as clicking the popup)
            chrome.tabs.sendMessage(activeTab.id, {action: "get_content"}, (response) => {
                if (chrome.runtime.lastError) {
                    console.error("Background: Could not send to tab:", chrome.runtime.lastError);
                } else {
                    console.log("Background: Signal sent to tab.");
                }
            });
        });
    }
});

// 2. Listen for Data coming back from the Content Script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // LOG EVERYTHING to see if messages are arriving
    console.log("Background: Received message:", request);

    if (request.action === "sync_data") {
        console.log("Background: Sync triggered. Parsing content...");
        const rawText = request.content;

        // --- PARSING LOGIC ---
        // A. Extract Files
        const files = [];
        const fileRegex = /(?:^|\n)## FILE: (.+?)\n([\s\S]*?)(?=(?:\n## |$))/g;
        let fileMatch;
        while ((fileMatch = fileRegex.exec(rawText)) !== null) {
            let path = fileMatch[1].trim();
            let content = fileMatch[2].trim();

            // --- CLEANUP LOGIC (THE FIX) ---
            
            // 1. Remove Markdown code blocks (top and bottom fences)
            if (content.startsWith("```")) {
                content = content.replace(/^```[a-zA-Z]*\n?/i, ""); // Remove top fence
                content = content.replace(/\n?```$/, "");        // Remove bottom fence
            }

            // 2. Remove trailing language labels (The "PowerShell" Fix)
            // If the content ends with a newline followed by a single word (a-z), remove it.
            // This catches "JavaScript", "PowerShell", "bash", etc. leaving artifacts at the end.
            content = content.replace(/\n[a-zA-Z]+\s*$/, "");

            files.push({
                path: path,
                content: content
            });
        }

        // B. Extract Commands
        const commands = [];
        const cmdRegex = /(?:^|\n)## CMD: (.+?)(?:\n|$)/g;
        let cmdMatch;
        while ((cmdMatch = cmdRegex.exec(rawText)) !== null) {
            const cmd = cmdMatch[1].trim();
            if (cmd) commands.push(cmd);
        }

        console.log(`Parsed: ${files.length} files, ${commands.length} commands.`);

        // --- SEND TO PYTHON SERVER ---
        fetch("http://localhost:5000/sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ files: files, commands: commands })
        })
        .then(response => response.json())
        .then(data => {
            console.log("Server success:", data);
            sendResponse({ status: "success", data: data });
        })
        .catch(error => {
            console.error("Server connection failed:", error);
            sendResponse({ status: "error", message: error.toString() });
        });

        return true; // Keep channel open for async response
    }
});