import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import Icon from '@/components/ui/icon'
import { authService } from '@/lib/auth'

const WALLET_API_URL = 'https://functions.poehali.dev/e00e6aa9-1a59-4dd1-9630-1960a065f4ee'

interface Wallet {
  id: number
  balance: number
  currency: string
  updated_at: string
}

interface Transaction {
  id: number
  amount: number
  type: 'credit' | 'debit'
  description: string
  created_at: string
}

export function WalletPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [wallet, setWallet] = useState<Wallet | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    const init = async () => {
      const result = await authService.verifySession()
      if (!result.valid) {
        navigate('/login')
        return
      }
      await Promise.all([loadBalance(), loadTransactions()])
      setLoading(false)
    }
    init()
  }, [navigate])

  const getToken = () => localStorage.getItem('auth_token') || ''

  const loadBalance = async () => {
    try {
      const res = await fetch(`${WALLET_API_URL}?action=balance`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      })
      const data = await res.json()
      if (data.wallet) setWallet(data.wallet)
    } catch {
      setError('Не удалось загрузить баланс')
    }
  }

  const loadTransactions = async () => {
    try {
      const res = await fetch(`${WALLET_API_URL}?action=transactions`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      })
      const data = await res.json()
      if (data.transactions) setTransactions(data.transactions)
    } catch (_e) {
      setError('')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F1419] flex items-center justify-center">
        <Icon name="Loader2" size={48} className="text-primary animate-spin" />
      </div>
    )
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatAmount = (amount: number, type: 'credit' | 'debit') => {
    const sign = type === 'credit' ? '+' : '−'
    return `${sign}${Number(amount).toLocaleString('ru-RU', { minimumFractionDigits: 2 })} ₽`
  }

  return (
    <div className="min-h-screen bg-[#0F1419]">
      <nav className="border-b border-primary/20 bg-card/50 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="font-heading text-2xl font-extrabold text-white">
            MAXI<span className="text-primary">SOFT</span><span className="text-secondary">ZAB</span>
          </Link>
          <Link to="/dashboard">
            <Button variant="outline" className="border-primary/30 hover:bg-primary/10">
              <Icon name="ArrowLeft" size={18} className="mr-2" />
              Назад
            </Button>
          </Link>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto space-y-6">

          {/* Баланс */}
          <div className="bg-gradient-to-br from-primary/20 to-secondary/10 border border-primary/30 rounded-2xl p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center">
                <Icon name="Wallet" size={28} className="text-primary" />
              </div>
              <div>
                <h1 className="font-heading text-2xl font-bold text-white">Мой кошелёк</h1>
                <p className="text-sm text-muted-foreground">Внутренний баланс</p>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="bg-card/40 rounded-xl p-6 text-center">
              <p className="text-muted-foreground text-sm mb-1">Доступный баланс</p>
              <p className="font-heading text-5xl font-bold text-white">
                {wallet
                  ? Number(wallet.balance).toLocaleString('ru-RU', { minimumFractionDigits: 2 })
                  : '0.00'}{' '}
                <span className="text-primary text-3xl">₽</span>
              </p>
              {wallet && (
                <p className="text-muted-foreground text-xs mt-2">
                  Обновлено: {formatDate(wallet.updated_at)}
                </p>
              )}
            </div>

            <div className="mt-4 p-4 rounded-xl bg-card/20 border border-primary/10">
              <p className="text-sm text-muted-foreground text-center">
                Для пополнения баланса обратитесь к администратору или оплатите
                через реквизиты.
              </p>
              <div className="flex justify-center mt-3">
                <Link to="/requisites">
                  <Button size="sm" variant="outline" className="border-primary/30 hover:bg-primary/10 text-sm">
                    <Icon name="Building2" size={14} className="mr-2" />
                    Реквизиты для оплаты
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* История транзакций */}
          <div className="bg-card/50 backdrop-blur-xl border border-primary/20 rounded-2xl p-6">
            <h2 className="font-heading text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Icon name="History" size={20} className="text-primary" />
              История операций
            </h2>

            {transactions.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Icon name="ReceiptText" size={32} className="text-primary/50" />
                </div>
                <p className="text-muted-foreground">Операций пока нет</p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  Здесь будет отображаться история пополнений и списаний
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between gap-4 p-4 rounded-xl bg-card/40 border border-white/5 hover:border-primary/20 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          tx.type === 'credit'
                            ? 'bg-green-500/10'
                            : 'bg-red-500/10'
                        }`}
                      >
                        <Icon
                          name={tx.type === 'credit' ? 'ArrowDownLeft' : 'ArrowUpRight'}
                          size={18}
                          className={tx.type === 'credit' ? 'text-green-400' : 'text-red-400'}
                        />
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium leading-tight">
                          {tx.description}
                        </p>
                        <p className="text-muted-foreground text-xs mt-0.5">
                          {formatDate(tx.created_at)}
                        </p>
                      </div>
                    </div>
                    <p
                      className={`font-heading font-bold text-base flex-shrink-0 ${
                        tx.type === 'credit' ? 'text-green-400' : 'text-red-400'
                      }`}
                    >
                      {formatAmount(tx.amount, tx.type)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Быстрые ссылки */}
          <div className="grid grid-cols-2 gap-4">
            <Link
              to="/dashboard/orders"
              className="bg-card/50 border border-primary/20 rounded-xl p-4 hover:border-primary/40 transition-all group flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Icon name="Package" size={20} className="text-primary" />
              </div>
              <div>
                <p className="text-white text-sm font-medium">Мои заказы</p>
                <p className="text-muted-foreground text-xs">Подписки и доступы</p>
              </div>
            </Link>

            <Link
              to="/shop"
              className="bg-card/50 border border-primary/20 rounded-xl p-4 hover:border-primary/40 transition-all group flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Icon name="ShoppingBag" size={20} className="text-primary" />
              </div>
              <div>
                <p className="text-white text-sm font-medium">Магазин</p>
                <p className="text-muted-foreground text-xs">Купить продукт</p>
              </div>
            </Link>
          </div>

        </div>
      </div>
    </div>
  )
}