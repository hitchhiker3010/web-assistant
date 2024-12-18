// Listen for installation
chrome.runtime.onInstalled.addListener(() => {
    console.log('WebSummarizer extension installed');
});

// Initialize any required background state
chrome.runtime.onStartup.addListener(() => {
    // Clear any stored state if needed
    chrome.storage.local.clear();
}); 