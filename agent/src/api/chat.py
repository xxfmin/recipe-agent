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
    async def stream_updates() -> AsyncGenerator[str, None]:
        async with AsyncClient() as client:
            deps = Deps(
                client=client,
                spoonacular_api_key=config.SPOONACULAR_API_KEY,
                gemini_api_key=config.GEMINI_API_KEY,
                has_image=bool(body.image_base64),
                image_base64=body.image_base64,
                user_query=body.message,
            )
            result = await orchestrator.run(
                image_base64=body.image_base64,
                user_query=body.message,
                deps=deps
            )
            # if the result is an async generator, stream each message
            if hasattr(result, "__aiter__"):
                async for msg in result:
                    yield StreamResponse(**msg).model_dump_json() + "\n"
            else:
                yield StreamResponse(**result).model_dump_json() + "\n"
    return StreamingResponse(stream_updates(), media_type="application/x-ndjson")