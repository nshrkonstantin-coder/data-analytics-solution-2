import { Button } from "@/components/ui/button"

export function CTASection() {
  return (
    <section className="py-32 text-center bg-gradient-to-br from-[#0A192F] to-[#0F1419] relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/4 w-[400px] h-[400px] bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-1/4 w-[400px] h-[400px] bg-secondary/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-8 font-heading">
          Нужен надежный digital-продукт?
        </h2>
        <p className="text-muted-foreground text-lg md:text-xl max-w-3xl mx-auto mb-12 font-body">
          Мы создадим для вас веб-приложение или корпоративный сайт с той же ответственностью 
          и качеством, с которым обслуживаем автомобили.
        </p>
        <Button 
          size="lg"
          className="bg-gradient-to-r from-primary to-[#FF8E53] hover:shadow-2xl hover:shadow-primary/30 hover:-translate-y-2 transition-all duration-300 font-heading text-lg px-12 py-7"
          onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
        >
          Обсудить проект
        </Button>
      </div>
    </section>
  )
}