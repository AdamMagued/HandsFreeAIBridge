chrome.commands.onCommand.addListener((command) => {
    if (command === "sync-code") {
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, {action: "scrape_and_send"});
        });
    }
});