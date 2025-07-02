import json
import logfire
from typing import AsyncGenerator
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from httpx import AsyncClient

from ..models.chat import ChatMessage, StreamResponse
from ..models.deps import Deps
from ..agents.orchestrator import orchestrator
from ..config import config

router = APIRouter()

@router.post("/chat")
async def chat_endpoint(body: ChatMessage):
    """
    Stream recipe search results based on:
    - Image: Extract -> Format -> Search by ingredients -> Get details
    - Query: Extract params -> Complex search
    """
    async def stream_updates() -> AsyncGenerator[str, None]:
        try:
            async with AsyncClient() as client:
                deps = Deps(
                    client=client,
                    spoonacular_api_key=config.SPOONACULAR_API_KEY,
                    gemini_api_key=config.GEMINI_API_KEY,
                    has_image=bool(body.image_base64),
                    image_base64=body.image_base64,
                    user_query=body.message,
                )