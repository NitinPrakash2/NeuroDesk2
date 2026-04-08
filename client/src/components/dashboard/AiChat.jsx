import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

const intentColors = {
  task: 'bg-blue-50 border-blue-200 text-blue-700',
  note: 'bg-orange-50 border-orange-200 text-orange-700',
  memory: 'bg-purple-50 border-purple-200 text-purple-700',
  goal: 'bg-teal-50 border-teal-200 text-teal-700',
  query: 'bg-gray-50 border-gray-200 text-gray-700',
  chat: 'bg-gray-50 border-gray-200 text-gray-700',
};

const intentLabels = {
  task: '✅ Task Created',
  note: '📝 Note Saved',
  memory: '🧠 Remembered',
  goal: '🏆 Goal Set',
  query: '💬 Answer',
  chat: '💬 Chat',
};

const AiChat = ({ onDataChange }) => {
  const [messages, setMessages] = useState([
    { role: 'ai', text: "Hi! I'm your NeuroDesk AI. Try saying: \"Remind me to call mom tomorrow at 6 PM\" or \"My WiFi password is 12345\"" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    setMessages(prev => [...prev, { role: 'user', text }]);
    setInput('');
    setLoading(true);

    try {
      const { data } = await api.post('/ai/chat', { message: text });
      const aiText = data.response || data.message;
      setMessages(prev => [...prev, {
        role: 'ai',
        text: aiText,
        intent: data.intent,
        action: data.action,
        record: data.record,
      }]);
      // Notify parent to refresh data if something was created
      if (data.action === 'create' && onDataChange) onDataChange(data.intent);
      if (data.action === 'create') toast.success(data.message);
    } catch (err) {
      toast.error('AI is unavailable right now');
      setMessages(prev => [...prev, { role: 'ai', text: 'Sorry, I ran into an error. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col h-96">
      {/* Header */}
      <div className="flex items-center space-x-2 p-4 border-b border-gray-100">
        <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <span className="font-semibold text-gray-800 text-sm">NeuroDesk AI</span>
        <span className="ml-auto text-xs text-green-500 font-medium flex items-center gap-1">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block"></span> Online
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs lg:max-w-sm ${msg.role === 'user'
              ? 'bg-indigo-600 text-white rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm'
              : 'space-y-1'
            }`}>
              {msg.role === 'ai' ? (
                <>
                  <p className="text-sm text-gray-700 bg-gray-50 rounded-2xl rounded-tl-sm px-4 py-2.5">{msg.text}</p>
                  {msg.intent && msg.action === 'create' && msg.record && (
                    <div className={`text-xs px-3 py-1.5 rounded-xl border font-medium ${intentColors[msg.intent]}`}>
                      {intentLabels[msg.intent]}: {msg.record.title || msg.record.label}
                    </div>
                  )}
                </>
              ) : msg.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-50 rounded-2xl rounded-tl-sm px-4 py-2.5">
              <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-gray-100 flex items-center gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder="Tell me anything..."
          className="flex-1 text-sm px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center hover:bg-indigo-700 transition-colors disabled:opacity-50"
        >
          <Send className="w-4 h-4 text-white" />
        </button>
      </div>
    </div>
  );
};

export default AiChat;
