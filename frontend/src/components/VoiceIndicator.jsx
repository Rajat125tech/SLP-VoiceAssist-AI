import React from 'react';
import { Mic, Radio, Square } from 'lucide-react';

export default function VoiceIndicator({ isListening, transcript, onStop }) {
  if (!isListening) return null;

  return (
    <div className="bg-gradient-to-r from-cyan-950/80 via-slate-900 to-indigo-950/80 border border-cyan-500/30 rounded-2xl p-4 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-200">
      <div className="flex items-center justify-between gap-4">
        
        {/* Animated Waveform & Status */}
        <div className="flex items-center gap-3.5">
          <div className="relative flex items-center justify-center">
            <span className="animate-ping absolute inline-flex h-9 w-9 rounded-full bg-rose-400 opacity-60"></span>
            <div className="relative p-2.5 rounded-full bg-rose-600 text-white shadow-lg glow-mic">
              <Mic className="w-5 h-5 animate-bounce" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
              <span className="text-xs font-bold text-rose-300 uppercase tracking-wider">
                Microphone Active – Listening...
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Speak into your microphone. Web Speech API is converting speech to text.
            </p>
          </div>
        </div>

        {/* Stop Button */}
        <button
          onClick={onStop}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition border border-slate-700 shadow"
        >
          <Square className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
          <span>Done</span>
        </button>

      </div>

      {/* Real-time Interim Recognized Speech */}
      {transcript && (
        <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-start gap-2">
          <Radio className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5 animate-pulse" />
          <div className="text-xs">
            <span className="text-slate-400 font-medium">Interim Speech Transcript: </span>
            <span className="text-cyan-300 font-medium italic">"{transcript}"</span>
          </div>
        </div>
      )}

      {/* Visual Audio Bars Animation */}
      <div className="flex items-center justify-center gap-1.5 mt-3 pt-2">
        <span className="w-1 bg-cyan-400 rounded-full animate-[pulse_0.6s_ease-in-out_infinite] h-3"></span>
        <span className="w-1 bg-cyan-400 rounded-full animate-[pulse_0.4s_ease-in-out_infinite] h-6"></span>
        <span className="w-1 bg-cyan-400 rounded-full animate-[pulse_0.8s_ease-in-out_infinite] h-4"></span>
        <span className="w-1 bg-cyan-400 rounded-full animate-[pulse_0.5s_ease-in-out_infinite] h-7"></span>
        <span className="w-1 bg-cyan-400 rounded-full animate-[pulse_0.7s_ease-in-out_infinite] h-5"></span>
        <span className="w-1 bg-cyan-400 rounded-full animate-[pulse_0.3s_ease-in-out_infinite] h-8"></span>
        <span className="w-1 bg-cyan-400 rounded-full animate-[pulse_0.6s_ease-in-out_infinite] h-4"></span>
        <span className="w-1 bg-cyan-400 rounded-full animate-[pulse_0.9s_ease-in-out_infinite] h-6"></span>
        <span className="w-1 bg-cyan-400 rounded-full animate-[pulse_0.4s_ease-in-out_infinite] h-2"></span>
      </div>

    </div>
  );
}
