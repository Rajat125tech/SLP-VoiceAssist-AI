import React, { useState } from 'react';
import { Bot, User, Mic, Volume2, VolumeX, Sparkles, ChevronDown, ChevronUp, Cpu, Copy, Check } from 'lucide-react';

export default function ChatMessage({ message, onSpeak, speakingId, onStopSpeak }) {
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [copied, setCopied] = useState(false);
  const isUser = message.sender === 'user';
  const isSpeaking = speakingId === message.id;

  const handleCopy = () => {
    navigator.clipboard.writeText(message.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Confidence styling
  const getConfidenceBadge = (conf) => {
    if (conf >= 0.70) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    if (conf >= 0.40) return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
  };

  const getConfidenceBarColor = (conf) => {
    if (conf >= 0.70) return 'bg-emerald-400';
    if (conf >= 0.40) return 'bg-amber-400';
    return 'bg-rose-400';
  };

  return (
    <div className={`flex gap-3.5 my-3.5 transition-all ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      
      {/* Avatar */}
      <div className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${
        isUser 
          ? 'bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-violet-950/40 ring-1 ring-white/10' 
          : 'bg-gradient-to-tr from-zinc-800 to-zinc-900 border border-white/10 text-violet-400 shadow-black/50'
      }`}>
        {isUser ? (
          message.isVoice ? <Mic className="w-4 h-4 text-violet-100" /> : <User className="w-4 h-4 text-violet-100" />
        ) : (
          <Sparkles className="w-4 h-4 text-violet-400" />
        )}
      </div>

      {/* Message Bubble Container */}
      <div className={`max-w-[85%] sm:max-w-[78%] space-y-1.5 ${isUser ? 'items-end' : 'items-start'}`}>
        
        {/* Label Header */}
        <div className={`flex items-center gap-2 text-[11px] font-medium tracking-wide ${
          isUser ? 'justify-end text-zinc-400' : 'text-zinc-400'
        }`}>
          {isUser ? (
            <>
              <span className="text-violet-300 font-semibold">{message.isVoice ? 'Voice Query' : 'You'}</span>
              <span className="text-[10px] text-zinc-500">{message.timestamp}</span>
            </>
          ) : (
            <>
              <span className="text-zinc-300 font-semibold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                VoiceAssist AI
              </span>
              <span className="text-[10px] text-zinc-500">{message.timestamp}</span>
            </>
          )}
        </div>

        {/* Bubble */}
        <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-xl transition-all ${
          isUser 
            ? 'bg-gradient-to-br from-violet-600 via-violet-700 to-indigo-700 text-white rounded-tr-sm shadow-violet-950/30' 
            : 'bg-[#151520] border border-white/[0.08] text-zinc-200 rounded-tl-sm hover:border-white/[0.12]'
        }`}>
          <p className="whitespace-pre-wrap selection:bg-white/20 selection:text-white">{message.text}</p>

          {/* Deep Learning Classification Metadata Badge (For Assistant Responses) */}
          {!isUser && message.intent && (
            <div className="mt-3.5 pt-3 border-t border-white/[0.07] space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                
                {/* Intent Tag */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Intent:</span>
                  <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-lg bg-violet-500/10 text-violet-300 border border-violet-500/20">
                    #{message.intent}
                  </span>
                </div>

                {/* Confidence Meter */}
                {message.confidence !== undefined && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Conf:</span>
                    <span className={`font-mono text-xs font-semibold px-2 py-0.5 rounded-md border ${getConfidenceBadge(message.confidence)}`}>
                      {(message.confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>

              {/* Confidence Progress Bar */}
              {message.confidence !== undefined && (
                <div className="w-full bg-zinc-800/80 h-1 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 rounded-full ${getConfidenceBarColor(message.confidence)}`}
                    style={{ width: `${Math.min(message.confidence * 100, 100)}%` }}
                  />
                </div>
              )}

              {/* Action Buttons: TTS Audio & Softmax Breakdown */}
              <div className="flex items-center justify-between pt-1 text-xs">
                
                {/* Speaker TTS Button */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => isSpeaking ? onStopSpeak() : onSpeak(message.text, message.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                      isSpeaking 
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse' 
                        : 'bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-300 hover:text-white border border-white/[0.08]'
                    }`}
                    title={isSpeaking ? "Stop Speaking" : "Play vocal response"}
                  >
                    {isSpeaking ? (
                      <>
                        <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                        <span>Stop Voice</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-3.5 h-3.5 text-violet-400" />
                        <span>Listen</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleCopy}
                    className="p-1 rounded-lg bg-zinc-800/50 hover:bg-zinc-700/60 text-zinc-400 hover:text-white border border-white/[0.05] transition"
                    title="Copy text"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Top Alternative Intents Toggle */}
                {message.topIntents && message.topIntents.length > 1 && (
                  <button
                    onClick={() => setShowAlternatives(!showAlternatives)}
                    className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-violet-300 transition"
                  >
                    <Cpu className="w-3 h-3 text-violet-400" />
                    <span>Neural Scores</span>
                    {showAlternatives ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                )}
              </div>

              {/* Softmax Distribution Drawer */}
              {showAlternatives && message.topIntents && (
                <div className="mt-2 p-2.5 rounded-xl bg-zinc-950/80 border border-white/[0.07] text-[11px] font-mono space-y-1.5 animate-in fade-in duration-150">
                  <div className="text-[10px] uppercase text-zinc-500 font-bold tracking-wider">Posterior Class Distribution:</div>
                  {message.topIntents.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-zinc-300">
                      <span>#{item.intent}</span>
                      <span className="text-violet-400 font-semibold">{(item.probability * 100).toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              )}

            </div>
          )}

        </div>

      </div>
    </div>
  );
}
