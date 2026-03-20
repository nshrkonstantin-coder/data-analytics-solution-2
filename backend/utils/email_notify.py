import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart


def send_admin_notification(subject: str, html_body: str) -> None:
    """Отправляет email-уведомление администратору. Тихо падает при ошибке."""
    admin_email = os.environ.get('ADMIN_EMAIL', '')
    smtp_host = os.environ.get('SMTP_HOST', '')
    smtp_user = os.environ.get('SMTP_USER', '')
    smtp_password = os.environ.get('SMTP_PASSWORD', '')

    if not all([admin_email, smtp_host, smtp_user, smtp_password]):
        return

    try:
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = f'MAXISOFTZAB <{smtp_user}>'
        msg['To'] = admin_email
        msg.attach(MIMEText(html_body, 'html', 'utf-8'))

        with smtplib.SMTP_SSL(smtp_host, 465) as server:
            server.login(smtp_user, smtp_password)
            server.sendmail(smtp_user, admin_email, msg.as_string())
    except Exception:
        pass


def order_notification_html(event_type: str, details: dict) -> str:
    """Формирует HTML-тело письма об оплате заказа"""
    color = '#00D4FF' if event_type == 'wallet' else '#FF8E53'
    label = 'с баланса кошелька' if event_type == 'wallet' else 'банковской картой (ЮКасса)'
    icon = '💳' if event_type == 'card' else '👛'

    return f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0F1419; color: #fff; border-radius: 12px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, {color}22, #0F1419); padding: 32px; border-bottom: 1px solid {color}44;">
        <h1 style="margin: 0; font-size: 22px; color: {color};">{icon} Новый оплаченный заказ</h1>
        <p style="margin: 8px 0 0; color: #888; font-size: 14px;">Способ оплаты: {label}</p>
      </div>
      <div style="padding: 32px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 10px 0; color: #888; width: 40%;">Покупатель</td>
              <td style="padding: 10px 0; color: #fff; font-weight: bold;">{details.get('user_name', '—')} ({details.get('user_email', '—')})</td></tr>
          <tr><td style="padding: 10px 0; color: #888;">Продукт</td>
              <td style="padding: 10px 0; color: #fff; font-weight: bold;">{details.get('product_title', '—')}</td></tr>
          <tr><td style="padding: 10px 0; color: #888;">Сумма</td>
              <td style="padding: 10px 0; color: {color}; font-weight: bold; font-size: 18px;">{details.get('amount', '—')} ₽</td></tr>
          <tr><td style="padding: 10px 0; color: #888;">Заказ №</td>
              <td style="padding: 10px 0; color: #fff;">{details.get('order_id', '—')}</td></tr>
        </table>
      </div>
      <div style="padding: 16px 32px; background: #ffffff08; text-align: center; font-size: 12px; color: #555;">
        MAXISOFTZAB · Автоматическое уведомление
      </div>
    </div>
    """


def topup_notification_html(details: dict) -> str:
    """Формирует HTML-тело письма о пополнении баланса через карту"""
    return f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0F1419; color: #fff; border-radius: 12px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #00D4FF22, #0F1419); padding: 32px; border-bottom: 1px solid #00D4FF44;">
        <h1 style="margin: 0; font-size: 22px; color: #00D4FF;">💰 Пополнение баланса через карту</h1>
        <p style="margin: 8px 0 0; color: #888; font-size: 14px;">ЮКасса · payment.succeeded</p>
      </div>
      <div style="padding: 32px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 10px 0; color: #888; width: 40%;">Пользователь</td>
              <td style="padding: 10px 0; color: #fff; font-weight: bold;">{details.get('user_name', '—')} ({details.get('user_email', '—')})</td></tr>
          <tr><td style="padding: 10px 0; color: #888;">Сумма пополнения</td>
              <td style="padding: 10px 0; color: #00D4FF; font-weight: bold; font-size: 18px;">+{details.get('amount', '—')} ₽</td></tr>
          <tr><td style="padding: 10px 0; color: #888;">ID платежа</td>
              <td style="padding: 10px 0; color: #fff; font-size: 12px;">{details.get('payment_id', '—')}</td></tr>
        </table>
      </div>
      <div style="padding: 16px 32px; background: #ffffff08; text-align: center; font-size: 12px; color: #555;">
        MAXISOFTZAB · Автоматическое уведомление
      </div>
    </div>
    """
