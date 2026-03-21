import { useEffect, useState } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import Icon from '@/components/ui/icon'
import { Button } from '@/components/ui/button'

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
  const navigate = useNavigate()
  const location = useLocation()
  const fromRegister = location.state?.fromRegister === true

  const [privacyText, setPrivacyText] = useState(DEFAULT_PRIVACY_TEXT)
  const [loading, setLoading] = useState(true)
  const [confirmed, setConfirmed] = useState(false)
  const [error, setError] = useState('')

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

  const handleSave = () => {
    if (!confirmed) {
      setError('Необходимо поставить галочку для подтверждения')
      return
    }
    sessionStorage.setItem('privacyConfirmed', 'true')
    navigate('/register')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F1419] via-[#1a1f2e] to-[#0F1419] px-4 py-12">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent pointer-events-none" />

      <div className="max-w-3xl mx-auto relative z-10">
        <div className="mb-8">
          <Link
            to={fromRegister ? '/register' : '/'}
            className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1 mb-6"
          >
            <Icon name="ArrowLeft" size={16} />
            {fromRegister ? 'Вернуться к регистрации' : 'На главную'}
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

          {fromRegister && (
            <div className="border-t border-primary/20 pt-6 mt-6 space-y-4">
              <div
                className={`flex items-start gap-3 p-4 rounded-xl border transition-colors cursor-pointer ${
                  confirmed
                    ? 'border-green-500/40 bg-green-500/5'
                    : 'border-primary/20 bg-background/30'
                }`}
                onClick={() => { setConfirmed(!confirmed); setError('') }}
              >
                <div className={`mt-0.5 w-5 h-5 rounded flex-shrink-0 flex items-center justify-center border-2 transition-colors ${
                  confirmed
                    ? 'bg-green-500 border-green-500'
                    : 'border-primary/40 bg-transparent'
                }`}>
                  {confirmed && <Icon name="Check" size={12} className="text-white" />}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed select-none">
                  Я согласен(а) с Политикой конфиденциальности и условиями пользовательского соглашения.
                </p>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex items-start gap-2">
                  <Icon name="AlertCircle" size={20} className="text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-red-500 text-sm">{error}</p>
                </div>
              )}

              <Button
                onClick={handleSave}
                className="w-full bg-gradient-to-r from-primary to-[#FF8E53] hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-1 transition-all duration-300 font-heading text-base h-12"
              >
                Сохранить
              </Button>
            </div>
          )}
        </div>

        {!fromRegister && (
          <div className="mt-6 text-center">
            <Link
              to="/register"
              className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
            >
              <Icon name="ArrowLeft" size={16} />
              Вернуться к регистрации
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
