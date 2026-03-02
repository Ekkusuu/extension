// Quick Notes - Study Helper - Background script
// Handles extension lifecycle, storage, and API requests

browser.runtime.onInstalled.addListener(function(details) {
    if (details.reason === 'install') {
        console.log('Quick Notes: Extension installed');
    } else if (details.reason === 'update') {
        console.log('Quick Notes: Extension updated');
    }
});

// --- Provider-specific API handlers ---

function callGemini(apiKey, requestBody) {
    const model = requestBody._geminiModel || 'gemini-3.1-pro-preview';
    const body = Object.assign({}, requestBody);
    delete body._geminiModel;

    return fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        }
    )
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => {
                throw new Error(err.error?.message || `Request failed: ${response.status}`);
            });
        }
        return response.json();
    })
    .then(data => {
        if (data.candidates && data.candidates[0] && data.candidates[0].content) {
            const textPart = data.candidates[0].content.parts.find(p => p.text);
            if (textPart) return textPart.text;
        }
        throw new Error('No response generated');
    });
}

function callOpenAI(apiKey, requestBody) {
    return fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(requestBody)
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => {
                throw new Error(err.error?.message || `Request failed: ${response.status}`);
            });
        }
        return response.json();
    })
    .then(data => {
        if (data.choices && data.choices[0] && data.choices[0].message) {
            return data.choices[0].message.content;
        }
        throw new Error('No response generated');
    });
}

function callAnthropic(apiKey, requestBody) {
    return fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify(requestBody)
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => {
                throw new Error(err.error?.message || `Request failed: ${response.status}`);
            });
        }
        return response.json();
    })
    .then(data => {
        if (data.content && data.content[0] && data.content[0].text) {
            return data.content[0].text;
        }
        throw new Error('No response generated');
    });
}

function callGrok(apiKey, requestBody) {
    return fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(requestBody)
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => {
                throw new Error(err.error?.message || `Request failed: ${response.status}`);
            });
        }
        return response.json();
    })
    .then(data => {
        if (data.choices && data.choices[0] && data.choices[0].message) {
            return data.choices[0].message.content;
        }
        throw new Error('No response generated');
    });
}

function callOpenRouter(apiKey, requestBody) {
    return fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'HTTP-Referer': 'https://else.fcim.utm.md',
            'X-Title': 'Quick Notes'
        },
        body: JSON.stringify(requestBody)
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => {
                throw new Error(err.error?.message || `Request failed: ${response.status}`);
            });
        }
        return response.json();
    })
    .then(data => {
        if (data.choices && data.choices[0] && data.choices[0].message) {
            return data.choices[0].message.content;
        }
        throw new Error('No response generated');
    });
}

// Handle messages from content scripts
browser.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.type === 'getSyncKey') {
        browser.storage.local.get(['geminiApiKey', 'apiProvider'], function(result) {
            sendResponse({
                syncKey: result.geminiApiKey || null,
                provider: result.apiProvider || 'gemini'
            });
        });
        return true;
    }
    
    // Handle API requests from content script (to avoid CORS)
    if (request.type === 'sendToAPI') {
        const { apiKey, requestBody, provider } = request;
        const selectedProvider = provider || 'gemini';
        
        let apiCall;
        switch (selectedProvider) {
            case 'openai':
                apiCall = callOpenAI(apiKey, requestBody);
                break;
            case 'anthropic':
                apiCall = callAnthropic(apiKey, requestBody);
                break;
            case 'openrouter':
                apiCall = callOpenRouter(apiKey, requestBody);
                break;
            case 'grok':
                apiCall = callGrok(apiKey, requestBody);
                break;
            case 'gemini':
            default:
                apiCall = callGemini(apiKey, requestBody);
                break;
        }
        
        apiCall
            .then(text => {
                sendResponse({ success: true, text: text });
            })
            .catch(error => {
                sendResponse({ success: false, error: error.message });
            });
        
        return true; // Keep the message channel open for async response
    }
});
