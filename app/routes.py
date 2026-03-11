from flask import Blueprint, send_file, render_template

bp = Blueprint("main", __name__)


@bp.route("/")
def index():
    return render_template("links.html")


@bp.route("/links")
def links():
    return render_template("links.html")


@bp.route("/favicon.ico")
def favicon():
    return send_file('static/favicon.ico', mimetype="image/x-icon")