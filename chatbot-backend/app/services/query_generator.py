from typing import Dict, Any

class QueryGenerator:
    def generate(self, intent: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """Generate MongoDB query from intent and parameters"""
        
        query = {}
        and_conditions = []
        
        # 1. Handle Date (Direct match)
        # 1. Handle Date
        if params.get("date"):
            if intent == "events":
                # Match partial date string in ISO dateTime (e.g. "2025-02-20" matches "2025-02-20T10...")
                query["dateTime"] = {"$regex": params["date"], "$options": "i"}
            else:
                query["date"] = params["date"]
        
        # 2. Handle Location
        if params.get("location"):
            if intent == "rides":
                # Specific logic for rides
                and_conditions.append({
                    "$or": [
                        {"origin.address": {"$regex": params["location"], "$options": "i"}},
                        {"destination.address": {"$regex": params["location"], "$options": "i"}}
                    ]
                })
            elif intent == "events":
                 # Events store location as an object with an address field
                 query["location.address"] = {"$regex": params["location"], "$options": "i"}
            else:
                # Default behavior
                query["location"] = {"$regex": params["location"], "$options": "i"}
        
        # 3. Handle Category
        if params.get("category"):
            query["category"] = {"$regex": params["category"], "$options": "i"}
        
        # 4. Handle Keywords (Search in title)
        if params.get("keywords"):
            # Note: This checks if ANY keyword matches the title
            keyword_conditions = [
                {"title": {"$regex": kw, "$options": "i"}} 
                for kw in params["keywords"]
            ]
            if keyword_conditions:
                 and_conditions.append({"$or": keyword_conditions})
        
        # Combine conditions
        if and_conditions:
            if len(and_conditions) == 1:
                # If only one complex condition, merge it into top level if possible
                # (Matches keys like $or)
                query.update(and_conditions[0])
            else:
                # If multiple complex conditions (e.g. location OR... AND keywords OR...), use $and
                query["$and"] = and_conditions
        
        return query
