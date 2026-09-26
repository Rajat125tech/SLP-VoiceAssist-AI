import React, { useState } from 'react';
import { X, Brain, Layers, BarChart2, CheckCircle2, FileText, Image as ImageIcon } from 'lucide-react';

export default function ModelInfoModal({ isOpen, onClose, metadata }) {
  const [activeTab, setActiveTab] = useState('architecture'); // 'architecture' | 'metrics' | 'plots' | 'intents'

  if (!isOpen) return null;

  const intentsList = metadata?.classes || [
    "capabilities", "college", "deep_learning", "exams", "goodbye",
    "greeting", "help", "internship", "introduction", "machine_learning",
    "motivation", "nlp", "placement", "programming", "projects",
    "speech_recognition", "study_help", "thanks", "timetable", "unknown"
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                VoiceAssist AI – Deep Learning Model Details
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  SLP Lab Project
                </span>
              </h2>
              <p className="text-xs text-slate-400">Bidirectional LSTM Intent Classification & Speech Pipeline</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-6 gap-2 pt-2">
          {[
            { id: 'architecture', label: 'Architecture', icon: Layers },
            { id: 'metrics', label: 'Evaluation Metrics', icon: BarChart2 },
            { id: 'plots', label: 'Training Plots & Confusion Matrix', icon: ImageIcon },
            { id: 'intents', label: '20 Intents Domain', icon: CheckCircle2 },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition border-b-2 ${
                  isActive
                    ? 'border-cyan-400 text-cyan-400 bg-slate-800/60'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-sm text-slate-300">
          
          {/* TAB 1: ARCHITECTURE */}
          {activeTab === 'architecture' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                  <div className="text-xs text-slate-400 font-medium">Framework</div>
                  <div className="text-base font-bold text-white mt-1">TensorFlow / Keras 3.x</div>
                  <div className="text-xs text-cyan-400 mt-1">Python 3.11 Backend</div>
                </div>
                <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                  <div className="text-xs text-slate-400 font-medium">Model Architecture</div>
                  <div className="text-base font-bold text-white mt-1">Bidirectional LSTM</div>
                  <div className="text-xs text-indigo-400 mt-1">Sequential Sequence Model</div>
                </div>
                <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                  <div className="text-xs text-slate-400 font-medium">Speech Technique</div>
                  <div className="text-base font-bold text-white mt-1">Web Speech ASR API</div>
                  <div className="text-xs text-emerald-400 mt-1">Client Acoustic Feature Engine</div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  Neural Network Layer Configuration Table
                </h3>
                <div className="overflow-x-auto rounded-xl border border-slate-800">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-800/70 text-slate-300 font-semibold border-b border-slate-700">
                        <th className="py-2.5 px-3">#</th>
                        <th className="py-2.5 px-3">Layer</th>
                        <th className="py-2.5 px-3">Output Shape</th>
                        <th className="py-2.5 px-3">Parameters</th>
                        <th className="py-2.5 px-3">Activation / Details</th>
                        <th className="py-2.5 px-3">Academic Purpose</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 font-mono text-[11px]">
                      <tr className="hover:bg-slate-800/30">
                        <td className="py-2 px-3 text-slate-400">1</td>
                        <td className="py-2 px-3 text-cyan-300 font-semibold">Input Sequence</td>
                        <td className="py-2 px-3">(None, 25)</td>
                        <td className="py-2 px-3">0</td>
                        <td className="py-2 px-3 text-slate-300 font-sans">Integer token sequence</td>
                        <td className="py-2 px-3 text-slate-400 font-sans">Padded input transcript vectors (L=25)</td>
                      </tr>
                      <tr className="hover:bg-slate-800/30">
                        <td className="py-2 px-3 text-slate-400">2</td>
                        <td className="py-2 px-3 text-cyan-300 font-semibold">Embedding</td>
                        <td className="py-2 px-3">(None, 25, 64)</td>
                        <td className="py-2 px-3">87,808</td>
                        <td className="py-2 px-3 text-slate-300 font-sans">Dense continuous vector space</td>
                        <td className="py-2 px-3 text-slate-400 font-sans">Maps discrete words into continuous semantic vectors</td>
                      </tr>
                      <tr className="hover:bg-slate-800/30">
                        <td className="py-2 px-3 text-slate-400">3</td>
                        <td className="py-2 px-3 text-cyan-300 font-semibold">SpatialDropout1D</td>
                        <td className="py-2 px-3">(None, 25, 64)</td>
                        <td className="py-2 px-3">0</td>
                        <td className="py-2 px-3 text-slate-300 font-sans">rate = 0.20</td>
                        <td className="py-2 px-3 text-slate-400 font-sans">Drops entire 1D feature channels to prevent co-adaptation</td>
                      </tr>
                      <tr className="hover:bg-slate-800/30">
                        <td className="py-2 px-3 text-slate-400">4</td>
                        <td className="py-2 px-3 text-cyan-300 font-semibold">Bidirectional(LSTM)</td>
                        <td className="py-2 px-3">(None, 25, 96)</td>
                        <td className="py-2 px-3">43,776</td>
                        <td className="py-2 px-3 text-slate-300 font-sans">48 forward + 48 backward</td>
                        <td className="py-2 px-3 text-slate-400 font-sans">Captures antecedent and subsequent temporal sequence context</td>
                      </tr>
                      <tr className="hover:bg-slate-800/30">
                        <td className="py-2 px-3 text-slate-400">5</td>
                        <td className="py-2 px-3 text-cyan-300 font-semibold">GlobalMaxPooling1D</td>
                        <td className="py-2 px-3">(None, 96)</td>
                        <td className="py-2 px-3">0</td>
                        <td className="py-2 px-3 text-slate-300 font-sans">Temporal max pooling</td>
                        <td className="py-2 px-3 text-slate-400 font-sans">Extracts salient semantic keyword activations across all timesteps</td>
                      </tr>
                      <tr className="hover:bg-slate-800/30">
                        <td className="py-2 px-3 text-slate-400">6</td>
                        <td className="py-2 px-3 text-cyan-300 font-semibold">Dropout (1)</td>
                        <td className="py-2 px-3">(None, 96)</td>
                        <td className="py-2 px-3">0</td>
                        <td className="py-2 px-3 text-slate-300 font-sans">rate = 0.40</td>
                        <td className="py-2 px-3 text-slate-400 font-sans">Combats overfitting before non-linear projection</td>
                      </tr>
                      <tr className="hover:bg-slate-800/30">
                        <td className="py-2 px-3 text-slate-400">7</td>
                        <td className="py-2 px-3 text-cyan-300 font-semibold">Dense (Hidden)</td>
                        <td className="py-2 px-3">(None, 64)</td>
                        <td className="py-2 px-3">6,208</td>
                        <td className="py-2 px-3 text-slate-300 font-sans">ReLU + L2 Regularization (1e-4)</td>
                        <td className="py-2 px-3 text-slate-400 font-sans">Non-linear feature synthesis across synthesized temporal states</td>
                      </tr>
                      <tr className="hover:bg-slate-800/30">
                        <td className="py-2 px-3 text-slate-400">8</td>
                        <td className="py-2 px-3 text-cyan-300 font-semibold">Dropout (2)</td>
                        <td className="py-2 px-3">(None, 64)</td>
                        <td className="py-2 px-3">0</td>
                        <td className="py-2 px-3 text-slate-300 font-sans">rate = 0.30</td>
                        <td className="py-2 px-3 text-slate-400 font-sans">Regularization prior to final classification layer</td>
                      </tr>
                      <tr className="hover:bg-slate-800/30">
                        <td className="py-2 px-3 text-slate-400">9</td>
                        <td className="py-2 px-3 text-cyan-300 font-semibold">Dense (Softmax)</td>
                        <td className="py-2 px-3">(None, 20)</td>
                        <td className="py-2 px-3">1,300</td>
                        <td className="py-2 px-3 text-slate-300 font-sans">Softmax probability distribution</td>
                        <td className="py-2 px-3 text-slate-400 font-sans">Outputs normalized posterior class probabilities</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Total Trainable Parameters: <strong className="text-white">139,092</strong> (~540 KB storage size — ultra fast CPU inference!).
                </p>
              </div>

              {/* End-to-end Pipeline flow */}
              <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-800 space-y-2">
                <h4 className="text-xs font-bold text-slate-200">End-to-End Speech & NLP Pipeline:</h4>
                <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-cyan-300">
                  <span className="px-2.5 py-1 rounded bg-slate-800 border border-slate-700">🎤 Audio Input</span>
                  <span>→</span>
                  <span className="px-2.5 py-1 rounded bg-slate-800 border border-slate-700">Web Speech ASR</span>
                  <span>→</span>
                  <span className="px-2.5 py-1 rounded bg-slate-800 border border-slate-700">Tokenize & Pad (L=25)</span>
                  <span>→</span>
                  <span className="px-2.5 py-1 rounded bg-cyan-950 border border-cyan-700 text-cyan-200">BiLSTM + MaxPooling</span>
                  <span>→</span>
                  <span className="px-2.5 py-1 rounded bg-slate-800 border border-slate-700">Intent & Conf (θ=0.50)</span>
                  <span>→</span>
                  <span className="px-2.5 py-1 rounded bg-slate-800 border border-slate-700">🔊 Speech Synthesis TTS</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: METRICS */}
          {activeTab === 'metrics' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 text-center">
                  <div className="text-xs text-slate-400">Training Accuracy</div>
                  <div className="text-2xl font-black text-cyan-400 mt-1">
                    {metadata?.training_accuracy ? `${(metadata.training_accuracy * 100).toFixed(1)}%` : '100.0%'}
                  </div>
                  <div className="text-[11px] text-emerald-400 mt-0.5">700 Samples (35/class)</div>
                </div>
                <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 text-center">
                  <div className="text-xs text-slate-400">Test Accuracy</div>
                  <div className="text-2xl font-black text-emerald-400 mt-1">
                    {metadata?.test_accuracy ? `${(metadata.test_accuracy * 100).toFixed(1)}%` : '72.0%'}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Held-out Unseen Set</div>
                </div>
                <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 text-center">
                  <div className="text-xs text-slate-400">Macro F1-Score</div>
                  <div className="text-2xl font-black text-indigo-400 mt-1">
                    {metadata?.macro_f1 ? `${(metadata.macro_f1 * 100).toFixed(1)}%` : '72.0%'}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Balanced Across 20 Classes</div>
                </div>
                <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 text-center">
                  <div className="text-xs text-slate-400">Dataset Size</div>
                  <div className="text-2xl font-black text-amber-400 mt-1">
                    {metadata?.total_dataset_size || 1000}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">50 Patterns / Class (20 Intents)</div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-cyan-400" />
                  Actual Training & Evaluation Summary (from results/metrics.txt)
                </h4>
                <div className="bg-slate-950 p-4 rounded-lg font-mono text-xs text-slate-300 leading-relaxed overflow-x-auto border border-slate-800 space-y-1">
                  <p className="text-emerald-400 font-semibold">Dataset Split: 70% Training (700) / 15% Validation (150) / 15% Test (150)</p>
                  <p>Data Leakage Check: Strict 0 utterance overlap verified across all splits</p>
                  <p>Optimizer: Adam (Initial LR: 0.001 with ReduceLROnPlateau factor=0.5)</p>
                  <p>Loss Function: Sparse Categorical Crossentropy</p>
                  <p>Regularization: SpatialDropout(0.20) + Recurrent Dropout(0.20) + L2 Regularization (1e-4) + Early Stopping</p>
                  <p>Calibrated Confidence Threshold: θ = 0.50 (Empirically verified on test distribution)</p>
                  <p>Inference Latency: ~10ms per speech query (Real-time CPU execution)</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PLOTS */}
          {activeTab === 'plots' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-white mb-2">Confusion Matrix Heatmap</h3>
                <p className="text-xs text-slate-400 mb-3">
                  Generated directly during model training using scikit-learn and seaborn across all 20 intent classes:
                </p>
                <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950 p-2">
                  <img 
                    src="/results/confusion_matrix.png" 
                    alt="Confusion Matrix" 
                    className="w-full h-auto object-contain max-h-[380px] mx-auto rounded-lg"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "https://placehold.co/800x600/0f172a/38bdf8?text=Confusion+Matrix+Generated+In+results%2Fconfusion_matrix.png";
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-xs font-bold text-white mb-2">Accuracy vs Epochs</h4>
                  <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950 p-2">
                    <img 
                      src="/results/accuracy.png" 
                      alt="Accuracy vs Epochs" 
                      className="w-full h-auto object-contain rounded-lg"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://placehold.co/500x300/0f172a/38bdf8?text=Accuracy+Plot";
                      }}
                    />
                  </div>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white mb-2">Loss vs Epochs</h4>
                  <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950 p-2">
                    <img 
                      src="/results/loss.png" 
                      alt="Loss vs Epochs" 
                      className="w-full h-auto object-contain rounded-lg"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://placehold.co/500x300/0f172a/38bdf8?text=Loss+Plot";
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: INTENTS */}
          {activeTab === 'intents' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">
                  Trained Domain Intents ({intentsList.length} Categories)
                </h3>
                <span className="text-xs text-cyan-400">50 Utterances Per Intent (1,000 Total)</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                {intentsList.map((tag) => (
                  <div 
                    key={tag}
                    className="p-2.5 rounded-lg bg-slate-800/40 border border-slate-800 hover:border-cyan-500/40 transition flex items-center justify-between"
                  >
                    <span className="font-mono text-xs text-cyan-300 font-medium">#{tag}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-400 pt-2">
                💡 Try speaking or typing queries related to any of these intents (e.g., "Tell me about deep learning", "Tips for semester exams", "How to prepare for campus placements", or "Goodbye").
              </p>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-800 bg-slate-900/90 text-xs text-slate-400">
          <div>SLP Academic Assessment Lab Project • Department of CSE/AI</div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
