from typing import Dict, Any
from datetime import datetime, timedelta
import re

class ParamExtractor:
    def extract(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Process and normalize extracted parameters for MongoDB query"""
        
        processed = {}
        
        # Process date
        if params.get("date"):
            processed["date"] = self._parse_date(params["date"])
        
        # Process location
        if params.get("location"):
            processed["location"] = params["location"].strip()
        
        # Process category
        if params.get("category"):
            processed["category"] = params["category"].strip()
        
        # Process keywords
        if params.get("keywords"):
            processed["keywords"] = [kw.strip() for kw in params["keywords"] if kw.strip()]
        
        return processed
    
    def _parse_date(self, date_str: str) -> str:
        """Convert relative dates to actual dates"""
        
        date_str = date_str.lower().strip()
        today = datetime.now()
        
        if date_str in ["today", "tonight"]:
            return today.strftime("%Y-%m-%d")
        elif date_str == "tomorrow":
            return (today + timedelta(days=1)).strftime("%Y-%m-%d")
        elif date_str == "yesterday":
            return (today - timedelta(days=1)).strftime("%Y-%m-%d")
        elif "next week" in date_str:
            return (today + timedelta(weeks=1)).strftime("%Y-%m-%d")
        elif "this week" in date_str:
            return today.strftime("%Y-%m-%d")
        
        # Try to parse YYYY-MM-DD format
        if re.match(r'\d{4}-\d{2}-\d{2}', date_str):
            return date_str
        
        return date_str
