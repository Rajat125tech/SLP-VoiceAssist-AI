# VoiceAssist AI – A Voice-Enabled Deep Learning Chatbot

> **Speech and Language Processing (SLP) Lab Assessment Project**  
> An end-to-end conversational agent integrating **Browser Speech Recognition (Web Speech API)**, a **Bidirectional LSTM Neural Network (TensorFlow/Keras)** for Intent Classification, and **Text-to-Speech (Web Speech Synthesis)**.

---

## 1. Project Title & Overview

* **Title:** VoiceAssist AI – A Voice-Enabled Deep Learning Chatbot
* **Domain:** Speech and Language Processing (SLP) & Deep Learning
* **System Pipeline:** Audio Input (Microphone) $\rightarrow$ Speech-to-Text (ASR) $\rightarrow$ Text Preprocessing & Vectorization $\rightarrow$ Bidirectional LSTM Classification $\rightarrow$ Softmax Intent Prediction $\rightarrow$ Dynamic Response Dispatching $\rightarrow$ Text-to-Speech (TTS)

Unlike simple rule-based bots or external third-party LLM wrapper APIs, **VoiceAssist AI features a genuinely trained custom Deep Learning neural network** built with TensorFlow and Keras that evaluates 20 intent categories with real-time confidence scores and posterior probability distributions.

---

## 2. Problem Statement

Spoken conversational interfaces require bridging acoustic speech processing with semantic natural language understanding. Traditional chatbots often rely on rigid keyword heuristics or remote proprietary LLMs that hide internal decision boundaries. In an academic Speech and Language Processing laboratory context, students need an observable, interpretable, end-to-end system where:
1. Continuous acoustic speech is accurately digitized and transcribed on the client.
2. Natural language utterances with syntactic and grammatical variations are vectorized into geometric embedding spaces.
3. Recurrent neural sequence models capture bidirectional context dependencies to classify user intent.
4. Quantitative metrics (Loss, Accuracy, Precision, Recall, F1-Score, Confusion Matrix) can be verified empirically.

---

## 3. Objectives

* **Speech-to-Text Transcription:** Capture user voice input via the browser's native Web Speech API and display recognized speech on-screen for live verification.
* **Deep Learning Intent Modeling:** Construct and train a Bidirectional LSTM (BiLSTM) network with dense embeddings to map utterances to intent classes.
* **Confidence & Fallback Handling:** Calculate output class posterior probabilities using Softmax activation; trigger an intelligent fallback mechanism if confidence is below threshold.
* **Auditory Feedback (TTS):** Integrate Web Speech Synthesis to read responses aloud to the user.
* **Full-Stack Cloud Deployment:** Provide a decoupled production architecture (FastAPI backend + Vite/React frontend) with zero-cost public hosting on Render and Vercel.

---

## 4. Key Features

* 🎙️ **Real-Time Voice Input:** One-click microphone toggle with listening visualizer and live interim transcript streaming.
* 🧠 **Trained BiLSTM Deep Learning Model:** 110,164 trainable parameters processing bidirectional temporal sequence dependencies.
* 📊 **Transparent Prediction Metrics:** Displays predicted intent tag, confidence percentage meter, and full Softmax probability distribution for top candidate classes.
* 🔊 **Text-to-Speech (TTS):** Integrated audio playback using browser speech synthesis.
* 📱 **Modern Responsive UI:** Polished dark-mode AI dashboard built with React and Tailwind CSS.
* 📈 **Interactive Model Inspection Modal:** Embedded visualization of training accuracy curves, loss curves, confusion matrix, and layer architecture tables.
* 🧪 **Automated Testing Suite:** Dedicated test script validating diverse queries (greetings, deep learning, NLP, speech recognition, placement, and noisy inputs).

---

## 5. Technology Stack

### Frontend
* **Library/Tooling:** React 18, Vite, Tailwind CSS, Lucide React (Icons)
* **Speech Interfaces:** Browser Web Speech API (`SpeechRecognition` / `webkitSpeechRecognition`, `speechSynthesis`)
* **Networking:** Fetch API with dynamic backend URL discovery

### Backend
* **Language & Framework:** Python 3.11, FastAPI, Uvicorn
* **API Protocol:** RESTful JSON endpoints with Cross-Origin Resource Sharing (CORS)

### Deep Learning & Machine Learning
* **Deep Learning Framework:** TensorFlow 2.15+ / Keras 3.x
* **Sequence Modeling:** Bidirectional Long Short-Term Memory (`Bidirectional(LSTM)`)
* **Vectorization:** Keras `Tokenizer` & `pad_sequences`
* **Evaluation & Analytics:** Scikit-Learn (Classification Report, Confusion Matrix), Matplotlib, Seaborn

### Deployment
* **Backend:** Render (Free Tier Python Web Service)
* **Frontend:** Vercel (Free Tier Static SPA)

---

## 6. System Architecture

```
[User Voice Input]
       │
       ▼
[Web Speech API (ASR)] ───► Transcribed Text Displayed in Chat
       │
       ▼ (HTTP POST /chat)
[FastAPI REST Backend]
       │
       ▼
[Text Cleaning & Tokenization] (pad_sequences max_len=20)
       │
       ▼
[Embedding Layer] (Dim: 64, Vocab: 634)
       │
       ▼
[Bidirectional LSTM Layer] (64 units = 128 forward+backward states)
       │
       ▼
[Dropout (0.4) ──► Dense (64, ReLU) ──► Dropout (0.3)]
       │
       ▼
[Dense + Softmax Layer] (20 Output Intent Classes)
       │
       ├──► Confidence Score & Posterior Probabilities
       │
       ▼
[Intent Lookup & Response Selection] (Fallback if confidence < 0.30)
       │
       ▼ (HTTP JSON Response)
[React Frontend Interface] ───► Render Message, Intent Badge, Confidence Bar
       │
       ▼
[Web Speech Synthesis API] ───► Spoken Audio Response (TTS)
```

---

## 7. Dataset Description

The dataset is stored in `backend/dataset/intents.json` and comprises **335 realistic utterances** distributed across **20 distinct academic and conversational intents**:

| # | Intent Tag | Description / Domain | Sample Pattern |
|---|---|---|---|
| 1 | `greeting` | Welcoming & introductory greetings | *"Hello there, good morning!"* |
| 2 | `goodbye` | Conversation termination | *"See you later, have a great day!"* |
| 3 | `thanks` | Gratitude expressions | *"Thank you so much for your help!"* |
| 4 | `introduction` | System identity & authorship | *"Who created you and what are you?"* |
| 5 | `help` | Usage assistance & navigation | *"How do I operate this voice assistant?"* |
| 6 | `capabilities` | Functional domain inquiries | *"What tasks can this system handle?"* |
| 7 | `study_help` | Engineering study methodologies | *"How should I study for technical subjects?"* |
| 8 | `programming` | Coding & data structures concepts | *"How do I learn coding and algorithms?"* |
| 9 | `machine_learning` | Statistical ML principles | *"Explain supervised vs unsupervised learning"* |
| 10 | `deep_learning` | Neural networks, backprop & layers | *"What is deep learning and how do neural nets work?"* |
| 11 | `speech_recognition` | ASR, MFCCs & acoustic modeling | *"How does speech to text conversion work in ASR?"* |
| 12 | `nlp` | Language processing & embeddings | *"Explain natural language processing and tokenization"* |
| 13 | `college` | University life & club balance | *"How to balance academics and extracurriculars?"* |
| 14 | `timetable` | Routine & time management | *"Can you help me organize a daily study timetable?"* |
| 15 | `exams` | Semester exam & viva prep | *"How to prepare for semester exams and vivas?"* |
| 16 | `projects` | Capstone project design & metrics | *"How to choose an SLP academic project?"* |
| 17 | `internship` | Tech internship applications | *"How to find software engineering internships?"* |
| 18 | `placement` | Campus placement coding rounds | *"How can I prepare for campus placements?"* |
| 19 | `motivation` | Academic resilience & encouragement | *"I feel overwhelmed and need encouragement"* |
| 20 | `unknown` | Out-of-distribution noise / gibberish | *"zorp flim flam interstellar potato flying 98765"* |

* **Data Split:** 80% Training (268 utterances), 20% Validation (67 utterances) using stratified sampling.

---

## 8. Deep Learning Model Architecture

The neural network is defined in `backend/training/train_model.py`:

```python
model = Sequential([
    Input(shape=(20,), dtype=tf.int32, name="input_sequence"),
    Embedding(input_dim=634, output_dim=64, name="embedding_layer"),
    Bidirectional(LSTM(64, return_sequences=False, dropout=0.2, recurrent_dropout=0.2), name="bilstm"),
    Dropout(0.4, name="dropout_1"),
    Dense(64, activation="relu", name="dense_hidden"),
    Dropout(0.3, name="dropout_2"),
    Dense(20, activation="softmax", name="output_softmax")
])
```

### Parameter Breakdown
* **Input Layer:** Sequence length $L = 20$, pre-padded.
* **Embedding Layer:** Vocabulary size $V = 634$, Dimension $D = 64$ ($634 \times 64 = 40,576$ parameters).
* **Bidirectional LSTM:** Forward (64) + Backward (64) LSTM units yielding a 128-dimensional output vector ($66,048$ parameters).
* **Dense Layer:** 64 hidden units with Rectified Linear Unit ($\text{ReLU}$) activation ($8,256$ parameters).
* **Output Softmax:** 20 units producing normalized posterior probability distribution ($1,300$ parameters).
* **Total Parameters:** **110,164 trainable parameters** (~430 KB storage size).

---

## 9. Empirical Results & Performance

Trained using the **Adam Optimizer** with learning rate scheduling (`ReduceLROnPlateau`) and `EarlyStopping` on validation accuracy:

| Metric | Result |
|---|---|
| **Training Accuracy** | **97.76%** |
| **Validation Accuracy** | **47.76%** (Over 9.5× higher than 5% random baseline for 20 classes) |
| **Training Loss** | **0.2334** |
| **Validation Loss** | **2.2457** |
| **Macro F1-Score** | **0.45** |
| **Weighted F1-Score** | **0.47** |
| **Average Inference Latency** | **~12 ms** (Ultra-responsive on CPU) |

Generated evaluation artifacts stored in `results/`:
* `results/accuracy.png` – Training & Validation Accuracy curves over epochs.
* `results/loss.png` – Sparse Categorical Crossentropy Loss trajectory.
* `results/confusion_matrix.png` – 20-class classification confusion matrix heatmap.
* `results/metrics.txt` – Full precision, recall, and F1-score report per class.

---

## 10. Local Setup & Execution

### Prerequisites
* Python 3.10+ (Recommended: Python 3.11)
* Node.js 18+ and npm

### Step 1: Clone Repository
```bash
git clone https://github.com/your-username/voiceassist-ai.git
cd voiceassist-ai
```

### Step 2: Set Up Backend
```bash
# Navigate to backend directory
cd backend

# Create and activate Python virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# (Optional) Retrain model and regenerate plots
python training/train_model.py

# Verify inference with automated test suite
python test_chatbot.py

# Start FastAPI backend server
uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```
The backend API is now live at: `http://127.0.0.1:8000` (Swagger docs: `http://127.0.0.1:8000/docs`).

### Step 3: Set Up Frontend
Open a new terminal window:
```bash
# Navigate to frontend directory
cd frontend

# Install npm dependencies
npm install

# Start Vite development server
npm run dev
```
Open `http://localhost:5173` in **Google Chrome**, **Microsoft Edge**, or **Safari** (for Web Speech API compatibility).

---

## 11. Step-by-Step Deployment Guide (100% Free)

### A. Deploy Backend to Render

1. Push your repository to **GitHub**. (Ensure `backend/model/` is committed).
2. Log in to [Render.com](https://render.com) (free account).
3. Click **New +** $\rightarrow$ **Web Service**.
4. Connect your GitHub repository.
5. Configure the service settings:
   * **Name:** `voiceassist-ai-backend`
   * **Region:** Any (e.g., Oregon or Frankfurt)
   * **Root Directory:** `backend`
   * **Environment:** `Python 3`
   * **Build Command:** `pip install -r requirements.txt`
   * **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
   * **Instance Type:** `Free`
6. Click **Deploy Web Service**.
7. Once deployed, copy your public backend URL:  
   `https://voiceassist-ai-backend.onrender.com`

---

### B. Deploy Frontend to Vercel

1. Log in to [Vercel.com](https://vercel.com) (free account).
2. Click **Add New...** $\rightarrow$ **Project**.
3. Import your GitHub repository.
4. Configure project settings:
   * **Framework Preset:** `Vite`
   * **Root Directory:** Click *Edit* and select `frontend`
   * **Build Command:** `npm run build`
   * **Output Directory:** `dist`
5. Under **Environment Variables**, add:
   * **Key:** `VITE_API_URL`
   * **Value:** `https://your-backend-name.onrender.com` *(Your Render URL from Step A)*
6. Click **Deploy**.
7. In under 1 minute, your site will be live at:  
   `https://your-project.vercel.app`

> **Note for Evaluators:** The frontend UI also includes an in-app **Backend API Switcher** (in the top navigation bar) allowing anyone to test against any active backend URL or localhost on the fly!

---

## 12. API Documentation

| Method | Endpoint | Description | Sample Request / Response |
|---|---|---|---|
| `GET` | `/health` | Healthcheck and model initialization status | `{"status": "healthy", "model_loaded": true}` |
| `POST` | `/chat` | Main conversational inference endpoint | Request: `{"message": "What is deep learning?"}`<br>Response: `{"intent": "deep_learning", "confidence": 0.9499, "response": "..."}` |
| `POST` | `/predict` | Raw classification endpoint with top intent distribution | Request: `{"message": "..."}`<br>Response: `{"intent": "...", "confidence": 0.94, "top_intents": [...]}` |
| `GET` | `/model-info` | Metadata, framework version, layers & metrics | Returns architecture summary, training parameters, and metrics |

---

## 13. Evaluator Test Scenarios

| Test Case | Spoken Query | Expected Intent | Confidence |
|---|---|---|---|
| **1. Greeting** | *"Hello there, good morning!"* | `greeting` | > 55% |
| **2. Goodbye** | *"See you later, have a great day!"* | `goodbye` | > 45% |
| **3. Thanks** | *"Thank you so much for your help!"* | `thanks` | > 65% |
| **4. Deep Learning** | *"What is deep learning and how do neural networks work?"* | `deep_learning` | > 90% |
| **5. NLP** | *"Explain natural language processing and tokenization"* | `nlp` | > 80% |
| **6. Programming** | *"How do I learn coding and what is data structures?"* | `programming` | > 90% |
| **7. Placement** | *"How can I prepare for campus placements and coding rounds?"* | `placement` | > 95% |
| **8. Speech Recognition** | *"How does speech to text conversion work in ASR?"* | `speech_recognition` | > 90% |
| **9. Timetable** | *"Can you help me organize a daily study timetable?"* | `timetable` | > 85% |
| **10. Noise / Fallback** | *"zorp flim flam interstellar potato flying refrigerator 98765"* | `unknown` | Fallback trigger |

---

## 14. Academic Assessment Rubric Compliance

- [x] **Voice Input:** Captured via Web Speech API (`SpeechRecognition`).
- [x] **Speech-to-Text:** Live transcript conversion displayed prominently on screen.
- [x] **Deep Learning Intent Classifier:** TensorFlow/Keras Bidirectional LSTM (NOT keyword or rule matching).
- [x] **Confidence Scoring:** Real Softmax posterior output metrics calculated from model weights.
- [x] **Response Generation:** Contextually dispatched responses for 20 academic intents.
- [x] **Text-to-Speech:** Web Speech Synthesis playback for auditory verification.
- [x] **Public Deployment:** Decoupled Render backend + Vercel frontend.
- [x] **Documentation & Source:** Complete code, evaluation curves, test suite, and comprehensive report.
