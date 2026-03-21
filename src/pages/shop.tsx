import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import Icon from '@/components/ui/icon'
import { authService } from '@/lib/auth'

const PRODUCTS_API_URL = 'https://functions.poehali.dev/4d2b5055-dabb-4c6e-aa52-48d8657f7596'
const ORDERS_API_URL = 'https://functions.poehali.dev/039e26de-4ba3-422f-a486-d3c175ff2b2b'
const WALLET_API_URL = 'https://functions.poehali.dev/e00e6aa9-1a59-4dd1-9630-1960a065f4ee'
const YOOKASSA_API_URL = 'https://functions.poehali.dev/d08c7aac-f64d-4b7b-b949-f503280104b7'

interface Product {
  id: number
  title: string
  description: string
  price: number
  category: string
  image_url: string
  demo_url: string
  created_at: string
}

export function ShopPage() {
  const navigate = useNavigate()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [buyProduct, setBuyProduct] = useState<Product | null>(null)
  const [walletBalance, setWalletBalance] = useState<number | null>(null)
  const [payLoading, setPayLoading] = useState(false)
  const [payError, setPayError] = useState('')
  const [paySuccess, setPaySuccess] = useState<{ orderId: number; accessToken: string; websiteUrl: string } | null>(null)
  const [cardPaymentId, setCardPaymentId] = useState<string | null>(null)
  const [cardPayMethod, setCardPayMethod] = useState<'card' | null>(null)
  const [activeCategory, setActiveCategory] = useState<string>('Все')

  const getToken = () => localStorage.getItem('auth_token') || ''

  useEffect(() => {
    const checkAuth = async () => {
      const result = await authService.verifySession()
      setIsAuthenticated(result.valid)
      if (result.valid) {
        try {
          const res = await fetch(`${WALLET_API_URL}?action=balance`, {
            headers: { Authorization: `Bearer ${getToken()}` },
          })
          const data = await res.json()
          if (data.wallet) setWalletBalance(Number(data.wallet.balance))
        } catch {
          setWalletBalance(null)
        }
      }
    }
    checkAuth()
  }, [])

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch(PRODUCTS_API_URL)
        const data = await response.json()
        setProducts(data.products || [])
      } catch (error) {
        console.error('Ошибка загрузки продуктов:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  const handleBuy = (product: Product) => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    setSelectedProduct(null)
    setBuyProduct(product)
    setPayError('')
    setPaySuccess(null)
  }

  const handlePayFromWallet = async () => {
    if (!buyProduct) return
    setPayLoading(true)
    setPayError('')
    try {
      const res = await fetch(`${ORDERS_API_URL}?action=pay-from-wallet`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ product_id: buyProduct.id }),
      })
      const data = await res.json()
      if (res.ok) {
        setWalletBalance((prev) => prev !== null ? prev - buyProduct.price : null)
        setPaySuccess({ orderId: data.order_id, accessToken: data.access_token, websiteUrl: data.website_url })
      } else {
        setPayError(data.error || 'Ошибка оплаты')
      }
    } catch {
      setPayError('Ошибка соединения, попробуйте ещё раз')
    }
    setPayLoading(false)
  }

  const handlePayByRequisites = () => {
    if (!buyProduct) return
    navigate(`/dashboard/orders?product=${buyProduct.id}`)
  }

  const handlePayWithCard = async () => {
    if (!buyProduct) return
    setPayLoading(true)
    setPayError('')
    setCardPayMethod('card')
    try {
      const returnUrl = `${window.location.origin}/shop?paid=card`
      const res = await fetch(`${YOOKASSA_API_URL}?action=buy-with-card`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ product_id: buyProduct.id, return_url: returnUrl }),
      })
      const data = await res.json()
      if (data.confirmation_url) {
        setCardPaymentId(data.payment_id)
        window.location.href = data.confirmation_url
      } else {
        setPayError(data.error || 'Не удалось создать платёж')
        setCardPayMethod(null)
      }
    } catch {
      setPayError('Ошибка соединения, попробуйте ещё раз')
      setCardPayMethod(null)
    }
    setPayLoading(false)
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
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Button
                onClick={() => navigate('/dashboard')}
                variant="outline"
                className="border-primary/30 hover:bg-primary/10"
              >
                <Icon name="User" size={18} className="mr-2" />
                Личный кабинет
              </Button>
            ) : (
              <>
                <Button
                  onClick={() => navigate('/login')}
                  variant="outline"
                  className="border-primary/30 hover:bg-primary/10"
                >
                  Вход
                </Button>
                <Button
                  onClick={() => navigate('/register')}
                  className="bg-gradient-to-r from-primary to-[#FF8E53]"
                >
                  Регистрация
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="bg-card/50 backdrop-blur-xl border border-primary/20 rounded-2xl p-8 mb-8">
            <h1 className="font-heading text-4xl font-bold text-white mb-3">
              Онлайн-магазин MAXISOFTZAB
            </h1>
            <p className="text-muted-foreground text-lg">
              Готовые IT-решения для вашего бизнеса
            </p>
          </div>

          {products.length === 0 ? (
            <div className="bg-card/50 backdrop-blur-xl border border-primary/20 rounded-2xl p-12 text-center">
              <Icon name="Package" size={64} className="text-muted-foreground mx-auto mb-4" />
              <h3 className="font-heading text-xl font-bold text-white mb-2">
                Продукты скоро появятся
              </h3>
              <p className="text-muted-foreground">
                Мы готовим для вас интересные предложения
              </p>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap gap-2 mb-6">
                {['Все', ...Array.from(new Set(products.map((p) => p.category)))].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                      activeCategory === cat
                        ? 'bg-primary text-white shadow-lg shadow-primary/30'
                        : 'bg-card/50 border border-primary/20 text-muted-foreground hover:border-primary/50 hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {products.filter((p) => activeCategory === 'Все' || p.category === activeCategory).map((product) => (
                <div
                  key={product.id}
                  className="bg-card/50 backdrop-blur-xl border border-primary/20 rounded-xl overflow-hidden hover:border-primary/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/10 group cursor-pointer"
                  onClick={() => setSelectedProduct(product)}
                >
                  <div className="relative h-32 overflow-hidden">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                        <Icon name="Package" size={32} className="text-primary/40" />
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-2 pb-1 pt-4">
                      <span className="text-[10px] font-bold text-primary/90 uppercase tracking-wide">
                        {product.category}
                      </span>
                    </div>
                  </div>

                  <div className="p-3">
                    <h3 className="font-heading text-sm font-bold text-white leading-tight mb-2 line-clamp-2">
                      {product.title}
                    </h3>
                    <div className="font-heading text-base font-bold text-primary">
                      {product.price.toLocaleString('ru-RU')} ₽
                    </div>
                  </div>
                </div>
              ))}
            </div>
            </>
          )}
        </div>
      </div>

      {/* Модальное окно продукта */}
      {selectedProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setSelectedProduct(null)}
        >
          <div
            className="bg-[#0F1419] border border-primary/30 rounded-2xl overflow-hidden max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl shadow-primary/10"
            onClick={(e) => e.stopPropagation()}
          >
            {selectedProduct.image_url && (
              <div className="relative h-72 overflow-hidden">
                <img
                  src={selectedProduct.image_url}
                  alt={selectedProduct.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0F1419] to-transparent" />
                <div className="absolute top-4 right-4 bg-primary/90 backdrop-blur-sm px-3 py-1 rounded-full">
                  <span className="text-white font-heading font-bold text-sm">
                    {selectedProduct.category}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="absolute top-4 left-4 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
                >
                  <Icon name="X" size={18} />
                </button>
              </div>
            )}

            <div className="p-8">
              {!selectedProduct.image_url && (
                <div className="flex justify-end mb-4">
                  <button
                    onClick={() => setSelectedProduct(null)}
                    className="text-muted-foreground hover:text-white transition-colors"
                  >
                    <Icon name="X" size={22} />
                  </button>
                </div>
              )}

              <h2 className="font-heading text-3xl font-bold text-white mb-4">
                {selectedProduct.title}
              </h2>

              <p className="text-muted-foreground text-base leading-relaxed mb-8 whitespace-pre-line">
                {selectedProduct.description}
              </p>

              {selectedProduct.demo_url && (
                <div className="mb-6 p-4 rounded-xl border border-secondary/30 bg-secondary/5 flex items-center justify-between gap-4">
                  <div>
                    <div className="text-sm font-medium text-white mb-1">Хочешь попробовать перед покупкой?</div>
                    <div className="text-xs text-muted-foreground">Полный доступ ко всем страницам и блокам — можно заполнять формы, кликать, исследовать. Данные не сохраняются, административные разделы недоступны.</div>
                  </div>
                  <Button
                    variant="outline"
                    className="shrink-0 border-secondary/50 text-secondary hover:bg-secondary/10"
                    onClick={() => window.open(selectedProduct.demo_url, '_blank')}
                  >
                    <Icon name="MonitorPlay" size={16} className="mr-2" />
                    Демо
                  </Button>
                </div>
              )}

              <div className="flex items-center justify-between pt-6 border-t border-primary/20">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Стоимость</div>
                  <div className="font-heading text-4xl font-bold text-primary">
                    {selectedProduct.price.toLocaleString('ru-RU')} ₽
                  </div>
                </div>
                <Button
                  onClick={() => handleBuy(selectedProduct)}
                  size="lg"
                  className="bg-gradient-to-r from-primary to-[#FF8E53] hover:shadow-lg hover:shadow-primary/30 text-lg px-8"
                >
                  <Icon name="ShoppingCart" size={20} className="mr-2" />
                  Купить
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно выбора способа оплаты */}
      {buyProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
          onClick={(e) => { if (e.target === e.currentTarget && !payLoading) setBuyProduct(null) }}
        >
          <div className="bg-[#1A2030] border border-primary/30 rounded-2xl p-8 w-full max-w-md shadow-2xl">

            {paySuccess ? (
              /* Успешная оплата */
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                  <Icon name="CheckCircle2" size={36} className="text-green-400" />
                </div>
                <h2 className="font-heading text-2xl font-bold text-white mb-2">Оплата прошла!</h2>
                <p className="text-muted-foreground text-sm mb-6">
                  Доступ к <span className="text-white font-medium">{buyProduct.title}</span> открыт
                </p>
                <div className="flex flex-col gap-3">
                  {paySuccess.websiteUrl && (
                    <a href={paySuccess.websiteUrl} target="_blank" rel="noreferrer">
                      <Button className="w-full bg-gradient-to-r from-primary to-[#FF8E53]">
                        <Icon name="ExternalLink" size={18} className="mr-2" />
                        Перейти на сайт продукта
                      </Button>
                    </a>
                  )}
                  <Button
                    variant="outline"
                    className="w-full border-primary/30 hover:bg-primary/10"
                    onClick={() => navigate('/dashboard/orders')}
                  >
                    <Icon name="Package" size={18} className="mr-2" />
                    Мои заказы
                  </Button>
                  <button
                    className="text-sm text-muted-foreground hover:text-white transition-colors"
                    onClick={() => setBuyProduct(null)}
                  >
                    Продолжить покупки
                  </button>
                </div>
              </div>
            ) : (
              /* Выбор способа оплаты */
              <>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="font-heading text-xl font-bold text-white">Оплата</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">{buyProduct.title}</p>
                  </div>
                  <button
                    onClick={() => setBuyProduct(null)}
                    className="text-muted-foreground hover:text-white transition-colors"
                    disabled={payLoading}
                  >
                    <Icon name="X" size={22} />
                  </button>
                </div>

                <div className="bg-card/30 rounded-xl p-4 mb-6 flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">Сумма к оплате</span>
                  <span className="font-heading text-2xl font-bold text-primary">
                    {buyProduct.price.toLocaleString('ru-RU')} ₽
                  </span>
                </div>

                {payError && (
                  <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                    {payError}
                  </div>
                )}

                <div className="space-y-3">
                  {/* Оплата с баланса */}
                  <button
                    onClick={handlePayFromWallet}
                    disabled={payLoading || walletBalance === null || walletBalance < buyProduct.price}
                    className={`w-full p-4 rounded-xl border text-left transition-all ${
                      walletBalance !== null && walletBalance >= buyProduct.price
                        ? 'border-primary/40 bg-primary/10 hover:bg-primary/20 hover:border-primary/60'
                        : 'border-white/10 bg-card/20 opacity-60 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                        {payLoading
                          ? <Icon name="Loader2" size={20} className="text-primary animate-spin" />
                          : <Icon name="Wallet" size={20} className="text-primary" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium text-sm">Баланс кошелька</p>
                        <p className={`text-xs mt-0.5 ${
                          walletBalance !== null && walletBalance >= buyProduct.price
                            ? 'text-green-400'
                            : 'text-red-400'
                        }`}>
                          {walletBalance !== null
                            ? `Доступно: ${walletBalance.toLocaleString('ru-RU', { minimumFractionDigits: 2 })} ₽`
                            : 'Загрузка...'}
                          {walletBalance !== null && walletBalance < buyProduct.price && ' — недостаточно средств'}
                        </p>
                      </div>
                      <Icon name="ChevronRight" size={18} className="text-muted-foreground flex-shrink-0" />
                    </div>
                  </button>

                  {/* Пополнить кошелёк если не хватает */}
                  {walletBalance !== null && walletBalance < buyProduct.price && (
                    <button
                      onClick={() => navigate('/dashboard/wallet')}
                      className="w-full p-3 rounded-xl border border-secondary/30 bg-secondary/5 hover:bg-secondary/10 transition-colors text-left flex items-center gap-3"
                    >
                      <Icon name="PlusCircle" size={18} className="text-secondary flex-shrink-0" />
                      <span className="text-secondary text-sm font-medium">Пополнить кошелёк</span>
                    </button>
                  )}

                  {/* Оплата картой напрямую */}
                  <button
                    onClick={handlePayWithCard}
                    disabled={payLoading}
                    className="w-full p-4 rounded-xl border border-[#FF8E53]/30 bg-[#FF8E53]/5 hover:bg-[#FF8E53]/10 hover:border-[#FF8E53]/50 transition-all text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#FF8E53]/15 flex items-center justify-center flex-shrink-0">
                        {payLoading && cardPayMethod === 'card'
                          ? <Icon name="Loader2" size={20} className="text-[#FF8E53] animate-spin" />
                          : <Icon name="CreditCard" size={20} className="text-[#FF8E53]" />
                        }
                      </div>
                      <div>
                        <p className="text-white font-medium text-sm">Банковской картой</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Visa, Mastercard, Мир, СБП · ЮКасса</p>
                      </div>
                      <Icon name="ChevronRight" size={18} className="text-muted-foreground ml-auto flex-shrink-0" />
                    </div>
                  </button>

                  {/* Оплата по реквизитам */}
                  <button
                    onClick={handlePayByRequisites}
                    disabled={payLoading}
                    className="w-full p-4 rounded-xl border border-white/10 bg-card/20 hover:border-primary/30 hover:bg-card/40 transition-all text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
                        <Icon name="Building2" size={20} className="text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-white font-medium text-sm">По реквизитам</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Перевод на счёт, подтверждение вручную</p>
                      </div>
                      <Icon name="ChevronRight" size={18} className="text-muted-foreground ml-auto flex-shrink-0" />
                    </div>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}