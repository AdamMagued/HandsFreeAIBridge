document.addEventListener('DOMContentLoaded', function() {
    const syncBtn = document.getElementById('syncBtn');
    const loopToggle = document.getElementById('loopToggle');
    const statusMsg = document.getElementById('statusMsg');

    function sendMessageToContent(message, callback) {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            if (tabs.length === 0) {
                statusMsg.innerText = "No active tab.";
                return;
            }
            chrome.tabs.sendMessage(tabs[0].id, message, (response) => {
                if (chrome.runtime.lastError) {
                    statusMsg.innerText = "Refresh Page!";
                } else if (callback) {
                    callback(response);
                }
            });
        });
    }

    // 1. Manual Sync Click
    if (syncBtn) {
        syncBtn.addEventListener('click', function() {
            statusMsg.innerText = "Syncing...";
            sendMessageToContent({action: "get_content"}, (resp) => {
                statusMsg.innerText = "Sent!";
                setTimeout(() => statusMsg.innerText = "Ready", 1500);
            });
        });
    }

    // 2. Loop Toggle Click
    if (loopToggle) {
        loopToggle.addEventListener('change', function() {
            const isChecked = loopToggle.checked;
            statusMsg.innerText = isChecked ? "Loop ENABLED" : "Loop DISABLED";
            
            sendMessageToContent({action: "toggle_loop", state: isChecked}, (resp) => {
                console.log("Loop State Updated");
            });
        });
    }
});