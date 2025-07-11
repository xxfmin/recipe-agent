from pydantic_ai import Agent
from pydantic_ai.models.gemini import GeminiModel
from pydantic import BaseModel

class QAAnswer(BaseModel):
    answer: str

qa_agent = Agent(
    model=GeminiModel(model_name="gemini-2.0-flash"),
    result_type=QAAnswer,
    system_prompt="""
    You are a helpful cooking assistant. Answer the user's question clearly and concisely. If the question is not about cooking, politely say you can only answer cooking-related questions.
    """
) 