// Store the selected text
let selectedText = '';

// Listen for text selection
document.addEventListener('mouseup', () => {
    const selection = window.getSelection();
    selectedText = selection.toString().trim();
});

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getContent') {
        // If there's selected text, return it
        if (selectedText) {
            sendResponse({ content: selectedText });
            return;
        }

        // Otherwise, try to get the main content
        const article = document.querySelector('article') || 
                       document.querySelector('.article') ||
                       document.querySelector('.post') ||
                       document.querySelector('main');

        if (article) {
            sendResponse({ content: article.innerText });
            return;
        }

        // Fallback: Get visible text from body while excluding navigation, header, footer
        const bodyText = Array.from(document.body.getElementsByTagName('*'))
            .filter(element => {
                const tag = element.tagName.toLowerCase();
                const isVisible = window.getComputedStyle(element).display !== 'none';
                return isVisible && 
                       !['nav', 'header', 'footer', 'script', 'style'].includes(tag);
            })
            .map(element => element.innerText)
            .join('\n')
            .replace(/(\n\s*){3,}/g, '\n\n'); // Remove excessive newlines

        sendResponse({ content: bodyText });
    }
});

// Clear selection when switching tabs
window.addEventListener('blur', () => {
    selectedText = '';
}); 