import React, { useEffect, useRef, useState } from 'react';

function ChatWindow({ chatLog = [] }) {
    const bottomRef = useRef(null);
    const [displayedLog, setDisplayedLog] = useState([]);

    useEffect(() => {
        const lastEntry = chatLog[chatLog.length - 1];


        if (lastEntry && lastEntry.role === 'bot') {
            const tempLog = [...chatLog.slice(0, -1)];
            let i = 0;
            const fullText = lastEntry.content;

            const animate = () => {
                const interval = setInterval(() => {
                    i++;
                    const animatedBotMessage = {
                        ...lastEntry,
                        content: fullText.slice(0, i),
                    };
                    setDisplayedLog([...tempLog, animatedBotMessage]);

                    if (i >= fullText.length) {
                        clearInterval(interval);
                    }
                }, 15);
            };

            animate();
        } else {

            setDisplayedLog(chatLog);
        }

        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatLog]);

    return (
        <div className="gpt-log">
            {displayedLog.map((entry, i) => (
                <div key={i} className={`message ${entry.role}`}>
                    <img
                        src={entry.role === 'user' ? '/user-avatar.jpg' : '/gpt-avatar.png'}
                        alt={entry.role}
                        className="avatar"
                        onError={(e) => (e.target.src = '/default-avatar.png')}
                    />
                    <p>
                        <strong>{entry.role === 'user' ? 'You' : 'GPT'}:</strong>{' '}
                        <span className={i === displayedLog.length - 1 && entry.role === 'bot' ? 'typing-text' : ''}>
                            {entry.content}
                        </span>
                    </p>
                </div>
            ))}
            <div ref={bottomRef} />
        </div>
    );
}

export default ChatWindow;
