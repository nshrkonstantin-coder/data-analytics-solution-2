import json
import os
import uuid
import secrets
import psycopg2
from psycopg2.extras import RealDictCursor
import urllib.request
import base64

SCHEMA = 't_p13776910_data_analytics_solut'
NOTIFY_URL = 'https://functions.poehali.dev/9812cd97-edcd-4540-858b-96ce682d8f82'


def send_order_notification(order_id, product_title, amount, user_name, user_email, payment_method):
    try:
        payload = json.dumps({
            'type': 'order_paid',
            'order_id': order_id,
            'product_title': product_title,
            'amount': amount,
            'user_name': user_name,
            'user_email': user_email,
            'payment_method': payment_method,
        }).encode('utf-8')
        req = urllib.request.Request(NOTIFY_URL, data=payload, method='POST')
        req.add_header('Content-Type', 'application/json')
        urllib.request.urlopen(req, timeout=5)
    except Exception:
        pass


def yookassa_request(method: str, path: str, body: dict = None) -> dict:
    """Выполняет запрос к API ЮКасса"""
    shop_id = os.environ['YUKASSA_SHOP_ID']
    secret_key = os.environ['YUKASSA_SECRET_KEY']
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
    """API для оплаты через ЮКасса: пополнение баланса, прямая покупка товара и обработка webhook"""
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

    if method == 'POST' and action == 'buy-with-card':
        body = json.loads(event.get('body', '{}'))
        return buy_product_with_card(conn, cursor, user, body)

    if method == 'GET' and action == 'status':
        params = event.get('queryStringParameters') or {}
        return check_status(conn, cursor, user['id'], params.get('payment_id', ''))

    cursor.close()
    conn.close()
    return _err(404, 'Endpoint not found')


def create_payment(conn, cursor, user: dict, body: dict) -> dict:
    """Создаёт платёж в ЮКасса для пополнения баланса кошелька"""
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
        'metadata': {
            'type': 'topup',
            'user_id': user['id'],
            'wallet_id': wallet['id']
        }
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


def buy_product_with_card(conn, cursor, user: dict, body: dict) -> dict:
    """Создаёт заказ и платёж ЮКасса для прямой оплаты товара картой"""
    product_id = body.get('product_id')
    return_url = body.get('return_url', 'https://poehali.dev')

    cursor.execute(f"""
        SELECT id, title, price, subscription_days, website_url, is_subscription
        FROM {SCHEMA}.products WHERE id = %s AND is_active = TRUE
    """, (product_id,))
    product = cursor.fetchone()

    if not product:
        cursor.close()
        conn.close()
        return _err(404, 'Продукт не найден')

    cursor.execute(f"""
        SELECT id FROM {SCHEMA}.orders
        WHERE user_id = %s AND product_id = %s AND payment_confirmed = TRUE AND expires_at > NOW()
        LIMIT 1
    """, (user['id'], product_id))
    if cursor.fetchone():
        cursor.close()
        conn.close()
        return _err(400, 'У вас уже есть активная подписка на этот продукт')

    amount = float(product['price'])
    description = f'Покупка: {product["title"]} — {user["full_name"] or user["email"]}'

    # Создаём заказ со статусом pending (активируется при webhook)
    cursor.execute(f"""
        INSERT INTO {SCHEMA}.orders
            (user_id, product_id, total_amount, status, payment_reference, notes)
        VALUES (%s, %s, %s, 'pending', 'card', 'Ожидание оплаты картой через ЮКасса')
        RETURNING id
    """, (user['id'], product_id, amount))
    order = cursor.fetchone()
    order_id = order['id']

    payment = yookassa_request('POST', '/payments', {
        'amount': {'value': f'{amount:.2f}', 'currency': 'RUB'},
        'confirmation': {'type': 'redirect', 'return_url': return_url},
        'capture': True,
        'description': description,
        'metadata': {
            'type': 'product',
            'user_id': user['id'],
            'order_id': order_id,
            'product_id': product_id
        }
    })

    payment_id = payment['id']
    confirmation_url = payment['confirmation']['confirmation_url']

    # Сохраняем платёж, wallet_id=NULL для продуктовых платежей
    cursor.execute(f"""
        INSERT INTO {SCHEMA}.yookassa_payments
            (user_id, wallet_id, payment_id, amount, status, description, confirmation_url)
        VALUES (%s, NULL, %s, %s, 'pending', %s, %s)
    """, (user['id'], payment_id, amount, description, confirmation_url))

    conn.commit()
    cursor.close()
    conn.close()

    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({
            'payment_id': payment_id,
            'confirmation_url': confirmation_url,
            'order_id': order_id
        }),
        'isBase64Encoded': False
    }


def check_status(conn, cursor, user_id: int, payment_id: str) -> dict:
    """Проверяет статус платежа"""
    if not payment_id:
        cursor.close()
        conn.close()
        return _err(400, 'Укажите payment_id')

    cursor.execute(f"""
        SELECT yp.id, yp.status, yp.amount, yp.description,
               o.id as order_id, o.payment_confirmed, o.access_token, o.expires_at,
               p.website_url
        FROM {SCHEMA}.yookassa_payments yp
        LEFT JOIN {SCHEMA}.orders o ON (yp.user_id = o.user_id AND yp.description LIKE '%' || p.title || '%')
        LEFT JOIN {SCHEMA}.products p ON o.product_id = p.id
        WHERE yp.payment_id = %s AND yp.user_id = %s
    """, (payment_id, user_id))
    row = cursor.fetchone()

    if not row:
        # fallback: просто статус платежа
        cursor.execute(f"""
            SELECT id, status, amount FROM {SCHEMA}.yookassa_payments
            WHERE payment_id = %s AND user_id = %s
        """, (payment_id, user_id))
        row = cursor.fetchone()
        cursor.close()
        conn.close()
        if not row:
            return _err(404, 'Платёж не найден')
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'status': row['status'], 'amount': float(row['amount'])}),
            'isBase64Encoded': False
        }

    cursor.close()
    conn.close()
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({
            'status': row['status'],
            'amount': float(row['amount']),
            'order_id': row.get('order_id'),
            'payment_confirmed': row.get('payment_confirmed'),
            'access_token': row.get('access_token'),
            'website_url': row.get('website_url'),
            'expires_at': str(row['expires_at']) if row.get('expires_at') else None,
        }, default=str),
        'isBase64Encoded': False
    }


def handle_webhook(event: dict) -> dict:
    """Обрабатывает уведомление от ЮКасса: пополняет кошелёк или активирует заказ"""
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
    metadata = payment_obj.get('metadata', {})
    payment_type = metadata.get('type', 'topup')

    if not payment_id:
        return _err(400, 'No payment id')

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cursor = conn.cursor(cursor_factory=RealDictCursor)

    cursor.execute(f"""
        SELECT id, wallet_id, user_id, amount, status FROM {SCHEMA}.yookassa_payments
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
    user_id = payment_row['user_id']

    cursor.execute(f"SELECT email, full_name FROM {SCHEMA}.users WHERE id = %s", (user_id,))
    user_row = cursor.fetchone()

    cursor.execute(f"""
        UPDATE {SCHEMA}.yookassa_payments
        SET status = 'succeeded', updated_at = NOW()
        WHERE payment_id = %s
    """, (payment_id,))

    if payment_type == 'product':
        # Активируем заказ
        order_id = metadata.get('order_id')
        product_id = metadata.get('product_id')

        cursor.execute(f"""
            SELECT id, title, subscription_days, website_url
            FROM {SCHEMA}.products WHERE id = %s
        """, (product_id,))
        product = cursor.fetchone()

        access_token = secrets.token_urlsafe(32)
        from datetime import datetime, timedelta
        expires_at = None
        if product and product['subscription_days']:
            expires_at = datetime.now() + timedelta(days=int(product['subscription_days']))

        cursor.execute(f"""
            UPDATE {SCHEMA}.orders
            SET status = 'paid', payment_confirmed = TRUE, paid_at = NOW(),
                expires_at = %s, access_token = %s, notes = 'Оплата картой через ЮКасса'
            WHERE id = %s AND user_id = %s
        """, (expires_at, access_token, order_id, user_id))

        conn.commit()
        cursor.close()
        conn.close()

        send_order_notification(
            order_id=order_id,
            product_title=product['title'] if product else '—',
            amount=amount,
            user_name=user_row['full_name'] if user_row else '',
            user_email=user_row['email'] if user_row else '',
            payment_method='card'
        )

    else:
        # Пополнение баланса кошелька
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

        conn.commit()
        cursor.close()
        conn.close()

        send_order_notification(
            order_id=None,
            product_title=f'Пополнение кошелька',
            amount=amount,
            user_name=user_row['full_name'] if user_row else '',
            user_email=user_row['email'] if user_row else '',
            payment_method='card'
        )

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