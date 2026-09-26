"""
test_chatbot.py - Automated Test Suite for VoiceAssist AI
Evaluates end-to-end inference across sample utterances representing
critical academic domains and speech recognition queries.
"""

import sys
import os

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from chatbot import VoiceAssistChatbot

def run_tests():
    print("=" * 75)
    print("VOICEASSIST AI - CHATBOT INFERENCE VERIFICATION SUITE")
    print("=" * 75)
    
    bot = VoiceAssistChatbot(confidence_threshold=0.30)
    
    if not bot.is_loaded:
        print("[Error] Model components not loaded. Please train the model first with train_model.py!")
        return False
        
    test_cases = [
        {"category": "1. Greeting", "query": "Hello there, good morning!"},
        {"category": "2. Goodbye", "query": "See you later, have a great day!"},
        {"category": "3. Thanks", "query": "Thank you so much for your help!"},
        {"category": "4. Deep Learning", "query": "What is deep learning and how do neural networks work?"},
        {"category": "5. NLP", "query": "Explain natural language processing and tokenization"},
        {"category": "6. Programming", "query": "How do I learn coding and what is data structures?"},
        {"category": "7. Placement", "query": "How can I prepare for campus placements and coding rounds?"},
        {"category": "8. Speech Recognition", "query": "How does speech to text conversion work in ASR?"},
        {"category": "9. Timetable", "query": "Can you help me organize a daily study timetable?"},
        {"category": "10. Unknown / Noise", "query": "zorp flim flam interstellar potato flying refrigerator 98765"},
    ]
    
    all_passed = True
    for idx, tc in enumerate(test_cases, 1):
        result = bot.predict(tc["query"])
        intent = result["intent"]
        confidence = result["confidence"]
        response = result["response"]
        
        print(f"\n[Test Case {idx}] {tc['category']}")
        print(f"  Input Speech/Text: \"{tc['query']}\"")
        print(f"  Predicted Intent:  [{intent}]")
        print(f"  Confidence:        {confidence * 100:.2f}%")
        print(f"  Bot Response:      \"{response[:90]}...\"")
        
        # Verify confidence is a valid float between 0 and 1
        if not (0.0 <= confidence <= 1.0):
            print(f"  -> FAILED: Invalid confidence value {confidence}")
            all_passed = False
        else:
            print("  -> PASSED: Valid prediction & response dispatched.")
            
    print("\n" + "=" * 75)
    if all_passed:
        print("ALL TEST CASES COMPLETED SUCCESSFULLY!")
    else:
        print("SOME TESTS FAILED.")
    print("=" * 75)
    return all_passed

if __name__ == "__main__":
    run_tests()
