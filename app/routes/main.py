from flask import Blueprint

bp = Blueprint("main", __name__)


@bp.route("/")
def login():
    return "hello world"
