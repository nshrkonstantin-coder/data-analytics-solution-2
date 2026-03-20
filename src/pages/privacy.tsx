import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '@/components/ui/icon'

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

export function PrivacyPage() {
  const [privacyText, setPrivacyText] = useState(DEFAULT_PRIVACY_TEXT)
  const [loading, setLoading] = useState(true)

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F1419] via-[#1a1f2e] to-[#0F1419] px-4 py-12">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent pointer-events-none" />

      <div className="max-w-3xl mx-auto relative z-10">
        <div className="mb-8">
          <Link
            to="/"
            className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1 mb-6"
          >
            <Icon name="ArrowLeft" size={16} />
            На главную
          </Link>
          <div className="text-center">
            <Link to="/" className="inline-block mb-4">
              <h1 className="font-heading text-3xl font-extrabold text-white">
                MAXI<span className="text-primary">SOFT</span><span className="text-secondary">ZAB</span>
              </h1>
            </Link>
            <h2 className="font-heading text-2xl font-bold text-white mb-2">
              Политика конфиденциальности
            </h2>
            <p className="text-muted-foreground text-sm">
              Обработка персональных данных
            </p>
          </div>
        </div>

        <div className="bg-card/50 backdrop-blur-xl border border-primary/20 rounded-2xl p-8 shadow-2xl">
          {loading ? (
            <div className="flex justify-center py-12">
              <Icon name="Loader2" size={32} className="text-primary animate-spin" />
            </div>
          ) : (
            <div className="prose prose-invert max-w-none">
              {privacyText.split('\n\n').map((block, i) => {
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
              })}
            </div>
          )}
        </div>

        <div className="mt-6 text-center">
          <Link
            to="/register"
            className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
          >
            <Icon name="ArrowLeft" size={16} />
            Вернуться к регистрации
          </Link>
        </div>
      </div>
    </div>
  )
}
