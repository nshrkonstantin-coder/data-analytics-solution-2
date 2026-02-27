import json
import os
import secrets
import bcrypt
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: dict, context) -> dict:
    """API для админ-панели - управление контентом, пользователями, продуктами и заказами"""
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
    
    action = event.get('queryStringParameters', {}).get('action', '')
    
    try:
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        
        if method == 'GET' and action == 'content':
            return get_site_content(conn)
        
        headers = event.get('headers', {})
        token = headers.get('x-authorization', '') or headers.get('X-Authorization', '')
        token = token.replace('Bearer ', '')
        
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
            SELECT u.id, u.role 
            FROM users u
            JOIN sessions s ON u.id = s.user_id
            WHERE s.token = %s AND s.expires_at > NOW()
        """, (token,))
        
        user = cursor.fetchone()
        cursor.close()
        
        if not user or user['role'] != 'admin':
            conn.close()
            return {
                'statusCode': 403,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Доступ запрещен. Требуются права администратора'}),
                'isBase64Encoded': False
            }
        
        if method == 'GET':
            if action == 'content':
                return get_site_content(conn)
            elif action == 'users':
                return get_users(conn)
            elif action == 'products':
                return get_all_products(conn)
            elif action == 'stats':
                return get_stats(conn)
            elif action == 'get-orders':
                return get_orders(conn)
        
        elif method == 'POST':
            body = json.loads(event.get('body', '{}'))
            if action == 'content':
                return update_content(conn, body, user['id'])
            elif action == 'product':
                return create_product(conn, body)
            elif action == 'confirm-payment':
                return admin_confirm_payment(conn, body)
        
        elif method == 'PUT':
            body = json.loads(event.get('body', '{}'))
            if action == 'product':
                return update_product(conn, body)
            elif action == 'update-order':
                return update_order(conn, body)
            elif action == 'user':
                return update_user(conn, body)
            elif action == 'reset-password':
                return reset_user_password(conn, body)
        
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


def get_site_content(conn) -> dict:
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    cursor.execute("SELECT * FROM site_content ORDER BY section, key")
    content = cursor.fetchall()
    cursor.close()
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'content': [dict(c) for c in content]}, default=str),
        'isBase64Encoded': False
    }


def update_content(conn, body: dict, user_id: int) -> dict:
    section = body.get('section')
    key = body.get('key')
    content = body.get('content')
    content_type = body.get('content_type', 'text')
    
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO site_content (section, key, content, content_type, updated_by)
        VALUES (%s, %s, %s, %s, %s)
        ON CONFLICT (section, key) 
        DO UPDATE SET content = EXCLUDED.content, content_type = EXCLUDED.content_type, 
                      updated_by = EXCLUDED.updated_by, updated_at = NOW()
    """, (section, key, content, content_type, user_id))
    
    conn.commit()
    cursor.close()
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'message': 'Контент обновлен'}),
        'isBase64Encoded': False
    }


def get_users(conn) -> dict:
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    cursor.execute("""
        SELECT u.id, u.email, u.full_name, u.phone, u.role, u.created_at,
               w.balance
        FROM users u
        LEFT JOIN wallets w ON u.id = w.user_id
        ORDER BY u.created_at DESC
    """)
    users = cursor.fetchall()
    cursor.close()
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'users': [dict(u) for u in users]}, default=str),
        'isBase64Encoded': False
    }


def get_all_products(conn) -> dict:
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    cursor.execute("SELECT * FROM products ORDER BY created_at DESC")
    products = cursor.fetchall()
    cursor.close()
    
    result = []
    for p in products:
        d = dict(p)
        if d.get('upgrades') is None:
            d['upgrades'] = []
        result.append(d)
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'products': result}, default=str),
        'isBase64Encoded': False
    }


def create_product(conn, body: dict) -> dict:
    import json as jsonlib
    upgrades = body.get('upgrades', [])
    if isinstance(upgrades, str):
        try:
            upgrades = jsonlib.loads(upgrades)
        except:
            upgrades = []
    
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO products (title, description, price, category, image_url, is_active,
                              website_url, subscription_days, upgrades, is_subscription)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """, (
        body.get('title'),
        body.get('description'),
        body.get('price'),
        body.get('category'),
        body.get('image_url'),
        body.get('is_active', True),
        body.get('website_url', ''),
        body.get('subscription_days', 30),
        jsonlib.dumps(upgrades),
        body.get('is_subscription', True)
    ))
    
    conn.commit()
    cursor.close()
    
    return {
        'statusCode': 201,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'message': 'Продукт создан'}),
        'isBase64Encoded': False
    }


def update_product(conn, body: dict) -> dict:
    import json as jsonlib
    product_id = body.get('id')
    upgrades = body.get('upgrades', [])
    if isinstance(upgrades, str):
        try:
            upgrades = jsonlib.loads(upgrades)
        except:
            upgrades = []
    
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE products 
        SET title = %s, description = %s, price = %s, category = %s, 
            image_url = %s, is_active = %s, website_url = %s,
            subscription_days = %s, upgrades = %s, is_subscription = %s,
            updated_at = NOW()
        WHERE id = %s
    """, (
        body.get('title'),
        body.get('description'),
        body.get('price'),
        body.get('category'),
        body.get('image_url'),
        body.get('is_active'),
        body.get('website_url', ''),
        body.get('subscription_days', 30),
        jsonlib.dumps(upgrades),
        body.get('is_subscription', True),
        product_id
    ))
    
    conn.commit()
    cursor.close()
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'message': 'Продукт обновлен'}),
        'isBase64Encoded': False
    }


def get_stats(conn) -> dict:
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    cursor.execute("SELECT COUNT(*) as total FROM users")
    users_count = cursor.fetchone()['total']
    
    cursor.execute("SELECT COUNT(*) as total FROM products WHERE is_active = TRUE")
    products_count = cursor.fetchone()['total']
    
    cursor.execute("SELECT COUNT(*) as total FROM orders")
    orders_count = cursor.fetchone()['total']
    
    cursor.execute("SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE status = 'paid' OR payment_confirmed = TRUE")
    revenue = cursor.fetchone()['total']
    
    cursor.execute("""
        SELECT COUNT(*) as total FROM orders 
        WHERE payment_confirmed = TRUE AND expires_at > NOW()
    """)
    active_subscriptions = cursor.fetchone()['total']
    
    cursor.close()
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({
            'users': int(users_count),
            'products': int(products_count),
            'orders': int(orders_count),
            'revenue': float(revenue),
            'active_subscriptions': int(active_subscriptions)
        }),
        'isBase64Encoded': False
    }


def get_orders(conn) -> dict:
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    cursor.execute("""
        SELECT o.id, o.user_id, o.product_id, o.total_amount, o.status,
               o.paid_at, o.expires_at, o.access_token, o.payment_confirmed,
               o.payment_method, o.payment_reference, o.notes, o.created_at,
               u.email as user_email, u.full_name as user_name,
               p.title as product_title, p.website_url
        FROM orders o
        LEFT JOIN users u ON o.user_id = u.id
        LEFT JOIN products p ON o.product_id = p.id
        ORDER BY o.created_at DESC
    """)
    orders = cursor.fetchall()
    cursor.close()
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'orders': [dict(o) for o in orders]}, default=str),
        'isBase64Encoded': False
    }


def update_order(conn, body: dict) -> dict:
    order_id = body.get('id')
    status = body.get('status')
    notes = body.get('notes', '')
    
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE orders SET status = %s, notes = %s, updated_at = NOW()
        WHERE id = %s
    """, (status, notes, order_id))
    
    conn.commit()
    cursor.close()
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'message': 'Заказ обновлен'}),
        'isBase64Encoded': False
    }


def admin_confirm_payment(conn, body: dict) -> dict:
    """Администратор подтверждает оплату вручную - генерируется access_token и ссылка"""
    order_id = body.get('order_id')
    payment_reference = body.get('payment_reference', '')
    notes = body.get('notes', '')
    
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    cursor.execute("""
        SELECT o.*, p.subscription_days, p.website_url
        FROM orders o
        JOIN products p ON o.product_id = p.id
        WHERE o.id = %s
    """, (order_id,))
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
    
    access_token = secrets.token_urlsafe(32)
    sub_days = order['subscription_days'] or 30
    
    cursor.execute("""
        UPDATE orders 
        SET status = 'paid', payment_confirmed = TRUE, paid_at = NOW(),
            expires_at = NOW() + INTERVAL '%s days',
            access_token = %s, payment_reference = %s, notes = %s,
            updated_at = NOW()
        WHERE id = %s
    """ % (sub_days, '%s', '%s', '%s', '%s'), (access_token, payment_reference, notes, order_id))
    
    conn.commit()
    cursor.close()
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({
            'message': 'Оплата подтверждена',
            'access_token': access_token
        }),
        'isBase64Encoded': False
    }


def update_user(conn, body: dict) -> dict:
    user_id = body.get('id')
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE users 
        SET full_name = %s, phone = %s, role = %s, updated_at = NOW()
        WHERE id = %s
    """, (
        body.get('full_name'),
        body.get('phone'),
        body.get('role', 'user'),
        user_id
    ))
    
    conn.commit()
    cursor.close()
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'message': 'Пользователь обновлен'}),
        'isBase64Encoded': False
    }


def reset_user_password(conn, body: dict) -> dict:
    user_id = body.get('user_id')
    new_password = body.get('new_password')
    
    password_hash = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE users SET password_hash = %s, updated_at = NOW()
        WHERE id = %s
    """, (password_hash, user_id))
    
    conn.commit()
    cursor.close()
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'message': 'Пароль сброшен'}),
        'isBase64Encoded': False
    }
