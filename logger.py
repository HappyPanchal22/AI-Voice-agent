import logging

logging.basicConfig(
    format='[%(asctime)s] %(levelname)s in %(module)s: %(message)s',
    level=logging.INFO
)

logger = logging.getLogger("voice-agent")
