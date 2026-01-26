chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "scrape_and_send") {
        syncCode();
    }
});

function syncCode() {
    // Find the last response
    const responses = document.querySelectorAll('.model-response-text, .response-content'); 
    const lastResponse = responses[responses.length - 1];

    if (!lastResponse) {
        alert("Could not find Gemini response!");
        return;
    }

    const codeBlocks = lastResponse.querySelectorAll('code, pre');
    let filesPayload = [];
    let commandsPayload = [];

    codeBlocks.forEach(block => {
        const text = block.innerText;

        // Check for FILE
        const fileMatch = text.match(/^## FILE:\s*(.+)$/m);
        if (fileMatch) {
            const filepath = fileMatch[1].trim();
            const cleanContent = text.replace(/^## FILE:.*$/m, "").trim();
            filesPayload.push({ path: filepath, content: cleanContent });
        }

        // Check for COMMAND
        const cmdMatch = text.match(/^## CMD:\s*(.+)$/m);
        if (cmdMatch) {
            const command = cmdMatch[1].trim();
            commandsPayload.push(command);
        }
    });

    if (filesPayload.length === 0 && commandsPayload.length === 0) {
        alert("Nothing found! Did you use the V2 Prompt?");
        return;
    }

    // Send to Python
    fetch('http://localhost:5000/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            files: filesPayload,
            commands: commandsPayload
        })
    })
    .then(res => {
        if (res.ok) console.log("Sync V2 Successful");
        else alert("Server Error");
    })
    .catch(err => alert("Connection Failed. Is server.py running?"));
}