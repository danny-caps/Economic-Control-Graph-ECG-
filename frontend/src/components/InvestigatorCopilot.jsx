import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, Sparkles, User, ShieldCheck, AlertCircle, FileText, CheckCircle } from 'lucide-react';
import { apiUrl } from '../api';

const SUGGESTED_QUERIES = [
  "Why was this cluster flagged?",
  "What are the strongest edges?",
  "What changed in the last 24 hours?",
  "What legitimate explanations exist?",
  "What action is proportionate?"
];

export default function InvestigatorCopilot({ activeClusterId = "cluster_1001", clusterData }) {
  const [messages, setMessages] = useState([
    {
      sender: 'assistant',
      text: `Hello, Risk Lead. I am your **ECG AI Investigator Assistant**.\n\nI have analyzed **${activeClusterId}** across multi-hop graph topology, temporal burst synchronicity, and payout destination concentration. How can I assist your investigation today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const chatBottomRef = useRef(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSendMessage = async (queryText) => {
    const textToSend = queryText || inputQuery;
    if (!textToSend.trim()) return;

    const userMsg = {
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, userMsg]);
    setInputQuery('');
    setLoading(true);

    try {
      const res = await fetch(apiUrl('/api/investigator/chat'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cluster_id: activeClusterId,
          query: textToSend
        })
      });
      const data = await res.json();
      
      const botMsg = {
        sender: 'assistant',
        text: data.response,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      console.error("Chat error", err);
      setMessages(prev => [
        ...prev,
        {
          sender: 'assistant',
          text: "I encountered an error connecting to the risk engine. Please check backend status.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', height: '580px', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border-subtle)', background: 'rgba(9, 13, 22, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ background: 'linear-gradient(135deg, #3395FF 0%, #0070f3 100%)', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Bot size={18} color="white" />
          </div>
          <div>
            <h4 style={{ fontSize: '14px', color: '#f8fafc' }}>AI Investigator Assistant</h4>
            <span style={{ fontSize: '11px', color: '#34d399' }}>● Grounded in Deterministic Graph Evidence</span>
          </div>
        </div>
        <span className="badge badge-blue">{activeClusterId}</span>
      </div>

      {/* Messages Container */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px', background: '#05070d' }}>
        {messages.map((m, idx) => (
          <div key={idx} style={{ display: 'flex', gap: '10px', alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
            {m.sender === 'assistant' && (
              <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(51, 149, 255, 0.2)', border: '1px solid rgba(51, 149, 255, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Bot size={15} color="#60a5fa" />
              </div>
            )}
            
            <div style={{
              background: m.sender === 'user' ? 'linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)' : 'rgba(13, 19, 34, 0.9)',
              border: m.sender === 'user' ? '1px solid rgba(96, 165, 250, 0.3)' : '1px solid var(--border-subtle)',
              borderRadius: '10px',
              padding: '12px 14px',
              fontSize: '13px',
              color: '#f8fafc',
              lineHeight: '1.6',
              whiteSpace: 'pre-wrap'
            }}>
              {m.text}
              <div style={{ fontSize: '10px', color: m.sender === 'user' ? '#93c5fd' : '#64748b', marginTop: '6px', textAlign: 'right' }}>
                {m.timestamp}
              </div>
            </div>

            {m.sender === 'user' && (
              <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(255, 255, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <User size={15} color="#cbd5e1" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', gap: '10px', alignSelf: 'flex-start' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(51, 149, 255, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bot size={15} color="#60a5fa" />
            </div>
            <div style={{ background: 'rgba(13, 19, 34, 0.9)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '12px 16px', fontSize: '12px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div className="pulse-dot pulse-blue"></div>
              <span>Synthesizing topological evidence trails...</span>
            </div>
          </div>
        )}
        <div ref={chatBottomRef} />
      </div>

      {/* Suggested Quick Prompt Chips */}
      <div style={{ padding: '8px 14px', background: 'rgba(10, 15, 26, 0.9)', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: '6px', overflowX: 'auto' }}>
        {SUGGESTED_QUERIES.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(q)}
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              color: '#94a3b8',
              border: '1px solid var(--border-subtle)',
              borderRadius: '16px',
              padding: '4px 10px',
              fontSize: '11px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#3395FF'; e.currentTarget.style.color = '#60a5fa'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.color = '#94a3b8'; }}
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input Bar */}
      <div style={{ padding: '12px 14px', background: 'rgba(8, 12, 20, 0.95)', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: '10px' }}>
        <input
          type="text"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder={`Ask about ${activeClusterId} (e.g., strongest edges, temporal shifts)...`}
          style={{
            flex: 1,
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '8px',
            padding: '8px 14px',
            color: '#f8fafc',
            fontSize: '13px',
            outline: 'none'
          }}
        />
        <button
          className="btn-primary"
          onClick={() => handleSendMessage()}
          disabled={loading || !inputQuery.trim()}
          style={{ padding: '8px 16px' }}
        >
          <Send size={14} />
        </button>
      </div>
    </div>
  );
}
