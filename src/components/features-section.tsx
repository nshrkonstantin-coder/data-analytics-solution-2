import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const features = [
  {
    title: "Веб-приложения",
    description: "Современные веб-приложения для управления автосервисом: запись клиентов, контроль заказов, автоматизация процессов.",
    icon: "brain",
    badge: "Web",
  },
  {
    title: "Мобильные приложения",
    description: "Приложения для iOS и Android: мобильная запись, онлайн-оплата, пуш-уведомления для клиентов.",
    icon: "lock",
    badge: "Mobile",
  },
  {
    title: "CRM-системы",
    description: "Полноценная CRM для учёта клиентов, автомобилей, истории ремонтов и автоматических напоминаний.",
    icon: "globe",
    badge: "CRM",
  },
  {
    title: "Интеграции",
    description: "Подключение платёжных систем, SMS-уведомлений, интеграция с 1C и другими системами.",
    icon: "zap",
    badge: "API",
  },
  {
    title: "Техподдержка",
    description: "Полное сопровождение проекта: обновления, исправления, консультации и быстрый отклик.",
    icon: "link",
    badge: "24/7",
  },
  {
    title: "Облачные решения",
    description: "Размещение на надёжных серверах с автоматическими резервными копиями и защитой данных.",
    icon: "target",
    badge: "Cloud",
  },
]

export function FeaturesSection() {
  return (
    <section className="py-24 px-6 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-foreground mb-4 font-sans">Наши решения</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Комплексная разработка IT-решений для автосервисов и автобизнеса
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="glow-border hover:shadow-lg transition-all duration-300 slide-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-3xl">
                    {feature.icon === "brain" && "&#129504;"}
                    {feature.icon === "lock" && "&#128274;"}
                    {feature.icon === "globe" && "&#127760;"}
                    {feature.icon === "zap" && "&#9889;"}
                    {feature.icon === "link" && "&#128279;"}
                    {feature.icon === "target" && "&#127919;"}
                  </span>
                  <Badge variant="secondary" className="bg-accent text-accent-foreground">
                    {feature.badge}
                  </Badge>
                </div>
                <CardTitle className="text-xl font-bold text-card-foreground">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}