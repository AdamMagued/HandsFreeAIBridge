// background.js - Bridge V3

console.log("Bridge V3: Loop Manager Loaded");

// Listen for Hotkey
chrome.commands.onCommand.addListener((command) => {
    if (command === "sync-code") {
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            if (tabs.length === 0) return;
            chrome.tabs.sendMessage(tabs[0].id, {action: "get_content"});
        });
    }
});

// Process Data
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "sync_data") {
        const rawText = request.content;

        // Parse Files
        const files = [];
        const fileRegex = /(?:^|\n)## FILE: (.+?)\n([\s\S]*?)(?=(?:\n## |$))/g;
        let fileMatch;
        while ((fileMatch = fileRegex.exec(rawText)) !== null) {
            let content = fileMatch[2].trim();
            content = content.replace(/^```[a-zA-Z]*\n?/i, "").replace(/\n?```$/, ""); 
            content = content.replace(/\n[a-zA-Z]+\s*$/, ""); // Powershell fix
            files.push({ path: fileMatch[1].trim(), content: content });
        }

        // Parse Commands
        const commands = [];
        const cmdRegex = /(?:^|\n)## CMD: (.+?)(?:\n|$)/g;
        let cmdMatch;
        while ((cmdMatch = cmdRegex.exec(rawText)) !== null) {
            commands.push(cmdMatch[1].trim());
        }

        console.log("Sending to Server...");

        // Send to Python
        fetch("http://localhost:5000/sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ files: files, commands: commands })
        })
        .then(response => response.json())
        .then(data => {
            console.log("Server Response:", data);
            
            // --- THE AUTO-LOOP LOGIC ---
            if (data.has_error && data.logs) {
                console.log("Error detected! Feeding back to Gemini...");
                
                // Send the error logs back to the active tab
                chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
                    if (tabs.length > 0) {
                        // Limit log size to 2000 chars so we don't overwhelm the chat
                        chrome.tabs.sendMessage(tabs[0].id, {
                            action: "feed_error", 
                            logs: data.logs.substring(0, 2000) 
                        });
                    }
                });
            } else {
                console.log("Success! No errors reporting.");
            }
        })
        .catch(err => console.error(err));
    }
});