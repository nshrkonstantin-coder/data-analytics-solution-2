import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Icon from '@/components/ui/icon'
import { authService } from '@/lib/auth'

const ADMIN_API_URL = 'https://functions.poehali.dev/60c925e5-07c4-4e22-acbb-7c60c1d9524d'

interface Order {
  id: number
  user_id: number
  user_email: string
  user_name: string
  product_id: number
  product_title: string
  website_url: string
  total_amount: number
  status: 'pending' | 'paid' | 'completed' | 'cancelled'
  payment_confirmed: boolean
  paid_at: string | null
  expires_at: string | null
  payment_reference: string | null
  notes: string | null
  created_at: string
}

export function AdminOrdersPage() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState<Order[]>([])
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [updating, setUpdating] = useState<number | null>(null)
  const [confirmingOrder, setConfirmingOrder] = useState<Order | null>(null)
  const [confirmRef, setConfirmRef] = useState('')
  const [confirmNotes, setConfirmNotes] = useState('')
  const [confirmLoading, setConfirmLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

  useEffect(() => {
    const verifyAndLoad = async () => {
      const result = await authService.verifySession()
      if (!result.valid || result.user?.role !== 'admin') {
        navigate('/login')
      } else {
        await loadOrders()
      }
    }
    verifyAndLoad()
  }, [navigate])

  useEffect(() => {
    let filtered = orders

    if (statusFilter !== 'all') {
      if (statusFilter === 'unconfirmed') {
        filtered = filtered.filter(o => !o.payment_confirmed)
      } else {
        filtered = filtered.filter(o => o.status === statusFilter)
      }
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(o =>
        (o.user_email || '').toLowerCase().includes(term) ||
        (o.user_name || '').toLowerCase().includes(term) ||
        (o.product_title || '').toLowerCase().includes(term) ||
        o.id.toString().includes(term)
      )
    }

    setFilteredOrders(filtered)
  }, [orders, searchTerm, statusFilter])

  const loadOrders = async () => {
    const token = localStorage.getItem('auth_token')
    try {
      const response = await fetch(`${ADMIN_API_URL}?action=get-orders`, {
        headers: { 'Authorization': `Bearer ${token}` },
      })
      const data = await response.json()
      if (data.orders) {
        setOrders(data.orders)
        setFilteredOrders(data.orders)
      }
    } catch (error) {
      console.error('Ошибка загрузки заказов:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (orderId: number, newStatus: string) => {
    const token = localStorage.getItem('auth_token')
    setUpdating(orderId)
    try {
      await fetch(`${ADMIN_API_URL}?action=update-order`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ id: orderId, status: newStatus }),
      })
      await loadOrders()
    } catch (error) {
      console.error('Ошибка обновления заказа:', error)
    } finally {
      setUpdating(null)
    }
  }

  const handleConfirmPayment = async () => {
    if (!confirmingOrder) return
    setConfirmLoading(true)
    const token = localStorage.getItem('auth_token')

    try {
      const res = await fetch(`${ADMIN_API_URL}?action=confirm-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          order_id: confirmingOrder.id,
          payment_reference: confirmRef,
          notes: confirmNotes,
        }),
      })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Ошибка')

      setSuccessMsg(`Оплата по заказу №${confirmingOrder.id} подтверждена`)
      setConfirmingOrder(null)
      setConfirmRef('')
      setConfirmNotes('')
      await loadOrders()
      setTimeout(() => setSuccessMsg(''), 5000)
    } catch (err) {
      console.error(err)
    } finally {
      setConfirmLoading(false)
    }
  }

  const getStatusBadge = (order: Order) => {
    if (order.payment_confirmed) {
      if (order.expires_at && new Date(order.expires_at) < new Date()) {
        return <span className="px-2 py-1 rounded-full text-xs border bg-orange-500/10 text-orange-400 border-orange-500/30">Истекла</span>
      }
      return <span className="px-2 py-1 rounded-full text-xs border bg-green-500/10 text-green-500 border-green-500/30">Активна</span>
    }

    const styles: Record<string, string> = {
      pending: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30',
      paid: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
      completed: 'bg-green-500/10 text-green-500 border-green-500/30',
      cancelled: 'bg-red-500/10 text-red-500 border-red-500/30',
    }
    const labels: Record<string, string> = {
      pending: 'Ожидает оплаты',
      paid: 'Оплачен',
      completed: 'Завершен',
      cancelled: 'Отменен',
    }

    return (
      <span className={`px-2 py-1 rounded-full text-xs border ${styles[order.status] || styles.pending}`}>
        {labels[order.status] || order.status}
      </span>
    )
  }

  const formatDate = (d: string | null) => {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F1419] flex items-center justify-center">
        <Icon name="Loader2" size={48} className="text-primary animate-spin" />
      </div>
    )
  }

  const unconfirmedCount = orders.filter(o => !o.payment_confirmed && o.status !== 'cancelled').length

  return (
    <div className="min-h-screen bg-[#0F1419]">
      <nav className="border-b border-primary/20 bg-card/50 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/admin" className="font-heading text-2xl font-extrabold text-white">
            MAXI<span className="text-primary">SOFT</span><span className="text-secondary">ZAB</span>
            <span className="ml-2 text-sm font-normal text-primary">ADMIN</span>
          </Link>
          <Button
            onClick={() => navigate('/admin')}
            variant="outline"
            className="border-primary/30 hover:bg-primary/10"
          >
            <Icon name="ArrowLeft" size={18} className="mr-2" />
            Назад
          </Button>
        </div>
      </nav>

      {confirmingOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0F1419] border border-primary/30 rounded-2xl p-8 w-full max-w-md">
            <h2 className="font-heading text-xl font-bold text-white mb-2">Подтвердить оплату</h2>
            <p className="text-muted-foreground text-sm mb-6">
              Заказ №{confirmingOrder.id} · {confirmingOrder.product_title}
              <br />
              <span className="text-white font-medium">{confirmingOrder.total_amount.toLocaleString('ru-RU')} ₽</span>
              {' · '}{confirmingOrder.user_email}
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-white mb-2">Номер платежа / квитанции</label>
                <Input
                  value={confirmRef}
                  onChange={(e) => setConfirmRef(e.target.value)}
                  placeholder="Опционально"
                  className="bg-background/50 border-primary/30"
                />
              </div>
              <div>
                <label className="block text-sm text-white mb-2">Комментарий</label>
                <textarea
                  value={confirmNotes}
                  onChange={(e) => setConfirmNotes(e.target.value)}
                  placeholder="Опционально"
                  rows={2}
                  className="w-full rounded-md bg-background/50 border border-primary/30 px-3 py-2 text-white text-sm"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                onClick={handleConfirmPayment}
                disabled={confirmLoading}
                className="flex-1 bg-gradient-to-r from-primary to-[#FF8E53]"
              >
                {confirmLoading ? (
                  <><Icon name="Loader2" size={16} className="animate-spin mr-2" />Подтверждаем...</>
                ) : (
                  <><Icon name="CheckCircle" size={16} className="mr-2" />Подтвердить оплату</>
                )}
              </Button>
              <Button
                onClick={() => setConfirmingOrder(null)}
                variant="outline"
                className="border-primary/30"
              >
                Отмена
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-7xl mx-auto">

          {successMsg && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mb-6 flex items-center gap-2">
              <Icon name="CheckCircle" size={18} className="text-green-500" />
              <p className="text-green-400 text-sm">{successMsg}</p>
            </div>
          )}

          <div className="bg-card/50 backdrop-blur-xl border border-primary/20 rounded-2xl p-8 mb-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="font-heading text-3xl font-bold text-white mb-2">Управление заказами</h1>
                <p className="text-muted-foreground">
                  Всего заказов: {orders.length}
                  {unconfirmedCount > 0 && (
                    <span className="ml-3 px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded-full border border-yellow-500/30">
                      {unconfirmedCount} ожидают подтверждения
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-card/50 backdrop-blur-xl border border-primary/20 rounded-2xl p-6 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Поиск по email, имени, продукту или ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-background/50 border-primary/30"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {['all', 'unconfirmed', 'pending', 'paid', 'completed', 'cancelled'].map((f) => {
                  const labels: Record<string, string> = {
                    all: 'Все',
                    unconfirmed: 'Не подтверждены',
                    pending: 'Ожидают',
                    paid: 'Оплачены',
                    completed: 'Завершены',
                    cancelled: 'Отменены',
                  }
                  return (
                    <Button
                      key={f}
                      variant={statusFilter === f ? 'default' : 'outline'}
                      onClick={() => setStatusFilter(f)}
                      size="sm"
                      className={statusFilter === f ? 'bg-primary' : 'border-primary/30'}
                    >
                      {labels[f]}
                      {f === 'unconfirmed' && unconfirmedCount > 0 && (
                        <span className="ml-1.5 bg-yellow-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                          {unconfirmedCount}
                        </span>
                      )}
                    </Button>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {filteredOrders.length === 0 ? (
              <div className="bg-card/50 backdrop-blur-xl border border-primary/20 rounded-2xl p-12 text-center">
                <Icon name="Package" size={64} className="text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground text-lg">
                  {searchTerm || statusFilter !== 'all' ? 'Заказы не найдены' : 'Заказов пока нет'}
                </p>
              </div>
            ) : (
              filteredOrders.map((order) => (
                <div
                  key={order.id}
                  className={`bg-card/50 backdrop-blur-xl border rounded-xl p-5 ${
                    !order.payment_confirmed && order.status !== 'cancelled'
                      ? 'border-yellow-500/30'
                      : 'border-primary/20'
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        <span className="font-heading text-white font-bold">Заказ #{order.id}</span>
                        {getStatusBadge(order)}
                        {!order.payment_confirmed && order.status !== 'cancelled' && (
                          <span className="px-2 py-1 rounded-full text-xs border bg-yellow-500/10 text-yellow-400 border-yellow-500/30">
                            Требует подтверждения
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div>
                          <p className="text-muted-foreground text-xs">Клиент</p>
                          <p className="text-white">{order.user_name || '—'}</p>
                          <p className="text-muted-foreground text-xs">{order.user_email}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Продукт</p>
                          <p className="text-white">{order.product_title}</p>
                          {order.website_url && (
                            <a href={order.website_url} target="_blank" rel="noopener noreferrer"
                              className="text-primary text-xs hover:underline flex items-center gap-1 mt-0.5">
                              <Icon name="ExternalLink" size={10} />
                              Сайт
                            </a>
                          )}
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Сумма</p>
                          <p className="text-white font-medium">{order.total_amount.toLocaleString('ru-RU')} ₽</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Даты</p>
                          <p className="text-white text-xs">Создан: {formatDate(order.created_at)}</p>
                          {order.paid_at && <p className="text-green-400 text-xs">Оплачен: {formatDate(order.paid_at)}</p>}
                          {order.expires_at && <p className="text-xs text-muted-foreground">До: {formatDate(order.expires_at)}</p>}
                        </div>
                      </div>

                      {order.payment_reference && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Платёж: <span className="text-white">{order.payment_reference}</span>
                        </p>
                      )}
                      {order.notes && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Заметка: <span className="text-white">{order.notes}</span>
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 flex-shrink-0">
                      {!order.payment_confirmed && order.status !== 'cancelled' && (
                        <Button
                          onClick={() => setConfirmingOrder(order)}
                          size="sm"
                          className="bg-gradient-to-r from-primary to-[#FF8E53]"
                        >
                          <Icon name="CheckCircle" size={14} className="mr-1.5" />
                          Подтвердить оплату
                        </Button>
                      )}

                      {order.payment_confirmed && order.expires_at && new Date(order.expires_at) < new Date() && (
                        <span className="text-xs text-orange-400 text-center">Подписка истекла</span>
                      )}

                      <select
                        value={order.status}
                        onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                        disabled={updating === order.id}
                        className="text-xs bg-background/50 border border-primary/30 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary"
                      >
                        <option value="pending">Ожидает</option>
                        <option value="paid">Оплачен</option>
                        <option value="completed">Завершен</option>
                        <option value="cancelled">Отменен</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
