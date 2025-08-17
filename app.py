from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, Request, Query, UploadFile, File
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pathlib import Path
import uuid
import logging
from fastapi import WebSocket

from schemas.requests import TextRequest, LLMRequest
from schemas.responses import TTSResponse
from services.tts_service import generate_tts
from services.stt_service import transcribe_audio
from services.llm_service import get_llm_response, get_llm_response_with_history

# ----------------- CONFIG -----------------
logger = logging.getLogger(__name__)
logging.basicConfig(format='[%(asctime)s] %(levelname)s: %(message)s', level=logging.INFO)

FALLBACK_TEXT = "I'm having trouble connecting right now. Please try again in a moment."
FALLBACK_AUDIO_URL = "/static/fallback_audio.mp3"

# In-memory chat history: {session_id: [{"role": "user"/"model", "content": "..."}]}
chat_history = {}

# ----------------- APP INIT -----------------
app = FastAPI()
app.mount("/static", StaticFiles(directory="static"), name="static")
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
templates = Jinja2Templates(directory="templates")

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

# ----------------- HELPERS -----------------
def fallback_response(transcription: str = "", error_detail: str = None, history=None) -> dict:
    msg = FALLBACK_TEXT
    return {
        "transcription": transcription or "",
        "llm_response": msg,
        "bot_response": msg,
        "audio_url": FALLBACK_AUDIO_URL,
        "history": history or [{"role": "assistant", "content": msg}],
        "error": error_detail
    }

# ----------------- ROUTES -----------------
@app.get("/", response_class=HTMLResponse)
async def home(request: Request, session_id: str = Query(None)):
    return templates.TemplateResponse("index.html", {"request": request, "session_id": session_id})

@app.post("/generate_audio", response_model=TTSResponse)
async def generate_audio(req: TextRequest):
    logger.info("Generating TTS for text input")
    try:
        audio_url = generate_tts(req.text)
        return TTSResponse(audio_url=audio_url, error=None)
    except Exception as e:
        logger.error(f"TTS generation failed: {e}")
        return fallback_response(req.text, error_detail="Murf API error")

@app.post("/echo/v1")
async def echo_bot_v1(file: UploadFile = File(...)):
    """Echo Bot v1: Playback original uploaded audio, return transcript."""
    if not file.content_type.startswith("audio/"):
        return fallback_response(error_detail="Uploaded file is not audio")

    filename = f"{uuid.uuid4().hex}_{file.filename}"
    file_path = UPLOAD_DIR / filename
    with open(file_path, "wb") as f:
        content = await file.read()
        f.write(content)

    try:
        text = transcribe_audio(str(file_path))
    except Exception as e:
        logger.error(f"Transcription failed: {e}")
        return fallback_response(error_detail="AssemblyAI error")

    audio_url = f"/uploads/{filename}"
    return {"audio_url": audio_url, "transcription": text, "filename": filename, "error": None}

@app.post("/tts/echo")
async def echo_bot_v2(file: UploadFile = File(...)):
    """Echo Bot v2: Transcribe uploaded audio and return Murf-voiced TTS."""
    if not file.content_type.startswith("audio/"):
        return fallback_response(error_detail="Uploaded file is not audio")

    file_path = UPLOAD_DIR / f"{uuid.uuid4().hex}_{file.filename}"
    with open(file_path, "wb") as f:
        f.write(await file.read())

    try:
        text = transcribe_audio(str(file_path))
        audio_url = generate_tts(text)
        return {"audio_url": audio_url, "transcription": text, "error": None}
    except Exception as e:
        logger.error(f"TTS Echo Bot failed: {e}")
        return fallback_response(error_detail="Murf API/AssemblyAI error")

@app.post("/upload_audio")
async def upload_audio(file: UploadFile = File(...)):
    if not file.content_type.startswith("audio/"):
        return fallback_response(error_detail="Uploaded file is not audio")

    filename = f"{uuid.uuid4().hex}_{file.filename}"
    file_path = UPLOAD_DIR / filename
    with open(file_path, "wb") as f:
        content = await file.read()
        f.write(content)

    return {"filename": filename, "content_type": file.content_type, "size": len(content), "error": None}

@app.post("/transcribe_audio")
async def transcribe_audio_endpoint(file: UploadFile = File(...)):
    if not file.content_type.startswith("audio/"):
        return fallback_response(error_detail="Uploaded file is not audio")

    file_path = UPLOAD_DIR / f"{uuid.uuid4().hex}_{file.filename}"
    with open(file_path, "wb") as f:
        f.write(await file.read())

    try:
        transcript = transcribe_audio(str(file_path))
        return {"transcription": transcript, "error": None}
    except Exception as e:
        logger.error(f"Transcription failed: {e}")
        return fallback_response(error_detail="AssemblyAI error")

@app.post("/llm/text_query")
def llm_query(request: LLMRequest):
    try:
        llm_response = get_llm_response(request.text)
        audio_url = generate_tts(llm_response)
        return {"input_text": request.text, "llm_response": llm_response, "audio_url": audio_url, "error": None}
    except Exception as e:
        logger.error(f"Text LLM query failed: {e}")
        return fallback_response(request.text, error_detail="Gemini/Murf API error")

@app.post("/llm/audio_query")
async def llm_audio_query(file: UploadFile = File(...)):
    if not file.content_type.startswith("audio/"):
        return fallback_response(error_detail="Uploaded file is not audio")

    file_path = UPLOAD_DIR / f"{uuid.uuid4().hex}_{file.filename}"
    with open(file_path, "wb") as f:
        f.write(await file.read())

    try:
        text = transcribe_audio(str(file_path))
        llm_response = get_llm_response(text)
        audio_url = generate_tts(llm_response)
        return {"transcription": text, "llm_response": llm_response, "audio_url": audio_url, "error": None}
    except Exception as e:
        logger.error(f"Audio LLM query failed: {e}")
        return fallback_response(error_detail="Gemini/Murf/AssemblyAI error")

@app.post("/agent/chat/{session_id}")
async def chat_with_agent(session_id: str, file: UploadFile):
    if not file.content_type.startswith("audio/"):
        return fallback_response(error_detail="Uploaded file is not audio")

    temp_audio_path = UPLOAD_DIR / f"{uuid.uuid4().hex}_{file.filename}"
    with open(temp_audio_path, "wb") as f:
        f.write(await file.read())

    try:
        user_message = transcribe_audio(str(temp_audio_path))
    except Exception as e:
        logger.error(f"Transcription error: {e}")
        return fallback_response(error_detail="AssemblyAI error")

    # Initialize session history if not exists
    if session_id not in chat_history:
        chat_history[session_id] = []

    conversation = chat_history[session_id]
    conversation.append({"role": "user", "content": user_message})

    try:
        # Convert conversation to Gemini's expected format
        gemini_history = [
            {"role": "user" if m["role"] == "user" else "model", "parts": [{"text": m["content"]}]}
            for m in conversation
        ]
        bot_response = get_llm_response_with_history(gemini_history)
    except Exception as e:
        logger.error(f"LLM error: {e}")
        return fallback_response(user_message, error_detail="Gemini API error", history=conversation)

    conversation.append({"role": "model", "content": bot_response})

    try:
        audio_url = generate_tts(bot_response)
    except Exception as e:
        logger.error(f"TTS error: {e}")
        return fallback_response(user_message, error_detail="Murf API error", history=conversation)

    # Returning history so UI can display full conversation
    return {
        "transcription": user_message,
        "bot_response": bot_response,
        "audio_url": audio_url,
        "history": conversation,
        "error": None
    }

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    while True:
        data = await websocket.receive_text()
        await websocket.send_text(f"Echo: {data}")

@app.websocket("/ws/audio")
async def audio_stream_endpoint(websocket: WebSocket):
    await websocket.accept()

    # Save raw audio chunks to file (webm format is easiest from browser)
    file_path = UPLOAD_DIR / "streamed_audio.webm"
    with open(file_path, "wb") as f:
        try:
            while True:
                data = await websocket.receive_bytes()  # receive raw binary
                f.write(data)
        except Exception as e:
            logger.info(f"WebSocket closed: {e}")

