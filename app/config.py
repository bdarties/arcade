import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent


def _bool_env(name: str, default: bool) -> bool:
	value = os.environ.get(name)
	if value is None:
		return default
	return value.strip().lower() in ("1", "true", "yes", "on")


class Config:
	DEBUG = _bool_env("FLASK_DEBUG", False)
	HOST = os.environ.get("FLASK_RUN_HOST", "127.0.0.1")
	PORT = int(os.environ.get("FLASK_RUN_PORT", "5000"))
	DB_PATH = Path(os.environ.get("DB_PATH", str(BASE_DIR / "scores.db")))
	# Token requis (header X-Init-Token) pour appeler POST /init-db. Vide = route désactivée.
	INIT_DB_TOKEN = os.environ.get("INIT_DB_TOKEN", "")
	USE_FAKE_SCORES = _bool_env("USE_FAKE_SCORES", False)
	# Par défaut Jinja ne relit les templates que si DEBUG est vrai. Sur la borne,
	# qui tourne sans debug et se met à jour par `git pull`, une modification de
	# app/templates/ restait donc invisible jusqu'à un redémarrage manuel du
	# service. On force la relecture : le coût est un stat() par template rendu.
	TEMPLATES_AUTO_RELOAD = True
