import os
import requests
import logging
import time
from dotenv import load_dotenv

# ------------------ ENV LOADING ------------------
load_dotenv()

logger = logging.getLogger("voice-agent")

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise RuntimeError(
        "❌ GEMINI_API_KEY not set. Please add it to your .env file and restart the server."
    )

# ------------------ CONFIG ------------------
GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"
HEADERS = {"Content-Type": "application/json"}
TIMEOUT = 10
MAX_RETRIES = 3


def _parse_gemini_response(response_json: dict) -> str:
    """Safely extract text from Gemini API JSON."""
    try:
        return response_json["candidates"][0]["content"]["parts"][0]["text"]
    except (KeyError, IndexError, TypeError) as e:
        logger.error(f"Unexpected Gemini API response format: {response_json}")
        raise RuntimeError("Failed to parse Gemini API response") from e


def _post_with_retry(payload: dict, params: dict) -> dict:
    """POST to Gemini API with retry for transient errors (503, timeouts)."""
    for attempt in range(MAX_RETRIES):
        try:
            res = requests.post(
                GEMINI_URL,
                headers=HEADERS,
                params=params,
                json=payload,
                timeout=TIMEOUT
            )
            res.raise_for_status()
            return res.json()
        except requests.RequestException as e:
            if attempt < MAX_RETRIES - 1:
                wait_time = 2 ** attempt
                logger.warning(f"⚠️ Gemini API call failed (attempt {attempt+1}/{MAX_RETRIES}): {e}. Retrying in {wait_time}s...")
                time.sleep(wait_time)
            else:
                logger.error(f"❌ Gemini API request failed after {MAX_RETRIES} attempts: {e}")
                raise RuntimeError("Gemini API request failed") from e


def get_llm_response(text: str) -> str:
    """Generate a response from Google Gemini API for given text."""
    payload = {"contents": [{"parts": [{"text": text}]}]}
    params = {"key": GEMINI_API_KEY}
    result_json = _post_with_retry(payload, params)
    result = _parse_gemini_response(result_json)
    logger.info("✅ LLM text response received")
    return result


def get_llm_response_with_history(history: list) -> str:
    """Generate a response from Google Gemini API with provided history content."""
    params = {"key": GEMINI_API_KEY}
    result_json = _post_with_retry({"contents": history}, params)
    result = _parse_gemini_response(result_json)
    logger.info("✅ LLM chat response received")
    return result

