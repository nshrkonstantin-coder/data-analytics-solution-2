import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor

SCHEMA = 't_p13776910_data_analytics_solut'

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Api-Key',
    'Access-Control-Max-Age': '86400',
}

def resp(status: int, body: dict) -> dict:
    return {
        'statusCode': status,
        'headers': {'Content-Type': 'application/json', **CORS_HEADERS},
        'body': json.dumps(body, default=str),
        'isBase64Encoded': False,
    }


def handler(event: dict, context) -> dict:
    """
    Внешний API общего кошелька.
    Используется сторонними сайтами (VoiceAI и др.) для:
    - GET  ?action=balance&email=...          — получить баланс по email
    - POST ?action=topup                       — пополнить кошелёк (тело: email, amount, description, source_site)
    - POST ?action=deduct                      — списать с кошелька (тело: email, amount, description, source_site)
    Авторизация: заголовок X-Api-Key с секретом WALLET_API_SECRET
    """
    method = event.get('httpMethod', 'GET')

    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': '', 'isBase64Encoded': False}

    # Проверка секретного ключа
    headers = event.get('headers', {})
    api_key = headers.get('x-api-key') or headers.get('X-Api-Key') or ''
    expected_key = os.environ.get('WALLET_API_SECRET', '')

    if not expected_key or api_key != expected_key:
        return resp(403, {'error': 'Неверный или отсутствующий API-ключ'})

    params = event.get('queryStringParameters') or {}
    action = params.get('action', '')
    path = event.get('path', '').rstrip('/')

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cursor = conn.cursor(cursor_factory=RealDictCursor)

    try:
        # GET /balance?email=... или GET ?action=balance&email=...
        if method == 'GET' and (action == 'balance' or path.endswith('/balance')):
            return get_balance(conn, cursor, params)

        # POST /charge — списание (алиас для voiceal.ru)
        elif method == 'POST' and path.endswith('/charge'):
            body = json.loads(event.get('body') or '{}')
            return deduct(conn, cursor, body)

        elif method == 'POST' and action == 'topup':
            body = json.loads(event.get('body') or '{}')
            return topup(conn, cursor, body)

        elif method == 'POST' and action == 'deduct':
            body = json.loads(event.get('body') or '{}')
            return deduct(conn, cursor, body)

        else:
            return resp(404, {'error': 'Неизвестный action. Доступны: balance, topup, deduct, charge'})
    finally:
        cursor.close()
        conn.close()


def get_wallet_by_email(cursor, email: str):
    """Возвращает (user, wallet) или (None, None)"""
    cursor.execute(
        f"SELECT id, email, full_name FROM {SCHEMA}.users WHERE email = %s", (email,)
    )
    user = cursor.fetchone()
    if not user:
        return None, None

    cursor.execute(
        f"SELECT id, balance, currency FROM {SCHEMA}.wallets WHERE user_id = %s", (user['id'],)
    )
    wallet = cursor.fetchone()
    return user, wallet


def get_balance(conn, cursor, params: dict) -> dict:
    email = params.get('email', '').strip().lower()
    if not email:
        return resp(400, {'error': 'Укажите email'})

    user, wallet = get_wallet_by_email(cursor, email)

    if not user:
        return resp(404, {'error': 'Пользователь не найден'})
    if not wallet:
        return resp(404, {'error': 'Кошелёк пользователя не найден'})

    return resp(200, {
        'email': user['email'],
        'full_name': user['full_name'],
        'balance': float(wallet['balance']),
        'currency': wallet['currency'],
    })


def topup(conn, cursor, body: dict) -> dict:
    email = (body.get('email') or '').strip().lower()
    amount = float(body.get('amount', 0))
    description = body.get('description') or 'Пополнение баланса'
    source_site = body.get('source_site') or 'внешний сайт'

    if not email:
        return resp(400, {'error': 'Укажите email'})
    if amount <= 0:
        return resp(400, {'error': 'Сумма должна быть больше 0'})

    user, wallet = get_wallet_by_email(cursor, email)

    if not user:
        return resp(404, {'error': 'Пользователь не найден'})
    if not wallet:
        return resp(404, {'error': 'Кошелёк пользователя не найден'})

    new_balance = float(wallet['balance']) + amount
    cursor.execute(
        f"UPDATE {SCHEMA}.wallets SET balance = %s, updated_at = NOW() WHERE id = %s",
        (new_balance, wallet['id'])
    )
    cursor.execute(
        f"""INSERT INTO {SCHEMA}.wallet_transactions (wallet_id, amount, type, description)
            VALUES (%s, %s, 'credit', %s)""",
        (wallet['id'], amount, f'{description} [{source_site}]')
    )
    conn.commit()

    return resp(200, {
        'success': True,
        'email': email,
        'credited': amount,
        'new_balance': new_balance,
    })


def deduct(conn, cursor, body: dict) -> dict:
    email = (body.get('email') or '').strip().lower()
    amount = float(body.get('amount', 0))
    description = body.get('description') or 'Списание'
    source_site = body.get('source_site') or 'внешний сайт'

    if not email:
        return resp(400, {'error': 'Укажите email'})
    if amount <= 0:
        return resp(400, {'error': 'Сумма должна быть больше 0'})

    user, wallet = get_wallet_by_email(cursor, email)

    if not user:
        return resp(404, {'error': 'Пользователь не найден'})
    if not wallet:
        return resp(404, {'error': 'Кошелёк пользователя не найден'})

    current_balance = float(wallet['balance'])
    if current_balance < amount:
        return resp(400, {
            'error': 'Недостаточно средств',
            'balance': current_balance,
            'required': amount,
        })

    new_balance = current_balance - amount
    cursor.execute(
        f"UPDATE {SCHEMA}.wallets SET balance = %s, updated_at = NOW() WHERE id = %s",
        (new_balance, wallet['id'])
    )
    cursor.execute(
        f"""INSERT INTO {SCHEMA}.wallet_transactions (wallet_id, amount, type, description)
            VALUES (%s, %s, 'debit', %s)""",
        (wallet['id'], amount, f'{description} [{source_site}]')
    )
    conn.commit()

    return resp(200, {
        'success': True,
        'email': email,
        'debited': amount,
        'balance': new_balance,
        'new_balance': new_balance,
    })