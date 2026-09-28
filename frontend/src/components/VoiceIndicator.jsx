import React from 'react';
import { Mic, Radio, Check, Square } from 'lucide-react';

export default function VoiceIndicator({ isListening, transcript, onStop }) {
  if (!isListening) return null;

  return (
    <div className="bg-[#14121c]/95 border border-rose-500/30 rounded-2xl p-4 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2 duration-200">
      <div className="flex items-center justify-between gap-4">
        
        {/* Animated Waveform & Status */}
        <div className="flex items-center gap-3.5">
          <div className="relative flex items-center justify-center">
            <span className="animate-ping absolute inline-flex h-9 w-9 rounded-full bg-rose-500 opacity-50"></span>
            <div className="relative p-2.5 rounded-2xl bg-gradient-to-tr from-rose-600 to-pink-600 text-white shadow-lg glow-rose">
              <Mic className="w-5 h-5 animate-bounce" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
              <span className="text-xs font-bold text-rose-300 uppercase tracking-wider">
                Listening to Your Voice...
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Speak naturally. Web Speech API is converting your voice in real time.
            </p>
          </div>
        </div>

        {/* Done / Stop Button */}
        <button
          onClick={onStop}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition border border-white/10 shadow"
        >
          <Square className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
          <span>Finish Speaking</span>
        </button>

      </div>

      {/* Real-time Interim Recognized Speech */}
      {transcript && (
        <div className="mt-3 pt-3 border-t border-white/[0.08] flex items-start gap-2">
          <Radio className="w-4 h-4 text-violet-400 shrink-0 mt-0.5 animate-pulse" />
          <div className="text-xs">
            <span className="text-zinc-400 font-medium">Transcribing: </span>
            <span className="text-violet-200 font-medium italic">"{transcript}"</span>
          </div>
        </div>
      )}

      {/* Visual Audio Wave Equalizer Animation */}
      <div className="flex items-center justify-center gap-1.5 mt-3 pt-2">
        <span className="w-1 bg-gradient-to-t from-violet-500 to-rose-400 rounded-full animate-[pulse_0.6s_ease-in-out_infinite] h-3"></span>
        <span className="w-1 bg-gradient-to-t from-violet-500 to-rose-400 rounded-full animate-[pulse_0.4s_ease-in-out_infinite] h-6"></span>
        <span className="w-1 bg-gradient-to-t from-violet-500 to-rose-400 rounded-full animate-[pulse_0.8s_ease-in-out_infinite] h-4"></span>
        <span className="w-1 bg-gradient-to-t from-violet-500 to-rose-400 rounded-full animate-[pulse_0.5s_ease-in-out_infinite] h-7"></span>
        <span className="w-1 bg-gradient-to-t from-violet-500 to-rose-400 rounded-full animate-[pulse_0.7s_ease-in-out_infinite] h-5"></span>
        <span className="w-1 bg-gradient-to-t from-violet-500 to-rose-400 rounded-full animate-[pulse_0.3s_ease-in-out_infinite] h-8"></span>
        <span className="w-1 bg-gradient-to-t from-violet-500 to-rose-400 rounded-full animate-[pulse_0.6s_ease-in-out_infinite] h-4"></span>
        <span className="w-1 bg-gradient-to-t from-violet-500 to-rose-400 rounded-full animate-[pulse_0.9s_ease-in-out_infinite] h-6"></span>
        <span className="w-1 bg-gradient-to-t from-violet-500 to-rose-400 rounded-full animate-[pulse_0.4s_ease-in-out_infinite] h-2"></span>
      </div>

    </div>
  );
}
