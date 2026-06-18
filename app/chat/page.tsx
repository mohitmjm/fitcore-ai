'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Send,
  Trash2,
  BrainCircuit,
  MessageCircleQuestion,
  Volume2,
  VolumeX,
} from 'lucide-react';

interface CoachMessage {
  _id?: string;
  role: 'user' | 'coach';
  text: string;
  createdAt?: string;
}

const SUGGESTED_PROMPTS = [
  'How can I hit my protein goal today?',
  'What is the best way to improve squat form?',
  'Suggest a simple 500kcal post-workout meal',
  'How do I break a strength plateau?',
];

let tempId = 0;

export default function ChatPage() {
  const [messages, setMessages] = useState<CoachMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/coach');
      if (!res.ok) return;
      const json = (await res.json()) as { data?: { messages: CoachMessage[] } };
      setMessages(json.data?.messages ?? []);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel();
    };
  }, []);

  function handleToggleSpeech(msg: CoachMessage) {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    const synth = window.speechSynthesis;
    const id = msg._id ?? msg.text;
    if (speakingId === id) {
      synth.cancel();
      setSpeakingId(null);
      return;
    }
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(msg.text);
    utterance.lang = 'en-US';
    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);
    setSpeakingId(id);
    synth.speak(utterance);
  }

  async function handleSendMessage(text: string) {
    if (!text.trim() || isTyping) return;
    const userMsg: CoachMessage = { _id: `temp-${tempId++}`, role: 'user', text, createdAt: new Date().toISOString() };
    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);
    try {
      const res = await fetch('/api/v1/coach', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });
      const json = (await res.json()) as { data?: { reply: string }; error?: { message: string } };
      const reply = json.data?.reply ?? json.error?.message ?? 'Sorry, I could not respond.';
      setMessages((prev) => [
        ...prev,
        { _id: `temp-${tempId++}`, role: 'coach', text: reply, createdAt: new Date().toISOString() },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { _id: `temp-${tempId++}`, role: 'coach', text: 'Something went wrong. Please try again.', createdAt: new Date().toISOString() },
      ]);
    } finally {
      setIsTyping(false);
    }
  }

  async function handleResetChat() {
    if (!confirm('Clear your conversation history?')) return;
    await fetch('/api/v1/coach', { method: 'DELETE' });
    setMessages([]);
  }

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] md:h-[calc(100vh-6rem)] animate-[fadeIn_0.4s_ease-out] relative space-y-4">
      <div className="flex justify-between items-center border-b border-[rgba(255,255,255,0.06)] pb-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <BrainCircuit className="h-7 w-7 text-cyan-400" />
            AI Coach <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">Desk</span>
          </h1>
          <p className="text-gray-400 text-xs mt-1">Your coach remembers your goals, plan, and progress.</p>
        </div>

        <button
          onClick={handleResetChat}
          className="p-2 bg-white/5 hover:bg-red-500/10 text-gray-400 hover:text-red-400 border border-white/5 hover:border-red-500/20 rounded-xl transition-all"
          title="Reset Chat"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pr-1 space-y-4 min-h-0 py-2">
        {messages.length === 0 && !isTyping && (
          <div className="glass-panel border-white/5 rounded-2xl p-4 text-sm text-gray-300 max-w-[85%]">
            Hi! I&apos;m your FitCore AI coach. Ask me anything about your training, nutrition, or how to stay consistent.
          </div>
        )}
        {messages.map((msg) => {
          const isAI = msg.role === 'coach';
          const id = msg._id ?? msg.text;
          return (
            <div key={id} className={`flex items-start gap-3.5 max-w-[85%] ${isAI ? '' : 'ml-auto flex-row-reverse'}`}>
              <div
                className={`h-8 w-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 select-none shadow-sm ${
                  isAI ? 'bg-gradient-to-tr from-cyan-500 to-cyan-700 text-white' : 'bg-gradient-to-tr from-purple-500 to-purple-700 text-white'
                }`}
              >
                {isAI ? 'AI' : 'ME'}
              </div>
              <div
                className={`rounded-2xl p-4 text-sm leading-relaxed border relative group transition-all duration-300 ${
                  isAI
                    ? `glass-panel border-white/5 text-gray-200 ${speakingId === id ? 'ring-1 ring-cyan-500/50 bg-cyan-950/10' : ''}`
                    : 'bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border-cyan-500/20 text-cyan-200'
                }`}
              >
                <div className="flex justify-between items-start gap-4">
                  <p className="whitespace-pre-line flex-1 text-left">{msg.text}</p>
                  {isAI && (
                    <button
                      onClick={() => handleToggleSpeech(msg)}
                      className={`p-1.5 rounded-lg border transition-all shrink-0 hover:scale-105 ${
                        speakingId === id
                          ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                          : 'bg-white/5 border-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                      }`}
                      title={speakingId === id ? 'Stop' : 'Speak'}
                    >
                      {speakingId === id ? <VolumeX className="h-3.5 w-3.5 animate-pulse" /> : <Volume2 className="h-3.5 w-3.5" />}
                    </button>
                  )}
                </div>
                {msg.createdAt && (
                  <span className="text-[9px] text-gray-500 block text-right mt-1.5 font-medium">
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>
            </div>
          );
        })}

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

      {messages.length <= 1 && !isTyping && (
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
