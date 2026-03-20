import json
import os
import uuid
import psycopg2
from psycopg2.extras import RealDictCursor
import urllib.request
import base64

SCHEMA = 't_p13776910_data_analytics_solut'


def yookassa_request(method: str, path: str, body: dict = None) -> dict:
    """Выполняет запрос к API ЮКасса"""
    shop_id = os.environ['YOOKASSA_SHOP_ID']
    secret_key = os.environ['YOOKASSA_SECRET_KEY']
    credentials = base64.b64encode(f'{shop_id}:{secret_key}'.encode()).decode()

    url = f'https://api.yookassa.ru/v3{path}'
    data = json.dumps(body).encode('utf-8') if body else None
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header('Authorization', f'Basic {credentials}')
    req.add_header('Content-Type', 'application/json')
    if body:
        req.add_header('Idempotence-Key', str(uuid.uuid4()))

    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode('utf-8'))


def handler(event: dict, context) -> dict:
    """API для оплаты через ЮКасса: создание платежа и обработка webhook"""
    method = event.get('httpMethod', 'GET')

    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Authorization',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }

    action = (event.get('queryStringParameters') or {}).get('action', '')

    # Webhook от ЮКасса — без авторизации
    if method == 'POST' and action == 'webhook':
        return handle_webhook(event)

    # Остальные запросы требуют авторизации
    headers = event.get('headers', {})
    token = headers.get('x-authorization', '') or headers.get('X-Authorization', '')
    token = token.replace('Bearer ', '')

    if not token:
        return _err(401, 'Требуется авторизация')

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cursor = conn.cursor(cursor_factory=RealDictCursor)

    cursor.execute(f"""
        SELECT u.id, u.role, u.email, u.full_name
        FROM {SCHEMA}.users u
        JOIN {SCHEMA}.sessions s ON u.id = s.user_id
        WHERE s.token = %s AND s.expires_at > NOW()
    """, (token,))
    user = cursor.fetchone()

    if not user:
        cursor.close()
        conn.close()
        return _err(401, 'Сессия истекла, войдите снова')

    if method == 'POST' and action == 'create':
        body = json.loads(event.get('body', '{}'))
        return create_payment(conn, cursor, user, body)

    if method == 'GET' and action == 'status':
        params = event.get('queryStringParameters') or {}
        return check_status(conn, cursor, user['id'], params.get('payment_id', ''))

    cursor.close()
    conn.close()
    return _err(404, 'Endpoint not found')


def create_payment(conn, cursor, user: dict, body: dict) -> dict:
    """Создаёт платёж в ЮКасса и сохраняет в БД"""
    amount = float(body.get('amount', 0))
    return_url = body.get('return_url', 'https://poehali.dev')

    if amount < 1:
        cursor.close()
        conn.close()
        return _err(400, 'Минимальная сумма пополнения — 1 ₽')

    cursor.execute(f"SELECT id FROM {SCHEMA}.wallets WHERE user_id = %s", (user['id'],))
    wallet = cursor.fetchone()
    if not wallet:
        cursor.close()
        conn.close()
        return _err(404, 'Кошелёк не найден')

    description = f'Пополнение баланса — {user["full_name"] or user["email"]}'

    payment = yookassa_request('POST', '/payments', {
        'amount': {'value': f'{amount:.2f}', 'currency': 'RUB'},
        'confirmation': {'type': 'redirect', 'return_url': return_url},
        'capture': True,
        'description': description,
        'metadata': {'user_id': user['id'], 'wallet_id': wallet['id']}
    })

    payment_id = payment['id']
    confirmation_url = payment['confirmation']['confirmation_url']

    cursor.execute(f"""
        INSERT INTO {SCHEMA}.yookassa_payments
            (user_id, wallet_id, payment_id, amount, status, description, confirmation_url)
        VALUES (%s, %s, %s, %s, 'pending', %s, %s)
    """, (user['id'], wallet['id'], payment_id, amount, description, confirmation_url))
    conn.commit()
    cursor.close()
    conn.close()

    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'payment_id': payment_id, 'confirmation_url': confirmation_url}),
        'isBase64Encoded': False
    }


def check_status(conn, cursor, user_id: int, payment_id: str) -> dict:
    """Проверяет статус платежа"""
    if not payment_id:
        cursor.close()
        conn.close()
        return _err(400, 'Укажите payment_id')

    cursor.execute(f"""
        SELECT id, status, amount FROM {SCHEMA}.yookassa_payments
        WHERE payment_id = %s AND user_id = %s
    """, (payment_id, user_id))
    row = cursor.fetchone()

    if not row:
        cursor.close()
        conn.close()
        return _err(404, 'Платёж не найден')

    cursor.close()
    conn.close()
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'status': row['status'], 'amount': float(row['amount'])}),
        'isBase64Encoded': False
    }


def handle_webhook(event: dict) -> dict:
    """Обрабатывает уведомление от ЮКасса о смене статуса платежа"""
    try:
        body = json.loads(event.get('body', '{}'))
    except Exception:
        return _err(400, 'Invalid JSON')

    if body.get('event') != 'payment.succeeded':
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'ok': True}),
            'isBase64Encoded': False
        }

    payment_obj = body.get('object', {})
    payment_id = payment_obj.get('id')
    if not payment_id:
        return _err(400, 'No payment id')

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cursor = conn.cursor(cursor_factory=RealDictCursor)

    cursor.execute(f"""
        SELECT id, wallet_id, amount, status FROM {SCHEMA}.yookassa_payments
        WHERE payment_id = %s
    """, (payment_id,))
    payment_row = cursor.fetchone()

    if not payment_row or payment_row['status'] == 'succeeded':
        cursor.close()
        conn.close()
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'ok': True}),
            'isBase64Encoded': False
        }

    amount = float(payment_row['amount'])
    wallet_id = payment_row['wallet_id']

    cursor.execute(f"""
        UPDATE {SCHEMA}.wallets
        SET balance = balance + %s, updated_at = NOW()
        WHERE id = %s
    """, (amount, wallet_id))

    cursor.execute(f"""
        INSERT INTO {SCHEMA}.wallet_transactions (wallet_id, amount, type, description)
        VALUES (%s, %s, 'credit', %s)
    """, (wallet_id, amount, f'Пополнение через ЮКасса (платёж {payment_id[:8]}...)'))

    cursor.execute(f"""
        UPDATE {SCHEMA}.yookassa_payments
        SET status = 'succeeded', updated_at = NOW()
        WHERE payment_id = %s
    """, (payment_id,))

    conn.commit()
    cursor.close()
    conn.close()

    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'ok': True}),
        'isBase64Encoded': False
    }


def _err(code: int, msg: str) -> dict:
    return {
        'statusCode': code,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': msg}),
        'isBase64Encoded': False
    }
