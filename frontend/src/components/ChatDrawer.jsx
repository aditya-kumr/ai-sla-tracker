import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User, CheckCircle2, AlertTriangle } from 'lucide-react';
import './ChatDrawer.css';

export default function ChatDrawer({ isOpen, onClose }) {
  const [messages, setMessages] = useState([
    {
      role: 'model',
      text: 'Hello! I am your AI SLA Assistant. How can I help you manage tickets today?',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingConfirmation, setPendingConfirmation] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  if (!isOpen) return null;

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const response = await fetch('http://localhost:3001/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          history: messages.map((m) => ({
            role: m.role,
            parts: m.text || '',
          })),
        }),
      });

      const data = await response.json();

      if (data.requiresConfirmation) {
        setPendingConfirmation(data.toolCall);
        setMessages((prev) => [
          ...prev,
          {
            role: 'model',
            text: data.message,
            isConfirmation: true,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: 'model', text: data.text || 'No response generated.' },
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'model', text: 'Error connecting to AI Agent service.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAction = async (confirmed) => {
    if (!confirmed || !pendingConfirmation) {
      setPendingConfirmation(null);
      setMessages((prev) => [
        ...prev,
        { role: 'model', text: 'Action cancelled by user.' },
      ]);
      return;
    }

    const toolCall = pendingConfirmation;
    setPendingConfirmation(null);
    setLoading(true);

    try {
      const response = await fetch('http://localhost:3001/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmedToolCall: toolCall }),
      });

      const data = await response.json();
      setMessages((prev) => [
        ...prev,
        { role: 'model', text: data.text || 'Action executed successfully.' },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'model', text: 'Failed to execute confirmed action.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chat-overlay">
      <div className="chat-drawer">
        <div className="chat-header">
          <div className="chat-title">
            <Bot className="icon-bot" />
            <h3>AI SLA Assistant</h3>
          </div>
          <button className="chat-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="chat-messages">
          {messages.map((msg, index) => (
            <div key={index} className={`chat-message ${msg.role}`}>
              <div className="avatar">
                {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div className="message-content">
                <p>{msg.text}</p>
                {msg.isConfirmation && pendingConfirmation && (
                  <div className="confirmation-actions">
                    <button
                      className="btn-confirm"
                      onClick={() => handleConfirmAction(true)}
                    >
                      <CheckCircle2 size={16} /> Confirm
                    </button>
                    <button
                      className="btn-cancel"
                      onClick={() => handleConfirmAction(false)}
                    >
                      <AlertTriangle size={16} /> Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="chat-message model">
              <div className="avatar"><Bot size={16} /></div>
              <div className="message-content loading">Agent is thinking...</div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSend} className="chat-input-area">
          <input
            type="text"
            placeholder="Ask about tickets or SLA risks..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading || !!pendingConfirmation}
          />
          <button type="submit" disabled={loading || !input.trim() || !!pendingConfirmation}>
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}