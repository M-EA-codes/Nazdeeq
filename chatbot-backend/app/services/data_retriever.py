from typing import List, Dict, Any
from app.core.database import db
from bson import ObjectId

class DataRetriever:
    def _convert_objectid(self, data: Any) -> Any:
        """Recursively convert ObjectId to string"""
        if isinstance(data, ObjectId):
            return str(data)
        elif isinstance(data, dict):
            return {k: self._convert_objectid(v) for k, v in data.items()}
        elif isinstance(data, list):
            return [self._convert_objectid(item) for item in data]
        return data
    
    async def fetch(self, collection: str, query: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Fetch data from MongoDB based on query"""
        
        database = db.get_db()
        collection_obj = database[collection]
        
        cursor = collection_obj.find(query).limit(10)
        results = await cursor.to_list(length=10)
        
        # Convert all ObjectId to string recursively
        return [self._convert_objectid(result) for result in results]
