/**
 * Vapi Voice Assistant Component
 * Real-time AI-powered voice assistant using Vapi Web SDK
 * 
 * Features:
 * - One-tap voice calling with AI assistant
 * - Real-time speech-to-speech conversation
 * - Visual audio level indicators
 * - Transcript display
 * - Mute/unmute support
 * 
 * @author Kisan.JI Team
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  X,
  Loader2,
  AudioLines,
  Bot,
  User,
  Minimize2,
  Maximize2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';

// Vapi public key
const VAPI_PUBLIC_KEY = '7af0c78b-55d1-4b19-b20c-d895b1dbcbd7';

const VapiAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [callStatus, setCallStatus] = useState('idle'); // idle | connecting | active | ending
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [transcripts, setTranscripts] = useState([]);
  const [error, setError] = useState(null);
  const vapiRef = useRef(null);
  const transcriptEndRef = useRef(null);
  const { language } = useLanguage();

  // Scroll to bottom of transcripts
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcripts]);

  // Initialize Vapi instance
  const initVapi = useCallback(async () => {
    if (vapiRef.current) return vapiRef.current;

    try {
      // Dynamic import to avoid SSR issues
      const VapiModule = await import('@vapi-ai/web');
      const Vapi = VapiModule.default || VapiModule;
      const vapi = new Vapi(VAPI_PUBLIC_KEY);

      // Event listeners
      vapi.on('call-start', () => {
        console.log('[Vapi] Call started');
        setCallStatus('active');
        setError(null);
        setTranscripts([
          {
            role: 'assistant',
            content: 'Connected! I am Kisan.JI, your AI farming assistant. How can I help you today?',
            timestamp: new Date().toLocaleTimeString(),
          },
        ]);
      });

      vapi.on('call-end', () => {
        console.log('[Vapi] Call ended');
        setCallStatus('idle');
        setIsSpeaking(false);
        setVolumeLevel(0);
        setIsMuted(false);
      });

      vapi.on('speech-start', () => {
        setIsSpeaking(true);
      });

      vapi.on('speech-end', () => {
        setIsSpeaking(false);
      });

      vapi.on('volume-level', (level) => {
        setVolumeLevel(level);
      });

      vapi.on('message', (message) => {
        console.log('[Vapi] Message:', message);

        // Handle transcript messages
        if (message.type === 'transcript') {
          if (message.transcriptType === 'final') {
            setTranscripts((prev) => [
              ...prev,
              {
                role: message.role === 'assistant' ? 'assistant' : 'user',
                content: message.transcript,
                timestamp: new Date().toLocaleTimeString(),
              },
            ]);
          }
        }

        // Handle conversation updates
        if (message.type === 'conversation-update') {
          const conversation = message.conversation || [];
          if (conversation.length > 0) {
            const lastMsg = conversation[conversation.length - 1];
            if (lastMsg.content) {
              setTranscripts((prev) => {
                // Avoid duplicates
                const lastExisting = prev[prev.length - 1];
                if (lastExisting && lastExisting.content === lastMsg.content) {
                  return prev;
                }
                return [
                  ...prev,
                  {
                    role: lastMsg.role === 'assistant' ? 'assistant' : 'user',
                    content: lastMsg.content,
                    timestamp: new Date().toLocaleTimeString(),
                  },
                ];
              });
            }
          }
        }
      });

      vapi.on('error', (err) => {
        console.error('[Vapi] Error:', err);
        setError(err?.message || 'An error occurred with the voice assistant');
        setCallStatus('idle');
      });

      vapiRef.current = vapi;
      return vapi;
    } catch (err) {
      console.error('[Vapi] Init error:', err);
      setError('Failed to initialize voice assistant. Please refresh and try again.');
      return null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (vapiRef.current) {
        try {
          vapiRef.current.stop();
        } catch (e) {
          // ignore cleanup errors
        }
      }
    };
  }, []);

  // Language to system prompt mapping
  const getLanguageInstruction = () => {
    const langMap = {
      hi: 'Reply in Hindi (Devanagari script). उपयोगकर्ता हिंदी में बात कर रहा है।',
      mr: 'Reply in Marathi (Devanagari script). वापरकर्ता मराठीत बोलत आहे.',
      en: 'Reply in simple English.',
    };
    return langMap[language] || langMap['en'];
  };

  // Start a voice call
  const startCall = async () => {
    setCallStatus('connecting');
    setError(null);
    setTranscripts([]);

    const vapi = await initVapi();
    if (!vapi) {
      setCallStatus('idle');
      return;
    }

    try {
      await vapi.start({
        model: {
          provider: 'openai',
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `You are "Kisan.JI", an expert Indian agriculture consultant and voice assistant.

LANGUAGE: ${getLanguageInstruction()}

YOUR EXPERTISE:
- Crop diseases, pest control, and treatments
- Fertilizer and pesticide dosage recommendations
- Weather-based farming advice
- Crop recommendations based on soil and season
- Government schemes (PM-KISAN, PMFBY, subsidies)
- Market prices and mandi information
- Irrigation and water management
- Organic farming techniques

RESPONSE STYLE:
- Keep answers SHORT (2-3 sentences max for voice)
- Be warm, practical, and helpful
- Use crop names in both English and local language when possible
- Give specific, actionable advice
- If asked about something non-farming, politely redirect to agriculture

GREETING: Start with a warm greeting and ask how you can help with farming today.`,
            },
          ],
        },
        voice: {
          provider: '11labs',
          voiceId: 'burt',
        },
        firstMessage: language === 'hi' 
          ? 'नमस्ते किसान भाई! मैं किसान.जी हूं, आपका AI कृषि सहायक। आज खेती में क्या मदद करूं?'
          : language === 'mr'
          ? 'नमस्कार शेतकरी मित्र! मी किसान.जी आहे, तुमचा AI कृषी सहाय्यक. आज शेतीत काय मदत करू?'
          : 'Namaste farmer! I am Kisan.JI, your AI farming assistant. How can I help you with agriculture today?',
      });
    } catch (err) {
      console.error('[Vapi] Start error:', err);
      setError(err?.message || 'Failed to start voice call. Please check microphone permissions.');
      setCallStatus('idle');
    }
  };

  // End the voice call
  const endCall = () => {
    setCallStatus('ending');
    try {
      if (vapiRef.current) {
        vapiRef.current.stop();
      }
    } catch (err) {
      console.error('[Vapi] Stop error:', err);
    }
    setTimeout(() => setCallStatus('idle'), 500);
  };

  // Toggle mute
  const toggleMute = () => {
    if (vapiRef.current) {
      const newMuted = !isMuted;
      vapiRef.current.setMuted(newMuted);
      setIsMuted(newMuted);
    }
  };

  // Generate visual bars for audio level
  const getAudioBars = () => {
    const bars = 12;
    return Array.from({ length: bars }, (_, i) => {
      const threshold = (i / bars) * 1;
      const isActive = volumeLevel > threshold;
      return isActive;
    });
  };

  return (
    <>
      {/* Floating Voice Call Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="fixed bottom-6 left-6 z-50"
          >
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                onClick={() => setIsOpen(true)}
                size="lg"
                className="h-14 w-14 rounded-full shadow-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white border-0"
                style={{
                  boxShadow: '0 0 20px rgba(109, 40, 217, 0.4), 0 4px 15px rgba(0,0,0,0.3)',
                }}
              >
                <Phone className="h-6 w-6" />
              </Button>
            </motion.div>
            {/* Pulse ring */}
            <span className="absolute inset-0 rounded-full animate-ping bg-violet-500/30 pointer-events-none" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Voice Assistant Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.9 }}
            transition={{ duration: 0.3, type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed bottom-6 left-6 z-50 w-[380px] max-w-[calc(100vw-3rem)]"
          >
            <Card className="overflow-hidden border border-white/10 shadow-2xl bg-gray-950/95 backdrop-blur-xl">
              {/* Header */}
              <div className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-indigo-600" />
                {/* Animated background pattern when active */}
                {callStatus === 'active' && (
                  <motion.div
                    className="absolute inset-0 opacity-20"
                    animate={{
                      background: [
                        'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.3) 0%, transparent 50%)',
                        'radial-gradient(circle at 80% 50%, rgba(255,255,255,0.3) 0%, transparent 50%)',
                        'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.3) 0%, transparent 50%)',
                      ],
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                  />
                )}
                <div className="relative p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="bg-white/20 p-2 rounded-xl">
                          <Bot className="h-5 w-5 text-white" />
                        </div>
                        {callStatus === 'active' && (
                          <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-violet-600">
                            <span className="absolute inset-0 rounded-full bg-green-400 animate-ping" />
                          </span>
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-white text-sm">
                          Kisan.JI Voice
                        </h3>
                        <p className="text-[11px] text-white/70">
                          {callStatus === 'idle' && 'Tap to start call'}
                          {callStatus === 'connecting' && 'Connecting...'}
                          {callStatus === 'active' && (isSpeaking ? '🔊 Speaking...' : '🎤 Listening...')}
                          {callStatus === 'ending' && 'Ending call...'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsMinimized(!isMinimized)}
                        className="h-7 w-7 text-white/80 hover:text-white hover:bg-white/10"
                      >
                        {isMinimized ? <Maximize2 className="h-3.5 w-3.5" /> : <Minimize2 className="h-3.5 w-3.5" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (callStatus === 'active') endCall();
                          setIsOpen(false);
                        }}
                        className="h-7 w-7 text-white/80 hover:text-white hover:bg-white/10"
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Content (collapsible) */}
              <AnimatePresence>
                {!isMinimized && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {/* Audio Visualizer (when active or connecting) */}
                    {(callStatus === 'active' || callStatus === 'connecting') && (
                      <div className="px-4 pt-4">
                        <div className="flex items-center justify-center gap-[3px] h-12">
                          {callStatus === 'connecting' ? (
                            <div className="flex items-center gap-2 text-violet-400">
                              <Loader2 className="h-5 w-5 animate-spin" />
                              <span className="text-sm">Connecting to AI assistant...</span>
                            </div>
                          ) : (
                            getAudioBars().map((isActive, i) => (
                              <motion.div
                                key={i}
                                className={`w-1.5 rounded-full ${
                                  isActive
                                    ? isSpeaking
                                      ? 'bg-violet-400'
                                      : 'bg-emerald-400'
                                    : 'bg-white/10'
                                }`}
                                animate={{
                                  height: isActive
                                    ? `${Math.max(8, Math.random() * 40 + volumeLevel * 30)}px`
                                    : '6px',
                                }}
                                transition={{ duration: 0.1 }}
                              />
                            ))
                          )}
                        </div>
                        {callStatus === 'active' && (
                          <p className="text-center text-[11px] text-gray-500 mt-1">
                            {isSpeaking ? 'Assistant is speaking' : 'Listening to you...'}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Transcript Area */}
                    <ScrollArea className="h-52 px-4 py-3">
                      <div className="space-y-3">
                        {transcripts.length === 0 && callStatus === 'idle' && (
                          <div className="text-center py-8 space-y-3">
                            <div className="inline-flex p-4 rounded-2xl bg-violet-500/10">
                              <AudioLines className="h-8 w-8 text-violet-400" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-300">
                                AI Voice Assistant
                              </p>
                              <p className="text-xs text-gray-500 mt-1 max-w-[250px] mx-auto">
                                Start a real-time voice call with Kisan.JI. Ask about crops, weather, market prices, and more!
                              </p>
                            </div>
                          </div>
                        )}

                        {transcripts.map((msg, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.05 }}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 ${
                                msg.role === 'user'
                                  ? 'bg-violet-600/30 text-violet-100 border border-violet-500/20'
                                  : 'bg-white/5 text-gray-300 border border-white/5'
                              }`}
                            >
                              <div className="flex items-center gap-1.5 mb-1">
                                {msg.role === 'assistant' ? (
                                  <Bot className="h-3 w-3 text-violet-400" />
                                ) : (
                                  <User className="h-3 w-3 text-emerald-400" />
                                )}
                                <span className="text-[10px] text-gray-500">{msg.timestamp}</span>
                              </div>
                              <p className="text-[13px] leading-relaxed">{msg.content}</p>
                            </div>
                          </motion.div>
                        ))}
                        <div ref={transcriptEndRef} />
                      </div>
                    </ScrollArea>

                    {/* Error Display */}
                    {error && (
                      <div className="mx-4 mb-3 p-2.5 rounded-lg bg-red-500/10 border border-red-500/20">
                        <p className="text-xs text-red-400">{error}</p>
                      </div>
                    )}

                    {/* Controls */}
                    <div className="p-4 pt-2 border-t border-white/5">
                      <div className="flex items-center justify-center gap-3">
                        {/* Mute Button */}
                        {callStatus === 'active' && (
                          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={toggleMute}
                              className={`h-11 w-11 rounded-full border-white/10 ${
                                isMuted
                                  ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                                  : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                              }`}
                              title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
                            >
                              {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                            </Button>
                          </motion.div>
                        )}

                        {/* Main Call Button */}
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          {callStatus === 'idle' ? (
                            <Button
                              onClick={startCall}
                              className="h-14 w-14 rounded-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white border-0 shadow-lg shadow-emerald-500/30"
                            >
                              <Phone className="h-6 w-6" />
                            </Button>
                          ) : callStatus === 'connecting' ? (
                            <Button
                              disabled
                              className="h-14 w-14 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0"
                            >
                              <Loader2 className="h-6 w-6 animate-spin" />
                            </Button>
                          ) : (
                            <Button
                              onClick={endCall}
                              className="h-14 w-14 rounded-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 text-white border-0 shadow-lg shadow-red-500/30"
                            >
                              <PhoneOff className="h-6 w-6" />
                            </Button>
                          )}
                        </motion.div>

                        {/* Volume Indicator */}
                        {callStatus === 'active' && (
                          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                            <div
                              className="h-11 w-11 rounded-full bg-white/5 border border-white/10 flex items-center justify-center"
                              title="Voice activity"
                            >
                              <Volume2
                                className={`h-5 w-5 transition-colors ${
                                  isSpeaking ? 'text-violet-400' : 'text-gray-600'
                                }`}
                              />
                            </div>
                          </motion.div>
                        )}
                      </div>

                      {/* Call status text */}
                      <p className="text-center text-[11px] text-gray-600 mt-3">
                        {callStatus === 'idle' && 'Press the green button to start a voice call'}
                        {callStatus === 'connecting' && 'Setting up secure connection...'}
                        {callStatus === 'active' && 'Voice call active — speak naturally'}
                        {callStatus === 'ending' && 'Wrapping up...'}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default VapiAssistant;
