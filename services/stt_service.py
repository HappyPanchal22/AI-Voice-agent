import os
import assemblyai as aai
from dotenv import load_dotenv
import logging

logging.basicConfig(
    format='[%(asctime)s] %(levelname)s in %(module)s: %(message)s',
    level=logging.INFO
)

logger = logging.getLogger("voice-agent")

load_dotenv()
aai.settings.api_key = os.getenv("ASSEMBLYAI_API_KEY")

def transcribe_audio(file_path: str) -> str:
    """Transcribe audio file and return the transcript text."""
    try:
        transcript = aai.Transcriber().transcribe(file_path)
        logger.info(f"Transcription successful for file: {file_path}")
        return transcript.text
    except Exception as e:
        logger.error(f"Transcription failed for file: {file_path}, error: {e}")
        raise
