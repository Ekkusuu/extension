// Quick Notes - Study Helper - Background script
// Handles extension lifecycle and storage

browser.runtime.onInstalled.addListener(function(details) {
    if (details.reason === 'install') {
        console.log('Quick Notes: Extension installed');
    } else if (details.reason === 'update') {
        console.log('Quick Notes: Extension updated');
    }
});

// Handle messages from content scripts
browser.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.type === 'getSyncKey') {
        browser.storage.local.get('geminiApiKey', function(result) {
            sendResponse({ syncKey: result.geminiApiKey || null });
        });
        return true;
    }
});
