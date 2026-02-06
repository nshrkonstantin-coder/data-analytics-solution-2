import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Icon from '@/components/ui/icon'
import { authService } from '@/lib/auth'

const ADMIN_API_URL = 'https://functions.poehali.dev/60c925e5-07c4-4e22-acbb-7c60c1d9524d'

interface User {
  id: number
  email: string
  full_name: string
  phone: string
  role: string
  balance: number
  created_at: string
}

export function AdminUsersPage() {
  const navigate = useNavigate()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    const verifyAdmin = async () => {
      const result = await authService.verifySession()
      if (!result.valid || result.user?.role !== 'admin') {
        navigate('/login')
      } else {
        await loadUsers()
      }
    }

    verifyAdmin()
  }, [navigate])

  const loadUsers = async () => {
    const token = localStorage.getItem('auth_token')
    try {
      const response = await fetch(`${ADMIN_API_URL}?action=users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      const data = await response.json()
      setUsers(data.users || [])
    } catch (error) {
      console.error('Ошибка загрузки пользователей:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEditUser = (user: User) => {
    setEditingUser({ ...user })
    setError('')
    setSuccess('')
  }

  const handleSaveUser = async () => {
    if (!editingUser) return
    
    setError('')
    setSuccess('')
    setSaving(true)
    
    const token = localStorage.getItem('auth_token')
    try {
      const response = await fetch(`${ADMIN_API_URL}?action=user`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(editingUser),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Ошибка обновления')
      }
      
      setSuccess('Данные пользователя обновлены')
      setEditingUser(null)
      await loadUsers()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка обновления')
    } finally {
      setSaving(false)
    }
  }

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.phone?.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
          <div className="bg-card/50 backdrop-blur-xl border border-primary/20 rounded-2xl p-8 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="font-heading text-3xl font-bold text-white mb-2">
                  Управление пользователями
                </h1>
                <p className="text-muted-foreground">
                  Всего пользователей: {users.length}
                </p>
              </div>
            </div>

            {success && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 mb-4 flex items-start gap-2">
                <Icon name="CheckCircle" size={20} className="text-green-500 mt-0.5 flex-shrink-0" />
                <p className="text-green-500 text-sm">{success}</p>
              </div>
            )}

            <div className="relative">
              <Icon name="Search" size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Поиск по email, имени или телефону..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-background/50 border-primary/30 focus:border-primary"
              />
            </div>
          </div>

          <div className="bg-card/50 backdrop-blur-xl border border-primary/20 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-primary/5 border-b border-primary/20">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-heading font-semibold text-white">ID</th>
                    <th className="px-6 py-4 text-left text-sm font-heading font-semibold text-white">Email</th>
                    <th className="px-6 py-4 text-left text-sm font-heading font-semibold text-white">ФИО</th>
                    <th className="px-6 py-4 text-left text-sm font-heading font-semibold text-white">Телефон</th>
                    <th className="px-6 py-4 text-left text-sm font-heading font-semibold text-white">Роль</th>
                    <th className="px-6 py-4 text-left text-sm font-heading font-semibold text-white">Баланс</th>
                    <th className="px-6 py-4 text-left text-sm font-heading font-semibold text-white">Дата регистрации</th>
                    <th className="px-6 py-4 text-left text-sm font-heading font-semibold text-white">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user, index) => (
                    <tr 
                      key={user.id}
                      className={`border-b border-primary/10 hover:bg-primary/5 transition-colors ${
                        index % 2 === 0 ? 'bg-background/20' : 'bg-background/10'
                      }`}
                    >
                      <td className="px-6 py-4 text-sm text-white font-mono">{user.id}</td>
                      <td className="px-6 py-4 text-sm text-white">{user.email}</td>
                      <td className="px-6 py-4 text-sm text-white">{user.full_name || '-'}</td>
                      <td className="px-6 py-4 text-sm text-white">{user.phone || '-'}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.role === 'admin' 
                            ? 'bg-primary/20 text-primary' 
                            : 'bg-muted/20 text-muted-foreground'
                        }`}>
                          {user.role === 'admin' ? 'Администратор' : 'Пользователь'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-white font-mono">
                        {user.balance?.toLocaleString('ru-RU') || '0'} ₽
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {new Date(user.created_at).toLocaleDateString('ru-RU')}
                      </td>
                      <td className="px-6 py-4">
                        <Button
                          onClick={() => handleEditUser(user)}
                          size="sm"
                          variant="outline"
                          className="border-primary/30 hover:bg-primary/10"
                        >
                          <Icon name="Edit" size={16} className="mr-1" />
                          Изменить
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredUsers.length === 0 && (
              <div className="py-12 text-center">
                <Icon name="Users" size={48} className="text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {searchTerm ? 'Пользователи не найдены' : 'Пользователей пока нет'}
                </p>
              </div>
            )}
          </div>

          {editingUser && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-card/95 backdrop-blur-xl border border-primary/20 rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-heading text-2xl font-bold text-white">
                    Редактирование пользователя
                  </h2>
                  <Button
                    onClick={() => setEditingUser(null)}
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-white"
                  >
                    <Icon name="X" size={20} />
                  </Button>
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4 flex items-start gap-2">
                    <Icon name="AlertCircle" size={20} className="text-red-500 mt-0.5 flex-shrink-0" />
                    <p className="text-red-500 text-sm">{error}</p>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Email *
                    </label>
                    <Input
                      type="email"
                      required
                      value={editingUser.email}
                      onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                      className="bg-background/50 border-primary/30 focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      ФИО
                    </label>
                    <Input
                      type="text"
                      value={editingUser.full_name || ''}
                      onChange={(e) => setEditingUser({ ...editingUser, full_name: e.target.value })}
                      className="bg-background/50 border-primary/30 focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Телефон
                    </label>
                    <Input
                      type="tel"
                      value={editingUser.phone || ''}
                      onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                      className="bg-background/50 border-primary/30 focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Роль
                    </label>
                    <select
                      value={editingUser.role}
                      onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-background/50 border border-primary/30 text-white focus:border-primary focus:outline-none"
                    >
                      <option value="user">Пользователь</option>
                      <option value="admin">Администратор</option>
                    </select>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      onClick={handleSaveUser}
                      disabled={saving}
                      className="flex-1 bg-gradient-to-r from-primary to-[#FF8E53] hover:shadow-lg hover:shadow-primary/30"
                    >
                      {saving ? (
                        <>
                          <Icon name="Loader2" size={18} className="animate-spin mr-2" />
                          Сохранение...
                        </>
                      ) : (
                        <>
                          <Icon name="Save" size={18} className="mr-2" />
                          Сохранить
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => setEditingUser(null)}
                      variant="outline"
                      className="border-primary/30"
                    >
                      Отмена
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}