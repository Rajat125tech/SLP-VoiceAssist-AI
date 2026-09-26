"""
main.py - FastAPI Backend Service for VoiceAssist AI
Exposes RESTful endpoints for speech text intent classification,
conversational response dispatch, and model inspection.
"""

import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

from chatbot import chatbot_engine

app = FastAPI(
    title="VoiceAssist AI API",
    description="Speech and Language Processing (SLP) Lab - Voice-Enabled Deep Learning Chatbot Backend",
    version="1.0.0"
)

# Enable CORS for cross-origin requests (Vercel frontend, local development, etc.)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins for academic/demo deployment
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request & Response Schemas
class ChatRequest(BaseModel):
    message: Optional[str] = Field(None, description="User spoken or typed text")
    text: Optional[str] = Field(None, description="Alternative field for user text")

class TopIntent(BaseModel):
    intent: str
    probability: float

class ChatResponse(BaseModel):
    message: str
    text: str
    intent: str
    confidence: float
    response: str
    top_intents: List[TopIntent]

@app.get("/")
def read_root():
    return {
        "project": "VoiceAssist AI – A Voice-Enabled Deep Learning Chatbot",
        "author": "SLP Lab Assessment",
        "status": "online",
        "endpoints": {
            "health": "/health",
            "chat": "POST /chat",
            "predict": "POST /predict",
            "model_info": "GET /model-info"
        }
    }

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "VoiceAssist AI Backend",
        "model_loaded": chatbot_engine.is_loaded
    }

@app.post("/chat", response_model=ChatResponse)
def chat_endpoint(payload: ChatRequest):
    # Support either 'message' or 'text' key in request payload
    input_text = payload.message if payload.message is not None else payload.text
    if input_text is None:
        raise HTTPException(status_code=400, detail="Missing required field 'message' or 'text'.")

    result = chatbot_engine.predict(input_text)
    return {
        "message": result["text"],
        "text": result["text"],
        "intent": result["intent"],
        "confidence": result["confidence"],
        "response": result["response"],
        "top_intents": result["top_intents"]
    }

@app.post("/predict")
def predict_endpoint(payload: ChatRequest):
    input_text = payload.message if payload.message is not None else payload.text
    if input_text is None:
        raise HTTPException(status_code=400, detail="Missing required field 'message' or 'text'.")

    return chatbot_engine.predict(input_text)

@app.get("/model-info")
def model_info_endpoint():
    return chatbot_engine.get_info()

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
