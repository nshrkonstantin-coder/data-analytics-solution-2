import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Icon from '@/components/ui/icon'
import { authService } from '@/lib/auth'

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
  is_active: boolean
  website_url: string
  subscription_days: number
  upgrades: Upgrade[]
  is_subscription: boolean
  created_at: string
}

export function AdminProductsPage() {
  const navigate = useNavigate()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: '',
    image_url: '',
    is_active: true,
    website_url: '',
    subscription_days: '30',
    is_subscription: true,
  })
  const [upgrades, setUpgrades] = useState<Upgrade[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    const verifyAdmin = async () => {
      const result = await authService.verifySession()
      if (!result.valid || result.user?.role !== 'admin') {
        navigate('/login')
      } else {
        await loadProducts()
      }
    }

    verifyAdmin()
  }, [navigate])

  const loadProducts = async () => {
    const token = localStorage.getItem('auth_token')
    try {
      const response = await fetch(`${ADMIN_API_URL}?action=products`, {
        headers: { 'Authorization': `Bearer ${token}` },
      })
      const data = await response.json()
      setProducts(data.products || [])
    } catch (error) {
      console.error('Ошибка загрузки продуктов:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setFormData({
      title: product.title,
      description: product.description,
      price: product.price.toString(),
      category: product.category,
      image_url: product.image_url || '',
      is_active: product.is_active,
      website_url: product.website_url || '',
      subscription_days: (product.subscription_days || 30).toString(),
      is_subscription: product.is_subscription !== false,
    })
    setUpgrades(product.upgrades || [])
    setEditMode(true)
    setError('')
    setSuccess('')
  }

  const handleCreate = () => {
    setEditingProduct(null)
    setFormData({
      title: '',
      description: '',
      price: '',
      category: '',
      image_url: '',
      is_active: true,
      website_url: '',
      subscription_days: '30',
      is_subscription: true,
    })
    setUpgrades([])
    setEditMode(true)
    setError('')
    setSuccess('')
  }

  const addUpgrade = () => {
    setUpgrades([...upgrades, { title: '', description: '', price: 0 }])
  }

  const removeUpgrade = (index: number) => {
    setUpgrades(upgrades.filter((_, i) => i !== index))
  }

  const updateUpgrade = (index: number, field: keyof Upgrade, value: string | number) => {
    const updated = [...upgrades]
    updated[index] = { ...updated[index], [field]: value }
    setUpgrades(updated)
  }

  const handleSave = async () => {
    if (!formData.title || !formData.price || !formData.category) {
      setError('Заполните обязательные поля: название, цена, категория')
      return
    }

    setSaving(true)
    setError('')
    const token = localStorage.getItem('auth_token')

    try {
      const body = {
        ...(editingProduct ? { id: editingProduct.id } : {}),
        ...formData,
        price: parseFloat(formData.price),
        subscription_days: parseInt(formData.subscription_days) || 30,
        upgrades,
      }

      const response = await fetch(`${ADMIN_API_URL}?action=product`, {
        method: editingProduct ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка сохранения')
      }

      setSuccess(editingProduct ? 'Продукт обновлен' : 'Продукт создан')
      setEditMode(false)
      await loadProducts()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка сохранения')
    } finally {
      setSaving(false)
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

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          {success && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mb-6 flex items-start gap-2">
              <Icon name="CheckCircle" size={20} className="text-green-500 mt-0.5 flex-shrink-0" />
              <p className="text-green-500 text-sm">{success}</p>
            </div>
          )}

          <div className="bg-card/50 backdrop-blur-xl border border-primary/20 rounded-2xl p-8 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="font-heading text-3xl font-bold text-white mb-2">
                  Управление продуктами
                </h1>
                <p className="text-muted-foreground">
                  Всего продуктов: {products.length}
                </p>
              </div>
              <Button
                onClick={handleCreate}
                className="bg-gradient-to-r from-primary to-[#FF8E53] hover:shadow-lg hover:shadow-primary/30"
              >
                <Icon name="Plus" size={18} className="mr-2" />
                Создать продукт
              </Button>
            </div>
          </div>

          {editMode && (
            <div className="bg-card/50 backdrop-blur-xl border border-primary/20 rounded-2xl p-8 mb-6">
              <h2 className="font-heading text-2xl font-bold text-white mb-6">
                {editingProduct ? 'Редактирование продукта' : 'Новый продукт'}
              </h2>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-6 flex items-start gap-2">
                  <Icon name="AlertCircle" size={20} className="text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-red-500 text-sm">{error}</p>
                </div>
              )}

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Название *</label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Корпоративный сайт"
                    className="bg-background/50 border-primary/30 focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">Описание</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Полное описание продукта..."
                    rows={4}
                    className="w-full rounded-md bg-background/50 border border-primary/30 focus:border-primary px-3 py-2 text-white"
                  />
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Цена (₽) *</label>
                    <Input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="150000"
                      className="bg-background/50 border-primary/30 focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Категория *</label>
                    <Input
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      placeholder="Веб-сайты"
                      className="bg-background/50 border-primary/30 focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Срок подписки (дней)</label>
                    <Input
                      type="number"
                      value={formData.subscription_days}
                      onChange={(e) => setFormData({ ...formData, subscription_days: e.target.value })}
                      placeholder="30"
                      className="bg-background/50 border-primary/30 focus:border-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">URL изображения</label>
                  <Input
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                    className="bg-background/50 border-primary/30 focus:border-primary"
                  />
                </div>

                <div className="border border-primary/20 rounded-xl p-5 bg-primary/5">
                  <label className="block text-sm font-medium text-primary mb-2 flex items-center gap-2">
                    <Icon name="Globe" size={16} />
                    Ссылка на сайт (для доступа после оплаты)
                  </label>
                  <Input
                    value={formData.website_url}
                    onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                    placeholder="https://client-site.ru или https://app.example.com"
                    className="bg-background/50 border-primary/30 focus:border-primary"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    После подтверждения оплаты пользователь получит ссылку на этот сайт. На сайте должна быть кнопка "Подтвердить оплату".
                  </p>
                </div>

                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="w-4 h-4 rounded border-primary/30"
                    />
                    <span className="text-sm text-white">Активен (показывать в магазине)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_subscription}
                      onChange={(e) => setFormData({ ...formData, is_subscription: e.target.checked })}
                      className="w-4 h-4 rounded border-primary/30"
                    />
                    <span className="text-sm text-white">Подписка (периодическая оплата)</span>
                  </label>
                </div>

                <div className="border border-primary/20 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-white font-medium">Варианты улучшений</h3>
                      <p className="text-xs text-muted-foreground mt-1">Дополнительные опции для клиента после покупки</p>
                    </div>
                    <Button
                      onClick={addUpgrade}
                      variant="outline"
                      size="sm"
                      className="border-primary/30 hover:bg-primary/10"
                    >
                      <Icon name="Plus" size={14} className="mr-1" />
                      Добавить
                    </Button>
                  </div>

                  {upgrades.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-3">Нет улучшений</p>
                  )}

                  <div className="space-y-3">
                    {upgrades.map((upgrade, index) => (
                      <div key={index} className="bg-background/30 rounded-lg p-4 flex gap-3">
                        <div className="flex-1 grid md:grid-cols-3 gap-3">
                          <Input
                            value={upgrade.title}
                            onChange={(e) => updateUpgrade(index, 'title', e.target.value)}
                            placeholder="Название улучшения"
                            className="bg-background/50 border-primary/30 focus:border-primary text-sm"
                          />
                          <Input
                            value={upgrade.description}
                            onChange={(e) => updateUpgrade(index, 'description', e.target.value)}
                            placeholder="Описание"
                            className="bg-background/50 border-primary/30 focus:border-primary text-sm"
                          />
                          <Input
                            type="number"
                            value={upgrade.price}
                            onChange={(e) => updateUpgrade(index, 'price', parseFloat(e.target.value) || 0)}
                            placeholder="Цена (₽)"
                            className="bg-background/50 border-primary/30 focus:border-primary text-sm"
                          />
                        </div>
                        <button
                          onClick={() => removeUpgrade(index)}
                          className="text-red-400 hover:text-red-300 mt-2"
                        >
                          <Icon name="X" size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-gradient-to-r from-primary to-[#FF8E53] hover:shadow-lg hover:shadow-primary/30"
                  >
                    {saving ? (
                      <>
                        <Icon name="Loader2" size={18} className="animate-spin mr-2" />
                        Сохранение...
                      </>
                    ) : (
                      'Сохранить'
                    )}
                  </Button>
                  <Button
                    onClick={() => setEditMode(false)}
                    variant="outline"
                    className="border-primary/30"
                  >
                    Отмена
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            {products.map((product) => (
              <div
                key={product.id}
                className="bg-card/50 backdrop-blur-xl border border-primary/20 rounded-2xl overflow-hidden hover:border-primary/40 transition-all duration-300"
              >
                <div className="relative h-40 overflow-hidden">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                      <Icon name="Globe" size={40} className="text-primary/40" />
                    </div>
                  )}
                  <div className="absolute top-3 right-3 flex gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      product.is_active
                        ? 'bg-green-500/90 text-white'
                        : 'bg-red-500/90 text-white'
                    }`}>
                      {product.is_active ? 'Активен' : 'Неактивен'}
                    </span>
                    {product.is_subscription && (
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary/90 text-white">
                        Подписка
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="font-heading text-xl font-bold text-white flex-1">
                      {product.title}
                    </h3>
                  </div>

                  <p className="text-sm text-primary mb-2">{product.category}</p>
                  <p className="text-muted-foreground text-sm mb-3 line-clamp-2">{product.description}</p>

                  {product.website_url && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3 bg-background/30 rounded-lg px-3 py-2">
                      <Icon name="Globe" size={12} className="text-primary flex-shrink-0" />
                      <span className="truncate">{product.website_url}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
                    <span className="flex items-center gap-1">
                      <Icon name="Calendar" size={12} />
                      {product.subscription_days || 30} дней
                    </span>
                    {product.upgrades && product.upgrades.length > 0 && (
                      <span className="flex items-center gap-1">
                        <Icon name="Zap" size={12} />
                        {product.upgrades.length} улучш.
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-primary/20">
                    <div className="font-heading text-2xl font-bold text-primary">
                      {product.price.toLocaleString('ru-RU')} ₽
                    </div>
                    <Button
                      onClick={() => handleEdit(product)}
                      variant="outline"
                      className="border-primary/30 hover:bg-primary/10"
                      size="sm"
                    >
                      <Icon name="Edit" size={16} className="mr-2" />
                      Редактировать
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {products.length === 0 && (
            <div className="bg-card/50 backdrop-blur-xl border border-primary/20 rounded-2xl p-12 text-center">
              <Icon name="Package" size={64} className="text-muted-foreground mx-auto mb-4" />
              <h3 className="font-heading text-xl font-bold text-white mb-2">
                Продуктов нет
              </h3>
              <p className="text-muted-foreground mb-4">
                Создайте первый продукт для магазина
              </p>
              <Button
                onClick={handleCreate}
                className="bg-gradient-to-r from-primary to-[#FF8E53]"
              >
                <Icon name="Plus" size={18} className="mr-2" />
                Создать продукт
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
