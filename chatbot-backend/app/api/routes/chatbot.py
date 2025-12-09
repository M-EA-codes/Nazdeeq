from fastapi import APIRouter
from app.models.schemas import ChatRequest, ChatResponse
from app.services.chatbot_service import ChatbotService

router = APIRouter()
chatbot_service = ChatbotService()

@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Handle chatbot queries"""
    return await chatbot_service.process_message(request.message, request.user_id)
