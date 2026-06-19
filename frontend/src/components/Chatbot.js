/**
 * Kisan.JI AI Chatbot
 * Text: Gemini API direct (frontend) + backend fallback
 * Voice: Web Speech API (free, no API key needed)
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import api from '@/services/api';

// ── OpenRouter AI call (frontend) ───────────────────────────
const OPENROUTER_KEY = process.env.REACT_APP_OPENROUTER_KEY || "";
const FREE_MODELS = [
  'meta-llama/llama-3.3-70b-instruct:free',
  'meta-llama/llama-3.2-3b-instruct:free',
  'nousresearch/hermes-3-llama-3.1-405b:free',
];

const SYSTEM_PROMPT = `You are Kisan.JI, an expert Indian agriculture AI assistant.
Reply in the SAME language the user writes in (Hindi→Hindi, English→English etc).
Keep answers SHORT and practical (3-4 sentences max).
Topics: crop diseases, fertilizers, pest control, irrigation, weather, mandi prices, govt schemes (PM-KISAN, PMFBY).
If asked non-farming questions, briefly help then redirect to agriculture.`;

async function askAI(question) {
  let lastError = '';
  for (const model of FREE_MODELS) {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://kisanji.app',
        'X-Title': 'Kisan.JI',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: question }
        ],
        max_tokens: 300,
      })
    });
    const data = await res.json();
    if (data.choices?.[0]?.message?.content) {
      return data.choices[0].message.content.trim();
    }
    lastError = data.error?.message || 'No response';
    if (res.status !== 429 && res.status !== 503) break; // only retry on rate-limit
  }
  throw new Error(lastError);
}

const SUGGESTIONS = [
  '🌾 Best fertilizer for wheat?',
  '🍚 How to treat rice blast?',
  '💰 Sugarcane mandi price today',
  '🐛 Pest control for cotton',
  '📋 PM-KISAN eligibility',
];

const COLORS = [
  ['#10b981', '#059669', '#047857'],
  ['#8b5cf6', '#7c3aed', '#6d28d9'],
  ['#f59e0b', '#d97706', '#b45309'],
  ['#3b82f6', '#2563eb', '#1d4ed8'],
  ['#ec4899', '#db2777', '#be185d'],
];

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: '🌾 Namaste! I am Kisan.JI — your AI farming expert powered by Gemini.\n\nAsk me anything about crops, diseases, weather, market prices, or govt schemes! You can also use the 🎤 mic button to speak.' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [colorIdx, setColorIdx] = useState(0);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);
  const { language } = useLanguage();

  // Rotate colors
  useEffect(() => {
    if (!isOpen) return;
    const t = setInterval(() => setColorIdx(i => (i + 1) % COLORS.length), 3500);
    return () => clearInterval(t);
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 250);
  }, [isOpen]);

  const addMsg = (role, content, extra = {}) =>
    setMessages(prev => [...prev, { role, content, ...extra }]);

  // ── Send message ───────────────────────────────────────────
  const handleSend = useCallback(async (text) => {
    const msg = (text || input).trim();
    if (!msg || isLoading) return;
    setInput('');
    addMsg('user', msg);
    setIsLoading(true);
    try {
      const response = await askAI(msg);
      addMsg('assistant', response);
    } catch (err) {
      const e = err?.message || '';
      if (e.includes('quota') || e.includes('429') || e.includes('rate')) {
        addMsg('assistant', '⚠️ Rate limit hit. Wait a moment and try again.');
      } else if (e.includes('401') || e.includes('auth')) {
        addMsg('assistant', '⚠️ API key error. Check OPENROUTER_KEY in Chatbot.js');
      } else {
        // fallback to backend
        try {
          const result = await api.voiceChat(msg, language || 'en', null);
          addMsg('assistant', result.response);
        } catch {
          addMsg('assistant', '⚠️ AI not reachable. Run backend: cd backend && python server.py');
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, language]);

  // ── Web Speech API (Voice Input) ───────────────────────────
  const startListening = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      addMsg('assistant', '⚠️ Your browser does not support voice input. Try Chrome or Edge.', { isSystem: true });
      return;
    }

    const recognition = new SpeechRecognition();
    const langMap = { en: 'en-IN', hi: 'hi-IN', mr: 'mr-IN', ta: 'ta-IN', te: 'te-IN', gu: 'gu-IN', pa: 'pa-IN' };
    recognition.lang = langMap[language] || 'en-IN';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (e) => {
      setIsListening(false);
      if (e.error === 'not-allowed') {
        addMsg('assistant', '⚠️ Microphone permission denied. Please allow mic access in browser settings.', { isSystem: true });
      }
    };
    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setInput(transcript);
      setTimeout(() => handleSend(transcript), 100);
    };

    recognition.start();
    recognitionRef.current = recognition;
  }, [language, handleSend]);

  const stopListening = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  // ── Text to Speech ─────────────────────────────────────────
  const speakText = (text) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const langMap = { en: 'en-IN', hi: 'hi-IN', mr: 'mr-IN', ta: 'ta-IN', te: 'te-IN', gu: 'gu-IN' };
    u.lang = langMap[language] || 'en-IN';
    u.rate = 0.88;
    u.onstart = () => setIsSpeaking(true);
    u.onend = () => setIsSpeaking(false);
    window.speechSynthesis.speak(u);
  };

  const c = COLORS[colorIdx];

  return (
    <>
      {/* Floating button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.12 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full flex items-center justify-center text-2xl"
            style={{
              background: `linear-gradient(135deg, ${c[0]}, ${c[2]})`,
              boxShadow: `0 0 32px ${c[0]}80, 0 8px 20px rgba(0,0,0,0.4)`
            }}
          >
            🌾
            <motion.span
              className="absolute inset-0 rounded-full pointer-events-none"
              animate={{ scale: [1, 1.5, 1], opacity: [0.4, 0, 0.4] }}
              transition={{ duration: 2.5, repeat: Infinity }}
              style={{ background: c[0], borderRadius: '50%' }}
            />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.93 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.93 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            className="fixed bottom-6 right-6 z-50 flex flex-col rounded-3xl overflow-hidden"
            style={{
              width: 400,
              height: 620,
              maxWidth: 'calc(100vw - 20px)',
              maxHeight: 'calc(100vh - 80px)',
              background: 'rgba(6,8,18,0.97)',
              backdropFilter: 'blur(24px)',
              border: `1px solid ${c[0]}40`,
              boxShadow: `0 0 60px ${c[0]}30, 0 20px 60px rgba(0,0,0,0.6)`
            }}
          >
            {/* Header */}
            <div className="relative flex-shrink-0 overflow-hidden" style={{ minHeight: 72 }}>
              {/* Animated gradient bg */}
              <motion.div
                className="absolute inset-0"
                animate={{ background: [
                  `linear-gradient(135deg, ${c[0]}, ${c[1]}, ${c[2]})`,
                  `linear-gradient(225deg, ${c[2]}, ${c[0]}, ${c[1]})`,
                  `linear-gradient(135deg, ${c[0]}, ${c[1]}, ${c[2]})`,
                ]}}
                transition={{ duration: 4, repeat: Infinity }}
              />
              {/* Orbs */}
              {[0,1].map(i => (
                <motion.div key={i}
                  className="absolute rounded-full blur-2xl"
                  style={{ width: 80, height: 80, background: 'rgba(255,255,255,0.15)',
                    left: i === 0 ? '-10px' : 'auto', right: i === 1 ? '-10px' : 'auto', top: '-10px' }}
                  animate={{ x: i === 0 ? [0,30,0] : [0,-30,0], y: [0,15,0] }}
                  transition={{ duration: 4+i, repeat: Infinity }}
                />
              ))}

              <div className="relative flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <motion.div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl"
                    style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)' }}
                    animate={isListening ? { scale: [1, 1.2, 1] } : {}}
                    transition={{ duration: 0.8, repeat: Infinity }}
                  >🌾</motion.div>
                  <div>
                    <p className="font-bold text-white text-sm leading-none">Kisan.JI</p>
                    <p className="text-white/70 text-[11px] mt-0.5">
                      {isLoading ? '⌨️ Thinking...'
                        : isListening ? '🎤 Listening...'
                        : isSpeaking ? '🔊 Speaking...'
                        : '✨ Llama 3.3 AI Ready'}
                    </p>
                  </div>
                </div>
                <button onClick={() => { window.speechSynthesis?.cancel(); setIsOpen(false); }}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-all text-sm">✕</button>
              </div>

              {/* Listening wave */}
              {isListening && (
                <div className="relative flex items-center justify-center gap-1 pb-2">
                  {Array.from({ length: 16 }, (_, i) => (
                    <motion.div key={i} className="w-1 rounded-full bg-white/80"
                      animate={{ height: [`${3 + Math.random()*4}px`, `${8 + Math.random()*16}px`, `${3 + Math.random()*4}px`] }}
                      transition={{ duration: 0.4 + Math.random()*0.3, repeat: Infinity, delay: i * 0.05 }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3"
              style={{ scrollbarWidth: 'thin', scrollbarColor: `${c[0]}30 transparent` }}>

              {messages.map((msg, i) => (
                <motion.div key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.03 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.isSystem ? (
                    <div className="w-full text-center">
                      <span className="text-[11px] px-3 py-1 rounded-full"
                        style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.35)' }}>
                        {msg.content}
                      </span>
                    </div>
                  ) : msg.role === 'user' ? (
                    <div className="max-w-[78%] px-4 py-2.5 rounded-2xl rounded-tr-sm text-sm text-white whitespace-pre-wrap"
                      style={{ background: `linear-gradient(135deg, ${c[0]}, ${c[2]})` }}>
                      {msg.content}
                    </div>
                  ) : (
                    <div className="max-w-[85%] flex gap-2 items-start">
                      <div className="w-7 h-7 rounded-xl flex-shrink-0 flex items-center justify-center text-sm mt-0.5"
                        style={{ background: 'rgba(255,255,255,0.07)' }}>🌾</div>
                      <div>
                        <div className="px-4 py-2.5 rounded-2xl rounded-tl-sm text-sm leading-relaxed whitespace-pre-wrap"
                          style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.88)',
                            border: '1px solid rgba(255,255,255,0.06)' }}>
                          {msg.content}
                        </div>
                        <button onClick={() => speakText(msg.content)}
                          className="mt-1 ml-1 text-[11px] transition-colors"
                          style={{ color: isSpeaking ? c[0] : 'rgba(255,255,255,0.25)' }}>
                          🔊 Listen
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}

              {/* Thinking indicator */}
              {isLoading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                  <div className="flex gap-2 items-start">
                    <div className="w-7 h-7 rounded-xl flex items-center justify-center text-sm"
                      style={{ background: 'rgba(255,255,255,0.07)' }}>🌾</div>
                    <div className="px-4 py-3 rounded-2xl rounded-tl-sm flex gap-1.5 items-center"
                      style={{ background: 'rgba(255,255,255,0.06)' }}>
                      {[0, 0.18, 0.36].map((d, i) => (
                        <motion.div key={i} className="w-2 h-2 rounded-full"
                          style={{ background: c[0] }}
                          animate={{ y: [0, -7, 0] }}
                          transition={{ duration: 0.75, repeat: Infinity, delay: d }} />
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Suggestions */}
            {messages.length <= 1 && (
              <div className="px-4 pb-2 flex flex-wrap gap-1.5">
                {SUGGESTIONS.map((s, i) => (
                  <button key={i} onClick={() => handleSend(s)}
                    className="text-[11px] px-3 py-1.5 rounded-full transition-all hover:opacity-80"
                    style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.55)',
                      border: `1px solid ${c[0]}30` }}>
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="flex-shrink-0 px-3 pb-3">
              <div className="flex items-center gap-2 px-3 py-2 rounded-2xl"
                style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${c[0]}25` }}>

                {/* Mic button */}
                <motion.button
                  whileTap={{ scale: 0.88 }}
                  onClick={isListening ? stopListening : startListening}
                  className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center text-base transition-all"
                  style={{
                    background: isListening ? `linear-gradient(135deg, ${c[0]}, ${c[2]})` : 'rgba(255,255,255,0.07)',
                    boxShadow: isListening ? `0 0 16px ${c[0]}60` : 'none'
                  }}
                  title="Voice input"
                >
                  {isListening ? (
                    <motion.span animate={{ scale: [1,1.3,1] }} transition={{ duration: 0.6, repeat: Infinity }}>🎤</motion.span>
                  ) : '🎙️'}
                </motion.button>

                {/* Text input */}
                <input
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                  placeholder="Ask about crops, diseases, prices..."
                  className="flex-1 bg-transparent text-sm outline-none min-w-0"
                  style={{ color: 'rgba(255,255,255,0.88)', '::placeholder': { color: 'rgba(255,255,255,0.25)' } }}
                />

                {/* Send button */}
                <motion.button
                  whileTap={{ scale: 0.88 }}
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isLoading}
                  className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center text-base transition-all"
                  style={{
                    background: input.trim() && !isLoading
                      ? `linear-gradient(135deg, ${c[0]}, ${c[2]})`
                      : 'rgba(255,255,255,0.05)',
                    opacity: !input.trim() || isLoading ? 0.4 : 1,
                    boxShadow: input.trim() && !isLoading ? `0 0 14px ${c[0]}50` : 'none'
                  }}
                >
                  {isLoading
                    ? <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>⏳</motion.span>
                    : '➤'}
                </motion.button>
              </div>

              <p className="text-center text-[10px] mt-1.5" style={{ color: 'rgba(255,255,255,0.18)' }}>
                OpenRouter AI · 🌳 Llama 3.3 Free · 🎙️ Voice Input · 🔊 Text-to-Speech
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
