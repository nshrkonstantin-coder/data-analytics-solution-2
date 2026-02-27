import json
import os
import secrets
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: dict, context) -> dict:
    """API для управления заказами: создание, оплата, подтверждение доступа, проверка подписки"""
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
    
    action = (event.get('queryStringParameters') or {}).get('action', '')
    headers = event.get('headers', {})
    token = headers.get('x-authorization', '') or headers.get('X-Authorization', '')
    token = token.replace('Bearer ', '')
    
    try:
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        
        # Публичный endpoint: проверка доступа по access_token сайта
        if method == 'GET' and action == 'check-access':
            access_token = (event.get('queryStringParameters') or {}).get('token', '')
            return check_access(conn, access_token)
        
        # Публичный endpoint: получение реквизитов для оплаты
        if method == 'GET' and action == 'payment-info':
            product_id = (event.get('queryStringParameters') or {}).get('product_id', '')
            return get_payment_info(conn, product_id)
        
        # Все остальные endpoints требуют авторизации
        if not token:
            conn.close()
            return {
                'statusCode': 401,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Требуется авторизация'}),
                'isBase64Encoded': False
            }
        
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute("""
            SELECT u.id, u.role, u.email, u.full_name
            FROM users u
            JOIN sessions s ON u.id = s.user_id
            WHERE s.token = %s AND s.expires_at > NOW()
        """, (token,))
        user = cursor.fetchone()
        cursor.close()
        
        if not user:
            conn.close()
            return {
                'statusCode': 401,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Сессия истекла, войдите снова'}),
                'isBase64Encoded': False
            }
        
        if method == 'GET':
            if action == 'my-orders':
                return get_my_orders(conn, user['id'])
            elif action == 'order-detail':
                order_id = (event.get('queryStringParameters') or {}).get('order_id', '')
                return get_order_detail(conn, user['id'], order_id)
        
        elif method == 'POST':
            body = json.loads(event.get('body', '{}'))
            if action == 'create':
                return create_order(conn, user['id'], body)
            elif action == 'confirm-payment':
                return user_confirm_payment(conn, user['id'], body)
            elif action == 'renew':
                return renew_subscription(conn, user['id'], body)
        
        conn.close()
        return {
            'statusCode': 404,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Endpoint not found'}),
            'isBase64Encoded': False
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }


def get_payment_info(conn, product_id) -> dict:
    """Возвращает информацию о продукте и реквизиты для оплаты"""
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    cursor.execute("""
        SELECT id, title, description, price, category, image_url, 
               subscription_days, upgrades, is_subscription
        FROM products WHERE id = %s AND is_active = TRUE
    """, (product_id,))
    product = cursor.fetchone()
    cursor.close()
    conn.close()
    
    if not product:
        return {
            'statusCode': 404,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Продукт не найден'}),
            'isBase64Encoded': False
        }
    
    p = dict(product)
    if p.get('upgrades') is None:
        p['upgrades'] = []
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'product': p}, default=str),
        'isBase64Encoded': False
    }


def create_order(conn, user_id: int, body: dict) -> dict:
    """Создает заказ и возвращает реквизиты для оплаты"""
    product_id = body.get('product_id')
    
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    cursor.execute("""
        SELECT id, title, price, subscription_days, website_url, is_subscription
        FROM products WHERE id = %s AND is_active = TRUE
    """, (product_id,))
    product = cursor.fetchone()
    
    if not product:
        cursor.close()
        conn.close()
        return {
            'statusCode': 404,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Продукт не найден'}),
            'isBase64Encoded': False
        }
    
    # Проверяем, нет ли уже активного заказа на этот продукт
    cursor.execute("""
        SELECT id FROM orders 
        WHERE user_id = %s AND product_id = %s AND payment_confirmed = TRUE AND expires_at > NOW()
        LIMIT 1
    """, (user_id, product_id))
    existing = cursor.fetchone()
    if existing:
        cursor.close()
        conn.close()
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'У вас уже есть активная подписка на этот продукт'}),
            'isBase64Encoded': False
        }
    
    cursor.execute("""
        INSERT INTO orders (user_id, product_id, total_amount, status)
        VALUES (%s, %s, %s, 'pending')
        RETURNING id
    """, (user_id, product_id, product['price']))
    
    order = cursor.fetchone()
    conn.commit()
    cursor.close()
    conn.close()
    
    return {
        'statusCode': 201,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({
            'message': 'Заказ создан',
            'order_id': order['id'],
            'product_title': product['title'],
            'amount': float(product['price'])
        }),
        'isBase64Encoded': False
    }


def get_my_orders(conn, user_id: int) -> dict:
    """Возвращает все заказы пользователя с информацией о подписке"""
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    cursor.execute("""
        SELECT o.id, o.product_id, o.total_amount, o.status,
               o.paid_at, o.expires_at, o.access_token, o.payment_confirmed,
               o.payment_reference, o.notes, o.created_at,
               p.title as product_title, p.category, p.image_url,
               p.website_url, p.upgrades, p.subscription_days, p.is_subscription,
               CASE 
                   WHEN o.payment_confirmed AND o.expires_at > NOW() THEN 'active'
                   WHEN o.payment_confirmed AND o.expires_at <= NOW() THEN 'expired'
                   WHEN o.payment_confirmed AND o.expires_at IS NULL THEN 'active'
                   ELSE 'pending'
               END as subscription_status,
               CASE 
                   WHEN o.expires_at IS NOT NULL THEN 
                       EXTRACT(DAY FROM (o.expires_at - NOW()))::INTEGER
                   ELSE NULL
               END as days_left
        FROM orders o
        JOIN products p ON o.product_id = p.id
        WHERE o.user_id = %s
        ORDER BY o.created_at DESC
    """, (user_id,))
    orders = cursor.fetchall()
    cursor.close()
    conn.close()
    
    result = []
    for o in orders:
        d = dict(o)
        if d.get('upgrades') is None:
            d['upgrades'] = []
        result.append(d)
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'orders': result}, default=str),
        'isBase64Encoded': False
    }


def get_order_detail(conn, user_id: int, order_id) -> dict:
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    cursor.execute("""
        SELECT o.*, p.title as product_title, p.website_url, p.upgrades,
               p.subscription_days, p.is_subscription, p.image_url
        FROM orders o
        JOIN products p ON o.product_id = p.id
        WHERE o.id = %s AND o.user_id = %s
    """, (order_id, user_id))
    order = cursor.fetchone()
    cursor.close()
    conn.close()
    
    if not order:
        return {
            'statusCode': 404,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Заказ не найден'}),
            'isBase64Encoded': False
        }
    
    d = dict(order)
    if d.get('upgrades') is None:
        d['upgrades'] = []
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'order': d}, default=str),
        'isBase64Encoded': False
    }


def user_confirm_payment(conn, user_id: int, body: dict) -> dict:
    """Пользователь нажимает 'Подтвердить оплату' на сайте продукта.
    Система проверяет, подтверждена ли оплата администратором.
    Если да - генерирует access_token и разрешает доступ."""
    order_id = body.get('order_id')
    
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    cursor.execute("""
        SELECT o.*, p.website_url, p.title as product_title
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
    
    if not order['payment_confirmed']:
        cursor.close()
        conn.close()
        return {
            'statusCode': 402,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'error': 'Оплата ещё не подтверждена. Пожалуйста, подождите подтверждения от менеджера.',
                'status': 'waiting_confirmation'
            }),
            'isBase64Encoded': False
        }
    
    if order['expires_at']:
        from datetime import datetime
        if order['expires_at'] < datetime.now():
            cursor.close()
            conn.close()
            return {
                'statusCode': 403,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'error': 'Подписка истекла. Пожалуйста, продлите подписку.',
                    'status': 'expired'
                }),
                'isBase64Encoded': False
            }
    
    cursor.close()
    conn.close()
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({
            'message': 'Оплата подтверждена, доступ разрешен',
            'access_token': order['access_token'],
            'expires_at': str(order['expires_at']) if order['expires_at'] else None,
            'website_url': order['website_url'],
            'status': 'granted'
        }),
        'isBase64Encoded': False
    }


def check_access(conn, access_token: str) -> dict:
    """Проверяет токен доступа - используется сайтом продукта для верификации входа"""
    if not access_token:
        conn.close()
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Токен не указан', 'access': False}),
            'isBase64Encoded': False
        }
    
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    cursor.execute("""
        SELECT o.id, o.expires_at, o.payment_confirmed, o.user_id,
               u.email, u.full_name,
               p.title as product_title, p.website_url
        FROM orders o
        JOIN users u ON o.user_id = u.id
        JOIN products p ON o.product_id = p.id
        WHERE o.access_token = %s
    """, (access_token,))
    order = cursor.fetchone()
    cursor.close()
    conn.close()
    
    if not order:
        return {
            'statusCode': 404,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Токен недействителен', 'access': False}),
            'isBase64Encoded': False
        }
    
    if not order['payment_confirmed']:
        return {
            'statusCode': 403,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Оплата не подтверждена', 'access': False}),
            'isBase64Encoded': False
        }
    
    if order['expires_at']:
        from datetime import datetime
        if order['expires_at'] < datetime.now():
            return {
                'statusCode': 403,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Подписка истекла', 'access': False, 'expired': True}),
                'isBase64Encoded': False
            }
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({
            'access': True,
            'user_email': order['email'],
            'user_name': order['full_name'],
            'product_title': order['product_title'],
            'expires_at': str(order['expires_at']) if order['expires_at'] else None
        }),
        'isBase64Encoded': False
    }


def renew_subscription(conn, user_id: int, body: dict) -> dict:
    """Создает новый заказ для продления подписки"""
    order_id = body.get('order_id')
    
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    cursor.execute("""
        SELECT o.product_id, p.title, p.price
        FROM orders o
        JOIN products p ON o.product_id = p.id
        WHERE o.id = %s AND o.user_id = %s
    """, (order_id, user_id))
    old_order = cursor.fetchone()
    
    if not old_order:
        cursor.close()
        conn.close()
        return {
            'statusCode': 404,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Заказ не найден'}),
            'isBase64Encoded': False
        }
    
    cursor.execute("""
        INSERT INTO orders (user_id, product_id, total_amount, status, notes)
        VALUES (%s, %s, %s, 'pending', 'Продление подписки')
        RETURNING id
    """, (user_id, old_order['product_id'], old_order['price']))
    
    new_order = cursor.fetchone()
    conn.commit()
    cursor.close()
    conn.close()
    
    return {
        'statusCode': 201,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({
            'message': 'Заказ на продление создан',
            'order_id': new_order['id'],
            'amount': float(old_order['price'])
        }),
        'isBase64Encoded': False
    }
