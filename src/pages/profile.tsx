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

  const [profileData, setProfileData] = useState({ full_name: '', phone: '' })
  const [profileEditing, setProfileEditing] = useState(false)
  const [profileSaving, setProfileSaving] = useState(false)

  const [passwordMode, setPasswordMode] = useState(false)
  const [passwordData, setPasswordData] = useState({ old_password: '', new_password: '', confirm_password: '' })
  const [passwordSaving, setPasswordSaving] = useState(false)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    const verifyUser = async () => {
      const result = await authService.verifySession()
      if (!result.valid) {
        navigate('/login')
      } else {
        setUser(result.user || null)
        setProfileData({
          full_name: result.user?.full_name || '',
          phone: result.user?.phone || '',
        })
      }
      setLoading(false)
    }
    verifyUser()
  }, [navigate])

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setProfileSaving(true)
    try {
      await authService.updateProfile(profileData.full_name, profileData.phone)
      setUser(prev => prev ? { ...prev, ...profileData } : prev)
      setSuccess('Данные профиля обновлены')
      setProfileEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка обновления')
    } finally {
      setProfileSaving(false)
    }
  }

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

    setPasswordSaving(true)
    try {
      await authService.changePassword(passwordData.old_password, passwordData.new_password)
      setSuccess('Пароль успешно изменён')
      setPasswordData({ old_password: '', new_password: '', confirm_password: '' })
      setPasswordMode(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка смены пароля')
    } finally {
      setPasswordSaving(false)
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
          <Button onClick={() => navigate('/dashboard')} variant="outline" className="border-primary/30 hover:bg-primary/10">
            <Icon name="ArrowLeft" size={18} className="mr-2" />
            Назад
          </Button>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <div className="bg-card/50 backdrop-blur-xl border border-primary/20 rounded-2xl p-8 mb-6">
            <h1 className="font-heading text-3xl font-bold text-white mb-2">Личные данные</h1>
            <p className="text-muted-foreground">Управление профилем и настройками безопасности</p>
          </div>

          {success && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mb-6 flex items-start gap-2">
              <Icon name="CheckCircle" size={20} className="text-green-500 mt-0.5 flex-shrink-0" />
              <p className="text-green-500 text-sm">{success}</p>
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6 flex items-start gap-2">
              <Icon name="AlertCircle" size={20} className="text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-red-500 text-sm">{error}</p>
            </div>
          )}

          <div className="bg-card/50 backdrop-blur-xl border border-primary/20 rounded-2xl p-8 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-xl font-bold text-white">Информация о профиле</h2>
              {!profileEditing && (
                <Button
                  onClick={() => { setProfileEditing(true); setError(''); setSuccess('') }}
                  variant="outline"
                  size="sm"
                  className="border-primary/30 hover:bg-primary/10"
                >
                  <Icon name="Pencil" size={16} className="mr-2" />
                  Редактировать
                </Button>
              )}
            </div>

            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-6 flex items-start gap-3">
              <Icon name="Lock" size={18} className="text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-amber-400 text-sm font-medium mb-0.5">Email привязан навсегда</p>
                <p className="text-amber-400/70 text-xs leading-relaxed">
                  Email указывается один раз при регистрации и не может быть изменён — он используется для доступа ко всем вашим продуктам и сервисам. Даже служба поддержки не может его сменить.
                </p>
              </div>
            </div>

            {!profileEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Email</label>
                  <Input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="bg-background/30 border-primary/20 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">ФИО</label>
                  <Input
                    type="text"
                    value={user?.full_name || ''}
                    disabled
                    className="bg-background/30 border-primary/20 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Телефон</label>
                  <Input
                    type="tel"
                    value={user?.phone || ''}
                    disabled
                    className="bg-background/30 border-primary/20 text-white"
                  />
                </div>
              </div>
            ) : (
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Email</label>
                  <Input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="bg-background/30 border-primary/20 text-white"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Email изменить нельзя</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">ФИО</label>
                  <Input
                    type="text"
                    value={profileData.full_name}
                    onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                    placeholder="Иванов Иван Иванович"
                    className="bg-background/50 border-primary/30 focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Телефон</label>
                  <Input
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                    placeholder="+7 (999) 000-00-00"
                    className="bg-background/50 border-primary/30 focus:border-primary"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <Button type="submit" disabled={profileSaving} className="bg-gradient-to-r from-primary to-[#FF8E53] hover:shadow-lg hover:shadow-primary/30">
                    {profileSaving ? <><Icon name="Loader2" size={16} className="animate-spin mr-2" />Сохранение...</> : 'Сохранить'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => { setProfileEditing(false); setError('') }}
                    className="border-primary/30 hover:bg-primary/10"
                  >
                    Отмена
                  </Button>
                </div>
              </form>
            )}
          </div>

          {user?.role === 'admin' && (
            <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-2xl p-8 mb-6">
              <div className="flex items-center gap-2 mb-2">
                <Icon name="Shield" size={24} className="text-purple-400" />
                <h2 className="font-heading text-xl font-bold text-white">Доступ администратора</h2>
              </div>
              <p className="text-muted-foreground mb-4">У вас есть права администратора системы</p>
              <Button onClick={() => navigate('/admin')} className="bg-gradient-to-r from-purple-500 to-blue-500 hover:shadow-lg hover:shadow-purple-500/30">
                <Icon name="Settings" size={18} className="mr-2" />
                Панель администратора
              </Button>
            </div>
          )}

          <div className="bg-card/50 backdrop-blur-xl border border-primary/20 rounded-2xl p-8">
            <h2 className="font-heading text-xl font-bold text-white mb-6">Безопасность</h2>

            {!passwordMode ? (
              <Button
                onClick={() => { setPasswordMode(true); setError(''); setSuccess('') }}
                className="bg-gradient-to-r from-primary to-[#FF8E53] hover:shadow-lg hover:shadow-primary/30"
              >
                <Icon name="Lock" size={18} className="mr-2" />
                Изменить пароль
              </Button>
            ) : (
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Текущий пароль</label>
                  <Input
                    type="password"
                    required
                    value={passwordData.old_password}
                    onChange={(e) => setPasswordData({ ...passwordData, old_password: e.target.value })}
                    className="bg-background/50 border-primary/30 focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Новый пароль</label>
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
                  <label className="block text-sm font-medium text-white mb-2">Подтверждение нового пароля</label>
                  <Input
                    type="password"
                    required
                    value={passwordData.confirm_password}
                    onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                    className="bg-background/50 border-primary/30 focus:border-primary"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <Button type="submit" disabled={passwordSaving} className="bg-gradient-to-r from-primary to-[#FF8E53] hover:shadow-lg hover:shadow-primary/30">
                    {passwordSaving ? <><Icon name="Loader2" size={16} className="animate-spin mr-2" />Сохранение...</> : 'Изменить пароль'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => { setPasswordMode(false); setPasswordData({ old_password: '', new_password: '', confirm_password: '' }); setError('') }}
                    className="border-primary/30 hover:bg-primary/10"
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