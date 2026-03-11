from flask import Blueprint, send_file, render_template, request, jsonify
from datetime import datetime
from functools import wraps

bp = Blueprint("http_post", __name__)


# CORS поддержка для образовательных целей
def add_cors_headers(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        response = jsonify(f(*args, **kwargs)) if not isinstance(f(*args, **kwargs), dict) else f(*args, **kwargs)
        if isinstance(response, dict):
            response = jsonify(response)
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
        return response
    return decorated_function


@bp.route("/http")
def http_post():
    return render_template("http.html")


@bp.route("/hello", methods=["GET"])
def hello():
    return "Hello, World!"


@bp.route("/post", methods=["POST", "OPTIONS"])
@add_cors_headers
def post():
    if request.method == "OPTIONS":
        return {"status": "ok"}
    
    try:
        data = request.get_json()
        
        # Валидация
        if not data:
            return {
                "status": "error",
                "message": "❌ Тело запроса пусто или не JSON",
                "hint": "Отправь JSON объект, например: {\"name\": \"Иван\", \"age\": 25}",
                "example": {"name": "Иван", "age": 25}
            }, 400
        
        # Обработка данных
        user_info = []
        if isinstance(data, dict):
            user_info.append(f"📊 Получил {len(data)} полей")
            for key, value in data.items():
                user_info.append(f"  • {key}: {value} ({type(value).__name__})")
        
        return {
            "status": "success",
            "message": "✅ POST-запрос успешно обработан!",
            "received_data": data,
            "analysis": user_info,
            "timestamp": datetime.now().isoformat(),
            "tip": "Это был запрос с телом. Клиент отправляет данные на сервер"
        }, 200
        
    except Exception as e:
        return {
            "status": "error",
            "message": f"❌ Ошибка обработки: {str(e)}",
            "hint": "Убедись, что отправляешь корректный JSON"
        }, 400


@bp.route("/get", methods=["GET", "OPTIONS"])
@add_cors_headers
def get():
    if request.method == "OPTIONS":
        return {"status": "ok"}
    
    # Получаем параметры из URL
    name = request.args.get("name", "Неизвестный пользователь")
    count = request.args.get("count", default=1, type=int)
    
    # Безопасность: лимит на количество
    count = min(max(count, 1), 100)
    
    facts = [
        "🌍 HTTP расшифровывается как HyperText Transfer Protocol",
        "📡 HTTP работает на 80-м порту, HTTPS на 443-м",
        "🔒 HTTPS = HTTP + SSL/TLS шифрование",
        "⚡ HTTP/2 быстрее HTTP/1.1 благодаря мультиплексированию",
        "🚀 HTTP/3 использует протокол QUIC вместо TCP",
    ]
    
    return {
        "status": "success",
        "message": f"✅ Привет, {name}!",
        "server_time": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "server_timezone": "UTC+3 (Москва)",
        "http_facts": facts[:count],
        "tips": [
            "💡 GET запросы не имеют тела",
            "💡 Используй параметры в URL: ?name=Иван&count=3",
            "💡 GET запросы кешируются браузером"
        ]
    }, 200


@bp.route("/put", methods=["PUT", "OPTIONS"])
@add_cors_headers
def put():
    if request.method == "OPTIONS":
        return {"status": "ok"}
    
    try:
        data = request.get_json()
        
        if not data:
            return {
                "status": "error",
                "message": "❌ Отправь данные для обновления",
                "example": {"id": 1, "name": "Новое имя", "status": "active"}
            }, 400
        
        # Имитируем обновление в БД
        if "id" not in data:
            return {
                "status": "error",
                "message": "❌ Необходимо поле 'id' для обновления"
            }, 400
        
        return {
            "status": "success",
            "message": f"✅ Объект #{data.get('id')} полностью обновлён!",
            "updated_fields": {k: v for k, v in data.items()},
            "tip": "PUT заменяет ВСЕ поля ресурса. Используй PATCH для частичного обновления"
        }, 200
        
    except Exception as e:
        return {"status": "error", "message": str(e)}, 400


@bp.route("/delete", methods=["DELETE", "OPTIONS"])
@add_cors_headers
def delete():
    if request.method == "OPTIONS":
        return {"status": "ok"}
    
    # Получаем ID из параметров
    resource_id = request.args.get("id", default="unknown")
    
    return {
        "status": "success",
        "message": f"✅ Ресурс #{resource_id} удалён!",
        "deleted_at": datetime.now().isoformat(),
        "warning": "⚠️ Операция необратима! В реальных системах нужна двойная проверка",
        "http_status_codes": {
            "200": "Удаление успешно",
            "204": "Удаление успешно (нет контента в ответе)",
            "404": "Ресурс не найден"
        }
    }, 200


@bp.route("/patch", methods=["PATCH", "OPTIONS"])
@add_cors_headers
def patch():
    if request.method == "OPTIONS":
        return {"status": "ok"}
    
    try:
        data = request.get_json()
        
        if not data:
            return {
                "status": "error",
                "message": "❌ Отправь данные для частичного обновления",
                "example": {"name": "Новое имя", "age": 30}
            }, 400
        
        return {
            "status": "success",
            "message": "✅ Ресурс частично обновлён!",
            "updated_fields": {k: v for k, v in data.items()},
            "unchanged_fields": ["id", "created_at", "status"],
            "tip": "PATCH меняет только указанные поля, остальные остаются неизменными"
        }, 200
        
    except Exception as e:
        return {"status": "error", "message": str(e)}, 400


@bp.route("/head", methods=["HEAD", "OPTIONS"])
@add_cors_headers
def head():
    if request.method == "OPTIONS":
        return {"status": "ok"}
    
    # HEAD возвращает только заголовки без тела
    response = jsonify({"status": "success"})
    response.headers['X-Custom-Info'] = 'Это HEAD запрос - обрати внимание на заголовки, не на тело!'
    response.headers['X-Content-Size'] = '1024 bytes'
    response.headers['X-Last-Modified'] = datetime.now().isoformat()
    return response, 200


@bp.route("/options", methods=["OPTIONS"])
@add_cors_headers
def options():
    return {
        "status": "success",
        "message": "✅ OPTIONS запрос получен!",
        "allowed_methods": ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"],
        "documentation": {
            "GET": "Получить данные. Параметры: ?name=Иван&count=5",
            "POST": "Создать новый ресурс. Отправь JSON в теле",
            "PUT": "Полностью заменить ресурс. Требуется поле 'id'",
            "DELETE": "Удалить ресурс. Параметр: ?id=123",
            "PATCH": "Частично обновить ресурс. Отправь только изменённые поля",
            "HEAD": "Получить заголовки без тела ответа"
        }
    }, 200