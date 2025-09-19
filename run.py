from app import create_app

app = create_app()

if __name__ == "__main__":
	app.config['DEBUG'] = True  # Force le mode debug
	app.run(host="0.0.0.0", port=5000, debug=True)

