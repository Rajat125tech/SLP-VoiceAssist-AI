import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, MicOff, Send, Volume2, Sparkles, Brain, Info, 
  RotateCcw, Server, Activity, ShieldCheck, AlertCircle, 
  HelpCircle, MessageSquare, Terminal, ExternalLink 
} from 'lucide-react';
import ChatMessage from './components/ChatMessage';
import VoiceIndicator from './components/VoiceIndicator';
import ModelInfoModal from './components/ModelInfoModal';

// Default API URL from environment or fallback
const DEFAULT_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function App() {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [backendStatus, setBackendStatus] = useState('checking'); // 'online' | 'offline' | 'checking'
  const [backendUrl, setBackendUrl] = useState(DEFAULT_API_URL);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modelMetadata, setModelMetadata] = useState(null);
  const [speechError, setSpeechError] = useState(null);
  const [speakingId, setSpeakingId] = useState(null);
  const [showConfig, setShowConfig] = useState(false);

  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  // Check Backend Health & Fetch Model Metadata
  const checkHealth = async (url = backendUrl) => {
    try {
      setBackendStatus('checking');
      const cleanUrl = url.replace(/\/$/, "");
      const res = await fetch(`${cleanUrl}/health`);
      if (res.ok) {
        const data = await res.json();
        setBackendStatus('online');
        // Fetch model info
        try {
          const infoRes = await fetch(`${cleanUrl}/model-info`);
          if (infoRes.ok) {
            const infoData = await infoRes.json();
            setModelMetadata(infoData.model_metadata);
          }
        } catch (e) {
          console.warn("Could not fetch model info:", e);
        }
      } else {
        setBackendStatus('offline');
      }
    } catch (err) {
      console.warn("Backend offline or unreachable:", err);
      setBackendStatus('offline');
    }
  };

  useEffect(() => {
    checkHealth();
  }, [backendUrl]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, interimTranscript, isLoading]);

  // Setup Web Speech Recognition API
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setSpeechError(null);
        setInterimTranscript('');
      };

      recognition.onresult = (event) => {
        let currentInterim = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            currentInterim += transcript;
          }
        }

        setInterimTranscript(currentInterim);

        if (finalTranscript.trim()) {
          setIsListening(false);
          setInterimTranscript('');
          handleSendMessage(finalTranscript.trim(), true);
        }
      };

      recognition.onerror = (event) => {
        console.error("Speech Recognition Error:", event.error);
        setIsListening(false);
        setInterimTranscript('');
        if (event.error === 'not-allowed') {
          setSpeechError("Microphone permission was denied. Please allow microphone access in your browser settings.");
        } else if (event.error === 'no-speech') {
          setSpeechError("No speech was detected. Please try pressing the microphone and speaking again.");
        } else {
          setSpeechError(`Speech recognition notice: ${event.error}`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } else {
      setSpeechError("Web Speech API is not supported in this browser. Please use Chrome, Edge, or Safari for voice input.");
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Toggle Voice Input
  const toggleListening = () => {
    if (!recognitionRef.current) {
      setSpeechError("Web Speech API is not available on this device/browser.");
      return;
    }

    setSpeechError(null);
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      // Stop ongoing TTS before starting speech recognition
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
        setSpeakingId(null);
      }
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.warn("Recognition already started, restarting...", err);
        recognitionRef.current.stop();
        setTimeout(() => recognitionRef.current.start(), 200);
      }
    }
  };

  // Stop Listening Manually
  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      if (interimTranscript.trim()) {
        handleSendMessage(interimTranscript.trim(), true);
        setInterimTranscript('');
      }
    }
  };

  // Text-To-Speech (Speech Synthesis)
  const handleSpeak = (text, msgId) => {
    if (!('speechSynthesis' in window)) {
      alert("Speech Synthesis is not supported in your browser.");
      return;
    }

    window.speechSynthesis.cancel();
    setSpeakingId(msgId);

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.lang = 'en-US';

    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);

    window.speechSynthesis.speak(utterance);
  };

  const handleStopSpeak = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
    }
  };

  // Send Message to Backend Pipeline
  const handleSendMessage = async (textToSend, isVoice = false) => {
    const query = (textToSend || inputText).trim();
    if (!query || isLoading) return;

    setInputText('');
    setSpeechError(null);

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsgId = Date.now().toString();

    // 1. Append Recognized Speech / User Message
    const userMsg = {
      id: userMsgId,
      sender: 'user',
      text: query,
      isVoice: isVoice,
      timestamp: timestamp,
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const cleanUrl = backendUrl.replace(/\/$/, "");
      const response = await fetch(`${cleanUrl}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: query }),
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const data = await response.json();

      // 2. Append Chatbot Response with Predicted Intent and Confidence
      const botMsg = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: data.response,
        intent: data.intent,
        confidence: data.confidence,
        topIntents: data.top_intents,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error("Inference Error:", err);
      const errorMsg = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: `Unable to reach the Deep Learning inference backend at ${backendUrl}. If using Render, the backend server may take 30-50 seconds to spin up from cold sleep. Please verify the backend is running.`,
        intent: 'network_error',
        confidence: 0.0,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  // Reset Conversation
  const handleResetChat = () => {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setSpeakingId(null);
    setMessages([]);
    setInterimTranscript('');
  };

  // Suggested Prompts for Quick Testing
  const quickPrompts = [
    { label: "What is deep learning?", query: "What is deep learning?" },
    { label: "How does speech recognition work?", query: "How does speech recognition work in ASR?" },
    { label: "Explain natural language processing", query: "Explain natural language processing and tokenization" },
    { label: "Tips for campus placements", query: "How can I prepare for campus placements and coding rounds?" },
    { label: "How should I study for exams?", query: "How should I study for semester exams and vivas?" },
    { label: "Tell me about yourself", query: "Who are you and introduce yourself" },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 font-sans">
      
      {/* HEADER */}
      <header className="sticky top-0 z-30 bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          
          {/* Logo & Project Title */}
          <div className="flex items-center gap-3">
            <div className="relative p-2.5 rounded-2xl bg-gradient-to-tr from-cyan-600 to-indigo-600 text-white shadow-lg glow-cyan">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black tracking-tight text-white">
                  VoiceAssist AI
                </h1>
                <span className="hidden sm:inline-flex text-[11px] font-semibold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  SLP Lab Assessment
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Voice-Enabled Deep Learning Chatbot • BiLSTM Intent Classification
              </p>
            </div>
          </div>

          {/* Controls & Badges */}
          <div className="flex items-center gap-2">
            
            {/* Backend Status Dot */}
            <button
              onClick={() => setShowConfig(!showConfig)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-xs transition"
              title="Click to view/change Backend API URL"
            >
              <span className={`w-2 h-2 rounded-full ${
                backendStatus === 'online' ? 'bg-emerald-400 animate-pulse' :
                backendStatus === 'checking' ? 'bg-amber-400 animate-ping' : 'bg-rose-400'
              }`} />
              <span className="text-slate-300 font-medium hidden md:inline">
                {backendStatus === 'online' ? 'Backend Ready' : backendStatus === 'checking' ? 'Connecting...' : 'Offline'}
              </span>
            </button>

            {/* Model Info Button */}
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-semibold transition"
            >
              <Brain className="w-4 h-4" />
              <span className="hidden sm:inline">Model Info</span>
            </button>

            {/* Reset Chat */}
            <button
              onClick={handleResetChat}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Reset Chat Session"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

          </div>

        </div>

        {/* Backend URL Config Banner (Collapsible) */}
        {showConfig && (
          <div className="bg-slate-900 border-t border-slate-800 px-4 py-2.5 text-xs text-slate-300 animate-in fade-in duration-150">
            <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-1 min-w-[280px]">
                <Server className="w-4 h-4 text-cyan-400 shrink-0" />
                <span className="font-semibold text-white">Backend API URL:</span>
                <input
                  type="text"
                  value={backendUrl}
                  onChange={(e) => setBackendUrl(e.target.value)}
                  placeholder="http://localhost:8000 or https://your-backend.onrender.com"
                  className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-cyan-300 flex-1 font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => checkHealth(backendUrl)}
                  className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-semibold transition text-xs"
                >
                  Test Connection
                </button>
                <button
                  onClick={() => setShowConfig(false)}
                  className="px-2 py-1 text-slate-400 hover:text-white"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* MAIN CHAT CONTENT */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6 flex flex-col justify-between">
        
        {/* Messages List or Empty Welcome State */}
        <div className="flex-1 overflow-y-auto space-y-4">
          
          {messages.length === 0 ? (
            <div className="py-8 sm:py-12 flex flex-col items-center text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
              
              {/* AI Avatar */}
              <div className="relative">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-cyan-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-2xl glow-cyan">
                  <Brain className="w-10 h-10 animate-pulse" />
                </div>
                <div className="absolute -bottom-2 -right-2 px-2.5 py-0.5 rounded-full bg-slate-900 border border-cyan-500/40 text-[10px] font-mono text-cyan-300 font-bold">
                  BiLSTM AI
                </div>
              </div>

              {/* Welcome Headlines */}
              <div className="max-w-lg space-y-2">
                <h2 className="text-2xl sm:text-3xl font-black text-white">
                  "How can I help you today?"
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  I am <strong className="text-cyan-400">VoiceAssist AI</strong>, an end-to-end academic voice assistant. 
                  Speak using your microphone or type a question to test deep learning intent classification!
                </p>
              </div>

              {/* Academic Highlights Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-xl text-left">
                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs">
                    <Mic className="w-3.5 h-3.5" />
                    <span>1. Speech to Text</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Browser Web Speech ASR captures acoustic voice input in real-time.
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs">
                    <Brain className="w-3.5 h-3.5" />
                    <span>2. Deep Learning</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Bidirectional LSTM neural network classifies user intent with confidence scoring.
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="flex items-center gap-2 text-purple-400 font-bold text-xs">
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>3. Speech Synthesis</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Web Speech Synthesis API vocalizes the chatbot's generated responses.
                  </p>
                </div>
              </div>

              {/* Quick Prompt Chips */}
              <div className="w-full max-w-xl space-y-2 pt-2">
                <div className="text-[11px] uppercase font-bold tracking-wider text-slate-500">
                  Sample Evaluator Test Questions:
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                  {quickPrompts.map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(prompt.query, false)}
                      className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 text-xs border border-slate-800 hover:border-cyan-500/40 transition shadow-sm"
                    >
                      {prompt.label}
                    </button>
                  ))}
                </div>
              </div>

            </div>
          ) : (
            <div className="space-y-4 pb-4">
              {messages.map((msg) => (
                <ChatMessage
                  key={msg.id}
                  message={msg}
                  onSpeak={handleSpeak}
                  speakingId={speakingId}
                  onStopSpeak={handleStopSpeak}
                />
              ))}

              {/* Loading Indicator */}
              {isLoading && (
                <div className="flex items-center gap-3 text-slate-400 text-xs p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80 w-fit animate-pulse">
                  <Brain className="w-4 h-4 text-cyan-400 animate-spin" />
                  <span>Bidirectional LSTM Neural Network is analyzing intent...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}

        </div>

        {/* VOICE & INPUT CONTROLS SECTION */}
        <div className="sticky bottom-0 pt-4 bg-gradient-to-t from-slate-950 via-slate-950 to-transparent space-y-3">
          
          {/* Active Voice Listening Visualizer */}
          <VoiceIndicator
            isListening={isListening}
            transcript={interimTranscript}
            onStop={stopListening}
          />

          {/* Speech Error Banner */}
          {speechError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between gap-3 animate-in fade-in duration-150">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{speechError}</span>
              </div>
              <button
                onClick={() => setSpeechError(null)}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            </div>
          )}

          {/* Large Microphone & Input Bar */}
          <div className="p-2 sm:p-3 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-lg flex items-center gap-2.5">
            
            {/* Large Microphone Button */}
            <button
              onClick={toggleListening}
              className={`p-3.5 rounded-xl font-bold transition flex items-center justify-center shadow-lg relative ${
                isListening
                  ? 'bg-rose-600 hover:bg-rose-500 text-white glow-mic animate-pulse'
                  : 'bg-gradient-to-tr from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white glow-cyan'
              }`}
              title={isListening ? "Listening... Click to finish speaking" : "Click to Speak (Web Speech Recognition)"}
            >
              {isListening ? (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-xl bg-rose-400 opacity-40"></span>
                  <MicOff className="w-5 h-5 relative" />
                </>
              ) : (
                <Mic className="w-5 h-5" />
              )}
            </button>

            {/* Text Input Box (Fallback & Typing Support) */}
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder={isListening ? "Listening to your voice..." : "Click mic to speak, or type your question here..."}
              disabled={isListening}
              className="flex-1 bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
            />

            {/* Send Button */}
            <button
              onClick={() => handleSendMessage()}
              disabled={!inputText.trim() || isLoading}
              className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-cyan-400 hover:text-cyan-300 transition flex items-center justify-center shadow"
              title="Send Typed Message"
            >
              <Send className="w-4 h-4" />
            </button>

          </div>

          {/* Hint bar */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 px-2 pb-1">
            <span>Speech recognition via Web Speech API • Model: BiLSTM + MaxPooling (139k params)</span>
            <button
              onClick={() => setIsModalOpen(true)}
              className="hover:text-cyan-400 underline transition"
            >
              View Model Architecture & Metrics
            </button>
          </div>

        </div>

      </main>

      {/* ACADEMIC MODEL INFO MODAL */}
      <ModelInfoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        metadata={modelMetadata}
      />

    </div>
  );
}
