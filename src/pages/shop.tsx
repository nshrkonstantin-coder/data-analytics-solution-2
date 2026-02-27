import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import Icon from '@/components/ui/icon'
import { authService } from '@/lib/auth'

const PRODUCTS_API_URL = 'https://functions.poehali.dev/4d2b5055-dabb-4c6e-aa52-48d8657f7596'

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

  useEffect(() => {
    const checkAuth = async () => {
      const result = await authService.verifySession()
      setIsAuthenticated(result.valid)
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

  const handleBuy = (productId: number) => {
    if (!isAuthenticated) {
      navigate('/login')
    } else {
      navigate(`/dashboard/orders?product=${productId}`)
    }
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
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="bg-card/50 backdrop-blur-xl border border-primary/20 rounded-2xl overflow-hidden hover:border-primary/40 transition-all duration-300 hover:-translate-y-2 group cursor-pointer"
                  onClick={() => setSelectedProduct(product)}
                >
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={product.image_url}
                      alt={product.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute top-3 right-3 bg-primary/90 backdrop-blur-sm px-3 py-1 rounded-full">
                      <span className="text-white font-heading font-bold text-sm">
                        {product.category}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <h3 className="font-heading text-xl font-bold text-white mb-2">
                      {product.title}
                    </h3>
                    <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
                      {product.description}
                    </p>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-primary/20">
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Цена</div>
                        <div className="font-heading text-2xl font-bold text-primary">
                          {product.price.toLocaleString('ru-RU')} ₽
                        </div>
                      </div>
                      <Button
                        onClick={(e) => { e.stopPropagation(); handleBuy(product.id) }}
                        className="bg-gradient-to-r from-primary to-[#FF8E53] hover:shadow-lg hover:shadow-primary/30"
                      >
                        <Icon name="ShoppingCart" size={18} className="mr-2" />
                        Купить
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
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
                  onClick={() => { setSelectedProduct(null); handleBuy(selectedProduct.id) }}
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
    </div>
  )
}