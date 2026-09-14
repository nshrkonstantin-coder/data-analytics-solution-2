import { useEffect, useState, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Icon from '@/components/ui/icon'
import { authService } from '@/lib/auth'

const ADMIN_API_URL = 'https://functions.poehali.dev/60c925e5-07c4-4e22-acbb-7c60c1d9524d'
const UPLOAD_API_URL = 'https://functions.poehali.dev/33feb542-a147-4f71-a8f4-372709cc12e7'

interface PortfolioProject {
  id: number
  category: string
  name: string
  tech: string
  image_url: string
  is_large: boolean
  is_active: boolean
  sort_order: number
  created_at: string
}

export function AdminPortfolioPage() {
  const navigate = useNavigate()
  const [projects, setProjects] = useState<PortfolioProject[]>([])
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState(false)
  const [editingProject, setEditingProject] = useState<PortfolioProject | null>(null)
  const [formData, setFormData] = useState({
    category: '',
    name: '',
    tech: '',
    image_url: '',
    is_large: false,
    is_active: true,
    sort_order: '0',
  })
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<number | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const formTopRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const verifyAdmin = async () => {
      const result = await authService.verifySession()
      if (!result.valid || result.user?.role !== 'admin') {
        navigate('/login')
      } else {
        await loadProjects()
      }
    }

    verifyAdmin()
  }, [navigate])

  const loadProjects = async () => {
    const token = localStorage.getItem('auth_token')
    try {
      const response = await fetch(`${ADMIN_API_URL}?action=portfolio`, {
        headers: { 'Authorization': `Bearer ${token}` },
      })
      const data = await response.json()
      setProjects(data.projects || [])
    } catch (error) {
      console.error('Ошибка загрузки проектов:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = async (file: File) => {
    setUploadingImage(true)
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
          setFormData(prev => ({ ...prev, image_url: data.url }))
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Ошибка загрузки изображения')
        } finally {
          setUploadingImage(false)
        }
      }
      reader.readAsDataURL(file)
    } catch {
      setError('Ошибка чтения файла')
      setUploadingImage(false)
    }
  }

  const handleEdit = (project: PortfolioProject) => {
    setEditingProject(project)
    setFormData({
      category: project.category,
      name: project.name,
      tech: project.tech,
      image_url: project.image_url || '',
      is_large: project.is_large,
      is_active: project.is_active,
      sort_order: (project.sort_order ?? 0).toString(),
    })
    setEditMode(true)
    setError('')
    setSuccess('')
    setTimeout(() => formTopRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
  }

  const handleCreate = () => {
    setEditingProject(null)
    setFormData({
      category: '',
      name: '',
      tech: '',
      image_url: '',
      is_large: false,
      is_active: true,
      sort_order: (projects.length + 1).toString(),
    })
    setEditMode(true)
    setError('')
    setSuccess('')
  }

  const handleSave = async () => {
    if (!formData.name || !formData.category) {
      setError('Заполните обязательные поля: название проекта и категория')
      return
    }

    setSaving(true)
    setError('')
    const token = localStorage.getItem('auth_token')

    try {
      const body = {
        ...(editingProject ? { id: editingProject.id } : {}),
        ...formData,
        sort_order: parseInt(formData.sort_order) || 0,
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

      setSuccess(editingProject ? 'Проект обновлен' : 'Проект создан')
      setEditMode(false)
      await loadProjects()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка сохранения')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (project: PortfolioProject) => {
    if (!confirm(`Удалить проект "${project.name}"?`)) return

    setDeleting(project.id)
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
      await loadProjects()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка удаления')
    } finally {
      setDeleting(null)
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
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h1 className="font-heading text-3xl font-bold text-white mb-2">
                  Наши разработки
                </h1>
                <p className="text-muted-foreground">
                  Реализованные проекты на главной странице · Всего: {projects.length}
                </p>
              </div>
              <Button
                onClick={handleCreate}
                className="bg-gradient-to-r from-primary to-[#FF8E53] hover:shadow-lg hover:shadow-primary/30"
              >
                <Icon name="Plus" size={18} className="mr-2" />
                Добавить проект
              </Button>
            </div>
          </div>

          {editMode && (
            <div ref={formTopRef} className="bg-card/50 backdrop-blur-xl border border-primary/20 rounded-2xl p-8 mb-6">
              <h2 className="font-heading text-2xl font-bold text-white mb-6">
                {editingProject ? 'Редактирование проекта' : 'Новый проект'}
              </h2>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-6 flex items-start gap-2">
                  <Icon name="AlertCircle" size={20} className="text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-red-500 text-sm">{error}</p>
                </div>
              )}

              <div className="space-y-5">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Категория *</label>
                    <Input
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      placeholder="Веб-приложение"
                      className="bg-background/50 border-primary/30 focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Название проекта *</label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Система управления автопарком AutoFleet Pro"
                      className="bg-background/50 border-primary/30 focus:border-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">Технологии</label>
                  <Input
                    value={formData.tech}
                    onChange={(e) => setFormData({ ...formData, tech: e.target.value })}
                    placeholder="React / Node.js / PostgreSQL"
                    className="bg-background/50 border-primary/30 focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">Фото проекта</label>
                  <div className="flex gap-2">
                    <Input
                      value={formData.image_url}
                      onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                      placeholder="https://example.com/image.jpg"
                      className="bg-background/50 border-primary/30 focus:border-primary"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="shrink-0 border-primary/30"
                      disabled={uploadingImage}
                      onClick={() => {
                        const input = document.createElement('input')
                        input.type = 'file'
                        input.accept = 'image/*'
                        input.onchange = (e) => {
                          const file = (e.target as HTMLInputElement).files?.[0]
                          if (file) handleImageUpload(file)
                        }
                        input.click()
                      }}
                    >
                      {uploadingImage ? <Icon name="Loader2" size={16} className="animate-spin" /> : <Icon name="Upload" size={16} />}
                    </Button>
                  </div>
                  {formData.image_url && (
                    <img src={formData.image_url} alt="preview" className="mt-2 h-32 rounded-lg object-cover" />
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Порядок сортировки</label>
                    <Input
                      type="number"
                      value={formData.sort_order}
                      onChange={(e) => setFormData({ ...formData, sort_order: e.target.value })}
                      placeholder="1"
                      className="bg-background/50 border-primary/30 focus:border-primary"
                    />
                  </div>
                  <div className="flex items-end gap-6 pb-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.is_large}
                        onChange={(e) => setFormData({ ...formData, is_large: e.target.checked })}
                        className="w-4 h-4"
                      />
                      <span className="text-sm text-white">Крупная карточка (на 2 колонки)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.is_active}
                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                        className="w-4 h-4"
                      />
                      <span className="text-sm text-white">Показывать на сайте</span>
                    </label>
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

          {!editMode && error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-6 flex items-start gap-2">
              <Icon name="AlertCircle" size={20} className="text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-red-500 text-sm">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {projects.map((project) => (
              <div
                key={project.id}
                className="bg-card/50 backdrop-blur-xl border border-primary/20 rounded-xl overflow-hidden hover:border-primary/50 transition-all duration-200"
              >
                <div className="relative h-40 overflow-hidden">
                  {project.image_url ? (
                    <img
                      src={project.image_url}
                      alt={project.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                      <Icon name="Image" size={32} className="text-primary/40" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2 flex gap-1.5">
                    {project.is_large && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-primary/90 text-white">
                        Крупная
                      </span>
                    )}
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                      project.is_active ? 'bg-green-500/90 text-white' : 'bg-red-500/90 text-white'
                    }`}>
                      {project.is_active ? 'Активен' : 'Скрыт'}
                    </span>
                  </div>
                </div>

                <div className="p-4">
                  <p className="text-xs text-primary mb-1 line-clamp-1">{project.category}</p>
                  <h3 className="font-heading text-sm font-bold text-white leading-tight line-clamp-2 mb-1">
                    {project.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mb-3 line-clamp-1">{project.tech}</p>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleEdit(project)}
                      size="sm"
                      variant="outline"
                      className="flex-1 border-primary/30"
                    >
                      <Icon name="Pencil" size={14} className="mr-1.5" />
                      Изменить
                    </Button>
                    <Button
                      onClick={() => handleDelete(project)}
                      disabled={deleting === project.id}
                      size="sm"
                      variant="outline"
                      className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                    >
                      {deleting === project.id ? (
                        <Icon name="Loader2" size={14} className="animate-spin" />
                      ) : (
                        <Icon name="Trash2" size={14} />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            {projects.length === 0 && (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                Пока нет ни одного проекта. Нажмите «Добавить проект».
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
