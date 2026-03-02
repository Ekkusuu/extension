// Clipboard Manager - Popup script
document.addEventListener('DOMContentLoaded', function() {
    const apiKeyInput = document.getElementById('apiKey');
    const providerSelect = document.getElementById('providerSelect');
    const saveBtn = document.getElementById('saveBtn');
    const status = document.getElementById('status');
    const currentKey = document.getElementById('currentKey');
    const advancedToggle = document.getElementById('advancedToggle');
    const advancedSection = document.getElementById('advancedSection');

    // Toggle advanced sync settings
    advancedToggle.addEventListener('click', function() {
        advancedSection.classList.toggle('open');
        advancedToggle.textContent = advancedSection.classList.contains('open')
            ? '▲ Sync settings'
            : '⚙ Sync settings';
    });

    // Load existing settings
    browser.storage.local.get(['geminiApiKey', 'apiProvider'], function(result) {
        if (result.geminiApiKey) {
            const maskedKey = result.geminiApiKey.substring(0, 8) + '••••••••••••' + result.geminiApiKey.slice(-4);
            currentKey.textContent = maskedKey;
        }
        if (result.apiProvider) {
            providerSelect.value = result.apiProvider;
        }
    });

    // Save settings
    saveBtn.addEventListener('click', function() {
        const apiKey = apiKeyInput.value.trim();
        const provider = providerSelect.value;

        if (!apiKey) {
            showStatus('Please enter a sync token', 'error');
            return;
        }

        if (apiKey.length < 20) {
            showStatus('Token too short', 'error');
            return;
        }

        browser.storage.local.set({ geminiApiKey: apiKey, apiProvider: provider }, function() {
            showStatus('Token saved!', 'success');
            const maskedKey = apiKey.substring(0, 8) + '••••••••••••' + apiKey.slice(-4);
            currentKey.textContent = maskedKey;
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
