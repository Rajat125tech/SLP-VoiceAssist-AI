"""
test_chatbot.py - Automated Test Suite for VoiceAssist AI
Evaluates end-to-end inference across:
1. Canonical academic queries
2. Unseen paraphrased generalization queries (TASK 5)
3. Realistic out-of-domain and noise queries (TASK 6)
4. Empirically calibrated confidence threshold behavior (TASK 7)
"""

import sys
import os

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from chatbot import VoiceAssistChatbot

def run_tests():
    print("=" * 80)
    print("VOICEASSIST AI - CHATBOT INFERENCE & GENERALIZATION VERIFICATION SUITE")
    print("=" * 80)
    
    # Instantiate chatbot with empirically calibrated confidence threshold
    bot = VoiceAssistChatbot(confidence_threshold=0.50)
    
    if not bot.is_loaded:
        print("[Error] Model components not loaded. Please train the model first with train_model.py!")
        return False
        
    test_cases = [
        # 1. Basic Conversational Intents
        {"category": "1. Greeting", "query": "Hello there, good morning!", "expected": "greeting"},
        {"category": "2. Goodbye", "query": "See you later, have a wonderful day!", "expected": "goodbye"},
        {"category": "3. Thanks", "query": "Thank you so much for your assistance!", "expected": "thanks"},
        
        # 2. Generalization Test Cases (Unseen phrasing - TASK 5)
        {"category": "4. Deep Learning (Generalization)", "query": "Can you explain how deep neural networks work?", "expected": "deep_learning"},
        {"category": "5. Placement (Generalization)", "query": "What should I study before campus recruitment?", "expected": "placement"},
        {"category": "6. Programming (Generalization)", "query": "How do I learn coding and what is data structures?", "expected": "programming"},
        {"category": "7. Speech Recognition (Generalization)", "query": "How does speech to text conversion work in ASR?", "expected": "speech_recognition"},
        {"category": "8. NLP (Generalization)", "query": "Explain natural language processing and tokenization", "expected": "nlp"},
        {"category": "9. Study Help (Generalization)", "query": "What active learning techniques help retain formulas?", "expected": "study_help"},
        {"category": "10. Timetable (Generalization)", "query": "Can you help me organize a daily study timetable?", "expected": "timetable"},
        {"category": "11. Exams (Generalization)", "query": "How can I score higher marks in semester exams?", "expected": "exams"},
        {"category": "12. Projects (Generalization)", "query": "How should we organize software architecture in capstone reports?", "expected": "projects"},
        {"category": "13. Internship (Generalization)", "query": "How can I apply for summer internships in tech companies?", "expected": "internship"},
        
        # 3. Realistic Out-of-Domain Queries (TASK 6)
        {"category": "14. OOD - Geography", "query": "What is the capital of France?", "expected": "unknown"},
        {"category": "15. OOD - Weather", "query": "Tell me today's weather.", "expected": "unknown"},
        {"category": "16. OOD - Sports", "query": "Who won yesterday's cricket match?", "expected": "unknown"},
        {"category": "17. OOD - Finance/Crypto", "query": "What is the price of Bitcoin?", "expected": "unknown"},
        
        # 4. Out-of-Domain Noise / Sanity Check (TASK 6)
        {"category": "18. Synthetic Noise", "query": "zorp flim flam interstellar potato flying refrigerator 98765", "expected": "unknown"},
    ]
    
    all_passed = True
    print(f"Executing {len(test_cases)} automated inference tests...\n")
    
    passed_count = 0
    for idx, tc in enumerate(test_cases, 1):
        result = bot.predict(tc["query"])
        intent = result["intent"]
        confidence = result["confidence"]
        response = result["response"]
        expected = tc["expected"]
        
        # Verify valid probabilities and non-empty response
        valid_conf = (0.0 <= confidence <= 1.0)
        valid_resp = bool(response and len(response.strip()) > 0)
        matches_expected = (intent == expected)
        
        status = "PASSED" if (valid_conf and valid_resp and matches_expected) else "FAILED"
        if status == "PASSED":
            passed_count += 1
        else:
            all_passed = False
            
        print(f"[{status}] Test #{idx:02d} | Category: {tc['category']}")
        print(f"  Input Text:       \"{tc['query']}\"")
        print(f"  Predicted Intent: [{intent}] (Expected: [{expected}])")
        print(f"  Confidence:       {confidence * 100:.2f}% (Threshold: {bot.confidence_threshold * 100:.1f}%)")
        top_summary = [(t['intent'], str(round(t['probability'] * 100, 1)) + "%") for t in result.get('top_intents', [])]
        print(f"  Top Intents:      {top_summary}")
        print(f"  Response Excerpt: \"{response[:85]}...\"\n")
            
    print("=" * 80)
    print(f"SUMMARY: {passed_count}/{len(test_cases)} TESTS PASSED ({(passed_count/len(test_cases))*100:.1f}%)")
    print("=" * 80)
    return all_passed

if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)
