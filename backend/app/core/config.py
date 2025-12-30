import os
from dotenv import load_dotenv

load_dotenv()

MASTERY_THRESHOLD = 1250
BASE_K = 24
STRATEGY = "lowest_elo"
DB_URL = os.environ.get("DB_URL")
