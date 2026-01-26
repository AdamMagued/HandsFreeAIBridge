// Listen for the specific message from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "scrape_and_send") {
        syncCode();
    }
});

function syncCode() {
    // 1. Find the LAST response bubble
    const responses = document.querySelectorAll('.model-response-text, .response-content'); 
    // Note: Gemini class names change. If this breaks, inspect element to find new class.
    const lastResponse = responses[responses.length - 1];

    if (!lastResponse) {
        alert("Could not find Gemini response!");
        return;
    }

    // 2. Parse Code Blocks
    const codeBlocks = lastResponse.querySelectorAll('code, pre');
    let filesPayload = [];

    codeBlocks.forEach(block => {
        const text = block.innerText;
        // Regex to find "## FILE: path/to/file"
        const match = text.match(/^## FILE:\s*(.+)$/m);
        
        if (match) {
            const filepath = match[1].trim();
            // Remove the header line from the content so it's clean code
            const cleanContent = text.replace(/^## FILE:.*$/m, "").trim();
            
            filesPayload.push({
                path: filepath,
                content: cleanContent
            });
        }
    });

    if (filesPayload.length === 0) {
        alert("No files found! Did you use the Golden Prompt?");
        return;
    }

    // 3. Send to Python Server
    fetch('http://localhost:5000/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: filesPayload })
    })
    .then(response => {
        if (response.ok) {
            console.log("Sync Successful");
            // Visual feedback handled by server sound, but we can flash the screen here if needed
        } else {
            alert("Server Error");
        }
    })
    .catch(err => alert("Connection Failed. Is server.py running?"));
}