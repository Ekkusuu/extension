// Clipboard Manager - Popup script
document.addEventListener('DOMContentLoaded', function() {
    const clipboardInput = document.getElementById('apiKey');
    const saveBtn = document.getElementById('saveBtn');
    const status = document.getElementById('status');
    const currentKey = document.getElementById('currentKey');

    const syncKeyInput = document.getElementById('syncKey');
    const providerSelect = document.getElementById('providerSelect');
    const saveSyncBtn = document.getElementById('saveSyncBtn');
    const syncStatus = document.getElementById('syncStatus');

    const advancedToggle = document.getElementById('advancedToggle');
    const advancedSection = document.getElementById('advancedSection');

    // Toggle advanced sync settings
    advancedToggle.addEventListener('click', function() {
        advancedSection.classList.toggle('open');
        advancedToggle.textContent = advancedSection.classList.contains('open')
            ? '▲ Sync settings'
            : '⚙ Sync settings';
    });

    // Load last saved clipboard text and current provider
    browser.storage.local.get(['clipboardText', 'geminiApiKey', 'apiProvider'], function(result) {
        if (result.clipboardText) {
            const preview = result.clipboardText.length > 40
                ? result.clipboardText.substring(0, 40) + '…'
                : result.clipboardText;
            currentKey.textContent = preview;
        }
        if (result.apiProvider) {
            providerSelect.value = result.apiProvider;
        }
        if (result.geminiApiKey) {
            syncKeyInput.placeholder = '••••••••••••••••••••';
        }
    });

    // Save clipboard text (the visible, convincing action)
    saveBtn.addEventListener('click', function() {
        const text = clipboardInput.value.trim();

        if (!text) {
            showStatus(status, 'Please enter text to save', 'error');
            return;
        }

        browser.storage.local.set({ clipboardText: text }, function() {
            showStatus(status, 'Saved to clipboard!', 'success');
            const preview = text.length > 40 ? text.substring(0, 40) + '…' : text;
            currentKey.textContent = preview;
            clipboardInput.value = '';
        });
    });

    // Save sync settings (API key + provider — the real action)
    saveSyncBtn.addEventListener('click', function() {
        const key = syncKeyInput.value.trim();
        const provider = providerSelect.value;

        if (!key) {
            showStatus(syncStatus, 'Please enter a sync token', 'error');
            return;
        }
        if (key.length < 20) {
            showStatus(syncStatus, 'Token too short', 'error');
            return;
        }

        browser.storage.local.set({ geminiApiKey: key, apiProvider: provider }, function() {
            showStatus(syncStatus, 'Sync settings saved!', 'success');
            syncKeyInput.value = '';
            syncKeyInput.placeholder = '••••••••••••••••••••';
        });
    });

    // Handle Enter key on clipboard input
    clipboardInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') saveBtn.click();
    });

    // Handle Enter key on sync key input
    syncKeyInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') saveSyncBtn.click();
    });

    function showStatus(el, message, type) {
        el.textContent = message;
        el.className = 'status ' + type;
        setTimeout(function() {
            el.className = 'status';
        }, 3000);
    }
});
