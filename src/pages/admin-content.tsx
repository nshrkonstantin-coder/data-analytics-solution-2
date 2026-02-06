import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Icon from '@/components/ui/icon'
import { authService } from '@/lib/auth'

const ADMIN_API_URL = 'https://functions.poehali.dev/60c925e5-07c4-4e22-acbb-7c60c1d9524d'

interface Content {
  id: number
  section: string
  key: string
  content: string
  content_type: string
  updated_at: string
}

const DEFAULT_SECTIONS = [
  { id: 'hero', name: 'Главный экран', fields: [
    { key: 'title', label: 'Заголовок', type: 'text' },
    { key: 'subtitle', label: 'Подзаголовок', type: 'text' },
    { key: 'description', label: 'Описание', type: 'textarea' },
  ]},
  { id: 'about', name: 'О нас', fields: [
    { key: 'title', label: 'Заголовок', type: 'text' },
    { key: 'description', label: 'Описание', type: 'textarea' },
  ]},
  { id: 'services', name: 'Услуги', fields: [
    { key: 'title', label: 'Заголовок секции', type: 'text' },
    { key: 'subtitle', label: 'Подзаголовок', type: 'text' },
  ]},
  { id: 'contact', name: 'Контакты', fields: [
    { key: 'phone', label: 'Телефон', type: 'text' },
    { key: 'email', label: 'Email', type: 'text' },
    { key: 'address', label: 'Адрес', type: 'text' },
  ]},
  { id: 'footer', name: 'Подвал сайта', fields: [
    { key: 'company_name', label: 'Название компании', type: 'text' },
    { key: 'description', label: 'Описание', type: 'textarea' },
    { key: 'copyright', label: 'Copyright текст', type: 'text' },
  ]},
]

export function AdminContentPage() {
  const navigate = useNavigate()
  const [content, setContent] = useState<Content[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSection, setSelectedSection] = useState(DEFAULT_SECTIONS[0])
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const verifyAdmin = async () => {
      const result = await authService.verifySession()
      if (!result.valid || result.user?.role !== 'admin') {
        navigate('/login')
      } else {
        await loadContent()
      }
    }

    verifyAdmin()
  }, [navigate])

  const loadContent = async () => {
    const token = localStorage.getItem('auth_token')
    try {
      const response = await fetch(`${ADMIN_API_URL}?action=content`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      const data = await response.json()
      setContent(data.content || [])
      loadSectionData(DEFAULT_SECTIONS[0], data.content || [])
    } catch (error) {
      console.error('Ошибка загрузки контента:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadSectionData = (section: typeof DEFAULT_SECTIONS[0], contentData: Content[]) => {
    const sectionData: Record<string, string> = {}
    section.fields.forEach(field => {
      const existingContent = contentData.find(
        c => c.section === section.id && c.key === field.key
      )
      sectionData[field.key] = existingContent?.content || ''
    })
    setFormData(sectionData)
  }

  const handleSectionChange = (section: typeof DEFAULT_SECTIONS[0]) => {
    setSelectedSection(section)
    loadSectionData(section, content)
    setSuccess('')
    setError('')
  }

  const handleSave = async (fieldKey: string) => {
    setSaving(true)
    setError('')
    const token = localStorage.getItem('auth_token')

    try {
      const response = await fetch(`${ADMIN_API_URL}?action=content`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          section: selectedSection.id,
          key: fieldKey,
          content: formData[fieldKey],
          content_type: 'text',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка сохранения')
      }

      setSuccess(`Поле "${selectedSection.fields.find(f => f.key === fieldKey)?.label}" сохранено`)
      await loadContent()
      setTimeout(() => setSuccess(''), 3000)
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
            <h1 className="font-heading text-3xl font-bold text-white mb-2">
              Управление контентом
            </h1>
            <p className="text-muted-foreground">
              Редактирование текста на всех страницах сайта
            </p>
          </div>

          <div className="grid lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1">
              <div className="bg-card/50 backdrop-blur-xl border border-primary/20 rounded-2xl p-4 space-y-2">
                <h3 className="font-heading text-sm font-semibold text-white mb-3 px-2">
                  Разделы сайта
                </h3>
                {DEFAULT_SECTIONS.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => handleSectionChange(section)}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                      selectedSection.id === section.id
                        ? 'bg-primary/20 text-primary border border-primary/30'
                        : 'text-muted-foreground hover:bg-primary/5 hover:text-white'
                    }`}
                  >
                    <div className="font-medium text-sm">{section.name}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="lg:col-span-3">
              <div className="bg-card/50 backdrop-blur-xl border border-primary/20 rounded-2xl p-8">
                <h2 className="font-heading text-2xl font-bold text-white mb-6">
                  {selectedSection.name}
                </h2>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-6 flex items-start gap-2">
                    <Icon name="AlertCircle" size={20} className="text-red-500 mt-0.5 flex-shrink-0" />
                    <p className="text-red-500 text-sm">{error}</p>
                  </div>
                )}

                <div className="space-y-6">
                  {selectedSection.fields.map((field) => (
                    <div key={field.key} className="space-y-3">
                      <label className="block text-sm font-medium text-white">
                        {field.label}
                      </label>
                      
                      {field.type === 'textarea' ? (
                        <textarea
                          value={formData[field.key] || ''}
                          onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                          rows={4}
                          className="w-full rounded-md bg-background/50 border border-primary/30 focus:border-primary px-3 py-2 text-white"
                          placeholder={`Введите ${field.label.toLowerCase()}...`}
                        />
                      ) : (
                        <Input
                          type="text"
                          value={formData[field.key] || ''}
                          onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                          placeholder={`Введите ${field.label.toLowerCase()}...`}
                          className="bg-background/50 border-primary/30 focus:border-primary"
                        />
                      )}

                      <Button
                        onClick={() => handleSave(field.key)}
                        disabled={saving}
                        size="sm"
                        className="bg-gradient-to-r from-primary to-[#FF8E53] hover:shadow-lg hover:shadow-primary/30"
                      >
                        {saving ? (
                          <>
                            <Icon name="Loader2" size={16} className="animate-spin mr-2" />
                            Сохранение...
                          </>
                        ) : (
                          <>
                            <Icon name="Save" size={16} className="mr-2" />
                            Сохранить
                          </>
                        )}
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="mt-8 p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <div className="flex items-start gap-3">
                    <Icon name="Info" size={20} className="text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-heading font-semibold text-white mb-1">Информация</h4>
                      <p className="text-sm text-muted-foreground">
                        Изменения контента применяются сразу после сохранения. Для применения изменений на сайте может потребоваться обновление страницы.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
