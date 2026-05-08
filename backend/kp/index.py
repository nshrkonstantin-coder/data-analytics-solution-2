import json
import os
import base64
import io
from datetime import datetime
import psycopg2
from psycopg2.extras import RealDictCursor

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Authorization',
}

def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def get_user_from_token(token: str, conn):
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            "SELECT u.id, u.email, u.full_name FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = %s AND s.expires_at > NOW()",
            (token,)
        )
        return cur.fetchone()

def generate_kp_pdf(kp_data: dict, requisites: dict) -> bytes:
    """Генерирует PDF коммерческого предложения используя reportlab"""
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import cm
    from reportlab.lib import colors
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont
    import urllib.request

    font_url = "https://cdn.poehali.dev/files/DejaVuSans.ttf"
    font_bold_url = "https://cdn.poehali.dev/files/DejaVuSans-Bold.ttf"

    font_path = "/tmp/DejaVuSans.ttf"
    font_bold_path = "/tmp/DejaVuSans-Bold.ttf"

    try:
        urllib.request.urlretrieve(font_url, font_path)
        urllib.request.urlretrieve(font_bold_url, font_bold_path)
        pdfmetrics.registerFont(TTFont('DejaVu', font_path))
        pdfmetrics.registerFont(TTFont('DejaVu-Bold', font_bold_path))
        base_font = 'DejaVu'
        bold_font = 'DejaVu-Bold'
    except Exception:
        base_font = 'Helvetica'
        bold_font = 'Helvetica-Bold'

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4,
                            leftMargin=2*cm, rightMargin=2*cm,
                            topMargin=2*cm, bottomMargin=2*cm)

    primary_color = colors.HexColor('#FF8C00')
    dark_color = colors.HexColor('#1a1a2e')
    gray_color = colors.HexColor('#666666')

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle('title', fontName=bold_font, fontSize=20, textColor=dark_color, spaceAfter=6, leading=24)
    subtitle_style = ParagraphStyle('subtitle', fontName=base_font, fontSize=11, textColor=gray_color, spaceAfter=4)
    heading_style = ParagraphStyle('heading', fontName=bold_font, fontSize=13, textColor=primary_color, spaceBefore=12, spaceAfter=6)
    body_style = ParagraphStyle('body', fontName=base_font, fontSize=10, textColor=dark_color, leading=14)
    small_style = ParagraphStyle('small', fontName=base_font, fontSize=9, textColor=gray_color)

    today = datetime.now().strftime('%d.%m.%Y')
    number = f"КП-{kp_data.get('id', 1):04d}"

    story = []

    header_data = [
        [Paragraph(f"<b>ООО «ДДМАКСИ СТРОЙРЕМСЕРВИС»</b>", ParagraphStyle('hdr', fontName=bold_font, fontSize=12, textColor=dark_color)),
         Paragraph(f"<b>{number}</b>", ParagraphStyle('hdr_r', fontName=bold_font, fontSize=14, textColor=primary_color, alignment=2))],
        [Paragraph("ИНН 7500009357 / КПП 750001001", ParagraphStyle('s', fontName=base_font, fontSize=9, textColor=gray_color)),
         Paragraph(f"от {today}", ParagraphStyle('s_r', fontName=base_font, fontSize=9, textColor=gray_color, alignment=2))],
    ]
    header_table = Table(header_data, colWidths=[10*cm, 7*cm])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('LINEBELOW', (0,1), (-1,1), 1, primary_color),
        ('BOTTOMPADDING', (0,1), (-1,1), 8),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 0.5*cm))

    story.append(Paragraph("КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ", ParagraphStyle('kp', fontName=bold_font, fontSize=18, textColor=dark_color, alignment=1, spaceAfter=4)))
    story.append(Paragraph("на поставку программного обеспечения и IT-услуг", ParagraphStyle('kpsub', fontName=base_font, fontSize=11, textColor=gray_color, alignment=1, spaceAfter=16)))
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#dddddd')))
    story.append(Spacer(1, 0.4*cm))

    story.append(Paragraph("Кому:", heading_style))
    client_name = requisites.get('company_full_name') or requisites.get('company_short_name') or 'Уважаемый клиент'
    director = requisites.get('director_name', '')
    director_pos = requisites.get('director_position', 'Руководителю')
    story.append(Paragraph(f"{client_name}", body_style))
    if director:
        story.append(Paragraph(f"{director_pos}: {director}", body_style))
    story.append(Spacer(1, 0.3*cm))

    story.append(Paragraph("Уважаемый клиент!", body_style))
    story.append(Spacer(1, 0.2*cm))
    story.append(Paragraph(
        "ООО «ДДМАКСИ СТРОЙРЕМСЕРВИС» предлагает Вам рассмотреть наше коммерческое предложение на поставку "
        "программного обеспечения и IT-услуг для вашего предприятия. Мы специализируемся на разработке "
        "и внедрении современных цифровых решений для бизнеса.", body_style))
    story.append(Spacer(1, 0.3*cm))

    story.append(Paragraph("Наши услуги:", heading_style))
    services = [
        ["№", "Наименование услуги / ПО", "Описание"],
        ["1", "Корпоративный веб-сайт", "Разработка сайта под ключ, адаптивный дизайн, SEO"],
        ["2", "Интернет-магазин", "Каталог товаров, корзина, оплата онлайн, CRM"],
        ["3", "CRM-система", "Управление клиентами, сделками, задачами"],
        ["4", "Мобильное приложение", "iOS/Android, интеграция с сайтом"],
        ["5", "Техническая поддержка", "Сопровождение, обновления, хостинг"],
    ]
    svc_table = Table(services, colWidths=[1*cm, 7*cm, 9*cm])
    svc_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), primary_color),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('FONTNAME', (0,0), (-1,0), bold_font),
        ('FONTSIZE', (0,0), (-1,-1), 9),
        ('FONTNAME', (0,1), (-1,-1), base_font),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.HexColor('#f9f9f9'), colors.white]),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#dddddd')),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('PADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(svc_table)
    story.append(Spacer(1, 0.4*cm))

    story.append(Paragraph("Почему выбирают нас:", heading_style))
    benefits = [
        "✓  Опыт работы с предприятиями Забайкальского края",
        "✓  Полное юридическое сопровождение сделки",
        "✓  Поддержка после запуска проекта",
        "✓  Гарантия качества и соблюдение сроков",
        "✓  Официальный договор и все документы",
    ]
    for b in benefits:
        story.append(Paragraph(b, body_style))
    story.append(Spacer(1, 0.4*cm))

    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#dddddd')))
    story.append(Spacer(1, 0.3*cm))

    story.append(Paragraph("Реквизиты получателя (Ваша компания):", heading_style))
    req_fields = [
        ("Компания", requisites.get('company_full_name', '—')),
        ("ИНН / КПП", f"{requisites.get('inn', '—')} / {requisites.get('kpp', '—')}"),
        ("ОГРН", requisites.get('ogrn', '—')),
        ("Юридический адрес", requisites.get('legal_address', '—')),
        ("Руководитель", f"{requisites.get('director_position', '')} {requisites.get('director_name', '—')}".strip()),
        ("Телефон", requisites.get('phone', '—')),
        ("E-mail", requisites.get('email', '—')),
        ("Банк", requisites.get('bank_name', '—')),
        ("Р/с", requisites.get('bank_account', '—')),
        ("К/с", requisites.get('corr_account', '—')),
        ("БИК", requisites.get('bik', '—')),
    ]
    req_data = [[Paragraph(f"<b>{k}</b>", ParagraphStyle('rk', fontName=bold_font, fontSize=9, textColor=gray_color)),
                 Paragraph(v, ParagraphStyle('rv', fontName=base_font, fontSize=9, textColor=dark_color))] for k, v in req_fields]
    req_table = Table(req_data, colWidths=[5*cm, 12*cm])
    req_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('ROWBACKGROUNDS', (0,0), (-1,-1), [colors.HexColor('#f9f9f9'), colors.white]),
        ('GRID', (0,0), (-1,-1), 0.3, colors.HexColor('#eeeeee')),
        ('PADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(req_table)
    story.append(Spacer(1, 0.5*cm))

    story.append(HRFlowable(width="100%", thickness=1, color=primary_color))
    story.append(Spacer(1, 0.3*cm))
    story.append(Paragraph("Наши контакты:", ParagraphStyle('ct', fontName=bold_font, fontSize=10, textColor=dark_color)))
    story.append(Paragraph("ООО «ДДМАКСИ СТРОЙРЕМСЕРВИС»  |  Тел: +7-985-506-08-14  |  E-mail: ddmaxi-srs@yandex.ru",
                           ParagraphStyle('ctb', fontName=base_font, fontSize=9, textColor=gray_color)))
    story.append(Paragraph("673634, Забайкальский край, м.о. Газимуро-Заводский, п. Новоширокинский, д.3, пом.10",
                           ParagraphStyle('ctb', fontName=base_font, fontSize=9, textColor=gray_color)))

    doc.build(story)
    return buffer.getvalue()


def handler(event: dict, context) -> dict:
    """API для запроса и получения коммерческого предложения"""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    auth = event.get('headers', {}).get('X-Authorization') or event.get('headers', {}).get('Authorization', '')
    token = auth.replace('Bearer ', '').strip()

    if not token:
        return {'statusCode': 401, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Unauthorized'})}

    action = (event.get('queryStringParameters') or {}).get('action', '')
    method = event.get('httpMethod', 'GET')

    conn = get_conn()
    user = get_user_from_token(token, conn)
    if not user:
        conn.close()
        return {'statusCode': 401, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Invalid session'})}

    user_id = user['id']

    if action == 'submit' and method == 'POST':
        body = json.loads(event.get('body') or '{}')
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                INSERT INTO kp_requests (user_id, company_full_name, company_short_name, legal_address, actual_address,
                    inn, kpp, ogrn, director_name, director_position, phone, email,
                    bank_name, bank_account, corr_account, bik, status)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,'submitted')
                ON CONFLICT DO NOTHING
                RETURNING id
            """, (
                user_id,
                body.get('company_full_name'), body.get('company_short_name'),
                body.get('legal_address'), body.get('actual_address'),
                body.get('inn'), body.get('kpp'), body.get('ogrn'),
                body.get('director_name'), body.get('director_position'),
                body.get('phone'), body.get('email'),
                body.get('bank_name'), body.get('bank_account'),
                body.get('corr_account'), body.get('bik'),
            ))
            row = cur.fetchone()
            if not row:
                cur.execute("""
                    UPDATE kp_requests SET
                        company_full_name=%s, company_short_name=%s, legal_address=%s, actual_address=%s,
                        inn=%s, kpp=%s, ogrn=%s, director_name=%s, director_position=%s,
                        phone=%s, email=%s, bank_name=%s, bank_account=%s, corr_account=%s, bik=%s,
                        status='submitted', updated_at=NOW()
                    WHERE user_id=%s
                    RETURNING id
                """, (
                    body.get('company_full_name'), body.get('company_short_name'),
                    body.get('legal_address'), body.get('actual_address'),
                    body.get('inn'), body.get('kpp'), body.get('ogrn'),
                    body.get('director_name'), body.get('director_position'),
                    body.get('phone'), body.get('email'),
                    body.get('bank_name'), body.get('bank_account'),
                    body.get('corr_account'), body.get('bik'),
                    user_id,
                ))
                row = cur.fetchone()
            conn.commit()
        conn.close()
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps({'ok': True, 'id': row['id'] if row else None})}

    if action == 'get' and method == 'GET':
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("SELECT * FROM kp_requests WHERE user_id=%s ORDER BY id DESC LIMIT 1", (user_id,))
            row = cur.fetchone()
        conn.close()
        if row:
            return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps({'kp': dict(row), 'exists': True}, default=str)}
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps({'kp': None, 'exists': False})}

    if action == 'pdf' and method == 'GET':
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("SELECT * FROM kp_requests WHERE user_id=%s AND status='submitted' ORDER BY id DESC LIMIT 1", (user_id,))
            row = cur.fetchone()
        conn.close()
        if not row:
            return {'statusCode': 404, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'КП не найдено'})}

        pdf_bytes = generate_kp_pdf({'id': row['id']}, dict(row))
        pdf_b64 = base64.b64encode(pdf_bytes).decode('utf-8')
        return {
            'statusCode': 200,
            'headers': {
                **CORS_HEADERS,
                'Content-Type': 'application/pdf',
                'Content-Disposition': f'inline; filename="KP_{row["id"]:04d}.pdf"',
            },
            'body': pdf_b64,
            'isBase64Encoded': True,
        }

    conn.close()
    return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Unknown action'})}
