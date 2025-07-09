import React, { useState } from 'react';

const GPTAssistant = ({ apiKey, onResponse, onFullResponse, model = 'gpt-3.5-turbo' }) => {
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSend = async () => {
        if (!prompt.trim()) return;

        setIsLoading(true);

        try {
            const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: model, // ← use the passed-in model
                    messages: [{ role: 'user', content: prompt }],
                    max_tokens: 500
                }),
            });

            const data = await res.json();
            console.log("GPT API Response:", data);

            if (data && data.choices && data.choices.length > 0) {
                const reply = data.choices[0].message.content;

                if (onResponse) {
                    onResponse({ role: 'user', content: prompt });
                }

                if (onFullResponse) {
                    onFullResponse(reply); // This sends the full response string for animation
                }
            } else {
                if (onResponse) {
                    onResponse({ role: 'user', content: prompt });
                }
                if (onFullResponse) {
                    onFullResponse('⚠️ No valid response from GPT.');
                }
            }

        } catch (err) {
            console.error('GPT fetch error:', err);
            if (onResponse) {
                onResponse({ role: 'user', content: prompt });
            }
            if (onFullResponse) {
                onFullResponse('❌ Error contacting GPT API.');
            }
        } finally {
            setIsLoading(false);
            setPrompt('');
        }
    };

    return (
        <div className="gpt-input-row">
            <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ask GPT something..."
            />
            <button onClick={handleSend} disabled={isLoading}>
                {isLoading ? 'Loading...' : 'Send'}
            </button>
        </div>
    );
};

export default GPTAssistant;
