import os
from secrets import token_hex
from dotenv import load_dotenv

load_dotenv()


class Config:
    SECRET_KEY: str = os.getenv("SECRET_KEY", token_hex(64))
    DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"
