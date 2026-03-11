from dotenv import load_dotenv
import os

load_dotenv()


class Config:
    DEBUG = os.getenv('DEBUG', 'False').lower() == 'true'
    URL = os.getenv('URL', 'URL not set')