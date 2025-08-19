# Sous - Multi-Agent Recipe Discovery System

## Overview

Sous is a multi-agent AI system that demonstrates advanced orchestration patterns for recipe discovery and management. The system implements context-aware routing between specialized agents, stateful workflow management, and real-time streaming responses using NDJSON.

## Technical Architecture

### Multi-Agent System Design

The core of Sous is built on a multi-agent architecture using Pydantic-AI for orchestration:

```
┌──────────────────────────────────────────────────────────┐
│                    Orchestrator Agent                     │
│         (Intent Classification & Routing Logic)           │
└─────────┬──────────────┬──────────────┬──────────────────┘
          │              │              │
          ▼              ▼              ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ FridgeAgent  │ │ RecipeAgent  │ │   QAAgent    │
│              │ │              │ │              │
│ - Vision     │ │ - NLP Query  │ │ - General    │
│   Analysis   │ │   Extraction │ │   Q&A        │
│ - Ingredient │ │ - Parameter  │ │ - Context    │
│   Extract    │ │   Parsing    │ │   Aware      │
│ - Formatter  │ │ - Search     │ │              │
└──────────────┘ └──────────────┘ └──────────────┘
```

### Agent Implementation Details

#### 1. **Orchestrator** (`orchestrator.py`)
Central routing agent that implements intent classification through both LLM-based and fallback keyword-based methods:
```python
async def classify_intent_llm(self, query: str) -> str:
    # Uses Gemini LLM for intent classification
    # Returns: 'fridge_image', 'recipe_search', or 'general_qa'
```

#### 2. **FridgeAgent** (`fridge_agent.py`)
Handles computer vision workflows with stateful processing:
- **Dependency Injection**: Uses `Deps` dataclass for context management
- **Progressive Updates**: Streams each processing step via async generators
- **Workflow Steps**:
  1. Image analysis using Gemini Vision API
  2. Ingredient extraction and validation
  3. Ingredient formatting for optimal search
  4. Recipe discovery with ingredient matching
  5. Bulk detail retrieval with enhancement

#### 3. **RecipeAgent** (`recipe_agent.py`)
Processes natural language queries with structured extraction:
- **Query Extractor**: Pydantic-AI agent for parameter extraction
- **Complex Search**: Maps NL queries to API parameters
- **Type Safety**: Pydantic models for validation

#### 4. **QAAgent** (`qa_agent.py`)
General cooking knowledge agent with result type validation.

### Stateful Workflow Management

The system implements dependency injection for stateful context management:

```python
@dataclass
class Deps:
    client: AsyncClient
    spoonacular_api_key: str
    gemini_api_key: str
    
    # Workflow state management
    has_image: bool = False
    image_base64: Optional[str] = None
    extracted_ingredients: Optional[ExtractedIngredients] = None
    formatted_ingredients: Optional[str] = None
    ingredient_search_results: Optional[List[Dict]] = None
    recipe_details: Optional[List[RecipeDetails]] = None
```

This pattern enables:
- Clean separation of concerns
- Testable components
- Progressive state accumulation
- Error recovery at any workflow stage

### Real-time Streaming Architecture

#### NDJSON Streaming Implementation
The system uses Server-Sent Events with NDJSON format for real-time updates:

```python
async def stream_updates() -> AsyncGenerator[str, None]:
    async for msg in result:
        yield StreamResponse(**msg).model_dump_json() + "\n"
```

#### Stream Message Types
```typescript
interface StreamData {
  type: "step" | "complete" | "error";
  step?: string;
  status?: "in_progress" | "complete";
  message?: string;
  data?: any;
  summary?: any;
}
```

This enables progressive UI updates without blocking on long-running operations.

### Computer Vision Pipeline

The Gemini Vision integration implements robust image processing:

1. **Base64 Decoding**: Handles both data URLs and raw base64
2. **Image Validation**: PIL-based verification before API calls
3. **Prompt Engineering**: Structured prompts for accurate extraction
4. **Result Parsing**: Regex-based cleaning and validation
5. **Error Recovery**: Graceful fallbacks for API failures

### API Design

#### Backend APIs (FastAPI)
- **Async Patterns**: Full async/await support for concurrent operations
- **Streaming Responses**: `StreamingResponse` with NDJSON
- **Error Resilience**: Structured error handling with user-friendly messages

#### Frontend Integration (Next.js)
- **Progressive Enhancement**: UI updates as data streams in
- **State Management**: React hooks for streaming state
- **Type Safety**: Full TypeScript coverage with shared types

## Technical Implementation Highlights

### 1. Structured Output Validation
All agents use Pydantic models for type-safe outputs:
```python
class RecipeSearchParams(BaseModel):
    query: str = Field(description="The main recipe search query")
    maxReadyTime: Optional[int] = Field(default=None)
    intolerances: Optional[str] = Field(default=None)
```

### 2. Context-Aware Routing
The orchestrator implements intelligent routing based on input characteristics:
- Image presence → FridgeAgent
- Natural language → Intent classification → Appropriate agent
- Fallback patterns for classification failures

### 3. Async Service Layer
Services implement async patterns with proper error handling:
```python
async def search_by_ingredients(self, ingredients: str) -> List[Dict]:
    async with AsyncClient() as client:
        response = await client.get(...)
        response.raise_for_status()
        return response.json()
```

### 4. Progressive Disclosure Pattern
The streaming architecture enables immediate user feedback:
- Step notifications as processing occurs
- Partial results during long operations
- Error recovery without full retry

## Database Architecture

### MongoDB Schema Design
- **Compound Indexing**: `userId` + `spoonacularId` for uniqueness
- **Embedded Documents**: Denormalized nutrition and instruction data
- **Mongoose ODM**: Type-safe schema definitions

## Development Patterns

### Dependency Injection
The `Deps` pattern provides clean service instantiation:
```python
@property
def spoonacular(self) -> SpoonacularService:
    if not self._spoonacular_service:
        self._spoonacular_service = SpoonacularService(self.spoonacular_api_key)
    return self._spoonacular_service
```

### Error Resilience
Multi-level error handling:
1. Service-level API error catching
2. Agent-level workflow recovery
3. User-friendly error messages

### Monitoring & Observability
Logfire integration for production monitoring:
```python
with logfire.span("extract_ingredients_from_image") as span:
    span.set_attribute("image_format", image.format)
    # Processing logic
```

## Setup & Configuration

### Backend Requirements
```bash
cd agent
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Environment variables
SPOONACULAR_API_KEY=
GEMINI_API_KEY=
```

### Frontend Requirements
```bash
cd web
npm install

# Environment variables
MONGODB_URI=
NEXTAUTH_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

## Key Technical Decisions

1. **Pydantic-AI over LangChain**: More control over agent orchestration
2. **NDJSON over WebSockets**: Simpler client implementation
3. **Dependency Injection**: Testable, maintainable service layer
4. **MongoDB over PostgreSQL**: Flexible schema for recipe data
5. **Gemini Vision over GPT-4V**: Better ingredient recognition accuracy
