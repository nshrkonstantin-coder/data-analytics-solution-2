import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import Icon from '@/components/ui/icon'
import { authService, User } from '@/lib/auth'

const ADMIN_API_URL = 'https://functions.poehali.dev/60c925e5-07c4-4e22-acbb-7c60c1d9524d'

interface Stats {
  users: number
  products: number
  orders: number
  revenue: number
}

export function AdminPage() {
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(null)
  const [stats, setStats] = useState<Stats>({ users: 0, products: 0, orders: 0, revenue: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const verifyAdmin = async () => {
      const result = await authService.verifySession()
      if (!result.valid) {
        navigate('/login')
      } else if (result.user?.role !== 'admin') {
        navigate('/dashboard')
      } else {
        setUser(result.user)
        await loadStats()
      }
      setLoading(false)
    }

    verifyAdmin()
  }, [navigate])

  const loadStats = async () => {
    const token = localStorage.getItem('auth_token')
    try {
      const response = await fetch(`${ADMIN_API_URL}?action=stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      const data = await response.json()
      if (data.stats) {
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Ошибка загрузки статистики:', error)
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
            <span className="ml-2 text-sm font-normal text-primary">ADMIN</span>
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
        <div className="max-w-6xl mx-auto">
          <div className="bg-card/50 backdrop-blur-xl border border-primary/20 rounded-2xl p-8 mb-6">
            <div className="flex items-center gap-3 mb-2">
              <Icon name="Shield" size={32} className="text-primary" />
              <h1 className="font-heading text-3xl font-bold text-white">
                Панель администратора
              </h1>
            </div>
            <p className="text-muted-foreground">
              Управление сайтом, пользователями и контентом
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-card/50 backdrop-blur-xl border border-primary/20 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <Icon name="Users" size={32} className="text-primary" />
                <span className="font-heading text-3xl font-bold text-white">{stats.users}</span>
              </div>
              <h3 className="font-heading text-lg font-semibold text-white">Пользователи</h3>
              <p className="text-sm text-muted-foreground">Всего зарегистрировано</p>
            </div>

            <div className="bg-card/50 backdrop-blur-xl border border-primary/20 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <Icon name="Package" size={32} className="text-primary" />
                <span className="font-heading text-3xl font-bold text-white">{stats.products}</span>
              </div>
              <h3 className="font-heading text-lg font-semibold text-white">Продукты</h3>
              <p className="text-sm text-muted-foreground">Активных в магазине</p>
            </div>

            <div className="bg-card/50 backdrop-blur-xl border border-primary/20 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <Icon name="ShoppingCart" size={32} className="text-primary" />
                <span className="font-heading text-3xl font-bold text-white">{stats.orders}</span>
              </div>
              <h3 className="font-heading text-lg font-semibold text-white">Заказы</h3>
              <p className="text-sm text-muted-foreground">Всего оформлено</p>
            </div>

            <div className="bg-card/50 backdrop-blur-xl border border-primary/20 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <Icon name="DollarSign" size={32} className="text-primary" />
                <span className="font-heading text-3xl font-bold text-white">
                  {(stats.revenue / 1000).toFixed(0)}K
                </span>
              </div>
              <h3 className="font-heading text-lg font-semibold text-white">Выручка</h3>
              <p className="text-sm text-muted-foreground">Оплаченные заказы</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link
              to="/admin/users"
              className="bg-card/50 backdrop-blur-xl border border-primary/20 rounded-2xl p-6 hover:border-primary/40 transition-all duration-300 hover:-translate-y-1 group"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Icon name="Users" size={24} className="text-primary" />
                </div>
                <div>
                  <h3 className="font-heading text-xl font-bold text-white">Пользователи</h3>
                  <p className="text-sm text-muted-foreground">Управление аккаунтами</p>
                </div>
              </div>
            </Link>

            <Link
              to="/admin/products"
              className="bg-card/50 backdrop-blur-xl border border-primary/20 rounded-2xl p-6 hover:border-primary/40 transition-all duration-300 hover:-translate-y-1 group"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Icon name="Package" size={24} className="text-primary" />
                </div>
                <div>
                  <h3 className="font-heading text-xl font-bold text-white">Продукты</h3>
                  <p className="text-sm text-muted-foreground">Управление магазином</p>
                </div>
              </div>
            </Link>

            <Link
              to="/admin/content"
              className="bg-card/50 backdrop-blur-xl border border-primary/20 rounded-2xl p-6 hover:border-primary/40 transition-all duration-300 hover:-translate-y-1 group"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Icon name="FileText" size={24} className="text-primary" />
                </div>
                <div>
                  <h3 className="font-heading text-xl font-bold text-white">Контент</h3>
                  <p className="text-sm text-muted-foreground">Редактирование страниц</p>
                </div>
              </div>
            </Link>

            <Link
              to="/admin/orders"
              className="bg-card/50 backdrop-blur-xl border border-primary/20 rounded-2xl p-6 hover:border-primary/40 transition-all duration-300 hover:-translate-y-1 group"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Icon name="ShoppingCart" size={24} className="text-primary" />
                </div>
                <div>
                  <h3 className="font-heading text-xl font-bold text-white">Заказы</h3>
                  <p className="text-sm text-muted-foreground">Управление заказами</p>
                </div>
              </div>
            </Link>

            <Link
              to="/"
              className="bg-card/50 backdrop-blur-xl border border-primary/20 rounded-2xl p-6 hover:border-primary/40 transition-all duration-300 hover:-translate-y-1 group"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Icon name="Home" size={24} className="text-primary" />
                </div>
                <div>
                  <h3 className="font-heading text-xl font-bold text-white">Главная страница</h3>
                  <p className="text-sm text-muted-foreground">Перейти на сайт</p>
                </div>
              </div>
            </Link>

            <div className="bg-card/50 backdrop-blur-xl border border-primary/20 rounded-2xl p-6 opacity-50">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Icon name="Settings" size={24} className="text-primary" />
                </div>
                <div>
                  <h3 className="font-heading text-xl font-bold text-white">Настройки</h3>
                  <p className="text-sm text-muted-foreground">Скоро...</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
