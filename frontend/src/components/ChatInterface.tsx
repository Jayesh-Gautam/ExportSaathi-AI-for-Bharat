import { useState, useRef, useEffect } from 'react';
import type { ChatMessage, QueryContext } from '../types';
import { sendChatMessage } from '../services/api';

const generateId = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

interface ChatInterfaceProps {
    reportId: string;
    productType: string;
    destinationCountry: string;
}

export default function ChatInterface({ reportId, productType, destinationCountry }: ChatInterfaceProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [sessionId] = useState(() => generateId());
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const question = input.trim();
        setInput('');

        // Add user message immediately
        const userMsg: ChatMessage = {
            message_id: generateId(),
            role: 'user',
            content: question,
            timestamp: new Date().toISOString(),
        };
        setMessages(prev => [...prev, userMsg]);
        setIsLoading(true);

        try {
            const context: QueryContext = {
                report_id: reportId,
                product_type: productType,
                destination_country: destinationCountry,
            };

            const response = await sendChatMessage({
                session_id: sessionId,
                question,
                context,
            });

            const assistantMsg: ChatMessage = {
                message_id: response.message_id,
                role: 'assistant',
                content: response.answer,
                sources: response.sources,
                timestamp: response.timestamp,
            };
            setMessages(prev => [...prev, assistantMsg]);
        } catch {
            const errorMsg: ChatMessage = {
                message_id: generateId(),
                role: 'assistant',
                content: 'Sorry, I encountered an error. Please try again.',
                timestamp: new Date().toISOString(),
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsLoading(false);
            inputRef.current?.focus();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const suggestedQuestions = [
        "What certifications do I need first?",
        "How much will the entire export process cost?",
        "What documents should I prepare?",
        "How do I apply for GST LUT?",
    ];

    return (
        <div className="glass-card animate-fade-in" style={{
            display: 'flex', flexDirection: 'column', height: '500px', overflow: 'hidden'
        }}>
            {/* Header */}
            <div style={{
                padding: '16px 20px', borderBottom: '1px solid var(--color-border-light)',
                display: 'flex', alignItems: 'center', gap: '10px'
            }}>
                <div style={{
                    width: '32px', height: '32px', borderRadius: '10px',
                    background: 'linear-gradient(135deg, var(--color-accent), var(--color-primary))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px'
                }}>
                    💬
                </div>
                <div>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>Ask Follow-up Questions</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                        AI assistant with context of your export query
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div style={{
                flex: 1, overflowY: 'auto', padding: '16px 20px',
                display: 'flex', flexDirection: 'column', gap: '12px'
            }}>
                {messages.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '30px 0' }}>
                        <div style={{ fontSize: '2rem', marginBottom: '12px' }}>🤖</div>
                        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginBottom: '16px' }}>
                            Ask me anything about your export requirements!
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
                            {suggestedQuestions.map((q, i) => (
                                <button
                                    key={i}
                                    onClick={() => { setInput(q); inputRef.current?.focus(); }}
                                    style={{
                                        background: 'var(--color-bg-secondary)',
                                        border: '1px solid var(--color-border-light)',
                                        borderRadius: '20px', padding: '6px 14px',
                                        color: 'var(--color-text-secondary)', fontSize: '0.78rem',
                                        cursor: 'pointer', transition: 'all 0.2s ease',
                                        fontFamily: 'inherit'
                                    }}
                                    onMouseEnter={e => {
                                        (e.target as HTMLElement).style.borderColor = 'var(--color-primary)';
                                        (e.target as HTMLElement).style.color = 'var(--color-primary-light)';
                                    }}
                                    onMouseLeave={e => {
                                        (e.target as HTMLElement).style.borderColor = 'var(--color-border-light)';
                                        (e.target as HTMLElement).style.color = 'var(--color-text-secondary)';
                                    }}
                                >
                                    {q}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {messages.map(msg => (
                    <div
                        key={msg.message_id}
                        style={{
                            display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                        }}
                    >
                        <div style={{
                            maxWidth: '80%', padding: '10px 14px', borderRadius: '14px',
                            background: msg.role === 'user'
                                ? 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))'
                                : 'var(--color-bg-secondary)',
                            color: msg.role === 'user' ? 'white' : 'var(--color-text)',
                            fontSize: '0.88rem', lineHeight: 1.5,
                            borderBottomRightRadius: msg.role === 'user' ? '4px' : '14px',
                            borderBottomLeftRadius: msg.role === 'assistant' ? '4px' : '14px',
                            whiteSpace: 'pre-wrap'
                        }}>
                            {msg.content}
                        </div>
                    </div>
                ))}

                {isLoading && (
                    <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                        <div style={{
                            padding: '12px 16px', borderRadius: '14px', borderBottomLeftRadius: '4px',
                            background: 'var(--color-bg-secondary)', display: 'flex', gap: '6px',
                            alignItems: 'center'
                        }}>
                            <div style={{
                                width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-primary-light)',
                                animation: 'pulse-glow 1.2s ease-in-out infinite'
                            }} />
                            <div style={{
                                width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-primary-light)',
                                animation: 'pulse-glow 1.2s ease-in-out 0.2s infinite'
                            }} />
                            <div style={{
                                width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-primary-light)',
                                animation: 'pulse-glow 1.2s ease-in-out 0.4s infinite'
                            }} />
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div style={{
                padding: '12px 16px', borderTop: '1px solid var(--color-border-light)',
                display: 'flex', gap: '10px', alignItems: 'center'
            }}>
                <input
                    ref={inputRef}
                    className="input-field"
                    type="text"
                    placeholder="Ask about certifications, costs, documents, logistics..."
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isLoading}
                    style={{ flex: 1, borderRadius: '24px', padding: '10px 18px' }}
                />
                <button
                    onClick={handleSend}
                    disabled={!input.trim() || isLoading}
                    style={{
                        width: '40px', height: '40px', borderRadius: '50%',
                        background: input.trim() ? 'linear-gradient(135deg, var(--color-primary), var(--color-accent))' : 'var(--color-bg-secondary)',
                        border: 'none', cursor: input.trim() ? 'pointer' : 'not-allowed',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1rem', color: 'white', transition: 'all 0.2s ease',
                        flexShrink: 0
                    }}
                >
                    ↑
                </button>
            </div>
        </div>
    );
}
