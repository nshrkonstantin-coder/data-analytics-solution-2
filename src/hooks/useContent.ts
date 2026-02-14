import { useState, useEffect } from 'react'

const ADMIN_API_URL = 'https://functions.poehali.dev/60c925e5-07c4-4e22-acbb-7c60c1d9524d'

interface ContentItem {
  id: number
  section: string
  key: string
  content: string
  content_type: string
  updated_at: string
}

const defaultContent: Record<string, Record<string, string>> = {
  hero: {
    title: 'Цифровые решения',
    subtitle: 'для вашего бизнеса',
    description: 'Мы создаем производительные веб-приложения и корпоративные сайты с той же точностью и надежностью, с которой обслуживаем автотранспорт.',
    button1: 'Смотреть наши работы',
    button2: 'Рассчитать стоимость',
  },
  features: {
    title: 'Почему выбирают нас',
    subtitle: 'Наши ключевые особенности',
  },
  about: {
    title: 'О компании MaxiSoftZab',
    description: 'MaxiSoftZab — это команда профессионалов, объединяющая экспертизу в разработке программного обеспечения и обслуживании автотранспорта.',
  },
  contact: {
    phone: '+7 (999) 123-45-67',
    email: 'info@maxisoftzab.ru',
    address: 'г. Чита, ул. Примерная, д. 1',
  },
  footer: {
    company_name: 'MAXISOFTZAB',
    description: 'Разработка программного обеспечения и обслуживание автотранспорта в Забайкалье',
    copyright: '© 2025 MaxiSoftZab. Все права защищены.',
  },
  settings: {
    company_legal_name: '',
    company_inn: '',
    company_ogrn: '',
  },
  images: {
    logo: '',
    hero_bg: '',
    about_image: '',
    cta_image: '',
  },
}

export function useContent(section: string) {
  const [content, setContent] = useState<Record<string, string>>(defaultContent[section] || {})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadContent = async () => {
      try {
        const response = await fetch(`${ADMIN_API_URL}?action=content`)
        
        if (response.ok) {
          const data = await response.json()
          const sectionContent: Record<string, string> = { ...defaultContent[section] }
          
          data.content?.forEach((item: ContentItem) => {
            if (item.section === section) {
              sectionContent[item.key] = item.content
            }
          })
          
          setContent(sectionContent)
        } else {
          setContent(defaultContent[section] || {})
        }
      } catch (error) {
        console.error('Ошибка загрузки контента:', error)
        setContent(defaultContent[section] || {})
      } finally {
        setLoading(false)
      }
    }

    loadContent()
  }, [section])

  return { content, loading }
}