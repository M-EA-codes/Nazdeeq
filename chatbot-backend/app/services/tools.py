from app.services.query_generator import QueryGenerator
from app.services.data_retriever import DataRetriever
from typing import Optional, List, Dict, Any

query_generator = QueryGenerator()
data_retriever = DataRetriever()

async def find_events(location: str = None, date: str = None, category: str = None, keywords: str = None) -> List[Dict[str, Any]]:
    """
    Search for events based on location, date, category, or keywords.
    
    Args:
        location: The location of the event (city, area, etc.)
        date: The date to filter by. MUST be in ISO 8601 format (YYYY-MM-DD) or YYYY-MM. 
              Convert relative dates like "today", "tomorrow", "October" to numeric strings (e.g. "2025-10-07" or "2025-10").
        category: The category of the event (music, sports, etc.)
        keywords: Specific keywords to look for in the event title (e.g., "concert", "workshop")
    """
    params = {
        "location": location,
        "date": date,
        "category": category,
        "keywords": [keywords] if keywords else []
    }
    # Clean None values
    params = {k: v for k, v in params.items() if v}
    
    query = query_generator.generate("events", params)
    results = await data_retriever.fetch("events", query)
    
    filtered = []
    for item in results:
        # Extract location address safely
        loc = item.get("location")
        address = loc.get("address") if isinstance(loc, dict) else loc
        
        filtered.append({
            "name": item.get("name"),
            "description": item.get("description"),
            "date": item.get("dateTime"), # Mapped from dateTime
            "location": address,
             # Include other potentially useful fields if they exist
             "groupId": item.get("groupId")
        })
    return filtered

async def find_rides(location: str = None, date: str = None) -> List[Dict[str, Any]]:
    """
    Search for available rides or carpools.
    
    Args:
        location: A location component to search for (matches either origin or destination address)
        date: The date of the ride. MUST be in ISO 8601 format (YYYY-MM-DD). 
              Convert relative dates like "today", "tomorrow" to numeric strings (e.g. "2025-12-09").
    """
    params = {
        "location": location,
        "date": date
    }
    params = {k: v for k, v in params.items() if v}
    
    query = query_generator.generate("rides", params)
    results = await data_retriever.fetch("rides", query)
    
    filtered = []
    for item in results:
        filtered.append({
            "origin": item.get("origin"),
            "destination": item.get("destination"),
            "seatsAvailable": item.get("seatsAvailable"),
            "date": item.get("date"),
            "time": item.get("time")
        })
    return filtered

async def find_services(location: str = None, category: str = None, keywords: str = None) -> List[Dict[str, Any]]:
    """
    Search for local services, help, or professionals.
    
    Args:
        location: The location or area
        category: The category of service (e.g., "plumber", "tutor")
        keywords: Keywords to search in title
    """
    params = {
        "location": location,
        "category": category,
        "keywords": [keywords] if keywords else []
    }
    params = {k: v for k, v in params.items() if v}
    
    query = query_generator.generate("services", params)
    results = await data_retriever.fetch("services", query)
    
    filtered = []
    for item in results:
        filtered.append({
            "title": item.get("title"),
            "description": item.get("description"),
            "location": item.get("location"),
            "contact": item.get("contact") # Assuming there's contact info
        })
    return filtered

# Map tools to their functions for easy lookup
tools_map = {
    "find_events": find_events,
    "find_rides": find_rides,
    "find_services": find_services
}
