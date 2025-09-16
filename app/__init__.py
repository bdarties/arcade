from flask import Flask
from .routes import bp as routes_bp


def create_app() -> Flask:
	app = Flask(__name__, static_folder="static", template_folder="templates")
	app.register_blueprint(routes_bp)
	return app

