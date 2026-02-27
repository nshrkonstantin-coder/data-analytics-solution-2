import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import Icon from '@/components/ui/icon'
import { authService } from '@/lib/auth'

const ORDERS_API_URL = 'https://functions.poehali.dev/039e26de-4ba3-422f-a486-d3c175ff2b2b'

type AccessStatus = 'loading' | 'no-auth' | 'no-order' | 'waiting' | 'expired' | 'granted' | 'error'

interface OrderInfo {
  product_title: string
  website_url: string
  expires_at: string | null
  days_left?: number
  order_id: number
}

export function SiteAccessPage() {
  const { orderId } = useParams<{ orderId: string }>()
  const navigate = useNavigate()

  const [status, setStatus] = useState<AccessStatus>('loading')
  const [orderInfo, setOrderInfo] = useState<OrderInfo | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    const init = async () => {
      const result = await authService.verifySession()
      if (!result.valid) {
        setStatus('no-auth')
        return
      }

      if (!orderId) {
        setStatus('error')
        setErrorMsg('Неверная ссылка доступа')
        return
      }

      const token = localStorage.getItem('auth_token')
      try {
        const res = await fetch(`${ORDERS_API_URL}?action=order-detail&order_id=${orderId}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        })
        const data = await res.json()

        if (!res.ok || !data.order) {
          setStatus('no-order')
          return
        }

        const order = data.order

        if (!order.payment_confirmed) {
          setOrderInfo({
            product_title: order.product_title,
            website_url: order.website_url,
            expires_at: order.expires_at,
            order_id: order.id,
          })
          setStatus('waiting')
          return
        }

        if (order.expires_at) {
          const expires = new Date(order.expires_at)
          const now = new Date()
          if (expires < now) {
            setOrderInfo({
              product_title: order.product_title,
              website_url: order.website_url,
              expires_at: order.expires_at,
              order_id: order.id,
            })
            setStatus('expired')
            return
          }
          const daysLeft = Math.floor((expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          setOrderInfo({
            product_title: order.product_title,
            website_url: order.website_url,
            expires_at: order.expires_at,
            days_left: daysLeft,
            order_id: order.id,
          })
        } else {
          setOrderInfo({
            product_title: order.product_title,
            website_url: order.website_url,
            expires_at: null,
            order_id: order.id,
          })
        }

        setStatus('granted')
      } catch {
        setStatus('error')
        setErrorMsg('Ошибка проверки доступа')
      }
    }

    init()
  }, [orderId])

  const handleConfirmPayment = async () => {
    setConfirming(true)
    const token = localStorage.getItem('auth_token')

    try {
      const res = await fetch(`${ORDERS_API_URL}?action=confirm-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ order_id: orderId }),
      })
      const data = await res.json()

      if (res.status === 402) {
        setStatus('waiting')
        setErrorMsg(data.error)
      } else if (res.status === 403) {
        setStatus('expired')
      } else if (!res.ok) {
        setErrorMsg(data.error || 'Ошибка')
      } else {
        if (orderInfo) {
          setOrderInfo({
            ...orderInfo,
            website_url: data.website_url || orderInfo.website_url,
          })
        }
        setStatus('granted')
        if (data.website_url) {
          setTimeout(() => {
            window.location.href = data.website_url
          }, 1500)
        }
      }
    } catch {
      setErrorMsg('Ошибка соединения')
    } finally {
      setConfirming(false)
    }
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  }

  return (
    <div className="min-h-screen bg-[#0F1419] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="font-heading text-2xl font-extrabold text-white inline-block">
            MAXI<span className="text-primary">SOFT</span><span className="text-secondary">ZAB</span>
          </Link>
        </div>

        <div className="bg-card/50 backdrop-blur-xl border border-primary/20 rounded-2xl p-8">

          {status === 'loading' && (
            <div className="text-center py-8">
              <Icon name="Loader2" size={48} className="text-primary animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Проверяем доступ...</p>
            </div>
          )}

          {status === 'no-auth' && (
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-yellow-500/10 flex items-center justify-center mx-auto mb-4">
                <Icon name="Lock" size={32} className="text-yellow-400" />
              </div>
              <h2 className="font-heading text-2xl font-bold text-white mb-2">Требуется вход</h2>
              <p className="text-muted-foreground text-sm mb-6">
                Чтобы получить доступ к сайту, войдите в свой аккаунт MAXISOFTZAB
              </p>
              <Button
                onClick={() => navigate(`/login?redirect=/site-access/${orderId}`)}
                className="w-full bg-gradient-to-r from-primary to-[#FF8E53]"
              >
                <Icon name="LogIn" size={18} className="mr-2" />
                Войти в аккаунт
              </Button>
              <p className="text-muted-foreground text-sm mt-4">
                Нет аккаунта?{' '}
                <Link to="/register" className="text-primary hover:underline">
                  Зарегистрироваться
                </Link>
              </p>
            </div>
          )}

          {status === 'no-order' && (
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                <Icon name="XCircle" size={32} className="text-red-400" />
              </div>
              <h2 className="font-heading text-2xl font-bold text-white mb-2">Заказ не найден</h2>
              <p className="text-muted-foreground text-sm mb-6">
                Этот заказ не найден в вашем аккаунте. Убедитесь, что вы вошли под правильным пользователем.
              </p>
              <Button
                onClick={() => navigate('/shop')}
                variant="outline"
                className="border-primary/30"
              >
                В магазин
              </Button>
            </div>
          )}

          {status === 'waiting' && orderInfo && (
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-yellow-500/10 flex items-center justify-center mx-auto mb-4">
                <Icon name="Clock" size={32} className="text-yellow-400" />
              </div>
              <h2 className="font-heading text-2xl font-bold text-white mb-2">Ожидание подтверждения</h2>
              <p className="text-muted-foreground text-sm mb-2">
                Продукт: <span className="text-white">{orderInfo.product_title}</span>
              </p>
              {errorMsg && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mb-6">
                  <p className="text-yellow-400 text-sm">{errorMsg}</p>
                </div>
              )}
              {!errorMsg && (
                <p className="text-muted-foreground text-sm mb-6">
                  Ваш платёж обрабатывается. После подтверждения оплаты менеджером нажмите кнопку ниже.
                </p>
              )}
              <Button
                onClick={handleConfirmPayment}
                disabled={confirming}
                className="w-full bg-gradient-to-r from-primary to-[#FF8E53] mb-3"
              >
                {confirming ? (
                  <><Icon name="Loader2" size={18} className="animate-spin mr-2" />Проверяем...</>
                ) : (
                  <><Icon name="CheckCircle" size={18} className="mr-2" />Подтвердить оплату</>
                )}
              </Button>
              <Link
                to="/dashboard/orders"
                className="text-sm text-muted-foreground hover:text-white transition-colors"
              >
                Перейти к моим заказам
              </Link>
            </div>
          )}

          {status === 'expired' && orderInfo && (
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                <Icon name="CalendarX" size={32} className="text-red-400" />
              </div>
              <h2 className="font-heading text-2xl font-bold text-white mb-2">Подписка истекла</h2>
              <p className="text-muted-foreground text-sm mb-2">
                Продукт: <span className="text-white">{orderInfo.product_title}</span>
              </p>
              <p className="text-muted-foreground text-sm mb-6">
                Срок действия подписки истёк {formatDate(orderInfo.expires_at)}.
                Продлите подписку для восстановления доступа.
              </p>
              <Button
                onClick={() => navigate('/dashboard/orders')}
                className="w-full bg-gradient-to-r from-primary to-[#FF8E53] mb-3"
              >
                <Icon name="RefreshCw" size={18} className="mr-2" />
                Продлить подписку
              </Button>
            </div>
          )}

          {status === 'granted' && orderInfo && (
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                <Icon name="CheckCircle" size={32} className="text-green-400" />
              </div>
              <h2 className="font-heading text-2xl font-bold text-white mb-2">Доступ разрешён!</h2>
              <p className="text-muted-foreground text-sm mb-2">
                Продукт: <span className="text-white">{orderInfo.product_title}</span>
              </p>
              {orderInfo.expires_at && (
                <p className="text-muted-foreground text-sm mb-1">
                  Действует до: <span className="text-white">{formatDate(orderInfo.expires_at)}</span>
                  {orderInfo.days_left !== undefined && orderInfo.days_left <= 3 && (
                    <span className="text-red-400 ml-2">(осталось {orderInfo.days_left} дн.)</span>
                  )}
                </p>
              )}
              <p className="text-muted-foreground text-xs mb-6">Переход на сайт произойдёт автоматически...</p>
              {orderInfo.website_url && (
                <a
                  href={orderInfo.website_url}
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium transition-colors mb-3"
                >
                  <Icon name="ExternalLink" size={18} />
                  Перейти на сайт
                </a>
              )}
              <Link
                to="/dashboard/orders"
                className="block text-sm text-muted-foreground hover:text-white transition-colors"
              >
                Мои подписки
              </Link>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                <Icon name="AlertCircle" size={32} className="text-red-400" />
              </div>
              <h2 className="font-heading text-2xl font-bold text-white mb-2">Ошибка</h2>
              <p className="text-muted-foreground text-sm mb-6">{errorMsg || 'Что-то пошло не так'}</p>
              <Button onClick={() => navigate('/dashboard')} variant="outline" className="border-primary/30">
                В личный кабинет
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
