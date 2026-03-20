import json
import os
import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart


def handler(event: dict, context) -> dict:
    """Внутренний сервис отправки email-уведомлений администратору о новых заказах и оплатах"""
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

    event_type = body.get('type')
    if event_type == 'order_paid':
        return notify_order_paid(body)
    
    return _resp(400, {'error': 'Unknown event type'})


def notify_order_paid(data: dict) -> dict:
    """Отправляет письмо администратору о новом оплаченном заказе"""
    order_id = data.get('order_id', '—')
    product_title = data.get('product_title', '—')
    amount = data.get('amount', 0)
    user_name = data.get('user_name') or '—'
    user_email = data.get('user_email', '—')
    payment_method = data.get('payment_method', '—')

    method_label = {
        'wallet': 'Баланс кошелька',
        'card': 'Банковская карта (ЮКасса)',
        'requisites': 'Реквизиты (вручную)',
    }.get(payment_method, payment_method)

    subject = f'Новый заказ #{order_id} — {product_title}'

    html = f"""
<html><body style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
  <div style="background: #1a1a2e; padding: 24px; border-radius: 12px 12px 0 0;">
    <h1 style="color: #fff; margin: 0; font-size: 22px;">MAXISOFTZAB</h1>
    <p style="color: #aaa; margin: 4px 0 0;">Уведомление о новом заказе</p>
  </div>
  <div style="border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 12px 12px; padding: 24px;">
    <h2 style="color: #e85d04; margin-top: 0;">Заказ #{order_id} оплачен</h2>
    <table style="width: 100%; border-collapse: collapse;">
      <tr><td style="padding: 8px 0; color: #666;">Продукт</td>
          <td style="padding: 8px 0; font-weight: bold;">{product_title}</td></tr>
      <tr><td style="padding: 8px 0; color: #666;">Сумма</td>
          <td style="padding: 8px 0; font-weight: bold; color: #e85d04;">{float(amount):.2f} ₽</td></tr>
      <tr><td style="padding: 8px 0; color: #666;">Способ оплаты</td>
          <td style="padding: 8px 0;">{method_label}</td></tr>
      <tr><td style="padding: 8px 0; color: #666;">Покупатель</td>
          <td style="padding: 8px 0;">{user_name}</td></tr>
      <tr><td style="padding: 8px 0; color: #666;">Email</td>
          <td style="padding: 8px 0;">{user_email}</td></tr>
    </table>
    <div style="margin-top: 20px; padding: 12px; background: #f5f5f5; border-radius: 8px; font-size: 13px; color: #666;">
      Заказ подтверждён автоматически. Проверьте раздел «Заказы» в административной панели.
    </div>
  </div>
</body></html>
"""

    send_email(subject, html)
    return _resp(200, {'ok': True})


def send_email(subject: str, html_body: str):
    smtp_host = os.environ.get('SMTP_HOST', '')
    smtp_port = int(os.environ.get('SMTP_PORT', '465'))
    smtp_user = os.environ.get('SMTP_USER', '')
    smtp_password = os.environ.get('SMTP_PASSWORD', '')
    admin_email = os.environ.get('ADMIN_EMAIL', '')

    if not all([smtp_host, smtp_user, smtp_password, admin_email]):
        return

    msg = MIMEMultipart('alternative')
    msg['Subject'] = subject
    msg['From'] = f'MAXISOFTZAB <{smtp_user}>'
    msg['To'] = admin_email
    msg.attach(MIMEText(html_body, 'html', 'utf-8'))

    context = ssl.create_default_context()
    if smtp_port == 465:
        with smtplib.SMTP_SSL(smtp_host, smtp_port, context=context) as server:
            server.login(smtp_user, smtp_password)
            server.sendmail(smtp_user, admin_email, msg.as_string())
    else:
        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.starttls(context=context)
            server.login(smtp_user, smtp_password)
            server.sendmail(smtp_user, admin_email, msg.as_string())


def _resp(code: int, body: dict) -> dict:
    return {
        'statusCode': code,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps(body),
        'isBase64Encoded': False
    }
