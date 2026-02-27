import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import Icon from '@/components/ui/icon'
import { authService } from '@/lib/auth'

const ORDERS_API_URL = 'https://functions.poehali.dev/039e26de-4ba3-422f-a486-d3c175ff2b2b'
const PRODUCTS_API_URL = 'https://functions.poehali.dev/4d2b5055-dabb-4c6e-aa52-48d8657f7596'
const ADMIN_API_URL = 'https://functions.poehali.dev/60c925e5-07c4-4e22-acbb-7c60c1d9524d'

interface Upgrade {
  title: string
  description: string
  price: number
}

interface Product {
  id: number
  title: string
  description: string
  price: number
  category: string
  image_url: string
  website_url: string
  subscription_days: number
  upgrades: Upgrade[]
  is_subscription: boolean
}

interface Order {
  id: number
  product_id: number
  product_title: string
  category: string
  image_url: string
  website_url: string
  total_amount: number
  status: string
  subscription_status: string
  payment_confirmed: boolean
  paid_at: string | null
  expires_at: string | null
  days_left: number | null
  upgrades: Upgrade[]
  subscription_days: number
  is_subscription: boolean
  created_at: string
}

type Tab = 'my-orders' | 'buy'

export function OrdersPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const productIdParam = searchParams.get('product')

  const [tab, setTab] = useState<Tab>(productIdParam ? 'buy' : 'my-orders')
  const [orders, setOrders] = useState<Order[]>([])
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [loadingProduct, setLoadingProduct] = useState(false)
  const [creating, setCreating] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [createdOrderId, setCreatedOrderId] = useState<number | null>(null)
  const [confirmResult, setConfirmResult] = useState<{ status: string; message: string; website_url?: string; expires_at?: string } | null>(null)

  useEffect(() => {
    const init = async () => {
      const result = await authService.verifySession()
      if (!result.valid) {
        navigate('/login')
        return
      }
      await loadMyOrders()
      if (productIdParam) {
        await loadProduct(productIdParam)
      }
    }
    init()
  }, [navigate, productIdParam])

  const loadMyOrders = async () => {
    setLoadingOrders(true)
    const token = localStorage.getItem('auth_token')
    try {
      const res = await fetch(`${ORDERS_API_URL}?action=my-orders`, {
        headers: { 'Authorization': `Bearer ${token}` },
      })
      const data = await res.json()
      setOrders(data.orders || [])
    } catch {
      console.error('Ошибка загрузки заказов')
    } finally {
      setLoadingOrders(false)
    }
  }

  const loadProduct = async (id: string) => {
    setLoadingProduct(true)
    try {
      const res = await fetch(`${ORDERS_API_URL}?action=payment-info&product_id=${id}`)
      const data = await res.json()
      setSelectedProduct(data.product || null)
    } catch {
      console.error('Ошибка загрузки продукта')
    } finally {
      setLoadingProduct(false)
    }
  }

  const handleCreateOrder = async () => {
    if (!selectedProduct) return
    setCreating(true)
    setError('')
    const token = localStorage.getItem('auth_token')

    try {
      const res = await fetch(`${ORDERS_API_URL}?action=create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ product_id: selectedProduct.id }),
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Ошибка создания заказа')
      }

      setCreatedOrderId(data.order_id)
      setSuccess(`Заказ №${data.order_id} создан. Переведите оплату по реквизитам ниже.`)
      await loadMyOrders()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка создания заказа')
    } finally {
      setCreating(false)
    }
  }

  const handleConfirmPayment = async (orderId: number) => {
    setConfirming(true)
    setError('')
    setConfirmResult(null)
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
        setConfirmResult({ status: 'waiting', message: data.error })
      } else if (res.status === 403) {
        setConfirmResult({ status: 'expired', message: data.error })
      } else if (!res.ok) {
        throw new Error(data.error || 'Ошибка')
      } else {
        setConfirmResult({
          status: 'granted',
          message: data.message,
          website_url: data.website_url,
          expires_at: data.expires_at,
        })
        await loadMyOrders()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка проверки оплаты')
    } finally {
      setConfirming(false)
    }
  }

  const handleRenew = async (orderId: number) => {
    setCreating(true)
    setError('')
    const token = localStorage.getItem('auth_token')

    try {
      const res = await fetch(`${ORDERS_API_URL}?action=renew`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ order_id: orderId }),
      })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Ошибка')

      setSuccess(`Заказ на продление №${data.order_id} создан`)
      setTab('my-orders')
      await loadMyOrders()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка продления')
    } finally {
      setCreating(false)
    }
  }

  const getStatusColor = (order: Order) => {
    if (order.subscription_status === 'active') return 'text-green-400 bg-green-500/10 border-green-500/30'
    if (order.subscription_status === 'expired') return 'text-red-400 bg-red-500/10 border-red-500/30'
    return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30'
  }

  const getStatusLabel = (order: Order) => {
    if (order.subscription_status === 'active') return 'Активна'
    if (order.subscription_status === 'expired') return 'Истекла'
    return 'Ожидает оплаты'
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  return (
    <div className="min-h-screen bg-[#0F1419]">
      <nav className="border-b border-primary/20 bg-card/50 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="font-heading text-2xl font-extrabold text-white">
            MAXI<span className="text-primary">SOFT</span><span className="text-secondary">ZAB</span>
          </Link>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => navigate('/dashboard')}
              variant="outline"
              className="border-primary/30 hover:bg-primary/10"
            >
              <Icon name="ArrowLeft" size={18} className="mr-2" />
              Личный кабинет
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6 flex items-start gap-2">
              <Icon name="AlertCircle" size={20} className="text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mb-6 flex items-start gap-2">
              <Icon name="CheckCircle" size={20} className="text-green-500 mt-0.5 flex-shrink-0" />
              <p className="text-green-400 text-sm">{success}</p>
            </div>
          )}

          <div className="flex gap-3 mb-8">
            <button
              onClick={() => setTab('my-orders')}
              className={`px-6 py-3 rounded-xl font-medium transition-all ${
                tab === 'my-orders'
                  ? 'bg-primary text-white'
                  : 'bg-card/50 border border-primary/20 text-muted-foreground hover:text-white'
              }`}
            >
              <Icon name="Package" size={16} className="inline mr-2" />
              Мои подписки
            </button>
            <button
              onClick={() => setTab('buy')}
              className={`px-6 py-3 rounded-xl font-medium transition-all ${
                tab === 'buy'
                  ? 'bg-primary text-white'
                  : 'bg-card/50 border border-primary/20 text-muted-foreground hover:text-white'
              }`}
            >
              <Icon name="ShoppingCart" size={16} className="inline mr-2" />
              Оформить заказ
            </button>
          </div>

          {tab === 'my-orders' && (
            <div className="space-y-4">
              <h2 className="font-heading text-2xl font-bold text-white mb-4">Мои подписки</h2>

              {loadingOrders ? (
                <div className="flex justify-center py-12">
                  <Icon name="Loader2" size={40} className="text-primary animate-spin" />
                </div>
              ) : orders.length === 0 ? (
                <div className="bg-card/50 backdrop-blur-xl border border-primary/20 rounded-2xl p-12 text-center">
                  <Icon name="Package" size={56} className="text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-heading text-xl font-bold text-white mb-2">Нет заказов</h3>
                  <p className="text-muted-foreground mb-6">Перейдите в магазин и выберите продукт</p>
                  <Button
                    onClick={() => navigate('/shop')}
                    className="bg-gradient-to-r from-primary to-[#FF8E53]"
                  >
                    <Icon name="ShoppingBag" size={18} className="mr-2" />
                    В магазин
                  </Button>
                </div>
              ) : (
                orders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-card/50 backdrop-blur-xl border border-primary/20 rounded-2xl p-6"
                  >
                    <div className="flex flex-col md:flex-row md:items-start gap-4">
                      {order.image_url && (
                        <img
                          src={order.image_url}
                          alt={order.product_title}
                          className="w-full md:w-24 h-24 object-cover rounded-lg flex-shrink-0"
                        />
                      )}

                      <div className="flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                          <div>
                            <h3 className="font-heading text-lg font-bold text-white">{order.product_title}</h3>
                            <p className="text-sm text-muted-foreground">Заказ №{order.id} · {formatDate(order.created_at)}</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(order)}`}>
                            {getStatusLabel(order)}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Стоимость</p>
                            <p className="text-white font-medium">{order.total_amount.toLocaleString('ru-RU')} ₽</p>
                          </div>
                          {order.expires_at && (
                            <div>
                              <p className="text-muted-foreground">Действует до</p>
                              <p className={`font-medium ${(order.days_left ?? 0) <= 3 ? 'text-red-400' : 'text-white'}`}>
                                {formatDate(order.expires_at)}
                                {order.days_left !== null && order.days_left >= 0 && ` (${order.days_left} дн.)`}
                              </p>
                            </div>
                          )}
                          {order.paid_at && (
                            <div>
                              <p className="text-muted-foreground">Оплачен</p>
                              <p className="text-white font-medium">{formatDate(order.paid_at)}</p>
                            </div>
                          )}
                        </div>

                        {order.days_left !== null && order.days_left <= 3 && order.days_left >= 0 && (
                          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4 flex items-center gap-2">
                            <Icon name="AlertTriangle" size={16} className="text-red-400" />
                            <p className="text-red-400 text-sm">
                              Подписка истекает через {order.days_left} дн.! Продлите, чтобы не потерять доступ.
                            </p>
                          </div>
                        )}

                        {order.subscription_status === 'expired' && (
                          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4 flex items-center gap-2">
                            <Icon name="XCircle" size={16} className="text-red-400" />
                            <p className="text-red-400 text-sm">Подписка истекла. Доступ к сайту заблокирован.</p>
                          </div>
                        )}

                        <div className="flex flex-wrap gap-3">
                          {order.subscription_status === 'active' && order.website_url && (
                            <a
                              href={order.website_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 border border-green-500/40 rounded-lg text-green-400 text-sm hover:bg-green-500/30 transition-colors"
                            >
                              <Icon name="ExternalLink" size={14} />
                              Открыть сайт
                            </a>
                          )}

                          {!order.payment_confirmed && (
                            <Button
                              onClick={() => handleConfirmPayment(order.id)}
                              disabled={confirming}
                              size="sm"
                              className="bg-gradient-to-r from-primary to-[#FF8E53]"
                            >
                              {confirming ? (
                                <Icon name="Loader2" size={14} className="animate-spin mr-2" />
                              ) : (
                                <Icon name="CheckCircle" size={14} className="mr-2" />
                              )}
                              Подтвердить оплату
                            </Button>
                          )}

                          {(order.subscription_status === 'expired' || (order.days_left !== null && order.days_left <= 3)) && (
                            <Button
                              onClick={() => handleRenew(order.id)}
                              disabled={creating}
                              size="sm"
                              variant="outline"
                              className="border-primary/30 hover:bg-primary/10"
                            >
                              <Icon name="RefreshCw" size={14} className="mr-2" />
                              Продлить подписку
                            </Button>
                          )}
                        </div>

                        {confirmResult && (
                          <div className={`mt-4 p-4 rounded-lg border ${
                            confirmResult.status === 'granted'
                              ? 'bg-green-500/10 border-green-500/30'
                              : confirmResult.status === 'waiting'
                              ? 'bg-yellow-500/10 border-yellow-500/30'
                              : 'bg-red-500/10 border-red-500/30'
                          }`}>
                            <p className={`text-sm font-medium ${
                              confirmResult.status === 'granted' ? 'text-green-400'
                              : confirmResult.status === 'waiting' ? 'text-yellow-400'
                              : 'text-red-400'
                            }`}>
                              {confirmResult.message}
                            </p>
                            {confirmResult.status === 'granted' && confirmResult.website_url && (
                              <a
                                href={confirmResult.website_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 transition-colors"
                              >
                                <Icon name="ExternalLink" size={14} />
                                Перейти на сайт
                              </a>
                            )}
                          </div>
                        )}

                        {order.upgrades && order.upgrades.length > 0 && order.subscription_status === 'active' && (
                          <div className="mt-4 pt-4 border-t border-primary/10">
                            <p className="text-sm text-muted-foreground mb-3 flex items-center gap-2">
                              <Icon name="Zap" size={14} className="text-primary" />
                              Доступные улучшения для вашего сайта
                            </p>
                            <div className="grid md:grid-cols-2 gap-2">
                              {order.upgrades.map((upg, i) => (
                                <div key={i} className="bg-background/30 rounded-lg p-3 flex items-start justify-between gap-2">
                                  <div>
                                    <p className="text-white text-sm font-medium">{upg.title}</p>
                                    <p className="text-muted-foreground text-xs mt-0.5">{upg.description}</p>
                                  </div>
                                  <span className="text-primary text-sm font-bold flex-shrink-0">
                                    {upg.price.toLocaleString('ru-RU')} ₽
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {tab === 'buy' && (
            <div>
              <h2 className="font-heading text-2xl font-bold text-white mb-6">Оформление заказа</h2>

              {!selectedProduct && !loadingProduct && (
                <div className="bg-card/50 backdrop-blur-xl border border-primary/20 rounded-2xl p-12 text-center">
                  <Icon name="ShoppingCart" size={56} className="text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-heading text-xl font-bold text-white mb-2">Продукт не выбран</h3>
                  <p className="text-muted-foreground mb-6">Вернитесь в магазин и нажмите "Купить"</p>
                  <Button onClick={() => navigate('/shop')} className="bg-gradient-to-r from-primary to-[#FF8E53]">
                    <Icon name="ShoppingBag" size={18} className="mr-2" />
                    В магазин
                  </Button>
                </div>
              )}

              {loadingProduct && (
                <div className="flex justify-center py-12">
                  <Icon name="Loader2" size={40} className="text-primary animate-spin" />
                </div>
              )}

              {selectedProduct && (
                <div className="space-y-6">
                  <div className="bg-card/50 backdrop-blur-xl border border-primary/20 rounded-2xl p-6">
                    <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                      <Icon name="Package" size={18} className="text-primary" />
                      Выбранный продукт
                    </h3>
                    <div className="flex gap-4">
                      {selectedProduct.image_url && (
                        <img
                          src={selectedProduct.image_url}
                          alt={selectedProduct.title}
                          className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                        />
                      )}
                      <div className="flex-1">
                        <h4 className="font-heading text-xl font-bold text-white">{selectedProduct.title}</h4>
                        <p className="text-sm text-primary mb-2">{selectedProduct.category}</p>
                        <p className="text-sm text-muted-foreground mb-3">{selectedProduct.description}</p>
                        <div className="flex flex-wrap gap-3 text-sm">
                          <span className="flex items-center gap-1.5 text-muted-foreground">
                            <Icon name="Calendar" size={14} className="text-primary" />
                            Подписка на {selectedProduct.subscription_days} дней
                          </span>
                          {selectedProduct.upgrades && selectedProduct.upgrades.length > 0 && (
                            <span className="flex items-center gap-1.5 text-muted-foreground">
                              <Icon name="Zap" size={14} className="text-primary" />
                              {selectedProduct.upgrades.length} вариантов улучшений
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-heading text-3xl font-bold text-primary">
                          {selectedProduct.price.toLocaleString('ru-RU')} ₽
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-card/50 backdrop-blur-xl border border-primary/20 rounded-2xl p-6">
                    <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                      <Icon name="CreditCard" size={18} className="text-primary" />
                      Как оплатить
                    </h3>
                    <ol className="space-y-3 text-sm">
                      <li className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center flex-shrink-0 mt-0.5 font-bold">1</span>
                        <span className="text-muted-foreground">Нажмите кнопку "Создать заказ" — система зарегистрирует вашу покупку</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center flex-shrink-0 mt-0.5 font-bold">2</span>
                        <span className="text-muted-foreground">Переведите оплату по реквизитам, которые появятся ниже</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center flex-shrink-0 mt-0.5 font-bold">3</span>
                        <span className="text-muted-foreground">После зачисления средств менеджер подтвердит оплату (обычно в течение 1 рабочего дня)</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center flex-shrink-0 mt-0.5 font-bold">4</span>
                        <span className="text-muted-foreground">Нажмите "Подтвердить оплату" в разделе "Мои подписки" — система откроет доступ к сайту</span>
                      </li>
                    </ol>
                  </div>

                  {createdOrderId ? (
                    <div className="bg-card/50 backdrop-blur-xl border border-primary/20 rounded-2xl p-6">
                      <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                        <Icon name="Banknote" size={18} className="text-primary" />
                        Реквизиты для оплаты (Заказ №{createdOrderId})
                      </h3>
                      <Link
                        to="/requisites"
                        className="inline-flex items-center gap-2 px-4 py-2 border border-primary/30 rounded-lg text-primary text-sm hover:bg-primary/10 transition-colors mb-4"
                        target="_blank"
                      >
                        <Icon name="ExternalLink" size={14} />
                        Открыть реквизиты компании
                      </Link>
                      <p className="text-muted-foreground text-sm">
                        В назначении платежа укажите: <strong className="text-white">Заказ №{createdOrderId}</strong>
                      </p>
                      <div className="mt-4 flex gap-3">
                        <Button
                          onClick={() => { setTab('my-orders'); setSuccess('') }}
                          className="bg-gradient-to-r from-primary to-[#FF8E53]"
                        >
                          <Icon name="Package" size={16} className="mr-2" />
                          Перейти к моим заказам
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      onClick={handleCreateOrder}
                      disabled={creating}
                      className="w-full bg-gradient-to-r from-primary to-[#FF8E53] hover:shadow-lg hover:shadow-primary/30 h-14 text-lg font-medium"
                    >
                      {creating ? (
                        <>
                          <Icon name="Loader2" size={20} className="animate-spin mr-2" />
                          Создаём заказ...
                        </>
                      ) : (
                        <>
                          <Icon name="ShoppingCart" size={20} className="mr-2" />
                          Создать заказ на {selectedProduct.price.toLocaleString('ru-RU')} ₽
                        </>
                      )}
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
