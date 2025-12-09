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
                and_conditions.append({"location.address": {"$regex": params["location"], "$options": "i"}})
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
            # Always use $and to combine with other query conditions
            if query:
                # If there are already conditions in query, combine them
                final_conditions = [{k: v} for k, v in query.items()]
                final_conditions.extend(and_conditions)
                query = {"$and": final_conditions}
            elif len(and_conditions) == 1:
                # If only one condition and no other query params, use it directly
                query = and_conditions[0]
            else:
                # Multiple conditions, use $and
                query["$and"] = and_conditions
        
        return query
