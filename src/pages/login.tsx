import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Icon from '@/components/ui/icon'
import { authService } from '@/lib/auth'

const AUTH_API_URL = 'https://functions.poehali.dev/c2f5fe05-0d0b-4667-96f1-ea3664c6b0c4'

export function LoginPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({ email: '', password: '' })

  const [showForgot, setShowForgot] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotSuccess, setForgotSuccess] = useState(false)
  const [forgotError, setForgotError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await authService.login(formData.email, formData.password)
      if (response.user.role === 'admin') {
        navigate('/admin')
      } else {
        navigate('/dashboard')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка входа')
    } finally {
      setLoading(false)
    }
  }

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault()
    setForgotError('')
    setForgotLoading(true)

    try {
      const response = await fetch(`${AUTH_API_URL}?action=forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Ошибка')
      setForgotSuccess(true)
    } catch (err) {
      setForgotError(err instanceof Error ? err.message : 'Произошла ошибка')
    } finally {
      setForgotLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F1419] via-[#1a1f2e] to-[#0F1419] flex items-center justify-center px-4 py-12">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <Link to="/" className="inline-block mb-6">
            <h1 className="font-heading text-3xl font-extrabold text-white">
              MAXI<span className="text-primary">SOFT</span><span className="text-secondary">ZAB</span>
            </h1>
          </Link>
          <h2 className="font-heading text-2xl font-bold text-white mb-2">
            {showForgot ? 'Восстановление пароля' : 'Вход в личный кабинет'}
          </h2>
          <p className="text-muted-foreground">
            {showForgot
              ? 'Введите email — пришлём временный пароль'
              : 'Войдите для доступа к магазину и личным данным'}
          </p>
        </div>

        <div className="bg-card/50 backdrop-blur-xl border border-primary/20 rounded-2xl p-8 shadow-2xl">
          {!showForgot ? (
            <>
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex items-start gap-2">
                    <Icon name="AlertCircle" size={20} className="text-red-500 mt-0.5 flex-shrink-0" />
                    <p className="text-red-500 text-sm">{error}</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-white mb-2">Email</label>
                  <Input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="your@email.com"
                    className="bg-background/50 border-primary/30 focus:border-primary"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-white">Пароль</label>
                    <button
                      type="button"
                      onClick={() => { setShowForgot(true); setError('') }}
                      className="text-xs text-primary hover:text-primary/80 transition-colors"
                    >
                      Забыл пароль?
                    </button>
                  </div>
                  <Input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Введите пароль"
                    className="bg-background/50 border-primary/30 focus:border-primary"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-primary to-[#FF8E53] hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-1 transition-all duration-300 font-heading text-base h-12"
                >
                  {loading ? (
                    <>
                      <Icon name="Loader2" size={20} className="animate-spin mr-2" />
                      Вход...
                    </>
                  ) : 'Войти'}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Нет аккаунта?{' '}
                  <Link to="/register" className="text-primary hover:text-primary/80 font-medium transition-colors">
                    Зарегистрироваться
                  </Link>
                </p>
              </div>
            </>
          ) : (
            <>
              {!forgotSuccess ? (
                <form onSubmit={handleForgot} className="space-y-5">
                  {forgotError && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex items-start gap-2">
                      <Icon name="AlertCircle" size={20} className="text-red-500 mt-0.5 flex-shrink-0" />
                      <p className="text-red-500 text-sm">{forgotError}</p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Email</label>
                    <Input
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="bg-background/50 border-primary/30 focus:border-primary"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={forgotLoading}
                    className="w-full bg-gradient-to-r from-primary to-[#FF8E53] hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-1 transition-all duration-300 font-heading text-base h-12"
                  >
                    {forgotLoading ? (
                      <>
                        <Icon name="Loader2" size={20} className="animate-spin mr-2" />
                        Отправляем...
                      </>
                    ) : 'Получить временный пароль'}
                  </Button>
                </form>
              ) : (
                <div className="text-center py-4">
                  <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                    <Icon name="MailCheck" size={32} className="text-green-500" />
                  </div>
                  <h3 className="font-heading text-lg font-bold text-white mb-2">Письмо отправлено!</h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    Если этот email зарегистрирован, временный пароль придёт на почту в течение минуты.
                  </p>
                  <Button
                    onClick={() => { setShowForgot(false); setForgotSuccess(false); setForgotEmail('') }}
                    variant="outline"
                    className="border-primary/30 hover:bg-primary/10"
                  >
                    Вернуться к входу
                  </Button>
                </div>
              )}

              {!forgotSuccess && (
                <div className="mt-6 text-center">
                  <button
                    type="button"
                    onClick={() => { setShowForgot(false); setForgotError('') }}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
                  >
                    <Icon name="ArrowLeft" size={16} />
                    Вернуться к входу
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        <div className="mt-6 text-center">
          <Link
            to="/"
            className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
          >
            <Icon name="ArrowLeft" size={16} />
            Вернуться на главную
          </Link>
        </div>
      </div>
    </div>
  )
}
