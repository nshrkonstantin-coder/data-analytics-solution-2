import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Icon from '@/components/ui/icon'

export function ConsentPage() {
  const navigate = useNavigate()
  const [date, setDate] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [error, setError] = useState('')

  const handleSave = () => {
    if (!date) {
      setError('Укажите дату')
      return
    }
    if (!confirmed) {
      setError('Необходимо подтвердить согласие, поставив отметку')
      return
    }
    sessionStorage.setItem('consentConfirmed', 'true')
    sessionStorage.setItem('consentDate', date)
    navigate('/register')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F1419] via-[#1a1f2e] to-[#0F1419] px-4 py-12">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent pointer-events-none" />

      <div className="max-w-3xl mx-auto relative z-10">
        <div className="mb-8">
          <Link
            to="/register"
            className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1 mb-6"
          >
            <Icon name="ArrowLeft" size={16} />
            Вернуться к регистрации
          </Link>
          <div className="text-center">
            <Link to="/" className="inline-block mb-4">
              <h1 className="font-heading text-3xl font-extrabold text-white">
                MAXI<span className="text-primary">SOFT</span><span className="text-secondary">ZAB</span>
              </h1>
            </Link>
            <h2 className="font-heading text-2xl font-bold text-white mb-2">
              Согласие на обработку персональных данных
            </h2>
          </div>
        </div>

        <div className="bg-card/50 backdrop-blur-xl border border-primary/20 rounded-2xl p-8 shadow-2xl space-y-4">
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

          <div className="border-t border-primary/20 pt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Дата <span className="text-red-400">*</span>
              </label>
              <Input
                type="date"
                value={date}
                onChange={(e) => { setDate(e.target.value); setError('') }}
                className="bg-background/50 border-primary/30 focus:border-primary max-w-xs"
              />
            </div>

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
                <span className="font-semibold text-white">Подтверждение:</span> проставляя отметку
                в чекбоксе на Сайте, я подтверждаю, что ознакомлен(а) с настоящим Согласием.
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
        </div>
      </div>
    </div>
  )
}
