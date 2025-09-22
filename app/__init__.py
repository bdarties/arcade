from flask import Flask
from .routes import bp as routes_bp, bp_api
from .db import init_db

def create_app() -> Flask:
	app = Flask(__name__, static_folder="static", template_folder="templates")
	app.register_blueprint(routes_bp)
	init_db()
	
	app.register_blueprint(bp_api)
	
	return app

