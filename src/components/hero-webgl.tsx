import { Button } from "@/components/ui/button"

export const Hero3DWebGL = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#070B13] to-[#0F1419] relative overflow-hidden">
      {/* Animated grid background */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255, 107, 53, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 198, 255, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
          animation: 'gridMove 30s linear infinite'
        }}
      />
      
      {/* Gradient overlays */}
      <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-secondary/5 rounded-full blur-3xl" />
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 pt-40 pb-24 relative z-10">
        <div className="max-w-4xl">
          <h1 className="font-heading text-5xl md:text-7xl font-bold mb-6 leading-tight">
            <span className="bg-gradient-to-r from-white to-secondary bg-clip-text text-transparent">
              Цифровые решения
            </span>
            <br />
            <span className="text-primary">для вашего бизнеса</span>
          </h1>
          
          <p className="text-muted-foreground text-lg md:text-xl mb-10 max-w-2xl leading-relaxed font-body">
            Мы создаем производительные веб-приложения, сайты и мобильные приложения с той же точностью и надежностью, с которой обслуживаем автотранспорт.
          </p>
          
          <div className="flex flex-wrap gap-5">
            <Button 
              className="bg-gradient-to-r from-primary to-[#FF8E53] hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-1 transition-all duration-300 font-heading text-base px-8 py-6"
              size="lg"
              onClick={() => document.getElementById('process')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Смотреть наши работы
            </Button>
            <Button 
              variant="outline" 
              className="border-2 border-secondary hover:bg-secondary/10 hover:border-primary hover:text-primary transition-all duration-300 font-heading text-base px-8 py-6"
              size="lg"
              onClick={() => document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Рассчитать стоимость
            </Button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes gridMove {
          0% { transform: translate(0, 0); }
          100% { transform: translate(60px, 60px); }
        }
      `}</style>
    </div>
  )
}

export default Hero3DWebGL