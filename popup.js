// Quick Notes Settings - Popup script
document.addEventListener('DOMContentLoaded', function() {
    const apiKeyInput = document.getElementById('apiKey');
    const saveBtn = document.getElementById('saveBtn');
    const status = document.getElementById('status');
    const currentKey = document.getElementById('currentKey');

    // Load existing sync key
    browser.storage.local.get('geminiApiKey', function(result) {
        if (result.geminiApiKey) {
            const maskedKey = result.geminiApiKey.substring(0, 6) + '••••••••' + result.geminiApiKey.slice(-4);
            currentKey.textContent = 'Sync key configured: ' + maskedKey;
            currentKey.classList.add('set');
        }
    });

    // Save sync key
    saveBtn.addEventListener('click', function() {
        const apiKey = apiKeyInput.value.trim();

        if (!apiKey) {
            showStatus('Please enter a sync key', 'error');
            return;
        }

        // Basic validation
        if (apiKey.length < 20) {
            showStatus('Invalid sync key format', 'error');
            return;
        }

        browser.storage.local.set({ geminiApiKey: apiKey }, function() {
            showStatus('Settings saved successfully!', 'success');
            const maskedKey = apiKey.substring(0, 6) + '••••••••' + apiKey.slice(-4);
            currentKey.textContent = 'Sync key configured: ' + maskedKey;
            currentKey.classList.add('set');
            apiKeyInput.value = '';
        });
    });

    // Handle Enter key
    apiKeyInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            saveBtn.click();
        }
    });

    function showStatus(message, type) {
        status.textContent = message;
        status.className = 'status ' + type;
        
        setTimeout(function() {
            status.className = 'status';
        }, 3000);
    }
});
