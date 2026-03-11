from flask import Flask
from config import Config


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    from app.routes.main import bp as main_bp
    app.register_blueprint(main_bp)
    
    from app.routes.http import bp as http_bp
    app.register_blueprint(http_bp)

    return app
