from typing import Dict, Any, List
import google.generativeai as genai
import json
import re
from app.core.config import settings

class IntentClassifier:
    def __init__(self):
        genai.configure(api_key=settings.GEMINI_API_KEY)
        self.model = genai.GenerativeModel('gemini-2.5-flash')
    
    async def classify(self, message: str, history: List[Dict[str, str]] = []) -> Dict[str, Any]:
        """Classify user intent and extract parameters"""
        
        history_text = ""
        if history:
            history_text = "Previous conversation:\n" + "\n".join([f"- {msg['role']}: {msg['content']}" for msg in history]) + "\n"

        prompt = f"""Analyze the user query and determine the intent based on the conversation history.

{history_text}
Available intents:
- events: User wants to find events, gatherings, activities, parties, celebrations
- rides: User wants to find rides, carpools, transportation, travel options
- services: User wants to find services, help, workers, professionals, assistance
- general: General greetings, questions, or conversation (hi, hello, how are you, thank you, etc.) or follow-up questions from previous context.

Extract parameters only if intent is events/rides/services:
- date: Any date/time mentioned
- location: Any location mentioned
- category: Type/category
- keywords: Important search words

User query: "{message}"

Return ONLY valid JSON:
{{"intent": "events|rides|services|general", "params": {{"date": "", "location": "", "category": "", "keywords": []}}}}
"""
        
        try:
            response = await self.model.generate_content_async(prompt)
            text = response.text.strip()
            
            # Extract JSON from markdown code blocks if present
            json_match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', text, re.DOTALL)
            if json_match:
                text = json_match.group(1)
            
            result = json.loads(text)
            return result
            
        except Exception as e:
            print(f"Error in intent classification: {e}")
            return {
                "intent": "general",
                "params": {"date": "", "location": "", "category": "", "keywords": []}
            }
