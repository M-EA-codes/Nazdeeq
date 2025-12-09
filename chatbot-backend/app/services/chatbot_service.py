from app.services.chat_history import ChatHistoryService
from app.models.schemas import ChatResponse
from app.services.tools import tools_map, find_events, find_rides, find_services
from app.core.config import settings
import google.generativeai as genai
from google.protobuf.struct_pb2 import Struct
import logging
import json

from datetime import datetime

logger = logging.getLogger(__name__)

class ChatbotService:
    def __init__(self):
        genai.configure(api_key=settings.GEMINI_API_KEY)
        self.chat_history = ChatHistoryService()
        
        # Tools configuration
        # Note: We pass the actual functions to the model
        self.tools = [find_events, find_rides, find_services]
        
        current_date = datetime.now().strftime("%Y-%m-%d")
        system_instruction = f"""You are Nazdeeq's AI assistant. 
        Current Date: {current_date}.
        
        Rules:
        1. When calling search tools (find_events, find_rides), ALWAYS convert relative dates (today, tomorrow, next week, October) to numeric ISO format (YYYY-MM-DD or YYYY-MM).
        2. Never pass natural language for dates (e.g. do NOT pass 'October', pass '2025-10').
        3. Be friendly and concise.
        """
        
        # Initialize model with tools
        self.model = genai.GenerativeModel(
            'gemini-2.5-flash-lite',
            tools=self.tools,
            system_instruction=system_instruction
        )
    
    async def process_message(self, message: str, user_id: str = None) -> ChatResponse:
        """Main orchestration method using Gemini Function Calling"""
        
        logger.info(f"Processing message: {message} for user: {user_id}")
        
        # 1. Prepare History
        history = []
        if user_id:
            raw_history = await self.chat_history.get_history(user_id)
            for msg in raw_history:
                # Map 'user' -> 'user', 'model' -> 'model'
                # Ensure parts structure
                history.append({
                    "role": msg["role"],
                    "parts": [{"text": msg["content"]}]
                })
        
        # Ensure history starts with user (Gemini requirement)
        if history and history[0]["role"] != "user":
            history.pop(0)
        
        # 2. Start Chat Session
        chat = self.model.start_chat(history=history)
        
        # 3. Send Message and Handle Tool Loop
        collected_data = []
        detected_intent = "general"
        final_text = ""
        
        try:
            response = await chat.send_message_async(message)
            
            # Loop to handle up to 5 consecutive tool calls (handling chaining if needed)
            for _ in range(5):
                part = response.candidates[0].content.parts[0]
                
                # Check for function call
                if part.function_call:
                    fname = part.function_call.name
                    fargs = {k: v for k, v in part.function_call.args.items()}
                    
                    logger.info(f"Gemini invoked tool: {fname} with args: {fargs}")
                    
                    # Update intent tracker
                    if "events" in fname: detected_intent = "events"
                    elif "rides" in fname: detected_intent = "rides"
                    elif "services" in fname: detected_intent = "services"
                    
                    # Execute tool
                    tool_func = tools_map.get(fname)
                    if tool_func:
                        try:
                            tool_result = await tool_func(**fargs)
                            
                            # Collect data for frontend
                            if isinstance(tool_result, list):
                                collected_data.extend(tool_result)
                            
                            # Provide result back to model
                            # FunctionResponse structure
                            function_response = {
                                "function_response": {
                                    "name": fname,
                                    "response": {"result": tool_result} 
                                }
                            }
                            
                            response = await chat.send_message_async(function_response)
                            
                        except Exception as tool_err:
                            logger.error(f"Tool execution failed: {tool_err}")
                            # Send error back to model
                            err_resp = {
                                "function_response": {
                                    "name": fname,
                                    "response": {"error": str(tool_err)}
                                }
                            }
                            response = await chat.send_message_async(err_resp)
                    else:
                        logger.error(f"Unknown tool called: {fname}")
                        break
                else:
                    # No function call, this is the final text response
                    final_text = part.text
                    break
        
        except Exception as e:
            logger.error(f"Error in Gemini interaction: {e}")
            final_text = "I'm sorry, I'm having trouble connecting right now. Please try again."
            
        # 4. Save to History
        if user_id:
            await self.chat_history.add_message(user_id, "user", message)
            await self.chat_history.add_message(user_id, "model", final_text)
            
        return ChatResponse(
            response=final_text,
            data=collected_data,
            intent=detected_intent
        )
