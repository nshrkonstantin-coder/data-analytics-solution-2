import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Icon from '@/components/ui/icon'
import { authService } from '@/lib/auth'

export function ContractRequestPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    authService.verifySession().then(result => {
      if (!result.valid) navigate('/login')
      setLoading(false)
    })
  }, [navigate])

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
          <Link to="/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
            <Icon name="ArrowLeft" size={18} />
            <span>Личный кабинет</span>
          </Link>
          <span className="font-heading text-lg font-bold text-white">Договор на покупку товара</span>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-20 max-w-2xl">
        <div className="bg-card/50 backdrop-blur-xl border border-primary/20 rounded-2xl p-12 text-center">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Icon name="FileClock" size={40} className="text-primary" />
          </div>
          <h1 className="font-heading text-3xl font-bold text-white mb-4">
            Раздел в разработке
          </h1>
          <p className="text-muted-foreground text-base mb-4 leading-relaxed">
            Функционал оформления договора на покупку товара находится в разработке.
            Скоро здесь появится полная форма для заключения договора с ООО «ДДМАКСИ СТРОЙРЕМСЕРВИС».
          </p>
          <p className="text-muted-foreground text-sm mb-8">
            По вопросам оформления договора обращайтесь:{' '}
            <a href="mailto:ddmaxi-srs@yandex.ru" className="text-primary hover:underline">
              ddmaxi-srs@yandex.ru
            </a>{' '}
            или{' '}
            <a href="tel:+79855060814" className="text-primary hover:underline">
              +7-985-506-08-14
            </a>
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
            <Icon name="Clock" size={14} className="text-primary" />
            <span className="text-primary text-sm font-medium">Ожидается запуск</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ContractRequestPage
