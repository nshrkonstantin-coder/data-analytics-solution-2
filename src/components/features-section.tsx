import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Icon from "@/components/ui/icon"

const features = [
  {
    title: "Веб-приложения",
    description: "CRM/ERP системы для бизнеса, личные кабинеты и порталы, панели управления и аналитики, сервисы автоматизации.",
    icon: "LaptopMinimal",
    features: [
      "CRM/ERP системы для бизнеса",
      "Личные кабинеты и порталы",
      "Панели управления и аналитики",
      "Сервисы автоматизации"
    ]
  },
  {
    title: "Корпоративные сайты",
    description: "Сайты-визитки и промо-сайты, интернет-магазины и каталоги, лендинги и презентации, корпоративные порталы.",
    icon: "Globe",
    features: [
      "Сайты-визитки и промо-сайты",
      "Интернет-магазины и каталоги",
      "Лендинги и презентации",
      "Корпоративные порталы"
    ]
  },
  {
    title: "Мобильные приложения",
    description: "Приложения для iOS и Android, кроссплатформенные решения, бизнес-приложения и утилиты.",
    icon: "Smartphone",
    features: [
      "Приложения для iOS и Android",
      "Кроссплатформенные решения",
      "Бизнес-приложения и утилиты",
      "Приложения для клиентов"
    ]
  },
]

export function FeaturesSection() {
  return (
    <section id="services" className="py-24 px-6 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <div className="text-primary font-heading font-semibold text-sm tracking-[0.2em] uppercase mb-4">
            Наши IT-услуги
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 font-heading">
            Что мы создаем в digital-сфере
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="bg-card/50 backdrop-blur-sm border-border hover:border-primary/30 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-primary/10 group"
            >
              <CardHeader>
                <div className="mb-6">
                  <div className="text-primary group-hover:text-secondary transition-colors duration-300">
                    <Icon name={feature.icon} size={48} />
                  </div>
                </div>
                <CardTitle className="text-2xl font-bold text-white font-heading">
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {feature.features.map((item, i) => (
                    <li key={i} className="text-muted-foreground font-body flex items-start">
                      <span className="text-primary mr-2">–</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
