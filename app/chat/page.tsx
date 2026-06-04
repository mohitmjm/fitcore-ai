'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  Send, 
  Trash2, 
  Sparkles, 
  Zap, 
  RotateCw,
  TrendingUp,
  BrainCircuit,
  MessageCircleQuestion,
  Volume2,
  VolumeX
} from 'lucide-react';
import { localDb, ChatMessage } from '@/lib/db';

const SUGGESTED_PROMPTS = [
  "How can I hit my protein goal today?",
  "What is the best way to improve squat form?",
  "Suggest a simple 500kcal post-workout meal",
  "How do I break a strength plateau?"
];

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);

  useEffect(() => {
    setMessages(localDb.getChatMessages());
  }, []);

  useEffect(() => {
    // Scroll to bottom on updates
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    // Cancel speaking on unmount
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleToggleSpeech = (msg: ChatMessage) => {
    if (typeof window === 'undefined') return;

    const synth = window.speechSynthesis;
    if (!synth) {
      alert("Text-to-speech is not supported in this browser.");
      return;
    }

    if (speakingMessageId === msg.id) {
      synth.cancel();
      setSpeakingMessageId(null);
      return;
    }

    synth.cancel();

    const utterance = new SpeechSynthesisUtterance(msg.message);
    
    // Choose appropriate voice/accent
    const profile = localDb.getProfile();
    const isHinglish = profile.language === 'hinglish';
    const voices = synth.getVoices();

    if (isHinglish) {
      // Look for Hindi or Indian English accents
      const inVoice = voices.find(v => v.lang.startsWith('hi-IN') || v.lang.startsWith('en-IN'));
      if (inVoice) {
        utterance.voice = inVoice;
      }
      utterance.lang = 'hi-IN';
    } else {
      const usVoice = voices.find(v => v.lang.startsWith('en-US'));
      if (usVoice) {
        utterance.voice = usVoice;
      }
      utterance.lang = 'en-US';
    }

    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onend = () => {
      setSpeakingMessageId(null);
    };

    utterance.onerror = (e) => {
      console.error("TTS error:", e);
      setSpeakingMessageId(null);
    };

    setSpeakingMessageId(msg.id);
    synth.speak(utterance);
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isTyping) return;

    // 1. Save user message locally
    const userMsg = localDb.addChatMessage('user', text);
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    try {
      // 2. Fetch from AI endpoint
      const chatHistory = localDb.getChatMessages();
      const profile = localDb.getProfile();
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: chatHistory.slice(-10), // Send last 10 messages for context
          language: profile.language || 'english'
        })
      });

      const data = await res.json();
      
      // 3. Save AI message locally
      if (res.ok && data.response) {
        const aiMsg = localDb.addChatMessage('ai', data.response);
        setMessages(prev => [...prev, aiMsg]);
      } else {
        throw new Error(data.error || 'Failed to chat');
      }

    } catch (err: any) {
      console.warn("API Chat failed, using mock advisor fallback:", err);
      // Fallback: consult client side AI
      const profile = localDb.getProfile();
      const aiModule = await import('@/lib/ai');
      let fallbackPrompt = `The user says: ${text}. Suggest form, gym tips, diet guidance as a supportive coach.`;
      if (profile.language === 'hinglish') {
        fallbackPrompt += " Crucial: Speak in Hinglish (Hindi written in the Latin alphabet, using casual colloquial expressions like 'Kaise ho? Workout kaisa chal raha hai?').";
      }
      const aiReply = await aiModule.callAI(fallbackPrompt);
      const aiMsg = localDb.addChatMessage('ai', aiReply);
      setMessages(prev => [...prev, aiMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleResetChat = () => {
    if (confirm("Are you sure you want to clear your conversation history?")) {
      localDb.clearChat();
      setMessages(localDb.getChatMessages());
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] md:h-[calc(100vh-6rem)] animate-[fadeIn_0.4s_ease-out] relative space-y-4">
      
      {/* CHAT HEADER */}
      <div className="flex justify-between items-center border-b border-[rgba(255,255,255,0.06)] pb-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <BrainCircuit className="h-7 w-7 text-cyan-400" />
            AI Coach <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">Desk</span>
          </h1>
          <p className="text-gray-400 text-xs mt-1">Interactive trainer powered by DeepSeek V4 Pro.</p>
        </div>

        <button
          onClick={handleResetChat}
          className="p-2 bg-white/5 hover:bg-red-500/10 text-gray-400 hover:text-red-400 border border-white/5 hover:border-red-500/20 rounded-xl transition-all"
          title="Reset Chat"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* CHAT BUBBLES CONTAINER */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-4 min-h-0 py-2">
        {messages.map((msg) => {
          const isAI = msg.sender === 'ai';
          return (
            <div 
              key={msg.id}
              className={`flex items-start gap-3.5 max-w-[85%] ${
                isAI ? '' : 'ml-auto flex-row-reverse'
              }`}
            >
              {/* Profile Avatar */}
              <div className={`h-8 w-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 select-none shadow-sm ${
                isAI 
                  ? 'bg-gradient-to-tr from-cyan-500 to-cyan-700 text-white' 
                  : 'bg-gradient-to-tr from-purple-500 to-purple-700 text-white'
              }`}>
                {isAI ? 'AI' : 'ME'}
              </div>

              {/* Message Bubble */}
              <div className={`rounded-2xl p-4 text-sm leading-relaxed border relative group transition-all duration-300 ${
                isAI 
                  ? `glass-panel border-white/5 text-gray-200 ${speakingMessageId === msg.id ? 'ring-1 ring-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.15)] bg-cyan-950/10' : ''}` 
                  : 'bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border-cyan-500/20 text-cyan-200'
              }`}>
                <div className="flex justify-between items-start gap-4">
                  <p className="whitespace-pre-line flex-1 text-left">{msg.message}</p>
                  {isAI && (
                    <button
                      onClick={() => handleToggleSpeech(msg)}
                      className={`p-1.5 rounded-lg border transition-all shrink-0 hover:scale-105 ${
                        speakingMessageId === msg.id
                          ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                          : 'bg-white/5 border-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                      }`}
                      title={speakingMessageId === msg.id ? "Stop Voice Playback" : "Speak Message"}
                    >
                      {speakingMessageId === msg.id ? (
                        <VolumeX className="h-3.5 w-3.5 animate-pulse" />
                      ) : (
                        <Volume2 className="h-3.5 w-3.5" />
                      )}
                    </button>
                  )}
                </div>
                <span className="text-[9px] text-gray-500 block text-right mt-1.5 font-medium">
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          );
        })}

        {/* TYPING LOADER */}
        {isTyping && (
          <div className="flex items-start gap-3 max-w-[85%]">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-cyan-700 flex items-center justify-center font-bold text-white text-xs shrink-0">
              AI
            </div>
            <div className="glass-panel border-white/5 rounded-2xl p-4 flex items-center gap-1">
              <span className="h-2 w-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="h-2 w-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="h-2 w-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* QUICK SUGGESTIONS CONTAINER (only visible when message logs are small or to kickstart chat) */}
      {messages.length <= 2 && !isTyping && (
        <div className="space-y-2">
          <p className="text-gray-400 text-xs flex items-center gap-1.5 font-semibold px-1">
            <MessageCircleQuestion className="h-3.5 w-3.5 text-cyan-400" />
            Suggested questions
          </p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                onClick={() => handleSendMessage(prompt)}
                className="px-3.5 py-2 text-xs text-left bg-white/5 border border-white/10 hover:border-cyan-500/30 hover:bg-white/8 rounded-xl text-gray-300 transition-all"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* CHAT INPUT BAR */}
      <form 
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage(inputText);
        }}
        className="glass-panel border-white/10 rounded-2xl p-3 flex gap-2.5 items-center shrink-0 shadow-lg"
      >
        <input 
          type="text" 
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Ask about workouts, macros, protein goals, or form advice..."
          disabled={isTyping}
          className="flex-1 bg-[#0b0e14]/50 border border-white/5 focus:border-cyan-500 rounded-xl px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-gray-500"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || isTyping}
          className="h-11 w-11 shrink-0 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-500 text-white flex items-center justify-center hover:scale-[1.02] shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all disabled:opacity-50 disabled:hover:scale-100"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>

    </div>
  );
}
