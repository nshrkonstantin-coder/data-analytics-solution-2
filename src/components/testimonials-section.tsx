import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

const portfolioItems = [
  {
    category: "Веб-приложение",
    name: "Система управления автопарком AutoFleet Pro",
    tech: "React / Node.js / PostgreSQL",
    large: true
  },
  {
    category: "Мобильное приложение",
    name: "Приложение для автосервиса ServiceConnect",
    tech: "Flutter / Firebase"
  },
  {
    category: "Корпоративный сайт",
    name: "Портал для логистической компании",
    tech: "Vue.js / Laravel"
  }
]

export function TestimonialsSection() {
  return (
    <section id="portfolio" className="py-24 bg-[#070B13] relative">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute top-1/3 left-1/3 w-[400px] h-[400px] bg-primary/3 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <div className="text-primary font-heading font-semibold text-sm tracking-[0.2em] uppercase mb-4">
            Наши разработки
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 font-heading">
            Реализованные проекты
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {portfolioItems.map((item, index) => (
            <Card
              key={index}
              className={`${
                item.large ? 'md:col-span-2' : ''
              } h-[300px] bg-gradient-to-br from-card/80 to-card/40 border-border hover:border-primary/30 transition-all duration-300 overflow-hidden group relative`}
            >
              <CardContent className="p-0 h-full relative">
                {/* Gradient overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-background/95 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-8">
                  <div>
                    <div className="text-primary font-heading font-semibold text-sm uppercase tracking-wider mb-2">
                      {item.category}
                    </div>
                    <h3 className="text-white text-2xl font-bold font-heading mb-2">
                      {item.name}
                    </h3>
                    <div className="text-secondary text-sm font-body">
                      {item.tech}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Button 
            variant="outline" 
            className="border-2 border-secondary hover:bg-secondary/10 hover:border-primary hover:text-primary transition-all duration-300 font-heading px-8 py-6"
            onClick={() => {
              const portfolioSection = document.getElementById('portfolio');
              portfolioSection?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            Показать все проекты
          </Button>
        </div>
      </div>
    </section>
  )
}