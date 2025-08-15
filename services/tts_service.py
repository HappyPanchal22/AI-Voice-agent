import os
import requests
import logging
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

logging.basicConfig(
    format='[%(asctime)s] %(levelname)s in %(module)s: %(message)s',
    level=logging.INFO
)

logger = logging.getLogger("voice-agent")

MURF_API_KEY = os.getenv("MURF_API_KEY")
FALLBACK_AUDIO_URL = "/static/fallback_audio.mp3"

if not MURF_API_KEY:
    raise RuntimeError("MURF_API_KEY is missing in your .env file!")

def generate_tts(text: str, voice_id: str = "angela") -> str:
    """Generate speech using Murf API and return the audio file URL."""
    url = "https://api.murf.ai/v1/speech/generate"
    headers = {
        "accept": "application/json",
        "Content-Type": "application/json",
        "api-key": MURF_API_KEY
    }
    payload = {
        "text": text,
        "voiceId": voice_id,   # Correct key name
        "format": "MP3"
    }

    try:
        res = requests.post(url, json=payload, headers=headers, timeout=15)
        logger.info(f"Murf API status code: {res.status_code}")
        logger.info(f"Murf API response: {res.text}")

        res.raise_for_status()

        data = res.json()
        # Check for audio file key (might vary depending on API version)
        audio_url = (
            data.get("audioFile")
            or data.get("audioUrl")
            or data.get("url")
            or FALLBACK_AUDIO_URL
        )

        logger.info(f"TTS generated successfully, audio URL: {audio_url}")
        return audio_url

    except requests.RequestException as e:
        logger.error(f"TTS generation failed: {e}")
        return FALLBACK_AUDIO_URL
