import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Icon from '@/components/ui/icon'
import { authService } from '@/lib/auth'

const KP_API_URL = 'https://functions.poehali.dev/04b3b8ab-190e-41a2-a2c3-3fe16cd282b3'

interface KpForm {
  company_full_name: string
  company_short_name: string
  legal_address: string
  actual_address: string
  inn: string
  kpp: string
  ogrn: string
  director_name: string
  director_position: string
  phone: string
  email: string
  bank_name: string
  bank_account: string
  corr_account: string
  bik: string
}

const EMPTY_FORM: KpForm = {
  company_full_name: '',
  company_short_name: '',
  legal_address: '',
  actual_address: '',
  inn: '',
  kpp: '',
  ogrn: '',
  director_name: '',
  director_position: 'Генеральный директор',
  phone: '',
  email: '',
  bank_name: '',
  bank_account: '',
  corr_account: '',
  bik: '',
}

export function KpRequestPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [form, setForm] = useState<KpForm>(EMPTY_FORM)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    const init = async () => {
      const result = await authService.verifySession()
      if (!result.valid) { navigate('/login'); return }
      await loadExisting()
      setLoading(false)
    }
    init()
  }, [navigate])

  const loadExisting = async () => {
    const token = localStorage.getItem('auth_token')
    try {
      const res = await fetch(`${KP_API_URL}?action=get`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (data.exists && data.kp) {
        const kp = data.kp
        setForm({
          company_full_name: kp.company_full_name || '',
          company_short_name: kp.company_short_name || '',
          legal_address: kp.legal_address || '',
          actual_address: kp.actual_address || '',
          inn: kp.inn || '',
          kpp: kp.kpp || '',
          ogrn: kp.ogrn || '',
          director_name: kp.director_name || '',
          director_position: kp.director_position || 'Генеральный директор',
          phone: kp.phone || '',
          email: kp.email || '',
          bank_name: kp.bank_name || '',
          bank_account: kp.bank_account || '',
          corr_account: kp.corr_account || '',
          bik: kp.bik || '',
        })
        if (kp.status === 'submitted') setSubmitted(true)
      }
    } catch (_e) { void _e }
  }

  const handleChange = (field: keyof KpForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
    setSubmitted(false)
  }

  const handleSubmit = async () => {
    if (!form.company_full_name || !form.inn || !form.director_name) {
      setError('Заполните обязательные поля: наименование, ИНН, руководитель')
      return
    }
    setError('')
    setSubmitting(true)
    const token = localStorage.getItem('auth_token')
    try {
      const res = await fetch(`${KP_API_URL}?action=submit`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (data.ok) {
        setSubmitted(true)
        setSuccess('Данные успешно отправлены! Теперь вы можете получить КП.')
      } else {
        setError('Ошибка отправки. Попробуйте ещё раз.')
      }
    } catch {
      setError('Ошибка соединения. Попробуйте ещё раз.')
    }
    setSubmitting(false)
  }

  const handleGetPdf = async () => {
    setPdfLoading(true)
    const token = localStorage.getItem('auth_token')
    try {
      const res = await fetch(`${KP_API_URL}?action=pdf`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) { setError('Не удалось получить PDF. Убедитесь, что данные отправлены.'); setPdfLoading(false); return }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank')
    } catch {
      setError('Ошибка загрузки PDF. Попробуйте позже.')
    }
    setPdfLoading(false)
  }

  const Field = ({ label, field, placeholder, required }: { label: string; field: keyof KpForm; placeholder?: string; required?: boolean }) => (
    <div>
      <Label className="text-muted-foreground text-xs mb-1 block">
        {label}{required && <span className="text-red-400 ml-1">*</span>}
      </Label>
      <Input
        value={form[field]}
        onChange={e => handleChange(field, e.target.value)}
        placeholder={placeholder || label}
        className="bg-background/50 border-primary/20 focus:border-primary text-white"
      />
    </div>
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
          <Link to="/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
            <Icon name="ArrowLeft" size={18} />
            <span>Личный кабинет</span>
          </Link>
          <span className="font-heading text-lg font-bold text-white">Запросить КП</span>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-10 max-w-3xl">
        <div className="bg-card/50 backdrop-blur-xl border border-primary/20 rounded-2xl p-8 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Icon name="FileText" size={22} className="text-primary" />
            </div>
            <h1 className="font-heading text-2xl font-bold text-white">Коммерческое предложение</h1>
          </div>
          <p className="text-muted-foreground text-sm">
            Заполните реквизиты вашей компании — они автоматически войдут в КП от ООО «ДДМАКСИ СТРОЙРЕМСЕРВИС».
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-4 flex items-center gap-2">
            <Icon name="AlertCircle" size={18} className="text-red-400 flex-shrink-0" />
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}
        {success && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 mb-4 flex items-center gap-2">
            <Icon name="CheckCircle" size={18} className="text-green-400 flex-shrink-0" />
            <p className="text-green-400 text-sm">{success}</p>
          </div>
        )}

        <div className="bg-card/50 backdrop-blur-xl border border-primary/20 rounded-2xl p-8 space-y-6">
          <div>
            <h2 className="font-heading text-base font-bold text-primary mb-4 flex items-center gap-2">
              <Icon name="Building2" size={16} /> Сведения о компании
            </h2>
            <div className="grid gap-4">
              <Field label="Полное наименование организации" field="company_full_name" placeholder='ООО «Название»' required />
              <Field label="Сокращённое наименование" field="company_short_name" placeholder='ООО «Название»' />
              <Field label="Юридический адрес" field="legal_address" placeholder="Регион, город, улица, дом, офис" required />
              <Field label="Фактический адрес" field="actual_address" placeholder="Если отличается от юридического" />
            </div>
          </div>

          <div className="border-t border-primary/10 pt-6">
            <h2 className="font-heading text-base font-bold text-primary mb-4 flex items-center gap-2">
              <Icon name="Hash" size={16} /> Регистрационные данные
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="ИНН" field="inn" placeholder="1234567890" required />
              <Field label="КПП" field="kpp" placeholder="123456789" />
              <Field label="ОГРН / ОГРНИП" field="ogrn" placeholder="1234567890123" />
            </div>
          </div>

          <div className="border-t border-primary/10 pt-6">
            <h2 className="font-heading text-base font-bold text-primary mb-4 flex items-center gap-2">
              <Icon name="User" size={16} /> Руководитель
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Должность" field="director_position" placeholder="Генеральный директор" />
              <Field label="ФИО руководителя" field="director_name" placeholder="Иванов Иван Иванович" required />
            </div>
          </div>

          <div className="border-t border-primary/10 pt-6">
            <h2 className="font-heading text-base font-bold text-primary mb-4 flex items-center gap-2">
              <Icon name="Phone" size={16} /> Контакты
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Телефон" field="phone" placeholder="+7 (XXX) XXX-XX-XX" />
              <Field label="E-mail" field="email" placeholder="mail@company.ru" />
            </div>
          </div>

          <div className="border-t border-primary/10 pt-6">
            <h2 className="font-heading text-base font-bold text-primary mb-4 flex items-center gap-2">
              <Icon name="Landmark" size={16} /> Банковские реквизиты
            </h2>
            <div className="grid gap-4">
              <Field label="Наименование банка" field="bank_name" placeholder="ПАО Сбербанк, г. Москва" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Расчётный счёт" field="bank_account" placeholder="40702810000000000000" />
                <Field label="Корреспондентский счёт" field="corr_account" placeholder="30101810000000000000" />
                <Field label="БИК банка" field="bik" placeholder="044525225" />
              </div>
            </div>
          </div>

          <div className="border-t border-primary/10 pt-6 flex flex-col sm:flex-row gap-4">
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 bg-primary hover:bg-primary/90 text-white font-bold py-3"
            >
              {submitting ? (
                <><Icon name="Loader2" size={18} className="mr-2 animate-spin" /> Отправка...</>
              ) : (
                <><Icon name="Send" size={18} className="mr-2" /> Отправить</>
              )}
            </Button>

            <Button
              onClick={handleGetPdf}
              disabled={!submitted || pdfLoading}
              variant="outline"
              className={`flex-1 font-bold py-3 ${submitted ? 'border-green-500/50 text-green-400 hover:bg-green-500/10' : 'border-primary/20 text-muted-foreground'}`}
            >
              {pdfLoading ? (
                <><Icon name="Loader2" size={18} className="mr-2 animate-spin" /> Загрузка PDF...</>
              ) : (
                <><Icon name="Download" size={18} className="mr-2" /> Получить КП</>
              )}
            </Button>
          </div>

          {submitted && (
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-start gap-3">
              <Icon name="Info" size={16} className="text-primary flex-shrink-0 mt-0.5" />
              <p className="text-muted-foreground text-sm">
                Данные отправлены. Нажмите <span className="text-green-400 font-medium">«Получить КП»</span> — откроется PDF с коммерческим предложением, который можно распечатать или сохранить.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default KpRequestPage