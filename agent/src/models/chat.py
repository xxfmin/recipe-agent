from typing import Optional, List
from pydantic import BaseModel

class ChatMessage(BaseModel):
    message: Optional[str] = None
    image_base64: Optional[str] = None

class StreamResponse(BaseModel):
    type: str # "step", "complete", "error"
    step: Optional[str] = None
    status: Optional[str] = None
    message: Optional[str] = None
    recipes: Optional[List[dict]] = None