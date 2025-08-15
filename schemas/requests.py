from pydantic import BaseModel

class TextRequest(BaseModel):
    text: str

class LLMRequest(BaseModel):
    text: str
