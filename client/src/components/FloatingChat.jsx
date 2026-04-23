import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { useChat } from '../context/ChatContext';
import api from '../services/api';

export default function FloatingChat() {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const { isChatOpen, setIsChatOpen } = useChat();
  const [isClosing, setIsClosing] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [lastUsedProvider, setLastUsedProvider] = useState(null);
  const chatEndRef = useRef(null);

  // Load history from DB on mount
  useEffect(() => {
    api.get('/ai/history').then(r => {
      setChatMessages(r.data.map(m => ({ role: m.role, content: m.content })));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const updateChatMessages = (msgs) => {
    setChatMessages(msgs);
    sessionStorage.setItem('chatMessages', JSON.stringify(msgs));
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    const userMessage = chatInput.trim();
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }, { role: 'assistant', content: 'Thinking...' }]);
    setChatInput('');

    try {
      const res = await api.post('/ai/chat', { message: userMessage });
      let responseContent = res.data.response || res.data.message;
      
      // Check if AI provider changed and add notification
      const usedProvider = res.data.aiProvider;
      const usedModel = res.data.aiModel;
      if (usedProvider && usedModel && lastUsedProvider !== `${usedProvider}-${usedModel}`) {
        setLastUsedProvider(`${usedProvider}-${usedModel}`);
        const providerNames = {
          'groq': '🚀 Groq',
          'gemini': '✨ Google Gemini',
          'mistral': '🔥 Mistral AI',
          'openrouter': '🌐 OpenRouter'
        };
        const providerName = providerNames[usedProvider] || usedProvider;
        addNotification({
          type: 'AI Provider',
          icon: '🤖',
          title: `Using ${providerName}`,
          sub: usedModel,
          color: 'bg-purple-50 text-purple-600'
        });
      }
      
      if (res.data.record) {
        const emoji = { memory: '🧠', task: '✅', note: '📝', goal: '🎯' }[res.data.intent] || '💾';
        responseContent += `\n\n${emoji} Saved to ${res.data.intent}s!`;
      }
      setChatMessages(prev => [
        ...prev.slice(0, -1),
        { role: 'assistant', content: responseContent, saved: !!res.data.record },
      ]);
    } catch {
      setChatMessages(prev => [
        ...prev.slice(0, -1),
        { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' },
      ]);
    }
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => { setIsChatOpen(false); setIsClosing(false); }, 300);
  };

  const handleClear = async () => {
    await api.delete('/ai/history').catch(() => {});
    setChatMessages([]);
  };

  return (
    <>
      {/* FAB buttons */}
      {!isChatOpen && (
        <div className="fixed bottom-6 right-6 flex flex-col items-center gap-2 z-50">
          {chatMessages.length > 0 && (
            <button
              onClick={() => setShowHistory(true)}
              className="w-10 h-10 bg-white border border-indigo-200 text-indigo-500 rounded-full shadow-md hover:bg-indigo-50 transition-all flex items-center justify-center relative"
              title="Chat History"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">{chatMessages.length}</span>
            </button>
          )}
          <button
            onClick={() => setIsChatOpen(true)}
            className="w-14 h-14 bg-[#5A67D8] text-white rounded-full shadow-lg hover:bg-indigo-600 transition-all duration-300 flex items-center justify-center hover:scale-110"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </button>
        </div>
      )}

      {/* Chat Panel */}
      {(isChatOpen || isClosing) && (
        <div className={`fixed bottom-10 right-10 w-[380px] bg-white rounded-[24px] shadow-[0_12px_40px_rgb(0,0,0,0.12)] border border-slate-100 overflow-hidden z-50 flex flex-col ${isClosing ? 'animate-chatSlideOut' : 'animate-chatSlideIn'}`}>
          {/* Header */}
          <div className="px-6 py-4 flex justify-between items-center border-b border-slate-50 bg-gradient-to-r from-indigo-50 to-purple-50">
            <span className="text-[13px] font-bold text-slate-800 flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              AI Assistant
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => handleClear()}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/80 backdrop-blur-sm border border-slate-200 text-[11px] font-bold text-slate-400 rounded-full hover:bg-white hover:text-slate-600 transition-all"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                Clear
              </button>
              {chatMessages.length > 0 && (
                <button
                  onClick={() => setShowHistory(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white/80 backdrop-blur-sm border border-slate-200 text-[11px] font-bold text-slate-400 rounded-full hover:bg-white hover:text-indigo-500 transition-all"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  History
                </button>
              )}
              <button onClick={handleClose} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 rounded-full hover:bg-white/80 transition-all hover:rotate-90">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="px-6 py-6 bg-gradient-to-br from-[#FAFBFF] to-[#F8FAFC] h-[240px] flex flex-col">
            {chatMessages.length === 0 ? (
              <>
                <div className="flex gap-3 mb-6">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-400 to-rose-600 text-white flex items-center justify-center text-xs font-bold shadow-lg">{user?.name?.charAt(0) || 'U'}</div>
                  <div>
                    <div className="text-[13px] font-bold text-slate-800 mb-0.5">Hello {user?.name || 'User'}! How can I assist you today?</div>
                    <div className="text-[10px] text-slate-400 font-bold">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                </div>
                <div className="flex flex-col items-start gap-2 mt-auto">
                  {[
                    { emoji: '💾', text: 'My WiFi password is MySecurePass123' },
                    { emoji: '🔍', text: "What's my WiFi password?" },
                    { emoji: '✅', text: 'Remind me to call mom tomorrow at 3 PM' },
                    { emoji: '🎯', text: 'mujhe upsc ki taiyari karni hai aur 1 saal me clear karna hai' },
                  ].map(q => (
                    <button key={q.text} onClick={() => setChatInput(q.text)}
                      className="text-[11px] px-4 py-2 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-full text-slate-600 font-bold shadow-sm flex items-center gap-1.5 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600 transition-all hover:scale-105"
                    >
                      {q.emoji} {q.text.length > 35 ? q.text.slice(0, 35) + '…' : q.text}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-3">
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                    {msg.role === 'assistant' && (
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-md">
                        {msg.content === 'Thinking...' ? <div className="w-2 h-2 bg-white rounded-full animate-ping" /> : 'AI'}
                      </div>
                    )}
                    <div className={`text-[11px] p-3 rounded-lg max-w-xs ${msg.role === 'user' ? 'bg-gradient-to-br from-indigo-100 to-indigo-200 text-indigo-800 ml-auto shadow-md' : msg.saved ? 'bg-gradient-to-br from-green-50 to-emerald-50 text-slate-700 border border-green-200 shadow-sm' : 'bg-white/90 text-slate-700 border border-slate-100 shadow-sm'}`}>
                      {msg.content.split('\n').map((line, idx) => (
                        <div key={idx} className={line.includes('Saved to') ? 'text-green-600 font-semibold mt-2' : ''}>{line}</div>
                      ))}
                    </div>
                    {msg.role === 'user' && (
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-rose-400 to-rose-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-md">{user?.name?.charAt(0) || 'U'}</div>
                    )}
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
            )}
          </div>

          {/* Input */}
          <div className="px-5 py-4 bg-white border-t border-slate-50 flex items-center gap-3">
            <div className="flex-1 bg-gradient-to-r from-slate-50 to-slate-100 rounded-2xl flex items-center px-4 py-2.5 border border-slate-200 focus-within:border-indigo-300 focus-within:bg-white transition-all">
              <input
                type="text"
                placeholder="Type a message..."
                className="bg-transparent w-full text-xs font-medium outline-none text-slate-800 placeholder-slate-500"
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
              />
            </div>
            <button
              onClick={handleSendMessage}
              disabled={!chatInput.trim()}
              className="w-10 h-10 rounded-full bg-gradient-to-br from-[#5A67D8] to-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95 transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </button>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistory && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4" onClick={() => setShowHistory(false)}>
          <div className="bg-white rounded-[24px] w-full max-w-2xl max-h-[80vh] shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Chat History ({chatMessages.length} messages)
              </h2>
              <button onClick={() => setShowHistory(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-br from-slate-50 to-slate-100">
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-md">AI</div>
                  )}
                  <div className={`text-sm p-4 rounded-xl max-w-md shadow-sm ${msg.role === 'user' ? 'bg-gradient-to-br from-indigo-100 to-indigo-200 text-indigo-800' : msg.saved ? 'bg-gradient-to-br from-green-50 to-emerald-50 text-slate-700 border border-green-200' : 'bg-white text-slate-700 border border-slate-100'}`}>
                    {msg.content.split('\n').map((line, idx) => (
                      <div key={idx} className={line.includes('Saved to') ? 'text-green-600 font-semibold mt-2' : ''}>{line}</div>
                    ))}
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-400 to-rose-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-md">{user?.name?.charAt(0) || 'U'}</div>
                  )}
                </div>
              ))}
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex gap-3">
              <button onClick={() => { handleClear(); setShowHistory(false); }} className="flex-1 px-4 py-2.5 bg-red-50 border border-red-100 text-red-500 rounded-xl text-sm font-bold hover:bg-red-100 transition-colors">
                Clear All History
              </button>
              <button onClick={() => setShowHistory(false)} className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-200 transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
