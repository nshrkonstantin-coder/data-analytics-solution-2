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
    if event_type == 'new_register':
        return notify_new_register(body)
    if event_type == 'password_reset':
        return notify_password_reset(body)
    if event_type == 'test':
        return notify_test()

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


def notify_new_register(data: dict) -> dict:
    """Отправляет письмо администратору о новой регистрации пользователя"""
    user_email = data.get('user_email', '—')
    user_name = data.get('user_name') or '—'
    user_phone = data.get('user_phone') or '—'
    registered_at = data.get('registered_at', '—')

    subject = f'Новая регистрация — {user_email}'

    html = f"""
<html><body style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
  <div style="background: #1a1a2e; padding: 24px; border-radius: 12px 12px 0 0;">
    <h1 style="color: #fff; margin: 0; font-size: 22px;">MAXISOFTZAB</h1>
    <p style="color: #aaa; margin: 4px 0 0;">Уведомление о новой регистрации</p>
  </div>
  <div style="border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 12px 12px; padding: 24px;">
    <h2 style="color: #e85d04; margin-top: 0;">Новый пользователь зарегистрировался</h2>
    <table style="width: 100%; border-collapse: collapse;">
      <tr><td style="padding: 8px 0; color: #666;">Email</td>
          <td style="padding: 8px 0; font-weight: bold;">{user_email}</td></tr>
      <tr><td style="padding: 8px 0; color: #666;">Имя</td>
          <td style="padding: 8px 0;">{user_name}</td></tr>
      <tr><td style="padding: 8px 0; color: #666;">Телефон</td>
          <td style="padding: 8px 0;">{user_phone}</td></tr>
      <tr><td style="padding: 8px 0; color: #666;">Дата регистрации</td>
          <td style="padding: 8px 0;">{registered_at}</td></tr>
    </table>
    <div style="margin-top: 20px; padding: 12px; background: #f5f5f5; border-radius: 8px; font-size: 13px; color: #666;">
      Проверьте раздел «Пользователи» в административной панели.
    </div>
  </div>
</body></html>
"""

    send_email(subject, html)
    return _resp(200, {'ok': True})


def notify_password_reset(data: dict) -> dict:
    """Отправляет письмо пользователю с временным паролем"""
    user_email = data.get('user_email', '')
    user_name = data.get('user_name') or 'Пользователь'
    temp_password = data.get('temp_password', '')

    subject = 'Сброс пароля — MAXISOFTZAB'

    html = f"""
<html><body style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
  <div style="background: #1a1a2e; padding: 24px; border-radius: 12px 12px 0 0;">
    <h1 style="color: #fff; margin: 0; font-size: 22px;">MAXISOFTZAB</h1>
    <p style="color: #aaa; margin: 4px 0 0;">Восстановление доступа</p>
  </div>
  <div style="border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 12px 12px; padding: 24px;">
    <h2 style="color: #e85d04; margin-top: 0;">Ваш временный пароль</h2>
    <p>Здравствуйте, {user_name}!</p>
    <p>Вы запросили сброс пароля. Ваш временный пароль:</p>
    <div style="background: #f5f5f5; border: 2px dashed #e85d04; border-radius: 8px; padding: 16px; text-align: center; margin: 20px 0;">
      <span style="font-size: 24px; font-weight: bold; letter-spacing: 4px; color: #1a1a2e; font-family: monospace;">{temp_password}</span>
    </div>
    <p style="color: #666;">После входа рекомендуем сменить пароль в настройках личного кабинета.</p>
    <div style="margin-top: 20px; padding: 12px; background: #fff3e0; border-left: 4px solid #e85d04; border-radius: 4px; font-size: 13px; color: #666;">
      Если вы не запрашивали сброс пароля — просто проигнорируйте это письмо.
    </div>
  </div>
</body></html>
"""

    send_email_to(subject, html, user_email)
    return _resp(200, {'ok': True})


def notify_test() -> dict:
    """Тестовая отправка письма для проверки SMTP-настроек"""
    admin_email = os.environ.get('ADMIN_EMAIL', '')
    subject = 'Тест уведомлений MAXISOFTZAB'
    html = f"""
<html><body style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
  <div style="background: #1a1a2e; padding: 24px; border-radius: 12px 12px 0 0;">
    <h1 style="color: #fff; margin: 0; font-size: 22px;">MAXISOFTZAB</h1>
    <p style="color: #aaa; margin: 4px 0 0;">Тест системы уведомлений</p>
  </div>
  <div style="border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 12px 12px; padding: 24px;">
    <h2 style="color: #e85d04; margin-top: 0;">✅ Почта работает!</h2>
    <p>Это тестовое письмо. Если вы его получили — уведомления настроены правильно.</p>
    <p style="color: #666; font-size: 13px;">Письма будут приходить на: <strong>{admin_email}</strong></p>
  </div>
</body></html>
"""
    try:
        send_email(subject, html)
        return _resp(200, {'ok': True, 'message': f'Тестовое письмо отправлено на {admin_email}'})
    except Exception as e:
        return _resp(500, {'error': str(e)})


def send_email(subject: str, html_body: str):
    admin_email = os.environ.get('ADMIN_EMAIL', '')
    send_email_to(subject, html_body, admin_email)


def send_email_to(subject: str, html_body: str, to_email: str):
    smtp_host = os.environ.get('SMTP_HOST', '')
    smtp_port = int(os.environ.get('SMTP_PORT', '465'))
    smtp_user = os.environ.get('SMTP_USER', '')
    smtp_password = os.environ.get('SMTP_PASSWORD', '')

    if not all([smtp_host, smtp_user, smtp_password, to_email]):
        return

    msg = MIMEMultipart('alternative')
    msg['Subject'] = subject
    msg['From'] = f'MAXISOFTZAB <{smtp_user}>'
    msg['To'] = to_email
    msg.attach(MIMEText(html_body, 'html', 'utf-8'))

    context = ssl.create_default_context()
    if smtp_port == 465:
        with smtplib.SMTP_SSL(smtp_host, smtp_port, context=context) as server:
            server.login(smtp_user, smtp_password)
            server.sendmail(smtp_user, to_email, msg.as_string())
    else:
        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.starttls(context=context)
            server.login(smtp_user, smtp_password)
            server.sendmail(smtp_user, to_email, msg.as_string())


def _resp(code: int, body: dict) -> dict:
    return {
        'statusCode': code,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps(body),
        'isBase64Encoded': False
    }