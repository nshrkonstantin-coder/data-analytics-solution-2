import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: dict, context) -> dict:
    """API для админ-панели - управление контентом сайта, пользователями и продуктами"""
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
    
    token = event.get('headers', {}).get('x-authorization', '').replace('Bearer ', '')
    
    if not token:
        return {
            'statusCode': 401,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Требуется авторизация'}),
            'isBase64Encoded': False
        }
    
    try:
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        cursor.execute("""
            SELECT u.id, u.role 
            FROM users u
            JOIN sessions s ON u.id = s.user_id
            WHERE s.token = %s AND s.expires_at > NOW()
        """, (token,))
        
        user = cursor.fetchone()
        
        if not user or user['role'] != 'admin':
            cursor.close()
            conn.close()
            return {
                'statusCode': 403,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Доступ запрещен. Требуются права администратора'}),
                'isBase64Encoded': False
            }
        
        action = event.get('queryStringParameters', {}).get('action', '')
        
        if method == 'GET':
            if action == 'content':
                return get_site_content(conn)
            elif action == 'users':
                return get_users(conn)
            elif action == 'products':
                return get_all_products(conn)
            elif action == 'stats':
                return get_stats(conn)
        
        elif method == 'POST':
            body = json.loads(event.get('body', '{}'))
            if action == 'content':
                return update_content(conn, body, user['id'])
            elif action == 'product':
                return create_product(conn, body)
        
        elif method == 'PUT':
            body = json.loads(event.get('body', '{}'))
            if action == 'product':
                return update_product(conn, body)
        
        cursor.close()
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
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'products': [dict(p) for p in products]}, default=str),
        'isBase64Encoded': False
    }


def create_product(conn, body: dict) -> dict:
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO products (title, description, price, category, image_url, is_active)
        VALUES (%s, %s, %s, %s, %s, %s)
    """, (
        body.get('title'),
        body.get('description'),
        body.get('price'),
        body.get('category'),
        body.get('image_url'),
        body.get('is_active', True)
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
    product_id = body.get('id')
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE products 
        SET title = %s, description = %s, price = %s, category = %s, 
            image_url = %s, is_active = %s, updated_at = NOW()
        WHERE id = %s
    """, (
        body.get('title'),
        body.get('description'),
        body.get('price'),
        body.get('category'),
        body.get('image_url'),
        body.get('is_active'),
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
    
    cursor.execute("SELECT COUNT(*) as total FROM products WHERE is_active = true")
    products_count = cursor.fetchone()['total']
    
    cursor.execute("SELECT COUNT(*) as total FROM orders")
    orders_count = cursor.fetchone()['total']
    
    cursor.execute("SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE status = 'paid'")
    revenue = cursor.fetchone()['total']
    
    cursor.close()
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({
            'stats': {
                'users': users_count,
                'products': products_count,
                'orders': orders_count,
                'revenue': float(revenue) if revenue else 0
            }
        }),
        'isBase64Encoded': False
    }
