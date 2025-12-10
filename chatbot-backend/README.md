# Nazdeeq Chatbot Backend

## Architecture

```
chatbot-backend/
├── app/
│   ├── api/
│   │   └── routes/
│   │       └── chatbot.py          # API endpoints
│   ├── core/
│   │   ├── config.py               # Configuration settings
│   │   └── database.py             # MongoDB connection
│   ├── models/
│   │   └── schemas.py              # Pydantic models
│   ├── services/
│   │   ├── intent_classifier.py    # Intent classification
│   │   ├── query_generator.py      # MongoDB query generation
│   │   ├── data_retriever.py       # Data fetching
│   │   ├── response_formatter.py   # Response formatting
│   │   └── chatbot_service.py      # Main orchestration
│   └── utils/                      # Utility functions
├── main.py                         # Application entry point
├── requirements.txt
└── .env.example
```

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Update `.env` with your MongoDB URL and Gemini API key

4. Run the server:
```bash
uvicorn main:app --reload
```

5. In another terminal, run the CLI:
```bash
python cli.py
```

## API Endpoint

**POST** `/api/v1/chat`

Request:
```json
{
  "message": "Show me events happening tomorrow",
  "user_id": "optional_user_id"
}
```

Response:
```json
{
  "response": "I found 5 event(s) for you.",
  "data": [...],
  "intent": "events"
}
```

## Flow

1. **Intent Classifier** - Identifies what user wants (events/rides/services)
2. **Query Generator** - Converts to MongoDB query
3. **Data Retriever** - Fetches from MongoDB
4. **Response Formatter** - Creates natural language response
