from typing import List, Dict, Any
import google.generativeai as genai
from app.core.config import settings

class ResponseFormatter:
    def __init__(self):
        genai.configure(api_key=settings.GEMINI_API_KEY)
        self.model = genai.GenerativeModel('gemini-2.5-flash')
    
    def _extract_fields(self, intent: str, data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Extract relevant fields based on intent"""
        extracted = []
        
        for item in data:
            if intent == "services":
                extracted.append({
                    "title": item.get("title", ""),
                    "description": item.get("description", ""),
                    "location": item.get("location", "")
                })
            elif intent == "events":
                extracted.append({
                    "name": item.get("name", ""),
                    "description": item.get("description", "")
                })
            elif intent == "rides":
                extracted.append({
                    "origin": item.get("origin", ""),
                    "destination": item.get("destination", ""),
                    "seatsAvailable": item.get("seatsAvailable", 0)
                })
        
        return extracted
    
    async def format(self, message: str, intent: str, data: List[Dict[str, Any]], history: List[Dict[str, str]] = []) -> str:
        """Format data into natural language response using LLM"""
        
        history_text = ""
        if history:
            history_text = "Context from previous conversation:\n" + "\n".join([f"- {msg['role']}: {msg['content']}" for msg in history]) + "\n"

        extracted = self._extract_fields(intent, data)
        
        prompt = f"""You are a helpful AI assistant for Nazdeeq, a community app for finding local events, rides, and services.
        
{history_text}
Current User Query: "{message}"
Detected Intent: {intent}
Search Results: {extracted}

Instructions:
1. If 'general' intent: Respond naturally to the user.
2. If data is found: Summarize the results in a friendly way. Don't list raw JSON.
3. If no data found for specific intent: Apologize and suggest checking other dates or locations.
4. Keep it concise (under 50 words unless listing detailed results).

Response:"""
        
        try:
            response = await self.model.generate_content_async(prompt)
            return response.text.strip()
        except Exception as e:
            print(f"Error generating response: {e}")
            if data:
                return f"I found {len(data)} {intent} for you."
            return "I'm sorry, I'm having trouble processing that right now."
