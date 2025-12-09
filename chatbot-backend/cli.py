import requests
import json
import uuid

USER_ID = str(uuid.uuid4())

BASE_URL = "http://localhost:8000/api/v1"

def chat(message):
    try:
        response = requests.post(
            f"{BASE_URL}/chat",
            json={"message": message, "user_id": USER_ID},
            timeout=30
        )
        data = response.json()
        
        print(f"\n🤖 {data['response']}")
        
        if data.get('data'):
            print(f"\n📊 Found {len(data['data'])} result(s):")
            for i, item in enumerate(data['data'][:3], 1):
                print(f"  {i}. {item.get('title', item.get('name', 'Item'))}")
        
        print(f"\n[Intent: {data.get('intent', 'unknown')}]")
        
    except requests.exceptions.ConnectionError:
        print("\n❌ Error: Cannot connect to server. Is it running?")
    except Exception as e:
        print(f"\n❌ Error: {e}")

if __name__ == "__main__":
    print("=" * 50)
    print("Nazdeeq Chatbot CLI")
    print("=" * 50)
    print("Type 'exit' or 'quit' to stop\n")
    
    while True:
        try:
            user_input = input("You: ").strip()
            
            if user_input.lower() in ['exit', 'quit', 'q']:
                print("\nGoodbye!")
                break
            
            if not user_input:
                continue
            
            chat(user_input)
            print()
            
        except KeyboardInterrupt:
            print("\n\nGoodbye!")
            break
