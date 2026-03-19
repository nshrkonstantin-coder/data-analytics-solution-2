import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: dict, context) -> dict:
    """API для кошелька пользователя: баланс, история транзакций, пополнение (только для админа)"""
    method = event.get('httpMethod', 'GET')

    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Authorization',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }

    headers = event.get('headers', {})
    token = headers.get('x-authorization', '') or headers.get('X-Authorization', '')
    token = token.replace('Bearer ', '')

    if not token:
        return {
            'statusCode': 401,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Требуется авторизация'}),
            'isBase64Encoded': False
        }

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cursor = conn.cursor(cursor_factory=RealDictCursor)

    cursor.execute("""
        SELECT u.id, u.role, u.email, u.full_name
        FROM users u
        JOIN sessions s ON u.id = s.user_id
        WHERE s.token = %s AND s.expires_at > NOW()
    """, (token,))
    user = cursor.fetchone()

    if not user:
        cursor.close()
        conn.close()
        return {
            'statusCode': 401,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Сессия истекла, войдите снова'}),
            'isBase64Encoded': False
        }

    action = (event.get('queryStringParameters') or {}).get('action', '')

    if method == 'GET' and action == 'balance':
        return get_balance(conn, cursor, user['id'])

    elif method == 'GET' and action == 'transactions':
        return get_transactions(conn, cursor, user['id'])

    elif method == 'POST' and action == 'topup':
        if user['role'] != 'admin':
            cursor.close()
            conn.close()
            return {
                'statusCode': 403,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Доступ запрещён'}),
                'isBase64Encoded': False
            }
        body = json.loads(event.get('body', '{}'))
        return topup_wallet(conn, cursor, body)

    elif method == 'POST' and action == 'pay-order':
        body = json.loads(event.get('body', '{}'))
        return pay_order_from_wallet(conn, cursor, user['id'], body)

    cursor.close()
    conn.close()
    return {
        'statusCode': 404,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Endpoint not found'}),
        'isBase64Encoded': False
    }


def get_balance(conn, cursor, user_id: int) -> dict:
    cursor.execute("""
        SELECT id, balance, currency, updated_at
        FROM wallets WHERE user_id = %s
    """, (user_id,))
    wallet = cursor.fetchone()
    cursor.close()
    conn.close()

    if not wallet:
        return {
            'statusCode': 404,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Кошелёк не найден'}),
            'isBase64Encoded': False
        }

    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'wallet': dict(wallet)}, default=str),
        'isBase64Encoded': False
    }


def get_transactions(conn, cursor, user_id: int) -> dict:
    cursor.execute("""
        SELECT wt.id, wt.amount, wt.type, wt.description, wt.created_at
        FROM wallet_transactions wt
        JOIN wallets w ON wt.wallet_id = w.id
        WHERE w.user_id = %s
        ORDER BY wt.created_at DESC
        LIMIT 50
    """, (user_id,))
    transactions = [dict(r) for r in cursor.fetchall()]
    cursor.close()
    conn.close()

    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'transactions': transactions}, default=str),
        'isBase64Encoded': False
    }


def topup_wallet(conn, cursor, body: dict) -> dict:
    user_id = body.get('user_id')
    amount = float(body.get('amount', 0))
    description = body.get('description', 'Пополнение баланса администратором')

    if not user_id or amount <= 0:
        cursor.close()
        conn.close()
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Укажите user_id и сумму больше 0'}),
            'isBase64Encoded': False
        }

    cursor.execute("SELECT id, balance FROM wallets WHERE user_id = %s", (user_id,))
    wallet = cursor.fetchone()

    if not wallet:
        cursor.close()
        conn.close()
        return {
            'statusCode': 404,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Кошелёк пользователя не найден'}),
            'isBase64Encoded': False
        }

    new_balance = float(wallet['balance']) + amount
    cursor.execute("""
        UPDATE wallets SET balance = %s, updated_at = NOW() WHERE id = %s
    """, (new_balance, wallet['id']))

    cursor.execute("""
        INSERT INTO wallet_transactions (wallet_id, amount, type, description)
        VALUES (%s, %s, 'credit', %s)
    """, (wallet['id'], amount, description))

    conn.commit()
    cursor.close()
    conn.close()

    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'message': 'Баланс пополнен', 'new_balance': new_balance}),
        'isBase64Encoded': False
    }


def pay_order_from_wallet(conn, cursor, user_id: int, body: dict) -> dict:
    order_id = body.get('order_id')

    cursor.execute("""
        SELECT o.id, o.total_amount, o.product_id, o.payment_confirmed, o.status,
               p.title, p.subscription_days, p.website_url, p.is_subscription
        FROM orders o
        JOIN products p ON o.product_id = p.id
        WHERE o.id = %s AND o.user_id = %s
    """, (order_id, user_id))
    order = cursor.fetchone()

    if not order:
        cursor.close()
        conn.close()
        return {
            'statusCode': 404,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Заказ не найден'}),
            'isBase64Encoded': False
        }

    if order['payment_confirmed']:
        cursor.close()
        conn.close()
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Заказ уже оплачен'}),
            'isBase64Encoded': False
        }

    cursor.execute("SELECT id, balance FROM wallets WHERE user_id = %s", (user_id,))
    wallet = cursor.fetchone()

    if not wallet:
        cursor.close()
        conn.close()
        return {
            'statusCode': 404,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Кошелёк не найден'}),
            'isBase64Encoded': False
        }

    amount = float(order['total_amount'])
    if float(wallet['balance']) < amount:
        cursor.close()
        conn.close()
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Недостаточно средств на балансе'}),
            'isBase64Encoded': False
        }

    import secrets as sec
    new_balance = float(wallet['balance']) - amount
    cursor.execute("""
        UPDATE wallets SET balance = %s, updated_at = NOW() WHERE id = %s
    """, (new_balance, wallet['id']))

    cursor.execute("""
        INSERT INTO wallet_transactions (wallet_id, amount, type, description)
        VALUES (%s, %s, 'debit', %s)
    """, (wallet['id'], amount, f'Оплата заказа #{order_id}: {order["title"]}'))

    access_token = sec.token_urlsafe(32)
    expires_at = None
    if order['is_subscription'] and order['subscription_days']:
        cursor.execute("""
            UPDATE orders
            SET payment_confirmed = TRUE, status = 'paid', paid_at = NOW(),
                expires_at = NOW() + INTERVAL '%s days',
                access_token = %s, payment_method = 'wallet'
            WHERE id = %s
        """ % (order['subscription_days'], '%s', '%s'), (access_token, order_id))
    else:
        cursor.execute("""
            UPDATE orders
            SET payment_confirmed = TRUE, status = 'paid', paid_at = NOW(),
                access_token = %s, payment_method = 'wallet'
            WHERE id = %s
        """, (access_token, order_id))

    conn.commit()
    cursor.close()
    conn.close()

    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({
            'message': 'Оплата прошла успешно',
            'new_balance': new_balance,
            'access_token': access_token
        }),
        'isBase64Encoded': False
    }
