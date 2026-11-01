#!/usr/bin/env python3
"""Локальный просмотр сайта без сторонних зависимостей."""

import argparse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--port", type=int, default=8000, help="Порт (по умолчанию 8000)")
    args = parser.parse_args()
    if not 1 <= args.port <= 65535:
        parser.error("порт должен быть от 1 до 65535")

    directory = Path(__file__).resolve().parent / "site"
    handler = partial(SimpleHTTPRequestHandler, directory=str(directory))
    try:
        server = ThreadingHTTPServer(("127.0.0.1", args.port), handler)
    except OSError as error:
        parser.exit(1, f"Не удалось запустить сервер: {error}\nПопробуйте другой --port.\n")

    with server:
        print(f"Сайт: http://127.0.0.1:{args.port}/", flush=True)
        print("Остановить: Ctrl+C", flush=True)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            print("\nСервер остановлен.")


if __name__ == "__main__":
    main()
