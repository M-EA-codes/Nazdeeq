# Implementation Plan: Chatbot Upgrade to Gemini Function Calling (Tools)

## Objective
Replace the current rigid `Intent -> Extract -> Query` pipeline with Gemini's native **Function Calling** capabilities. This will allow the chatbot to intelligently decide when to search the database, handle multi-turn conversations naturally, and manage complex queries without brittle regex logic.

## 1. Prerequisites & Setup
- **Upgrade Dependency**: The current `google-generativeai` version (`0.3.2`) is outdated. We need to upgrade to the latest version (e.g., `0.7.0` or newer) to support stable Function Calling features.
  - Action: Update `requirements.txt` and run installation.

## 2. Architecture Changes

### Old Flow (Pipeline)
`User Message` → `IntentClassifier` (classify) → `ParamExtractor` (regex) → `QueryGenerator` → `DB` → `ResponseFormatter` → `Final Response`

### New Flow (Agentic)
`User Message` → **Gemini Model** (with Tools) 
    → *Model decides to call tool?*
        → YES: Execute `search_tool()` → Return data to Model → Model generates answer.
        → NO: Model generates answer directly (e.g., for "Hi" or general questions).

## 3. Detailed Implementation Steps

### Step 1: Update Dependencies
- [ ] Modify `requirements.txt` to upgrade `google-generativeai`.
- [ ] Install the new version.

### Step 2: Define "Tools" (Search Functions)
Instead of a generic query generator, we will expose specific Python functions to Gemini.
Create a new utility or define these inside `ChatbotService`.

**Proposed Tools:**
1.  **`search_events(location: str, date: str, category: str, keywords: str)`**
    - Wraps `QueryGenerator` logic for 'events'.
    - Returns structured event data.
2.  **`find_rides(origin: str, destination: str, date: str)`**
    - Wraps `QueryGenerator` logic for 'rides'.
3.  **`find_services(location: str, category: str)`**
    - Wraps `QueryGenerator` logic for 'services'.

*Note: We will reuse the logic in `QueryGenerator` and `DataRetriever` but wrap them in these clean function interfaces.*

### Step 3: Refactor `ChatbotService`
- [ ] **Initialization**: Initialize `genai.GenerativeModel` with the `tools` list.
- [ ] **Chat Session**: Use `model.start_chat(history=...)` or `generate_content` with automatic function calling enabled.
- [ ] **Execution**:
    - Receive user message.
    - Send to model.
    - If model wants to call a function, execute it and pass the result back.
    - (The library's `enable_automatic_function_calling` feature can handle this loop automatically in newer versions).

### Step 4: Update `ChatHistoryService`
- [ ] The history format needs to match what the Gemini SDK expects (list of `{"role": "user"|"model", "parts": [...]}`).
- [ ] Update `get_history` to map the DB format to the SDK format.

### Step 5: Clean Up
- [ ] Deprecate/Remove `IntentClassifier`, `ParamExtractor`, and `ResponseFormatter` as the model now handles these tasks natively.

## 4. Why this is better
- **Flexibility**: The model understands "I need a ride from X to Y" implies the `find_rides` tool without us writing regex for "from" and "to".
- **Context**: If you say "What about tomorrow?", the model knows to call the tool again with the *new* date but keeping the *old* location from context.
- **Natural Responses**: No need for a separate `ResponseFormatter`; the model sees the tool output and naturally summarizes it.

## 5. Risk Assessment
- **Token Usage**: Passing tool definitions and history consumes more input tokens.
- **Latency**: Two round-trips to the LLM (one to decide tool, one to summarize result). We should ensure we fetch only necessary fields from DB to keep tool outputs small.
