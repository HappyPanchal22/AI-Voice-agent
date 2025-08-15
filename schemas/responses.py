from pydantic import BaseModel, Field
from typing import Optional, List

class ChatMessage(BaseModel):
    role: str
    content: str

class TTSResponse(BaseModel):
    audio_url: str
    error: Optional[str]

class ChatResponse(BaseModel):
    transcription: str
    bot_response: str
    audio_url: str
    history: Optional[List[ChatMessage]] = Field(default_factory=list)
    error: Optional[str] = None
