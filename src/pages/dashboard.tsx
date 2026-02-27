import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import Icon from '@/components/ui/icon'
import { authService, User } from '@/lib/auth'

const ORDERS_API_URL = 'https://functions.poehali.dev/039e26de-4ba3-422f-a486-d3c175ff2b2b'

interface ActiveSubscription {
  id: number
  product_title: string
  expires_at: string | null
  days_left: number | null
  subscription_status: string
  website_url: string
}

export function DashboardPage() {
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [subscriptions, setSubscriptions] = useState<ActiveSubscription[]>([])

  useEffect(() => {
    const verifyUser = async () => {
      const result = await authService.verifySession()
      if (!result.valid) {
        navigate('/login')
      } else {
        setUser(result.user || null)
        await loadSubscriptions()
      }
      setLoading(false)
    }

    verifyUser()
  }, [navigate])

  const loadSubscriptions = async () => {
    const token = localStorage.getItem('auth_token')
    try {
      const res = await fetch(`${ORDERS_API_URL}?action=my-orders`, {
        headers: { 'Authorization': `Bearer ${token}` },
      })
      const data = await res.json()
      const active = (data.orders || []).filter(
        (o: ActiveSubscription) => o.subscription_status === 'active' || o.subscription_status === 'expired'
      )
      setSubscriptions(active.slice(0, 3))
    } catch {
      // ignore
    }
  }

  const handleLogout = async () => {
    await authService.logout()
    navigate('/login')
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
          <Link to="/" className="font-heading text-2xl font-extrabold text-white">
            MAXI<span className="text-primary">SOFT</span><span className="text-secondary">ZAB</span>
          </Link>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="border-primary/30 hover:bg-primary/10"
          >
            <Icon name="LogOut" size={18} className="mr-2" />
            Выйти
          </Button>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="bg-card/50 backdrop-blur-xl border border-primary/20 rounded-2xl p-8 mb-6">
            <h1 className="font-heading text-3xl font-bold text-white mb-2">
              Добро пожаловать, {user?.full_name || user?.email}!
            </h1>
            <p className="text-muted-foreground">
              Личный кабинет пользователя
            </p>
          </div>

          {subscriptions.length > 0 && (
            <div className="mb-6 space-y-3">
              {subscriptions.map((sub) => {
                const isExpired = sub.subscription_status === 'expired'
                const isExpiringSoon = !isExpired && sub.days_left !== null && sub.days_left <= 3
                return (
                  <div
                    key={sub.id}
                    className={`bg-card/50 backdrop-blur-xl border rounded-xl p-4 flex items-center justify-between gap-4 ${
                      isExpired
                        ? 'border-red-500/30'
                        : isExpiringSoon
                        ? 'border-yellow-500/30'
                        : 'border-green-500/20'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        isExpired ? 'bg-red-500/10' : isExpiringSoon ? 'bg-yellow-500/10' : 'bg-green-500/10'
                      }`}>
                        <Icon
                          name={isExpired ? 'XCircle' : isExpiringSoon ? 'AlertTriangle' : 'Globe'}
                          size={16}
                          className={isExpired ? 'text-red-400' : isExpiringSoon ? 'text-yellow-400' : 'text-green-400'}
                        />
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium">{sub.product_title}</p>
                        <p className={`text-xs ${isExpired ? 'text-red-400' : isExpiringSoon ? 'text-yellow-400' : 'text-muted-foreground'}`}>
                          {isExpired
                            ? 'Подписка истекла'
                            : sub.days_left !== null
                            ? `Осталось ${sub.days_left} дн.`
                            : 'Активна'}
                        </p>
                      </div>
                    </div>
                    <Link
                      to="/dashboard/orders"
                      className={`text-xs px-3 py-1.5 rounded-lg border flex-shrink-0 ${
                        isExpired
                          ? 'border-red-500/30 text-red-400 hover:bg-red-500/10'
                          : isExpiringSoon
                          ? 'border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10'
                          : 'border-green-500/30 text-green-400 hover:bg-green-500/10'
                      } transition-colors`}
                    >
                      {isExpired || isExpiringSoon ? 'Продлить' : 'Открыть'}
                    </Link>
                  </div>
                )
              })}
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            <Link
              to="/dashboard/profile"
              className="bg-card/50 backdrop-blur-xl border border-primary/20 rounded-2xl p-6 hover:border-primary/40 transition-all duration-300 hover:-translate-y-1 group"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Icon name="User" size={24} className="text-primary" />
                </div>
                <div>
                  <h3 className="font-heading text-xl font-bold text-white">Профиль</h3>
                  <p className="text-sm text-muted-foreground">Личные данные и настройки</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Управление личными данными, смена пароля
              </p>
            </Link>

            <Link
              to="/shop"
              className="bg-card/50 backdrop-blur-xl border border-primary/20 rounded-2xl p-6 hover:border-primary/40 transition-all duration-300 hover:-translate-y-1 group"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Icon name="ShoppingBag" size={24} className="text-primary" />
                </div>
                <div>
                  <h3 className="font-heading text-xl font-bold text-white">Онлайн-магазин</h3>
                  <p className="text-sm text-muted-foreground">Готовые решения для бизнеса</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Веб-сайты, интернет-магазины и другие IT-решения
              </p>
            </Link>

            <Link
              to="/dashboard/wallet"
              className="bg-card/50 backdrop-blur-xl border border-primary/20 rounded-2xl p-6 hover:border-primary/40 transition-all duration-300 hover:-translate-y-1 group"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Icon name="Wallet" size={24} className="text-primary" />
                </div>
                <div>
                  <h3 className="font-heading text-xl font-bold text-white">Кошелек</h3>
                  <p className="text-sm text-muted-foreground">Баланс: 0.00 ₽</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Внутренний баланс для покупки продуктов
              </p>
            </Link>

            <Link
              to="/dashboard/orders"
              className="bg-card/50 backdrop-blur-xl border border-primary/20 rounded-2xl p-6 hover:border-primary/40 transition-all duration-300 hover:-translate-y-1 group"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Icon name="Package" size={24} className="text-primary" />
                </div>
                <div>
                  <h3 className="font-heading text-xl font-bold text-white">Мои подписки</h3>
                  <p className="text-sm text-muted-foreground">Заказы и доступ к сайтам</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Управление подписками, подтверждение оплаты, продление
              </p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}