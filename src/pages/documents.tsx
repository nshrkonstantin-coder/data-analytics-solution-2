import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Icon from '@/components/ui/icon'
import { authService } from '@/lib/auth'

const ADMIN_API_URL = 'https://functions.poehali.dev/60c925e5-07c4-4e22-acbb-7c60c1d9524d'

const DEFAULT_PRIVACY_TEXT = `1. ОБЩИЕ ПОЛОЖЕНИЯ

Настоящая Политика конфиденциальности определяет порядок обработки персональных данных пользователей сайта.

2. КАКИЕ ДАННЫЕ МЫ СОБИРАЕМ

Мы собираем следующие персональные данные: имя и фамилия, адрес электронной почты, номер телефона. Данные предоставляются пользователем добровольно при регистрации.

3. ЦЕЛИ ОБРАБОТКИ ДАННЫХ

Персональные данные обрабатываются в целях: предоставления доступа к сервисам сайта, связи с пользователем по вопросам заказов, улучшения качества обслуживания.

4. ХРАНЕНИЕ И ЗАЩИТА ДАННЫХ

Мы принимаем все необходимые меры для защиты персональных данных от несанкционированного доступа, изменения, раскрытия или уничтожения. Данные хранятся на защищённых серверах.

5. ПЕРЕДАЧА ДАННЫХ ТРЕТЬИМ ЛИЦАМ

Мы не продаём и не передаём персональные данные третьим лицам без согласия пользователя, за исключением случаев, предусмотренных законодательством Российской Федерации.

6. ПРАВА ПОЛЬЗОВАТЕЛЯ

Пользователь вправе: получить информацию об обработке его персональных данных, потребовать уточнения, блокирования или уничтожения данных, отозвать согласие на обработку персональных данных.

7. КОНТАКТЫ

По вопросам, связанным с обработкой персональных данных, обращайтесь: info@maxisoftzab.ru`

type Tab = 'consent' | 'privacy'

function renderPrivacyText(text: string) {
  return text.split('\n\n').map((block, i) => {
    const isHeading = /^\d+\./.test(block.trim())
    return isHeading ? (
      <div key={i} className="mb-6">
        <h3 className="font-heading text-base font-bold text-primary mb-2">
          {block.split('\n')[0]}
        </h3>
        {block.split('\n').slice(1).join('\n') && (
          <p className="text-muted-foreground text-sm leading-relaxed">
            {block.split('\n').slice(1).join(' ')}
          </p>
        )}
      </div>
    ) : (
      <p key={i} className="text-muted-foreground text-sm leading-relaxed mb-4">
        {block}
      </p>
    )
  })
}

export function DocumentsPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('consent')
  const [loading, setLoading] = useState(true)
  const [privacyText, setPrivacyText] = useState(DEFAULT_PRIVACY_TEXT)

  useEffect(() => {
    const verifyUser = async () => {
      const result = await authService.verifySession()
      if (!result.valid) navigate('/login')
    }
    verifyUser()
  }, [navigate])

  useEffect(() => {
    fetch(`${ADMIN_API_URL}?action=content`)
      .then(r => r.json())
      .then(data => {
        const item = (data.content || []).find(
          (c: { section: string; key: string; content: string }) =>
            c.section === 'privacy' && c.key === 'policy_text'
        )
        if (item?.content) setPrivacyText(item.content)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'consent', label: 'Согласие на ОПД', icon: 'FileCheck' },
    { id: 'privacy', label: 'Политика конфиденциальности', icon: 'ShieldCheck' },
  ]

  return (
    <div className="min-h-screen bg-[#0F1419]">
      <nav className="border-b border-primary/20 bg-card/50 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/dashboard" className="font-heading text-2xl font-extrabold text-white">
            MAXI<span className="text-primary">SOFT</span><span className="text-secondary">ZAB</span>
          </Link>
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-white border border-primary/30 hover:bg-primary/10 rounded-lg px-3 py-2 transition-colors"
          >
            <Icon name="ArrowLeft" size={16} />
            Назад
          </button>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <div className="bg-card/50 backdrop-blur-xl border border-primary/20 rounded-2xl p-8 mb-6">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Icon name="FileText" size={20} className="text-primary" />
              </div>
              <h1 className="font-heading text-3xl font-bold text-white">Мои документы</h1>
            </div>
            <p className="text-muted-foreground ml-[52px]">
              Документы, подписанные при регистрации
            </p>
          </div>

          <div className="flex gap-2 mb-6">
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  tab === t.id
                    ? 'bg-primary text-white shadow-lg shadow-primary/30'
                    : 'bg-card/50 border border-primary/20 text-muted-foreground hover:text-white hover:border-primary/40'
                }`}
              >
                <Icon name={t.icon} size={16} />
                {t.label}
              </button>
            ))}
          </div>

          <div className="bg-card/50 backdrop-blur-xl border border-primary/20 rounded-2xl p-8 shadow-2xl">
            {tab === 'consent' && (
              <>
                <h2 className="font-heading text-xl font-bold text-white mb-6">
                  Согласие на обработку персональных данных
                </h2>
                <div className="text-muted-foreground text-sm leading-relaxed space-y-4">
                  <p>
                    Настоящим я, субъект персональных данных, во исполнение требований Федерального закона
                    от 27.07.2006 № 152-ФЗ «О персональных данных», свободно, своей волей и в своем интересе
                    даю согласие ООО «ДДМАКСИ СТРОЙРЕМСЕРВИС» (ИНН 7500009357, адрес: 673634, Забайкальский
                    край, м. о. Газимуро-Заводский, п. Новоширокинский, д. 3, помещ. 10) (далее – Оператор)
                    на обработку следующих моих персональных данных:
                  </p>
                  <ul className="list-disc list-inside space-y-1 pl-2">
                    <li>фамилия, имя, отчество;</li>
                    <li>номер телефона;</li>
                    <li>адрес электронной почты;</li>
                    <li>адрес доставки товара;</li>
                    <li>данные о заказанных товарах (наименование, количество).</li>
                  </ul>

                  <p className="font-semibold text-white">Цели обработки:</p>
                  <ul className="list-disc list-inside space-y-1 pl-2">
                    <li>оформление и доставка заказов,</li>
                    <li>осуществление платежей через платёжный сервис ЮKassa,</li>
                    <li>информирование о статусе заказа,</li>
                    <li>обработка обращений.</li>
                  </ul>

                  <p className="font-semibold text-white">Перечень действий с персональными данными:</p>
                  <p>
                    сбор, запись, систематизация, накопление, хранение, уточнение (обновление, изменение),
                    извлечение, использование, передача (в том числе службам доставки и платёжному сервису
                    ЮKassa), обезличивание, блокирование, удаление, уничтожение.
                  </p>

                  <p className="font-semibold text-white">Срок обработки:</p>
                  <p>
                    на срок действия договорных отношений, но не более 5 лет с даты последнего
                    взаимодействия. По истечении срока или при отзыве согласия персональные данные
                    подлежат уничтожению.
                  </p>

                  <p className="font-semibold text-white">Отзыв согласия:</p>
                  <p>
                    Согласие может быть отозвано путём направления письменного заявления на электронную
                    почту Оператора:{' '}
                    <a href="mailto:ddmaxi-srs@yandex.ru" className="text-primary hover:underline">
                      ddmaxi-srs@yandex.ru
                    </a>
                    . В случае отзыва согласия Оператор вправе продолжить обработку персональных данных
                    без согласия при наличии оснований, указанных в пунктах 2–11 части 1 статьи 6, части 2
                    статьи 10 и части 2 статьи 11 Федерального закона № 152-ФЗ.
                  </p>
                </div>

                <div className="border-t border-primary/20 pt-6 mt-6">
                  <div className="flex items-start gap-3 p-4 rounded-xl border border-green-500/40 bg-green-500/5">
                    <div className="mt-0.5 w-5 h-5 rounded flex-shrink-0 flex items-center justify-center border-2 bg-green-500 border-green-500">
                      <Icon name="Check" size={12} className="text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-white font-medium">Согласие подтверждено</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Вы дали согласие на обработку персональных данных при регистрации
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {tab === 'privacy' && (
              <>
                <h2 className="font-heading text-xl font-bold text-white mb-6">
                  Политика конфиденциальности
                </h2>

                {loading ? (
                  <div className="flex justify-center py-12">
                    <Icon name="Loader2" size={32} className="text-primary animate-spin" />
                  </div>
                ) : (
                  <div className="prose prose-invert max-w-none">
                    {renderPrivacyText(privacyText)}
                  </div>
                )}

                <div className="border-t border-primary/20 pt-6 mt-6">
                  <div className="flex items-start gap-3 p-4 rounded-xl border border-green-500/40 bg-green-500/5">
                    <div className="mt-0.5 w-5 h-5 rounded flex-shrink-0 flex items-center justify-center border-2 bg-green-500 border-green-500">
                      <Icon name="Check" size={12} className="text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-white font-medium">Политика принята</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Вы приняли Политику конфиденциальности при регистрации
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
