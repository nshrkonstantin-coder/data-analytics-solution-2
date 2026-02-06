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
  total_amount: number
  status: 'pending' | 'paid' | 'completed' | 'cancelled'
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
      filtered = filtered.filter(order => order.status === statusFilter)
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(order =>
        order.user_email.toLowerCase().includes(term) ||
        order.user_name.toLowerCase().includes(term) ||
        order.product_title.toLowerCase().includes(term) ||
        order.id.toString().includes(term)
      )
    }

    setFilteredOrders(filtered)
  }, [orders, searchTerm, statusFilter])

  const loadOrders = async () => {
    const token = localStorage.getItem('auth_token')
    try {
      const response = await fetch(`${ADMIN_API_URL}?action=get-orders`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
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
      const response = await fetch(`${ADMIN_API_URL}?action=update-order`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ id: orderId, status: newStatus }),
      })

      if (response.ok) {
        await loadOrders()
      }
    } catch (error) {
      console.error('Ошибка обновления заказа:', error)
    } finally {
      setUpdating(null)
    }
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30',
      paid: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
      completed: 'bg-green-500/10 text-green-500 border-green-500/30',
      cancelled: 'bg-red-500/10 text-red-500 border-red-500/30',
    }

    const labels = {
      pending: 'Ожидает оплаты',
      paid: 'Оплачен',
      completed: 'Завершен',
      cancelled: 'Отменен',
    }

    return (
      <span className={`px-2 py-1 rounded-full text-xs border ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F1419] flex items-center justify-center">
        <Icon name="Loader2" size={48} className="text-primary animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0F1419]">
      <nav className="border-b border-primary/20 bg-card/50 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/admin" className="font-heading text-2xl font-extrabold text-white">
            MAXI<span className="text-primary">SOFT</span><span className="text-secondary">ZAB</span>
          </Link>
          <Button
            onClick={() => navigate('/admin')}
            variant="outline"
            className="border-primary/30 hover:bg-primary/10"
          >
            <Icon name="ArrowLeft" size={18} className="mr-2" />
            Назад в админ-панель
          </Button>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="bg-card/50 backdrop-blur-xl border border-primary/20 rounded-2xl p-8 mb-6">
            <h1 className="font-heading text-3xl font-bold text-white mb-2">
              Управление заказами
            </h1>
            <p className="text-muted-foreground">
              Просмотр и управление всеми заказами пользователей
            </p>
          </div>

          <div className="bg-card/50 backdrop-blur-xl border border-primary/20 rounded-2xl p-6 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Поиск по email, имени, продукту или ID заказа..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-background/50 border-primary/30"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={statusFilter === 'all' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('all')}
                  className={statusFilter === 'all' ? 'bg-primary' : 'border-primary/30'}
                >
                  Все
                </Button>
                <Button
                  variant={statusFilter === 'pending' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('pending')}
                  className={statusFilter === 'pending' ? 'bg-yellow-500' : 'border-primary/30'}
                >
                  Ожидают
                </Button>
                <Button
                  variant={statusFilter === 'paid' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('paid')}
                  className={statusFilter === 'paid' ? 'bg-blue-500' : 'border-primary/30'}
                >
                  Оплачены
                </Button>
                <Button
                  variant={statusFilter === 'completed' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('completed')}
                  className={statusFilter === 'completed' ? 'bg-green-500' : 'border-primary/30'}
                >
                  Завершены
                </Button>
              </div>
            </div>
          </div>

          <div className="bg-card/50 backdrop-blur-xl border border-primary/20 rounded-2xl overflow-hidden">
            {filteredOrders.length === 0 ? (
              <div className="p-12 text-center">
                <Icon name="Package" size={64} className="text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground text-lg">
                  {searchTerm || statusFilter !== 'all' ? 'Заказы не найдены' : 'Заказов пока нет'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-primary/20">
                    <tr className="text-left">
                      <th className="p-4 font-heading text-sm text-muted-foreground">ID</th>
                      <th className="p-4 font-heading text-sm text-muted-foreground">Клиент</th>
                      <th className="p-4 font-heading text-sm text-muted-foreground">Продукт</th>
                      <th className="p-4 font-heading text-sm text-muted-foreground">Сумма</th>
                      <th className="p-4 font-heading text-sm text-muted-foreground">Статус</th>
                      <th className="p-4 font-heading text-sm text-muted-foreground">Дата</th>
                      <th className="p-4 font-heading text-sm text-muted-foreground">Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((order) => (
                      <tr key={order.id} className="border-b border-primary/10 hover:bg-primary/5 transition-colors">
                        <td className="p-4 text-white font-mono text-sm">#{order.id}</td>
                        <td className="p-4">
                          <div className="text-white text-sm font-medium">{order.user_name || 'Не указано'}</div>
                          <div className="text-muted-foreground text-xs">{order.user_email}</div>
                        </td>
                        <td className="p-4 text-white text-sm">{order.product_title}</td>
                        <td className="p-4 text-white text-sm font-medium">{order.total_amount.toLocaleString()} ₽</td>
                        <td className="p-4">{getStatusBadge(order.status)}</td>
                        <td className="p-4 text-muted-foreground text-sm">
                          {new Date(order.created_at).toLocaleDateString('ru-RU', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            {order.status === 'pending' && (
                              <Button
                                size="sm"
                                onClick={() => updateOrderStatus(order.id, 'paid')}
                                disabled={updating === order.id}
                                className="bg-blue-500 hover:bg-blue-600"
                              >
                                {updating === order.id ? (
                                  <Icon name="Loader2" size={14} className="animate-spin" />
                                ) : (
                                  'Оплачен'
                                )}
                              </Button>
                            )}
                            {order.status === 'paid' && (
                              <Button
                                size="sm"
                                onClick={() => updateOrderStatus(order.id, 'completed')}
                                disabled={updating === order.id}
                                className="bg-green-500 hover:bg-green-600"
                              >
                                {updating === order.id ? (
                                  <Icon name="Loader2" size={14} className="animate-spin" />
                                ) : (
                                  'Завершить'
                                )}
                              </Button>
                            )}
                            {(order.status === 'pending' || order.status === 'paid') && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateOrderStatus(order.id, 'cancelled')}
                                disabled={updating === order.id}
                                className="border-red-500/30 text-red-500 hover:bg-red-500/10"
                              >
                                {updating === order.id ? (
                                  <Icon name="Loader2" size={14} className="animate-spin" />
                                ) : (
                                  'Отменить'
                                )}
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="mt-6 bg-card/50 backdrop-blur-xl border border-primary/20 rounded-2xl p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Всего заказов: <span className="text-white font-medium">{orders.length}</span>
              </span>
              <span className="text-muted-foreground">
                Отображено: <span className="text-white font-medium">{filteredOrders.length}</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
