import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Icon from '@/components/ui/icon'
import { authService, User } from '@/lib/auth'

export function ProfilePage() {
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [passwordMode, setPasswordMode] = useState(false)
  const [passwordData, setPasswordData] = useState({
    old_password: '',
    new_password: '',
    confirm_password: '',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const verifyUser = async () => {
      const result = await authService.verifySession()
      if (!result.valid) {
        navigate('/login')
      } else {
        setUser(result.user || null)
      }
      setLoading(false)
    }

    verifyUser()
  }, [navigate])

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (passwordData.new_password !== passwordData.confirm_password) {
      setError('Новые пароли не совпадают')
      return
    }

    if (passwordData.new_password.length < 6) {
      setError('Новый пароль должен быть минимум 6 символов')
      return
    }

    setSaving(true)

    try {
      await authService.changePassword(passwordData.old_password, passwordData.new_password)
      setSuccess('Пароль успешно изменен')
      setPasswordData({ old_password: '', new_password: '', confirm_password: '' })
      setPasswordMode(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка смены пароля')
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
          <Link to="/dashboard" className="font-heading text-2xl font-extrabold text-white">
            MAXI<span className="text-primary">SOFT</span><span className="text-secondary">ZAB</span>
          </Link>
          <Button
            onClick={() => navigate('/dashboard')}
            variant="outline"
            className="border-primary/30 hover:bg-primary/10"
          >
            <Icon name="ArrowLeft" size={18} className="mr-2" />
            Назад
          </Button>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <div className="bg-card/50 backdrop-blur-xl border border-primary/20 rounded-2xl p-8 mb-6">
            <h1 className="font-heading text-3xl font-bold text-white mb-2">
              Личные данные
            </h1>
            <p className="text-muted-foreground">
              Управление профилем и настройками безопасности
            </p>
          </div>

          {success && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mb-6 flex items-start gap-2">
              <Icon name="CheckCircle" size={20} className="text-green-500 mt-0.5 flex-shrink-0" />
              <p className="text-green-500 text-sm">{success}</p>
            </div>
          )}

          <div className="bg-card/50 backdrop-blur-xl border border-primary/20 rounded-2xl p-8 mb-6">
            <h2 className="font-heading text-xl font-bold text-white mb-6">
              Информация о профиле
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Email
                </label>
                <Input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="bg-background/30 border-primary/20 text-white"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Для изменения email обратитесь в поддержку
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  ФИО
                </label>
                <Input
                  type="text"
                  value={user?.full_name || ''}
                  disabled
                  className="bg-background/30 border-primary/20 text-white"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Для изменения ФИО обратитесь в поддержку
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Телефон
                </label>
                <Input
                  type="tel"
                  value={user?.phone || ''}
                  disabled
                  className="bg-background/30 border-primary/20 text-white"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Для изменения телефона обратитесь в поддержку
                </p>
              </div>
            </div>
          </div>

          <div className="bg-card/50 backdrop-blur-xl border border-primary/20 rounded-2xl p-8">
            <h2 className="font-heading text-xl font-bold text-white mb-6">
              Безопасность
            </h2>

            {!passwordMode ? (
              <Button
                onClick={() => setPasswordMode(true)}
                className="bg-gradient-to-r from-primary to-[#FF8E53] hover:shadow-lg hover:shadow-primary/30"
              >
                <Icon name="Lock" size={18} className="mr-2" />
                Изменить пароль
              </Button>
            ) : (
              <form onSubmit={handleChangePassword} className="space-y-4">
                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex items-start gap-2">
                    <Icon name="AlertCircle" size={20} className="text-red-500 mt-0.5 flex-shrink-0" />
                    <p className="text-red-500 text-sm">{error}</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Текущий пароль
                  </label>
                  <Input
                    type="password"
                    required
                    value={passwordData.old_password}
                    onChange={(e) => setPasswordData({ ...passwordData, old_password: e.target.value })}
                    className="bg-background/50 border-primary/30 focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Новый пароль
                  </label>
                  <Input
                    type="password"
                    required
                    value={passwordData.new_password}
                    onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                    placeholder="Минимум 6 символов"
                    className="bg-background/50 border-primary/30 focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Подтвердите новый пароль
                  </label>
                  <Input
                    type="password"
                    required
                    value={passwordData.confirm_password}
                    onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                    placeholder="Повторите новый пароль"
                    className="bg-background/50 border-primary/30 focus:border-primary"
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    type="submit"
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
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setPasswordMode(false)
                      setPasswordData({ old_password: '', new_password: '', confirm_password: '' })
                      setError('')
                    }}
                    className="border-primary/30"
                  >
                    Отмена
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
