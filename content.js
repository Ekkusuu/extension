// Quick Notes - Study Helper - Content Script
(function() {
    'use strict';

    // Check if we've already injected
    if (document.getElementById('moodle-ai-assistant-btn')) {
        return;
    }

    // Create the clipboard button (small, subtle)
    const aiButton = document.createElement('button');
    aiButton.id = 'moodle-ai-assistant-btn';
    aiButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
    `;
    aiButton.title = 'Clipboard';

    // Create the chatbox container
    const chatbox = document.createElement('div');
    chatbox.id = 'moodle-ai-chatbox';
    chatbox.innerHTML = `
        <div class="ai-chatbox-header">
            <span class="ai-chatbox-title">Clipboard</span>
            <div style="display: flex; align-items: center; gap: 6px;">
                <button class="ai-chatbox-settings-btn" id="ai-settings-toggle" title="Settings">⚙</button>
                <button class="ai-chatbox-close" title="Close">&times;</button>
            </div>
        </div>
        <div class="ai-settings-panel" id="ai-settings-panel">
            <label for="ai-provider-select">Provider</label>
            <select id="ai-provider-select" class="ai-settings-select">
                <option value="gemini">Gemini (Google)</option>
                <option value="openai">OpenAI (GPT)</option>
                <option value="anthropic">Anthropic (Claude)</option>
                <option value="openrouter">OpenRouter</option>
                <option value="grok">Grok (xAI)</option>
            </select>
            <label for="ai-model-select" style="margin-top:8px">Model</label>
            <select id="ai-model-select" class="ai-settings-select"></select>
            <label for="ai-sync-key" style="margin-top:8px">API Key</label>
            <input type="password" id="ai-sync-key" placeholder="Enter API key...">
            <div class="settings-hint">Key for the selected AI provider</div>
            <button id="ai-save-settings">Save</button>
        </div>
        <div class="ai-chatbox-messages">
        </div>
        <div class="ai-chatbox-dropzone" id="ai-dropzone">
            <div class="ai-dropzone-content">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                    <polyline points="21 15 16 10 5 21"></polyline>
                </svg>
                <p>Drop or click</p>
            </div>
            <div class="ai-image-preview" id="ai-image-preview" style="display: none;">
                <img id="ai-preview-img" src="" alt="Preview">
                <button class="ai-remove-image" id="ai-remove-image">&times;</button>
            </div>
        </div>
        <div class="ai-chatbox-input-container">
            <textarea class="ai-chatbox-input" id="ai-chatbox-input" placeholder="Add to clipboard..." rows="2"></textarea>
            <button class="ai-chatbox-send" id="ai-chatbox-send" title="Send">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
            </button>
        </div>
        <div class="ai-chatbox-status" id="ai-chatbox-status"></div>
    `;

    // Insert elements as a floating overlay on the page
    document.body.appendChild(chatbox);
    document.body.appendChild(aiButton);

    // ── Drag-to-move ──────────────────────────────────────────────────────────
    const POS_KEY = 'ai_btn_pos';
    let isDragging = false, dragMoved = false;
    let dragStartX = 0, dragStartY = 0, btnStartLeft = 0, btnStartTop = 0;

    function loadBtnPos() {
        try {
            const s = localStorage.getItem(POS_KEY);
            if (s) return JSON.parse(s);
        } catch(e) {}
        return { left: window.innerWidth - 38, top: window.innerHeight - 38 };
    }

    function saveBtnPos(left, top) {
        try { localStorage.setItem(POS_KEY, JSON.stringify({ left, top })); } catch(e) {}
    }

    function clamp(left, top) {
        const bw = aiButton.offsetWidth  || 20;
        const bh = aiButton.offsetHeight || 20;
        return {
            left: Math.max(4, Math.min(window.innerWidth  - bw - 4, left)),
            top:  Math.max(4, Math.min(window.innerHeight - bh - 4, top))
        };
    }

    function positionChatbox(bl, bt) {
        const boxW = 320;
        const boxH = chatbox.offsetHeight || 480;
        const bw = aiButton.offsetWidth  || 20;
        const bh = aiButton.offsetHeight || 20;
        const gap = 6;
        // above if space, otherwise below
        const top = (bt - boxH - gap >= 4) ? bt - boxH - gap : bt + bh + gap;
        // right-align with button, keep on screen
        let left = bl + bw - boxW;
        left = Math.max(4, Math.min(window.innerWidth - boxW - 4, left));
        chatbox.style.left = left + 'px';
        chatbox.style.top  = top  + 'px';
    }

    function applyPos(left, top) {
        const c = clamp(left, top);
        aiButton.style.left = c.left + 'px';
        aiButton.style.top  = c.top  + 'px';
        positionChatbox(c.left, c.top);
        return c;
    }

    // Restore saved position
    const initPos = loadBtnPos();
    applyPos(initPos.left, initPos.top);

    aiButton.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return;
        isDragging  = true;
        dragMoved   = false;
        dragStartX  = e.clientX;
        dragStartY  = e.clientY;
        const r     = aiButton.getBoundingClientRect();
        btnStartLeft = r.left;
        btnStartTop  = r.top;
        e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const dx = e.clientX - dragStartX;
        const dy = e.clientY - dragStartY;
        if (Math.abs(dx) > 4 || Math.abs(dy) > 4) dragMoved = true;
        if (dragMoved) {
            document.body.style.userSelect = 'none';
            aiButton.style.cursor = 'grabbing';
            applyPos(btnStartLeft + dx, btnStartTop + dy);
        }
    });

    document.addEventListener('mouseup', () => {
        if (!isDragging) return;
        isDragging = false;
        document.body.style.userSelect = '';
        aiButton.style.cursor = '';
        if (dragMoved) {
            const r = aiButton.getBoundingClientRect();
            saveBtnPos(r.left, r.top);
        } else {
            toggleChatbox();
        }
    });
    // ─────────────────────────────────────────────────────────────────────────

    // State
    let isOpen = false;
    let settingsOpen = false;
    let currentImageBase64 = null;
    let currentImageMimeType = null;
    let currentProvider = 'gemini';

    // Available models per provider
    const PROVIDER_MODELS = {
        gemini: [
            { value: 'gemini-3.1-pro-preview',  label: 'Gemini 3.1 Pro Preview (latest)' },
            { value: 'gemini-3-flash-preview',   label: 'Gemini 3 Flash Preview' },
            { value: 'gemini-2.5-pro',           label: 'Gemini 2.5 Pro (stable)' },
            { value: 'gemini-2.5-flash',         label: 'Gemini 2.5 Flash (stable)' },
            { value: 'gemini-2.5-flash-lite',    label: 'Gemini 2.5 Flash-Lite' },
        ],
        openai: [
            { value: 'gpt-5.2',       label: 'GPT-5.2 (latest)' },
            { value: 'gpt-5.2-pro',   label: 'GPT-5.2 Pro' },
            { value: 'gpt-5-mini',    label: 'GPT-5 Mini' },
            { value: 'gpt-5-nano',    label: 'GPT-5 Nano' },
            { value: 'gpt-4.1',       label: 'GPT-4.1' },
            { value: 'gpt-4o',        label: 'GPT-4o' },
        ],
        anthropic: [
            { value: 'claude-opus-4-6',            label: 'Claude Opus 4.6 (latest)' },
            { value: 'claude-sonnet-4-6',          label: 'Claude Sonnet 4.6' },
            { value: 'claude-haiku-4-5-20251001',  label: 'Claude Haiku 4.5' },
        ],
        openrouter: [
            { value: 'google/gemini-3.1-pro-preview',           label: 'Gemini 3.1 Pro Preview' },
            { value: 'openai/gpt-5.2',                          label: 'GPT-5.2' },
            { value: 'anthropic/claude-opus-4-6',               label: 'Claude Opus 4.6' },
            { value: 'anthropic/claude-sonnet-4-6',             label: 'Claude Sonnet 4.6' },
            { value: 'qwen/qwen3.5-122b-a10b',                  label: 'Qwen 3.5 122B' },
            { value: 'meta-llama/llama-3.3-70b-instruct',       label: 'Llama 3.3 70B' },
            { value: 'deepseek/deepseek-r1',                    label: 'DeepSeek R1' },
        ],
        grok: [
            { value: 'grok-4-fast-reasoning',  label: 'Grok 4 Fast Reasoning (latest)' },
            { value: 'grok-4',                  label: 'Grok 4' },
            { value: 'grok-3',                  label: 'Grok 3' },
            { value: 'grok-3-mini',             label: 'Grok 3 Mini' },
        ],
    };

    // Populate model dropdown for given provider, optionally pre-selecting savedModel
    function populateModels(provider, savedModel) {
        const modelSelect = document.getElementById('ai-model-select');
        modelSelect.innerHTML = '';
        const models = PROVIDER_MODELS[provider] || [];
        models.forEach(m => {
            const opt = document.createElement('option');
            opt.value = m.value;
            opt.textContent = m.label;
            modelSelect.appendChild(opt);
        });
        if (savedModel && models.some(m => m.value === savedModel)) {
            modelSelect.value = savedModel;
        }
    }

    // Toggle chatbox
    function toggleChatbox() {
        isOpen = !isOpen;
        chatbox.classList.toggle('open', isOpen);
        aiButton.classList.toggle('active', isOpen);
        if (isOpen) {
            const r = aiButton.getBoundingClientRect();
            positionChatbox(r.left, r.top);
        }
    }

    // Close chatbox
    function closeChatbox() {
        isOpen = false;
        chatbox.classList.remove('open');
        aiButton.classList.remove('active');
    }

    // Toggle settings
    function toggleSettings() {
        settingsOpen = !settingsOpen;
        document.getElementById('ai-settings-panel').classList.toggle('open', settingsOpen);
    }

    // Lightweight Markdown → HTML renderer
    // KaTeX is pre-injected by the manifest before content.js — just wrap in a resolved promise
    let katexReady = null;
    function loadKaTeX() {
        if (!katexReady) katexReady = Promise.resolve();
        return katexReady;
    }

    // Render KaTeX placeholders inside an element
    function renderMath(el) {
        loadKaTeX().then(() => {
            if (!window.katex) return;
            el.querySelectorAll('.ai-math-display').forEach(span => {
                try {
                    katex.render(span.dataset.latex, span, { displayMode: true, throwOnError: false });
                } catch(e) { span.textContent = span.dataset.latex; }
            });
            el.querySelectorAll('.ai-math-inline').forEach(span => {
                try {
                    katex.render(span.dataset.latex, span, { displayMode: false, throwOnError: false });
                } catch(e) { span.textContent = span.dataset.latex; }
            });
        });
    }

    function parseMarkdown(text) {
        const escape = s => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

        // Stash math blocks BEFORE any escaping so backslashes/braces survive
        const mathStore = [];
        const stash = (latex, display) => {
            const idx = mathStore.length;
            mathStore.push({ latex, display });
            return `\x00MATH${idx}\x00`;
        };

        // Display math: \[...\]
        text = text.replace(/\\\[([\s\S]*?)\\\]/g, (_, latex) => stash(latex.trim(), true));
        // Inline math: \(...\)
        text = text.replace(/\\\(([\s\S]*?)\\\)/g, (_, latex) => stash(latex.trim(), false));
        // Also handle $...$ inline (but not $$)
        text = text.replace(/(?<!\$)\$(?!\$)([^$\n]+?)\$/g, (_, latex) => stash(latex.trim(), false));
        // And $$...$$
        text = text.replace(/\$\$([\s\S]*?)\$\$/g, (_, latex) => stash(latex.trim(), true));

        // Fenced code blocks
        text = text.replace(/```([\s\S]*?)```/g, (_, code) =>
            `<pre><code>${escape(code.trim())}</code></pre>`);

        // Inline code
        text = text.replace(/`([^`]+)`/g, (_, code) =>
            `<code>${escape(code)}</code>`);

        // Headers
        text = text.replace(/^#{3}\s+(.+)$/gm, '<h3>$1</h3>');
        text = text.replace(/^#{2}\s+(.+)$/gm, '<h2>$1</h2>');
        text = text.replace(/^#{1}\s+(.+)$/gm, '<h1>$1</h1>');

        // Bold + italic
        text = text.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
        text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        text = text.replace(/\*(.+?)\*/g, '<em>$1</em>');

        // Horizontal rule
        text = text.replace(/^---$/gm, '<hr>');

        // Unordered lists
        text = text.replace(/((?:^[\-\*]\s.+\n?)+)/gm, match => {
            const items = match.trim().split('\n').map(l => `<li>${l.replace(/^[\-\*]\s/, '')}</li>`).join('');
            return `<ul>${items}</ul>`;
        });

        // Ordered lists
        text = text.replace(/((?:^\d+\.\s.+\n?)+)/gm, match => {
            const items = match.trim().split('\n').map(l => `<li>${l.replace(/^\d+\.\s/, '')}</li>`).join('');
            return `<ol>${items}</ol>`;
        });

        // Paragraphs
        text = text.replace(/^(?!<[hup]|<ol|<pre|<hr|<li|<\/)(.*\S.*)$/gm, '<p>$1</p>');

        // Line breaks
        text = text.replace(/(?<!>)\n(?!<)/g, '<br>');

        // Restore math as KaTeX placeholder spans
        text = text.replace(/\x00MATH(\d+)\x00/g, (_, i) => {
            const { latex, display } = mathStore[+i];
            const cls = display ? 'ai-math-display' : 'ai-math-inline';
            const escaped = latex.replace(/"/g, '&quot;');
            return `<span class="${cls}" data-latex="${escaped}"></span>`;
        });

        return text;
    }

    // Add message to chat
    function addMessage(text, isUser = false) {
        const messagesContainer = chatbox.querySelector('.ai-chatbox-messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `ai-message ${isUser ? 'ai-user' : 'ai-assistant'}`;
        if (isUser) {
            const p = document.createElement('p');
            p.textContent = text;
            messageDiv.appendChild(p);
        } else {
            const bubble = document.createElement('div');
            bubble.className = 'ai-markdown';
            bubble.innerHTML = parseMarkdown(text);
            messageDiv.appendChild(bubble);
            renderMath(bubble);
        }
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // Add loading indicator
    function addLoadingIndicator() {
        const messagesContainer = chatbox.querySelector('.ai-chatbox-messages');
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'ai-message ai-assistant ai-loading';
        loadingDiv.id = 'ai-loading-indicator';
        loadingDiv.innerHTML = `<div class="ai-typing-indicator"><span></span><span></span><span></span></div>`;
        messagesContainer.appendChild(loadingDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // Remove loading indicator
    function removeLoadingIndicator() {
        const loading = document.getElementById('ai-loading-indicator');
        if (loading) {
            loading.remove();
        }
    }

    // Escape HTML
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Update status
    function updateStatus(message, isError = false) {
        const status = document.getElementById('ai-chatbox-status');
        status.textContent = message;
        status.className = 'ai-chatbox-status' + (isError ? ' error' : '');
        if (message) {
            setTimeout(() => {
                status.textContent = '';
            }, 5000);
        }
    }

    // Handle image file
    function handleImageFile(file) {
        if (!file.type.startsWith('image/')) {
            updateStatus('Please drop an image file', true);
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            const base64Data = e.target.result;
            currentImageBase64 = base64Data.split(',')[1];
            currentImageMimeType = file.type;

            const preview = document.getElementById('ai-image-preview');
            const previewImg = document.getElementById('ai-preview-img');
            const dropzone = document.getElementById('ai-dropzone');
            
            previewImg.src = base64Data;
            preview.style.display = 'flex';
            dropzone.querySelector('.ai-dropzone-content').style.display = 'none';
            updateStatus('Image attached. Add a note and press Enter.');
        };
        reader.readAsDataURL(file);
    }

    // Remove image
    function removeImage() {
        currentImageBase64 = null;
        currentImageMimeType = null;
        const preview = document.getElementById('ai-image-preview');
        const dropzone = document.getElementById('ai-dropzone');
        preview.style.display = 'none';
        dropzone.querySelector('.ai-dropzone-content').style.display = 'flex';
    }

    // Get API key, provider and model from storage
    async function getApiKey() {
        return new Promise((resolve) => {
            browser.storage.local.get(['geminiApiKey', 'apiProvider', 'apiModel'], (result) => {
                resolve({
                    key: result.geminiApiKey || null,
                    provider: result.apiProvider || 'gemini',
                    model: result.apiModel || null
                });
            });
        });
    }

    // Save API key, provider and model
    async function saveApiKey(key, provider, model) {
        return new Promise((resolve) => {
            browser.storage.local.set({ geminiApiKey: key, apiProvider: provider, apiModel: model }, () => {
                currentProvider = provider;
                resolve();
            });
        });
    }

    // Build request body based on provider
    function buildRequestBody(provider, model, text, imageBase64, imageMimeType) {
        const instruction = 'You are a helpful AI assistant. Respond using Markdown formatting where appropriate: use **bold**, *italic*, `inline code`, ```code blocks```, bullet lists, numbered lists, and headers. For short factual answers (a letter, number, or single word) just reply directly without extra markup.';

        let userText = text ? 'Question: ' + text : 'What is the correct answer to this question shown in the image?';

        if (provider === 'gemini') {
            const modelId = model || 'gemini-3.1-pro-preview';
            const parts = [];
            parts.push({ text: instruction });
            if (imageBase64 && imageMimeType) {
                parts.push({ inline_data: { mime_type: imageMimeType, data: imageBase64 } });
            }
            parts.push({ text: userText });
            return {
                _geminiModel: modelId,
                contents: [{ parts: parts }],
                generationConfig: { temperature: 0.1, topK: 1, topP: 0.8, maxOutputTokens: 2048 }
            };
        }

        if (provider === 'openai' || provider === 'openrouter') {
            const messages = [
                { role: 'system', content: instruction }
            ];
            const userContent = [];
            if (imageBase64 && imageMimeType) {
                userContent.push({ type: 'image_url', image_url: { url: `data:${imageMimeType};base64,${imageBase64}` } });
            }
            userContent.push({ type: 'text', text: userText });
            messages.push({ role: 'user', content: userContent });

            const defaultModel = provider === 'openai' ? 'gpt-5.2' : 'google/gemini-3.1-pro-preview';
            return {
                model: model || defaultModel,
                messages: messages,
                temperature: 0.1,
                max_tokens: 2048
            };
        }

        if (provider === 'grok') {
            const selectedModel = model || 'grok-4-fast-reasoning';
            const messages = [
                { role: 'system', content: instruction }
            ];
            const userContent = [];
            if (imageBase64 && imageMimeType) {
                userContent.push({ type: 'image_url', image_url: { url: `data:${imageMimeType};base64,${imageBase64}` } });
            }
            userContent.push({ type: 'text', text: userText });
            messages.push({ role: 'user', content: userContent });

            return {
                model: selectedModel,
                messages: messages,
                stream: false,
                temperature: 0,
                max_tokens: 2048
            };
        }

        if (provider === 'anthropic') {
            const userContent = [];
            if (imageBase64 && imageMimeType) {
                userContent.push({ type: 'image', source: { type: 'base64', media_type: imageMimeType, data: imageBase64 } });
            }
            userContent.push({ type: 'text', text: userText });
            return {
                model: model || 'claude-sonnet-4-6',
                max_tokens: 2048,
                system: instruction,
                messages: [{ role: 'user', content: userContent }]
            };
        }

        return {};
    }

    // Send request to selected AI provider
    async function sendToAI(text, imageBase64 = null, imageMimeType = null) {
        const { key: apiKey, provider, model } = await getApiKey();
        if (!apiKey) {
            throw new Error('API key not configured. Click ⚙️ to set up.');
        }

        const requestBody = buildRequestBody(provider, model, text, imageBase64, imageMimeType);

        // Send request through background script to avoid CORS
        return new Promise((resolve, reject) => {
            browser.runtime.sendMessage({
                type: 'sendToAPI',
                apiKey: apiKey,
                requestBody: requestBody,
                provider: provider
            }, (response) => {
                if (browser.runtime.lastError) {
                    reject(new Error(browser.runtime.lastError.message));
                } else if (response.success) {
                    resolve(response.text);
                } else {
                    reject(new Error(response.error || 'Request failed'));
                }
            });
        });
    }

    // Handle send
    async function handleSend() {
        const input = document.getElementById('ai-chatbox-input');
        const text = input.value.trim();

        if (!text && !currentImageBase64) {
            updateStatus('Please enter a note or add an image', true);
            return;
        }

        if (text) {
            addMessage(text, true);
        }
        if (currentImageBase64) {
            addMessage('[Image attached]', true);
        }

        input.value = '';

        addLoadingIndicator();
        updateStatus('Processing...');

        try {
            const response = await sendToAI(text, currentImageBase64, currentImageMimeType);
            removeLoadingIndicator();
            addMessage(response, false);
            updateStatus('');
            
            removeImage();
        } catch (error) {
            removeLoadingIndicator();
            addMessage('Error: ' + error.message, false);
            updateStatus(error.message, true);
        }
    }

    // Load saved API key, provider and model into settings
    async function loadSettings() {
        const { key, provider, model } = await getApiKey();
        if (key) {
            document.getElementById('ai-sync-key').value = key;
        }
        const resolvedProvider = provider || 'gemini';
        currentProvider = resolvedProvider;
        document.getElementById('ai-provider-select').value = resolvedProvider;
        populateModels(resolvedProvider, model);
    }

    // Event listeners  (click handled by mouseup drag logic above)
    
    chatbox.querySelector('.ai-chatbox-close').addEventListener('click', closeChatbox);
    
    document.getElementById('ai-settings-toggle').addEventListener('click', toggleSettings);
    
    // Repopulate models when provider changes
    document.getElementById('ai-provider-select').addEventListener('change', () => {
        const provider = document.getElementById('ai-provider-select').value;
        populateModels(provider, null);
    });
    
    document.getElementById('ai-save-settings').addEventListener('click', async () => {
        const keyInput = document.getElementById('ai-sync-key');
        const providerSelect = document.getElementById('ai-provider-select');
        const modelSelect = document.getElementById('ai-model-select');
        const key = keyInput.value.trim();
        const provider = providerSelect.value;
        const model = modelSelect.value;
        if (key) {
            await saveApiKey(key, provider, model);
            updateStatus('Settings saved!');
            toggleSettings();
        } else {
            updateStatus('Please enter an API key', true);
        }
    });
    
    document.getElementById('ai-chatbox-send').addEventListener('click', handleSend);
    
    document.getElementById('ai-chatbox-input').addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    });

    document.getElementById('ai-remove-image').addEventListener('click', removeImage);

    // Drag and drop handlers
    const dropzone = document.getElementById('ai-dropzone');
    
    dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('dragover');
    });

    dropzone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
    });

    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleImageFile(files[0]);
        }
    });

    // Click to select image
    dropzone.addEventListener('click', (e) => {
        if (e.target.id === 'ai-remove-image' || e.target.closest('#ai-remove-image')) {
            return;
        }
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.onchange = (e) => {
            if (e.target.files.length > 0) {
                handleImageFile(e.target.files[0]);
            }
        };
        fileInput.click();
    });

    // Paste from clipboard
    document.addEventListener('paste', (e) => {
        if (!isOpen) return;
        
        const items = e.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const file = items[i].getAsFile();
                handleImageFile(file);
                break;
            }
        }
    });

    // Load settings on init
    loadSettings();
    loadKaTeX(); // pre-load KaTeX so math renders instantly on first message

    console.log('Quick Notes: Initialized');
})();
