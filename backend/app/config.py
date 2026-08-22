import os
from dotenv import load_dotenv

load_dotenv()

FEATHERLESS_API_KEY = os.environ.get("FEATHERLESS_API_KEY", "")
FEATHERLESS_MODEL = os.environ.get("FEATHERLESS_MODEL", "")
FEATHERLESS_BASE_URL = "https://api.featherless.ai/v1"

def featherless_configured() -> bool:
    # Never log or return the key itself — only whether it's present.
    return bool(FEATHERLESS_API_KEY) and bool(FEATHERLESS_MODEL)