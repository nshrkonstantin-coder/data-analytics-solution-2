import json
import os
import base64
import uuid
import boto3
from botocore.client import Config


def handler(event: dict, context) -> dict:
    """Загрузка изображений продуктов в S3. Принимает base64, возвращает публичный URL."""
    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Authorization',
                'Access-Control-Max-Age': '86400',
            },
            'body': '',
            'isBase64Encoded': False,
        }

    if event.get('httpMethod') != 'POST':
        return _err(405, 'Method not allowed')

    try:
        body = json.loads(event.get('body', '{}'))
    except Exception:
        return _err(400, 'Invalid JSON')

    image_data = body.get('image_data', '')
    image_name = body.get('image_name', 'image.jpg')

    if not image_data:
        return _err(400, 'image_data обязателен')

    # Убираем data:image/...;base64, префикс
    if ',' in image_data:
        header, image_data = image_data.split(',', 1)
        ext = 'jpg'
        if 'png' in header:
            ext = 'png'
        elif 'gif' in header:
            ext = 'gif'
        elif 'webp' in header:
            ext = 'webp'
    else:
        ext = image_name.rsplit('.', 1)[-1].lower() if '.' in image_name else 'jpg'

    try:
        image_bytes = base64.b64decode(image_data)
    except Exception:
        return _err(400, 'Неверный формат base64')

    if len(image_bytes) > 5 * 1024 * 1024:
        return _err(400, 'Файл слишком большой (максимум 5 МБ)')

    content_type_map = {'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'png': 'image/png', 'gif': 'image/gif', 'webp': 'image/webp'}
    content_type = content_type_map.get(ext, 'image/jpeg')

    key = f'products/{uuid.uuid4().hex}.{ext}'

    s3 = boto3.client(
        's3',
        endpoint_url='https://bucket.poehali.dev',
        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
        config=Config(signature_version='s3v4'),
    )

    s3.put_object(
        Bucket='files',
        Key=key,
        Body=image_bytes,
        ContentType=content_type,
    )

    project_id = os.environ['AWS_ACCESS_KEY_ID']
    url = f'https://cdn.poehali.dev/projects/{project_id}/bucket/{key}'

    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'url': url}),
        'isBase64Encoded': False,
    }


def _err(code: int, msg: str) -> dict:
    return {
        'statusCode': code,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': msg}),
        'isBase64Encoded': False,
    }
