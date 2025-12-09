from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import chatbot
from app.core.config import settings
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

app = FastAPI(title="Nazdeeq Chatbot API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chatbot.router, prefix="/api/v1")

@app.get("/")
def root():
    return {"message": "Nazdeeq Chatbot API"}
