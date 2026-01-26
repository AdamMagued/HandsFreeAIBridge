// popup.js
document.addEventListener('DOMContentLoaded', function() {
    const syncBtn = document.getElementById('syncBtn');
    const statusMsg = document.getElementById('statusMsg');

    if (syncBtn) {
        syncBtn.addEventListener('click', function() {
            statusMsg.innerText = "Finding active tab...";
            
            // Query for the active tab in the current window
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                if (tabs.length === 0) {
                    statusMsg.innerText = "Error: No active tab.";
                    return;
                }

                const activeTab = tabs[0];
                statusMsg.innerText = "Requesting data...";

                // Send message to content script
                chrome.tabs.sendMessage(activeTab.id, {action: "get_content"}, function(response) {
                    
                    // Check for connection errors (e.g., content script not loaded)
                    if (chrome.runtime.lastError) {
                        console.error("Popup Error:", chrome.runtime.lastError);
                        statusMsg.innerText = "Error: Refresh Page!";
                    } else {
                        statusMsg.innerText = "Sync sent!";
                        console.log("Popup: Response received:", response);
                    }
                    
                    setTimeout(() => statusMsg.innerText = "Ready", 2000);
                });
            });
        });
    }
});