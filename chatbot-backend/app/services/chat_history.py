from typing import List, Dict
from app.core.database import db
from datetime import datetime

class ChatHistoryService:
    def __init__(self):
        self.collection_name = "chat_history"

    async def get_history(self, user_id: str, limit: int = 5) -> List[Dict[str, str]]:
        if not user_id:
            return []
            
        database = db.get_db()
        collection = database[self.collection_name]
        
        # optimized query: find the document for user and slice the last 'limit' messages
        doc = await collection.find_one(
            {"user_id": user_id},
            {"messages": {"$slice": -limit}}
        )
        
        if not doc or "messages" not in doc:
            return []
            
        # MongoDB $slice returns them in the order they exist in array (chronological)
        # So we don't need to reverse them unless they were stored differently.
        # But our previous implementation needed them in chronological order for LLM.
        # $push appends to end, so they are already chronological.
        
        return [
            {"role": msg["role"], "content": msg["content"]}
            for msg in doc["messages"]
        ]

    async def add_message(self, user_id: str, role: str, content: str):
        if not user_id:
            return
            
        database = db.get_db()
        collection = database[self.collection_name]
        
        new_message = {
            "role": role,
            "content": content,
            "timestamp": datetime.utcnow()
        }
        
        # Upsert: create doc if doesn't exist, otherwise push to messages array
        await collection.update_one(
            {"user_id": user_id},
            {
                "$push": {"messages": new_message},
                "$set": {"last_updated": datetime.utcnow()}
            },
            upsert=True
        )
