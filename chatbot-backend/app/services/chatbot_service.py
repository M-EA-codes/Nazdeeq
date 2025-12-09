from app.services.intent_classifier import IntentClassifier
from app.services.param_extractor import ParamExtractor
from app.services.query_generator import QueryGenerator
from app.services.data_retriever import DataRetriever
from app.services.response_formatter import ResponseFormatter
from app.services.chat_history import ChatHistoryService
from app.models.schemas import ChatResponse
import logging

logger = logging.getLogger(__name__)

class ChatbotService:
    def __init__(self):
        self.intent_classifier = IntentClassifier()
        self.param_extractor = ParamExtractor()
        self.query_generator = QueryGenerator()
        self.data_retriever = DataRetriever()
        self.response_formatter = ResponseFormatter()
        self.chat_history = ChatHistoryService()
    
    def _filter_data(self, intent: str, data: list) -> list:
        """Filter data to return only relevant fields"""
        filtered = []
        
        for item in data:
            if intent == "services":
                filtered.append({
                    "title": item.get("title"),
                    "description": item.get("description"),
                    "location": item.get("location")
                })
            elif intent == "events":
                filtered.append({
                    "name": item.get("name"),
                    "description": item.get("description")
                })
            elif intent == "rides":
                filtered.append({
                    "origin": item.get("origin"),
                    "destination": item.get("destination"),
                    "seatsAvailable": item.get("seatsAvailable")
                })
        
        return filtered
    
    async def process_message(self, message: str, user_id: str = None) -> ChatResponse:
        """Main orchestration method"""
        
        logger.info(f"Processing message: {message} for user: {user_id}")
        
        # Get history first
        history = []
        if user_id:
            history = await self.chat_history.get_history(user_id)
        
        # Step 1: Classify intent and extract raw parameters
        classification = await self.intent_classifier.classify(message, history)
        intent = classification["intent"]
        raw_params = classification["params"]
        logger.info(f"Intent: {intent}, Raw params: {raw_params}")
        
        # Save user message to history
        if user_id:
            await self.chat_history.add_message(user_id, "user", message)

        data = []
        # Handle general queries without database search or specific searches
        if intent != "general":
             # Step 2: Process and normalize parameters
            params = self.param_extractor.extract(raw_params)
            logger.info(f"Normalized params: {params}")
            
            # Step 3: Generate MongoDB query
            query = self.query_generator.generate(intent, params)
            logger.info(f"MongoDB query: {query}")
            
            # Step 4: Retrieve data from appropriate collection
            collection_map = {
                "events": "events",
                "rides": "rides",
                "services": "services"
            }
            collection = collection_map.get(intent, "events")
            logger.info(f"Querying collection: {collection}")
            data = await self.data_retriever.fetch(collection, query)
            logger.info(f"Found {len(data)} results")
        
        # Step 5: Format response with LLM (now with history content)
        # Note: We pass the *current* extracted data.
        response_text = await self.response_formatter.format(message, intent, data, history)
        
        # Save bot response to history
        if user_id:
            await self.chat_history.add_message(user_id, "model", response_text)

        # Step 6: Filter data to return only relevant fields
        filtered_data = self._filter_data(intent, data)
        
        return ChatResponse(
            response=response_text,
            data=filtered_data,
            intent=intent
        )
