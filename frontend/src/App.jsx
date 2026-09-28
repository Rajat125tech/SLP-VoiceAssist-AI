import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, MicOff, Send, Volume2, VolumeX, Sparkles, Brain, Info, 
  RotateCcw, Server, Activity, ShieldCheck, AlertCircle, 
  HelpCircle, MessageSquare, Terminal, ExternalLink, Settings, Play,
  ChevronRight, ChevronDown, ChevronUp, Layers, BarChart2, CheckCircle2, 
  Zap, Compass, Sliders, RefreshCw, X, Radio, MessageCircle, User, Cpu
} from 'lucide-react';
import ChatMessage from './components/ChatMessage';
import VoiceIndicator from './components/VoiceIndicator';
import ModelInfoModal from './components/ModelInfoModal';

// Default API URL from environment or fallback
const DEFAULT_API_URL = import.meta.env.VITE_API_URL || 'https://voiceassist-ai-backend.onrender.com';

// List of scary, raspy, or novelty legacy system voices to strictly avoid
const CREEPY_LEGACY_VOICES = [
  'Albert', 'Bad News', 'Bahh', 'Bells', 'Boing', 'Bubbles', 'Cellos',
  'Fred', 'Good News', 'Organ', 'Ralph', 'Trinoids', 'Whisper', 'Wobble', 'Zarvox', 'Deranged', 'Hysterical'
];

// Helper to choose a warm, friendly, natural assistant voice
const findBestFriendlyVoice = (voices) => {
  if (!voices || voices.length === 0) return null;

  const safeVoices = voices.filter(v => 
    !CREEPY_LEGACY_VOICES.some(scary => v.name.toLowerCase().includes(scary.toLowerCase()))
  );

  const priorityList = [
    'Google US English',
    'Samantha (Enhanced)',
    'Samantha',
    'Karen (Enhanced)',
    'Karen',
    'Victoria (Enhanced)',
    'Victoria',
    'Siri',
    'Daniel',
    'Alex',
    'Microsoft Jenny',
    'Microsoft Zira',
    'en-US',
    'en_US'
  ];

  for (const preferred of priorityList) {
    const match = safeVoices.find(v => 
      v.name.toLowerCase().includes(preferred.toLowerCase()) || 
      v.lang.toLowerCase().includes(preferred.toLowerCase())
    );
    if (match) return match;
  }

  const anyEnglish = safeVoices.find(v => v.lang.startsWith('en'));
  if (anyEnglish) return anyEnglish;

  return safeVoices.length > 0 ? safeVoices[0] : voices[0];
};

// Categorized domain prompts for the Topic Explorer drawer
const DOMAIN_CATEGORIES = [
  {
    id: 'deep_learning',
    title: 'Deep Learning & Neural Networks',
    icon: Brain,
    color: 'text-violet-400',
    bgColor: 'bg-violet-500/10',
    borderColor: 'border-violet-500/20',
    prompts: [
      { label: "Deep Learning basics", query: "Can you explain how deep neural networks work?" },
      { label: "Forward vs Backprop", query: "Explain forward pass and backpropagation in deep learning" },
      { label: "BiLSTM architecture", query: "Why use Bidirectional LSTM with Global Max Pooling for text?" },
      { label: "Word Embeddings", query: "How do neural embedding layers represent words?" }
    ]
  },
  {
    id: 'speech_processing',
    title: 'Speech Recognition (ASR)',
    icon: Mic,
    color: 'text-pink-400',
    bgColor: 'bg-pink-500/10',
    borderColor: 'border-pink-500/20',
    prompts: [
      { label: "How ASR works", query: "How does speech to text conversion work in ASR?" },
      { label: "Acoustic Modeling & MFCCs", query: "What are MFCCs and acoustic feature extraction in speech?" },
      { label: "Web Speech API", query: "How does the client-side Web Speech API capture audio?" }
    ]
  },
  {
    id: 'nlp',
    title: 'NLP & Intent Classification',
    icon: MessageSquare,
    color: 'text-indigo-400',
    bgColor: 'bg-indigo-500/10',
    borderColor: 'border-indigo-500/20',
    prompts: [
      { label: "NLP & Tokenization", query: "Explain natural language processing and tokenization" },
      { label: "Softmax Classification", query: "How does this chatbot classify user intents using Softmax?" },
      { label: "Sequence Padding", query: "Why is pad_sequences max_len=25 used before LSTM layers?" }
    ]
  },
  {
    id: 'academics',
    title: 'Academics & Placements',
    icon: CheckCircle2,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/20',
    prompts: [
      { label: "Campus Recruitment prep", query: "What should I study before campus recruitment and coding rounds?" },
      { label: "Semester Exams advice", query: "How can I score higher marks in semester exams and vivas?" },
      { label: "Capstone Projects structure", query: "How should we organize software architecture in capstone reports?" },
      { label: "Study Timetable", query: "Can you help me organize a daily engineering study timetable?" }
    ]
  },
  {
    id: 'ood_testing',
    title: 'Fallback & Robustness',
    icon: ShieldCheck,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/20',
    prompts: [
      { label: "Out of domain test", query: "What is the capital of France?" },
      { label: "Weather test", query: "Tell me today's weather forecast." },
      { label: "Random noise test", query: "zorp flim flam interstellar potato flying 98765" }
    ]
  }
];

export default function App() {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [backendStatus, setBackendStatus] = useState('checking'); // 'online' | 'offline' | 'checking'
  const [backendUrl, setBackendUrl] = useState(() => {
    return localStorage.getItem('voiceassist_backend_url') || DEFAULT_API_URL;
  });

  const handleUrlChange = (newUrl) => {
    setBackendUrl(newUrl);
    localStorage.setItem('voiceassist_backend_url', newUrl);
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modelMetadata, setModelMetadata] = useState(null);
  const [speechError, setSpeechError] = useState(null);
  const [speakingId, setSpeakingId] = useState(null);
  const [showConfig, setShowConfig] = useState(false);

  // Drawer Toggles
  const [showExplorer, setShowExplorer] = useState(false);
  const [showTelemetry, setShowTelemetry] = useState(false);

  // Latest Prediction Telemetry State
  const [latestPrediction, setLatestPrediction] = useState(null);

  // Voice Customization State
  const [availableVoices, setAvailableVoices] = useState([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState(() => {
    return localStorage.getItem('voiceassist_preferred_voice') || '';
  });
  const [speechRate, setSpeechRate] = useState(1.0);
  const [speechPitch, setSpeechPitch] = useState(1.0);
  const [isPreviewSpeaking, setIsPreviewSpeaking] = useState(false);

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

  // Load browser speech synthesis voices
  useEffect(() => {
    if (!('speechSynthesis' in window)) return;

    const updateVoices = () => {
      const allVoices = window.speechSynthesis.getVoices();
      if (!allVoices || allVoices.length === 0) return;

      const cleanVoices = allVoices.filter(v => 
        !CREEPY_LEGACY_VOICES.some(scary => v.name.toLowerCase().includes(scary.toLowerCase()))
      );

      setAvailableVoices(cleanVoices.length > 0 ? cleanVoices : allVoices);

      const saved = localStorage.getItem('voiceassist_preferred_voice');
      if (saved && allVoices.some(v => v.name === saved)) {
        setSelectedVoiceName(saved);
      } else {
        const best = findBestFriendlyVoice(allVoices);
        if (best) {
          setSelectedVoiceName(best.name);
          localStorage.setItem('voiceassist_preferred_voice', best.name);
        }
      }
    };

    updateVoices();
    window.speechSynthesis.onvoiceschanged = updateVoices;

    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

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
          setSpeechError("Microphone access denied. Please grant permission in browser settings.");
        } else if (event.error === 'network') {
          setSpeechError("Network error during speech recognition.");
        } else if (event.error !== 'no-speech') {
          setSpeechError(`Speech recognition error: ${event.error}`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, [backendUrl]);

  // Toggle Speech Listening
  const toggleListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechError("Web Speech API is not supported in this browser. Please use Chrome, Edge, or Safari.");
      return;
    }

    setSpeechError(null);
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
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
    utterance.rate = speechRate;
    utterance.pitch = speechPitch;

    const voices = window.speechSynthesis.getVoices();
    const voiceToUse = voices.find(v => v.name === selectedVoiceName) || findBestFriendlyVoice(voices);
    if (voiceToUse) {
      utterance.voice = voiceToUse;
      utterance.lang = voiceToUse.lang || 'en-US';
    } else {
      utterance.lang = 'en-US';
    }

    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);

    window.speechSynthesis.speak(utterance);
  };

  // Preview Voice Sample
  const handlePreviewVoice = () => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    setIsPreviewSpeaking(true);

    const sampleText = "Hello! I am VoiceAssist AI, created by Rajat. How can I assist your speech and language processing studies today?";
    const utterance = new SpeechSynthesisUtterance(sampleText);
    utterance.rate = speechRate;
    utterance.pitch = speechPitch;

    const voices = window.speechSynthesis.getVoices();
    const voiceToUse = voices.find(v => v.name === selectedVoiceName) || findBestFriendlyVoice(voices);
    if (voiceToUse) {
      utterance.voice = voiceToUse;
      utterance.lang = voiceToUse.lang || 'en-US';
    }

    utterance.onend = () => setIsPreviewSpeaking(false);
    utterance.onerror = () => setIsPreviewSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const handleStopSpeak = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      setIsPreviewSpeaking(false);
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
      const startTime = performance.now();
      const response = await fetch(`${cleanUrl}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: query }),
      });

      const latencyMs = Math.round(performance.now() - startTime);

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const data = await response.json();

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
      setLatestPrediction({
        intent: data.intent,
        confidence: data.confidence,
        topIntents: data.top_intents,
        latencyMs: latencyMs,
        query: query,
        timestamp: botMsg.timestamp
      });
    } catch (err) {
      console.error("Inference Error:", err);
      let errorDetail = `Unable to reach the Deep Learning inference backend at ${backendUrl}.`;
      if (backendUrl.includes('onrender.com')) {
        errorDetail += ' If the Render backend was idling, it takes 30-50 seconds to wake up from cold start. Please wait a few moments and try again.';
      } else if (backendUrl.includes('localhost') || backendUrl.includes('127.0.0.1')) {
        errorDetail += ' Please ensure your local FastAPI backend is running (uvicorn main:app --reload inside backend/).';
      } else {
        errorDetail += ' Please verify the backend service is running and reachable.';
      }

      const errorMsg = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: errorDetail,
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
    setLatestPrediction(null);
    setInterimTranscript('');
  };

  return (
    <div className="flex flex-col h-screen w-full bg-[#09090e] text-zinc-100 font-sans overflow-hidden antialiased">
      
      {/* ============================================================ */}
      {/* TOP NAVBAR: Sleek, Aesthetic & Proudly Crediting Rajat */}
      {/* ============================================================ */}
      <header className="shrink-0 z-30 bg-[#0f0f16]/90 backdrop-blur-xl border-b border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3">
          
          {/* Logo, Title & Created By Rajat Badge */}
          <div className="flex items-center gap-3">
            <div className="relative p-2 rounded-2xl bg-gradient-to-tr from-violet-600 via-purple-600 to-indigo-600 text-white shadow-lg glow-violet">
              <Mic className="w-5 h-5" />
            </div>
            
            <div className="flex flex-col">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                  VoiceAssist <span className="bg-gradient-to-r from-violet-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">AI</span>
                </h1>
                
                {/* PROMINENT CREATED BY RAJAT PILL */}
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gradient-to-r from-violet-500/15 via-purple-500/15 to-pink-500/15 text-violet-300 border border-violet-500/30 shadow-sm">
                  <Sparkles className="w-3 h-3 text-violet-400 animate-pulse" />
                  <span>Created by Rajat</span>
                </span>

                <span className="hidden md:inline-flex text-[10px] font-medium px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-white/10">
                  SLP Lab Project
                </span>
              </div>
            </div>
          </div>

          {/* Action Controls & Navigation Toggles */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            
            {/* Topic Explorer Toggle */}
            <button
              onClick={() => setShowExplorer(!showExplorer)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition ${
                showExplorer 
                  ? 'bg-violet-500/20 text-violet-300 border-violet-500/40 shadow-sm'
                  : 'bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 border-white/[0.08]'
              }`}
              title="Explore Pre-trained Topic Prompts"
            >
              <Compass className="w-3.5 h-3.5 text-violet-400" />
              <span className="hidden sm:inline">Topics</span>
            </button>

            {/* Neural Telemetry Toggle */}
            <button
              onClick={() => setShowTelemetry(!showTelemetry)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition ${
                showTelemetry 
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                  : 'bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 border-white/[0.08]'
              }`}
              title="View Live Softmax Inference Telemetry"
            >
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Telemetry</span>
            </button>

            {/* Voice & Settings Toggle */}
            <button
              onClick={() => setShowConfig(!showConfig)}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-medium transition ${
                showConfig
                  ? 'bg-zinc-800 text-white border-white/20'
                  : 'bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 border-white/[0.08]'
              }`}
              title="Voice Persona & Audio Controls"
            >
              <Volume2 className="w-3.5 h-3.5 text-purple-400" />
              <span className="hidden md:inline">Voice & API</span>
            </button>

            {/* Backend Health Badge */}
            <div 
              onClick={() => setShowConfig(!showConfig)}
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-zinc-900/80 border border-white/[0.08] text-xs cursor-pointer hover:bg-zinc-800 transition"
              title="Click to inspect Backend API endpoint"
            >
              <span className={`w-2 h-2 rounded-full ${
                backendStatus === 'online' ? 'bg-emerald-400 animate-pulse' :
                backendStatus === 'checking' ? 'bg-amber-400 animate-ping' : 'bg-rose-400'
              }`} />
              <span className="text-zinc-400 text-[11px] font-medium">
                {backendStatus === 'online' ? 'Online' : backendStatus === 'checking' ? 'Connecting...' : 'Offline'}
              </span>
            </div>

            {/* Model Architecture Modal Trigger */}
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-violet-600/20 to-purple-600/20 hover:from-violet-600/30 hover:to-purple-600/30 text-violet-300 border border-violet-500/30 text-xs font-semibold transition"
              title="Inspect BiLSTM Neural Network Model Details"
            >
              <Brain className="w-3.5 h-3.5 text-violet-400" />
              <span className="hidden sm:inline">Model Info</span>
            </button>

            {/* Reset Chat */}
            {messages.length > 0 && (
              <button
                onClick={handleResetChat}
                className="p-1.5 sm:p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition border border-transparent hover:border-white/10"
                title="Clear Chat History"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}

          </div>

        </div>

        {/* Collapsible Voice & API Settings Banner */}
        {showConfig && (
          <div className="bg-[#12121a] border-t border-white/[0.08] px-4 sm:px-6 py-3.5 text-xs text-zinc-300 animate-in fade-in duration-150 space-y-3 shadow-2xl">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              
              {/* Voice Persona Dropdown */}
              <div className="flex items-center gap-2 flex-1 min-w-[260px]">
                <Volume2 className="w-4 h-4 text-violet-400 shrink-0" />
                <span className="font-semibold text-zinc-200">Voice:</span>
                <select
                  value={selectedVoiceName}
                  onChange={(e) => {
                    setSelectedVoiceName(e.target.value);
                    localStorage.setItem('voiceassist_preferred_voice', e.target.value);
                  }}
                  className="bg-[#09090e] border border-white/[0.08] rounded-xl px-2.5 py-1.5 text-xs text-violet-300 flex-1 focus:outline-none focus:border-violet-500 truncate"
                >
                  {availableVoices.length > 0 ? (
                    availableVoices.map((v) => (
                      <option key={v.name} value={v.name} className="bg-zinc-900 text-zinc-200">
                        {v.name} ({v.lang})
                      </option>
                    ))
                  ) : (
                    <option value="" className="bg-zinc-900 text-zinc-200">Default Natural Voice</option>
                  )}
                </select>
              </div>

              {/* Speed & Tone Selectors */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 bg-[#09090e] px-2.5 py-1.5 rounded-xl border border-white/[0.08]">
                  <span className="text-[11px] text-zinc-400">Speed:</span>
                  <select
                    value={speechRate}
                    onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                    className="bg-transparent text-zinc-200 text-xs focus:outline-none cursor-pointer"
                  >
                    <option value="0.9" className="bg-zinc-900">0.9x Relaxed</option>
                    <option value="1.0" className="bg-zinc-900">1.0x Normal</option>
                    <option value="1.1" className="bg-zinc-900">1.1x Brisk</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5 bg-[#09090e] px-2.5 py-1.5 rounded-xl border border-white/[0.08]">
                  <span className="text-[11px] text-zinc-400">Tone:</span>
                  <select
                    value={speechPitch}
                    onChange={(e) => setSpeechPitch(parseFloat(e.target.value))}
                    className="bg-transparent text-zinc-200 text-xs focus:outline-none cursor-pointer"
                  >
                    <option value="0.95" className="bg-zinc-900">Warm</option>
                    <option value="1.0" className="bg-zinc-900">Balanced</option>
                    <option value="1.1" className="bg-zinc-900">Bright</option>
                  </select>
                </div>

                {/* Preview Voice */}
                <button
                  type="button"
                  onClick={isPreviewSpeaking ? handleStopSpeak : handlePreviewVoice}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold transition text-xs shadow-sm ${
                    isPreviewSpeaking 
                      ? 'bg-rose-600 hover:bg-rose-500 text-white animate-pulse'
                      : 'bg-violet-600 hover:bg-violet-500 text-white'
                  }`}
                >
                  {isPreviewSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span>{isPreviewSpeaking ? 'Stop' : 'Test Voice'}</span>
                </button>
              </div>

            </div>

            {/* API Endpoint Configuration */}
            <div className="max-w-7xl mx-auto pt-2.5 border-t border-white/[0.06] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2 flex-1 min-w-[280px]">
                <Server className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-semibold text-zinc-300">Backend API:</span>
                <input
                  type="text"
                  value={backendUrl}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  placeholder="https://voiceassist-ai-backend.onrender.com"
                  className="bg-[#09090e] border border-white/[0.08] rounded-xl px-2.5 py-1 text-xs text-emerald-300 flex-1 font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    const renderUrl = 'https://voiceassist-ai-backend.onrender.com';
                    handleUrlChange(renderUrl);
                    checkHealth(renderUrl);
                  }}
                  className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-white/10 rounded-lg text-xs transition"
                >
                  Render Cloud
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleUrlChange('http://localhost:8000');
                    checkHealth('http://localhost:8000');
                  }}
                  className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-white/10 rounded-lg text-xs transition"
                >
                  Localhost:8000
                </button>
                <button
                  type="button"
                  onClick={() => checkHealth(backendUrl)}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold transition text-xs"
                >
                  Ping Server
                </button>
                <button
                  type="button"
                  onClick={() => setShowConfig(false)}
                  className="px-2.5 py-1 text-zinc-400 hover:text-white transition text-xs"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* ============================================================ */}
      {/* MAIN CONTAINER: Generous, Spacious & Aesthetic Chat Arena */}
      {/* ============================================================ */}
      <div className="flex-1 flex overflow-hidden w-full relative">
        
        {/* Subtle Ambient Violet-Emerald Backdrop Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-b from-violet-600/10 via-purple-600/5 to-transparent blur-3xl pointer-events-none" />

        {/* ============================================================ */}
        {/* SLIDE-OUT LEFT DRAWER: TOPIC & PROMPT BANK */}
        {/* ============================================================ */}
        {showExplorer && (
          <aside className="fixed inset-y-0 left-0 top-[53px] z-40 w-80 sm:w-96 bg-[#0f0f17]/95 backdrop-blur-2xl border-r border-white/[0.08] shadow-2xl flex flex-col animate-in slide-in-from-left duration-200">
            <div className="p-4 border-b border-white/[0.08] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-violet-400" />
                <h3 className="font-bold text-xs uppercase tracking-wider text-white">Domain Question Bank</h3>
              </div>
              <button 
                onClick={() => setShowExplorer(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
              <p className="text-[11px] text-zinc-400">
                Click any topic below to query the BiLSTM neural network instantly:
              </p>

              {DOMAIN_CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                return (
                  <div key={cat.id} className="space-y-1.5">
                    <div className="flex items-center gap-2 px-1 font-semibold text-zinc-300 text-xs">
                      <Icon className={`w-3.5 h-3.5 ${cat.color}`} />
                      <span>{cat.title}</span>
                    </div>
                    <div className="space-y-1">
                      {cat.prompts.map((p, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            handleSendMessage(p.query, false);
                            setShowExplorer(false);
                          }}
                          className="w-full text-left p-2.5 rounded-xl bg-zinc-900/70 hover:bg-zinc-800/90 border border-white/[0.05] hover:border-violet-500/30 text-zinc-300 hover:text-violet-200 transition group flex items-start justify-between gap-2 shadow-sm"
                        >
                          <span className="text-xs line-clamp-1">{p.label}</span>
                          <ChevronRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-violet-400 shrink-0 mt-0.5 transition group-hover:translate-x-0.5" />
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </aside>
        )}

        {/* ============================================================ */}
        {/* SLIDE-OUT RIGHT DRAWER: LIVE NEURAL TELEMETRY */}
        {/* ============================================================ */}
        {showTelemetry && (
          <aside className="fixed inset-y-0 right-0 top-[53px] z-40 w-80 sm:w-96 bg-[#0f0f17]/95 backdrop-blur-2xl border-l border-white/[0.08] shadow-2xl flex flex-col p-4 space-y-4 animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-xs uppercase tracking-wider text-white">Live Neural Telemetry</h3>
              </div>
              <button 
                onClick={() => setShowTelemetry(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {latestPrediction ? (
              <div className="space-y-4 overflow-y-auto text-xs">
                {/* Intent & Confidence */}
                <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-white/[0.06] space-y-2">
                  <div className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Classified Intent:</div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm font-bold text-violet-300 bg-violet-500/10 border border-violet-500/20 px-2.5 py-1 rounded-lg">
                      #{latestPrediction.intent}
                    </span>
                    <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded-md border ${
                      latestPrediction.confidence >= 0.70 ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' :
                      latestPrediction.confidence >= 0.50 ? 'text-amber-400 bg-amber-500/10 border-amber-500/30' :
                      'text-rose-400 bg-rose-500/10 border-rose-500/30'
                    }`}>
                      {(latestPrediction.confidence * 100).toFixed(1)}%
                    </span>
                  </div>

                  {/* Bar */}
                  <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden mt-2">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        latestPrediction.confidence >= 0.70 ? 'bg-emerald-400' :
                        latestPrediction.confidence >= 0.50 ? 'bg-amber-400' : 'bg-rose-400'
                      }`}
                      style={{ width: `${Math.min(latestPrediction.confidence * 100, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Softmax Candidates */}
                {latestPrediction.topIntents && (
                  <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-white/[0.06] space-y-2.5">
                    <div className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Posterior Class Probabilities:</div>
                    {latestPrediction.topIntents.slice(0, 4).map((item, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex items-center justify-between font-mono text-[11px] text-zinc-300">
                          <span>#{item.intent}</span>
                          <span className="text-violet-400 font-semibold">{(item.probability * 100).toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-zinc-800 h-1 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-violet-500 to-purple-400 rounded-full"
                            style={{ width: `${Math.min(item.probability * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Query details */}
                <div className="p-3 rounded-xl bg-zinc-900/50 border border-white/[0.05] text-[11px] text-zinc-400 space-y-1">
                  <div><strong className="text-zinc-300">Query:</strong> "{latestPrediction.query}"</div>
                  <div><strong className="text-zinc-300">Inference Latency:</strong> ~{latestPrediction.latencyMs} ms</div>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-zinc-500 space-y-2">
                <Brain className="w-8 h-8 text-zinc-600 mx-auto animate-pulse" />
                <p className="text-xs">Send a voice or text message to see live Softmax probabilities here.</p>
              </div>
            )}

            <button
              onClick={() => {
                setShowTelemetry(false);
                setIsModalOpen(true);
              }}
              className="mt-auto w-full py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs shadow-md transition"
            >
              View Full Model Architecture
            </button>
          </aside>
        )}

        {/* ============================================================ */}
        {/* CENTER CHAT ARENA: Spacious, Wide & Aesthetic */}
        {/* ============================================================ */}
        <main className="flex-1 flex flex-col h-full overflow-hidden relative z-10">
          
          {/* Scrollable Messages Stream */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="max-w-4xl mx-auto h-full flex flex-col">
              
              {messages.length === 0 ? (
                /* Sleek, Aesthetic, Uncluttered Welcome Hero */
                <div className="my-auto flex flex-col items-center justify-center text-center py-6 sm:py-10 space-y-6 animate-in fade-in duration-300">
                  
                  {/* Glowing AI Voice Orb */}
                  <div className="relative">
                    <div className="absolute -inset-3 rounded-full bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 opacity-40 blur-2xl animate-pulse" />
                    <div className="relative p-5 sm:p-6 rounded-3xl bg-[#14141f] border border-white/10 text-violet-400 shadow-2xl flex items-center justify-center">
                      <Brain className="w-10 h-10 sm:w-12 sm:h-12 text-violet-400" />
                    </div>
                  </div>

                  {/* Main Title & Authorship */}
                  <div className="space-y-2 max-w-xl">
                    <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                      VoiceAssist <span className="bg-gradient-to-r from-violet-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">AI</span>
                    </h2>

                    {/* PROMINENT CREATOR CITATION */}
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-violet-500/10 text-violet-300 border border-violet-500/25">
                      <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                      <span>Created by Rajat • Speech & Language Processing Lab</span>
                    </div>

                    <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed pt-1">
                      Voice-enabled conversational agent powered by client-side Speech Recognition, custom BiLSTM deep learning intent classification, and vocal synthesis.
                    </p>
                  </div>

                  {/* 3 Core Micro Badges */}
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                    <span className="px-3 py-1 rounded-xl bg-[#14141e] border border-white/[0.08] text-xs font-medium text-zinc-300 flex items-center gap-1.5">
                      <Mic className="w-3.5 h-3.5 text-pink-400" />
                      Web Speech ASR
                    </span>
                    <span className="px-3 py-1 rounded-xl bg-[#14141e] border border-white/[0.08] text-xs font-medium text-zinc-300 flex items-center gap-1.5">
                      <Brain className="w-3.5 h-3.5 text-violet-400" />
                      BiLSTM Neural Intent (139k params)
                    </span>
                    <span className="px-3 py-1 rounded-xl bg-[#14141e] border border-white/[0.08] text-xs font-medium text-zinc-300 flex items-center gap-1.5">
                      <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                      Natural TTS Voice
                    </span>
                  </div>

                  {/* Clean, Curated Prompt Starter Cards */}
                  <div className="w-full max-w-2xl pt-4 space-y-2.5">
                    <div className="text-[11px] uppercase tracking-wider font-bold text-zinc-500 flex items-center justify-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-violet-400" />
                      <span>Try Asking or Speaking:</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-left">
                      {[
                        { 
                          title: "Deep Learning & Neural Nets", 
                          query: "Can you explain how deep neural networks work?",
                          icon: Brain,
                          color: "text-violet-400"
                        },
                        { 
                          title: "Speech Recognition (ASR)", 
                          query: "How does speech to text conversion work in ASR?",
                          icon: Mic,
                          color: "text-pink-400"
                        },
                        { 
                          title: "Campus Placements & Prep", 
                          query: "What should I study before campus recruitment and coding rounds?",
                          icon: CheckCircle2,
                          color: "text-emerald-400"
                        },
                        { 
                          title: "Semester Exam Advice", 
                          query: "How can I score higher marks in semester exams and vivas?",
                          icon: Sparkles,
                          color: "text-amber-400"
                        }
                      ].map((card, idx) => {
                        const CardIcon = card.icon;
                        return (
                          <button
                            key={idx}
                            onClick={() => handleSendMessage(card.query, false)}
                            className="p-3.5 rounded-2xl bg-[#13131c]/80 hover:bg-[#191924] border border-white/[0.06] hover:border-violet-500/30 transition-all text-left flex items-center justify-between gap-3 group shadow-sm hover:shadow-violet-950/20"
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="p-2 rounded-xl bg-zinc-800/80 border border-white/5">
                                <CardIcon className={`w-4 h-4 ${card.color}`} />
                              </div>
                              <div>
                                <div className="text-xs font-semibold text-zinc-200 group-hover:text-white transition">
                                  {card.title}
                                </div>
                                <div className="text-[11px] text-zinc-500 line-clamp-1">
                                  {card.query}
                                </div>
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-violet-400 group-hover:translate-x-0.5 transition shrink-0" />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                </div>
              ) : (
                /* Active Message Stream */
                <div className="space-y-3 pb-6 flex-1">
                  {messages.map((msg) => (
                    <ChatMessage
                      key={msg.id}
                      message={msg}
                      onSpeak={handleSpeak}
                      speakingId={speakingId}
                      onStopSpeak={handleStopSpeak}
                    />
                  ))}

                  {/* Realtime Inference Spinner */}
                  {isLoading && (
                    <div className="flex items-center gap-3 text-zinc-400 text-xs p-3.5 rounded-2xl bg-[#14141e] border border-white/[0.08] w-fit animate-pulse shadow-lg my-2">
                      <Brain className="w-4 h-4 text-violet-400 animate-spin" />
                      <span>BiLSTM Neural Network analyzing sequence intent...</span>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              )}

            </div>
          </div>

          {/* ============================================================ */}
          {/* FLOATING INPUT DOCK: Clean, Aesthetic & Spacious */}
          {/* ============================================================ */}
          <div className="shrink-0 p-4 sm:p-5 bg-gradient-to-t from-[#09090e] via-[#09090e]/95 to-transparent space-y-2.5 z-20">
            
            {/* Interim Voice Visualizer */}
            <div className="max-w-4xl mx-auto">
              <VoiceIndicator
                isListening={isListening}
                transcript={interimTranscript}
                onStop={stopListening}
              />
            </div>

            {/* Error Banner */}
            {speechError && (
              <div className="max-w-4xl mx-auto p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between gap-3 animate-in fade-in">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{speechError}</span>
                </div>
                <button
                  onClick={() => setSpeechError(null)}
                  className="text-zinc-400 hover:text-white text-xs font-bold"
                >
                  ✕
                </button>
              </div>
            )}

            {/* The Main Input Dock Pill */}
            <div className="max-w-4xl mx-auto p-2 sm:p-2.5 rounded-2xl bg-[#12121b]/95 border border-white/[0.1] shadow-2xl backdrop-blur-2xl flex items-center gap-2.5 focus-within:border-violet-500/50 transition">
              
              {/* Glowing Microphone Button */}
              <button
                onClick={toggleListening}
                className={`p-3 rounded-xl font-bold transition flex items-center justify-center shadow-lg relative shrink-0 ${
                  isListening
                    ? 'bg-rose-600 hover:bg-rose-500 text-white glow-rose animate-pulse'
                    : 'bg-gradient-to-tr from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white glow-violet'
                }`}
                title={isListening ? "Listening... Click to stop" : "Click to Speak (Web Speech API)"}
              >
                {isListening ? (
                  <>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-xl bg-rose-400 opacity-40" />
                    <MicOff className="w-5 h-5 relative" />
                  </>
                ) : (
                  <Mic className="w-5 h-5" />
                )}
              </button>

              {/* Text Input Box */}
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
                placeholder={isListening ? "Listening to your voice..." : "Ask any question or click the mic to speak..."}
                disabled={isListening}
                className="flex-1 bg-transparent px-2 sm:px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none"
              />

              {/* Send Button */}
              <button
                onClick={() => handleSendMessage()}
                disabled={!inputText.trim() || isLoading}
                className="p-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-30 disabled:hover:bg-violet-600 text-white transition flex items-center justify-center shadow shrink-0"
                title="Send Message"
              >
                <Send className="w-4 h-4" />
              </button>

            </div>

            {/* Bottom Authorship Micro-bar */}
            <div className="max-w-4xl mx-auto flex items-center justify-between text-[11px] text-zinc-500 px-2 pt-0.5">
              <span className="flex items-center gap-1">
                <span>Created by <strong className="text-zinc-400 font-semibold">Rajat</strong></span>
                <span>•</span>
                <span>SLP Lab BiLSTM Pipeline</span>
              </span>
              <button
                onClick={() => setIsModalOpen(true)}
                className="hover:text-violet-300 underline transition"
              >
                Neural Architecture & Metrics
              </button>
            </div>

          </div>

        </main>

      </div>

      {/* ============================================================ */}
      {/* ACADEMIC MODEL INFO MODAL */}
      {/* ============================================================ */}
      <ModelInfoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        metadata={modelMetadata}
      />

    </div>
  );
}
