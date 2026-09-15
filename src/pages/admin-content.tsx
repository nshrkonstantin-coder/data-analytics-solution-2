import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Icon from '@/components/ui/icon'
import { authService } from '@/lib/auth'

const ADMIN_API_URL = 'https://functions.poehali.dev/60c925e5-07c4-4e22-acbb-7c60c1d9524d'
const UPLOAD_API_URL = 'https://functions.poehali.dev/0dcbc7f5-3b22-4665-a98a-18fb4e1124d2'

interface Content {
  id: number
  section: string
  key: string
  content: string
  content_type: string
  updated_at: string
}

interface FieldDefinition {
  key: string
  label: string
  type: string
  current?: string
  preview?: string
  imageUrl?: string
}

interface PortfolioProject {
  id: number
  category: string
  name: string
  tech: string
  image_url: string
  is_large: boolean
  is_active: boolean
  sort_order: number
}

const EMPTY_PORTFOLIO_FORM = {
  category: '',
  name: '',
  tech: '',
  image_url: '',
  is_large: false,
  is_active: true,
  sort_order: '0',
}

const DEFAULT_SECTIONS = [
  { id: 'hero', name: '🏠 Главный экран', icon: 'Home', fields: [
    { key: 'title', label: 'Заголовок', type: 'text', current: 'Цифровые решения', preview: 'Большой заголовок вверху страницы' },
    { key: 'subtitle', label: 'Подзаголовок', type: 'text', current: 'для вашего бизнеса', preview: 'Вторая строка заголовка' },
    { key: 'description', label: 'Описание', type: 'textarea', current: 'Мы создаем производительные веб-приложения и корпоративные сайты с той же точностью и надежностью, с которой обслуживаем автотранспорт.', preview: 'Текст под заголовком' },
    { key: 'button1', label: 'Кнопка 1 (текст)', type: 'text', current: 'Смотреть наши работы', preview: 'Текст на первой кнопке' },
    { key: 'button2', label: 'Кнопка 2 (текст)', type: 'text', current: 'Рассчитать стоимость', preview: 'Текст на второй кнопке' },
  ]},
  { id: 'features', name: '⭐ Преимущества', icon: 'Star', fields: [
    { key: 'title', label: 'Заголовок секции', type: 'text', current: 'Почему выбирают нас', preview: 'Заголовок секции преимуществ' },
    { key: 'subtitle', label: 'Подзаголовок', type: 'text', current: 'Наши ключевые особенности', preview: 'Описание под заголовком' },
  ]},
  { id: 'about', name: 'ℹ️ О нас', icon: 'Info', fields: [
    { key: 'title', label: 'Заголовок', type: 'text', current: 'О компании MaxiSoftZab', preview: 'Заголовок секции о компании' },
    { key: 'description', label: 'Описание', type: 'textarea', current: 'MaxiSoftZab — это команда профессионалов, объединяющая экспертизу в разработке программного обеспечения и обслуживании автотранспорта.', preview: 'Основной текст о компании' },
  ]},
  { id: 'process', name: '🛠️ Наш подход', icon: 'Wrench', fields: [
    { key: 'title', label: 'Заголовок (маленький)', type: 'text', current: 'Наш подход', preview: 'Маленькая надпись над заголовком секции' },
    { key: 'heading', label: 'Заголовок секции', type: 'text', current: 'Как мы работаем', preview: 'Основной заголовок секции' },
    { key: 'description', label: 'Описание', type: 'textarea', current: 'Применяем инженерный подход из авторемонта к созданию digital-продуктов: диагностируем, планируем, реализуем, тестируем и обеспечиваем поддержку.', preview: 'Текст под заголовком секции' },
    { key: 'step1_title', label: 'Этап 1 — Заголовок', type: 'text', current: 'Диагностика и анализ', preview: 'Заголовок первого этапа' },
    { key: 'step1_description', label: 'Этап 1 — Описание', type: 'textarea', current: 'Как в автосервисе: сначала проводим полную диагностику бизнес-задач, анализируем потребности и разрабатываем техническое задание.', preview: 'Описание первого этапа' },
    { key: 'step2_title', label: 'Этап 2 — Заголовок', type: 'text', current: 'Проектирование и разработка', preview: 'Заголовок второго этапа' },
    { key: 'step2_description', label: 'Этап 2 — Описание', type: 'textarea', current: 'Создаем архитектуру решения, интерфейс и реализуем функционал. Каждый этап согласовывается с клиентом.', preview: 'Описание второго этапа' },
    { key: 'step3_title', label: 'Этап 3 — Заголовок', type: 'text', current: 'Тестирование и запуск', preview: 'Заголовок третьего этапа' },
    { key: 'step3_description', label: 'Этап 3 — Описание', type: 'textarea', current: 'Проводим комплексное тестирование, устраняем ошибки и запускаем проект. Как тестирование авто после ремонта.', preview: 'Описание третьего этапа' },
    { key: 'step4_title', label: 'Этап 4 — Заголовок', type: 'text', current: 'Поддержка и обслуживание', preview: 'Заголовок четвёртого этапа' },
    { key: 'step4_description', label: 'Этап 4 — Описание', type: 'textarea', current: 'Обеспечиваем техническую поддержку, мониторинг и развитие проекта. Гарантийное и постгарантийное обслуживание.', preview: 'Описание четвёртого этапа' },
  ]},
  { id: 'portfolio', name: '💼 Наши разработки', icon: 'Briefcase', fields: [] as FieldDefinition[] },
  { id: 'contact', name: '📞 Контакты', icon: 'Phone', fields: [
    { key: 'phone', label: 'Телефон', type: 'text', current: '+7 (999) 123-45-67', preview: 'Номер телефона компании' },
    { key: 'email', label: 'Email', type: 'text', current: 'info@maxisoftzab.ru', preview: 'Email для связи' },
    { key: 'address', label: 'Адрес', type: 'text', current: 'г. Чита, ул. Примерная, д. 1', preview: 'Физический адрес офиса' },
  ]},
  { id: 'footer', name: '📄 Подвал сайта', icon: 'FileText', fields: [
    { key: 'company_name', label: 'Название компании', type: 'text', current: 'MAXISOFTZAB', preview: 'Название в подвале' },
    { key: 'description', label: 'Описание', type: 'textarea', current: 'Разработка программного обеспечения и обслуживание автотранспорта в Забайкалье', preview: 'Краткое описание компании' },
    { key: 'copyright', label: 'Copyright текст', type: 'text', current: '© 2025 MaxiSoftZab. Все права защищены.', preview: 'Текст копирайта' },
  ]},
  { id: 'legal', name: '🔒 Согласие на ПД', icon: 'Shield', fields: [
    { key: 'consent_text', label: 'Текст согласия на обработку персональных данных', type: 'textarea', current: 'Нажимая кнопку «Зарегистрироваться», я даю согласие на обработку моих персональных данных в соответствии с Политикой конфиденциальности и соглашаюсь с условиями пользовательского соглашения.', preview: 'Отображается под формой регистрации перед кнопкой' },
  ]},
  { id: 'privacy', name: '📋 Политика конфиденциальности', icon: 'FileText', fields: [
    { key: 'policy_text', label: 'Текст политики конфиденциальности', type: 'textarea', current: '1. ОБЩИЕ ПОЛОЖЕНИЯ\n\nНастоящая Политика конфиденциальности определяет порядок обработки персональных данных пользователей сайта.\n\n2. КАКИЕ ДАННЫЕ МЫ СОБИРАЕМ\n\nМы собираем следующие персональные данные: имя и фамилия, адрес электронной почты, номер телефона.\n\n3. ЦЕЛИ ОБРАБОТКИ ДАННЫХ\n\nПерсональные данные обрабатываются в целях предоставления доступа к сервисам сайта и связи с пользователем.\n\n4. КОНТАКТЫ\n\nПо вопросам обработки персональных данных: info@maxisoftzab.ru', preview: 'Полный текст на странице /privacy' },
  ]},
  { id: 'images', name: '🖼️ Изображения', icon: 'Image', fields: [
    { key: 'logo', label: 'Логотип компании', type: 'image', current: '', preview: 'Логотип в шапке сайта', imageUrl: 'https://via.placeholder.com/200x80?text=LOGO' },
    { key: 'hero_bg', label: 'Фон главного экрана', type: 'image', current: '', preview: 'Фоновое изображение на главной', imageUrl: 'https://via.placeholder.com/1920x1080?text=Hero+Background' },
    { key: 'about_image', label: 'Изображение "О нас"', type: 'image', current: '', preview: 'Картинка в секции о компании', imageUrl: 'https://via.placeholder.com/800x600?text=About+Us' },
    { key: 'cta_image', label: 'Призыв к действию', type: 'image', current: '', preview: 'Изображение в CTA секции', imageUrl: 'https://via.placeholder.com/600x400?text=CTA' },
  ]},
]

export function AdminContentPage() {
  const navigate = useNavigate()
  const [content, setContent] = useState<Content[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSection, setSelectedSection] = useState(DEFAULT_SECTIONS[0])
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [savingAll, setSavingAll] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [uploadingImage, setUploadingImage] = useState<string | null>(null)

  const [portfolioProjects, setPortfolioProjects] = useState<PortfolioProject[]>([])
  const [portfolioLoading, setPortfolioLoading] = useState(false)
  const [portfolioEditMode, setPortfolioEditMode] = useState(false)
  const [editingProject, setEditingProject] = useState<PortfolioProject | null>(null)
  const [portfolioForm, setPortfolioForm] = useState(EMPTY_PORTFOLIO_FORM)
  const [portfolioSaving, setPortfolioSaving] = useState(false)
  const [portfolioDeleting, setPortfolioDeleting] = useState<number | null>(null)
  const [portfolioUploadingImage, setPortfolioUploadingImage] = useState(false)

  useEffect(() => {
    const verifyAdmin = async () => {
      const result = await authService.verifySession()
      if (!result.valid || result.user?.role !== 'admin') {
        navigate('/login')
      } else {
        const freshContent = await loadContent()
        if (freshContent) loadSectionData(DEFAULT_SECTIONS[0], freshContent)
      }
    }

    verifyAdmin()
  }, [navigate])

  const loadContent = async (): Promise<Content[] | null> => {
    const token = localStorage.getItem('auth_token')
    try {
      const response = await fetch(`${ADMIN_API_URL}?action=content`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      const data = await response.json()
      const freshContent: Content[] = data.content || []
      setContent(freshContent)
      return freshContent
    } catch (error) {
      console.error('Ошибка загрузки контента:', error)
      return null
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
      sectionData[field.key] = existingContent?.content || field.current || ''
    })
    setFormData(sectionData)
  }

  const handleSectionChange = (section: typeof DEFAULT_SECTIONS[0]) => {
    setSelectedSection(section)
    setSuccess('')
    setError('')
    if (section.id === 'portfolio') {
      setPortfolioEditMode(false)
      loadPortfolioProjects()
    } else {
      loadSectionData(section, content)
    }
  }

  const loadPortfolioProjects = async () => {
    setPortfolioLoading(true)
    const token = localStorage.getItem('auth_token')
    try {
      const response = await fetch(`${ADMIN_API_URL}?action=portfolio`, {
        headers: { 'Authorization': `Bearer ${token}` },
      })
      const data = await response.json()
      setPortfolioProjects(data.projects || [])
    } catch (err) {
      console.error('Ошибка загрузки проектов:', err)
    } finally {
      setPortfolioLoading(false)
    }
  }

  const handlePortfolioImageUpload = async (file: File) => {
    setPortfolioUploadingImage(true)
    setError('')
    try {
      const reader = new FileReader()
      reader.onloadend = async () => {
        const base64 = reader.result as string
        try {
          const response = await fetch(UPLOAD_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image_data: base64, image_name: file.name }),
          })
          const data = await response.json()
          if (!response.ok) throw new Error(data.error || 'Ошибка загрузки')
          setPortfolioForm(prev => ({ ...prev, image_url: data.url }))
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Ошибка загрузки изображения')
        } finally {
          setPortfolioUploadingImage(false)
        }
      }
      reader.readAsDataURL(file)
    } catch {
      setError('Ошибка чтения файла')
      setPortfolioUploadingImage(false)
    }
  }

  const handlePortfolioCreate = () => {
    setEditingProject(null)
    setPortfolioForm({ ...EMPTY_PORTFOLIO_FORM, sort_order: (portfolioProjects.length + 1).toString() })
    setPortfolioEditMode(true)
    setError('')
    setSuccess('')
  }

  const handlePortfolioEdit = (project: PortfolioProject) => {
    setEditingProject(project)
    setPortfolioForm({
      category: project.category,
      name: project.name,
      tech: project.tech,
      image_url: project.image_url || '',
      is_large: project.is_large,
      is_active: project.is_active,
      sort_order: (project.sort_order ?? 0).toString(),
    })
    setPortfolioEditMode(true)
    setError('')
    setSuccess('')
  }

  const handlePortfolioSave = async () => {
    if (!portfolioForm.name || !portfolioForm.category) {
      setError('Заполните обязательные поля: название проекта и категория')
      return
    }

    setPortfolioSaving(true)
    setError('')
    const token = localStorage.getItem('auth_token')

    try {
      const body = {
        ...(editingProject ? { id: editingProject.id } : {}),
        ...portfolioForm,
        sort_order: parseInt(portfolioForm.sort_order) || 0,
      }

      const response = await fetch(`${ADMIN_API_URL}?action=portfolio`, {
        method: editingProject ? 'PUT' : 'POST',
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

      setSuccess(editingProject ? 'Проект обновлен' : 'Проект добавлен')
      setPortfolioEditMode(false)
      await loadPortfolioProjects()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка сохранения')
    } finally {
      setPortfolioSaving(false)
    }
  }

  const handlePortfolioDelete = async (project: PortfolioProject) => {
    if (!confirm(`Удалить проект "${project.name}"?`)) return

    setPortfolioDeleting(project.id)
    setError('')
    const token = localStorage.getItem('auth_token')

    try {
      const response = await fetch(`${ADMIN_API_URL}?action=portfolio&id=${project.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка удаления')
      }

      setSuccess('Проект удален')
      await loadPortfolioProjects()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка удаления')
    } finally {
      setPortfolioDeleting(null)
    }
  }

  const handleImageUpload = async (fieldKey: string, file: File) => {
    setUploadingImage(fieldKey)
    setError('')

    try {
      const reader = new FileReader()
      reader.onloadend = async () => {
        const base64 = reader.result as string
        const token = localStorage.getItem('auth_token')

        try {
          const uploadResponse = await fetch(UPLOAD_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image_data: base64, image_name: file.name }),
          })
          const uploadData = await uploadResponse.json()
          if (!uploadResponse.ok) {
            throw new Error(uploadData.error || 'Ошибка загрузки в хранилище')
          }
          const imageUrl = uploadData.url

          const response = await fetch(`${ADMIN_API_URL}?action=content`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              section: selectedSection.id,
              key: fieldKey,
              content: imageUrl,
              content_type: 'image',
            }),
          })

          const data = await response.json()

          if (!response.ok) {
            throw new Error(data.error || 'Ошибка сохранения изображения')
          }

          setSuccess(`Изображение "${selectedSection.fields.find(f => f.key === fieldKey)?.label}" загружено`)
          const freshContent = await loadContent()
          if (freshContent) loadSectionData(selectedSection, freshContent)
          setTimeout(() => setSuccess(''), 3000)
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Ошибка загрузки изображения')
        } finally {
          setUploadingImage(null)
        }
      }
      reader.readAsDataURL(file)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка чтения файла')
      setUploadingImage(null)
    }
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
      const freshContent = await loadContent()
      if (freshContent) loadSectionData(selectedSection, freshContent)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка сохранения')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveAll = async () => {
    setSavingAll(true)
    setError('')
    const token = localStorage.getItem('auth_token')
    const textFields = selectedSection.fields.filter(f => f.type !== 'image')

    try {
      await Promise.all(textFields.map(field =>
        fetch(`${ADMIN_API_URL}?action=content`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ section: selectedSection.id, key: field.key, content: formData[field.key] || '', content_type: 'text' }),
        })
      ))
      setSuccess(`Все поля раздела "${selectedSection.name}" сохранены`)
      const freshContent = await loadContent()
      if (freshContent) loadSectionData(selectedSection, freshContent)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка сохранения')
    } finally {
      setSavingAll(false)
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
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-heading text-2xl font-bold text-white">
                    {selectedSection.name}
                  </h2>
                  {selectedSection.id === 'portfolio' && !portfolioEditMode && (
                    <Button
                      onClick={handlePortfolioCreate}
                      className="bg-gradient-to-r from-primary to-[#FF8E53] hover:shadow-lg hover:shadow-primary/30"
                    >
                      <Icon name="Plus" size={16} className="mr-2" />
                      Добавить проект
                    </Button>
                  )}
                  {selectedSection.id !== 'portfolio' && selectedSection.fields.some(f => f.type !== 'image') && (
                    <Button
                      onClick={handleSaveAll}
                      disabled={savingAll || saving}
                      className="bg-gradient-to-r from-primary to-[#FF8E53] hover:shadow-lg hover:shadow-primary/30"
                    >
                      {savingAll ? (
                        <>
                          <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
                          Сохранение...
                        </>
                      ) : (
                        <>
                          <Icon name="SaveAll" size={16} className="mr-2" />
                          Сохранить всё
                        </>
                      )}
                    </Button>
                  )}
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-6 flex items-start gap-2">
                    <Icon name="AlertCircle" size={20} className="text-red-500 mt-0.5 flex-shrink-0" />
                    <p className="text-red-500 text-sm">{error}</p>
                  </div>
                )}

                {selectedSection.id === 'portfolio' ? (
                  <div>
                    <p className="text-sm text-muted-foreground mb-6">
                      Эти проекты отображаются в блоке «Наши разработки — Реализованные проекты» на главной странице сайта для всех посетителей.
                    </p>

                    {portfolioEditMode && (
                      <div className="border border-primary/20 rounded-xl p-6 bg-background/30 mb-6">
                        <h3 className="font-heading text-lg font-bold text-white mb-4">
                          {editingProject ? 'Редактирование проекта' : 'Новый проект'}
                        </h3>

                        <div className="space-y-4">
                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-white mb-2">Категория *</label>
                              <Input
                                value={portfolioForm.category}
                                onChange={(e) => setPortfolioForm({ ...portfolioForm, category: e.target.value })}
                                placeholder="Веб-приложение"
                                className="bg-background/50 border-primary/30 focus:border-primary"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-white mb-2">Название проекта *</label>
                              <Input
                                value={portfolioForm.name}
                                onChange={(e) => setPortfolioForm({ ...portfolioForm, name: e.target.value })}
                                placeholder="Система управления автопарком AutoFleet Pro"
                                className="bg-background/50 border-primary/30 focus:border-primary"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-white mb-2">Технологии</label>
                            <Input
                              value={portfolioForm.tech}
                              onChange={(e) => setPortfolioForm({ ...portfolioForm, tech: e.target.value })}
                              placeholder="React / Node.js / PostgreSQL"
                              className="bg-background/50 border-primary/30 focus:border-primary"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-white mb-2">Фото проекта</label>
                            <div className="flex gap-2">
                              <Input
                                value={portfolioForm.image_url}
                                onChange={(e) => setPortfolioForm({ ...portfolioForm, image_url: e.target.value })}
                                placeholder="https://example.com/image.jpg"
                                className="bg-background/50 border-primary/30 focus:border-primary"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                className="shrink-0 border-primary/30"
                                disabled={portfolioUploadingImage}
                                onClick={() => {
                                  const input = document.createElement('input')
                                  input.type = 'file'
                                  input.accept = 'image/*'
                                  input.onchange = (e) => {
                                    const file = (e.target as HTMLInputElement).files?.[0]
                                    if (file) handlePortfolioImageUpload(file)
                                  }
                                  input.click()
                                }}
                              >
                                {portfolioUploadingImage ? <Icon name="Loader2" size={16} className="animate-spin" /> : <Icon name="Upload" size={16} />}
                              </Button>
                            </div>
                            {portfolioForm.image_url && (
                              <img src={portfolioForm.image_url} alt="preview" className="mt-2 h-32 rounded-lg object-cover" />
                            )}
                          </div>

                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-white mb-2">Порядок сортировки</label>
                              <Input
                                type="number"
                                value={portfolioForm.sort_order}
                                onChange={(e) => setPortfolioForm({ ...portfolioForm, sort_order: e.target.value })}
                                placeholder="1"
                                className="bg-background/50 border-primary/30 focus:border-primary"
                              />
                            </div>
                            <div className="flex items-end gap-6 pb-2">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={portfolioForm.is_large}
                                  onChange={(e) => setPortfolioForm({ ...portfolioForm, is_large: e.target.checked })}
                                  className="w-4 h-4"
                                />
                                <span className="text-sm text-white">Крупная карточка</span>
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={portfolioForm.is_active}
                                  onChange={(e) => setPortfolioForm({ ...portfolioForm, is_active: e.target.checked })}
                                  className="w-4 h-4"
                                />
                                <span className="text-sm text-white">Показывать на сайте</span>
                              </label>
                            </div>
                          </div>

                          <div className="flex gap-3 pt-2">
                            <Button
                              onClick={handlePortfolioSave}
                              disabled={portfolioSaving}
                              className="bg-gradient-to-r from-primary to-[#FF8E53] hover:shadow-lg hover:shadow-primary/30"
                            >
                              {portfolioSaving ? (
                                <>
                                  <Icon name="Loader2" size={16} className="animate-spin mr-2" />
                                  Сохранение...
                                </>
                              ) : (
                                'Сохранить'
                              )}
                            </Button>
                            <Button
                              onClick={() => setPortfolioEditMode(false)}
                              variant="outline"
                              className="border-primary/30"
                            >
                              Отмена
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    {portfolioLoading ? (
                      <div className="flex justify-center py-12">
                        <Icon name="Loader2" size={32} className="text-primary animate-spin" />
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {portfolioProjects.map((project) => (
                          <div
                            key={project.id}
                            className="bg-background/30 border border-primary/20 rounded-xl overflow-hidden hover:border-primary/40 transition-all"
                          >
                            <div className="relative h-36 overflow-hidden">
                              {project.image_url ? (
                                <img src={project.image_url} alt={project.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                                  <Icon name="Image" size={28} className="text-primary/40" />
                                </div>
                              )}
                              <div className="absolute top-2 right-2 flex gap-1.5">
                                {project.is_large && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-primary/90 text-white">Крупная</span>
                                )}
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${project.is_active ? 'bg-green-500/90 text-white' : 'bg-red-500/90 text-white'}`}>
                                  {project.is_active ? 'Активен' : 'Скрыт'}
                                </span>
                              </div>
                            </div>
                            <div className="p-4">
                              <p className="text-xs text-primary mb-1">{project.category}</p>
                              <h4 className="font-heading text-sm font-bold text-white mb-1 line-clamp-2">{project.name}</h4>
                              <p className="text-xs text-muted-foreground mb-3 line-clamp-1">{project.tech}</p>
                              <div className="flex gap-2">
                                <Button onClick={() => handlePortfolioEdit(project)} size="sm" variant="outline" className="flex-1 border-primary/30">
                                  <Icon name="Pencil" size={14} className="mr-1.5" />
                                  Изменить
                                </Button>
                                <Button
                                  onClick={() => handlePortfolioDelete(project)}
                                  disabled={portfolioDeleting === project.id}
                                  size="sm"
                                  variant="outline"
                                  className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                                >
                                  {portfolioDeleting === project.id ? <Icon name="Loader2" size={14} className="animate-spin" /> : <Icon name="Trash2" size={14} />}
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}

                        {portfolioProjects.length === 0 && (
                          <div className="col-span-full text-center py-12 text-muted-foreground">
                            Пока нет ни одного проекта. Нажмите «Добавить проект».
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                <div className="space-y-8">
                  {selectedSection.fields.map((field) => (
                    <div key={field.key} className="border border-primary/20 rounded-xl p-6 bg-background/30 hover:border-primary/40 transition-all">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <label className="block text-base font-semibold text-white mb-1">
                            {field.label}
                          </label>
                          <p className="text-sm text-muted-foreground mb-3">
                            {(field as FieldDefinition).preview}
                          </p>
                        </div>
                        {field.type !== 'image' && (
                          <Button
                            onClick={() => handleSave(field.key)}
                            disabled={saving}
                            size="sm"
                            className="bg-gradient-to-r from-primary to-[#FF8E53] hover:shadow-lg hover:shadow-primary/30 ml-4"
                          >
                            {saving ? (
                              <>
                                <Icon name="Loader2" size={14} className="mr-1 animate-spin" />
                                Сохранение
                              </>
                            ) : (
                              <>
                                <Icon name="Save" size={14} className="mr-1" />
                                Сохранить
                              </>
                            )}
                          </Button>
                        )}
                      </div>

                      {field.type === 'image' ? (
                        <div className="space-y-4">
                          <div className="bg-card/30 border border-primary/10 rounded-lg p-4">
                            <div className="text-xs text-muted-foreground mb-3 flex items-center gap-2">
                              <Icon name="Eye" size={14} />
                              Текущее изображение:
                            </div>
                            <div className="relative w-full aspect-video bg-background/50 rounded-lg overflow-hidden border border-primary/20">
                              <img
                                src={formData[field.key] || (field as FieldDefinition).imageUrl || 'https://via.placeholder.com/400x300?text=No+Image'}
                                alt={field.label}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <Input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) handleImageUpload(field.key, file)
                              }}
                              className="bg-background/50 border-primary/30 focus:border-primary"
                              disabled={uploadingImage === field.key}
                            />
                            {uploadingImage === field.key && (
                              <div className="flex items-center gap-2 text-primary">
                                <Icon name="Loader2" size={18} className="animate-spin" />
                                <span className="text-sm">Загрузка...</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="bg-card/30 border border-primary/10 rounded-lg p-4 mb-3">
                            <div className="text-xs text-muted-foreground mb-2 flex items-center gap-2">
                              <Icon name="Eye" size={14} />
                              Текущее значение на сайте:
                            </div>
                            <div className="text-sm text-white/70 italic">
                              {formData[field.key] || (field as FieldDefinition).current || 'Не заполнено'}
                            </div>
                          </div>
                          
                          {field.type === 'textarea' ? (
                            <textarea
                              value={formData[field.key] || ''}
                              onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                              rows={4}
                              className="w-full bg-background/50 border border-primary/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors resize-none"
                              placeholder={(field as FieldDefinition).current || `Введите ${field.label.toLowerCase()}`}
                            />
                          ) : (
                            <Input
                              type="text"
                              value={formData[field.key] || ''}
                              onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                              className="bg-background/50 border-primary/30 focus:border-primary text-base"
                              placeholder={(field as FieldDefinition).current || `Введите ${field.label.toLowerCase()}`}
                            />
                          )}
                        </>
                      )}
                    </div>
                  ))}
                </div>
                )}

                {selectedSection.id !== 'portfolio' && (
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
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}