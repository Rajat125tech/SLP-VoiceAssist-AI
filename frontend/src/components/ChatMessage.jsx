import React, { useState } from 'react';
import { Bot, User, Mic, Volume2, VolumeX, Sparkles, ChevronDown, ChevronUp, Cpu } from 'lucide-react';

export default function ChatMessage({ message, onSpeak, speakingId, onStopSpeak }) {
  const [showAlternatives, setShowAlternatives] = useState(false);
  const isUser = message.sender === 'user';
  const isSpeaking = speakingId === message.id;

  // Confidence color mapper
  const getConfidenceColor = (conf) => {
    if (conf >= 0.70) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    if (conf >= 0.40) return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
  };

  const getConfidenceBarColor = (conf) => {
    if (conf >= 0.70) return 'bg-emerald-500';
    if (conf >= 0.40) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  return (
    <div className={`flex gap-3.5 my-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      
      {/* Avatar */}
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-md ${
        isUser 
          ? 'bg-gradient-to-tr from-cyan-600 to-blue-600 text-white' 
          : 'bg-gradient-to-tr from-indigo-600 to-purple-600 text-white'
      }`}>
        {isUser ? (
          message.isVoice ? <Mic className="w-4 h-4" /> : <User className="w-4 h-4" />
        ) : (
          <Bot className="w-4.5 h-4.5" />
        )}
      </div>

      {/* Message Bubble Container */}
      <div className={`max-w-[85%] sm:max-w-[75%] space-y-2 ${isUser ? 'items-end' : 'items-start'}`}>
        
        {/* Label Header */}
        <div className={`flex items-center gap-2 text-[11px] font-semibold tracking-wider uppercase ${
          isUser ? 'justify-end text-cyan-400' : 'text-indigo-300'
        }`}>
          {isUser ? (
            <>
              <span>{message.isVoice ? 'Recognized User Speech' : 'User Input'}</span>
              <span className="text-[10px] text-slate-500 font-normal">{message.timestamp}</span>
            </>
          ) : (
            <>
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-cyan-400" />
                Chatbot Response
              </span>
              <span className="text-[10px] text-slate-500 font-normal">{message.timestamp}</span>
            </>
          )}
        </div>

        {/* Bubble */}
        <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-lg ${
          isUser 
            ? 'bg-gradient-to-br from-cyan-900/60 to-blue-900/70 border border-cyan-500/30 text-white rounded-tr-none' 
            : 'bg-slate-900/90 border border-slate-800 text-slate-200 rounded-tl-none'
        }`}>
          <p className="whitespace-pre-wrap">{message.text}</p>

          {/* Deep Learning Classification Metadata Badge (For Assistant Responses) */}
          {!isUser && message.intent && (
            <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                
                {/* Intent Tag */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-400 font-medium">Predicted Intent:</span>
                  <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {message.intent}
                  </span>
                </div>

                {/* Confidence Meter */}
                {message.confidence !== undefined && (
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400 font-medium">Confidence:</span>
                    <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded border ${getConfidenceColor(message.confidence)}`}>
                      {(message.confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>

              {/* Confidence Progress Bar */}
              {message.confidence !== undefined && (
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 rounded-full ${getConfidenceBarColor(message.confidence)}`}
                    style={{ width: `${Math.min(message.confidence * 100, 100)}%` }}
                  />
                </div>
              )}

              {/* Action Buttons: Text to Speech & Alternatives */}
              <div className="flex items-center justify-between pt-1 text-xs">
                
                {/* Speaker TTS Button */}
                <button
                  onClick={() => isSpeaking ? onStopSpeak() : onSpeak(message.text, message.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition ${
                    isSpeaking 
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse' 
                      : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-700/60'
                  }`}
                  title={isSpeaking ? "Stop Speaking" : "Listen to Chatbot Response (Speech Synthesis)"}
                >
                  {isSpeaking ? (
                    <>
                      <VolumeX className="w-3.5 h-3.5" />
                      <span>Stop Voice</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Speak</span>
                    </>
                  )}
                </button>

                {/* Top Alternative Intents Toggle */}
                {message.topIntents && message.topIntents.length > 1 && (
                  <button
                    onClick={() => setShowAlternatives(!showAlternatives)}
                    className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-cyan-300 transition"
                  >
                    <Cpu className="w-3 h-3 text-cyan-400" />
                    <span>Softmax Distribution</span>
                    {showAlternatives ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                )}
              </div>

              {/* Softmax Distribution Drawer */}
              {showAlternatives && message.topIntents && (
                <div className="mt-2 p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 text-[11px] font-mono space-y-1.5 animate-in fade-in duration-150">
                  <div className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">Top Candidate Intents:</div>
                  {message.topIntents.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-slate-300">
                      <span>#{item.intent}</span>
                      <span className="text-cyan-400 font-semibold">{(item.probability * 100).toFixed(1)}%</span>
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
