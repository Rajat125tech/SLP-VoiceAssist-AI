"""
chatbot.py - VoiceAssist AI Inference Engine
Loads the trained TensorFlow BiLSTM model, Tokenizer, and Label Encoder,
and performs real-time intent prediction and response dispatching.
"""

import os
import json
import random
import pickle
import numpy as np
import tensorflow as tf
from tensorflow.keras.preprocessing.sequence import pad_sequences

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "model", "intent_model.keras")
TOKENIZER_PATH = os.path.join(BASE_DIR, "model", "tokenizer.pickle")
LABEL_ENCODER_PATH = os.path.join(BASE_DIR, "model", "label_encoder.pickle")
METADATA_PATH = os.path.join(BASE_DIR, "model", "model_metadata.json")
DATASET_PATH = os.path.join(BASE_DIR, "dataset", "intents.json")

class VoiceAssistChatbot:
    def __init__(self, confidence_threshold: float = 0.50):
        self.confidence_threshold = confidence_threshold
        self.model = None
        self.tokenizer = None
        self.label_encoder = None
        self.metadata = {}
        self.intents_data = {}
        self.max_length = 25
        self.is_loaded = False
        self.load_components()

    def load_components(self):
        """Loads model, tokenizer, encoder, and dataset responses into memory."""
        try:
            # 1. Load Dataset for Responses
            if os.path.exists(DATASET_PATH):
                with open(DATASET_PATH, "r", encoding="utf-8") as f:
                    self.intents_data = json.load(f)
            else:
                print(f"[Warning] Dataset file not found at {DATASET_PATH}")

            # 2. Load Model Metadata
            if os.path.exists(METADATA_PATH):
                with open(METADATA_PATH, "r", encoding="utf-8") as f:
                    self.metadata = json.load(f)
                    self.max_length = self.metadata.get("max_length", 25)
                    if "confidence_threshold" in self.metadata:
                        self.confidence_threshold = float(self.metadata["confidence_threshold"])

            # 3. Load Trained Model
            if os.path.exists(MODEL_PATH):
                self.model = tf.keras.models.load_model(MODEL_PATH)
                print(f"[Chatbot] Loaded Deep Learning model from {MODEL_PATH}")
            else:
                print(f"[Warning] Model file not found at {MODEL_PATH}")

            # 4. Load Tokenizer
            if os.path.exists(TOKENIZER_PATH):
                with open(TOKENIZER_PATH, "rb") as handle:
                    self.tokenizer = pickle.load(handle)
                print(f"[Chatbot] Loaded Tokenizer from {TOKENIZER_PATH}")

            # 5. Load Label Encoder
            if os.path.exists(LABEL_ENCODER_PATH):
                with open(LABEL_ENCODER_PATH, "rb") as handle:
                    self.label_encoder = pickle.load(handle)
                print(f"[Chatbot] Loaded Label Encoder from {LABEL_ENCODER_PATH}")

            if self.model and self.tokenizer and self.label_encoder:
                self.is_loaded = True
                print("[Chatbot] All Deep Learning components successfully initialized.")
        except Exception as e:
            print(f"[Error] Failed to initialize VoiceAssistChatbot: {str(e)}")
            self.is_loaded = False

    def get_response_for_intent(self, intent_tag: str) -> str:
        """Retrieves an appropriate response for the predicted intent."""
        if not self.intents_data or "intents" not in self.intents_data:
            return "I understood your query, but could not load responses from the dataset."

        for item in self.intents_data["intents"]:
            if item["intent"] == intent_tag:
                responses = item.get("responses", [])
                if responses:
                    return random.choice(responses)

        # Fallback if specific tag not found
        return "I'm not completely sure I understood that. Could you rephrase your question?"

    def predict(self, text: str) -> dict:
        """
        Executes the end-to-end inference pipeline:
        Text -> Preprocessing -> Tokenizer Sequence -> Pad -> BiLSTM Prediction -> Softmax Probabilities -> Response
        """
        cleaned_text = text.strip() if text else ""
        if not cleaned_text:
            return {
                "text": "",
                "intent": "unknown",
                "confidence": 0.0,
                "response": "Please say or type something so I can help you.",
                "top_intents": []
            }

        if not self.is_loaded:
            # Model not yet trained or loaded
            return {
                "text": cleaned_text,
                "intent": "system_notice",
                "confidence": 0.0,
                "response": "The deep learning model is currently initializing. Please try again in a few moments.",
                "top_intents": []
            }

        # 1. Tokenize & Pad Sequence
        seq = self.tokenizer.texts_to_sequences([cleaned_text])
        padded_seq = pad_sequences(seq, maxlen=self.max_length, padding="post", truncating="post")

        # 2. Model Prediction
        probabilities = self.model.predict(padded_seq, verbose=0)[0]
        predicted_idx = int(np.argmax(probabilities))
        confidence = float(probabilities[predicted_idx])

        # 3. Decode Intent
        predicted_intent = str(self.label_encoder.inverse_transform([predicted_idx])[0])

        # 4. Extract Top 3 Intents with Probabilities for Transparency
        top_indices = np.argsort(probabilities)[::-1][:3]
        top_intents = [
            {
                "intent": str(self.label_encoder.inverse_transform([idx])[0]),
                "probability": round(float(probabilities[idx]), 4)
            }
            for idx in top_indices
        ]

        # 5. Apply Confidence Threshold Logic
        if confidence < self.confidence_threshold:
            final_intent = "unknown"
            response = self.get_response_for_intent("unknown")
        else:
            final_intent = predicted_intent
            response = self.get_response_for_intent(predicted_intent)

        return {
            "text": cleaned_text,
            "intent": final_intent,
            "confidence": round(confidence, 4),
            "response": response,
            "top_intents": top_intents
        }

    def get_info(self) -> dict:
        """Returns metadata about the deep learning model."""
        return {
            "status": "ready" if self.is_loaded else "not_loaded",
            "model_metadata": self.metadata,
            "confidence_threshold": self.confidence_threshold,
            "intents_count": len(self.label_encoder.classes_) if self.label_encoder else 0,
            "classes": list(self.label_encoder.classes_) if self.label_encoder else []
        }

# Global chatbot singleton instance
chatbot_engine = VoiceAssistChatbot()
