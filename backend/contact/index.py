import json
import os
import base64
import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders


MAX_FILE_SIZE = 30 * 1024 * 1024  # 30 МБ


def handler(event: dict, context) -> dict:
    """Обработка заявок с формы 'Связаться с нами' — отправка письма с вложениями на почту администратора"""
    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }

    if event.get('httpMethod') != 'POST':
        return _resp(405, {'error': 'Method not allowed'})

    try:
        body = json.loads(event.get('body', '{}'))
    except Exception:
        return _resp(400, {'error': 'Invalid JSON'})

    # Тестовый режим — шлёт письмо с ~3МБ вложением
    if body.get('_test_with_attachment'):
        return _test_send_with_attachment()

    name = body.get('name', '').strip()
    email = body.get('email', '').strip()
    phone = body.get('phone', '').strip()
    message = body.get('message', '').strip()
    files = body.get('files', [])  # [{name, data (base64), size}]

    if not name or not message:
        return _resp(400, {'error': 'Имя и сообщение обязательны'})

    # Проверяем размер вложений
    total_size = 0
    for f in files:
        raw = f.get('data', '')
        # base64 строка → реальный размер ~= len * 3/4
        file_bytes = base64.b64decode(raw.split(',')[-1]) if raw else b''
        total_size += len(file_bytes)
        if total_size > MAX_FILE_SIZE:
            return _resp(400, {'error': 'Общий размер файлов превышает 30 МБ'})

    try:
        send_contact_email(name, email, phone, message, files)
    except Exception as e:
        return _resp(500, {'error': f'Ошибка отправки письма: {str(e)}'})

    return _resp(200, {'ok': True, 'message': 'Заявка отправлена'})


def send_contact_email(name: str, email: str, phone: str, message: str, files: list):
    smtp_host = os.environ.get('SMTP_HOST', '')
    smtp_port = int(os.environ.get('SMTP_PORT', '465'))
    smtp_user = os.environ.get('SMTP_USER', '')
    smtp_password = os.environ.get('SMTP_PASSWORD', '')
    admin_email = os.environ.get('ADMIN_EMAIL', '')

    if not all([smtp_host, smtp_user, smtp_password, admin_email]):
        raise Exception('SMTP не настроен')

    msg = MIMEMultipart('mixed')
    msg['Subject'] = f'Новая заявка от {name}'
    msg['From'] = f'MAXISOFTZAB <{smtp_user}>'
    msg['To'] = admin_email
    if email:
        msg['Reply-To'] = email

    html = f"""
<html><body style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
  <div style="background: #1a1a2e; padding: 24px; border-radius: 12px 12px 0 0;">
    <h1 style="color: #fff; margin: 0; font-size: 22px;">MAXISOFTZAB</h1>
    <p style="color: #aaa; margin: 4px 0 0;">Новая заявка с сайта</p>
  </div>
  <div style="border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 12px 12px; padding: 24px;">
    <h2 style="color: #e85d04; margin-top: 0;">Заявка от: {name}</h2>
    <table style="width: 100%; border-collapse: collapse;">
      <tr><td style="padding: 8px 0; color: #666; width: 120px;">Имя</td>
          <td style="padding: 8px 0; font-weight: bold;">{name}</td></tr>
      {'<tr><td style="padding: 8px 0; color: #666;">Email</td><td style="padding: 8px 0;"><a href="mailto:' + email + '" style="color: #e85d04;">' + email + '</a></td></tr>' if email else ''}
      {'<tr><td style="padding: 8px 0; color: #666;">Телефон</td><td style="padding: 8px 0;">' + phone + '</td></tr>' if phone else ''}
    </table>
    <div style="margin-top: 16px; padding: 16px; background: #f9f9f9; border-radius: 8px; border-left: 4px solid #e85d04;">
      <p style="margin: 0; color: #555; font-size: 13px; font-weight: bold; margin-bottom: 8px;">Сообщение:</p>
      <p style="margin: 0; white-space: pre-wrap; color: #333;">{message}</p>
    </div>
    {f'<div style="margin-top: 12px; padding: 10px; background: #fff3e0; border-radius: 8px; font-size: 13px; color: #666;">📎 Прикреплено файлов: {len(files)}</div>' if files else ''}
  </div>
</body></html>
"""

    msg.attach(MIMEText(html, 'html', 'utf-8'))

    # Прикрепляем файлы
    for f in files:
        filename = f.get('name', 'file')
        raw_data = f.get('data', '')
        if not raw_data:
            continue
        # Убираем data URI префикс если есть
        if ',' in raw_data:
            raw_data = raw_data.split(',', 1)[1]
        file_bytes = base64.b64decode(raw_data)

        part = MIMEBase('application', 'octet-stream')
        part.set_payload(file_bytes)
        encoders.encode_base64(part)
        # Кодируем имя файла для поддержки кириллицы
        from email.header import Header
        encoded_name = str(Header(filename, 'utf-8'))
        part.add_header('Content-Disposition', 'attachment', filename=filename)
        msg.attach(part)

    ctx = ssl.create_default_context()
    if smtp_port == 465:
        with smtplib.SMTP_SSL(smtp_host, smtp_port, context=ctx) as server:
            server.login(smtp_user, smtp_password)
            server.sendmail(smtp_user, admin_email, msg.as_string())
    else:
        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.starttls(context=ctx)
            server.login(smtp_user, smtp_password)
            server.sendmail(smtp_user, admin_email, msg.as_string())


def _test_send_with_attachment() -> dict:
    """Генерирует PNG ~3 МБ и отправляет как вложение для проверки"""
    import struct
    import zlib

    # Создаём PNG 1000x1000 пикселей (RGB) — ~3 МБ несжатого
    width, height = 1000, 1000

    def make_png(w, h):
        def chunk(name, data):
            c = zlib.crc32(name + data) & 0xffffffff
            return struct.pack('>I', len(data)) + name + data + struct.pack('>I', c)

        ihdr = struct.pack('>IIBBBBB', w, h, 8, 2, 0, 0, 0)
        raw_rows = b''
        for y in range(h):
            row = b'\x00'  # filter type
            for x in range(w):
                r = (x * 255 // w) & 0xff
                g = (y * 255 // h) & 0xff
                b = ((x + y) * 128 // (w + h)) & 0xff
                row += bytes([r, g, b])
            raw_rows += row

        compressed = zlib.compress(raw_rows, 6)
        return (
            b'\x89PNG\r\n\x1a\n'
            + chunk(b'IHDR', ihdr)
            + chunk(b'IDAT', compressed)
            + chunk(b'IEND', b'')
        )

    png_bytes = make_png(width, height)
    png_b64 = base64.b64encode(png_bytes).decode('utf-8')
    size_mb = len(png_bytes) / (1024 * 1024)

    fake_files = [{'name': f'test_image_{width}x{height}.png', 'data': png_b64}]

    try:
        send_contact_email(
            name='Автотест',
            email='test@test.com',
            phone='+7 999 000-00-00',
            message=f'Тест отправки с вложением.\nРазмер файла: {size_mb:.2f} МБ\nРазрешение: {width}x{height} px',
            files=fake_files
        )
        return _resp(200, {'ok': True, 'message': f'Письмо с вложением {size_mb:.2f} МБ отправлено'})
    except Exception as e:
        return _resp(500, {'error': str(e)})


def _resp(code: int, body: dict) -> dict:
    return {
        'statusCode': code,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps(body),
        'isBase64Encoded': False
    }