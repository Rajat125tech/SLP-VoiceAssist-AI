import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, MicOff, Send, Volume2, VolumeX, Sparkles, Brain, Info, 
  RotateCcw, Server, Activity, ShieldCheck, AlertCircle, 
  HelpCircle, MessageSquare, Terminal, ExternalLink, Settings, Play,
  ChevronRight, ChevronDown, ChevronUp, Layers, BarChart2, CheckCircle2, 
  Zap, Compass, Sliders, RefreshCw, X, Radio, MessageCircle
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

  // Preferred natural voices in priority order
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

// Categorized domain prompts for the left sidebar explorer
const DOMAIN_CATEGORIES = [
  {
    id: 'deep_learning',
    title: 'Deep Learning & Neural Nets',
    icon: Brain,
    color: 'text-indigo-400',
    borderColor: 'border-indigo-500/30',
    bgColor: 'bg-indigo-500/10',
    prompts: [
      { label: "Deep Learning basics", query: "Can you explain how deep neural networks work?" },
      { label: "Forward vs Backprop", query: "Explain forward pass and backpropagation in deep learning" },
      { label: "BiLSTM architecture", query: "Why use Bidirectional LSTM with Global Max Pooling for text?" },
      { label: "Embedding layers", query: "How do neural embedding layers represent words?" }
    ]
  },
  {
    id: 'speech_processing',
    title: 'Speech Recognition (ASR)',
    icon: Mic,
    color: 'text-cyan-400',
    borderColor: 'border-cyan-500/30',
    bgColor: 'bg-cyan-500/10',
    prompts: [
      { label: "How ASR works", query: "How does speech to text conversion work in ASR?" },
      { label: "Acoustic modeling & MFCCs", query: "What are MFCCs and acoustic feature extraction in speech?" },
      { label: "Web Speech API", query: "How does the client-side Web Speech API capture audio?" }
    ]
  },
  {
    id: 'nlp',
    title: 'NLP & Language Processing',
    icon: MessageSquare,
    color: 'text-purple-400',
    borderColor: 'border-purple-500/30',
    bgColor: 'bg-purple-500/10',
    prompts: [
      { label: "NLP & Tokenization", query: "Explain natural language processing and tokenization" },
      { label: "Intent Classification", query: "How does this chatbot classify user intents using Softmax?" },
      { label: "Sequence Padding", query: "Why is pad_sequences max_len=25 used before LSTM layers?" }
    ]
  },
  {
    id: 'academics',
    title: 'Academics & Placement',
    icon: CheckCircle2,
    color: 'text-emerald-400',
    borderColor: 'border-emerald-500/30',
    bgColor: 'bg-emerald-500/10',
    prompts: [
      { label: "Campus Placements", query: "What should I study before campus recruitment and coding rounds?" },
      { label: "Semester Exams prep", query: "How can I score higher marks in semester exams and vivas?" },
      { label: "Capstone Projects", query: "How should we organize software architecture in capstone reports?" },
      { label: "Study Timetable", query: "Can you help me organize a daily engineering study timetable?" }
    ]
  },
  {
    id: 'ood_testing',
    title: 'Out-Of-Domain (OOD) Fallback',
    icon: ShieldCheck,
    color: 'text-rose-400',
    borderColor: 'border-rose-500/30',
    bgColor: 'bg-rose-500/10',
    prompts: [
      { label: "Geography test", query: "What is the capital of France?" },
      { label: "Weather test", query: "Tell me today's weather forecast." },
      { label: "Synthetic Noise", query: "zorp flim flam interstellar potato flying 98765" }
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

  // Responsive Drawer Toggles for Mobile/Tablet
  const [showMobileExplorer, setShowMobileExplorer] = useState(false);
  const [showMobileTelemetry, setShowMobileTelemetry] = useState(false);

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

  // Load browser speech synthesis voices and set friendly default
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

    const sampleText = "Hello! I am VoiceAssist AI. How can I assist your speech and language processing studies today?";
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
      if (backendUrl.includes('trycloudflare.com')) {
        errorDetail += ' The Cloudflare Tunnel URL has expired or was closed. Please restart your cloudflared tunnel or switch to your Render backend.';
      } else if (backendUrl.includes('onrender.com')) {
        errorDetail += ' If the Render backend was sleeping, it takes 30-50 seconds to wake up from cold start. Please wait a moment and try again.';
      } else if (backendUrl.includes('localhost') || backendUrl.includes('127.0.0.1')) {
        errorDetail += ' Please ensure your local FastAPI backend is running (uvicorn main:app --reload inside backend/).';
      } else {
        errorDetail += ' Please verify the backend service is running and accessible.';
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

  // Quick stats
  const totalQueries = messages.filter(m => m.sender === 'user').length;
  const assistantMessages = messages.filter(m => m.sender === 'assistant' && m.confidence !== undefined && m.intent !== 'network_error');
  const avgConfidence = assistantMessages.length > 0 
    ? (assistantMessages.reduce((acc, m) => acc + m.confidence, 0) / assistantMessages.length * 100).toFixed(1)
    : null;

  return (
    <div className="flex flex-col h-screen w-full bg-slate-950 text-slate-100 font-sans overflow-hidden">
      
      {/* HEADER */}
      <header className="shrink-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-[1920px] mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
          
          {/* Logo & Project Title */}
          <div className="flex items-center gap-3">
            <div className="relative p-2 rounded-xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 text-white shadow-lg glow-cyan">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-1.5">
                  VoiceAssist <span className="text-cyan-400">AI</span>
                </h1>
                <span className="hidden sm:inline-flex text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  SLP Lab Project
                </span>
                <span className="hidden md:inline-flex text-[10px] font-medium px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
                  TensorFlow BiLSTM
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Voice-Enabled Deep Learning Conversational Interface • 20 Academic Intents
              </p>
            </div>
          </div>

          {/* Action Buttons & Status Indicators */}
          <div className="flex items-center gap-2">
            
            {/* Mobile Explorer Toggle */}
            <button
              onClick={() => setShowMobileExplorer(!showMobileExplorer)}
              className="lg:hidden flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs transition"
              title="Browse Domain Question Bank"
            >
              <Compass className="w-4 h-4 text-cyan-400" />
              <span className="hidden sm:inline">Topics</span>
            </button>

            {/* Mobile Telemetry Toggle */}
            <button
              onClick={() => setShowMobileTelemetry(!showMobileTelemetry)}
              className="xl:hidden flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs transition"
              title="View Neural Network Telemetry"
            >
              <Activity className="w-4 h-4 text-indigo-400" />
              <span className="hidden sm:inline">Telemetry</span>
            </button>

            {/* Backend Status Badge */}
            <button
              onClick={() => setShowConfig(!showConfig)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 text-xs transition"
              title="Click to view/change Backend API URL"
            >
              <span className={`w-2 h-2 rounded-full ${
                backendStatus === 'online' ? 'bg-emerald-400 animate-pulse' :
                backendStatus === 'checking' ? 'bg-amber-400 animate-ping' : 'bg-rose-400'
              }`} />
              <span className="text-slate-300 font-medium hidden md:inline">
                {backendStatus === 'online' ? 'Backend Live' : backendStatus === 'checking' ? 'Connecting...' : 'Offline'}
              </span>
            </button>

            {/* Voice & Settings Toggle */}
            <button
              onClick={() => setShowConfig(!showConfig)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition"
              title="Change Voice Persona, Speed & Audio Settings"
            >
              <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Voice & API</span>
            </button>

            {/* Model Architecture Modal */}
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-semibold transition"
            >
              <Brain className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Model Info</span>
            </button>

            {/* Reset Chat */}
            <button
              onClick={handleResetChat}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition border border-transparent hover:border-slate-700"
              title="Reset Conversation"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

          </div>

        </div>

        {/* Collapsible Backend & Voice Config Banner */}
        {showConfig && (
          <div className="bg-slate-900 border-t border-slate-800 px-4 py-3 text-xs text-slate-300 animate-in fade-in duration-150 space-y-3 shadow-2xl">
            {/* Backend URL Config */}
            <div className="max-w-[1920px] mx-auto flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-1 min-w-[300px]">
                <Server className="w-4 h-4 text-cyan-400 shrink-0" />
                <span className="font-semibold text-white">Backend API URL:</span>
                <input
                  type="text"
                  value={backendUrl}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  placeholder="https://voiceassist-ai-backend.onrender.com or http://localhost:8000"
                  className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-cyan-300 flex-1 font-mono focus:outline-none focus:border-cyan-500"
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
                  className="px-2.5 py-1 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-700/50 rounded-lg text-xs transition"
                  title="Use Permanent Render Cloud Backend"
                >
                  Render (24/7 Cloud)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleUrlChange('http://localhost:8000');
                    checkHealth('http://localhost:8000');
                  }}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-xs transition"
                  title="Switch to local development server"
                >
                  Localhost:8000
                </button>
                <button
                  type="button"
                  onClick={() => checkHealth(backendUrl)}
                  className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-semibold transition text-xs"
                >
                  Test Connection
                </button>
              </div>
            </div>

            {/* Voice Persona & Speech Synthesis Config */}
            <div className="max-w-[1920px] mx-auto pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-1 min-w-[300px]">
                <Volume2 className="w-4 h-4 text-indigo-400 shrink-0" />
                <span className="font-semibold text-white">Voice Persona:</span>
                <select
                  value={selectedVoiceName}
                  onChange={(e) => {
                    setSelectedVoiceName(e.target.value);
                    localStorage.setItem('voiceassist_preferred_voice', e.target.value);
                  }}
                  className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-indigo-300 flex-1 focus:outline-none focus:border-indigo-500 truncate"
                >
                  {availableVoices.length > 0 ? (
                    availableVoices.map((v) => (
                      <option key={v.name} value={v.name} className="bg-slate-900 text-slate-200">
                        {v.name} ({v.lang})
                      </option>
                    ))
                  ) : (
                    <option value="" className="bg-slate-900 text-slate-200">Default Natural Voice</option>
                  )}
                </select>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Voice Speed */}
                <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                  <span className="text-[11px] text-slate-400">Speed:</span>
                  <select
                    value={speechRate}
                    onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                    className="bg-transparent text-slate-300 text-xs focus:outline-none cursor-pointer"
                  >
                    <option value="0.9" className="bg-slate-900 text-slate-200">0.9x (Relaxed)</option>
                    <option value="1.0" className="bg-slate-900 text-slate-200">1.0x (Normal)</option>
                    <option value="1.1" className="bg-slate-900 text-slate-200">1.1x (Brisk)</option>
                  </select>
                </div>

                {/* Voice Pitch */}
                <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                  <span className="text-[11px] text-slate-400">Tone:</span>
                  <select
                    value={speechPitch}
                    onChange={(e) => setSpeechPitch(parseFloat(e.target.value))}
                    className="bg-transparent text-slate-300 text-xs focus:outline-none cursor-pointer"
                  >
                    <option value="0.95" className="bg-slate-900 text-slate-200">Warm / Deep</option>
                    <option value="1.0" className="bg-slate-900 text-slate-200">Balanced</option>
                    <option value="1.1" className="bg-slate-900 text-slate-200">Friendly / Bright</option>
                  </select>
                </div>

                {/* Preview Button */}
                <button
                  type="button"
                  onClick={isPreviewSpeaking ? handleStopSpeak : handlePreviewVoice}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-semibold transition text-xs ${
                    isPreviewSpeaking 
                      ? 'bg-rose-600 hover:bg-rose-500 text-white animate-pulse'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                  }`}
                  title="Click to hear a sample of this voice"
                >
                  {isPreviewSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span>{isPreviewSpeaking ? 'Stop' : 'Test Voice'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowConfig(false)}
                  className="px-2.5 py-1 text-slate-400 hover:text-white transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* FULL-VIEWPORT DASHBOARD BODY */}
      <div className="flex-1 flex overflow-hidden w-full max-w-[1920px] mx-auto">
        
        {/* ============================================================ */}
        {/* LEFT PANEL: DOMAIN EXPLORER & QUESTION BANK (Desktop) */}
        {/* ============================================================ */}
        <aside className="hidden lg:flex w-72 xl:w-80 flex-col border-r border-slate-800/80 bg-slate-900/30 backdrop-blur-sm overflow-hidden shrink-0">
          <div className="p-3.5 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/60">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-cyan-400" />
              <span className="font-bold text-xs text-white uppercase tracking-wider">Domain Question Bank</span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
              20 Intents
            </span>
          </div>

          {/* Scrollable Questions Library */}
          <div className="flex-1 overflow-y-auto p-3 space-y-4 text-xs">
            <p className="text-[11px] text-slate-400 px-1">
              Click any question below to test the trained BiLSTM Deep Learning model immediately:
            </p>

            {DOMAIN_CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              return (
                <div key={cat.id} className="space-y-1.5">
                  <div className="flex items-center gap-1.5 px-1 py-1 font-semibold text-slate-300 text-xs">
                    <Icon className={`w-3.5 h-3.5 ${cat.color}`} />
                    <span>{cat.title}</span>
                  </div>
                  <div className="space-y-1">
                    {cat.prompts.map((p, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(p.query, false)}
                        className="w-full text-left p-2 rounded-xl bg-slate-900/70 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 text-slate-300 hover:text-cyan-300 transition group flex items-start justify-between gap-2 shadow-sm"
                        title={p.query}
                      >
                        <span className="text-[11px] line-clamp-1">{p.label}</span>
                        <ChevronRight className="w-3 h-3 text-slate-500 group-hover:text-cyan-400 shrink-0 mt-0.5 transition group-hover:translate-x-0.5" />
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Left Footer: Session Analytics Widget */}
          <div className="p-3 border-t border-slate-800/80 bg-slate-900/60 text-xs space-y-2">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Session Queries:</span>
              <span className="font-mono font-bold text-white">{totalQueries}</span>
            </div>
            {avgConfidence && (
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Avg Confidence:</span>
                <span className="font-mono font-bold text-emerald-400">{avgConfidence}%</span>
              </div>
            )}
            <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-800">
              <span>Inference Engine:</span>
              <span className="text-cyan-400 font-mono">BiLSTM (139k)</span>
            </div>
          </div>
        </aside>

        {/* ============================================================ */}
        {/* CENTER PANEL: THE CHAT ARENA (Expansive & Aesthetic) */}
        {/* ============================================================ */}
        <main className="flex-1 flex flex-col h-full overflow-hidden bg-slate-950/70 relative">
          
          {/* Subtle Ambient Glow Aura */}
          <div className="absolute top-0 inset-x-0 h-64 bg-gradient-to-b from-cyan-900/10 via-indigo-950/5 to-transparent pointer-events-none" />

          {/* Messages Feed Area */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
            
            {messages.length === 0 ? (
              /* Enhanced Welcome Hero State */
              <div className="h-full min-h-[420px] flex flex-col items-center justify-center text-center max-w-3xl mx-auto space-y-6 animate-in fade-in duration-300 py-6">
                
                {/* Glowing AI Core Icon */}
                <div className="relative">
                  <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-500 opacity-40 blur-xl animate-pulse" />
                  <div className="relative p-5 rounded-3xl bg-slate-900/90 border border-slate-800 text-cyan-400 shadow-2xl flex items-center justify-center">
                    <Brain className="w-12 h-12" />
                  </div>
                </div>

                {/* Main Hero Header */}
                <div className="space-y-2">
                  <h2 className="text-xl sm:text-3xl font-black text-white tracking-tight">
                    VoiceAssist <span className="bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">AI</span>
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
                    Voice-Enabled Academic Conversational Agent developed for the Speech & Language Processing Lab.
                    Featuring real-time <strong className="text-cyan-300">Speech-to-Text (ASR)</strong>, custom <strong className="text-indigo-300">BiLSTM Deep Learning Intent Classification</strong>, and auditory <strong className="text-purple-300">Text-to-Speech (TTS)</strong>.
                  </p>
                </div>

                {/* 3 Core Architecture Pillars */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full text-left">
                  <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/30 transition shadow-lg">
                    <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs">
                      <Mic className="w-4 h-4" />
                      <span>1. Speech Recognition</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      Real-time client acoustic capture via browser Web Speech API with interim transcript streaming.
                    </p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/30 transition shadow-lg">
                    <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs">
                      <Brain className="w-4 h-4" />
                      <span>2. BiLSTM Deep Learning</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      Bidirectional LSTM with Global Max Pooling (139,092 parameters) predicts 20 intent classes.
                    </p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-purple-500/30 transition shadow-lg">
                    <div className="flex items-center gap-2 text-purple-400 font-bold text-xs">
                      <Volume2 className="w-4 h-4" />
                      <span>3. Voice Synthesis</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      Customizable natural assistant voices vocalize responses with speed and tone adjustment.
                    </p>
                  </div>
                </div>

                {/* Quick Evaluator Starters Grid */}
                <div className="w-full space-y-2.5 pt-2">
                  <div className="text-[11px] uppercase font-bold tracking-wider text-slate-400 flex items-center justify-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Quick Test Starters (Click Any to Ask):</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {[
                      { label: "What is deep learning?", query: "What is deep learning and how do neural networks work?" },
                      { label: "How does ASR work?", query: "How does speech to text conversion work in ASR?" },
                      { label: "Explain NLP & Tokenization", query: "Explain natural language processing and tokenization" },
                      { label: "Tips for campus recruitment", query: "What should I study before campus recruitment and coding rounds?" },
                      { label: "Semester exam advice", query: "How can I score higher marks in semester exams and vivas?" },
                      { label: "Out-of-Domain fallback test", query: "What is the capital of France?" }
                    ].map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(item.query, false)}
                        className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 text-slate-300 hover:text-cyan-300 text-xs text-left transition flex items-center justify-between gap-2 group shadow-sm"
                      >
                        <span className="line-clamp-1 font-medium">{item.label}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 shrink-0 transition group-hover:translate-x-0.5" />
                      </button>
                    ))}
                  </div>
                </div>

              </div>
            ) : (
              /* Message Stream */
              <div className="space-y-4 max-w-4xl mx-auto pb-4">
                {messages.map((msg) => (
                  <ChatMessage
                    key={msg.id}
                    message={msg}
                    onSpeak={handleSpeak}
                    speakingId={speakingId}
                    onStopSpeak={handleStopSpeak}
                  />
                ))}

                {/* Animated Inference Spinner */}
                {isLoading && (
                  <div className="flex items-center gap-3 text-slate-400 text-xs p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/80 w-fit animate-pulse shadow-lg">
                    <Brain className="w-4 h-4 text-cyan-400 animate-spin" />
                    <span>Bidirectional LSTM Neural Network is analyzing sequence intent...</span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}

          </div>

          {/* ============================================================ */}
          {/* FLOATING INPUT DOCK SECTION */}
          {/* ============================================================ */}
          <div className="shrink-0 p-4 sm:p-5 bg-gradient-to-t from-slate-950 via-slate-950/95 to-transparent space-y-3 z-10">
            
            {/* Active Speech Recognition Visualizer */}
            <div className="max-w-4xl mx-auto">
              <VoiceIndicator
                isListening={isListening}
                transcript={interimTranscript}
                onStop={stopListening}
              />
            </div>

            {/* Speech Error Banner */}
            {speechError && (
              <div className="max-w-4xl mx-auto p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between gap-3 animate-in fade-in duration-150">
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

            {/* Input Bar Card */}
            <div className="max-w-4xl mx-auto p-2 sm:p-2.5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-xl flex items-center gap-2.5">
              
              {/* Big Glowing Microphone Button */}
              <button
                onClick={toggleListening}
                className={`p-3 rounded-xl font-bold transition flex items-center justify-center shadow-lg relative shrink-0 ${
                  isListening
                    ? 'bg-rose-600 hover:bg-rose-500 text-white glow-mic animate-pulse'
                    : 'bg-gradient-to-tr from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white glow-cyan'
                }`}
                title={isListening ? "Listening... Click to finish speaking" : "Click to Speak (Web Speech Recognition)"}
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
                placeholder={isListening ? "Listening to your voice..." : "Click mic to speak, or type your question here..."}
                disabled={isListening}
                className="flex-1 bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
              />

              {/* Send Button */}
              <button
                onClick={() => handleSendMessage()}
                disabled={!inputText.trim() || isLoading}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-cyan-400 hover:text-cyan-300 transition flex items-center justify-center shadow shrink-0"
                title="Send Message"
              >
                <Send className="w-4 h-4" />
              </button>

            </div>

            {/* Micro Caption */}
            <div className="max-w-4xl mx-auto flex items-center justify-between text-[10px] text-slate-500 px-2">
              <span>Speech Recognition via Web Speech API • Model: BiLSTM (139k params)</span>
              <button
                onClick={() => setIsModalOpen(true)}
                className="hover:text-cyan-400 underline transition"
              >
                Inspect Model Curves & Metrics
              </button>
            </div>

          </div>

        </main>

        {/* ============================================================ */}
        {/* RIGHT PANEL: LIVE TELEMETRY & VOICE STUDIO (Desktop) */}
        {/* ============================================================ */}
        <aside className="hidden xl:flex w-80 2xl:w-96 flex-col border-l border-slate-800/80 bg-slate-900/30 backdrop-blur-sm overflow-y-auto p-4 space-y-4 shrink-0 text-xs">
          
          {/* Card 1: Live Neural Network Telemetry */}
          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
              <div className="flex items-center gap-2 font-bold text-white uppercase tracking-wider text-xs">
                <Activity className="w-4 h-4 text-cyan-400" />
                <span>Live Neural Telemetry</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
                Softmax
              </span>
            </div>

            {latestPrediction ? (
              <div className="space-y-3 animate-in fade-in duration-200">
                {/* Predicted Intent */}
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Classified Intent:</div>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="font-mono text-sm font-bold text-cyan-300 bg-cyan-950/80 border border-cyan-800/60 px-2.5 py-1 rounded-lg">
                      #{latestPrediction.intent}
                    </span>
                    <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded border ${
                      latestPrediction.confidence >= 0.70 ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' :
                      latestPrediction.confidence >= 0.50 ? 'text-amber-400 bg-amber-500/10 border-amber-500/30' :
                      'text-rose-400 bg-rose-500/10 border-rose-500/30'
                    }`}>
                      {(latestPrediction.confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>Confidence Score</span>
                    <span>Threshold: θ = 0.50</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        latestPrediction.confidence >= 0.70 ? 'bg-emerald-400' :
                        latestPrediction.confidence >= 0.50 ? 'bg-amber-400' : 'bg-rose-400'
                      }`}
                      style={{ width: `${Math.min(latestPrediction.confidence * 100, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Top Softmax Candidates Breakdown */}
                {latestPrediction.topIntents && latestPrediction.topIntents.length > 0 && (
                  <div className="space-y-1.5 pt-2 border-t border-slate-800">
                    <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Top Posterior Candidates:</div>
                    {latestPrediction.topIntents.slice(0, 3).map((item, idx) => (
                      <div key={idx} className="space-y-0.5">
                        <div className="flex items-center justify-between text-[11px] font-mono text-slate-300">
                          <span>{item.intent}</span>
                          <span className="text-cyan-400 font-semibold">{(item.probability * 100).toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-cyan-500 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(item.probability * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Latency info */}
                {latestPrediction.latencyMs !== undefined && (
                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                    <span>Roundtrip Inference:</span>
                    <span className="font-mono text-slate-400">~{latestPrediction.latencyMs} ms</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-6 text-center text-slate-400 space-y-2">
                <Brain className="w-8 h-8 text-slate-600 mx-auto animate-pulse" />
                <p className="text-xs">Send a voice or text query to view live neural prediction metrics & Softmax distributions.</p>
              </div>
            )}
          </div>

          {/* Card 2: Voice Studio Widget */}
          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
              <div className="flex items-center gap-2 font-bold text-white uppercase tracking-wider text-xs">
                <Volume2 className="w-4 h-4 text-indigo-400" />
                <span>Voice Persona Studio</span>
              </div>
              <span className="text-[10px] text-slate-400">TTS Audio</span>
            </div>

            <div className="space-y-2.5">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                  Active Speaker Voice:
                </label>
                <select
                  value={selectedVoiceName}
                  onChange={(e) => {
                    setSelectedVoiceName(e.target.value);
                    localStorage.setItem('voiceassist_preferred_voice', e.target.value);
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-indigo-300 focus:outline-none focus:border-indigo-500"
                >
                  {availableVoices.length > 0 ? (
                    availableVoices.map((v) => (
                      <option key={v.name} value={v.name} className="bg-slate-900 text-slate-200">
                        {v.name}
                      </option>
                    ))
                  ) : (
                    <option value="" className="bg-slate-900 text-slate-200">Default Natural Voice</option>
                  )}
                </select>
              </div>

              {/* Speed & Pitch Controls */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                    Speed:
                  </label>
                  <select
                    value={speechRate}
                    onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2 py-1 text-xs text-slate-300 focus:outline-none"
                  >
                    <option value="0.9" className="bg-slate-900">0.9x Relaxed</option>
                    <option value="1.0" className="bg-slate-900">1.0x Normal</option>
                    <option value="1.1" className="bg-slate-900">1.1x Brisk</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                    Tone:
                  </label>
                  <select
                    value={speechPitch}
                    onChange={(e) => setSpeechPitch(parseFloat(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2 py-1 text-xs text-slate-300 focus:outline-none"
                  >
                    <option value="0.95" className="bg-slate-900">Warm / Deep</option>
                    <option value="1.0" className="bg-slate-900">Balanced</option>
                    <option value="1.1" className="bg-slate-900">Bright</option>
                  </select>
                </div>
              </div>

              {/* Preview Button */}
              <button
                type="button"
                onClick={isPreviewSpeaking ? handleStopSpeak : handlePreviewVoice}
                className={`w-full py-2 rounded-xl font-semibold transition text-xs flex items-center justify-center gap-2 shadow ${
                  isPreviewSpeaking 
                    ? 'bg-rose-600 hover:bg-rose-500 text-white animate-pulse'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                }`}
              >
                {isPreviewSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isPreviewSpeaking ? 'Stop Audio' : 'Preview Voice Sample'}</span>
              </button>
            </div>
          </div>

          {/* Card 3: Deep Learning Specs Card */}
          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg space-y-2.5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
              <div className="flex items-center gap-2 font-bold text-white uppercase tracking-wider text-xs">
                <Layers className="w-4 h-4 text-purple-400" />
                <span>Model Specifications</span>
              </div>
            </div>

            <div className="space-y-1.5 text-[11px] text-slate-300">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Architecture:</span>
                <span className="font-semibold text-white">BiLSTM + GlobalPool</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Trainable Parameters:</span>
                <span className="font-mono font-bold text-cyan-400">139,092</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Embedding Dim:</span>
                <span className="font-mono">64 (Vocab: 1,372)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Held-Out Test Accuracy:</span>
                <span className="font-mono font-bold text-emerald-400">72.0% (14.4x base)</span>
              </div>
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className="w-full mt-2 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition border border-slate-700 flex items-center justify-center gap-1.5"
            >
              <BarChart2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Inspect Confusion Matrix</span>
            </button>
          </div>

        </aside>

      </div>

      {/* ============================================================ */}
      {/* MOBILE POPUP: TOPICS & QUESTION BANK DRAWER */}
      {/* ============================================================ */}
      {showMobileExplorer && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-slate-950/80 backdrop-blur-sm lg:hidden animate-in fade-in">
          <div className="bg-slate-900 border-t border-slate-800 rounded-t-3xl max-h-[80vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-white text-sm">SLP Domain Question Bank</h3>
              </div>
              <button 
                onClick={() => setShowMobileExplorer(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto space-y-4">
              {DOMAIN_CATEGORIES.map((cat) => (
                <div key={cat.id} className="space-y-1.5">
                  <div className="font-bold text-xs text-slate-300">{cat.title}</div>
                  <div className="space-y-1">
                    {cat.prompts.map((p, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          handleSendMessage(p.query, false);
                          setShowMobileExplorer(false);
                        }}
                        className="w-full text-left p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs transition"
                      >
                        {p.query}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MOBILE POPUP: LIVE TELEMETRY DRAWER */}
      {/* ============================================================ */}
      {showMobileTelemetry && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-slate-950/80 backdrop-blur-sm xl:hidden animate-in fade-in">
          <div className="bg-slate-900 border-t border-slate-800 rounded-t-3xl max-h-[80vh] flex flex-col overflow-hidden shadow-2xl p-4 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-white text-sm">Live Neural Telemetry</h3>
              </div>
              <button 
                onClick={() => setShowMobileTelemetry(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {latestPrediction ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-bold text-cyan-300 bg-cyan-950 border border-cyan-800 px-3 py-1 rounded-lg">
                    #{latestPrediction.intent}
                  </span>
                  <span className="font-mono text-xs font-bold text-emerald-400">
                    {(latestPrediction.confidence * 100).toFixed(1)}% Confidence
                  </span>
                </div>
                {latestPrediction.topIntents && (
                  <div className="space-y-1.5">
                    {latestPrediction.topIntents.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs text-slate-300">
                        <span>{item.intent}</span>
                        <span className="font-mono text-cyan-400 font-semibold">{(item.probability * 100).toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-center text-slate-400 text-xs py-4">No query processed yet in this session.</p>
            )}

            <button
              onClick={() => {
                setShowMobileTelemetry(false);
                setIsModalOpen(true);
              }}
              className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs"
            >
              View Full Model Architecture & Confusion Matrix
            </button>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* ACADEMIC MODEL INFO MODAL (Curves, Confusion Matrix, Layers) */}
      {/* ============================================================ */}
      <ModelInfoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        metadata={modelMetadata}
      />

    </div>
  );
}
